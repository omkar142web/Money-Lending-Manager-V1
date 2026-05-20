import crypto from "crypto";
import { collections, getCollection } from "../config/mongodb.js";
import { ApiError } from "../utils/ApiError.js";
import { toObjectId } from "../utils/objectId.js";

const HASH_PREFIX = "scrypt";

function usersCollection() {
  return getCollection(collections.users);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}:${salt}:${hash}`;
}

function verifyPassword(password, user) {
  if (user.passwordHash?.startsWith(`${HASH_PREFIX}:`)) {
    const [, salt, savedHash] = user.passwordHash.split(":");
    const incomingHash = hashPassword(password, salt).split(":")[2];
    return crypto.timingSafeEqual(Buffer.from(savedHash, "hex"), Buffer.from(incomingHash, "hex"));
  }

  // Legacy ShareInfo compatibility: old users may still have plain passwords.
  return user.password === password;
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function findUserByEmail(email) {
  return usersCollection().findOne({ email: normalizeEmail(email) });
}

export async function findUserById(id) {
  return usersCollection().findOne({ _id: toObjectId(id) });
}

export async function createUser({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.", [
      { field: "email", message: "Email is already registered." },
    ]);
  }

  const now = new Date();
  const result = await usersCollection().insertOne({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    role: "staff",
    createdAt: now,
    updatedAt: now,
  });

  return findUserById(result.insertedId);
}

export async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "No account found with that email.", [
      { field: "email", message: "Please register first." },
    ]);
  }

  if (!verifyPassword(password, user)) {
    throw new ApiError(401, "Incorrect password.", [
      { field: "password", message: "Please try again." },
    ]);
  }

  if (!user.passwordHash) {
    await usersCollection().updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: hashPassword(password),
          updatedAt: new Date(),
        },
        $unset: {
          password: "",
        },
      },
    );
  }

  return findUserById(user._id);
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");

  await usersCollection().updateOne(
    { _id: toObjectId(userId) },
    {
      $set: {
        sessionTokenHash: hashSessionToken(token),
        sessionCreatedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  return token;
}

export function verifySessionToken(user, token) {
  if (!user?.sessionTokenHash || !token) return false;

  const incomingHash = hashSessionToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(user.sessionTokenHash, "hex"),
    Buffer.from(incomingHash, "hex"),
  );
}

export async function clearSession(userId) {
  if (!userId) return;

  await usersCollection().updateOne(
    { _id: toObjectId(userId) },
    {
      $unset: {
        sessionTokenHash: "",
        sessionCreatedAt: "",
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );
}
