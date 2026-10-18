var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name2, symbol) => (symbol = Symbol[name2]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name2);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name2, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name: name2, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name2, decorators, target, extra3) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name2]() {
    return __privateGet(this, extra3);
  }, set [name2](x) {
    return __privateSet(this, extra3, x);
  } }, name2));
  k ? p && k < 4 && __name(extra3, (k > 2 ? "set " : k > 1 ? "get " : "") + name2) : __name(target, name2);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name2, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name2 in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra3 : desc.get) : (x) => x[name2];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra3 : desc.set) : (x, y) => x[name2] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra3 : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra3 = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name2, desc), p ? k ^ 4 ? extra3 : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/card.ts
import { readdir as readdir2, stat as stat2 } from "node:fs/promises";

// src/types.ts
var SHAPES = ["box", "sphere", "cylinder", "cone", "pyramid", "torus"];
var AXES = ["x", "y", "z"];
var GROUNDS = ["grass", "snow", "sand", "water", "none"];
var SHAPE_LABEL = {
  box: "\u65B9\u5757",
  sphere: "\u5706\u7403",
  cylinder: "\u5706\u67F1",
  cone: "\u5706\u9525",
  pyramid: "\u5C16\u9876",
  torus: "\u5706\u73AF"
};
var GROUND_LABEL = {
  grass: "\u8349\u5730",
  snow: "\u96EA\u5730",
  sand: "\u6C99\u5730",
  water: "\u6C34\u9762",
  none: "\u6CA1\u6709\u5730\u9762"
};
var PALETTE = [
  { name: "\u7EA2", hex: "#e8453c", alias: ["\u7EA2\u8272", "red", "\u5927\u7EA2"] },
  { name: "\u6A59", hex: "#f5a03c", alias: ["\u6A59\u8272", "orange", "\u6854\u8272", "\u6A58\u5B50\u8272"] },
  { name: "\u9EC4", hex: "#f7d94c", alias: ["\u9EC4\u8272", "yellow"] },
  { name: "\u7EFF", hex: "#4caf50", alias: ["\u7EFF\u8272", "green", "\u8349\u7EFF"] },
  { name: "\u9752", hex: "#35c4d0", alias: ["\u9752\u8272", "cyan", "teal", "\u84DD\u7EFF"] },
  { name: "\u84DD", hex: "#3b82f6", alias: ["\u84DD\u8272", "blue", "\u6DF1\u84DD"] },
  { name: "\u5929\u84DD", hex: "#7ec8f7", alias: ["sky", "skyblue", "lightblue", "\u6D45\u84DD", "\u5929\u7A7A\u84DD"] },
  { name: "\u7D2B", hex: "#9b5de5", alias: ["\u7D2B\u8272", "purple", "violet"] },
  { name: "\u7C89", hex: "#f492b6", alias: ["\u7C89\u8272", "pink", "\u6843\u7EA2"] },
  { name: "\u68D5", hex: "#9c6b4f", alias: ["\u68D5\u8272", "\u5496\u5561\u8272", "\u8910\u8272", "brown"] },
  { name: "\u7C73", hex: "#e8d5b7", alias: ["\u7C73\u8272", "beige", "\u7C73\u9EC4", "sand", "\u80A4\u8272"] },
  { name: "\u767D", hex: "#f7f7f7", alias: ["\u767D\u8272", "white"] },
  { name: "\u7070", hex: "#9aa0a6", alias: ["\u7070\u8272", "gray", "grey"] },
  { name: "\u9ED1", hex: "#2f3437", alias: ["\u9ED1\u8272", "black"] },
  { name: "\u91D1", hex: "#e0b154", alias: ["\u91D1\u8272", "gold", "\u91D1\u9EC4"] },
  { name: "\u94F6", hex: "#c9d1d9", alias: ["\u94F6\u8272", "silver"] }
];
var HEX_TO_NAME = new Map(PALETTE.map((c) => [c.hex, c.name]));
var ALIAS_TO_HEX = /* @__PURE__ */ new Map();
for (const color of PALETTE) {
  ALIAS_TO_HEX.set(color.name, color.hex);
  for (const alias of color.alias) ALIAS_TO_HEX.set(alias, color.hex);
}
function expandShortHex(text) {
  const body = text.slice(1);
  if (body.length !== 3) return text.toLowerCase();
  const [r, g, b] = [body[0] ?? "0", body[1] ?? "0", body[2] ?? "0"];
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
}
function resolveColor(input, fallback) {
  const raw = (input ?? "").trim();
  if (raw === "") return fallback;
  const lower = raw.toLowerCase();
  const alias = ALIAS_TO_HEX.get(raw) ?? ALIAS_TO_HEX.get(lower);
  if (alias !== void 0) return alias;
  if (lower.startsWith("#")) {
    const fixed = lower.length === 4 ? expandShortHex(lower) : lower;
    if (/^#[0-9a-f]{6}$/.test(fixed)) return fixed;
  }
  return fallback;
}
function colorName(hex) {
  return HEX_TO_NAME.get(hex) ?? hex;
}
function paletteList() {
  return PALETTE.map((color) => `${color.name}(${color.alias[0] ?? color.name})`).join("\u3001");
}
function hexToRgb(hex) {
  const fixed = hex.length === 4 ? expandShortHex(hex) : hex;
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(fixed);
  if (m === null) return [200, 200, 200];
  return [parseInt(m[1] ?? "c8", 16), parseInt(m[2] ?? "c8", 16), parseInt(m[3] ?? "c8", 16)];
}
var LIGHT = [-0.42, 0.78, 0.46];
var LIGHT_LEN = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2]);
function shade(rgb, n) {
  const dot2 = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / LIGHT_LEN;
  const k = 0.62 + 0.38 * Math.max(0, dot2);
  return [rgb[0] * k, rgb[1] * k, rgb[2] * k];
}
var GROUND_STYLE = {
  grass: { fill: "#a9d98a", line: "#8cc46b", skyTop: "#bfe6ff", skyBottom: "#f2fbff" },
  snow: { fill: "#eef6ff", line: "#d3e4f5", skyTop: "#c8e4ff", skyBottom: "#fbfdff" },
  sand: { fill: "#f0dcae", line: "#e0c68c", skyTop: "#cdeaff", skyBottom: "#fff9ec" },
  water: { fill: "#a8d8f0", line: "#8ec7e6", skyTop: "#c6e8ff", skyBottom: "#f0fbff" },
  none: { fill: "#e9eef3", line: "#dbe2e9", skyTop: "#e8f2fb", skyBottom: "#ffffff" }
};
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
function round(v, digits = 4) {
  const k = 10 ** digits;
  return Math.round(v * k) / k;
}
function mode(items) {
  const counts = /* @__PURE__ */ new Map();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  let best;
  let bestCount = -1;
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  }
  return best;
}

// src/geometry.ts
var sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
var cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-9) return [0, 1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}
var EPS = 1e-7;
function samePoint(a, b) {
  return Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS && Math.abs(a[2] - b[2]) < EPS;
}
function pushFace(list, verts, color) {
  const clean = [];
  for (const v of verts) {
    const last = clean[clean.length - 1];
    if (last !== void 0 && samePoint(last, v)) continue;
    clean.push(v);
  }
  while (clean.length > 1) {
    const first = clean[0];
    const last = clean[clean.length - 1];
    if (first !== void 0 && last !== void 0 && samePoint(first, last)) clean.pop();
    else break;
  }
  if (clean.length < 3) return;
  list.push({ v: clean, color });
}
function rawVolume(faces) {
  let total = 0;
  for (const face of faces) {
    for (let i = 1; i + 1 < face.v.length; i += 1) {
      const a = face.v[0];
      const b = face.v[i];
      const c = face.v[i + 1];
      if (a === void 0 || b === void 0 || c === void 0) continue;
      total += a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
    }
  }
  return total / 6;
}
var PATTERN_OUT = [[0, 0], [0, 1], [1, 1], [1, 0]];
var PATTERN_IN = [[0, 0], [1, 0], [1, 1], [0, 1]];
var DIRS = [
  { axis: 0, sign: 1, iAxis: 2, jAxis: 1, pattern: PATTERN_OUT },
  // +x
  { axis: 0, sign: -1, iAxis: 2, jAxis: 1, pattern: PATTERN_IN },
  // -x
  { axis: 1, sign: 1, iAxis: 0, jAxis: 2, pattern: PATTERN_OUT },
  // +y 顶面
  { axis: 1, sign: -1, iAxis: 0, jAxis: 2, pattern: PATTERN_IN },
  // -y 底面
  { axis: 2, sign: 1, iAxis: 0, jAxis: 1, pattern: PATTERN_IN },
  // +z
  { axis: 2, sign: -1, iAxis: 0, jAxis: 1, pattern: PATTERN_OUT }
  // -z
];
function pointAt(axis, plane, iAxis, jAxis, i, j) {
  const v = [0, 0, 0];
  v[axis] = plane;
  v[iAxis] = i;
  v[jAxis] = j;
  return v;
}
function mergeRect(grid, emit) {
  const used = /* @__PURE__ */ new Set();
  const keys = [...grid.keys()];
  const cells = [];
  for (const key of keys) {
    const [iText, jText] = key.split(",");
    const i = Number(iText);
    const j = Number(jText);
    if (Number.isFinite(i) && Number.isFinite(j)) cells.push([i, j]);
  }
  cells.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (const [i, j] of cells) {
    if (used.has(`${i},${j}`)) continue;
    const color = grid.get(`${i},${j}`);
    if (color === void 0) continue;
    let i1 = i + 1;
    while (grid.get(`${i1},${j}`) === color && !used.has(`${i1},${j}`)) i1 += 1;
    let j1 = j + 1;
    for (; ; ) {
      let ok = true;
      for (let k = i; k < i1; k += 1) {
        if (grid.get(`${k},${j1}`) !== color || used.has(`${k},${j1}`)) {
          ok = false;
          break;
        }
      }
      if (!ok) break;
      j1 += 1;
    }
    for (let k = i; k < i1; k += 1) {
      for (let m = j; m < j1; m += 1) used.add(`${k},${m}`);
    }
    emit(i, i1, j, j1, color);
  }
}
function voxelFaces(model) {
  const [W, H, D] = model.size;
  const w = Math.max(1, Math.round(W));
  const h = Math.max(1, Math.round(H));
  const d = Math.max(1, Math.round(D));
  const key = (x, y, z) => (y * d + z) * w + x;
  const cells = /* @__PURE__ */ new Map();
  for (const piece of model.pieces) {
    if (piece.shape !== "box") continue;
    const x0 = Math.round(piece.at[0]);
    const y0 = Math.round(piece.at[1]);
    const z0 = Math.round(piece.at[2]);
    const sx = Math.max(1, Math.round(piece.size[0]));
    const sy = Math.max(1, Math.round(piece.size[1]));
    const sz = Math.max(1, Math.round(piece.size[2]));
    for (let x = x0; x < x0 + sx; x += 1) {
      if (x < 0 || x >= w) continue;
      for (let y = y0; y < y0 + sy; y += 1) {
        if (y < 0 || y >= h) continue;
        for (let z = z0; z < z0 + sz; z += 1) {
          if (z < 0 || z >= d) continue;
          cells.set(key(x, y, z), piece.color);
        }
      }
    }
  }
  const out = [];
  const decode = (k) => {
    const x = k % w;
    const rest = (k - x) / w;
    const z = rest % d;
    const y = (rest - z) / d;
    return [x, y, z];
  };
  for (const dir of DIRS) {
    const planes = /* @__PURE__ */ new Map();
    for (const [k, color] of cells) {
      const [x, y, z] = decode(k);
      const nb = [x, y, z];
      const along = (nb[dir.axis] ?? 0) + dir.sign;
      if (along >= 0 && along < ([w, h, d][dir.axis] ?? 0)) {
        nb[dir.axis] = along;
        const nk = nb[0] ?? 0;
        const ny = nb[1] ?? 0;
        const nz = nb[2] ?? 0;
        if (cells.has(key(nk, ny, nz))) continue;
      }
      const cell = [x, y, z];
      const plane = (cell[dir.axis] ?? 0) + (dir.sign > 0 ? 1 : 0);
      let grid = planes.get(plane);
      if (grid === void 0) {
        grid = /* @__PURE__ */ new Map();
        planes.set(plane, grid);
      }
      grid.set(`${cell[dir.iAxis] ?? 0},${cell[dir.jAxis] ?? 0}`, color);
    }
    for (const [plane, grid] of planes) {
      mergeRect(grid, (i0, i1, j0, j1, color) => {
        const verts = dir.pattern.map(
          ([di, dj]) => pointAt(dir.axis, plane, dir.iAxis, dir.jAxis, di === 0 ? i0 : i1, dj === 0 ? j0 : j1)
        );
        pushFace(out, verts, color);
      });
    }
  }
  return out;
}
function polarOf(piece) {
  const [sx, sy, sz] = piece.size;
  switch (piece.axis) {
    case "x":
      return { toWorld: (p) => [-p[1], p[0], p[2]], la: sy / 2, lb: sx / 2, lc: sz / 2 };
    case "z":
      return { toWorld: (p) => [p[0], -p[2], p[1]], la: sx / 2, lb: sz / 2, lc: sy / 2 };
    default:
      return { toWorld: (p) => p, la: sx / 2, lb: sy / 2, lc: sz / 2 };
  }
}
function segments(radius, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(radius * 4)));
}
function emitSphere(out, piece, center) {
  const [rx, ry, rz] = [piece.size[0] / 2, piece.size[1] / 2, piece.size[2] / 2];
  const nLat = segments(Math.max(rx, ry, rz), 6, 16);
  const nLon = Math.max(8, nLat * 2);
  const at = (i, j) => {
    const theta = Math.PI * i / nLat;
    const phi = 2 * Math.PI * j / nLon;
    return [
      center[0] + rx * Math.sin(theta) * Math.cos(phi),
      center[1] + ry * Math.cos(theta),
      center[2] + rz * Math.sin(theta) * Math.sin(phi)
    ];
  };
  for (let i = 0; i < nLat; i += 1) {
    for (let j = 0; j < nLon; j += 1) {
      pushFace(
        out,
        [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)],
        piece.color
      );
    }
  }
}
function emitCylinder(out, piece, center, polar) {
  const { la, lb, lc, toWorld } = polar;
  const n = segments(Math.max(la, lc), 8, 24);
  const base = (j, up) => {
    const phi = 2 * Math.PI * j / n;
    const local = [la * Math.cos(phi), up ? lb : -lb, lc * Math.sin(phi)];
    const w = toWorld(local);
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]];
  };
  const mid = (up) => {
    const w = toWorld([0, up ? lb : -lb, 0]);
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]];
  };
  for (let j = 0; j < n; j += 1) {
    pushFace(out, [base(j, false), base(j, true), base(j + 1, true), base(j + 1, false)], piece.color);
    pushFace(out, [mid(true), base(j + 1, true), base(j, true)], piece.color);
    pushFace(out, [mid(false), base(j, false), base(j + 1, false)], piece.color);
  }
}
function emitCone(out, piece, center, polar) {
  const { la, lb, lc, toWorld } = polar;
  const n = segments(Math.max(la, lc), 8, 24);
  const place = (local) => {
    const w = toWorld(local);
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]];
  };
  const rim = (j) => {
    const phi = 2 * Math.PI * j / n;
    return place([la * Math.cos(phi), -lb, lc * Math.sin(phi)]);
  };
  const apex = place([0, lb, 0]);
  const foot = place([0, -lb, 0]);
  for (let j = 0; j < n; j += 1) {
    pushFace(out, [apex, rim(j + 1), rim(j)], piece.color);
    pushFace(out, [foot, rim(j), rim(j + 1)], piece.color);
  }
}
function emitPyramid(out, piece) {
  const [x0, y0, z0] = piece.at;
  const [sx, sy, sz] = piece.size;
  const x1 = x0 + sx;
  const y1 = y0 + sy;
  const z1 = z0 + sz;
  const apex = [(x0 + x1) / 2, y1, (z0 + z1) / 2];
  const corners = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1]
  ];
  for (let i = 0; i < 4; i += 1) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    if (a === void 0 || b === void 0) continue;
    pushFace(out, [apex, a, b], piece.color);
  }
  pushFace(out, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], piece.color);
}
function emitTorus(out, piece, center, polar) {
  const { la, lb, lc, toWorld } = polar;
  const rt = Math.max(0.05, lb);
  const R = Math.max(rt * 0.5, Math.min(la, lc) - rt);
  const nMajor = segments(R + rt, 12, 28);
  const nTube = segments(rt, 6, 14);
  const at = (i, j) => {
    const theta = 2 * Math.PI * i / nMajor;
    const phi = 2 * Math.PI * j / nTube;
    const rr = R + rt * Math.cos(phi);
    const local = [rr * Math.cos(theta), rt * Math.sin(phi), rr * Math.sin(theta)];
    const w = toWorld(local);
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]];
  };
  for (let i = 0; i < nMajor; i += 1) {
    for (let j = 0; j < nTube; j += 1) {
      pushFace(out, [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)], piece.color);
    }
  }
}
function curveFaces(piece) {
  const raw = [];
  const center = [
    piece.at[0] + piece.size[0] / 2,
    piece.at[1] + piece.size[1] / 2,
    piece.at[2] + piece.size[2] / 2
  ];
  const polar = polarOf(piece);
  switch (piece.shape) {
    case "sphere":
      emitSphere(raw, piece, center);
      break;
    case "cylinder":
      emitCylinder(raw, piece, center, polar);
      break;
    case "cone":
      emitCone(raw, piece, center, polar);
      break;
    case "pyramid":
      emitPyramid(raw, piece);
      break;
    case "torus":
      emitTorus(raw, piece, center, polar);
      break;
    default:
      break;
  }
  if (rawVolume(raw) < 0) {
    return raw.map((face) => ({ v: [...face.v].reverse(), color: face.color }));
  }
  return raw;
}
function toFace(raw) {
  const a = raw.v[0];
  const b = raw.v[1];
  const c = raw.v[2];
  const n = a !== void 0 && b !== void 0 && c !== void 0 ? normalize(cross(sub(b, a), sub(c, a))) : [0, 1, 0];
  const base = hexToRgb(raw.color);
  return { v: raw.v, rgb: shade(base, n), n };
}
function buildMesh(model) {
  const raw = voxelFaces(model);
  for (const piece of model.pieces) {
    if (piece.shape === "box") continue;
    for (const face of curveFaces(piece)) raw.push(face);
  }
  return { faces: raw.map(toFace) };
}
function modelBounds(model) {
  if (model.pieces.length === 0) {
    return { min: [0, 0, 0], max: [model.size[0], model.size[1], model.size[2]] };
  }
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const piece of model.pieces) {
    for (let axis = 0; axis < 3; axis += 1) {
      const lo = piece.at[axis] ?? 0;
      const hi = lo + (piece.size[axis] ?? 0);
      min[axis] = Math.min(min[axis] ?? 0, lo);
      max[axis] = Math.max(max[axis] ?? 0, hi);
    }
  }
  return { min, max };
}

// src/model.ts
var MODEL_VERSION = 1;
var EPS2 = 1e-6;
function normalizeName(input, fallback) {
  const raw = (input ?? "").trim();
  const cleaned = raw.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "").replace(/\.+$/g, "").replace(/\s+/g, " ").trim();
  if (cleaned === "" || cleaned === "." || cleaned === "..") return fallback;
  return cleaned.slice(0, 24);
}
function emptyModel(name2, size, ground) {
  return {
    version: MODEL_VERSION,
    name: normalizeName(name2, "\u6211\u7684\u4F5C\u54C1"),
    size: [size, size, size],
    ground,
    pieces: [],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function touch(model) {
  model.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  return model;
}
function parseModel(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return void 0;
  }
  if (typeof data !== "object" || data === null) return void 0;
  const raw = data;
  const sizeRaw = Array.isArray(raw["size"]) ? raw["size"] : [];
  const size = Number(sizeRaw[0] ?? 16);
  if (!Number.isFinite(size) || size < 8 || size > 32) return void 0;
  const groundRaw = String(raw["ground"] ?? "grass");
  const ground = GROUNDS.includes(groundRaw) ? groundRaw : "grass";
  const model = emptyModel(typeof raw["name"] === "string" ? raw["name"] : "\u6211\u7684\u4F5C\u54C1", Math.round(size), ground);
  const piecesRaw = Array.isArray(raw["pieces"]) ? raw["pieces"] : [];
  let nextId = 1;
  for (const item of piecesRaw) {
    if (typeof item !== "object" || item === null) continue;
    const result = makePiece(item, model, nextId, Math.round(size));
    if (result.ok) {
      model.pieces.push(result.piece);
      nextId = result.piece.id + 1;
    }
  }
  if (typeof raw["updatedAt"] === "string") model.updatedAt = raw["updatedAt"];
  return model;
}
function numbers(input) {
  if (!Array.isArray(input)) return void 0;
  const out = [];
  for (const item of input.slice(0, 3)) {
    const n = typeof item === "number" ? item : Number(item);
    if (!Number.isFinite(n)) return void 0;
    out.push(n);
  }
  if (out.length !== 3) return void 0;
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0];
}
function fmtSize(model) {
  return `${model.size[0]}\xD7${model.size[1]}\xD7${model.size[2]}`;
}
function makePiece(input, model, id, fallbackExtent = 4) {
  const shapeText = String(input.shape ?? "box");
  if (!SHAPES.includes(shapeText)) {
    return {
      ok: false,
      message: `\u3010\u4E0D\u8BA4\u8BC6\u8FD9\u4E2A\u5F62\u72B6\u3011\u300C${shapeText}\u300D\u6211\u6CA1\u505A\u8FC7\u3002\u73B0\u5728\u4F1A\u505A\u7684\u6709\uFF1A${SHAPES.map((s) => `${s}\uFF08${SHAPE_LABEL[s]}\uFF09`).join("\u3001")}\u3002`
    };
  }
  const shape = shapeText;
  const colorText = typeof input.color === "string" ? input.color.trim() : "";
  if (colorText !== "" && resolveColor(colorText, "") === "") {
    return {
      ok: false,
      message: `\u3010\u4E0D\u8BA4\u8BC6\u300C${colorText}\u300D\u8FD9\u4E2A\u989C\u8272\u3011\u53EF\u4EE5\u5199\u8FD9\u4E9B\u540D\u5B57\uFF1A${paletteList()}\uFF1B\u4E5F\u53EF\u4EE5\u5199 #ff8800 \u8FD9\u6837\u7684\u8272\u53F7\u3002\u4E0D\u5199\u5C31\u662F\u84DD\u8272\u3002`
    };
  }
  const atRaw = numbers(input.at);
  if (atRaw === void 0) {
    return { ok: false, message: "\u3010\u4F4D\u7F6E\u6CA1\u770B\u61C2\u3011\u8981\u7528\u4E09\u4E2A\u6570\u5B57\u8BF4\u300C\u653E\u5728\u54EA\u513F\u300D\uFF0C\u6BD4\u5982 at:[0,0,0] \u6216 at:[2,0,3]\uFF08\u5DE6\u53F3\u3001\u4E0A\u4E0B\u3001\u524D\u540E\uFF09\u3002" };
  }
  const sizeRaw = numbers(input.size);
  const size = sizeRaw ?? [fallbackExtent, fallbackExtent, fallbackExtent];
  for (const value of size) {
    if (value <= 0) {
      return { ok: false, message: "\u3010\u5927\u5C0F\u4E0D\u80FD\u662F 0 \u6216\u8D1F\u6570\u3011\u6BD4\u5982 size:[4,4,4] \u8868\u793A\u957F\u5BBD\u9AD8\u5404 4 \u683C\u3002" };
    }
  }
  const box2 = shape === "box";
  const at = box2 ? [Math.round(atRaw[0]), Math.round(atRaw[1]), Math.round(atRaw[2])] : [atRaw[0], atRaw[1], atRaw[2]];
  const fixed = box2 ? [Math.max(1, Math.round(size[0])), Math.max(1, Math.round(size[1])), Math.max(1, Math.round(size[2]))] : [size[0], size[1], size[2]];
  const names = ["\u5DE6\u53F3 x", "\u4E0A\u4E0B y", "\u524D\u540E z"];
  for (let axis = 0; axis < 3; axis += 1) {
    const lo = at[axis] ?? 0;
    const hi = lo + (fixed[axis] ?? 0);
    if (lo < -EPS2) {
      return {
        ok: false,
        message: `\u3010\u653E\u5230\u5730\u4E0B\u53BB\u4E86\u3011${names[axis]} \u4E0D\u80FD\u662F\u8D1F\u6570\uFF08${round(lo, 2)}\uFF09\u3002\u5DE5\u574A\u7684\u5730\u677F\u5728 0\uFF0C\u5F80\u4E0A\u624D\u662F\u6B63\u6570\u3002`
      };
    }
    if (hi > (model.size[axis] ?? 0) + EPS2) {
      const limit = model.size[axis] ?? 0;
      const room = Math.max(0, round(limit - lo, 2));
      return {
        ok: false,
        message: `\u3010\u653E\u4E0D\u4E0B\u3011\u8FD9\u4EF6\u79EF\u6728\u671D ${names[axis]} \u4F1A\u4F38\u5230\u5DE5\u574A\u5916\u9762\uFF08\u5DE5\u574A\u662F ${fmtSize(model)}\uFF0C\u4F60\u8BF4\u4ECE ${round(lo, 2)} \u5F00\u59CB\u653E ${round(fixed[axis] ?? 0, 2)} \u683C\uFF0C\u6700\u8FDC\u5230 ${round(hi, 2)}\uFF0C\u53EF\u5899\u5728 ${limit}\uFF09\u3002` + (room >= 1 ? `\u53EF\u4EE5\u8BD5\u8BD5\u628A\u5B83\u6539\u5C0F\u5230 ${room} \u683C\u4EE5\u5185\uFF0C\u4F4D\u7F6E\u4E5F\u5F80\u56DE\u6536\u4E00\u70B9\u3002` : "\u8FD9\u4E2A\u4F4D\u7F6E\u5DF2\u7ECF\u8D34\u7740\u5899\u4E86\uFF0C\u8981\u4E48\u6362\u4E2A\u5730\u65B9\uFF0C\u8981\u4E48\u7528 kid3d_new size 24 \u6362\u4E00\u95F4\u66F4\u5927\u7684\u5DE5\u574A\u3002")
      };
    }
  }
  const axisText = String(input.axis ?? "y").toLowerCase();
  if (!AXES.includes(axisText)) {
    return { ok: false, message: `\u3010\u671D\u5411\u53EA\u8BA4 x / y / z\u3011\u300C${axisText}\u300D\u4E0D\u884C\u3002\u8EBA\u7740\u653E\u7528 axis:"x" \u6216 axis:"z"\uFF0C\u7AD9\u7740\u653E\u4E0D\u7528\u5199\u3002` };
  }
  return {
    ok: true,
    piece: {
      id,
      shape,
      at,
      size: fixed,
      color: resolveColor(colorText, "#3b82f6"),
      axis: axisText
    }
  };
}
function pieceBounds(piece) {
  return {
    min: [piece.at[0], piece.at[1], piece.at[2]],
    max: [piece.at[0] + piece.size[0], piece.at[1] + piece.size[1], piece.at[2] + piece.size[2]]
  };
}
function regionBounds(at, size) {
  return {
    min: [at[0], at[1], at[2]],
    max: [at[0] + size[0], at[1] + size[1], at[2] + size[2]]
  };
}
function piecesTouching(model, at, size) {
  const region = regionBounds(at, size);
  return model.pieces.filter((piece) => {
    const b = pieceBounds(piece);
    for (let axis = 0; axis < 3; axis += 1) {
      if ((b.max[axis] ?? 0) <= (region.min[axis] ?? 0) + EPS2) return false;
      if ((region.max[axis] ?? 0) <= (b.min[axis] ?? 0) + EPS2) return false;
    }
    return true;
  });
}
function describePiece(piece) {
  const axisNote = piece.axis === "y" ? "" : piece.axis === "x" ? "\uFF08\u671D\u5DE6\u53F3\u8EBA\u7740\uFF09" : "\uFF08\u671D\u524D\u540E\u8EBA\u7740\uFF09";
  const curved = piece.shape === "cylinder" || piece.shape === "cone" || piece.shape === "torus";
  const size = piece.size.map((n) => round(n, 2)).join("\xD7");
  return `${colorName(piece.color)}\u7684${SHAPE_LABEL[piece.shape]}${curved ? axisNote : ""} ${size} \u683C\uFF0C\u653E\u5728 (${piece.at.map((n) => round(n, 2)).join(", ")})`;
}
function colorCounts(model) {
  const map = /* @__PURE__ */ new Map();
  for (const piece of model.pieces) {
    map.set(piece.color, (map.get(piece.color) ?? 0) + 1);
  }
  return [...map.entries()].map(([color, count]) => ({ color, count })).sort((a, b) => b.count - a.count);
}
function shapeCounts(model) {
  const map = /* @__PURE__ */ new Map();
  for (const piece of model.pieces) {
    map.set(piece.shape, (map.get(piece.shape) ?? 0) + 1);
  }
  return [...map.entries()].map(([shape, count]) => ({ shape, count })).sort((a, b) => b.count - a.count);
}

// src/render-svg.ts
var VIEW_NAMES = ["iso", "front", "side", "top", "quad"];
var VIEW_LABEL = {
  iso: "\u7B49\u8DDD\u89C6\u89D2",
  front: "\u6B63\u9762",
  side: "\u4FA7\u9762",
  top: "\u4FEF\u89C6",
  quad: "\u56DB\u89C6\u56FE"
};
var BASE_CAMERA = {
  iso: { az: 35, el: 30 },
  front: { az: 0, el: 8 },
  side: { az: 90, el: 8 },
  top: { az: 0, el: 88 }
};
var DEG = Math.PI / 180;
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function projector(cam) {
  const az = cam.az * DEG;
  const el = cam.el * DEG;
  const right = [Math.cos(az), 0, -Math.sin(az)];
  const up = [-Math.sin(el) * Math.sin(az), Math.cos(el), -Math.sin(el) * Math.cos(az)];
  const dir = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  return {
    right,
    up,
    dir,
    project: (p) => [dot(p, right), dot(p, up), dot(p, dir)]
  };
}
function fmt(n) {
  const v = round(n, 1);
  return Object.is(v, -0) ? "0" : String(v);
}
function panelMarkup(model, mesh, input, opts) {
  const style = GROUND_STYLE[model.ground];
  const cam = projector(input.camera);
  const { box: box2 } = input;
  const bounds = modelBounds(model);
  const corners = [];
  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) corners.push([x, y, z]);
    }
  }
  let loX = Infinity;
  let hiX = -Infinity;
  let loY = Infinity;
  let hiY = -Infinity;
  for (const c of corners) {
    const [sx, sy] = cam.project(c);
    loX = Math.min(loX, sx);
    hiX = Math.max(hiX, sx);
    loY = Math.min(loY, sy);
    hiY = Math.max(hiY, sy);
  }
  const spanX = Math.max(1e-3, hiX - loX);
  const spanY = Math.max(1e-3, hiY - loY);
  const margin = 34;
  const base = Math.min((box2.w - margin * 2) / spanX, (box2.h - margin * 2) / spanY);
  const scale = Math.max(1, base * opts.zoom);
  const midX = (loX + hiX) / 2;
  const midY = (loY + hiY) / 2;
  const centerX = box2.w / 2;
  const centerY = box2.h / 2;
  const toScreen = (p) => {
    const [sx, sy] = cam.project(p);
    return [centerX + (sx - midX) * scale, centerY - (sy - midY) * scale];
  };
  const parts = [];
  parts.push(`<rect x="0" y="0" width="${fmt(box2.w)}" height="${fmt(box2.h)}" rx="18" fill="url(#sky-${input.id})"/>`);
  if (model.ground !== "none") {
    const [W, , D] = model.size;
    const floor = [[0, 0, 0], [W, 0, 0], [W, 0, D], [0, 0, D]];
    const floorPath = floor.map((p) => toScreen(p)).map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ");
    parts.push(
      `<clipPath id="panel-${input.id}"><rect x="0" y="0" width="${fmt(box2.w)}" height="${fmt(box2.h)}" rx="18"/></clipPath>`
    );
    parts.push(`<g clip-path="url(#panel-${input.id})">`);
    parts.push(`<polygon points="${floorPath}" fill="${style.fill}"/>`);
    if (opts.grid) {
      const lines = [];
      const step = W > 24 || D > 24 ? 2 : 1;
      for (let x = 0; x <= W; x += step) {
        const a = toScreen([x, 0, 0]);
        const b = toScreen([x, 0, D]);
        lines.push(`M${fmt(a[0])},${fmt(a[1])}L${fmt(b[0])},${fmt(b[1])}`);
      }
      for (let z = 0; z <= D; z += step) {
        const a = toScreen([0, 0, z]);
        const b = toScreen([W, 0, z]);
        lines.push(`M${fmt(a[0])},${fmt(a[1])}L${fmt(b[0])},${fmt(b[1])}`);
      }
      parts.push(`<path d="${lines.join("")}" stroke="${style.line}" stroke-width="1.2" fill="none"/>`);
    }
    parts.push(`<polygon points="${floorPath}" fill="none" stroke="${style.line}" stroke-width="2"/>`);
    parts.push("</g>");
  }
  const visible = [];
  for (const face of mesh.faces) {
    if (dot(face.n, cam.dir) <= 1e-4) continue;
    let depth = 0;
    for (const v of face.v) depth += cam.project(v)[2];
    visible.push({ face, depth: depth / Math.max(1, face.v.length) });
  }
  visible.sort((a, b) => a.depth - b.depth);
  for (const item of visible) {
    const points = item.face.v.map((v) => toScreen(v)).map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ");
    const color = `rgb(${Math.round(item.face.rgb[0])},${Math.round(item.face.rgb[1])},${Math.round(item.face.rgb[2])})`;
    parts.push(
      `<polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round"/>`
    );
  }
  if (input.label !== "") {
    parts.push(
      `<text x="16" y="26" font-size="15" font-weight="600" fill="#41536a">${input.label}</text>`
    );
  }
  return {
    markup: `<g transform="translate(${fmt(box2.x)},${fmt(box2.y)})">${parts.join("")}</g>`,
    drawn: visible.length
  };
}
function modelSummary(model) {
  const count = model.pieces.length;
  const colors = model.pieces.map((p) => colorName(p.color));
  const shapes = model.pieces.map((p) => SHAPE_LABEL[p.shape]);
  const topColor = mode(colors);
  const topShape = mode(shapes);
  const bits = [
    `${model.size[0]}\xD7${model.size[1]}\xD7${model.size[2]} \u683C\u5DE5\u574A`,
    `${count} \u4EF6\u79EF\u6728`,
    `\u5730\u9762\uFF1A${GROUND_LABEL[model.ground]}`
  ];
  if (topColor !== void 0) bits.splice(2, 0, `\u4E3B\u8272\uFF1A${topColor}`);
  if (topShape !== void 0) bits.splice(3, 0, `\u6700\u591A\u7684\u5F62\u72B6\uFF1A${topShape}`);
  return bits.join(" \xB7 ");
}
function renderSvg(model, mesh, opts) {
  const titleH = 72;
  const width = opts.width ?? 960;
  const isQuad = opts.view === "quad";
  const height = opts.height ?? (isQuad ? 880 : 700);
  const inner = { x: 16, y: titleH, w: width - 32, h: height - titleH - 16 };
  const panels = [];
  if (isQuad) {
    const gap = 14;
    const halfW = (inner.w - gap) / 2;
    const halfH = (inner.h - gap) / 2;
    const names = ["iso", "front", "side", "top"];
    names.forEach((name2, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const baseCam = BASE_CAMERA[name2];
      panels.push({
        id: `${name2}`,
        label: VIEW_LABEL[name2],
        // 四视图里只有「等距视角」跟着 spin 转，另外三个保持正/侧/俯的标准角度，标签才不骗人
        camera: { az: baseCam.az + (name2 === "iso" ? opts.spin : 0), el: baseCam.el },
        box: { x: inner.x + col * (halfW + gap), y: inner.y + row * (halfH + gap), w: halfW, h: halfH }
      });
    });
  } else {
    const name2 = opts.view === "quad" ? "iso" : opts.view;
    const baseCam = BASE_CAMERA[name2];
    panels.push({
      id: name2,
      label: "",
      camera: { az: baseCam.az + opts.spin, el: baseCam.el },
      box: inner
    });
  }
  const defs = [];
  for (const panel of panels) {
    defs.push(
      `<linearGradient id="sky-${panel.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${GROUND_STYLE[model.ground].skyTop}"/><stop offset="100%" stop-color="${GROUND_STYLE[model.ground].skyBottom}"/></linearGradient>`
    );
  }
  let drawn = 0;
  const body = [];
  for (const panel of panels) {
    const result = panelMarkup(model, mesh, panel, opts);
    body.push(result.markup);
    drawn += result.drawn;
  }
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(width)} ${fmt(height)}" width="${fmt(width)}" height="${fmt(height)}"`,
    ` font-family="-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif">`,
    `<defs>${defs.join("")}</defs>`,
    `<rect x="0" y="0" width="${fmt(width)}" height="${fmt(height)}" fill="#fbfdff"/>`,
    `<text x="${fmt(width / 2)}" y="32" text-anchor="middle" font-size="24" font-weight="700" fill="#26364a">${escapeXml(model.name)}</text>`,
    `<text x="${fmt(width / 2)}" y="56" text-anchor="middle" font-size="15" fill="#61758c">${escapeXml(modelSummary(model))}</text>`,
    body.join(""),
    `</svg>`
  ].join("");
  return { svg, stats: { panels: panels.length, faces: mesh.faces.length, drawn } };
}
function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// src/state.ts
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { basename, join, resolve, sep } from "node:path";
function safeWorkDir(input) {
  const cleaned = input.replace(/[\\/:*?"<>|]/g, "").replace(/\./g, "").trim();
  return cleaned === "" ? "kid3d" : cleaned;
}
function pathsFor(cwd, workDir) {
  const root = resolve(cwd);
  const dir = join(root, safeWorkDir(workDir));
  return { dir, modelFile: join(dir, "model.json"), archiveDir: join(dir, "\u5B58\u6863") };
}
function fileFor(paths, name2, extension) {
  const base = normalizeName(name2, "\u6211\u7684\u4F5C\u54C1");
  const file = resolve(paths.dir, `${base}.${extension}`);
  if (!file.startsWith(paths.dir + sep)) return join(paths.dir, `\u6211\u7684\u4F5C\u54C1.${extension}`);
  return file;
}
async function ensureDirs(paths) {
  await mkdir(paths.dir, { recursive: true });
}
async function readModel(paths) {
  try {
    const text = await readFile(paths.modelFile, "utf8");
    return parseModel(text);
  } catch {
    return void 0;
  }
}
async function writeModel(paths, model) {
  await ensureDirs(paths);
  await writeFile(paths.modelFile, `${JSON.stringify(model, null, 2)}
`, "utf8");
}
async function writeText(paths, file, text) {
  await ensureDirs(paths);
  await writeFile(file, text, "utf8");
}
async function writeBinary(paths, file, data) {
  await ensureDirs(paths);
  await writeFile(file, data);
}
function stamp(date3) {
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${date3.getFullYear()}-${pad2(date3.getMonth() + 1)}-${pad2(date3.getDate())}-${pad2(date3.getHours())}${pad2(date3.getMinutes())}${pad2(date3.getSeconds())}`;
}
async function archiveModel(paths, model) {
  if (model.pieces.length === 0) return void 0;
  try {
    await mkdir(paths.archiveDir, { recursive: true });
    const file = join(paths.archiveDir, `${stamp(/* @__PURE__ */ new Date())}-${normalizeName(model.name, "\u6211\u7684\u4F5C\u54C1")}.json`);
    await writeText(paths, file, `${JSON.stringify(model, null, 2)}
`);
    await trimArchive(paths.archiveDir, 40);
    return file;
  } catch {
    return void 0;
  }
}
async function trimArchive(dir, keep) {
  try {
    const names = (await readdir(dir)).filter((n) => n.endsWith(".json"));
    if (names.length <= keep) return;
    const dated = await Promise.all(
      names.map(async (name2) => {
        const info = await stat(join(dir, name2));
        return { name: name2, time: info.mtimeMs };
      })
    );
    dated.sort((a, b) => a.time - b.time);
    for (const item of dated.slice(0, dated.length - keep)) {
      await unlink(join(dir, item.name));
    }
  } catch {
  }
}
async function listArchive(paths) {
  try {
    const names = (await readdir(paths.archiveDir)).filter((n) => n.endsWith(".json"));
    const rows = await Promise.all(
      names.map(async (file) => {
        const full = join(paths.archiveDir, file);
        const model = await readFile(full, "utf8").then(parseModel).catch(() => void 0);
        if (model === void 0) return void 0;
        const time = await stat(full).then((info) => info.mtimeMs).catch(() => 0);
        return { file, name: model.name, time, pieces: model.pieces.length };
      })
    );
    return rows.filter((row) => row !== void 0).sort((a, b) => b.time - a.time);
  } catch {
    return [];
  }
}
async function readArchive(paths, file) {
  const full = resolve(paths.archiveDir, basename(file));
  if (!full.startsWith(paths.archiveDir + sep)) return void 0;
  try {
    return parseModel(await readFile(full, "utf8"));
  } catch {
    return void 0;
  }
}

// src/card.ts
var STATE_PATH = "/kid-3d/state";
var PREVIEW_PATH = "/kid-3d/preview.svg";
var MIN_WIDTH = 240;
var MAX_WIDTH = 1200;
var MIN_HEIGHT = 200;
var MAX_HEIGHT = 900;
var ARTIFACT_EXTENSIONS = /* @__PURE__ */ new Set(["svg", "html", "stl", "obj"]);
async function readSidecar(paths) {
  let files = [];
  try {
    const entries = await readdir2(paths.dir, { withFileTypes: true });
    files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name).filter((name2) => ARTIFACT_EXTENSIONS.has(name2.split(".").pop() ?? "")).sort();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let archive = null;
  try {
    archive = (await readdir2(paths.archiveDir)).length;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  let mtimeMs = null;
  try {
    mtimeMs = (await stat2(paths.modelFile)).mtimeMs;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return { files, archive, mtimeMs };
}
async function collectCardState(paths, config, resolvedFrom) {
  const model = await readModel(paths);
  const sidecar = await readSidecar(paths);
  const base = {
    dir: paths.dir,
    resolvedFrom,
    files: sidecar.files,
    archive: sidecar.archive
  };
  if (model === void 0) {
    return {
      exists: false,
      ...base,
      name: null,
      summary: null,
      pieces: null,
      workshop: null,
      ground: null,
      groundLabel: null,
      shapes: [],
      colors: [],
      print: null,
      footprint: null,
      updatedAt: null,
      rev: null
    };
  }
  const bounds = modelBounds(model);
  const span = [0, 1, 2].map((axis) => (bounds.max[axis] ?? 0) - (bounds.min[axis] ?? 0));
  return {
    exists: true,
    ...base,
    name: model.name,
    summary: modelSummary(model),
    pieces: model.pieces.length,
    workshop: model.size[0],
    ground: model.ground,
    groundLabel: GROUND_LABEL[model.ground],
    shapes: shapeCounts(model).map((row) => ({
      shape: row.shape,
      label: SHAPE_LABEL[row.shape],
      count: row.count
    })),
    colors: colorCounts(model).map((row) => ({
      hex: row.color,
      name: colorName(row.color),
      count: row.count
    })),
    // 和 kid3d_export 同一套口径：长×宽×高，y 轴朝上
    print: {
      long: round1((span[0] ?? 0) * config.unitMm),
      wide: round1((span[2] ?? 0) * config.unitMm),
      tall: round1((span[1] ?? 0) * config.unitMm)
    },
    footprint: { w: round1(span[0] ?? 0), d: round1(span[2] ?? 0) },
    updatedAt: model.updatedAt,
    rev: sidecar.mtimeMs === null ? null : String(Math.round(sidecar.mtimeMs))
  };
}
function round1(value) {
  return Math.round(value * 10) / 10;
}
function clamp2(value, low, high) {
  return Math.max(low, Math.min(high, value));
}
function methodAllowed(req, res) {
  if (req.method === "GET" || req.method === "HEAD") return true;
  res.writeHead(405, { allow: "GET", "content-type": "text/plain; charset=utf-8" });
  res.end("method not allowed");
  return false;
}
function send(req, res, status, type, text) {
  res.writeHead(status, {
    "content-type": type,
    "content-length": Buffer.byteLength(text),
    "cache-control": "no-store"
  });
  res.end(req.method === "HEAD" ? void 0 : text);
}
function query(req) {
  return new URL(req.url ?? "/", "http://localhost").searchParams;
}
function numberParam(params, key, fallback) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
function registerKid3dCard(ctx, config) {
  ctx.inject(["webServer"], (child) => {
    const webServer = child.get("webServer");
    if (webServer === void 0) return;
    const sessions = child.get("sessions");
    const at = (sessionId) => {
      const cwd = sessionId === null ? void 0 : sessions?.get(sessionId)?.header.cwd;
      if (cwd === void 0) return { paths: pathsFor(process.cwd(), config.workDir), from: "process" };
      return { paths: pathsFor(cwd, config.workDir), from: "session" };
    };
    const stateRoute = {
      kind: "exact",
      path: STATE_PATH,
      async handler(req, res) {
        if (!methodAllowed(req, res)) return;
        const { paths, from: from3 } = at(query(req).get("session"));
        try {
          const state = await collectCardState(paths, config, from3);
          send(req, res, 200, "application/json; charset=utf-8", JSON.stringify(state));
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          send(req, res, 500, "application/json; charset=utf-8", JSON.stringify({ error: message }));
        }
      }
    };
    const previewRoute = {
      kind: "exact",
      path: PREVIEW_PATH,
      async handler(req, res) {
        if (!methodAllowed(req, res)) return;
        const params = query(req);
        const { paths } = at(params.get("session"));
        try {
          const model = await readModel(paths);
          if (model === void 0) {
            send(req, res, 404, "application/json; charset=utf-8", JSON.stringify({ error: "\u8FD8\u6CA1\u5F00\u5DE5\u574A" }));
            return;
          }
          const rawView = params.get("view") ?? "";
          const view = VIEW_NAMES.includes(rawView) ? rawView : "iso";
          const svg = renderSvg(model, buildMesh(model), {
            view,
            spin: clamp2(numberParam(params, "spin", 0), 0, 360),
            zoom: 1,
            grid: params.get("grid") === "1",
            width: clamp2(numberParam(params, "w", 560), MIN_WIDTH, MAX_WIDTH),
            height: clamp2(numberParam(params, "h", 400), MIN_HEIGHT, MAX_HEIGHT)
          });
          send(req, res, 200, "image/svg+xml; charset=utf-8", svg.svg);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          send(req, res, 500, "application/json; charset=utf-8", JSON.stringify({ error: message }));
        }
      }
    };
    child.effect(() => webServer.register(stateRoute), "kid-3d: card state route");
    child.effect(() => webServer.register(previewRoute), "kid-3d: card preview route");
  });
}

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cosmokit/src/misc.ts
function isNullable(value) {
  return value === null || value === void 0;
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function filterKeys(object, filter) {
  return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function pick(source, keys, forced) {
  if (!keys) return { ...source };
  const result = {};
  for (const key of keys) {
    if (forced || source[key] !== void 0) result[key] = source[key];
  }
  return result;
}
function defineProperty(object, key, value) {
  return Object.defineProperty(object, key, { writable: true, value, enumerable: false });
}

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cosmokit/src/volatile.ts
var write = /* @__PURE__ */ Symbol.for("cosmokit.volatile.write");
function snapshot(value, ancestors = /* @__PURE__ */ new Set()) {
  if (typeof value === "function") throw new TypeError("volatile config cannot contain functions");
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) throw new TypeError("volatile config cannot contain cycles");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return Object.freeze(value.map((item) => snapshot(item, ancestors)));
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new TypeError("volatile config objects must be plain objects or arrays");
    }
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item, ancestors)])));
  } finally {
    ancestors.delete(value);
  }
}
function createVolatile(value) {
  let current = snapshot(value);
  return Object.freeze({
    get: () => current,
    [write]: (value2) => {
      current = value2;
    }
  });
}
function isVolatile(value) {
  return typeof value === "object" && value !== null && write in value;
}

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cosmokit/src/types.ts
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
((Binary2) => {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) {
      return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    } else {
      return source;
    }
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") {
      return Buffer.from(source).toString("base64");
    }
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) {
      buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    }
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function clone(source, refs = /* @__PURE__ */ new Map()) {
  if (!source || typeof source !== "object") return source;
  if (is("Date", source)) return new Date(source.valueOf());
  if (is("RegExp", source)) return new RegExp(source.source, source.flags);
  if (isArrayBufferLike(source)) return source.slice(0);
  if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const cached = refs.get(source);
  if (cached) return cached;
  if (Array.isArray(source)) {
    const result2 = [];
    refs.set(source, result2);
    source.forEach((value, index) => {
      result2[index] = Reflect.apply(clone, null, [value, refs]);
    });
    return result2;
  }
  const result = Object.create(Object.getPrototypeOf(source));
  refs.set(source, result);
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
    if ("value" in descriptor) {
      descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
    }
    Reflect.defineProperty(result, key, descriptor);
  }
  return result;
}
function deepEqual(a, b, strict) {
  const ancestors = /* @__PURE__ */ new Set();
  function compare(a2, b2) {
    if (a2 === b2) return true;
    if (isVolatile(a2) || isVolatile(b2)) return isVolatile(a2) && isVolatile(b2);
    if (!strict && isNullable(a2) && isNullable(b2)) return true;
    if (typeof a2 !== typeof b2 || typeof a2 !== "object" || !a2 || !b2) return false;
    if (ancestors.has(a2)) return false;
    function check(test, then) {
      return test(a2) ? test(b2) ? then(a2, b2) : false : test(b2) ? false : void 0;
    }
    ancestors.add(a2);
    try {
      return check(Array.isArray, (a3, b3) => {
        if (a3.length !== b3.length) return false;
        for (let index = 0; index < a3.length; index++) {
          if (!compare(a3[index], b3[index])) return false;
        }
        return true;
      }) ?? check(is("Date"), (a3, b3) => a3.valueOf() === b3.valueOf()) ?? check(is("URL"), (a3, b3) => a3.href === b3.href) ?? check(is("RegExp"), (a3, b3) => a3.source === b3.source && a3.flags === b3.flags) ?? check(isArrayBufferLike, (a3, b3) => {
        if (a3.byteLength !== b3.byteLength) return false;
        const viewA = new Uint8Array(a3);
        const viewB = new Uint8Array(b3);
        for (let i = 0; i < viewA.length; i++) {
          if (viewA[i] !== viewB[i]) return false;
        }
        return true;
      }) ?? ((!strict || [a2, b2].every((value) => Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) && Object.keys({ ...a2, ...b2 }).every((key) => compare(a2[key], b2[key])));
    } finally {
      ancestors.delete(a2);
    }
  }
  return compare(a, b);
}

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cosmokit/src/string.ts
function tokenize(source, delimiters, delimiter) {
  const output = [];
  let state = 0 /* DELIM */;
  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      if (state === 1 /* UPPER */) {
        const next = source.charCodeAt(i + 1);
        if (next >= 97 && next <= 122) {
          output.push(delimiter);
        }
        output.push(code + 32);
      } else {
        if (state !== 0 /* DELIM */) {
          output.push(delimiter);
        }
        output.push(code + 32);
      }
      state = 1 /* UPPER */;
    } else if (code >= 97 && code <= 122) {
      output.push(code);
      state = 2 /* LOWER */;
    } else if (delimiters.includes(code)) {
      if (state !== 0 /* DELIM */) {
        output.push(delimiter);
      }
      state = 0 /* DELIM */;
    } else {
      output.push(code);
    }
  }
  return String.fromCharCode(...output);
}
function paramCase(source) {
  return tokenize(source, [45, 95], 45);
}
var hyphenate = paramCase;

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cosmokit/src/time.ts
var Time;
((Time2) => {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date3 = /* @__PURE__ */ new Date(), offset) {
    if (typeof date3 === "number") date3 = new Date(date3);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date3.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date3 = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date3 + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date3) {
    const parsed = parseTime(date3);
    if (parsed) {
      date3 = Date.now() + parsed;
    } else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date3)) {
      date3 = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date3}`;
    } else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date3)) {
      date3 = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date3}`;
    }
    return date3 ? new Date(date3) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) {
      return Math.round(ms / Time2.day) + "d";
    } else if (abs >= Time2.hour - Time2.minute / 2) {
      return Math.round(ms / Time2.hour) + "h";
    } else if (abs >= Time2.minute - Time2.second / 2) {
      return Math.round(ms / Time2.minute) + "m";
    } else if (abs >= Time2.second) {
      return Math.round(ms / Time2.second) + "s";
    }
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// ../../../deepseek-harness-dev/deepseek-harness/vendor/schemastery/lib/index.mjs
var kSchema = /* @__PURE__ */ Symbol.for("schemastery");
var kValidationError = /* @__PURE__ */ Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
  options;
  name = "ValidationError";
  constructor(message, options) {
    let prefix = "$";
    for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
    else if (typeof segment === "number") prefix += "[" + segment + "]";
    else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
    if (prefix.startsWith(".")) prefix = prefix.slice(1);
    super((prefix === "$" ? "" : `${prefix} `) + message);
    this.options = options;
  }
  static is(error) {
    return !!error?.[kValidationError];
  }
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
var Schema = function(options) {
  const schema = function(data, options2 = {}) {
    return Schema.resolve(data, schema, options2)[0];
  };
  if (options.refs) {
    const refs = mapValues(options.refs, (options2) => new Schema(options2));
    const getRef = (uid) => refs[uid];
    for (const key in refs) {
      const options2 = refs[key];
      options2.sKey = getRef(options2.sKey);
      options2.inner = getRef(options2.inner);
      options2.list = options2.list && options2.list.map(getRef);
      options2.dict = options2.dict && mapValues(options2.dict, getRef);
    }
    return refs[options.uid];
  }
  Object.assign(schema, options);
  if (typeof schema.callback === "string") try {
    schema.callback = new Function("return " + schema.callback)();
  } catch {
  }
  Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
  Object.setPrototypeOf(schema, Schema.prototype);
  schema.meta ||= {};
  schema.toString = schema.toString.bind(schema);
  return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
  return {
    version: 1,
    vendor: "schemastery",
    validate: (value) => {
      try {
        return { value: Schema.resolve(value, this, {})[0] };
      } catch (error) {
        if (ValidationError.is(error)) return { issues: [{
          message: error.message,
          path: error.options.path
        }] };
        throw error;
      }
    }
  };
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
  if (globalThis.__schemastery_refs__) {
    globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
    return this.uid;
  }
  globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
  globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
  const result = {
    uid: this.uid,
    refs: globalThis.__schemastery_refs__
  };
  globalThis.__schemastery_refs__ = void 0;
  return result;
};
Schema.prototype.set = function set(key, value) {
  this.dict[key] = value;
  return this;
};
Schema.prototype.push = function push(value) {
  this.list.push(value);
  return this;
};
function mergeDesc(original, messages) {
  const result = typeof original === "string" ? { "": original } : { ...original };
  for (const locale in messages) {
    const value = messages[locale];
    if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
    else if (typeof value === "string") result[locale] = value;
  }
  return result;
}
function getInner(value) {
  return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
  return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
  const schema = Schema(this);
  const desc = mergeDesc(schema.meta.description, messages);
  if (Object.keys(desc).length) schema.meta.description = desc;
  if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
    return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
  });
  if (schema.list) schema.list = schema.list.map((inner, index) => {
    return inner.i18n(mapValues(messages, (data = {}) => {
      if (Array.isArray(getInner(data))) return getInner(data)[index];
      if (Array.isArray(data)) return data[index];
      return extractKeys(data);
    }));
  });
  if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
    if (getInner(data)) return getInner(data);
    return extractKeys(data);
  }));
  if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
  return schema;
};
Schema.prototype.extra = function extra(key, value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
};
for (const key of [
  "required",
  "disabled",
  "collapse",
  "hidden",
  "loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
Schema.prototype.deprecated = function deprecated() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({
    text: "deprecated",
    type: "danger"
  });
  return schema;
};
Schema.prototype.experimental = function experimental() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({
    text: "experimental",
    type: "warning"
  });
  return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
  const schema = Schema(this);
  const pattern3 = pick(regexp, ["source", "flags"]);
  schema.meta = {
    ...schema.meta,
    pattern: pattern3
  };
  return schema;
};
Schema.prototype.simplify = function simplify(value) {
  if (isVolatile(value)) value = value.get();
  if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
  if (isNullable(value)) return value;
  if (this.type === "object" || this.type === "dict") {
    const result = {};
    for (const key in value) {
      const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
      if (this.type === "dict" || !isNullable(item)) result[key] = item;
    }
    if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
    return result;
  } else if (this.type === "array" || this.type === "tuple") {
    const result = [];
    value.forEach((value2, index) => {
      const schema = this.type === "array" ? this.inner : this.list[index];
      const item = schema ? schema.simplify(value2) : value2;
      result.push(item);
    });
    return result;
  } else if (this.type === "intersect") {
    const result = {};
    for (const item of this.list) Object.assign(result, item.simplify(value));
    return result;
  } else if (this.type === "union") for (const schema of this.list) try {
    Schema.resolve(value, schema, {});
    return schema.simplify(value);
  } catch {
  }
  return value;
};
Schema.prototype.toString = function toString(inline) {
  return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra3) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    role,
    extra: extra3
  };
  return schema;
};
for (const key of [
  "default",
  "link",
  "comment",
  "description",
  "max",
  "min",
  "step"
]) Object.assign(Schema.prototype, { [key](value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
Schema.prototype.volatile = function volatile() {
  if (this.meta.volatile) throw new TypeError("volatile schema is already wrapped");
  return this.extra("volatile", true);
};
var resolvers = {};
var checkedVolatile = /* @__PURE__ */ Symbol("checked-volatile-schema");
function validateVolatileSchema(schema, path = [], blocked = false, seen = /* @__PURE__ */ new Map()) {
  const states = seen.get(schema) ?? /* @__PURE__ */ new Set();
  if (states.has(blocked)) return;
  states.add(blocked);
  seen.set(schema, states);
  if (schema.meta?.volatile && blocked) throw new ValidationError("volatile fields require a fixed object path without an enclosing volatile field", { path });
  const nested = blocked || !!schema.meta?.volatile;
  if (schema.dict) for (const [key, child] of Object.entries(schema.dict)) validateVolatileSchema(child, [...path, key], nested, seen);
  if (schema.sKey) validateVolatileSchema(schema.sKey, [...path, "<key>"], true, seen);
  if (schema.inner && (schema.type !== "lazy" || schema.inner[kSchema])) validateVolatileSchema(schema.inner, [...path, "*"], true, seen);
  if (schema.list) for (let index = 0; index < schema.list.length; index++) validateVolatileSchema(schema.list[index], [...path, String(index)], true, seen);
}
Schema.extend = function extend(type, resolve4) {
  resolvers[type] = resolve4;
};
Schema.resolve = function resolve2(data, schema, options = {}, strict = false) {
  if (!schema) return [data];
  if (!options[checkedVolatile]) {
    validateVolatileSchema(schema, options.path);
    options = {
      ...options,
      [checkedVolatile]: true
    };
  }
  if (schema.meta?.volatile) {
    const inner = Schema(schema);
    inner.meta = {
      ...schema.meta,
      volatile: false
    };
    const [value, adapted] = Schema.resolve(data, inner, options, strict);
    try {
      return [createVolatile(value), adapted];
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : String(error), options);
    }
  }
  if (options.ignore?.(data, schema)) return [data];
  if (isNullable(data) && schema.type !== "lazy") {
    if (schema.meta.required) throw new ValidationError(`missing required value`, options);
    let current = schema;
    let fallback = schema.meta.default;
    while (current?.type === "intersect" && isNullable(fallback)) {
      current = current.list[0];
      fallback = current?.meta.default;
    }
    if (isNullable(fallback)) return [data];
    data = clone(fallback);
  }
  const callback = resolvers[schema.type];
  if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
  try {
    return callback(data, schema, options, strict);
  } catch (error) {
    if (!schema.meta.loose) throw error;
    return [schema.meta.default];
  }
};
Schema.from = function from(source) {
  if (isNullable(source)) return Schema.any();
  else if ([
    "string",
    "number",
    "boolean"
  ].includes(typeof source)) return Schema.const(source).required();
  else if (source[kSchema]) return source;
  else if (typeof source === "function") switch (source) {
    case String:
      return Schema.string().required();
    case Number:
      return Schema.number().required();
    case Boolean:
      return Schema.boolean().required();
    case Function:
      return Schema.function().required();
    default:
      return Schema.is(source).required();
  }
  else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
  const toJSON3 = () => {
    if (!schema.inner[kSchema]) {
      schema.inner = schema.builder();
      schema.inner.meta = {
        ...schema.meta,
        ...schema.inner.meta
      };
    }
    return schema.inner.toJSON();
  };
  const schema = new Schema({
    type: "lazy",
    builder,
    inner: { toJSON: toJSON3 }
  });
  return schema;
};
Schema.natural = function natural() {
  return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
  return Schema.number().step(0.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
  return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
    const date3 = new Date(value);
    if (isNaN(+date3)) throw new ValidationError(`invalid date "${value}"`, options);
    return date3;
  }, true)]);
};
Schema.regExp = function regExp(flag = "") {
  return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
    try {
      return new RegExp(value, flag);
    } catch (e) {
      throw new ValidationError(e.message, options);
    }
  }, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
  return Schema.union([
    Schema.is(ArrayBuffer),
    Schema.is(SharedArrayBuffer),
    Schema.transform(Schema.any(), (value, options) => {
      if (Binary.isSource(value)) return Binary.fromSource(value);
      throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
    }, true),
    ...encoding ? [Schema.transform(Schema.string(), (value, options) => {
      try {
        return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
      } catch (e) {
        throw new ValidationError(e.message, options);
      }
    }, true)] : []
  ]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
  if (!schema.inner[kSchema]) {
    schema.inner = schema.builder();
    schema.inner.meta = {
      ...schema.meta,
      ...schema.inner.meta
    };
    validateVolatileSchema(schema.inner, options.path, true);
  }
  return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
  return [data];
});
Schema.extend("never", (data, _, options) => {
  throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
  if (deepEqual(data, value)) return [value];
  throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
  const { max = Infinity, min = -Infinity } = meta;
  if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
  if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
  if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
  if (meta.pattern) {
    const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
    if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
  }
  checkWithinRange(data.length, meta, "string length", options);
  return [data];
});
function decimalShift(data, digits) {
  const str = data.toString();
  if (str.includes("e")) return data * Math.pow(10, digits);
  const index = str.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str.slice(index + 1);
  const integer = str.slice(0, index);
  if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
  return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
  step = Math.abs(step);
  if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
  const index = step.toString().indexOf(".");
  const digits = step.toString().slice(index + 1).length;
  return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
  if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
  checkWithinRange(data, meta, "number", options);
  const { step } = meta;
  if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
  return [data];
});
Schema.extend("boolean", (data, _, options) => {
  if (typeof data === "boolean") return [data];
  throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
  let value = 0, keys = [];
  if (typeof data === "number") {
    value = data;
    for (const key in bits) if (data & bits[key]) keys.push(key);
  } else if (Array.isArray(data)) {
    keys = data;
    for (const key of keys) {
      if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
      if (key in bits) value |= bits[key];
    }
  } else throw new ValidationError(`expected number or array but got ${data}`, options);
  if (value === meta.default) return [value];
  return [value, keys];
});
Schema.extend("function", (data, _, options) => {
  if (typeof data === "function") return [data];
  throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
  if (typeof constructor === "function") {
    if (data instanceof constructor) return [data];
    throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
  } else {
    if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
    let prototype = Object.getPrototypeOf(data);
    while (prototype) {
      if (prototype.constructor?.name === constructor) return [data];
      prototype = Object.getPrototypeOf(prototype);
    }
    throw new ValidationError(`expected ${constructor} but got ${data}`, options);
  }
});
function property(data, key, schema, options) {
  try {
    const [value, adapted] = Schema.resolve(data[key], schema, {
      ...options,
      path: [...options.path || [], key]
    });
    if (adapted !== void 0) data[key] = adapted;
    return value;
  } catch (e) {
    if (!options?.autofix) throw e;
    delete data[key];
    return schema.meta.volatile ? createVolatile(schema.meta.default) : schema.meta.default;
  }
}
Schema.extend("array", (data, { inner, meta }, options) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
  return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in data) {
    let rKey;
    try {
      rKey = Schema.resolve(key, sKey, options)[0];
    } catch (error) {
      if (strict) continue;
      throw error;
    }
    result[rKey] = property(data, key, inner, options);
    data[rKey] = data[key];
    if (key !== rKey) delete data[key];
  }
  return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  const result = list.map((inner, index) => property(data, index, inner, options));
  if (strict) return [result];
  result.push(...data.slice(list.length));
  return [result];
});
function merge(result, data) {
  for (const key in data) {
    if (key in result) continue;
    result[key] = data[key];
  }
}
Schema.extend("object", (data, { dict }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in dict) {
    const value = property(data, key, dict[key], options);
    if (!isNullable(value) || key in data) result[key] = value;
  }
  if (!strict) merge(result, data);
  return [result];
});
Schema.extend("union", (data, { list, toString: toString3 }, options, strict) => {
  const messages = [];
  for (const inner of list) try {
    return Schema.resolve(data, inner, options, strict);
  } catch (error) {
    messages.push(error);
  }
  throw new ValidationError(`expected ${toString3()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString: toString3 }, options, strict) => {
  if (!list.length) return [data];
  let result;
  for (const inner of list) {
    const value = Schema.resolve(data, inner, options, true)[0];
    if (isNullable(value)) continue;
    if (isNullable(result)) result = value;
    else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString3()} but got ${JSON.stringify(data)}`, options);
    else if (typeof value === "object") merge(result ??= {}, value);
    else if (result !== value) throw new ValidationError(`expected ${toString3()} but got ${JSON.stringify(data)}`, options);
  }
  if (!strict && isPlainObject(data)) merge(result, data);
  return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
  const [result, adapted = data] = Schema.resolve(data, inner, options, true);
  if (preserve) return [callback(result)];
  else return [callback(result), callback(adapted)];
});
var formatters = {};
function defineMethod(name2, keys, format) {
  formatters[name2] = format;
  Object.assign(Schema, { [name2](...args) {
    const schema = new Schema({ type: name2 });
    keys.forEach((key, index) => {
      switch (key) {
        case "sKey":
          schema.sKey = args[index] ?? Schema.string();
          break;
        case "inner":
          schema.inner = Schema.from(args[index]);
          break;
        case "list":
          schema.list = args[index].map(Schema.from);
          break;
        case "dict":
          schema.dict = mapValues(args[index], Schema.from);
          break;
        case "bits":
          schema.bits = {};
          for (const key2 in args[index]) {
            if (typeof args[index][key2] !== "number") continue;
            schema.bits[key2] = args[index][key2];
          }
          break;
        case "callback": {
          const callback = schema.callback = args[index];
          callback["toJSON"] ||= () => callback.toString();
          break;
        }
        case "constructor": {
          const constructor = schema.constructor = args[index];
          if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
          break;
        }
        default:
          schema[key] = args[index];
      }
    });
    if (name2 === "object" || name2 === "dict") schema.meta.default = {};
    else if (name2 === "array" || name2 === "tuple") schema.meta.default = [];
    else if (name2 === "bitset") schema.meta.default = 0;
    return schema;
  } });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
  if (typeof constructor === "function") return constructor.name;
  else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
  if (Object.keys(dict).length === 0) return "{}";
  return `{ ${Object.entries(dict).map(([key, inner]) => {
    return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
  }).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
  const result = list.map(({ toString: format }) => format()).join(" | ");
  return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
  return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
  "inner",
  "callback",
  "preserve"
], ({ inner }, isInner) => inner.toString(isInner));

// src/config.ts
var DEFAULT_CONFIG = {
  enabled: true,
  timeoutMs: 8e3,
  workDir: "kid3d",
  defaultSize: 16,
  maxPieces: 300,
  unitMm: 5,
  interactiveMaxFaces: 1200,
  dragOrbit: true
};
var Config = Schema.intersect([
  Schema.object({
    enabled: Schema.boolean().description("\u542F\u7528\u6574\u5957\u5DE5\u5177").default(true),
    timeoutMs: Schema.number().min(1e3).max(3e4).description("\u5355\u6B21\u8C03\u7528\u8D85\u65F6(ms)").default(8e3),
    workDir: Schema.string().description("\u4F5C\u54C1\u76EE\u5F55(\u76F8\u5BF9\u5DE5\u4F5C\u76EE\u5F55)").default("kid3d"),
    defaultSize: Schema.number().min(8).max(32).description("\u65B0\u5DE5\u574A\u8FB9\u957F(\u683C)").default(16),
    maxPieces: Schema.number().min(10).max(2e3).description("\u6700\u591A\u79EF\u6728\u4EF6\u6570").default(300),
    unitMm: Schema.number().min(0.1).max(50).description("1 \u683C\u7B49\u4E8E\u591A\u5C11\u6BEB\u7C73").default(5),
    interactiveMaxFaces: Schema.number().min(50).max(2e4).description("\u7F51\u9875\u81EA\u8F6C\u7684\u9762\u6570\u4E0A\u9650").default(1200),
    dragOrbit: Schema.boolean().description("\u7F51\u9875\u53EF\u6309\u4F4F\u62D6\u52A8\u8F6C\u89C6\u89D2").default(true)
  })
]);

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/utils.ts
var DisposableList = class {
  sn = 0;
  map = /* @__PURE__ */ new Map();
  weak = /* @__PURE__ */ new WeakMap();
  get length() {
    return this.map.size;
  }
  push(value) {
    const sn = ++this.sn;
    this.map.set(sn, value);
    this.weak.set(value, sn);
    return () => this.map.delete(sn);
  }
  delete(value) {
    const sn = this.weak.get(value);
    if (!sn) return false;
    return this.map.delete(sn);
  }
  clear() {
    const values = [...this.map.values()];
    this.map.clear();
    return values.reverse();
  }
  [Symbol.iterator]() {
    return this.map.values();
  }
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this];
  }
};
var symbols = {
  // internal symbols
  shadow: /* @__PURE__ */ Symbol.for("cordis.shadow"),
  receiver: /* @__PURE__ */ Symbol.for("cordis.receiver"),
  original: /* @__PURE__ */ Symbol.for("cordis.original"),
  metadata: /* @__PURE__ */ Symbol.for("cordis.metadata"),
  initHooks: /* @__PURE__ */ Symbol.for("cordis.initHooks"),
  checkProto: /* @__PURE__ */ Symbol.for("cordis.checkProto"),
  // context symbols
  effect: /* @__PURE__ */ Symbol.for("cordis.effect"),
  filter: /* @__PURE__ */ Symbol.for("cordis.filter"),
  isolate: /* @__PURE__ */ Symbol.for("cordis.isolate"),
  intercept: /* @__PURE__ */ Symbol.for("cordis.intercept"),
  // service symbols
  init: /* @__PURE__ */ Symbol.for("cordis.init"),
  check: /* @__PURE__ */ Symbol.for("cordis.check"),
  config: /* @__PURE__ */ Symbol.for("cordis.config"),
  invoke: /* @__PURE__ */ Symbol.for("cordis.invoke"),
  extend: /* @__PURE__ */ Symbol.for("cordis.extend"),
  tracker: /* @__PURE__ */ Symbol.for("cordis.tracker"),
  resolveConfig: /* @__PURE__ */ Symbol.for("cordis.resolveConfig")
};
var GeneratorFunction = function* () {
}.constructor;
var AsyncGeneratorFunction = async function* () {
}.constructor;
function isConstructor(func) {
  if (!func.prototype) return false;
  if (func instanceof GeneratorFunction) return false;
  if (AsyncGeneratorFunction !== Function && func instanceof AsyncGeneratorFunction) return false;
  return true;
}
function joinPrototype(proto1, proto2) {
  if (proto1 === Object.prototype) return proto2;
  const result = Object.create(joinPrototype(Object.getPrototypeOf(proto1), proto2));
  for (const key of Reflect.ownKeys(proto1)) {
    Object.defineProperty(result, key, Object.getOwnPropertyDescriptor(proto1, key));
  }
  return result;
}
function isObject(value) {
  return value && (typeof value === "object" || typeof value === "function");
}
function getPropertyDescriptor(target, prop) {
  let proto = target;
  while (proto) {
    const desc = Reflect.getOwnPropertyDescriptor(proto, prop);
    if (desc) return desc;
    proto = Object.getPrototypeOf(proto);
  }
}
function getTraceable(ctx, value) {
  if (!isObject(value)) return value;
  if (Object.hasOwn(value, symbols.shadow)) {
    return Object.getPrototypeOf(value);
  }
  const tracker = value[symbols.tracker];
  if (!tracker) return value;
  return createTraceable(ctx, value, tracker);
}
function withProps(target, props) {
  if (!props) return target;
  return new Proxy(target, {
    get: (target2, prop, receiver) => {
      if (prop in props && prop !== "constructor") return Reflect.get(props, prop, receiver);
      return Reflect.get(target2, prop, receiver);
    },
    set: (target2, prop, value, receiver) => {
      if (prop in props && prop !== "constructor") return Reflect.set(props, prop, value, receiver);
      return Reflect.set(target2, prop, value, receiver);
    }
  });
}
function withProp(target, prop, value) {
  return withProps(target, Object.defineProperty(/* @__PURE__ */ Object.create(null), prop, {
    value,
    writable: false
  }));
}
function createShadow(ctx, target, property3, receiver) {
  if (!property3) return receiver;
  const origin = Reflect.getOwnPropertyDescriptor(target, property3)?.value;
  if (!origin) return receiver;
  return withProp(receiver, property3, ctx.extend({ [symbols.shadow]: origin }));
}
function createShadowMethod(ctx, value, outer, shadow) {
  return new Proxy(value, {
    apply: (target, thisArg, args) => {
      if (thisArg === outer) thisArg = shadow;
      return getTraceable(ctx, Reflect.apply(target, thisArg, args));
    }
  });
}
function createTraceable(ctx, value, tracker) {
  if (ctx[symbols.shadow] && !tracker.noShadow) {
    ctx = Object.getPrototypeOf(ctx);
  }
  const proxy = new Proxy(value, {
    get: (target, prop, receiver) => {
      if (prop === symbols.original) return target;
      if (prop === tracker.property) return ctx;
      if (typeof prop === "symbol") {
        return Reflect.get(target, prop, receiver);
      }
      if (tracker.associate && ctx.reflect.props[`${tracker.associate}.${prop}`]) {
        return Reflect.get(ctx, `${tracker.associate}.${prop}`, withProp(ctx, symbols.receiver, receiver));
      }
      let shadow, innerValue;
      const desc = getPropertyDescriptor(target, prop);
      if (desc && "value" in desc) {
        innerValue = desc.value;
      } else {
        shadow = createShadow(ctx, target, tracker.property, receiver);
        innerValue = Reflect.get(target, prop, shadow);
      }
      const innerTracker = innerValue?.[symbols.tracker];
      if (innerTracker) {
        return createTraceable(ctx, innerValue, innerTracker);
      } else if (!tracker.noShadow && typeof innerValue === "function") {
        shadow ??= createShadow(ctx, target, tracker.property, receiver);
        return createShadowMethod(ctx, innerValue, receiver, shadow);
      } else {
        return innerValue;
      }
    },
    set: (target, prop, value2, receiver) => {
      if (prop === symbols.original) return false;
      if (prop === tracker.property) return false;
      if (typeof prop === "symbol") {
        return Reflect.set(target, prop, value2, receiver);
      }
      if (tracker.associate && ctx.reflect.props[`${tracker.associate}.${prop}`]) {
        return Reflect.set(ctx, `${tracker.associate}.${prop}`, value2, withProp(ctx, symbols.receiver, receiver));
      }
      const shadow = createShadow(ctx, target, tracker.property, receiver);
      return Reflect.set(target, prop, value2, shadow);
    },
    apply: (target, thisArg, args) => {
      return applyTraceable(proxy, target, thisArg, args);
    }
  });
  return proxy;
}
function applyTraceable(proxy, value, thisArg, args) {
  if (!value[symbols.invoke]) return Reflect.apply(value, thisArg, args);
  return value[symbols.invoke].apply(proxy, args);
}
function createCallable(name2, proto, tracker) {
  const self = function(...args) {
    const proxy = createTraceable(self["ctx"], self, tracker);
    return applyTraceable(proxy, self, this, args);
  };
  defineProperty(self, "name", name2);
  return Object.setPrototypeOf(self, proto);
}
function handleError(info, reason, getOuterStack) {
  const innerLines = info.error.stack.split("\n");
  if (typeof reason?.stack !== "string") {
    const outerError = new Error(reason);
    const lines2 = outerError.stack.split("\n");
    lines2.splice(1, Infinity, ...getOuterStack());
    outerError.stack = lines2.join("\n");
    throw outerError;
  }
  const lines = reason.stack.split("\n");
  let index = lines.indexOf(innerLines[2]);
  if (index === -1) throw reason;
  index -= info.offset;
  while (index > 0) {
    if (!lines[index - 1].endsWith(" (<anonymous>)")) break;
    index -= 1;
  }
  lines.splice(index, Infinity, ...getOuterStack());
  reason.stack = lines.join("\n");
  throw reason;
}
function composeError(callback, getOuterStack = buildOuterStack()) {
  const info = { offset: 1, error: new Error() };
  try {
    const result = callback(info);
    if (isObject(result) && "then" in result) {
      return result.then(void 0, (reason) => handleError(info, reason, getOuterStack));
    } else {
      return result;
    }
  } catch (reason) {
    handleError(info, reason, getOuterStack);
  }
}
function buildOuterStack(offset = 0) {
  const outerError = new Error();
  return () => outerError.stack.split("\n").slice(3 + offset);
}

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/events.ts
function isBailed(value) {
  return value !== null && value !== false && value !== void 0;
}
var EventsService = class {
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
    this.on("internal/listener", function(name2, listener, options) {
      if (name2 === "internal/update" && !options.global) {
        const hooks = this.fiber._hooks["internal/update"] ??= new DisposableList();
        const method = options.prepend ? "unshift" : "push";
        return hooks[method](listener);
      }
    });
    this.on("internal/update", function(config, noSave, next) {
      const cbs = [...this._hooks["internal/update"] || []];
      const _next = () => {
        const cb = cbs.shift() ?? next;
        return cb.call(this, config, noSave, _next);
      };
      return _next();
    }, { global: true, prepend: true });
  }
  ctx;
  _hooks = {};
  /**
   * Resolve listeners for one dispatch and apply context filtering.
   *
   * @param type — the dispatch mode, reported on `internal/dispatch`.
   * @param args — the raw dispatch arguments; consumed up to the event name.
   * @returns the matching listener callbacks, bound to the dispatch `this`.
   */
  dispatch(type, args) {
    const thisArg = typeof args[0] === "object" || typeof args[0] === "function" ? args.shift() : null;
    const name2 = args.shift();
    if (!name2.startsWith("internal/")) {
      this.emit("internal/dispatch", type, name2, args, thisArg);
    }
    const filter = thisArg?.[Context.filter];
    return (this._hooks[name2] || []).filter((hook) => hook.global || !filter || filter.call(thisArg, hook.ctx)).map((hook) => hook.callback.bind(thisArg));
  }
  /**
   * Run listeners concurrently and wait for all of them.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   * @returns a promise resolving once every listener has settled.
   */
  async parallel(...args) {
    const results = await Promise.allSettled(this.dispatch("emit", args).map(async (cb) => cb(...args)));
    const errors = results.filter((result) => result.status === "rejected");
    if (errors.length) throw new AggregateError(errors.map((error) => error.reason));
  }
  /**
   * Run listeners synchronously without waiting for returned promises.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   */
  emit(...args) {
    this.dispatch("emit", args).map((cb) => cb(...args));
  }
  /**
   * Run listeners in order, awaiting each, until one returns a bail value.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   * @returns the first bail value (see {@link isBailed}), if any.
   */
  async serial(...args) {
    for (const cb of this.dispatch("serial", args)) {
      const result = await cb(...args);
      if (isBailed(result)) return result;
    }
  }
  /**
   * Run listeners synchronously until one returns a bail value.
   *
   * @param args — optional `this`, the event name, then listener arguments.
   * @returns the first bail value (see {@link isBailed}), if any.
   */
  bail(...args) {
    for (const cb of this.dispatch("bail", args)) {
      const result = cb(...args);
      if (isBailed(result)) return result;
    }
  }
  /**
   * Compose listeners around the final `next` callback.
   *
   * The last dispatch argument is treated as the innermost `next`. Listeners
   * run outermost-first; a listener that does not call `next()` vetoes the
   * rest of the chain, including the built-in behavior.
   *
   * @param args — optional `this`, the event name, listener arguments, then `next`.
   * @returns the outermost listener's return value.
   */
  waterfall(...args) {
    const cbs = this.dispatch("waterfall", args);
    const inner = args.pop();
    const next = () => {
      const cb = cbs.shift() ?? inner;
      return cb(...args);
    };
    args.push(next);
    return next();
  }
  /**
   * Store a listener record as an effect on the current fiber.
   *
   * @param label — effect label shown in fiber diagnostics.
   * @param hooks — the listener list for one event.
   * @param callback — the listener to store.
   * @param options — placement and filtering options.
   * @returns a disposer that unregisters the listener.
   */
  register(label, hooks, callback, options) {
    const method = options.prepend ? "unshift" : "push";
    return this.ctx.fiber.effect(() => {
      hooks[method]({ ctx: this.ctx, callback, ...options });
      return () => this.unregister(hooks, callback);
    }, label);
  }
  /**
   * Remove a stored listener record.
   *
   * @param hooks — the listener list for one event.
   * @param callback — the listener to remove.
   * @returns `true` if the listener was found and removed.
   */
  unregister(hooks, callback) {
    const index = hooks.findIndex((hook) => hook.callback === callback);
    if (index >= 0) {
      hooks.splice(index, 1);
      return true;
    }
  }
  /**
   * Register an event listener owned by the current fiber.
   *
   * The listener is removed automatically when the fiber unloads. Throws
   * `CordisError('INACTIVE_EFFECT')` if the fiber is already disposed.
   *
   * @param name — the event name to listen for.
   * @param listener — called with the dispatch arguments.
   * @param options — listener options; a boolean is shorthand for `prepend`.
   * @returns a disposer removing the listener; `true` if it was still registered.
   */
  on(name2, listener, options) {
    if (typeof options !== "object") {
      options = { prepend: options };
    }
    this.ctx.fiber.assertActive();
    listener = this.ctx.reflect.bind(listener);
    const result = this.bail(this.ctx, "internal/listener", name2, listener, options);
    if (result) return result;
    const hooks = this._hooks[name2] ||= [];
    const label = `ctx.on(${typeof name2 === "string" ? JSON.stringify(name2) : name2.toString()})`;
    return this.register(label, hooks, listener, options);
  }
  /**
   * Register an event listener that disposes itself after the first call.
   *
   * @param name — the event name to listen for.
   * @param listener — called at most once with the dispatch arguments.
   * @param options — listener options; a boolean is shorthand for `prepend`.
   * @returns a disposer removing the listener; `true` if it was still registered.
   */
  once(name2, listener, options) {
    const dispose = this.on(name2, function(...args) {
      dispose();
      return listener.apply(this, args);
    }, options);
    return dispose;
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/logger.ts
var defaultFormatters = {
  s: (value) => String(value),
  d: (value) => Math.trunc(Number(value)),
  i: (value) => Math.trunc(Number(value)),
  f: (value) => Number(value),
  o: (value) => JSON.stringify(value),
  O: (value) => JSON.stringify(value),
  c: () => "",
  C: (value, exporter, message) => {
    return Logger.color(exporter, Logger.code(message.name, exporter.colors), value);
  }
};
function isAggregateError(error) {
  return error instanceof Error && Array.isArray(error["errors"]);
}
var Logger = class {
  constructor(options, service) {
    this.service = service;
    Object.assign(this, options);
    this.error = this._method("error", 0 /* ERROR */);
    this.info = this._method("info", 1 /* INFO */);
    this.warn = this._method("warn", 2 /* WARN */);
    this.debug = this._method("debug", 3 /* DEBUG */);
  }
  service;
  static color(exporter, code, value, decoration = "") {
    if (!exporter.colors) return "" + value;
    return `\x1B[3${code < 8 ? code : "8;5;" + code}${exporter.colors >= 2 ? decoration : ""}m${value}\x1B[0m`;
  }
  static code(name2, level) {
    let hash = 0;
    for (let i = 0; i < name2.length; i++) {
      hash = (hash << 3) - hash + name2.charCodeAt(i) + 13;
      hash |= 0;
    }
    const colors = !level ? [] : level >= 2 ? c256 : c16;
    return colors[Math.abs(hash) % colors.length];
  }
  static format(exporter, message) {
    const args = message.args.slice();
    if (args[0] instanceof Error) {
      args[0] = args[0].stack || args[0].message;
      args.unshift("%s");
    } else if (typeof args[0] !== "string") {
      args.unshift("%o");
    }
    let format = args.shift();
    format = format.replace(/%([a-zA-Z%])/g, (match, char) => {
      if (match === "%%") return "%";
      const formatter = exporter.formatters?.[char] ?? defaultFormatters[char];
      if (typeof formatter === "function") {
        const value = args.shift();
        return formatter(value, exporter, message);
      }
      return match;
    });
    const oFormatter = exporter.formatters?.o ?? defaultFormatters.o;
    for (let arg of args) {
      if (typeof arg === "object" && arg) {
        arg = oFormatter(arg, exporter, message);
      }
      format += " " + arg;
    }
    const { maxLength = 10240 } = exporter;
    return format.split(/\r?\n/g).map((line) => {
      return line.slice(0, maxLength) + (line.length > maxLength ? "..." : "");
    }).join("\n");
  }
  _method(type, level) {
    return (...args) => {
      if (args.length === 1 && args[0] instanceof Error) {
        if (args[0].cause) {
          this[type](args[0].cause);
        } else if (isAggregateError(args[0])) {
          args[0].errors.forEach((error) => this[type](error));
          return;
        }
      }
      const sn = ++this.service._snMessage;
      const ts = Date.now();
      for (const exporter of this.service.exporters.values()) {
        const targetLevel = exporter.levels?.[this.name] ?? exporter.levels?.default ?? this.level ?? 1 /* INFO */;
        if (targetLevel < level) continue;
        const message = { sn, ts, type, level, name: this.name, ...this.meta, args };
        exporter.export(message);
      }
    };
  }
};
var c16 = [6, 2, 3, 4, 5, 1];
var c256 = [
  20,
  21,
  26,
  27,
  32,
  33,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  56,
  57,
  62,
  63,
  68,
  69,
  74,
  75,
  76,
  77,
  78,
  79,
  80,
  81,
  92,
  93,
  98,
  99,
  112,
  113,
  129,
  134,
  135,
  148,
  149,
  160,
  161,
  162,
  163,
  164,
  165,
  166,
  167,
  168,
  169,
  170,
  171,
  172,
  173,
  178,
  179,
  184,
  185,
  196,
  197,
  198,
  199,
  200,
  201,
  202,
  203,
  204,
  205,
  206,
  207,
  208,
  209,
  214,
  215,
  220,
  221
];
var LoggerService = class _LoggerService {
  bufferSize = 1e3;
  buffer = [];
  ctx;
  _snMessage = 0;
  _snExporter = 0;
  exporters = /* @__PURE__ */ new Map();
  constructor(ctx) {
    const tracker = {
      property: "ctx",
      noShadow: true
    };
    const self = createCallable("logger", joinPrototype(Object.getPrototypeOf(this), Function.prototype), tracker);
    Object.assign(self, this);
    self.ctx = ctx;
    defineProperty(self, symbols.tracker, tracker);
    self.exporter({
      colors: 3,
      export: (message) => {
        self.buffer.push(message);
        if (self.buffer.length > self.bufferSize) {
          self.buffer = self.buffer.slice(-self.bufferSize);
        }
      }
    });
    return self;
  }
  /**
   * Register an exporter and dispose it with the current fiber.
   *
   * @param exporter — the sink that receives structured log messages.
   * @returns a disposer that removes the exporter.
   */
  exporter(exporter) {
    return this.ctx.effect(() => {
      const id = ++this._snExporter;
      this.exporters.set(id, exporter);
      return () => this.exporters.delete(id);
    }, "ctx.logger.exporter()");
  }
  _resolveConfig() {
    let intercept = this.ctx[symbols.intercept];
    const configs = [];
    while ("logger" in intercept) {
      if (Object.hasOwn(intercept, "logger")) {
        configs.unshift(intercept["logger"]);
      }
      intercept = Object.getPrototypeOf(intercept);
    }
    return Object.assign({}, ...configs);
  }
  [symbols.invoke](name2) {
    const config = this._resolveConfig();
    const fiber = (this.ctx[symbols.shadow] ?? this.ctx).fiber;
    name2 ??= config.name;
    name2 ??= hyphenate(fiber.name);
    return new Logger({
      name: name2,
      level: config.level,
      meta: { fiber: new WeakRef(fiber) }
    }, this);
  }
  static {
    for (const type of ["error", "info", "warn", "debug"]) {
      ;
      _LoggerService.prototype[type] = function(...args) {
        return this()[type](...args);
      };
    }
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/fiber.ts
var kValidationError2 = /* @__PURE__ */ Symbol.for("ValidationError");
var ValidationError2 = class extends TypeError {
  name = "ValidationError";
  /**
   * Build the aggregated message from schema issues.
   *
   * @param issues — the standard-schema issues, one message line each.
   */
  constructor(issues) {
    super(`invalid config:
` + issues.map((issue) => {
      if (issue.path) {
        return `  - ${issue.message} (at ${issue.path.join(".")})`;
      } else {
        return `  - ${issue.message}`;
      }
    }).join("\n"));
  }
};
Object.defineProperty(ValidationError2.prototype, kValidationError2, {
  value: true
});
function resolveConfig(runtime, config) {
  if (!runtime.Config) return config;
  const result = runtime.Config["~standard"].validate(config);
  if ("then" in result) {
    throw new TypeError("Async config validation is not supported");
  }
  if (result.issues) {
    throw new ValidationError2(result.issues);
  } else {
    return result.value;
  }
}
var effectInertia = /* @__PURE__ */ new WeakMap();
function runDisposable(dispose) {
  const result = dispose();
  return effectInertia.get(dispose)?.() ?? result;
}
function emitPluginDisposed(context, fiber) {
  const args = ["internal/plugin", fiber];
  let callbacks;
  try {
    callbacks = context.events.dispatch("emit", args);
  } catch (error) {
    context.logger.error(error);
    return;
  }
  for (const callback of callbacks) {
    try {
      const returned = callback(...args);
      void Promise.resolve(returned).catch((error) => context.logger.error(error));
    } catch (error) {
      context.logger.error(error);
    }
  }
}
var CordisError = class _CordisError extends Error {
  /**
   * @param code — the stable error code; also the default message.
   * @param message — optional human-readable override.
   */
  constructor(code, message) {
    super(message ?? _CordisError.Code[code]);
    this.code = code;
  }
  code;
};
((CordisError2) => {
  CordisError2.Code = {
    INACTIVE_EFFECT: "cannot create effect on inactive context"
  };
})(CordisError || (CordisError = {}));
var INACTIVE = "__INACTIVE__";
var Fiber = class {
  /**
   * Create a fiber. Plugin authors normally obtain fibers from `ctx.plugin()`
   * rather than constructing them directly.
   *
   * @param parent — the context the plugin was loaded from.
   * @param config — raw config, validated against the runtime's schema.
   * @param inject — resolved dependency map (service name → intercept config).
   * @param runtime — the shared plugin runtime, or `null` for the root fiber.
   * @param getOuterStack — captures the caller stack for effect diagnostics.
   */
  constructor(parent, config, inject, runtime, getOuterStack) {
    this.parent = parent;
    this.inject = inject;
    this.runtime = runtime;
    this._config = config;
    const collect = (dispose) => {
      this._disposables.push(dispose);
    };
    if (runtime) {
      this.uid = parent.registry.counter;
      this.ctx = this.context = parent.extend({ fiber: this });
      const injectEntries = Object.entries(this.inject);
      if (injectEntries.length) {
        this.ctx[Context.intercept] = Object.create(parent[Context.intercept]);
        for (const [name2, config2] of injectEntries) {
          if (isNullable(config2)) continue;
          this.ctx[Context.intercept][name2] = config2;
        }
      }
      this._runner = {
        epoch: INACTIVE,
        getOuterStack,
        execute: function() {
          if (isConstructor(runtime.callback)) {
            const instance = new runtime.callback(this.ctx, this.config);
            for (const hook of instance?.[symbols.initHooks] ?? []) {
              hook();
            }
            return instance?.[symbols.init]?.();
          } else {
            return runtime.callback(this.ctx, this.config);
          }
        },
        collect
      };
      this.dispose = parent.fiber.effect(() => {
        const remove = runtime.fibers.push(this);
        return async () => {
          this.uid = null;
          emitPluginDisposed(this.context, this);
          if (this.ctx.registry.has(runtime.callback)) {
            remove();
            if (!runtime.fibers.length) {
              this.ctx.registry.delete(runtime.callback);
            }
          }
          this._setEpoch(INACTIVE);
          if (!this.inertia) {
            this._updateState(() => {
              this.inertia = this._unload();
              return 5 /* UNLOADING */;
            });
          }
          while (this.inertia) {
            await this.inertia;
          }
        };
      }, "ctx.plugin()");
      try {
        this.context.emit("internal/plugin", this);
      } catch (error) {
        void Promise.resolve(this.dispose()).catch((reason) => this.ctx.logger.error(reason));
        throw error;
      }
      if (this.uid !== null && parent.fiber.state !== 5 /* UNLOADING */) {
        for (const name2 of Object.keys(this.inject)) {
          this._checkImpl(name2);
        }
        this._refresh();
      }
    } else {
      this.uid = 0;
      this.ctx = this.context = parent;
      this.state = 2 /* ACTIVE */;
      this.store = /* @__PURE__ */ Object.create(null);
      this._runner = {
        epoch: "",
        getOuterStack,
        execute: () => {
        },
        collect
      };
      this.dispose = () => this.restart();
    }
  }
  parent;
  inject;
  runtime;
  /** Unique id within the registry; 0 for the root fiber, `null` once disposed. */
  uid;
  /** The context this fiber's plugin runs in (extends the parent context). */
  ctx;
  /** The validated plugin config (updated by `update()`). */
  config;
  /** The raw plugin config, re-resolved before each activation. */
  _config;
  /** Current lifecycle state; transitions emit `internal/status`. */
  state = 0 /* PENDING */;
  /** Dispose this fiber: unload the plugin, then settle once cleanup finished. */
  dispose;
  /** Snapshot of required service implementations while loaded; `undefined` otherwise. */
  store;
  /** The in-flight load/unload transition, if one is currently running. */
  inertia;
  _hooks = /* @__PURE__ */ Object.create(null);
  _disposables = new DisposableList();
  // Same as `this.ctx`, but with a more specific type.
  context;
  _error;
  _runner;
  _store = /* @__PURE__ */ Object.create(null);
  /** The plugin's display name, inherited from the nearest named ancestor, else `'root'`. */
  get name() {
    let fiber = this;
    do {
      if (fiber.runtime?.name) return fiber.runtime.name;
      fiber = fiber.parent.fiber;
    } while (fiber !== fiber.parent.fiber);
    return "root";
  }
  /**
   * Throw if the fiber has already been disposed.
   *
   * @returns nothing when the fiber is still active.
   * @throws {CordisError} `INACTIVE_EFFECT` when the fiber's uid has been cleared.
   */
  assertActive() {
    if (this.uid !== null) return;
    throw new CordisError("INACTIVE_EFFECT");
  }
  _execute(runner) {
    const oldEpoch = runner.epoch;
    return composeError((info) => {
      const safeCollect = (dispose) => {
        if (typeof dispose === "function") {
          runner.collect(dispose);
        } else if (!isNullable(dispose)) {
          throw new TypeError("Invalid effect");
        }
      };
      const effect = runner.execute.call(this);
      if (typeof effect === "function") {
        return runner.collect(effect);
      } else if (isNullable(effect)) {
      } else if (!isObject(effect)) {
        throw new TypeError("Invalid effect");
      } else if ("then" in effect) {
        return effect.then(safeCollect);
      } else if (Symbol.iterator in effect) {
        info.error = new Error();
        const iter = effect[Symbol.iterator]();
        while (true) {
          const result = iter.next();
          safeCollect(result.value);
          if (result.done) return;
        }
      } else if (Symbol.asyncIterator in effect) {
        const iter = effect[Symbol.asyncIterator]();
        return (async () => {
          await Promise.resolve();
          info.error = new Error();
          while (true) {
            if (runner.epoch !== oldEpoch) return;
            const result = await iter.next();
            safeCollect(result.value);
            if (result.done) return;
          }
        })();
      } else {
        throw new TypeError("Invalid effect");
      }
    }, runner.getOuterStack);
  }
  effect(execute, label = "anonymous") {
    this.assertActive();
    if (this.state === 5 /* UNLOADING */) {
      throw new CordisError("INACTIVE_EFFECT");
    }
    const disposables = [];
    let disposing = false;
    let disposalTask;
    const dispose = () => {
      if (disposing) return disposalTask;
      disposing = true;
      let task2;
      for (const disposable of disposables.splice(0).reverse()) {
        if (task2) {
          task2 = task2.then(() => runDisposable(disposable));
        } else {
          const result = runDisposable(disposable);
          if (isObject(result) && "then" in result) {
            task2 = result;
          }
        }
      }
      return disposalTask = task2;
    };
    const meta = { label, children: [] };
    const runner = {
      execute,
      epoch: true,
      collect: (dispose2) => {
        disposables.push(dispose2);
        this._disposables.delete(dispose2);
        if (dispose2[symbols.effect]) {
          meta.children.push(dispose2[symbols.effect]);
        }
      },
      getOuterStack: buildOuterStack()
    };
    let task;
    let executing = true;
    let resolveSetup;
    let rejectSetup;
    let setupBarrier;
    let setupFailed = false;
    let inFlight;
    let removeWrapper = () => false;
    const waitForSetup = () => {
      setupBarrier ??= new Promise((resolve4, reject) => {
        resolveSetup = resolve4;
        rejectSetup = reject;
      });
      return setupBarrier;
    };
    const disposeAfter = (setup) => {
      return Promise.resolve(setup).then(
        () => dispose(),
        async (reason) => {
          await dispose();
          throw reason;
        }
      );
    };
    const finalizeDisposal = (callback) => {
      let result;
      try {
        result = callback();
      } catch (error) {
        removeWrapper();
        throw error;
      }
      if (isObject(result) && "then" in result) {
        const pending = Promise.resolve(result).finally(() => {
          removeWrapper();
          if (inFlight === pending) inFlight = void 0;
        });
        return inFlight = pending;
      }
      removeWrapper();
      return result;
    };
    const wrapper = defineProperty(() => {
      if (!runner.epoch) return setupFailed ? inFlight : void 0;
      runner.epoch = false;
      return finalizeDisposal(() => {
        if (executing) return disposeAfter(waitForSetup());
        return task ? disposeAfter(task) : dispose();
      });
    }, symbols.effect, meta);
    effectInertia.set(wrapper, () => inFlight);
    removeWrapper = this._disposables.push(wrapper);
    try {
      task = this._execute(runner);
    } catch (reason) {
      executing = false;
      setupFailed = true;
      runner.epoch = false;
      let cleanup;
      try {
        cleanup = finalizeDisposal(dispose);
      } finally {
        rejectSetup?.(reason);
      }
      if (isObject(cleanup) && "then" in cleanup) {
        cleanup.catch((error) => this.ctx.logger.error(error));
      }
      throw reason;
    }
    executing = false;
    if (setupBarrier) {
      Promise.resolve(task).then(resolveSetup, rejectSetup);
    }
    task?.catch(() => {
      if (!runner.epoch) return dispose();
      return finalizeDisposal(dispose);
    }).catch((error) => this.ctx.logger.error(error));
    const disposeAsync = () => {
      if (!runner.epoch) return;
      runner.epoch = false;
      return finalizeDisposal(dispose);
    };
    wrapper.then = async (onFulfilled, onRejected) => {
      return Promise.resolve(task).then(() => disposeAsync).then(onFulfilled, onRejected);
    };
    return wrapper;
  }
  /**
   * Return metadata for currently registered effects.
   *
   * @returns one {@link EffectMeta} tree per labeled live effect.
   */
  getEffects() {
    return [...this._disposables].map((dispose) => dispose[symbols.effect]).filter(Boolean);
  }
  _getState() {
    if (this.uid === null) return 4 /* DISPOSED */;
    if (this._error) return 3 /* FAILED */;
    if (this._runner.epoch !== INACTIVE) return 2 /* ACTIVE */;
    return 0 /* PENDING */;
  }
  _updateState(callback) {
    const oldState = this.state;
    this.state = callback() ?? this._getState();
    if (oldState === this.state) return;
    this.context.emit("internal/status", this, oldState);
    if (oldState !== 2 /* ACTIVE */ && this.state !== 2 /* ACTIVE */) return;
    for (const key of Reflect.ownKeys(this.ctx.reflect.store)) {
      const impl = this.ctx.reflect.store[key];
      if (impl.fiber !== this) continue;
      this.ctx.reflect.notify([impl.name]);
    }
  }
  _checkImpl(name2) {
    const impl = this.ctx.reflect._getImpl(name2, true);
    if (!impl) return delete this._store[name2];
    try {
      if (impl.check && !impl.check.call(getTraceable(this.ctx, impl.value))) {
        return delete this._store[name2];
      }
    } catch (error) {
      impl.fiber.ctx.logger.error(error);
      return delete this._store[name2];
    }
    this._store[name2] = impl;
  }
  _refresh() {
    let epoch = false;
    epoch = "";
    for (const name2 of Object.keys(this.inject)) {
      const impl = this._store[name2];
      if (!impl) {
        epoch = INACTIVE;
        break;
      }
      epoch += ":" + impl.fiber.uid;
    }
    this._setEpoch(epoch);
  }
  _setEpoch(epoch) {
    const oldEpoch = this._runner.epoch;
    if (epoch === oldEpoch) return;
    this._runner.epoch = epoch;
    if (this.inertia) return;
    this._updateState(() => {
      if (epoch !== INACTIVE && oldEpoch === INACTIVE) {
        this.inertia = this._reload();
        return 1 /* LOADING */;
      } else {
        this.inertia = this._unload();
        return 5 /* UNLOADING */;
      }
    });
  }
  _resolveConfig(config) {
    config = this.context.waterfall(this, "internal/config", config, () => config);
    return this.runtime ? resolveConfig(this.runtime, config) : config;
  }
  async _reload() {
    this.store = { ...this._store };
    const oldEpoch = this._runner.epoch;
    try {
      await Promise.resolve();
      if (this._runner.epoch === oldEpoch) {
        this.config = this._resolveConfig(this._config);
        await this._execute(this._runner);
        this._error = void 0;
      }
    } catch (reason) {
      this.ctx.logger.error(reason);
      this._error = reason;
      this._runner.epoch = INACTIVE;
    }
    this._updateState(() => {
      if (this._runner.epoch === oldEpoch) {
        this.inertia = void 0;
      } else {
        this.inertia = this._unload();
        return 5 /* UNLOADING */;
      }
    });
  }
  async _unload() {
    await Promise.all(this._disposables.clear().map(async (dispose) => {
      try {
        await composeError(async (info) => {
          await Promise.resolve();
          info.error = new Error();
          await runDisposable(dispose);
        }, this._runner.getOuterStack);
      } catch (reason) {
        this.ctx.logger.error(reason);
      }
    }));
    this.store = void 0;
    this._updateState(() => {
      if (this._runner.epoch === INACTIVE) {
        this.inertia = void 0;
      } else {
        this.inertia = this._reload();
        return 1 /* LOADING */;
      }
    });
  }
  /**
   * Wait for current lifecycle work and rethrow startup errors.
   *
   * @returns this fiber, once it has settled into a stable state.
   * @throws the config-validation or plugin-startup error, if any.
   */
  async await() {
    while (this.inertia) {
      await this.inertia;
    }
    if (this._error) throw this._error;
    return this;
  }
  /**
   * Dispose and immediately reload this plugin with its current config.
   *
   * @returns a promise resolving once the reload settled.
   * @throws {CordisError} `INACTIVE_EFFECT` when the fiber is already disposed.
   */
  async restart() {
    this.assertActive();
    this._setEpoch(INACTIVE);
    this._refresh();
    await this.await();
  }
  /**
   * Validate and apply new config, then restart the plugin.
   *
   * Runs the `internal/update` waterfall first, so update hooks (and HMR)
   * can veto or replace the restart.
   *
   * @param config — the new raw config; validated before anything restarts.
   * @param noSave — hint for persistence hooks not to write the change back.
   * @returns nothing; the restart runs behind the `internal/update` waterfall.
   * @throws {ValidationError} when the new config fails validation.
   */
  update(config, noSave = false) {
    this.assertActive();
    this._config = config;
    if (this.state !== 2 /* ACTIVE */) {
      this._error = void 0;
      this._setEpoch(INACTIVE);
      this._refresh();
      return;
    }
    config = this._resolveConfig(config);
    this.context.waterfall(this, "internal/update", config, noSave, () => {
      this.config = config;
      this._error = void 0;
      return this.restart();
    });
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/reflect.ts
function enhanceError(error) {
  const lines = error.stack.split("\n");
  lines.splice(0, 2, `Error: ${error.message}`);
  error.stack = lines.join("\n");
  return error;
}
var RESERVED_WORDS = ["prototype", "then"];
function isSpecialProperty(prop) {
  return typeof prop === "symbol" || RESERVED_WORDS.includes(prop) || parseInt(prop).toString() === prop || prop.startsWith("_");
}
var ReflectService = class {
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
    this.mixin("reflect", ["get", "set", "provide", "accessor", "mixin"]);
    this.mixin("fiber", ["runtime", "effect"]);
    this.mixin("registry", ["inject", "plugin"]);
    this.mixin("events", ["on", "once", "parallel", "emit", "serial", "bail", "waterfall"]);
  }
  ctx;
  /** Proxy traps implementing service resolution for every context object. */
  static handler = {
    get: (target, prop, ctx) => {
      if (isSpecialProperty(prop)) {
        return Reflect.get(target, prop, ctx);
      }
      if (Reflect.has(target, prop)) {
        return getTraceable(ctx, Reflect.get(target, prop, ctx));
      }
      const error = new Error(`cannot get property "${prop}" without inject`);
      try {
        const def = target.reflect.props[prop];
        if (def?.type === "accessor") {
          return def.get.call(ctx, ctx[symbols.receiver], error);
        }
        if (!ctx.fiber.runtime) return ctx.reflect.get(prop, false);
        return ctx.events.waterfall("internal/get", ctx, prop, error, () => {
          const key = target[symbols.isolate][prop];
          let fiber = (ctx[symbols.shadow] ?? ctx).fiber;
          while (true) {
            const impl = fiber.store?.[prop];
            if (impl) return getTraceable(ctx, impl.value);
            if (prop in fiber.inject) {
              error.message = `cannot get required service "${prop}" in inactive context`;
              throw error;
            }
            if (!fiber.runtime) throw error;
            if (fiber.parent[symbols.isolate][prop] !== key) throw error;
            fiber = fiber.parent.fiber;
          }
        });
      } catch (e) {
        throw e === error ? enhanceError(e) : e;
      }
    },
    set: (target, prop, value, ctx) => {
      if (isSpecialProperty(prop)) {
        return Reflect.set(target, prop, value, ctx);
      }
      const error = new Error(`cannot set property "${prop}" without provide`);
      const def = target.reflect.props[prop];
      if (!def) {
        if (!ctx.fiber.runtime) return Reflect.set(target, prop, value, ctx);
        throw enhanceError(error);
      }
      try {
        if (def.type === "accessor") {
          if (!def.set) return false;
          return def.set.call(ctx, value, ctx[symbols.receiver], error);
        }
        return ctx.events.waterfall("internal/set", ctx, prop, value, error, () => {
          return ctx.reflect.set(prop, value, error);
        });
      } catch (e) {
        throw e === error ? enhanceError(e) : e;
      }
    },
    has: (target, prop) => {
      if (isSpecialProperty(prop)) {
        return Reflect.has(target, prop);
      }
      if (Reflect.has(target, prop)) return true;
      return !!target.reflect.props[prop];
    }
  };
  /** Service implementations, keyed by isolation label. */
  store = /* @__PURE__ */ Object.create(null);
  /** Declared context properties (services and accessors), by name. */
  props = /* @__PURE__ */ Object.create(null);
  /**
   * Read a service from the store without the inject requirement.
   *
   * @param name — the service name.
   * @param strict — when `true`, only return implementations whose providing
   * fiber is currently active.
   * @returns the service value, or `undefined` when not (yet) provided.
   */
  get(name2, strict = true) {
    return getTraceable(this.ctx, this._getImpl(name2, strict)?.value);
  }
  _getImpl(name2, strict = true) {
    const key = this.ctx[symbols.isolate][name2];
    const impl = key && this.store[key];
    if (!impl) return;
    if (strict && impl.fiber.state !== 2 /* ACTIVE */) return;
    return impl;
  }
  /**
   * Overwrite a provided service's value.
   *
   * @param name — the service name.
   * @param value — the new service value.
   * @param error — carrier for the caller stack in diagnostics.
   * @returns `true` on success.
   * @throws when `name` was never provided, or was provided by another fiber.
   */
  set(name2, value, error) {
    const key = this.ctx[symbols.isolate][name2];
    const impl = this.store[key];
    if (!impl) {
      throw new Error(`cannot set property "${name2}" without provide`);
    }
    if (impl.fiber !== this.ctx.fiber) {
      throw new Error(`cannot set property "${name2}" in multiple fibers`);
    }
    impl.value = value;
    return true;
  }
  /**
   * Register a service implementation owned by the current fiber.
   *
   * See the `ctx.provide()` overload above for the full contract.
   *
   * @param name — the service name.
   * @param value — the service value.
   * @param check — optional availability predicate for dependents.
   * @returns a disposer that unregisters the service.
   */
  provide(name2, value, check) {
    return this.ctx.fiber.effect(() => {
      if (!this.props[name2]) {
        this.props[name2] ??= { type: "service" };
      } else if (this.props[name2].type !== "service") {
        throw new Error(`property "${name2}" is already declared as ${this.props[name2].type}`);
      }
      this.props[name2] = { type: "service" };
      this.ctx.root[symbols.isolate][name2] ??= Symbol(name2);
      const key = this.ctx[symbols.isolate][name2];
      const impl = { name: name2, value, fiber: this.ctx.fiber, check };
      if (this.store[key]) {
        throw new Error(`service "${name2}" has been registered at <${this.store[key].fiber.name}>`);
      }
      this.store[key] = impl;
      this.ctx.fiber.store[name2] = impl;
      if (this.ctx.fiber.state === 2 /* ACTIVE */) {
        this.notify([name2]);
      }
      return async () => {
        delete this.store[key];
        const fibers = this.notify([name2]);
        await Promise.allSettled(fibers.map((fiber) => fiber.await()));
        delete this.ctx.fiber.store[name2];
      };
    }, `ctx.provide(${JSON.stringify(name2)})`);
  }
  /**
   * Re-evaluate every fiber that requires one of the given services.
   *
   * @param names — the service names that changed.
   * @param filter — restricts notification to matching isolation scopes.
   * @returns the fibers whose dependency state was refreshed.
   */
  notify(names, filter = (ctx, name2) => ctx[symbols.isolate][name2] === this.ctx[symbols.isolate][name2]) {
    const fibers = [];
    for (const runtime of this.ctx.registry.values()) {
      for (const fiber of runtime.fibers) {
        let hasUpdate = false;
        for (const name2 of names) {
          if (!(name2 in fiber.inject)) continue;
          if (!filter(fiber.ctx, name2)) continue;
          hasUpdate = true;
          fiber._checkImpl(name2);
        }
        if (!hasUpdate) continue;
        fiber._refresh();
        fibers.push(fiber);
      }
    }
    for (const name2 of names) {
      const self = Object.create(this.ctx);
      self[symbols.filter] = (target) => filter(target, name2);
      this.ctx.events.emit(self, "internal/service", name2, this._getImpl(name2, false)?.value);
    }
    return fibers;
  }
  /**
   * Define a computed context property backed by get/set hooks.
   *
   * @param name — the context property name.
   * @param options — the `get` hook and optional `set` hook.
   * @returns a disposer that removes the accessor.
   */
  accessor(name2, options) {
    return this.ctx.fiber.effect(() => {
      if (name2 in this.props) {
        throw new Error(`property "${name2}" is already declared as ${this.props[name2].type}`);
      }
      this.props[name2] = { type: "accessor", ...options };
      return () => delete this.props[name2];
    }, `ctx.accessor(${JSON.stringify(name2)})`);
  }
  /**
   * Expose selected members of a service directly on `ctx`.
   *
   * See the `ctx.mixin()` overload above for the full contract.
   *
   * @param source — a context property name or a source object.
   * @param mixins — keys to forward, or a source-key → ctx-key map.
   * @returns a disposer that removes all created accessors.
   */
  mixin(source, mixins) {
    const self = this;
    return this.ctx.fiber.effect(function* () {
      const entries = Array.isArray(mixins) ? mixins.map((key) => [key, key]) : Object.entries(mixins);
      const getTarget = (ctx, error) => {
        return ctx[source];
      };
      for (const [key, value] of entries) {
        yield self.accessor(value, {
          get(receiver, error) {
            const service = getTarget(this, error);
            if (isNullable(service)) return service;
            const mixin = receiver ? withProps(receiver, service) : service;
            const value2 = Reflect.get(service, key, mixin);
            if (typeof value2 !== "function") return value2;
            return value2.bind(mixin ?? service);
          },
          set(value2, receiver, error) {
            const service = getTarget(this, error);
            const mixin = receiver ? withProps(receiver, service) : service;
            return Reflect.set(service, key, value2, mixin);
          }
        });
      }
    }, `ctx.mixin(${JSON.stringify(source)})`);
  }
  /**
   * Attach this context's tracing wrapper to a value.
   *
   * @param value — the value to wrap.
   * @returns the traceable wrapper (or the value itself when not applicable).
   */
  trace(value) {
    return getTraceable(this.ctx, value);
  }
  /**
   * Wrap a callback so calls trace `this` and arguments to this context.
   *
   * @param callback — the function to wrap.
   * @returns a proxy delegating to `callback` with traced values.
   */
  bind(callback) {
    return new Proxy(callback, {
      apply: (target, thisArg, args) => {
        return Reflect.apply(target, this.trace(thisArg), args.map((arg) => this.trace(arg)));
      },
      construct: (target, args, newTarget) => {
        return Reflect.construct(target, args.map((arg) => this.trace(arg)), newTarget);
      }
    });
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/registry.ts
function isApplicable(object) {
  return object && typeof object === "object" && typeof object.apply === "function";
}
function Inject(name2, config) {
  return function(value, decorator) {
    if (decorator.kind === "class") {
      if (!Object.hasOwn(value, "inject")) {
        defineProperty(value, "inject", Object.create(Object.getPrototypeOf(value).inject ?? null));
        defineProperty(value.inject, symbols.checkProto, true);
      }
      value.inject[name2] = config;
    } else if (decorator.kind === "method") {
      const inject = (value[symbols.metadata] ??= {}).inject ??= /* @__PURE__ */ Object.create(null);
      inject[name2] = config;
      decorator.addInitializer(function() {
        const property3 = this[symbols.tracker]?.property;
        (this[symbols.initHooks] ??= []).push(() => {
          this.ctx.inject(inject, (ctx) => {
            return value.call(property3 ? withProps(this, { [property3]: ctx }) : this);
          });
        });
      });
    } else {
      throw new Error("@Inject() can only be used on class or class methods");
    }
  };
}
((Inject2) => {
  function resolve4(inject, result = /* @__PURE__ */ Object.create(null)) {
    if (!inject) return result;
    if (Array.isArray(inject)) {
      for (const name2 of inject) {
        result[name2] = null;
      }
    } else if (Reflect.has(inject, symbols.checkProto)) {
      Object.assign(result, resolve4(Object.getPrototypeOf(inject)));
      for (const name2 of Object.keys(inject)) {
        result[name2] = inject[name2] ?? null;
      }
    } else {
      for (const name2 of Object.keys(inject)) {
        result[name2] = inject[name2] ?? null;
      }
    }
    return result;
  }
  Inject2.resolve = resolve4;
})(Inject || (Inject = {}));
var RegistryService = class {
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
  }
  ctx;
  _counter = 0;
  _internal = /* @__PURE__ */ new Map();
  /** Allocate the next fiber uid (increments on every read). */
  get counter() {
    return ++this._counter;
  }
  /** Number of registered plugin runtimes. */
  get size() {
    return this._internal.size;
  }
  /**
   * Resolve a supported plugin shape to its executable callback.
   *
   * @param plugin — a function, class, or `{ apply }` object plugin.
   * @returns the callback identifying the plugin, or `undefined` if invalid.
   */
  resolve(plugin) {
    try {
      if (typeof plugin === "function") return plugin;
      if (isApplicable(plugin)) return plugin.apply;
    } catch {
    }
  }
  /**
   * Look up the runtime record for a plugin.
   *
   * @param plugin — any supported plugin shape.
   * @returns the runtime, or `undefined` when the plugin is not registered.
   */
  get(plugin) {
    const key = this.resolve(plugin);
    return key && this._internal.get(key);
  }
  /**
   * Check whether a plugin has a registered runtime.
   *
   * @param plugin — any supported plugin shape.
   * @returns `true` when at least one fiber of the plugin exists.
   */
  has(plugin) {
    const key = this.resolve(plugin);
    return !!key && this._internal.has(key);
  }
  /**
   * Dispose every running fiber for a plugin and remove its runtime record.
   *
   * @param plugin — any supported plugin shape.
   * @returns the removed runtime, or `undefined` when none was registered.
   */
  delete(plugin) {
    const key = this.resolve(plugin);
    const runtime = key && this._internal.get(key);
    if (!runtime) return;
    this._internal.delete(key);
    for (const fiber of runtime.fibers) {
      fiber.dispose();
    }
    return runtime;
  }
  /** Iterate the registered plugin callbacks. */
  keys() {
    return this._internal.keys();
  }
  /** Iterate the registered plugin runtimes. */
  values() {
    return this._internal.values();
  }
  /** Iterate `[callback, runtime]` pairs. */
  entries() {
    return this._internal.entries();
  }
  /**
   * Visit every registered runtime.
   *
   * @param callback — receives each runtime and its identifying callback.
   */
  forEach(callback) {
    return this._internal.forEach(callback);
  }
  /**
   * Start a callback once the requested dependencies are available.
   *
   * @param inject — required services, as an array or a name → config map.
   * @param callback — plugin body called with `(ctx, config)`.
   * @returns the fiber; awaiting it settles once loading finished.
   */
  inject(inject, callback) {
    return this.plugin({ inject, apply: callback, name: callback.name });
  }
  /**
   * Start a plugin in the current context and return its fiber.
   *
   * Creates (or reuses) the plugin's runtime record, then starts a new fiber
   * under the current context. Throws if `plugin` is not a supported shape or
   * if the current fiber is already disposed.
   *
   * @param plugin — a function, class, or `{ apply }` object plugin.
   * @param config — the plugin config, validated against its `Config` schema.
   * @param getOuterStack — captures the caller stack for effect diagnostics.
   * @returns the fiber; awaiting it settles once loading finished.
   */
  plugin(plugin, config, getOuterStack = buildOuterStack()) {
    const callback = this.resolve(plugin);
    if (!callback) throw new Error('invalid plugin, expect function or object with an "apply" method, received ' + typeof plugin);
    this.ctx.fiber.assertActive();
    let runtime = this._internal.get(callback);
    if (!runtime) {
      let name2 = plugin.name;
      if (name2 === "apply") name2 = void 0;
      runtime = { name: name2, callback, fibers: new DisposableList(), Config: plugin.Config };
      this._internal.set(callback, runtime);
    }
    const fiber = new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, getOuterStack);
    const wrapped = Object.create(fiber);
    wrapped.then = (onFulfilled, onRejected) => {
      return fiber.await().then(onFulfilled, onRejected);
    };
    return wrapped;
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/context.ts
var Context = class _Context {
  /** Symbol key under which a disposer exposes its {@link EffectMeta} diagnostics tree. */
  static effect = symbols.effect;
  /** Symbol key for a context's listener filter, consulted on every event dispatch. */
  static filter = symbols.filter;
  /** Symbol key of the isolation map (see the `Context[symbols.isolate]` property). */
  static isolate = symbols.isolate;
  /** Symbol key of the intercept map (see the `Context[symbols.intercept]` property). */
  static intercept = symbols.intercept;
  /**
   * Returns true for Cordis context proxies and context prototypes.
   *
   * Works across realms and across multiple copies of cordis, because the
   * brand is keyed by a global symbol rather than by `instanceof`.
   *
   * @param value — the value to test.
   * @returns `true` if `value` is a Cordis context, narrowing its type.
   */
  static is(value) {
    return !!value?.[_Context.is];
  }
  static {
    _Context.is[Symbol.toPrimitive] = () => /* @__PURE__ */ Symbol.for("cordis.is");
    _Context.prototype[_Context.is] = true;
  }
  /** Create the root context and install the built-in services. */
  constructor() {
    this[symbols.isolate] = /* @__PURE__ */ Object.create(null);
    this[symbols.intercept] = /* @__PURE__ */ Object.create(null);
    const self = new Proxy(this, ReflectService.handler);
    this.root = self;
    this.baseUrl = void 0;
    this.fiber = new Fiber(self, {}, /* @__PURE__ */ Object.create(null), null, () => []);
    this.reflect = new ReflectService(self);
    this.registry = new RegistryService(self);
    this.events = new EventsService(self);
    this.logger = new LoggerService(self);
    this.fiber._disposables.clear();
    return self;
  }
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return `Context <${this.fiber.name}>`;
  }
  /**
   * Create a child context with extra metadata on top of the current scope.
   *
   * The child prototypally inherits every property of this context; own
   * properties of `meta` shadow the inherited ones. The parent is not mutated.
   *
   * @param meta — own properties (including symbol keys) to define on the child.
   * @returns a child context inheriting from this one.
   */
  extend(meta = {}) {
    const shadow = Reflect.getOwnPropertyDescriptor(this, symbols.shadow)?.value;
    const self = Object.create(getTraceable(this, this));
    for (const prop of Reflect.ownKeys(meta)) {
      Object.defineProperty(self, prop, Reflect.getOwnPropertyDescriptor(meta, prop));
    }
    if (!shadow) return self;
    return Object.assign(Object.create(self), { [symbols.shadow]: shadow });
  }
  /**
   * Create a child context with an independent service scope for `name`.
   *
   * Below the returned context, reads and writes of the service `name`
   * resolve against the new label instead of the parent's, so a different
   * implementation can be provided without affecting the parent scope.
   * Passing the same `label` to two `isolate()` calls joins their scopes.
   *
   * @param name — the service name to isolate.
   * @param label — scope label to join; defaults to a fresh unique symbol.
   * @returns a child context whose `name` service resolves in the new scope.
   */
  isolate(name2, label) {
    const shadow = Object.create(this[symbols.isolate]);
    shadow[name2] = label ?? Symbol(name2);
    return this.extend({ [symbols.isolate]: shadow });
  }
  intercept(name2, config) {
    const intercept = Object.create(this[symbols.intercept]);
    intercept[name2] = config;
    return this.extend({ [symbols.intercept]: intercept });
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/vendor/cordis/src/service.ts
var Service = class _Service {
  /**
   * Register this instance as `name` in the current context.
   *
   * Calls `ctx.reflect.provide(name, this, this[Service.check])`, so the
   * service is unregistered automatically when the owning fiber unloads.
   * Services with a `[Service.invoke]` body return a callable instance.
   *
   * @param ctx — the context to register in (stored as `this.ctx`).
   * @param name — the service name; defaults to the static `provide` field.
   */
  constructor(ctx, name2) {
    this.ctx = ctx;
    name2 ??= this.constructor["provide"];
    let self = this;
    const tracker = {
      associate: name2,
      property: "ctx"
    };
    if (self[symbols.invoke]) {
      self = createCallable(name2, joinPrototype(Object.getPrototypeOf(this), Function.prototype), tracker);
    }
    self.ctx = ctx;
    self.name = name2;
    defineProperty(self, symbols.tracker, tracker);
    self.ctx.reflect.provide(name2, self, this[symbols.check]);
    return self;
  }
  ctx;
  /** Symbol key of an instance method run after construction (class plugins). */
  static init = symbols.init;
  /** Symbol key of the availability predicate passed to `ctx.provide()`. */
  static check = symbols.check;
  /** Symbol key of the phantom intercept-config type parameter. */
  static config = symbols.config;
  /** Symbol key of the call body making a service callable (e.g. `ctx.logger()`). */
  static invoke = symbols.invoke;
  /** Symbol key of the helper deriving an extended service instance. */
  static extend = symbols.extend;
  /** Symbol key of the tracker metadata used for context tracing. */
  static tracker = symbols.tracker;
  /** Symbol key of the intercept-config resolution helper below. */
  static resolveConfig = symbols.resolveConfig;
  /** The service name this instance is registered under. */
  name;
  [symbols.filter](ctx) {
    return ctx[symbols.isolate][this.name] === this.ctx[symbols.isolate][this.name];
  }
  [symbols.extend](props) {
    let self;
    if (this[_Service.invoke]) {
      self = createCallable(this.name, this, this[symbols.tracker]);
    } else {
      self = Object.create(this);
    }
    return Object.assign(self, props);
  }
  /**
   * Merge intercept config from ancestors with optional base and head values.
   *
   * Entries added closer to the root apply first; `base` is prepended and
   * `head` appended. Uses `Config.merge` when the service declares one,
   * otherwise a shallow `Object.assign`.
   *
   * @param base — lowest-precedence config merged before all intercepts.
   * @param head — highest-precedence config merged after all intercepts.
   * @returns the merged config.
   */
  [symbols.resolveConfig](base, head) {
    let intercept = this.ctx[Context.intercept];
    const configs = [];
    while (this.name in intercept) {
      if (Object.hasOwn(intercept, this.name)) {
        configs.unshift(intercept[this.name]);
      }
      intercept = Object.getPrototypeOf(intercept);
    }
    if (base) configs.unshift(base);
    if (head) configs.push(head);
    if (this["Config"]?.merge) {
      return this["Config"].merge(...configs);
    } else {
      return Object.assign({}, ...configs);
    }
  }
  static [Symbol.hasInstance](instance) {
    if (!instance) return false;
    let constructor = instance.constructor;
    while (constructor) {
      constructor = constructor.prototype?.constructor;
      if (constructor === this) return true;
      constructor &&= Object.getPrototypeOf(constructor);
    }
    return false;
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/vendor/schemastery/src/index.ts
var kSchema2 = /* @__PURE__ */ Symbol.for("schemastery");
var kValidationError3 = /* @__PURE__ */ Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError3 = class extends TypeError {
  constructor(message, options) {
    let prefix = "$";
    for (const segment of options.path || []) {
      if (typeof segment === "string") {
        prefix += "." + segment;
      } else if (typeof segment === "number") {
        prefix += "[" + segment + "]";
      } else if (typeof segment === "symbol") {
        prefix += `[Symbol(${segment.toString()})]`;
      }
    }
    if (prefix.startsWith(".")) prefix = prefix.slice(1);
    super((prefix === "$" ? "" : `${prefix} `) + message);
    this.options = options;
  }
  options;
  name = "ValidationError";
  static is(error) {
    return !!error?.[kValidationError3];
  }
};
Object.defineProperty(ValidationError3.prototype, kValidationError3, {
  value: true
});
var Schema2 = function(options) {
  const schema = function(data, options2 = {}) {
    return Schema2.resolve(data, schema, options2)[0];
  };
  if (options.refs) {
    const refs = mapValues(options.refs, (options2) => new Schema2(options2));
    const getRef = (uid) => refs[uid];
    for (const key in refs) {
      const options2 = refs[key];
      options2.sKey = getRef(options2.sKey);
      options2.inner = getRef(options2.inner);
      options2.list = options2.list && options2.list.map(getRef);
      options2.dict = options2.dict && mapValues(options2.dict, getRef);
    }
    return refs[options.uid];
  }
  Object.assign(schema, options);
  if (typeof schema.callback === "string") {
    try {
      schema.callback = new Function("return " + schema.callback)();
    } catch {
    }
  }
  Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
  Object.setPrototypeOf(schema, Schema2.prototype);
  schema.meta ||= {};
  schema.toString = schema.toString.bind(schema);
  return schema;
};
Schema2.prototype = Object.create(Function.prototype);
Schema2.prototype[kSchema2] = true;
Object.defineProperty(Schema2.prototype, "~standard", {
  get() {
    return {
      version: 1,
      vendor: "schemastery",
      validate: (value) => {
        try {
          return { value: Schema2.resolve(value, this, {})[0] };
        } catch (error) {
          if (ValidationError3.is(error)) {
            return { issues: [{ message: error.message, path: error.options.path }] };
          }
          throw error;
        }
      }
    };
  }
});
Schema2.ValidationError = ValidationError3;
Schema2.prototype.toJSON = function toJSON2() {
  if (globalThis.__schemastery_refs__) {
    globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
    return this.uid;
  }
  globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
  globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
  const result = { uid: this.uid, refs: globalThis.__schemastery_refs__ };
  globalThis.__schemastery_refs__ = void 0;
  return result;
};
Schema2.prototype.set = function set2(key, value) {
  this.dict[key] = value;
  return this;
};
Schema2.prototype.push = function push2(value) {
  this.list.push(value);
  return this;
};
function mergeDesc2(original, messages) {
  const result = typeof original === "string" ? { "": original } : { ...original };
  for (const locale in messages) {
    const value = messages[locale];
    if (value?.$description || value?.$desc) {
      result[locale] = value.$description || value.$desc;
    } else if (typeof value === "string") {
      result[locale] = value;
    }
  }
  return result;
}
function getInner2(value) {
  return value?.$value ?? value?.$inner;
}
function extractKeys2(data) {
  return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema2.prototype.i18n = function i18n2(messages) {
  const schema = Schema2(this);
  const desc = mergeDesc2(schema.meta.description, messages);
  if (Object.keys(desc).length) schema.meta.description = desc;
  if (schema.dict) {
    schema.dict = mapValues(schema.dict, (inner, key) => {
      return inner.i18n(mapValues(messages, (data) => getInner2(data)?.[key] ?? data?.[key]));
    });
  }
  if (schema.list) {
    schema.list = schema.list.map((inner, index) => {
      return inner.i18n(mapValues(messages, (data = {}) => {
        if (Array.isArray(getInner2(data))) return getInner2(data)[index];
        if (Array.isArray(data)) return data[index];
        return extractKeys2(data);
      }));
    });
  }
  if (schema.inner) {
    schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
      if (getInner2(data)) return getInner2(data);
      return extractKeys2(data);
    }));
  }
  if (schema.sKey) {
    schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
  }
  return schema;
};
Schema2.prototype.extra = function extra2(key, value) {
  const schema = Schema2(this);
  schema.meta = { ...schema.meta, [key]: value };
  return schema;
};
for (const key of ["required", "disabled", "collapse", "hidden", "loose"]) {
  Object.assign(Schema2.prototype, {
    [key](value = true) {
      const schema = Schema2(this);
      schema.meta = { ...schema.meta, [key]: value };
      return schema;
    }
  });
}
Schema2.prototype.deprecated = function deprecated2() {
  const schema = Schema2(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({ text: "deprecated", type: "danger" });
  return schema;
};
Schema2.prototype.experimental = function experimental2() {
  const schema = Schema2(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({ text: "experimental", type: "warning" });
  return schema;
};
Schema2.prototype.pattern = function pattern2(regexp) {
  const schema = Schema2(this);
  const pattern3 = pick(regexp, ["source", "flags"]);
  schema.meta = { ...schema.meta, pattern: pattern3 };
  return schema;
};
Schema2.prototype.simplify = function simplify2(value) {
  if (isVolatile(value)) value = value.get();
  if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
  if (isNullable(value)) return value;
  if (this.type === "object" || this.type === "dict") {
    const result = {};
    for (const key in value) {
      const schema = this.type === "object" ? this.dict[key] : this.inner;
      const item = schema?.simplify(value[key]);
      if (this.type === "dict" || !isNullable(item)) result[key] = item;
    }
    if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
    return result;
  } else if (this.type === "array" || this.type === "tuple") {
    const result = [];
    value.forEach((value2, index) => {
      const schema = this.type === "array" ? this.inner : this.list[index];
      const item = schema ? schema.simplify(value2) : value2;
      result.push(item);
    });
    return result;
  } else if (this.type === "intersect") {
    const result = {};
    for (const item of this.list) {
      Object.assign(result, item.simplify(value));
    }
    return result;
  } else if (this.type === "union") {
    for (const schema of this.list) {
      try {
        Schema2.resolve(value, schema, {});
        return schema.simplify(value);
      } catch {
      }
    }
  }
  return value;
};
Schema2.prototype.toString = function toString2(inline) {
  return formatters2[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema2.prototype.role = function role2(role2, extra3) {
  const schema = Schema2(this);
  schema.meta = { ...schema.meta, role: role2, extra: extra3 };
  return schema;
};
for (const key of ["default", "link", "comment", "description", "max", "min", "step"]) {
  Object.assign(Schema2.prototype, {
    [key](value) {
      const schema = Schema2(this);
      schema.meta = { ...schema.meta, [key]: value };
      return schema;
    }
  });
}
Schema2.prototype.volatile = function volatile2() {
  if (this.meta.volatile) throw new TypeError("volatile schema is already wrapped");
  return this.extra("volatile", true);
};
var resolvers2 = {};
var checkedVolatile2 = /* @__PURE__ */ Symbol("checked-volatile-schema");
function validateVolatileSchema2(schema, path = [], blocked = false, seen = /* @__PURE__ */ new Map()) {
  const states = seen.get(schema) ?? /* @__PURE__ */ new Set();
  if (states.has(blocked)) return;
  states.add(blocked);
  seen.set(schema, states);
  if (schema.meta?.volatile && blocked) {
    throw new ValidationError3("volatile fields require a fixed object path without an enclosing volatile field", { path });
  }
  const nested = blocked || !!schema.meta?.volatile;
  if (schema.dict) {
    for (const [key, child] of Object.entries(schema.dict)) validateVolatileSchema2(child, [...path, key], nested, seen);
  }
  if (schema.sKey) validateVolatileSchema2(schema.sKey, [...path, "<key>"], true, seen);
  if (schema.inner && (schema.type !== "lazy" || schema.inner[kSchema2])) {
    validateVolatileSchema2(schema.inner, [...path, "*"], true, seen);
  }
  if (schema.list) {
    for (let index = 0; index < schema.list.length; index++) {
      validateVolatileSchema2(schema.list[index], [...path, String(index)], true, seen);
    }
  }
}
Schema2.extend = function extend2(type, resolve4) {
  resolvers2[type] = resolve4;
};
Schema2.resolve = function resolve3(data, schema, options = {}, strict = false) {
  if (!schema) return [data];
  if (!options[checkedVolatile2]) {
    validateVolatileSchema2(schema, options.path);
    options = { ...options, [checkedVolatile2]: true };
  }
  if (schema.meta?.volatile) {
    const inner = Schema2(schema);
    inner.meta = { ...schema.meta, volatile: false };
    const [value, adapted] = Schema2.resolve(data, inner, options, strict);
    try {
      return [createVolatile(value), adapted];
    } catch (error) {
      throw new ValidationError3(error instanceof Error ? error.message : String(error), options);
    }
  }
  if (options.ignore?.(data, schema)) return [data];
  if (isNullable(data) && schema.type !== "lazy") {
    if (schema.meta.required) throw new ValidationError3(`missing required value`, options);
    let current = schema;
    let fallback = schema.meta.default;
    while (current?.type === "intersect" && isNullable(fallback)) {
      current = current.list[0];
      fallback = current?.meta.default;
    }
    if (isNullable(fallback)) return [data];
    data = clone(fallback);
  }
  const callback = resolvers2[schema.type];
  if (!callback) throw new ValidationError3(`unsupported type "${schema.type}"`, options);
  try {
    return callback(data, schema, options, strict);
  } catch (error) {
    if (!schema.meta.loose) throw error;
    return [schema.meta.default];
  }
};
Schema2.from = function from2(source) {
  if (isNullable(source)) {
    return Schema2.any();
  } else if (["string", "number", "boolean"].includes(typeof source)) {
    return Schema2.const(source).required();
  } else if (source[kSchema2]) {
    return source;
  } else if (typeof source === "function") {
    switch (source) {
      case String:
        return Schema2.string().required();
      case Number:
        return Schema2.number().required();
      case Boolean:
        return Schema2.boolean().required();
      case Function:
        return Schema2.function().required();
      default:
        return Schema2.is(source).required();
    }
  } else {
    throw new TypeError(`cannot infer schema from ${source}`);
  }
};
Schema2.lazy = function lazy2(builder) {
  const toJSON3 = () => {
    if (!schema.inner[kSchema2]) {
      schema.inner = schema.builder();
      schema.inner.meta = { ...schema.meta, ...schema.inner.meta };
    }
    return schema.inner.toJSON();
  };
  const schema = new Schema2({ type: "lazy", builder, inner: { toJSON: toJSON3 } });
  return schema;
};
Schema2.natural = function natural2() {
  return Schema2.number().step(1).min(0);
};
Schema2.percent = function percent2() {
  return Schema2.number().step(0.01).min(0).max(1).role("slider");
};
Schema2.date = function date2() {
  return Schema2.union([
    Schema2.is(Date),
    Schema2.transform(Schema2.string().role("datetime"), (value, options) => {
      const date3 = new Date(value);
      if (isNaN(+date3)) throw new ValidationError3(`invalid date "${value}"`, options);
      return date3;
    }, true)
  ]);
};
Schema2.regExp = function regExp2(flag = "") {
  return Schema2.union([
    Schema2.is(RegExp),
    Schema2.transform(Schema2.string().role("regexp", { flag }), (value, options) => {
      try {
        return new RegExp(value, flag);
      } catch (e) {
        throw new ValidationError3(e.message, options);
      }
    }, true)
  ]);
};
Schema2.arrayBuffer = function arrayBuffer2(encoding) {
  return Schema2.union([
    Schema2.is(ArrayBuffer),
    Schema2.is(SharedArrayBuffer),
    Schema2.transform(Schema2.any(), (value, options) => {
      if (Binary.isSource(value)) return Binary.fromSource(value);
      throw new ValidationError3(`expected ArrayBufferSource but got ${value}`, options);
    }, true),
    ...encoding ? [Schema2.transform(Schema2.string(), (value, options) => {
      try {
        return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
      } catch (e) {
        throw new ValidationError3(e.message, options);
      }
    }, true)] : []
  ]);
};
Schema2.extend("lazy", (data, schema, options, strict) => {
  if (!schema.inner[kSchema2]) {
    schema.inner = schema.builder();
    schema.inner.meta = { ...schema.meta, ...schema.inner.meta };
    validateVolatileSchema2(schema.inner, options.path, true);
  }
  return Schema2.resolve(data, schema.inner, options, strict);
});
Schema2.extend("any", (data) => {
  return [data];
});
Schema2.extend("never", (data, _, options) => {
  throw new ValidationError3(`expected nullable but got ${data}`, options);
});
Schema2.extend("const", (data, { value }, options) => {
  if (deepEqual(data, value)) return [value];
  throw new ValidationError3(`expected ${value} but got ${data}`, options);
});
function checkWithinRange2(data, meta, description, options, skipMin = false) {
  const { max = Infinity, min = -Infinity } = meta;
  if (data > max) throw new ValidationError3(`expected ${description} <= ${max} but got ${data}`, options);
  if (data < min && !skipMin) throw new ValidationError3(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema2.extend("string", (data, { meta }, options) => {
  if (typeof data !== "string") throw new ValidationError3(`expected string but got ${data}`, options);
  if (meta.pattern) {
    const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
    if (!regexp.test(data)) throw new ValidationError3(`expect string to match regexp ${regexp}`, options);
  }
  checkWithinRange2(data.length, meta, "string length", options);
  return [data];
});
function decimalShift2(data, digits) {
  const str = data.toString();
  if (str.includes("e")) return data * Math.pow(10, digits);
  const index = str.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str.slice(index + 1);
  const integer = str.slice(0, index);
  if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
  return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf2(data, min, step) {
  step = Math.abs(step);
  if (!/^\d+\.\d+$/.test(step.toString())) {
    return (data - min) % step === 0;
  }
  const index = step.toString().indexOf(".");
  const digits = step.toString().slice(index + 1).length;
  return Math.abs(decimalShift2(data, digits) - decimalShift2(min, digits)) % decimalShift2(step, digits) === 0;
}
Schema2.extend("number", (data, { meta }, options) => {
  if (typeof data !== "number") throw new ValidationError3(`expected number but got ${data}`, options);
  checkWithinRange2(data, meta, "number", options);
  const { step } = meta;
  if (step && !isMultipleOf2(data, meta.min ?? 0, step)) {
    throw new ValidationError3(`expected number multiple of ${step} but got ${data}`, options);
  }
  return [data];
});
Schema2.extend("boolean", (data, _, options) => {
  if (typeof data === "boolean") return [data];
  throw new ValidationError3(`expected boolean but got ${data}`, options);
});
Schema2.extend("bitset", (data, { bits, meta }, options) => {
  let value = 0, keys = [];
  if (typeof data === "number") {
    value = data;
    for (const key in bits) {
      if (data & bits[key]) {
        keys.push(key);
      }
    }
  } else if (Array.isArray(data)) {
    keys = data;
    for (const key of keys) {
      if (typeof key !== "string") throw new ValidationError3(`expected string but got ${key}`, options);
      if (key in bits) value |= bits[key];
    }
  } else {
    throw new ValidationError3(`expected number or array but got ${data}`, options);
  }
  if (value === meta.default) return [value];
  return [value, keys];
});
Schema2.extend("function", (data, _, options) => {
  if (typeof data === "function") return [data];
  throw new ValidationError3(`expected function but got ${data}`, options);
});
Schema2.extend("is", (data, { constructor }, options) => {
  if (typeof constructor === "function") {
    if (data instanceof constructor) return [data];
    throw new ValidationError3(`expected ${constructor.name} but got ${data}`, options);
  } else {
    if (isNullable(data)) {
      throw new ValidationError3(`expected ${constructor} but got ${data}`, options);
    }
    let prototype = Object.getPrototypeOf(data);
    while (prototype) {
      if (prototype.constructor?.name === constructor) return [data];
      prototype = Object.getPrototypeOf(prototype);
    }
    throw new ValidationError3(`expected ${constructor} but got ${data}`, options);
  }
});
function property2(data, key, schema, options) {
  try {
    const [value, adapted] = Schema2.resolve(data[key], schema, {
      ...options,
      path: [...options.path || [], key]
    });
    if (adapted !== void 0) data[key] = adapted;
    return value;
  } catch (e) {
    if (!options?.autofix) throw e;
    delete data[key];
    return schema.meta.volatile ? createVolatile(schema.meta.default) : schema.meta.default;
  }
}
Schema2.extend("array", (data, { inner, meta }, options) => {
  if (!Array.isArray(data)) throw new ValidationError3(`expected array but got ${data}`, options);
  checkWithinRange2(data.length, meta, "array length", options, !isNullable(inner.meta.default));
  return [data.map((_, index) => property2(data, index, inner, options))];
});
Schema2.extend("dict", (data, { inner, sKey }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError3(`expected object but got ${data}`, options);
  const result = {};
  for (const key in data) {
    let rKey;
    try {
      rKey = Schema2.resolve(key, sKey, options)[0];
    } catch (error) {
      if (strict) continue;
      throw error;
    }
    result[rKey] = property2(data, key, inner, options);
    data[rKey] = data[key];
    if (key !== rKey) delete data[key];
  }
  return [result];
});
Schema2.extend("tuple", (data, { list }, options, strict) => {
  if (!Array.isArray(data)) throw new ValidationError3(`expected array but got ${data}`, options);
  const result = list.map((inner, index) => property2(data, index, inner, options));
  if (strict) return [result];
  result.push(...data.slice(list.length));
  return [result];
});
function merge2(result, data) {
  for (const key in data) {
    if (key in result) continue;
    result[key] = data[key];
  }
}
Schema2.extend("object", (data, { dict }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError3(`expected object but got ${data}`, options);
  const result = {};
  for (const key in dict) {
    const value = property2(data, key, dict[key], options);
    if (!isNullable(value) || key in data) {
      result[key] = value;
    }
  }
  if (!strict) merge2(result, data);
  return [result];
});
Schema2.extend("union", (data, { list, toString: toString3 }, options, strict) => {
  const messages = [];
  for (const inner of list) {
    try {
      return Schema2.resolve(data, inner, options, strict);
    } catch (error) {
      messages.push(error);
    }
  }
  throw new ValidationError3(`expected ${toString3()} but got ${JSON.stringify(data)}`, options);
});
Schema2.extend("intersect", (data, { list, toString: toString3 }, options, strict) => {
  if (!list.length) return [data];
  let result;
  for (const inner of list) {
    const value = Schema2.resolve(data, inner, options, true)[0];
    if (isNullable(value)) continue;
    if (isNullable(result)) {
      result = value;
    } else if (typeof result !== typeof value) {
      throw new ValidationError3(`expected ${toString3()} but got ${JSON.stringify(data)}`, options);
    } else if (typeof value === "object") {
      merge2(result ??= {}, value);
    } else if (result !== value) {
      throw new ValidationError3(`expected ${toString3()} but got ${JSON.stringify(data)}`, options);
    }
  }
  if (!strict && isPlainObject(data)) merge2(result, data);
  return [result];
});
Schema2.extend("transform", (data, { inner, callback, preserve }, options) => {
  const [result, adapted = data] = Schema2.resolve(data, inner, options, true);
  if (preserve) {
    return [callback(result)];
  } else {
    return [callback(result), callback(adapted)];
  }
});
var formatters2 = {};
function defineMethod2(name2, keys, format) {
  formatters2[name2] = format;
  Object.assign(Schema2, {
    [name2](...args) {
      const schema = new Schema2({ type: name2 });
      keys.forEach((key, index) => {
        switch (key) {
          case "sKey":
            schema.sKey = args[index] ?? Schema2.string();
            break;
          case "inner":
            schema.inner = Schema2.from(args[index]);
            break;
          case "list":
            schema.list = args[index].map(Schema2.from);
            break;
          case "dict":
            schema.dict = mapValues(args[index], Schema2.from);
            break;
          case "bits": {
            schema.bits = {};
            for (const key2 in args[index]) {
              if (typeof args[index][key2] !== "number") continue;
              schema.bits[key2] = args[index][key2];
            }
            break;
          }
          case "callback": {
            const callback = schema.callback = args[index];
            callback["toJSON"] ||= () => callback.toString();
            break;
          }
          case "constructor": {
            const constructor = schema.constructor = args[index];
            if (typeof constructor === "function") {
              ;
              constructor["toJSON"] ||= () => constructor["name"];
            }
            break;
          }
          default:
            schema[key] = args[index];
        }
      });
      if (name2 === "object" || name2 === "dict") {
        schema.meta.default = {};
      } else if (name2 === "array" || name2 === "tuple") {
        schema.meta.default = [];
      } else if (name2 === "bitset") {
        schema.meta.default = 0;
      }
      return schema;
    }
  });
}
defineMethod2("is", ["constructor"], ({ constructor }) => {
  if (typeof constructor === "function") {
    return constructor.name;
  } else {
    return constructor;
  }
});
defineMethod2("any", [], () => "any");
defineMethod2("never", [], () => "never");
defineMethod2("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod2("string", [], () => "string");
defineMethod2("number", [], () => "number");
defineMethod2("boolean", [], () => "boolean");
defineMethod2("bitset", ["bits"], () => "bitset");
defineMethod2("function", [], () => "function");
defineMethod2("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod2("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod2("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod2("object", ["dict"], ({ dict }) => {
  if (Object.keys(dict).length === 0) return "{}";
  return `{ ${Object.entries(dict).map(([key, inner]) => {
    return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
  }).join(", ")} }`;
});
defineMethod2("union", ["list"], ({ list }, inline) => {
  const result = list.map(({ toString: format }) => format()).join(" | ");
  return inline ? `(${result})` : result;
});
defineMethod2("intersect", ["list"], ({ list }) => {
  return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod2("transform", ["inner", "callback", "preserve"], ({ inner }, isInner) => inner.toString(isInner));
var src_default = Schema2;

// ../../../deepseek-harness-dev/deepseek-harness/packages/core/scope/src/store.ts
var NamedEntries = class {
  constructor(duplicateError) {
    this.duplicateError = duplicateError;
  }
  duplicateError;
  data = /* @__PURE__ */ new Map();
  /**
   * Insert one unique name.
   * @param name - name unique within this table.
   * @param value - borrowed value to retain.
   * @returns an idempotent undo that removes only this insertion.
   */
  insert(name2, value) {
    const data = this.data;
    if (data.has(name2)) throw this.duplicateError(name2);
    data.set(name2, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(name2);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
   * Read one named value.
   * @param name - name to resolve.
   * @returns the retained value, or `undefined` when absent.
   */
  get(name2) {
    return this.data.get(name2);
  }
  /**
   * Test one name for membership.
   * @param name - name to test.
   * @returns whether the table contains that name.
   */
  has(name2) {
    return this.data.has(name2);
  }
  /**
   * Iterate live names in insertion order.
   * @returns the native live key iterator.
   */
  keys() {
    return this.data.keys();
  }
  /**
   * Iterate live entries in insertion order.
   * @returns the native live entry iterator.
   */
  entries() {
    return this.data.entries();
  }
  /**
   * Iterate live values in insertion order.
   * @returns the native live value iterator.
   */
  values() {
    return this.data.values();
  }
  /**
   * Test whether this table has no entries.
   * @returns whether the table is empty.
   */
  isEmpty() {
    return this.data.size === 0;
  }
};
var AnonymousEntries = class {
  data = /* @__PURE__ */ new Map();
  /**
   * Append one independently owned value.
   * @param value - borrowed value to retain.
   * @returns an idempotent undo for this exact append.
   */
  append(value) {
    const data = this.data;
    const key = /* @__PURE__ */ Symbol();
    data.set(key, value);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      data.delete(key);
      if (data.size === 0 && this.data === data) this.data = /* @__PURE__ */ new Map();
    };
  }
  /**
   * Iterate live values in insertion order.
   * @returns the native live value iterator.
   */
  values() {
    return this.data.values();
  }
  /**
   * Test whether this table has no entries.
   * @returns whether the table is empty.
   */
  isEmpty() {
    return this.data.size === 0;
  }
};
var ScopedLayers = class {
  constructor(createLayer, onChange) {
    this.createLayer = createLayer;
    this.onChange = onChange;
    this.global = createLayer(void 0);
  }
  createLayer;
  onChange;
  /** The eagerly constructed context-global layer. */
  global;
  scoped = /* @__PURE__ */ new Map();
  /**
   * Read an existing exact-scope overlay. Deliberately chain-blind: callers
   * addressing one scope's OWN contributions (its restrictions, its guards)
   * must not silently pick up an ancestor's — use {@link chainLayers} where
   * inheritance is the point.
   * @param scope - exact scope key; `undefined` denotes no overlay.
   * @returns the existing scoped layer, or `undefined` without creating one.
   */
  peek(scope) {
    if (scope === void 0) return void 0;
    return this.scoped.get(scope);
  }
  /**
   * Existing overlays along the scope's parent chain ({@link scopeChainOf}),
   * farthest ancestor first and the exact scope last, so a caller layering
   * them in order gives the nearest scope the final word.
   * @param scope - viewing scope, or `undefined` for no overlays.
   * @returns the existing layers, nearest last; absent overlays are skipped.
   */
  chainLayers(scope) {
    const layers = [];
    for (const key of scopeChainOf(scope).reverse()) {
      const layer = this.scoped.get(key);
      if (layer !== void 0) layers.push(layer);
    }
    return layers;
  }
  /**
   * Materialize global named entries followed by scope-chain shadows,
   * farthest ancestor first, so the nearest scope's entry wins a name.
   * @param scope - viewing scope, or `undefined` for the global view.
   * @param pick - select the named table from a layer.
   * @returns an insertion-ordered effective map.
   */
  merge(scope, pick3) {
    const merged = new Map(pick3(this.global).entries());
    for (const layer of this.chainLayers(scope)) {
      for (const [name2, value] of pick3(layer).entries()) merged.set(name2, value);
    }
    return merged;
  }
  /**
   * Attach one synchronous layer mutation to its registration context.
   * @param ctx - context that determines both scope visibility and effect ownership.
   * @param action - atomic mutation returning its synchronous undo.
   * @param options - Cordis effect label and optional change notification.
   * @returns the exact disposer returned by `ctx.effect()`.
   */
  effect(ctx, action, options) {
    const scope = scopeOf(ctx);
    const notify = options.notify ?? true;
    const dispose = ctx.effect(function* () {
      let layer;
      let created = false;
      if (scope === void 0) {
        layer = this.global;
      } else {
        const existing = this.scoped.get(scope);
        if (existing === void 0) {
          layer = this.createLayer(scope);
          this.scoped.set(scope, layer);
          created = true;
        } else {
          layer = existing;
        }
      }
      let undo;
      try {
        undo = action(layer);
      } catch (error) {
        if (scope !== void 0 && created && layer.isEmpty()) this.scoped.delete(scope);
        throw error;
      }
      yield () => {
        undo();
        if (scope !== void 0 && layer.isEmpty()) this.scoped.delete(scope);
        if (notify) this.onChange();
      };
      if (notify) this.onChange();
    }.bind(this), options.label);
    return dispose;
  }
};

// ../../../deepseek-harness-dev/deepseek-harness/packages/core/scope/src/index.ts
var kScope = /* @__PURE__ */ Symbol("dsh.scope");
var carrierKeys = /* @__PURE__ */ new WeakMap();
var scopeParents = /* @__PURE__ */ new WeakMap();
function scopeChainOf(key) {
  const chain = [];
  for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) chain.push(cursor);
  return chain;
}
function scopeOf(ctx) {
  return ctx[kScope];
}
function scopeTarget(base, key) {
  const baseFilter = base[Context.filter];
  const carrier = {
    [Context.filter](ctx) {
      if (baseFilter !== void 0 && !baseFilter.call(base, ctx)) return false;
      const tag = scopeOf(ctx);
      if (tag === void 0) return true;
      for (let cursor = key; cursor !== void 0; cursor = scopeParents.get(cursor)) {
        if (cursor === tag) return true;
      }
      return false;
    }
  };
  carrierKeys.set(carrier, key);
  return carrier;
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/typert/protocol/src/remote-error.ts
var RemoteError = class extends Error {
  /**
   * @param code - stable failure code declared in {@link RemoteErrorDetailsMap}.
   * @param message - human diagnostic carried across the wire.
   * @param details - structured payload typed by the code.
   * @param options - standard Error options (`cause` survives in-process only).
   */
  constructor(code, message, details, options) {
    super(message, options);
    this.code = code;
    this.details = details;
    this.name = "RemoteError";
  }
  code;
  details;
  /** Structural marker: cross-realm/bundle identification never uses instanceof. */
  isDSHRemoteError = true;
};

// ../../../deepseek-harness-dev/deepseek-harness/packages/typert/protocol/src/index.ts
var TYPERT_REMOTE_SEGMENT_PATTERN = /^[A-Za-z0-9_$.-]+$/;
function isTypertRemoteSegment(value) {
  return value !== "." && value !== ".." && TYPERT_REMOTE_SEGMENT_PATTERN.test(value);
}
var REMOTE_METHOD_DESCRIPTOR = "@deepseek-ai/dsh-typert-protocol/remote-methods";
function bindTypertRemote(service, serviceKey, options = {}) {
  validateName("service key", serviceKey);
  const namespace = options.namespace ?? serviceKey;
  validateName("namespace", namespace);
  const ctx = Reflect.get(service, "ctx");
  if (ctx instanceof Context) provideInvocationAccessor(ctx);
  return Object.freeze({ service, serviceKey, namespace });
}
var TypertRemoteService = class extends Service {
  /** Visible binding consumed by the Gateway's source-mode discovery. */
  typertRemote;
  /**
   * Register the Service and bind the same key to Typert Gateway.
   * @param ctx - owning Cordis Context.
   * @param serviceKey - exact Cordis service key and default wire namespace.
   * @param options - optional distinct wire namespace.
   */
  constructor(ctx, serviceKey, options = {}) {
    super(ctx, serviceKey);
    this.typertRemote = bindTypertRemote(this, this.name, options);
  }
};
function provideInvocationAccessor(ctx) {
  if (Object.hasOwn(ctx.root.reflect.props, "invocation")) return;
  ctx.root.accessor("invocation", { get: () => void 0 });
}
function Remote(methodExportOrOptions, context) {
  if (typeof methodExportOrOptions === "string") {
    validateName("Remote export name", methodExportOrOptions);
    return remoteDecorator({ kind: "direct" }, void 0, methodExportOrOptions);
  }
  if (typeof methodExportOrOptions === "object") {
    if (remoteOptionMode(methodExportOrOptions) !== "stream" || Reflect.ownKeys(methodExportOrOptions).length !== 1) {
      throw new TypeError('typert-protocol: Remote options must contain exactly mode: "stream"');
    }
    return remoteDecorator({ kind: "direct" }, "stream");
  }
  if (context === void 0) throw new TypeError("typert-protocol: Remote decorator context is missing");
  addMarkerInitializer(context, { kind: "direct" });
}
function remoteOptionMode(options) {
  return Reflect.get(options, "mode");
}
function remoteDecorator(invocation, mode2, exportName) {
  return function(_method, context) {
    addMarkerInitializer(context, invocation, mode2, exportName);
  };
}
function readRemoteMethodDescriptor(prototype) {
  const property3 = Object.getOwnPropertyDescriptor(prototype, REMOTE_METHOD_DESCRIPTOR);
  if (property3 === void 0) return void 0;
  const descriptor = property3.value;
  if (descriptor === null || typeof descriptor !== "object") {
    throw new TypeError("typert-protocol: Remote method descriptor must be an object");
  }
  const version2 = Reflect.get(descriptor, "version");
  if (version2 !== 1) {
    throw new TypeError(`typert-protocol: unsupported Remote method descriptor version ${String(version2)}`);
  }
  const methods = Reflect.get(descriptor, "methods");
  if (!Array.isArray(methods)) {
    throw new TypeError("typert-protocol: Remote method descriptor methods must be an array");
  }
  return descriptor;
}
function addMarkerInitializer(context, invocation, mode2, exportName) {
  if (context.private || context.static || typeof context.name !== "string") {
    throw new TypeError("typert-protocol: Remote decorators require a public instance method with a string name");
  }
  const method = context.name;
  context.addInitializer(function() {
    const prototype = Object.getPrototypeOf(this);
    if (prototype === null) {
      throw new TypeError(`typert-protocol: cannot mark Remote method "${method}" on an object without a prototype`);
    }
    mark(prototype, method, invocation, mode2, exportName);
  });
}
function mark(prototype, method, invocation, mode2, exportName) {
  const descriptor = readRemoteMethodDescriptor(prototype);
  const marker = Object.freeze({
    method,
    ...exportName === void 0 || exportName === method ? {} : { exportName },
    ...mode2 === void 0 ? {} : { mode: mode2 },
    invocation: Object.freeze(invocation)
  });
  const current = descriptor?.methods.find((candidate) => candidate.method === method);
  if (current !== void 0) {
    if (current.exportName === marker.exportName && current.mode === marker.mode && sameInvocation(current.invocation, invocation)) return;
    throw new Error(`typert-protocol: Remote method "${method}" has conflicting invocation markers`);
  }
  Object.defineProperty(prototype, REMOTE_METHOD_DESCRIPTOR, {
    configurable: true,
    value: Object.freeze({
      version: 1,
      methods: Object.freeze([...descriptor?.methods ?? [], marker])
    })
  });
}
function sameInvocation(left, right) {
  if (left.kind === "direct") return right.kind === "direct";
  if (right.kind === "direct") return false;
  return left.context === right.context;
}
function validateName(subject, value) {
  if (!isTypertRemoteSegment(value)) {
    throw new TypeError(`typert-protocol: ${subject} must contain only RPC endpoint segment characters`);
  }
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/util/values/src/index.ts
function assertNever(value, context) {
  const rendered = JSON.stringify(value) ?? String(value);
  throw new Error(`unreachable variant${context ? ` in ${context}` : ""}: ${rendered}`);
}
function hasIntrinsicConstructor(prototype, name2) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "constructor");
  const constructor = descriptor?.value;
  if (typeof constructor !== "function") return false;
  try {
    return constructor.name === name2 && constructor.prototype === prototype && Function.prototype.toString.call(constructor) === Function.prototype.toString.call(name2 === "Array" ? Array : Object);
  } catch {
    return false;
  }
}
function isIntrinsicObjectPrototype(value) {
  return Object.getPrototypeOf(value) === null && hasIntrinsicConstructor(value, "Object");
}
function hasPlainArrayPrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(prototype) || !hasIntrinsicConstructor(prototype, "Array")) return false;
  const objectPrototype = Object.getPrototypeOf(prototype);
  return typeof objectPrototype === "object" && objectPrototype !== null && isIntrinsicObjectPrototype(objectPrototype);
}
function hasPlainObjectPrototype(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || typeof prototype === "object" && isIntrinsicObjectPrototype(prototype);
}
function enumerableStringKeys(value) {
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string" || !Object.prototype.propertyIsEnumerable.call(value, key))) return void 0;
  return keys;
}
function walkJsonValue(value, detach) {
  const ancestors = /* @__PURE__ */ new Set();
  let root;
  const assign = (destination, item) => {
    if (destination === void 0) return;
    if (destination.kind === "root") {
      root = item;
    } else if (destination.kind === "array") {
      destination.target[destination.index] = item;
    } else {
      Object.defineProperty(destination.target, destination.key, {
        value: item,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
  };
  const tasks = [{
    kind: "visit",
    value,
    ...detach ? { destination: { kind: "root" } } : {}
  }];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      ancestors.delete(task.source);
      continue;
    }
    if (task.kind === "array-item") {
      if (!Object.prototype.hasOwnProperty.call(task.source, task.index)) return void 0;
      tasks.push({
        kind: "visit",
        value: task.source[task.index],
        ...task.target === void 0 ? {} : { destination: { kind: "array", target: task.target, index: task.index } }
      });
      continue;
    }
    if (task.kind === "object-property") {
      tasks.push({
        kind: "visit",
        value: task.source[task.key],
        ...task.target === void 0 ? {} : { destination: { kind: "object", target: task.target, key: task.key } }
      });
      continue;
    }
    const current = task.value;
    if (current === null) {
      assign(task.destination, null);
      continue;
    }
    if (typeof current === "boolean" || typeof current === "string") {
      assign(task.destination, current);
      continue;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current) || Object.is(current, -0)) return void 0;
      assign(task.destination, current);
      continue;
    }
    if (typeof current !== "object") return void 0;
    if (ancestors.has(current)) return void 0;
    if (Array.isArray(current)) {
      if (!hasPlainArrayPrototype(current)) return void 0;
      const length = current.length;
      if (Reflect.ownKeys(current).length !== length + 1) return void 0;
      const target2 = detach ? [] : void 0;
      if (target2 !== void 0) assign(task.destination, target2);
      ancestors.add(current);
      tasks.push({ kind: "leave", source: current });
      for (let index = length - 1; index >= 0; index--) {
        tasks.push({ kind: "array-item", source: current, index, ...target2 === void 0 ? {} : { target: target2 } });
      }
      continue;
    }
    if (!hasPlainObjectPrototype(current)) return void 0;
    const keys = enumerableStringKeys(current);
    if (keys === void 0) return void 0;
    const target = detach ? {} : void 0;
    if (target !== void 0) assign(task.destination, target);
    ancestors.add(current);
    tasks.push({ kind: "leave", source: current });
    for (let index = keys.length - 1; index >= 0; index--) {
      const key = keys[index];
      if (key === void 0) return void 0;
      tasks.push({ kind: "object-property", source: current, key, ...target === void 0 ? {} : { target } });
    }
  }
  return detach ? root : true;
}
function snapshotJsonValue(value) {
  return walkJsonValue(value, true);
}
function isJsonValue(value) {
  return walkJsonValue(value, false) === true;
}
function deepFreeze(value) {
  const seen = /* @__PURE__ */ new WeakSet();
  const pending = [{ kind: "visit", node: value }];
  while (pending.length > 0) {
    const task = pending.pop();
    if (task === void 0) continue;
    if (task.kind === "property") {
      pending.push({ kind: "visit", node: task.source[task.key] });
      continue;
    }
    const node = task.node;
    if (node === null || typeof node !== "object") continue;
    if (node instanceof AbortSignal) continue;
    if (seen.has(node)) continue;
    seen.add(node);
    Object.freeze(node);
    const keys = Object.keys(node);
    for (let index = keys.length - 1; index >= 0; index--) {
      const key = keys[index];
      if (key === void 0) continue;
      pending.push({ kind: "property", source: node, key });
    }
  }
  return value;
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/util/crypto/src/index.ts
function randomUUID() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (byte, index) => {
    const pinned = index === 6 ? byte & 15 | 64 : index === 8 ? byte & 63 | 128 : byte;
    return pinned.toString(16).padStart(2, "0");
  }).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/util/brand/src/index.ts
function brandString(value) {
  return value;
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/message.ts
function freezeMessage(message) {
  return deepFreeze(structuredClone(message));
}
function createMessage(input) {
  return deepFreeze(structuredClone({
    ...input,
    id: brandString(randomUUID())
  }));
}
function createUserMessage(input) {
  return createMessage({
    ...input,
    role: "user"
  });
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/util/timeout/src/index.ts
var MAX_TIMER_DELAY_MS = 2147483647;

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/error.ts
var HarnessError = class extends Error {
  /** Stable machine-routable failure class (e.g. `RATE_LIMIT`); route on this, never by parsing `message`. */
  code;
  constructor(message, code, options) {
    super(message, options);
    this.code = code;
    this.name = new.target.name;
  }
};
var EMPTY_RESPONSE_CODE = "EMPTY_RESPONSE";
var STRUCTURED_CONTEXT_OVERFLOW = new RegExp(
  String.raw`(?:^|[^a-z0-9])context[\s_-](?:length|window)[\s_-]` + String.raw`(?:exceed(?:ed|s)?|overflow(?:ed)?|limit[\s_-]exceeded)(?:$|[^a-z0-9])`,
  "i"
);
var TOO_LARGE_FOR_CONTEXT = new RegExp(
  String.raw`\b(?:request|prompt|input|messages?)\s+(?:is\s+|are\s+)?` + String.raw`too\s+(?:large|long)\s+for\s+(?:(?:this|the)\s+)?` + String.raw`(?:model(?:'s)?\s+)?context(?:\s+window)?\b`,
  "i"
);
var EXCEEDS_MODEL_CONTEXT = new RegExp(
  String.raw`\b(?:input|prompt|request|messages?)\b.{0,40}` + String.raw`\b(?:exceed(?:s|ed)?|overflows?|is\s+larger\s+than)\b.{0,40}` + String.raw`\b(?:the\s+)?(?:model(?:'s)?\s+)?context(?:\s+(?:length|window))?\b`,
  "i"
);

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/retry-policy.ts
var DEFAULT_MAX_RETRIES = 5;
var DEFAULT_INITIAL_DELAY_MS = 500;
var DEFAULT_MAX_DELAY_MS = 1e4;
var DEFAULT_JITTER_RATIO = 0.1;
var DEFAULT_RETRYABLE_CODES = Object.freeze([
  EMPTY_RESPONSE_CODE,
  "RATE_LIMIT",
  "SERVER",
  "TIMEOUT",
  "TRANSPORT"
]);
var backoffSchema = src_default.object({
  initialDelayMs: src_default.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_INITIAL_DELAY_MS),
  maxDelayMs: src_default.number().max(MAX_TIMER_DELAY_MS).default(DEFAULT_MAX_DELAY_MS),
  jitterRatio: src_default.number().min(0).max(1).default(DEFAULT_JITTER_RATIO)
});
var normalPolicySchema = src_default.object({
  mode: src_default.const("normal").required(),
  maxRetries: src_default.number().step(1).min(0).max(Number.MAX_SAFE_INTEGER).default(DEFAULT_MAX_RETRIES),
  retryableCodes: src_default.array(src_default.string()).default([...DEFAULT_RETRYABLE_CODES]),
  backoff: backoffSchema
});
var alwaysPolicySchema = src_default.object({
  mode: src_default.const("always").required(),
  backoff: backoffSchema
});
var RetryPolicySchema = src_default.union([
  normalPolicySchema,
  alwaysPolicySchema
]);
var NORMAL_POLICY_KEYS = /* @__PURE__ */ new Set([
  "mode",
  "maxRetries",
  "retryableCodes",
  "backoff"
]);
var ALWAYS_POLICY_KEYS = /* @__PURE__ */ new Set([
  "mode",
  "maxRetries",
  "retryableCodes",
  "backoff"
]);
var BACKOFF_KEYS = /* @__PURE__ */ new Set(["initialDelayMs", "maxDelayMs", "jitterRatio"]);
function validateKeys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${path}: unknown key "${key}"`);
  }
}
function resolveBackoff(config, path) {
  if (config !== void 0) validateKeys(config, BACKOFF_KEYS, path);
  const initialDelayMs = config?.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelayMs = config?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const jitterRatio = config?.jitterRatio ?? DEFAULT_JITTER_RATIO;
  if (!Number.isFinite(initialDelayMs) || initialDelayMs <= 0 || initialDelayMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`${path}.initialDelayMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  }
  if (!Number.isFinite(maxDelayMs) || maxDelayMs <= 0 || maxDelayMs > MAX_TIMER_DELAY_MS) {
    throw new Error(`${path}.maxDelayMs must be a positive finite number no greater than ${MAX_TIMER_DELAY_MS}`);
  }
  if (initialDelayMs > maxDelayMs) {
    throw new Error(`${path}.initialDelayMs must be less than or equal to maxDelayMs`);
  }
  if (!Number.isFinite(jitterRatio) || jitterRatio < 0 || jitterRatio > 1) {
    throw new Error(`${path}.jitterRatio must be between 0 and 1`);
  }
  return Object.freeze({ initialDelayMs, maxDelayMs, jitterRatio });
}
function resolveRetryPolicy(config, path) {
  if (config === void 0) {
    return Object.freeze({
      mode: "normal",
      maxRetries: DEFAULT_MAX_RETRIES,
      retryableCodes: DEFAULT_RETRYABLE_CODES,
      ...resolveBackoff(void 0, `${path}.backoff`)
    });
  }
  switch (config.mode) {
    case "normal": {
      validateKeys(config, NORMAL_POLICY_KEYS, path);
      const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
      const retryableCodes = config.retryableCodes ?? [...DEFAULT_RETRYABLE_CODES];
      if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) {
        throw new Error(`${path}.maxRetries must be a non-negative safe integer`);
      }
      if (retryableCodes.length === 0) {
        throw new Error(`${path}.retryableCodes must not be empty`);
      }
      if (retryableCodes.some((code) => typeof code !== "string" || code.length === 0)) {
        throw new Error(`${path}.retryableCodes must contain only non-empty strings`);
      }
      if (new Set(retryableCodes).size !== retryableCodes.length) {
        throw new Error(`${path}.retryableCodes must not contain duplicates`);
      }
      return Object.freeze({
        mode: "normal",
        maxRetries,
        retryableCodes: Object.freeze([...retryableCodes]),
        ...resolveBackoff(config.backoff, `${path}.backoff`)
      });
    }
    case "always":
      validateKeys(config, ALWAYS_POLICY_KEYS, path);
      return Object.freeze({
        mode: "always",
        ...resolveBackoff(config.backoff, `${path}.backoff`)
      });
    default:
      throw new Error(`${path}.mode must be "normal" or "always"`);
  }
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/call-config.ts
function callConfigEquals(a, b) {
  if (a.provider !== b.provider || a.model !== b.model || a.reasoningEffort !== b.reasoningEffort || a.temperature !== b.temperature || a.maxTokens !== b.maxTokens) return false;
  if (a.stop === void 0 || b.stop === void 0) return a.stop === b.stop;
  return a.stop.length === b.stop.length && a.stop.every((s, i) => s === b.stop?.[i]);
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/adapter-failure.ts
function normalizeLlmFailure(value) {
  const error = value instanceof Error ? value : new HarnessError(thrownMessage(value), "UNKNOWN", { cause: value });
  const carried = ownFailureSnapshot(error);
  if (carried !== void 0 && carried.code === ownErrorCode(error)) return carried;
  return Object.freeze({
    message: errorMessage(error),
    code: harnessErrorCode(error)
  });
}
function thrownMessage(value) {
  try {
    const message = String(value);
    return message.length > 0 ? message : "LLM adapter failed";
  } catch (_hostileThrownValue) {
    return "LLM adapter failed";
  }
}
function ownErrorCode(error) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "code");
    return descriptor !== void 0 && "value" in descriptor ? descriptor.value : void 0;
  } catch (_sdkPropertyTrap) {
    return void 0;
  }
}
function ownFailureSnapshot(error) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(error, "failure");
    return descriptor !== void 0 && "value" in descriptor ? failureSnapshot(descriptor.value) : void 0;
  } catch (_sdkPropertyTrap) {
    return void 0;
  }
}
function failureSnapshot(value) {
  if (typeof value !== "object" || value === null) return void 0;
  try {
    const candidate = value;
    const message = candidate.message;
    const code = candidate.code;
    const status = candidate.status;
    const providerRetryAfterMs = candidate.providerRetryAfterMs;
    const requestId = candidate.requestId;
    const offloadImages = candidate.offloadImages;
    if (typeof message !== "string" || message.length === 0 || typeof code !== "string" || code.length === 0 || status !== void 0 && (!Number.isInteger(status) || status < 100 || status > 599) || providerRetryAfterMs !== void 0 && (!Number.isFinite(providerRetryAfterMs) || providerRetryAfterMs <= 0) || requestId !== void 0 && (typeof requestId !== "string" || requestId.length === 0) || offloadImages !== void 0 && (!Number.isSafeInteger(offloadImages) || offloadImages <= 0)) return void 0;
    return Object.freeze({
      message,
      code,
      ...status === void 0 ? {} : { status },
      ...providerRetryAfterMs === void 0 ? {} : { providerRetryAfterMs },
      ...requestId === void 0 ? {} : { requestId },
      ...offloadImages === void 0 ? {} : { offloadImages }
    });
  } catch (_sdkFailureGetter) {
    return void 0;
  }
}
function errorMessage(error) {
  try {
    const message = error.message;
    if (typeof message === "string" && message.length > 0) return message;
  } catch (_sdkMessageGetter) {
  }
  return "LLM adapter failed";
}
function harnessErrorCode(error) {
  return error instanceof HarnessError ? error.code : "UNKNOWN";
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/content.ts
function quoted(value) {
  return JSON.stringify(value);
}
function textOnlyImageText(ref) {
  const digest = String(ref.attachmentId).slice("sha256:".length, "sha256:".length + 8);
  return `[image omitted because this model accepts text only; attachment sha256:${digest}]`;
}
function contentHasImage(content) {
  return content.some((block) => block.type === "image");
}
function contentHasFile(content) {
  for (const block of content) {
    if (block.type === "file") return true;
  }
  return false;
}
function fileHandleText(ref, readonlyPath) {
  const digest = String(ref.attachmentId).slice("sha256:".length, "sha256:".length + 8);
  const identity = `File ${quoted(ref.name)} (${ref.bytes} bytes, sha256:${digest})`;
  if (readonlyPath === void 0) {
    return `[${identity} was uploaded, but the current execution environment cannot access a readable path. Report that limitation if its contents are needed; do not claim to have read it.]`;
  }
  return `[${identity}: verbatim read-only copy saved at ${quoted(readonlyPath)}. Read that path with your file tools when its contents are needed; copy it to a writable location before modifying it. When delegating file work, include this saved path in the delegation prompt; only subagents sharing this execution environment can read it.]`;
}
function replaceFilesWithHandles(blocks, resolvePath) {
  let next;
  for (const [index, block] of blocks.entries()) {
    if (block.type === "file") {
      next ??= blocks.slice(0, index);
      next.push({ type: "text", text: fileHandleText(block.attachment, resolvePath(block.attachment)) });
      continue;
    }
    next?.push(block);
  }
  return next ?? blocks;
}
function projectFilesToText(messages, resolvePath) {
  if (!messages.some((message) => contentHasFile(message.content))) return messages;
  return messages.map((message) => {
    const content = replaceFilesWithHandles(message.content, resolvePath);
    return content === message.content ? message : { ...message, content };
  });
}
function replaceImagesForTextModel(blocks) {
  let next;
  for (const [index, block] of blocks.entries()) {
    if (block.type === "image") {
      next ??= blocks.slice(0, index);
      next.push({ type: "text", text: textOnlyImageText(block.attachment) });
      continue;
    }
    next?.push(block);
  }
  return next ?? blocks;
}
function projectImagesForTextModel(messages) {
  if (!messages.some((message) => contentHasImage(message.content))) return messages;
  return messages.map((message) => {
    const content = replaceImagesForTextModel(message.content);
    return content === message.content ? message : { ...message, content };
  });
}
function withoutDeveloperMessages(messages) {
  const retained = messages.filter((message) => message.role !== "developer");
  return retained.length === messages.length ? messages : retained;
}
function toolDeclarations(tools, mode2, history) {
  const declarations = new Map(history.tools.map((tool) => [tool.name, tool]));
  for (const update of history.updates) {
    for (const tool of update.additions) {
      if (!declarations.has(tool.name)) {
        declarations.set(tool.name, { ...tool, deferLoading: true });
      }
    }
  }
  switch (mode2) {
    case "in-history":
      return declarations;
    case "addition-only": {
      const activeNames = new Set(tools?.map((tool) => tool.name));
      for (const name2 of declarations.keys()) {
        if (!activeNames.has(name2)) declarations.delete(name2);
      }
      return declarations;
    }
    /* v8 ignore next 2 -- closed-union exhaustiveness guard */
    default:
      return assertNever(mode2);
  }
}
function projectToolUpdates(messages, tools, toolUpdate, history) {
  if (toolUpdate === void 0) {
    let immediateTools = tools;
    if (tools?.some((tool) => tool.deferLoading === true)) {
      immediateTools = tools.map(({ deferLoading: _loading, ...tool }) => tool);
    }
    return { messages: withoutDeveloperMessages(messages), tools: immediateTools };
  }
  if (history === void 0) {
    return { messages: withoutDeveloperMessages(messages), tools };
  }
  const messageIds = new Set(messages.flatMap((message) => message.role === "developer" ? [message.id] : []));
  if (history.updates.some((update) => !messageIds.has(update.messageId))) {
    return { messages: withoutDeveloperMessages(messages), tools };
  }
  const declarations = toolDeclarations(tools, toolUpdate, history);
  const updateIds = new Set(history.updates.map((update) => update.messageId));
  const offered = new Set(history.tools.filter((tool) => !tool.deferLoading).map((tool) => tool.name));
  const projectedMessages = [];
  for (const message of messages) {
    if (message.role !== "developer") {
      projectedMessages.push(message);
      continue;
    }
    if (!updateIds.has(message.id)) continue;
    const content = message.content.filter((block) => {
      switch (block.type) {
        case "tool-addition":
          if (!declarations.has(block.toolName) || offered.has(block.toolName)) return false;
          offered.add(block.toolName);
          return true;
        case "tool-removal":
          if (toolUpdate !== "in-history") return false;
          return offered.delete(block.toolName);
        default:
          return true;
      }
    });
    if (content.length === 0) continue;
    if (content.length === message.content.length) {
      projectedMessages.push(message);
    } else {
      projectedMessages.push({ ...message, content });
    }
  }
  const unchanged = projectedMessages.length === messages.length && projectedMessages.every((message, index) => message === messages[index]);
  return {
    messages: unchanged ? messages : projectedMessages,
    tools: [...declarations.values()]
  };
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/attribution.ts
import { createRequire } from "node:module";
var { version } = ({ version: "0.0.0" });

// ../../../deepseek-harness-dev/deepseek-harness/packages/llm/llm/src/index.ts
var LlmError = class extends HarnessError {
  /** Serializable facts retained beside this live Error. */
  failure;
  /**
   * @param message - non-empty human-readable failure summary.
   * @param code - non-empty stable provider-neutral machine code.
   * @param options - optional cause and validated serializable provider facts.
   */
  constructor(message, code, options) {
    if (typeof message !== "string" || message.length === 0) throw new Error("LlmError message must be a non-empty string");
    if (typeof code !== "string" || code.length === 0) throw new Error("LlmError code must be a non-empty string");
    if (options?.status !== void 0 && (!Number.isInteger(options.status) || options.status < 100 || options.status > 599)) {
      throw new Error("LlmError status must be an integer from 100 through 599");
    }
    if (options?.providerRetryAfterMs !== void 0 && (!Number.isFinite(options.providerRetryAfterMs) || options.providerRetryAfterMs <= 0)) {
      throw new Error("LlmError providerRetryAfterMs must be a positive finite number");
    }
    if (options?.requestId !== void 0 && (typeof options.requestId !== "string" || options.requestId.length === 0)) {
      throw new Error("LlmError requestId must be a non-empty string");
    }
    super(message, code, options);
    this.name = "LlmError";
    this.failure = Object.freeze({
      message,
      code,
      ...options?.status === void 0 ? {} : { status: options.status },
      ...options?.providerRetryAfterMs === void 0 ? {} : { providerRetryAfterMs: options.providerRetryAfterMs },
      ...options?.requestId === void 0 ? {} : { requestId: options.requestId },
      ...options?.offloadImages === void 0 ? {} : { offloadImages: options.offloadImages }
    });
  }
};
var _remoteDiscoverModels_dec, _listConfigurableProviders_dec, _listProviders_dec, _a, _init;
var LlmRuntime = class extends (_a = TypertRemoteService, _listProviders_dec = [Remote], _listConfigurableProviders_dec = [Remote], _remoteDiscoverModels_dec = [Remote("discoverModels")], _a) {
  constructor(ctx) {
    super(ctx, "llm");
    __runInitializers(_init, 5, this);
    __publicField(this, "adapters", /* @__PURE__ */ new Map());
    __publicField(this, "directory", /* @__PURE__ */ new Map());
    __publicField(this, "discoveries", /* @__PURE__ */ new Map());
  }
  /** Notify topology observers without letting one broken listener veto the commit. */
  emitAdaptersUpdated() {
    let invariantFailure;
    for (const listener of this.ctx.events.dispatch("emit", ["llm/adapters-updated"])) {
      try {
        const returned = listener();
        if (returned != null && typeof returned.then === "function") {
          void Promise.resolve(returned).then(void 0, (error) => {
            this.warnAdaptersListenerFailure(error);
          });
        }
      } catch (error) {
        if (error?.code === "INVARIANT") {
          invariantFailure ??= error;
          continue;
        }
        this.warnAdaptersListenerFailure(error);
      }
    }
    if (invariantFailure !== void 0) throw invariantFailure;
  }
  /** Contained-listener diagnostic shared by the sync and async failure paths. */
  warnAdaptersListenerFailure(error) {
    this.ctx.logger.warn("llm: an llm/adapters-updated listener failed");
    this.ctx.logger.warn(error);
  }
  /**
   * Register an adapter for the given provider routes. Throws `LlmError` with code
   * `DUPLICATE_ADAPTER` if any provider already has an adapter (all-or-nothing).
   * Disposed with the fiber.
   * @param providers - every provider route this adapter should serve.
   * @param adapter - the adapter that streams calls for those providers.
   * @returns the disposer, carrying {@link AdapterRegistrationHandle.replace}.
   */
  registerAdapter(providers, adapter) {
    const owned = /* @__PURE__ */ new Set();
    let released = false;
    const dispose = this.ctx.effect(function* () {
      if (providers.length === 0) throw new LlmError("an adapter must register at least one provider", "INVALID_ADAPTER");
      this.commitRoutes(owned, this.prepareRoutes(providers, adapter, owned));
      yield () => {
        released = true;
        for (const provider of owned) this.adapters.delete(provider);
        owned.clear();
        this.emitAdaptersUpdated();
      };
    }.bind(this), "llm.registerAdapter()");
    const handle = (() => void dispose());
    handle.replace = (next) => {
      if (released) {
        throw new LlmError("a disposed adapter registration cannot replace its routes", "REGISTRATION_DISPOSED");
      }
      this.commitRoutes(owned, this.prepareRoutes(next, adapter, owned));
    };
    return handle;
  }
  /**
   * Validate one candidate route set for `adapter`, treating routes this
   * registration already holds as available. Nothing is mutated: a rejected
   * candidate leaves the registry exactly as it was.
   */
  prepareRoutes(providers, adapter, owned) {
    const unique = /* @__PURE__ */ new Set();
    const registrations = [];
    for (const provider of providers) {
      if (provider.length === 0) throw new LlmError("adapter provider names must be non-empty", "INVALID_ADAPTER");
      if (unique.has(provider) || this.adapters.has(provider) && !owned.has(provider)) {
        throw new LlmError(`an adapter for provider "${provider}" is already registered`, "DUPLICATE_ADAPTER");
      }
      const info = adapter.providerInfo(provider);
      if (typeof info.id !== "string" || info.id !== provider || typeof info.name !== "string" || info.name.length === 0) {
        throw new LlmError(`adapter metadata for provider "${provider}" must preserve its id and have a non-empty name`, "INVALID_ADAPTER");
      }
      unique.add(provider);
      const retryPolicy = adapter.providerRetryPolicy(provider) ?? resolveRetryPolicy(void 0, `llm: provider "${provider}" retryPolicy`);
      registrations.push({
        adapter,
        provider: { id: info.id, name: info.name },
        retryPolicy
      });
    }
    return registrations;
  }
  /**
   * Swap this registration's routes for the prepared ones in one synchronous
   * section, so no observer can see the registry between the release and the
   * re-registration. The route set's one mutation point is also where
   * `llm/adapters-updated` is published, so a `replace` announces itself
   * exactly like a first registration.
   */
  commitRoutes(owned, registrations) {
    for (const provider of owned) this.adapters.delete(provider);
    owned.clear();
    for (const registration of registrations) {
      this.adapters.set(registration.provider.id, registration);
      owned.add(registration.provider.id);
    }
    this.emitAdaptersUpdated();
  }
  listProviders() {
    return [...this.adapters.values()].map(({ provider }) => ({ ...provider }));
  }
  /**
   * Declare provider routes an adapter plugin can activate through
   * configuration. Registration is all-or-nothing: an empty list, invalid
   * entry, or a provider already declared by any registration throws
   * `LlmError` without registering the rest. Disposed with the fiber.
   * @param entries - every configurable provider this plugin owns.
   * @returns a handle that withdraws all of them, and can atomically replace them.
   */
  registerConfigurableProviders(entries) {
    let held = [];
    let disposed = false;
    const commit = (candidates) => {
      const detached = [];
      const own = new Set(held.map((entry) => entry.provider));
      for (const entry of candidates) {
        if (entry.provider.length === 0 || entry.displayName.length === 0 || entry.settingsNs.length === 0) {
          throw new LlmError("configurable providers need a non-empty provider, displayName, and settingsNs", "INVALID_DIRECTORY");
        }
        if (entry.settingsPath.some((segment) => segment.length === 0)) {
          throw new LlmError(`configurable provider "${entry.provider}" has an empty settingsPath segment`, "INVALID_DIRECTORY");
        }
        if (this.directory.has(entry.provider) && !own.has(entry.provider) || detached.some((seen) => seen.provider === entry.provider)) {
          throw new LlmError(`configurable provider "${entry.provider}" is already declared`, "DUPLICATE_DIRECTORY");
        }
        detached.push({ ...entry, settingsPath: [...entry.settingsPath] });
      }
      for (const entry of held) this.directory.delete(entry.provider);
      for (const entry of detached) this.directory.set(entry.provider, entry);
      held = detached;
      this.emitAdaptersUpdated();
    };
    const dispose = this.ctx.effect(function* () {
      if (entries.length === 0) {
        throw new LlmError("a configurable-provider registration must declare at least one provider", "INVALID_DIRECTORY");
      }
      commit(entries);
      yield () => {
        disposed = true;
        for (const entry of held) this.directory.delete(entry.provider);
        held = [];
        this.emitAdaptersUpdated();
      };
    }.bind(this), "llm.registerConfigurableProviders()");
    const handle = (() => void dispose());
    handle.replace = (next) => {
      if (disposed) {
        throw new LlmError("this configurable-provider registration was disposed", "REGISTRATION_DISPOSED");
      }
      commit(next);
    };
    return handle;
  }
  listConfigurableProviders() {
    return [...this.directory.values()].map((entry) => ({ ...entry, settingsPath: [...entry.settingsPath] }));
  }
  /**
   * Offer to interrogate provider endpoints on behalf of the settings
   * namespace this plugin owns. The namespace is the key because that is what
   * a configuration surface already holds from the configurable-provider
   * directory, and because a provider being *added* has no route to name yet.
   * Disposed with the fiber.
   * @param settingsNs - the namespace whose profiles this discovery serves.
   * @param discover - interrogates one endpoint and must honor the supplied signal.
   * @returns the disposer that withdraws the offer.
   */
  registerModelDiscovery(settingsNs, discover) {
    const dispose = this.ctx.effect(function* () {
      if (settingsNs.length === 0) {
        throw new LlmError("model discovery needs a non-empty settings namespace", "INVALID_DISCOVERY");
      }
      if (this.discoveries.has(settingsNs)) {
        throw new LlmError(`model discovery for "${settingsNs}" is already registered`, "DUPLICATE_DISCOVERY");
      }
      this.discoveries.set(settingsNs, discover);
      yield () => {
        this.discoveries.delete(settingsNs);
      };
    }.bind(this), "llm.registerModelDiscovery()");
    return () => void dispose();
  }
  /**
   * Interrogate one provider endpoint for the models it advertises. The
   * request describes a draft, not a stored route, so nothing here reads or
   * writes settings or credentials — the caller owns both, and the reply is
   * candidate metadata a surface may offer for adoption.
   * @param settingsNs - namespace whose registered discovery serves this draft.
   * @param request - the endpoint, protocol, and one-shot credential to use.
   * @param signal - caller cancellation.
   * @returns the advertised models, deduplicated in endpoint order.
   */
  async discoverModels(settingsNs, request, signal) {
    const discover = this.discoveries.get(settingsNs);
    if (discover === void 0) {
      throw new LlmError(`no model discovery is registered for "${settingsNs}"`, "NO_DISCOVERY");
    }
    if ((request.provider ?? "").length === 0 && (request.baseURL ?? "").length === 0) {
      throw new LlmError("model discovery needs a provider route or a baseURL", "INVALID_DISCOVERY");
    }
    const discovered = signal === void 0 ? await discover(request) : await discover(request, signal);
    const seen = /* @__PURE__ */ new Set();
    const models = [];
    for (const model of discovered) {
      if (typeof model.id !== "string" || model.id.length === 0 || seen.has(model.id)) continue;
      seen.add(model.id);
      models.push({
        id: model.id,
        ...model.name === void 0 ? {} : { name: model.name },
        ...model.contextWindow === void 0 ? {} : { contextWindow: model.contextWindow },
        ...model.maxTokens === void 0 ? {} : { maxTokens: model.maxTokens },
        ...model.inputModalities === void 0 ? {} : { inputModalities: [...model.inputModalities] }
      });
    }
    return models;
  }
  async remoteDiscoverModels(settingsNs, request, signal) {
    try {
      return await this.discoverModels(settingsNs, request, signal);
    } catch (error) {
      throw new RemoteError(
        "llm/model-discovery-rejected",
        error instanceof Error ? error.message : String(error),
        {
          settingsNs,
          ...request.baseURL === void 0 ? {} : { baseURL: request.baseURL }
        },
        { cause: error }
      );
    }
  }
  /**
   * Resolve the retry policy captured when one provider route was registered.
   * @param provider - registered provider route to inspect.
   * @returns the provider-owned policy, with normal defaults already resolved.
   */
  providerRetryPolicy(provider) {
    return this.registration(provider).retryPolicy;
  }
  /**
   * Resolve provider-side request-image pricing for one exact route, or
   * `undefined` when the provider is unregistered or declares none. Unknown
   * providers degrade to `undefined` rather than throwing because callers
   * price durable history whose route may no longer be mounted.
   * @param provider - provider route named by a request header.
   * @param model - exact model id named by the same header.
   * @returns the owning adapter's image pricing for the route, when declared.
   */
  imageRequestPricing(provider, model) {
    return this.adapters.get(provider)?.adapter.imageRequestPricing(provider, model);
  }
  /**
   * Resolve the exact text one durable file occurrence contributes to every
   * provider request in the current execution environment.
   * @param ref - durable verbatim file reference from model history.
   * @returns the same deterministic handle text used at adapter dispatch.
   */
  fileRequestText(ref) {
    return fileHandleText(ref, this.fileReadPath(ref));
  }
  /** Detach typed adapter-owned modality metadata. */
  detachedModalities(modalities) {
    return modalities === void 0 ? void 0 : [...modalities];
  }
  /**
   * Discover models advertised by one registered provider. Catalog membership
   * does not constrain core routing. Catalog-driven entry points may restrict
   * selection and submission to the advertised models.
   * @param provider - registered provider route to inspect.
   * @returns detached model metadata in adapter-preferred order.
   */
  async listModels(provider) {
    const adapter = this.registration(provider).adapter;
    const models = await adapter.listModels(provider);
    const seen = /* @__PURE__ */ new Set();
    return models.map((model) => {
      if (typeof model.provider !== "string" || model.provider !== provider || typeof model.id !== "string" || model.id.length === 0 || typeof model.name !== "string" || model.name.length === 0 || model.description !== void 0 && typeof model.description !== "string" || seen.has(model.id)) {
        throw new LlmError(`adapter returned invalid or duplicate model metadata for provider "${provider}"`, "INVALID_CATALOG");
      }
      seen.add(model.id);
      const inputModalities = this.detachedModalities(model.inputModalities);
      return {
        provider: model.provider,
        id: model.id,
        name: model.name,
        ...model.description === void 0 ? {} : { description: model.description },
        ...inputModalities === void 0 ? {} : { inputModalities }
      };
    });
  }
  /**
   * Resolve and validate all metadata from the adapter that owns one exact
   * route. The result is detached from adapter-owned objects; catalog
   * membership remains advisory and does not control request routing.
   * @param provider - registered provider route to inspect.
   * @param model - exact model id passed to the adapter.
   * @param signal - optional cancellation for adapter-owned asynchronous lookup.
   * @returns exact model identity plus available context and reasoning metadata.
   */
  async resolveModelInfo(provider, model, signal) {
    return this.resolveModelInfoFor(this.registration(provider), model, signal);
  }
  async resolveModelInfoFor(registration, model, signal) {
    const resolved = await registration.adapter.resolveModel(registration.provider.id, model, signal);
    return this.normalizeModelInfo(registration, model, resolved);
  }
  /** Validate and detach one adapter-returned exact model result. */
  normalizeModelInfo(registration, model, resolved) {
    const provider = registration.provider.id;
    if (typeof resolved.provider !== "string" || resolved.provider !== provider || typeof resolved.id !== "string" || resolved.id !== model || typeof resolved.name !== "string" || resolved.name.length === 0 || resolved.description !== void 0 && typeof resolved.description !== "string") {
      throw new LlmError(
        `adapter returned invalid exact model metadata for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_INFO"
      );
    }
    const context = resolved.context;
    if (context !== void 0 && (!Number.isInteger(context.contextWindow) || context.contextWindow <= 0)) {
      throw new LlmError(
        `adapter returned invalid context metadata for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_CONTEXT"
      );
    }
    const inputModalities = this.detachedModalities(resolved.inputModalities);
    const systemPromptUpdate = resolved.systemPromptUpdate;
    if (systemPromptUpdate !== void 0 && systemPromptUpdate !== "in-history") {
      throw new LlmError(
        `adapter returned invalid system prompt update mode for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_INFO"
      );
    }
    const toolUpdate = resolved.toolUpdate;
    if (toolUpdate !== void 0 && toolUpdate !== "in-history" && toolUpdate !== "addition-only") {
      throw new LlmError(
        `adapter returned invalid tool update mode for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_INFO"
      );
    }
    const defaultMaxTokens = resolved.defaultMaxTokens;
    if (defaultMaxTokens !== void 0 && (!Number.isSafeInteger(defaultMaxTokens) || defaultMaxTokens <= 0)) {
      throw new LlmError(
        `adapter returned invalid default maxTokens for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_MAX_TOKENS"
      );
    }
    const info = {
      provider,
      id: model,
      name: resolved.name,
      ...resolved.description === void 0 ? {} : { description: resolved.description },
      ...inputModalities === void 0 ? {} : { inputModalities },
      ...context === void 0 ? {} : { context: { contextWindow: context.contextWindow } },
      ...defaultMaxTokens === void 0 ? {} : { defaultMaxTokens },
      ...resolved.systemPromptUpdate === void 0 ? {} : { systemPromptUpdate: resolved.systemPromptUpdate },
      ...resolved.toolUpdate === void 0 ? {} : { toolUpdate: resolved.toolUpdate }
    };
    const reasoning = resolved.reasoning;
    if (reasoning === void 0) return info;
    if (reasoning.efforts.length === 0) {
      throw new LlmError(
        `adapter returned invalid reasoning metadata for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_REASONING"
      );
    }
    const seen = /* @__PURE__ */ new Set();
    const efforts = reasoning.efforts.map((effort) => {
      if (typeof effort.id !== "string" || effort.id.length === 0 || typeof effort.name !== "string" || effort.name.length === 0 || effort.description !== void 0 && typeof effort.description !== "string" || seen.has(effort.id)) {
        throw new LlmError(
          `adapter returned invalid or duplicate reasoning effort metadata for provider "${provider}" model "${model}"`,
          "INVALID_MODEL_REASONING"
        );
      }
      seen.add(effort.id);
      return {
        id: effort.id,
        name: effort.name,
        ...effort.description === void 0 ? {} : { description: effort.description }
      };
    });
    if (reasoning.defaultEffort !== void 0 && !seen.has(reasoning.defaultEffort)) {
      throw new LlmError(
        `adapter returned an unknown default reasoning effort for provider "${provider}" model "${model}"`,
        "INVALID_MODEL_REASONING"
      );
    }
    return {
      ...info,
      reasoning: {
        efforts,
        ...reasoning.defaultEffort === void 0 ? {} : { defaultEffort: reasoning.defaultEffort }
      }
    };
  }
  /**
   * Validate a conversation call config against its exact model capability and
   * materialize adapter-configured defaults. Unsupported explicit efforts
   * reject before provider I/O; no clamping or aliasing is performed. This
   * standalone query does not bind a later dispatch; use {@link prepareCall}
   * when logging and streaming must share one adapter registration.
   * @param config - provider/model route and optional request controls.
   * @param signal - optional cancellation for adapter-owned capability lookup.
   * @returns a detached config only when a default must be materialized.
   */
  async resolveCallConfig(config, signal) {
    return (await this.resolveCallFor(this.registration(config.provider), config, signal)).config;
  }
  async resolveCallFor(registration, config, signal) {
    const info = await this.resolveModelInfoFor(registration, config.model, signal);
    return this.resolveCallWithInfo(config, info);
  }
  /** Validate request controls against one already-bound exact model result. */
  resolveCallWithInfo(config, info) {
    const defaulted = config.maxTokens === void 0 && info.defaultMaxTokens !== void 0 ? { ...config, maxTokens: info.defaultMaxTokens } : config;
    const reasoning = info.reasoning;
    const requested = defaulted.reasoningEffort;
    let resolvedConfig = defaulted;
    if (reasoning === void 0) {
      if (requested !== void 0) {
        throw new LlmError(
          `provider "${config.provider}" model "${config.model}" does not support reasoning effort "${requested}"`,
          "UNSUPPORTED_REASONING_EFFORT"
        );
      }
    } else {
      const effective = requested ?? reasoning.defaultEffort;
      if (effective !== void 0) {
        if (!reasoning.efforts.some((effort) => effort.id === effective)) {
          throw new LlmError(
            `provider "${config.provider}" model "${config.model}" does not support reasoning effort "${effective}"`,
            "UNSUPPORTED_REASONING_EFFORT"
          );
        }
        if (requested !== effective) resolvedConfig = { ...defaulted, reasoningEffort: effective };
      }
    }
    return {
      config: resolvedConfig,
      ...info.context === void 0 ? {} : { context: info.context },
      modelInfo: info
    };
  }
  /**
   * Resolve one call under its current adapter registration. The returned
   * one-shot handle keeps that registration across header logging and dispatch,
   * so HMR cannot combine one adapter's capability result with another adapter.
   * @param config - provider/model route and optional request controls.
   * @param signal - optional cancellation for adapter-owned capability lookup.
   * @returns a prepared config and its registration-bound stream entry point.
   */
  async prepareCall(config, signal) {
    const registration = this.registration(config.provider);
    const adapterCall = await registration.adapter.prepareCall(config.provider, config.model, signal);
    const modelInfo = this.normalizeModelInfo(registration, config.model, adapterCall.model);
    const resolved = this.resolveCallWithInfo(config, modelInfo);
    const resolvedConfig = deepFreeze(structuredClone(resolved.config));
    const context = resolved.context === void 0 ? void 0 : deepFreeze(structuredClone(resolved.context));
    const adapterDefaults = deepFreeze({
      ...config.reasoningEffort === void 0 && resolvedConfig.reasoningEffort !== void 0 ? { reasoningEffort: true } : {},
      ...config.maxTokens === void 0 && resolvedConfig.maxTokens !== void 0 ? { maxTokens: true } : {}
    });
    let dispatched = false;
    return Object.freeze({
      config: resolvedConfig,
      retryPolicy: registration.retryPolicy,
      adapterDefaults,
      ...context === void 0 ? {} : { context },
      ...modelInfo.inputModalities === void 0 ? {} : { inputModalities: Object.freeze([...modelInfo.inputModalities]) },
      ...modelInfo.systemPromptUpdate === void 0 ? {} : { systemPromptUpdate: modelInfo.systemPromptUpdate },
      ...modelInfo.toolUpdate === void 0 ? {} : { toolUpdate: modelInfo.toolUpdate },
      stream: (options) => {
        if (dispatched) {
          throw new LlmError("a prepared LLM call can only be dispatched once", "INVALID_PREPARED_CALL");
        }
        if (!callConfigEquals(options, resolvedConfig)) {
          throw new LlmError(
            "prepared LLM call config changed before adapter dispatch",
            "INVALID_PREPARED_CALL"
          );
        }
        dispatched = true;
        return this.streamWithRegistration(options, {
          registration,
          config: resolvedConfig,
          modelInfo,
          dispatch: (options2) => adapterCall.stream(options2)
        });
      }
    });
  }
  registration(provider) {
    const registration = this.adapters.get(provider);
    if (!registration) throw new LlmError(`no adapter registered for provider "${provider}"`, "NO_ADAPTER");
    return registration;
  }
  /** Remove replay state whose historical route is owned by another adapter. */
  forAdapter(options, adapter) {
    const messages = options.messages.map((message) => {
      if (message.role !== "assistant") return message;
      const source = message.source;
      if (source.replayState === void 0) return message;
      if (this.adapters.get(source.provider)?.adapter === adapter) return message;
      return freezeMessage({
        ...message,
        source: { kind: "model", provider: source.provider, model: source.model }
      });
    });
    if (messages.every((message, index) => message === options.messages[index])) return options;
    const filtered = { ...options, messages };
    return Object.isFrozen(options) ? deepFreeze(filtered) : filtered;
  }
  /**
   * Resolve the current execution-world read path of one durable file
   * reference through the mounted attachment and filesystem providers.
   */
  fileReadPath(ref) {
    let hostPath;
    try {
      hostPath = this.ctx.get("attachments")?.fileHostPath(ref);
    } catch {
      return void 0;
    }
    if (hostPath === void 0) return void 0;
    const fs = this.ctx.get("fs");
    return fs?.processPathFromHostPath(hostPath);
  }
  /**
   * Final adapter boundary. Adapter selection, dispatch, iterator construction,
   * and iteration failures become one terminal failure chunk. Middleware and
   * downstream consumer failures remain thrown plugin or consumer errors.
   */
  async *adapterStream(options, prepared) {
    let iterator;
    try {
      const registration = prepared?.registration ?? this.registration(options.provider);
      const adapter = registration.adapter;
      let modelInfo;
      let resolvedConfig;
      let dispatch;
      if (prepared === void 0) {
        const adapterCall = await adapter.prepareCall(options.provider, options.model, options.signal);
        modelInfo = this.normalizeModelInfo(registration, options.model, adapterCall.model);
        resolvedConfig = this.resolveCallWithInfo(options, modelInfo).config;
        dispatch = (options2) => adapterCall.stream(options2);
      } else {
        modelInfo = prepared.modelInfo;
        resolvedConfig = prepared.config;
        dispatch = prepared.dispatch;
      }
      if (prepared !== void 0 && !callConfigEquals(options, resolvedConfig)) {
        throw new LlmError(
          "prepared LLM call config changed before adapter dispatch",
          "INVALID_PREPARED_CALL"
        );
      }
      const resolvedOptions = callConfigEquals(options, resolvedConfig) ? options : Object.isFrozen(options) ? deepFreeze({ ...options, ...resolvedConfig }) : { ...options, ...resolvedConfig };
      let projectedMessages = resolvedOptions.messages;
      if (projectedMessages.some((message) => contentHasFile(message.content))) {
        projectedMessages = projectFilesToText(projectedMessages, (ref) => this.fileReadPath(ref));
      }
      if (modelInfo.inputModalities !== void 0 && !modelInfo.inputModalities.includes("image") && projectedMessages.some((message) => contentHasImage(message.content))) {
        projectedMessages = projectImagesForTextModel(projectedMessages);
      }
      const projectedTools = projectToolUpdates(projectedMessages, resolvedOptions.tools, modelInfo.toolUpdate, resolvedOptions.toolHistory);
      projectedMessages = projectedTools.messages;
      let projectedOptions = resolvedOptions;
      if (projectedMessages !== resolvedOptions.messages || projectedTools.tools !== resolvedOptions.tools) {
        projectedOptions = {
          ...resolvedOptions,
          messages: projectedMessages,
          ...projectedTools.tools === void 0 ? {} : { tools: projectedTools.tools }
        };
        if (Object.isFrozen(resolvedOptions)) deepFreeze(projectedOptions);
      }
      const stream = dispatch(this.forAdapter(projectedOptions, adapter));
      iterator = stream[Symbol.asyncIterator]();
    } catch (error) {
      yield adapterFailureChunk(error, options.signal);
      return;
    }
    let completed = false;
    try {
      while (true) {
        let item;
        try {
          const next = await iterator.next();
          item = next.done ? { done: true } : { done: false, value: next.value };
        } catch (error) {
          completed = true;
          yield adapterFailureChunk(error, options.signal);
          return;
        }
        if (item.done) {
          completed = true;
          return;
        }
        yield item.value;
      }
    } finally {
      if (!completed) {
        const close = iterator.return?.bind(iterator);
        if (close) await close();
      }
    }
  }
  /**
   * Stream one model call as raw chunks (token-level deltas). Replay state is
   * retained only when the same adapter instance owns its historical provider
   * and the target provider. Final adapter selection remains fixed through
   * asynchronous exact-model resolution and dispatch. Adapter selection,
   * dispatch, and iteration failures become terminal `error` or `aborted`
   * finish chunks; middleware, nested-call, cleanup, and consumer failures
   * remain thrown.
   * @param options - the full request; `options.provider` selects the adapter.
   * @returns the chunk stream, possibly wrapped by `llm/stream` listeners.
   */
  stream(options) {
    return this.streamWithRegistration(options);
  }
  streamWithRegistration(options, prepared) {
    return this.ctx.waterfall(
      this,
      "llm/stream",
      options,
      () => this.adapterStream(options, prepared)
    );
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "listProviders", _listProviders_dec, LlmRuntime);
__decorateElement(_init, 1, "listConfigurableProviders", _listConfigurableProviders_dec, LlmRuntime);
__decorateElement(_init, 1, "remoteDiscoverModels", _remoteDiscoverModels_dec, LlmRuntime);
__decoratorMetadata(_init, LlmRuntime);
function adapterFailureChunk(error, signal) {
  const failure = normalizeLlmFailure(error);
  return {
    type: "finish",
    reason: signal?.aborted || failure.code === "ABORTED" ? { kind: "aborted", failure } : { kind: "error", failure }
  };
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/sandbox/sandbox/src/escalation.ts
var WIDER_MODES = {
  "read-only": ["workspace-write", "danger-full-access"],
  "workspace-write": ["danger-full-access"]
};
var ESCALATION_TARGETS = ["workspace-write", "danger-full-access"];
function validateEscalationArgs(sandboxPermissions, justification) {
  if (sandboxPermissions !== void 0 && justification === void 0) {
    throw new Error("invalid escalation: sandbox_permissions requires a justification");
  }
  if (justification !== void 0 && sandboxPermissions === void 0) {
    throw new Error("invalid escalation: justification is only valid together with sandbox_permissions");
  }
  if (justification !== void 0 && justification.trim().length === 0) {
    throw new Error("invalid justification: expected a non-empty sentence");
  }
}
async function approveEscalation(request, approval) {
  const { requestedMode: mode2, effectiveMode, justification, subject } = request;
  if (mode2 === effectiveMode) return effectiveMode;
  if (!(WIDER_MODES[effectiveMode] ?? []).includes(mode2)) {
    throw new Error(`sandbox escalation to "${mode2}" is not strictly wider than this call's current "${effectiveMode}" mode`);
  }
  if (approval.approver === void 0) {
    throw new Error(`sandbox escalation to "${mode2}" requires approval, but no approval service is composed`);
  }
  if (approval.agent === void 0) {
    throw new Error(`sandbox escalation to "${mode2}" requires approval, but the call has no agent to route it through`);
  }
  const outcome = await approval.approver.request({
    agent: approval.agent,
    toolName: approval.toolName,
    callId: approval.callId,
    reason: `escalate sandbox to ${mode2}: ${justification}`,
    displayReason: {
      en: `Allow this operation with ${mode2} permissions: ${justification}`,
      zh: `\u5141\u8BB8\u672C\u6B21\u64CD\u4F5C\u4F7F\u7528 ${mode2} \u6743\u9650\uFF1A${justification}`
    },
    ...approval.signal ? { signal: approval.signal } : {}
  });
  switch (outcome) {
    // The schema enum already pinned `mode` to the closed target vocabulary;
    // the check above proved it is strictly wider.
    case "allowed-once":
      return mode2;
    case "rejected":
      throw new Error(`the user rejected escalating this ${subject} to "${mode2}"; it stays denied, so stop and explain instead of working around it`);
    case "cancelled":
      throw new Error(`approval for escalating to "${mode2}" was cancelled`);
    case "unavailable":
      throw new Error(`sandbox escalation to "${mode2}" requires approval, but no approval channel is available`);
    default:
      return assertNever(outcome, "EscalationOutcome");
  }
}

// ../../../deepseek-harness-dev/deepseek-harness/packages/sandbox/sandbox/src/roots.ts
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";

// ../../../deepseek-harness-dev/deepseek-harness/packages/sandbox/sandbox/src/diagnostics.ts
import { accessSync, constants, statSync } from "node:fs";

// ../../../deepseek-harness-dev/deepseek-harness/packages/core/tools/lib/index.js
var JsonSchemaError = class extends HarnessError {
  /** Individual schema violations in walk order. */
  violations;
  constructor(violations) {
    super(`unsupported JSON schema: ${violations.join("; ")}`, "UNSUPPORTED_SCHEMA");
    this.name = "JsonSchemaError";
    this.violations = violations;
  }
};
var CONSTRAINT_KEYWORDS = /* @__PURE__ */ new Set([
  "type",
  "oneOf",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "const"
]);
var ANNOTATION_KEYWORDS = /* @__PURE__ */ new Set([
  "description",
  "title",
  "default",
  "examples"
]);
var SCHEMA_TYPES = [
  "object",
  "array",
  "string",
  "number",
  "integer",
  "boolean",
  "null"
];
function hasIntrinsicConstructor2(prototype, name2) {
  const constructor = Object.getOwnPropertyDescriptor(prototype, "constructor")?.value;
  if (typeof constructor !== "function") return false;
  try {
    return constructor.name === name2 && constructor.prototype === prototype && Function.prototype.toString.call(constructor) === `function ${name2}() { [native code] }`;
  } catch {
    return false;
  }
}
function isIntrinsicObjectPrototype2(value) {
  return Object.getPrototypeOf(value) === null && hasIntrinsicConstructor2(value, "Object");
}
function isPlainJsonRecord(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || typeof prototype === "object" && isIntrinsicObjectPrototype2(prototype);
  } catch {
    return false;
  }
}
function hasPlainArrayPrototype2(value) {
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(prototype) || !hasIntrinsicConstructor2(prototype, "Array")) return false;
  const objectPrototype = Object.getPrototypeOf(prototype);
  return typeof objectPrototype === "object" && objectPrototype !== null && isIntrinsicObjectPrototype2(objectPrototype);
}
function hasOnlyEnumerableStringKeys(value) {
  try {
    return Reflect.ownKeys(value).every((key) => typeof key === "string" && Object.prototype.propertyIsEnumerable.call(value, key));
  } catch {
    return false;
  }
}
function isJsonSchemaRecord(value) {
  return isPlainJsonRecord(value) && hasOnlyEnumerableStringKeys(value);
}
function isPlainJsonArray(value) {
  if (!Array.isArray(value)) return false;
  try {
    if (!hasPlainArrayPrototype2(value) || Reflect.ownKeys(value).length !== value.length + 1) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
  } catch {
    return false;
  }
}
function isJsonNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0);
}
function scalarMatches(type, value) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return isJsonNumber(value);
    case "integer":
      return isJsonNumber(value) && Number.isInteger(value);
    case "boolean":
      return typeof value === "boolean";
    case "null":
      return value === null;
    /* v8 ignore next -- JsonSchemaScalarType is closed; this retains compile-time exhaustiveness. */
    default:
      return assertNever(type, "JsonSchemaType");
  }
}
var ONE_OF_SIBLING_KEYWORDS = [
  "properties",
  "required",
  "additionalProperties",
  "items",
  "enum",
  "const"
];
function checkObjectSchemaTail(node, path, properties, violations) {
  const hasRequired = Object.hasOwn(node, "required");
  const required = hasRequired ? node.required : void 0;
  if (hasRequired) if (!isPlainJsonArray(required) || required.some((entry) => typeof entry !== "string")) violations.push(`${path}.required must be an array of strings`);
  else {
    const declared = isJsonSchemaRecord(properties) ? properties : {};
    for (const key of required) if (!Object.hasOwn(declared, key)) violations.push(`${path}.required names "${key}" which is not in properties`);
  }
  if (Object.hasOwn(node, "additionalProperties") && typeof node.additionalProperties !== "boolean") violations.push(`${path}.additionalProperties must be a boolean`);
}
function checkSchemaNode(root, rootPath, violations, seen) {
  const tasks = [{
    kind: "enter",
    node: root,
    path: rootPath
  }];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      seen.delete(task.node);
      continue;
    }
    if (task.kind === "one-of-tail") {
      for (const key of ONE_OF_SIBLING_KEYWORDS) if (Object.hasOwn(task.node, key)) violations.push(`${task.path}.${key} is not supported beside oneOf`);
      continue;
    }
    if (task.kind === "object-tail") {
      checkObjectSchemaTail(task.node, task.path, task.properties, violations);
      continue;
    }
    const { node, path } = task;
    if (!isJsonSchemaRecord(node)) {
      violations.push(`${path} must be a schema object`);
      continue;
    }
    if (seen.has(node)) {
      violations.push(`${path} is circular`);
      continue;
    }
    seen.add(node);
    tasks.push({
      kind: "leave",
      node
    });
    for (const key of Object.keys(node)) {
      if (CONSTRAINT_KEYWORDS.has(key)) continue;
      if (ANNOTATION_KEYWORDS.has(key)) {
        try {
          if (!isJsonValue(node[key])) violations.push(`${path}.${key} annotation must be lossless JSON data`);
        } catch {
          violations.push(`${path}.${key} annotation must be lossless JSON data`);
        }
        continue;
      }
      violations.push(`${path}.${key} is not a supported keyword (subset: type/oneOf/properties/required/additionalProperties/items/enum/const + annotations)`);
    }
    if (Object.hasOwn(node, "description") && typeof node.description !== "string") violations.push(`${path}.description must be a string`);
    if (Object.hasOwn(node, "title") && typeof node.title !== "string") violations.push(`${path}.title must be a string`);
    const hasType = Object.hasOwn(node, "type");
    const hasOneOf = Object.hasOwn(node, "oneOf");
    if (hasType && hasOneOf) {
      violations.push(`${path} cannot declare both type and oneOf`);
      continue;
    }
    if (!hasType && !hasOneOf) {
      for (const key of ONE_OF_SIBLING_KEYWORDS) if (Object.hasOwn(node, key)) violations.push(`${path}.${key} requires type or oneOf`);
      continue;
    }
    if (hasOneOf) {
      const oneOf = node.oneOf;
      tasks.push({
        kind: "one-of-tail",
        node,
        path
      });
      if (!isPlainJsonArray(oneOf) || oneOf.length < 2) violations.push(`${path}.oneOf must be an array of at least two schemas`);
      else for (let index = oneOf.length - 1; index >= 0; index--) tasks.push({
        kind: "enter",
        node: oneOf[index],
        path: `${path}.oneOf[${index}]`
      });
      continue;
    }
    const type = node.type;
    if (typeof type !== "string" || !SCHEMA_TYPES.includes(type)) {
      violations.push(Array.isArray(type) ? `${path}.type must be a single type string (type arrays are not supported)` : `${path}.type must be one of ${SCHEMA_TYPES.join("/")}`);
      continue;
    }
    const schemaType = type;
    for (const [key, types] of Object.entries({
      properties: ["object"],
      required: ["object"],
      additionalProperties: ["object"],
      items: ["array"],
      enum: [
        "string",
        "number",
        "integer",
        "boolean",
        "null"
      ],
      const: [
        "string",
        "number",
        "integer",
        "boolean",
        "null"
      ]
    })) if (Object.hasOwn(node, key) && !types.includes(schemaType)) violations.push(`${path}.${key} is not supported on type "${schemaType}"`);
    switch (schemaType) {
      case "object": {
        const properties = Object.hasOwn(node, "properties") ? node.properties : void 0;
        tasks.push({
          kind: "object-tail",
          node,
          path,
          properties
        });
        if (Object.hasOwn(node, "properties")) if (!isJsonSchemaRecord(properties)) violations.push(`${path}.properties must be an object of schemas`);
        else {
          const entries = Object.entries(properties);
          for (let index = entries.length - 1; index >= 0; index--) {
            const entry = entries[index];
            if (entry === void 0) continue;
            tasks.push({
              kind: "enter",
              node: entry[1],
              path: `${path}.properties.${entry[0]}`
            });
          }
        }
        break;
      }
      case "array":
        if (Object.hasOwn(node, "items")) tasks.push({
          kind: "enter",
          node: node.items,
          path: `${path}.items`
        });
        break;
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null": {
        const hasEnum = Object.hasOwn(node, "enum");
        const allowed = hasEnum ? node.enum : void 0;
        const enumValid = isPlainJsonArray(allowed) && allowed.length > 0 && allowed.every((entry) => scalarMatches(schemaType, entry));
        if (hasEnum && !enumValid) violations.push(`${path}.enum must be a non-empty array of ${schemaType} values`);
        const hasConst = Object.hasOwn(node, "const");
        const declaredConst = hasConst ? node.const : void 0;
        const constValid = scalarMatches(schemaType, declaredConst);
        if (hasConst) {
          if (!constValid) violations.push(`${path}.const must be a ${schemaType} value`);
          else if (enumValid && !allowed.includes(declaredConst)) violations.push(`${path}.const must be one of ${path}.enum when both are declared`);
        }
        break;
      }
      /* v8 ignore next -- schemaType was narrowed from the closed SCHEMA_TYPES table above. */
      default:
        assertNever(schemaType, "JsonSchemaType");
    }
  }
}
function assertSupportedJsonSchema(schema) {
  const violations = [];
  checkSchemaNode(schema, "schema", violations, /* @__PURE__ */ new Set());
  if (violations.length > 0) throw new JsonSchemaError(violations);
}
function safelyIsJsonValue(value) {
  try {
    return isJsonValue(value);
  } catch {
    return false;
  }
}
function diagnosticPath(path) {
  return path === "" ? "arguments" : path;
}
function propertyPath(path, key) {
  return path === "" ? key : `${path}.${key}`;
}
function losslessValueViolation(path) {
  return [`"${diagnosticPath(path)}" must be a lossless JSON value`];
}
function appendViolations(target, source) {
  for (const violation of source) target.push(violation);
}
function valueFrame(node, value, path) {
  return {
    node,
    value,
    path,
    catches: false,
    phase: "start",
    children: [],
    childIndex: 0,
    violations: [],
    tailViolations: [],
    matches: 0
  };
}
function checkScalarValue(node, value, path) {
  const allowed = Object.hasOwn(node, "enum") ? node.enum : void 0;
  if (allowed !== void 0 && !allowed.includes(value)) return [`"${diagnosticPath(path)}" must be one of ${JSON.stringify(allowed)}`];
  if (Object.hasOwn(node, "const") && value !== node.const) return [`"${diagnosticPath(path)}" must be ${JSON.stringify(node.const)}`];
  return [];
}
function checkValue(schema, value, path) {
  const frames = [valueFrame(schema, value, path)];
  let rootResult;
  const receive = (result) => {
    const parent = frames.at(-1);
    if (parent === void 0) {
      rootResult = result;
      return;
    }
    if (parent.kind === "oneOf") {
      if (result.length === 0) parent.matches++;
    } else appendViolations(parent.violations, result);
  };
  const finish = (result) => {
    frames.pop();
    receive(result);
  };
  while (frames.length > 0) {
    const frame = frames.at(-1);
    if (frame === void 0) break;
    try {
      if (frame.phase === "children") {
        if (frame.childIndex < frame.children.length) {
          const child = frame.children[frame.childIndex];
          if (child === void 0) throw new Error("missing schema-value child frame");
          frame.childIndex++;
          frames.push(valueFrame(child.node, child.value, child.path));
          continue;
        }
        if (frame.kind === "oneOf") {
          finish(frame.matches === 1 ? [] : [`"${diagnosticPath(frame.path)}" must match exactly one oneOf branch (matched ${frame.matches})`]);
          continue;
        }
        appendViolations(frame.violations, frame.tailViolations);
        if (frame.violations.length > 0) finish(frame.violations);
        else if (frame.kind === "object") finish(safelyIsJsonValue(frame.value) ? [] : [`"${diagnosticPath(frame.path)}" must be a lossless JSON object`]);
        else finish(safelyIsJsonValue(frame.value) ? [] : [`"${diagnosticPath(frame.path)}" must be a dense lossless JSON array`]);
        continue;
      }
      const nodeType = Object.hasOwn(frame.node, "type") ? frame.node.type : void 0;
      frame.catches = !(nodeType !== void 0 && !SCHEMA_TYPES.includes(nodeType));
      const oneOf = Object.hasOwn(frame.node, "oneOf") ? frame.node.oneOf : void 0;
      if (oneOf !== void 0) {
        frame.kind = "oneOf";
        frame.children = Array.from(oneOf, (branch) => ({
          node: branch,
          value: frame.value,
          path: frame.path
        }));
        frame.childIndex = 0;
        frame.matches = 0;
        frame.phase = "children";
        continue;
      }
      if (nodeType === void 0) {
        finish(safelyIsJsonValue(frame.value) ? [] : losslessValueViolation(frame.path));
        continue;
      }
      switch (nodeType) {
        case "object": {
          if (!isPlainJsonRecord(frame.value)) {
            finish([`"${diagnosticPath(frame.path)}" must be an object`]);
            break;
          }
          const properties = Object.hasOwn(frame.node, "properties") ? frame.node.properties ?? {} : {};
          const violations = [];
          const required = Object.hasOwn(frame.node, "required") ? frame.node.required ?? [] : [];
          for (const key of required) if (!Object.hasOwn(frame.value, key) || frame.value[key] === void 0) violations.push(`missing required property "${propertyPath(frame.path, key)}"`);
          const children = [];
          for (const [key, child] of Object.entries(properties)) {
            if (!Object.hasOwn(frame.value, key) || frame.value[key] === void 0) continue;
            children.push({
              node: child,
              value: frame.value[key],
              path: propertyPath(frame.path, key)
            });
          }
          const tailViolations = [];
          if (Object.hasOwn(frame.node, "additionalProperties") && frame.node.additionalProperties === false) {
            for (const key of Object.keys(frame.value)) if (!Object.hasOwn(properties, key)) tailViolations.push(`"${propertyPath(frame.path, key)}" is not a declared property (additionalProperties: false)`);
          }
          frame.kind = "object";
          frame.children = children;
          frame.childIndex = 0;
          frame.violations = violations;
          frame.tailViolations = tailViolations;
          frame.phase = "children";
          break;
        }
        case "array": {
          if (!Array.isArray(frame.value)) {
            finish([`"${diagnosticPath(frame.path)}" must be an array`]);
            break;
          }
          const items = Object.hasOwn(frame.node, "items") ? frame.node.items : void 0;
          const children = items === void 0 ? [] : frame.value.flatMap((entry, index) => [{
            node: items,
            value: entry,
            path: `${frame.path}[${index}]`
          }]);
          frame.kind = "array";
          frame.children = children;
          frame.childIndex = 0;
          frame.violations = [];
          frame.phase = "children";
          break;
        }
        case "string":
          finish(typeof frame.value === "string" ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be a string`]);
          break;
        case "number":
          finish(typeof frame.value !== "number" ? [`"${diagnosticPath(frame.path)}" must be a number`] : !isJsonNumber(frame.value) ? [`"${diagnosticPath(frame.path)}" must be a finite JSON number`] : checkScalarValue(frame.node, frame.value, frame.path));
          break;
        case "integer":
          finish(!isJsonNumber(frame.value) || !Number.isInteger(frame.value) ? [`"${diagnosticPath(frame.path)}" must be an integer`] : checkScalarValue(frame.node, frame.value, frame.path));
          break;
        case "boolean":
          finish(typeof frame.value === "boolean" ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be a boolean`]);
          break;
        case "null":
          finish(frame.value === null ? checkScalarValue(frame.node, frame.value, frame.path) : [`"${diagnosticPath(frame.path)}" must be null`]);
          break;
        default:
          finish(assertNever(nodeType, "JsonSchemaType"));
      }
    } catch (error) {
      let failed = frames.pop();
      while (failed !== void 0 && !failed.catches) failed = frames.pop();
      if (failed === void 0) throw error;
      receive(losslessValueViolation(failed.path));
    }
  }
  return rootResult ?? losslessValueViolation(path);
}
function validateJsonSchemaValue(schema, value, path = "value") {
  return checkValue(schema, value, path);
}
var ANNOTATION_KEYS = [
  "description",
  "title",
  "default",
  "examples"
];
function authorError(message) {
  throw new JsonSchemaError([message]);
}
function copyAnnotations(source, target) {
  if (Object.hasOwn(source, "description")) target.description = source.description;
  if (Object.hasOwn(source, "title")) target.title = source.title;
  if (Object.hasOwn(source, "default")) target.default = source.default;
  if (Object.hasOwn(source, "examples")) target.examples = source.examples;
}
function assertAuthorKeys(source, path, allowed) {
  for (const key of Object.keys(source)) if (!allowed.includes(key)) authorError(`${path}.${key} is not supported by the value schema DSL`);
}
function assignCompiledNode(destination, node) {
  switch (destination.kind) {
    case "root":
      destination.holder.value = node;
      break;
    case "property":
      Object.defineProperty(destination.target, destination.key, {
        value: node,
        enumerable: true,
        configurable: true,
        writable: true
      });
      break;
    case "item":
      destination.target.items = node;
      break;
    case "one-of":
      destination.target[destination.index] = node;
      break;
  }
}
function assignCompiledPropertyMap(destination, compiled) {
  if (destination.kind === "root") destination.holder.value = compiled;
  else destination.target.properties = compiled.properties;
}
function runSchemaCompiler(initial) {
  const seen = /* @__PURE__ */ new Set();
  const tasks = [initial];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "leave") {
      seen.delete(task.input);
      continue;
    }
    if (task.kind === "property-map-tail") {
      if (task.required.length > 0) {
        task.compiled.required = task.required;
        if (task.destination.kind === "object") task.destination.target.required = task.required;
      }
      continue;
    }
    if (task.kind === "property") {
      if (!isJsonSchemaRecord(task.property)) authorError(`${task.path} must be a value schema object`);
      if (Object.hasOwn(task.property, "required") && task.property.required !== true) authorError(`${task.path}.required must be true when present`);
      if (Object.hasOwn(task.property, "required") && task.property.required === true) task.required.push(task.key);
      tasks.push({
        kind: "value",
        input: task.property,
        path: task.path,
        allowRequired: true,
        destination: {
          kind: "property",
          target: task.properties,
          key: task.key
        }
      });
      continue;
    }
    if (task.kind === "property-map") {
      if (!isJsonSchemaRecord(task.input)) authorError(`${task.path} must be an object of value schemas`);
      if (seen.has(task.input)) authorError(`${task.path} is circular`);
      seen.add(task.input);
      const compiled = { properties: {} };
      const required = [];
      assignCompiledPropertyMap(task.destination, compiled);
      tasks.push({
        kind: "leave",
        input: task.input
      });
      tasks.push({
        kind: "property-map-tail",
        compiled,
        required,
        destination: task.destination
      });
      const entries = Object.entries(task.input);
      for (let index = entries.length - 1; index >= 0; index--) {
        const entry = entries[index];
        if (entry === void 0) continue;
        tasks.push({
          kind: "property",
          property: entry[1],
          path: `${task.path}.${entry[0]}`,
          key: entry[0],
          properties: compiled.properties,
          required
        });
      }
      continue;
    }
    const { input, path } = task;
    if (!isJsonSchemaRecord(input)) authorError(`${path} must be a value schema object`);
    if (seen.has(input)) authorError(`${path} is circular`);
    seen.add(input);
    const authorKeys = [...ANNOTATION_KEYS, ...task.allowRequired ? ["required"] : []];
    const node = {};
    assignCompiledNode(task.destination, node);
    tasks.push({
      kind: "leave",
      input
    });
    if (Object.hasOwn(input, "oneOf")) {
      assertAuthorKeys(input, path, [
        ...authorKeys,
        "oneOf",
        "type"
      ]);
      if (Object.hasOwn(input, "type")) authorError(`${path} cannot declare both type and oneOf`);
      if (!isPlainJsonArray(input.oneOf)) authorError(`${path}.oneOf must be an array of at least two value schemas`);
      const branches = [];
      node.oneOf = branches;
      copyAnnotations(input, node);
      for (let index = input.oneOf.length - 1; index >= 0; index--) tasks.push({
        kind: "value",
        input: input.oneOf[index],
        path: `${path}.oneOf[${index}]`,
        allowRequired: false,
        destination: {
          kind: "one-of",
          target: branches,
          index
        }
      });
      continue;
    }
    const inputType = Object.hasOwn(input, "type") ? input.type : void 0;
    switch (inputType) {
      case "json":
        assertAuthorKeys(input, path, [...authorKeys, "type"]);
        copyAnnotations(input, node);
        break;
      case "object":
        assertAuthorKeys(input, path, [
          ...authorKeys,
          "type",
          "properties",
          "additionalProperties"
        ]);
        if (!Object.hasOwn(input, "additionalProperties") || typeof input.additionalProperties !== "boolean") authorError(`${path}.additionalProperties must be explicitly true or false`);
        node.type = "object";
        copyAnnotations(input, node);
        node.additionalProperties = input.additionalProperties;
        if (Object.hasOwn(input, "properties")) tasks.push({
          kind: "property-map",
          input: input.properties,
          path: `${path}.properties`,
          destination: {
            kind: "object",
            target: node
          }
        });
        break;
      case "array":
        assertAuthorKeys(input, path, [
          ...authorKeys,
          "type",
          "items"
        ]);
        node.type = "array";
        copyAnnotations(input, node);
        if (Object.hasOwn(input, "items")) tasks.push({
          kind: "value",
          input: input.items,
          path: `${path}.items`,
          allowRequired: false,
          destination: {
            kind: "item",
            target: node
          }
        });
        break;
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null":
        assertAuthorKeys(input, path, [
          ...authorKeys,
          "type",
          "enum",
          "const"
        ]);
        node.type = inputType;
        copyAnnotations(input, node);
        if (Object.hasOwn(input, "enum")) {
          if (!isPlainJsonArray(input.enum)) authorError(`${path}.enum must be a non-empty array of scalar values`);
          node.enum = Array.from(input.enum, (entry) => entry);
        }
        if (Object.hasOwn(input, "const")) node.const = input.const;
        break;
      default:
        authorError(`${path}.type must be string/number/integer/boolean/null/array/object/json, or use oneOf`);
    }
  }
}
function compilePropertyMap(input, path) {
  const holder = {};
  runSchemaCompiler({
    kind: "property-map",
    input,
    path,
    destination: {
      kind: "root",
      holder
    }
  });
  return holder.value ?? authorError(`${path} did not compile`);
}
function compileValueSchema(input, path) {
  const holder = {};
  runSchemaCompiler({
    kind: "value",
    input,
    path,
    allowRequired: false,
    destination: {
      kind: "root",
      holder
    }
  });
  return holder.value ?? authorError(`${path} did not compile`);
}
function valueSchemaSpecToJsonSchema(spec) {
  const schema = compileValueSchema(spec, "schema");
  assertSupportedJsonSchema(schema);
  return schema;
}
function parameterSchemaSpecToJsonSchema(spec) {
  const compiled = compilePropertyMap(spec, "parameters");
  const schema = {
    type: "object",
    properties: compiled.properties,
    ...compiled.required === void 0 ? {} : { required: compiled.required }
  };
  assertSupportedJsonSchema(schema);
  return schema;
}
var ToolArgsError = class extends HarnessError {
  /** Individual violations in schema-walk order. */
  violations;
  constructor(violations) {
    super(`invalid arguments: ${violations.join("; ")}`, "INVALID_ARGS");
    this.name = "ToolArgsError";
    this.violations = violations;
  }
};
function defineTool(options) {
  const userExecute = options.execute;
  const userFinalizeContent = options.finalizeContent;
  const userProjectContent = options.projectContent;
  const userRender = options.output.render;
  const userPresentationMeta = options.output.presentationMeta;
  const userPresentCall = options.presentCall;
  const userPresentResult = options.presentResult;
  const userIsConcurrencySafe = options.isConcurrencySafe;
  if (options.timeoutMs !== void 0 && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) throw new Error(`defineTool(${options.name}): timeoutMs must be a positive finite number`);
  const parameters = parameterSchemaSpecToJsonSchema(options.parameters);
  const outputSchema = valueSchemaSpecToJsonSchema(options.output.schema);
  const validate = (args) => validateJsonSchemaValue(parameters, args, "");
  const tool = {
    name: options.name,
    description: options.description,
    parameters,
    output: {
      schema: outputSchema,
      render(args, value) {
        return userRender(args, value);
      },
      ...userPresentationMeta !== void 0 ? { presentationMeta(args, value) {
        return userPresentationMeta(args, value);
      } } : {}
    },
    ...options.deferLoading === true ? { deferLoading: options.deferLoading } : {},
    ...options.timeoutMs !== void 0 ? { timeoutMs: options.timeoutMs } : {},
    async execute(args, exec) {
      const violations = validate(args);
      if (violations.length > 0) throw new ToolArgsError(violations);
      return userExecute(args, exec);
    }
  };
  if (userProjectContent) tool.projectContent = (exec, result) => userProjectContent(exec, result);
  if (userFinalizeContent) tool.finalizeContent = (exec, result) => userFinalizeContent(exec, result);
  if (userPresentCall) tool.presentCall = (args) => {
    if (validate(args).length > 0) return void 0;
    return userPresentCall(args);
  };
  if (userPresentResult) tool.presentResult = (args, result) => {
    if (validate(args).length > 0) return void 0;
    return userPresentResult(args, result);
  };
  if (userIsConcurrencySafe) tool.isConcurrencySafe = (args) => {
    if (validate(args).length > 0) return false;
    return userIsConcurrencySafe(args);
  };
  return tool;
}
var RUN_CODE_NAME = "run_code";
var TYPESCRIPT_FLAVOR = {
  description: "Execute a TypeScript program against the available tools. Takes two required arguments: `code`, the BODY of an async function (erasable syntax only; top-level `await` and `return` work), and `description`, a short summary of what the program does. Call tools as `await tools.name(args)` per the declarations in the system prompt. Only what you print or return is program output \u2014 curate it. Image-bearing subtool results are attached after the run.",
  codeDescription: "The program: the body of an async TypeScript function."
};
var RUN_CODE_FLAVORS = {
  typescript: TYPESCRIPT_FLAVOR,
  python: {
    description: "Execute a Python program against the available tools. Takes two required arguments: `code`, the BODY of an async function (top-level `await` and `return` work), and `description`, a short summary of what the program does. Call tools as `await tools.name(args)` per the declarations in the system prompt. Use `print(...)` and/or `return <value>` for program output \u2014 curate it. Image-bearing subtool results are attached after the run.",
    codeDescription: "The program: the body of an async Python function."
  }
};
var RUN_CODE_DESCRIPTION_PARAM_DESCRIPTION = 'Clear, concise description of what this program does in active voice, 5-10 words (shown in the UI). Examples: "Count TODO markers across packages"; "Read failing test and its fixture"; "Rename config key in every cordis.yml".';
var RUN_CODE_CONTROLS = {
  timeoutMs: {
    type: "number",
    description: "Positive elapsed-time budget in milliseconds, capped by the deployment maximum."
  },
  sandbox_permissions: {
    type: "string",
    enum: [...ESCALATION_TARGETS],
    description: "Wider sandbox mode for this complete program execution; requires justification and approval."
  },
  justification: {
    type: "string",
    description: "Reason this complete program needs wider access, shown to the user for approval. Use the language of the user\u2019s current request."
  }
};
function controlParameters(runtime) {
  if (runtime === void 0) return RUN_CODE_CONTROLS;
  return {
    ...runtime.timeout === void 0 ? {} : { timeoutMs: {
      ...RUN_CODE_CONTROLS.timeoutMs,
      description: `Positive elapsed-time budget in milliseconds, including nested tool and approval waits. Default ${runtime.timeout.defaultMs}; capped at ${runtime.timeout.maxMs}. Zero does not disable the deadline.`
    } },
    ...runtime.sandboxMode === void 0 ? {} : {
      sandbox_permissions: RUN_CODE_CONTROLS.sandbox_permissions,
      justification: RUN_CODE_CONTROLS.justification
    }
  };
}
function escalationGuidance(runtime) {
  return runtime?.sandboxMode === void 0 ? "" : " A sandbox escalation approves this complete program for one execution only. Nested tools retain their own policies and approvals. Request wider access only after evidence of a denial. Earlier effects may already have completed: inspect them before explicitly retrying. Programs are never replayed automatically.";
}
function resolveFlavor(peekRuntime) {
  const runtime = peekRuntime();
  if (runtime === void 0) return TYPESCRIPT_FLAVOR;
  const flavor = RUN_CODE_FLAVORS[runtime.language];
  if (!Object.hasOwn(RUN_CODE_FLAVORS, runtime.language) || flavor === void 0) {
    const known = Object.keys(RUN_CODE_FLAVORS).map((name2) => JSON.stringify(name2)).join(", ");
    throw new Error(`dsh-tools: no run_code schema flavor registered for runtime language ${JSON.stringify(runtime.language)} (known: ${known})`);
  }
  return flavor;
}
var CodeRunFailedError = class extends HarnessError {
  constructor(message) {
    super(message, "CODE_RUN_FAILED");
    this.name = "CodeRunFailedError";
  }
};
function jsonNormalizeArgs(value) {
  let snapshot2;
  try {
    snapshot2 = snapshotJsonValue(value);
  } catch (error) {
    throw new Error(`tool arguments must be lossless JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (snapshot2 === void 0) throw new Error("tool arguments must be lossless JSON (call the tool with an arguments object, e.g. `{}`)");
  const logged = snapshotJsonValue(snapshot2);
  if (logged === void 0) throw new Error("tool arguments could not be detached for durable logging");
  return {
    dispatched: snapshot2,
    logged
  };
}
var JSON_INDENT = "  ";
var MAX_JSON_INDENT_CHARS = 10;
function renderJsonValue(value) {
  const chunks = [];
  const tasks = [{
    kind: "value",
    value,
    depth: 0,
    compact: false
  }];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (task.kind === "text") {
      chunks.push(task.text);
      continue;
    }
    const current = task.value;
    if (current === null || typeof current === "boolean" || typeof current === "number") {
      chunks.push(String(current));
      continue;
    }
    if (typeof current === "string") {
      chunks.push(JSON.stringify(current));
      continue;
    }
    const compact = task.compact || (task.depth + 1) * 2 > MAX_JSON_INDENT_CHARS;
    const childDepth = task.depth + 1;
    if (Array.isArray(current)) {
      chunks.push("[");
      if (current.length === 0) {
        chunks.push("]");
        continue;
      }
      tasks.push({
        kind: "text",
        text: compact ? "]" : `
${JSON_INDENT.repeat(task.depth)}]`
      });
      for (let index = current.length - 1; index >= 0; index--) {
        const item = current[index];
        if (item === void 0) throw new Error("cannot render a sparse JSON array");
        tasks.push({
          kind: "value",
          value: item,
          depth: childDepth,
          compact
        });
        tasks.push({
          kind: "text",
          text: compact ? index === 0 ? "" : "," : `${index === 0 ? "\n" : ",\n"}${JSON_INDENT.repeat(childDepth)}`
        });
      }
      continue;
    }
    const keys = Object.keys(current);
    chunks.push("{");
    if (keys.length === 0) {
      chunks.push("}");
      continue;
    }
    tasks.push({
      kind: "text",
      text: compact ? "}" : `
${JSON_INDENT.repeat(task.depth)}}`
    });
    for (let index = keys.length - 1; index >= 0; index--) {
      const key = keys[index];
      if (key === void 0) throw new Error("cannot render a missing JSON object key");
      const item = current[key];
      if (item === void 0) throw new Error("cannot render an undefined JSON object property");
      tasks.push({
        kind: "value",
        value: item,
        depth: childDepth,
        compact
      });
      tasks.push({
        kind: "text",
        text: compact ? `${index === 0 ? "" : ","}${JSON.stringify(key)}:` : `${index === 0 ? "\n" : ",\n"}${JSON_INDENT.repeat(childDepth)}${JSON.stringify(key)}: `
      });
    }
  }
  return chunks.join("");
}
function renderValue(value) {
  return typeof value === "string" ? value : renderJsonValue(value);
}
function createRunCodeTool(registry, options) {
  const { requireRuntime, peekRuntime, maxParallel, shapeDispatchLog } = options;
  const definition = defineTool({
    name: RUN_CODE_NAME,
    description: TYPESCRIPT_FLAVOR.description,
    parameters: {
      code: {
        type: "string",
        required: true,
        description: TYPESCRIPT_FLAVOR.codeDescription
      },
      description: {
        type: "string",
        required: true,
        description: RUN_CODE_DESCRIPTION_PARAM_DESCRIPTION
      },
      ...RUN_CODE_CONTROLS
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          logs: {
            type: "array",
            required: true,
            items: { type: "string" }
          },
          result: { type: "json" },
          sandbox: {
            type: "object",
            additionalProperties: false,
            properties: {
              mode: {
                type: "string",
                required: true,
                enum: [
                  "read-only",
                  "workspace-write",
                  "danger-full-access"
                ]
              },
              denied: {
                type: "boolean",
                required: true
              },
              enforcement: {
                type: "string",
                enum: ["full", "partial"]
              }
            }
          }
        }
      },
      render: (_args, value) => {
        const rendered = value.result === void 0 ? "" : renderValue(value.result);
        const parts = [value.logs.join("\n"), rendered].filter((part) => part.length > 0);
        if (value.sandbox?.enforcement === "partial") parts.push("File sandbox enforcement is partial on this host.");
        if (value.sandbox?.denied) parts.push(`The ${value.sandbox.mode} file sandbox denied an operation.${escalationGuidance(peekRuntime())}`);
        return [{
          type: "text",
          text: parts.length > 0 ? parts.join("\n") : "(run_code completed with no output)"
        }];
      }
    },
    async execute(args, exec) {
      if (args.description.trim().length === 0) throw new Error("invalid description: expected a non-empty string");
      const runtime = requireRuntime();
      validateEscalationArgs(args.sandbox_permissions, args.justification);
      if (args.timeoutMs !== void 0 && runtime.timeout === void 0) throw new Error("timeoutMs is not available for this PTC runtime");
      if (args.timeoutMs !== void 0 && (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0)) throw new Error("invalid timeoutMs: expected a positive finite number");
      const standingPolicy = runtime.sandboxMode === void 0 ? void 0 : options.resolveSandboxPolicy(exec);
      let policy = standingPolicy;
      if (args.sandbox_permissions !== void 0 && args.justification !== void 0) {
        if (standingPolicy === void 0) throw new Error("sandbox_permissions is not available for this PTC runtime");
        const approvedMode = await approveEscalation({
          requestedMode: args.sandbox_permissions,
          justification: args.justification,
          effectiveMode: standingPolicy.mode,
          subject: "program"
        }, {
          approver: options.peekApprover(),
          agent: exec.agent,
          callId: exec.callId,
          toolName: RUN_CODE_NAME,
          signal: exec.signal
        });
        policy = {
          ...standingPolicy,
          mode: approvedMode
        };
      }
      exec.signal.throwIfAborted();
      const runController = new AbortController();
      const onOuterAbort = () => {
        runController.abort(exec.signal.reason);
      };
      exec.signal.addEventListener("abort", onOuterAbort, { once: true });
      let dispatches = 0;
      const pendingQueue = [];
      const inFlight = /* @__PURE__ */ new Set();
      const logWork = /* @__PURE__ */ new Set();
      const commitQueue = [];
      let exclusiveActive = false;
      let driving = false;
      let driverRun = Promise.resolve();
      let wake;
      const wakeup = () => {
        const release = wake;
        wake = void 0;
        release?.();
      };
      const drive = () => {
        if (driving) return driverRun;
        driving = true;
        driverRun = (async () => {
          try {
            for (; ; ) {
              const signal = new Promise((resolve4) => {
                wake = resolve4;
              });
              const commitHead = commitQueue[0];
              if (commitHead !== void 0 && commitHead.settled) {
                commitQueue.shift();
                await commitHead.commit();
                if (commitHead.mode === "exclusive") exclusiveActive = false;
                continue;
              }
              const head = pendingQueue[0];
              if (head !== void 0) {
                if (runController.signal.aborted) {
                  pendingQueue.shift();
                  head.abandon();
                  continue;
                }
                const mode2 = head.classify();
                if (!exclusiveActive && (mode2 === "exclusive" ? inFlight.size === 0 : inFlight.size < maxParallel)) {
                  if (mode2 === "exclusive") exclusiveActive = true;
                  head.mode = mode2;
                  pendingQueue.shift();
                  commitQueue.push(head);
                  await head.start();
                  const flight = head.flight.finally(() => {
                    inFlight.delete(flight);
                    wakeup();
                  });
                  inFlight.add(flight);
                  continue;
                }
              }
              if (pendingQueue.length === 0 && commitQueue.length === 0 && inFlight.size === 0) return;
              await signal;
            }
          } finally {
            driving = false;
            wake = void 0;
          }
        })();
        return driverRun;
      };
      const drainDispatches = async () => {
        await drive();
        while (logWork.size > 0) await Promise.allSettled([...logWork]);
      };
      const runOver = () => runController.signal.aborted;
      const binding = (schema) => async (rawArgs) => {
        const { name: name2 } = schema;
        if (runOver()) throw new Error(`run_code run is over (${String(runController.signal.reason)}); ${name2} not dispatched`);
        const normalized = jsonNormalizeArgs(rawArgs);
        const n = ++dispatches;
        const subCallId = brandString(`${String(exec.callId)}:ptc:${n}`);
        const input = {
          callId: subCallId,
          rootCallId: exec.rootCallId,
          name: name2,
          schema,
          arguments: normalized.dispatched,
          ...exec.agent ? { agent: exec.agent } : {},
          parent: exec.token,
          signal: runController.signal
        };
        const scheduler = registry[TOOL_RUNTIME_SCHEDULER];
        const outcome = await new Promise((resolve4, reject) => {
          let parked;
          const settle = (result) => {
            resolve4(result.isError ? {
              isError: true,
              message: result.error.message
            } : {
              isError: false,
              value: result.value
            });
            const agent = exec.agent;
            if (agent === void 0) return;
            const task = (async () => {
              const logged = await shapeDispatchLog({
                exec,
                agent,
                subCallId,
                name: name2,
                isError: result.isError,
                content: result.content
              });
              agent.session.append("tool/ptc-dispatch", {
                rootCallId: exec.rootCallId,
                parentCallId: exec.callId,
                subCallId,
                name: name2,
                arguments: normalized.logged,
                isError: result.isError,
                ...result.error?.info === void 0 ? {} : { error: result.error.info },
                content: logged
              });
            })().finally(() => {
              logWork.delete(task);
            });
            logWork.add(task);
          };
          pendingQueue.push({
            flight: Promise.resolve(),
            settled: false,
            classify: () => registry.executionMode(input).kind,
            abandon: () => {
              reject(/* @__PURE__ */ new Error(`run_code run is over (${String(runController.signal.reason)}); ${name2} tool call abandoned`));
            },
            async start() {
              exec.agent?.session.append("tool/ptc-dispatch-start", {
                rootCallId: exec.rootCallId,
                parentCallId: exec.callId,
                subCallId,
                name: name2,
                arguments: normalized.logged
              });
              const prepared = await scheduler.prepare(input);
              if (prepared.kind === "dispatch") {
                this.flight = scheduler.dispatch(prepared.exec).then((dispatchOutcome) => {
                  parked = {
                    kind: dispatchOutcome.kind,
                    exec: prepared.exec,
                    result: dispatchOutcome.result
                  };
                  this.settled = true;
                });
                return;
              }
              parked = {
                kind: prepared.kind,
                exec: prepared.exec,
                result: prepared.result
              };
              this.settled = true;
            },
            async commit() {
              if (parked === void 0) return;
              const result = parked.kind === "post-result" ? await scheduler.finalize(parked.exec, parked.result) : scheduler.finish(parked.exec, parked.result);
              if (!result.isError && result.content.some((block) => block.type === "image")) exec.deferContext(createUserMessage({
                content: result.content,
                source: { kind: "ptc-mode" }
              }));
              for (const context of result.additionalContexts ?? []) exec.deferContext(context);
              if (result.concludesTurn) exec.concludeTurn();
              settle(result);
              while (logWork.size > maxParallel) await Promise.race(logWork);
            }
          });
          wakeup();
          drive();
        });
        if (runOver()) throw new Error(`run_code run is over (${String(runController.signal.reason)}); ${name2} result discarded`);
        if (outcome.isError) throw new Error(outcome.message);
        return outcome.value;
      };
      const functions = /* @__PURE__ */ Object.create(null);
      for (const schema of registry.schemas(exec.agent)) {
        if (schema.name === "run_code") continue;
        Object.defineProperty(functions, schema.name, {
          enumerable: true,
          value: binding(deepFreeze(schema))
        });
      }
      try {
        let result;
        try {
          result = await runtime.run(runtime.resolve({
            program: args.code,
            bindings: [{
              global: "tools",
              functions,
              errorClass: {
                name: "ToolCallError",
                memberNameProperty: "toolName"
              }
            }],
            signal: runController.signal,
            ...exec.agent?.session.header.cwd !== void 0 ? { cwd: exec.agent.session.header.cwd } : {},
            ...policy !== void 0 ? { sandboxPolicy: policy } : {},
            ...args.timeoutMs !== void 0 ? { timeoutMs: args.timeoutMs } : {}
          }));
        } finally {
          runController.abort("run_code settled");
          await drainDispatches();
        }
        if (result.error) {
          const logsText = result.logs.length > 0 ? `
Captured output:
${result.logs.join("\n")}` : "";
          const sandboxText = result.sandbox === void 0 ? "" : `
File sandbox: ${result.sandbox.mode}${result.sandbox.enforcement === void 0 ? "" : `; enforcement: ${result.sandbox.enforcement}`}${result.sandbox.denied ? "; operation denied" : ""}.`;
          throw new CodeRunFailedError(`code run failed (${result.error.kind}): ${result.error.message}${logsText}${sandboxText}${result.sandbox?.denied ? escalationGuidance(runtime) : ""}`);
        }
        return {
          logs: result.logs,
          ...result.sandbox === void 0 ? {} : { sandbox: result.sandbox },
          ...result.value !== void 0 ? { result: result.value } : {}
        };
      } finally {
        exec.signal.removeEventListener("abort", onOuterAbort);
      }
    },
    presentCall: (args) => ({
      card: "generic",
      title: args.description,
      kind: "execute",
      rawInput: args.code
    })
  });
  Object.defineProperty(definition, "description", {
    enumerable: true,
    get: () => {
      const runtime = peekRuntime();
      const instructions = runtime?.executionInstructions;
      return resolveFlavor(peekRuntime).description + (instructions ? ` ${instructions}` : "") + (runtime === void 0 ? "" : " The working directory is the Session's current directory.") + escalationGuidance(runtime);
    }
  });
  Object.defineProperty(definition, "parameters", {
    enumerable: true,
    get: () => parameterSchemaSpecToJsonSchema({
      code: {
        type: "string",
        required: true,
        description: resolveFlavor(peekRuntime).codeDescription
      },
      description: {
        type: "string",
        required: true,
        description: RUN_CODE_DESCRIPTION_PARAM_DESCRIPTION
      },
      ...controlParameters(peekRuntime())
    })
  });
  return definition;
}
var IDENTIFIER$1 = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
function renderKey(name2) {
  return IDENTIFIER$1.test(name2) ? name2 : JSON.stringify(name2);
}
function pad$1(indent) {
  return "  ".repeat(indent);
}
function docLines$1(description, indent) {
  if (typeof description !== "string" || description.length === 0) return [];
  const collapsed = description.replace(/\s+/g, " ").trim();
  return [`${pad$1(indent)}/** ${collapsed.replaceAll("*/", String.raw`*\/`)} */`];
}
function renderScalar(value) {
  return JSON.stringify(value);
}
function renderConstrainedScalar$1(node, type) {
  const broad = type === "integer" ? "number" : type;
  if (Object.hasOwn(node, "const")) return renderScalar(node.const);
  if (Object.hasOwn(node, "enum")) return node.enum.map(renderScalar).join(" | ");
  return broad;
}
function typeDocumentFrom(parts) {
  return {
    parts,
    containsUnionOrIntersection: parts.some((part) => typeof part === "string" ? part.includes("|") || part.includes("&") : part.containsUnionOrIntersection)
  };
}
function typeDocument(...parts) {
  return typeDocumentFrom(parts);
}
function flattenTypeDocument(document) {
  const chunks = [];
  const tasks = [document];
  for (let task = tasks.pop(); task !== void 0; task = tasks.pop()) {
    if (typeof task === "string") {
      chunks.push(task);
      continue;
    }
    for (let index = task.parts.length - 1; index >= 0; index--) {
      const part = task.parts[index];
      if (part !== void 0) tasks.push(part);
    }
  }
  return chunks.join("");
}
function schemaRenderFrame(node, indent) {
  return {
    node,
    indent,
    phase: "start",
    children: [],
    childIndex: 0,
    childDocuments: [],
    entries: []
  };
}
function renderSupportedSchema(schema, indent) {
  const frames = [schemaRenderFrame(schema, indent)];
  let rootDocument;
  const finish = (document) => {
    frames.pop();
    const parent = frames.at(-1);
    if (parent === void 0) rootDocument = document;
    else parent.childDocuments.push(document);
  };
  while (frames.length > 0) {
    const frame = frames.at(-1);
    if (frame === void 0) break;
    if (frame.phase === "children") {
      if (frame.childIndex < frame.children.length) {
        const child = frame.children[frame.childIndex];
        if (child === void 0) throw new Error("missing schema render child");
        frame.childIndex++;
        frames.push(schemaRenderFrame(child.node, child.indent));
        continue;
      }
      if (frame.kind === "oneOf") {
        const parts2 = [];
        for (let index = 0; index < frame.childDocuments.length; index++) {
          if (index > 0) parts2.push(" | ");
          const child = frame.childDocuments[index];
          if (child !== void 0) parts2.push(child);
        }
        finish(typeDocumentFrom(parts2));
        continue;
      }
      if (frame.kind === "array") {
        const child = frame.childDocuments[0];
        if (child === void 0) throw new Error("missing array item type");
        finish(child.containsUnionOrIntersection ? typeDocument("(", child, ")[]") : typeDocument(child, "[]"));
        continue;
      }
      const required = new Set(frame.node.required);
      const parts = ["{"];
      for (let index = 0; index < frame.entries.length; index++) {
        const entry = frame.entries[index];
        const child = frame.childDocuments[index];
        if (entry === void 0 || child === void 0) throw new Error("missing object property type");
        const [name2, prop] = entry;
        for (const line of docLines$1(prop.description, frame.indent + 1)) parts.push("\n", line);
        parts.push("\n", `${pad$1(frame.indent + 1)}${renderKey(name2)}${required.has(name2) ? "" : "?"}: `, child, ";");
      }
      parts.push("\n", `${pad$1(frame.indent)}}`);
      const declared = typeDocumentFrom(parts);
      finish(frame.node.additionalProperties === false ? declared : typeDocument(declared, " & Record<string, JsonValue>"));
      continue;
    }
    const node = frame.node;
    if (node.oneOf !== void 0) {
      frame.kind = "oneOf";
      frame.children = Array.from(node.oneOf, (child) => ({
        node: child,
        indent: frame.indent
      }));
      frame.childIndex = 0;
      frame.childDocuments = [];
      frame.phase = "children";
      continue;
    }
    if (node.type === void 0) {
      finish(typeDocument("JsonValue"));
      continue;
    }
    switch (node.type) {
      case "string":
      case "number":
      case "integer":
      case "boolean":
      case "null":
        finish(typeDocument(renderConstrainedScalar$1(node, node.type)));
        break;
      case "array":
        if (node.items === void 0) finish(typeDocument("JsonValue[]"));
        else {
          frame.kind = "array";
          frame.children = [{
            node: node.items,
            indent: frame.indent
          }];
          frame.childIndex = 0;
          frame.childDocuments = [];
          frame.phase = "children";
        }
        break;
      case "object": {
        const open = node.additionalProperties !== false;
        const entries = Object.entries(node.properties ?? {});
        if (entries.length === 0) finish(typeDocument(open ? "Record<string, JsonValue>" : "Record<string, never>"));
        else {
          frame.kind = "object";
          frame.entries = entries;
          frame.children = entries.map(([, child]) => ({
            node: child,
            indent: frame.indent + 1
          }));
          frame.childIndex = 0;
          frame.childDocuments = [];
          frame.phase = "children";
        }
        break;
      }
      /* v8 ignore next -- assertSupportedJsonSchema narrowed this closed type union. */
      default:
        finish(typeDocument("unknown"));
    }
  }
  return rootDocument ?? typeDocument("unknown");
}
function jsonSchemaToTs(schema, indent = 0) {
  try {
    assertSupportedJsonSchema(schema);
    return flattenTypeDocument(renderSupportedSchema(schema, indent));
  } catch {
    return "unknown";
  }
}
var SDK_INSTRUCTIONS$1 = `## Writing code for run_code

\`run_code\` takes two required arguments: \`code\` \u2014 the body of an async TypeScript function (erasable syntax only \u2014 no \`enum\` or namespaces; type annotations are advisory, the code runs type-stripped) \u2014 and \`description\`, a short summary of what the program does. The declarations below are SDK bindings for this program. A declaration does not make its name a directly callable tool; only names supplied as separate tool schemas may be called directly.`;
var SDK_PROGRAM_INSTRUCTIONS = `Inside the program:

- Call tools as \`await tools.name(args)\` \u2014 quoted access for exotic names: \`tools["my-tool"](args)\`. Every call resolves to the tool's typed canonical JSON value. Tool arguments must be lossless JSON.
- A FAILED tool call rejects with \`ToolCallError\`, whose \`toolName\` identifies the failed tool and whose \`message\` is human-readable \u2014 \`try/catch\` it to handle and continue.
- Independent read-only calls MAY overlap under \`Promise.all\` (safe calls run concurrently; mutating calls run alone, in submission order). Sequence dependent work with \`await\`.
- Emit results with \`return\` and/or \`console.log(...)\`. Only what you print or return is program output. A successful tool result containing an image is attached after the run so you can inspect it on the next step; every other intermediate result stays out of the conversation, so extract just what you need.

Program-only SDK bindings:`;
function acceptsExampleString(schema, value) {
  return schema?.type === "string" && (schema.const === void 0 || schema.const === value) && (schema.enum === void 0 || schema.enum.includes(value));
}
function renderBashExample(schemas) {
  const bash = schemas.find((schema) => schema.name === "bash");
  if (bash === void 0) return "";
  const parameters = bash.parameters;
  if (parameters.type !== "object") return "";
  const required = parameters.required ?? [];
  if (required.some((name2) => name2 !== "command" && name2 !== "description")) return "";
  if (!acceptsExampleString(parameters.properties?.command, "pwd")) return "";
  const needsDescription = required.includes("description");
  if (needsDescription && !acceptsExampleString(parameters.properties?.description, "Show current directory")) return "";
  return ` When no separate \`bash\` schema is supplied, invoke a declared \`bash\` binding inside \`run_code\`:

\`run_code({ code: "return await tools.bash({ command: 'pwd'${needsDescription ? ", description: 'Show current directory'" : ""} })", description: "Show current directory" })\``;
}
function renderToolsSdk(schemas) {
  const sorted = [...schemas].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const argsMembers = [];
  const outputMembers = [];
  for (const schema of sorted) {
    argsMembers.push(...docLines$1(schema.description, 1));
    argsMembers.push(`${pad$1(1)}${renderKey(schema.name)}: ${jsonSchemaToTs(schema.parameters, 1)};`);
    outputMembers.push(`${pad$1(1)}${renderKey(schema.name)}: ${jsonSchemaToTs(schema.output, 1)};`);
  }
  const declaration = [
    `interface ToolArgsMap {${argsMembers.length > 0 ? `
${argsMembers.join("\n")}
` : ""}}`,
    `interface ToolOutputMap {${outputMembers.length > 0 ? `
${outputMembers.join("\n")}
` : ""}}`,
    "type ToolName = keyof ToolOutputMap",
    [
      "declare class ToolCallError extends Error {",
      '  readonly name: "ToolCallError";',
      "  readonly toolName: ToolName;",
      "}"
    ].join("\n"),
    [
      "declare const tools: {",
      "  [K in ToolName]: (args: ToolArgsMap[K]) => Promise<ToolOutputMap[K]>;",
      "}"
    ].join("\n")
  ].join("\n\n");
  return `${SDK_INSTRUCTIONS$1}${renderBashExample(sorted)}

${SDK_PROGRAM_INSTRUCTIONS}

\`\`\`ts
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

${declaration}
\`\`\``;
}
var IDENTIFIER = new RegExp("^[\\p{XID_Start}_]\\p{XID_Continue}*$", "u");
function isBareIdentifier(name2) {
  return IDENTIFIER.test(name2) && name2.normalize("NFKC") === name2;
}
var RESERVED = /* @__PURE__ */ new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
  "__debug__"
]);
var TYPING_ORDER = [
  "Any",
  "Literal",
  "NotRequired",
  "Protocol",
  "TypedDict"
];
function pad(indent) {
  return "    ".repeat(indent);
}
var UNPRINTABLE = /[\u0000-\u0008\u000e-\u001f\u007f-\u009f]/g;
var LONE_SURROGATE = /[\ud800-\udfff]/gu;
function describe(schema) {
  const description = schema.description;
  if (typeof description !== "string") return void 0;
  const collapsed = description.replace(/\s+/g, " ").replace(UNPRINTABLE, (char) => `\\x${char.charCodeAt(0).toString(16).padStart(2, "0")}`).replace(LONE_SURROGATE, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`).trim();
  return collapsed.length === 0 ? void 0 : collapsed;
}
function docLines(description, indent) {
  const collapsed = describe({ description });
  if (collapsed === void 0) return [];
  const escaped = collapsed.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return [`${pad(indent)}"""${escaped}"""`];
}
function camelCase(raw) {
  const joined = raw.split(/[^\p{XID_Continue}]+|_+/u).filter((part) => part.length > 0).map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join("").normalize("NFKC");
  return (new RegExp("^\\p{XID_Start}", "u").test(joined) ? joined : `Tool${joined}`).normalize("NFKC");
}
var MAX_CLASS_NAME_BASE = 120;
var MAX_LIST_NESTING = 180;
function capClassNameBase(base) {
  if (base.length <= MAX_CLASS_NAME_BASE) return base;
  const capped = base.slice(0, MAX_CLASS_NAME_BASE);
  return /[\uD800-\uDBFF]$/.test(capped) ? capped.slice(0, -1) : capped;
}
function allocateClassName(base, state) {
  const capped = capClassNameBase(base);
  let name2 = capped;
  if (state.usedClassNames.has(name2)) {
    let n = state.nextClassCounter.get(capped) ?? 2;
    while (state.usedClassNames.has(`${capped}${n}`)) n++;
    name2 = `${capped}${n}`;
    state.nextClassCounter.set(capped, n + 1);
  }
  state.usedClassNames.add(name2);
  return name2;
}
function childClassName(base, segment) {
  return capClassNameBase(`${base}${segment}`.normalize("NFKC"));
}
function pyScalar(value) {
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isInteger(value) && !Number.isSafeInteger(value)) return BigInt(value).toString();
  return String(value);
}
function renderConstrainedScalar(node, broad, state) {
  if (node.const !== void 0) {
    state.typing.add("Literal");
    return `Literal[${pyScalar(node.const)}]`;
  }
  if (node.enum !== void 0) {
    state.typing.add("Literal");
    return `Literal[${node.enum.map(pyScalar).join(", ")}]`;
  }
  return broad;
}
function renderType(schema, className, state) {
  const newFrame = (schema2, className2, listDepth) => ({
    schema: schema2,
    className: className2,
    phase: "start",
    listDepth,
    children: [],
    childIndex: 0,
    childTypes: [],
    entries: []
  });
  try {
    assertSupportedJsonSchema(schema);
    const frames = [newFrame(schema, className, 0)];
    let result;
    const finish = (type) => {
      frames.pop();
      const parent = frames.at(-1);
      if (parent === void 0) result = type;
      else parent.childTypes.push(type);
    };
    while (frames.length > 0) {
      const frame = frames.at(-1);
      if (frame === void 0) break;
      if (frame.phase === "children") {
        if (frame.childIndex < frame.children.length) {
          const child = frame.children[frame.childIndex];
          if (child === void 0) throw new Error("missing python render child");
          frame.childIndex++;
          frames.push(newFrame(child.schema, child.className, child.listDepth));
          continue;
        }
        if (frame.kind === "oneOf") {
          let union = "";
          for (const [index, childType] of frame.childTypes.entries()) union = index === 0 ? childType : `${union} | ${childType}`;
          finish(union);
          continue;
        }
        if (frame.kind === "array") {
          finish(`list[${frame.childTypes[0] ?? "Any"}]`);
          continue;
        }
        const node2 = frame.node;
        const name2 = frame.allocated;
        if (node2 === void 0 || name2 === void 0) throw new Error("missing typeddict frame state");
        const required = new Set(node2.required);
        const lines = [`class ${name2}(TypedDict):`];
        for (let index = 0; index < frame.entries.length; index++) {
          const entry = frame.entries[index];
          const fieldType = frame.childTypes[index];
          if (entry === void 0 || fieldType === void 0) throw new Error("missing typeddict field type");
          const [field, fieldSchema] = entry;
          const description = describe(fieldSchema);
          if (description !== void 0) lines.push(`${pad(1)}# ${description}`);
          if (required.has(field)) lines.push(`${pad(1)}${field}: ${fieldType}`);
          else {
            state.typing.add("NotRequired");
            lines.push(`${pad(1)}${field}: NotRequired[${fieldType}]`);
          }
        }
        if (node2.additionalProperties !== false) lines.push(`${pad(1)}# Additional keys beyond those declared are allowed.`);
        if (lines.length === 1) lines.push(`${pad(1)}pass`);
        state.classes.push(lines.join("\n"));
        finish(name2);
        continue;
      }
      frame.phase = "children";
      const node = frame.schema;
      if (node.oneOf !== void 0) {
        frame.kind = "oneOf";
        frame.children = node.oneOf.map((branch, index) => ({
          schema: branch,
          className: childClassName(frame.className, `${index + 1}`),
          listDepth: frame.listDepth
        }));
        continue;
      }
      if (node.type === void 0) {
        state.typing.add("Any");
        finish("Any");
        continue;
      }
      switch (node.type) {
        case "string":
          finish(renderConstrainedScalar(node, "str", state));
          break;
        case "number":
          finish(renderConstrainedScalar(node, "float", state));
          break;
        case "integer":
          finish(renderConstrainedScalar(node, "int", state));
          break;
        case "boolean":
          finish(renderConstrainedScalar(node, "bool", state));
          break;
        case "null":
          finish("None");
          break;
        case "array":
          if (node.items === void 0) {
            state.typing.add("Any");
            finish("list[Any]");
            break;
          }
          if (frame.listDepth >= MAX_LIST_NESTING) {
            state.typing.add("Any");
            finish("Any");
            break;
          }
          frame.kind = "array";
          frame.children = [{
            schema: node.items,
            className: frame.className,
            listDepth: frame.listDepth + 1
          }];
          break;
        case "object": {
          const entries = Object.entries(node.properties ?? {});
          if (className === "" || !entries.every(([name2]) => isBareIdentifier(name2) && !RESERVED.has(name2) && !(name2.startsWith("__") && !name2.endsWith("__")))) {
            state.typing.add("Any");
            finish("dict[str, Any]");
            break;
          }
          if (entries.length === 0 && node.additionalProperties !== false) {
            state.typing.add("Any");
            finish("dict[str, Any]");
            break;
          }
          frame.kind = "typeddict";
          frame.node = node;
          frame.allocated = allocateClassName(frame.className, state);
          state.typing.add("TypedDict");
          frame.entries = entries;
          frame.children = entries.map(([field, child]) => ({
            schema: child,
            className: childClassName(frame.allocated ?? "", camelCase(field)),
            listDepth: 1
          }));
          break;
        }
        /* v8 ignore next 4 -- assertSupportedJsonSchema narrowed this closed type union. */
        default:
          state.typing.add("Any");
          finish("Any");
      }
    }
    return result ?? "Any";
  } catch {
    state.typing.add("Any");
    return "Any";
  }
}
var SDK_INSTRUCTIONS = `## Writing code for run_code

\`run_code\` takes two required arguments: \`code\` \u2014 the body of an async Python function (top-level \`await\` and \`return\` both work) \u2014 and \`description\`, a short summary of what the program does. At run time exactly two of the names declared below are bound: \`tools\` and \`ToolCallError\`. Everything else is a STATIC STUB describing argument and return types \u2014 in particular the \`TypedDict\` classes do NOT exist at run time, so build arguments as plain \`dict\`/\`list\` JSON values: \`await tools.name({"field": 1})\`, never \`FooArgs(field=1)\`, which raises \`NameError\`. Inside the program:

- Call tools as \`await tools.name(args)\` \u2014 subscript access for exotic, reserved, or underscore-leading names: \`await tools["my-tool"](args)\`. Every call resolves to the tool's typed canonical JSON value (each method's return type below). Tool arguments must be lossless JSON.
- A FAILED tool call raises \`ToolCallError\`, whose \`toolName\` identifies the failed tool and whose message is human-readable \u2014 wrap in \`try/except\` to handle and continue.
- Independent read-only calls MAY overlap under \`asyncio.gather\` (safe calls run concurrently; mutating calls run alone, in submission order). Sequence dependent work with \`await\`.
- Emit the run's answer with \`print(...)\` and/or a top-level \`return <value>\`; the returned value must be lossless JSON. Only what you print and return is program output. A successful tool result containing an image is attached after the run so you can inspect it on the next step; every other intermediate result stays out of the conversation, so extract just what you need.

The available tools:`;
function renderToolsSdkPy(schemas) {
  const sorted = [...schemas].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  const state = {
    classes: [],
    usedClassNames: /* @__PURE__ */ new Set(),
    nextClassCounter: /* @__PURE__ */ new Map(),
    typing: /* @__PURE__ */ new Set(["Protocol"])
  };
  const members = [];
  let statements = 0;
  for (const schema of sorted) {
    const argType = renderType(schema.parameters, `${camelCase(schema.name)}Args`, state);
    const outputType = renderType(schema.output, `${camelCase(schema.name)}Output`, state);
    if (isBareIdentifier(schema.name) && !RESERVED.has(schema.name) && !schema.name.startsWith("_")) {
      const doc = docLines(schema.description, 2);
      members.push(doc.length > 0 ? `${pad(1)}async def ${schema.name}(self, args: ${argType}) -> ${outputType}:` : `${pad(1)}async def ${schema.name}(self, args: ${argType}) -> ${outputType}: ...`);
      members.push(...doc);
      statements += 1;
    } else {
      members.push(`${pad(1)}# tools[${JSON.stringify(schema.name)}](args: ${argType}) -> ${outputType}`);
      const description = describe(schema);
      if (description !== void 0) members.push(`${pad(1)}#   ${description}`);
    }
  }
  const body = (statements > 0 ? members : [`${pad(1)}pass`, ...members]).join("\n");
  const imports = TYPING_ORDER.filter((symbol) => state.typing.has(symbol));
  const classBlock = state.classes.length > 0 ? `${state.classes.join("\n\n")}

` : "";
  return `${SDK_INSTRUCTIONS}

\`\`\`python
${`from typing import ${imports.join(", ")}

class ToolCallError(Exception):
    toolName: str

${classBlock}class Tools(Protocol):
${body}

tools: Tools`}
\`\`\``;
}
var PTC_ONLY_INSTRUCTION = `\`${RUN_CODE_NAME}\` is the only tool you can call directly \u2014 a tool call naming any other tool fails. Reach every tool the SDK declares below from inside the program.`;
var SDK_RENDERERS = {
  typescript: renderToolsSdk,
  python: renderToolsSdkPy
};
var TOOL_RUNTIME_SCHEDULER = /* @__PURE__ */ Symbol("@deepseek-ai/dsh-tools.scheduler");
var TOOL_ABORTED = "ABORTED";
var TOOL_ABORTED_BEFORE_DISPATCH = "ABORTED_BEFORE_DISPATCH";
var ToolNotFoundError = class extends HarnessError {
  /**
  * @param toolName - the name the caller asked for.
  * @param reachableFrom - how the model reaches this tool instead, when the
  *   name IS visible and only the presentation denies calling it directly.
  *   Omitted for a name that is registered nowhere.
  */
  constructor(toolName, reachableFrom) {
    super(reachableFrom === void 0 ? `unknown tool "${toolName}"` : `unknown tool "${toolName}": ${reachableFrom}`, "UNKNOWN_TOOL");
    this.name = "ToolNotFoundError";
  }
};
var ToolOutputError = class extends HarnessError {
  /** Schema/value violations in validation order. */
  violations;
  constructor(toolName, violations) {
    super(`tool "${toolName}" returned invalid output: ${violations.join("; ")}`, "INVALID_TOOL_OUTPUT");
    this.name = "ToolOutputError";
    this.violations = violations;
  }
};
function projectionError(toolName, projector2, error) {
  return new ToolOutputError(toolName, [`output.${projector2} failed: ${errorMessage2(error)}`]);
}
function snapshotProjection(toolName, projector2, candidate) {
  try {
    const detached = snapshotJsonValue(candidate);
    if (detached === void 0) throw new ToolOutputError(toolName, [`output.${projector2} returned non-lossless JSON`]);
    return detached;
  } catch (error) {
    if (error instanceof ToolOutputError) throw error;
    throw projectionError(toolName, projector2, error);
  }
}
function snapshotToolValue(toolName, candidate) {
  try {
    const detached = snapshotJsonValue(candidate);
    if (detached === void 0) throw new ToolOutputError(toolName, ["value is not lossless JSON"]);
    return detached;
  } catch (error) {
    if (error instanceof ToolOutputError) throw error;
    throw new ToolOutputError(toolName, [`value snapshot failed: ${errorMessage2(error)}`]);
  }
}
function errorMessage2(error) {
  try {
    if (error instanceof Error) return error.message;
    if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") return error.message;
    return String(error);
  } catch {
    return "<unprintable thrown value>";
  }
}
function failureMessageFromContent(content) {
  const text = content.map((block) => block.type === "text" ? block.text : `[${block.type} content]`).join("\n");
  return text.length > 0 ? text : "tool result blocked by post-execute policy";
}
function materializePresentation(candidate) {
  const detached = snapshotJsonValue(candidate);
  if (detached === void 0) throw new TypeError("tool result must be losslessly JSON-serializable");
  return deepFreeze(detached);
}
function errorInfo(error) {
  try {
    return error instanceof HarnessError ? {
      name: error.name,
      code: error.code
    } : void 0;
  } catch {
    return;
  }
}
var ToolLayer = class {
  tools;
  restrictions = new AnonymousEntries();
  guards = new AnonymousEntries();
  /**
  * Presentation this scope's agent declared for itself, shadowing the
  * deployment default. One cell rather than an entry table: two answers to
  * "which form does the model see" is a contradiction, not a merge.
  */
  mode;
  constructor(scope) {
    this.tools = new NamedEntries((name2) => /* @__PURE__ */ new Error(scope === void 0 ? `tool "${name2}" is already registered (for a per-agent variant, register through that agent's \`agent.ctx\` instead)` : `tool "${name2}" is already registered in this scope`));
  }
  /** Whether every contribution table in this aggregate layer is empty. */
  isEmpty() {
    return this.tools.isEmpty() && this.restrictions.isEmpty() && this.guards.isEmpty() && this.mode === void 0;
  }
  /** Whether every compiled restriction in this layer admits a global tool name. */
  admits(name2) {
    for (const filter of this.restrictions.values()) if (filter.allow !== void 0 && !filter.allow.has(name2) || filter.deny !== void 0 && filter.deny.has(name2)) return false;
    return true;
  }
  /** First monotonic denial from this layer's live guard registrations. */
  guardReason(exec) {
    for (const guard of this.guards.values()) {
      const reason = guard(exec);
      if (reason !== void 0) return reason;
    }
  }
};
function resolveMaxParallelSubCalls(value) {
  const maxParallelSubCalls = value ?? 10;
  if (!Number.isInteger(maxParallelSubCalls) || maxParallelSubCalls < 1) throw new Error("maxParallelSubCalls must be a positive integer");
  return maxParallelSubCalls;
}
var ToolRuntime = class extends Service {
  static inject = ["systemPrompt"];
  static Config = src_default.object({
    mode: src_default.union([
      "native",
      "ptc",
      "both"
    ]).default("native"),
    maxParallelSubCalls: src_default.natural().min(1).default(10)
  });
  /** Internal staged view consumed by `dsh-agent-loop`'s parallel scheduler. */
  [TOOL_RUNTIME_SCHEDULER] = {
    prepare: (exec) => this.prepareScheduledExecution(exec),
    dispatch: (exec) => this.dispatchScheduledExecution(exec),
    finalize: (exec, result) => this.finalizeScheduledExecution(exec, result),
    finish: (exec, result) => this.finishScheduledExecution(exec, result)
  };
  /** Context deferred by a running tool body, keyed by its scheduler-owned execution. */
  deferredContexts = /* @__PURE__ */ new WeakMap();
  /** Executions whose tool body declared the current turn complete. */
  concludingExecutions = /* @__PURE__ */ new WeakSet();
  /** Original caller cancellation, kept outside the wrapper-mutable execution object. */
  cancellationStates = /* @__PURE__ */ new WeakMap();
  /** Definition-owned final content transform snapshotted before policy begins. */
  contentFinalizers = /* @__PURE__ */ new WeakMap();
  /** Execution-prepared content installed before post-execute policy. */
  contentProjectors = /* @__PURE__ */ new WeakMap();
  layers = new ScopedLayers((scope) => new ToolLayer(scope), () => {
    this.ctx.emit("tools/change");
  });
  /** Presentation for scopes that declare none; {@link presentAs} shadows it per scope. */
  defaultMode;
  maxParallelSubCalls;
  /**
  * Reserved presentation transport, kept outside the filterable registration
  * layers. Built on first need rather than at construction: which agents run
  * a PTC mode is no longer known when the service is constructed, and the
  * transport is stateless beyond its closures over `this`.
  */
  ptcTransport;
  constructor(ctx, config = {}) {
    super(ctx, "tools");
    this.defaultMode = config.mode ?? "native";
    this.maxParallelSubCalls = resolveMaxParallelSubCalls(config.maxParallelSubCalls);
    ctx.systemPrompt.tools((context) => this.wireSchemas(context.scope));
    if (this.defaultMode !== "native") {
      ctx.systemPrompt.section(this.collapseSection());
      ctx.systemPrompt.section(this.sdkSection());
    }
  }
  /**
  * The prompt statement of the `ptc` executor collapse, registered wherever
  * {@link sdkSection} is and rendering empty outside an effective `ptc`.
  *
  * Every tool contributes its own guidance section naming its tool, none of
  * them qualify how that tool is reached, and they all render before the SDK.
  * Without this the model reads a catalog of tools it is told to use and no
  * statement that only `run_code` may be called, so it emits a native call,
  * receives `UNKNOWN_TOOL` for a tool the prompt just declared, and concludes
  * the deployment is inconsistent. Its order places the rule before that
  * guidance rather than after it.
  *
  * `both` renders empty: native calls do execute there, so the rule is false.
  * @returns the section registration.
  */
  collapseSection() {
    return {
      name: "tools:ptc-only",
      order: this.ctx.systemPrompt.getSectionOrder("PTC_ONLY"),
      text: (context) => this.modeFor(context.scope) === "ptc" ? PTC_ONLY_INSTRUCTION : ""
    };
  }
  /**
  * The generated-SDK prompt section, registered globally by a PTC mode
  * deployment and per scope by {@link presentAs}.
  *
  * The body regenerates from the CALLING scope, and renders empty for an
  * agent presenting natively — an agent that opted out under a PTC mode
  * deployment still sees the global registration, and an empty section is
  * dropped from the rendered prompt.
  * @returns the section registration.
  */
  sdkSection() {
    return {
      name: "tools:sdk",
      order: this.ctx.systemPrompt.getSectionOrder("TOOLS_SDK"),
      interpolate: false,
      text: (context) => {
        const mode2 = this.modeFor(context.scope);
        if (mode2 === "native") return "";
        const runtime = this.requirePtcRuntime(mode2);
        const render = SDK_RENDERERS[runtime.language];
        if (render === void 0) throw new Error(`dsh-tools: no SDK renderer for ${runtime.language}`);
        return render(this.sdkSchemas(context.scope));
      }
    };
  }
  /**
  * The presentation one scope's agent sees: its own declaration, else the
  * deployment default.
  * @param scope - the calling agent, or undefined for the global view.
  * @returns the resolved presentation mode.
  */
  modeFor(scope) {
    const layers = this.layers.chainLayers(scope);
    for (let index = layers.length - 1; index >= 0; index -= 1) {
      const mode2 = layers[index]?.mode;
      if (mode2 !== void 0) return mode2;
    }
    return this.defaultMode;
  }
  /**
  * The reserved `run_code` transport, built on first need.
  *
  * It never enters the global layer: per-agent restrictions must not remove
  * it, and a scoped registration must not shadow it. The visibility resolver
  * appends it after resolving the filterable global/scoped capability layers,
  * and only for scopes whose mode actually presents it.
  * @returns the shared transport definition.
  */
  requirePtcTransport() {
    this.ptcTransport ??= createRunCodeTool(this, {
      requireRuntime: () => this.requirePtcRuntime(this.defaultMode),
      peekApprover: () => this.ctx.get("approval"),
      resolveSandboxPolicy: (exec) => {
        const policy = this.ctx.get("sandboxPolicy");
        if (policy === void 0) throw new Error("dsh-tools: confined PTC runtime requires sandboxPolicy");
        return policy.resolve(exec.agent === void 0 ? {} : { session: exec.agent.session });
      },
      peekRuntime: () => this.ctx.get("ptcRuntime"),
      maxParallel: this.maxParallelSubCalls,
      shapeDispatchLog: (dispatch) => this.shapeDispatchLog(dispatch)
    });
    return this.ptcTransport;
  }
  /**
  * Present the calling scope's tools in `mode` instead of the deployment
  * default. Nearest scope on the chain wins, so a preset's standing
  * declaration covers every agent joined under it.
  *
  * Scoped only, and one declaration per scope: this is how an agent preset
  * composes PTC mode agents beside native ones in the same process, and a
  * process-global override would be the `mode` config field instead.
  * @param mode - the presentation the covered agents' models see.
  * @returns the exact disposer that restores the deployment default.
  */
  presentAs(mode2) {
    const ctx = this.ctx;
    if (scopeOf(ctx) === void 0) throw new Error("tools.presentAs() requires a scoped context (agent.ctx): a context-global presentation is the `mode` config field on the tools row");
    return ctx.effect(function* () {
      yield this.layers.effect(ctx, (layer) => {
        if (layer.mode !== void 0) throw new Error(`tools.presentAs("${mode2}") conflicts with "${layer.mode}" already declared for this scope; one composition selects one presentation`);
        layer.mode = mode2;
        return () => {
          layer.mode = void 0;
        };
      }, { label: "tools.presentAs()" });
      if (mode2 !== "native") {
        yield ctx.systemPrompt.section(this.collapseSection());
        yield ctx.systemPrompt.section(this.sdkSection());
      }
    }.bind(this), "tools.presentAs()");
  }
  /**
  * Build one scope's wire schemas and names for prompt-order validation.
  * Restrictions do not make known tools invalid, but a mode collapse does.
  */
  wireSchemas(scope) {
    const view = this.view(scope);
    const mode2 = this.modeFor(scope);
    if (mode2 === "native") return {
      schemas: [...view.visible.values()].map((definition) => this.schemaOf(definition, false)),
      knownNames: [...view.knownNames]
    };
    this.requirePtcRuntime(mode2);
    const schemas = [...view.visible.values()].map((definition) => this.schemaOf(definition, false));
    if (mode2 === "ptc") return {
      schemas: schemas.filter((schema) => schema.name === RUN_CODE_NAME),
      knownNames: [RUN_CODE_NAME]
    };
    return {
      schemas,
      knownNames: [...view.knownNames, RUN_CODE_NAME]
    };
  }
  /**
  * Resolve the PTC runtime or throw the actionable misconfiguration error.
  * Read at use time (assembly / run_code execution), NOT via static
  * `inject`: an inject entry would hold `ctx.tools` — and every tool plugin
  * behind it — hostage to a PTC runtime existing even under `mode:
  * 'native'`.
  *
  * Assembly and `run_code` execution read separately, so the language is not
  * bound to a request. Harmless while one published backend exists — both
  * reads return the same flavor — but a reload that swapped in a second
  * language between them would hand a program written against one SDK to the
  * other. Binding it is deferred until a second backend ships (the first
  * point it is testable).
  */
  requirePtcRuntime(mode2) {
    const runtime = this.ctx.get("ptcRuntime");
    if (!runtime) throw new Error(`dsh-tools: mode "${mode2}" requires a PTC runtime \u2014 load a ctx.ptcRuntime implementation (e.g. @deepseek-ai/dsh-ptc-runtime-node) or set tools mode to "native"`);
    if (!Object.hasOwn(SDK_RENDERERS, runtime.language)) {
      const known = Object.keys(SDK_RENDERERS).map((name2) => JSON.stringify(name2)).join(", ");
      throw new Error(`dsh-tools: no SDK renderer registered for runtime language ${JSON.stringify(runtime.language)} (known: ${known})`);
    }
    return runtime;
  }
  /**
  * Register globally or in the calling agent scope. Scoped tools shadow
  * globals; duplicates within one layer and the reserved `run_code` name fail.
  * @param definition - tool schema, execution, and optional finalization/presentation callbacks.
  * @returns the exact disposer that unregisters the tool.
  */
  register(definition) {
    const name2 = definition.name;
    const output = definition.output;
    if (output === void 0 || typeof output !== "object" || typeof output.render !== "function" || output.presentationMeta !== void 0 && typeof output.presentationMeta !== "function") throw new TypeError(`tool "${name2}" must declare output { schema, render, presentationMeta? }`);
    assertSupportedJsonSchema(output.schema);
    const timeoutMs = definition.timeoutMs;
    if (timeoutMs !== void 0 && (!Number.isFinite(timeoutMs) || timeoutMs <= 0)) throw new TypeError(`tool "${name2}" timeoutMs must be a positive finite number`);
    if (name2 === "run_code") throw new Error(`tool name "${RUN_CODE_NAME}" is reserved for the PTC mode presentation transport and cannot be registered or shadowed`);
    return this.layers.effect(this.ctx, (layer) => layer.tools.insert(name2, definition), { label: "tools.register()" });
  }
  /**
  * Restrict global tools for the calling agent scope. Empty filters, unknown
  * names, scope-local names, and reserved transport names fail. Restrictions
  * intersect; scoped registrations remain visible.
  * @param filter - global-tool mask: `allow` (keep only) and/or `deny` (remove).
  * @returns the exact disposer that lifts this restriction.
  */
  restrict(filter) {
    const scope = scopeOf(this.ctx);
    if (scope === void 0) throw new Error("tools.restrict() requires a scoped context (agent.ctx): a context-global restriction would mask every agent \u2014 deny the tool for the intended agent instead");
    const allow = filter.allow;
    const deny = filter.deny;
    if (allow === void 0 && deny === void 0) throw new Error("tools.restrict({}) is a no-op: pass `allow` and/or `deny` (an empty filter is almost always a materialized-empty-config bug)");
    const compiled = {
      ...allow !== void 0 ? { allow: new Set(allow) } : {},
      ...deny !== void 0 ? { deny: new Set(deny) } : {}
    };
    if ([...allow ?? [], ...deny ?? []].includes("run_code")) throw new Error(`tools.restrict() cannot name reserved PTC mode presentation transport "${RUN_CODE_NAME}"; restrict end-capability tools instead`);
    const known = this.view(scope).restrictableNames;
    const unknown = [...allow ?? [], ...deny ?? []].filter((name2) => !known.has(name2));
    if (unknown.length > 0) throw new Error(`tools.restrict() names unknown global tool${unknown.length > 1 ? "s" : ""} ${unknown.map((n) => `"${n}"`).join(", ")}; known global tools: ${[...known].sort().join(", ") || "(none)"}`);
    return this.layers.effect(this.ctx, (layer) => layer.restrictions.append(compiled), { label: "tools.restrict()" });
  }
  /**
  * Register a monotonic guard after the extensible `tools/pre-execute`
  * waterfall. A plain-context guard applies globally; one registered through
  * `agent.ctx` applies only to that agent. Any matching guard may deny by
  * returning a reason, while no guard can force-allow a call another guard
  * denied. The exact effect disposer is returned for ordered ownership and
  * HMR cleanup.
  * @param guard - synchronous check; a returned string denies the execution.
  * @returns the exact disposer that unregisters the guard.
  */
  guard(guard) {
    return this.layers.effect(this.ctx, (layer) => layer.guards.append(guard), {
      label: "tools.guard()",
      notify: false
    });
  }
  /** First monotonic denial from the global then the scope chain's guard layers, farthest first. */
  guardReason(exec) {
    const globalReason = this.layers.global.guardReason(exec);
    if (globalReason !== void 0) return globalReason;
    if (exec.agent === void 0) return void 0;
    for (const layer of this.layers.chainLayers(exec.agent)) {
      const reason = layer.guardReason(exec);
      if (reason !== void 0) return reason;
    }
  }
  /**
  * Resolve every registry fact one scope needs in one layer traversal. The
  * visible map applies restrictions to the INHERITED surface, then the
  * scope's own registrations and the reserved presentation transport; the
  * other sets retain the pre-restriction facts needed by restriction and
  * prompt-order validation.
  *
  * A restriction filters what a scope inherits — the global layer and every
  * ancestor layer on its chain — and never what its OWN layer registers.
  * That exemption is what a per-child capability filter has to keep intact:
  * the delegation runtime registers a child's structured-output tool into the
  * child's own layer, and a filter naming the capabilities the child may use
  * must not strip the machinery it answers through.
  *
  * Reading the exempt set as "the global layer" instead of "not mine" held
  * only while every model-facing tool sat in the host composition. Once
  * presets moved them onto the agent plane they became an ANCESTOR
  * contribution, so a child's filter silently stopped constraining anything
  * it was given.
  * @param scope - the viewing scope (the agent), or undefined for the global view.
  * @returns the complete derived view for that scope.
  */
  view(scope) {
    const layers = this.layers.chainLayers(scope);
    const own = this.layers.peek(scope);
    const inherited = new Map(this.layers.global.tools.entries());
    for (const layer of layers) {
      if (layer === own) continue;
      for (const [name2, definition] of layer.tools.entries()) inherited.set(name2, definition);
    }
    const visible = /* @__PURE__ */ new Map();
    const knownNames = /* @__PURE__ */ new Set();
    const restrictableNames = /* @__PURE__ */ new Set();
    for (const [name2, definition] of inherited) {
      knownNames.add(name2);
      restrictableNames.add(name2);
      if (layers.every((layer) => layer.admits(name2))) visible.set(name2, definition);
    }
    if (own !== void 0) for (const [name2, definition] of own.tools.entries()) {
      knownNames.add(name2);
      visible.set(name2, definition);
    }
    if (this.modeFor(scope) !== "native") visible.set(RUN_CODE_NAME, this.requirePtcTransport());
    return {
      visible,
      knownNames,
      restrictableNames
    };
  }
  /**
  * Look up a tool as one scope sees it (scoped
  * shadows global; a restricted-away global reads as absent). Presenters pass
  * the calling agent so the rendered card matches the definition that
  * actually executed.
  * @param name - the tool name as registered.
  * @param scope - the viewing scope (the agent); omitted = the global view.
  * @returns the definition the scope resolves, or undefined when none is visible.
  */
  get(name2, scope) {
    return this.view(scope).visible.get(name2);
  }
  /**
  * Resolve the definition that MAY EXECUTE for a call, applying the mode
  * collapse at the operation boundary that owns it. The registry view
  * (`get`) is presentation-agnostic; here a MODEL-DIRECT call under `ptc`
  * may only name the reserved `run_code` transport, while a nested
  * sub-dispatch (a `parent` token set — the `run_code` SDK calling a tool
  * it bound) may call any visible tool. Denial surfaces as `UNKNOWN_TOOL`
  * through the executor, matching an absent definition.
  * @param name - the tool name as registered.
  * @param scope - the viewing scope (the agent); omitted = the global view.
  * @param nested - whether the call is a transport sub-dispatch, not a model-direct call.
  * @returns the definition that may run, or undefined when the call must be rejected.
  */
  resolveExecution(name2, scope, nested) {
    const tool = this.get(name2, scope);
    if (tool === void 0) return void 0;
    if (this.collapses(name2, scope, nested)) return void 0;
    return tool;
  }
  /**
  * Project visible definitions onto the allowlisted model-facing schema fields,
  * excluding execution and presentation callbacks.
  * @param scope - the viewing scope (the agent); omitted = the global view.
  * @returns one deep-cloned schema per visible tool.
  */
  schemas(scope) {
    return [...this.view(scope).visible.values()].map((definition) => this.schemaOf(definition, true));
  }
  /** Project visible callable tools onto the generated PTC mode SDK contract. */
  sdkSchemas(scope) {
    return [...this.view(scope).visible.values()].filter((definition) => definition.name !== RUN_CODE_NAME).map((definition) => {
      const output = snapshotJsonValue(definition.output.schema);
      if (output === void 0) throw new Error(`tool "${definition.name}" output schema must be lossless JSON before SDK projection`);
      return {
        ...this.schemaOf(definition, true),
        output
      };
    });
  }
  /** Project one definition onto the model-facing schema fields. */
  schemaOf(definition, detachParameters) {
    const { name: name2, description, parameters, deferLoading } = definition;
    const detached = detachParameters ? snapshotJsonValue(parameters) : parameters;
    if (detached === void 0) throw new Error(`tool "${name2}" parameters must be lossless JSON before schema projection`);
    return {
      name: name2,
      description,
      parameters: detached,
      ...deferLoading === true ? { deferLoading } : {}
    };
  }
  /**
  * Classify a pending call through the caller's visible tool definition. Only
  * an exact `true` is parallel; unknown, hidden, undeclared, invalid, or
  * throwing classifiers are exclusive.
  * @param exec - call name, parsed arguments, and optional agent scope.
  * @returns the fail-closed scheduling mode.
  */
  executionMode(exec) {
    const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
    if (!tool?.isConcurrencySafe) return { kind: "exclusive" };
    try {
      return tool.isConcurrencySafe(exec.arguments) === true ? { kind: "parallel" } : { kind: "exclusive" };
    } catch {
      return { kind: "exclusive" };
    }
  }
  /**
  * Run the `tools/ptc-dispatch-log` waterfall over one settled sub-dispatch
  * and return the content the bridge should log on `tool/ptc-dispatch`.
  * Contained: when a listener throws, the method logs the original settled
  * content; that failure must not fail the dispatch or omit the settle event. Private:
  * the ONE consumer is the `run_code` bridge this registry constructs, which
  * receives it as a capability parameter (the `requireRuntime` idiom) — the
  * waterfall, not this invoker, is the public extension point.
  */
  async shapeDispatchLog(dispatch) {
    try {
      return await this.ctx.waterfall(scopeTarget(this, dispatch.agent), "tools/ptc-dispatch-log", dispatch, () => Promise.resolve(dispatch.content));
    } catch (error) {
      this.ctx.logger.warn(`tools: ptc-dispatch-log listener failed for ${dispatch.name}: ${errorMessage2(error)}; logging the original settled content`);
      return dispatch.content;
    }
  }
  /**
  * Whether the `ptc` mode collapse denies a model-direct call: only the
  * reserved `run_code` transport may be named. Nested sub-dispatches (a
  * `parent` token set) bypass the collapse. One home for the
  * security-relevant predicate, shared by {@link resolveExecution} and
  * {@link createExecution} so the two can never drift apart.
  *
  * Resolved through {@link modeFor}, NOT `defaultMode`: an agent given `ptc`
  * by an agent preset under a native deployment is the composition
  * `dsh-agent-tool-presentation` exists for, and reading the deployment default would
  * leave exactly that agent uncollapsed — announcing one surface while
  * executing another, which is the bypass this collapse closes.
  * @param name - the tool name as registered.
  * @param scope - the viewing scope whose effective presentation mode applies.
  * @param nested - whether the call is a transport sub-dispatch, not a model-direct call.
  */
  collapses(name2, scope, nested) {
    return !nested && this.modeFor(scope) === "ptc" && name2 !== "run_code";
  }
  /**
  * Execute through pre-policy, guards, around-dispatch, post-policy,
  * definition-owned content finalization, and final notification. Tool and
  * listener failures resolve as materialized error results; an invisible tool
  * reports `UNKNOWN_TOOL`. The returned outcome is the same lossless, frozen
  * snapshot final observers receive. Cancellation
  * arriving after entry and before final result materialization skips a
  * not-yet-started body with `ABORTED_BEFORE_DISPATCH` or replaces a
  * successful started outcome with `ABORTED`; already-started work is still
  * drained and may retain a tool-owned structured error.
  * @param exec - the typed same-process call input. The registry assigns its
  *   correlation token before policy begins.
  * @returns the materialized final result.
  */
  async execute(exec) {
    return this.prepareExecution(exec, (prepared) => this.completeScheduledExecution(prepared));
  }
  async completeScheduledExecution(prepared) {
    switch (prepared.kind) {
      case "dispatch": {
        const dispatched = await this.dispatchScheduledExecution(prepared.exec);
        return dispatched.kind === "post-result" ? await this.finalizeScheduledExecution(prepared.exec, dispatched.result) : this.finishScheduledExecution(prepared.exec, dispatched.result);
      }
      case "post-result":
        return await this.finalizeScheduledExecution(prepared.exec, prepared.result);
      case "final-result":
        return this.finishScheduledExecution(prepared.exec, prepared.result);
      /* v8 ignore next -- closed-union exhaustiveness guard */
      default:
        return assertNever(prepared, "scheduled tool preparation");
    }
  }
  createExecution(exec) {
    const deferredContexts = [];
    const token = createExecutionToken();
    const callId = exec.callId;
    const rootCallId = exec.rootCallId ?? callId;
    const name2 = exec.name;
    const agent = exec.agent;
    const parent = exec.parent;
    const signal = exec.signal;
    const visible = this.get(name2, agent);
    const collapsed = visible !== void 0 && this.collapses(name2, agent, parent !== void 0);
    const concludingExecutions = this.concludingExecutions;
    const base = {
      token,
      callId,
      rootCallId,
      name: name2,
      signal,
      ...agent !== void 0 ? { agent } : {},
      ...parent !== void 0 ? { parent } : {},
      ...exec.schema !== void 0 ? { schema: exec.schema } : {},
      deferContext(context) {
        deferredContexts.push(context);
      },
      concludeTurn() {
        concludingExecutions.add(this);
      }
    };
    const capturedFinalizer = visible?.finalizeContent?.bind(visible);
    const capturedProjector = visible?.projectContent?.bind(visible);
    const finalizerFor = () => collapsed && !signal.aborted ? void 0 : capturedFinalizer;
    try {
      const detached = snapshotJsonValue(exec.arguments);
      if (detached === void 0) throw new TypeError("tool execution arguments must be losslessly JSON-serializable");
      const execution = {
        ...base,
        arguments: deepFreeze(detached)
      };
      this.deferredContexts.set(execution, deferredContexts);
      this.contentFinalizers.set(execution, finalizerFor());
      if (!collapsed) this.contentProjectors.set(execution, capturedProjector);
      this.cancellationStates.set(execution, {
        callerSignal: signal,
        bodyInvoked: false
      });
      if (collapsed) {
        if (signal.aborted) return {
          kind: "final-result",
          exec: execution,
          result: toolAbortedBeforeDispatchResult()
        };
        return {
          kind: "final-result",
          exec: execution,
          result: toolErrorResult(new ToolNotFoundError(name2, `only \`${RUN_CODE_NAME}\` is callable directly \u2014 call \`${name2}\` from inside a \`${RUN_CODE_NAME}\` program instead`))
        };
      }
      return {
        kind: "ready",
        exec: execution
      };
    } catch (error) {
      const execution = {
        ...base,
        arguments: void 0
      };
      this.contentFinalizers.set(execution, finalizerFor());
      return {
        kind: "final-result",
        exec: execution,
        result: toolErrorResult(error)
      };
    }
  }
  /**
  * Run the ordered pre-execute and monotonic guard stages for the scheduler.
  * @param input - the caller-supplied execution input.
  * @returns the prepared execution plus the next scheduler stage.
  * @internal
  */
  async prepareScheduledExecution(input) {
    return this.prepareExecution(input, (prepared) => prepared);
  }
  async prepareExecution(input, next) {
    const created = this.createExecution(input);
    if (created.kind !== "ready") return next(created);
    const exec = created.exec;
    if (this.callerCancelled(exec)) return next({
      kind: "final-result",
      exec,
      result: toolAbortedBeforeDispatchResult()
    });
    try {
      const carrier = scopeTarget(this, exec.agent);
      const gate = await this.ctx.waterfall(carrier, "tools/pre-execute", exec, () => Promise.resolve({ kind: "allow" }));
      const askResolution = gate.kind === "ask" ? await this.serviceAsk(exec, gate) : {
        decision: gate,
        approvalCancelled: false
      };
      const { decision } = askResolution;
      if (this.callerCancelled(exec) && askResolution.approvalCancelled) return await next({
        kind: "post-result",
        exec,
        result: toolAbortedBeforeDispatchResult()
      });
      if (decision.kind === "cancel") return await next({
        kind: "post-result",
        exec,
        result: toolAbortedBeforeDispatchResult()
      });
      const denialReason = decision.kind === "allow" ? this.guardReason(exec) : decision.reason;
      const denialInfo = decision.kind === "deny" ? decision.info : void 0;
      if (denialReason !== void 0) return await next({
        kind: "post-result",
        exec,
        result: this.materializeFinalResult({
          content: [{
            type: "text",
            text: `Error: ${denialReason}`
          }],
          isError: true,
          error: {
            message: denialReason,
            ...denialInfo === void 0 ? {} : { info: denialInfo }
          }
        })
      });
      if (this.callerCancelled(exec)) return await next({
        kind: "post-result",
        exec,
        result: toolAbortedBeforeDispatchResult()
      });
      return await next({
        kind: "dispatch",
        exec
      });
    } catch (error) {
      return next({
        kind: "final-result",
        exec,
        result: toolErrorResult(error)
      });
    }
  }
  /** Whether the original caller signal is currently aborted. */
  callerCancelled(exec) {
    const state = this.cancellationStates.get(exec);
    if (state === void 0) throw new Error("tool registry scheduler invariant violated: missing cancellation state");
    return state.callerSignal.aborted;
  }
  /** Canonical cancellation outcome selected by whether the tool body started. */
  cancellationResult(exec, prior) {
    const state = this.cancellationStates.get(exec);
    if (state === void 0) throw new Error("tool registry scheduler invariant violated: missing cancellation state");
    return state.bodyInvoked ? toolAbortedResult(prior) : toolAbortedBeforeDispatchResult(prior);
  }
  /**
  * Dispatch the registered body with the original caller signal fused back
  * into any around-wrapper replacement. Cancellation never abandons the body:
  * a started promise reaches quiescence before its outcome becomes `ABORTED`.
  */
  async dispatchToolBody(exec) {
    const state = this.cancellationStates.get(exec);
    if (state === void 0) throw new Error("tool registry scheduler invariant violated: missing cancellation state");
    const wrapperSignal = exec.signal;
    const fused = fuseToolSignals(state.callerSignal, wrapperSignal);
    const signal = fused.signal;
    if (isAborted(signal)) {
      fused.dispose();
      return toolAbortedBeforeDispatchResult();
    }
    exec.signal = signal;
    try {
      const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
      if (!tool) throw new ToolNotFoundError(exec.name);
      state.bodyInvoked = true;
      const returned = await tool.execute(exec.arguments, exec);
      const result = this.createSuccessResult(exec, tool, returned);
      return isAborted(signal) ? toolAbortedResult(result) : result;
    } catch (error) {
      return toolErrorResult(error);
    } finally {
      fused.dispose();
      exec.signal = wrapperSignal;
    }
  }
  /**
  * Run around-dispatch and the tool body. Tool and unknown-tool failures still
  * receive post-execute; pipeline failures are already final.
  * @param exec - the prepared execution.
  * @returns whether the result still needs post-execute.
  * @internal
  */
  async dispatchScheduledExecution(exec) {
    try {
      const mutableExec = exec;
      const carrier = scopeTarget(this, exec.agent);
      const result = await this.ctx.waterfall(carrier, "tools/execute", mutableExec, () => this.dispatchToolBody(mutableExec));
      const normalized = this.normalizeDispatchResult(exec, result);
      const deferredContexts = this.deferredContexts.get(exec);
      if (deferredContexts === void 0) throw new Error("tool registry scheduler invariant violated: unprepared execution");
      const resultWithDeferredContexts = deferredContexts.length === 0 ? normalized : this.markCanonical(exec, {
        ...normalized,
        additionalContexts: [...deferredContexts, ...normalized.additionalContexts ?? []]
      });
      return {
        kind: "post-result",
        result: this.callerCancelled(exec) && !resultWithDeferredContexts.isError ? this.cancellationResult(exec, resultWithDeferredContexts) : resultWithDeferredContexts
      };
    } catch (error) {
      return {
        kind: "final-result",
        result: toolErrorResult(error)
      };
    }
  }
  /**
  * Run ordered post-execute, then apply definition-owned content finalization,
  * materialize, and notify the final outcome.
  * @param exec - the prepared execution.
  * @param result - dispatch/pre result that still needs post-execute.
  * @returns the materialized final result.
  * @internal
  */
  async finalizeScheduledExecution(exec, result) {
    try {
      const project = this.contentProjectors.get(exec);
      this.contentProjectors.delete(exec);
      const content = project?.(exec, result);
      const projected = content === void 0 ? result : this.markCanonical(exec, this.materializeFinalResult({
        ...result,
        content
      }));
      const postResult = await this.postExecute(exec, projected);
      return this.finishScheduledExecution(exec, this.callerCancelled(exec) && !postResult.isError ? this.cancellationResult(exec, postResult) : postResult);
    } catch (error) {
      return this.finishScheduledExecution(exec, toolErrorResult(error));
    }
  }
  /**
  * Materialize the candidate, apply definition-owned content finalization,
  * then materialize and notify the authoritative result.
  * @param exec - the prepared execution.
  * @param result - final result.
  * @returns the materialized final result.
  * @internal
  */
  finishScheduledExecution(exec, result) {
    let materializedResult;
    try {
      materializedResult = this.materializeFinalResult(result);
    } catch (error) {
      materializedResult = this.materializeFinalResult(toolErrorResult(error));
    }
    let finalResult;
    try {
      finalResult = this.materializeFinalResult(this.applyFinalContent(exec, materializedResult));
    } catch (error) {
      finalResult = this.materializeFinalResult(toolErrorResult(error));
    }
    this.notifyResult(exec, finalResult);
    return finalResult;
  }
  /** Apply the snapshotted tool-owned content transform without exposing other result fields. */
  applyFinalContent(exec, result) {
    const finalizeContent = this.contentFinalizers.get(exec);
    if (finalizeContent === void 0) return result;
    const content = finalizeContent(exec, result);
    return content === void 0 ? result : {
      ...result,
      content
    };
  }
  /** Notify observers without exposing a mutation or error channel into the outcome. */
  notifyResult(exec, result) {
    Object.freeze(exec);
    const { name: toolName, callId } = exec;
    const reportFailure = (error) => {
      this.ctx.logger.warn(`tool "${toolName}" (${callId}): tools/result observer failed: ${errorMessage2(error)}`);
    };
    const callbacks = this.ctx.events.dispatch("emit", [
      scopeTarget(this, exec.agent),
      "tools/result",
      exec,
      result
    ]);
    for (const callback of callbacks) try {
      const returned = callback(exec, result);
      Promise.resolve(returned).catch(reportFailure);
    } catch (error) {
      reportFailure(error);
    }
  }
  /**
  * Resolve an `ask` decision to allow/deny through the approval seam. The
  * seam is consumed opportunistically with `ctx.get('approval')` — a
  * deployment that composes no ApprovalService keeps the historical degrade
  * to deny, and an unmount mid-session degrades the same way on the next ask.
  * An agent-less execution also degrades: without an agent there is no
  * session to audit to and no UI to route to. Otherwise the outcome maps
  * one-to-one — `allowed-once` proceeds; the three non-grants deny with
  * distinct reasons so the model can tell a human "no" from an absent
  * approval channel.
  */
  async serviceAsk(exec, ask) {
    const approval = this.ctx.get("approval");
    if (approval === void 0) return {
      decision: {
        kind: "deny",
        reason: ask.reason ?? `tool "${exec.name}" requires approval (not yet supported)`
      },
      approvalCancelled: false
    };
    if (exec.agent === void 0) return {
      decision: {
        kind: "deny",
        reason: `tool "${exec.name}" requires approval, but the call has no agent to route it through`
      },
      approvalCancelled: false
    };
    const outcome = await approval.request({
      agent: exec.agent,
      toolName: exec.name,
      callId: exec.callId,
      ...ask.reason !== void 0 ? { reason: ask.reason } : {},
      ...ask.displayReason !== void 0 ? { displayReason: ask.displayReason } : {},
      signal: exec.signal
    });
    switch (outcome) {
      case "allowed-once":
        return {
          decision: { kind: "allow" },
          approvalCancelled: false
        };
      case "rejected":
        return {
          decision: {
            kind: "deny",
            reason: `the user rejected tool "${exec.name}"`
          },
          approvalCancelled: false
        };
      case "cancelled":
        return {
          decision: {
            kind: "deny",
            reason: `approval for tool "${exec.name}" was cancelled`
          },
          approvalCancelled: true
        };
      case "unavailable":
        return {
          decision: {
            kind: "deny",
            reason: `tool "${exec.name}" requires approval, but no approval channel is available`
          },
          approvalCancelled: false
        };
      default:
        return assertNever(outcome, "ApprovalOutcome");
    }
  }
  /**
  * Run the `tools/post-execute` waterfall over a dispatched `result` and apply
  * its {@link PostToolDecision}: `accept` keeps the call successful (replacing
  * `content` when given), `block` turns it into an `isError` whose content is
  * the corrective `feedback`. Either decision may attach `additionalContexts`,
  * which are ferried on the returned result for the loop's active-batch FIFO.
  * Context deferred by the tool body survives an accepted result but is
  * discarded when the outer call is blocked; a block exposes only context the
  * blocking decision explicitly supplied.
  * Runs inside `execute`'s outer try/catch (a throwing listener → isError).
  */
  async postExecute(exec, result) {
    const decision = await this.ctx.waterfall(scopeTarget(this, exec.agent), "tools/post-execute", exec, result, () => Promise.resolve({ kind: "accept" }));
    const decisionContexts = decision.additionalContexts ?? [];
    if (decision.kind === "block") {
      const message = failureMessageFromContent(decision.feedback);
      return this.markCanonical(exec, {
        content: decision.feedback,
        isError: true,
        error: { message },
        ...decisionContexts.length > 0 ? { additionalContexts: decisionContexts } : {}
      });
    }
    if (Object.hasOwn(decision, "content") && Object.hasOwn(decision, "value")) throw new TypeError("tools/post-execute accept decision cannot replace both value and content");
    const additionalContexts = [...result.additionalContexts ?? [], ...decisionContexts];
    if (Object.hasOwn(decision, "value")) {
      if (result.isError) throw new TypeError("tools/post-execute cannot replace the value of a failed result");
      const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
      if (tool === void 0) throw new ToolNotFoundError(exec.name);
      const replaced = this.createSuccessResult(exec, tool, decision.value);
      return this.markCanonical(exec, {
        ...replaced,
        ...additionalContexts.length > 0 ? { additionalContexts } : {}
      });
    }
    return this.markCanonical(exec, {
      ...result,
      ...decision.content !== void 0 ? { content: decision.content } : {},
      ...additionalContexts.length > 0 ? { additionalContexts } : {}
    });
  }
  /** Registry-normalized results and the exact dispatch that validated each value. */
  canonicalResults = /* @__PURE__ */ new WeakMap();
  /** Mark one registry-normalized result as canonical only for its owning dispatch. */
  markCanonical(exec, result) {
    this.canonicalResults.set(result, exec.token);
    return result;
  }
  /** Snapshot, validate, render, and optionally project one successful body value. */
  createSuccessResult(exec, tool, candidate) {
    const detached = snapshotToolValue(tool.name, candidate);
    const violations = validateJsonSchemaValue(tool.output.schema, detached, "value");
    if (violations.length > 0) throw new ToolOutputError(tool.name, violations);
    const value = deepFreeze(detached);
    let rendered;
    try {
      rendered = tool.output.render(exec.arguments, value);
    } catch (error) {
      throw projectionError(tool.name, "render", error);
    }
    const content = snapshotProjection(tool.name, "render", rendered);
    let meta;
    if (exec.parent === void 0 && tool.output.presentationMeta !== void 0) {
      let projected;
      try {
        projected = tool.output.presentationMeta(exec.arguments, value);
      } catch (error) {
        throw projectionError(tool.name, "presentationMeta", error);
      }
      meta = snapshotProjection(tool.name, "presentationMeta", projected);
    }
    const concludesTurn = this.concludingExecutions.has(exec);
    return this.markCanonical(exec, this.materializeFinalResult({
      isError: false,
      value,
      content,
      ...meta !== void 0 ? { meta } : {},
      ...concludesTurn ? { concludesTurn: true } : {}
    }));
  }
  /** Normalize an around-dispatch wrapper's authored result through the owning output contract. */
  normalizeDispatchResult(exec, result) {
    if (this.canonicalResults.get(result) === exec.token) return result;
    if (result.isError) return this.markCanonical(exec, {
      isError: true,
      error: result.error,
      content: result.content,
      ...result.meta !== void 0 ? { meta: result.meta } : {},
      ...result.additionalContexts !== void 0 ? { additionalContexts: result.additionalContexts } : {}
    });
    const tool = this.resolveExecution(exec.name, exec.agent, exec.parent !== void 0);
    if (tool === void 0) throw new ToolNotFoundError(exec.name);
    const normalized = this.createSuccessResult(exec, tool, result.value);
    return this.markCanonical(exec, {
      ...normalized,
      ...result.additionalContexts !== void 0 ? { additionalContexts: result.additionalContexts } : {}
    });
  }
  /** Materialize the authoritative commit outcome once, immediately before `tools/result`. */
  materializeFinalResult(result) {
    const presentation = {
      content: result.content,
      ...result.meta !== void 0 ? { meta: result.meta } : {},
      ...result.additionalContexts !== void 0 ? { additionalContexts: result.additionalContexts } : {}
    };
    if (result.isError) return materializePresentation({
      isError: true,
      error: result.error,
      ...presentation
    });
    return deepFreeze({
      ...materializePresentation({
        isError: false,
        ...presentation,
        ...result.concludesTurn === true ? { concludesTurn: true } : {}
      }),
      value: result.value
    });
  }
};
function createExecutionToken() {
  return /* @__PURE__ */ Symbol("dsh.tool.execution");
}
function toolErrorResult(error) {
  const info = errorInfo(error);
  const message = errorMessage2(error);
  return {
    content: [{
      type: "text",
      text: `Error: ${message}`
    }],
    isError: true,
    error: {
      message,
      ...info ? { info } : {}
    }
  };
}
function isAborted(signal) {
  return signal.aborted;
}
function fuseToolSignals(caller, wrapper) {
  if (caller === wrapper) return {
    signal: caller,
    dispose() {
    }
  };
  const controller = new AbortController();
  let listening = false;
  const dispose = () => {
    if (!listening) return;
    listening = false;
    caller.removeEventListener("abort", abortFromCaller);
    wrapper.removeEventListener("abort", abortFromWrapper);
  };
  const abortFrom = (source) => {
    const reason = source.reason;
    controller.abort(reason);
    dispose();
  };
  const abortFromCaller = () => {
    abortFrom(caller);
  };
  const abortFromWrapper = () => {
    abortFrom(wrapper);
  };
  if (wrapper.aborted) abortFromWrapper();
  else if (caller.aborted) abortFromCaller();
  else {
    listening = true;
    caller.addEventListener("abort", abortFromCaller, { once: true });
    wrapper.addEventListener("abort", abortFromWrapper, { once: true });
  }
  return {
    signal: controller.signal,
    dispose
  };
}
function toolAbortedResult(prior) {
  const additionalContexts = prior?.additionalContexts ?? [];
  return {
    content: [{
      type: "text",
      text: "Error: tool call aborted"
    }],
    isError: true,
    error: {
      message: "tool call aborted",
      info: {
        name: "AbortError",
        code: TOOL_ABORTED
      }
    },
    ...additionalContexts.length > 0 ? { additionalContexts } : {}
  };
}
function toolAbortedBeforeDispatchResult(prior) {
  const additionalContexts = prior?.additionalContexts ?? [];
  return {
    content: [{
      type: "text",
      text: "Error: tool call aborted before dispatch"
    }],
    isError: true,
    error: {
      message: "tool call aborted before dispatch",
      info: {
        name: "AbortError",
        code: TOOL_ABORTED_BEFORE_DISPATCH
      }
    },
    ...additionalContexts.length > 0 ? { additionalContexts } : {}
  };
}

// src/export.ts
function triangles(mesh) {
  const out = [];
  for (const face of mesh.faces) {
    const first = face.v[0];
    if (first === void 0) continue;
    for (let i = 1; i + 1 < face.v.length; i += 1) {
      const b = face.v[i];
      const c = face.v[i + 1];
      if (b === void 0 || c === void 0) continue;
      out.push([first, b, c]);
    }
  }
  return out;
}
function toPrint(v, unitMm) {
  return [v[0] * unitMm, v[2] * unitMm, v[1] * unitMm];
}
function normalOf(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const len = Math.hypot(n[0], n[1], n[2]);
  if (len < 1e-9) return [0, 0, 0];
  return [n[0] / len, n[1] / len, n[2] / len];
}
function buildStl(mesh, unitMm) {
  const tris = triangles(mesh);
  const buffer = Buffer.alloc(84 + tris.length * 50);
  buffer.write(`kid-3d by DeepSeek Harness  1 grid = ${round(unitMm, 4)} mm`, 0, "ascii");
  buffer.writeUInt32LE(tris.length, 80);
  let at = 84;
  for (const tri of tris) {
    const a = tri[0];
    const b = tri[1];
    const c = tri[2];
    if (a === void 0 || b === void 0 || c === void 0) continue;
    const p0 = toPrint(a, unitMm);
    const p1 = toPrint(c, unitMm);
    const p2 = toPrint(b, unitMm);
    const n = normalOf(p0, p1, p2);
    for (const value of [n[0], n[1], n[2], p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]]) {
      buffer.writeFloatLE(value, at);
      at += 4;
    }
    buffer.writeUInt16LE(0, at);
    at += 2;
  }
  return buffer;
}
function buildObj(model, mesh, unitMm) {
  const lines = [];
  lines.push(`# ${model.name} \u2014 \u7531 DeepSeek Harness \u7684 kid-3d \u79EF\u6728\u5DE5\u574A\u5BFC\u51FA`);
  lines.push(`# \u5355\u4F4D\uFF1A1 \u683C = ${unitMm} \u6BEB\u7C73\uFF1B\u671D\u5411\uFF1A\u548C\u4F5C\u54C1\u91CC\u4E00\u6837\uFF0Cy \u8F74\u671D\u4E0A`);
  const vertexIndex = /* @__PURE__ */ new Map();
  const vertices = [];
  const groups = /* @__PURE__ */ new Map();
  const vIndex = (v) => {
    const x = round(v[0] * unitMm, 4);
    const y = round(v[1] * unitMm, 4);
    const z = round(v[2] * unitMm, 4);
    const key = `${x},${y},${z}`;
    const found = vertexIndex.get(key);
    if (found !== void 0) return found;
    vertices.push([x, y, z]);
    const index = vertices.length;
    vertexIndex.set(key, index);
    return index;
  };
  for (const face of mesh.faces) {
    const hex = `#${[face.rgb[0], face.rgb[1], face.rgb[2]].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("")}`;
    let list = groups.get(hex);
    if (list === void 0) {
      list = [];
      groups.set(hex, list);
    }
    const ids = face.v.map((v) => vIndex(v));
    if (ids.length < 3) continue;
    const first = ids[0];
    if (first === void 0) continue;
    for (let i = 1; i + 1 < ids.length; i += 1) {
      const b = ids[i];
      const c = ids[i + 1];
      if (b === void 0 || c === void 0) continue;
      list.push(`f ${first} ${b} ${c}`);
    }
  }
  for (const v of vertices) lines.push(`v ${round(v[0], 4)} ${round(v[1], 4)} ${round(v[2], 4)}`);
  for (const [hex, faces] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`g \u989C\u8272_${hex.slice(1)}`);
    lines.push(`usemtl \u989C\u8272_${hex.slice(1)}`);
    for (const face of faces) lines.push(face);
  }
  return `${lines.join("\n")}
`;
}

// src/render-html.ts
function cross2(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function normalize2(v) {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len < 1e-9) return [0, 1, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}
function fmt2(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}
var ORBIT_SCRIPT = [
  "(function(){",
  'var d=document,tilt=d.querySelector(".tilt"),pad=d.querySelector(".pad"),hint=d.querySelector(".hint");',
  "if(!tilt||!pad)return;",
  'd.documentElement.className+=" js";',
  "var rx=18,ry=0,zs=1,vx=0,vy=0,drag=false,px=0,py=0,idle=0,raf=0,last=0;",
  'var reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);',
  "function cl(v,a,b){return v<a?a:(v>b?b:v)}",
  'function put(){tilt.style.setProperty("--rx",rx.toFixed(2)+"deg");',
  'tilt.style.setProperty("--ry",ry.toFixed(2)+"deg");tilt.style.setProperty("--zs",zs.toFixed(3))}',
  "function loop(t){",
  "var dt=last?Math.min(64,t-last):16;last=t;",
  "if(drag){raf=0;return}",
  "if(vx||vy){ry+=vx*dt;rx=cl(rx-vy*dt,-88,88);var k=Math.pow(0.88,dt/16);vx*=k;vy*=k;",
  "if(Math.abs(vx)<0.004&&Math.abs(vy)<0.004){vx=0;vy=0}put()}",
  "else if(!reduce&&t-idle>6000){ry+=0.014*dt;put()}",
  "raf=requestAnimationFrame(loop)}",
  "function start(){if(!raf)raf=requestAnimationFrame(loop)}",
  'pad.addEventListener("pointerdown",function(e){',
  'if(e.pointerType==="mouse"&&e.button!==0)return;',
  "drag=true;px=e.clientX;py=e.clientY;vx=0;vy=0;last=0;idle=performance.now();",
  'pad.className="pad pulling";try{pad.setPointerCapture(e.pointerId)}catch(_){}',
  "e.preventDefault();start()});",
  'pad.addEventListener("pointermove",function(e){',
  "if(!drag)return;var dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;",
  "ry+=dx*0.45;rx=cl(rx-dy*0.35,-88,88);vx=dx*0.45/16*0.25;vy=dy*0.35/16*0.25;",
  "idle=performance.now();put();e.preventDefault()});",
  'function stop(){if(!drag)return;drag=false;pad.className="pad";idle=performance.now();last=0;start()}',
  'pad.addEventListener("pointerup",stop);pad.addEventListener("pointercancel",stop);',
  'window.addEventListener("blur",stop);',
  'pad.addEventListener("wheel",function(e){zs=cl(zs*(e.deltaY>0?0.9:1.11),0.5,2.6);',
  "idle=performance.now();put();e.preventDefault()},{passive:false});",
  'pad.addEventListener("dblclick",function(){rx=18;ry=0;zs=1;vx=0;vy=0;put()});',
  'if(hint)hint.textContent="\u6309\u4F4F\u62D6\u52A8\u8F6C\u89C6\u89D2 \xB7 \u6EDA\u8F6E\u8FDC\u8FD1 \xB7 \u53CC\u51FB\u56DE\u6B63\u9762";',
  "put();start()})();"
].join("");
function staticPage(model, svg, note) {
  return [
    '<!doctype html><html lang="zh"><head><meta charset="utf-8">',
    `<title>${escapeXml(model.name)} \xB7 3D \u4F5C\u54C1</title>`,
    "<style>",
    "html,body{margin:0;padding:0;background:linear-gradient(#eaf6ff,#ffffff);",
    "font:15px/1.7 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#33475c}",
    ".wrap{max-width:1000px;margin:0 auto;padding:18px}",
    "h1{font-size:20px;margin:8px 0 4px}",
    ".note{color:#7b8ea3;font-size:13px;margin-bottom:10px}",
    "svg{width:100%;height:auto;border-radius:16px;box-shadow:0 6px 22px rgba(40,70,100,.12)}",
    '</style></head><body><div class="wrap">',
    `<h1>${escapeXml(model.name)}</h1>`,
    `<div class="note">${escapeXml(note)}</div>`,
    svg,
    "</div></body></html>"
  ].join("");
}
function renderHtml(model, mesh, opts) {
  const summary = modelSummary(model);
  if (mesh.faces.length > opts.interactiveMaxFaces) {
    return {
      html: staticPage(
        model,
        opts.svgFallback,
        `\u8FD9\u4EF6\u4F5C\u54C1\u592A\u7CBE\u7EC6\u4E86\uFF08${mesh.faces.length} \u4E2A\u9762\uFF09\uFF0C\u8F6C\u8D77\u6765\u4F1A\u5361\uFF0C\u6240\u4EE5\u8FD9\u91CC\u653E\u4E00\u5F20\u9759\u6001\u7ACB\u4F53\u56FE\u3002`
      ),
      interactive: false,
      faces: mesh.faces.length
    };
  }
  const bounds = modelBounds(model);
  const span = Math.max(
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
    1
  );
  const scale = Math.max(3, Math.min(24, 380 / span));
  const cx = (bounds.min[0] + bounds.max[0]) / 2;
  const cy = (bounds.min[1] + bounds.max[1]) / 2;
  const cz = (bounds.min[2] + bounds.max[2]) / 2;
  const toCss = (v) => [(v[0] - cx) * scale, -(v[1] - cy) * scale, (v[2] - cz) * scale];
  const faces = [];
  for (const face of mesh.faces) {
    const a = face.v[0];
    const b = face.v[1];
    const d = face.v[face.v.length - 1];
    if (a === void 0 || b === void 0 || d === void 0) continue;
    const p0 = toCss(a);
    const pb = toCss(b);
    const pd = toCss(d);
    const e1 = [pb[0] - p0[0], pb[1] - p0[1], pb[2] - p0[2]];
    const e2 = [pd[0] - p0[0], pd[1] - p0[1], pd[2] - p0[2]];
    const normal = normalize2(cross2(e1, e2));
    const grow = 0.75;
    const len1 = Math.max(1e-6, Math.hypot(e1[0], e1[1], e1[2]));
    const len2 = Math.max(1e-6, Math.hypot(e2[0], e2[1], e2[2]));
    const g1 = [e1[0] * (1 + grow / len1), e1[1] * (1 + grow / len1), e1[2] * (1 + grow / len1)];
    const g2 = [e2[0] * (1 + grow / len2), e2[1] * (1 + grow / len2), e2[2] * (1 + grow / len2)];
    const matrix = [
      g1[0],
      g1[1],
      g1[2],
      0,
      g2[0],
      g2[1],
      g2[2],
      0,
      normal[0],
      normal[1],
      normal[2],
      0,
      p0[0],
      p0[1],
      p0[2],
      1
    ].map(fmt2).join(",");
    const color = `rgb(${Math.round(face.rgb[0])},${Math.round(face.rgb[1])},${Math.round(face.rgb[2])})`;
    const clip = face.v.length === 3 ? ";clip-path:polygon(0 0,1px 0,0 1px)" : "";
    faces.push(`<i style="background:${color}${clip};transform:matrix3d(${matrix})"></i>`);
  }
  const style = GROUND_STYLE[model.ground];
  let floor = "";
  if (model.ground !== "none") {
    const v0 = [(0 - cx) * scale, -(0 - cy) * scale + 0.6, (0 - cz) * scale];
    const m = [
      model.size[0] * scale,
      0,
      0,
      0,
      0,
      0,
      model.size[2] * scale,
      0,
      0,
      -1,
      0,
      0,
      v0[0],
      v0[1],
      v0[2],
      1
    ].map(fmt2).join(",");
    floor = `<i class="floor" style="background:${style.fill};transform:matrix3d(${m})"></i>`;
  }
  const html = [
    '<!doctype html><html lang="zh"><head><meta charset="utf-8">',
    `<title>${escapeXml(model.name)} \xB7 \u4F1A\u8F6C\u5708\u7684 3D \u4F5C\u54C1</title>`,
    "<style>",
    "html,body{margin:0;height:100%;overflow:hidden}",
    "body{display:flex;align-items:center;justify-content:center;",
    `background:radial-gradient(120% 90% at 50% 0%,${style.skyTop} 0%,${style.skyBottom} 70%,#ffffff 100%);`,
    "font:14px/1.6 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#41536a}",
    ".stage{perspective:1500px;perspective-origin:50% 50%;width:0;height:0}",
    ".tilt{position:relative;transform-style:preserve-3d;will-change:transform;",
    "transform:rotateX(var(--rx,18deg)) rotateY(var(--ry,0deg))",
    "scale3d(var(--zs,1),var(--zs,1),var(--zs,1))}",
    ".spin{position:relative;width:0;height:0;transform-style:preserve-3d;",
    `animation:spin ${opts.spinSeconds}s linear infinite}`,
    ".spin:hover{animation-play-state:paused}",
    ".spin i,.floor{position:absolute;left:0;top:0;width:1px;height:1px;transform-origin:0 0;display:block}",
    "@keyframes spin{from{transform:rotateY(0deg)}to{transform:rotateY(360deg)}}",
    ".pad{display:none}",
    ".js .spin{animation:none}",
    ".js .pad{display:block;position:fixed;left:0;top:0;right:0;bottom:0;z-index:5;",
    "touch-action:none;cursor:grab}",
    ".js .pad.pulling{cursor:grabbing}",
    ".cap{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);text-align:center;",
    "pointer-events:none;z-index:6}",
    ".cap b{font-size:16px;color:#26364a}",
    ".cap span{display:block;color:#7b8ea3;font-size:12.5px}",
    "</style></head><body>",
    `<div class="stage"><div class="tilt">${floor}<div class="spin">${faces.join("")}</div></div></div>`,
    '<div class="pad"></div>',
    `<div class="cap"><b>${escapeXml(model.name)}</b><span>${escapeXml(summary)}</span>`,
    '<span class="hint">\u628A\u9F20\u6807\u653E\u5230\u6A21\u578B\u4E0A\uFF0C\u5B83\u5C31\u505C\u4F4F\u4E0D\u8F6C\u4E86</span></div>',
    opts.dragOrbit ? `<script>${ORBIT_SCRIPT}</script>` : "",
    "</body></html>"
  ].join("");
  return { html, interactive: true, faces: mesh.faces.length };
}

// src/templates.ts
function box(at, size, color) {
  return { shape: "box", at, size, color };
}
function ball(at, size, color) {
  return { shape: "sphere", at, size, color };
}
function cyl(at, size, color, axis = "y") {
  return { shape: "cylinder", at, size, color, axis };
}
function cone(at, size, color, axis = "y") {
  return { shape: "cone", at, size, color, axis };
}
function pyramid(at, size, color) {
  return { shape: "pyramid", at, size, color };
}
var TEMPLATES = [
  {
    key: "house",
    name: "\u5C0F\u623F\u5B50",
    ground: "grass",
    hint: "\u5899\u7528\u65B9\u5757\u3001\u5C4B\u9876\u7528\u5C16\u9876\uFF0C\u8FD8\u6709\u95E8\u3001\u4E24\u6247\u7A97\u548C\u4E00\u6839\u70DF\u56F1",
    specs: [
      box([2, 0, 2], [10, 7, 10], "\u7C73"),
      pyramid([1, 7, 1], [12, 4, 12], "\u7EA2"),
      box([6, 0, 12], [3, 4, 1], "\u68D5"),
      box([3, 4, 12], [2, 2, 1], "\u5929\u84DD"),
      box([10, 4, 12], [2, 2, 1], "\u5929\u84DD"),
      box([9, 8, 3], [2, 4, 2], "\u7070"),
      box([5, 0, 13], [5, 1, 1], "\u7070")
    ]
  },
  {
    key: "castle",
    name: "\u5C0F\u57CE\u5821",
    ground: "grass",
    hint: "\u4E2D\u95F4\u4E00\u5EA7\u5927\u697C\uFF0C\u56DB\u89D2\u56DB\u5EA7\u5854\uFF0C\u5854\u9876\u662F\u7EA2\u8272\u7684\u5706\u9525\uFF0C\u8FD8\u6709\u4E00\u6247\u5927\u95E8",
    specs: [
      box([5, 0, 5], [6, 8, 6], "\u7C73"),
      box([2, 0, 2], [4, 9, 4], "\u7070"),
      box([10, 0, 2], [4, 9, 4], "\u7070"),
      box([2, 0, 10], [4, 9, 4], "\u7070"),
      box([10, 0, 10], [4, 9, 4], "\u7070"),
      cone([2, 9, 2], [4, 4, 4], "\u7EA2"),
      cone([10, 9, 2], [4, 4, 4], "\u7EA2"),
      cone([2, 9, 10], [4, 4, 4], "\u7EA2"),
      cone([10, 9, 10], [4, 4, 4], "\u7EA2"),
      box([7, 0, 11], [2, 5, 1], "\u68D5")
    ]
  },
  {
    key: "rocket",
    name: "\u5C0F\u706B\u7BAD",
    ground: "none",
    hint: "\u767D\u5706\u67F1\u5F53\u7BAD\u8EAB\u3001\u7EA2\u5706\u9525\u5F53\u7BAD\u5934\u3001\u84DD\u5C0F\u7403\u5F53\u7A97\u6237\uFF0C\u5C3E\u5DF4\u4E0A\u56DB\u7247\u5C3E\u7FFC",
    specs: [
      cyl([6, 0, 6], [4, 10, 4], "\u767D"),
      cone([6, 10, 6], [4, 4, 4], "\u7EA2"),
      ball([7, 5, 9], [2, 2, 2], "\u5929\u84DD"),
      box([4, 0, 7], [2, 3, 2], "\u7EA2"),
      box([10, 0, 7], [2, 3, 2], "\u7EA2"),
      box([7, 0, 4], [2, 3, 2], "\u7EA2"),
      box([7, 0, 10], [2, 3, 2], "\u7EA2")
    ]
  },
  {
    key: "tree",
    name: "\u5927\u6811",
    ground: "grass",
    hint: "\u68D5\u8272\u5706\u67F1\u5F53\u6811\u5E72\uFF0C\u4E09\u4E2A\u7EFF\u7403\u5806\u6210\u6811\u51A0",
    specs: [
      cyl([7, 0, 7], [2, 6, 2], "\u68D5"),
      ball([4, 6, 4], [8, 7, 8], "\u7EFF"),
      ball([2, 8, 6], [6, 6, 6], "\u7EFF"),
      ball([9, 7, 7], [5, 5, 5], "\u7EFF")
    ]
  },
  {
    key: "snowman",
    name: "\u96EA\u4EBA",
    ground: "snow",
    hint: "\u4E09\u4E2A\u767D\u7403\u645E\u8D77\u6765\uFF0C\u9ED1\u773C\u775B\u3001\u80E1\u841D\u535C\u9F3B\u5B50\u3001\u9ED1\u5E3D\u5B50\u3001\u7EA2\u56F4\u5DFE",
    specs: [
      ball([5, 0, 5], [7, 5, 7], "\u767D"),
      ball([6, 4, 6], [6, 5, 6], "\u767D"),
      ball([7, 9, 7], [5, 4, 5], "\u767D"),
      ball([7.4, 10.8, 10.2], [1.2, 1.2, 1.2], "\u9ED1"),
      ball([9.4, 10.8, 10.2], [1.2, 1.2, 1.2], "\u9ED1"),
      cone([8.5, 10.4, 11], [1.2, 1.2, 2.4], "\u6A59", "z"),
      box([6, 13, 6], [7, 1, 7], "\u9ED1"),
      box([8, 14, 8], [3, 2, 3], "\u9ED1"),
      box([6, 9, 6], [6, 1, 6], "\u7EA2"),
      ball([8.4, 6, 11], [1.2, 1.2, 1.2], "\u9ED1"),
      ball([8.4, 7.6, 10.8], [1.2, 1.2, 1.2], "\u9ED1")
    ]
  },
  {
    key: "car",
    name: "\u5C0F\u6C7D\u8F66",
    ground: "grass",
    hint: "\u7EA2\u8272\u8F66\u8EAB\u3001\u84DD\u8272\u9A7E\u9A76\u5BA4\uFF0C\u56DB\u4E2A\u9ED1\u8F6E\u5B50\u662F\u300C\u8EBA\u7740\u7684\u5706\u67F1\u300D",
    specs: [
      box([2, 1, 4], [12, 3, 7], "\u7EA2"),
      box([4, 4, 5], [6, 3, 5], "\u5929\u84DD"),
      box([4, 7, 5], [6, 1, 5], "\u7EA2"),
      cyl([1, 0, 2], [2, 4, 4], "\u9ED1", "x"),
      cyl([13, 0, 2], [2, 4, 4], "\u9ED1", "x"),
      cyl([1, 0, 7], [2, 4, 4], "\u9ED1", "x"),
      cyl([13, 0, 7], [2, 4, 4], "\u9ED1", "x"),
      box([10, 4, 5], [1, 2, 5], "\u767D"),
      box([13, 2, 4], [1, 1, 1], "\u9EC4"),
      box([13, 2, 10], [1, 1, 1], "\u9EC4")
    ]
  },
  {
    key: "boat",
    name: "\u5C0F\u8239",
    ground: "water",
    hint: "\u68D5\u8272\u8239\u8EAB\u3001\u5706\u9525\u505A\u7684\u5C16\u8239\u5934\u3001\u5706\u67F1\u6845\u6746\uFF0C\u8FD8\u6709\u767D\u5E06\u548C\u7EA2\u65D7",
    specs: [
      box([2, 0, 4], [12, 4, 8], "\u68D5"),
      cone([2, 0, 12], [12, 4, 4], "\u68D5", "z"),
      cyl([7, 4, 7], [1, 6, 1], "\u68D5"),
      box([7, 5, 7], [1, 5, 5], "\u767D"),
      box([7, 10, 8], [1, 1, 3], "\u7EA2")
    ]
  },
  {
    key: "heart",
    name: "\u7231\u5FC3",
    ground: "grass",
    hint: "\u65B9\u5757\u4E00\u5C42\u5C42\u642D\u51FA\u6765\u7684\u7231\u5FC3\uFF0C\u4E0A\u9762\u4E2D\u95F4\u6709\u4E2A\u5C0F\u7F3A\u53E3\uFF0C\u5E95\u4E0B\u6536\u6210\u5C16\u7684",
    specs: [
      box([3, 6, 6], [4, 1, 2], "\u7EA2"),
      box([9, 6, 6], [4, 1, 2], "\u7EA2"),
      box([3, 5, 6], [10, 1, 2], "\u7EA2"),
      box([3, 4, 6], [10, 1, 2], "\u7EA2"),
      box([4, 3, 6], [8, 1, 2], "\u7C89"),
      box([5, 2, 6], [6, 1, 2], "\u7C89"),
      box([6, 1, 6], [4, 1, 2], "\u7C89"),
      box([7, 0, 6], [2, 1, 2], "\u7C89")
    ]
  },
  {
    key: "cat",
    name: "\u5C0F\u732B",
    ground: "grass",
    hint: "\u6A59\u8272\u5706\u7403\u505A\u8EAB\u4F53\u548C\u5934\uFF0C\u4E24\u4E2A\u5706\u9525\u8033\u6735\u3001\u9ED1\u773C\u775B\u3001\u7C89\u9F3B\u5B50\uFF0C\u8FD8\u6709\u4E00\u6761\u8EBA\u7740\u7684\u5706\u67F1\u5C3E\u5DF4",
    specs: [
      ball([4, 0, 5], [8, 7, 8], "\u6A59"),
      ball([5.5, 6, 5.5], [7, 7, 7], "\u6A59"),
      cone([5.5, 12, 7], [2, 3, 2], "\u6A59"),
      cone([10.5, 12, 7], [2, 3, 2], "\u6A59"),
      ball([7, 9, 11.5], [1.2, 1.2, 1.2], "\u9ED1"),
      ball([9.8, 9, 11.5], [1.2, 1.2, 1.2], "\u9ED1"),
      ball([8.4, 8, 12], [1.2, 1.2, 1.2], "\u7C89"),
      cyl([9, 1, 12.5], [1.5, 1.5, 3], "\u6A59", "z")
    ]
  },
  {
    key: "robot",
    name: "\u673A\u5668\u4EBA",
    ground: "grass",
    hint: "\u65B9\u5757\u8EAB\u4F53\u548C\u8111\u888B\u3001\u8EBA\u7740\u7684\u5706\u67F1\u624B\u81C2\u3001\u65B9\u5757\u817F\uFF0C\u5934\u9876\u8FD8\u6709\u4E00\u6839\u5929\u7EBF",
    specs: [
      box([5, 2, 6], [6, 6, 4], "\u7070"),
      box([6, 8, 6], [4, 4, 4], "\u94F6"),
      ball([6.5, 10, 10], [1.2, 1.2, 1.2], "\u5929\u84DD"),
      ball([8.8, 10, 10], [1.2, 1.2, 1.2], "\u5929\u84DD"),
      cyl([2, 5, 7], [3, 2, 2], "\u94F6", "x"),
      cyl([11, 5, 7], [3, 2, 2], "\u94F6", "x"),
      box([5, 0, 6], [2, 2, 4], "\u7070"),
      box([9, 0, 6], [2, 2, 4], "\u7070"),
      cyl([7.5, 12, 7.5], [1, 2, 1], "\u94F6"),
      ball([7.5, 14, 7.5], [1.5, 1.5, 1.5], "\u7EA2"),
      box([6, 3, 10], [1, 1, 1], "\u7EA2"),
      box([8, 3, 10], [1, 1, 1], "\u9EC4")
    ]
  }
];
function findTemplate(key) {
  const lower = key.trim().toLowerCase();
  return TEMPLATES.find((t) => t.key === lower || t.name === key.trim());
}
function templateList() {
  return TEMPLATES.map((t) => `${t.key}\uFF08${t.name}\uFF09`).join("\u3001");
}
function buildTemplate(template, model, startId) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const spec of template.specs) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis] ?? 0, spec.at[axis] ?? 0);
      max[axis] = Math.max(max[axis] ?? 0, (spec.at[axis] ?? 0) + (spec.size[axis] ?? 0));
    }
  }
  const need = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  for (let axis = 0; axis < 3; axis += 1) {
    if ((need[axis] ?? 0) > (model.size[axis] ?? 0) + 1e-6) {
      const names = ["\u5DE6\u53F3", "\u4E0A\u4E0B", "\u524D\u540E"];
      return {
        ok: false,
        message: `\u3010\u8FD9\u95F4\u5DE5\u574A\u653E\u4E0D\u4E0B\u300C${template.name}\u300D\u3011\u5B83\u9700\u8981 ${names[axis]} \u65B9\u5411 ${Math.ceil(need[axis] ?? 0)} \u683C\uFF0C\u73B0\u5728\u5DE5\u574A\u53EA\u6709 ${model.size[axis]} \u683C\u3002\u7528 kid3d_new size ${Math.max(16, Math.ceil(need[axis] ?? 16))} \u6362\u95F4\u5927\u5DE5\u574A\u5C31\u884C\u3002`
      };
    }
  }
  const shift = [
    Math.round((model.size[0] - need[0]) / 2 - min[0]),
    Math.round(-min[1]),
    Math.round((model.size[2] - need[2]) / 2 - min[2])
  ];
  const pieces = [];
  let id = startId;
  for (const spec of template.specs) {
    const at = [spec.at[0] + shift[0], spec.at[1] + shift[1], spec.at[2] + shift[2]];
    const input = {
      shape: spec.shape,
      at,
      size: spec.size,
      color: spec.color,
      axis: spec.axis ?? "y"
    };
    const result = makePiece(input, model, id, 4);
    if (!result.ok) return { ok: false, message: result.message };
    pieces.push(result.piece);
    id += 1;
  }
  return { ok: true, pieces, template };
}

// src/tools.ts
var MIN_SIZE = 8;
var MAX_SIZE = 32;
var SPIN_SECONDS = 16;
var TEMPLATE_SIZE = 16;
var FORMATS = ["stl", "obj", "html", "all"];
function pick2(input, allowed, fallback) {
  const text = typeof input === "string" ? input.trim().toLowerCase() : "";
  for (const value of allowed) {
    if (value.toLowerCase() === text) return value;
  }
  return fallback;
}
function numbers3(input) {
  if (!Array.isArray(input)) return void 0;
  const out = [];
  for (const item of input.slice(0, 3)) {
    const value = typeof item === "number" ? item : Number(item);
    if (!Number.isFinite(value)) return void 0;
    out.push(value);
  }
  if (out.length !== 3) return void 0;
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0];
}
function vec3(input, fallback) {
  return numbers3(input) ?? fallback;
}
function intOr(input, fallback) {
  const value = typeof input === "number" ? input : Number(input);
  return Number.isFinite(value) ? Math.round(value) : fallback;
}
function numOr(input, fallback) {
  const value = typeof input === "number" ? input : Number(input);
  return Number.isFinite(value) ? value : fallback;
}
function truthy(input, fallback) {
  return typeof input === "boolean" ? input : fallback;
}
function knownColor(input) {
  if (typeof input !== "string" || input.trim() === "") return void 0;
  const hex = resolveColor(input, "");
  return hex === "" ? void 0 : hex;
}
function pieceSummary(model) {
  if (model.pieces.length === 0) return "\u73B0\u5728\u4E00\u4EF6\u79EF\u6728\u90FD\u8FD8\u6CA1\u6709";
  const shapes = shapeCounts(model).map((row) => `${row.count} \u4E2A${SHAPE_LABEL[row.shape]}`).join("\u3001");
  const colors = colorCounts(model).map((row) => `${row.count} \u4EF6${colorName(row.color)}`).join("\u3001");
  return `\u73B0\u5728\u4E00\u5171 ${model.pieces.length} \u4EF6\u79EF\u6728\uFF08${shapes}\uFF1B${colors}\uFF09`;
}
function filesHint(...files) {
  return `\u6587\u4EF6\uFF1A${files.join("\u3001")}`;
}
function presentHint(file) {
  return `\u63D0\u793A\uFF1A\u60F3\u770B\u8FD9\u5F20\u56FE\uFF0C\u5C31\u7528 present \u628A ${file} \u53D1\u7ED9\u5C0F\u670B\u53CB\uFF1B\u4ED6\u770B\u5230\u7684\u662F\u4E00\u5F20\u4F1A\u8F6C\u5708\u7684\u56FE\uFF0C\u8F6C\u8D77\u6765\u66F4\u50CF\u771F\u7684\u3002`;
}
function viewFileName(model, view, spin, zoom, grid) {
  const canonical = view === "iso" && spin === 0 && zoom === 1 && grid;
  const base = model.name.slice(0, 18);
  return canonical ? model.name : `${base}-${view}`;
}
async function draw(paths, model, config, view, spin, zoom, grid) {
  const started = Date.now();
  const mesh = buildMesh(model);
  const svg = renderSvg(model, mesh, { view, spin, zoom, grid });
  const html = renderHtml(model, mesh, {
    spinSeconds: SPIN_SECONDS,
    interactiveMaxFaces: config.interactiveMaxFaces,
    dragOrbit: config.dragOrbit,
    svgFallback: svg.svg
  });
  const svgPath = fileFor(paths, viewFileName(model, view, spin, zoom, grid), "svg");
  const htmlPath = fileFor(paths, model.name, "html");
  await writeText(paths, svgPath, svg.svg);
  await writeText(paths, htmlPath, html.html);
  return {
    file: svgPath,
    htmlFile: htmlPath,
    stats: svg.stats,
    interactive: html.interactive,
    slow: Date.now() - started > config.timeoutMs
  };
}
async function openPaths(cwd, config) {
  const paths = pathsFor(cwd ?? process.cwd(), config.workDir);
  await ensureDirs(paths);
  return paths;
}
async function loadOrCreate(paths, config) {
  const existing = await readModel(paths);
  if (existing !== void 0) return { model: existing, created: false };
  const model = emptyModel("\u6211\u7684\u4F5C\u54C1", config.defaultSize, "grass");
  await writeModel(paths, model);
  return { model, created: true };
}
function slowNote(info) {
  return info.slow ? "\uFF08\u8FD9\u6B21\u7B97\u5F97\u6162\u4E86\u4E00\u70B9\uFF0C\u79EF\u6728\u592A\u591A\u7684\u8BDD\u53EF\u4EE5\u5C11\u653E\u51E0\u4EF6\uFF09" : "";
}
function htmlNote(info, config) {
  return info.interactive ? `\u4F1A\u8F6C\u5708\u7684\u7F51\u9875\uFF1A${info.htmlFile}\uFF08\u9762\u6570 ${info.stats.faces}\u3002\u9884\u89C8\u91CC\u5B83\u4F1A\u81EA\u5DF1\u8F6C\uFF1B\u7528\u771F\u6D4F\u89C8\u5668\u6253\u5F00\u8FD9\u4E2A\u6587\u4EF6\uFF0C\u5C31\u80FD\u6309\u4F4F\u62D6\u52A8\u8F6C\u89C6\u89D2\u3001\u6EDA\u8F6E\u8FDC\u8FD1\u3001\u53CC\u51FB\u56DE\u6B63\u9762\uFF09` : `\u4F1A\u8F6C\u5708\u7684\u7F51\u9875\uFF1A${info.htmlFile}\uFF08\u8FD9\u4E2A\u4F5C\u54C1\u6709 ${info.stats.faces} \u4E2A\u9762\uFF0C\u6BD4 ${config.interactiveMaxFaces} \u591A\uFF0C\u7F51\u9875\u91CC\u5148\u653E\u9759\u6001\u56FE\uFF09`;
}
function archiveLines(entries, max = 10) {
  const shown = entries.slice(0, max);
  const lines = shown.map((entry) => `\xB7 ${entry.file} \uFF5C ${entry.pieces} \u4EF6\u79EF\u6728 \uFF5C ${stampText(entry.time)}`);
  if (entries.length > shown.length) {
    lines.push(`\uFF08\u8FD8\u6709 ${entries.length - shown.length} \u4EF6\u66F4\u65E9\u7684\uFF0C\u6CA1\u5217\u51FA\u6765\uFF09`);
  }
  return lines.join("\n");
}
function stampText(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "\u65F6\u95F4\u4E0D\u8BE6";
  const date3 = new Date(ms);
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${date3.getFullYear()}-${pad2(date3.getMonth() + 1)}-${pad2(date3.getDate())} ${pad2(date3.getHours())}:${pad2(date3.getMinutes())}`;
}
function buildKid3dTools(config) {
  return [
    defineTool({
      name: "kid3d_new",
      description: "\u7ED9\u5C0F\u670B\u53CB\u5F00\u4E00\u95F4\u65B0\u7684\u300C3D \u79EF\u6728\u5DE5\u574A\u300D\uFF08\u7A7A\u767D\u4F5C\u54C1\uFF09\uFF0C\u5E76\u987A\u624B\u628A\u4E0A\u4E00\u4EF6\u4F5C\u54C1\u5B58\u8FDB \u5B58\u6863/ \u91CC\u3002\u4E4B\u540E\u7528 kid3d_build \u5F80\u91CC\u653E\u79EF\u6728\u3001kid3d_view \u770B\u7ACB\u4F53\u56FE\u3002\u5DE5\u574A\u6709\u56FA\u5B9A\u5927\u5C0F\uFF0C\u79EF\u6728\u51FA\u4E86\u5899\u5C31\u4F1A\u88AB\u6321\u4F4F\u3002",
      parameters: {
        name: {
          type: "string",
          description: "\u4F5C\u54C1\u540D\u5B57\uFF0C\u6BD4\u5982\u300C\u6211\u7684\u5C0F\u623F\u5B50\u300D\u3002\u4E0D\u5199\u5C31\u53EB\u300C\u6211\u7684\u4F5C\u54C1\u300D\u3002"
        },
        size: {
          type: "integer",
          description: `\u5DE5\u574A\u6709\u591A\u5927\uFF08\u683C\uFF09\uFF0C${MIN_SIZE}~${MAX_SIZE}\uFF0C\u4E0D\u5199\u5C31\u662F ${config.defaultSize} \u683C\u3002`
        },
        ground: {
          type: "string",
          enum: [...GROUNDS],
          description: `\u5730\u9762\u662F\u4EC0\u4E48\uFF1A${GROUNDS.map((g) => `${g}\uFF08${GROUND_LABEL[g]}\uFF09`).join("\u3001")}\u3002\u4E0D\u5199\u5C31\u662F\u8349\u5730 grass\u3002`
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const previous = await readModel(paths);
        let archived = "";
        if (previous !== void 0 && previous.pieces.length > 0) {
          const file = await archiveModel(paths, previous);
          if (file !== void 0) archived = `
\u4E0A\u4E00\u4EF6\u4F5C\u54C1\u300C${previous.name}\u300D\u5DF2\u7ECF\u6536\u8FDB \u5B58\u6863/\uFF1A${file}`;
        }
        const name2 = normalizeName(typeof args.name === "string" ? args.name : void 0, "\u6211\u7684\u4F5C\u54C1");
        const size = clamp(intOr(args.size, config.defaultSize), MIN_SIZE, MAX_SIZE);
        const ground = pick2(args.ground, GROUNDS, "grass");
        const model = emptyModel(name2, size, ground);
        await writeModel(paths, model);
        const info = await draw(paths, model, config, "iso", 0, 1, true);
        return [
          "\u3010\u5DE5\u574A\u5F00\u597D\u4E86\u3011",
          `\u540D\u5B57\uFF1A${model.name}`,
          `\u5927\u5C0F\uFF1A${size}\xD7${size}\xD7${size} \u683C\uFF08\u5DE6\u53F3 x\u3001\u4E0A\u4E0B y\u3001\u524D\u540E z \u90FD\u4ECE 0 \u6570\u5230 ${size - 1}\uFF09`,
          `\u5730\u9762\uFF1A${GROUND_LABEL[ground]}`,
          "\u73B0\u5728\u91CC\u9762\u7A7A\u7A7A\u7684\uFF0C\u7B2C\u4E00\u4EF6\u79EF\u6728\u7B49\u7740\u4F60\u653E\u3002",
          "",
          `\u6BD4\u5982\uFF1Akid3d_build shape box at [6,0,6] size [4,4,4] color \u7EA2`,
          "",
          presentHint(info.file),
          filesHint(info.file, info.htmlFile) + archived
        ].join("\n");
      }
    }),
    defineTool({
      name: "kid3d_build",
      description: "\u5F80\u5DE5\u574A\u91CC\u653E\u4E00\u5757\u79EF\u6728\u3002at \u662F\u8FD9\u5757\u79EF\u6728\u6700\u5C0F\u89D2\u7684\u5750\u6807 [\u5DE6\u53F3,\u4E0A\u4E0B,\u524D\u540E]\uFF08\u683C\u5B50\uFF09\uFF0Csize \u662F\u5B83\u4E09\u4E2A\u65B9\u5411\u5404\u5360\u51E0\u683C\u3002\u65B9\u5757\u53EA\u80FD\u7528\u6574\u6570\u683C\uFF0C\u7403/\u5706\u67F1/\u5706\u9525/\u68F1\u9525/\u5706\u73AF\u53EF\u4EE5\u7528\u5C0F\u6570\u3002\u79EF\u6728\u53EF\u4EE5\u53E0\u3001\u53EF\u4EE5\u91CD\u53E0\uFF0C\u91CD\u53E0\u7684\u5730\u65B9\u8C01\u540E\u653E\u5C31\u7528\u8C01\u7684\u989C\u8272\u3002\u653E\u597D\u4F1A\u81EA\u52A8\u66F4\u65B0\u4F5C\u54C1\u56FE\u3002",
      parameters: {
        shape: {
          type: "string",
          enum: [...SHAPES],
          description: `\u5F62\u72B6\uFF1A${SHAPES.map((s) => `${s}\uFF08${SHAPE_LABEL[s]}\uFF09`).join("\u3001")}\u3002\u4E0D\u5199\u5C31\u662F\u65B9\u5757 box\u3002`
        },
        at: {
          type: "array",
          items: { type: "number" },
          description: "\u653E\u5728\u54EA\u91CC\uFF1A\u4E09\u4E2A\u6570\u5B57 [x,y,z]\uFF0C\u662F\u8FD9\u5757\u79EF\u6728\u6700\u5C0F\u89D2\u7684\u683C\u5B50\u5750\u6807\uFF0C\u6BD4\u5982 [6,0,6]\u3002"
        },
        size: {
          type: "array",
          items: { type: "number" },
          description: "\u591A\u5927\uFF1A\u4E09\u4E2A\u6570\u5B57 [\u5BBD,\u9AD8,\u6DF1]\uFF0C\u5404\u5360\u51E0\u683C\uFF0C\u6BD4\u5982 [4,4,4]\u3002"
        },
        color: {
          type: "string",
          description: `\u989C\u8272\uFF1A${paletteList()}\uFF0C\u4E5F\u53EF\u4EE5\u76F4\u63A5\u5199 #ff8800 \u8FD9\u6837\u7684\u8272\u53F7\u3002\u4E0D\u5199\u5C31\u662F\u84DD\u8272\u3002`
        },
        axis: {
          type: "string",
          enum: [...AXES],
          description: "\u8EBA\u7740\u7684\u65B9\u5411\uFF08\u53EA\u6709\u5706\u67F1/\u5706\u9525/\u5706\u73AF\u7528\u5F97\u4E0A\uFF09\uFF1Ax \u671D\u5DE6\u53F3\u8EBA\u3001y \u7AD6\u7740\u7AD9\u3001z \u671D\u524D\u540E\u8EBA\u3002\u4E0D\u5199\u5C31\u662F y\u3002"
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const { model, created } = await loadOrCreate(paths, config);
        if (model.pieces.length >= config.maxPieces) {
          return `\u3010\u79EF\u6728\u592A\u591A\u5566\u3011\u8FD9\u95F4\u5DE5\u574A\u5DF2\u7ECF\u653E\u4E86 ${model.pieces.length} \u4EF6\uFF08\u4E0A\u9650 ${config.maxPieces} \u4EF6\uFF09\uFF0C\u5148\u62C6\u6389\u51E0\u4EF6\u518D\u653E\u5427\uFF1Akid3d_erase at [x,y,z] size [\u5BBD,\u9AD8,\u6DF1]\u3002`;
        }
        const result = makePiece(
          { shape: args.shape, at: args.at, size: args.size, color: args.color, axis: args.axis },
          model,
          model.pieces.length + 1
        );
        if (!result.ok) return result.message;
        const piece = result.piece;
        const stacked = piecesTouching(model, piece.at, piece.size);
        model.pieces.push(piece);
        touch(model);
        await writeModel(paths, model);
        const info = await draw(paths, model, config, "iso", 0, 1, true);
        const overlap = stacked.length > 0 ? `
\u5B83\u548C ${stacked.length} \u4EF6\u79EF\u6728\u8D34\u5728\u4E00\u8D77/\u53E0\u5728\u4E00\u8D77\uFF0C\u4F1A\u8FDE\u6210\u4E00\u5757\u3002` : "";
        const opened = created ? "\n\uFF08\u5DE5\u574A\u8FD8\u6CA1\u5F00\uFF0C\u6211\u5148\u66FF\u4F60\u5F00\u4E86\u4E00\u95F4\u8349\u5730\u5DE5\u574A\u3002\uFF09" : "";
        return [
          "\u3010\u653E\u597D\u4E86\u3011",
          `${describePiece(piece)}`,
          pieceSummary(model),
          overlap + opened,
          "",
          presentHint(info.file),
          filesHint(info.file) + slowNote(info)
        ].join("\n");
      }
    }),
    defineTool({
      name: "kid3d_erase",
      description: "\u62C6\u6389\u548C\u67D0\u5757\u533A\u57DF\u6709\u63A5\u89E6\u7684\u79EF\u6728\uFF08\u6574\u4EF6\u6574\u4EF6\u5730\u62C6\uFF0C\u4E0D\u662F\u5207\u4E00\u534A\uFF09\u3002at \u662F\u8981\u62C6\u7684\u4F4D\u7F6E\uFF0Csize \u662F\u8FD9\u5757\u533A\u57DF\u7684\u5927\u5C0F\uFF1B\u4E0D\u5199 size \u5C31\u662F 1 \u683C\uFF0C\u6B63\u597D\u70B9\u5230\u54EA\u4EF6\u62C6\u54EA\u4EF6\u3002\u62C6\u5B8C\u4F1A\u81EA\u52A8\u66F4\u65B0\u4F5C\u54C1\u56FE\u3002",
      parameters: {
        at: {
          type: "array",
          items: { type: "number" },
          description: "\u8981\u62C6\u54EA\u91CC\uFF1A\u4E09\u4E2A\u6570\u5B57 [x,y,z]\uFF0C\u7528\u79EF\u6728\u5DE6\u4E0B\u524D\u89D2\u7684\u5750\u6807\u3002"
        },
        size: {
          type: "array",
          items: { type: "number" },
          description: "\u8981\u62C6\u7684\u8303\u56F4\u6709\u591A\u5927\uFF1A[\u5BBD,\u9AD8,\u6DF1]\uFF0C\u4E0D\u5199\u5C31\u662F [1,1,1]\u3002"
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const model = await readModel(paths);
        if (model === void 0) return "\u3010\u8FD8\u6CA1\u5F00\u5DE5\u574A\u3011\u5148\u8C03 kid3d_new \u5F00\u4E00\u95F4\uFF0C\u6216\u8005\u76F4\u63A5\u8C03 kid3d_build \u653E\u79EF\u6728\uFF0C\u6211\u4F1A\u81EA\u52A8\u5F00\u4E00\u95F4\u3002";
        if (model.pieces.length === 0) return "\u3010\u5DE5\u574A\u662F\u7A7A\u7684\u3011\u73B0\u5728\u6CA1\u6709\u79EF\u6728\u53EF\u4EE5\u62C6\uFF0C\u5148\u653E\u4E00\u4EF6\u5427\uFF1Akid3d_build at [6,0,6] size [4,4,4]\u3002";
        const at = numbers3(args.at);
        if (at === void 0) {
          return `\u3010\u8981\u544A\u8BC9\u6211\u62C6\u54EA\u91CC\u3011at \u8981\u5199\u4E09\u4E2A\u6570\u5B57\uFF0C\u6BD4\u5982 at [6,0,0]\u3002\u73B0\u5728\u91CC\u9762\u6709\uFF1A
${model.pieces.slice(0, 5).map((piece) => `\xB7 ${describePiece(piece)}`).join("\n")}`;
        }
        const size = vec3(args.size, [1, 1, 1]);
        const targets = piecesTouching(model, at, size);
        if (targets.length === 0) {
          return `\u3010\u90A3\u513F\u6CA1\u6709\u79EF\u6728\u3011(${at.map((n) => round(n, 2)).join(", ")}) \u9644\u8FD1\u662F\u7A7A\u7684\u3002\u73B0\u5728\u91CC\u9762\u6709\uFF1A
${model.pieces.slice(0, 5).map((piece) => `\xB7 ${describePiece(piece)}`).join("\n")}`;
        }
        const removed = new Set(targets.map((piece) => piece.id));
        model.pieces = model.pieces.filter((piece) => !removed.has(piece.id));
        touch(model);
        await writeModel(paths, model);
        const info = await draw(paths, model, config, "iso", 0, 1, true);
        return [
          `\u3010\u62C6\u6389\u4E86 ${targets.length} \u4EF6\u3011`,
          targets.slice(0, 4).map((piece) => `\xB7 ${describePiece(piece)}`).join("\n"),
          pieceSummary(model),
          "",
          presentHint(info.file),
          filesHint(info.file) + slowNote(info)
        ].join("\n");
      }
    }),
    defineTool({
      name: "kid3d_paint",
      description: "\u7ED9\u548C\u67D0\u5757\u533A\u57DF\u6709\u63A5\u89E6\u7684\u79EF\u6728\u6362\u989C\u8272\uFF08\u6574\u4EF6\u6362\uFF09\u3002at/size \u548C kid3d_erase \u4E00\u6837\uFF1B\u5199\u4E0A from \u5C31\u53EA\u6362\u672C\u6765\u662F\u8FD9\u4E2A\u989C\u8272\u7684\u90A3\u4E9B\u3002\u6362\u5B8C\u4F1A\u81EA\u52A8\u66F4\u65B0\u4F5C\u54C1\u56FE\u3002",
      parameters: {
        at: {
          type: "array",
          items: { type: "number" },
          description: "\u5237\u54EA\u91CC\uFF1A\u4E09\u4E2A\u6570\u5B57 [x,y,z]\u3002\u4E0D\u5199\u5C31\u662F\u628A\u6574\u4E2A\u4F5C\u54C1\u90FD\u5237\u4E00\u904D\u3002"
        },
        size: {
          type: "array",
          items: { type: "number" },
          description: "\u5237\u591A\u5927\u8303\u56F4\uFF1A[\u5BBD,\u9AD8,\u6DF1]\uFF0C\u4E0D\u5199\u5C31\u662F [1,1,1]\u3002"
        },
        color: {
          type: "string",
          description: `\u5237\u6210\u4EC0\u4E48\u989C\u8272\uFF1A${paletteList()}\uFF0C\u4E5F\u53EF\u4EE5\u5199 #ff8800\u3002`
        },
        from: {
          type: "string",
          description: "\u53EA\u5237\u672C\u6765\u662F\u8FD9\u4E2A\u989C\u8272\u7684\u79EF\u6728\uFF0C\u6BD4\u5982 from \u7EA2\u3002\u4E0D\u5199\u5C31\u662F\u5168\u90FD\u5237\u3002"
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const model = await readModel(paths);
        if (model === void 0 || model.pieces.length === 0) {
          return "\u3010\u5DE5\u574A\u662F\u7A7A\u7684\u3011\u6CA1\u6709\u79EF\u6728\u53EF\u4EE5\u5237\uFF0C\u5148\u653E\u4E00\u4EF6\u5427\uFF1Akid3d_build at [6,0,6] size [4,4,4] color \u7EA2\u3002";
        }
        if (typeof args.color !== "string" || args.color.trim() === "") {
          return `\u3010\u8981\u5237\u6210\u4EC0\u4E48\u989C\u8272\u3011\u5728 color \u91CC\u5199\u4E00\u4E2A\u989C\u8272\uFF0C\u6BD4\u5982 color \u7EA2\u3002\u73B0\u5728\u80FD\u7528\u7684\u989C\u8272\u6709\uFF1A${paletteList()}\u3002`;
        }
        const color = knownColor(args.color);
        if (color === void 0) {
          return `\u3010\u4E0D\u8BA4\u8BC6\u300C${args.color}\u300D\u8FD9\u4E2A\u989C\u8272\u3011\u53EF\u4EE5\u5199\u8FD9\u4E9B\u540D\u5B57\uFF1A${paletteList()}\uFF1B\u4E5F\u53EF\u4EE5\u5199 #ff8800 \u8FD9\u6837\u7684\u8272\u53F7\u3002`;
        }
        const at = numbers3(args.at) ?? [0, 0, 0];
        const size = numbers3(args.size) ?? [model.size[0], model.size[1], model.size[2]];
        const fromText = typeof args.from === "string" ? args.from.trim() : "";
        const from3 = fromText === "" ? void 0 : knownColor(fromText);
        if (fromText !== "" && from3 === void 0) {
          return `\u3010\u4E0D\u8BA4\u8BC6\u300C${fromText}\u300D\u8FD9\u4E2A\u989C\u8272\u3011from \u8981\u5199\u79EF\u6728\u73B0\u5728\u7684\u989C\u8272\uFF0C\u6BD4\u5982 from \u7EA2\uFF1B\u80FD\u7528\u7684\u989C\u8272\u6709\uFF1A${paletteList()}\u3002`;
        }
        const targets = piecesTouching(model, at, size).filter(
          (piece) => from3 === void 0 || piece.color === from3
        );
        if (targets.length === 0) {
          return `\u3010\u6CA1\u627E\u5230\u8981\u5237\u7684\u79EF\u6728\u3011${from3 === void 0 ? "\u90A3\u5757\u5730\u65B9\u662F\u7A7A\u7684" : `\u90A3\u91CC\u6CA1\u6709${colorName(from3)}\u7684\u79EF\u6728`}\u3002${pieceSummary(model)}\u3002`;
        }
        for (const piece of targets) piece.color = color;
        touch(model);
        await writeModel(paths, model);
        const info = await draw(paths, model, config, "iso", 0, 1, true);
        return [
          `\u3010\u5237\u597D\u4E86\u3011\u628A ${targets.length} \u4EF6\u79EF\u6728\u5237\u6210\u4E86${colorName(color)}`,
          pieceSummary(model),
          "",
          presentHint(info.file),
          filesHint(info.file) + slowNote(info)
        ].join("\n");
      }
    }),
    defineTool({
      name: "kid3d_template",
      description: "\u4E00\u952E\u642D\u51FA\u4E00\u4E2A\u73B0\u6210\u7684\u4F5C\u54C1\uFF08\u5C0F\u623F\u5B50\u3001\u5C0F\u57CE\u5821\u3001\u5C0F\u706B\u7BAD\u3001\u5927\u6811\u3001\u96EA\u4EBA\u3001\u5C0F\u6C7D\u8F66\u3001\u5C0F\u8239\u3001\u7231\u5FC3\u3001\u5C0F\u732B\u3001\u673A\u5668\u4EBA\uFF09\uFF0C\u4F1A\u5F00\u4E00\u95F4\u65B0\u5DE5\u574A\u3001\u628A\u91CC\u9762\u7684\u79EF\u6728\u6446\u597D\u3002\u6CE8\u610F\uFF1A\u8FD9\u4F1A\u6362\u6389\u73B0\u5728\u5DE5\u574A\u91CC\u7684\u4F5C\u54C1\uFF0C\u65E7\u7684\u90A3\u4EF6\u4F1A\u5148\u5B58\u8FDB \u5B58\u6863/\u3002",
      parameters: {
        template: {
          type: "string",
          enum: TEMPLATES.map((template) => template.key),
          description: `\u8981\u54EA\u4E00\u4E2A\uFF1A${templateList()}\u3002`
        },
        name: {
          type: "string",
          description: "\u4F5C\u54C1\u540D\u5B57\uFF0C\u4E0D\u5199\u5C31\u7528\u6A21\u677F\u81EA\u5DF1\u7684\u540D\u5B57\uFF0C\u6BD4\u5982\u300C\u5C0F\u623F\u5B50\u300D\u3002"
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const key = typeof args.template === "string" ? args.template : "";
        const template = findTemplate(key);
        if (template === void 0) {
          return `\u3010\u6CA1\u6709\u8FD9\u4E2A\u6A21\u677F\u3011\u80FD\u4E00\u952E\u642D\u51FA\u6765\u7684\u6709\uFF1A
${TEMPLATES.map(
            (item) => `\xB7 ${item.key}\uFF08${item.name}\uFF09\uFF1A${item.hint}`
          ).join("\n")}`;
        }
        const previous = await readModel(paths);
        let archived = "";
        if (previous !== void 0 && previous.pieces.length > 0) {
          const file = await archiveModel(paths, previous);
          if (file !== void 0) archived = `
\u4E0A\u4E00\u4EF6\u4F5C\u54C1\u300C${previous.name}\u300D\u5DF2\u7ECF\u6536\u8FDB \u5B58\u6863/\uFF1A${file}`;
        }
        const name2 = normalizeName(typeof args.name === "string" ? args.name : template.name, template.name);
        const size = Math.max(config.defaultSize, TEMPLATE_SIZE);
        const model = emptyModel(name2, size, template.ground);
        const built = buildTemplate(template, model, 1);
        if (!built.ok) return built.message;
        model.pieces = built.pieces;
        touch(model);
        await writeModel(paths, model);
        const info = await draw(paths, model, config, "iso", 0, 1, true);
        const note = size === config.defaultSize ? "" : `
\uFF08\u4E3A\u4E86\u653E\u4E0B\u5B83\uFF0C\u5DE5\u574A\u5F00\u6210\u4E86 ${size}\xD7${size}\xD7${size} \u683C\u3002\uFF09`;
        return [
          `\u3010${template.name}\u505A\u597D\u4E86\u3011`,
          `${template.hint}`,
          `${built.pieces.length} \u4EF6\u79EF\u6728\uFF0C${pieceSummary(model)}`,
          note + archived,
          "",
          presentHint(info.file),
          filesHint(info.file, info.htmlFile) + slowNote(info)
        ].join("\n");
      }
    }),
    defineTool({
      name: "kid3d_open",
      description: "\u6253\u5F00 \u5B58\u6863/ \u91CC\u4EE5\u524D\u6536\u8D77\u6765\u7684\u4F5C\u54C1\u63A5\u7740\u73A9\uFF08\u73B0\u5728\u8FD9\u95F4\u5DE5\u574A\u91CC\u7684\u4F5C\u54C1\u4F1A\u5148\u81EA\u52A8\u6536\u8FDB \u5B58\u6863/\uFF0C\u4E0D\u4F1A\u4E22\uFF09\uFF0C\u5E76\u4E14\u753B\u4E00\u5F20\u65B0\u7684\u7ACB\u4F53\u56FE\u3002\u4E0D\u5199 name \u5C31\u53EA\u628A\u5B58\u6863\u6E05\u5355\u5FF5\u7ED9\u5C0F\u670B\u53CB\u542C\uFF1A\u6709\u54EA\u4E9B\u4F5C\u54C1\u3001\u5404\u51E0\u4EF6\u79EF\u6728\u3001\u4EC0\u4E48\u65F6\u5019\u5B58\u7684\u3002",
      parameters: {
        name: {
          type: "string",
          description: "\u8981\u6253\u5F00\u54EA\u4E00\u4EF6\uFF1A\u4F5C\u54C1\u540D\u5B57\uFF0C\u6216\u8005\u6E05\u5355\u91CC\u90A3\u4E00\u6574\u884C\u6587\u4EF6\u540D\uFF08\u540C\u540D\u6709\u51E0\u4EF6\u65F6\u5C31\u5199\u6587\u4EF6\u540D\uFF09\u3002\u4E0D\u5199\u5C31\u53EA\u5217\u6E05\u5355\u3002"
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const entries = await listArchive(paths);
        const raw = typeof args.name === "string" ? args.name.trim() : "";
        if (entries.length === 0) {
          return [
            "\u3010\u5B58\u6863\u91CC\u8FD8\u7A7A\u7740\u3011",
            "\u6BCF\u6B21\u7528 kid3d_new \u5F00\u65B0\u5DE5\u574A\u3001\u6216\u8005\u6362\u4F5C\u54C1\u65F6\uFF0C\u4E0A\u4E00\u4EF6\u4F1A\u81EA\u52A8\u6536\u8FDB \u5B58\u6863/\u3002",
            "\u73B0\u5728\u8FD9\u95F4\u5DE5\u574A\u91CC\u7684\u4F5C\u54C1\uFF0C\u76F4\u63A5\u7528 kid3d_view \u5C31\u80FD\u770B\u3002"
          ].join("\n");
        }
        if (raw === "") {
          return [
            `\u3010\u5B58\u6863\u91CC\u6709 ${entries.length} \u4EF6\u4F5C\u54C1\u3011\uFF08\u6700\u65B0\u7684\u6392\u524D\u9762\uFF09`,
            archiveLines(entries),
            "",
            "\u8981\u63A5\u7740\u73A9\u54EA\u4E00\u4EF6\uFF0C\u5C31\u628A\u5B83\u7684\u540D\u5B57\uFF08\u6216\u8005\u90A3\u4E00\u6574\u884C\u6587\u4EF6\u540D\uFF09\u5199\u8FDB name\u3002"
          ].join("\n");
        }
        const bare = normalizeName(raw, "");
        const matches = entries.filter(
          (entry) => entry.file === raw || entry.file.includes(raw) || bare !== "" && entry.name.includes(bare)
        );
        const target = matches[0];
        if (target === void 0) {
          return [
            `\u3010\u5B58\u6863\u91CC\u6CA1\u627E\u5230\u300C${raw}\u300D\u3011`,
            archiveLines(entries),
            "",
            "\u60F3\u6253\u5F00\u54EA\u4E00\u4EF6\uFF0C\u628A\u90A3\u4E00\u6574\u884C\u6587\u4EF6\u540D\u539F\u6837\u5199\u8FDB name \u5C31\u884C\u3002"
          ].join("\n");
        }
        if (matches.length > 1) {
          return [
            `\u3010\u6709 ${matches.length} \u4EF6\u90FD\u53EB\u300C${raw}\u300D\uFF0C\u8981\u54EA\u4E00\u4EF6\uFF1F\u3011`,
            archiveLines(matches),
            "",
            "\u628A\u4F60\u8981\u7684\u90A3\u4E00\u884C\u6587\u4EF6\u540D\u539F\u6837\u5199\u8FDB name\u3002"
          ].join("\n");
        }
        const model = await readArchive(paths, target.file);
        if (model === void 0) {
          return `\u3010\u8FD9\u4EF6\u6253\u4E0D\u5F00\u3011\u5B58\u6863\u6587\u4EF6 ${target.file} \u8BFB\u4E0D\u51FA\u6765\uFF08\u53EF\u80FD\u5DF2\u7ECF\u5220\u6389\u6216\u8005\u574F\u4E86\uFF09\u3002\u53EF\u4EE5\u4E0D\u5E26 name \u518D\u770B\u4E00\u904D\u6E05\u5355\u3002`;
        }
        const current = await readModel(paths);
        let archived = "";
        if (current !== void 0 && current.pieces.length > 0) {
          const file = await archiveModel(paths, current);
          if (file !== void 0) archived = `
\u521A\u624D\u90A3\u4EF6\u300C${current.name}\u300D\u4E5F\u6536\u8FDB \u5B58\u6863/ \u4E86\uFF1A${file}`;
        }
        await writeModel(paths, model);
        const info = await draw(paths, model, config, "iso", 0, 1, true);
        return [
          `\u3010\u6253\u5F00\u5566\u3011\u300C${model.name}\u300D\u56DE\u6765\u4E86\uFF08${stampText(target.time)} \u5B58\u7684\uFF09`,
          `${modelSummary(model)}${archived}`,
          "",
          presentHint(info.file),
          htmlNote(info, config),
          filesHint(info.file) + slowNote(info)
        ].join("\n");
      }
    }),
    defineTool({
      name: "kid3d_view",
      description: "\u770B\u73B0\u5728\u7684\u4F5C\u54C1\uFF1A\u753B\u4E00\u5F20\u5E73\u9762\u7ACB\u4F53\u56FE\uFF08SVG\uFF0C\u4E00\u5B9A\u6709\uFF09\uFF0C\u5E76\u4E14\u66F4\u65B0\u4F1A\u8F6C\u5708\u7684\u7F51\u9875\uFF08HTML\uFF09\u3002view \u9009\u89D2\u5EA6\uFF1Aiso \u659C\u7740\u770B\uFF08\u9ED8\u8BA4\uFF09\u3001front \u6B63\u9762\u3001side \u4FA7\u9762\u3001top \u4ECE\u4E0A\u9762\u770B\u3001quad \u56DB\u4E2A\u89D2\u5EA6\u62FC\u4E00\u5F20\u3002\u60F3\u770B\u5F97\u66F4\u7ACB\u4F53\u5C31\u8C03 spin\uFF0C\u8BA9\u753B\u9762\u8F6C\u4E00\u4E2A\u89D2\u5EA6\u3002\u753B\u5B8C\u628A\u6587\u4EF6 present \u7ED9\u5C0F\u670B\u53CB\u770B\u3002",
      parameters: {
        view: {
          type: "string",
          enum: [...VIEW_NAMES],
          description: `\u4ECE\u54EA\u4E2A\u89D2\u5EA6\u753B\uFF1A${VIEW_NAMES.map((view) => `${view}\uFF08${VIEW_LABEL[view]}\uFF09`).join("\u3001")}\u3002\u4E0D\u5199\u5C31\u662F iso\u3002`
        },
        spin: {
          type: "number",
          description: "\u591A\u8F6C\u4E00\u70B9\u89D2\u5EA6\uFF080~360 \u5EA6\uFF09\uFF0C\u4E0D\u5199\u5C31\u662F 0\u3002quad \u62FC\u56FE\u6A21\u5F0F\u4E0B\u53EA\u6709\u659C\u89C6\u56FE\u4F1A\u8F6C\u3002"
        },
        zoom: {
          type: "number",
          description: "\u653E\u5927\u500D\u6570 0.5~2\uFF0C\u4E0D\u5199\u5C31\u662F 1\u3002\u4F5C\u54C1\u592A\u5C0F\u770B\u4E0D\u6E05\u65F6\u53EF\u4EE5\u653E\u5927\u3002"
        },
        grid: {
          type: "boolean",
          description: "\u8981\u4E0D\u8981\u753B\u5730\u4E0A\u7684\u683C\u5B50\uFF0C\u9ED8\u8BA4\u8981\uFF08true\uFF09\u3002\u4E0D\u60F3\u8981\u5C31\u5199 false\u3002"
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const model = await readModel(paths);
        if (model === void 0) {
          return "\u3010\u8FD8\u6CA1\u5F00\u5DE5\u574A\u3011\u5148\u8C03 kid3d_new \u5F00\u4E00\u95F4\uFF0C\u6216\u8005 kid3d_template \u4E00\u952E\u642D\u4E00\u4E2A\u3002";
        }
        const view = pick2(args.view, VIEW_NAMES, "iso");
        const spin = clamp(numOr(args.spin, 0), 0, 360);
        const zoom = clamp(numOr(args.zoom, 1), 0.5, 2);
        const grid = truthy(args.grid, true);
        const info = await draw(paths, model, config, view, spin, zoom, grid);
        const empty = model.pieces.length === 0 ? "\n\uFF08\u5DE5\u574A\u91CC\u8FD8\u662F\u7A7A\u7684\uFF0C\u56FE\u4E0A\u53EA\u6709\u5730\u9762\u3002\u5148\u653E\u51E0\u4EF6\u79EF\u6728\u5C31\u66F4\u50CF\u6837\u4E86\u3002\uFF09" : "";
        return [
          `\u3010\u753B\u597D\u4E86\u3011${VIEW_LABEL[view]}${spin === 0 ? "" : ` \xB7 \u8F6C\u4E86 ${round(spin, 1)}\xB0`}${zoom === 1 ? "" : ` \xB7 \u653E\u5927 ${round(zoom, 2)} \u500D`}`,
          `${modelSummary(model)}`,
          `\u8FD9\u5E45\u753B\u6709 ${info.stats.faces} \u4E2A\u9762\uFF0C\u753B\u51FA\u6765 ${info.stats.drawn} \u4E2A\uFF08\u80CC\u9762\u7684\u88AB\u6321\u4F4F\u4E86\uFF0C\u770B\u4E0D\u89C1\u5C31\u4E0D\u753B\uFF09\u3002`,
          empty,
          "",
          presentHint(info.file),
          htmlNote(info, config),
          filesHint(info.file) + slowNote(info)
        ].join("\n");
      }
    }),
    defineTool({
      name: "kid3d_export",
      description: "\u628A\u4F5C\u54C1\u6253\u5305\u6210\u80FD\u5E26\u8D70\u7684\u6587\u4EF6\uFF1Astl\uFF083D \u6253\u5370\u7528\u7684\u7ACB\u4F53\u6A21\u578B\uFF0C\u5355\u4F4D\u6BEB\u7C73\uFF09\u3001obj\uFF083D \u8F6F\u4EF6\u80FD\u6253\u5F00\u7684\u6837\u5B50\uFF09\u3001html\uFF08\u4F1A\u8F6C\u5708\u7684\u7F51\u9875\uFF0C\u53EF\u4EE5\u76F4\u63A5\u53D1\u7ED9\u522B\u4EBA\uFF09\u3002format \u5199 all \u5C31\u4E09\u4E2A\u90FD\u8981\u3002",
      parameters: {
        format: {
          type: "string",
          enum: [...FORMATS],
          description: "\u8981\u54EA\u79CD\uFF1Astl\u3001obj\u3001html\uFF0C\u6216\u8005 all\uFF08\u5168\u90FD\u8981\uFF0C\u9ED8\u8BA4\uFF09\u3002"
        }
      },
      output: {
        schema: { type: "string" },
        render: (_args, value) => [{ type: "text", text: value }]
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config);
        const model = await readModel(paths);
        if (model === void 0 || model.pieces.length === 0) {
          return "\u3010\u5DE5\u574A\u662F\u7A7A\u7684\u3011\u8FD8\u6CA1\u6709\u4E1C\u897F\u53EF\u4EE5\u6253\u5305\uFF0C\u5148\u653E\u51E0\u4EF6\u79EF\u6728\uFF1Akid3d_build at [6,0,6] size [4,4,4]\u3002";
        }
        const wanted = pick2(args.format, FORMATS, "all");
        const mesh = buildMesh(model);
        const bounds = modelBounds(model);
        const lines = [`\u3010\u6253\u5305\u597D\u4E86\u3011${model.name}`];
        if (wanted === "stl" || wanted === "all") {
          const stl = buildStl(mesh, config.unitMm);
          const file = fileFor(paths, model.name, "stl");
          await writeBinary(paths, file, stl);
          const size = [0, 1, 2].map(
            (axis) => round(((bounds.max[axis] ?? 0) - (bounds.min[axis] ?? 0)) * config.unitMm, 1)
          );
          lines.push(
            `\xB7 ${file}\uFF08${Math.round(stl.byteLength / 1024)} KB\uFF0C${stl.readUInt32LE(80)} \u4E2A\u4E09\u89D2\u9762\uFF09`,
            `  \u8FD9\u662F 3D \u6253\u5370\u7528\u7684\u6587\u4EF6\uFF0C1 \u683C = ${config.unitMm} \u6BEB\u7C73\uFF0C\u6240\u4EE5\u6253\u51FA\u6765\u5927\u7EA6\u662F ${size[0]}\xD7${size[2]}\xD7${size[1]} \u6BEB\u7C73\uFF08\u957F\xD7\u5BBD\xD7\u9AD8\uFF0Cy \u8F74\u671D\u4E0A\uFF09\u3002`
          );
        }
        if (wanted === "obj" || wanted === "all") {
          const obj = buildObj(model, mesh, config.unitMm);
          const file = fileFor(paths, model.name, "obj");
          await writeText(paths, file, obj);
          lines.push(`\xB7 ${file}\uFF08${Math.round(obj.length / 1024)} KB\uFF0C3D \u8F6F\u4EF6\u80FD\u6253\u5F00\uFF0C\u989C\u8272\u4E5F\u4E00\u8D77\u5E26\u4E0A\u4E86\uFF09`);
        }
        if (wanted === "html" || wanted === "all") {
          const info = await draw(paths, model, config, "iso", 0, 1, true);
          lines.push(`\xB7 ${info.htmlFile}\uFF08\u4F1A\u8F6C\u5708\u7684\u7F51\u9875\uFF0C\u4E0D\u7528\u88C5\u4EFB\u4F55\u4E1C\u897F\uFF0C\u8C01\u90FD\u80FD\u6253\u5F00\u770B\uFF09`);
        }
        lines.push(
          "",
          "\u5173\u952E\u4E00\u53E5\uFF1ASTL \u662F\u7ED9\u6253\u5370\u673A\u770B\u7684\uFF0COBJ \u662F\u7ED9\u5EFA\u6A21\u8F6F\u4EF6\u770B\u7684\uFF0CHTML \u662F\u7ED9\u4EBA\u770B\u7684\u3002",
          "\u63D0\u793A\uFF1A\u628A\u6587\u4EF6 present \u7ED9\u5C0F\u670B\u53CB\uFF0C\u4ED6\u5C31\u80FD\u62FF\u7740\u53BB\u6253\u5370\u6216\u8005\u53D1\u7ED9\u670B\u53CB\u3002"
        );
        return lines.join("\n");
      }
    })
  ];
}

// src/index.ts
var name = "kid-3d";
function apply(ctx, raw) {
  const config = { ...DEFAULT_CONFIG, ...raw ?? {} };
  if (config.enabled) {
    ctx.inject(["tools"], (child) => {
      child.effect(() => {
        const offs = buildKid3dTools(config).map((tool) => child.tools.register(tool));
        return () => {
          for (const off of offs) if (typeof off === "function") off();
        };
      }, "kid-3d: kid3d_* \u5DE5\u5177");
    });
  }
  registerKid3dCard(ctx, { workDir: config.workDir, unitMm: config.unitMm });
}
export {
  Config,
  apply,
  buildKid3dTools,
  name
};
