import { initSmoothScroll } from './smooth-scroll.js';

const lenis = initSmoothScroll({ anchorOffset: -70 });

const header = document.querySelector('[data-header]');
const toggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

const setMenuOpen = (isOpen) => {
  nav?.classList.toggle('open', isOpen);
  toggle?.setAttribute('aria-expanded', String(isOpen));
};

toggle?.addEventListener('click', () => setMenuOpen(!nav.classList.contains('open')));

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  setMenuOpen(false);
}));

const contactForm = document.querySelector('[data-contact-form]');

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const status = contactForm.querySelector('[data-form-status]');
  const subject = `Contato pelo site — ${data.get('nome')}`;
  const body = [
    `Nome: ${data.get('nome')}`,
    `E-mail: ${data.get('email')}`,
    `Empresa: ${data.get('empresa') || 'Não informada'}`,
    `Telefone: ${data.get('telefone') || 'Não informado'}`,
    '',
    String(data.get('mensagem')),
  ].join('\n');

  if (status) status.textContent = 'Abrindo seu aplicativo de e-mail…';
  window.location.href = `mailto:contato@agrovalora.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

window.addEventListener('touchend', (event) => {
  if (window.innerWidth > 800 || !nav) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const isHorizontalSwipe = Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

  if (!isHorizontalSwipe) return;
  if (deltaX < 0 && touchStartX > window.innerWidth * .72) setMenuOpen(true);
  if (deltaX > 0 && nav.classList.contains('open')) setMenuOpen(false);
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16, rootMargin: '0px 0px -10% 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const hero = document.querySelector('.hero');
const heroVideo = document.querySelector('.hero-video');
const heroLogo = document.querySelector('.hero-logo');
const headerLogo = document.querySelector('.header-logo');
const scrollIntro = document.querySelector('[data-scroll-intro]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scrollTicking = false;
let heroLogoOrigin;

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

function measureHeroLogo() {
  if (!heroLogo) return;
  heroLogo.style.transform = 'none';
  const rect = heroLogo.getBoundingClientRect();
  heroLogoOrigin = {
    left: rect.left,
    top: rect.top + window.scrollY,
    width: rect.width,
  };
}

function updateLogoJourney() {
  if (!heroLogo || !headerLogo || !header || !hero) return;

  if (reduceMotion.matches) {
    heroLogo.style.removeProperty('transform');
    heroLogo.style.removeProperty('opacity');
    headerLogo.style.removeProperty('opacity');
    header.classList.remove('logo-arrived');
    return;
  }

  if (!heroLogoOrigin) measureHeroLogo();
  const target = headerLogo.getBoundingClientRect();
  const rawProgress = clamp(window.scrollY / (hero.offsetHeight * .72));
  const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
  const translateX = (target.left - heroLogoOrigin.left) * progress;
  const translateY = (target.top + window.scrollY - heroLogoOrigin.top) * progress;
  const targetScale = target.width / heroLogoOrigin.width;
  const scale = 1 + (targetScale - 1) * progress;
  const fadeProgress = clamp((progress - .72) / .22);

  heroLogo.style.transform = `translate3d(${translateX}px,${translateY}px,0) scale(${scale})`;
  heroLogo.style.opacity = String(1 - fadeProgress);
  headerLogo.style.opacity = String(fadeProgress);
  header.classList.toggle('logo-arrived', progress >= .94);
}

function updateScrollIntro() {
  scrollTicking = false;

  updateLogoJourney();
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
  window.addEventListener('resize', () => {
    heroLogoOrigin = undefined;
    requestScrollIntroUpdate();
  });
} else {
  updateLogoJourney();
}

function rearmHomeExperience() {
  document.querySelectorAll('.reveal').forEach((element) => {
    element.classList.remove('visible');
    observer.observe(element);
  });
  heroLogoOrigin = undefined;
}

let hasLeftHomeTop = window.scrollY > 120;

function watchHomeReplay() {
  if (window.scrollY > 120) {
    hasLeftHomeTop = true;
    return;
  }

  if (window.scrollY <= 2 && hasLeftHomeTop) {
    hasLeftHomeTop = false;
    rearmHomeExperience();
    requestScrollIntroUpdate();
  }
}

window.addEventListener('scroll', watchHomeReplay, { passive: true });

function returnToHome({ immediate = false } = {}) {
  lenis.start();
  lenis.resize();
  const completeReturn = () => {
    hasLeftHomeTop = false;
    rearmHomeExperience();
    history.replaceState(null, '', '#inicio');
    requestScrollIntroUpdate();
  };

  if (immediate) {
    lenis.scrollTo(0, { immediate: true, force: true });
    requestAnimationFrame(completeReturn);
    return;
  }

  lenis.scrollTo(0, { duration: 1.35, force: true, onComplete: completeReturn });
}

document.querySelectorAll('a[href="#inicio"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    returnToHome();
  });
});

window.addEventListener('pageshow', (event) => {
  const navigation = performance.getEntriesByType('navigation')[0];
  if (event.persisted || navigation?.type === 'back_forward') {
    returnToHome({ immediate: true });
  }
});
