/* ==========================================================================
   Diagram runtime — pan/zoom, theme + preset switching, guided views,
   node focus, search and SVG/PNG export.

   Contract with the generated page:
     #diagram-data   <script type="application/json"> with
                     { slug, width, height, vars[], nodes[], edges[], views[] }
     #diagram-svg    the inline <svg class="diagram">
     #diagram-svg-css  the stylesheet handed to the exporter
   ========================================================================== */
(function () {
  'use strict';

  var dataEl = document.getElementById('diagram-data');
  if (!dataEl) return;
  var data = JSON.parse(dataEl.textContent);

  var stage = document.getElementById('stage');
  var svg = document.getElementById('diagram-svg');
  var W = data.width;
  var H = data.height;

  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  /* ------------------------------------------------------------ theme */

  var root = document.documentElement;

  function prefersLight() {
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  function readTheme() {
    var param = null;
    try { param = new URLSearchParams(location.search).get('theme'); } catch (_) {}
    if (param === 'light' || param === 'dark') return param;
    var stored = null;
    try { stored = localStorage.getItem('archify-theme'); } catch (_) {}
    if (stored === 'light' || stored === 'dark') return stored;
    return prefersLight() ? 'light' : 'dark';
  }

  var theme = readTheme();
  root.setAttribute('data-theme', theme);
  var themeBtn = document.getElementById('btn-theme');
  var themeLabel = document.getElementById('btn-theme-label');

  function syncThemeButton() {
    if (themeLabel) themeLabel.textContent = theme === 'light' ? 'Light' : 'Dark';
    if (themeBtn) themeBtn.setAttribute('aria-label', 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' theme');
  }
  syncThemeButton();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      theme = theme === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('archify-theme', theme); } catch (_) {}
      syncThemeButton();
    });
  }

  /* ------------------------------------------------------------ presets */

  var PRESETS = ['classic', 'blueprint', 'editorial'];
  var preset = 'classic';
  try { preset = localStorage.getItem('estatesync-preset') || 'classic'; } catch (_) {}
  if (PRESETS.indexOf(preset) === -1) preset = 'classic';

  var presetBtn = document.getElementById('btn-preset');
  var presetLabel = document.getElementById('btn-preset-label');

  function syncPreset() {
    svg.setAttribute('data-preset', preset);
    if (presetLabel) presetLabel.textContent = preset.charAt(0).toUpperCase() + preset.slice(1);
  }
  syncPreset();

  if (presetBtn) {
    presetBtn.addEventListener('click', function () {
      preset = PRESETS[(PRESETS.indexOf(preset) + 1) % PRESETS.length];
      syncPreset();
      try { localStorage.setItem('estatesync-preset', preset); } catch (_) {}
    });
  }

  /* ------------------------------------------------------------ motion */

  var motionBtn = document.getElementById('btn-motion');
  var motionLabel = document.getElementById('btn-motion-label');
  var motion = 'on';
  try { motion = localStorage.getItem('estatesync-motion') || 'on'; } catch (_) {}

  function syncMotion() {
    root.setAttribute('data-motion', motion === 'still' ? 'still' : 'live');
    if (motionLabel) motionLabel.textContent = motion === 'still' ? 'Still' : 'Motion';
    if (motionBtn) motionBtn.setAttribute('aria-pressed', motion === 'still' ? 'true' : 'false');
  }
  syncMotion();

  if (motionBtn) {
    motionBtn.addEventListener('click', function () {
      motion = motion === 'still' ? 'on' : 'still';
      syncMotion();
      try { localStorage.setItem('estatesync-motion', motion); } catch (_) {}
    });
  }

  /* ------------------------------------------------------------ camera */

  var cam = { s: 1, x: 0, y: 0 };

  function applyCam() {
    svg.style.transform = 'translate(' + cam.x + 'px,' + cam.y + 'px) scale(' + cam.s + ')';
    var level = document.getElementById('zoom-level');
    if (level) level.textContent = Math.round(cam.s * 100) + '%';
  }

  function animate(on) {
    stage.classList.toggle('is-animating', !!on);
    if (on) {
      window.setTimeout(function () { stage.classList.remove('is-animating'); }, 360);
    }
  }

  function clampScale(s) {
    return Math.max(0.18, Math.min(2.2, s));
  }

  function fit(animateIt) {
    var r = stage.getBoundingClientRect();
    var pad = 26;
    var s = clampScale(Math.min((r.width - pad * 2) / W, (r.height - pad * 2) / H));
    cam.s = s;
    cam.x = (r.width - W * s) / 2;
    cam.y = (r.height - H * s) / 2;
    animate(animateIt);
    applyCam();
  }

  // Zoom the camera to a rectangle expressed in SVG coordinates.
  function fitBox(box, animateIt, maxScale) {
    if (!box || !box.w || !box.h) { fit(animateIt); return; }
    var r = stage.getBoundingClientRect();
    var pad = 40;
    var s = clampScale(Math.min((r.width - pad * 2) / box.w, (r.height - pad * 2) / box.h));
    s = Math.min(s, maxScale || 1.5);
    cam.s = s;
    cam.x = r.width / 2 - (box.x + box.w / 2) * s;
    cam.y = r.height / 2 - (box.y + box.h / 2) * s;
    animate(animateIt);
    applyCam();
  }

  function zoomBy(factor, cx, cy) {
    var r = stage.getBoundingClientRect();
    var mx = cx == null ? r.width / 2 : cx;
    var my = cy == null ? r.height / 2 : cy;
    var px = (mx - cam.x) / cam.s;
    var py = (my - cam.y) / cam.s;
    var next = clampScale(cam.s * factor);
    if (next === cam.s) return;
    cam.s = next;
    cam.x = mx - px * cam.s;
    cam.y = my - py * cam.s;
    applyCam();
  }

  /* ------------------------------------------------------- pan + wheel */

  var dragging = null;

  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    if (e.target.closest('.guide, .focus, .finder, .zoom-bar, .legend, button, a')) return;
    dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: cam.x, sy: cam.y, moved: false };
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging || dragging.id !== e.pointerId) return;
    // A small dead zone keeps a click on a node from nudging the camera.
    if (!dragging.moved) {
      if (Math.abs(e.clientX - dragging.x) < 4 && Math.abs(e.clientY - dragging.y) < 4) return;
      dragging.moved = true;
      stage.classList.add('is-panning');
    }
    cam.x = dragging.sx + (e.clientX - dragging.x);
    cam.y = dragging.sy + (e.clientY - dragging.y);
    applyCam();
  });

  function endDrag(e) {
    if (!dragging || (e && dragging.id !== e.pointerId)) return;
    dragging = null;
    stage.classList.remove('is-panning');
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  stage.addEventListener('wheel', function (e) {
    if (e.target.closest('.guide, .focus, .finder')) return;
    e.preventDefault();
    var r = stage.getBoundingClientRect();
    var factor = Math.exp(-e.deltaY * 0.0015);
    zoomBy(factor, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  var zoomIn = document.getElementById('zoom-in');
  var zoomOut = document.getElementById('zoom-out');
  var zoomFit = document.getElementById('zoom-fit');
  if (zoomIn) zoomIn.addEventListener('click', function () { zoomBy(1.25); });
  if (zoomOut) zoomOut.addEventListener('click', function () { zoomBy(1 / 1.25); });
  if (zoomFit) zoomFit.addEventListener('click', function () { clearFocus(); setView(-1, true); fit(true); });

  /* --------------------------------------------------- node/edge index */

  var nodeEls = {};
  var edgeEls = {};
  var nodeMeta = {};
  var nodes = data.nodes || [];
  var edges = data.edges || [];

  Array.prototype.forEach.call(svg.querySelectorAll('[data-node-id]'), function (el) {
    nodeEls[el.getAttribute('data-node-id')] = el;
  });
  Array.prototype.forEach.call(svg.querySelectorAll('[data-edge-id]'), function (el) {
    edgeEls[el.getAttribute('data-edge-id')] = el;
  });
  nodes.forEach(function (n) { nodeMeta[n.id] = n; });

  // Adjacency, used by the focus panel and its relationship lists.
  var outgoing = {};
  var incoming = {};
  edges.forEach(function (e) {
    (outgoing[e.from] = outgoing[e.from] || []).push(e);
    (incoming[e.to] = incoming[e.to] || []).push(e);
  });

  function relatedNodeIds(id) {
    var ids = {};
    (outgoing[id] || []).forEach(function (e) { ids[e.to] = true; });
    (incoming[id] || []).forEach(function (e) { ids[e.from] = true; });
    return ids;
  }

  function paint() {
    var focus = focusId;
    var view = currentView();
    var viewNodes = view ? (view.nodes || []) : null;
    var viewEdges = view ? (view.edges || null) : null;
    var related = focus ? relatedNodeIds(focus) : null;

    Object.keys(nodeEls).forEach(function (id) {
      var el = nodeEls[id];
      el.classList.remove('is-focus', 'is-faded', 'is-dim');
      el.setAttribute('aria-pressed', focus === id ? 'true' : 'false');
      if (focus) {
        if (id === focus) el.classList.add('is-focus');
        else if (!related[id]) el.classList.add('is-faded');
      } else if (viewNodes && viewNodes.indexOf(id) === -1) {
        el.classList.add('is-dim');
      }
    });

    Object.keys(edgeEls).forEach(function (id) {
      var el = edgeEls[id];
      el.classList.remove('is-faded', 'is-dim');
      var e = edgeIndex[id];
      if (focus) {
        var touches = e && (e.from === focus || e.to === focus);
        if (!touches) el.classList.add('is-faded');
      } else if (viewNodes) {
        var inView = viewEdges
          ? viewEdges.indexOf(id) !== -1
          : !!(e && viewNodes.indexOf(e.from) !== -1 && viewNodes.indexOf(e.to) !== -1);
        if (!inView) el.classList.add('is-dim');
      }
    });
  }

  var edgeIndex = {};
  edges.forEach(function (e) { edgeIndex[e.id] = e; });

  /* ------------------------------------------------------------ views */

  var views = data.views || [];
  var viewIndex = -1;

  function currentView() {
    return viewIndex >= 0 && views[viewIndex] ? views[viewIndex] : null;
  }

  function viewBox(view) {
    var ids = view.nodes || [];
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach(function (id) {
      var n = nodeMeta[id];
      if (!n) return;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    if (!isFinite(minX)) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  var guide = document.getElementById('guide');
  var guideTitle = document.getElementById('guide-title');
  var guideCaption = document.getElementById('guide-caption');
  var guideChapters = document.getElementById('guide-chapters');
  var guidePrev = document.getElementById('guide-prev');
  var guideNext = document.getElementById('guide-next');
  var guideAll = document.getElementById('guide-all');
  var guideClose = document.getElementById('guide-close');
  var guideBtn = document.getElementById('btn-guide');

  function syncGuide() {
    var view = currentView();
    if (guideTitle) guideTitle.textContent = view ? view.title : 'Whole diagram';
    if (guideCaption) guideCaption.textContent = view ? view.caption : 'Every lane, every node and every edge.';
    if (guideChapters) {
      Array.prototype.forEach.call(guideChapters.querySelectorAll('button'), function (b, i) {
        b.setAttribute('aria-current', i === viewIndex ? 'true' : 'false');
      });
    }
    if (guidePrev) guidePrev.disabled = views.length === 0;
    if (guideNext) guideNext.disabled = views.length === 0;
  }

  function setView(i, animateIt, fromHash) {
    viewIndex = i;
    if (i >= 0 && views[i]) {
      clearFocus(true);
      fitBox(viewBox(views[i]), animateIt, 1.35);
    }
    paint();
    syncGuide();
    if (!fromHash) updateHash();
  }

  if (views.length && guideChapters) {
    views.forEach(function (view, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = view.title;
      b.addEventListener('click', function () { setView(i, true); });
      li.appendChild(b);
      guideChapters.appendChild(li);
    });
  }

  if (guidePrev) guidePrev.addEventListener('click', function () {
    setView(viewIndex <= 0 ? views.length - 1 : viewIndex - 1, true);
  });
  if (guideNext) guideNext.addEventListener('click', function () {
    setView(viewIndex === -1 ? 0 : (viewIndex + 1) % views.length, true);
  });
  if (guideAll) guideAll.addEventListener('click', function () { setView(-1, true); fit(true); });
  if (guideClose) guideClose.addEventListener('click', function () { guide.dataset.open = 'false'; });

  function toggleGuide() {
    if (!guide) return;
    var open = guide.dataset.open === 'true';
    guide.dataset.open = open ? 'false' : 'true';
    if (guideBtn) guideBtn.setAttribute('aria-pressed', open ? 'false' : 'true');
  }
  if (guideBtn) {
    guideBtn.addEventListener('click', toggleGuide);
    if (!views.length) guideBtn.hidden = true;
  }

  /* ------------------------------------------------------- node focus */

  var focusId = null;
  var focus = document.getElementById('focus');
  var focusKind = document.getElementById('focus-kind');
  var focusLabel = document.getElementById('focus-label');
  var focusSub = document.getElementById('focus-sub');
  var focusDetail = document.getElementById('focus-detail');
  var focusDoc = document.getElementById('focus-doc');
  var focusList = document.getElementById('focus-list');

  var KIND_LABEL = {
    actor: 'Actor', frontend: 'Client', backend: 'Service', database: 'Database',
    cloud: 'Managed platform', security: 'Trust boundary', external: 'External service',
    queue: 'Async boundary', storage: 'Storage'
  };

  function focusNode(id) {
    var meta = nodeMeta[id];
    if (!meta) return;
    focusId = id;
    if (focusKind) focusKind.textContent = KIND_LABEL[meta.kind] || meta.kind;
    if (focusLabel) focusLabel.textContent = meta.label;
    if (focusSub) {
      focusSub.textContent = meta.sublabel || '';
      focusSub.hidden = !meta.sublabel;
    }
    if (focusDetail) {
      focusDetail.textContent = meta.detail || '';
      focusDetail.hidden = !meta.detail;
    }
    if (focusDoc) {
      focusDoc.textContent = meta.doc ? 'Source: ' + meta.doc : '';
      focusDoc.hidden = !meta.doc;
    }
    if (focus) {
      focus.dataset.open = 'true';
      focus.style.setProperty('--focus-accent', 'var(--' + (meta.kind || 'external') + '-stroke)');
    }
    if (focusList) {
      focusList.innerHTML = '';
      var rel = [];
      (incoming[id] || []).forEach(function (e) {
        var from = nodeMeta[e.from] ? nodeMeta[e.from].label : e.from;
        rel.push({ id: e.from, label: '\u2190 ' + from + (e.label ? ' \u00b7 ' + e.label : '') });
      });
      (outgoing[id] || []).forEach(function (e) {
        rel.push({ id: e.to, label: '\u2192 ' + (nodeMeta[e.to] ? nodeMeta[e.to].label : e.to) + (e.label ? ' \u00b7 ' + e.label : '') });
      });
      if (!rel.length) {
        var p = document.createElement('li');
        p.textContent = 'No edges \u2014 context only.';
        p.style.color = 'var(--text-faint)';
        p.style.fontSize = '0.72rem';
        focusList.appendChild(p);
      }
      rel.forEach(function (r) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = r.label;
        b.addEventListener('click', function () { focusNode(r.id); });
        li.appendChild(b);
        focusList.appendChild(li);
      });
    }
    paint();
    var box = { x: meta.x - 40, y: meta.y - 40, w: meta.w + 80, h: meta.h + 80 };
    fitBox(box, true, 1.6);
    updateHash();
  }

  function clearFocus(silent) {
    if (!focusId) return;
    focusId = null;
    if (focus) focus.dataset.open = 'false';
    paint();
    if (!silent) updateHash();
  }

  var focusClear = document.getElementById('focus-clear');
  if (focusClear) focusClear.addEventListener('click', function () { clearFocus(); });

  svg.addEventListener('click', function (e) {
    var g = e.target.closest('[data-node-id]');
    if (!g) return;
    var id = g.getAttribute('data-node-id');
    if (id === focusId) clearFocus();
    else focusNode(id);
  });

  svg.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var g = e.target.closest('[data-node-id]');
    if (!g) return;
    e.preventDefault();
    var id = g.getAttribute('data-node-id');
    if (id === focusId) clearFocus();
    else focusNode(id);
  });

  /* ---------------------------------------------------------- finder */

  var finder = document.getElementById('finder');
  var finderInput = document.getElementById('finder-input');
  var finderResults = document.getElementById('finder-results');
  var finderBtn = document.getElementById('btn-finder');

  function renderResults(q) {
    if (!finderResults) return;
    finderResults.innerHTML = '';
    var needle = q.trim().toLowerCase();
    if (!needle) return;
    nodes.filter(function (n) {
      return (n.label + ' ' + (n.sublabel || '') + ' ' + n.id).toLowerCase().indexOf(needle) !== -1;
    }).slice(0, 12).forEach(function (n) {
      var b = document.createElement('button');
      b.type = 'button';
      var strong = document.createElement('span');
      strong.textContent = n.label;
      b.appendChild(strong);
      var small = document.createElement('small');
      small.textContent = (KIND_LABEL[n.kind] || n.kind) + (n.sublabel ? ' \u00b7 ' + n.sublabel : '');
      b.appendChild(small);
      b.addEventListener('click', function () {
        if (finder) finder.dataset.open = 'false';
        focusNode(n.id);
      });
      finderResults.appendChild(b);
    });
  }

  function toggleFinder(open) {
    if (!finder) return;
    var next = open == null ? finder.dataset.open !== 'true' : open;
    finder.dataset.open = next ? 'true' : 'false';
    if (next && finderInput) { finderInput.value = ''; renderResults(''); finderInput.focus(); }
  }

  if (finderBtn) finderBtn.addEventListener('click', function () { toggleFinder(); });
  if (finderInput) {
    finderInput.addEventListener('input', function () { renderResults(finderInput.value); });
    finderInput.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggleFinder(false); });
  }

  /* ---------------------------------------------------------- export */

  var CSS_VAR_NAMES = (data.vars || []).slice();

  function currentVars() {
    var cs = getComputedStyle(document.documentElement);
    return CSS_VAR_NAMES.map(function (name) {
      return name + ':' + cs.getPropertyValue(name).trim() + ';';
    }).join('');
  }

  function buildExportSvg() {
    var clone = svg.cloneNode(true);
    // Drop every interactive state so the file shows the whole diagram, and the
    // travelling-dash class so an exported still image is not a dashed line.
    Array.prototype.forEach.call(clone.querySelectorAll('.is-dim, .is-faded, .is-focus, .a-flow'), function (el) {
      el.classList.remove('is-dim', 'is-faded', 'is-focus', 'a-flow');
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('width', W);
    clone.setAttribute('height', H);
    clone.removeAttribute('style');

    var svgCss = document.getElementById('diagram-svg-css');
    var css = 'svg{' + currentVars() + '}' + (svgCss ? svgCss.textContent : '');
    var style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = css;
    clone.insertBefore(style, clone.firstChild);
    return clone;
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function exportSvg() {
    var clone = buildExportSvg();
    var text = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    download(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }), data.slug + '.svg');
  }

  function exportPng() {
    var clone = buildExportSvg();
    var text = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    var url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml;charset=utf-8' }));
    var img = new Image();
    img.onload = function () {
      var scale = 2;
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(W * scale);
      canvas.height = Math.round(H * scale);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) { if (blob) download(blob, data.slug + '.png'); }, 'image/png');
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;
  }

  var exportMenu = document.getElementById('export-menu');
  var exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = exportMenu.dataset.open === 'true';
      exportMenu.dataset.open = open ? 'false' : 'true';
      exportBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
    document.addEventListener('click', function () {
      exportMenu.dataset.open = 'false';
      exportBtn.setAttribute('aria-expanded', 'false');
    });
  }
  var exportSvgBtn = document.getElementById('export-svg');
  var exportPngBtn = document.getElementById('export-png');
  if (exportSvgBtn) exportSvgBtn.addEventListener('click', exportSvg);
  if (exportPngBtn) exportPngBtn.addEventListener('click', exportPng);

  /* ------------------------------------------------------- deep links */

  function updateHash() {
    var view = currentView();
    var hash = '';
    if (focusId) hash = '#node=' + focusId;
    else if (view) hash = '#view=' + view.id;
    try { history.replaceState(null, '', location.pathname + location.search + hash); } catch (_) {}
  }

  function readHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return false;
    var parts = h.split('=');
    if (parts[0] === 'node' && nodeMeta[parts[1]]) { focusNode(parts[1]); return true; }
    if (parts[0] === 'view') {
      for (var i = 0; i < views.length; i++) {
        if (views[i].id === parts[1]) { setView(i, false, true); return true; }
      }
    }
    return false;
  }

  /* ------------------------------------------------------- shortcuts */

  document.addEventListener('keydown', function (e) {
    if (e.target && e.target.matches && e.target.matches('input, textarea')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case 'f': case '0': fit(true); break;
      case '+': case '=': zoomBy(1.25); break;
      case '-': case '_': zoomBy(1 / 1.25); break;
      case 't': if (themeBtn) themeBtn.click(); break;
      case 'p': if (presetBtn) presetBtn.click(); break;
      case 'g': toggleGuide(); break;
      case '/': e.preventDefault(); toggleFinder(true); break;
      case '[': if (views.length) setView(viewIndex <= 0 ? views.length - 1 : viewIndex - 1, true); break;
      case ']': if (views.length) setView(viewIndex === -1 ? 0 : (viewIndex + 1) % views.length, true); break;
      case 'Escape':
        clearFocus();
        if (guide) guide.dataset.open = 'false';
        toggleFinder(false);
        break;
    }
  });

  /* ------------------------------------------------------------- boot */

  fit(false);
  if (!readHash()) setView(-1, false);
  window.addEventListener('resize', function () { fit(false); });
})();
