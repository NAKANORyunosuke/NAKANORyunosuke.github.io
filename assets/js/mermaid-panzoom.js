// Enable pan/zoom controls for Mermaid-rendered SVGs
// - Drag to pan
// - Mouse wheel / trackpad to zoom (cursor-centered)
// - Small + / - / reset buttons per diagram
(function () {
  function getViewBox(svg) {
    const vb = svg.getAttribute('viewBox');
    if (vb) {
      const [x, y, w, h] = vb.split(/\s+/).map(Number);
      return { x, y, w, h };
    }
    // If no viewBox, infer from bbox or intrinsic size
    const bbox = svg.getBBox ? svg.getBBox() : { x: 0, y: 0, width: svg.clientWidth, height: svg.clientHeight };
    const w = bbox.width || (svg.clientWidth || 300);
    const h = bbox.height || (svg.clientHeight || 150);
    return { x: bbox.x || 0, y: bbox.y || 0, w, h };
  }

  function setViewBox(svg, vb) {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  function clientPointToSvg(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const p = pt.matrixTransform(inv);
    return { x: p.x, y: p.y };
  }

  function setupPanZoom(svg) {
    if (svg.__panzoomAttached) return;
    svg.__panzoomAttached = true;

    // Ensure a viewBox exists and remember the original
    let vb = getViewBox(svg);
    setViewBox(svg, vb);
    svg.dataset.vb0 = JSON.stringify(vb);

    const limits = { min: 0.2, max: 5 };

    // Panning
    let isPanning = false;
    let panActive = false; // becomes true after minimal movement
    let moved = false;
    let lastClient = { x: 0, y: 0 };
    let vbStart = { ...vb };
    const dragThresholdClient = 1; // px in client space (Chrome/Win11)

    function onPointerDown(e) {
      // Only left button for mouse
      if (e.button !== undefined && e.button !== 0) return;
      isPanning = true;
      moved = false;
      panActive = false;
      vbStart = getViewBox(svg);
      lastClient = { x: e.clientX, y: e.clientY };
      // Capture pointer so we continue to receive move/up even if cursor leaves the SVG
      if (svg.setPointerCapture && e.pointerId != null) {
        try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      }
      // Do not preventDefault yet; we want simple clicks to pass through
    }
    function onPointerMove(e) {
      if (!isPanning) return;
      const dxClient = e.clientX - lastClient.x;
      const dyClient = e.clientY - lastClient.y;
      if (!panActive) {
        const dist2 = dxClient * dxClient + dyClient * dyClient;
        if (dist2 < dragThresholdClient * dragThresholdClient) return; // not yet a drag
        panActive = true;
        moved = true;
      }
      // Convert client delta to SVG-space by sampling two points through CTM
      const p1 = clientPointToSvg(svg, lastClient.x, lastClient.y);
      const p2 = clientPointToSvg(svg, e.clientX, e.clientY);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const cur = getViewBox(svg);
      setViewBox(svg, { x: cur.x - dx, y: cur.y - dy, w: cur.w, h: cur.h });
      lastClient = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
    function onPointerUp(e) {
      if (!isPanning) return;
      // If there was no movement beyond threshold, allow the click to proceed
      isPanning = false;
      if (svg.releasePointerCapture && e.pointerId != null) {
        try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      if (moved) e.preventDefault();
      moved = false;
      panActive = false;
    }

    // Zooming
    function zoomAt(clientX, clientY, scale) {
      const cur = getViewBox(svg);
      const pt = clientPointToSvg(svg, clientX, clientY);
      const newW = cur.w / scale;
      const newH = cur.h / scale;

      // Constrain zoom level based on initial viewBox
      const vb0 = JSON.parse(svg.dataset.vb0 || '{}');
      const baseW = vb0.w || cur.w;
      const baseH = vb0.h || cur.h;
      const minW = baseW * limits.min;
      const maxW = baseW * limits.max;
      const minH = baseH * limits.min;
      const maxH = baseH * limits.max;

      const clampedW = Math.max(Math.min(newW, maxW), minW);
      const clampedH = Math.max(Math.min(newH, maxH), minH);

      const sx = (pt.x - cur.x) / cur.w;
      const sy = (pt.y - cur.y) / cur.h;
      const newX = pt.x - clampedW * sx;
      const newY = pt.y - clampedH * sy;
      setViewBox(svg, { x: newX, y: newY, w: clampedW, h: clampedH });
    }

    function onWheel(e) {
      // Prevent page scroll while zooming on the diagram, allow OS pinch-zoom to pass through
      if (!e.ctrlKey && !e.metaKey) e.preventDefault();
      const delta = e.deltaY || e.wheelDelta;
      const scale = delta > 0 ? 1 / 1.1 : 1.1;
      zoomAt(e.clientX, e.clientY, scale);
    }

    // Controls
    const container = svg.closest('.mermaid') || svg.parentElement;
    if (container) container.style.position = container.style.position || 'relative';
    const ctrls = document.createElement('div');
    ctrls.className = 'panzoom-controls';
    ctrls.innerHTML = `
      <button type="button" class="pz-btn pz-zoom-in" title="Zoom in">+</button>
      <button type="button" class="pz-btn pz-zoom-out" title="Zoom out">−</button>
      <button type="button" class="pz-btn pz-reset" title="Reset">⟳</button>
    `;
    if (container) container.appendChild(ctrls);

    ctrls.querySelector('.pz-zoom-in').addEventListener('click', () => {
      const rect = svg.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
    });
    ctrls.querySelector('.pz-zoom-out').addEventListener('click', () => {
      const rect = svg.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
    });
    ctrls.querySelector('.pz-reset').addEventListener('click', () => {
      const vb0 = JSON.parse(svg.dataset.vb0 || 'null');
      if (vb0) setViewBox(svg, vb0);
    });

    // Attach listeners
    svg.style.touchAction = 'none';
    svg.addEventListener('pointerdown', onPointerDown);
    // Use window listeners so pan continues even if pointer leaves the SVG
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    // If a click occurs after a pan, suppress it to avoid following links
    svg.addEventListener('click', function onClick(e) {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    svg.addEventListener('wheel', onWheel, { passive: false });
  }

  function scanAndAttach(root) {
    const svgs = (root || document).querySelectorAll('.mermaid svg');
    svgs.forEach(setupPanZoom);
  }

  // Initial and dynamic hookup
  window.addEventListener('load', () => scanAndAttach());

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            if (n.matches && (n.matches('.mermaid svg') || n.matches('.mermaid'))) {
              scanAndAttach(n);
            } else if (n.querySelector) {
              scanAndAttach(n);
            }
          }
        });
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
