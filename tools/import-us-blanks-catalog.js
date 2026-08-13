#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const source = process.argv[2];
const output = process.argv[3] || path.join(__dirname, "..", "blanks", "us-blanks");
const layoutSource = process.argv[4];
const imageDirectory = process.argv[5];
if (!source || !layoutSource) throw new Error("Usage: node tools/import-us-blanks-catalog.js us-blanks-bbox.html [output-dir] us-blanks-layout.txt [rendered-pgm-dir]");

const decode = value => value.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const pages = fs.readFileSync(source, "utf8").match(/<page\b[\s\S]*?<\/page>/g) || [];
const layoutPages = fs.readFileSync(layoutSource, "utf8").replace(/\r/g, "").split("\f").slice(5, 72);

function words(page) {
  return [...page.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)"[^>]*>([\s\S]*?)<\/word>/g)]
    .map(match => ({ x: +match[1], y: +match[2], text: decode(match[3].replace(/<[^>]+>/g, "")) }));
}

function shaperComment(items) {
  const heading = items.find(item => /^Shaper/.test(item.text));
  if (!heading) return "";
  const commentWords = items.filter(item => item.x >= heading.x - 3 && item.y >= heading.y - 1 && item.y < 735 && item.text !== "Shaper's" && item.text !== "Comments:");
  const lines = [];
  for (const item of commentWords.sort((a, b) => a.y - b.y || a.x - b.x)) {
    let line = lines.find(candidate => Math.abs(candidate.y - item.y) < 2);
    if (!line) lines.push(line = { y: item.y, words: [] });
    line.words.push(item);
  }
  return lines.map(line => line.words.sort((a, b) => a.x - b.x).map(item => item.text).join(" ")).join(" ").replace(/-\s+/g, "").replace(/\s+/g, " ").trim();
}

function metric(text, label) {
  const match = text.match(new RegExp(`${label}:[\\s\\S]{0,90}?\\(([0-9.]+)\\s*(?:cm|L)\\)`));
  return match ? +match[1] : 0;
}

function measurementColumns(items) {
  const pairs = items.filter(item => item.text === "cm" && item.x < 380).map(cm => {
    const number = items.filter(item => /^\d+(?:\.\d+)?$/.test(item.text) && item.x < cm.x && cm.x - item.x < 34 && Math.abs(item.y - cm.y) < 1.7).sort((a, b) => b.x - a.x)[0];
    return number && { x: cm.x, y: cm.y, value: +number.text };
  }).filter(Boolean).sort((a, b) => a.x - b.x);
  const groups = [];
  for (const pair of pairs) {
    if (!groups.length || pair.x - groups.at(-1).at(-1).x > 24) groups.push([]);
    groups.at(-1).push(pair);
  }
  return groups.slice(0, 3).map(group => group.sort((a, b) => a.y - b.y));
}

function valuesAtRows(column, rows, maximum) {
  return rows.map(y => {
    const exact = column.find(item => Math.abs(item.y - y) < 3);
    if (exact && exact.value <= maximum * 1.08) return exact.value;
    const valid = column.filter(item => item.value <= maximum * 1.08);
    const before = valid.filter(item => item.y < y).at(-1);
    const after = valid.find(item => item.y > y);
    if (!before) return after?.value || maximum;
    if (!after) return before.value;
    return before.value + ((after.value - before.value) * (y - before.y) / (after.y - before.y));
  });
}

function stationDistances(count, length) {
  const half = Math.floor(count / 2);
  const tipDistances = Array.from({ length: half }, (_, index) => index <= 4 ? index * 15.24 : 60.96 + ((index - 4) * 30.48));
  return [...tipDistances, length / 2, ...tipDistances.slice().reverse().map(distance => length - distance)];
}

function imageOutlineWidths(page, length, maximumWidth) {
  if (!imageDirectory) return null;
  const filename = [`page-${String(page).padStart(3, "0")}.pgm`, `page-${String(page).padStart(2, "0")}.pgm`, `page-${page}.pgm`]
    .map(name => path.join(imageDirectory, name)).find(fs.existsSync);
  if (!filename) return null;
  const data = fs.readFileSync(filename);
  const header = data.toString("ascii", 0, Math.min(data.length, 200)).match(/^P5\s+(\d+)\s+(\d+)\s+255\s/);
  if (!header) return null;
  const width = +header[1], height = +header[2], pixels = data.subarray(header[0].length);
  const x0 = Math.floor(width * 0.22), x1 = Math.ceil(width * 0.55);
  const y0 = Math.floor(height * 0.14), y1 = Math.ceil(height * 0.94);
  const seen = new Uint8Array(width * height);
  let largest = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const start = y * width + x;
    if (seen[start] || pixels[start] > 90) continue;
    seen[start] = 1;
    const stack = [start], component = [];
    while (stack.length) {
      const index = stack.pop(), cy = Math.floor(index / width), cx = index - cy * width;
      component.push(index);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy, next = ny * width + nx;
        if (nx >= x0 && nx < x1 && ny >= y0 && ny < y1 && !seen[next] && pixels[next] <= 90) {
          seen[next] = 1;
          stack.push(next);
        }
      }
    }
    if (component.length > largest.length) largest = component;
  }
  if (largest.length < 500) return null;
  const rows = new Map();
  for (const index of largest) {
    const y = Math.floor(index / width), x = index - y * width;
    const row = rows.get(y) || { min: x, max: x };
    row.min = Math.min(row.min, x);
    row.max = Math.max(row.max, x);
    rows.set(y, row);
  }
  const ys = [...rows.keys()].sort((a, b) => a - b);
  const top = ys[0], bottom = ys.at(-1);
  const rawWidths = ys.map(y => rows.get(y).max - rows.get(y).min);
  const scale = maximumWidth / Math.max(...rawWidths);
  return x => {
    const targetY = top + ((length - x) / Math.max(1e-9, length)) * (bottom - top);
    let bestY = ys[0];
    for (const y of ys) if (Math.abs(y - targetY) < Math.abs(bestY - targetY)) bestY = y;
    const nearby = ys.filter(y => Math.abs(y - bestY) <= 4).map(y => rows.get(y).max - rows.get(y).min);
    return Math.max(0, ...nearby) * scale;
  };
}

const median = values => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

function rejectImageOutliers(stations, imageWidthAt, length) {
  if (!imageWidthAt) return { stations, rejected: [], maxDeviationCm: 0 };
  const residuals = stations.map(item => Math.abs(item.width - imageWidthAt(item.x)));
  const middle = residuals.filter((_, index) => index > 0 && index < residuals.length - 1);
  const center = median(middle);
  const mad = median(middle.map(value => Math.abs(value - center)));
  const threshold = Math.max(0.75, center + (3 * Math.max(mad, 0.1)));
  const widest = stations.reduce((best, item, index) => item.width > stations[best].width ? index : best, 0);
  const rejected = stations.filter((item, index) => index !== widest && item.x > 30.48 && item.x < length - 30.48 && residuals[index] > threshold);
  return {
    stations: stations.filter(item => !rejected.includes(item)),
    rejected,
    rejectedStations: rejected.map(item => ({ x: item.x, numericWidth: item.width, imageWidth: imageWidthAt(item.x) })),
    maxDeviationCm: Math.max(...residuals),
    thresholdCm: threshold
  };
}

function splineYAt(knots, x) {
  const index = Math.max(0, Math.min(knots.length - 2, knots.findIndex((knot, i) => i < knots.length - 1 && x <= knots[i + 1][0])));
  const a = knots[index], b = knots[index + 1];
  const cubic = (p0, p1, p2, p3, t) => ((1 - t) ** 3 * p0) + (3 * (1 - t) ** 2 * t * p1) + (3 * (1 - t) * t ** 2 * p2) + (t ** 3 * p3);
  let low = 0, high = 1;
  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2;
    if (cubic(a[0], a[4], b[2], b[0], mid) < x) low = mid; else high = mid;
  }
  return cubic(a[1], a[5], b[3], b[1], (low + high) / 2);
}

function simplifyOutlineStations(stations, maxErrorCm = 0.05, maxVolumeRatio = 0.001) {
  const reference = spline(stations.map(item => [item.x, item.width / 2]));
  const length = stations.at(-1).x;
  const centerIndex = stations.reduce((best, item, index) => item.width > stations[best].width ? index : best, 0);
  const volumeProxy = knots => {
    let sum = 0;
    for (let i = 0; i <= 400; i++) {
      const x = length * i / 400;
      const right = Math.max(1, stations.findIndex(item => item.x >= x));
      const left = right - 1;
      const u = (x - stations[left].x) / Math.max(1e-9, stations[right].x - stations[left].x);
      const thickness = stations[left].thickness + ((stations[right].thickness - stations[left].thickness) * u);
      sum += splineYAt(knots, x) * thickness * (i === 0 || i === 400 ? 0.5 : 1);
    }
    return sum;
  };
  const referenceVolume = volumeProxy(reference);
  let selected = stations.slice();
  let maxError = 0;
  let volumeRatio = 0;
  while (selected.length > 3) {
    let best = null;
    for (let index = 1; index < selected.length - 1; index++) {
      const point = selected[index];
      if (point === stations[centerIndex] || point.x <= 30.48 || point.x >= length - 30.48) continue;
      const candidate = selected.filter((_, candidateIndex) => candidateIndex !== index);
      const knots = spline(candidate.map(item => [item.x, item.width / 2]));
      let error = 0;
      for (let sample = 0; sample <= 400; sample++) {
        const x = length * sample / 400;
        error = Math.max(error, Math.abs(splineYAt(reference, x) - splineYAt(knots, x)));
      }
      const ratio = Math.abs(volumeProxy(knots) - referenceVolume) / Math.max(1e-9, referenceVolume);
      if (error <= maxErrorCm && ratio <= maxVolumeRatio && (!best || error < best.error)) best = { candidate, error, ratio };
    }
    if (!best) break;
    selected = best.candidate;
    maxError = Math.max(maxError, best.error);
    volumeRatio = best.ratio;
  }
  return { stations: selected, maxError, volumeRatio };
}

function spline(points) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)], next = points[Math.min(points.length - 1, index + 1)];
    const clamp = (value, a, b) => Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
    return [
      point[0], point[1],
      clamp(point[0] - (next[0] - previous[0]) / 6, previous[0], point[0]),
      clamp(point[1] - (next[1] - previous[1]) / 6, previous[1], point[1]),
      clamp(point[0] + (next[0] - previous[0]) / 6, point[0], next[0]),
      clamp(point[1] + (next[1] - previous[1]) / 6, point[1], next[1])
    ];
  });
}

const knots = values => values.map(value => `(cp [${value.join(",")}] true false)`).join("\n");
function section(width, thickness, fullness = 0.97) {
  const w = width / 2;
  return spline([[0, 0], [w * fullness, thickness * 0.025], [w, thickness * 0.45], [w * fullness, thickness * 0.95], [0, thickness]]);
}

function interpolate(values, count) {
  if (values.length === count) return values;
  return Array.from({ length: count }, (_, index) => {
    const at = index * (values.length - 1) / Math.max(1, count - 1), left = Math.floor(at), right = Math.min(values.length - 1, left + 1);
    return values[left] + (values[right] - values[left]) * (at - left);
  });
}

const products = pages.map((page, pageIndex) => {
  const items = words(page);
  const text = layoutPages[pageIndex] || items.map(item => item.text).join(" ");
  const normalizedText = text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  const title = normalizedText.match(/\d+'\d+"EPS[A-Z]-SUP/i)?.[0].toUpperCase()
    || normalizedText.match(/\d+'\d+(?:X2|X)?"EPS/i)?.[0].toUpperCase()
    || normalizedText.match(/\d+'\s*\d+(?:\s+\d+\/\d+)?"[A-Za-z0-9-]+/)?.[0].replace(/\s+/g, "")
    || items.filter(item => item.y < 125 && item.x > 360).sort((a, b) => a.y - b.y || a.x - b.x)[0]?.text;
  const length = metric(text, "Overall Bottom Length");
  const volume = metric(text, "Displacement");
  const comment = shaperComment(items);
  if (!title || !length) return null;
  const [rockerColumn = [], thicknessColumn = [], widthColumn = []] = measurementColumns(items);
  const maxWidth = metric(text, "Maximum Width"), maxThickness = metric(text, "Maximum Thickness");
  const referenceColumn = thicknessColumn.length >= widthColumn.length ? thicknessColumn : widthColumn;
  const rows = referenceColumn.map(item => item.y);
  if (rows.length % 2 === 0) rows.splice(rows.length / 2, 0, (rows[rows.length / 2 - 1] + rows[rows.length / 2]) / 2);
  const count = rows.length;
  if (count < 3) throw new Error(`${title}: only ${count} complete stations on PDF page ${pageIndex + 6}`);
  const xNoseToTail = stationDistances(count, length);
  const widths = valuesAtRows(widthColumn, rows, maxWidth);
  const thicknesses = valuesAtRows(thicknessColumn, rows, maxThickness);
  const rockers = valuesAtRows(rockerColumn, rows, Math.max(15, length * 0.075));
  rockers[Math.floor(count / 2)] = 0;
  const allStations = xNoseToTail.map((x, index) => ({ x: length - x, width: widths[index], thickness: thicknesses[index], rocker: rockers[index] })).sort((a, b) => a.x - b.x);
  const center = allStations[Math.floor(allStations.length / 2)];
  center.width = maxWidth || center.width;
  center.thickness = maxThickness || center.thickness;
  center.rocker = 0;
  const imageWidthAt = imageOutlineWidths(pageIndex + 6, length, maxWidth);
  const imageCheck = rejectImageOutliers(allStations, imageWidthAt, length);
  const simplifiedOutline = simplifyOutlineStations(imageCheck.stations);
  const outline = spline(simplifiedOutline.stations.map(item => [item.x, item.width / 2]));
  const bottom = spline(allStations.map(item => [item.x, item.rocker]));
  const deck = spline(allStations.map(item => [item.x, item.rocker + item.thickness]));
  const sections = allStations.map(item => `(p36 ${item.x}\n${knots(section(item.width, item.thickness))}\n)`).join("\n");
  const filename = `${title.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}-p${pageIndex + 6}.brd`;
  const volumeNote = volume ? `target ${volume} L` : "catalog volume unavailable";
  const brd = `p01 : ${length}\np03 : ${maxThickness}\np04 : ${maxWidth}\np07 : V4.4\np08 : US Blanks ${title} (2010 catalog approximation; ${volumeNote})\np97 : ${comment}\np32 : (\n${knots(outline)}\n)\np33 : (\n${knots(bottom)}\n)\np34 : (\n${knots(deck)}\n)\np35 : (\n${sections}\n)\n`;
  return { manufacturer: "US Blanks", name: title, filename: `blanks/us-blanks/${filename}`, length, width: maxWidth, thickness: maxThickness, targetVolume: volume, sourceStationCount: allStations.length, outlineControlPointCount: outline.length, outlineMaxErrorCm: simplifiedOutline.maxError, outlineVolumeChangeRatio: simplifiedOutline.volumeRatio, imageChecked: !!imageWidthAt, imageRejectedControlPointCount: imageCheck.rejected.length, imageRejectedStations: imageCheck.rejectedStations || [], imageMaxDeviationCm: imageCheck.maxDeviationCm, imageOutlierThresholdCm: imageCheck.thresholdCm || 0, shaperComment: comment, page: pageIndex + 6, brd };
}).filter(Boolean);

fs.mkdirSync(output, { recursive: true });
for (const product of products) fs.writeFileSync(path.join(output, path.basename(product.filename)), product.brd);
fs.writeFileSync(path.join(output, "catalog.json"), JSON.stringify(products.map(({ brd, ...product }) => product), null, 2) + "\n");
if (products.length !== 66) throw new Error(`Expected 66 products, extracted ${products.length}`);
console.log(`Imported ${products.length} US Blanks products into ${output}`);
