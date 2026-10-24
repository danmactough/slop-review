#!/usr/bin/env node
//
// Bumps the version in lockstep across every manifest.
//

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const next_package_version = process.argv[2] || die(`package_version env var not set — run via npm script, not directly`);

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Files that carry the version, with the JSON path to the version field.
const TARGETS = [
	{ file: "plugin/.claude-plugin/plugin.json",     field: ["version"] },
	{ file: "plugin/.codex-plugin/plugin.json",      field: ["version"] },
	{ file: ".claude-plugin/marketplace.json",       field: ["plugins", 0, "version"] },
	{ file: ".agents/plugins/marketplace.json",      field: ["plugins", 0, "version"] },
];

function die(msg) {
	process.stderr.write(`bump-version: ${msg}\n`);
	process.exit(1);
}

function readJson(rel) {
	return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, rel), "utf8"));
}

function writeJson(rel, obj) {
	const abs = path.join(REPO_ROOT, rel);
	const orig = fs.readFileSync(abs, "utf8");
	const trailing = orig.endsWith("\n") ? "\n" : "";
	// Detect indent from the original to preserve formatting.
	const indentMatch = orig.match(/\n([ \t]+)"/);
	const indent = indentMatch ? indentMatch[1] : "  ";
	fs.writeFileSync(abs, JSON.stringify(obj, null, indent) + trailing);
}

function setAt(obj, fieldPath, value) {
	let cur = obj;
	for (let i = 0; i < fieldPath.length - 1; i++) cur = cur[fieldPath[i]];
	cur[fieldPath.at(-1)] = value;
}

// Apply manifest edits.
for (const t of TARGETS) {
	const obj = readJson(t.file);
	setAt(obj, t.field, next_package_version);
	writeJson(t.file, obj);
}

process.stdout.write(`\n✓ manifests updated to v${next_package_version}.\n`);
