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
  }

  function initDynamicBar() {
    const scrollContainer = document.querySelector('.dynamic-bar-scroll');
    const track = document.querySelector('.dynamic-bar-track');
    if (!scrollContainer || !track) return;
    scrollContainer.scrollLeft = 0;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
