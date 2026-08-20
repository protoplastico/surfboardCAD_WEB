#!/usr/bin/env node
"use strict";

const length = 179.23;
const stations = [
  // x from tail, full width, thickness, natural bottom rocker (cm)
  [0, 13.97, 2.38, 5.08], [15.24, 29.69, 3.49, 3.33],
  [30.48, 37.94, 4.45, 2.06], [45.72, 43.66, 5.24, 1.27],
  [60.96, 47.31, 5.87, 0.56], [length / 2, 49.53, 6.19, 0],
  [length - 60.96, 46.51, 5.87, 0.79], [length - 45.72, 41.91, 5.08, 1.91],
  [length - 30.48, 34.93, 4.13, 3.65], [length - 15.24, 24.77, 3.02, 6.83],
  [length, 8.89, 2.06, 12.07]
];

function spline(points) {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = (next[0] - previous[0]) / 6;
    const dy = (next[1] - previous[1]) / 6;
    return [point[0], point[1], point[0] - dx, point[1] - dy, point[0] + dx, point[1] + dy];
  });
}

function crossSection(width, thickness) {
  const w = width / 2;
  return spline([[0, 0], [w * 0.986, thickness * 0.022], [w, thickness * 0.45], [w * 0.981, thickness * 0.945], [0, thickness]]);
}

function knots(values) {
  return values.map(value => `(cp [${value.join(",")}] true false)`).join("\n");
}

const outline = spline(stations.map(([x, width]) => [x, width / 2]));
const bottom = spline(stations.map(([x, , , rocker]) => [x, rocker]));
const deck = spline(stations.map(([x, , thickness, rocker]) => [x, rocker + thickness]));
const sections = stations.map(([x, width, thickness]) => `(p36 ${x}\n${knots(crossSection(width, thickness))}\n)`).join("\n");

process.stdout.write(`p01 : ${length}\np03 : 6.19\np04 : 49.69\np07 : V4.4\np08 : US Blanks 5'9P (2010 catalog approximation)\np32 : (\n${knots(outline)}\n)\np33 : (\n${knots(bottom)}\n)\np34 : (\n${knots(deck)}\n)\np35 : (\n${sections}\n)\n`);
