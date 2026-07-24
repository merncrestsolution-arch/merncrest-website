#!/usr/bin/env node
/*
 * Stitch MCP shim.
 *
 * Cursor's MCP client cannot resolve JSON-Schema `$ref`/`$defs` in tool input
 * schemas. Several Stitch tools reference `#/$defs/ScreenInstance`, which makes
 * Cursor drop the ENTIRE tool list ("No tools, prompts, or resources").
 *
 * This shim spawns the real `@_davideast/stitch-mcp proxy` as a child, passes
 * every JSON-RPC message through untouched EXCEPT `tools/list` results, whose
 * tool input schemas get dereferenced (inlined) so no `$ref`/`$defs` remain.
 *
 * Transport: newline-delimited JSON-RPC over stdio (MCP stdio transport).
 */

const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

function resolveBinJs() {
  if (process.env.STITCH_MCP_BIN && fs.existsSync(process.env.STITCH_MCP_BIN)) {
    return process.env.STITCH_MCP_BIN;
  }
  const candidates = [
    path.join(
      process.env.APPDATA || "",
      "npm",
      "node_modules",
      "@_davideast",
      "stitch-mcp",
      "bin",
      "stitch-mcp.js"
    ),
    path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".npm-global",
      "lib",
      "node_modules",
      "@_davideast",
      "stitch-mcp",
      "bin",
      "stitch-mcp.js"
    ),
    "/usr/local/lib/node_modules/@_davideast/stitch-mcp/bin/stitch-mcp.js",
    "/usr/lib/node_modules/@_davideast/stitch-mcp/bin/stitch-mcp.js",
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

// Inline `$ref` targets from a local `$defs`/`definitions` map and strip the
// definition blocks. Cycles collapse to a permissive object schema.
function deref(node, defs, stack) {
  if (Array.isArray(node)) return node.map((n) => deref(n, defs, stack));
  if (node && typeof node === "object") {
    if (typeof node.$ref === "string") {
      const m = node.$ref.match(/^#\/(?:\$defs|definitions)\/([^/]+)$/);
      if (m) {
        const name = m[1];
        if (stack.has(name)) return { type: "object" };
        const target = defs[name];
        if (target) {
          const next = new Set(stack);
          next.add(name);
          return deref(target, defs, next);
        }
      }
      return { type: "object" };
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "$defs" || k === "definitions") continue;
      out[k] = deref(v, defs, stack);
    }
    return out;
  }
  return node;
}

function sanitizeSchema(schema) {
  if (!schema || typeof schema !== "object") return schema;
  const defs = { ...(schema.$defs || {}), ...(schema.definitions || {}) };
  return deref(schema, defs, new Set());
}

function sanitizeToolsListResult(msg) {
  const tools = msg?.result?.tools;
  if (!Array.isArray(tools)) return msg;
  for (const tool of tools) {
    if (tool && tool.inputSchema) {
      tool.inputSchema = sanitizeSchema(tool.inputSchema);
    }
    if (tool && tool.outputSchema) {
      tool.outputSchema = sanitizeSchema(tool.outputSchema);
    }
  }
  return msg;
}

function transformLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return line;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return line; // not JSON, pass through untouched
  }
  if (msg && msg.result && Array.isArray(msg.result.tools)) {
    try {
      msg = sanitizeToolsListResult(msg);
      return JSON.stringify(msg);
    } catch {
      return line;
    }
  }
  return line;
}

const binJs = resolveBinJs();
if (!binJs) {
  process.stderr.write(
    "[stitch-mcp-shim] Could not locate @_davideast/stitch-mcp. " +
      "Install it (npm i -g @_davideast/stitch-mcp) or set STITCH_MCP_BIN.\n"
  );
  process.exit(1);
}

const child = spawn(process.execPath, [binJs, "proxy"], {
  env: process.env,
  stdio: ["pipe", "pipe", "inherit"],
});

child.on("error", (err) => {
  process.stderr.write(`[stitch-mcp-shim] child error: ${err.message}\n`);
  process.exit(1);
});
child.on("exit", (code) => process.exit(code == null ? 0 : code));

// Cursor -> child (forward untouched)
process.stdin.pipe(child.stdin);

// child -> Cursor (rewrite tools/list results, line-delimited)
let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  let idx;
  while ((idx = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 1);
    process.stdout.write(transformLine(line) + "\n");
  }
});
child.stdout.on("end", () => {
  if (buffer.length) process.stdout.write(transformLine(buffer));
});
