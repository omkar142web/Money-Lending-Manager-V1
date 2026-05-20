import Path from "path";
import { fileURLToPath } from "url";
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);
const viewsPath = Path.join(__dirname, "..", "views");

export function notFoundHandler(req, res, next) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API route not found.",
    });
  }

  return res.status(404).sendFile(Path.join(viewsPath, "404.html"));
}

export function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;

  if (statusCode >= 500) {
    console.error("Request failed:", err);
  }

  if (req.path.startsWith("/api/") || req.accepts("json") === "json") {
    return res.status(statusCode).json({
      success: false,
      message,
      field: Array.isArray(err.details) ? err.details[0]?.field : undefined,
      details: err.details,
    });
  }

  return res.status(statusCode).sendFile(Path.join(viewsPath, "500.html"));
}
