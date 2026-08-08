import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(fullPath) : [fullPath];
    }),
  );
  return files.flat();
};

const srcDirectory = fileURLToPath(new URL("../src", import.meta.url));
const testFiles = (await walk(srcDirectory)).filter((file) => file.endsWith(".test.js"));

if (testFiles.length === 0) {
  console.error("No backend tests found.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
