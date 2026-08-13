#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const tailPath = path.join(root, "tail-classification", "tail-index-labeled.json");
const nosePath = path.join(root, "nose-classification", "nose-index.json");
const outDir = path.join(root, "bottom-comparison");
const outHtml = path.join(outDir, "index.html");
const outJson = path.join(outDir, "candidates.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function scoreCandidate(type, row) {
  const text = `${row.folder} ${row.name} ${row.label || ""}`.toLowerCase();
  const length = Number(row.metrics?.length) || 0;
  const width = Number(row.metrics?.width) || 0;
  let score = 0;
  const reasons = [];
  const add = (value, reason) => {
    score += value;
    reasons.push(reason);
  };

  if (type === "hull") {
    if (/hull|planinghull|simmons/.test(text)) add(8, "name/folder contains hull keywords");
    if (length >= 260) add(2, "long planing-hull style length");
    if (width >= 56) add(1, "wide board supports hull entry");
  }

  if (type === "single-concave") {
    if (/squash|square|thrill|driver|rookie|zeus|habano|wire/.test(text)) add(3, "performance tail/name keyword");
    if (length >= 165 && length <= 220) add(2, "shortboard to funboard length range");
    if (width >= 47 && width <= 56) add(2, "moderate center width");
    if (/fish|swallow|bat/.test(text)) add(-2, "fish/swallow family often needs something more complex than plain single");
  }

  if (type === "double-concave") {
    if (/fish|swallow|squash|quad|5.?fin|flyingfish|disco|dumpster|driver/.test(text)) add(4, "tail/name suggests modern performance bottom");
    if (length >= 170 && length <= 210) add(2, "shortboard length range");
    if (width >= 48 && width <= 58) add(2, "supports double-concave planform");
    if (/gun|pin|round pin/.test(text)) add(-2, "gun/pin family leans away from double concave");
  }

  if (type === "vee") {
    if (/pin|round pin|gun|egg|mid|single/.test(text)) add(4, "pin/gun/egg family often uses vee release");
    if (length >= 195) add(2, "midlength or longer board");
    if (width <= 56) add(1, "narrower board supports tail vee");
    if (/fish|bat|swallow/.test(text)) add(-2, "fish/swallow family less likely to be plain vee");
  }

  if (type === "spiral-vee") {
    if (/pin|round pin|wing pin|gun|single/.test(text)) add(4, "pin/gun family suits spiral vee transition");
    if (length >= 180 && length <= 245) add(2, "midlength transition zone");
    if (width <= 56) add(1, "narrower tail family");
    if (/fish|swallow|bat/.test(text)) add(-2, "fish/swallow family less likely to be spiral vee");
  }

  if (type === "channel") {
    if (/fish|swallow|bat|wing bat|wing swallow|axion|flyingfish/.test(text)) add(4, "tail/name suits channel candidates");
    if (length >= 165 && length <= 205) add(2, "shortboard channel length range");
    if (width >= 48 && width <= 58) add(2, "channel-friendly width");
    if (/gun|noserider|classic|therapy/.test(text)) add(-3, "longboard/gun family unlikely for channels");
  }

  if (row.label) add(0.5, `tail label: ${row.label}`);
  return { score, reasons };
}

function dedupeByFile(rows) {
  const seen = new Set();
  return rows.filter(row => {
    if (!row.file || seen.has(row.file)) return false;
    seen.add(row.file);
    return true;
  });
}

function buildCandidates() {
  const tail = readJson(tailPath);
  const nose = readJson(nosePath);
  const noseMap = new Map((nose.rows || []).map(row => [row.file, row]));
  const rows = dedupeByFile(tail.rows || []);
  const groups = ["hull", "single-concave", "double-concave", "vee", "spiral-vee", "channel"];
  const result = {};

  for (const type of groups) {
    result[type] = rows
      .map(row => {
        const { score, reasons } = scoreCandidate(type, row);
        return {
          id: row.id,
          file: row.file,
          rel: row.rel,
          folder: row.folder,
          name: row.name,
          tailLabel: row.label || "",
          noseWidthAt0: noseMap.get(row.file)?.metrics?.noseWidthAt0 ?? null,
          length: row.metrics?.length ?? null,
          width: row.metrics?.width ?? null,
          score,
          reasons
        };
      })
      .filter(row => row.score > 0)
      .sort((a, b) => b.score - a.score || (a.length ?? 0) - (b.length ?? 0))
      .slice(0, 30);
  }
  return {
    generatedAt: new Date().toISOString(),
    method: "heuristic",
    note: "These are candidate boards for bottom-shape comparison, inferred from filename, folder, tail label, length, and width. They are not ground-truth bottom classifications.",
    groups: result
  };
}

function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function fmt(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "";
}

function renderHtml(data) {
  const sections = Object.entries(data.groups).map(([type, rows]) => {
    const rowHtml = rows.map(row => `
      <tr>
        <td>${esc(row.id)}</td>
        <td>${esc(type)}</td>
        <td>${esc(row.tailLabel)}</td>
        <td>${esc(row.folder)}</td>
        <td>${esc(row.name)}</td>
        <td>${fmt(row.length)}</td>
        <td>${fmt(row.width)}</td>
        <td>${fmt(row.noseWidthAt0)}</td>
        <td>${fmt(row.score)}</td>
        <td>${esc(row.reasons.join(" / "))}</td>
      </tr>`).join("");
    return `
      <section class="group">
        <h2>${esc(type)} <span>${rows.length} candidates</span></h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Target</th>
              <th>Tail</th>
              <th>Folder</th>
              <th>Name</th>
              <th>L</th>
              <th>W</th>
              <th>Nose w0</th>
              <th>Score</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>BoardCAD Bottom Comparison Candidates</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 24px;
    background: #1d1f22;
    color: #e6e8eb;
    font: 13px/1.45 -apple-system, BlinkMacSystemFont, sans-serif;
  }
  h1, h2 { margin: 0 0 12px; }
  h2 span { color: #8e8e93; font-size: 12px; font-weight: 500; margin-left: 8px; }
  p, li { color: #c9c9ce; }
  code, .pill {
    background: #2a2d31;
    border: 1px solid #3a3d42;
    border-radius: 6px;
    padding: 2px 6px;
  }
  .meta { margin: 0 0 18px; color: #8e8e93; }
  .group { margin: 28px 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td {
    border: 1px solid #404349;
    padding: 6px 8px;
    vertical-align: top;
    text-align: left;
    word-break: break-word;
  }
  th { background: #2a2d31; }
  tbody tr:nth-child(odd) { background: #202327; }
  tbody tr:nth-child(even) { background: #1b1d20; }
</style>
<h1>Bottom Comparison Candidates</h1>
<p class="meta">Generated: ${esc(data.generatedAt)} / method: ${esc(data.method)}</p>
<p>${esc(data.note)}</p>
<ul>
  <li><span class="pill">L</span> board length</li>
  <li><span class="pill">W</span> max width</li>
  <li><span class="pill">Nose w0</span> nose-side width at the first measurable sample</li>
  <li><span class="pill">Score</span> heuristic priority for manual review</li>
</ul>
${sections}
</html>`;
}

function main() {
  const data = buildCandidates();
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(data, null, 2));
  fs.writeFileSync(outHtml, renderHtml(data));
  console.log(`Wrote ${path.relative(process.cwd(), outJson)}`);
  console.log(`Wrote ${path.relative(process.cwd(), outHtml)}`);
}

main();
