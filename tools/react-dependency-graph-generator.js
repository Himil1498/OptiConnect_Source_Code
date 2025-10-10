#!/usr/bin/env node
/*
React Project Dependency Graph Generator
---------------------------------------
Generates a component dependency graph (parent -> child) for a React frontend
and can optionally connect frontend API calls to backend route files.

Usage (from project root or tools folder):

1) Install dependencies (in a small tools folder or project root):
   npm init -y
   npm install @babel/parser @babel/traverse

2) Save this file as `react-dependency-graph-generator.js` and run:
   node react-dependency-graph-generator.js --src ./frontend/src --out ./graph-output --format mermaid

Optional (connect front -> backend API routes):
   node react-dependency-graph-generator.js --src ./frontend/src --backend ./backend --out ./graph-output --format mermaid

Outputs (in out folder):
 - graph.mmd      (Mermaid format)
 - graph.dot      (Graphviz DOT format)
 - graph.json     (raw nodes + edges)

Notes / Caveats:
 - This script uses static analysis (AST) to detect imports + JSX usage.
 - It focuses on relative imports ("./Header", "../components/Panel") and
   maps them to actual files (.js/.jsx/.ts/.tsx). External packages (e.g. 'react')
   are kept as external nodes.
 - It attempts to detect which imported binding is actually *rendered* by
   matching JSX element names to import local names (reduces false-positives).
 - Dynamic imports, unusual module resolvers, and runtime component registration
   may not be fully detected.

Feel free to adjust extensions or add heuristics for your codebase.
*/

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// --------------------- CLI arg parsing ---------------------
const argv = process.argv.slice(2);
function getArg(name, fallback = undefined) {
  const idx = argv.indexOf(name);
  if (idx === -1) return fallback;
  const val = argv[idx + 1];
  if (!val || val.startsWith("--")) return true; // boolean flag
  return val;
}
const src = getArg("--src", "./src");
const backend = getArg("--backend", null); // optional
const out = getArg("--out", "./graph-output");
const format = (getArg("--format", "mermaid") || "mermaid").toLowerCase();

const exts = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];

// --------------------- utilities ---------------------
function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git") continue;
      walk(full, fileList);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (exts.includes(ext)) fileList.push(full);
    }
  }
  return fileList;
}

function resolveImport(fromFile, importPath, srcRoot) {
  // only resolve relative paths; leave package imports as external
  if (
    !importPath ||
    (!importPath.startsWith(".") && !importPath.startsWith("/"))
  )
    return null;
  const base = path.dirname(fromFile);
  const candidate = path.resolve(base, importPath);
  // try candidate + ext
  for (const ex of exts) {
    const p = candidate + ex;
    if (fs.existsSync(p)) return path.normalize(p);
  }
  // try candidate (if has ext already)
  if (fs.existsSync(candidate)) return path.normalize(candidate);
  // try index files inside folder
  for (const ex of exts) {
    const p = path.join(candidate, "index" + ex);
    if (fs.existsSync(p)) return path.normalize(p);
  }
  // failed to resolve
  return null;
}

function getJSXName(node) {
  // node can be JSXIdentifier, JSXMemberExpression
  if (!node) return null;
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression") {
    // for expressions like Some.Component, take the left-most identifier name 'Some'
    let cur = node;
    while (cur && cur.type === "JSXMemberExpression") cur = cur.object;
    if (cur && cur.type === "JSXIdentifier") return cur.name;
  }
  return null;
}

function sanitizeLabel(s) {
  // keep it human readable but escaping double quotes
  if (typeof s !== "string") s = String(s);
  return s.replace(/"/g, '\\"');
}

// --------------------- main analysis ---------------------
const srcRoot = path.resolve(src);
const backendRoot = backend ? path.resolve(backend) : null;

console.log("Scanning frontend:", srcRoot);
if (backendRoot) console.log("Scanning backend:", backendRoot);

const frontFiles = walk(srcRoot);
const backFiles = backendRoot ? walk(backendRoot) : [];

const nodes = new Set();
const edges = {}; // parent -> Set(child)

function addEdge(parent, child) {
  if (!parent || !child) return;
  if (!edges[parent]) edges[parent] = new Set();
  edges[parent].add(child);
  nodes.add(parent);
  nodes.add(child);
}

function analyzeFile(file, isBackend = false) {
  let code = "";
  try {
    code = fs.readFileSync(file, "utf8");
  } catch (e) {
    console.warn("Cannot read file", file, e.message);
    return;
  }
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "unambiguous",
      plugins: [
        "jsx",
        "typescript",
        "classProperties",
        "dynamicImport",
        "decorators-legacy"
      ]
    });
  } catch (e) {
    console.warn("Parse failed for", file, e.message);
    return;
  }

  const importMap = {}; // localName -> import source (string)
  const requireMap = {}; // localName -> import source (string)

  // gather backend routes (very heuristics-based)
  const foundRoutes = [];

  traverse(ast, {
    ImportDeclaration(pathNode) {
      const srcVal = pathNode.node.source.value;
      for (const spec of pathNode.node.specifiers) {
        if (spec.local && spec.local.name) {
          importMap[spec.local.name] = srcVal;
        }
      }
    },
    VariableDeclarator(pathNode) {
      const n = pathNode.node;
      if (
        n.init &&
        n.init.type === "CallExpression" &&
        n.init.callee &&
        n.init.callee.name === "require"
      ) {
        const arg = n.init.arguments && n.init.arguments[0];
        if (arg && arg.type === "StringLiteral") {
          if (n.id.type === "Identifier") {
            requireMap[n.id.name] = arg.value;
          }
          // patterns like const {a} = require('./x') are ignored for simplicity
        }
      }
    },
    CallExpression(pathNode) {
      const n = pathNode.node;
      // detect dynamic import('...')
      if (n.callee && n.callee.type === "Import") {
        const arg = n.arguments && n.arguments[0];
        if (arg && arg.type === "StringLiteral") {
          // we can't know the local name; we'll add an edge by import path later if needed
          // For now, record nothing special
        }
      }
      // detect backend routes heuristically: app.get('/api/x', ...) or router.post('/x', ...)
      if (isBackend && n.callee && n.callee.type === "MemberExpression") {
        const prop = n.callee.property;
        const obj = n.callee.object;
        if (
          prop &&
          prop.type === "Identifier" &&
          n.arguments &&
          n.arguments.length
        ) {
          const method = prop.name;
          const arg0 = n.arguments[0];
          if (
            arg0 &&
            arg0.type === "StringLiteral" &&
            arg0.value.startsWith("/")
          ) {
            // heuristic: treat this as a route declaration
            foundRoutes.push({ method, path: arg0.value });
          }
        }
      }
    }
  });

  // For front files: detect JSX usage of imported names + API calls (fetch/axios)
  if (!isBackend) {
    const usedImportSources = new Set();
    const usedImportLocalNames = new Set();

    traverse(ast, {
      JSXOpeningElement(pathNode) {
        const name = getJSXName(pathNode.node.name);
        if (!name) return;
        if (importMap[name]) {
          usedImportLocalNames.add(name);
          usedImportSources.add(importMap[name]);
        }
        if (requireMap[name]) {
          usedImportLocalNames.add(name);
          usedImportSources.add(requireMap[name]);
        }
      },
      CallExpression(pathNode) {
        const n = pathNode.node;
        // detect fetch('/api/...')
        if (
          n.callee &&
          n.callee.type === "Identifier" &&
          n.callee.name === "fetch"
        ) {
          const arg = n.arguments && n.arguments[0];
          if (arg && arg.type === "StringLiteral") {
            usedImportSources.add(arg.value); // used to connect to backend route if available
          }
        }
        // detect axios.get('/api/...') or axios.post('/api/...')
        if (n.callee && n.callee.type === "MemberExpression") {
          const obj = n.callee.object;
          const prop = n.callee.property;
          if (
            obj &&
            obj.type === "Identifier" &&
            obj.name === "axios" &&
            prop &&
            prop.type === "Identifier"
          ) {
            const arg = n.arguments && n.arguments[0];
            if (arg && arg.type === "StringLiteral")
              usedImportSources.add(arg.value);
          }
        }
      }
    });

    const parentLabel = path.relative(srcRoot, file).replace(/\\/g, "/");
    // for each used import source, try to resolve to a file (relative) or keep external
    for (const srcVal of usedImportSources) {
      if (!srcVal) continue;
      const resolved = resolveImport(file, srcVal, srcRoot);
      if (resolved) {
        const childLabel = path.relative(srcRoot, resolved).replace(/\\/g, "/");
        addEdge(parentLabel, childLabel);
      } else {
        // external or an API path like '/api/users'
        if (typeof srcVal === "string" && srcVal.startsWith("/")) {
          // API call — add edge to the endpoint string itself (later we'll try to map to a backend file)
          addEdge(parentLabel, srcVal);
        } else {
          // treat as external dependency (e.g. 'react') — add external node
          addEdge(parentLabel, srcVal);
        }
      }
    }

    // also add edges for static imports that are used but might not be JSX (e.g., HOCs)
    // map local names used in code to imports by checking Identifier usage (basic heuristic)
    // (omitted for brevity)
  } else {
    // backend file: record routes
    const fileLabel = path.relative(backendRoot, file).replace(/\\/g, "/");
    for (const r of foundRoutes) {
      // create a node for route (prefixed with "ROUTE:") and link route -> file
      const routeNode = `ROUTE:${r.path}`;
      addEdge(routeNode, fileLabel);
    }
  }
}

// Analyze frontend files
for (const f of frontFiles) analyzeFile(f, false);
// Analyze backend files (if present)
if (backendRoot) for (const f of backFiles) analyzeFile(f, true);

// If backend present: try to connect frontend API edges (strings like '/api/...') to backend route files
if (backendRoot) {
  // collect which backend files handled which route nodes
  const routeToFiles = {}; // routePath -> [file]
  for (const n of nodes) {
    if (typeof n === "string" && n.startsWith("ROUTE:")) {
      const routePath = n.slice("ROUTE:".length);
      // find edges from this route node to files
      const outs = edges[n];
      if (outs) {
        routeToFiles[routePath] = Array.from(outs);
      }
    }
  }
  // now scan edges: if frontend -> '/api/..' then add frontend -> backend-file edges
  for (const parent of Object.keys(edges)) {
    const outSet = edges[parent];
    for (const child of outSet) {
      if (typeof child === "string" && child.startsWith("/")) {
        // attempt to find matching route (exact match or prefix)
        // exact match
        let matched = null;
        if (routeToFiles[child]) matched = routeToFiles[child][0];
        else {
          // try prefix match (e.g. child '/api/users/123' match '/api/users')
          const candidates = Object.keys(routeToFiles).sort(
            (a, b) => b.length - a.length
          );
          for (const cand of candidates) {
            if (child.startsWith(cand)) {
              matched = routeToFiles[cand][0];
              break;
            }
          }
        }
        if (matched) addEdge(parent, matched);
      }
    }
  }
}

// --------------------- emit outputs ---------------------
if (!fs.existsSync(out)) fs.mkdirSync(out, { recursive: true });

// Prepare edge lists
const edgeList = [];
for (const p of Object.keys(edges)) {
  for (const c of edges[p]) edgeList.push({ from: p, to: c });
}

const graphJson = { nodes: Array.from(nodes), edges: edgeList };
fs.writeFileSync(
  path.join(out, "graph.json"),
  JSON.stringify(graphJson, null, 2),
  "utf8"
);

function makeMermaid() {
  let s = "graph TD\n";
  for (const e of edgeList) {
    s += `"${sanitizeLabel(e.from)}" --> "${sanitizeLabel(e.to)}"\n`;
  }
  return s;
}

function makeDot() {
  let s = "digraph G {\n  rankdir=LR;\n";
  for (const e of edgeList) {
    s += `  "${sanitizeLabel(e.from)}" -> "${sanitizeLabel(e.to)}";\n`;
  }
  s += "}\n";
  return s;
}

if (format === "mermaid" || format === "all") {
  fs.writeFileSync(path.join(out, "graph.mmd"), makeMermaid(), "utf8");
}
if (format === "dot" || format === "all") {
  fs.writeFileSync(path.join(out, "graph.dot"), makeDot(), "utf8");
}

console.log("Wrote:", path.resolve(out));
console.log(
  "Files: graph.json",
  format === "mermaid" || format === "all" ? ", graph.mmd" : "",
  format === "dot" || format === "all" ? ", graph.dot" : ""
);
console.log(
  "Done. Visualize the .mmd with VSCode Mermaid Preview or use @mermaid-js/mermaid-cli (mmdc) to render to SVG."
);

// EOF
