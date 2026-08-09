import { readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["index.js", "src"];
const files = [];

const collect = (target) => {
  if (extname(target) === ".js") {
    files.push(target);
    return;
  }
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const nextPath = join(target, entry.name);
    if (entry.isDirectory()) collect(nextPath);
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(nextPath);
  }
};

for (const root of roots) collect(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax check passed (${files.length} JavaScript files).`);
