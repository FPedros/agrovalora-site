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
