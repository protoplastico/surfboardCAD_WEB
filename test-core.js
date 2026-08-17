#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { performance } = require("perf_hooks");

const root = __dirname;
const SECTION_SCENARIO_MAP = {
  samples: ["S01", "S16", "S17"],
  "probe-build": ["S18", "S19", "S20"],
  tail: ["S10"],
  nose: ["S11"],
  wing: ["S12"],
  "ghost-3d-edit": ["S02", "S03", "S04", "S06", "S08", "S09", "S13", "S14", "S15"],
  "scan-view": ["S18", "S19"],
  "misc-help": ["S21", "S22", "S23"],
  "toolbar-dialogs": ["S26", "S27"],
  "dialogs-cross-section": ["S30"],
  "menu-wiring": ["S28"],
  "rail": ["S31"],
  "rocker": ["S32"],
  "bottom-features": ["S29"],
  "render-cache": ["S24", "S25"]
};
const SCENARIO_SECTION_MAP = Object.entries(SECTION_SCENARIO_MAP).reduce((map, [section, scenarios]) => {
  for (const scenario of scenarios) {
    if (!map[scenario]) map[scenario] = new Set();
    map[scenario].add(section);
  }
  return map;
}, {});

function parseCliArgs(argv) {
  const result = {
    trace: process.env.BOARDCAD_TRACE_TEST === "1",
    sections: (process.env.BOARDCAD_TEST_SECTION || "all").split(",").map(item => item.trim()).filter(Boolean),
    samples: (process.env.BOARDCAD_SAMPLE_FILTER || "").split(",").map(item => item.trim().toLowerCase()).filter(Boolean),
    scenarios: [],
    list: false,
    help: false
  };
  for (const arg of argv) {
    if (arg === "--trace") {
      result.trace = true;
      continue;
    }
    if (arg === "--list-sections" || arg === "--list") {
      result.list = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg.startsWith("--section=")) {
      result.sections = arg.slice("--section=".length).split(",").map(item => item.trim()).filter(Boolean);
      continue;
    }
    if (arg.startsWith("--sample=")) {
      result.samples = arg.slice("--sample=".length).split(",").map(item => item.trim().toLowerCase()).filter(Boolean);
      continue;
    }
    if (arg.startsWith("--scenario=")) {
      result.scenarios.push(...arg.slice("--scenario=".length).split(",").map(item => item.trim().toUpperCase()).filter(Boolean));
    }
  }
  return result;
}

function printUsage() {
  console.log("Usage: node test-core.js [--section=tail,nose] [--scenario=S10,S11] [--sample=Shortboard] [--trace] [--list-sections]");
  console.log("");
  console.log("Sections:");
  for (const [section, scenarios] of Object.entries(SECTION_SCENARIO_MAP)) {
    console.log(`  ${section.padEnd(14)} ${scenarios.join(", ")}`);
  }
  console.log("");
  console.log("Examples:");
  console.log("  node test-core.js --section=ghost-3d-edit");
  console.log("  node test-core.js --scenario=S10,S11");
  console.log("  node test-core.js --section=samples --sample=Shortboard");
}

const cli = parseCliArgs(process.argv.slice(2));
if (cli.help) {
  printUsage();
  process.exit(0);
}
if (cli.list) {
  printUsage();
  process.exit(0);
}
const traceEnabled = cli.trace;
const resolvedSections = new Set(cli.sections.length ? cli.sections : ["all"]);
for (const scenario of cli.scenarios) {
  const sections = SCENARIO_SECTION_MAP[scenario];
  if (!sections) {
    throw new Error(`Unknown scenario '${scenario}'. Use --list-sections to inspect available mappings.`);
  }
  resolvedSections.delete("all");
  for (const section of sections) resolvedSections.add(section);
}
const sectionFilter = resolvedSections;
const sampleFilter = new Set(cli.samples);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function approxEqual(a, b, epsilon = 1e-5) {
  return Math.abs((Number(a) || 0) - (Number(b) || 0)) <= epsilon;
}

function crossSectionApproxEqual(a, b, epsilon = 1e-5) {
  if (!a || !b) return false;
  if (!approxEqual(a.position, b.position, epsilon)) return false;
  if ((a.guidePoints?.length || 0) !== (b.guidePoints?.length || 0)) return false;
  const maxXA = Math.max(...(a.spline || []).map(knot => Number(knot?.p?.x) || 0), 0);
  const maxXB = Math.max(...(b.spline || []).map(knot => Number(knot?.p?.x) || 0), 0);
  if (!approxEqual(maxXA, maxXB, epsilon)) return false;
  for (let i = 0; i <= 12; i++) {
    const x = (Math.min(maxXA, maxXB) * i) / 12;
    const yA = api._test.boardCadSplineValueAt(a.spline, x);
    const yB = api._test.boardCadSplineValueAt(b.spline, x);
    if (!approxEqual(yA, yB, 2e-4)) return false;
  }
  for (let i = 0; i < (a.guidePoints?.length || 0); i++) {
    if (!approxEqual(a.guidePoints[i]?.x, b.guidePoints[i]?.x, epsilon)) return false;
    if (!approxEqual(a.guidePoints[i]?.y, b.guidePoints[i]?.y, epsilon)) return false;
  }
  return true;
}

function describeCrossSectionDifference(a, b, epsilon = 1e-5) {
  if (!a || !b) return "missing section";
  if (!approxEqual(a.position, b.position, epsilon)) return `position ${a.position} vs ${b.position}`;
  if ((a.guidePoints?.length || 0) !== (b.guidePoints?.length || 0)) return `guidePoints ${a.guidePoints?.length || 0} vs ${b.guidePoints?.length || 0}`;
  const maxXA = Math.max(...(a.spline || []).map(knot => Number(knot?.p?.x) || 0), 0);
  const maxXB = Math.max(...(b.spline || []).map(knot => Number(knot?.p?.x) || 0), 0);
  if (!approxEqual(maxXA, maxXB, epsilon)) return `maxX ${maxXA} vs ${maxXB}`;
  for (let i = 0; i <= 12; i++) {
    const x = (Math.min(maxXA, maxXB) * i) / 12;
    const yA = api._test.boardCadSplineValueAt(a.spline, x);
    const yB = api._test.boardCadSplineValueAt(b.spline, x);
    const dy = Math.abs(yA - yB);
    if (dy > 2e-4) return `sample ${i} @ ${x} deltaY ${dy}`;
  }
  if ((a.spline?.length || 0) !== (b.spline?.length || 0)) {
    return `spline length ${a.spline?.length || 0} vs ${b.spline?.length || 0}`;
  }
  for (let i = 0; i < (a.spline?.length || 0); i++) {
    const knotA = a.spline[i];
    const knotB = b.spline[i];
    for (const key of ["p", "prev", "next"]) {
      const dx = Math.abs((Number(knotA?.[key]?.x) || 0) - (Number(knotB?.[key]?.x) || 0));
      const dy = Math.abs((Number(knotA?.[key]?.y) || 0) - (Number(knotB?.[key]?.y) || 0));
      if (dx > epsilon || dy > epsilon) return `knot ${i} ${key} delta (${dx}, ${dy})`;
    }
  }
  for (let i = 0; i < (a.guidePoints?.length || 0); i++) {
    const dx = Math.abs((Number(a.guidePoints[i]?.x) || 0) - (Number(b.guidePoints[i]?.x) || 0));
    const dy = Math.abs((Number(a.guidePoints[i]?.y) || 0) - (Number(b.guidePoints[i]?.y) || 0));
    if (dx > epsilon || dy > epsilon) return `guide ${i} delta (${dx}, ${dy})`;
  }
  return "unknown";
}

function upperHalfTailKnotsApproxEqual(base, transformed, epsilon = 1e-6) {
  if (!Array.isArray(base) || !Array.isArray(transformed) || !base.length || !transformed.length) return false;
  const baseRailIndex = base.reduce((best, knot, index, arr) => (
    (Number(knot?.p?.x) || 0) > (Number(arr[best]?.p?.x) || -Infinity) ? index : best
  ), 0);
  const upperCount = Math.max(0, base.length - (baseRailIndex + 1));
  for (let i = 1; i <= upperCount; i++) {
    const a = base[base.length - i];
    const b = transformed[transformed.length - i];
    if (!approxEqual(a?.p?.x, b?.p?.x, epsilon) || !approxEqual(a?.p?.y, b?.p?.y, epsilon)) return false;
    if (!approxEqual(a?.prev?.x, b?.prev?.x, epsilon) || !approxEqual(a?.prev?.y, b?.prev?.y, epsilon)) return false;
    if (!approxEqual(a?.next?.x, b?.next?.x, epsilon) || !approxEqual(a?.next?.y, b?.next?.y, epsilon)) return false;
  }
  return true;
}

function upperHalfDeckCurveApproxEqual(api, base, transformed, sampleCount = 24, epsilon = 1e-6) {
  return upperHalfDeckCurveMaxDelta(api, base, transformed, sampleCount).delta <= epsilon;
}

function upperHalfDeckCurveMaxDelta(api, base, transformed, sampleCount = 24) {
  const halfWidth = Math.max(
    1e-9,
    Math.min(
      api._test.boardCadCrossSectionWidth(base) / 2,
      api._test.boardCadCrossSectionWidth(transformed) / 2
    ) - 1e-4
  );
  let maxDelta = 0;
  let maxX = 0;
  let maxBase = 0;
  let maxTransformed = 0;
  for (let i = 0; i <= sampleCount; i++) {
    const x = halfWidth * (i / sampleCount);
    const a = api._test.boardCadCrossSectionDeckAt(base, x);
    const b = api._test.boardCadCrossSectionDeckAt(transformed, x);
    const delta = Math.abs(a - b);
    if (delta > maxDelta) {
      maxDelta = delta;
      maxX = x;
      maxBase = a;
      maxTransformed = b;
    }
  }
  return { delta: maxDelta, x: maxX, base: maxBase, transformed: maxTransformed };
}

function lowerHalfKnotXsStrictlyIncrease(knots, epsilon = 1e-6) {
  if (!Array.isArray(knots) || !knots.length) return true;
  const railIndex = knots.reduce((best, knot, index, arr) => (
    (Number(knot?.p?.x) || 0) > (Number(arr[best]?.p?.x) || -Infinity) ? index : best
  ), 0);
  let previousX = -Infinity;
  for (let i = 0; i <= railIndex; i++) {
    const x = Number(knots[i]?.p?.x) || 0;
    if (x <= previousX + epsilon) return false;
    previousX = x;
  }
  return true;
}

function trace(label) {
  if (!traceEnabled) return;
  console.log(`[trace] ${label}`);
}

function traceMeasure(label, fn) {
  const start = performance.now();
  const value = fn();
  const elapsed = performance.now() - start;
  if (traceEnabled) console.log(`[trace] ${label}:${elapsed.toFixed(2)}ms`);
  return value;
}

function measureMs(fn, iterations = 1) {
  const count = Math.max(1, iterations | 0);
  const start = performance.now();
  let lastValue;
  for (let i = 0; i < count; i++) lastValue = fn();
  const totalMs = performance.now() - start;
  return {
    value: lastValue,
    totalMs,
    averageMs: totalMs / count
  };
}

function assertKnotsAlmostEqual(actual, expected, label, tolerance = 1e-3) {
  assert(actual.length === expected.length, `${label}: knot count mismatch`);
  for (let i = 0; i < actual.length; i++) {
    for (const key of ["p", "prev", "next"]) {
      assert(Math.abs(actual[i][key].x - expected[i][key].x) <= tolerance, `${label}: ${key}.x mismatch at knot ${i}`);
      assert(Math.abs(actual[i][key].y - expected[i][key].y) <= tolerance, `${label}: ${key}.y mismatch at knot ${i}`);
    }
  }
}

function sectionEnabled(name) {
  return sectionFilter.has("all") || sectionFilter.has(name);
}

function sampleEnabled(file) {
  if (!sampleFilter.size) return true;
  const lower = String(file).toLowerCase();
  return sampleFilter.has(lower) || sampleFilter.has(lower.replace(/\.brd$/i, ""));
}

function maxTailSplineFitError(api, planform, capLength, sampleFn, count = 16) {
  let maxError = 0;
  for (let i = 0; i <= count; i++) {
    const x = capLength * (i / count);
    const actual = api._test.boardCadSplineValueAt(planform.positiveSpline, x);
    maxError = Math.max(maxError, Math.abs(actual - sampleFn(x)));
  }
  return maxError;
}

function cubicPoint(p0, c1, c2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: (mt2 * mt * p0.x) + (3 * mt2 * t * c1.x) + (3 * mt * t2 * c2.x) + (t2 * t * p3.x),
    y: (mt2 * mt * p0.y) + (3 * mt2 * t * c1.y) + (3 * mt * t2 * c2.y) + (t2 * t * p3.y)
  };
}

function maxSplineSegmentFitError(planform, startIndex, sampleFn, count = 24) {
  const a = planform.positiveSpline[startIndex];
  const b = planform.positiveSpline[startIndex + 1];
  let maxError = 0;
  for (let i = 0; i <= count; i++) {
    const point = cubicPoint(a.p, a.next, b.prev, b.p, i / count);
    maxError = Math.max(maxError, Math.abs(point.y - sampleFn(point.x)));
  }
  return maxError;
}

function splineSegmentStartSlope(knots, index = 0) {
  const knot = knots[index];
  const dx = knot.next.x - knot.p.x;
  if (Math.abs(dx) <= 1e-9) return 0;
  return (knot.next.y - knot.p.y) / dx;
}

function splineSegmentEndSlope(knots, index) {
  const knot = knots[index];
  const dx = knot.p.x - knot.prev.x;
  if (Math.abs(dx) <= 1e-9) return 0;
  return (knot.p.y - knot.prev.y) / dx;
}

function cubicDerivative(p0, c1, c2, p3, t) {
  const mt = 1 - t;
  return {
    x: (3 * mt * mt * (c1.x - p0.x)) + (6 * mt * t * (c2.x - c1.x)) + (3 * t * t * (p3.x - c2.x)),
    y: (3 * mt * mt * (c1.y - p0.y)) + (6 * mt * t * (c2.y - c1.y)) + (3 * t * t * (p3.y - c2.y))
  };
}

function cubicSecondDerivative(p0, c1, c2, p3, t) {
  return {
    x: (6 * (1 - t) * (c2.x - (2 * c1.x) + p0.x)) + (6 * t * (p3.x - (2 * c2.x) + c1.x)),
    y: (6 * (1 - t) * (c2.y - (2 * c1.y) + p0.y)) + (6 * t * (p3.y - (2 * c2.y) + c1.y))
  };
}

function cubicCurvatureSigns(p0, c1, c2, p3, count = 16) {
  const signs = [];
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const d1 = cubicDerivative(p0, c1, c2, p3, t);
    const d2 = cubicSecondDerivative(p0, c1, c2, p3, t);
    const cross = (d1.x * d2.y) - (d1.y * d2.x);
    if (Math.abs(cross) > 1e-8) signs.push(Math.sign(cross));
  }
  return [...new Set(signs)];
}

function cubicCurvatureMagnitude(p0, c1, c2, p3, t) {
  const d1 = cubicDerivative(p0, c1, c2, p3, t);
  const d2 = cubicSecondDerivative(p0, c1, c2, p3, t);
  const cross = (d1.x * d2.y) - (d1.y * d2.x);
  const speedSquared = (d1.x * d1.x) + (d1.y * d1.y);
  if (speedSquared <= 1e-12) return 0;
  return Math.abs(cross) / Math.pow(speedSquared, 1.5);
}

function createElementStub(id) {
  const listeners = new Map();
  const classNames = new Set();
  const children = [];
  const values = {
    unitSelect: "10",
    feedRate: "1200",
    laserPower: "255",
    cncAxes: "4",
    cncSurface: "bottom",
    cncLengthSteps: "12",
    cncWidthSteps: "4",
    safeZ: "80",
    segments: "24",
    scanMode: "ribs",
    scanSurface: "both",
    scanXStep: "300",
    scanYStep: "150",
    scanMeasuredLength: "",
    scanMachineTravelX: "2900",
    scanMachineCenterY: "375",
    probeTravel: "120",
    probeFeed: "80",
    serialBaud: "115200",
    sampleSelect: "./Shortboard.brd"
  };
  return {
    id,
    value: values[id] || "",
    checked: false,
    disabled: false,
    clickCount: 0,
    textContent: "",
    innerHTML: "",
    dataset: {},
    style: {},
    hidden: false,
    children,
    classList: {
      add(...names) { names.forEach(name => classNames.add(name)); },
      remove(...names) { names.forEach(name => classNames.delete(name)); },
      toggle(name, force) {
        if (force === true) {
          classNames.add(name);
          return true;
        }
        if (force === false) {
          classNames.delete(name);
          return false;
        }
        if (classNames.has(name)) {
          classNames.delete(name);
          return false;
        }
        classNames.add(name);
        return true;
      },
      contains(name) { return classNames.has(name); }
    },
    files: [],
    width: 1280,
    height: 720,
    clientWidth: 1280,
    clientHeight: 720,
    scrollTop: 0,
    scrollHeight: 0,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener() {},
    appendChild(node) {
      children.push(node);
      return node;
    },
    remove() {},
    click() { this.clickCount += 1; },
    focus() {},
    blur() {},
    setAttribute() {},
    removeAttribute() {},
    closest() { return null; },
    querySelectorAll() { return []; },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 };
    },
    getContext() {
      const context = new Proxy({}, {
        get(_target, prop) {
          if (prop === "measureText") return text => ({ width: String(text).length * 7 });
          if (prop === "createLinearGradient") return () => ({ addColorStop() {} });
          if (prop === "canvas") return { width: 1280, height: 720 };
          return () => {};
        },
        set() { return true; }
      });
      return context;
    }
  };
}

const elementCache = new Map();
function getElement(id) {
  if (!elementCache.has(id)) elementCache.set(id, createElementStub(id));
  return elementCache.get(id);
}

const windowStub = {
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame() { return 0; },
  cancelAnimationFrame() {},
  location: {
    protocol: "http:",
    search: "",
    href: "http://localhost:8788/"
  },
  URL: {
    createObjectURL() { return "blob:boardcad-web-test"; },
    revokeObjectURL() {}
  },
  navigator: {}
};

const documentStub = {
  getElementById: getElement,
  querySelectorAll() { return []; },
  querySelector() { return null; },
  addEventListener() {},
  removeEventListener() {},
  createElement(tag) {
    return createElementStub(tag);
  },
  body: createElementStub("body")
};

const context = {
  console,
  performance,
  setTimeout,
  clearTimeout,
  requestAnimationFrame() { return 0; },
  cancelAnimationFrame() {},
  URLSearchParams,
  window: windowStub,
  document: documentStub,
  Blob: class Blob {
    constructor(parts, options = {}) {
      this.parts = parts;
      this.type = options.type || "";
      this.size = parts.reduce((sum, part) => sum + String(part).length, 0);
    }
  },
  FileReader: class FileReader {},
  fetch: async url => {
    const value = String(url || "");
    if (/^(https?:|file:)/i.test(value)) return { ok: false, text: async () => "" };
    const normalized = value.replace(/^\.\//, "");
    const resolved = path.resolve(root, normalized);
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      return { ok: false, text: async () => "" };
    }
    try {
      const text = fs.readFileSync(resolved, "utf8");
      return { ok: true, text: async () => text };
    } catch {
      return { ok: false, text: async () => "" };
    }
  },
  alert(message) { throw new Error(`Unexpected alert: ${message}`); },
  confirm() { return true; },
  prompt(_message, fallback) { return fallback || ""; }
};
context.window.window = context.window;
context.window.document = context.document;
context.window.console = console;
context.window.performance = performance;
context.window.requestAnimationFrame = context.requestAnimationFrame;
context.window.cancelAnimationFrame = context.cancelAnimationFrame;
context.window.prompt = context.prompt;
context.window.alert = context.alert;
context.window.confirm = context.confirm;
context.window.__boardcadProfileCommit = traceEnabled;
context.window.__boardcadProfileDraw = traceEnabled;

context.globalThis=context;context.__tpHit=0;context.__tpMiss=0;
vm.createContext(context);
const appCode = fs.readFileSync(path.join(root, "app.js"), "utf8");
vm.runInContext(appCode, context, { filename: "app.js" });

const api = context.window.boardcadWeb;
assert(api, "boardcadWeb API was not exported");

const sampleFiles = ["Shortboard.brd", "Funboard.brd", "Longboard.brd", "USBlanks-5-9P.brd"].filter(sampleEnabled);
if (sectionEnabled("samples")) for (const file of sampleFiles) {
  trace(`sample:start:${file}`);
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const board = api.parseBrd(text, file);
  assert(board.length > 0, `${file}: invalid length`);
  assert(board.outline?.length >= 2, `${file}: outline knots missing`);
  assert(board.bottom?.length >= 2, `${file}: bottom rocker knots missing`);
  assert(board.deck?.length >= 2, `${file}: deck rocker knots missing`);
  assert(board.sections?.length >= 1, `${file}: cross sections missing`);
  if (file === "USBlanks-5-9P.brd") {
    const volumeLiters = api._test.boardCadVolume(board) / 1000;
    assert(Math.abs(volumeLiters - 34.8) <= 0.1, `${file}: expected 34.8 L, got ${volumeLiters.toFixed(3)} L`);
  }
  trace(`sample:parsed:${file}`);

  const brd = api.makeBrd(board);
  assert(brd.includes("p32"), `${file}: BRD export missing outline p32`);
  assert(brd.includes("p35"), `${file}: BRD export missing cross section p35`);
  assert(api.parseBrd(brd, `${file}.roundtrip`).sections.length === board.sections.length, `${file}: roundtrip section count changed`);
  trace(`sample:brd:${file}`);

  const pdf = api.makePdf(board);
  assert(pdf.startsWith("%PDF-1.4"), `${file}: drawing PDF signature invalid`);
  assert(api.makeTemplatePdf(board).startsWith("%PDF-1.4"), `${file}: template PDF signature invalid`);
  assert(api.makeDxfOutlineSpline(board).includes("SPLINE"), `${file}: outline spline DXF missing SPLINE`);
  assert(api.makeDxfProfileSpline(board).includes("SPLINE"), `${file}: profile spline DXF missing SPLINE`);
  const drawableSection = board.sections.find(section => section.spline?.length >= 2);
  assert(drawableSection, `${file}: drawable cross section missing`);
  assert(api.makeDxfCrossSectionSpline(drawableSection).includes("SPLINE"), `${file}: cross section spline DXF missing SPLINE`);
  trace(`sample:pdf-dxf:${file}`);
  const laserGcode = api.makeLaserGCode(board);
  const cncGcode = api.makeCncGCode(board);
  assert(laserGcode.includes("M3"), `${file}: laser G-code missing spindle/laser command`);
  assert(cncGcode.includes(" A"), `${file}: CNC G-code missing rotary axis`);
  assert(cncGcode.includes("machine limits 2900 x 750 x 300 mm"), `${file}: CNC G-code missing default machine limits header`);
  trace(`sample:cnc:${file}`);
  const probeGcode = api.makeProbeScanGCode(board);
  assert(probeGcode.includes("G38.2"), `${file}: probe scan G-code missing probe command`);
  assert(probeGcode.includes("BX") && probeGcode.includes("MX"), `${file}: probe scan G-code missing board/machine coordinate comments`);
  assert(probeGcode.includes("PHASE stringer"), `${file}: probe scan G-code missing stringer phase`);
  assert(probeGcode.includes("Set the work origin at the board tail before running this file."), `${file}: probe scan G-code should declare tail origin`);
  assert(probeGcode.includes("Return to tail origin before rib-direction scan"), `${file}: probe scan G-code missing return-to-origin rib phase`);
  assert(probeGcode.includes("board centerline maps to machine Y375"), `${file}: probe scan G-code did not use the new default machine Y center`);
  assert(probeGcode.includes("machine limits 2900 x 750 x 300 mm"), `${file}: probe scan G-code missing updated machine limits`);
  const probeSimulation = api._test.parseProbeSimulation(probeGcode);
  assert(probeSimulation.segments.length > 0, `${file}: probe simulation path missing`);
  assert(probeSimulation.segments.some(segment => segment.type === "probe"), `${file}: probe simulation missing probe segments`);
  trace(`sample:ribs-probe:${file}`);
  getElement("scanMode").value = "outline";
  const outlineProbeGcode = api.makeProbeScanGCode(board);
  assert(outlineProbeGcode.includes("probe axis Y side probe"), `${file}: outline probe missing side-probe axis comment`);
  assert(/G38\.2 Y/.test(outlineProbeGcode), `${file}: outline probe should probe along Y`);
  assert(outlineProbeGcode.includes("outline-right"), `${file}: outline probe should scan the right side`);
  assert(!outlineProbeGcode.includes("outline-left"), `${file}: outline probe should scan only one side`);
  const outlineSimulation = api._test.parseProbeSimulation(outlineProbeGcode);
  const firstOutlineProbe = outlineSimulation.segments.find(segment => segment.type === "probe");
  assert(firstOutlineProbe && firstOutlineProbe.from.y > firstOutlineProbe.to.y, `${file}: outline probe should move from outside toward board`);
  trace(`sample:outline-probe:${file}`);
  getElement("scanMode").value = "cross-half";
  const crossHalfGcode = api.makeProbeScanGCode(board);
  assert(crossHalfGcode.includes("cross-section"), `${file}: half cross-section probe missing phase labels`);
  assert(/G38\.2 Y[-\d.]+ Z[-\d.]+/.test(crossHalfGcode), `${file}: half cross-section probe should probe along local normal in Y/Z`);
  assert(/\sA-?\d/.test(crossHalfGcode), `${file}: half cross-section probe should include A-axis orientation`);
  const crossSimulation = api._test.parseProbeSimulation(crossHalfGcode);
  assert(crossSimulation.segments.some(segment => /^cross-section-/.test(segment.point?.phase || "")), `${file}: half cross-section simulation missing phase data`);
  assert(crossSimulation.segments.some(segment => segment.type === "probe" && Number.isFinite(segment.point?.a)), `${file}: half cross-section simulation missing A angle`);
  const crossProbeLengths = crossSimulation.segments
    .filter(segment => segment.type === "probe" && segment.point?.surface === "cross-half")
    .map(segment => Math.hypot(segment.to.y - segment.from.y, segment.to.z - segment.from.z));
  assert(Math.max(...crossProbeLengths) < 40, `${file}: half cross-section probe retract/travel is too large`);
  const crossComments = [...crossHalfGcode.matchAll(/\(P\s+\d+\s+cross-half\s+BX([-\d.]+)\s+BY([-\d.]+)/g)].map(match => ({
    x: Number(match[1]),
    y: Number(match[2])
  }));
  const firstCrossX = crossComments[0]?.x;
  const crossYs = crossComments.filter(point => Math.abs(point.x - firstCrossX) < 0.001).map(point => point.y);
  assert(crossYs.length >= 4, `${file}: half cross-section probe comments missing`);
  assert(Math.abs(crossYs[0]) < 0.001, `${file}: half cross-section should start at stringer`);
  assert(Math.max(...crossYs) > 0, `${file}: half cross-section should move toward rail`);
  assert(Math.abs(crossYs.at(-1)) < 0.001, `${file}: half cross-section should return toward bottom stringer`);
  trace(`sample:cross-half:${file}`);
  getElement("scanMode").value = "ribs";
  trace(`sample:done:${file}`);
}

if (sectionEnabled("samples")) {
  const blankCatalog = JSON.parse(fs.readFileSync(path.join(root, "blanks/us-blanks/catalog.json"), "utf8"));
  assert(blankCatalog.length === 66, `blank catalog: expected 66 products, got ${blankCatalog.length}`);
  assert(blankCatalog.filter(item => item.shaperComment).length === 61, "blank catalog: expected 61 Shaper's Comments");
  for (const item of blankCatalog) {
    const filename = path.join(root, item.filename);
    assert(fs.existsSync(filename), `blank catalog: missing ${item.filename}`);
    const board = api.parseBrd(fs.readFileSync(filename, "utf8"), path.basename(filename));
    assert(board.outline.length === item.outlineControlPointCount, `${item.name}: outline CP count metadata mismatch`);
    assert(board.bottom.length === item.profileControlPointCount, `${item.name}: bottom vector CP count metadata mismatch`);
    assert(board.deck.length === item.profileControlPointCount, `${item.name}: deck vector CP count metadata mismatch`);
    assert(board.sections.length === item.sourceStationCount, `${item.name}: cross sections should retain every numeric station`);
    assert(item.vectorExtracted === true, `${item.name}: PDF vector geometry was not extracted`);
    assert(Math.abs(board.length - item.length) < 0.1, `${item.name}: catalog length mismatch`);
    for (let index = 0; index <= 80; index++) {
      const x = board.length * index / 80;
      const thickness = api._test.boardCadThicknessAtPos(board, x);
      const rocker = api._test.boardCadRockerAtPos(board, x);
      assert(thickness >= -0.01 && thickness <= item.thickness * 1.12, `${item.name}: profile thickness spike at ${x.toFixed(1)} cm`);
      assert(rocker >= -0.1 && rocker <= Math.max(16, item.length * 0.08), `${item.name}: rocker spike ${rocker.toFixed(2)} cm at ${x.toFixed(1)} cm`);
    }
    assert((board.fields[97] || "") === item.shaperComment, `${item.name}: Shaper's Comments mismatch`);
  }
  const commentedBlank = api.parseBrd(fs.readFileSync(path.join(root, blankCatalog[0].filename), "utf8"), "commented-blank.brd");
  assert(api.parseBrd(api.makeBrd(commentedBlank), "comment-roundtrip.brd").fields[97] === commentedBlank.fields[97], "blank catalog: BRD save should preserve Shaper's Comments");
  commentedBlank.tailMode = "round";
  commentedBlank.tailLength = 26;
  commentedBlank.tailShoulderPos = 0.62;
  commentedBlank.tailShoulderScale = 0.74;
  commentedBlank.tailRailBlend = 0.86;
  commentedBlank.noseMode = "round";
  commentedBlank.noseLength = 24;
  commentedBlank.noseShoulderPos = 0.62;
  commentedBlank.noseShoulderScale = 0.8;
  commentedBlank.noseRailBlend = 0.85;
  const noseOnlyBlank = api.parseBrd(fs.readFileSync(path.join(root, blankCatalog[0].filename), "utf8"), "nose-only-blank.brd");
  Object.assign(noseOnlyBlank, { noseMode: "round", noseLength: 24, noseShoulderPos: 0.62, noseShoulderScale: 0.8, noseRailBlend: 0.85 });
  assert(api._test.boardCadTailPlanform(noseOnlyBlank).positiveSpline.length <= noseOnlyBlank.outline.length + 4, "blank catalog: nose application should preserve a low CP count");
  api.state.board = commentedBlank;
  api.state.view = "outline";
  api.state.tool = "edit";
  api.state.viewOptions.showControlPoints = true;
  api._test.draw();
  const appliedShapeHandle = api.state.editHandles.find(handle => handle.customKind === "procedural-outline" && handle.which === 0);
  assert(appliedShapeHandle, "blank catalog: applied nose/tail shape should expose editable CPs");
  assert(api._test.materializeProceduralOutlineHandle(appliedShapeHandle), "blank catalog: applied-shape CP should become directly editable");
  assert(appliedShapeHandle.knots === commentedBlank.outline, "blank catalog: editable applied-shape CP should target the board outline");
  assert(!commentedBlank.tailMode && !commentedBlank.noseMode, "blank catalog: direct CP editing should bake procedural nose/tail settings");
}

if (sectionEnabled("samples")) {
  const shortText = fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8");
  context.window.BOARDCAD_SAMPLE_DATA = { "Shortboard.brd": shortText };
  context.window.location.protocol = "file:";
  context.window.location.search = "";
  context.window.location.href = "file:///boardcad-web/index.html";
  api.state.board = null;
  assert(api._test.loadBundledSample("./Shortboard.brd") === true, "file sample: bundled loader did not report success");
  assert(api.state.board && api.state.board.length > 0, "file sample: bundled sample fallback did not load under file protocol");
  context.window.location.protocol = "http:";
  context.window.location.href = "http://localhost:8788/";
}

if (sectionEnabled("probe-build")) {
  trace("probe-build:start");
  const syntheticProbe = [];
  for (const x of [0, 500, 1000, 1500, 1800]) {
    const half = Math.max(10, Math.sin((x / 1800) * Math.PI) * 250);
    const bottomCenter = 12 * Math.sin((x / 1800) * Math.PI);
    const deckCenter = bottomCenter + 80;
    for (const y of [0, half / 2, half]) {
      syntheticProbe.push({ surface: "bottom", x, y, z: bottomCenter + y * 0.02 });
      syntheticProbe.push({ surface: "deck", x, y, z: deckCenter - y * 0.04 });
    }
  }
  getElement("scanMeasuredLength").value = "1800";
  const convertedProbe = api._test.measurementsToBoardCoordinates([
    { surface: "bottom", x: 0, y: 0, z: 0 },
    { surface: "bottom", x: 1800, y: 0, z: 0 }
  ]);
  assert(convertedProbe[0].x === 0, "probe coords: tail-origin X0 should stay at BoardCAD tail side");
  assert(convertedProbe[1].x === 1800, "probe coords: tail-origin nose should stay at BoardCAD nose side");
  const legacyConvertedProbe = api._test.measurementsToBoardCoordinates([
    { surface: "bottom", x: 0, y: 0, z: 0, basis: "nose" },
    { surface: "bottom", x: 1800, y: 0, z: 0, basis: "nose" }
  ]);
  assert(legacyConvertedProbe[0].x === 1800, "probe coords: legacy nose-origin X0 should map to BoardCAD nose side");
  assert(legacyConvertedProbe[1].x === 0, "probe coords: legacy machine tail should map to BoardCAD tail side");
  const scannedBoard = api.boardFromProbeMeasurements(syntheticProbe);
  assert(scannedBoard.sections.length >= 3, "probe build: cross sections missing");
  assert(scannedBoard.outline.length >= 2, "probe build: outline missing");
  const ghostProfile = api._test.scanGhostProfile(syntheticProbe);
  assert(ghostProfile.bottom.length >= 3, "scan ghost: bottom profile missing");
  assert(ghostProfile.deck.length >= 3, "scan ghost: deck profile missing");
  assert(Math.abs(ghostProfile.bottom[0].x) < 0.001, "scan ghost: converted BoardCAD tail should start at x=0");
  const syntheticOutline = [];
  for (const x of [0, 500, 1000, 1500, 1800]) {
    const half = Math.max(10, Math.sin((x / 1800) * Math.PI) * 250);
    syntheticOutline.push({ surface: "outline-right", x, y: half, z: 0 });
    syntheticOutline.push({ surface: "outline-left", x, y: -half, z: 0 });
  }
  const ghostOutline = api._test.scanGhostOutline(syntheticOutline);
  assert(ghostOutline.length >= 3, "scan ghost: outline missing");
  assert(Math.abs(ghostOutline[0].y) < 0.001, "scan ghost: outline tail endpoint should close to center");
  assert(Math.abs(ghostOutline.at(-1).y) < 0.001, "scan ghost: outline nose endpoint should close to center");
  assert(Math.max(...ghostOutline.map(point => point.y)) > 3, "scan ghost: outline width was not reconstructed");
  const crossHalfLog = [
  "MEASURE cross-half X900 Y0 Z80 MX900 MY450",
  "MEASURE cross-half X900 Y120 Z64 MX900 MY570",
  "MEASURE cross-half X900 Y180 Z42 MX900 MY630",
  "MEASURE cross-half X900 Y120 Z16 MX900 MY570",
  "MEASURE cross-half X900 Y0 Z0 MX900 MY450"
].join("\n");
  const parsedCrossHalf = api._test.parseMeasurementsFromLog(crossHalfLog);
  assert(parsedCrossHalf.length === 5, "scan ghost: cross-half log with hyphen was not parsed");
  const crossHalfCsv = api._test.measurementsToCsv(parsedCrossHalf);
  assert(crossHalfCsv.startsWith("index,surface,tail_x_mm,"), "scan ghost: CSV export should use tail_x_mm header");
  const parsedCrossHalfCsv = api._test.parseProbeMeasurementsCsv(crossHalfCsv);
  assert(parsedCrossHalfCsv.length === parsedCrossHalf.length, "scan ghost: cross-half CSV roundtrip failed");
  assert(parsedCrossHalfCsv.every(point => point.surface === "cross-half"), "scan ghost: cross-half CSV lost surface names");
  assert(parsedCrossHalfCsv.every(point => point.basis === "tail"), "scan ghost: tail-based CSV roundtrip lost basis");
  const legacyCsv = [
    "index,surface,nose_x_mm,board_y_mm,z_mm",
    "1,bottom,0,0,0",
    "2,bottom,1800,0,0"
  ].join("\n");
  const parsedLegacyCsv = api._test.parseProbeMeasurementsCsv(legacyCsv);
  assert(parsedLegacyCsv.every(point => point.basis === "nose"), "scan ghost: legacy nose_x_mm CSV should be detected");
  const ghostCrossSection = api._test.scanGhostCrossSection(parsedCrossHalf, 900);
  assert(ghostCrossSection.points.length >= 5, "scan ghost: cross-half section missing");
  assert(Math.abs(ghostCrossSection.points[0].y) < 0.001, "scan ghost: cross-half bottom should normalize to zero");
  assert(Math.max(...ghostCrossSection.points.map(point => point.x)) > 2, "scan ghost: cross-half width was not reconstructed");
  const noisyCrossSectionPoints = [
  { x: 0, y: 0 },
  { x: 1.1, y: 0.3 },
  { x: 2.4, y: 0.8 },
  { x: 4.1, y: 1.4 },
  { x: 5.6, y: 2.2 },
  { x: 6.0, y: 3.0 },
  { x: 5.3, y: 3.9 },
  { x: 3.9, y: 4.7 },
  { x: 2.2, y: 5.4 },
  { x: 0.9, y: 5.9 },
  { x: 0, y: 6.2 }
  ];
  const fitPoints = api._test.prepareCrossSectionFitPoints(noisyCrossSectionPoints);
  assert(fitPoints.length < noisyCrossSectionPoints.length, "cross-half fit: points were not reduced");
  assert(Math.abs(fitPoints[0].x) < 0.001 && Math.abs(fitPoints.at(-1).x) < 0.001, "cross-half fit: stringer endpoints not preserved");
  assert(Math.max(...fitPoints.map(point => point.x)) > 5, "cross-half fit: rail width not preserved");
  const adaptiveFitPoints = api._test.adaptiveCrossSectionFitPoints(noisyCrossSectionPoints, 7);
  assert(adaptiveFitPoints.length <= 7, "cross-half fit: adaptive fit exceeded point budget");
  assert(Math.max(...adaptiveFitPoints.map(point => point.x)) === Math.max(...noisyCrossSectionPoints.map(point => point.x)), "cross-half fit: adaptive fit lost rail point");
  const fittedSpline = api._test.fitCrossSectionBezierFromScanPoints(noisyCrossSectionPoints);
  assert(fittedSpline.length === fitPoints.length, "cross-half fit: spline knot count does not match fit points");
  const fitError = api._test.crossSectionFitError(noisyCrossSectionPoints, fittedSpline);
  assert(fitError.count === noisyCrossSectionPoints.length, "cross-half fit: error count mismatch");
  assert(fitError.rms >= 0 && fitError.max >= fitError.rms, "cross-half fit: invalid error metrics");
  assert(fitError.max < 1.5, "cross-half fit: fitted curve deviates too far from scan points");
  const scannedBrd = api.makeBrd(scannedBoard);
  assert(api.parseBrd(scannedBrd, "scanned.brd").sections.length === scannedBoard.sections.length, "probe build: BRD roundtrip failed");
  trace("probe-build:done");
}

if (sectionEnabled("tail")) {
trace("tail:start");
const tailBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-tail.brd");
assert(api._test.canonicalTailTopology("square") === "tail.solid_block", "tail taxonomy: square should resolve to solid block");
assert(api._test.canonicalTailTopology("squash") === "tail.solid_rounded", "tail taxonomy: squash should resolve to solid rounded");
assert(api._test.canonicalTailTopology("gun") === "tail.solid_pointed", "tail taxonomy: gun should resolve to solid pointed");
assert(api._test.canonicalTailTopology("swallow") === "tail.center_notched", "tail taxonomy: swallow should resolve to center notched");
assert(api._test.canonicalTailTopology("bat") === "tail.multi_lobed", "tail taxonomy: bat should resolve to multi lobed");
assert(api._test.canonicalTailTopology("fish") === "tail.center_notched", "tail taxonomy: fish preset should resolve only to notched topology");
const greenlightFishExample = api._test.greenlightFishTailDimensions(16.5 * 2.54);
assert(Math.abs((greenlightFishExample.tipSeparation / 2.54) - 12.24) < 0.03, "tail fish: Greenlight 16.5-inch example tip spacing mismatch");
assert(Math.abs((greenlightFishExample.notchDepth / greenlightFishExample.tipSeparation) - 0.47) < 1e-9, "tail fish: Greenlight worked-example notch ratio mismatch");
const swaylocksWidthScale = api._test.swaylocksFishTemplateScale(65 * 2.54, 23 * 2.54);
assert(Math.abs(swaylocksWidthScale.widthScale - (23 / 21)) < 1e-9, "tail fish: Swaylocks independent width scaling mismatch");
assert(Math.abs(swaylocksWidthScale.stationIntervalCm - (12 * 2.54)) < 1e-9, "tail fish: width-only scaling must retain 12-inch longitudinal stations");
const swaylocksLengthScale = api._test.swaylocksFishTemplateScale(74 * 2.54, 21 * 2.54);
assert(Math.abs((swaylocksLengthScale.stationIntervalCm / 2.54) - (12 * 74 / 65)) < 1e-9, "tail fish: Swaylocks length-scaled station interval mismatch");
const scaledLisStation = swaylocksWidthScale.scaleStation({ x: 12 * 2.54, halfWidth: 8 * 2.54 });
assert(Math.abs((scaledLisStation.halfWidth / 2.54) - (8 * 23 / 21)) < 1e-9, "tail fish: Swaylocks station width scaling mismatch");
const squareMeasurementBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-square-measurements.brd");
squareMeasurementBoard.tailMode = "square";
const squareMeasurements = api._test.canonicalTailMeasurements(squareMeasurementBoard);
assert(squareMeasurements.topology === "tail.solid_block", "tail measurements: square topology mismatch");
assert(squareMeasurements.tailWidth12 > 0, "tail measurements: square 12-inch width should be positive");
assert(squareMeasurements.tipPodWidth > 0, "tail measurements: square terminal pod should have finite width");
assert(squareMeasurements.notchDepth === 0, "tail measurements: square must not have a notch");
assert(squareMeasurements.terminalControlPointRequired === true, "tail measurements: terminal CP requirement was lost");
assert(squareMeasurements.terminalKind === "finite-pod", "tail measurements: square should expose a finite pod terminal");
tailBoard.tailMode = "swallow";
tailBoard.tailLength = 18;
tailBoard.tailDepth = 6;
tailBoard.tailShoulderPos = 0.31;
tailBoard.tailShoulderScale = 1.08;
tailBoard.tailRailBlend = 1.15;
tailBoard.tailLinearization = 0.45;
const tailConfig = api._test.normalizedTailConfig(tailBoard);
assert(tailConfig.active === true && tailConfig.mode === "swallow", "tail: swallow mode was not normalized");
assert(Math.abs(tailConfig.shoulderPos - 0.31) < 1e-9, "tail: shoulder position coefficient was not applied");
assert(Math.abs(tailConfig.shoulderScale - 1.08) < 1e-9, "tail: shoulder width coefficient was not applied");
assert(Math.abs(tailConfig.railBlend - 1.15) < 1e-9, "tail: join blend coefficient was not applied");
assert(Math.abs(tailConfig.linearization - 0.45) < 1e-9, "tail: linearization coefficient was not applied");
const tailSampleX = tailConfig.shift + (tailConfig.depth * 0.5);
const tailOuterWidth = api._test.boardCadWidthAtPos(tailBoard, tailSampleX);
const tailInnerWidth = api._test.boardCadInnerWidthAtPos(tailBoard, tailSampleX);
assert(tailOuterWidth > tailInnerWidth && tailInnerWidth > 0, "tail: swallow notch widths were not generated");
const tailOutline = api._test.outlineFullPoints(tailBoard);
assert(tailOutline.length > 10, "tail: outlineFullPoints did not generate a tail-adjusted outline");
assert(Math.abs(tailOutline[0].x - tailConfig.depth) < 0.5 && Math.abs(tailOutline[0].y) < 0.5, "tail: outline should start at the swallow notch center");
assert(tailOutline.some(point => point.y > 0) && tailOutline.some(point => point.y < 0), "tail: mirrored outline points are incomplete");
const tailRib = api._test.boardCadRibBezierWorldKnots(tailBoard, Math.min(tailConfig.depth * 0.8, tailConfig.length * 0.5), 1);
assert(tailRib.length >= 2, "tail: rib knot generation failed inside swallow zone");
assert(Math.abs(tailRib[0].p.y) > 0.1, "tail: rib should be clipped away from the centerline inside the swallow notch");
api.state.tool = "edit";
api.state.editHandles = [];
api._test.appendSwallowTailWidthEditHandle(
  tailBoard,
  api._test.boardCadTailPlanform(tailBoard),
  { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 }
);
const swallowWidthHandle = api.state.editHandles.find(handle => handle.customKind === "swallow-width");
assert(swallowWidthHandle && swallowWidthHandle.knotIndex === 1 && swallowWidthHandle.pointKey === "p", "tail: swallow outer-tip width handle should be available on the outline canvas");
assert(Math.abs(swallowWidthHandle.knots[1].p.y - api._test.boardCadTailPlanform(tailBoard).positiveSpline[1].p.y) < 1e-9, "tail: swallow width handle should target the semantic outer tip CP");
const tailBrd = api.makeBrd(tailBoard);
assert(!tailBrd.includes("p62 : swallow"), "tail: BRD export should bake the outline instead of preserving tail mode");
const tailRoundTrip = api.parseBrd(tailBrd, "tail-roundtrip.brd");
assert(tailRoundTrip.tailMode === "", "tail: BRD roundtrip should clear procedural tail mode after baking");
assert(Math.abs(tailRoundTrip.tailLength) < 1e-9, "tail: BRD roundtrip should clear procedural tail length after baking");
assert(api._test.normalizedTailConfig(tailRoundTrip).active === false, "tail: baked BRD should not re-activate procedural tail shaping");
assertKnotsAlmostEqual(tailRoundTrip.outline, api._test.outlineSplineParts(tailBoard).upper, "tail baked outline");
assert(api.makeDxfOutline(tailBoard).includes("POLYLINE"), "tail: DXF polyline export failed for adjusted outline");
assert(api.makeDxfOutlineSpline(tailBoard).includes("SPLINE"), "tail: DXF spline export failed for adjusted outline");
assert(api.makeLaserGCode(tailBoard).includes("G1 X"), "tail: laser G-code export failed for adjusted outline");
const squashBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-squash.brd");
squashBoard.tailMode = "squash";
squashBoard.tailLength = 12;
const squashOutline = api._test.outlineFullPoints(squashBoard);
assert(Math.abs(squashOutline[0].y) < 1e-9, "tail: squash pod should start at the stringer as a shallow arched pod, not a straight transom");
assert(Math.abs(squashOutline[0].x) < 1e-9, "tail: squash tail center should stay at x=0");
assert(Math.abs(squashOutline.at(-1).x - squashOutline[0].x) < 1e-9 && Math.abs(squashOutline.at(-1).y - squashOutline[0].y) < 1e-9, "tail: squash outline should close explicitly");
const widerSquashBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wider-squash.brd");
widerSquashBoard.tailMode = "squash";
widerSquashBoard.tailLength = 12;
widerSquashBoard.tailWidthAdjust = 1;
const narrowerSquashBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-narrower-squash.brd");
narrowerSquashBoard.tailMode = "squash";
narrowerSquashBoard.tailLength = 12;
narrowerSquashBoard.tailWidthAdjust = -1;
assert(api._test.boardCadDisplayWidthAtPos(widerSquashBoard, 2) > api._test.boardCadDisplayWidthAtPos(squashBoard, 2), "tail: width adjustment should increase the generated tail width");
assert(api._test.boardCadDisplayWidthAtPos(narrowerSquashBoard, 2) < api._test.boardCadDisplayWidthAtPos(squashBoard, 2), "tail: width adjustment should decrease the generated tail width");
assert(Math.abs(api._test.normalizedTailConfig(widerSquashBoard).widthScale - 4) < 1e-9, "tail: right slider end should represent 400 percent width");
assert(Math.abs(api._test.normalizedTailConfig(narrowerSquashBoard).widthScale - 0.25) < 1e-9, "tail: left slider end should represent 25 percent width");
const roundPinBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-roundpin.brd");
roundPinBoard.tailMode = "round-pin";
roundPinBoard.tailLength = 22;
const roundPinOutline = api._test.outlineFullPoints(roundPinBoard);
assert(Math.abs(roundPinOutline[0].y) < 1e-9, "tail: round pin should still end at a center point");
const pinBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-pin.brd");
pinBoard.tailMode = "pin";
pinBoard.tailLength = 18;
assert(api._test.boardCadDisplayWidthAtPos(roundPinBoard, api._test.boardCadTailDisplayLength(roundPinBoard) * 0.1) > api._test.boardCadDisplayWidthAtPos(pinBoard, api._test.boardCadTailDisplayLength(pinBoard) * 0.1), "tail: round pin should be fuller than pin very near the tail tip");
assert(api._test.boardCadDisplayWidthAtPos(roundPinBoard, api._test.boardCadTailDisplayLength(roundPinBoard) * 0.2) > api._test.boardCadDisplayWidthAtPos(pinBoard, api._test.boardCadTailDisplayLength(pinBoard) * 0.2), "tail: round pin should be fuller than pin near the tail tip");
const uiSquareBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-ui-square.brd");
uiSquareBoard.tailMode = "square";
uiSquareBoard.tailLength = 8;
uiSquareBoard.tailShoulderPos = 0.32;
uiSquareBoard.tailShoulderScale = 0.94;
uiSquareBoard.tailRailBlend = 0.7;
const uiSquareTail = api._test.normalizedTailConfig(uiSquareBoard);
assert(uiSquareTail.capMode === false && Math.abs(uiSquareTail.tipLength) < 1e-9, "tail: square transom should not switch into pin-style cap mode when UI shoulder values are set");
const uiPinBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-ui-pin.brd");
uiPinBoard.tailMode = "pin";
uiPinBoard.tailLength = 18;
uiPinBoard.tailShoulderPos = 0.68;
uiPinBoard.tailShoulderScale = 0.4;
uiPinBoard.tailRailBlend = 1.0;
const uiPinTail = api._test.normalizedTailConfig(uiPinBoard);
assert(Math.abs(uiPinTail.tipLength - uiPinTail.length) < 1e-9, "tail: pin should keep the preset full tip length even after UI shoulder edits");
const uiRoundPinBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-ui-roundpin.brd");
uiRoundPinBoard.tailMode = "round-pin";
uiRoundPinBoard.tailLength = 22;
uiRoundPinBoard.tailShoulderPos = 0.58;
uiRoundPinBoard.tailShoulderScale = 0.64;
uiRoundPinBoard.tailRailBlend = 0.94;
const uiRoundPinTail = api._test.normalizedTailConfig(uiRoundPinBoard);
assert(Math.abs(uiRoundPinTail.tipLength - (uiRoundPinTail.length * 0.82)) < 1e-9, "tail: round pin tip ratio should stay on the preset and not be overwritten by shoulder position");
const uiDiamondBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-ui-diamond.brd");
uiDiamondBoard.tailMode = "diamond";
uiDiamondBoard.tailLength = 7;
uiDiamondBoard.tailShoulderPos = 0.48;
uiDiamondBoard.tailShoulderScale = 0.54;
uiDiamondBoard.tailRailBlend = 0.82;
const uiDiamondTail = api._test.normalizedTailConfig(uiDiamondBoard);
assert(Math.abs(uiDiamondTail.tipScale) < 1e-9, "tail: diamond should converge to one center tip without a flat block");

function shoulderSlopePair(tail) {
  const x = tail.tipLength * tail.shoulderPos;
  const epsilon = Math.max(0.0005, tail.tipLength * 0.0005);
  const left = (api._test.tailOuterHalfWidthAt(tail, x, tail.tipLength) - api._test.tailOuterHalfWidthAt(tail, Math.max(0, x - epsilon), tail.tipLength)) / epsilon;
  const right = (api._test.tailOuterHalfWidthAt(tail, Math.min(tail.tipLength, x + epsilon), tail.tipLength) - api._test.tailOuterHalfWidthAt(tail, x, tail.tipLength)) / epsilon;
  return { left, right };
}

function maxLineDeviation(x0, y0, x1, y1, sampleFn, samples = 9) {
  if (Math.abs(x1 - x0) < 1e-9) return 0;
  let max = 0;
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const x = x0 + ((x1 - x0) * t);
    const expected = y0 + ((y1 - y0) * t);
    max = Math.max(max, Math.abs(sampleFn(x) - expected));
  }
  return max;
}

function maxBezierChordDeviation(p0, c1, c2, p3, samples = 16) {
  if (Math.abs(p3.x - p0.x) < 1e-9) return 0;
  let max = 0;
  for (let i = 1; i < samples; i++) {
    const point = cubicPoint(p0, c1, c2, p3, i / samples);
    const expected = p0.y + ((p3.y - p0.y) * ((point.x - p0.x) / (p3.x - p0.x)));
    max = Math.max(max, Math.abs(point.y - expected));
  }
  return max;
}

function parseGcodeXYPoints(gcode) {
  return String(gcode).split(/\r?\n/).map(line => {
    const x = line.match(/\bX(-?\d+(?:\.\d+)?)/);
    const y = line.match(/\bY(-?\d+(?:\.\d+)?)/);
    if (!x || !y) return null;
    return { x: Number(x[1]), y: Number(y[1]) };
  }).filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y));
}

const pinShoulderSlope = shoulderSlopePair(uiPinTail);
const roundPinShoulderSlope = shoulderSlopePair(uiRoundPinTail);
const diamondShoulderSlope = shoulderSlopePair(uiDiamondTail);
assert(pinShoulderSlope.left > 0.2 && pinShoulderSlope.right > 0.2, "tail: pin shoulder should remain positively sloped across the shoulder join");
assert(roundPinShoulderSlope.left > 0.2 && roundPinShoulderSlope.right > 0.2, "tail: round pin shoulder should remain positively sloped across the shoulder join");
assert(diamondShoulderSlope.left > 0.2 && diamondShoulderSlope.right > 0.2, "tail: diamond shoulder should remain positively sloped across the shoulder join");
const diamondShoulderX = uiDiamondTail.tipLength * uiDiamondTail.shoulderPos;
const diamondTipDeviation = maxLineDeviation(
  0,
  api._test.tailOuterHalfWidthAt(uiDiamondTail, 0, uiDiamondTail.tipLength),
  diamondShoulderX,
  api._test.tailOuterHalfWidthAt(uiDiamondTail, diamondShoulderX, uiDiamondTail.tipLength),
  x => api._test.tailOuterHalfWidthAt(uiDiamondTail, x, uiDiamondTail.tipLength)
);
const diamondStraightTipDeviation = maxLineDeviation(
  0,
  api._test.tailOuterHalfWidthAt(uiDiamondTail, 0, uiDiamondTail.tipLength),
  diamondShoulderX * 0.8,
  api._test.tailOuterHalfWidthAt(uiDiamondTail, diamondShoulderX * 0.8, uiDiamondTail.tipLength),
  x => api._test.tailOuterHalfWidthAt(uiDiamondTail, x, uiDiamondTail.tipLength)
);
const diamondRailDeviation = maxLineDeviation(
  diamondShoulderX,
  api._test.tailOuterHalfWidthAt(uiDiamondTail, diamondShoulderX, uiDiamondTail.tipLength),
  uiDiamondTail.tipLength,
  api._test.tailOuterHalfWidthAt(uiDiamondTail, uiDiamondTail.tipLength, uiDiamondTail.tipLength),
  x => api._test.tailOuterHalfWidthAt(uiDiamondTail, x, uiDiamondTail.tipLength)
);
assert(diamondStraightTipDeviation < 0.002, "tail: diamond should keep a straight center-tip-to-shoulder edge");
assert(diamondRailDeviation > 0.005, "tail: diamond default rail shoulder should keep curvature");

function defaultTail(sampleFile, mode, linearization = 0) {
  const board = api.parseBrd(fs.readFileSync(path.join(root, sampleFile), "utf8"), `${sampleFile}-${mode}.brd`);
  board.tailMode = mode;
  board.tailLinearization = linearization;
  const tail = api._test.normalizedTailConfig(board);
  const outline = api._test.outlineFullPoints(board);
  return {
    board,
    tail,
    outline,
    effectiveLength: Math.max(...outline.map(point => point.x))
  };
}

const squareDefault = defaultTail("Shortboard.brd", "square");
const squashDefault = defaultTail("Shortboard.brd", "squash");
const roundDefault = defaultTail("Shortboard.brd", "round");
const roundedSquareDefault = defaultTail("Shortboard.brd", "rounded-square");
const diamondDefault = defaultTail("Shortboard.brd", "diamond");
const roundedDiamondDefault = defaultTail("Shortboard.brd", "rounded-diamond");
const gunDefault = defaultTail("Shortboard.brd", "gun");
const longboardGunDefault = defaultTail("Longboard.brd", "gun");
const pinDefault = defaultTail("Shortboard.brd", "pin");
const roundPinDefault = defaultTail("Shortboard.brd", "round-pin");
const rocketDefault = defaultTail("Shortboard.brd", "rocket");
const halfMoonDefault = defaultTail("Shortboard.brd", "half-moon");
const swallowDefault = defaultTail("Shortboard.brd", "swallow");
const fishDefault = defaultTail("Shortboard.brd", "fish");
const splitDefault = defaultTail("Shortboard.brd", "split");
const starDefault = defaultTail("Shortboard.brd", "star");
const batDefault = defaultTail("Shortboard.brd", "bat");
const diamondLinearized = defaultTail("Shortboard.brd", "diamond", 1);
const roundPinLinearized = defaultTail("Shortboard.brd", "round-pin", 1);
const swallowLinearized = defaultTail("Shortboard.brd", "swallow", 1);
const fishLinearized = defaultTail("Shortboard.brd", "fish", 1);
const shortboardNativeDefault = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard.brd");
assert(shortboardNativeDefault.tailMode === "", "tail: Shortboard sample should remain native until a procedural tail is selected");
assert(squashDefault.tail.active === true && squashDefault.tail.mode === "squash", "tail: squash should be available as an independent procedural tail shape");
assert(api._test.normalizeTailModeKey("round square") === "rounded-square", "tail: round square label should normalize to rounded-square");
assert(api._test.normalizeTailModeKey("round squash") === "rounded-square", "tail: round squash label should normalize to rounded-square");
assert(api._test.normalizeTailModeKey("round diamond") === "rounded-diamond", "tail: round diamond label should normalize to rounded-diamond");
assert(api._test.normalizeTailModeKey("rounded pin") === "round-pin", "tail: rounded pin label should normalize to round-pin");
assert(api._test.empiricalTailWidthTarget("fish").legacySplitTailEncoding === true, "tail: fish empirical width target should be marked as legacy split-tail data");
assert(api._test.empiricalTailWidthTarget("round").x70Ratio === 0.143, "tail: round empirical width target should be available");
assert(api._test.empiricalTailWidthTarget("swallow") === null, "tail: swallow has no filename-derived empirical target yet");
assert(Math.abs(squareDefault.tail.length - 5.0) < 1e-9, "tail: square default cut length should use the Fatum square reference preset");
assert(Math.abs(squareDefault.tail.cornerScale - 1.0) < 1e-9, "tail: square transom should terminate exactly on the cut rail width");
assert(Math.abs(pinDefault.tail.length - 35.25) < 1e-9, "tail: pin default length should sit between the current pin and gun reference");
assert(Math.abs(roundPinDefault.tail.length - 32.0) < 1e-9, "tail: round-pin default length should inherit the previous pin preset");
assert(gunDefault.tail.gunRoot && Math.abs(gunDefault.tail.gunRoot.y) < 0.01, "tail: gun should derive its tip from the rail/stringer intersection");
assert(Math.abs(roundPinDefault.tail.tipLength - (roundPinDefault.tail.length * 0.82)) < 1e-9, "tail: round-pin tip ratio should shorten the board relative to the gun baseline");
assert(gunDefault.effectiveLength > pinDefault.effectiveLength && pinDefault.effectiveLength > roundPinDefault.effectiveLength, "tail: gun -> pin -> round-pin effective length order is incorrect");
assert(diamondDefault.effectiveLength > squareDefault.effectiveLength, "tail: diamond should remain longer than a square tail");
assert(swallowDefault.tail.shift > roundPinDefault.tail.shift && fishDefault.tail.shift > swallowDefault.tail.shift, "tail: swallow/fish should shorten the board more aggressively than round-pin");
assert(swallowDefault.tail.depth > 0 && fishDefault.tail.depth > swallowDefault.tail.depth, "tail: swallow/fish default notch depths are not ordered");
assert(gunDefault.effectiveLength >= pinDefault.effectiveLength, "tail: gun should be at least as long as pin on already-pointed source outlines");
assert(pinDefault.effectiveLength > roundPinDefault.effectiveLength, "tail: round-pin should be shorter than pin");
assert(pinDefault.effectiveLength > rocketDefault.effectiveLength && rocketDefault.effectiveLength > roundPinDefault.effectiveLength, "tail: rocket should sit between pin and round-pin in effective length");
assert(squareDefault.effectiveLength < roundedSquareDefault.effectiveLength && roundedSquareDefault.effectiveLength < roundDefault.effectiveLength, "tail: square / rounded square / round length ordering is incorrect");
assert(roundedDiamondDefault.effectiveLength > diamondDefault.effectiveLength, "tail: rounded diamond should keep more length than diamond");
assert(roundPinDefault.effectiveLength > swallowDefault.effectiveLength && swallowDefault.effectiveLength > fishDefault.effectiveLength, "tail: swallow/fish effective outline length ordering is incorrect");
assert(Math.abs(pinDefault.outline[0].y) < 1e-9, "tail: pin outline should start at the tail center point");
assert(Math.abs(roundPinDefault.outline[0].y) < 1e-9, "tail: round pin outline should still start at the tail center point");
assert(Math.abs(roundDefault.outline[0].y) < 1e-9, "tail: round outline should start at the center of a rounded arc, not a straight transom");
assert(roundedSquareDefault.outline[0].y > 0.1, "tail: rounded square outline should start on a finite transom");
assert(Math.abs(diamondDefault.outline[0].y) < 1e-9, "tail: diamond outline should start at one center tip");
assert(Math.abs(roundedDiamondDefault.outline[0].y) < 1e-9, "tail: rounded diamond should retain one center tip");
assert(squareDefault.outline[0].y > 0.1 && Math.abs(squareDefault.outline[0].x) < 1e-9, `tail: square outline should start at the transom corner (${JSON.stringify(squareDefault.outline[0])})`);
assert(halfMoonDefault.tail.notched && halfMoonDefault.tail.capMode, "tail: half moon should use a shallow notched-cap profile");
assert(splitDefault.tail.notched && splitDefault.tail.capMode, "tail: split should preserve the former shallow Star profile");
assert(starDefault.tail.notched && starDefault.tail.capMode, "tail: star should use a notched clipped-tip profile");
assert(batDefault.tail.notched && batDefault.tail.capMode, "tail: bat should use a notched rounded-lobe profile");
assert(starDefault.tail.depth > 0, "tail: star should preserve a measurable scoop depth between its center and outer tips");
assert(batDefault.tail.depth < starDefault.tail.depth * 0.6, "tail: bat scoop should remain distinctly shallower than the star preset");
assert(Math.abs(batDefault.outline[0].x) < 1e-9 && Math.abs(batDefault.outline[0].y) < 1e-9, "tail: bat outline should start at the stringer tail point");
assert(api._test.tailOuterHalfWidthAt(batDefault.tail, 0, batDefault.tail.tipLength) > batDefault.tail.joinY * 0.3, "tail: bat should keep finite lobe width at the tail edge");
assert(Math.abs(squareDefault.outline[0].x) < 1e-9 && squareDefault.outline[0].y > 0.1, "tail: square should remain a transom cut");
assert(Math.abs(swallowDefault.outline[0].x - swallowDefault.tail.depth) < 1e-9, "tail: swallow outline should start at the notch center in display coordinates");
assert(swallowDefault.outline[0].y < 1e-9 && swallowDefault.tail.depth > 0, "tail: swallow should be generated from the reference V-notch geometry, not a square-like legacy BRD transom");
assert(Math.abs(fishDefault.outline[0].x - fishDefault.tail.depth) < 1e-9 && fishDefault.outline[0].y < 1e-9, "tail: fish should be generated from the reference split-tail geometry, not a square-like legacy BRD transom");
const swallowCornerWidth = api._test.tailOuterHalfWidthAt(swallowDefault.tail, 0, swallowDefault.tail.length);
assert(swallowCornerWidth > 0 && swallowCornerWidth < swallowDefault.tail.joinY, "tail: swallow corner width should be narrower than the rail join width");
assert(swallowCornerWidth < swallowDefault.tail.joinY * 0.53, "tail: swallow default corner width should stay about 20% narrower than the earlier wide setting");
const fishCornerWidthForOrder = api._test.tailOuterHalfWidthAt(fishDefault.tail, 0, fishDefault.tail.length);
assert(fishCornerWidthForOrder > swallowCornerWidth, "tail: fish should keep a wider tail end than swallow");
const fishWidthLandmarks = api._test.boardCadTailWidthLandmarks(fishDefault.board);
assert(fishWidthLandmarks.target.x70Ratio === 0.145, "tail: fish width landmarks should include the empirical target");
assert(fishWidthLandmarks.target.legacySplitTailEncoding === true, "tail: fish landmarks should not be treated as direct split-tail fit targets");
const fishPlanformForCurve = api._test.boardCadTailPlanform(fishDefault.board);
const fishInnerMid = cubicPoint(
  fishPlanformForCurve.positiveSpline[0].p,
  fishPlanformForCurve.positiveSpline[0].next,
  fishPlanformForCurve.positiveSpline[1].prev,
  fishPlanformForCurve.positiveSpline[1].p,
  0.5
);
const fishInnerMidY = fishInnerMid.y;
assert(fishInnerMidY > fishCornerWidthForOrder * 0.24 && fishInnerMidY < fishCornerWidthForOrder * 0.72, "tail: fish inner curve should accelerate from the deep notch toward the tip");
const fishInnerChordDeviation = maxBezierChordDeviation(
  fishPlanformForCurve.positiveSpline[0].p,
  fishPlanformForCurve.positiveSpline[0].next,
  fishPlanformForCurve.positiveSpline[1].prev,
  fishPlanformForCurve.positiveSpline[1].p
);
assert(fishInnerChordDeviation > fishCornerWidthForOrder * 0.025, "tail: fish notch interior must be visibly curved rather than chord-like");
const roundPlanform = api._test.boardCadTailPlanform(roundDefault.board);
const squarePlanform = api._test.boardCadTailPlanform(squareDefault.board);
const squashPlanform = api._test.boardCadTailPlanform(squashDefault.board);
const pinPlanform = api._test.boardCadTailPlanform(pinDefault.board);
const roundPinPlanform = api._test.boardCadTailPlanform(roundPinDefault.board);
const rocketPlanform = api._test.boardCadTailPlanform(rocketDefault.board);
const roundedSquarePlanform = api._test.boardCadTailPlanform(roundedSquareDefault.board);
const gunPlanform = api._test.boardCadTailPlanform(gunDefault.board);
const longboardGunPlanform = api._test.boardCadTailPlanform(longboardGunDefault.board);
const roundMeasurements = api._test.canonicalTailMeasurements(roundDefault.board);
const roundPinMeasurements = api._test.canonicalTailMeasurements(roundPinDefault.board);
const pinMeasurements = api._test.canonicalTailMeasurements(pinDefault.board);
const gunMeasurements = api._test.canonicalTailMeasurements(gunDefault.board);
assert(roundMeasurements.topology === "tail.solid_rounded", "tail family: round topology mismatch");
assert(roundPinMeasurements.topology === "tail.solid_pointed" && pinMeasurements.topology === "tail.solid_pointed" && gunMeasurements.topology === "tail.solid_pointed", "tail family: pointed topology mismatch");
assert(gunMeasurements.pullInLength > pinMeasurements.pullInLength && pinMeasurements.pullInLength > roundPinMeasurements.pullInLength && roundPinMeasurements.pullInLength > roundMeasurements.pullInLength, "tail family: pull-in length should progress from round through gun");
assert([roundMeasurements, roundPinMeasurements].every(item => item.tipRadius === null || item.tipRadius > 0), "tail family: smooth tip radius measurements must be finite and positive");
assert(pinMeasurements.tipRadius === null && gunMeasurements.tipRadius === null, "tail family: pointed pin/gun cusps must not report a misleading smooth tip radius");
assert(pinMeasurements.terminalContinuity === "G0-cusp" && roundPinMeasurements.terminalContinuity === "smooth-turnaround", "tail family: pin and round-pin terminal continuity should remain distinct");
assert([roundMeasurements, roundPinMeasurements, pinMeasurements, gunMeasurements].every(item => item.terminalKind === "center-tip"), "tail family: centered terminal CP classification mismatch");
const halfMoonPlanform = api._test.boardCadTailPlanform(halfMoonDefault.board);
const swallowPlanform = api._test.boardCadTailPlanform(swallowDefault.board);
const splitPlanform = api._test.boardCadTailPlanform(splitDefault.board);
const batPlanform = api._test.boardCadTailPlanform(batDefault.board);
const starPlanform = api._test.boardCadTailPlanform(starDefault.board);
const swallowMeasurements = api._test.canonicalTailMeasurements(swallowDefault.board);
const fishMeasurements = api._test.canonicalTailMeasurements(fishDefault.board);
const splitMeasurements = api._test.canonicalTailMeasurements(splitDefault.board);
const halfMoonMeasurements = api._test.canonicalTailMeasurements(halfMoonDefault.board);
assert([swallowMeasurements, fishMeasurements, splitMeasurements, halfMoonMeasurements].every(item => item.topology === "tail.center_notched" && item.terminalKind === "notched"), "tail notch family: topology mismatch");
assert(fishMeasurements.notchDepth > swallowMeasurements.notchDepth && swallowMeasurements.notchDepth > splitMeasurements.notchDepth, "tail notch family: fish/swallow/split notch depth ordering mismatch");
assert(fishMeasurements.tipSeparation > swallowMeasurements.tipSeparation, "tail notch family: fish should resolve as a wider swallow preset");
assert(halfMoonMeasurements.notchDepth > 0 && halfMoonMeasurements.tipSeparation > 0, "tail notch family: half-moon measurements are incomplete");
const roundTailKnots = roundPlanform.positiveSpline.filter(knot => knot.p.x <= roundDefault.tail.tipLength + 1e-6).length;
const pinTailKnots = pinPlanform.positiveSpline.filter(knot => knot.p.x <= pinDefault.tail.tipLength + 1e-6).length;
const roundPinTailKnots = roundPinPlanform.positiveSpline.filter(knot => knot.p.x <= roundPinDefault.tail.tipLength + 1e-6).length;
const rocketTailKnots = rocketPlanform.positiveSpline.filter(knot => knot.p.x <= rocketDefault.tail.tipLength + 1e-6).length;
const squashTailKnots = squashPlanform.positiveSpline.filter(knot => knot.p.x <= squashDefault.tail.tipLength + 1e-6).length;
const squareInteriorTailKnots = squarePlanform.positiveSpline.filter(knot => knot.p.x > 1e-6 && knot.p.x < squareDefault.tail.tipLength - 1e-6).length;
assert(Math.abs((squarePlanform.positive[0].y / squareDefault.tail.joinY) - 1.0) < 1e-6, "tail: square transom width should equal the rail width at the cut station");
assert(squareInteriorTailKnots === 0, "tail: square should use one cubic rail span without a redundant shoulder CP");
assert(squarePlanform.positiveSpline[0].next.x > squarePlanform.positiveSpline[0].p.x, "tail: square terminal CP should retain control of the source rail curve");
assert(Math.abs((roundedSquarePlanform.positive[0].y / roundedSquareDefault.tail.joinY) - 0.86) < 1e-6, "tail: rounded square transom width should stay wider than squash before corner rounding");
const squareTransomRatio = squarePlanform.positive[0].y / squareDefault.tail.joinY;
const roundedSquareTransomRatio = roundedSquarePlanform.positive[0].y / roundedSquareDefault.tail.joinY;
assert(squareTransomRatio > roundedSquareTransomRatio, "tail: square transom should remain broader than rounded-square before corner rounding");
assert(roundedSquarePlanform.positiveSpline[0].p.y > roundedSquareDefault.tail.joinY * 0.7, "tail: rounded-square should retain a finite straight pod before the rounded corner");
assert(roundedSquarePlanform.positiveSpline[0].next.x > roundedSquarePlanform.positiveSpline[0].p.x, "tail: rounded-square should round from the pod corner, not start like a centered round tail");
assert(roundedSquarePlanform.positiveSpline.filter(knot => knot.p.x <= roundedSquareDefault.tail.tipLength + 1e-6).length === 2, "tail: rounded-square should use one cubic corner-to-rail span");
const roundedSquareMeasurements = api._test.canonicalTailMeasurements(roundedSquareDefault.board);
assert(roundedSquareMeasurements.terminalKind === "finite-pod" && roundedSquareMeasurements.tipPodWidth > 0, "tail: rounded-square must retain a measurable straight pod");
const squashPodMid = cubicPoint(
  squashPlanform.positiveSpline[0].p,
  squashPlanform.positiveSpline[0].next,
  squashPlanform.positiveSpline[1].prev,
  squashPlanform.positiveSpline[1].p,
  0.5
);
assert(Math.abs(squashPlanform.positiveSpline[0].p.y) < 1e-9, "tail: squash spline should start on the stringer rather than at a square corner");
assert(Math.abs(squashPlanform.positiveSpline[0].next.x - squashPlanform.positiveSpline[0].p.x) < 1e-9 && squashPlanform.positiveSpline[0].next.y > squashPlanform.positiveSpline[0].p.y, "tail: squash pod should start with a vertical tangent");
assert(squashPodMid.y / squashDefault.tail.joinY > 0.3, "tail: squash initial pod segment should rise from the stringer like the Shortboard reference");
assert(squashTailKnots === 3, "tail: squash should keep terminal, curvature-transition, and rail-join semantic CPs");
assert(Math.abs((squashPlanform.positiveSpline[1].p.x / squashDefault.tail.tipLength) - 0.1588) < 0.002, "tail: squash curvature-transition CP should match the reference x ratio");
assert(Math.abs((squashPlanform.positiveSpline[1].p.y / squashDefault.tail.joinY) - 0.542) < 0.002, "tail: squash curvature-transition CP should match the reference width ratio");
assert(squashDefault.tail.length < roundDefault.tail.length, "tail: squash should remain a short square-family tail cut, not use the full round-tail cut length");
let squashReferenceMaxDelta = 0;
let squashReferenceSumDelta = 0;
for (let i = 0; i <= 24; i++) {
  const rawX = squashDefault.tail.rawJoinX * i / 24;
  const nativeY = api._test.boardCadSplineValueAt(shortboardNativeDefault.outline, rawX);
  const generatedY = api._test.boardCadDisplayWidthAtPos(squashDefault.board, rawX - squashDefault.tail.shift) / 2;
  const delta = Math.abs(generatedY - nativeY);
  squashReferenceMaxDelta = Math.max(squashReferenceMaxDelta, delta);
  squashReferenceSumDelta += delta;
}
assert(squashReferenceMaxDelta < 0.12, `tail: procedural squash should stay close to the native Shortboard squash outline (${squashReferenceMaxDelta})`);
assert((squashReferenceSumDelta / 25) < 0.05, `tail: procedural squash average deviation from the native Shortboard squash outline should stay small (${squashReferenceSumDelta / 25})`);
assert(roundTailKnots === 2, "tail: round tail should be represented by a single cubic segment");
assert(pinTailKnots === 2, "tail: pin tail should use one cubic segment with exponential curvature growth");
assert(roundPinTailKnots === 2, "tail: round-pin tail should use one cubic segment with exponential curvature growth");
assert(rocketTailKnots === 2, "tail: rocket tail should use one cubic segment with exponential curvature growth");
assert(Math.abs(roundPlanform.positiveSpline[0].next.x - roundPlanform.positiveSpline[0].p.x) < 1e-9 && roundPlanform.positiveSpline[0].next.y > roundPlanform.positiveSpline[0].p.y, "tail: round tail should start with a vertical tangent, not a flat transom");
assert(cubicCurvatureSigns(
  roundPlanform.positiveSpline[0].p,
  roundPlanform.positiveSpline[0].next,
  roundPlanform.positiveSpline[1].prev,
  roundPlanform.positiveSpline[1].p
).length === 1, "tail: round tail should be a single arc without an S-curve inflection");
assert(cubicCurvatureSigns(
  pinPlanform.positiveSpline[0].p,
  pinPlanform.positiveSpline[0].next,
  pinPlanform.positiveSpline[1].prev,
  pinPlanform.positiveSpline[1].p
).length === 1, "tail: pin tail should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  roundPinPlanform.positiveSpline[0].p,
  roundPinPlanform.positiveSpline[0].next,
  roundPinPlanform.positiveSpline[1].prev,
  roundPinPlanform.positiveSpline[1].p
).length === 1, "tail: round-pin tail should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  rocketPlanform.positiveSpline[0].p,
  rocketPlanform.positiveSpline[0].next,
  rocketPlanform.positiveSpline[1].prev,
  rocketPlanform.positiveSpline[1].p
).length === 1, "tail: rocket tail should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  squashPlanform.positiveSpline[0].p,
  squashPlanform.positiveSpline[0].next,
  squashPlanform.positiveSpline[1].prev,
  squashPlanform.positiveSpline[1].p
).length === 1, "tail: squash initial pod segment should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  squashPlanform.positiveSpline[1].p,
  squashPlanform.positiveSpline[1].next,
  squashPlanform.positiveSpline[2].prev,
  squashPlanform.positiveSpline[2].p
).length === 1, "tail: squash rail segment should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  roundedSquarePlanform.positiveSpline[0].p,
  roundedSquarePlanform.positiveSpline[0].next,
  roundedSquarePlanform.positiveSpline[1].prev,
  roundedSquarePlanform.positiveSpline[1].p
).length === 1, "tail: rounded-square tail should be a single arc without an S-curve inflection");
assert(cubicCurvatureSigns(
  gunPlanform.positiveSpline[0].p,
  gunPlanform.positiveSpline[0].next,
  gunPlanform.positiveSpline[1].prev,
  gunPlanform.positiveSpline[1].p
).length === 1, "tail: gun tail should be a single arc without an S-curve inflection");
assert(cubicCurvatureSigns(
  gunPlanform.positiveSpline[0].p,
  gunPlanform.positiveSpline[0].next,
  gunPlanform.positiveSpline[1].prev,
  gunPlanform.positiveSpline[1].p
)[0] === -1, "tail: gun tail curvature should turn the same direction as pin/round-pin tails");
assert(gunPlanform.positiveSpline[0].next.x > gunPlanform.positiveSpline[0].p.x && gunPlanform.positiveSpline[0].next.y > 0, "tail: gun point handle should fold back into the board to form a cusp");
assert(pinPlanform.positiveSpline[0].next.x > pinPlanform.positiveSpline[0].p.x, "tail: pin point handle should fold back into the board to form a cusp");
assert(Math.abs(roundPinPlanform.positiveSpline[0].next.x - roundPinPlanform.positiveSpline[0].p.x) < 1e-9, "tail: round-pin terminal should remain smooth instead of using a cusp");
const gunJoinIncomingSlope = splineSegmentEndSlope(gunPlanform.positiveSpline, 1);
const gunJoin = gunPlanform.positiveSpline[1];
const gunJoinOutgoingSlope = (gunJoin.next.y - gunJoin.p.y) / Math.max(1e-9, gunJoin.next.x - gunJoin.p.x);
assert(Math.abs(gunJoinIncomingSlope - gunJoinOutgoingSlope) < 1e-9, `tail: gun should be G1 at the next authored outline CP (${gunJoinIncomingSlope} vs ${gunJoinOutgoingSlope})`);
assert(gunJoin.p.x > gunDefault.tail.tipLength + 1, "tail: gun should remove the procedural cut-station CP and merge at the next authored outline CP");
assert(Math.abs(gunJoin.p.y - Math.max(...gunPlanform.baseHalf.map(point => point.y))) < 1e-4, "tail: gun arc should connect its terminal point directly to the maximum-width landmark");
assert(longboardGunPlanform.positive.every(point => point.y >= -1e-6), "tail: longboard gun upper outline must not cross the centerline and create a doubled line");
assert(longboardGunPlanform.positiveSpline.every((knot, index, knots) => index === 0 || knot.p.x >= knots[index - 1].p.x - 1e-6), "tail: longboard gun anchors must remain monotonic from tail to nose");
assert(Math.max(...longboardGunPlanform.positive.map(point => point.y)) <= (longboardGunDefault.board.width * 0.52), "tail: longboard gun join handle must not overshoot the source outline width");
assert(halfMoonPlanform.positiveSpline.length >= 3, "tail: half moon should use a dedicated rounded notch/corner/rail spline");
assert(Math.abs(halfMoonPlanform.positiveSpline[0].p.x - halfMoonDefault.tail.depth) < 1e-9 && Math.abs(halfMoonPlanform.positiveSpline[0].p.y) < 1e-9, "tail: half moon should start at the recessed stringer notch");
assert(Math.abs(halfMoonPlanform.positiveSpline[0].next.x - halfMoonPlanform.positiveSpline[0].p.x) < 1e-9, "tail: half moon notch should start with a rounded vertical tangent");
assert(Math.abs(halfMoonPlanform.positiveSpline[1].p.x) < 1e-9 && halfMoonPlanform.positiveSpline[1].p.y > 0, "tail: half moon should pass through a tail-side lobe");
assert(Math.abs(splineSegmentEndSlope(halfMoonPlanform.positiveSpline, 2) - halfMoonDefault.tail.joinSlope) < 1e-9, "tail: half moon should rejoin with the original rail tangent");
assert(cubicCurvatureSigns(
  halfMoonPlanform.positiveSpline[0].p,
  halfMoonPlanform.positiveSpline[0].next,
  halfMoonPlanform.positiveSpline[1].prev,
  halfMoonPlanform.positiveSpline[1].p
).length === 1, "tail: half moon notch segment should not introduce an S-curve inflection");
assert(Math.abs(batPlanform.positiveSpline[0].p.x) < 1e-9 && Math.abs(batPlanform.positiveSpline[0].p.y) < 1e-9, "tail: bat should keep a protruding stringer point at the tail edge");
assert(splitPlanform.positiveSpline.length >= 3, "tail: split should use a dedicated notch/corner/rail spline");
assert(Math.abs(splitPlanform.positiveSpline[0].p.x - splitDefault.tail.depth) < 1e-9 && Math.abs(splitPlanform.positiveSpline[0].p.y) < 1e-9, "tail: split should start at the notch center");
assert(Math.abs(splitPlanform.positiveSpline[1].p.x) < 1e-9 && splitPlanform.positiveSpline[1].p.y > 0, "tail: split should pass through a tail-side corner");
assert(Math.abs(splineSegmentEndSlope(splitPlanform.positiveSpline, 2) - splitDefault.tail.joinSlope) < 1e-9, "tail: split should rejoin with the original rail tangent");
assert(cubicCurvatureSigns(
  splitPlanform.positiveSpline[0].p,
  splitPlanform.positiveSpline[0].next,
  splitPlanform.positiveSpline[1].prev,
  splitPlanform.positiveSpline[1].p
).length === 1, "tail: split notch segment should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  splitPlanform.positiveSpline[1].p,
  splitPlanform.positiveSpline[1].next,
  splitPlanform.positiveSpline[2].prev,
  splitPlanform.positiveSpline[2].p
).length === 1, "tail: split rail segment should not introduce an S-curve inflection");
assert(batPlanform.positiveSpline.length >= 3, "tail: bat should use stringer tip, square corner, and rail join landmarks");
assert(batPlanform.positiveSpline[0].next.x > batPlanform.positiveSpline[0].p.x && batPlanform.positiveSpline[1].prev.x > batPlanform.positiveSpline[1].p.x, "tail: bat should bow one circular cut forward between the stringer tip and square corner");
assert(Math.abs(batPlanform.positiveSpline[1].p.x) < 1e-9, "tail: bat square corner should remain on the straight transom datum");
assert(batPlanform.positiveSpline[2].p.x > batPlanform.positiveSpline[1].p.x && batPlanform.positiveSpline[2].p.y > batPlanform.positiveSpline[1].p.y, "tail: bat square corner should reconnect outward toward the body rail");
assert(Math.abs(batPlanform.positiveSpline[1].p.y - squarePlanform.positiveSpline[0].p.y) < 1e-6, "tail: bat terminal corner width should match the square-tail transom width on the same board");
assert(batPlanform.positiveSpline[1].prev.x > batPlanform.positiveSpline[1].p.x && batPlanform.positiveSpline[1].next.x > batPlanform.positiveSpline[1].p.x, "tail: bat square corner handles should retain the intentional release cusp");
assert(Math.hypot(
  batPlanform.positiveSpline[1].next.x - batPlanform.positiveSpline[1].p.x,
  batPlanform.positiveSpline[1].next.y - batPlanform.positiveSpline[1].p.y
) < Math.hypot(
  batPlanform.positiveSpline[2].p.x - batPlanform.positiveSpline[1].p.x,
  batPlanform.positiveSpline[2].p.y - batPlanform.positiveSpline[1].p.y
) * 0.16, "tail: bat square-corner outgoing handle should stay short enough to avoid a terminal flare");
const batOutgoingDx = batPlanform.positiveSpline[1].next.x - batPlanform.positiveSpline[1].p.x;
const batOutgoingDy = batPlanform.positiveSpline[1].next.y - batPlanform.positiveSpline[1].p.y;
assert(Math.abs((batOutgoingDy / batOutgoingDx) - batDefault.tail.sourceTipSlope) < 1e-9, "tail: bat square-corner outgoing handle should inherit the source-outline tangent");
assert(Math.abs(batDefault.tail.shift - squareDefault.tail.rawJoinX) < 1e-6, "tail: bat terminal datum should match the square-tail cut station");
assert(Math.abs(splineSegmentEndSlope(batPlanform.positiveSpline, 2) - batDefault.tail.joinSlope) < 1e-9, "tail: bat should rejoin with the original rail tangent");
assert(starPlanform.positiveSpline.length >= 3, "tail: star should use center tip, diamond corner, and rail join landmarks");
assert(Math.abs(starPlanform.positiveSpline[0].p.x) < 1e-9 && Math.abs(starPlanform.positiveSpline[0].p.y) < 1e-9, "tail: star should retain one center tooth tip");
assert(starPlanform.positiveSpline[1].p.x > 0 && starPlanform.positiveSpline[1].p.y > 0, "tail: star should run from its center point to one forward diamond corner per side");
assert(starPlanform.positiveSpline[1].p.x >= starDefault.tail.tipLength * 0.84, "tail: star diamond corner should sit far enough forward to accentuate the stringer point");
const adjustableStar = defaultTail("Shortboard.brd", "star");
adjustableStar.board.tailShoulderPos = 0.6;
const adjustableStarPlanform = api._test.boardCadTailPlanform(adjustableStar.board);
assert(adjustableStarPlanform.positiveSpline[1].p.x < starPlanform.positiveSpline[1].p.x * 0.75, "tail: star corner position control should move the diamond corner fore and aft");
const starReverseMid = cubicPoint(starPlanform.positiveSpline[0].p, starPlanform.positiveSpline[0].next, starPlanform.positiveSpline[1].prev, starPlanform.positiveSpline[1].p, 0.5);
assert(starReverseMid.y < starPlanform.positiveSpline[1].p.y * 0.5, "tail: star center-to-corner side should reverse inward from the straight diamond chord");
assert(starPlanform.positiveSpline[2].p.x > starPlanform.positiveSpline[1].p.x && starPlanform.positiveSpline[2].p.y > starPlanform.positiveSpline[1].p.y, "tail: star diamond corner should reconnect outward toward the body rail");
assert(Math.abs(splineSegmentEndSlope(starPlanform.positiveSpline, 2) - starDefault.tail.joinSlope) < 1e-9, "tail: star should rejoin with the original rail tangent");
assert(Math.abs(splineSegmentEndSlope(roundPlanform.positiveSpline, 1) - roundDefault.tail.joinSlope) < 1e-9, "tail: round tail should rejoin with the original rail tangent");
assert(Math.abs(splineSegmentEndSlope(pinPlanform.positiveSpline, 1) - pinDefault.tail.joinSlope) < 1e-9, "tail: pin tail should rejoin with the original rail tangent");
assert(Math.abs(splineSegmentEndSlope(rocketPlanform.positiveSpline, 1) - rocketDefault.tail.joinSlope) < 1e-9, "tail: rocket tail should rejoin with the original rail tangent");
assert(Math.abs(roundPinPlanform.positiveSpline[0].next.x - roundPinPlanform.positiveSpline[0].p.x) < 1e-9 && roundPinPlanform.positiveSpline[0].next.y > roundPinPlanform.positiveSpline[0].p.y, "tail: round-pin should rise from the pointed tip with a near-vertical tangent");
assert(Math.abs(splineSegmentEndSlope(roundPinPlanform.positiveSpline, 1) - roundPinDefault.tail.joinSlope) < 1e-9, "tail: round-pin should rejoin with the original rail tangent");
const pinTipCurvature = cubicCurvatureMagnitude(
  pinPlanform.positiveSpline[0].p,
  pinPlanform.positiveSpline[0].next,
  pinPlanform.positiveSpline[1].prev,
  pinPlanform.positiveSpline[1].p,
  0.12
);
const pinRailCurvature = cubicCurvatureMagnitude(
  pinPlanform.positiveSpline[0].p,
  pinPlanform.positiveSpline[0].next,
  pinPlanform.positiveSpline[1].prev,
  pinPlanform.positiveSpline[1].p,
  0.95
);
const roundPinTipCurvature = cubicCurvatureMagnitude(
  roundPinPlanform.positiveSpline[0].p,
  roundPinPlanform.positiveSpline[0].next,
  roundPinPlanform.positiveSpline[1].prev,
  roundPinPlanform.positiveSpline[1].p,
  0.12
);
const roundPinRailCurvature = cubicCurvatureMagnitude(
  roundPinPlanform.positiveSpline[0].p,
  roundPinPlanform.positiveSpline[0].next,
  roundPinPlanform.positiveSpline[1].prev,
  roundPinPlanform.positiveSpline[1].p,
  0.95
);
assert(Number.isFinite(pinTipCurvature) && Number.isFinite(pinRailCurvature), "tail: each side of the pin cusp should retain finite fair curvature");
assert(roundPinTipCurvature > roundPinRailCurvature * 5, "tail: round-pin curvature should grow strongly toward the tail tip");
const swallowOuterCurveSamples = swallowPlanform.positive.filter(point => point.x > 0 && point.x < swallowDefault.tail.length && point.y > (swallowCornerWidth * 0.98));
assert(swallowOuterCurveSamples.length >= 6, "tail: swallow outer rail should be sampled as a curve, not collapsed to a straight edge");
assert(Math.abs(swallowPlanform.positiveSpline[0].p.x - swallowDefault.tail.depth) < 1e-9, "tail: swallow spline should start at the notch center");
assert(Math.abs(swallowPlanform.positiveSpline[1].p.x) < 1e-9, "tail: swallow spline should pass through the tail corner");
assert(Math.abs(swallowPlanform.positiveSpline[2].p.x - swallowDefault.tail.length) < 1e-9, "tail: swallow spline should rejoin the outline at the body join");
const swallowNotchDeviation = maxLineDeviation(
  swallowPlanform.positiveSpline[0].p.x,
  swallowPlanform.positiveSpline[0].p.y,
  swallowPlanform.positiveSpline[1].p.x,
  swallowPlanform.positiveSpline[1].p.y,
  x => cubicPoint(
    swallowPlanform.positiveSpline[0].p,
    swallowPlanform.positiveSpline[0].next,
    swallowPlanform.positiveSpline[1].prev,
    swallowPlanform.positiveSpline[1].p,
    Math.max(0, Math.min(1, (swallowPlanform.positiveSpline[0].p.x - x) / Math.max(1e-9, swallowPlanform.positiveSpline[0].p.x - swallowPlanform.positiveSpline[1].p.x)))
  ).y
);
const swallowRailDeviation = maxLineDeviation(
  swallowPlanform.positiveSpline[1].p.x,
  swallowPlanform.positiveSpline[1].p.y,
  swallowPlanform.positiveSpline[2].p.x,
  swallowPlanform.positiveSpline[2].p.y,
  x => cubicPoint(
    swallowPlanform.positiveSpline[1].p,
    swallowPlanform.positiveSpline[1].next,
    swallowPlanform.positiveSpline[2].prev,
    swallowPlanform.positiveSpline[2].p,
    Math.max(0, Math.min(1, (x - swallowPlanform.positiveSpline[1].p.x) / Math.max(1e-9, swallowPlanform.positiveSpline[2].p.x - swallowPlanform.positiveSpline[1].p.x)))
  ).y
);
assert(swallowNotchDeviation > 0.01 && swallowNotchDeviation < swallowCornerWidth * 0.04, "tail: swallow notch should be lightly curved, not a perfectly straight cut");
assert(swallowRailDeviation > 0.01 && swallowRailDeviation < swallowDefault.tail.joinY * 0.06, "tail: swallow rail should keep reduced curvature rather than a straight edge");
assert(cubicCurvatureSigns(
  swallowPlanform.positiveSpline[0].p,
  swallowPlanform.positiveSpline[0].next,
  swallowPlanform.positiveSpline[1].prev,
  swallowPlanform.positiveSpline[1].p
).length === 1, "tail: swallow notch segment should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  swallowPlanform.positiveSpline[1].p,
  swallowPlanform.positiveSpline[1].next,
  swallowPlanform.positiveSpline[2].prev,
  swallowPlanform.positiveSpline[2].p
).length === 1, "tail: swallow rail segment should not introduce an S-curve inflection");
const swallowInnerDeviation = maxLineDeviation(
  0,
  api._test.tailInnerHalfWidthAt(swallowDefault.tail, 0),
  swallowDefault.tail.depth,
  0,
  x => api._test.tailInnerHalfWidthAt(swallowDefault.tail, x)
);
const swallowLinearInnerDeviation = maxLineDeviation(
  0,
  api._test.tailInnerHalfWidthAt(swallowLinearized.tail, 0),
  swallowLinearized.tail.depth,
  0,
  x => api._test.tailInnerHalfWidthAt(swallowLinearized.tail, x)
);
assert(swallowInnerDeviation > swallowLinearInnerDeviation + 0.01, "tail: swallow default should stay more curved than the fully linearized notch");
const diamondLinearTipDeviation = maxLineDeviation(
  0,
  api._test.tailOuterHalfWidthAt(diamondLinearized.tail, 0, diamondLinearized.tail.tipLength),
  diamondLinearized.tail.tipLength * diamondLinearized.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(diamondLinearized.tail, diamondLinearized.tail.tipLength * diamondLinearized.tail.shoulderPos, diamondLinearized.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(diamondLinearized.tail, x, diamondLinearized.tail.tipLength)
);
assert(diamondLinearTipDeviation <= diamondTipDeviation + 1e-9, "tail: diamond linearization should not make the center-tip edge less straight");
const diamondLinearRailDeviation = maxLineDeviation(
  diamondLinearized.tail.tipLength * diamondLinearized.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(diamondLinearized.tail, diamondLinearized.tail.tipLength * diamondLinearized.tail.shoulderPos, diamondLinearized.tail.tipLength),
  diamondLinearized.tail.tipLength,
  api._test.tailOuterHalfWidthAt(diamondLinearized.tail, diamondLinearized.tail.tipLength, diamondLinearized.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(diamondLinearized.tail, x, diamondLinearized.tail.tipLength)
);
assert(diamondRailDeviation > diamondLinearRailDeviation + 0.02, "tail: diamond default should keep a rounded shoulder transition instead of collapsing to a hard line");
const diamondDefaultTipDeviation = maxLineDeviation(
  0,
  api._test.tailOuterHalfWidthAt(diamondDefault.tail, 0, diamondDefault.tail.tipLength),
  diamondDefault.tail.tipLength * diamondDefault.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(diamondDefault.tail, diamondDefault.tail.tipLength * diamondDefault.tail.shoulderPos, diamondDefault.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(diamondDefault.tail, x, diamondDefault.tail.tipLength)
);
const diamondDefaultRailDeviation = maxLineDeviation(
  diamondDefault.tail.tipLength * diamondDefault.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(diamondDefault.tail, diamondDefault.tail.tipLength * diamondDefault.tail.shoulderPos, diamondDefault.tail.tipLength),
  diamondDefault.tail.tipLength,
  api._test.tailOuterHalfWidthAt(diamondDefault.tail, diamondDefault.tail.tipLength, diamondDefault.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(diamondDefault.tail, x, diamondDefault.tail.tipLength)
);
const diamondPlanform = api._test.boardCadTailPlanform(diamondDefault.board);
const roundedDiamondPlanform = api._test.boardCadTailPlanform(roundedDiamondDefault.board);
const diamondTailKnots = diamondPlanform.positiveSpline.filter(knot => knot.p.x <= diamondDefault.tail.tipLength + 1e-6).length;
const roundedDiamondTailKnots = roundedDiamondPlanform.positiveSpline.filter(knot => knot.p.x <= roundedDiamondDefault.tail.tipLength + 1e-6).length;
assert(diamondTailKnots === 3, "tail: diamond tail should use two cubic segments with one shoulder knot");
assert(roundedDiamondTailKnots === 3, "tail: rounded diamond tail should use two cubic segments with one shoulder knot");
assert(Math.abs(splineSegmentEndSlope(diamondPlanform.positiveSpline, 2) - diamondDefault.tail.joinSlope) < 1e-9, "tail: diamond tail should rejoin with the original rail tangent");
assert(Math.abs(splineSegmentEndSlope(roundedDiamondPlanform.positiveSpline, 2) - roundedDiamondDefault.tail.joinSlope) < 1e-9, "tail: rounded diamond tail should rejoin with the original rail tangent");
assert(cubicCurvatureSigns(
  diamondPlanform.positiveSpline[1].p,
  diamondPlanform.positiveSpline[1].next,
  diamondPlanform.positiveSpline[2].prev,
  diamondPlanform.positiveSpline[2].p
).length === 1, "tail: diamond rail transition should not introduce an S-curve inflection");
const roundedDiamondTipCurvatureSigns = cubicCurvatureSigns(
  roundedDiamondPlanform.positiveSpline[0].p,
  roundedDiamondPlanform.positiveSpline[0].next,
  roundedDiamondPlanform.positiveSpline[1].prev,
  roundedDiamondPlanform.positiveSpline[1].p
);
assert(roundedDiamondTipCurvatureSigns.length <= 1, `tail: rounded diamond tip transition should not introduce an S-curve inflection (${roundedDiamondTipCurvatureSigns})`);
assert(cubicCurvatureSigns(
  roundedDiamondPlanform.positiveSpline[1].p,
  roundedDiamondPlanform.positiveSpline[1].next,
  roundedDiamondPlanform.positiveSpline[2].prev,
  roundedDiamondPlanform.positiveSpline[2].p
).length === 1, "tail: rounded diamond rail transition should not introduce an S-curve inflection");
const roundedDiamondTipDeviation = maxLineDeviation(
  0,
  api._test.tailOuterHalfWidthAt(roundedDiamondDefault.tail, 0, roundedDiamondDefault.tail.tipLength),
  roundedDiamondDefault.tail.tipLength * roundedDiamondDefault.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(roundedDiamondDefault.tail, roundedDiamondDefault.tail.tipLength * roundedDiamondDefault.tail.shoulderPos, roundedDiamondDefault.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(roundedDiamondDefault.tail, x, roundedDiamondDefault.tail.tipLength)
);
const roundedDiamondRailDeviation = maxLineDeviation(
  roundedDiamondDefault.tail.tipLength * roundedDiamondDefault.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(roundedDiamondDefault.tail, roundedDiamondDefault.tail.tipLength * roundedDiamondDefault.tail.shoulderPos, roundedDiamondDefault.tail.tipLength),
  roundedDiamondDefault.tail.tipLength,
  api._test.tailOuterHalfWidthAt(roundedDiamondDefault.tail, roundedDiamondDefault.tail.tipLength, roundedDiamondDefault.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(roundedDiamondDefault.tail, x, roundedDiamondDefault.tail.tipLength)
);
assert(roundedDiamondTipDeviation > diamondDefaultTipDeviation, "tail: rounded diamond should soften the center-tip transition more than diamond");
assert(roundedDiamondRailDeviation > diamondDefaultRailDeviation, "tail: rounded diamond should soften the shoulder more than diamond");
const roundPinRailDeviation = maxLineDeviation(
  roundPinDefault.tail.tipLength * roundPinDefault.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(roundPinDefault.tail, roundPinDefault.tail.tipLength * roundPinDefault.tail.shoulderPos, roundPinDefault.tail.tipLength),
  roundPinDefault.tail.tipLength,
  api._test.tailOuterHalfWidthAt(roundPinDefault.tail, roundPinDefault.tail.tipLength, roundPinDefault.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(roundPinDefault.tail, x, roundPinDefault.tail.tipLength)
);
const roundPinLinearRailDeviation = maxLineDeviation(
  roundPinLinearized.tail.tipLength * roundPinLinearized.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(roundPinLinearized.tail, roundPinLinearized.tail.tipLength * roundPinLinearized.tail.shoulderPos, roundPinLinearized.tail.tipLength),
  roundPinLinearized.tail.tipLength,
  api._test.tailOuterHalfWidthAt(roundPinLinearized.tail, roundPinLinearized.tail.tipLength, roundPinLinearized.tail.tipLength),
  x => api._test.tailOuterHalfWidthAt(roundPinLinearized.tail, x, roundPinLinearized.tail.tipLength)
);
assert(roundPinRailDeviation > roundPinLinearRailDeviation + 0.2, "tail: round-pin default should keep a curved shoulder-to-rail segment");
const fishDefaultMid = api._test.tailOuterHalfWidthAt(fishDefault.tail, fishDefault.tail.length * 0.18, fishDefault.tail.length);
const fishLinearMid = api._test.tailOuterHalfWidthAt(fishLinearized.tail, fishLinearized.tail.length * 0.18, fishLinearized.tail.length);
assert(Math.abs(fishLinearMid - fishDefaultMid) > 0.02, "tail: fish linearization should produce a visibly different outer rail shape");
const fishPlanform = api._test.boardCadTailPlanform(fishDefault.board);
const fishCornerWidth = api._test.tailOuterHalfWidthAt(fishDefault.tail, 0, fishDefault.tail.length);
const fishOuterCurveSamples = fishPlanform.positive.filter(point => point.x > 0 && point.x < fishDefault.tail.length && point.y > (fishCornerWidth * 0.98));
assert(fishOuterCurveSamples.length >= 8, "tail: fish outer rail should include curved samples between tail corner and rail join");
assert(Math.abs(fishPlanform.positiveSpline[0].p.x - fishDefault.tail.depth) < 1e-9, "tail: fish spline should start at the notch center");
assert(Math.abs(fishPlanform.positiveSpline[1].p.x) < 1e-9, "tail: fish spline should pass through the tail corner");
assert(Math.abs(fishPlanform.positiveSpline[2].p.x - fishDefault.tail.length) < 1e-9, "tail: fish spline should rejoin the outline at the body join");
assert(splineSegmentStartSlope(fishPlanform.positiveSpline, 0) < -0.15, "tail: fish notch should sweep outward like a reversed round-point nose template");
assert(Math.abs(splineSegmentEndSlope(fishPlanform.positiveSpline, 2) - fishDefault.tail.joinSlope) < 1e-9, "tail: fish rail should rejoin with the original rail tangent after using the reversed nose template");
assert(cubicCurvatureSigns(
  fishPlanform.positiveSpline[0].p,
  fishPlanform.positiveSpline[0].next,
  fishPlanform.positiveSpline[1].prev,
  fishPlanform.positiveSpline[1].p
).length === 1, "tail: fish notch segment should not introduce an S-curve inflection");
assert(cubicCurvatureSigns(
  fishPlanform.positiveSpline[1].p,
  fishPlanform.positiveSpline[1].next,
  fishPlanform.positiveSpline[2].prev,
  fishPlanform.positiveSpline[2].p
).length === 1, "tail: fish rail segment should not introduce an S-curve inflection");
const fishRailDeviation = maxLineDeviation(
  fishDefault.tail.length * fishDefault.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(fishDefault.tail, fishDefault.tail.length * fishDefault.tail.shoulderPos, fishDefault.tail.length),
  fishDefault.tail.length,
  api._test.tailOuterHalfWidthAt(fishDefault.tail, fishDefault.tail.length, fishDefault.tail.length),
  x => api._test.tailOuterHalfWidthAt(fishDefault.tail, x, fishDefault.tail.length)
);
const fishLinearRailDeviation = maxLineDeviation(
  fishLinearized.tail.length * fishLinearized.tail.shoulderPos,
  api._test.tailOuterHalfWidthAt(fishLinearized.tail, fishLinearized.tail.length * fishLinearized.tail.shoulderPos, fishLinearized.tail.length),
  fishLinearized.tail.length,
  api._test.tailOuterHalfWidthAt(fishLinearized.tail, fishLinearized.tail.length, fishLinearized.tail.length),
  x => api._test.tailOuterHalfWidthAt(fishLinearized.tail, x, fishLinearized.tail.length)
);
assert(fishRailDeviation > fishLinearRailDeviation + 0.18, "tail: fish default should keep a curved outer rail instead of collapsing to a straight edge");
const fishLaserCurve = parseGcodeXYPoints(api.makeLaserGCode(fishDefault.board));
const fishLaserLinear = parseGcodeXYPoints(api.makeLaserGCode(fishLinearized.board));
assert(fishLaserCurve.length === fishLaserLinear.length && fishLaserCurve.length > 20, "tail: laser G-code should be generated from sampled outline data");
const firstDifferentLaserPoint = fishLaserCurve.find((point, index) => {
  const other = fishLaserLinear[index];
  return other && (Math.abs(point.x - other.x) > 0.01 || Math.abs(point.y - other.y) > 0.01);
});
assert(!!firstDifferentLaserPoint, "tail: laser G-code must reflect tail linearization changes");
assert(api._test.boardCadDisplayWidthAtPos(roundPinDefault.board, api._test.boardCadTailDisplayLength(roundPinDefault.board) * 0.35) > api._test.boardCadDisplayWidthAtPos(pinDefault.board, api._test.boardCadTailDisplayLength(pinDefault.board) * 0.35), "tail: round-pin should remain fuller than pin through the mid-tail");
const normalizedTailHalfWidthAt = (tail, ratio) => (
  api._test.tailOuterHalfWidthAt(tail, tail.tipLength * ratio, tail.tipLength) / Math.max(1e-9, tail.joinY)
);
const pinWidth35 = normalizedTailHalfWidthAt(pinDefault.tail, 0.35);
const roundPinWidth35 = normalizedTailHalfWidthAt(roundPinDefault.tail, 0.35);
const roundWidth35 = normalizedTailHalfWidthAt(roundDefault.tail, 0.35);
const pinWidth65 = normalizedTailHalfWidthAt(pinDefault.tail, 0.65);
const roundPinWidth65 = normalizedTailHalfWidthAt(roundPinDefault.tail, 0.65);
const roundWidth65 = normalizedTailHalfWidthAt(roundDefault.tail, 0.65);
assert(pinWidth35 < roundPinWidth35 && roundPinWidth35 < roundWidth35, "tail: pin / round-pin / round half-widths should be ordered from pointed to round at 35% of the tail");
assert(pinWidth65 < roundPinWidth65 && roundPinWidth65 < roundWidth65, "tail: pin / round-pin / round half-widths should remain ordered through the shoulder");
const longPinDefault = defaultTail("Longboard.brd", "pin");
const longFishDefault = defaultTail("Longboard.brd", "fish");
const longboardNativeDefault = api.parseBrd(fs.readFileSync(path.join(root, "Longboard.brd"), "utf8"), "Longboard-native.brd");
assert(Math.abs(longPinDefault.tail.length - pinDefault.tail.length) < 1e-9, "tail: fixed cut presets should not scale with max board width");
const shortFishWidth12 = api._test.boardCadWidthAtPos(shortboardNativeDefault, Math.min(30.48, shortboardNativeDefault.length));
const longFishWidth12 = api._test.boardCadWidthAtPos(longboardNativeDefault, Math.min(30.48, longboardNativeDefault.length));
const expectedShortFish = api._test.greenlightFishTailDimensions(shortFishWidth12);
const expectedLongFish = api._test.greenlightFishTailDimensions(longFishWidth12);
assert(Math.abs(fishDefault.tail.depth - expectedShortFish.notchDepth) < 1e-6, "tail: fish notch depth should resolve from its 12-inch tail width");
assert(Math.abs(longFishDefault.tail.depth - expectedLongFish.notchDepth) < 1e-6, "tail: longboard fish notch depth should resolve from its own 12-inch tail width");
trace("tail:done");
}

if (sectionEnabled("nose")) {
trace("nose:start");
const noseBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-nose.brd");
noseBoard.noseMode = "round-point";
noseBoard.noseLength = 12.5;
noseBoard.noseShoulderPos = 0.61;
noseBoard.noseShoulderScale = 0.74;
noseBoard.noseRailBlend = 0.88;
noseBoard.noseWidthAdjust = 0.2;
assert(api._test.normalizeNoseModeKey("round pointed nose") === "round-point", "nose: round pointed nose should normalize");
assert(api._test.nosePresetForBoard("gun", noseBoard).length > api._test.nosePresetForBoard("round", noseBoard).length, "nose: gun preset should be longer than round nose");
assert(api._test.nosePresetForBoard("gun", noseBoard).length >= 40, "nose: gun pull-in should begin far enough aft to reshape a full round source nose without a short transition step");
const gunNoseBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-gun-nose.brd");
gunNoseBoard.noseMode = "gun";
const gunNosePlanform = api._test.boardCadTailPlanform(gunNoseBoard);
const gunNoseKnots = gunNosePlanform.positiveSpline.slice(-2);
const gunNoseExtension = api._test.normalizedNoseConfig(gunNoseBoard).extension;
assert(Math.abs(gunNoseExtension - 50) < 1e-9, "nose: gun should default to a 50 cm forward extension");
assert(Math.abs(api._test.boardCadTailDisplayLength(gunNoseBoard) - (gunNoseBoard.length + gunNoseExtension)) < 1e-6, "nose: gun extension should increase the finished board length");
const gunNoseProfile = api._test.tailAdjustedProfileGeometry(gunNoseBoard);
assert(Math.abs(gunNoseProfile.bottom.at(-1).x - api._test.boardCadTailDisplayLength(gunNoseBoard)) < 1e-6, "nose: gun extension should extend the bottom rocker profile to the new tip");
assert(Math.abs(gunNoseProfile.deck.at(-1).x - api._test.boardCadTailDisplayLength(gunNoseBoard)) < 1e-6 && Math.abs(gunNoseProfile.deck.at(-1).y - gunNoseProfile.bottom.at(-1).y) < 1e-6, "nose: gun extension should taper the deck and bottom to the same new tip");
assert(gunNoseKnots.length === 2, "nose: gun should connect the maximum-width CP directly to the terminal CP with one Bezier");
const gunJoin = gunNoseKnots[0];
const gunJoinIncoming = { x: gunJoin.p.x - gunJoin.prev.x, y: gunJoin.p.y - gunJoin.prev.y };
const gunJoinOutgoing = { x: gunJoin.next.x - gunJoin.p.x, y: gunJoin.next.y - gunJoin.p.y };
assert(Math.hypot(gunJoinIncoming.x, gunJoinIncoming.y) > 1e-6, "nose: gun join must not collapse its source-outline handle to zero length");
assert(Math.abs((gunJoinIncoming.x * gunJoinOutgoing.y) - (gunJoinIncoming.y * gunJoinOutgoing.x)) < 1e-6, "nose: gun join should remain tangent-continuous with the source outline");
assert(Math.abs(gunNoseKnots[1].p.y) < 1e-9, "nose: gun should terminate at one centered point");
const gunSourceMaxWidth = Math.max(...gunNosePlanform.baseHalf.map(point => point.y));
assert(Math.abs(gunNoseKnots[0].p.y - gunSourceMaxWidth) < 1e-4, "nose: gun Bezier should begin at the source outline maximum-width CP");
assert(Math.abs(gunNoseKnots[0].next.y - gunNoseKnots[0].p.y) < 1e-9, "nose: gun arc should leave maximum width parallel to the stringer");
assert(gunNoseKnots[1].prev.x < gunNoseKnots[1].p.x, "nose: gun point handle should fold back into the board to form a cusp");
const gunPointQuarter = cubicPoint(gunNoseKnots[0].p, gunNoseKnots[0].next, gunNoseKnots[1].prev, gunNoseKnots[1].p, 0.75);
assert(gunPointQuarter.y > gunSourceMaxWidth * 0.18 && gunPointQuarter.y < gunSourceMaxWidth * 0.26, "nose: gun cusp should retain fair lens-like fullness near the terminal quarter");
const noseMappings = new Map([
  ["gun", "gun"],
  ["pin", "pin"],
  ["round-point", "round-pin"],
  ["wide", "round-pin"],
  ["round", "round"],
  ["diamond", "diamond"],
  ["snub", "rounded-square"],
  ["square", "square"]
]);
const pinNoseBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-pin-nose.brd");
pinNoseBoard.noseMode = "pin";
const pinNosePlanform = api._test.boardCadTailPlanform(pinNoseBoard);
const pinNoseKnots = pinNosePlanform.positiveSpline.slice(-2);
assert(pinNoseKnots.length === 2, "nose: pin should use one terminal Bezier without a redundant shoulder CP");
assert(Math.abs(pinNoseKnots[1].p.y) < 1e-9, "nose: pin should terminate at one centered point");
assert(pinNoseKnots[1].prev.x < pinNoseKnots[1].p.x, "nose: pin point handle should fold back into the board to form a cusp");
assert(Math.abs(api._test.boardCadTailDisplayLength(pinNoseBoard) - pinNoseBoard.length) < 1e-6, "nose: pin should reshape within the original board length rather than extend it");
for (const [noseMode, tailMode] of noseMappings) {
  const mappedBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), `Shortboard-nose-${noseMode}.brd`);
  mappedBoard.noseMode = noseMode;
  const mappedConfig = api._test.normalizedNoseConfig(mappedBoard);
  const mappedPlanform = api._test.boardCadTailPlanform(mappedBoard);
  assert(mappedConfig.tailMode === tailMode, `nose: ${noseMode} should reuse ${tailMode} tail geometry`);
  assert(mappedPlanform.nose?.active === true, `nose: ${noseMode} planform should be active`);
  assert(mappedPlanform.positiveSpline.length >= 2, `nose: ${noseMode} should produce a Bezier spline`);
  for (let i = 1; i < mappedPlanform.positiveSpline.length; i++) {
    assert(mappedPlanform.positiveSpline[i].p.x >= mappedPlanform.positiveSpline[i - 1].p.x - 1e-9, `nose: ${noseMode} spline should remain monotonic in X`);
  }
}
const squareNoseBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-square-nose.brd");
squareNoseBoard.noseMode = "square";
const squareNosePlanform = api._test.boardCadTailPlanform(squareNoseBoard);
assert(squareNosePlanform.positiveSpline.at(-1).p.y > 0.1, "nose: square should end on a finite transom");
const squareNoseX = squareNosePlanform.positiveSpline.at(-1).p.x;
assert(squareNosePlanform.full.some((point, index, points) => index > 0 && Math.abs(point.x - squareNoseX) < 1e-6 && Math.abs(points[index - 1].x - squareNoseX) < 1e-6 && point.y < 0 && points[index - 1].y > 0), "nose: square outline should include the nose transom segment");
const roundNoseBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-round-nose.brd");
roundNoseBoard.noseMode = "round";
const roundNosePlanform = api._test.boardCadTailPlanform(roundNoseBoard);
assert(Math.abs(roundNosePlanform.positiveSpline.at(-1).p.y) < 1e-9, "nose: round should end on the centerline arc");
const standardTipThickness = api._test.boardCadThicknessAtPos(roundNoseBoard, roundNoseBoard.length - 8);
const standardTipDeck = api._test.boardCadCloneKnots(roundNoseBoard.deck);
roundNoseBoard.noseTipShape = "eagle";
roundNoseBoard.deck = api._test.buildNoseTipDeckSpline(roundNoseBoard, roundNoseBoard.deck, "eagle");
const eagleTipThickness = api._test.boardCadThicknessAtPos(roundNoseBoard, roundNoseBoard.length - 8);
assert(roundNoseBoard.deck.length > standardTipDeck.length, "nose tip: eagle nose should add editable deck control points");
const eagleDeck = api._test.boardCadCloneKnots(roundNoseBoard.deck);
roundNoseBoard.deck = api._test.buildNoseTipDeckSpline({ ...roundNoseBoard, noseTipShape: "beak" }, standardTipDeck, "beak");
roundNoseBoard.noseTipShape = "beak";
const beakTipThickness = api._test.boardCadThicknessAtPos(roundNoseBoard, roundNoseBoard.length - 8);
assert(eagleTipThickness > standardTipThickness, "nose tip: eagle nose should add volume through greater local thickness");
assert(beakTipThickness > standardTipThickness, "nose tip: beak nose should add volume through greater local thickness");
assert(roundNoseBoard.deck.length > standardTipDeck.length, "nose tip: beak nose should add editable deck control points");
assert(eagleDeck.some(knot => knot.p.x > roundNoseBoard.length - 30.48 && knot.p.x < roundNoseBoard.length), "nose tip: characteristic eagle control points should stay inside the final foot");
for (const expected of [0.314, 0.584, 0.966]) {
  const x = roundNoseBoard.length - 30.48 + (30.48 * expected);
  assert(eagleDeck.some(knot => Math.abs(knot.p.x - x) < 0.06), "nose tip: eagle deck CPs should follow the supplied reference profile");
}
assert(api._test.noseTipDeckLift(roundNoseBoard, roundNoseBoard.length) === 0, "nose tip: deck lift must return to the rocker at the terminal point");
const beakTipRoundTrip = api.parseBrd(api.makeBrd(roundNoseBoard), "Shortboard-beak-tip-roundtrip.brd");
assert(beakTipRoundTrip.noseTipShape === "", "nose tip: exported BRD should bake the added volume instead of reapplying it");
assert(api._test.boardCadThicknessAtPos(beakTipRoundTrip, beakTipRoundTrip.length - 8) > standardTipThickness, "nose tip: baked BRD should retain the added beak volume");
const widerRoundNoseBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wider-round-nose.brd");
widerRoundNoseBoard.noseMode = "round";
widerRoundNoseBoard.noseWidthAdjust = 1;
const narrowerRoundNoseBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-narrower-round-nose.brd");
narrowerRoundNoseBoard.noseMode = "round";
narrowerRoundNoseBoard.noseWidthAdjust = -1;
const roundProbeX = Math.min(api._test.boardCadTailDisplayLength(roundNoseBoard), api._test.boardCadTailDisplayLength(widerRoundNoseBoard)) - 3;
assert(api._test.boardCadDisplayWidthAtPos(widerRoundNoseBoard, roundProbeX) > api._test.boardCadDisplayWidthAtPos(roundNoseBoard, roundProbeX), "nose: width adjustment should increase the generated nose width");
assert(api._test.boardCadDisplayWidthAtPos(narrowerRoundNoseBoard, roundProbeX) < api._test.boardCadDisplayWidthAtPos(roundNoseBoard, roundProbeX), "nose: width adjustment should decrease the generated nose width");
assert(Math.abs(api._test.normalizedNoseConfig(widerRoundNoseBoard).widthScale - 4) < 1e-9, "nose: right slider end should represent 400 percent width");
assert(Math.abs(api._test.normalizedNoseConfig(narrowerRoundNoseBoard).widthScale - 0.25) < 1e-9, "nose: left slider end should represent 25 percent width");
const noseDisplayLength = api._test.boardCadTailDisplayLength(noseBoard);
const noseRoundTrip = api.parseBrd(api.makeBrd(noseBoard), "Shortboard-nose-roundtrip.brd");
assert(noseRoundTrip.noseMode === "", "nose: BRD roundtrip should bake and clear procedural nose mode");
assert(Math.abs(noseRoundTrip.length - noseDisplayLength) < 1e-3, "nose: BRD roundtrip should preserve the baked display length");
assert(api._test.normalizedNoseConfig(noseRoundTrip).active === false, "nose: baked BRD should not reactivate procedural nose shaping");
assert(Math.abs(noseRoundTrip.bottom.at(-1).p.x - noseRoundTrip.length) < 1e-3, "nose: baked bottom profile should end at the adjusted nose length");
assert(Math.abs(noseRoundTrip.deck.at(-1).p.x - noseRoundTrip.length) < 1e-3, "nose: baked deck profile should end at the adjusted nose length");
assert(api.makeDxfOutline(noseBoard).includes("POLYLINE"), "nose: DXF outline export should use adjusted geometry");
assert(api.makeDxfOutlineSpline(noseBoard).includes("SPLINE"), "nose: DXF spline export should use adjusted geometry");
assert(api.makeLaserGCode(noseBoard).includes("G1 X"), "nose: laser G-code export should use adjusted geometry");
assert(api.makeCncGCode(noseBoard).includes("G1 X"), "nose: CNC G-code export should use adjusted geometry");
trace("nose:done");
}

if (sectionEnabled("wing")) {
trace("wing:start");
const rawWingBase = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-raw.brd");
const stepWingBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-step.brd");
stepWingBoard.wingPreset = "stinger";
stepWingBoard.wingPosition = 38;
stepWingBoard.wingWidth = 1.8;
stepWingBoard.wingShape = "step";
const stepWing = api._test.normalizedWingConfig(stepWingBoard);
assert(stepWing.active && stepWing.shape === "step", "wing: step configuration was not normalized");
const stepAftX = Math.max(6, stepWing.distance - 8);
const stepForeX = Math.min(stepWingBoard.length - 6, stepWing.distance + 10);
const rawStepAftWidth = api._test.boardCadWidthAtPos(rawWingBase, stepAftX);
const stepAftWidth = api._test.boardCadWidthAtPos(stepWingBoard, stepAftX);
const rawStepForeWidth = api._test.boardCadWidthAtPos(rawWingBase, stepForeX);
const stepForeWidth = api._test.boardCadWidthAtPos(stepWingBoard, stepForeX);
assert(stepAftWidth < rawStepAftWidth - 2.5, "wing: step wing did not narrow the tail-side outline");
assert(Math.abs(stepForeWidth - rawStepForeWidth) < 0.2, "wing: step wing should leave the forward outline unchanged");
const stepHalf = api._test.wingAdjustedOutlineHalfPoints(stepWingBoard);
const stepBreakIndex = stepHalf.findIndex((point, index) => index > 0
  && Math.abs(point.x - stepWing.distance) < 1e-6
  && Math.abs(stepHalf[index - 1].x - point.x) < 1e-6
);
assert(stepBreakIndex > 0, "wing: step wing should insert a duplicated break x-position");
assert(stepHalf[stepBreakIndex].y > stepHalf[stepBreakIndex - 1].y + 0.5, "wing: step wing did not create a visible outline step");
const stepSpline = api._test.outlineSplineParts(stepWingBoard).upper;
const stepCornerIndices = stepSpline
  .map((knot, index) => ({ knot, index }))
  .filter(({ knot, index }) => index > 0 && Math.abs(knot.p.x - stepSpline[index - 1].p.x) <= 1e-7)
  .flatMap(({ index }) => [index - 1, index]);
assert(stepCornerIndices.length === 2, "wing: sharp step should resolve to exactly two coincident-x corner anchors");
stepCornerIndices.forEach(index => {
  assert(stepSpline[index].continuous === false, "wing: step anchors must remain intentional G0 corners");
});
assert(Math.abs(stepSpline[stepCornerIndices[0]].next.x - stepSpline[stepCornerIndices[0]].p.x) < 1e-9, "wing: step connector must remain transverse without Bezier overshoot");
assert(Math.abs(stepSpline[stepCornerIndices[1]].prev.x - stepSpline[stepCornerIndices[1]].p.x) < 1e-9, "wing: step connector must enter the aft corner vertically");
const wingBrd = api.makeBrd(stepWingBoard);
assert(!wingBrd.includes("p68 : stinger"), "wing: BRD export should bake the outline instead of preserving wing preset");
const wingRoundTrip = api.parseBrd(wingBrd, "wing-roundtrip.brd");
assert(wingRoundTrip.wingPreset === "", "wing: BRD roundtrip should clear procedural wing preset after baking");
assert(api._test.normalizedWingConfig(wingRoundTrip).active === false, "wing: baked BRD should not re-activate procedural wing shaping");
assertKnotsAlmostEqual(wingRoundTrip.outline, api._test.outlineSplineParts(stepWingBoard).upper, "wing baked outline");

const bumpWingBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-bump.brd");
bumpWingBoard.wingPreset = "wing";
bumpWingBoard.wingPosition = 30;
bumpWingBoard.wingWidth = 1.4;
bumpWingBoard.wingShape = "bump";
bumpWingBoard.wingShoulder = 0.3;
bumpWingBoard.wingTransition = 1.35;
const bumpWing = api._test.normalizedWingConfig(bumpWingBoard);
assert(bumpWing.active && bumpWing.shape === "bump" && bumpWing.blendLength > 1, "wing: bump configuration was not normalized");
assert(Math.abs(bumpWing.shoulder - 0.3) < 1e-9, "wing: bump shoulder coefficient was not preserved");
assert(Math.abs(bumpWing.transition - 1.35) < 1e-9, "wing: bump transition coefficient was not preserved");
assert(Math.abs(bumpWing.shoulderX - (bumpWing.distance + (bumpWing.blendLength * bumpWing.shoulder))) < 1e-9, "wing: bump shoulder point was not derived from shoulder coefficient");
const bumpQuarterX = bumpWing.shoulderX + ((bumpWing.endX - bumpWing.shoulderX) * 0.25);
const bumpQuarterOffset = api._test.wingOffsetAtX(bumpWing, bumpQuarterX) / bumpWing.width;
const smootherQuarter = 1 - (0.25 ** 3 * ((0.25 * ((0.25 * 6) - 15)) + 10));
assert(Math.abs(bumpQuarterOffset - smootherQuarter) < 1e-9, "wing: bump rejoin should use curvature-continuous quintic blending");
const bumpAftX = Math.max(6, bumpWing.distance - 6);
const bumpHoldX = bumpWing.distance + ((bumpWing.shoulderX - bumpWing.distance) * 0.5);
const bumpMidX = bumpWing.distance + (bumpWing.blendLength * 0.5);
const bumpReleaseX = bumpWing.shoulderX + ((bumpWing.endX - bumpWing.shoulderX) * 0.4);
const bumpForeX = Math.min(bumpWingBoard.length - 6, bumpWing.endX + 8);
const rawBumpAftWidth = api._test.boardCadWidthAtPos(rawWingBase, bumpAftX);
const rawBumpHoldWidth = api._test.boardCadWidthAtPos(rawWingBase, bumpHoldX);
const rawBumpMidWidth = api._test.boardCadWidthAtPos(rawWingBase, bumpMidX);
const rawBumpReleaseWidth = api._test.boardCadWidthAtPos(rawWingBase, bumpReleaseX);
const rawBumpForeWidth = api._test.boardCadWidthAtPos(rawWingBase, bumpForeX);
const bumpAftWidth = api._test.boardCadWidthAtPos(bumpWingBoard, bumpAftX);
const bumpHoldWidth = api._test.boardCadWidthAtPos(bumpWingBoard, bumpHoldX);
const bumpMidWidth = api._test.boardCadWidthAtPos(bumpWingBoard, bumpMidX);
const bumpReleaseWidth = api._test.boardCadWidthAtPos(bumpWingBoard, bumpReleaseX);
const bumpForeWidth = api._test.boardCadWidthAtPos(bumpWingBoard, bumpForeX);
assert(bumpAftWidth < rawBumpAftWidth - 2.0, "wing: bump wing did not narrow the tail-side outline");
assert(Math.abs((rawBumpHoldWidth - bumpHoldWidth) - (rawBumpAftWidth - bumpAftWidth)) < 0.25, "wing: shoulder hold should keep the full inset before the transition");
assert(bumpMidWidth > bumpAftWidth + 0.5, "wing: bump transition did not recover width ahead of the break");
assert((rawBumpReleaseWidth - bumpReleaseWidth) < (rawBumpHoldWidth - bumpHoldWidth) - 0.25, "wing: transition should start releasing after the shoulder point");
assert(bumpMidWidth < rawBumpMidWidth - 0.2, "wing: bump transition should still remain inside the native outline");
assert(Math.abs(bumpForeWidth - rawBumpForeWidth) < 0.2, "wing: bump transition should rejoin the native outline ahead of the wing");
const cachedWingBefore = api._test.boardCadTailPlanform(bumpWingBoard).positive.map(point => ({ ...point }));
bumpWingBoard.wingShoulder = 0.58;
const cachedWingAfterShoulder = api._test.boardCadTailPlanform(bumpWingBoard).positive;
assert(
  cachedWingAfterShoulder.some((point, index) => cachedWingBefore[index] && Math.abs(point.y - cachedWingBefore[index].y) > 1e-4),
  "wing: shoulder edits must invalidate the planform cache without relying on unrelated geometry changes"
);
bumpWingBoard.wingShoulder = 0.3;
const cachedWingBeforeTransition = api._test.boardCadTailPlanform(bumpWingBoard).positive.map(point => ({ ...point }));
bumpWingBoard.wingTransition = 2.1;
const cachedWingAfterTransition = api._test.boardCadTailPlanform(bumpWingBoard).positive;
assert(
  cachedWingAfterTransition.some((point, index) => cachedWingBeforeTransition[index] && Math.abs(point.y - cachedWingBeforeTransition[index].y) > 1e-4),
  "wing: transition edits must invalidate the planform cache"
);
bumpWingBoard.wingTransition = 1.35;
const bumpBrd = api.makeBrd(bumpWingBoard);
const bumpRoundTrip = api.parseBrd(bumpBrd, "wing-bump-roundtrip.brd");
assertKnotsAlmostEqual(bumpRoundTrip.outline, api._test.outlineSplineParts(bumpWingBoard).upper, "wing bump baked outline");

const shortTransitionBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-transition-short.brd");
shortTransitionBoard.wingPreset = "wing";
shortTransitionBoard.wingPosition = 30;
shortTransitionBoard.wingWidth = 1.4;
shortTransitionBoard.wingShape = "bump";
shortTransitionBoard.wingShoulder = 0.3;
shortTransitionBoard.wingTransition = 0.6;
const shortTransitionWing = api._test.normalizedWingConfig(shortTransitionBoard);
const longTransitionBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-transition-long.brd");
longTransitionBoard.wingPreset = "wing";
longTransitionBoard.wingPosition = 30;
longTransitionBoard.wingWidth = 1.4;
longTransitionBoard.wingShape = "bump";
longTransitionBoard.wingShoulder = 0.3;
longTransitionBoard.wingTransition = 1.8;
const longTransitionWing = api._test.normalizedWingConfig(longTransitionBoard);
assert(longTransitionWing.blendLength > shortTransitionWing.blendLength + 1.5, "wing: transition coefficient should stretch the rejoin length");
const transitionCompareX = shortTransitionWing.distance + (shortTransitionWing.blendLength * 0.85);
const rawTransitionCompareWidth = api._test.boardCadWidthAtPos(rawWingBase, transitionCompareX);
const shortTransitionWidth = api._test.boardCadWidthAtPos(shortTransitionBoard, transitionCompareX);
const longTransitionWidth = api._test.boardCadWidthAtPos(longTransitionBoard, transitionCompareX);
assert((rawTransitionCompareWidth - longTransitionWidth) > (rawTransitionCompareWidth - shortTransitionWidth) + 0.2, "wing: longer transition should stay further inside the native outline at the same x");

const presetDefaultBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-default-preset.brd");
presetDefaultBoard.wingPreset = "wing";
presetDefaultBoard.wingPosition = 30;
presetDefaultBoard.wingWidth = 1.4;
presetDefaultBoard.wingShape = "bump";
presetDefaultBoard.wingShoulder = 0;
presetDefaultBoard.wingTransition = 0;
const presetDefaultWing = api._test.normalizedWingConfig(presetDefaultBoard);
assert(Math.abs(presetDefaultWing.shoulder - 0.26) < 1e-9, "wing: preset bump shoulder should fall back to preset default when raw field is zero");
assert(Math.abs(presetDefaultWing.transition - 1.0) < 1e-9, "wing: preset bump transition should fall back to preset default when raw field is zero");

const stingerPresetBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-stinger-preset.brd");
stingerPresetBoard.wingPreset = "stinger";
const stingerPresetWing = api._test.normalizedWingConfig(stingerPresetBoard);
assert(stingerPresetWing.shape === "step", "wing: classic Sting/Stinger preset should preserve the abrupt wing break");
assert(stingerPresetWing.blendLength === 0, "wing: classic Sting/Stinger step should not be silently rounded into a bump");
assert(Math.abs(stingerPresetWing.distance - (stingerPresetBoard.length / 3)) < 1e-6, "wing: stinger preset should default to one-third of board length from the tail");
assert(Math.abs(stingerPresetWing.width - 2.5) < 1e-6, "wing: stinger preset should default to 2.5 width when the outline allows it");
const narrowWingBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-narrow-wing-preset.brd");
narrowWingBoard.wingPreset = "narrow-wing";
narrowWingBoard.tailMode = "swallow";
const narrowWing = api._test.normalizedWingConfig(narrowWingBoard);
assert(narrowWing.presetKey === "wing-pin", "wing: narrow-wing canonical alias should retain legacy wing-pin data compatibility");
assert(narrowWing.shape === "bump", "wing: narrow wing should use a smooth bump rather than an unrelated tail topology");
assert(Math.abs(narrowWing.distance - (narrowWingBoard.length * 0.125)) < 1e-6, "wing: narrow wing position should scale with board length");
assert(narrowWing.width < stingerPresetWing.width, "wing: narrow wing should use less inset than the classic Sting break");
assert(narrowWingBoard.tailMode === "swallow", "wing: narrow wing modifier must not overwrite the selected base tail shape");

const legacyStingerBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-stinger-legacy.brd");
legacyStingerBoard.wingPreset = "stinger";
legacyStingerBoard.wingPosition = legacyStingerBoard.length * (2 / 3);
const legacyStingerBrd = api.makeBrd(legacyStingerBoard);
const reparsedLegacyStinger = api.parseBrd(legacyStingerBrd, "Shortboard-wing-stinger-legacy-roundtrip.brd");
assert(api._test.normalizedWingConfig(reparsedLegacyStinger).active === false, "wing: baked legacy stinger export should not preserve the legacy procedural wing state");

const shoulderDragBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-shoulder-drag.brd");
shoulderDragBoard.wingPreset = "wing";
shoulderDragBoard.wingPosition = 30;
shoulderDragBoard.wingWidth = 1.4;
shoulderDragBoard.wingShape = "bump";
shoulderDragBoard.wingShoulder = 0.26;
shoulderDragBoard.wingTransition = 1.0;
api.state.board = shoulderDragBoard;
const shoulderWingBefore = api._test.normalizedWingConfig(shoulderDragBoard);
api._test.moveWingDrag({ kind: "shoulder" }, {
  preset: "wing",
  position: shoulderDragBoard.wingPosition,
  width: shoulderDragBoard.wingWidth,
  shape: shoulderDragBoard.wingShape,
  shoulder: shoulderWingBefore.shoulder,
  transition: shoulderWingBefore.transition,
  rawHalf: api._test.wingAdjustedOutlineHalfPoints(rawWingBase)
}, 1.4, 0);
const shoulderWingAfter = api._test.normalizedWingConfig(shoulderDragBoard);
assert(shoulderDragBoard.wingPreset === "custom", "wing: shoulder drag should switch preset to custom");
assert(shoulderWingAfter.shoulder > shoulderWingBefore.shoulder + 0.12, "wing: shoulder drag should increase shoulder coefficient when dragged forward");
assert(Math.abs(shoulderWingAfter.transition - shoulderWingBefore.transition) < 1e-9, "wing: shoulder drag should not alter transition coefficient");

const transitionDragBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-transition-drag.brd");
transitionDragBoard.wingPreset = "wing";
transitionDragBoard.wingPosition = 30;
transitionDragBoard.wingWidth = 1.4;
transitionDragBoard.wingShape = "bump";
transitionDragBoard.wingShoulder = 0.26;
transitionDragBoard.wingTransition = 1.0;
api.state.board = transitionDragBoard;
const transitionWingBefore = api._test.normalizedWingConfig(transitionDragBoard);
api._test.moveWingDrag({ kind: "transition" }, {
  preset: "wing",
  position: transitionDragBoard.wingPosition,
  width: transitionDragBoard.wingWidth,
  shape: transitionDragBoard.wingShape,
  shoulder: transitionWingBefore.shoulder,
  transition: transitionWingBefore.transition,
  rawHalf: api._test.wingAdjustedOutlineHalfPoints(rawWingBase)
}, 2.2, 0);
const transitionWingAfter = api._test.normalizedWingConfig(transitionDragBoard);
assert(transitionDragBoard.wingPreset === "custom", "wing: transition drag should switch preset to custom");
assert(transitionWingAfter.transition > transitionWingBefore.transition + 0.2, "wing: transition drag should increase transition coefficient when dragged forward");
assert(Math.abs(transitionWingAfter.shoulder - transitionWingBefore.shoulder) < 0.02, "wing: transition drag should keep shoulder coefficient effectively unchanged");

const controlPointVisibilityBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-controlpoints.brd");
api.state.board = controlPointVisibilityBoard;
api.state.view = "outline";
api.state.tool = "edit";
[
  { preset: "wing", position: 30, width: 1.6, shape: "bump", shoulder: 0.24, transition: 1.0 },
  { preset: "custom", position: 24, width: 2.4, shape: "step", shoulder: 0, transition: 0 },
  { preset: "custom", position: 22, width: 2.2, shape: "bump", shoulder: 0.42, transition: 1.55 },
  { preset: "wing-pin", position: 20, width: 1.35, shape: "bump", shoulder: 0.18, transition: 0.9 }
].forEach(config => {
  controlPointVisibilityBoard.wingPreset = config.preset;
  controlPointVisibilityBoard.wingPosition = config.position;
  controlPointVisibilityBoard.wingWidth = config.width;
  controlPointVisibilityBoard.wingShape = config.shape;
  controlPointVisibilityBoard.wingShoulder = config.shoulder;
  controlPointVisibilityBoard.wingTransition = config.transition;
  api._test.draw();
});
assert(api.state.editHandles.length === controlPointVisibilityBoard.outline.length * 3, "wing: all outline control-point handles should remain available after repeated wing edits");
api.state.editHandles.forEach(handle => {
  const knot = handle.knots[handle.knotIndex];
  const point = handle.which === 0 ? knot.p : handle.which === 1 ? knot.prev : knot.next;
  const screenX = handle.transform.x(point.x);
  const screenY = handle.transform.y(point.y);
  assert(Number.isFinite(screenX) && Number.isFinite(screenY), "wing: control point handle transform became invalid after wing edits");
  assert(screenX >= -1 && screenX <= 1281 && screenY >= -1 && screenY <= 721, "wing: control point handle moved outside the editable viewport after wing edits");
});
const selectedOutlineHandle = api.state.editHandles.find(handle => handle.which === 0 && handle.knotIndex === 1);
assert(selectedOutlineHandle, "wing: anchor handle should still be selectable after repeated wing edits");
api.state.selection = selectedOutlineHandle;
const selectedKnotBefore = {
  x: selectedOutlineHandle.knots[selectedOutlineHandle.knotIndex].p.x,
  y: selectedOutlineHandle.knots[selectedOutlineHandle.knotIndex].p.y
};
assert(api._test.moveSelectedControlPointByKey("arrowup", 24), "wing: outline control point should remain editable after repeated wing edits");
const selectedKnotAfter = selectedOutlineHandle.knots[selectedOutlineHandle.knotIndex].p;
assert(selectedKnotAfter.y > selectedKnotBefore.y, "wing: selected outline control point should move after repeated wing edits");

const previewUpdateBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-preview-update.brd");
api.state.board = previewUpdateBoard;
api.state.view = "outline";
api.state.tool = "edit";
api._test.draw();
const previewHandle = api.state.editHandles.find(handle => handle.which === 0 && handle.knotIndex === 1);
assert(previewHandle, "preview: outline anchor handle should exist");
api.state.selection = previewHandle;
const previewSampleX = previewHandle.knots[previewHandle.knotIndex].p.x;
const previewWidthBefore = api._test.boardCadWidthAtPos(previewUpdateBoard, previewSampleX);
assert(api._test.moveSelectedControlPointByKey("arrowup", 24), "preview: outline control point should be movable");
const previewWidthAfter = api._test.boardCadWidthAtPos(previewUpdateBoard, previewSampleX);
assert(previewWidthAfter > previewWidthBefore, "preview: outline-derived width should update immediately after control-point edits");
const previewOutlineAfter = api._test.outlineFullPoints(previewUpdateBoard);
assert(previewOutlineAfter.some(point => Math.abs(point.x - previewSampleX) < 1e-6 && point.y > previewHandle.knots[previewHandle.knotIndex].p.y - 1e-9), "preview: outline preview should contain the moved control-point position");

api.state.board = bumpWingBoard;
const dragRawHalf = api._test.wingAdjustedOutlineHalfPoints(rawWingBase);
api._test.moveWingDrag({ kind: "position" }, {
  preset: "wing",
  position: bumpWingBoard.wingPosition,
  width: bumpWingBoard.wingWidth,
  shape: bumpWingBoard.wingShape,
  shoulder: bumpWingBoard.wingShoulder,
  transition: bumpWingBoard.wingTransition,
  rawHalf: dragRawHalf
}, 4, 0);
assert(bumpWingBoard.wingPreset === "custom", "wing: drag edit should switch preset to custom");
assert(Math.abs(bumpWingBoard.wingPosition - 34) < 1e-9, "wing: position drag did not update wing position");
assert(Math.abs(bumpWingBoard.wingShoulder - 0.3) < 1e-9, "wing: position drag should preserve shoulder coefficient");
assert(Math.abs(bumpWingBoard.wingTransition - 1.35) < 1e-9, "wing: position drag should preserve transition coefficient");
const draggedWidthBefore = bumpWingBoard.wingWidth;
api._test.moveWingDrag({ kind: "width" }, {
  preset: "custom",
  position: bumpWingBoard.wingPosition,
  width: bumpWingBoard.wingWidth,
  shape: bumpWingBoard.wingShape,
  shoulder: bumpWingBoard.wingShoulder,
  transition: bumpWingBoard.wingTransition,
  rawHalf: dragRawHalf
}, 0, -0.75);
assert(bumpWingBoard.wingWidth > draggedWidthBefore + 0.7, "wing: width drag did not increase the wing inset when dragged toward center");

const tailOnlyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-tail-only.brd");
tailOnlyBoard.tailMode = "square";
tailOnlyBoard.tailLength = 10;
const wingTailBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-wing-tail.brd");
wingTailBoard.tailMode = "square";
wingTailBoard.tailLength = 10;
wingTailBoard.wingPreset = "wing-pin";
wingTailBoard.wingPosition = 20;
wingTailBoard.wingWidth = 1.25;
wingTailBoard.wingShape = "step";
assert(api._test.boardCadWidthAtPos(wingTailBoard, wingTailBoard.tailLength) < api._test.boardCadWidthAtPos(tailOnlyBoard, tailOnlyBoard.tailLength) - 1.5, "wing: tail join width should respect the wing-adjusted outline");
trace("wing:done");
}

if (sectionEnabled("ghost-3d-edit")) {
trace("ghost-3d-edit:start");
api._test.createNewBoard();
assert(api.state.board && api.state.board.name === "Untitled", "file menu: New did not create an untitled board");
assert(api.state.board.sections.length === 5, "file menu: New did not create the default cross sections");
const fileInput = getElement("fileInput");
const ghostFileInput = getElement("ghostFileInput");
const fileClicksBefore = fileInput.clickCount;
const ghostClicksBefore = ghostFileInput.clickCount;
api._test.openBoardFilePicker();
api._test.openGhostBoardFilePicker();
assert(fileInput.clickCount === fileClicksBefore + 1, "file menu: Open did not trigger the file picker");
assert(ghostFileInput.clickCount === ghostClicksBefore + 1, "file menu: Open Ghost did not trigger the ghost file picker");
api._test.setView("profile");
assert(api.state.view === "profile", "view menu: setView did not switch to profile");
api._test.fitView();
assert(getElement("status").textContent.includes("2D"), "view menu: Fit in profile view did not report a 2D fit status");
api._test.setView("toolpath");
assert(api.state.view === "toolpath", "view menu: setView did not switch to toolpath");
api._test.fitView();
assert(getElement("status").textContent.includes("3D"), "view menu: Fit in toolpath view did not report a 3D fit status");
api._test.setView("outline");
assert(api._test.sampleFilenameFromUrl("./Shortboard.brd") === "Shortboard.brd", "file menu: sample filename parsing failed for relative path");
assert(api._test.sampleFilenameFromUrl("http://localhost:8788/Funboard.brd") === "Funboard.brd", "file menu: sample filename parsing failed for absolute path");
const sampleBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard.brd");
api.state.board = sampleBoard;
api._test.applySampleBoardDefaults("Shortboard.brd");
assert(api.state.board.tailMode === "squash", "file menu: Shortboard sample defaults were not applied");
const editBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard.brd");
api.state.board = editBoard;
api.state.view = "outline";
api.state.tool = "edit";
const importedOutline = api._test.makeOtl(editBoard);
const importedProfile = api._test.makePfl(editBoard);
const importedSection = api._test.serializeCrossSection(editBoard.sections[api.state.currentSectionIndex]);
const importedMeasurements = "index,surface,tail_x_mm,board_y_mm,z_mm\n0,bottom,0,0,0\n1,bottom,120,0,1.25\n";
api.state.board.outline = api._test.boardCadCloneKnots(api.state.board.outline.slice(0, 3));
api._test.importOutlineText(importedOutline, "outline-test.otl");
assert(api.state.board.outline.length > 3, "file menu: .otl import did not restore the outline");
assert(getElement("status").textContent.includes("outline-test.otl"), "file menu: .otl import did not report status");
api.state.board.bottom = api._test.boardCadCloneKnots(api.state.board.bottom.slice(0, 2));
api.state.board.deck = api._test.boardCadCloneKnots(api.state.board.deck.slice(0, 2));
api._test.importProfileText(importedProfile, "profile-test.pfl");
assert(api.state.board.bottom.length > 2 && api.state.board.deck.length > 2, "file menu: .pfl import did not restore bottom/deck splines");
assert(getElement("status").textContent.includes("profile-test.pfl"), "file menu: .pfl import did not report status");
const importedSectionParsed = api._test.parseCrossSectionText(importedSection, api.state.board.sections[api.state.currentSectionIndex].position);
api.state.board.sections[api.state.currentSectionIndex].spline = api._test.boardCadCloneKnots(api.state.board.sections[api.state.currentSectionIndex - 1].spline);
api._test.importCrossSectionText(importedSection, "section-test.crs");
assert(api.state.board.sections[api.state.currentSectionIndex].spline.length === importedSectionParsed.spline.length, "file menu: .crs import did not restore knot count");
assert(api.state.board.sections[api.state.currentSectionIndex].spline.every(knot => Number.isFinite(knot.p.x) && Number.isFinite(knot.p.y)), "file menu: .crs import produced invalid cross section coordinates");
assert((api.state.board.sections[api.state.currentSectionIndex].guidePoints || []).length === (importedSectionParsed.guidePoints || []).length, "file menu: .crs import did not restore guide point count");
assert(getElement("status").textContent.includes("section-test.crs"), "file menu: .crs import did not report status");
api._test.importProbeMeasurementsText(importedMeasurements, "probe-test.csv");
assert(api.state.probeMeasurements.length === 2, "file menu: .csv import did not parse probe measurements");
assert(api.state.view === "scan", "file menu: .csv import did not switch to scan view");
assert(getElement("status").textContent.includes("probe-test.csv"), "file menu: .csv import did not report status");
api.state.board = editBoard;
api.state.view = "outline";
api.state.tool = "edit";
api._test.loadGhostBoard(fs.readFileSync(path.join(root, "Funboard.brd"), "utf8"), "Funboard.brd");
assert(api.state.ghost.board && api.state.ghost.board.length > 0 && api.state.ghost.board.outline.length > 0, "ghost board: loadGhostBoard did not parse the ghost board");
api._test.scaleGhostToCurrentBoard();
assert(Math.abs(api.state.ghost.board.length - editBoard.length) < 1e-6, "ghost board: scaled ghost length does not match current board");
assert(Math.abs(api.state.ghost.board.width - editBoard.width) < 1e-6, "ghost board: scaled ghost width does not match current board");
assert(Math.abs(api.state.ghost.board.thickness - editBoard.thickness) < 1e-6, "ghost board: scaled ghost thickness does not match current board");
api.state.ghost.offsetX = 2;
api.state.ghost.offsetY = -3;
api.state.ghost.rotation = Math.PI / 2;
const rotatedGhostPoint = api._test.transformGhostPoint({ x: 4, y: 1 });
assert(Math.abs(rotatedGhostPoint.x - 1) < 1e-9 && Math.abs(rotatedGhostPoint.y - 1) < 1e-9, "ghost board: transformed ghost point does not match expected rotate+translate");
const transformedGhostPoints = api._test.transformGhostPoints([{ x: 0, y: 0 }, { x: 4, y: 1 }]);
assert(transformedGhostPoints.length === 2 && transformedGhostPoints[0].x === 2 && transformedGhostPoints[0].y === -3, "ghost board: transformGhostPoints did not preserve translation for origin");
assert(api._test.ghostTransformSummary().includes("Rot 90"), "ghost board: transform summary should report rotation in degrees");
api.state.ghost.offsetX = 0;
api.state.ghost.offsetY = 0;
api.state.ghost.rotation = 0;
assert(api._test.ghostCommandAvailable() === true, "ghost board: ghost command should be available in outline view");
api._test.draw();
const moveGhostResult = api._test.moveGhostByKey("arrowright", false);
assert(moveGhostResult === true && api.state.ghost.offsetX > 0, "ghost board: arrow key move did not change X offset");
const rotateGhostResult = api._test.moveGhostByKey("w", false);
assert(rotateGhostResult === true && api.state.ghost.rotation > 0, "ghost board: W key did not increase rotation");
trace("ghost-3d-edit:ghost-draw-done");
[
  editBoard.length * 0.3,
  editBoard.length * 0.6,
  editBoard.length * 0.8
].forEach(x => {
  const deckRow = api._test.boardCadSurfaceRowAt(editBoard, x, "deck", 10);
  const bottomRow = api._test.boardCadSurfaceRowAt(editBoard, x, "bottom", 10);
  assert(deckRow.length === 11 && bottomRow.length === 11, "3d wire: surface rows did not produce the expected sample count");
  for (let i = 1; i < deckRow.length; i++) {
    assert(deckRow[i].y >= deckRow[i - 1].y - 1e-9, "3d wire: deck surface row should move monotonically from stringer to rail");
    assert(bottomRow[i].y >= bottomRow[i - 1].y - 1e-9, "3d wire: bottom surface row should move monotonically from stringer to rail");
  }
});
trace("ghost-3d-edit:surface-rows-done");
const modelLines = api._test.getModel3DWorldLines(editBoard, 18, 10);
const allStringers = modelLines.filter(line => line.kind === "stringer");
const deckStringers = allStringers.filter(line => line.surface === "deck");
const bottomStringers = allStringers.filter(line => line.surface === "bottom");
assert(deckStringers.length === 22 && bottomStringers.length === 22, "3d wire: both mirrored deck and bottom stringers should be generated");
const mirroredTrack = deckStringers.filter(line => line.trackIndex === 5);
assert(mirroredTrack.length === 2, "3d wire: each stringer track should keep both mirrored sides");
assert(mirroredTrack.some(line => line.side === 1) && mirroredTrack.some(line => line.side === -1), "3d wire: mirrored stringer sides are incomplete");
const deckStringer = modelLines.find(line => line.kind === "stringer" && line.surface === "deck" && line.side === 1);
assert(deckStringer && deckStringer.points.length >= 4, "3d wire: deck stringer line missing");
const projectedDeckStringer = deckStringer.points.map(point => api._test.projectBoardPoint(point, editBoard));
let smoothSegmentCount = 0;
for (let i = 0; i < projectedDeckStringer.length - 1; i++) {
  const p0 = projectedDeckStringer[Math.max(0, i - 1)];
  const p1 = projectedDeckStringer[i];
  const p2 = projectedDeckStringer[i + 1];
  const p3 = projectedDeckStringer[Math.min(projectedDeckStringer.length - 1, i + 2)];
  const { c1, c2 } = api._test.smoothPathSegmentControls(p0, p1, p2, p3);
  const mid = api._test.cubicBezierPoint(p1, c1, c2, p2, 0.5);
  const segmentLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const margin = Math.max(0.25, segmentLength * 0.12);
  const minX = Math.min(p0.x, p1.x, p2.x, p3.x) - margin;
  const maxX = Math.max(p0.x, p1.x, p2.x, p3.x) + margin;
  const minY = Math.min(p0.y, p1.y, p2.y, p3.y) - margin;
  const maxY = Math.max(p0.y, p1.y, p2.y, p3.y) + margin;
  assert(mid.x >= minX && mid.x <= maxX && mid.y >= minY && mid.y <= maxY, "3d wire: smoothed stringer midpoint escaped local bounds");
  const deviation = Math.abs((p2.y - p1.y) * mid.x - (p2.x - p1.x) * mid.y + p2.x * p1.y - p2.y * p1.x) / Math.max(1e-9, segmentLength);
  assert(deviation <= Math.max(0.35, segmentLength * 0.3) + 1e-9, "3d wire: smoothed stringer midpoint deviated too far from segment");
  if (Math.hypot(c1.x - p1.x, c1.y - p1.y) > 1e-6 || Math.hypot(c2.x - p2.x, c2.y - p2.y) > 1e-6) smoothSegmentCount++;
}
assert(smoothSegmentCount > 0, "3d wire: all stringer segments fell back to straight lines");
trace("ghost-3d-edit:3d-lines-done");
const undoRedoBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-undo-redo.brd");
api.state.board = undoRedoBoard;
api.state.view = "outline";
api.state.tool = "edit";
api.state.contextEditPoint = { x: undoRedoBoard.length * 0.5, y: undoRedoBoard.width * 0.22 };
api._test.draw();
const undoRedoOutlineCount = undoRedoBoard.outline.length;
api._test.addControlPoint();
assert(undoRedoBoard.outline.length === undoRedoOutlineCount + 1, "edit menu: Add ControlPoint did not change outline knot count for undo/redo");
api._test.undoEdit();
assert(api.state.board.outline.length === undoRedoOutlineCount, "edit menu: Undo did not restore the previous outline knot count");
api._test.redoEdit();
assert(api.state.board.outline.length === undoRedoOutlineCount + 1, "edit menu: Redo did not restore the added outline knot");
api.state.board = editBoard;
api.state.view = "outline";
api.state.tool = "edit";
api.state.contextEditPoint = { x: editBoard.length * 0.5, y: editBoard.width * 0.22 };
api._test.draw();
const outlineControlPointCount = editBoard.outline.length;
api._test.addControlPoint();
assert(editBoard.outline.length === outlineControlPointCount + 1, "edit menu: Add ControlPoint did not insert a knot");
assert(api.state.selection?.transform, "edit menu: added ControlPoint did not retain an edit transform");
const selectedKnot = api.state.selection.knots[api.state.selection.knotIndex];
const selectedX = selectedKnot.p.x;
const selectedY = selectedKnot.p.y;
api._test.updateControlPointPanel();
assert(getElement("cpEndX").value === api.fmt(selectedX), "control point panel: endpoint X did not sync from selection");
assert(getElement("cpEndY").value === api.fmt(selectedY), "control point panel: endpoint Y did not sync from selection");
getElement("cpEndX").value = api.fmt(selectedX + 1.25);
getElement("cpEndY").value = api.fmt(selectedY - 0.5);
getElement("cpPrevX").value = api.fmt(selectedKnot.prev.x + 0.75);
getElement("cpPrevY").value = api.fmt(selectedKnot.prev.y + 0.25);
getElement("cpNextX").value = api.fmt(selectedKnot.next.x - 0.75);
getElement("cpNextY").value = api.fmt(selectedKnot.next.y - 0.25);
api._test.setSelectedControlPointFromPanel();
assert(Math.abs(selectedKnot.p.x - Number(getElement("cpEndX").value)) <= 1e-3, "control point panel: Set did not update endpoint X");
assert(Math.abs(selectedKnot.p.y - Number(getElement("cpEndY").value)) <= 1e-3, "control point panel: Set did not update endpoint Y");
api.state.editLocks.x = true;
api._test.moveSelectedControlPointByKey("arrowright", 24);
assert(Math.abs(selectedKnot.p.x - Number(getElement("cpEndX").value)) <= 1e-3, "edit menu: X locked did not constrain ControlPoint movement");
api.state.editLocks.x = false;
api._test.deleteSelectedControlPoint();
assert(editBoard.outline.length === outlineControlPointCount, "edit menu: Delete controlpoints did not remove the inserted knot");

api.state.viewOptions.viewBlank = true;
api.state.contextEditPoint = { x: editBoard.length * 0.5, y: editBoard.width * 0.18 };
api._test.addControlPoint();
assert(editBoard.outline.length === outlineControlPointCount, "edit menu: View blank should disable hidden ControlPoint edits");
api._test.draw();
assert(api.state.editHandles.length === 0, "edit menu: View blank should clear edit handles");
api.state.viewOptions.viewBlank = false;
api.state.viewOptions.showDeckToolpath = true;
api.state.viewOptions.showBottomToolpath = true;
api._test.draw();
api.state.viewOptions.showDeckToolpath = false;
api.state.viewOptions.showBottomToolpath = false;
trace("ghost-3d-edit:toolpath-draw-done");
const previewPathsA = api._test.getToolpathPreviewPaths(editBoard, "both", 64, 12);
const previewPathsB = api._test.getToolpathPreviewPaths(editBoard, "both", 64, 12);
assert(previewPathsA === previewPathsB, "toolpath: unchanged preview should reuse the cached world paths");
assert(previewPathsA.length <= 52, "toolpath: preview width pass count exceeded the 12-step cap");
assert(previewPathsA.every(pathItem => pathItem.pass.length <= 65), "toolpath: preview length point count exceeded the 64-step cap");

const traceImage = { naturalWidth: 1000, naturalHeight: 260, width: 1000, height: 260 };
api.state.traceImages.outline = {
  key: "outline",
  name: "trace-test.png",
  url: "blob:trace-test",
  image: traceImage,
  naturalWidth: traceImage.naturalWidth,
  naturalHeight: traceImage.naturalHeight,
  ...api._test.defaultTracePlacement("outline", traceImage)
};
api._test.draw();
assert(api.state.traceImages.outline.scale > 0, "trace image: outline placement scale was not initialized");
getElement("traceMoveStep").value = "2";
const traceStartX = api.state.traceImages.outline.x;
const traceStartY = api.state.traceImages.outline.y;
api._test.moveTraceImage(1, 0);
assert(Math.abs(api.state.traceImages.outline.x - (traceStartX + 2)) < 1e-9, "trace image: move right did not update X");
api._test.moveTraceImage(0, -1);
assert(Math.abs(api.state.traceImages.outline.y - (traceStartY - 2)) < 1e-9, "trace image: move down did not update Y");
api._test.centerTraceImage();
assert(Math.abs(api.state.traceImages.outline.x - traceStartX) < 1e-9, "trace image: center did not restore X");
trace("ghost-3d-edit:trace-done");

editBoard.fins = [10, 3, 18, 4, 8, 16, 0, 0, 0];
api._test.moveFinDrag({ kind: "side", side: 1 }, editBoard.fins.slice(), 2, 1);
assert(Math.abs(editBoard.fins[0] - 12) < 1e-9, "fins: side rear X drag did not update p50");
assert(Math.abs(editBoard.fins[1] - 4) < 1e-9, "fins: side rear Y drag did not update p50");
assert(Math.abs(editBoard.fins[2] - 20) < 1e-9, "fins: side front X drag did not update p50");
assert(Math.abs(editBoard.fins[3] - 5) < 1e-9, "fins: side front Y drag did not update p50");
api._test.moveFinDrag({ kind: "side", side: -1 }, editBoard.fins.slice(), 0, -2);
assert(Math.abs(editBoard.fins[1] - 6) < 1e-9, "fins: mirrored side drag did not preserve centerline symmetry");
api._test.moveFinDrag({ kind: "center", side: 0 }, editBoard.fins.slice(), 3, 10);
assert(Math.abs(editBoard.fins[4] - 11) < 1e-9, "fins: center rear drag did not update p50");
assert(Math.abs(editBoard.fins[5] - 19) < 1e-9, "fins: center front drag did not update p50");
assert(Math.abs(editBoard.fins[1] - 6) < 1e-9, "fins: center drag should not alter side offset");
api._test.moveFinDrag({ kind: "side", side: 1, dragMode: "front" }, editBoard.fins.slice(), 4, -2);
assert(Math.abs(editBoard.fins[0] - 12) < 1e-9, "fins: endpoint drag should not move side rear X");
assert(Math.abs(editBoard.fins[2] - 24) < 1e-9, "fins: front endpoint drag did not change side front X");
assert(api._test.finToeInFromFins(api.state.board.fins) > 0, "fins: toe-in angle should be derived from side fin line");
assert(api._test.finTemplateKey("FSC II") === "FCSII", "fins: FSC II alias should map to FCSII template");
assert(api._test.finSetupKey("twin") === "twin-performance", "fins: legacy twin setup should normalize to twin-performance");
assert(api._test.finSetupLabel("twin-fish") === "Twin fish", "fins: twin-fish label should be human-readable");
const twinFishPreset = api._test.finSetupPreset("twin-fish", editBoard);
const twinPerformancePreset = api._test.finSetupPreset("twin-performance", editBoard);
const thrusterPreset = api._test.finSetupPreset("thruster", editBoard);
const maxWidthFallbackPreset = api._test.finSetupPreset("thruster", {
  ...editBoard,
  outline: [],
  width: editBoard.width,
  length: editBoard.length
});
const sideBitePreset = api._test.finSetupPreset("2plus1", editBoard);
assert(!!twinFishPreset && !!twinPerformancePreset, "fins: split twin presets should exist");
assert(!!thrusterPreset && !!sideBitePreset, "fins: standard presets should exist");
assert(twinFishPreset.fins[0] < twinPerformancePreset.fins[0], "fins: twin-fish should sit farther back than twin-performance");
assert(twinFishPreset.toeIn < twinPerformancePreset.toeIn, "fins: twin-fish should carry less toe-in than twin-performance");
assert(sideBitePreset.fins[0] > thrusterPreset.fins[0], "fins: 2+1 sidebites should sit farther back than thruster sides");
assert(Math.abs(sideBitePreset.fins[5] - sideBitePreset.fins[0]) < 1e-9, "fins: 2+1 center leading edge should align with the sidebite trailing edge");
const simulationBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-simulation.brd");
const simulationThruster = api._test.finSetupPreset("thruster", simulationBoard);
simulationBoard.fins = simulationThruster.fins;
simulationBoard.finExtra = simulationThruster.extra;
const simulationMetrics = api._test.hydrodynamicSimulationMetrics(simulationBoard);
assert(simulationMetrics.volumeLiters > 0, "simulation: volume integration should be positive");
assert(Math.abs(simulationMetrics.seawaterSupportKg - simulationMetrics.volumeLiters * 1.025) < 1e-9, "simulation: seawater support should follow Archimedes' displacement relation");
assert(simulationMetrics.prismaticCoefficient > 0 && simulationMetrics.prismaticCoefficient < 1, "simulation: prismatic coefficient should be a bounded volume-distribution ratio");
assert(simulationMetrics.lengthDisplacementRatio > 0, "simulation: length-displacement ratio should be positive");
assert(simulationMetrics.froudeNumber > 0, "simulation: Froude number should be positive at the comparison speed");
assert(api._test.boardCadMomentOfInertia(simulationBoard, simulationBoard.length * 0.5, 0) > 0, "simulation: longitudinal moment of inertia estimate should be positive");
assert(simulationMetrics.fins.count === 3 && simulationMetrics.fins.force > 0 && simulationMetrics.fins.moment > 0, "simulation: thruster should produce a finite three-fin yaw estimate");
assert(simulationMetrics.comparisons.g5.force > simulationMetrics.comparisons.g3.force, "simulation: G5 should produce more estimated lateral force than G3 at equal conditions");
assert(simulationMetrics.comparisons.g5.moment > simulationMetrics.comparisons.g3.moment, "simulation: G5 should produce more estimated yaw restoring moment than G3 at equal placement");
assert(simulationMetrics.comparisons.twoPlusOne.force > simulationMetrics.comparisons.single.force, "simulation: adding 2+1 sidebites should increase estimated lateral force");
assert(simulationMetrics.comparisons.twoPlusOne.moment > simulationMetrics.comparisons.single.moment, "simulation: adding 2+1 sidebites should increase estimated yaw restoring moment");
assert(simulationMetrics.apexSamples.length >= 30 && simulationMetrics.apexSamples.every(sample => sample.heightRatio >= 0 && sample.heightRatio <= 1), "simulation: apex line should resolve from section geometry");
assert(simulationMetrics.curves.finAngles.length === 7 && simulationMetrics.curves.finAngles[0].force === 0, "simulation: fin curve should cover 0 to 15 degrees from zero load");
assert(simulationMetrics.curves.finAngles.every((item, index, items) => index === 0 || item.force > items[index - 1].force), "simulation: pre-stall finite-wing force should rise with angle");
assert(simulationMetrics.curves.bankAngles.length === 7 && simulationMetrics.curves.bankAngles[0].restoringMoment < 1e-6, "simulation: symmetric zero-bank hydrostatics should have zero lateral restoring moment");
assert(simulationMetrics.curves.bankAngles.some(item => item.restoringMoment > 0), "simulation: banking should move the immersed center and produce a restoring moment estimate");
assert(simulationMetrics.curves.rail.length >= 30 && simulationMetrics.curves.rail.every(item => item.tuckInsetRatio >= 0 && item.tuckInsetRatio <= 1 && item.railArea >= 0), "simulation: apex/tuck/rail-area paths should resolve from section geometry");
const thrusterCurve = api._test.simulationFinPresetCurve(simulationBoard, "thruster");
const fiveFinCurve = api._test.simulationFinPresetCurve(simulationBoard, "5fin");
assert(fiveFinCurve.at(-1).force > thrusterCurve.at(-1).force, "simulation comparison: five-fin preset should exceed thruster lateral force at equal angle");
const rail5050Curve = api._test.simulationRailPresetCurve(simulationBoard, "5050");
const rail7030Curve = api._test.simulationRailPresetCurve(simulationBoard, "7030");
assert(rail5050Curve.length === rail7030Curve.length && rail5050Curve.some((item, index) => Math.abs(item.heightRatio - rail7030Curve[index].heightRatio) > 0.02), "simulation comparison: 50/50 and 70/30 should produce distinct apex paths");
assert(thrusterPreset.fins[1] < maxWidthFallbackPreset.fins[1], "fins: local-width off-rail placement should differ from max-width fallback near the tail");
api._test.applyFinSetupPreset("quad", false);
assert(editBoard.finSetup === "quad", "fins: quad preset did not set finSetup");
assert(editBoard.finExtra.length === 1, "fins: quad preset should add rear quad fins as extra data");
assert(editBoard.finToeIn > 0 && editBoard.finCant > 0, "fins: preset did not set Toe-in/Cant");
assert(editBoard.fins[0] < editBoard.length / 2, "fins: preset side rear should be placed from tail, not near nose");
assert(editBoard.fins[4] === 0 || editBoard.fins[4] < editBoard.length / 2, "fins: preset center rear should be placed from tail, not near nose");
assert(Math.abs(editBoard.finToeIn - api._test.finToeInFromFins(editBoard.fins)) < 1e-9, "fins: preset Toe-in should match the actual side-fin geometry");
api._test.applyFinSetupPreset("twin", false);
assert(editBoard.finSetup === "twin-performance", "fins: legacy twin preset should resolve to twin-performance");
api._test.applyFinSetupPreset("quad", false);
const extraStart = { ...editBoard.finExtra[0] };
api._test.moveFinDrag({ kind: "extra", side: 1, extraIndex: 0 }, editBoard.fins.slice(), 2, 1, editBoard.finExtra.map(item => ({ ...item })));
assert(Math.abs(editBoard.finExtra[0].rearX - (extraStart.rearX + 2)) < 1e-9, "fins: extra fin rear X did not move");
assert(Math.abs(editBoard.finExtra[0].frontY - (extraStart.frontY + 1)) < 1e-9, "fins: extra fin front Y did not move");
const extraMoved = { ...editBoard.finExtra[0] };
api._test.moveFinDrag({ kind: "extra", side: 1, extraIndex: 0, dragMode: "front" }, editBoard.fins.slice(), -3, -1, editBoard.finExtra.map(item => ({ ...item })));
assert(Math.abs(editBoard.finExtra[0].rearX - extraMoved.rearX) < 1e-9, "fins: extra fin front endpoint drag should not move rear X");
assert(Math.abs(editBoard.finExtra[0].frontX - (extraMoved.frontX - 3)) < 1e-9, "fins: extra fin front endpoint drag did not update front X");
const finBrd = api.makeBrd(editBoard);
const finRoundTrip = api.parseBrd(finBrd, "fin-test.brd");
assert(finRoundTrip.finSetup === "quad", "fins: finSetup did not survive BRD round trip");
assert(finRoundTrip.finExtra.length === 1, "fins: extra fin data did not survive BRD round trip");
trace("ghost-3d-edit:fins-done");

trace("ghost-3d-edit:section-panel-start");
api._test.updateSectionInfo();
const sectionIndexBeforeNav = api.state.currentSectionIndex;
const sectionSummaryBeforeNav = getElement("sectionSummary").textContent;
const sectionPositionBeforeNav = getElement("sectionPosition").value;
api._test.nextCrossSection();
api._test.updateSectionInfo();
assert(api.state.currentSectionIndex === sectionIndexBeforeNav + 1, "cross section panel: Next did not advance the selected section");
assert(getElement("sectionPosition").value === api.fmt(api.state.board.sections[api.state.currentSectionIndex].position), "cross section panel: sectionPosition did not sync after next");
api._test.previousCrossSection();
api._test.updateSectionInfo();
assert(api.state.currentSectionIndex === sectionIndexBeforeNav, "cross section panel: Previous did not restore the selected section");
assert(getElement("sectionPosition").value === sectionPositionBeforeNav, "cross section panel: section position field should restore after previous");
assert(getElement("sectionSummary").textContent === sectionSummaryBeforeNav, "cross section panel: section summary should restore after previous");
const originalSectionPosition = api.state.board.sections[api.state.currentSectionIndex].position;
const movedSectionTarget = originalSectionPosition + 12.5;
getElement("sectionPosition").value = String(movedSectionTarget);
api._test.moveCrossSectionFromPanel();
assert(Math.abs(api.state.board.sections[api.state.currentSectionIndex].position - movedSectionTarget) < 1e-9, "cross section panel: Move did not update section position");
api._test.updateSectionInfo();
assert(getElement("sectionPosition").value === api.fmt(movedSectionTarget), "cross section panel: sectionPosition did not resync after move");
getElement("sectionPosition").value = String(originalSectionPosition);
api._test.moveCrossSectionFromPanel();
assert(Math.abs(api.state.board.sections[api.state.currentSectionIndex].position - originalSectionPosition) < 1e-9, "cross section panel: Move did not restore the original position");
const sectionCountBeforeAdd = api.state.board.sections.length;
const addSectionTarget = Math.round(originalSectionPosition + 6);
getElement("sectionPosition").value = String(addSectionTarget);
api._test.addCrossSectionFromPanel();
assert(api.state.board.sections.length === sectionCountBeforeAdd + 1, "cross section panel: Add did not create a new cross section");
const addedSection = api.state.board.sections[api.state.currentSectionIndex];
assert(Math.abs(addedSection.position - addSectionTarget) < 1e-9, "cross section panel: Add did not select the inserted section");
assert((addedSection.guidePoints || []).length === 0, "cross section panel: Add should initialize guide points");
const addedSectionSnapshot = {
  spline: api._test.boardCadCloneKnots(addedSection.spline),
  guidePoints: (addedSection.guidePoints || []).map(point => ({ ...point }))
};
const originalAddedSerialized = api._test.serializeCrossSection(addedSection);
const copiedSourceSection = api.state.board.sections[Math.max(0, api.state.currentSectionIndex - 1)];
const copiedSourceSerialized = api._test.serializeCrossSection(copiedSourceSection);
api.state.currentSectionIndex = Math.max(0, api.state.currentSectionIndex - 1);
api._test.copyCurrentCrossSection();
api.state.currentSectionIndex = api.state.board.sections.indexOf(addedSection);
api._test.pasteCurrentCrossSection();
assert(api._test.serializeCrossSection(api.state.board.sections[api.state.currentSectionIndex]) !== copiedSourceSerialized, "cross section panel: Paste should rescale the copied spline to the target section position");
const sectionBeforeImport = api.state.board.sections[api.state.currentSectionIndex];
sectionBeforeImport.spline = api._test.boardCadCloneKnots(copiedSourceSection.spline);
sectionBeforeImport.guidePoints = (copiedSourceSection.guidePoints || []).map(point => ({ ...point }));
api._test.importCrossSectionText(originalAddedSerialized, "roundtrip.crs");
assertKnotsAlmostEqual(api.state.board.sections[api.state.currentSectionIndex].spline, addedSectionSnapshot.spline, "cross section panel: import roundtrip");
assert(JSON.stringify(api.state.board.sections[api.state.currentSectionIndex].guidePoints || []) === JSON.stringify(addedSectionSnapshot.guidePoints), "cross section panel: import should restore guide points");
assert(Math.abs(api.state.board.sections[api.state.currentSectionIndex].position - addSectionTarget) < 1e-9, "cross section panel: import should keep the target section position");
api._test.removeCurrentCrossSection();
assert(api.state.board.sections.length === sectionCountBeforeAdd, "cross section panel: Remove did not delete the inserted cross section");
const sectionCountBeforeFill = api.state.board.sections.length;
getElement("sectionInterval").value = "30";
api._test.fillCrossSectionsFromPanel();
assert(api.state.board.sections.length > sectionCountBeforeFill, "cross section panel: Fill did not add interval sections");
assert(api._test.findCrossSectionIndexNear(api.state.board, 30, 0.25) >= 0, "cross section panel: Fill did not add a section near 30");
assert(api._test.findCrossSectionIndexNear(api.state.board, 60, 0.25) >= 0, "cross section panel: Fill did not add a section near 60");
const sectionCountAfterFill = api.state.board.sections.length;
api._test.fillCrossSectionsFromPanel();
assert(api.state.board.sections.length === sectionCountAfterFill, "cross section panel: Fill should not duplicate existing interval sections");
trace("ghost-3d-edit:section-panel-done");

const outlineGuidePointCount = editBoard.outlineGuidePoints.length;
trace("ghost-3d-edit:guidepoints-start");
api.state.contextEditPoint = { x: editBoard.length * 0.4, y: editBoard.width * 0.1 };
api._test.addGuidePointAtContext();
assert(editBoard.outlineGuidePoints.length === outlineGuidePointCount + 1, "edit menu: Add Guide Point did not add an outline guide");
assert(api.state.guidePointSelection?.points === editBoard.outlineGuidePoints, "edit menu: added Guide point was not selected");
const guideIndex = editBoard.outlineGuidePoints.length - 1;
const guideX = editBoard.outlineGuidePoints[guideIndex].x;
api.state.editLocks.x = true;
api._test.moveSelectedGuidePointByKey("arrowright", 24);
assert(Math.abs(editBoard.outlineGuidePoints[guideIndex].x - guideX) < 1e-9, "edit menu: X locked did not constrain Guide point movement");
api.state.editLocks.x = false;
api._test.deleteSelectedGuidePoint();
assert(editBoard.outlineGuidePoints.length === outlineGuidePointCount, "edit menu: selected Guide point was not deleted");
api.state.contextEditPoint = { x: editBoard.length * 0.42, y: editBoard.width * 0.12 };
api._test.addGuidePointAtContext();
assert(editBoard.outlineGuidePoints.length === outlineGuidePointCount + 1, "edit menu: Add Guide Point failed before context delete test");
assert(api._test.editSelectedGuidePoint() === true, "edit menu: Edit Guide Point did not target the selected Guide point");
api._test.deleteSelectedGuidePoint();
assert(editBoard.outlineGuidePoints.length === outlineGuidePointCount, "edit menu: Delete Guide Point context path did not delete the selected Guide point");
assert(context.document.getElementById("contextEditGuidePoint"), "edit menu: Edit Guide Point context item is missing");
assert(context.document.getElementById("contextDeleteGuidePoint"), "edit menu: Delete Guide Point context item is missing");
trace("ghost-3d-edit:guidepoints-done");
trace("ghost-3d-edit:done");
}

if (sectionEnabled("scan-view")) {
  trace("scan-view:start");
  api.state.view = "scan";
  api.state.board = null;
  api.state.scan.currentPosition = { state: "Idle", x: 120, y: 450, z: 80 };
  api.state.scan.nose = { x: 0, y: 450, z: 80 };
  api.state.scan.tail = { x: 1800, y: 450, z: 80 };
  getElement("scanMeasuredLength").value = "1800";
  api._test.draw();
  trace("scan-view:done");
}

if (sectionEnabled("misc-help")) {
  trace("misc-help:start");
  getElement("miscCurveSegments").value = "18";
  getElement("miscModelLengthSegments").value = "22";
  getElement("miscModelWidthPoints").value = "9";
  api._test.applySettingsFromMenu();
  assert(getElement("segments").value === "18", "misc: apply settings did not update curve segments");
  assert(api.state.model3d.segmentCount === 22, "misc: apply settings did not update 3D length segments");
  assert(api.state.model3d.pointCount === 9, "misc: apply settings did not update 3D width points");
  assert(getElement("status").textContent.includes("設定") || getElement("status").textContent.includes("Settings"), "misc: apply settings did not update status");

  assert(api._test.setLanguage("en") === true, "misc: setLanguage should accept English");
  assert(api.state.language === "en", "misc: language did not switch to English");
  assert(getElement("status").textContent.includes("English") || getElement("status").textContent.includes("英語"), "misc: English language status was not reported");
  assert(api._test.setLanguage("ja") === true, "misc: setLanguage should accept Japanese");
  assert(api.state.language === "ja", "misc: language did not switch to Japanese");
  assert(getElement("status").textContent.includes("日本語") || getElement("status").textContent.includes("Japanese"), "misc: Japanese language status was not reported");

  api._test.showHelp();
  assert(getElement("appDialog").hidden === false, "help: dialog was not opened");
  assert(getElement("appDialogTitle").textContent.length > 0, "help: dialog title was not set");
  assert(documentStub.body.classList.contains("dialog-open"), "help: dialog-open body class was not applied");
  api._test.hideAppDialog();
  assert(getElement("appDialog").hidden === true, "help: dialog was not closed");
  assert(documentStub.body.classList.contains("dialog-open") === false, "help: dialog-open body class was not removed");

  api._test.showAbout();
  assert(getElement("appDialog").hidden === false, "about: dialog was not opened");
  assert(getElement("appDialogTitle").textContent.length > 0, "about: dialog title was not set");
  api._test.hideAppDialog();
  assert(getElement("appDialog").hidden === true, "about: dialog was not closed");
  trace("misc-help:done");
}

if (sectionEnabled("toolbar-dialogs")) {
  trace("toolbar-dialogs:start");
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-toolbar.brd");
  api.state.board = board;
  api.state.view = "outline";

  api._test.setActiveTool("zoom");
  assert(api.state.tool === "zoom", "toolbar: zoom tool did not become active");
  assert(getElement("status").textContent.includes("Zoom") || getElement("status").textContent.includes("ズーム"), "toolbar: zoom status was not reported");
  api._test.setActiveTool("pan");
  assert(api.state.tool === "pan", "toolbar: pan tool did not become active");
  api._test.setActiveTool("spot");
  assert(api.state.tool === "spot", "toolbar: spot tool did not become active");
  api._test.setActiveTool("edit");
  assert(api.state.tool === "edit", "toolbar: edit tool did not become active again");

  api.state.viewOptions.showGrid = false;
  api.state.viewOptions.showGhostBoard = false;
  api.state.viewOptions.showControlPoints = false;
  api._test.syncViewOptionInputs();
  assert(getElement("contextViewBlank").checked === false, "toolbar: context blank checkbox should remain independent from general sync");
  assert(api.state.viewOptions.showGrid === false, "toolbar: showGrid toggle did not hold state");
  assert(api.state.viewOptions.showGhostBoard === false, "toolbar: showGhostBoard toggle did not hold state");
  assert(api.state.viewOptions.showControlPoints === false, "toolbar: showControlPoints toggle did not hold state");
  api.state.viewOptions.showGrid = true;
  api.state.viewOptions.showGhostBoard = true;
  api.state.viewOptions.showControlPoints = true;

  api._test.promptScaleBoard();
  assert(getElement("appDialog").hidden === false, "dialogs: scale board prompt did not open");
  assert(getElement("appDialogTitle").textContent.length > 0, "dialogs: scale board prompt title was not set");
  api._test.hideAppDialog();
  assert(getElement("appDialog").hidden === true, "dialogs: scale board prompt did not close");

  api._test.showBoardInfo();
  assert(getElement("appDialog").hidden === false, "dialogs: board info did not open");
  assert((getElement("appDialogBody").innerHTML.length > 0) || (getElement("appDialogBody").children.length > 0), "dialogs: board info body was empty");
  api._test.hideAppDialog();
  assert(getElement("appDialog").hidden === true, "dialogs: board info did not close");
  trace("toolbar-dialogs:done");
}

if (sectionEnabled("dialogs-cross-section")) {
  trace("dialogs-cross-section:start");
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-dialog-cross-section.brd");
  trace("dialogs-cross-section:parsed");
  api.state.board = board;
  api.state.view = "cross";
  // Pick the section nearest mid-board (the raw min/max clamp used before
  // could land on the non-editable nose endpoint section left selected by
  // an earlier scenario, making basePosition + 7 exceed the board length —
  // the dialog then correctly rejects the value and this test failed).
  {
    const mid = board.length / 2;
    let best = 0;
    for (let i = 0; i < board.sections.length; i++) {
      if (Math.abs(board.sections[i].position - mid)
          < Math.abs(board.sections[best].position - mid)) best = i;
    }
    api.state.currentSectionIndex = best;
  }

  const sectionCountBeforeAdd = api.state.board.sections.length;
  const basePosition = api.state.board.sections[api.state.currentSectionIndex].position;
  api._test.promptAddCrossSection();
  trace("dialogs-cross-section:prompted");
  assert(getElement("appDialog").hidden === false, "cross section dialog: prompt did not open");
  assert(api.state.dialog.keepOpenOnSuccess === true, "cross section dialog: prompt should remain open after submit");
  assert(api._test.submitDialogValues({ position: String(Math.round(basePosition + 7)) }) === true, "cross section dialog: first submit was not handled");
  trace("dialogs-cross-section:submitted-first");
  assert(getElement("appDialog").hidden === false, "cross section dialog: prompt should remain open after first submit");
  assert(api.state.board.sections.length === sectionCountBeforeAdd + 1, "cross section dialog: first submit did not add a section");
  assert(api._test.submitDialogValues({ position: String(Math.round(basePosition + 13)) }) === true, "cross section dialog: second submit was not handled");
  trace("dialogs-cross-section:submitted-second");
  assert(getElement("appDialog").hidden === false, "cross section dialog: prompt should remain open after second submit");
  assert(api.state.board.sections.length === sectionCountBeforeAdd + 2, "cross section dialog: second submit did not add a section");
  api._test.hideAppDialog();
  trace("dialogs-cross-section:closed");
  assert(getElement("appDialog").hidden === true, "cross section dialog: close did not hide the prompt");
  assert(api.state.dialog.keepOpenOnSuccess === false, "cross section dialog: close should reset keepOpenOnSuccess");
  trace("dialogs-cross-section:done");
}

if (sectionEnabled("menu-wiring")) {
  trace("menu-wiring:start");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const actionMatches = [...html.matchAll(/data-action="([^"]+)"/g)].map(match => match[1]);
  const viewMatches = [...html.matchAll(/data-view="([^"]+)"/g)].map(match => match[1]);
  const viewOptionMatches = [...html.matchAll(/data-view-option="([^"]+)"/g)].map(match => match[1]);

  const htmlActions = [...new Set(actionMatches)];
  const htmlViews = [...new Set(viewMatches)];
  const htmlViewOptions = [...new Set(viewOptionMatches)];
  const knownActions = new Set(Object.keys(api._test.ACTION_HANDLERS));
  const knownViews = new Set(api._test.VALID_VIEWS);
  const knownViewOptions = new Set(api._test.VIEW_OPTION_KEYS);

  const missingActions = htmlActions.filter(action => !knownActions.has(action));
  const missingViews = htmlViews.filter(view => !knownViews.has(view));
  const missingViewOptions = htmlViewOptions.filter(option => !knownViewOptions.has(option));

  assert(missingActions.length === 0, `menu wiring: missing action handlers for ${missingActions.join(", ")}`);
  assert(missingViews.length === 0, `menu wiring: missing valid views for ${missingViews.join(", ")}`);
  assert(missingViewOptions.length === 0, `menu wiring: missing view options for ${missingViewOptions.join(", ")}`);
  trace("menu-wiring:done");
}

if (sectionEnabled("rail")) {
  trace("rail:start");
  const longboardText = fs.readFileSync(path.join(root, "Longboard.brd"), "utf8");
  const shortboardText = fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8");
  context.window.BOARDCAD_SAMPLE_DATA = {
    ...(context.window.BOARDCAD_SAMPLE_DATA || {}),
    "Longboard.brd": longboardText,
    "Shortboard.brd": shortboardText
  };
  const board = api.parseBrd(longboardText, "Longboard-rail.brd");
  const shortboardRailReference = api.parseBrd(shortboardText, "Shortboard-rail-reference.brd");
  board.railMode = "7030";
  board.railStrength = 0.72;
  const railMetadataRoundTrip = api.parseBrd(api.makeBrd(board), "Longboard-rail-metadata-roundtrip.brd");
  assert(railMetadataRoundTrip.railMode === "7030", "rail: canonical rail mode should roundtrip through BRD for later re-editing");
  assert(Math.abs(railMetadataRoundTrip.railStrength - 0.72) < 1e-9, "rail: rail shape blend should roundtrip through BRD for later re-editing");
  board.railProfile = { nose: "5050", mid: "6040", tail: "down", order: ["5050", "6040", "down"], tailAnchor: 0.15, midAnchor: 0.52, noseAnchor: 0.86 };
  const railProfileRoundTrip = api.parseBrd(api.makeBrd(board), "rail-profile-roundtrip.brd");
  assert(railProfileRoundTrip.railProfile.nose === "5050" && railProfileRoundTrip.railProfile.mid === "6040" && railProfileRoundTrip.railProfile.tail === "down", "rail: longitudinal rail profile should roundtrip through BRD");
  assert(railProfileRoundTrip.railProfile.order.join(",") === "5050,6040,down", "rail: nose-to-tail selection order should roundtrip through BRD");
  assert(Math.abs(railProfileRoundTrip.railProfile.tailAnchor - 0.15) < 1e-9 && Math.abs(railProfileRoundTrip.railProfile.midAnchor - 0.52) < 1e-9 && Math.abs(railProfileRoundTrip.railProfile.noseAnchor - 0.86) < 1e-9, "rail: three visual shape anchors should roundtrip through BRD");
  assert(api._test.railProfileAtSection(board, { position: board.length * 0.08 }).from === "down", "rail: tail pure zone should preserve the tail mode");
  const middleRail = api._test.railProfileAtSection(board, { position: board.length * 0.5 });
  assert(middleRail.from === "down" && middleRail.to === "6040" && middleRail.mix > 0.9, "rail: section before the middle anchor should approach the middle rail mode");
  assert(api._test.railProfileAtSection(board, { position: board.length * 0.94 }).from === "5050", "rail: nose pure zone should preserve the nose mode");
  const profileSections = [0.2, 0.5, 0.8].map(ratio => {
    const source = shortboardRailReference.sections.reduce((best, section) => Math.abs(section.position / shortboardRailReference.length - ratio) < Math.abs(best.position / shortboardRailReference.length - ratio) ? section : best);
    const section = { ...source, spline: api._test.boardCadCloneKnots(source.spline) };
    const variant = { ...shortboardRailReference, railMode: "6040", railProfile: board.railProfile, railStrength: 1 };
    api._test.applyBoardRailAndEdgeToSection(variant, section);
    const apex = section.spline.reduce((best, knot) => knot.p.x > best.p.x ? knot : best, section.spline[0]);
    return apex.p.y / api._test.boardCadCrossSectionCenterThickness(section.spline);
  });
  assert(profileSections[0] < profileSections[1] && profileSections[1] < profileSections[2], "rail: down→60/40→50/50 profile should raise the apex smoothly from tail to nose");
  board.railMode = "";
  board.railStrength = 1;
  const center = board.sections.reduce((best, section) => (
    Math.abs(section.position - board.length * 0.5) < Math.abs(best.position - board.length * 0.5) ? section : best
  ), board.sections[0]);
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midpoint = line => ({
    x: (line[0].x + line[1].x) * 0.5,
    y: (line[0].y + line[1].y) * 0.5
  });

  const rail5050 = api._test.railBandGuideGeometry(center.spline, "5050");
  assert(rail5050, "rail: 50/50 guide geometry missing");
  assert(rail5050.rightDeckBands.length === 3, "rail: 50/50 should build three deck rail bands");
  assert(rail5050.rightBottomBands.length === 3, "rail: true 50/50 should build mirrored bottom-side band construction");
  assert(distance(rail5050.rightDeckBands[0][1], rail5050.railMark) <= 1e-9, "rail: primary deck band should terminate at rail mark");
  assert(distance(rail5050.rightDeckBands[1][1], midpoint(rail5050.rightDeckBands[0])) <= 1e-9, "rail: secondary deck band should terminate at primary midpoint");
  assert(distance(rail5050.rightDeckBands[2][1], midpoint(rail5050.rightDeckBands[1])) <= 1e-9, "rail: tertiary deck band should terminate at secondary midpoint");
  assert(distance(rail5050.rightBottomBands[1][1], midpoint(rail5050.rightBottomBands[0])) <= 1e-9, "rail: 50/50 bottom secondary band should terminate at bottom primary midpoint");

  const downRail = api._test.railBandGuideGeometry(center.spline, "down");
  assert(downRail, "rail: down rail guide geometry missing");
  assert(downRail.rightDeckBands.length === 3, "rail: down rail should keep deck band construction");
  assert(downRail.rightBottomBands.length === 1, "rail: down rail should use a single tuck-side bottom guide");
  assert(distance(downRail.rightBottomBands[0][1], downRail.railMark) <= 1e-9, "rail: down rail tuck guide should terminate at rail mark");

  const sourceRailIndex = center.spline.reduce((best, knot, index, knots) => (
    knot.p.x > knots[best].p.x ? index : best
  ), 0);
  const shaped6040 = {
    ...center,
    spline: api._test.boardCadCloneKnots(center.spline)
  };
  api._test.applyRailModeToSection(shaped6040, "6040", 1);
  const shaped6040RailIndex = shaped6040.spline.reduce((best, knot, index, knots) => (
    knot.p.x > knots[best].p.x ? index : best
  ), 0);
  const shaped6040Thickness = api._test.boardCadCrossSectionCenterThickness(shaped6040.spline);
  assert(Math.abs((shaped6040.spline[shaped6040RailIndex].p.y / shaped6040Thickness) - 0.40) < 0.02, "rail: 60/40 apex should resolve near 40 percent of thickness from the bottom");
  assert(shaped6040.spline[shaped6040RailIndex].continuous !== false, "rail: 60/40 apex should remain a smooth semantic landmark");

  const shaped5050 = {
    ...center,
    spline: api._test.boardCadCloneKnots(center.spline)
  };
  api._test.applyRailModeToSection(shaped5050, "5050", 1);
  const shapedRailIndex = shaped5050.spline.reduce((best, knot, index, knots) => (
    knot.p.x > knots[best].p.x ? index : best
  ), 0);
  const sourceThickness = api._test.boardCadCrossSectionCenterThickness(center.spline);
  const sourceApexY = center.spline[sourceRailIndex].p.y;
  const shapedApexY = shaped5050.spline[shapedRailIndex].p.y;
  assert(Math.abs((shapedApexY / sourceThickness) - 0.5) < 0.02, "rail: 50/50 apex should be generated near the rail-curve midpoint");
  assert(Math.abs(shapedApexY - sourceApexY) > 0.4, "rail: 50/50 should differ from the longboard 60/40 reference apex");
  const shaped5050Thickness = api._test.boardCadCrossSectionCenterThickness(shaped5050.spline);
  for (let lowerIndex = 0, upperIndex = shaped5050.spline.length - 1; lowerIndex < upperIndex; lowerIndex += 1, upperIndex -= 1) {
    const lower = shaped5050.spline[lowerIndex];
    const upper = shaped5050.spline[upperIndex];
    assert(Math.abs(lower.p.x - upper.p.x) < 1e-6, "rail: 50/50 lower and upper landmarks should share the same inset");
    assert(Math.abs((lower.p.y + upper.p.y) - shaped5050Thickness) < 1e-6, "rail: 50/50 lower and upper fullness should mirror around half thickness");
  }

  const railModeStats = mode => {
    const shaped = {
      ...center,
      spline: api._test.boardCadCloneKnots(center.spline)
    };
    api._test.applyRailModeToSection(shaped, mode, 1);
    const railIndex = shaped.spline.reduce((best, knot, index, knots) => (
      knot.p.x > knots[best].p.x ? index : best
    ), 0);
    return {
      apexYRatio: shaped.spline[railIndex].p.y / sourceThickness,
      shoulderXRatio: shaped.spline[railIndex - 1].p.x / (sourceWidth * 0.5),
      width: api._test.boardCadCrossSectionWidth(shaped.spline),
      knots: shaped.spline.length
    };
  };
  const sourceWidth = api._test.boardCadCrossSectionWidth(center.spline);
  const railStats = {
    "5050": railModeStats("5050"),
    "6040": railModeStats("6040"),
    "7030": railModeStats("7030"),
    "8020": railModeStats("8020"),
    egg: railModeStats("egg"),
    "full-soft": railModeStats("full-soft"),
    boxy: railModeStats("boxy"),
    down: railModeStats("down"),
    pinched: railModeStats("pinched"),
    knifey: railModeStats("knifey"),
    chine: railModeStats("chine"),
    "tucked-edge": railModeStats("tucked-edge"),
    "hard-edge": railModeStats("hard-edge")
  };
  assert(railStats["5050"].apexYRatio > railStats["6040"].apexYRatio, "rail: 50/50 apex should sit above 60/40");
  assert(railStats["6040"].apexYRatio > railStats["7030"].apexYRatio, "rail: 70/30 apex should sit below 60/40");
  assert(railStats["7030"].apexYRatio > railStats["8020"].apexYRatio, "rail: 80/20 apex should sit below 70/30");
  assert(railStats["8020"].apexYRatio > railStats.down.apexYRatio, "rail: down rail apex should sit below 80/20");
  assert(railStats.egg.apexYRatio > railStats["7030"].apexYRatio, "rail: egg rail should keep a higher soft apex than down-rail profiles");
  assert(railStats["full-soft"].apexYRatio > railStats.egg.apexYRatio, "rail: full soft rail should keep more rounded upper volume than egg rail");
  assert(railStats.boxy.apexYRatio > railStats.down.apexYRatio, "rail: boxy rail should keep more rail volume than down rail");
  assert(railStats.boxy.shoulderXRatio > railStats["full-soft"].shoulderXRatio, "rail: boxy rail should keep a fuller outer shoulder than semi boxy");
  assert(railStats["full-soft"].shoulderXRatio > railStats.pinched.shoulderXRatio, "rail: semi boxy should keep a fuller outer shoulder than tapered");
  assert(railStats.pinched.apexYRatio > railStats["8020"].apexYRatio, "rail: pinched rail apex should stay above 80/20 while reducing rail fullness");
  assert(railStats.knifey.apexYRatio < railStats.pinched.apexYRatio, "rail: knifey rail should reduce volume below pinched rail");
  assert(railStats["tucked-edge"].apexYRatio < railStats["8020"].apexYRatio, "rail: tucked edge apex should sit below 80/20");
  assert(railStats["hard-edge"].apexYRatio < railStats["tucked-edge"].apexYRatio, "rail: hard edge should sit below tucked edge");
  const railFlowBoard = { length: 300 };
  const railFlow = position => api._test.railLongitudinalStrengthFactor(railFlowBoard, { position });
  assert(railFlow(0) === 0 && railFlow(300) === 0, "rail: longitudinal shaping should return to the authored tip sections");
  assert(railFlow(30) > 0 && railFlow(30) < railFlow(45), "rail: tail rail shaping should grow smoothly toward the body");
  assert(Math.abs(railFlow(150) - 1) < 1e-9, "rail: selected rail profile should be fully expressed through the board body");
  assert(railFlow(270) > 0 && railFlow(270) < railFlow(255), "rail: nose rail shaping should fade smoothly toward the tip");
  const shapedChine = {
    ...center,
    spline: api._test.boardCadCloneKnots(center.spline)
  };
  api._test.applyRailModeToSection(shapedChine, "chine", 1);
  assert(shapedChine.spline.some(knot => knot.continuous === false), "rail: chined rail should introduce corner knots for bevel control");
  const shapedHardEdge = {
    ...center,
    spline: api._test.boardCadCloneKnots(center.spline)
  };
  api._test.applyRailModeToSection(shapedHardEdge, "hard-edge", 1);
  assert(shapedHardEdge.spline.some(knot => knot.continuous === false), "rail: hard edge should introduce corner knots for release control");
  const shortTailSections = shortboardRailReference.sections.slice().sort((a, b) => a.position - b.position);
  const sourceBoxySection = shortTailSections[1];
  const shapedBoxyReference = {
    ...sourceBoxySection,
    spline: api._test.boardCadCloneKnots(sourceBoxySection.spline)
  };
  api._test.applyRailModeToSection(shapedBoxyReference, "boxy", 1);
  assert(
    shapedBoxyReference.spline.some((knot, index) => (
      Math.abs(knot.p.x - sourceBoxySection.spline[index].p.x) > 1e-5
      || Math.abs(knot.p.y - sourceBoxySection.spline[index].p.y) > 1e-5
    )),
    "rail: boxy rail should resolve from the canonical profile instead of copying one legacy sample section"
  );
  assert(
    Math.abs(api._test.boardCadCrossSectionWidth(shapedBoxyReference.spline) - api._test.boardCadCrossSectionWidth(sourceBoxySection.spline)) < 1e-6,
    "rail: canonical boxy rail should preserve the source section width"
  );
  assert(
    shapedBoxyReference.spline.every(knot => knot.continuous !== false),
    "rail: boxy fullness should not introduce hard corners"
  );
  const edgeBoard = api.parseBrd(longboardText, "Longboard-edge.brd");
  edgeBoard.railMode = "6040";
  edgeBoard.railStrength = 1;
  edgeBoard.edgeType = "hard";
  edgeBoard.edgeStrength = 1;
  edgeBoard.edgeLength = edgeBoard.length;
  edgeBoard.edgeFade = 0;
  const railOnly = {
    ...center,
    spline: api._test.boardCadCloneKnots(center.spline)
  };
  api._test.applyRailModeToSection(railOnly, "6040", 1);
  const edged = {
    ...center,
    spline: api._test.boardCadCloneKnots(center.spline)
  };
  api._test.applyBoardRailAndEdgeToSection(edgeBoard, edged);
  const edgeRailIndex = edged.spline.reduce((best, knot, index, knots) => (
    knot.p.x > knots[best].p.x ? index : best
  ), 0);
  const edgeLowerIndex = edgeRailIndex - 1;
  const edgeUpperIndex = edgeRailIndex + 1;
  assert(edged.spline[edgeLowerIndex].continuous === false, "rail: hard edge section should corner the lower tuck point");
  assert(edged.spline[edgeRailIndex].continuous !== false, "rail: hard bottom edge must not turn the rail apex into a corner");
  assert(edged.spline[edgeLowerIndex].p.y <= railOnly.spline[edgeLowerIndex].p.y + 1e-6, "rail: hard edge should flatten the lower/tuck side, not thicken it");
  assert(Math.abs(edged.spline[edgeUpperIndex].p.x - railOnly.spline[edgeUpperIndex].p.x) < 1e-6, "rail: edge should not move deck-side rail point x");
  assert(Math.abs(edged.spline[edgeUpperIndex].p.y - railOnly.spline[edgeUpperIndex].p.y) < 1e-6, "rail: edge should not move deck-side rail point y");
  const softEdged = {
    ...center,
    spline: api._test.boardCadCloneKnots(railOnly.spline)
  };
  api._test.applyEdgeModeToSection(softEdged, "soft", 1);
  const softRailIndex = softEdged.spline.reduce((best, knot, index, knots) => (
    knot.p.x > knots[best].p.x ? index : best
  ), 0);
  const softLower = softEdged.spline[softRailIndex - 1];
  const softInX = softLower.p.x - softLower.prev.x;
  const softInY = softLower.p.y - softLower.prev.y;
  const softOutX = softLower.next.x - softLower.p.x;
  const softOutY = softLower.next.y - softLower.p.y;
  const softTangentCosine = ((softInX * softOutX) + (softInY * softOutY))
    / (Math.hypot(softInX, softInY) * Math.hypot(softOutX, softOutY));
  assert(softLower.continuous !== false, "rail: soft edge must not create a release crease");
  assert(softTangentCosine > 0.999, "rail: soft edge should remain tangent-continuous through the lower rail");
  assert(softEdged.spline[softRailIndex].continuous !== false, "rail: soft edge should preserve the smooth rail apex");
  const edgeOutsideSection = { ...center, position: edgeBoard.length, spline: api._test.boardCadCloneKnots(center.spline) };
  edgeBoard.edgeLength = 1;
  api._test.applyBoardRailAndEdgeToSection(edgeBoard, edgeOutsideSection);
  const railOutsideSection = { ...center, position: edgeBoard.length, spline: api._test.boardCadCloneKnots(center.spline) };
  api._test.applyBoardRailAndEdgeToSection({ ...edgeBoard, edgeType: "" }, railOutsideSection);
  assertKnotsAlmostEqual(edgeOutsideSection.spline, railOutsideSection.spline, "rail: edge should fade to rail-only outside tail range");
  edgeBoard.edgeType = "tucked";
  edgeBoard.edgeStrength = 0.65;
  edgeBoard.edgeLength = 48;
  edgeBoard.edgeFade = 12;
  const edgeRoundTrip = api.parseBrd(api.makeBrd(edgeBoard), "Longboard-edge-roundtrip.brd");
  assert(edgeRoundTrip.edgeType === "tucked", "rail: edge type should roundtrip through BRD");
  assert(Math.abs(edgeRoundTrip.edgeStrength - 0.65) < 1e-9, "rail: edge strength should roundtrip through BRD");
  assert(Math.abs(edgeRoundTrip.edgeLength - 48) < 1e-9, "rail: edge length should roundtrip through BRD");
  assert(Math.abs(edgeRoundTrip.edgeFade - 12) < 1e-9, "rail: edge fade should roundtrip through BRD");
  const edgeFadeConfig = api._test.normalizedEdgeConfig(edgeRoundTrip);
  const fadeQuarterPosition = edgeFadeConfig.length - (edgeFadeConfig.fade * 0.25);
  const fadeQuarterStrength = api._test.edgeEffectAtSection(edgeRoundTrip, { position: fadeQuarterPosition }, edgeFadeConfig);
  const smootherQuarter = 0.25 ** 3 * ((0.25 * ((0.25 * 6) - 15)) + 10);
  assert(
    Math.abs(fadeQuarterStrength - (edgeFadeConfig.strength * smootherQuarter)) < 1e-9,
    "rail: edge longitudinal fade should use curvature-safe quintic smootherstep"
  );
  const handlesFollowPath = knots => knots.every((knot, index) => {
    if (!knot?.p) return true;
    if (index > 0 && knot.prev) {
      const prev = knots[index - 1];
      const segX = prev.p.x - knot.p.x;
      const segY = prev.p.y - knot.p.y;
      const handleX = knot.prev.x - knot.p.x;
      const handleY = knot.prev.y - knot.p.y;
      if (((segX * handleX) + (segY * handleY)) < -1e-7) return false;
    }
    if (index < knots.length - 1 && knot.next) {
      const next = knots[index + 1];
      const segX = next.p.x - knot.p.x;
      const segY = next.p.y - knot.p.y;
      const handleX = knot.next.x - knot.p.x;
      const handleY = knot.next.y - knot.p.y;
      if (((segX * handleX) + (segY * handleY)) < -1e-7) return false;
    }
    return true;
  });
  assert(handlesFollowPath(shapedBoxyReference.spline), "rail: boxy handles should not reverse into S curves");
  assert(handlesFollowPath(edged.spline), "rail: edge handles should not reverse into S curves");
  const tangentCosine = (knot) => {
    const inX = knot.p.x - knot.prev.x;
    const inY = knot.p.y - knot.prev.y;
    const outX = knot.next.x - knot.p.x;
    const outY = knot.next.y - knot.p.y;
    const denom = Math.hypot(inX, inY) * Math.hypot(outX, outY);
    return denom > 1e-9 ? ((inX * outX) + (inY * outY)) / denom : 1;
  };
  ["6040", "7030", "8020", "egg", "full-soft", "boxy", "down", "pinched", "knifey", "chine", "tucked-edge", "hard-edge"].forEach(mode => {
    const shaped = {
      ...center,
      spline: api._test.boardCadCloneKnots(center.spline)
    };
    api._test.applyRailModeToSection(shaped, mode, 1);
    const railIndex = shaped.spline.reduce((best, knot, index, knots) => (
      knot.p.x > knots[best].p.x ? index : best
    ), 0);
    const upper = shaped.spline[railIndex + 1];
    assert(upper && tangentCosine(upper) > 0.985, `rail: ${mode} deck-side rail tangent should be smooth (${upper ? tangentCosine(upper) : "missing"})`);
    if (mode === "6040" || mode === "7030" || mode === "8020" || mode === "egg" || mode === "full-soft" || mode === "boxy" || mode === "down" || mode === "pinched" || mode === "knifey") {
      const lower = shaped.spline[railIndex - 1];
      assert(lower && tangentCosine(lower) > 0.999, `rail: ${mode} bottom-side rail tangent should be G1 continuous`);
      assert(tangentCosine(upper) > 0.999, `rail: ${mode} deck-side rail tangent should be G1 continuous (${tangentCosine(upper)})`);
    }
  });
  Object.entries(railStats).forEach(([mode, stats]) => {
    assert(stats.knots === center.spline.length, `rail: ${mode} should preserve editable knot count`);
    assert(Math.abs(stats.width - sourceWidth) < 1e-6, `rail: ${mode} should preserve section width`);
  });
  trace("rail:done");
}

if (sectionEnabled("bottom-features")) {
  trace("bottom-features:start");
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-bottom-features.brd");
  trace("bottom-features:parsed-shortboard");
  board.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "single concave", start: 12, peak: 90, end: 156, depth: 0.55, width: 0.78, power: 1.8 },
    { type: "vee", start: 120, peak: 156, end: 182, depth: 0.3, width: 1.0, power: 1.25 },
    { type: "channel", start: 132, peak: 156, end: 182, depth: 0.25, width: 0.14, offset: 0.58, count: 2, spacing: 0.08 }
  ]);
  trace("bottom-features:normalized");
  assert(board.bottomFeatures.length === 3, "bottom features: normalization did not keep three features");
  assert(board.bottomFeatures[0].type === "single-concave", "bottom features: single concave alias did not normalize");
  assert(api._test.normalizeBottomPresetKey("performance-channel-quad") === "performance-channel-quad", "bottom features: preset key normalization failed");
  assert(api._test.normalizeBottomPresetKey("unknown") === "custom", "bottom features: unknown preset should normalize to custom");
  const shortPresetContext = api._test.bottomPresetContext({ length: 185, width: 48 });
  const longPresetContext = api._test.bottomPresetContext({ length: 300, width: 60 });
  assert(shortPresetContext.shortness > longPresetContext.shortness, "bottom features: short preset context should report greater shortness");
  assert(longPresetContext.longness > shortPresetContext.longness, "bottom features: long preset context should report greater longness");
  const presetHull = api._test.bottomPresetFeatures("displacement-hull", board);
  const presetSingleDouble = api._test.bottomPresetFeatures("shortboard-single-to-double", board);
  const presetSingleVee = api._test.bottomPresetFeatures("shortboard-single-to-vee", board);
  const presetRolledVee = api._test.bottomPresetFeatures("longboard-rolled-vee", board);
  const presetChannelQuad = api._test.bottomPresetFeatures("performance-channel-quad", board);
  const presetTriPlane = api._test.bottomPresetFeatures("tri-plane-hull", board);
  const presetHydro = api._test.bottomPresetFeatures("hydro-hull", board);
  const riderPaddle = api._test.bottomPresetFeatures("rider-paddle-glide", board);
  const riderBalanced = api._test.bottomPresetFeatures("rider-balanced-control", board);
  const riderSpeed = api._test.bottomPresetFeatures("rider-speed-drive", board);
  const riderLoose = api._test.bottomPresetFeatures("rider-loose-turn", board);
  trace("bottom-features:generated-presets");
  assert(
    presetHull.length === 1 && presetHull[0].type === "displacement-hull",
    "bottom features: displacement hull preset should create one displacement-hull feature"
  );
  assert(presetSingleDouble.length === 2 && presetSingleDouble[1].type === "double-concave", "bottom features: shortboard single to double preset shape mismatch");
  assert(presetSingleDouble[0].start < presetSingleDouble[1].start, "bottom features: single-to-double preset should keep the double concave aft of the lead single concave");
  assert(Math.abs(presetSingleDouble[1].end - board.length) < 1e-9, "bottom features: single-to-double preset should carry the double concave to the tail");
  assert(presetSingleVee[1].start > board.length * 0.45, "bottom features: single-to-vee preset should place vee on the aft half of the board");
  assert(Math.abs(presetSingleVee[1].end - board.length) < 1e-9, "bottom features: single-to-vee preset should carry vee to the tail");
  assert(presetRolledVee[1].start > presetRolledVee[0].start, "bottom features: rolled vee preset should place vee aft of the entry hull");
  assert(Math.abs(presetRolledVee[1].end - board.length) < 1e-9, "bottom features: rolled vee preset should carry vee to the tail");
  assert(presetChannelQuad.some(feature => feature.type === "channel"), "bottom features: performance channel quad preset should include channels");
  assert(presetTriPlane.length === 1 && presetTriPlane[0].type === "double-concave", "bottom features: tri plane hull preset should use shallow double concave");
  assert(presetHydro.some(feature => feature.type === "vee") && presetHydro.some(feature => feature.type === "double-concave"), "bottom features: hydro hull preset should combine vee and double concave");
  assert(presetChannelQuad[2].start > presetChannelQuad[1].start, "bottom features: channel preset should place channels aft of the double concave");
  assert(Math.abs(presetChannelQuad[2].end - board.length) < 1e-9, "bottom features: channel preset should carry channels to the tail");
  assert(riderPaddle.length === 1 && riderPaddle[0].type === "hull", "bottom features: paddle/glide should use a smooth entry hull");
  assert(riderBalanced.length === 2 && riderBalanced[0].type === "single-concave" && riderBalanced[1].type === "vee", "bottom features: balanced control composition mismatch");
  assert(riderSpeed.length === 2 && riderSpeed[1].type === "double-concave", "bottom features: speed/drive should transition to double concave");
  assert(riderLoose.length === 1 && riderLoose[0].type === "vee", "bottom features: loose turn should use a shallow tail vee");
  const shortboardForPreset = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-preset-shape.brd");
  const longboardForPreset = api.parseBrd(fs.readFileSync(path.join(root, "Longboard.brd"), "utf8"), "Longboard-preset-shape.brd");
  trace("bottom-features:parsed-preset-boards");
  const shortboardSingleToDouble = api._test.bottomPresetFeatures("shortboard-single-to-double", shortboardForPreset);
  const longboardSingleToDouble = api._test.bottomPresetFeatures("shortboard-single-to-double", longboardForPreset);
  assert(shortboardSingleToDouble[0].depth > longboardSingleToDouble[0].depth, "bottom features: shortboard preset should create deeper lead concave than longboard");
  assert(shortboardSingleToDouble[1].railDepth > longboardSingleToDouble[1].railDepth, "bottom features: shortboard preset should create deeper double concave rail depth than longboard");
  const shortboardChannelQuad = api._test.bottomPresetFeatures("performance-channel-quad", shortboardForPreset);
  const longboardChannelQuad = api._test.bottomPresetFeatures("performance-channel-quad", longboardForPreset);
  assert(shortboardChannelQuad[2].railDepth > longboardChannelQuad[2].railDepth, "bottom features: shortboard channel preset should be deeper than longboard");
  assert(shortboardChannelQuad[2].count <= longboardChannelQuad[2].count, "bottom features: wider boards may support equal or more channels than narrow boards");

  const brd = api.makeBrd(board);
  assert(brd.includes("p83 : "), "bottom features: BRD export did not include p83");
  board.bottomPreset = "shortboard-single-to-double";
  const presetBrd = api.makeBrd(board);
  assert(presetBrd.includes("p84 : shortboard-single-to-double"), "bottom features: BRD export did not include p84 bottom preset extension");
  const roundTrip = api.parseBrd(brd, "Shortboard-bottom-features-roundtrip.brd");
  assert(roundTrip.bottomFeatures.length === 3, "bottom features: BRD round trip lost features");
  assert(roundTrip.bottomFeatures[1].type === "vee", "bottom features: vee feature did not survive BRD round trip");
  const presetRoundTrip = api.parseBrd(presetBrd, "Shortboard-bottom-preset-roundtrip.brd");
  assert(presetRoundTrip.bottomPreset === "shortboard-single-to-double", "bottom features: BRD round trip lost bottom preset extension");
  trace("bottom-features:roundtrip-done");
  const hullDefaults = api._test.bottomFeatureDefault("hull", 0, 300, 58);
  const singleDefaults = api._test.bottomFeatureDefault("single-concave", 0, 300, 58);
  const doubleDefaults = api._test.bottomFeatureDefault("double-concave", 0, 300, 58);
  const veeDefaults = api._test.bottomFeatureDefault("vee", 0, 300, 58);
  const spiralDefaults = api._test.bottomFeatureDefault("spiral-vee", 0, 300, 58);
  const channelDefaults = api._test.bottomFeatureDefault("channel", 0, 300, 58);
  assert(hullDefaults.start < singleDefaults.start, "bottom features: hull default should start ahead of single concave");
  assert(doubleDefaults.start > singleDefaults.start, "bottom features: double concave default should start farther aft than single concave");
  assert(veeDefaults.start > singleDefaults.start, "bottom features: vee default should start aft of the lead single concave");
  assert(veeDefaults.end === 300, "bottom features: vee default should reach the tail end");
  assert(spiralDefaults.start < veeDefaults.start, "bottom features: spiral vee should start farther forward than panel vee");
  assert(spiralDefaults.peak > veeDefaults.peak, "bottom features: spiral vee should peak closer to the tail than panel vee");
  assert(spiralDefaults.end === 300, "bottom features: spiral vee default should reach the tail end");
  assert(channelDefaults.start > doubleDefaults.start, "bottom features: channel default should start farthest aft");
  assert(channelDefaults.end === 300, "bottom features: channel default should reach the tail end");
  assert(hullDefaults.end < singleDefaults.end, "bottom features: hull default should end earlier than single concave");
  const shortSingle = api._test.bottomFeatureDefault("single-concave", 0, 185, 48);
  const longSingle = api._test.bottomFeatureDefault("single-concave", 0, 300, 58);
  assert(shortSingle.depth > longSingle.depth, "bottom features: shortboard single concave should default deeper than longboard");
  assert(shortSingle.width < longSingle.width, "bottom features: shortboard single concave should default narrower than longboard");
  const shortChannel = api._test.bottomFeatureDefault("channel", 0, 185, 48);
  const longChannel = api._test.bottomFeatureDefault("channel", 0, 300, 58);
  assert(shortChannel.railDepth > longChannel.railDepth, "bottom features: shortboard channel should default deeper than longboard");
  assert(shortChannel.spacing < longChannel.spacing, "bottom features: shortboard channel should default tighter than longboard");
  assert(shortChannel.count >= 4 && longChannel.count >= shortChannel.count, "bottom features: channel defaults should use a realistic 4+ groove layout");
  const narrowHull = api._test.bottomFeatureDefault("hull", 0, 300, 50);
  const wideHull = api._test.bottomFeatureDefault("hull", 0, 300, 60);
  assert(wideHull.width > narrowHull.width, "bottom features: wider hull boards should default to a broader hull panel");
  assert(wideHull.depth <= narrowHull.depth, "bottom features: wider hull boards should not default deeper than narrow hull boards");
  const normalizedDouble = api._test.normalizeBottomFeatures([{ type: "double-concave", depth: 3.2, centerDepth: 0.22, railDepth: 0.64, offset: 0.1 }])[0];
  assert(normalizedDouble.depth === 0, "bottom features: double concave should ignore the scalar depth field");
  assert(Math.abs(normalizedDouble.centerDepth - 0.22) < 1e-9, "bottom features: double concave lost center depth");
  assert(Math.abs(normalizedDouble.railDepth - 0.3) < 1e-9, "bottom features: double concave rail depth should clamp to the 3mm maximum");
  assert(Math.abs(normalizedDouble.offset - 0.15) < 1e-9, "bottom features: double concave offset did not clamp to the type minimum");
  const normalizedChannel = api._test.normalizeBottomFeatures([{ type: "channel", centerDepth: 5, width: 0.6, offset: 0.1, spacing: 0.8, count: 12 }])[0];
  assert(normalizedChannel.centerDepth === 0, "bottom features: channel should ignore center depth");
  assert(Math.abs(normalizedChannel.width - 0.35) < 1e-9, "bottom features: channel width did not clamp to the type maximum");
  assert(normalizedChannel.railDepth >= 0 && normalizedChannel.railDepth <= 0.3, "bottom features: channel rail depth should remain inside the 3mm maximum");
  assert(Math.abs(normalizedChannel.offset - 0.3) < 1e-9, "bottom features: channel offset did not clamp to the type minimum");
  assert(Math.abs(normalizedChannel.spacing - 0.25) < 1e-9, "bottom features: channel spacing did not clamp to the type maximum");
  assert(normalizedChannel.count === 10, "bottom features: channel count did not clamp to the type maximum");
  trace("bottom-features:defaults-and-normalization-done");
  const activeAtMid = api._test.activeBottomFeaturesAt(board, 90);
  assert(activeAtMid.some(item => item.feature.type === "single-concave"), "bottom features: active feature detection missed single concave at peak");
  const activeAtTail = api._test.activeBottomFeaturesAt(board, 168);
  assert(activeAtTail.some(item => item.feature.type === "vee"), "bottom features: active feature detection missed vee near tail");
  const anchorBoard = {
    bottomFeatures: [
      { id: "tail", type: "vee", peak: 20 },
      { id: "mid", type: "single-concave", peak: 50 },
      { id: "nose", type: "hull", peak: 80 }
    ]
  };
  const tailWeights = api._test.bottomFeatureAnchorWeightsAt(anchorBoard, 5);
  assert(tailWeights.find(item => item.feature.id === "tail").envelope === 1, "bottom features: first anchor should remain pure toward the tail");
  const blendWeights = api._test.bottomFeatureAnchorWeightsAt(anchorBoard, 35).filter(item => item.envelope > 0);
  assert(blendWeights.length === 2 && Math.abs(blendWeights.reduce((sum, item) => sum + item.envelope, 0) - 1) < 1e-9, "bottom features: adjacent anchor blend should total 100 percent");
  const noseWeights = api._test.bottomFeatureAnchorWeightsAt(anchorBoard, 95);
  assert(noseWeights.find(item => item.feature.id === "nose").envelope === 1, "bottom features: last anchor should remain pure toward the nose");
  const previousTool = api.state.tool;
  const previousView = api.state.view;
  const previousHandles = api.state.bottomFeatureHandles;
  api.state.tool = "edit";
  api.state.view = "profile";
  api.state.bottomFeatureHandles = [{ mode: "profile", kind: "peak", x: 40, y: 20, transform: { x: value => value, y: value => value } }];
  assert(api._test.hitBottomFeatureHandle({ x: 40, y: 20 })?.kind === "peak", "bottom features: profile anchor should be draggable");
  api.state.tool = previousTool;
  api.state.view = previousView;
  api.state.bottomFeatureHandles = previousHandles;
  api.state.board = board;
  const singleIndex = api.state.board.bottomFeatures.findIndex(feature => feature.type === "single-concave");
  getElement("bottomFeatureIndex").value = String(singleIndex);
  api._test.syncBottomFeaturePanel(singleIndex);
  const affectedSections = api._test.bottomFeatureAffectedSections(board);
  assert(affectedSections.affectedCount > 0, "bottom features: affected section summary did not find any sections");
  assert(affectedSections.first && affectedSections.last, "bottom features: affected section summary did not expose first/last sections");
  assert(affectedSections.first.section.position <= affectedSections.last.section.position, "bottom features: affected section ordering is invalid");
  const lowBlendEnvelope = api._test.bottomFeatureEnvelopeAt({ start: 12, peak: 90, end: 156, blend: 0.5 }, 36);
  const highBlendEnvelope = api._test.bottomFeatureEnvelopeAt({ start: 12, peak: 90, end: 156, blend: 3.0 }, 36);
  assert(highBlendEnvelope < lowBlendEnvelope, "bottom features: blend did not soften the longitudinal envelope");
  const rangedBoard = {
    bottomFeatures: [
      { id: "ranged-a", type: "single-concave", start: 10, peak: 40, end: 80 },
      { id: "ranged-b", type: "vee", start: 60, peak: 100, end: 140 }
    ]
  };
  assert(api._test.bottomFeatureAnchorWeightsAt(rangedBoard, 5).every(item => item.envelope === 0), "bottom features: range envelope leaked before start");
  assert(api._test.bottomFeatureAnchorWeightsAt(rangedBoard, 40).find(item => item.feature.id === "ranged-a")?.envelope === 1, "bottom features: range peak was not pure");
  const rangedOverlap = api._test.bottomFeatureAnchorWeightsAt(rangedBoard, 70);
  assert(rangedOverlap.length === 2 && Math.abs(rangedOverlap.reduce((sum, item) => sum + item.envelope, 0) - 1) < 1e-9, "bottom features: overlapping ranges did not blend");
  assert(api._test.bottomFeatureLateralProfile({ type: "flat" }, 0, 0, 1) === 0, "bottom features: flat baseline changed bottom displacement");
  assert(api._test.bottomFeatureLateralProfile({ type: "concave-vee", depth: 0.14, centerDepth: 0.12, railDepth: 0.1, width: 0.72, offset: 0.35 }, 0.4, 0.4, 1) > 0, "bottom features: concaved vee did not combine panel vee and paired concaves");
  assert(api._test.bottomFeatureLateralProfile({ type: "chine", depth: 0.1, width: 0.22, power: 1.2, edge: 0.85 }, 1, 1, 1) > 0, "bottom features: chine did not reach the rail band");
  const doubleCenter = api._test.bottomFeatureLateralProfile({ type: "double-concave", centerDepth: 0.03, railDepth: 0.09, width: 0.72, offset: 0.4, power: 1.35 }, 0, 0, 1);
  const doubleGroove = api._test.bottomFeatureLateralProfile({ type: "double-concave", centerDepth: 0.03, railDepth: 0.09, width: 0.72, offset: 0.4, power: 1.35 }, 0.4, 0.4, 1);
  assert(doubleGroove > doubleCenter, "bottom features: double concave should peak in two rounded side grooves");
  assert(api._test.bottomFeatureLateralProfile({ type: "channel", railDepth: 0.12, width: 0.18, offset: 0.62, count: 1, spacing: 0 }, 0.62, 0.62, 1) < 0, "bottom features: channel should remain a slot-like cut");
  const flatBlend = api._test.bottomFeatureAnchorWeightsAt({ bottomFeatures: [
    { id: "flat", type: "flat", start: 10, peak: 50, end: 90 },
    { id: "concave", type: "single-concave", start: 30, peak: 50, end: 70 }
  ] }, 50);
  assert(flatBlend.some(item => item.feature.id === "flat"), "bottom features: flat baseline was not retained in ranged blending");
  api._test.drawOutlineBottomFeatureRanges(board, { x: value => value, y: value => value }, { top: 0, bottom: 400, height: 400 });
  assert(getElement("bottomFeatureSummary").textContent.includes(String(affectedSections.affectedCount)), "bottom features: panel summary did not include affected section count");
  board.bottomPreset = "shortboard-single-to-double";
  api._test.syncBottomFeaturePanel(1);
  assert(getElement("bottomFeatureSummary").textContent.includes("shortboard") || getElement("bottomFeatureSummary").textContent.includes("ショートボード"), "bottom features: panel summary did not include preset label");
  assert(api._test.bottomFeatureMetaText(presetSingleDouble[1]).includes("R"), "bottom features: double concave meta text did not expose rail metadata");
  const legacyOverlapBoard = {
    ...board,
    bottomFeatures: [
      { ...api._test.bottomFeatureDefault("single-concave", 0, board.length, board.width), start: 40, peak: 130, end: 230 },
      { ...api._test.bottomFeatureDefault("double-concave", 1, board.length, board.width), start: 42, peak: 132, end: 228 },
      { ...api._test.bottomFeatureDefault("vee", 2, board.length, board.width), start: 44, peak: 136, end: 226 }
    ]
  };
  assert(api._test.bottomFeaturesNeedLegacyRedistribution(legacyOverlapBoard.bottomFeatures, legacyOverlapBoard), "bottom features: legacy overlap redistribution was not detected");
  const redistributedLegacy = api._test.normalizeLegacyBottomFeatureLayout(legacyOverlapBoard).bottomFeatures;
  assert(redistributedLegacy.length === 3, "bottom features: legacy redistribution changed feature count");
  assert(redistributedLegacy[0].start > redistributedLegacy[1].start && redistributedLegacy[1].start > redistributedLegacy[2].start, "bottom features: redistributed order did not remain nose-to-tail");
  assert(redistributedLegacy[0].start >= redistributedLegacy[1].end - 1e-6, "bottom features: redistributed features still overlapped near the nose");
  assert(redistributedLegacy[1].start >= redistributedLegacy[2].end - 1e-6, "bottom features: redistributed features still overlapped near the tail");
  trace("bottom-features:panel-summary-done");
  api._test.syncBottomFeaturePanel(0);
  api.state.view = "outline";
  api._test.setBottomFeatureHandles(board, { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 });
  api.state.view = "profile";
  api._test.setBottomFeatureHandles(board, { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 }, "profile");
  assert(api.state.bottomFeatureHandles.length === 3, "bottom features: profile handles did not render for the selected feature");
  assert(api.state.bottomFeatureHandles.every(handle => handle.mode === "profile"), "bottom features: profile handles did not record profile mode");
  api.state.view = "outline";
  api._test.setBottomFeatureHandles(board, { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 });
  api._test.setBottomFeatureHandles(
    board,
    { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 },
    "outline",
    { top: 0, bottom: 400, height: 400 }
  );
  const outlineRangeHandles = api.state.bottomFeatureHandles.filter(handle => handle.kind === "range");
  const outlineEditHandles = api.state.bottomFeatureHandles.filter(handle => ["start", "peak", "end"].includes(handle.kind));
  assert(
    outlineRangeHandles.length === 0,
    "bottom features: legacy start/end range handles should not render"
  );
  assert(
    outlineEditHandles.length === api._test.activeBottomFeatureCount(board.bottomFeatures) && outlineEditHandles.every(handle => handle.kind === "peak"),
    "bottom features: outline should expose one longitudinal anchor per shape"
  );
  assert(api.state.bottomFeatureHandles.some(handle => handle.kind === "width" && handle.action === "set-width"), "bottom features: outline width handle missing for selected feature");
  const savedBottomFeatures = api._test.normalizeBottomFeatures(api.state.board.bottomFeatures);
  api.state.board.bottomFeatures = api._test.normalizeBottomFeatures([
    api._test.bottomFeatureDefault("single-concave", 0, board.length, board.width)
  ]);
  getElement("bottomFeatureType").value = "vee";
  getElement("bottomFeatureStart").value = "20";
  getElement("bottomFeaturePeak").value = "80";
  getElement("bottomFeatureEnd").value = "140";
  api._test.syncBottomFeaturePanel(0, { persistCurrent: false });
  api._test.addBottomFeatureFromPanel();
  assert(api.state.board.bottomFeatures.length === 2, "bottom features: add did not create a second feature");
  assert(api.state.board.bottomFeatures[0].start >= api.state.board.bottomFeatures[1].end - 1e-6, "bottom features: added feature overlapped existing feature");
  api.state.board.bottomFeatures = [];
  if (getElement("bottomFeatureIndex")) getElement("bottomFeatureIndex").value = "-1";
  const noPreviewBoard = api._test.boardWithPendingBottomFeaturePreview(api.state.board);
  assert((noPreviewBoard.bottomFeatures || []).length === 0, "bottom features: empty board still rendered a pending preview feature");
  api.state.board.bottomFeatures = savedBottomFeatures;
  api._test.syncBottomFeaturePanel(0, { persistCurrent: false });
  api.state.view = "outline";
  api._test.setBottomFeatureHandles(
    board,
    { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 },
    "outline",
    { top: 0, bottom: 400, height: 400 }
  );
  api.state.view = "sections";
  api.state.currentSectionIndex = api.state.board.sections.findIndex(section => section.position > 40 && section.position < 120);
  assert(api.state.currentSectionIndex >= 0, "bottom features: no suitable section found for section-handle tests");
  const sectionForHandles = api.state.board.sections[api.state.currentSectionIndex];
  api._test.setBottomFeatureSectionHandles(board, { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 }, sectionForHandles);
  assert(api.state.bottomFeatureSectionHandles.length >= 2, "bottom features: section handles did not render for the selected feature");
  assert(api.state.bottomFeatureSectionHandles.some(handle => handle.kind === "center-depth"), "bottom features: section center-depth handle missing");
  assert(api.state.bottomFeatureSectionHandles.some(handle => handle.kind === "width"), "bottom features: section width handle missing");
  api.state.view = "outline";
  const afterStartDrag = { ...api.state.board.bottomFeatures[0] };
  api._test.moveBottomFeatureDrag({ featureIndex: 0, kind: "peak" }, afterStartDrag, api._test.boardCadDisplayXFromRawX(board, afterStartDrag.peak + 10));
  assert(api.state.board.bottomFeatures[0].peak > afterStartDrag.peak, "bottom features: shape-position drag did not move the anchor");
  assert(api.state.board.bottomFeatures[0].peak < api.state.board.bottomFeatures[0].end, "bottom features: peak drag crossed the end");
  const widthOutlineHandle = api.state.bottomFeatureHandles.find(handle => handle.kind === "width" && handle.action === "set-width");
  const beforeOutlineWidthDrag = { ...api.state.board.bottomFeatures[widthOutlineHandle.featureIndex] };
  api._test.moveBottomFeatureDrag(
    widthOutlineHandle,
    beforeOutlineWidthDrag,
    widthOutlineHandle.x,
    widthOutlineHandle.dragRangeTop
  );
  assert(
    Math.abs(api.state.board.bottomFeatures[widthOutlineHandle.featureIndex].width - beforeOutlineWidthDrag.width) > 1e-6,
    "bottom features: outline width drag did not change width"
  );
  api.state.view = "sections";
  api._test.setBottomFeatureSectionHandles(board, { x: value => value, y: value => value, invX: value => value, invY: value => value, scale: 1 }, sectionForHandles);
  const depthHandle = api.state.bottomFeatureSectionHandles.find(handle => handle.kind === "center-depth");
  const widthHandle = api.state.bottomFeatureSectionHandles.find(handle => handle.kind === "width");
  const beforeSectionDrag = { ...api.state.board.bottomFeatures[0] };
  api._test.moveBottomFeatureSectionDrag(depthHandle, beforeSectionDrag, {
    x: depthHandle.x,
    y: depthHandle.baseY - ((beforeSectionDrag.depth * depthHandle.envelope) + 0.2)
  });
  assert(
    api.state.board.bottomFeatures[0].depth > beforeSectionDrag.depth || Math.abs(api.state.board.bottomFeatures[0].depth - 0.3) < 1e-9,
    "bottom features: section depth drag did not deepen the selected feature or clamp at the 3mm maximum"
  );
  const afterDepthDrag = { ...api.state.board.bottomFeatures[0] };
  api._test.moveBottomFeatureSectionDrag(widthHandle, afterDepthDrag, { x: widthHandle.x * 0.82, y: widthHandle.y });
  assert(api.state.board.bottomFeatures[0].width < afterDepthDrag.width, "bottom features: section width drag did not narrow the selected feature");
  api.state.view = "outline";
  trace("bottom-features:handles-and-drags-done");

  api._test.syncBottomFeaturePanel();
  assert(getElement("bottomFeatureIndex").value === "0", "bottom features: panel did not select the first feature");
  assert(getElement("bottomFeatureList").children.length >= 3, "bottom features: feature list did not render all rows");
  trace("bottom-features:panel-sync-0-done");
  getElement("bottomFeatureIndex").value = "1";
  api._test.syncBottomFeaturePanel(1);
  assert(getElement("bottomFeatureDepth").disabled === false, "bottom features: vee should keep scalar depth editable");
  assert(getElement("bottomFeatureCenterDepth").disabled === true, "bottom features: vee should not expose center depth");
  assert(getElement("bottomFeatureOffset").disabled === true, "bottom features: vee should not expose offset");
  trace("bottom-features:panel-sync-1-done");
  getElement("bottomFeatureDepth").value = "0.28";
  getElement("bottomFeatureCenterDepth").value = "0.11";
  getElement("bottomFeatureRailDepth").value = "0.37";
  getElement("bottomFeatureBlend").value = "1.55";
  api._test.setBottomFeatureFromPanel();
  trace("bottom-features:set-panel-1-done");
  assert(Math.abs(api.state.board.bottomFeatures[1].depth - 0.28) < 1e-9, "bottom features: panel update did not persist depth");
  assert(api.state.board.bottomFeatures[1].centerDepth === 0, "bottom features: vee should reset center depth to its default");
  assert(api.state.board.bottomFeatures[1].railDepth === 0, "bottom features: vee should reset rail depth to its default");
  assert(Math.abs(api.state.board.bottomFeatures[1].blend - 1.55) < 1e-9, "bottom features: panel update did not persist blend");
  getElement("bottomFeatureEnabled").checked = false;
  api._test.setBottomFeatureFromPanel();
  trace("bottom-features:disable-done");
  assert(api.state.board.bottomFeatures[1].enabled === false, "bottom features: panel update did not persist enabled state");
  assert(api._test.activeBottomFeatureCount(api.state.board.bottomFeatures) === 2, "bottom features: active feature count did not decrease after disabling");
  getElement("bottomFeatureEnabled").checked = true;
  api._test.setBottomFeatureFromPanel();
  trace("bottom-features:reenable-done");
  getElement("bottomFeatureIndex").value = "0";
  api._test.syncBottomFeaturePanel(0);
  const boardBeforePreview = api.state.board.bottomFeatures[0];
  getElement("bottomFeatureDepth").value = "0.91";
  const previewBoard = api._test.boardWithPendingBottomFeaturePreview(api.state.board);
  assert(Math.abs(previewBoard.bottomFeatures[0].depth - 0.3) < 1e-9, "bottom features: pending preview board should clamp unsaved depth to the 3mm maximum");
  assert(Math.abs(api.state.board.bottomFeatures[0].depth - boardBeforePreview.depth) < 1e-9, "bottom features: pending preview mutated the persisted board");
  trace("bottom-features:preview-done");
  getElement("bottomFeaturePreset").value = "performance-channel-quad";
  traceMeasure("bottom-features:apply-preset-ms", () => api._test.ACTION_HANDLERS["apply-bottom-preset"]());
  assert(api.state.board.bottomFeatures.length >= 3, "bottom features: applying preset did not replace features");
  assert(api.state.board.bottomFeatures.some(feature => feature.type === "channel"), "bottom features: applying preset did not create channel feature");
  assert(api.state.board.bottomPreset === "performance-channel-quad", "bottom features: applying preset did not persist preset key in state");
  api.state.board.bottomFeatures.forEach(feature => {
    assert(api._test.findCrossSectionIndexNear(api.state.board, feature.start, 0.25) >= 0, "bottom features: preset apply did not ensure a start section");
    assert(api._test.findCrossSectionIndexNear(api.state.board, feature.peak, 0.25) >= 0, "bottom features: preset apply did not ensure a peak section");
    assert(api._test.findCrossSectionIndexNear(api.state.board, feature.end, 0.25) >= 0, "bottom features: preset apply did not ensure an end section");
  });
  trace("bottom-features:preset-apply-done");
  const featureCountBeforeDuplicate = api.state.board.bottomFeatures.length;
  getElement("bottomFeatureIndex").value = "1";
  api._test.syncBottomFeaturePanel(1);
  traceMeasure("bottom-features:duplicate-ms", () => api._test.ACTION_HANDLERS["duplicate-bottom-feature"]());
  assert(api.state.board.bottomFeatures.length === featureCountBeforeDuplicate + 1, "bottom features: duplicate did not insert a copied feature");
  assert(api.state.board.bottomFeatures[2].type === api.state.board.bottomFeatures[1].type, "bottom features: duplicate did not preserve type");
  getElement("bottomFeatureIndex").value = "2";
  api._test.syncBottomFeaturePanel(2);
  getElement("bottomFeatureRailDepth").value = "0.99";
  traceMeasure("bottom-features:reset-ms", () => api._test.ACTION_HANDLERS["reset-bottom-feature"]());
  assert(api.state.board.bottomFeatures[2].railDepth < 0.99, "bottom features: reset did not restore type defaults");
  const singleEditIndex = api.state.board.bottomFeatures.findIndex(feature => feature.type === "single-concave");
  getElement("bottomFeatureIndex").value = String(singleEditIndex);
  api._test.syncBottomFeaturePanel(singleEditIndex);
  getElement("bottomFeatureDepth").value = "0.67";
  traceMeasure("bottom-features:set-panel-custom-ms", () => api._test.setBottomFeatureFromPanel());
  assert(api.state.board.bottomPreset === "custom", "bottom features: manual bottom feature edit should clear preset to custom");
  getElement("bottomFeatureStart").value = "150";
  getElement("bottomFeaturePeak").value = "90";
  getElement("bottomFeatureEnd").value = "80";
  getElement("bottomFeatureCount").value = "2.7";
  api._test.sanitizeBottomFeaturePanelValues();
  assert(Number(getElement("bottomFeatureStart").value) <= Number(getElement("bottomFeaturePeak").value), "bottom features: panel sanitizer left start after peak");
  assert(Number(getElement("bottomFeaturePeak").value) <= Number(getElement("bottomFeatureEnd").value), "bottom features: panel sanitizer left peak after end");
  assert(getElement("bottomFeatureCount").value === "1", "bottom features: single concave should reset count to its default");
  const channelIndex = api.state.board.bottomFeatures.findIndex(feature => feature.type === "channel");
  assert(channelIndex >= 0, "bottom features: channel feature should exist after preset edits");
  getElement("bottomFeatureIndex").value = String(channelIndex);
  api._test.syncBottomFeaturePanel(channelIndex);
  assert(getElement("bottomFeatureDepth").disabled === true, "bottom features: channel should not expose scalar depth");
  assert(getElement("bottomFeatureRailDepth").disabled === false, "bottom features: channel should expose rail depth");
  assert(getElement("bottomFeatureSpacing").disabled === false, "bottom features: channel should expose spacing");
  assert(getElement("bottomFeatureRailDepth").max === "0.3", "bottom features: rail depth input max should clamp to 3mm");
  assert(getElement("bottomFeatureWidth").max === "0.35", "bottom features: channel width max did not update");
  getElement("bottomFeatureIndex").value = String(channelIndex);
  const moveDirection = channelIndex > 0 ? -1 : 1;
  const movedChannelIndex = channelIndex + moveDirection;
  traceMeasure("bottom-features:move-ms", () => api._test.moveBottomFeatureFromPanel(moveDirection));
  assert(api.state.board.bottomFeatures[movedChannelIndex].type === "channel", "bottom features: move did not reorder features");
  assert(getElement("bottomFeatureIndex").value === String(movedChannelIndex), "bottom features: move did not keep selection on the moved feature");
  trace("bottom-features:panel-editing-done");
  const featureCountBeforeAdd = api.state.board.bottomFeatures.length;
  getElement("bottomFeatureType").value = "channel";
  traceMeasure("bottom-features:add-channel-ms", () => api._test.addBottomFeatureFromPanel());
  assert(api.state.board.bottomFeatures.length === featureCountBeforeAdd + 1, "bottom features: panel add did not append a feature");
  assert(api.state.board.bottomFeatures[api.state.board.bottomFeatures.length - 1].type === "channel", "bottom features: panel add did not use selected type");
  getElement("bottomFeatureIndex").value = String(api.state.board.bottomFeatures.length - 1);
  traceMeasure("bottom-features:remove-ms", () => api._test.removeBottomFeatureFromPanel());
  assert(api.state.board.bottomFeatures.length === featureCountBeforeAdd, "bottom features: panel remove did not delete the selected feature");
  traceMeasure("bottom-features:clear-ms", () => api._test.ACTION_HANDLERS["clear-bottom-features"]());
  assert(api.state.board.bottomFeatures.length === 0, "bottom features: clear all did not remove every feature");
  assert(api.state.board.bottomPreset === "custom", "bottom features: clear all should leave preset in custom state");
  assert(getElement("bottomFeatureSummary").textContent.includes("0"), "bottom features: clear all did not refresh the summary");
  const revertBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-bottom-features-revert.brd");
  const revertBaseline = revertBoard.sections.map(section => api._test.serializeCrossSection(section));
  revertBoard.bottomFeatures = api._test.distributeBottomFeatureRangesEvenly([
    api._test.bottomFeatureDefault("single-concave", 0, revertBoard.length, revertBoard.width),
    api._test.bottomFeatureDefault("vee", 1, revertBoard.length, revertBoard.width)
  ], revertBoard);
  api._test.rebuildBoardBottomFeatureSections(revertBoard);
  assert(
    revertBoard.sections.some((section, index) => api._test.serializeCrossSection(section) !== revertBaseline[index]),
    "bottom features: rebuild test fixture did not mutate any section splines"
  );
  revertBoard.bottomFeatures = [];
  api._test.rebuildBoardBottomFeatureSections(revertBoard);
  assert(
    revertBoard.sections.every((section, index) => api._test.serializeCrossSection(section) === revertBaseline[index]),
    "bottom features: clearing all features did not restore the original section splines"
  );
  const removeBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-bottom-features-remove.brd");
  const removeSourceFeatures = api._test.distributeBottomFeatureRangesEvenly([
    api._test.bottomFeatureDefault("single-concave", 0, removeBoard.length, removeBoard.width),
    api._test.bottomFeatureDefault("double-concave", 1, removeBoard.length, removeBoard.width),
    api._test.bottomFeatureDefault("vee", 2, removeBoard.length, removeBoard.width)
  ], removeBoard);
  removeBoard.bottomFeatures = api._test.normalizeBottomFeatures(removeSourceFeatures);
  api._test.rebuildBoardBottomFeatureSections(removeBoard);
  const keepFeatures = api._test.normalizeBottomFeatures([removeSourceFeatures[0], removeSourceFeatures[2]]);
  removeBoard.bottomFeatures = keepFeatures;
  api._test.rebuildBoardBottomFeatureSections(removeBoard);
  const expectedRemoveBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-bottom-features-remove-expected.brd");
  expectedRemoveBoard.bottomFeatures = keepFeatures;
  api._test.rebuildBoardBottomFeatureSections(expectedRemoveBoard);
  assert(removeBoard.sections.length === expectedRemoveBoard.sections.length, "bottom features: removing one feature changed section count inconsistently");
  assert(
    removeBoard.sections.every((section, index) => (
      crossSectionApproxEqual(section, expectedRemoveBoard.sections[index])
    )),
    "bottom features: removing one feature did not rebuild sections from the original base state"
  );
  const sectionCountBeforeAutoAdd = api.state.board.sections.length;
  getElement("sectionInterval").value = "";
  getElement("bottomFeatureType").value = "single-concave";
  api._test.applyBottomFeatureTypeDefaults("single-concave");
  traceMeasure("bottom-features:add-single-concave-ms", () => api._test.addBottomFeatureFromPanel());
  const addedFeature = api.state.board.bottomFeatures[api.state.board.bottomFeatures.length - 1];
  const expectedAnchorSections = api._test.bottomFeatureSectionPositions(api.state.board, addedFeature, { interval: null });
  assert(api.state.board.sections.length >= sectionCountBeforeAutoAdd, "bottom features: add should not reduce section count");
  assert(api._test.findCrossSectionIndexNear(api.state.board, addedFeature.start, 0.25) >= 0, "bottom features: add did not ensure a start section");
  assert(api._test.findCrossSectionIndexNear(api.state.board, addedFeature.peak, 0.25) >= 0, "bottom features: add did not ensure a peak section");
  assert(api._test.findCrossSectionIndexNear(api.state.board, addedFeature.end, 0.25) >= 0, "bottom features: add did not ensure an end section");
  expectedAnchorSections.forEach(position => {
    assert(api._test.findCrossSectionIndexNear(api.state.board, position, 0.25) >= 0, `bottom features: add did not ensure an interval/anchor section near ${position}`);
  });
  trace("bottom-features:auto-sections-done");
  const sectionCountAfterFirstEnsure = api.state.board.sections.length;
  traceMeasure("bottom-features:ensure-cross-sections-ms", () => api._test.ensureCrossSectionsForBottomFeature(api.state.board, addedFeature));
  assert(api.state.board.sections.length === sectionCountAfterFirstEnsure, "bottom features: ensure helper should not duplicate nearby sections");
  getElement("sectionInterval").value = "24";
  const expectedFeatureSections = api._test.bottomFeatureSectionPositions(api.state.board, addedFeature, { interval: 24 });
  const sectionCountBeforeExplicitFill = api.state.board.sections.length;
  traceMeasure("bottom-features:fill-sections-ms", () => api._test.fillSelectedBottomFeatureSectionsFromPanel());
  assert(api.state.board.sections.length > sectionCountBeforeExplicitFill, "bottom features: explicit fill did not add interval sections inside the selected feature");
  expectedFeatureSections.forEach(position => {
    assert(api._test.findCrossSectionIndexNear(api.state.board, position, 0.25) >= 0, `bottom features: explicit fill did not ensure an interval/anchor section near ${position}`);
  });
  assert(expectedFeatureSections.length > expectedAnchorSections.length, "bottom features: explicit fill should add more than the default anchor sections when interval is set");
  const sectionCountAfterExplicitFill = api.state.board.sections.length;
  traceMeasure("bottom-features:fill-sections-repeat-ms", () => api._test.fillSelectedBottomFeatureSectionsFromPanel());
  assert(api.state.board.sections.length === sectionCountAfterExplicitFill, "bottom features: explicit fill should not duplicate existing interval sections");
  api.state.board.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "single concave", start: 12, peak: 90, end: 156, depth: 0.55, width: 0.78, power: 1.8 },
    { type: "vee", start: 120, peak: 156, end: 182, depth: 0.3, width: 1.0, power: 1.25 },
    { type: "channel", start: 132, peak: 156, end: 182, depth: 0.25, width: 0.14, offset: 0.58, count: 2, spacing: 0.08 }
  ]);
  api._test.syncBottomFeaturePanel(0);
  trace("bottom-features:section-shape-start");

  const shapeBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-bottom-feature-shapes.brd");
  shapeBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "single concave", start: 12, peak: 90, end: 156, depth: 0.55, width: 0.78, power: 1.8 },
    { type: "vee", start: 120, peak: 156, end: 182, depth: 0.3, width: 1.0, power: 1.25 },
    { type: "channel", start: 132, peak: 156, end: 182, depth: 0.25, width: 0.14, offset: 0.58, count: 2, spacing: 0.08 }
  ]);
  const section = shapeBoard.sections[2];
  const base = api._test.boardCadCloneKnots(section.spline);
  const concaved = traceMeasure("bottom-features:apply-section-knots-ms", () => api._test.applyBottomFeaturesToSectionKnots(base, shapeBoard, 90));
  trace("bottom-features:concave-applied");
  assert(concaved.length >= base.length, "bottom features: transformed section should preserve or increase sampling density");
  const concaveBaseSamples = api._test.boardCadSplineSamples(base, 24);
  const concaveSamples = api._test.boardCadSplineSamples(concaved, 24);
  trace("bottom-features:concave-sampled");
  const sampleBottomAtX = (samples, targetX) => {
    const nearby = samples.filter(point => Math.abs(point.x - targetX) <= 1.5);
    const candidates = nearby.length ? nearby : samples;
    return candidates.reduce((best, point) => {
      if (!best) return point;
      if (point.y < best.y) return point;
      if (point.y === best.y && Math.abs(point.x - targetX) < Math.abs(best.x - targetX)) return point;
      return best;
    }, null);
  };
  const concaveHalfWidth = Math.max(1e-9, api._test.boardCadCrossSectionWidth(base) / 2);
  const innerConcaveX = Math.min(concaveHalfWidth * 0.25, Math.max(0.5, concaveHalfWidth - 8));
  const baseInnerThickness =
    api._test.boardCadCrossSectionDeckAt(base, innerConcaveX) -
    api._test.boardCadCrossSectionBottomAt(base, innerConcaveX);
  const concavedInnerThickness =
    api._test.boardCadCrossSectionDeckAt(concaved, innerConcaveX) -
    api._test.boardCadCrossSectionBottomAt(concaved, innerConcaveX);
  const baseInnerBottom = api._test.boardCadCrossSectionBottomAt(base, innerConcaveX);
  const concavedInnerBottom = api._test.boardCadCrossSectionBottomAt(concaved, innerConcaveX);
  const baseInnerDeck = api._test.boardCadCrossSectionDeckAt(base, innerConcaveX);
  const concavedInnerDeck = api._test.boardCadCrossSectionDeckAt(concaved, innerConcaveX);
  const concaveFeature = shapeBoard.bottomFeatures[0];
  const concaveEnvelope = api._test.bottomFeatureEnvelopeAt(concaveFeature, 90);
  assert(
    concavedInnerThickness < baseInnerThickness,
    `bottom features: single concave should reduce inner bottom thickness near peak (base ${baseInnerThickness.toFixed(6)} transformed ${concavedInnerThickness.toFixed(6)} at x ${innerConcaveX.toFixed(6)}; bottom ${baseInnerBottom.toFixed(6)} -> ${concavedInnerBottom.toFixed(6)}; deck ${baseInnerDeck.toFixed(6)} -> ${concavedInnerDeck.toFixed(6)}; depth ${Number(concaveFeature.depth).toFixed(6)} envelope ${concaveEnvelope.toFixed(6)} stringer ${Number(base[0]?.p?.y || 0).toFixed(6)} -> ${Number(concaved[0]?.p?.y || 0).toFixed(6)} count ${base.length}->${concaved.length})`
  );
  const protectedRailX = Math.max(0, concaveHalfWidth - 3);
  const protectedRailDelta = api._test.boardCadSplineValueAt(concaved, protectedRailX) - api._test.boardCadSplineValueAt(base, protectedRailX);
  assert(Math.abs(protectedRailDelta) < 0.01, "bottom features: single concave should not deform the rail-protection band near the outline");
  const protectedRailDelta5cm = api._test.boardCadSplineValueAt(concaved, Math.max(0, concaveHalfWidth - 4.5)) - api._test.boardCadSplineValueAt(base, Math.max(0, concaveHalfWidth - 4.5));
  assert(Math.abs(protectedRailDelta5cm) < 0.01, "bottom features: single concave should keep the 5cm rail protection band unchanged");
  const concaveDeckDelta = Math.abs((concaved[concaved.length - 1]?.p?.y ?? 0) - (base[base.length - 1]?.p?.y ?? 0));
  assert(concaveDeckDelta < 0.02, "bottom features: concave should not significantly distort the deck/stringer apex");
  assert(
    Math.abs(api._test.boardCadCrossSectionBottomAt(concaved, 0) - (concaved[0]?.p?.y ?? 0)) < 1e-9,
    "bottom features: stringer bottom evaluator should return the bottom-side stringer point"
  );
  assert(
    Math.abs(api._test.boardCadCrossSectionDeckAt(concaved, 0) - (concaved[concaved.length - 1]?.p?.y ?? 0)) < 1e-9,
    "bottom features: stringer deck evaluator should return the deck-side stringer point"
  );
  assert(upperHalfTailKnotsApproxEqual(base, concaved), "bottom features: single concave should not modify deck-side control points");
  {
    const deckDelta = upperHalfDeckCurveMaxDelta(api, base, concaved);
    assert(
      upperHalfDeckCurveApproxEqual(api, base, concaved),
      `bottom features: single concave should not alter deck-side display curve (max delta ${deckDelta.delta.toFixed(6)} at x ${deckDelta.x.toFixed(6)}; base ${deckDelta.base.toFixed(6)} transformed ${deckDelta.transformed.toFixed(6)})`
    );
  }

  const veeOnlyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-vee-only.brd");
  veeOnlyBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "vee", start: 120, peak: 156, end: 182, depth: 0.3, width: 1.0, power: 1.25 }
  ]);
  const veed = api._test.applyBottomFeaturesToSectionKnots(api._test.boardCadCloneKnots(section.spline), veeOnlyBoard, 168);
  trace("bottom-features:vee-applied");
  const veeProbeX = Math.max(0.5, api._test.boardCadCrossSectionWidth(base) * 0.38);
  const baseVeeProbeThickness =
    api._test.boardCadCrossSectionDeckAt(base, veeProbeX) -
    api._test.boardCadCrossSectionBottomAt(base, veeProbeX);
  const veedProbeThickness =
    api._test.boardCadCrossSectionDeckAt(veed, veeProbeX) -
    api._test.boardCadCrossSectionBottomAt(veed, veeProbeX);
  assert(
    Math.abs((veed[0]?.p?.y ?? 0) - (base[0]?.p?.y ?? 0)) < 0.02,
    "bottom features: vee should keep the stringer bottom close to the base reference"
  );
  assert(
    veedProbeThickness < baseVeeProbeThickness,
    `bottom features: vee should thin the bottom panel away from the stringer (base ${baseVeeProbeThickness.toFixed(6)} transformed ${veedProbeThickness.toFixed(6)} at x ${veeProbeX.toFixed(6)})`
  );
  assert(upperHalfTailKnotsApproxEqual(base, veed), "bottom features: vee should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, base, veed), "bottom features: vee should not alter deck-side display curve");
  const spiralOnlyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-spiral-only.brd");
  spiralOnlyBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "spiral-vee", start: 120, peak: 140, end: 165, depth: 0.25, width: 1, offset: 0.42, power: 1.2 }
  ]);
  const spiraled = api._test.applyBottomFeaturesToSectionKnots(api._test.boardCadCloneKnots(section.spline), spiralOnlyBoard, 140);
  assert(upperHalfTailKnotsApproxEqual(base, spiraled), "bottom features: spiral vee should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, base, spiraled), "bottom features: spiral vee should not alter deck-side display curve");

  const doubleOnlyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-double-only.brd");
  doubleOnlyBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "double-concave", start: 120, peak: 140, end: 165, centerDepth: 0.12, railDepth: 0.28, width: 0.7, offset: 0.42, power: 1.6 }
  ]);
  const doubled = api._test.applyBottomFeaturesToSectionKnots(api._test.boardCadCloneKnots(section.spline), doubleOnlyBoard, 140);
  assert(upperHalfTailKnotsApproxEqual(base, doubled), "bottom features: double concave should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, base, doubled), "bottom features: double concave should not alter deck-side display curve");
  assert(lowerHalfKnotXsStrictlyIncrease(doubled), "bottom features: double concave lower-half knots should remain strictly monotonic toward the rail");
  const anchoredDouble = api._test.insertBottomFeatureAnchorKnots(api._test.boardCadCloneKnots(section.spline), doubleOnlyBoard, doubleOnlyBoard.bottomFeatures[0]);
  assert(upperHalfTailKnotsApproxEqual(base, anchoredDouble), "bottom features: anchor insertion should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, base, anchoredDouble), "bottom features: anchor insertion should not alter deck-side display curve");

  const hullOnlyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-hull-only.brd");
  hullOnlyBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "hull", start: 120, peak: 140, end: 165, depth: 0.25, width: 0.85, power: 1.6 }
  ]);
  const hulled = api._test.applyBottomFeaturesToSectionKnots(api._test.boardCadCloneKnots(section.spline), hullOnlyBoard, 140);
  assert(upperHalfTailKnotsApproxEqual(base, hulled), "bottom features: hull should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, base, hulled), "bottom features: hull should not alter deck-side display curve");

  const displacementOnlyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-displacement-only.brd");
  displacementOnlyBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "displacement-hull", start: 80, peak: 140, end: 188, depth: 0.18, railDepth: 0.1, width: 0.9, power: 2.0 }
  ]);
  const displaced = api._test.applyBottomFeaturesToSectionKnots(api._test.boardCadCloneKnots(section.spline), displacementOnlyBoard, 140);
  assert(upperHalfTailKnotsApproxEqual(base, displaced), "bottom features: displacement hull should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, base, displaced), "bottom features: displacement hull should not alter deck-side display curve");

  const sectionBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-section-rebuild.brd");
  sectionBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "double-concave", start: 120, peak: 140, end: 165, centerDepth: 0.12, railDepth: 0.28, width: 0.7, offset: 0.42, power: 1.6 }
  ]);
  const targetSectionIndex = 2;
  const storedBase = api._test.boardCadCloneKnots(sectionBoard.sections[targetSectionIndex].spline);
  api._test.rebuildBoardBottomFeatureSections(sectionBoard);
  const rebuiltSpline = sectionBoard.sections[targetSectionIndex].spline;
  assert(upperHalfTailKnotsApproxEqual(storedBase, rebuiltSpline), "bottom features: stored section rebuild should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, storedBase, rebuiltSpline), "bottom features: stored section rebuild should not alter deck-side display curve");
  assert(lowerHalfKnotXsStrictlyIncrease(rebuiltSpline), "bottom features: stored section rebuild should keep lower-half knots monotonic toward the rail");

  const longboardManualSections = api.parseBrd(fs.readFileSync(path.join(root, "Longboard.brd"), "utf8"), "Longboard-manual-sections.brd");
  const previousBoard = api.state.board;
  const previousSectionIndex = api.state.currentSectionIndex;
  api.state.board = longboardManualSections;
  api.state.currentSectionIndex = 3;
  api._test.addCrossSectionAt(114.3, { redraw: false });
  api._test.addCrossSectionAt(137.16, { redraw: false });
  longboardManualSections.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "double-concave", start: 41.148, peak: 129.54, end: 230.429, centerDepth: 0.12, railDepth: 0.28, width: 0.7, offset: 0.42, power: 1.6 }
  ]);
  api._test.rebuildBoardBottomFeatureSections(longboardManualSections);
  const releaseAt = pos => {
    const sec = longboardManualSections.sections.find(item => Math.abs(item.position - pos) < 0.01);
    assert(sec, `bottom features: manual longboard section at ${pos} was not created`);
    const display = api._test.applyBottomFeaturesToSectionKnots(sec.spline, longboardManualSections, sec.position);
    return context.boardCadCrossSectionReleaseAngle(display) * 180 / Math.PI;
  };
  const release114 = releaseAt(114.3);
  const release129 = releaseAt(129.54);
  const release137 = releaseAt(137.16);
  assert(Math.abs(release114 - release129) < 0.5, "bottom features: manual section ahead of center should preserve the same release angle family as the center section");
  assert(Math.abs(release137 - release129) < 0.5, "bottom features: manual section aft of center should preserve the same release angle family as the center section");
  api.state.board = previousBoard;
  api.state.currentSectionIndex = previousSectionIndex;

  const channelOnlyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-channel-only.brd");
  channelOnlyBoard.bottomFeatures = api._test.normalizeBottomFeatures([
    { type: "channel", start: 120, peak: 156, end: 182, depth: 0.45, width: 0.16, offset: 0.62, count: 2, spacing: 0.08 }
  ]);
  const channelBase = api._test.boardCadCloneKnots(section.spline);
  const channeled = api._test.applyBottomFeaturesToSectionKnots(api._test.boardCadCloneKnots(section.spline), channelOnlyBoard, 160);
  const baseSamples = api._test.boardCadSplineSamples(channelBase, 24);
  const channelSamples = api._test.boardCadSplineSamples(channeled, 24);
  assert(upperHalfTailKnotsApproxEqual(channelBase, channeled), "bottom features: channel should not modify deck-side control points");
  assert(upperHalfDeckCurveApproxEqual(api, channelBase, channeled), "bottom features: channel should not alter deck-side display curve");
  const bottomSampleAtRatio = (samples, ratio) => {
    const halfWidth = Math.max(1e-9, samples.reduce((max, point) => Math.max(max, point.x), 0));
    const tolerance = 0.04;
    const nearby = samples.filter(point => Math.abs((point.x / halfWidth) - ratio) <= tolerance);
    const candidates = nearby.length ? nearby : samples;
    return candidates.reduce((best, point) => {
      if (!best) return point;
      if (point.y < best.y) return point;
      if (point.y === best.y && Math.abs((point.x / halfWidth) - ratio) < Math.abs((best.x / halfWidth) - ratio)) return point;
      return best;
    }, null);
  };
  const centerDelta = bottomSampleAtRatio(channelSamples, 0).y - bottomSampleAtRatio(baseSamples, 0).y;
  const railDelta = bottomSampleAtRatio(channelSamples, 0.62).y - bottomSampleAtRatio(baseSamples, 0.62).y;
  assert(railDelta < centerDelta, "bottom features: channel should cut deeper near the rail-side lobe than at the stringer");
  trace("bottom-features:done");
}

if (sectionEnabled("rocker")) {
  trace("rocker:start");
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Longboard.brd"), "utf8"), "Longboard-rocker.brd");
  const flatBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Flat-rocker-diagnostic.brd");
  const flatLength = flatBoard.length;
  flatBoard.bottom = [
    { p: { x: 0, y: 0 }, prev: { x: 0, y: 0 }, next: { x: flatLength / 6, y: 0 }, continuous: true, other: false },
    { p: { x: flatLength / 2, y: 0 }, prev: { x: flatLength / 3, y: 0 }, next: { x: flatLength * 2 / 3, y: 0 }, continuous: true, other: false },
    { p: { x: flatLength, y: 0 }, prev: { x: flatLength * 5 / 6, y: 0 }, next: { x: flatLength, y: 0 }, continuous: true, other: false }
  ];
  flatBoard.deck = flatBoard.bottom.map(knot => ({
    ...knot,
    p: { x: knot.p.x, y: 6 }, prev: { x: knot.prev.x, y: 6 }, next: { x: knot.next.x, y: 6 }
  }));
  const zeroRockerConfig = api._test.normalizeRockerConfig({
    preset: "custom", enabled: true, noseRocker: 0, tailRocker: 0,
    entryLift: 0, tailKick: 0, middleFlatness: 0, apexShift: 0,
    blend: 1, preserveFoil: true, preserveDeck: false
  });
  assert(api._test.applyRockerConfigToBoard(flatBoard, zeroRockerConfig), "rocker: zero-rocker diagnostic board should regenerate");
  let maxFlatDeviation = 0;
  for (let i = 0; i <= 400; i += 1) {
    maxFlatDeviation = Math.max(maxFlatDeviation, Math.abs(api._test.boardCadRockerAtPos(flatBoard, flatLength * i / 400)));
  }
  assert(maxFlatDeviation < 1e-8, `rocker: mathematically flat board bent by ${maxFlatDeviation}cm during zero-rocker generation`);
  assert(flatBoard.bottom.every(knot => [knot.p.y, knot.prev.y, knot.next.y].every(y => Math.abs(y) < 1e-8)), "rocker: zero-rocker CP handles must all remain on the datum plane");
  assert(api._test.normalizeRockerPresetKey("staged") === "staged-speed", "rocker: staged alias did not normalize");
  assert(api._test.normalizeRockerPresetKey("fish") === "fish-retro-flat", "rocker: fish alias did not normalize");
  const config = api._test.normalizeRockerConfig({
    preset: "staged",
    enabled: true,
    noseRocker: 12.3,
    tailRocker: 4.5,
    entryLengthRatio: 0.8,
    tailKickLengthRatio: 0.01,
    preserveFoil: true,
    preserveDeck: true
  });
  assert(config.preset === "staged-speed", "rocker: config preset did not normalize");
  assert(config.enabled === true, "rocker: enabled flag did not normalize");
  assert(Math.abs(config.entryLengthRatio - 0.5) < 1e-9, "rocker: entry length ratio should clamp to max");
  assert(Math.abs(config.tailKickLengthRatio - 0.05) < 1e-9, "rocker: tail kick length ratio should clamp to min");
  assert(config.preserveDeck === true && config.preserveFoil === false, "rocker: preserveDeck should disable preserveFoil");

  const referenceShortboard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-rocker-reference.brd");
  referenceShortboard.length = 74 * 2.54;
  const numericShortboard = api._test.rockerPresetConfigForBoard("performance-curve", referenceShortboard);
  assert(Math.abs(numericShortboard.noseRocker - (5 * 2.54)) < 1e-9, "rocker: 6ft2 performance reference should resolve to 5in nose rocker");
  assert(Math.abs(numericShortboard.tailRocker - (2.5 * 2.54)) < 1e-9, "rocker: 6ft2 performance reference should resolve to 2.5in tail rocker");
  const referenceFish = { ...referenceShortboard, length: 68 * 2.54 };
  const numericFish = api._test.rockerPresetConfigForBoard("fish-retro-flat", referenceFish);
  assert(Math.abs(numericFish.noseRocker - (3.5 * 2.54)) < 1e-9, "rocker: 5ft8 retro fish reference should resolve to 3.5in nose rocker");
  assert(Math.abs(numericFish.tailRocker - (1.5 * 2.54)) < 1e-9, "rocker: 5ft8 retro fish reference should resolve to 1.5in tail rocker");
  const referenceGun = { ...referenceShortboard, length: 90 * 2.54 };
  const numericGun = api._test.rockerPresetConfigForBoard("gun-continuous", referenceGun);
  assert(Math.abs(numericGun.noseRocker - (6.75 * 2.54)) < 1e-9, "rocker: 7ft6 gun reference should resolve to 6.75in nose rocker");
  assert(Math.abs(numericGun.tailRocker - (2.75 * 2.54)) < 1e-9, "rocker: 7ft6 gun reference should resolve to 2.75in tail rocker");
  const numericGunCurve = api._test.rockerTargetCurvePoints(referenceGun, numericGun, 96);
  assert(Math.abs(numericGunCurve[0].y - numericGun.tailRocker) < 1e-9, "rocker: tail kick must redistribute curvature without exceeding the final tail rocker constraint");
  assert(Math.abs(numericGunCurve.at(-1).y - numericGun.noseRocker) < 1e-9, "rocker: entry lift must redistribute curvature without exceeding the final nose rocker constraint");

  board.rockerPreset = "staged-speed";
  board.rockerConfig = {
    ...config,
    middleFlatness: 0.35,
    tailKick: 1.2
  };
  const brd = api.makeBrd(board);
  assert(brd.includes("p89 : staged-speed"), "rocker: BRD export missing rocker preset");
  assert(brd.includes("p90 : {"), "rocker: BRD export missing rocker config");
  const roundTrip = api.parseBrd(brd, "Longboard-rocker-roundtrip.brd");
  assert(roundTrip.rockerPreset === "staged-speed", "rocker: preset did not roundtrip");
  assert(roundTrip.rockerConfig.enabled === true, "rocker: config enabled did not roundtrip");
  assert(Math.abs(roundTrip.rockerConfig.middleFlatness - 0.35) < 1e-9, "rocker: config middle flatness did not roundtrip");
  assert(Math.abs(roundTrip.rockerConfig.tailKick - 1.2) < 1e-9, "rocker: config tail kick did not roundtrip");

  const stations = api._test.rockerMeasurementStations(board);
  const stationKeys = stations.map(station => station.key);
  assert(stationKeys.includes("tail-3") && stationKeys.includes("tail-6"), "rocker: missing tail 3/6in tip stations");
  assert(stationKeys.includes("tail-12"), "rocker: missing tail 12in station");
  assert(stationKeys.includes("tail-18"), "rocker: missing tail 18in transition station");
  assert(stationKeys.includes("tail-24"), "rocker: missing tail 24in station");
  assert(stationKeys.includes("nose-12"), "rocker: missing nose 12in station");
  assert(stationKeys.includes("nose-3") && stationKeys.includes("nose-6"), "rocker: missing nose 3/6in tip stations");
  assert(stationKeys.includes("nose-18"), "rocker: missing nose 18in transition station");
  assert(stationKeys.includes("nose-24"), "rocker: missing nose 24in station");
  assert(stations.every((station, index) => index === 0 || station.position >= stations[index - 1].position), "rocker: measurement stations should be sorted tail-to-nose");
  const measurements = api._test.rockerStationMeasurements(board);
  const center = measurements.find(station => station.key === "center");
  assert(center && Number.isFinite(center.rocker) && Number.isFinite(center.deck), "rocker: center station measurement missing");
  assert(center.datumMethod === "machine-board-coordinate" && center.surface === "bottom-stringer", "rocker: measurements must identify datum and measured surface");
  assert(Math.abs(center.thickness - (center.deck - center.rocker)) < 1e-9, "rocker: station thickness should equal deck minus rocker");
  const targetCurve = api._test.rockerTargetCurvePoints(board, api._test.normalizeRockerConfig({
    preset: "continuous-neutral",
    enabled: true,
    noseRocker: 12.5,
    tailRocker: 2.5,
    entryLift: 0,
    tailKick: 0,
    middleFlatness: 0.35
  }), 64);
  assert(targetCurve.length === 65, "rocker: target curve should use requested segment count");
  assert(Math.abs(targetCurve[0].x) < 1e-9, "rocker: target curve should start at tail");
  assert(Math.abs(targetCurve[targetCurve.length - 1].x - board.length) < 1e-9, "rocker: target curve should end at nose");
  assert(Math.abs(targetCurve[0].y - 2.5) < 1e-9, "rocker: target curve tail value should match config");
  assert(Math.abs(targetCurve[targetCurve.length - 1].y - 12.5) < 1e-9, "rocker: target curve nose value should match config");
  assert(targetCurve.every((point, index) => index === 0 || point.x >= targetCurve[index - 1].x), "rocker: target curve x should be sorted");
  const lowBlendCurve = api._test.rockerTargetCurvePoints(board, api._test.normalizeRockerConfig({
    preset: "continuous-neutral", enabled: true, noseRocker: 12.5, tailRocker: 2.5,
    entryLift: 0, tailKick: 0, middleFlatness: 0.35, blend: 0.35
  }), 64);
  assert(
    lowBlendCurve.every((point, index) => Math.abs(point.y - targetCurve[index].y) < 1e-9),
    "rocker: a neutral continuous rocker must remain one fair quadratic instead of creating station ripples"
  );
  assert(Math.abs(lowBlendCurve[0].y - targetCurve[0].y) < 1e-9 && Math.abs(lowBlendCurve.at(-1).y - targetCurve.at(-1).y) < 1e-9, "rocker: blend must preserve tip rocker values");

  const foilBoard = api.parseBrd(fs.readFileSync(path.join(root, "Longboard.brd"), "utf8"), "Longboard-rocker-apply-foil.brd");
  const originalBottomKnots = api._test.boardCadCloneKnots(foilBoard.bottom);
  const originalDeckKnots = api._test.boardCadCloneKnots(foilBoard.deck);
  const originalVolume = api._test.boardCadVolume(foilBoard);
  const foilPositions = [0, foilBoard.length * 0.25, foilBoard.length * 0.5, foilBoard.length * 0.75, foilBoard.length];
  const originalFoilThickness = foilPositions.map(x => api._test.boardCadSplineValueAt(foilBoard.deck, x) - api._test.boardCadSplineValueAt(foilBoard.bottom, x));
  const foilConfig = api._test.normalizeRockerConfig({
    preset: "continuous-neutral",
    enabled: true,
    noseRocker: 11.25,
    tailRocker: 2.25,
    preserveFoil: true,
    preserveDeck: false,
    entryLift: 0,
    tailKick: 0
  });
  assert(api._test.applyRockerConfigToBoard(foilBoard, foilConfig), "rocker: preserve-foil apply should succeed");
  const appliedVolume = api._test.boardCadVolume(foilBoard);
  assert(Math.abs(appliedVolume - originalVolume) <= originalVolume * 1e-6, `rocker: preserveFoil changed volume (${appliedVolume} vs ${originalVolume})`);
  assert(foilBoard.bottom.length === 3, "rocker: neutral continuous rocker should use only tail, low-point, and nose knots");
  assert(Math.abs(api._test.boardCadSplineValueAt(foilBoard.bottom, 0) - 2.25) < 0.02, "rocker: applied tail rocker should match target");
  assert(Math.abs(api._test.boardCadSplineValueAt(foilBoard.bottom, foilBoard.length) - 11.25) < 0.02, "rocker: applied nose rocker should match target");
  const bottomApexKnot = foilBoard.bottom.reduce((best, knot) => (!best || knot.p.y < best.p.y ? knot : best), null);
  assert(bottomApexKnot && Math.abs(bottomApexKnot.prev.y - bottomApexKnot.p.y) < 1e-4, "rocker: bottom apex tangent should remain nearly horizontal on the incoming side");
  assert(bottomApexKnot && Math.abs(bottomApexKnot.next.y - bottomApexKnot.p.y) < 1e-4, "rocker: bottom apex tangent should remain nearly horizontal on the outgoing side");
  foilPositions.forEach((x, index) => {
    const thickness = api._test.boardCadSplineValueAt(foilBoard.deck, x) - api._test.boardCadSplineValueAt(foilBoard.bottom, x);
    if (index > 0 && index < foilPositions.length - 1) {
      assert(Math.abs(thickness - originalFoilThickness[index]) < 0.65, `rocker: preserveFoil approximation drifted at ${x.toFixed(2)} (${thickness.toFixed(3)} vs ${originalFoilThickness[index].toFixed(3)})`);
    } else {
      assert(Math.abs(thickness) < 1e-6, "rocker: deck and bottom must meet exactly at both physical tips");
    }
  });
  const tipPositions = [7.62, foilBoard.length - 7.62];
  tipPositions.forEach(x => {
    const originalThickness = api._test.boardCadSplineValueAt(originalDeckKnots, x) - api._test.boardCadSplineValueAt(originalBottomKnots, x);
    const appliedThickness = api._test.boardCadSplineValueAt(foilBoard.deck, x) - api._test.boardCadSplineValueAt(foilBoard.bottom, x);
    assert(Math.abs(appliedThickness - originalThickness) < 0.08, `rocker: preserveFoil should retain 3-inch tip thickness at ${x.toFixed(2)}`);
  });
  assert(foilBoard.deck.length === 5, `rocker: smooth deck approximation should use 5 control points (${foilBoard.deck.length})`);
  assert(foilBoard.deck.filter(knot => knot.p.x > 30.48 && knot.p.x < foilBoard.length - 30.48).length === 1, "rocker: deck should keep only one interior control point outside the tip zones");

  const deckBoard = api.parseBrd(fs.readFileSync(path.join(root, "Longboard.brd"), "utf8"), "Longboard-rocker-apply-deck.brd");
  const originalDeck = foilPositions.map(x => api._test.boardCadSplineValueAt(deckBoard.deck, x));
  const deckConfig = api._test.normalizeRockerConfig({
    preset: "continuous-neutral",
    enabled: true,
    noseRocker: 10.75,
    tailRocker: 1.75,
    preserveFoil: true,
    preserveDeck: true,
    entryLift: 0,
    tailKick: 0
  });
  assert(api._test.applyRockerConfigToBoard(deckBoard, deckConfig), "rocker: preserve-deck apply should succeed");
  foilPositions.forEach((x, index) => {
    const deckValue = api._test.boardCadSplineValueAt(deckBoard.deck, x);
    assert(Math.abs(deckValue - originalDeck[index]) < 0.02, "rocker: preserveDeck should not move deck curve");
  });

  const neutralBoard = api.parseBrd(fs.readFileSync(path.join(root, "Longboard.brd"), "utf8"), "Longboard-rocker-neutral.brd");
  const neutralConfig = api._test.defaultRockerConfig("continuous-neutral");
  assert(neutralConfig.middleFlatness === 0, "rocker: continuous neutral must not contain an implicit straight center stage");
  neutralConfig.enabled = true;
  assert(api._test.applyRockerConfigToBoard(neutralBoard, neutralConfig), "rocker: neutral apply should succeed");
  const neutralApexX = api._test.boardCadRockerApexPos(neutralBoard);
  const nearNeutralApexKnots = neutralBoard.bottom.filter(knot => Math.abs((Number(knot?.p?.x) || 0) - neutralApexX) < 0.5);
  assert(nearNeutralApexKnots.length === 1, `rocker: neutral apply should not create duplicate center knots (${neutralApexX}: ${nearNeutralApexKnots.map(knot => knot.p.x).join(",")})`);
  const neutralApexKnot = nearNeutralApexKnots[0];
  assert(Math.abs(neutralApexKnot.prev.y - neutralApexKnot.p.y) < 1e-4, "rocker: neutral apex tangent should remain nearly horizontal on the incoming side");
  assert(Math.abs(neutralApexKnot.next.y - neutralApexKnot.p.y) < 1e-4, "rocker: neutral apex tangent should remain nearly horizontal on the outgoing side");
  const rockerJoinCurvature = (before, knot, after) => {
    const leftHandle = Math.max(1e-9, knot.p.x - knot.prev.x);
    const rightHandle = Math.max(1e-9, knot.next.x - knot.p.x);
    return {
      left: Math.abs((before.next.y - knot.p.y) / (leftHandle * leftHandle)),
      right: Math.abs((after.prev.y - knot.p.y) / (rightHandle * rightHandle))
    };
  };
  const neutralApexIndex = neutralBoard.bottom.indexOf(neutralApexKnot);
  const neutralCurvature = rockerJoinCurvature(neutralBoard.bottom[neutralApexIndex - 1], neutralApexKnot, neutralBoard.bottom[neutralApexIndex + 1]);
  assert(
    Math.abs(neutralCurvature.left - neutralCurvature.right) <= Math.max(1e-7, Math.max(neutralCurvature.left, neutralCurvature.right) * 0.01),
    "rocker: continuous center join should match curvature on both sides instead of forming a V"
  );
  const neutralInteriorDeckKnots = neutralBoard.deck.filter(knot => knot.p.x > 30.48 && knot.p.x < neutralBoard.length - 30.48);
  assert(neutralInteriorDeckKnots.length === 1, "rocker: neutral deck should keep one maximum-thickness control point between the one-foot tip zones");
  const neutralCenterFlatAnchors = neutralBoard.bottom.filter(knot => (
    Math.abs(knot.p.y - neutralApexKnot.p.y) < 1e-8
    && Math.abs(knot.p.x - neutralApexKnot.p.x) > 0.5
  ));
  assert(neutralCenterFlatAnchors.length === 0, "rocker: continuous neutral should pass through one apex instead of a finite flat plateau");
  trace("rocker:done");
}

if (sectionEnabled("render-cache")) {
  trace("render-cache:start");
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "Shortboard-render-cache.brd");
  api.state.board = board;
  api.state.slidingCrossSectionX = board.length * 0.37;
  assert(Math.abs(api._test.slidingBoardX(board, "sections") - board.length * 0.37) < 1e-9, "sliding cross section should preserve the longitudinal position across views");
  for (const angle of [10, 27.5, 45, 90, 175]) {
    const line = api._test.boardCadSurfaceAngleLine(board, angle);
    const maxKink = Math.max(0, ...line.slice(1, -1).map((point, index) =>
      Math.abs(point.z - (line[index].z + line[index + 2].z) / 2)
    ));
    assert(maxKink < 1, `flowline: ${angle} degree line has a ${maxKink.toFixed(3)}cm profile kink`);
  }
  const funboard = api.parseBrd(fs.readFileSync(path.join(root, "Funboard.brd"), "utf8"), "Funboard-render-cache.brd");
  api.state.board = funboard;
  api.state.geometryRevision += 1;
  for (const angle of [10, 27.5, 45, 90, 175]) {
    const line = api._test.boardCadSurfaceAngleLine(funboard, angle);
    const interior = line.slice(Math.floor(line.length * 0.15), Math.ceil(line.length * 0.85));
    const maxKink = Math.max(0, ...interior.slice(1, -1).map((point, index) =>
      Math.abs(point.y - (interior[index].y + interior[index + 2].y) / 2)
    ));
    assert(maxKink < 3, `flowline: Funboard ${angle} degree line has a ${maxKink.toFixed(3)}cm outline jump`);
  }
  api.state.board = board;
  api.state.geometryRevision += 1;
  api.state.view = "model3d";
  api.state.model3d.camera.yaw = -0.72;
  api.state.model3d.camera.pitch = -0.46;
  api.state.model3d.camera.zoom = 1;
  api.state.model3d.camera.panX = 0;
  api.state.model3d.camera.panY = 0;
  const worldLinesA = api._test.getModel3DWorldLines(board, 18, 10);
  const worldLinesB = api._test.getModel3DWorldLines(board, 18, 10);
  assert(worldLinesA === worldLinesB, "render cache: world 3D lines should be reused for identical geometry");
  api.state.model3d.worldCache.revision = -1;
  api.state.model3d.worldCache.key = "";
  api.state.model3d.worldCache.lines = [];
  const world3dCold = measureMs(() => api._test.getModel3DWorldLines(board, 18, 10), 1);
  const world3dWarm = measureMs(() => api._test.getModel3DWorldLines(board, 18, 10), 40);
  const worldLinesCached = api._test.getModel3DWorldLines(board, 18, 10);
  const projectedLinesA = api._test.getProjectedModel3DLines(board, 18, 10);
  const projectedLinesB = api._test.getProjectedModel3DLines(board, 18, 10);
  assert(projectedLinesA === projectedLinesB, "render cache: projected 3D lines should be reused for identical camera state");
  api.state.model3d.projectedCache.revision = -1;
  api.state.model3d.projectedCache.key = "";
  api.state.model3d.projectedCache.lines = [];
  const projected3dCold = measureMs(() => api._test.getProjectedModel3DLines(board, 18, 10), 1);
  const projected3dWarm = measureMs(() => api._test.getProjectedModel3DLines(board, 18, 10), 40);
  api.state.model3d.camera.yaw += 0.1;
  const projectedLinesC = api._test.getProjectedModel3DLines(board, 18, 10);
  assert(projectedLinesC !== projectedLinesB, "render cache: projected 3D lines should be invalidated by camera changes");
  const worldLinesC = api._test.getModel3DWorldLines(board, 18, 10);
  assert(worldLinesC === worldLinesCached, "render cache: camera changes should not invalidate world 3D lines");

  api.state.view = "toolpath";
  getElement("cncSurface").value = "both";
  const cncModelCold = measureMs(() => api._test.makeCncModel(board), 1);
  const cncModel = api._test.makeCncModel(board);
  const sampleX = cncModel.displayLength * 0.5;
  cncModel.surfaceSamples.clear();
  cncModel.surfaceStepSamples.clear();
  const cncSurfaceBaseCold = measureMs(() => api._test.sampleSurfaceBase(cncModel, sampleX, "bottom"), 1);
  const cncSurfaceBaseWarm = measureMs(() => api._test.sampleSurfaceBase(cncModel, sampleX, "bottom"), 40);
  cncModel.surfaceStepSamples.clear();
  const cncSurfaceRowCold = measureMs(() => api._test.sampleSurfaceRow(cncModel, sampleX, "bottom", 8, 1), 1);
  const cncSurfaceRowWarm = measureMs(() => api._test.sampleSurfaceRow(cncModel, sampleX, "bottom", 8, 1), 40);
  const cncPassCold = measureMs(() => api._test.buildCncPasses(cncModel, "bottom", 1, 48, 8), 1);
  const cncPassWarm = measureMs(() => api._test.buildCncPasses(cncModel, "bottom", 1, 48, 8), 20);
  const toolpathWorldA = api._test.getToolpathPreviewPaths(board, "both", 48, 8);
  const toolpathWorldB = api._test.getToolpathPreviewPaths(board, "both", 48, 8);
  assert(toolpathWorldA === toolpathWorldB, "render cache: world toolpath preview should be reused for identical geometry");
  api.state.toolpathPreviewCache.revision = -1;
  api.state.toolpathPreviewCache.key = "";
  api.state.toolpathPreviewCache.paths = [];
  const worldToolpathCold = measureMs(() => api._test.getToolpathPreviewPaths(board, "both", 48, 8), 1);
  const worldToolpathWarm = measureMs(() => api._test.getToolpathPreviewPaths(board, "both", 48, 8), 40);
  const toolpathWorldCached = api._test.getToolpathPreviewPaths(board, "both", 48, 8);
  api.state.model3d.camera.yaw = -0.72;
  const toolpathProjectedA = api._test.getProjectedToolpathPreviewPaths(board, "both", 48, 8);
  const toolpathProjectedB = api._test.getProjectedToolpathPreviewPaths(board, "both", 48, 8);
  assert(toolpathProjectedA === toolpathProjectedB, "render cache: projected toolpath preview should be reused for identical camera state");
  api.state.toolpathPreviewCache.projectedRevision = -1;
  api.state.toolpathPreviewCache.projectedKey = "";
  api.state.toolpathPreviewCache.projectedPaths = [];
  const projectedToolpathCold = measureMs(() => api._test.getProjectedToolpathPreviewPaths(board, "both", 48, 8), 1);
  const projectedToolpathWarm = measureMs(() => api._test.getProjectedToolpathPreviewPaths(board, "both", 48, 8), 40);
  api.state.model3d.camera.pitch -= 0.08;
  const toolpathProjectedC = api._test.getProjectedToolpathPreviewPaths(board, "both", 48, 8);
  assert(toolpathProjectedC !== toolpathProjectedB, "render cache: projected toolpath preview should be invalidated by camera changes");
  const toolpathWorldC = api._test.getToolpathPreviewPaths(board, "both", 48, 8);
  assert(toolpathWorldC === toolpathWorldCached, "render cache: camera changes should not invalidate world toolpath preview");
  console.log([
    "Render cache timings (ms)",
    `  3D world       cold=${world3dCold.totalMs.toFixed(3)} warm(avg x40)=${world3dWarm.averageMs.toFixed(4)}`,
    `  3D projected   cold=${projected3dCold.totalMs.toFixed(3)} warm(avg x40)=${projected3dWarm.averageMs.toFixed(4)}`,
    `  CNC model      cold=${cncModelCold.totalMs.toFixed(3)}`,
    `  CNC surf base  cold=${cncSurfaceBaseCold.totalMs.toFixed(3)} warm(avg x40)=${cncSurfaceBaseWarm.averageMs.toFixed(4)}`,
    `  CNC surf row   cold=${cncSurfaceRowCold.totalMs.toFixed(3)} warm(avg x40)=${cncSurfaceRowWarm.averageMs.toFixed(4)}`,
    `  CNC pass       cold=${cncPassCold.totalMs.toFixed(3)} warm(avg x20)=${cncPassWarm.averageMs.toFixed(4)}`,
    `  Toolpath world cold=${worldToolpathCold.totalMs.toFixed(3)} warm(avg x40)=${worldToolpathWarm.averageMs.toFixed(4)}`,
    `  Toolpath proj  cold=${projectedToolpathCold.totalMs.toFixed(3)} warm(avg x40)=${projectedToolpathWarm.averageMs.toFixed(4)}`
  ].join("\n"));
  trace("render-cache:done");
}

console.log(`BoardCAD Web core checks passed: ${sampleFiles.length} samples + probe reconstruction`);

// ══════════════════════════════════════════════════════════════════════
// S40: Nose/tail outline smoothness (spike detection)
// ══════════════════════════════════════════════════════════════════════
if (sectionEnabled("outline-smoothness")) {
trace("outline-smoothness:start");
// Reset segments to a fixed value so this section is not affected by
// earlier tests (e.g. misc-help changes els.segments to 18).
getElement("segments").value = "24";

const NOSE_MODES = ["gun", "pin", "round-point", "wide", "round", "diamond", "snub", "square"];
const TAIL_MODES = ["squash", "round", "gun", "pin", "round-pin", "diamond", "rounded-square", "square"];

function outlineSmoothness(board, label) {
  // Sample the positive (upper) half-outline at 1 cm intervals.
  // A spike is detected when Y rises then drops by more than 0.3 cm
  // within a 3-sample window (≈ 3 cm), which cannot happen on a
  // physically valid outline.
  const len = api._test.boardCadTailDisplayLength(board);
  const step = 0.5;
  const samples = [];
  for (let x = 0; x <= len; x += step) {
    const w = api._test.boardCadDisplayWidthAtPos(board, x);
    samples.push({ x, y: w / 2 });
  }
  let maxBump = 0;
  let bumpX = 0;
  for (let i = 1; i < samples.length - 1; i++) {
    const rise = samples[i].y - samples[i - 1].y;
    const fall = samples[i].y - samples[i + 1].y;
    // Bump = local max that rises AND falls by more than threshold
    if (rise > 0.15 && fall > 0.15) {
      const bump = Math.min(rise, fall);
      if (bump > maxBump) { maxBump = bump; bumpX = samples[i].x; }
    }
  }
  return { maxBump, bumpX, sampleCount: samples.length };
}

// Test all nose modes (tail = default/none)
for (const noseMode of NOSE_MODES) {
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), `spike-nose-${noseMode}.brd`);
  board.noseMode = noseMode;
  const { maxBump, bumpX } = outlineSmoothness(board, `nose:${noseMode}`);
  assert(maxBump < 0.3, `outline spike: nose=${noseMode} has bump=${maxBump.toFixed(3)}cm at x=${bumpX.toFixed(1)}cm`);
}

// Test all tail modes (nose = default/none)
for (const tailMode of TAIL_MODES) {
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), `spike-tail-${tailMode}.brd`);
  board.tailMode = tailMode;
  const { maxBump, bumpX } = outlineSmoothness(board, `tail:${tailMode}`);
  assert(maxBump < 0.3, `outline spike: tail=${tailMode} has bump=${maxBump.toFixed(3)}cm at x=${bumpX.toFixed(1)}cm`);
}

// Test combined nose+tail (most common real-world case)
const combos = [
  ["round", "squash"],
  ["gun", "pin"],
  ["round-point", "round"],
  ["snub", "rounded-square"],
  ["square", "square"],
  ["wide", "diamond"]
];

const simplifyBoard = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), "simplify-outline.brd");
const simplifyReference = api._test.boardCadCloneKnots(simplifyBoard.outline);
for (const x of [45, 60, 75, 90, 105, 120, 135]) simplifyBoard.outline = api._test.insertHalfSplineKnotAtX(simplifyBoard.outline, x);
const simplifyResult = api._test.simplifyOutlineKnots(simplifyBoard);
assert(simplifyResult.after < simplifyResult.before, "outline simplify: redundant split CPs were not removed");
assert(api._test.outlineSimplificationError(simplifyReference, simplifyBoard.outline) <= 0.05, "outline simplify: shape error exceeded 0.5mm");
assert(simplifyResult.volumeRatio <= 0.001, "outline simplify: volume changed by more than 0.1%");
let profileKnots = api._test.boardCadCloneKnots(simplifyBoard.bottom);
for (const x of [45, 60, 75, 90, 105, 120, 135]) profileKnots = api._test.insertHalfSplineKnotAtX(profileKnots, x);
const profileSimplifyResult = api._test.simplifyProfileSpline(profileKnots);
assert(profileSimplifyResult.after < profileSimplifyResult.before, "profile simplify: redundant bottom CPs were not removed");
assert(profileSimplifyResult.maxError <= 0.05, "profile simplify: bottom shape error exceeded tolerance");

for (const [noseMode, tailMode] of combos) {
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), `spike-combo-${noseMode}-${tailMode}.brd`);
  board.noseMode = noseMode;
  board.tailMode = tailMode;
  const proceduralKnots = api._test.boardCadTailPlanform(board).positiveSpline;
  assert(proceduralKnots.length <= board.outline.length + 8, `outline CP count: nose=${noseMode}+tail=${tailMode} expanded ${board.outline.length} source CPs to ${proceduralKnots.length}`);
  const { maxBump, bumpX } = outlineSmoothness(board, `combo:${noseMode}+${tailMode}`);
  assert(maxBump < 0.3, `outline spike: nose=${noseMode}+tail=${tailMode} has bump=${maxBump.toFixed(3)}cm at x=${bumpX.toFixed(1)}cm`);
}

// Test with wing + nose (wing is most likely to interact at the join)
for (const noseMode of ["round-point", "round", "gun"]) {
  const board = api.parseBrd(fs.readFileSync(path.join(root, "Shortboard.brd"), "utf8"), `spike-wing-nose-${noseMode}.brd`);
  board.noseMode = noseMode;
  board.wingPreset = "wing";
  board.wingPosition = 32;
  board.wingWidth = 1.5;
  board.wingShape = "bump";
  board.wingShoulder = 0.3;
  board.wingTransition = 1.2;
  const { maxBump, bumpX } = outlineSmoothness(board, `wing+nose:${noseMode}`);
  assert(maxBump < 0.3, `outline spike: wing+nose=${noseMode} has bump=${maxBump.toFixed(3)}cm at x=${bumpX.toFixed(1)}cm`);
}

trace("outline-smoothness:done");
}
