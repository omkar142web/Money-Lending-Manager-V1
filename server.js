import express from "express";
import cookieParser from "cookie-parser";
import Path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { connectDB } from "./config/mongodb.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import pageRoutes from "./routes/page.routes.js";
import repairRoutes from "./routes/repair.routes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

app.use(express.static(Path.join(__dirname, "public")));

app.set("views", Path.join(__dirname, "views"));
app.set("view engine", "ejs");

await connectDB();

app.use("/", authRoutes);
app.use("/api", repairRoutes);
app.use("/", pageRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Balaji Store server is running at http://localhost:${env.port}`);
});
