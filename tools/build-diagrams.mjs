#!/usr/bin/env node
/* ==========================================================================
   build-diagrams.mjs

   Turns the models in diagrams.mjs into standalone, self-contained diagram
   pages: layout is computed here, the SVG is baked into the page, and the
   runtime in engine.js only adds interaction (pan/zoom, guided views, focus,
   search, export).

   Usage:  node tools/build-diagrams.mjs
   Then:   node inject-nav.mjs        (adds the shared site nav)
   ========================================================================== */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIAGRAMS } from './diagrams.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const ENGINE_CSS = readFileSync(resolve(HERE, 'engine.css'), 'utf8');
const SVG_CSS = readFileSync(resolve(HERE, 'svg.css'), 'utf8');
const ENGINE_JS = readFileSync(resolve(HERE, 'engine.js'), 'utf8');

/* --------------------------------------------------------------- metrics */

const PAD = 36;          // svg outer padding
const LANE_GAP = 118;    // horizontal gap between lanes
const LANE_PAD = 12;     // node inset inside a lane
const NODE_GAP = 26;     // vertical gap between stacked nodes
const TITLE_Y = 40;      // lane title baseline
const BODY_TOP = 96;     // first node's top when a lane is not centred
const CORRIDOR_BASE = 58; // first clear band used by lane-skipping edges
const CORRIDOR_STEP = 12;
const LABEL_SIZE = 11;
const SUB_SIZE = 9;
const CHAR_W = 6.6;      // mono advance at 11px
const SUB_CHAR_W = 5.4;  // mono advance at 9px

/* ------------------------------------------------------------- utilities */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, maxChars) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const next = cur ? cur + ' ' + word : word;
    if (next.length <= maxChars || !cur) cur = next;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function round(n) { return Math.round(n * 100) / 100; }

/* ---------------------------------------------------------------- layout */

function layout(model) {
  const lanes = model.lanes.map((lane, index) => ({
    id: lane.id,
    label: lane.label,
    w: lane.w || 200,
    index,
    x: 0,
    nodes: []
  }));
  const laneById = {};
  lanes.forEach((l) => { laneById[l.id] = l; });

  // Place lanes left to right.
  let x = PAD;
  for (const lane of lanes) {
    lane.x = x;
    x += lane.w + LANE_GAP;
  }
  const width = x - LANE_GAP + PAD;

  // Shape every node, then stack it inside its lane.
  const nodeW = (lane, node) => node.w || lane.w - LANE_PAD * 2;

  for (const node of model.nodes) {
    const lane = laneById[node.lane];
    if (!lane) throw new Error(`${model.slug}: node "${node.id}" is in unknown lane "${node.lane}"`);
    const w = nodeW(lane, node);
    const labelLines = wrap(node.label, Math.max(8, Math.floor((w - 30) / CHAR_W)));
    const subLines = node.sublabel ? wrap(node.sublabel, Math.max(8, Math.floor((w - 18) / SUB_CHAR_W))) : [];
    const computedH = 26 + labelLines.length * 15 + (subLines.length ? 4 + subLines.length * 12 : 0);
    const h = node.h || Math.round(computedH);
    lane.nodes.push({ ...node, w, h, labelLines, subLines });
  }

  // Lanes are centred against the tallest lane by default. A model can ask for
  // `align: 'top'` instead, which turns the layout into a comparison table —
  // right for tier or phase columns, wrong for flow diagrams.
  const topAligned = model.align === 'top';
  const contentH = {};
  lanes.forEach((lane) => {
    const total = lane.nodes.reduce((sum, n) => sum + n.h, 0) + Math.max(0, lane.nodes.length - 1) * NODE_GAP;
    contentH[lane.id] = total;
  });
  const maxContent = Math.max(1, ...Object.values(contentH));

  lanes.forEach((lane) => {
    const offset = topAligned ? 0 : (maxContent - contentH[lane.id]) / 2;
    let y = BODY_TOP + offset;
    lane.nodes.forEach((node) => {
      node.x = lane.x + LANE_PAD + Math.max(0, (lane.w - LANE_PAD * 2 - node.w) / 2);
      node.y = y;
      y += node.h + NODE_GAP;
    });
  });

  const height = BODY_TOP + maxContent + PAD + 12;
  // Flat node index for edge routing.
  const allNodes = [];
  lanes.forEach((lane) => lane.nodes.forEach((n) => allNodes.push(n)));
  const byId = {};
  allNodes.forEach((n) => { byId[n.id] = n; });

  // Lane frames.
  lanes.forEach((lane) => {
    lane.frame = {
      x: lane.x - 8,
      y: TITLE_Y - 22,
      w: lane.w + 16,
      h: BODY_TOP + maxContent + 14 - (TITLE_Y - 22)
    };
  });

  // Regions (drawn behind everything) span the nodes of the lanes they name.
  const regions = [];
  for (const region of model.regions || []) {
    const members = allNodes.filter((n) => region.lanes.indexOf(n.lane) !== -1);
    if (!members.length) continue;
    const minX = Math.min(...members.map((n) => n.x));
    const maxX = Math.max(...members.map((n) => n.x + n.w));
    const minY = Math.min(...members.map((n) => n.y));
    const maxY = Math.max(...members.map((n) => n.y + n.h));
    regions.push({
      id: region.id,
      label: region.label,
      kind: region.kind || 'region',
      x: minX - 16,
      y: minY - 30,
      w: maxX - minX + 32,
      h: maxY - minY + 44
    });
  }

  // ---- edge routing -------------------------------------------------------
  //
  // Three shapes are produced:
  //   vertical  — neighbours in the same lane, a straight line;
   //   detour   — same lane but with a node in between, so the line steps out
  //               into the neighbouring gutter and comes back in;
  //   elbow     — different lanes: out to the midpoint of the gutter, across,
  //               and in. Edges that would otherwise cut through a node in an
  //               intermediate lane are lifted into a clear band above the
  //               node stacks, which is what keeps long hops readable.

  const gapCenterX = (i) => (lanes[i].x + lanes[i].w + lanes[i + 1].x) / 2;

  const slots = { in: {}, out: {} };
  const axisUse = {};
  const detourCount = {};

  const prepared = model.edges.map((edge) => {
    const a = byId[edge.from];
    const b = byId[edge.to];
    if (!a || !b) throw new Error(`${model.slug}: edge "${edge.id}" references a missing node`);
    const la = laneById[a.lane];
    const lb = laneById[b.lane];
    const sameLane = la.id === lb.id;
    const goingRight = lb.index > la.index;

    if (sameLane) {
      const ia = la.nodes.indexOf(a);
      const ib = la.nodes.indexOf(b);
      const detour = Math.abs(ia - ib) > 1;
      // Detours are trunked per source: a hub fanning to six stacked nodes gets
      // one spine in the gutter with six taps, not six parallel lines.
      let detourSlot = 0;
      if (detour) {
        const sources = (detourCount[la.id] = detourCount[la.id] || []);
        if (sources.indexOf(a.id) === -1) sources.push(a.id);
        detourSlot = sources.indexOf(a.id);
      }
      // The last lane detours into its left gutter, where there is room for the
      // caption; every other lane steps out to the right.
      const side = la.index === lanes.length - 1 ? -1 : 1;
      return { edge, a, b, la, lb, sameLane, goingRight, kind: detour ? 'detour' : 'vertical', detourSlot, side };
    }

    const sourceKey = a.id + (goingRight ? ':right' : ':left');
    const targetKey = b.id + (goingRight ? ':left' : ':right');
    (slots.in[targetKey] = slots.in[targetKey] || []).push(edge.id);

    // The gutter the line travels in: the one beside the source lane, and for a
    // long hop also the one beside the target lane.
    const nearGap = goingRight ? la.index : la.index - 1;
    const farGap = goingRight ? lb.index - 1 : lb.index;
    (axisUse[nearGap] = axisUse[nearGap] || []).push(edge.id + ':' + nearGap);
    if (Math.abs(lb.index - la.index) > 1) {
      (axisUse[farGap] = axisUse[farGap] || []).push(edge.id + ':' + farGap);
    }
    return { edge, a, b, la, lb, sameLane, goingRight, kind: 'elbow', nearGap, farGap, sourceKey, targetKey, midY: (a.y + a.h / 2 + b.y + b.h / 2) / 2 };
  });

  // Stagger lines that share a gutter so a bus reads as parallel wires.
  const axisOffset = {};
  Object.keys(axisUse).forEach((gap) => {
    const list = axisUse[gap];
    const span = Math.max(4, Math.min(14, (LANE_GAP - 26) / Math.max(1, list.length)));
    list.forEach((key, i) => {
      axisOffset[key] = (i - (list.length - 1) / 2) * span;
    });
  });

  // Captions in one gutter are clustered by height and laid out on rows inside
  // their cluster, so two captions whose lines run close together are pushed
  // apart while each stays next to its own edge.
  const axisLabelRow = {};
  const labelsByGap = {};
  prepared.forEach((item) => {
    if (item.kind !== 'elbow' || !item.edge.label) return;
    (labelsByGap[item.nearGap] = labelsByGap[item.nearGap] || []).push(item);
  });
  Object.keys(labelsByGap).forEach((gap) => {
    const items = labelsByGap[gap].slice().sort((p, q) => p.midY - q.midY);
    let cluster = [];
    const flush = () => {
      const mean = cluster.reduce((sum, p) => sum + p.midY + 3, 0) / cluster.length;
      cluster.forEach((p, i) => {
        axisLabelRow[p.edge.id + ':' + gap] = { y: mean, i, n: cluster.length };
      });
      cluster = [];
    };
    items.forEach((item) => {
      if (cluster.length && item.midY - cluster[cluster.length - 1].midY > 26) flush();
      cluster.push(item);
    });
    if (cluster.length) flush();
  });
  const axisX = (gap, edgeId) => round(gapCenterX(gap) + (axisOffset[edgeId + ':' + gap] || 0));

  // Egress is deliberately NOT spread: every edge leaving a node departs from
  // the same point, so a fan-out reads as one trunk that then branches. Only
  // arrivals are distributed, which is what keeps a nine-arrow bus legible.
  const slotOffset = (key, group, node, edgeId) => {
    if (group === 'out') return 0;
    const list = slots.in[key] || [];
    if (list.length < 2) return 0;
    const span = Math.max(2.5, Math.min(14, (node.h - 18) / (list.length - 1)));
    return (list.indexOf(edgeId) - (list.length - 1) / 2) * span;
  };

  // Would a straight run at this height pass through a node it skips over?
  // The band is generous because captions sit above the line as well as on it.
  const crossesNodes = (la, lb, ty) => {
    const lo = Math.min(la.index, lb.index);
    const hi = Math.max(la.index, lb.index);
    for (let i = lo + 1; i < hi; i++) {
      for (const n of lanes[i].nodes) {
        if (ty > n.y - 24 && ty < n.y + n.h + 24) return true;
      }
    }
    return false;
  };

  // Captions in a gutter are nudged to stay inside it, so they never sit on a
  // node in the lane they belong to.
  const clampToGutter = (x, w, gStart, gEnd) => {
    if (!w) return x;
    const min = gStart + w / 2 + 2;
    const max = gEnd - w / 2 - 2;
    return min <= max ? Math.min(Math.max(x, min), max) : (gStart + gEnd) / 2;
  };

  let corridorIndex = 0;
  const edges = prepared.map((item) => {
    const { edge, a, b, la, lb, sameLane, goingRight } = item;
    let d;
    let labelX;
    let labelY;

    if (item.kind === 'vertical') {
      const down = a.y < b.y;
      const sx = a.x + a.w / 2;
      const sy = down ? a.y + a.h : a.y;
      const ty = down ? b.y : b.y + b.h;
      d = `M ${round(sx)} ${round(sy)} L ${round(sx)} ${round(ty)}`;
      labelX = sx;
      labelY = (sy + ty) / 2 + 3;
      return { ...edge, d, labelX, labelY };
    }

    if (item.kind === 'detour') {
      const side = item.side;
      const sx = side === 1 ? a.x + a.w : a.x;
      const sy = a.y + a.h / 2;
      const tx = side === 1 ? b.x + b.w : b.x;
      const ty = b.y + b.h / 2;
      const x = round(side === 1
        ? la.x + la.w + 14 + item.detourSlot * 13
        : la.x - 14 - item.detourSlot * 13);
      d = `M ${round(sx)} ${round(sy)} H ${x} V ${round(ty)} H ${round(tx)}`;

      // Keep the caption inside the gutter it belongs to, so it is neither
      // buried under the neighbouring nodes nor spilling off the canvas.
      const prev = lanes[la.index - 1];
      const next = lanes[la.index + 1];
      const gStart = side === 1 ? la.x + la.w : (prev ? prev.x + prev.w - LANE_PAD : 0);
      const gEnd = side === 1 ? (next ? next.x + LANE_PAD : la.x + la.w + PAD) : la.x;
      const w = edge.label ? edge.label.length * SUB_CHAR_W + 10 : 0;
      labelX = clampToGutter(x, w, gStart, gEnd);
      labelY = (sy + ty) / 2 + 3;
      return { ...edge, d, labelX, labelY };
    }

    const sx = goingRight ? a.x + a.w : a.x;
    const sy = a.y + a.h / 2 + slotOffset(item.sourceKey, 'out', a, edge.id);
    const tx = goingRight ? b.x : b.x + b.w;
    const ty = b.y + b.h / 2 + slotOffset(item.targetKey, 'in', b, edge.id);
    const near = axisX(item.nearGap, edge.id);

    if (Math.abs(lb.index - la.index) === 1) {
      d = `M ${round(sx)} ${round(sy)} H ${near} V ${round(ty)} H ${round(tx)}`;
      const prev = lanes[la.index - 1];
      const next = lanes[la.index + 1];
      const gStart = goingRight ? la.x + la.w : (prev ? prev.x + prev.w - LANE_PAD : 0);
      const gEnd = goingRight ? (next ? next.x + LANE_PAD : la.x + la.w + PAD) : la.x;
      const w = edge.label ? edge.label.length * SUB_CHAR_W + 10 : 0;
      // Captions sharing a gutter get their own row, so two labels never land
      // on the same pixel even when their lines run close together.
      const row = axisLabelRow[edge.id + ':' + item.nearGap];
      labelX = clampToGutter(near, w, gStart, gEnd);
      labelY = row ? row.y + (row.i - (row.n - 1) / 2) * 15 : (sy + ty) / 2 + 3;
      return { ...edge, d, labelX, labelY };
    }

    if (!crossesNodes(la, lb, ty)) {
      // Clear run: one elbow, then straight across at the target's height.
      d = `M ${round(sx)} ${round(sy)} H ${near} V ${round(ty)} H ${round(tx)}`;
      labelX = (near + tx) / 2;
      labelY = round(ty) - 11;
      return { ...edge, d, labelX, labelY };
    }

    // Blocked: lift into a clear band above the node stacks and come down in
    // the gutter beside the target lane.
    const corridor = CORRIDOR_BASE + (corridorIndex++ % 4) * CORRIDOR_STEP;
    const far = axisX(item.farGap, edge.id);
    d = `M ${round(sx)} ${round(sy)} H ${near} V ${corridor} H ${far} V ${round(ty)} H ${round(tx)}`;
    // Corridor captions sit above the line, one slot per band, nudged sideways
    // far enough that a neighbouring band's caption cannot touch them.
    const slot = Math.round((corridor - CORRIDOR_BASE) / CORRIDOR_STEP);
    const cw = edge.label ? edge.label.length * SUB_CHAR_W + 10 : 0;
    const mid = (near + far) / 2 + (slot % 2 === 1 ? -1 : 1) * (cw / 2 + 6);
    labelX = Math.min(Math.max(mid, cw / 2 + 4), width - cw / 2 - 4);
    labelY = corridor - 4;
    return { ...edge, d, labelX, labelY };
  });

  // Final separation pass: any two captions still touching are pushed apart
  // within a small slack, so the box a reader sees is never double-printed.
  const labelItems = edges
    .filter((e) => e.label)
    .map((e) => ({ edge: e, naturalY: e.labelY, y: e.labelY, w: e.label.length * SUB_CHAR_W + 10 }));
  const rectOf = (l) => ({ x: l.edge.labelX - l.w / 2, y: l.y - 10, w: l.w, h: 13 });
  for (let pass = 0; pass < 8; pass++) {
    let moved = false;
    for (let i = 0; i < labelItems.length; i++) {
      for (let j = i + 1; j < labelItems.length; j++) {
        const a = rectOf(labelItems[i]);
        const b = rectOf(labelItems[j]);
        if (!overlap(a, b)) continue;
        const item = labelItems[j];
        const down = item.y + 15;
        const up = item.y - 15;
        item.y = Math.abs(down - item.naturalY) <= Math.abs(up - item.naturalY) ? down : up;
        moved = true;
      }
    }
    if (!moved) break;
  }
  labelItems.forEach((l) => { l.edge.labelY = round(l.y); });

  // Guided views name nodes and edges by id; a typo would silently produce an
  // empty view, so it fails the build instead.
  const edgeIds = new Set(edges.map((e) => e.id));
  for (const view of model.views || []) {
    for (const id of view.nodes || []) {
      if (!byId[id]) throw new Error(`${model.slug}: view "${view.id}" references unknown node "${id}"`);
    }
    for (const id of view.edges || []) {
      if (!edgeIds.has(id)) throw new Error(`${model.slug}: view "${view.id}" references unknown edge "${id}"`);
    }
  }

  return { lanes, regions, nodes: allNodes, edges, width: round(width), height: round(height), maxContent };
}

/* -------------------------------------------------------------- rendering */

const SIGILS = {
  frontend: '<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M2 6.5h12"/><circle cx="4.1" cy="4.8" r=".7" class="sigil-fill"/><circle cx="6.3" cy="4.8" r=".7" class="sigil-fill"/>',
  backend: '<rect x="2" y="2.5" width="12" height="5" rx="1.2"/><rect x="2" y="8.5" width="12" height="5" rx="1.2"/><path d="M4.4 5h.01M4.4 11h.01M7 5h4M7 11h4"/>',
  database: '<ellipse cx="8" cy="4" rx="6" ry="2.3"/><path d="M2 4v7.8c0 1.3 2.7 2.3 6 2.3s6-1 6-2.3V4"/><path d="M2 8c0 1.3 2.7 2.3 6 2.3S14 9.3 14 8"/>',
  cloud: '<path d="M4.4 12.5h7.4a3.1 3.1 0 0 0 .5-6.2 4.2 4.2 0 0 0-8-1.1 2.7 2.7 0 0 0 .1 7.3z"/>',
  security: '<path d="M8 2l5 2v5c0 3-2.2 4.7-5 5.4C5.2 13.7 3 12 3 9V4z"/><path d="M6 8.2l1.5 1.5L10.3 7"/>',
  external: '<circle cx="8" cy="8" r="6"/><path d="M2 8h12"/><path d="M8 2c2.3 2.1 2.3 9.9 0 12M8 2C5.7 4.1 5.7 11.9 8 14"/>',
  queue: '<path d="M8 2.4l5.4 2.9L8 8.2 2.6 5.3z"/><path d="M2.6 9.2L8 12.1l5.4-2.9"/>',
  actor: '<circle cx="8" cy="5.4" r="2.5"/><path d="M3.1 14c0-2.7 2.2-4.3 4.9-4.3s4.9 1.6 4.9 4.3"/>',
  storage: '<path d="M2.6 5.6h10.8l-.9 8.1H3.5z"/><path d="M2 2.8h12v2.3H2z"/><path d="M6.4 8.6h3.2"/>'
};

const KIND_CLASS = {
  actor: 'c-actor',
  frontend: 'c-frontend',
  backend: 'c-backend',
  database: 'c-database',
  cloud: 'c-cloud',
  security: 'c-security',
  external: 'c-external',
  queue: 'c-queue',
  storage: 'c-storage'
};

const EDGE_STYLE = {
  default: { cls: 'a-default', marker: 'arrowhead' },
  emphasis: { cls: 'a-emphasis', marker: 'arrowhead-emphasis' },
  security: { cls: 'a-security', marker: 'arrowhead-security' },
  dashed: { cls: 'a-dashed', marker: 'arrowhead-dashed' },
  return: { cls: 'a-return', marker: 'arrowhead-dashed' }
};

const KIND_LABEL = {
  actor: 'Actor', frontend: 'Client', backend: 'Service', database: 'Database',
  cloud: 'Managed platform', security: 'Trust boundary', external: 'External service',
  queue: 'Async boundary', storage: 'Storage'
};

const CSS_VARS = [
  '--bg', '--grid', '--text', '--text-muted', '--text-dim', '--text-faint',
  '--panel', '--panel-border', '--panel-hover', '--lane-fill', '--lane-stroke',
  '--arrow', '--arrow-emphasis', '--mask',
  '--frontend-fill', '--frontend-stroke', '--backend-fill', '--backend-stroke',
  '--database-fill', '--database-stroke', '--cloud-fill', '--cloud-stroke',
  '--security-fill', '--security-stroke', '--external-fill', '--external-stroke',
  '--queue-fill', '--queue-stroke', '--actor-fill', '--actor-stroke',
  '--storage-fill', '--storage-stroke', '--accent'
];

function renderNodeText(node, i) {
  const cx = round(node.x + node.w / 2);
  const totalH = node.labelLines.length * 15 + (node.subLines.length ? 4 + node.subLines.length * 12 : 0);
  const firstBaseline = node.y + (node.h - totalH) / 2 + 11;
  const out = [];
  node.labelLines.forEach((line, idx) => {
    out.push(`      <text class="t-primary" x="${cx}" y="${round(firstBaseline + idx * 15)}" font-size="${LABEL_SIZE}" font-weight="600" text-anchor="middle">${esc(line)}</text>`);
  });
  if (node.subLines.length) {
    const start = firstBaseline + node.labelLines.length * 15 + 4 + 9;
    node.subLines.forEach((line, idx) => {
      out.push(`      <text class="t-muted" x="${cx}" y="${round(start + idx * 12)}" font-size="${SUB_SIZE}" text-anchor="middle">${esc(line)}</text>`);
    });
  }
  return out.join('\n');
}

function renderSvg(model, L) {
  const parts = [];
  parts.push(`<svg id="diagram-svg" class="diagram" data-preset="classic" width="${L.width}" height="${L.height}" viewBox="0 0 ${L.width} ${L.height}" role="img" aria-labelledby="diagram-title diagram-desc" tabindex="0">`);
  parts.push(`  <title id="diagram-title">EstateSync Master Architecture — ${esc(model.title)}</title>`);
  parts.push(`  <desc id="diagram-desc">${esc(model.description)}</desc>`);
  parts.push('  <defs>');
  parts.push('    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" class="m-default"/></marker>');
  parts.push('    <marker id="arrowhead-emphasis" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" class="m-emphasis"/></marker>');
  parts.push('    <marker id="arrowhead-security" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" class="m-security"/></marker>');
  parts.push('    <marker id="arrowhead-dashed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" class="m-dashed"/></marker>');
  parts.push(`    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" class="c-grid" stroke="var(--grid)" stroke-width="0.5" fill="none"/></pattern>`);
  parts.push('  </defs>');
  parts.push(`  <rect width="100%" height="100%" fill="url(#grid)"/>`);

  // Lane frames and titles.
  L.lanes.forEach((lane) => {
    parts.push(`  <rect class="c-lane" x="${round(lane.frame.x)}" y="${round(lane.frame.y)}" width="${round(lane.frame.w)}" height="${round(lane.frame.h)}" rx="12"/>`);
    parts.push(`  <text class="c-lane-title" x="${round(lane.x + lane.w / 2)}" y="${TITLE_Y}" font-size="9" text-anchor="middle">${esc(lane.label.toUpperCase())}</text>`);
  });

  // Regions behind the edges. The frame caption is drawn last (see below) on a
  // plate of its own, so a route passing behind the frame cannot strike through
  // the words.
  const regionLabelParts = [];
  L.regions.forEach((region) => {
    const cls = region.kind === 'security-group' ? 'c-security-group' : 'c-region';
    parts.push(`  <rect class="${cls}" x="${round(region.x)}" y="${round(region.y)}" width="${round(region.w)}" height="${round(region.h)}" rx="10"/>`);
    const labelW = round(region.label.length * 5.4 + 8);
    regionLabelParts.push(`  <rect class="a-label-bg" x="${round(region.x + 8)}" y="${round(region.y + 8)}" width="${labelW}" height="12" rx="3"/>`);
    regionLabelParts.push(`  <text class="c-frame-label" x="${round(region.x + 12)}" y="${round(region.y + 18)}" font-size="9" letter-spacing="1">${esc(region.label)}</text>`);
  });

  // Edges: every path first, then every label, so a caption is never buried
  // under a line drawn by a later edge.
  const labelParts = [];
  L.edges.forEach((edge) => {
    const style = EDGE_STYLE[edge.style] || EDGE_STYLE.default;
    const flow = edge.flow ? ' a-flow' : '';
    const attrs = [
      `data-edge-id="${esc(edge.id)}"`,
      `data-edge-from="${esc(edge.from)}"`,
      `data-edge-to="${esc(edge.to)}"`,
      edge.label ? `data-edge-label="${esc(edge.label)}"` : '',
      `d="${edge.d}"`,
      `class="${style.cls}${flow}"`,
      'stroke-width="1.6"',
      'fill="none"',
      `marker-end="url(#${style.marker})"`
    ].filter(Boolean).join(' ');
    parts.push(`  <path ${attrs}/>`);

    if (edge.label) {
      const w = edge.label.length * SUB_CHAR_W + 10;
      const lx = edge.labelX;
      const labelCls = edge.style === 'emphasis' ? 'a-label a-label-emphasis'
        : edge.style === 'security' ? 'a-label a-label-security'
          : 'a-label';
      labelParts.push(`  <rect class="a-label-bg" x="${round(lx - w / 2)}" y="${round(edge.labelY - 10)}" width="${round(w)}" height="13" rx="3"/>`);
      labelParts.push(`  <text class="${labelCls}" x="${round(lx)}" y="${round(edge.labelY)}" font-size="8.5" text-anchor="middle">${esc(edge.label)}</text>`);
    }
  });
  parts.push(labelParts.join('\n'));
  parts.push(regionLabelParts.join('\n'));

  // Nodes.
  L.nodes.forEach((node) => {
    const cls = KIND_CLASS[node.kind] || 'c-external';
    const aria = `Focus ${node.label}${node.sublabel ? ', ' + node.sublabel : ''}, ${KIND_LABEL[node.kind] || node.kind}`;
    parts.push(`  <g id="node-${esc(node.id)}" data-node-id="${esc(node.id)}" data-node-kind="${esc(node.kind)}" tabindex="0" role="button" aria-pressed="false" aria-label="${esc(aria)}">`);
    parts.push(`    <title>${esc(node.label + (node.sublabel ? ' — ' + node.sublabel : '') + ' · ' + (KIND_LABEL[node.kind] || node.kind))}</title>`);
    parts.push(`    <rect class="c-mask" x="${round(node.x)}" y="${round(node.y)}" width="${round(node.w)}" height="${round(node.h)}" rx="6"/>`);
    parts.push(`    <rect class="${cls}" x="${round(node.x)}" y="${round(node.y)}" width="${round(node.w)}" height="${round(node.h)}" rx="6" stroke-width="1.5"/>`);
    parts.push(`    <g aria-hidden="true" class="semantic-sigil s-${esc(node.kind)}" transform="translate(${round(node.x + 8)} ${round(node.y + 8)}) scale(0.7)">${SIGILS[node.kind] || SIGILS.external}</g>`);
    parts.push(renderNodeText(node, 0));
    parts.push('  </g>');
  });

  parts.push('</svg>');
  return parts.join('\n');
}

/* ------------------------------------------------------------ page shell */

const PREPAINT = `  <script>
    (function () {
      try {
        var theme = null;
        try {
          var params = new URLSearchParams(window.location.search);
          var param = params.get('theme');
          if (param === 'light' || param === 'dark') theme = param;
          if (params.get('embed') === '1') document.documentElement.setAttribute('data-embed', 'true');
          if (params.get('present') === '1') document.documentElement.setAttribute('data-present', 'true');
        } catch (_) {}
        if (!theme) { try { theme = localStorage.getItem('archify-theme'); } catch (_) {} }
        if (theme !== 'light' && theme !== 'dark') {
          theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        document.documentElement.setAttribute('data-theme', theme);
        try { document.documentElement.setAttribute('data-motion', localStorage.getItem('estatesync-motion') === 'still' ? 'still' : 'live'); } catch (_) {}
      } catch (_) {}
    })();
  </script>`;

const FONTS = `  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>`;

function renderLegend(models) {
  const kinds = [];
  models.forEach((n) => { if (kinds.indexOf(n.kind) === -1) kinds.push(n.kind); });
  return kinds.map((kind) =>
    `<span><i style="background: var(--${kind}-fill); border-color: var(--${kind}-stroke)"></i>${KIND_LABEL[kind] || kind}</span>`
  ).join('\n      ');
}

function renderNotes(notes) {
  return notes.map((note) => {
    const tag = note.tag ? `<span class="callout-tag">${note.tag}</span>` : '';
    const paragraphs = note.body || [];
    // A note with a title but no prose is a heading for its list or table.
    const heading = note.title && !paragraphs.length ? `<p><strong>${note.title}</strong></p>` : '';
    const title = note.title && paragraphs.length ? `<strong>${note.title}.</strong> ` : '';
    const body = paragraphs.map((p) => `<p>${title}${p}</p>`).join('\n      ');
    const list = note.ordered
      ? `\n      <ol>${note.ordered.map((item) => `<li>${item}</li>`).join('')}</ol>`
      : '';
    const bullets = note.bullets
      ? `\n      <ul>${note.bullets.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '';
    const checklist = note.checklist
      ? `\n      <ul class="checklist">${note.checklist.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '';
    const table = note.table
      ? `\n      <div class="table-wrap"><table><thead><tr>${
        note.table.headers.map((h) => `<th>${h}</th>`).join('')
      }</tr></thead><tbody>${
        note.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')
      }</tbody></table></div>`
      : '';
    return `    <div class="panel${note.callout ? ' callout' : ''}">
      ${tag}${heading}${body}${list}${bullets}${checklist}${table}
    </div>`;
  }).join('\n');
}

function renderPage(model, L, svg) {
  const data = {
    slug: model.slug,
    width: L.width,
    height: L.height,
    vars: CSS_VARS,
    nodes: L.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      sublabel: n.sublabel || '',
      kind: n.kind,
      detail: n.detail || '',
      doc: n.doc || '',
      x: round(n.x),
      y: round(n.y),
      w: round(n.w),
      h: round(n.h)
    })),
    edges: L.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, label: e.label || '' })),
    views: (model.views || []).map((v) => ({ id: v.id, title: v.title, caption: v.caption, nodes: v.nodes, edges: v.edges || null }))
  };

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark" data-preset="classic" data-motion="live">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EstateSync Master Architecture — ${esc(model.title)} Diagram</title>
<meta name="description" content="${esc(model.description)}">
<meta name="generator" content="estatesync-diagram-builder">
${PREPAINT}
${FONTS}
<style>
${ENGINE_CSS}
</style>
<style id="diagram-svg-css">
${SVG_CSS}
</style>
</head>
<body class="diagram-page">

<div class="toolbar">
  <button id="btn-theme" type="button" aria-label="Switch colour theme"><span id="btn-theme-label">Dark</span></button>
  <button id="btn-preset" type="button" aria-label="Cycle visual preset"><span id="btn-preset-label">Classic</span></button>
  <button id="btn-motion" type="button" aria-pressed="false" aria-label="Toggle motion"><span id="btn-motion-label">Motion</span></button>
  <button id="btn-guide" type="button" aria-pressed="false" aria-controls="guide">Guide</button>
  <button id="btn-finder" type="button" aria-controls="finder">Find</button>
  <div class="toolbar-wrap">
    <button id="btn-export" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="export-menu">Export</button>
    <div class="toolbar-menu" id="export-menu" role="menu" aria-label="Export diagram">
      <button id="export-svg" type="button" role="menuitem">Download SVG</button>
      <button id="export-png" type="button" role="menuitem">Download PNG</button>
    </div>
  </div>
</div>

<header class="diagram-head" style="--badge-accent: var(${model.accent})">
  <span class="kind">${esc(model.kind)}</span>
  <h1>${esc(model.title)}</h1>
  <p>${esc(model.lede)}</p>
</header>

<div class="stage" id="stage">
${svg}

  <div class="finder" id="finder" data-open="false">
    <input id="finder-input" type="search" placeholder="Find a node…" aria-label="Find a node" autocomplete="off">
    <div class="finder-results" id="finder-results"></div>
  </div>

  <div class="guide" id="guide" data-open="false" role="region" aria-label="Guided views">
    <h2>Guided views</h2>
    <p class="guide-title" id="guide-title">Whole diagram</p>
    <p class="guide-caption" id="guide-caption">Every lane, every node and every edge.</p>
    <div class="guide-actions">
      <button id="guide-prev" type="button" aria-label="Previous guided view">&#8592; Prev</button>
      <button id="guide-next" type="button" aria-label="Next guided view">Next &#8594;</button>
      <button id="guide-all" type="button">Show all</button>
      <button id="guide-close" type="button">Close</button>
    </div>
    <ol class="guide-chapters" id="guide-chapters"></ol>
  </div>

  <div class="focus" id="focus" data-open="false" role="region" aria-label="Focused node">
    <span class="focus-kind" id="focus-kind"></span>
    <h3 id="focus-label"></h3>
    <p class="focus-sub" id="focus-sub"></p>
    <p class="focus-detail" id="focus-detail"></p>
    <p class="focus-doc" id="focus-doc"></p>
    <p class="focus-rel-title">Relationships</p>
    <ul id="focus-list"></ul>
    <div class="focus-actions">
      <button id="focus-clear" type="button">Clear focus</button>
    </div>
  </div>

  <div class="zoom-bar">
    <button id="zoom-out" type="button" aria-label="Zoom out">&#8722;</button>
    <span class="zoom-level" id="zoom-level">100%</span>
    <button id="zoom-in" type="button" aria-label="Zoom in">+</button>
    <button id="zoom-fit" type="button" aria-label="Fit diagram">Fit</button>
  </div>

  <div class="legend">
      ${renderLegend(L.nodes)}
  </div>
</div>

<section class="diagram-notes">
${renderNotes(model.notes || [])}
    <div class="panel">
      <p><strong>Using this diagram.</strong> Drag to pan, scroll to zoom, click any node for its source reference, press <code>G</code> for guided views, <code>/</code> to find a node, <code>T</code> to switch theme, <code>P</code> to cycle the visual preset, and <code>F</code> to fit. Exports are generated from the same stylesheet you are looking at.</p>
    </div>
</section>

<script type="application/json" id="diagram-data">
${JSON.stringify(data)}
</script>
<script>
${ENGINE_JS}
</script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ audit */
//
// Readability here is a geometry property, not a taste question: a line that
// runs through a box, or a caption sitting on top of one, is a defect. `--audit`
// re-checks every generated page against those invariants.

function segmentsOf(d) {
  const tokens = d.match(/[MHV]|-?\d+(\.\d+)?/g) || [];
  const segments = [];
  let x = 0;
  let y = 0;
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') { x = Number(tokens[i++]); y = Number(tokens[i++]); continue; }
    if (cmd === 'H') { const nx = Number(tokens[i++]); segments.push({ x1: x, y1: y, x2: nx, y2: y }); x = nx; continue; }
    if (cmd === 'V') { const ny = Number(tokens[i++]); segments.push({ x1: x, y1: y, x2: x, y2: ny }); y = ny; continue; }
  }
  return segments;
}

function overlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function audit(model, L) {
  const problems = [];
  const pad = 1;
  const nodeRects = L.nodes.map((n) => ({ id: n.id, x: n.x + pad, y: n.y + pad, w: n.w - pad * 2, h: n.h - pad * 2 }));

  const crosses = (seg, r) => {
    if (seg.y1 === seg.y2) {
      const [x1, x2] = [Math.min(seg.x1, seg.x2), Math.max(seg.x1, seg.x2)];
      return seg.y1 > r.y && seg.y1 < r.y + r.h && x2 > r.x && x1 < r.x + r.w;
    }
    if (seg.x1 === seg.x2) {
      const [y1, y2] = [Math.min(seg.y1, seg.y2), Math.max(seg.y1, seg.y2)];
      return seg.x1 > r.x && seg.x1 < r.x + r.w && y2 > r.y && y1 < r.y + r.h;
    }
    return false;
  };

  L.edges.forEach((edge) => {
    segmentsOf(edge.d).forEach((seg) => {
      nodeRects.forEach((r) => {
        if (r.id === edge.from || r.id === edge.to) return;
        if (crosses(seg, r)) problems.push(`edge ${edge.id} crosses node ${r.id}`);
      });
    });
  });

  const labelRects = [];
  L.edges.forEach((edge) => {
    if (!edge.label) return;
    const w = edge.label.length * SUB_CHAR_W + 10;
    const rect = { id: edge.id, x: edge.labelX - w / 2, y: edge.labelY - 10, w, h: 13 };
    labelRects.push(rect);
    nodeRects.forEach((r) => {
      if (overlap(rect, r)) problems.push(`label ${edge.id} ("${edge.label}") overlaps node ${r.id}`);
    });
    if (rect.x < 0 || rect.x + rect.w > L.width || rect.y < 0 || rect.y + rect.h > L.height) {
      problems.push(`label ${edge.id} off canvas`);
    }
  });
  labelRects.forEach((a, i) => {
    labelRects.forEach((b, j) => {
      if (j <= i) return;
      if (overlap(a, b)) problems.push(`label ${a.id} overlaps label ${b.id}`);
    });
  });

  L.nodes.forEach((a, i) => {
    L.nodes.forEach((b, j) => {
      if (j <= i) return;
      if (overlap({ x: a.x, y: a.y, w: a.w, h: a.h }, { x: b.x, y: b.y, w: b.w, h: b.h })) {
        problems.push(`node ${a.id} overlaps node ${b.id}`);
      }
    });
  });

  return problems;
}

/* ------------------------------------------------------------------ build */

mkdirSync(resolve(ROOT, 'diagrams'), { recursive: true });

const AUDIT = process.argv.includes('--audit');
let problems = 0;

let total = 0;
for (const model of DIAGRAMS) {
  const L = layout(model);
  const found = audit(model, L);
  if (AUDIT && found.length) {
    problems += found.length;
    console.log(`\n${model.slug} — ${found.length} geometry problem(s):`);
    found.forEach((p) => console.log('   • ' + p));
  }
  const svg = renderSvg(model, L);
  const html = renderPage(model, L, svg);
  const out = resolve(ROOT, 'diagrams', `${model.slug}.html`);
  writeFileSync(out, html);
  total += 1;
  console.log(
    `built diagrams/${model.slug}.html  ${L.width}x${L.height}  ` +
    `${L.nodes.length} nodes  ${L.edges.length} edges  ` +
    `${(model.views || []).length} views  ${(html.length / 1024).toFixed(0)} KB`
  );
}
console.log(`\n${total} diagram page(s).${AUDIT ? `  Audit: ${problems} problem(s).` : ''}`);
console.log('Now run: node inject-nav.mjs');
