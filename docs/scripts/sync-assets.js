const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const docsRoot = path.resolve(__dirname, "..");

const filesToCopy = [
  { source: path.join(repoRoot, "CHANGELOG.md"), target: path.join(docsRoot, "CHANGELOG.md") },
  { source: path.join(repoRoot, "docker-compose.yml"), target: path.join(docsRoot, "docker-compose.yml") },
];

for (const { source, target } of filesToCopy) {
  if (!fs.existsSync(source)) {
    console.warn(`Source file not found, skipping: ${source}`);
    continue;
  }
  fs.copyFileSync(source, target);
  console.log(`Synced ${source} -> ${target}`);
}
