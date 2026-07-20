import { initSmoothScroll } from './smooth-scroll.js';

const lenis = initSmoothScroll({ anchorOffset: -70 });
const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

function setMenuOpen(isOpen) {
  nav?.classList.toggle('open', isOpen);
  toggle?.setAttribute('aria-expanded', String(isOpen));
}

toggle?.addEventListener('click', () => setMenuOpen(!nav?.classList.contains('open')));
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (event) => {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (event) => {
  if (window.innerWidth > 900 || !nav) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const horizontal = Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;
  if (!horizontal) return;
  if (deltaX < 0 && touchStartX > window.innerWidth * .72) setMenuOpen(true);
  if (deltaX > 0 && nav.classList.contains('open')) setMenuOpen(false);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.is-reveal').forEach((element) => revealObserver.observe(element));

const filterButtons = [...document.querySelectorAll('[data-filter] button')];
const articleCards = [...document.querySelectorAll('[data-article-grid] .article-card')];

filterButtons.forEach((button) => {
  button.setAttribute('aria-pressed', String(button.classList.contains('active')));
  button.addEventListener('click', () => {
    const selectedCategory = button.dataset.category;
    filterButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    articleCards.forEach((card) => {
      card.hidden = selectedCategory !== 'todos' && card.dataset.category !== selectedCategory;
    });
    lenis.resize();
  });
});

const reader = document.querySelector('[data-article-reader]');
const readerContent = document.querySelector('[data-reader-content]');
const readerClose = document.querySelector('[data-reader-close]');
let readerSlug = '';

function articleUrl(slug = '') {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set('artigo', slug);
  else url.searchParams.delete('artigo');
  return `${url.pathname}${url.search}${url.hash}`;
}

function openArticle(slug, { updateHistory = true } = {}) {
  const template = document.querySelector(`#article-${CSS.escape(slug)}`);
  if (!template || !reader || !readerContent) return;

  readerContent.replaceChildren(template.content.cloneNode(true));
  readerSlug = slug;
  if (!reader.open) reader.showModal();
  reader.scrollTop = 0;
  document.body.classList.add('reader-open');
  lenis.stop();
  if (updateHistory) history.pushState({ article: slug }, '', articleUrl(slug));
}

function closeArticle({ updateHistory = true } = {}) {
  if (!reader?.open) return;
  reader.close();
  readerSlug = '';
  document.body.classList.remove('reader-open');
  lenis.start();
  if (updateHistory) history.replaceState(null, '', articleUrl());
}

document.querySelectorAll('[data-open-article]').forEach((button) => {
  button.addEventListener('click', () => openArticle(button.dataset.openArticle));
});

readerClose?.addEventListener('click', () => closeArticle());
reader?.addEventListener('click', (event) => {
  if (event.target === reader) closeArticle();
});
reader?.addEventListener('close', () => {
  if (!readerSlug) return;
  readerSlug = '';
  document.body.classList.remove('reader-open');
  lenis.start();
  history.replaceState(null, '', articleUrl());
});

window.addEventListener('popstate', () => {
  const slug = new URL(window.location.href).searchParams.get('artigo');
  if (slug) openArticle(slug, { updateHistory: false });
  else closeArticle({ updateHistory: false });
});

const initialArticle = new URL(window.location.href).searchParams.get('artigo');
if (initialArticle) openArticle(initialArticle, { updateHistory: false });
