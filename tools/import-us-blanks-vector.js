#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const svgDirectory = process.argv[2] || "/home/protoplastico/tmp/pdfs/vector-all";
const catalogFile = path.join(root, "blanks/us-blanks/catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));

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

function intersections(paths, y) {
  const values = [];
  for (const points of paths) for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (y < Math.min(a[1], b[1]) || y > Math.max(a[1], b[1]) || Math.abs(a[1] - b[1]) < 1e-9) continue;
    values.push(a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]));
  }
  return values;
}

function geometry(svg, product) {
  const paths = [...svg.matchAll(/<path[^>]*stroke-width="1\.024"[^>]*d="([^"]+)"/g)].flatMap(match => subpaths(match[1]));
  const profilePaths = paths.filter(points => points.reduce((sum, point) => sum + point[0], 0) / points.length < 170);
  const outlinePaths = paths.filter(points => points.reduce((sum, point) => sum + point[0], 0) / points.length >= 170);
  if (!profilePaths.length || !outlinePaths.length) throw new Error(`${product.name}: vector geometry missing on page ${product.page}`);

  const outlinePoints = outlinePaths.flat();
  const center = (Math.min(...outlinePoints.map(point => point[0])) + Math.max(...outlinePoints.map(point => point[0]))) / 2;
  const outlineByY = new Map();
  for (const point of outlinePoints.filter(point => point[0] >= center)) {
    const key = point[1].toFixed(3), previous = outlineByY.get(key);
    if (!previous || point[0] > previous[0]) outlineByY.set(key, point);
  }
  const outlineRaw = [...outlineByY.values()].sort((a, b) => a[1] - b[1]);
  const outlineY0 = outlineRaw[0][1], outlineY1 = outlineRaw.at(-1)[1];
  const outlineScale = (product.width / 2) / Math.max(...outlineRaw.map(point => point[0] - center));
  const outline = outlineRaw.map(([x, y]) => [(y - outlineY0) * product.length / (outlineY1 - outlineY0), (x - center) * outlineScale]);

  const profilePoints = profilePaths.flat();
  const profileY0 = Math.min(...profilePoints.map(point => point[1])), profileY1 = Math.max(...profilePoints.map(point => point[1]));
  const bottomPixels = [], deckPixels = [];
  for (let i = 0; i <= 32; i++) {
    const y = profileY0 + (profileY1 - profileY0) * i / 32;
    let values = intersections(profilePaths, y);
    if (!values.length && (i === 0 || i === 32)) values = profilePoints.filter(point => Math.abs(point[1] - y) < 0.001).map(point => point[0]);
    if (!values.length) throw new Error(`${product.name}: incomplete profile at ${i}/32`);
    bottomPixels.push([product.length * i / 32, Math.min(...values)]);
    deckPixels.push([product.length * i / 32, Math.max(...values)]);
  }
  const maxGap = Math.max(...deckPixels.map((point, index) => point[1] - bottomPixels[index][1]));
  const profileScale = product.thickness / maxGap;
  const baseline = Math.min(...bottomPixels.map(point => point[1]));
  const bottom = bottomPixels.map(([x, z]) => [x, (z - baseline) * profileScale]);
  const deck = deckPixels.map(([x, z]) => [x, (z - baseline) * profileScale]);
  return { outline, bottom, deck };
}

const knots = points => spline(points).map(value => `(cp [${value.join(",")}] true false)`).join("\n");
const replace = (brd, tag, points) => brd.replace(new RegExp(`${tag} : \\(\\n[\\s\\S]*?\\n\\)\\n(?=p\\d+ :)`), `${tag} : (\n${knots(points)}\n)\n`);

for (const product of catalog) {
  const svgFile = path.join(svgDirectory, `page-${product.page}.svg`);
  const curves = geometry(fs.readFileSync(svgFile, "utf8"), product);
  if (curves.outline.length < 2 || curves.bottom.length < 3 || curves.deck.length < 3 || Object.values(curves).flat(2).some(value => !Number.isFinite(value))) {
    throw new Error(`${product.name}: invalid extracted curves`);
  }
  const brdFile = path.join(root, product.filename);
  let brd = fs.readFileSync(brdFile, "utf8").replace("2010 catalog approximation", "2010 catalog vector extraction");
  brd = replace(replace(replace(brd, "p32", curves.outline), "p33", curves.bottom), "p34", curves.deck);
  fs.writeFileSync(brdFile, brd);
  product.outlineControlPointCount = curves.outline.length;
  product.profileControlPointCount = curves.bottom.length;
  product.vectorExtracted = true;
  delete product.outlineMaxErrorCm;
  delete product.outlineVolumeChangeRatio;
  delete product.imageChecked;
  delete product.imageRejectedControlPointCount;
  delete product.imageRejectedStations;
  delete product.imageMaxDeviationCm;
  delete product.imageOutlierThresholdCm;
}

fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + "\n");
if (catalog.length !== 66 || catalog.some(product => !product.vectorExtracted)) throw new Error("Vector catalog self-check failed");
console.log(`Imported ${catalog.length} vector blanks from ${svgDirectory}`);
