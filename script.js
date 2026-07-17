import { initSmoothScroll } from './smooth-scroll.js';

initSmoothScroll({ anchorOffset: -70 });

const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

toggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const hero = document.querySelector('.hero');
const heroVideo = document.querySelector('.hero-video');
const scrollIntro = document.querySelector('[data-scroll-intro]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scrollTicking = false;

const counters = [...document.querySelectorAll('[data-count]')];
const renderCounter = (counter, value) => {
  const prefix = counter.dataset.prefix || '';
  const suffix = counter.dataset.suffix || '';
  counter.textContent = `${prefix}${Math.round(value).toLocaleString('pt-BR')}${suffix}`;
};

if (reduceMotion.matches) {
  counters.forEach((counter) => renderCounter(counter, Number(counter.dataset.count)));
} else {
  counters.forEach((counter) => renderCounter(counter, 0));
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const counter = entry.target;
      const reachedTrigger = entry.intersectionRatio >= 0.45;
      const isActive = counter.dataset.countActive === 'true';

      if (!entry.isIntersecting) {
        counter.dataset.countActive = 'false';
        counter.dataset.animationId = String(Number(counter.dataset.animationId || 0) + 1);
        renderCounter(counter, 0);
        return;
      }
      if (!reachedTrigger || isActive) return;

      counter.dataset.countActive = 'true';
      const animationId = Number(counter.dataset.animationId || 0) + 1;
      counter.dataset.animationId = String(animationId);
      const finalValue = Number(counter.dataset.count);
      const duration = 2200;
      const startedAt = performance.now();

      const updateCounter = (now) => {
        if (Number(counter.dataset.animationId) !== animationId) return;
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        renderCounter(counter, finalValue * eased);
        if (progress < 1) requestAnimationFrame(updateCounter);
      };

      requestAnimationFrame(updateCounter);
    });
  }, { threshold: [0, 0.45] });

  counters.forEach((counter) => counterObserver.observe(counter));
}

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

function updateScrollIntro() {
  scrollTicking = false;

  if (reduceMotion.matches || !hero || !scrollIntro) return;

  const heroProgress = clamp(window.scrollY / Math.max(hero.offsetHeight, 1));
  heroVideo?.style.setProperty('--hero-video-y', `${Math.round(heroProgress * 190)}px`);

  const introRect = scrollIntro.getBoundingClientRect();
  const introProgress = clamp((window.innerHeight - introRect.top) / (window.innerHeight * 0.78));
  const eased = 1 - Math.pow(1 - introProgress, 3);

  scrollIntro.style.setProperty('--intro-opacity', eased.toFixed(3));
  scrollIntro.style.setProperty('--intro-y', `${Math.round((1 - eased) * 96)}px`);
  scrollIntro.style.setProperty('--intro-clip', `${Math.round((1 - eased) * 18)}%`);
}

function requestScrollIntroUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateScrollIntro);
}

if (!reduceMotion.matches && scrollIntro) {
  updateScrollIntro();
  window.addEventListener('scroll', requestScrollIntroUpdate, { passive: true });
  window.addEventListener('resize', requestScrollIntroUpdate);
}
