#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pointer = path.join(process.env.USERPROFILE || process.env.HOME || "", ".infinite-canvas", "plugin-runtime.json");
let portableRoot;
try {
    portableRoot = fs.realpathSync(JSON.parse(fs.readFileSync(pointer, "utf8")).runtimeRoot);
} catch {
    process.stderr.write("Yingce portable runtime pointer is missing. Run 安装到Codex.cmd from the portable application.\n");
    process.exit(1);
}
const entry = path.join(portableRoot, "canvas-agent", "dist", "index.js");
const configDir = path.join(portableRoot, "canvas-agent-config");
const packageMarker = path.join(portableRoot, "启动衍图.cmd");
const portableManifest = path.join(portableRoot, "plugins", "yingce", ".codex-plugin", "plugin.json");
const currentManifest = path.join(pluginRoot, ".codex-plugin", "plugin.json");
let versionMatches = false;
try {
    versionMatches = JSON.parse(fs.readFileSync(portableManifest, "utf8")).version
        === JSON.parse(fs.readFileSync(currentManifest, "utf8")).version;
} catch { /* incomplete plugin copy */ }
if (!versionMatches || ![entry, configDir, packageMarker].every((candidate) => fs.existsSync(candidate))) {
    process.stderr.write("Yingce portable runtime is incomplete. Reinstall this plugin from the portable application directory.\n");
    process.exit(1);
}
if (process.env.YINGCE_RUNTIME_ROOT && fs.realpathSync(process.env.YINGCE_RUNTIME_ROOT) !== portableRoot) {
    process.stderr.write("Yingce MCP runtime does not match the installed portable application.\n");
    process.exit(1);
}

// This plugin always uses the runtime bundled beside it in the portable app.
process.env.FRAMEFIELD_LOCAL_RUNTIME_CONFIG_DIR = configDir;
process.env.YINGCE_RUNTIME_ROOT = portableRoot;
process.argv.splice(1, 1, entry);
await import(pathToFileURL(entry).href);
