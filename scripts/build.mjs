// Gera dist/ juntando src/ e public/. Sem dependências: só Node 18+.
import { cp, rm, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = `${pkg.version}-${Date.now().toString(36)}`;

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, "public"), dist, { recursive: true });
await cp(path.join(root, "src"), dist, { recursive: true });

// versão nova do cache a cada build, para o celular pegar a atualização
const swPath = path.join(dist, "sw.js");
await writeFile(swPath, (await readFile(swPath, "utf8")).replace("__VERSION__", version));

console.log(`dist/ pronto (versão ${version})`);
