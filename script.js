(function(){
  let zoomables = [];
  let currentIndex = 0;

  function createLightbox() {
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-content" role="dialog" aria-modal="true">
        <button class="lightbox-close" aria-label="Cerrar">✕</button>
        <button class="lightbox-prev" aria-label="Imagen anterior">‹</button>
        <button class="lightbox-next" aria-label="Siguiente imagen">›</button>
        <img class="lightbox-image" src="" alt="" />
        <div class="lightbox-caption"></div>
      </div>
    `;
    return overlay;
  }

  function updateLightbox(index) {
    const lb = document.getElementById('lightbox-overlay');
    if (!lb || !zoomables.length) return;

    currentIndex = (index + zoomables.length) % zoomables.length;
    const data = zoomables[currentIndex];
    const img = lb.querySelector('.lightbox-image');
    const caption = lb.querySelector('.lightbox-caption');

    img.src = data.src;
    img.alt = data.alt || '';
    caption.textContent = data.caption || data.alt || '';
  }

  function openLightbox(index) {
    let root = document.getElementById('lightbox-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'lightbox-root';
      document.body.appendChild(root);
    }
    root.innerHTML = '';
    const lb = createLightbox();
    root.appendChild(lb);

    const close = lb.querySelector('.lightbox-close');
    const backdrop = lb.querySelector('.lightbox-backdrop');
    const prev = lb.querySelector('.lightbox-prev');
    const next = lb.querySelector('.lightbox-next');

    function closeLB() {
      root.removeChild(lb);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    }

    function showImage(indexToShow) {
      updateLightbox(indexToShow);
    }

    close.addEventListener('click', closeLB);
    backdrop.addEventListener('click', closeLB);
    prev.addEventListener('click', () => showImage(currentIndex - 1));
    next.addEventListener('click', () => showImage(currentIndex + 1));
    document.addEventListener('keydown', onKey);

    showImage(index);
  }

  function init() {
    zoomables = Array.from(document.querySelectorAll('img.zoomable')).map((img, index) => ({
      src: img.src,
      alt: img.alt,
      caption: img.closest('figure')?.querySelector('h3')?.textContent || '',
      index,
    }));

    zoomables.forEach((data, index) => {
      const img = document.querySelectorAll('img.zoomable')[index];
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openLightbox(index));
    });

    initDynamicBar();
    initConstellation();
  }

  /* Constellation background: interactive canvas with points and connecting lines */


  function initConstellation() {
    const canvas = document.getElementById('constellation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let points = [];
    let mouse = { x: null, y: null, active: false };

    function resize() {
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initPoints();
    }

    function initPoints() {
      points = [];
      const area = width * height;
      const base = Math.max(24, Math.round(area / 140000));
      for (let i = 0; i < base; i++) {
        points.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 1 + Math.random() * 2
        });
      }
    }

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }

    function onLeave() {
      mouse.x = null;
      mouse.y = null;
      mouse.active = false;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    const maxDist = 160;

    function step() {
      ctx.clearRect(0, 0, width, height);

      // update points
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // slight attraction/repel from mouse
        if (mouse.active && mouse.x != null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (1 - dist / 120) * 0.6;
            p.vx += (dx / dist) * force * 0.02;
            p.vy += (dy / dist) * force * 0.02;
          }
        }
      }

      // draw connections
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.45;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(85, 220, 200, ${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // draw points
      for (const p of points) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(85,220,200,0.9)';
        ctx.globalCompositeOperation = 'lighter';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      // draw mouse connector
      if (mouse.active && mouse.x != null) {
        for (const p of points) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.6;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(120,180,255,${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(step);
    }

    resize();
    requestAnimationFrame(step);
  }

  function initDynamicBar() {
    const scrollContainer = document.querySelector('.dynamic-bar-scroll');
    const track = document.querySelector('.dynamic-bar-track');
    if (!scrollContainer || !track) return;

    // Reset any previous animation to avoid glitches while measuring
    track.style.animation = 'none';

    // Ensure the track content is long enough to loop seamlessly.
    // If the duplicated items in the HTML are not enough (different screen sizes),
    // clone items until the track's scrollWidth is at least twice the container width.
    const containerWidth = scrollContainer.clientWidth || window.innerWidth;
    let attempts = 0;
    // Remove any previously cloned flag to avoid infinite growth on re-init
    track.querySelectorAll('.dynamic-bar-item[data-cloned="true"]').forEach(n => n.remove());

    const originalItems = Array.from(track.querySelectorAll('.dynamic-bar-item'));
    // If there are no items, nothing to do
    if (!originalItems.length) return;

    while (track.scrollWidth < containerWidth * 2 && attempts < 20) {
      // clone original items and mark them
      for (const item of originalItems) {
        const clone = item.cloneNode(true);
        clone.setAttribute('data-cloned', 'true');
        track.appendChild(clone);
      }
      attempts++;
    }

    // Compute a reasonable duration based on content width so speed feels consistent
    // Lower this value to make the bar move slower (pixels per second)
    const speedPxPerSec = 50; // pixels per second (reduced further from 80)
    const distance = track.scrollWidth / 2; // we animate -50% (half the track)
    const duration = Math.max(8, Math.round(distance / speedPxPerSec));

    // Apply the animation with the computed duration
    track.style.animation = `scroll-left ${duration}s linear infinite`;

    // start from the left
    scrollContainer.scrollLeft = 0;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
