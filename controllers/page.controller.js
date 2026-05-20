import Path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);
const viewsPath = Path.join(__dirname, "..", "views");

export function getDashboard(req, res) {
  return res.sendFile(Path.join(viewsPath, "index.html"));
}
