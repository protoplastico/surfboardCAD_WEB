#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const svg = fs.readFileSync(process.argv[2] || "/home/protoplastico/tmp/pdfs/vector-trial/page-13.svg", "utf8");
const source = path.join(root, "blanks/us-blanks/6-5-A-p13.brd");
const output = process.argv[3] || path.join(root, "blanks/us-blanks/6-5-A-vector-trial.brd");
const length = 197.8, width = 60.01, thickness = 7.94;

const d = svg.match(/<path[^>]*stroke-width="1\.024"[^>]*d="([^"]+)"/)?.[1];
if (!d) throw new Error("Catalog geometry path not found");

function subpaths(data) {
  const tokens = [...data.replace(/&#10;/g, " ").matchAll(/[MLC]|-?\d+(?:\.\d+)?/g)].map(match => match[0]);
  const paths = []; let current = [], i = 0;
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === "M") {
      if (current.length) paths.push(current);
      current = [[+tokens[i++], +tokens[i++]]];
    } else if (command === "L") current.push([+tokens[i++], +tokens[i++]]);
    else if (command === "C") {
      const a = current.at(-1), p1 = [+tokens[i++], +tokens[i++]], p2 = [+tokens[i++], +tokens[i++]], b = [+tokens[i++], +tokens[i++]];
      for (let step = 1; step <= 8; step++) {
        const t = step / 8, u = 1 - t;
        current.push([u ** 3 * a[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * b[0], u ** 3 * a[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * b[1]]);
      }
    } else throw new Error(`Unsupported SVG command: ${command}`);
  }
  if (current.length) paths.push(current);
  return paths;
}

function spline(points) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)], next = points[Math.min(points.length - 1, index + 1)];
    const clamp = (value, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
    return [point[0], point[1], clamp(point[0] - (next[0] - previous[0]) / 6, previous[0], point[0]), clamp(point[1] - (next[1] - previous[1]) / 6, previous[1], point[1]), clamp(point[0] + (next[0] - previous[0]) / 6, point[0], next[0]), clamp(point[1] + (next[1] - previous[1]) / 6, point[1], next[1])];
  });
}

const parsed = subpaths(d);
const outlineMain = parsed.filter(points => points.length > 20 && Math.min(...points.map(p => p[0])) > 240)[0];
const bottomRaw = parsed.filter(points => points.length > 20 && Math.max(...points.map(p => p[0])) < 130)[0];
const deckRaw = parsed.filter(points => points.length > 20 && Math.max(...points.map(p => p[0])) < 130)[1];
if (!outlineMain || !bottomRaw || !deckRaw) throw new Error("Expected outline/deck/bottom paths were not found");

const center = 240.21875, yMin = 78.535156, yMax = 541.34375;
const outlineRaw = [[270.65625, yMin], ...outlineMain.slice().reverse(), [257.453125, yMax]];
const outlineScale = (width / 2) / Math.max(...outlineRaw.map(point => point[0] - center));
const outline = outlineRaw.map(([x, y]) => [(y - yMin) * length / (yMax - yMin), (x - center) * outlineScale]);

const mapProfile = points => points.slice().reverse().map(([z, y], _, all) => [(y - all[0][1]) * length / (all.at(-1)[1] - all[0][1]), z]);
const bottomPixels = mapProfile(bottomRaw), deckPixels = mapProfile(deckRaw);
const interpolate = (points, x) => {
  const right = Math.max(1, points.findIndex(point => point[0] >= x));
  const a = points[right - 1], b = points[right];
  return a[1] + (b[1] - a[1]) * (x - a[0]) / Math.max(1e-9, b[0] - a[0]);
};
let maxGap = 0;
for (let i = 0; i <= 400; i++) { const x = length * i / 400; maxGap = Math.max(maxGap, interpolate(deckPixels, x) - interpolate(bottomPixels, x)); }
const profileScale = thickness / maxGap, baseline = Math.min(...bottomPixels.map(point => point[1]));
const bottom = bottomPixels.map(([x, z]) => [x, (z - baseline) * profileScale]);
const deck = deckPixels.map(([x, z]) => [x, (z - baseline) * profileScale]);
const knots = points => spline(points).map(value => `(cp [${value.join(",")}] true false)`).join("\n");
const replace = (brd, tag, points) => brd.replace(new RegExp(`${tag} : \\(\\n[\\s\\S]*?\\n\\)\\n(?=p\\d+ :)`), `${tag} : (\n${knots(points)}\n)\n`);

let brd = fs.readFileSync(source, "utf8").replace("2010 catalog approximation", "2010 catalog vector trial");
brd = replace(replace(replace(brd, "p32", outline), "p33", bottom), "p34", deck);
fs.writeFileSync(output, brd);

if (outline.length !== 30 || bottom.length !== 25 || deck.length !== 32) throw new Error("Vector path count changed unexpectedly");
if (Math.abs(Math.max(...outline.map(point => point[1])) * 2 - width) > 1e-6) throw new Error("Width calibration failed");
if (Math.abs(maxGap * profileScale - thickness) > 1e-6) throw new Error("Thickness calibration failed");
console.log(`${path.relative(root, output)}: outline ${outline.length} CP, bottom ${bottom.length} CP, deck ${deck.length} CP; width ${width} cm, thickness ${thickness} cm`);
