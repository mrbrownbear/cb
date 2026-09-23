// --- keep your existing helper ---
function performAjaxRequest(action, data, successCallback, errorCallback, beforeSendCallback) {
  data.nonce = ajax_params.nonce;
  data.action = action;

  if (typeof beforeSendCallback === 'function') beforeSendCallback();

  fetch(ajax_params.ajax_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data).toString(),
  })
    .then(r => r.text())
    .then(res => { if (typeof successCallback === 'function') successCallback(res); })
    .catch(() => { if (typeof errorCallback === 'function') errorCallback(); });
}

const PLACEHOLDER_HTML = `
  <div class="item placeholder">
    <a class="work-card video-hover" href="#" data-cursor="arrow">
      <figure class="work-card-media">
        <img src="" alt="Placeholder" loading="lazy" decoding="async" />
        <video muted loop playsinline preload="none">
          <source src="" />
        </video>
        <ul class="tags solid"><li>Placeholder Tag</li></ul>
      </figure>
      <div class="work-card-content">
        <h3>Placeholder Title</h3>
        <p>Placeholder description</p>
        <ul class="work-card-awards">
          <li class="square">
            <svg width="24" height="24"><rect width="100%" height="100%" fill="#ccc" /></svg>
            <span>Placeholder Award</span>
          </li>
        </ul>
      </div>
    </a>
  </div>
`;

function insertPlaceholders(container, count = 10) {
  const html = Array.from({ length: count }).map(() => PLACEHOLDER_HTML).join('');
  container.insertAdjacentHTML('beforeend', html);
}

function removePlaceholders(container) {
  container.querySelectorAll('.item.placeholder').forEach(el => el.remove());
}

function getScroller() {
  return (
    window.Scroller
  );
}

function scrollToEl(el, offset = -200) {
  if (!el) return;
  const scroller = getScroller();

  if (scroller) {
    if (typeof scroller.scrollTo === 'function') {
      scroller.scrollTo(el, { offset, duration: 800 });
      return;
    }
    if (typeof scroller.to === 'function') {
      scroller.to(el, { offset, duration: 800 });
      return;
    }
    if (typeof scroller.goTo === 'function') {
      scroller.goTo(el, { offset, duration: 800 });
      return;
    }
  }

  // Native fallback
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  requestAnimationFrame(() => {
    if (offset) window.scrollBy(0, offset);
  });
}

// --- forward-only loader ---
function makePortfolioLoader({ buttonSelector }) {
  const button = document.querySelector(buttonSelector);
  if (!button) return;

  const label = button.querySelector('.btn-label');
  const row = document.querySelector('.portfolio-row');

  // Boundaries
  let page = parseInt(button.getAttribute('data-page'), 10) || 1;
  const maxPages = parseInt(button.getAttribute('data-max-pages'), 10) || page;

  function atBoundary() {
    return page >= maxPages;
  }

  function setLoadingUI() {
    if (label) label.textContent = 'Loading...';
    button.disabled = true;
  }

  function resetUI() {
    button.disabled = false;
    if (label) label.textContent = 'Load More';
  }

  function insertResponseHTML(html) {
    row.insertAdjacentHTML('beforeend', html);
  }

  function updatePageNumber(newPage) {
    page = newPage;
    button.setAttribute('data-page', String(page));
    history.pushState({ page: page }, '', '/portfolio/page/' + page + '/');
  }

  button.addEventListener('click', function (e) {
    e.preventDefault();
    if (!row) return;

    if (atBoundary()) {
      button.remove();
      return;
    }

    insertPlaceholders(row, 10);

    performAjaxRequest(
      'load_more_portfolio',
      { page: page + 1 },
      // success
      (response) => {
        removePlaceholders(row);

        const trimmed = (response || '').trim();
        if (!trimmed) {
          button.remove();
          return;
        }

        const anchor = document.createElement('div');
        anchor.className = 'portfolio-anchor';
        anchor.style.display = 'none';
        row.insertAdjacentElement('beforeend', anchor);

        insertResponseHTML(trimmed);

        const firstNew = anchor.nextElementSibling;
        anchor.remove();

        scrollToEl(firstNew, 0);

        updatePageNumber(page + 1);

        if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
          ScrollTrigger.refresh();
        }

        if (atBoundary()) {
          button.remove();
        } else {
          resetUI();
        }

        document.dispatchEvent(new Event('portfolioLoadMore'));
      },
      // error
      () => {
        removePlaceholders(row);
        if (label) label.textContent = 'Error loading posts';
        button.disabled = true;
      },
      // beforeSend
      () => setLoadingUI()
    );
  });
}

// --- init on DOM ready ---
document.addEventListener('DOMContentLoaded', function () {
  makePortfolioLoader({ buttonSelector: '#load-more' });
});