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
  const hash = hashSessionToken(token);
  const now = new Date();

  await usersCollection().updateOne(
    { _id: toObjectId(userId) },
    {
      $push: {
        sessions: {
          $each: [{ hash, createdAt: now }],
          $slice: -10, // Limit to 10 active devices/sessions
        },
      },
      $set: {
        // Keep these for legacy/backward compatibility during transition
        sessionTokenHash: hash,
        sessionCreatedAt: now,
        updatedAt: now,
      },
    },
  );

  return token;
}

export function verifySessionToken(user, token) {
  if (!token) return false;
  const incomingHash = hashSessionToken(token);

  // 1. Check the new sessions array
  if (Array.isArray(user.sessions)) {
    const sessionExists = user.sessions.some((s) =>
      crypto.timingSafeEqual(Buffer.from(s.hash, "hex"), Buffer.from(incomingHash, "hex")),
    );
    if (sessionExists) return true;
  }

  // 2. Fallback to legacy single-session field
  if (user.sessionTokenHash) {
    return crypto.timingSafeEqual(
      Buffer.from(user.sessionTokenHash, "hex"),
      Buffer.from(incomingHash, "hex"),
    );
  }

  return false;
}

export async function clearSession(userId, token = null) {
  if (!userId) return;

  const update = {
    $set: { updatedAt: new Date() },
  };

  if (token) {
    const hash = hashSessionToken(token);
    // Remove specific session from array
    update.$pull = { sessions: { hash: hash } };
    
    // If the legacy field matches this token, clear it too
    await usersCollection().updateOne(
      { _id: toObjectId(userId), sessionTokenHash: hash },
      { $unset: { sessionTokenHash: "", sessionCreatedAt: "" } }
    );
  } else {
    // Global logout: clear everything
    update.$unset = {
      sessions: "",
      sessionTokenHash: "",
      sessionCreatedAt: "",
    };
  }

  await usersCollection().updateOne({ _id: toObjectId(userId) }, update);
}
