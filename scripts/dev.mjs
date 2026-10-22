// Servidor local sem dependências: serve src/ e public/ juntos em http://localhost:5173
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs = [path.join(root, "src"), path.join(root, "public")];
const port = Number(process.env.PORT) || 5173;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

async function find(urlPath) {
  const rel = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "") || "index.html";
  for (const d of dirs) {
    const file = path.join(d, rel);
    if (!file.startsWith(d)) continue;
    try { if ((await stat(file)).isFile()) return file; } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const file = await find(req.url);
  if (!file) { res.writeHead(404); return res.end("Não encontrado"); }
  let body = await readFile(file);
  if (file.endsWith("sw.js")) body = body.toString().replace("__VERSION__", "dev-" + Date.now());
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  res.end(body);
}).listen(port, () => console.log(`Margem rodando em http://localhost:${port}`));
