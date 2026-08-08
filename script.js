const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = reducedMotionQuery.matches;
const desktopWorkflowQuery = window.matchMedia('(min-width: 1200px)');
const phoneQuery = window.matchMedia('(max-width: 809.98px)');

function setupThemeAssets() {
  if (document.documentElement.dataset.theme !== 'light') return;
  document.querySelectorAll('[data-light-src]').forEach((image) => {
    image.dataset.darkSrc = image.getAttribute('src') || '';
    image.setAttribute('src', image.dataset.lightSrc);
  });
}

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const easeInOut = (value) => (value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2);

function springProgress(timeSeconds, { stiffness, damping, mass = 1 }) {
  const discriminant = damping * damping - 4 * mass * stiffness;
  if (Math.abs(discriminant) < 0.0001) {
    const rate = damping / (2 * mass);
    return 1 - Math.exp(-rate * timeSeconds) * (1 + rate * timeSeconds);
  }

  if (discriminant > 0) {
    const root = Math.sqrt(discriminant);
    const first = (-damping + root) / (2 * mass);
    const second = (-damping - root) / (2 * mass);
    const a = -second / (first - second);
    const b = first / (first - second);
    return 1 - (a * Math.exp(first * timeSeconds) + b * Math.exp(second * timeSeconds));
  }

  const natural = Math.sqrt(stiffness / mass);
  const ratio = damping / (2 * Math.sqrt(stiffness * mass));
  const damped = natural * Math.sqrt(1 - ratio * ratio);
  const envelope = Math.exp(-ratio * natural * timeSeconds);
  return 1 - envelope * (
    Math.cos(damped * timeSeconds) + (ratio * natural / damped) * Math.sin(damped * timeSeconds)
  );
}

function springSamples(config, durationMs, sampleCount = 60) {
  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const offset = index / sampleCount;
    return { offset, progress: springProgress((durationMs / 1000) * offset, config) };
  });
}

function animateEntrance(element, { x = 0, y = 0, delay = 0, spring, duration = 1000 }) {
  if (reduceMotion) {
    element.classList.add('is-visible', 'motion-complete');
    return Promise.resolve();
  }

  const frames = springSamples(spring, duration).map(({ offset, progress }) => ({
    offset,
    opacity: String(clamp(progress)),
    transform: `translate3d(${x * (1 - progress)}px, ${y * (1 - progress)}px, 0)`,
  }));
  const animation = element.animate(frames, { duration, delay, easing: 'linear', fill: 'both' });
  return animation.finished.catch(() => {}).then(() => {
    element.classList.add('is-visible', 'motion-complete');
    animation.cancel();
  });
}

function startHeroMotion() {
  const elements = document.querySelectorAll('.hero-load');
  if (reduceMotion) {
    elements.forEach((element) => element.classList.add('motion-complete'));
    return;
  }

  requestAnimationFrame(() => {
    elements.forEach((element) => {
      animateEntrance(element, {
        y: 160,
        delay: Number(element.dataset.loadDelay || 0),
        duration: 1120,
        spring: { stiffness: 200, damping: 40, mass: 1 },
      });
    });
  });
}

class WheelSmoother {
  constructor() {
    this.duration = 600;
    this.target = window.scrollY;
    this.start = window.scrollY;
    this.startedAt = 0;
    this.frame = 0;
    this.onWheel = this.onWheel.bind(this);
    this.tick = this.tick.bind(this);
    window.addEventListener('wheel', this.onWheel, { passive: false });
  }

  onWheel(event) {
    if (event.ctrlKey || event.defaultPrevented) return;
    event.preventDefault();
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    this.start = window.scrollY;
    this.target = clamp(this.target + event.deltaY, 0, maximum);
    this.startedAt = performance.now();
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(this.tick);
  }

  tick(now) {
    const elapsed = clamp((now - this.startedAt) / this.duration);
    const eased = Math.min(1, 1.001 - Math.pow(2, -10 * elapsed));
    window.scrollTo(0, this.start + (this.target - this.start) * eased);
    if (elapsed < 1) this.frame = requestAnimationFrame(this.tick);
    else this.target = window.scrollY;
  }
}

if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) new WheelSmoother();

const revealDefinitions = [
  {
    selector: '.reveal-heading',
    threshold: 0.5,
    options: { y: 95, duration: 1120, spring: { stiffness: 200, damping: 40, mass: 1 } },
  },
  {
    selector: '.reveal-side',
    threshold: 0.5,
    options: { x: -60, duration: 760, spring: { stiffness: 500, damping: 80, mass: 1 } },
  },
  {
    selector: '.reveal-item',
    threshold: 0,
    options: { y: 50, duration: 900, spring: { stiffness: 300, damping: 60, mass: 1 } },
  },
];

function setupReveals() {
  revealDefinitions.forEach(({ selector, threshold, options }) => {
    const elements = document.querySelectorAll(selector);
    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        animateEntrance(entry.target, {
          ...options,
          delay: Number(entry.target.dataset.revealDelay || 0),
        });
      });
    }, { threshold });
    elements.forEach((element) => observer.observe(element));
  });
}

function setupAboutLetters() {
  const element = document.querySelector('[data-scroll-letters]');
  if (!element) return;
  const text = element.textContent.replace(/\s+/g, ' ').trim();
  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  const words = [];
  textNodes.forEach((textNode) => {
    const isLeading = textNode.parentElement === element;
    const parts = textNode.textContent.match(/\s+|\S+/g) || [];
    const fragment = document.createDocumentFragment();
    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        return;
      }
      const word = document.createElement('span');
      word.className = `about-word${isLeading ? ' is-leading' : ''}`;
      word.setAttribute('aria-hidden', 'true');
      word.textContent = part;
      fragment.append(word);
      words.push(word);
    });
    textNode.replaceWith(fragment);
  });

  element.setAttribute('aria-label', text);
  element.dataset.scrollWordsReady = 'true';
  const animatedWords = words.filter((word) => !word.classList.contains('is-leading'));

  const rootStyles = getComputedStyle(document.documentElement);
  const fromColor = (rootStyles.getPropertyValue('--about-reveal-from') || '#85868b').trim();
  const toColor = (rootStyles.getPropertyValue('--about-reveal-to') || '#ffffff').trim();
  const colorProbe = document.createElement('span');
  colorProbe.style.position = 'absolute';
  colorProbe.style.visibility = 'hidden';
  document.body.append(colorProbe);
  const parseColor = (color) => {
    colorProbe.style.color = color;
    const channels = getComputedStyle(colorProbe).color.match(/[\d.]+/g) || ['0', '0', '0'];
    return channels.slice(0, 3).map(Number);
  };
  const fromRgb = parseColor(fromColor);
  const toRgb = parseColor(toColor);
  colorProbe.remove();

  if (reduceMotion) {
    words.forEach((word) => { word.style.color = toColor; });
    return;
  }

  let scheduled = false;
  const update = () => {
    scheduled = false;
    let documentTop = 0;
    let offsetElement = element;
    while (offsetElement) {
      documentTop += offsetElement.offsetTop;
      offsetElement = offsetElement.offsetParent;
    }
    const elementTop = documentTop - window.scrollY;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const progress = clamp((viewportHeight * 0.78 - elementTop) / (viewportHeight * 0.58));
    const lastIndex = Math.max(1, animatedWords.length - 1);
    animatedWords.forEach((word, index) => {
      const position = index / lastIndex;
      const local = easeInOut(clamp((progress - position * 0.86) / 0.14));
      const red = Math.round(fromRgb[0] + (toRgb[0] - fromRgb[0]) * local);
      const green = Math.round(fromRgb[1] + (toRgb[1] - fromRgb[1]) * local);
      const blue = Math.round(fromRgb[2] + (toRgb[2] - fromRgb[2]) * local);
      word.style.color = `rgb(${red}, ${green}, ${blue})`;
    });
    element.style.setProperty('--about-reveal-progress', progress.toFixed(4));
  };
  const requestUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  window.visualViewport?.addEventListener('resize', requestUpdate);
  update();
}

function formatCounter(value, target) {
  const decimals = Number.isInteger(target) ? 0 : 2;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function animateCounter(element, delay = 0) {
  const target = Number(element.dataset.count);
  if (element.dataset.counterAnimated === 'true') return;
  element.dataset.counterAnimated = 'true';
  if (reduceMotion || !Number.isFinite(target)) {
    element.textContent = formatCounter(target, target);
    return;
  }
  const duration = 1500;
  const startsAt = performance.now() + delay;
  element.textContent = formatCounter(0, target);
  const tick = (now) => {
    if (now < startsAt) {
      requestAnimationFrame(tick);
      return;
    }
    const progress = clamp((now - startsAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = formatCounter(target * eased, target);
    if (progress < 1) requestAnimationFrame(tick);
    else element.textContent = formatCounter(target, target);
  };
  requestAnimationFrame(tick);
}

function animateStatCard(card, delay) {
  const frames = springSamples({ stiffness: 220, damping: 34, mass: 1 }, 900).map(({ offset, progress }) => ({
    offset,
    opacity: String(clamp(progress)),
    transform: `translate3d(0, ${42 * (1 - progress)}px, 0) scale(${0.97 + 0.03 * progress})`,
    filter: `blur(${5 * (1 - clamp(progress))}px)`,
  }));
  const animation = card.animate(frames, { duration: 900, delay, easing: 'linear', fill: 'both' });
  animation.finished.catch(() => {}).then(() => {
    card.classList.add('is-visible');
    animation.cancel();
  });
}

function setupCounters() {
  const stats = document.querySelector('.stats');
  if (!stats) return;
  const cards = Array.from(stats.querySelectorAll('article'));
  const counters = cards.map((card) => card.querySelector('[data-count]')).filter(Boolean);

  const showFinalState = () => {
    cards.forEach((card) => card.classList.add('is-visible'));
    counters.forEach((counter) => {
      counter.dataset.counterAnimated = 'true';
      const target = Number(counter.dataset.count);
      counter.textContent = formatCounter(target, target);
    });
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    showFinalState();
    return;
  }

  let activated = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || activated) return;
      activated = true;
      observer.unobserve(stats);
      stats.dataset.statsAnimated = 'true';
      cards.forEach((card, index) => {
        const delay = index * 140;
        animateStatCard(card, delay);
        const counter = card.querySelector('[data-count]');
        if (counter) animateCounter(counter, delay + 90);
      });
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
  observer.observe(stats);
}

function setupWorkflow() {
  const stage = document.querySelector('#step-trigger-activate');
  const triggers = [stage, document.querySelector('#step-trigger-1'), document.querySelector('#step-trigger-2')];
  const track = document.querySelector('[data-how-track]');
  const cards = Array.from(document.querySelectorAll('.how-card'));
  const progressLine = document.querySelector('.step-line i');
  const markers = Array.from(document.querySelectorAll('.step-line span'));
  const mobileRail = document.querySelector('[data-how-mobile-timeline]');
  const mobileMarkers = Array.from(document.querySelectorAll('.how-card__step'));
  if (
    !stage
    || !track
    || !progressLine
    || !mobileRail
    || triggers.some((trigger) => !trigger)
    || cards.length !== 3
    || markers.length !== cards.length
    || mobileMarkers.length !== cards.length
  ) return;

  stage.closest('.workflow-scroll')?.classList.add('is-motion-ready');

  let thresholds = [];
  let desktopRevealDistances = [];
  let mobileMarkerCenters = [];
  let scheduled = false;

  const clearDesktopWorkflow = (complete = false) => {
    cards.forEach((card) => {
      card.style.removeProperty('opacity');
      card.style.removeProperty('filter');
      card.style.removeProperty('transform');
      card.style.removeProperty('will-change');
    });
    progressLine.style.setProperty('--desktop-step-progress', complete ? '1' : '0');
    markers.forEach((marker) => {
      marker.classList.toggle('is-active', complete);
      marker.classList.remove('is-current');
    });
  };

  const clearMobileTimeline = () => {
    mobileMarkerCenters = [];
    mobileRail.style.removeProperty('top');
    mobileRail.style.removeProperty('height');
    mobileRail.style.setProperty('--mobile-timeline-progress', '0');
    mobileMarkers.forEach((marker) => marker.classList.remove('is-active'));
  };

  const measureMobileTimeline = () => {
    if (!phoneQuery.matches) {
      clearMobileTimeline();
      return;
    }
    const trackRect = track.getBoundingClientRect();
    mobileMarkerCenters = mobileMarkers.map((marker) => {
      const markerRect = marker.getBoundingClientRect();
      return {
        documentY: markerRect.top + window.scrollY + markerRect.height / 2,
        trackY: markerRect.top - trackRect.top + markerRect.height / 2,
      };
    });
    const start = mobileMarkerCenters[0]?.trackY ?? 0;
    const end = mobileMarkerCenters.at(-1)?.trackY ?? start;
    mobileRail.style.top = `${start}px`;
    mobileRail.style.height = `${Math.max(0, end - start)}px`;
  };

  const measure = () => {
    if (desktopWorkflowQuery.matches && !reduceMotion) {
      thresholds = triggers.map((trigger) => {
        const documentTop = trigger.getBoundingClientRect().top + window.scrollY;
        return documentTop - (window.innerHeight - trigger.offsetHeight * 0.5);
      });
      desktopRevealDistances = thresholds.map((threshold, index) => {
        const previousInterval = index > 0 ? threshold - thresholds[index - 1] : 0;
        const nextInterval = index < thresholds.length - 1 ? thresholds[index + 1] - threshold : previousInterval;
        const availableInterval = Math.max(previousInterval, nextInterval, 1);
        return Math.min(250, Math.max(170, availableInterval * 0.28));
      });
    } else {
      thresholds = [];
      desktopRevealDistances = [];
    }
    measureMobileTimeline();
  };

  const segmentProgress = (value, start, end) => {
    if (end <= start) return value >= end ? 1 : 0;
    return clamp((value - start) / (end - start));
  };

  const updateDesktopWorkflow = () => {
    if (thresholds.length !== cards.length) measure();
    if (thresholds.length !== cards.length) return;

    const scrollPosition = window.scrollY;
    const markerPositions = [1 / 6, 1 / 2, 5 / 6];
    const leadingSegment = segmentProgress(
      scrollPosition,
      thresholds[0] - desktopRevealDistances[0],
      thresholds[0],
    );
    const firstSegment = segmentProgress(scrollPosition, thresholds[0], thresholds[1]);
    const secondSegment = segmentProgress(scrollPosition, thresholds[1], thresholds[2]);
    const trailingSegment = segmentProgress(
      scrollPosition,
      thresholds[2],
      thresholds[2] + desktopRevealDistances[2],
    );
    const lineProgress = scrollPosition < thresholds[0]
      ? leadingSegment * markerPositions[0]
      : scrollPosition < thresholds[1]
        ? markerPositions[0] + firstSegment * (markerPositions[1] - markerPositions[0])
        : scrollPosition < thresholds[2]
          ? markerPositions[1] + secondSegment * (markerPositions[2] - markerPositions[1])
          : markerPositions[2] + trailingSegment * (1 - markerPositions[2]);
    progressLine.style.setProperty('--desktop-step-progress', String(lineProgress));

    const currentMarker = thresholds.reduce(
      (current, threshold, index) => (scrollPosition >= threshold ? index : current),
      -1,
    );
    markers.forEach((marker, index) => {
      marker.classList.toggle('is-active', index <= currentMarker);
      marker.classList.toggle('is-current', index === currentMarker);
    });

    cards.forEach((card, index) => {
      const rawProgress = segmentProgress(
        scrollPosition,
        thresholds[index],
        thresholds[index] + desktopRevealDistances[index],
      );
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      const translateY = (1 - easedProgress) * 48;
      const scale = 0.985 + easedProgress * 0.015;
      const blur = (1 - easedProgress) * 4;

      card.style.opacity = easedProgress.toFixed(4);
      card.style.transform = `translateY(${translateY.toFixed(2)}px) scale(${scale.toFixed(4)})`;
      card.style.filter = rawProgress >= 0.999 ? 'none' : `blur(${blur.toFixed(2)}px)`;
      card.style.willChange = rawProgress > 0 && rawProgress < 1
        ? 'opacity, transform, filter'
        : 'auto';
    });
  };

  const updateMobileTimeline = () => {
    if (!phoneQuery.matches) return;
    if (mobileMarkerCenters.length !== mobileMarkers.length) measureMobileTimeline();
    if (reduceMotion) {
      mobileRail.style.setProperty('--mobile-timeline-progress', '1');
      mobileMarkers.forEach((marker) => marker.classList.add('is-active'));
      return;
    }
    const first = mobileMarkerCenters[0]?.documentY ?? 0;
    const last = mobileMarkerCenters.at(-1)?.documentY ?? first;
    const activationY = window.scrollY + window.innerHeight * 0.45;
    const distance = last - first;
    const progress = distance > 0 ? clamp((activationY - first) / distance) : 0;
    mobileRail.style.setProperty('--mobile-timeline-progress', String(progress));
    mobileMarkers.forEach((marker, index) => {
      marker.classList.toggle('is-active', activationY >= mobileMarkerCenters[index].documentY);
    });
  };

  const update = () => {
    scheduled = false;
    if (phoneQuery.matches) {
      clearDesktopWorkflow();
      updateMobileTimeline();
      return;
    }
    clearMobileTimeline();
    if (reduceMotion) {
      clearDesktopWorkflow(true);
      return;
    }
    if (!desktopWorkflowQuery.matches) {
      clearDesktopWorkflow();
      return;
    }
    updateDesktopWorkflow();
  };

  const requestUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  const reset = () => {
    measure();
    update();
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', reset);
  desktopWorkflowQuery.addEventListener?.('change', reset);
  phoneQuery.addEventListener?.('change', reset);
  if ('ResizeObserver' in window) {
    const timelineResizeObserver = new ResizeObserver(() => {
      if (!phoneQuery.matches) return;
      measureMobileTimeline();
      requestUpdate();
    });
    timelineResizeObserver.observe(track);
  }
  document.fonts?.ready.then(reset).catch(() => {});
  track.querySelectorAll('img').forEach((image) => {
    if (!image.complete) image.addEventListener('load', reset, { once: true });
  });
  requestAnimationFrame(reset);
}

function setupDropdown() {
  const wrapper = document.querySelector('.pages-dropdown');
  const trigger = document.querySelector('.pages-trigger');
  const menu = document.querySelector('#pages-menu');
  if (!wrapper || !trigger || !menu) return;
  let closeTimer = 0;
  let animation;

  const setOpen = (open, returnFocus = false) => {
    window.clearTimeout(closeTimer);
    if (trigger.getAttribute('aria-expanded') === String(open)) return;
    trigger.setAttribute('aria-expanded', String(open));
    animation?.cancel();
    if (open) {
      menu.hidden = false;
      const frames = springSamples({ stiffness: 600, damping: 40, mass: 0.5 }, 450).map(({ offset, progress }) => ({
        offset,
        opacity: String(clamp(progress)),
        transform: `scale(${0.95 + 0.05 * progress})`,
      }));
      animation = menu.animate(frames, { duration: 450, easing: 'linear', fill: 'both' });
    } else {
      animation = menu.animate([
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(.95)' },
      ], { duration: reduceMotion ? 1 : 180, easing: 'ease-in', fill: 'both' });
      animation.finished.catch(() => {}).then(() => {
        menu.hidden = true;
        animation.cancel();
        if (returnFocus) trigger.focus();
      });
    }
  };

  wrapper.addEventListener('mouseenter', () => setOpen(true));
  wrapper.addEventListener('mouseleave', () => { closeTimer = window.setTimeout(() => setOpen(false), 100); });
  trigger.addEventListener('click', () => {
    if (trigger.getAttribute('aria-expanded') !== 'true') setOpen(true);
    else if (!window.matchMedia('(hover: hover)').matches) setOpen(false);
  });
  wrapper.addEventListener('focusout', (event) => {
    if (!wrapper.contains(event.relatedTarget)) setOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  });
}

function setupMobileMenu() {
  const button = document.querySelector('.menu-button');
  const menu = document.querySelector('#mobile-menu');
  if (!button || !menu) return;
  let animation;

  const setOpen = (open) => {
    button.setAttribute('aria-expanded', String(open));
    animation?.cancel();
    if (open) {
      menu.hidden = false;
      const frames = springSamples({ stiffness: 400, damping: 35, mass: 0.6 }, 520).map(({ offset, progress }) => ({
        offset,
        opacity: String(clamp(progress)),
        transform: `translateY(${(1 - progress) * -12}px) scale(${0.98 + 0.02 * progress})`,
      }));
      animation = menu.animate(frames, { duration: reduceMotion ? 1 : 520, easing: 'linear', fill: 'both' });
    } else if (!menu.hidden) {
      const frames = springSamples({ stiffness: 400, damping: 42, mass: 1 }, 420).map(({ offset, progress }) => ({
        offset,
        opacity: String(clamp(1 - progress)),
        transform: `translateY(${-8 * progress}px) scale(${1 - 0.02 * progress})`,
      }));
      animation = menu.animate(frames, { duration: reduceMotion ? 1 : 420, easing: 'linear', fill: 'both' });
      animation.finished.catch(() => {}).then(() => {
        menu.hidden = true;
        animation.cancel();
      });
    }
  };

  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus();
    }
  });
}

function setupBotCarousel() {
  const track = document.querySelector('.testimonial-track');
  const stage = document.querySelector('.testimonial-stage');
  const dots = document.querySelector('.testimonial-dots');
  if (!track || !stage || !dots || stage.closest('[hidden]')) return;
  const originals = Array.from(track.querySelectorAll('[data-testimonial]'));
  let active = 0;
  let timer = 0;
  let tickerClones = [];
  const positions = [
    { x: 0, rotate: 0 },
    { x: 66, rotate: 9 },
    { x: 128, rotate: 17 },
    { x: 184, rotate: 24 },
    { x: 234, rotate: 31 },
  ];

  originals.forEach((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Mostrar recurso ${index + 1} do bot`);
    button.addEventListener('click', () => {
      show(index);
      schedule();
    });
    dots.append(button);
  });

  const show = (index, animate = true) => {
    if (phoneQuery.matches) return;
    active = (index + originals.length) % originals.length;
    originals.forEach((card, cardIndex) => {
      const offset = (cardIndex - active + originals.length) % originals.length;
      const target = positions[offset];
      const fromX = Number(card.dataset.cardX || target.x);
      const fromRotate = Number(card.dataset.cardRotate || target.rotate);
      card.className = 'testimonial-card';
      card.classList.add(offset === 0 ? 'is-active' : `is-next-${offset}`);
      card.style.zIndex = String(originals.length - offset);
      card.style.opacity = '1';
      card.style.transform = `translateX(${target.x}px) rotate(${target.rotate}deg)`;
      card.dataset.cardX = String(target.x);
      card.dataset.cardRotate = String(target.rotate);
      card.setAttribute('aria-hidden', String(offset !== 0));
      if (animate && !reduceMotion) {
        const frames = springSamples({ stiffness: 500, damping: 60, mass: 1 }, 760).map(({ offset: frameOffset, progress }) => ({
          offset: frameOffset,
          transform: `translateX(${fromX + (target.x - fromX) * progress}px) rotate(${fromRotate + (target.rotate - fromRotate) * progress}deg)`,
        }));
        card.animate(frames, { duration: 760, easing: 'linear' });
      }
    });
    dots.querySelectorAll('button').forEach((button, buttonIndex) => {
      button.setAttribute('aria-pressed', String(buttonIndex === active));
    });
  };

  const schedule = () => {
    window.clearTimeout(timer);
    if (reduceMotion || phoneQuery.matches) return;
    timer = window.setTimeout(() => {
      show(active + 1);
      schedule();
    }, active === originals.length - 1 ? 3000 : 5000);
  };

  const setupTicker = () => {
    window.clearTimeout(timer);
    tickerClones.forEach((clone) => clone.remove());
    tickerClones = [];
    track.classList.toggle('is-ticker', phoneQuery.matches);
    stage.setAttribute('aria-live', phoneQuery.matches ? 'off' : 'polite');
    if (phoneQuery.matches) {
      originals.forEach((card) => {
        card.className = 'testimonial-card';
        card.removeAttribute('style');
        card.removeAttribute('aria-hidden');
        const clone = card.cloneNode(true);
        clone.removeAttribute('data-testimonial');
        clone.setAttribute('aria-hidden', 'true');
        track.append(clone);
        tickerClones.push(clone);
      });
      requestAnimationFrame(() => {
        const distance = track.scrollWidth / 2;
        track.style.setProperty('--ticker-duration', `${distance / 40}s`);
      });
    } else {
      show(active, false);
      schedule();
    }
  };

  phoneQuery.addEventListener?.('change', setupTicker);
  setupTicker();
}

const commandCenterIcons = {
  'nav-explore': `
    <circle class="command-icon__wash" cx="14" cy="14" r="7"></circle>
    <g class="command-icon__secondary"><circle cx="14" cy="14" r="10"></circle><path d="M14 2v4M2 14h4M14 22v4"></path></g>
    <g class="command-icon__primary"><circle cx="14" cy="14" r="4.5"></circle><path d="m20.8 20.8 6.2 6.2"></path></g>
    <circle class="command-icon__spark" cx="14" cy="14" r="1.8"></circle>`,
  'nav-operation': `
    <rect class="command-icon__wash" x="4" y="5" width="24" height="22" rx="6"></rect>
    <g class="command-icon__secondary"><rect x="4" y="5" width="24" height="22" rx="6"></rect><path d="M10 10h12M10 16h5M10 22h12"></path></g>
    <g class="command-icon__primary"><circle cx="23" cy="10" r="2"></circle><circle cx="18" cy="16" r="2"></circle><circle cx="23" cy="22" r="2"></circle><path d="m19.5 14.5 2-3M19.5 17.5l2 3"></path></g>`,
  'nav-intelligence': `
    <path class="command-icon__wash" d="M5 25 11 17l5 4 6-11 5 4v11Z"></path>
    <g class="command-icon__secondary"><circle cx="13" cy="13" r="8"></circle><path d="m19 19 7 7"></path></g>
    <path class="command-icon__primary" d="m7 20 4-5 5 3 5-9"></path>
    <path class="command-icon__spark" d="m24 4 .9 2.1L27 7l-2.1.9L24 10l-.9-2.1L21 7l2.1-.9Z"></path>`,
  'nav-management': `
    <path class="command-icon__wash" d="M16 3 27 7v8c0 7-4.5 11.5-11 14-6.5-2.5-11-7-11-14V7Z"></path>
    <path class="command-icon__secondary" d="M16 3 27 7v8c0 7-4.5 11.5-11 14-6.5-2.5-11-7-11-14V7Z"></path>
    <g class="command-icon__primary"><path d="M10 11h12M10 16h12M10 21h12"></path><circle cx="14" cy="11" r="2"></circle><circle cx="19" cy="16" r="2"></circle><circle cx="13" cy="21" r="2"></circle></g>`,
  'search-tenders': `
    <path class="command-icon__wash" d="M6 3h13l6 6v16H6Z"></path>
    <g class="command-icon__secondary"><path d="M6 3h13l6 6v8M19 3v6h6M10 13h7M10 18h4"></path></g>
    <g class="command-icon__primary"><circle cx="21" cy="22" r="5.5"></circle><path d="m25 26 3.5 3.5"></path></g>
    <circle class="command-icon__spark" cx="21" cy="22" r="1.7"></circle>`,
  'interest-categories': `
    <g class="command-icon__secondary"><rect x="4" y="4" width="10" height="10" rx="3"></rect><rect x="18" y="4" width="10" height="10" rx="3"></rect><rect x="4" y="18" width="10" height="10" rx="3"></rect></g>
    <rect class="command-icon__wash" x="17" y="17" width="12" height="12" rx="4"></rect>
    <path class="command-icon__primary" d="m19.5 23 3.5-3.5 5 5-3.5 3.5H20Z"></path>
    <circle class="command-icon__spark" cx="25.6" cy="21.9" r="1.2"></circle>`,
  'tender-items': `
    <path class="command-icon__wash" d="m4 10 9-5 9 5-9 5Z"></path>
    <g class="command-icon__primary"><path d="m4 10 9-5 9 5-9 5Z"></path><path d="M4 10v11l9 5 9-5V10M13 15v11"></path></g>
    <g class="command-icon__secondary"><path d="M23 8h5M25 13h3M25 18h3M23 23h5"></path></g>`,
  'saved-filters': `
    <path class="command-icon__wash" d="M3 5h18l-7 8v8l-4 3V13Z"></path>
    <path class="command-icon__secondary" d="M3 5h18l-7 8v8l-4 3V13Z"></path>
    <path class="command-icon__primary" d="M20 14h8v14l-4-2.5-4 2.5Z"></path>
    <path class="command-icon__spark" d="m22 19 1.4 1.4L26 18l1 1-3.6 3.6-2.4-2.4Z"></path>`,
  'my-tenders': `
    <rect class="command-icon__wash" x="7" y="4" width="18" height="24" rx="4"></rect>
    <g class="command-icon__secondary"><rect x="7" y="4" width="18" height="24" rx="4"></rect><path d="M12 10h8M12 15h8M12 20h4"></path></g>
    <circle class="command-icon__wash" cx="23" cy="23" r="6"></circle>
    <g class="command-icon__primary"><circle cx="23" cy="23" r="6"></circle><path d="m20 23 2 2 4-5"></path></g>`,
  pipeline: `
    <rect class="command-icon__wash" x="23" y="11" width="7" height="10" rx="2.5"></rect>
    <g class="command-icon__secondary"><rect x="2" y="11" width="7" height="10" rx="2.5"></rect><rect x="12.5" y="11" width="7" height="10" rx="2.5"></rect><rect x="23" y="11" width="7" height="10" rx="2.5"></rect></g>
    <path class="command-icon__primary" d="M9 16h3.5M10.5 14l2 2-2 2M19.5 16H23M21 14l2 2-2 2"></path>
    <circle class="command-icon__spark" cx="5.5" cy="16" r="1.7"></circle><circle class="command-icon__spark" cx="16" cy="16" r="1.7"></circle><circle class="command-icon__spark" cx="26.5" cy="16" r="1.7"></circle>`,
  'bid-bot': `
    <path class="command-icon__wash" d="m5 9 5-5 9 9-5 5Z"></path>
    <path class="command-icon__secondary" d="m5 9 5-5 9 9-5 5Z"></path>
    <g class="command-icon__primary"><path d="M16 15 26 25M18 28h11"></path><path d="M8 12 4 16M17 9l4-4"></path></g>
    <g class="command-icon__secondary"><path d="M23 6c2.5.8 4.2 2.5 5 5M23 10c1 .4 1.6 1 2 2"></path></g>
    <circle class="command-icon__spark" cx="26" cy="5" r="1.5"></circle>`,
  documents: `
    <path class="command-icon__wash" d="M8 4h14l6 6v18H8Z"></path>
    <path class="command-icon__secondary" d="M4 9v19h19M8 4h14l6 6v18H8Z"></path>
    <g class="command-icon__primary"><path d="M22 4v6h6M13 14h10M13 19h10M13 24h6"></path></g>
    <circle class="command-icon__spark" cx="26" cy="26" r="1.7"></circle>`,
  xray: `
    <path class="command-icon__wash" d="M9 6h14v20H9Z"></path>
    <g class="command-icon__secondary"><path d="M3 10V5c0-1.1.9-2 2-2h5M22 3h5c1.1 0 2 .9 2 2v5M29 22v5c0 1.1-.9 2-2 2h-5M10 29H5c-1.1 0-2-.9-2-2v-5"></path></g>
    <g class="command-icon__primary"><path d="M9 6h14v20H9Z"></path><circle cx="16" cy="16" r="4"></circle><path d="m19 19 4 4"></path></g>`,
  'agency-score': `
    <path class="command-icon__wash" d="m3 12 11-7 11 7Z"></path>
    <g class="command-icon__secondary"><path d="m3 12 11-7 11 7M5 25h18M7 12v10M12 12v10M17 12v10M22 12v10"></path></g>
    <circle class="command-icon__wash" cx="24" cy="23" r="6"></circle>
    <g class="command-icon__primary"><circle cx="24" cy="23" r="6"></circle><path d="m21 23 2 2 4-5"></path></g>`,
  'monitored-companies': `
    <path class="command-icon__wash" d="M5 27V9l10-4 10 4v18Z"></path>
    <g class="command-icon__secondary"><path d="M5 27V9l10-4 10 4v18M10 12h2M18 12h2M10 17h2M18 17h2M11 27v-5h8v5"></path></g>
    <g class="command-icon__primary"><circle cx="23" cy="11" r="5"></circle><path d="M23 3v3M31 11h-3M23 19v-3"></path></g>
    <circle class="command-icon__spark" cx="23" cy="11" r="1.6"></circle>`,
  competitors: `
    <g class="command-icon__secondary"><path d="M3 27V12l7-3 7 3v15M19 27V9l6-3 4 2v19M7 16h2M7 21h2M23 13h2M23 18h2"></path></g>
    <g class="command-icon__primary"><path d="M9 5h14l-3-3m3 3-3 3M23 27H9l3 3m-3-3 3-3"></path></g>
    <circle class="command-icon__spark" cx="16" cy="16" r="2"></circle>`,
  reports: `
    <rect class="command-icon__wash" x="4" y="5" width="24" height="22" rx="5"></rect>
    <g class="command-icon__secondary"><rect x="4" y="5" width="24" height="22" rx="5"></rect><path d="M9 22V16M14 22V12M19 22v-8"></path></g>
    <path class="command-icon__primary" d="m8 14 5-4 5 2 6-5"></path>
    <path class="command-icon__spark" d="m25 3 .8 1.8L28 6l-2.2 1.2L25 9l-.8-1.8L22 6l2.2-1.2Z"></path>`,
  team: `
    <g class="command-icon__secondary"><circle cx="11" cy="10" r="4"></circle><circle cx="22" cy="11" r="3"></circle><path d="M3 25v-2c0-4 3-7 8-7s8 3 8 7v2M20 17c4 0 7 2 7 6v1"></path></g>
    <path class="command-icon__wash" d="M22 16 29 19v4c0 4-2.8 6.5-7 8-4.2-1.5-7-4-7-8v-4Z"></path>
    <path class="command-icon__primary" d="M22 16 29 19v4c0 4-2.8 6.5-7 8-4.2-1.5-7-4-7-8v-4Z"></path>
    <path class="command-icon__spark" d="m19 23 2 2 4-4 1.2 1.2-5.2 5.2-3.2-3.2Z"></path>`,
  integrations: `
    <circle class="command-icon__wash" cx="16" cy="16" r="5"></circle>
    <g class="command-icon__secondary"><circle cx="5" cy="8" r="3"></circle><circle cx="27" cy="8" r="3"></circle><circle cx="5" cy="25" r="3"></circle><circle cx="27" cy="25" r="3"></circle><path d="m8 10 5 4M24 10l-5 4M8 23l5-4M24 23l-5-4"></path></g>
    <g class="command-icon__primary"><circle cx="16" cy="16" r="5"></circle><path d="M13 16h6M16 13v6"></path><path d="M11 4c3-2 7-2 10 0M21 29c-3 2-7 2-10 0"></path></g>`,
  plans: `
    <g class="command-icon__secondary"><path d="M4 24h6V14H4ZM13 24h6V9h-6ZM22 24h6V4h-6Z"></path></g>
    <path class="command-icon__wash" d="M13 9h6v15h-6Z"></path>
    <g class="command-icon__primary"><path d="m5 10 7-6 5 3 9-6"></path><path d="M22 1h4v4"></path><path d="M3 28h26"></path></g>
    <circle class="command-icon__spark" cx="16" cy="9" r="1.8"></circle>`,
};

const commandCenterContent = {
  explorar: {
    title: 'Encontre oportunidades com mais precisão',
    description: 'Pesquise novas licitações, explore áreas de interesse e reutilize critérios importantes para reduzir o tempo gasto procurando oportunidade por oportunidade.',
    features: [
      {
        icon: 'search-tenders',
        title: 'Buscar licitações',
        description: 'Pesquise oportunidades por produto, serviço, órgão, palavra-chave e filtros avançados.',
        microcopy: 'Busque por produto, serviço, órgão ou palavra-chave.',
      },
      {
        icon: 'interest-categories',
        title: 'Categorias de interesse',
        description: 'Explore oportunidades organizadas pelas áreas mais relevantes para a atuação da sua empresa.',
        microcopy: 'Acesse rapidamente os setores que você acompanha.',
      },
      {
        icon: 'tender-items',
        title: 'Itens de licitação',
        description: 'Consulte oportunidades a partir dos itens publicados nas licitações e encontre compras compatíveis com o que sua empresa fornece.',
        microcopy: 'Pesquise um item para localizar oportunidades relacionadas.',
      },
      {
        icon: 'saved-filters',
        title: 'Filtros salvos',
        description: 'Salve combinações de filtros importantes e retome suas pesquisas sem configurar tudo novamente.',
        microcopy: 'Seus critérios recorrentes, prontos para usar.',
      },
    ],
  },
  operacao: {
    title: 'Organize o que sua empresa realmente vai disputar',
    description: 'Centralize oportunidades selecionadas, acompanhe cada etapa e mantenha as participações mais importantes sob controle.',
    features: [
      {
        icon: 'my-tenders',
        title: 'Minhas Licitações',
        description: 'Centralize as oportunidades que sua empresa decidiu acompanhar e tenha uma visão rápida do que exige atenção.',
        microcopy: 'Acompanhe suas licitações em um só lugar.',
      },
      {
        icon: 'pipeline',
        title: 'Pipeline',
        description: 'Organize cada licitação por etapa, prioridade e responsável para deixar claro o próximo passo.',
        microcopy: 'Em análise • Aprovada • Em disputa • Concluída',
      },
      {
        icon: 'bid-bot',
        title: 'Bot de Lances',
        description: 'Configure sua estratégia, defina o piso permitido e deixe o bot executar lances dentro das regras estabelecidas por você.',
        microcopy: 'Você define as regras. O bot respeita os limites.',
      },
      {
        icon: 'documents',
        title: 'Documentos',
        description: 'Acesse os documentos vinculados à sua operação em um único ambiente.',
        microcopy: 'Documentos importantes sempre ao alcance da equipe.',
      },
    ],
  },
  inteligencia: {
    title: 'Decida com mais contexto antes de participar',
    description: 'Aprofunde sua leitura de oportunidades, órgãos e concorrentes para priorizar melhor onde sua equipe deve concentrar esforço.',
    features: [
      {
        icon: 'xray',
        title: 'Raio-X',
        description: 'Aprofunde a análise de uma licitação antes de decidir como avançar na oportunidade.',
        microcopy: 'Uma visão mais completa antes da decisão.',
      },
      {
        icon: 'agency-score',
        title: 'Score dos Órgãos',
        description: 'Consulte o score disponível para apoiar a leitura do perfil dos órgãos acompanhados.',
        microcopy: 'Mais contexto sobre quem está comprando.',
      },
      {
        icon: 'monitored-companies',
        title: 'Empresas monitoradas',
        description: 'Acompanhe empresas que fazem parte da sua análise competitiva e mantenha esses nomes organizados na plataforma.',
        microcopy: 'Mantenha empresas relevantes no seu radar.',
      },
      {
        icon: 'competitors',
        title: 'Concorrentes',
        description: 'Veja quais empresas já venceram licitações do mesmo órgão, quantas vitórias tiveram e os valores médios contratados.',
        microcopy: 'Entenda melhor quem disputa o mesmo mercado que você.',
      },
      {
        icon: 'reports',
        title: 'Relatórios',
        description: 'Consolide informações da operação em visões de acompanhamento para apoiar análises internas.',
        microcopy: 'Transforme dados da operação em uma visão mais clara.',
      },
    ],
  },
  gestao: {
    title: 'Administre sua estrutura sem perder o controle',
    description: 'Gerencie acessos, integrações e informações da conta conforme sua operação evolui.',
    features: [
      {
        icon: 'team',
        title: 'Equipe',
        description: 'Organize os membros vinculados à conta de acordo com a capacidade disponível no seu plano.',
        microcopy: 'Sua equipe trabalhando no mesmo ambiente.',
      },
      {
        icon: 'integrations',
        title: 'Integrações',
        description: 'Conecte ComprasNet, Licitanet e Portal de Compras Públicas para sincronizar participações com o Licitabase.',
        microcopy: 'Menos alternância entre portais e controles paralelos.',
      },
      {
        icon: 'plans',
        title: 'Planos',
        description: 'Consulte o nível atual da sua operação e as opções disponíveis conforme sua necessidade cresce.',
        microcopy: 'Escolha os recursos adequados ao seu momento.',
      },
    ],
  },
};

function commandCenterIcon(name, variant = 'card') {
  const paths = commandCenterIcons[name] || commandCenterIcons['search-tenders'];
  return `<svg class="command-icon command-icon--${variant}" aria-hidden="true" focusable="false" viewBox="0 0 32 32">${paths}</svg>`;
}

function commandCenterCard(feature) {
  return `
    <article class="command-feature-card">
      <div class="command-feature-card__top">
        <div class="command-feature-card__icon" data-command-feature-icon="${feature.icon}">${commandCenterIcon(feature.icon)}</div>
        <div>
          <h4>${feature.title}</h4>
          <p class="command-feature-card__description">${feature.description}</p>
        </div>
      </div>
      <div class="command-feature-card__divider" aria-hidden="true"></div>
      <div class="command-feature-card__microcopy">
        <span aria-hidden="true"></span>
        <p>${feature.microcopy}</p>
      </div>
    </article>`;
}

function setupCommandCenter() {
  const section = document.querySelector('[data-command-center]');
  if (!section) return;

  const tabsShell = section.querySelector('.command-tabs-shell');
  const tabs = Array.from(section.querySelectorAll('[data-command-tab]'));
  const panelWrap = section.querySelector('.command-panel-wrap');
  const panel = section.querySelector('[data-command-panel]');
  const title = section.querySelector('[data-command-title]');
  const description = section.querySelector('[data-command-description]');
  const grid = section.querySelector('[data-command-grid]');
  if (!tabsShell || !tabs.length || !panelWrap || !panel || !title || !description || !grid) return;

  section.querySelectorAll('[data-command-icon]').forEach((holder) => {
    holder.innerHTML = commandCenterIcon(holder.dataset.commandIcon, 'tab');
  });

  let activeTab = 'explorar';
  let panelAnimation;
  let heightAnimation;

  const keepTabVisible = (tab) => {
    const left = tab.offsetLeft;
    const right = left + tab.offsetWidth;
    const visibleLeft = tabsShell.scrollLeft + 8;
    const visibleRight = tabsShell.scrollLeft + tabsShell.clientWidth - 8;
    let target = tabsShell.scrollLeft;
    if (left < visibleLeft) target = Math.max(0, left - 8);
    else if (right > visibleRight) target = right - tabsShell.clientWidth + 8;
    if (target !== tabsShell.scrollLeft) {
      tabsShell.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  const render = (nextId, { animate = true } = {}) => {
    const content = commandCenterContent[nextId];
    const nextTab = tabs.find((tab) => tab.dataset.commandTab === nextId);
    if (!content || !nextTab) return;
    const previousHeight = panelWrap.getBoundingClientRect().height;

    activeTab = nextId;
    tabs.forEach((tab) => {
      const selected = tab === nextTab;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    title.textContent = content.title;
    description.textContent = content.description;
    grid.dataset.layout = nextId;
    grid.innerHTML = content.features.map(commandCenterCard).join('');
    panel.setAttribute('aria-labelledby', nextTab.id);

    if (!animate || reduceMotion) {
      panelWrap.style.height = '';
      panelWrap.style.overflow = '';
      return;
    }

    const nextHeight = panel.getBoundingClientRect().height;
    panelAnimation?.cancel();
    heightAnimation?.cancel();
    panelAnimation = panel.animate([
      { opacity: 0.12, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 210, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });

    if (previousHeight > 0 && Math.abs(previousHeight - nextHeight) > 2) {
      panelWrap.style.height = `${previousHeight}px`;
      panelWrap.style.overflow = 'hidden';
      heightAnimation = panelWrap.animate([
        { height: `${previousHeight}px` },
        { height: `${nextHeight}px` },
      ], { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      panelWrap.style.height = `${nextHeight}px`;
      heightAnimation.finished.catch(() => {}).then(() => {
        panelWrap.style.height = '';
        panelWrap.style.overflow = '';
      });
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      render(tab.dataset.commandTab);
      keepTabVisible(tab);
    });

    tab.addEventListener('keydown', (event) => {
      let nextIndex = null;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      const nextTab = tabs[nextIndex];
      nextTab.focus();
      render(nextTab.dataset.commandTab);
      keepTabVisible(nextTab);
    });
  });

  render(activeTab, { animate: false });
}

function setupFaq() {
  document.querySelectorAll('details').forEach((details) => {
    const summary = details.querySelector('summary');
    if (!summary) return;
    details.classList.add('faq-enhanced');
    const icon = document.createElement('span');
    icon.className = 'faq-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '+';
    summary.append(icon);
    icon.style.transform = `rotate(${details.open ? 45 : 0}deg)`;
    let animation;
    let iconAnimation;

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      animation?.cancel();
      iconAnimation?.cancel();
      const opening = !details.open;
      const startHeight = details.getBoundingClientRect().height;
      if (opening) details.open = true;
      const endHeight = opening ? details.scrollHeight : summary.getBoundingClientRect().height;
      const fromRotate = opening ? 0 : 45;
      const toRotate = opening ? 45 : 0;

      if (reduceMotion) {
        details.open = opening;
        details.style.height = '';
        icon.style.transform = `rotate(${toRotate}deg)`;
        return;
      }

      details.style.height = `${startHeight}px`;
      const frames = springSamples({ stiffness: 400, damping: 40, mass: 1 }, 400).map(({ offset, progress }) => ({
        offset,
        height: `${startHeight + (endHeight - startHeight) * progress}px`,
      }));
      const iconFrames = springSamples({ stiffness: 400, damping: 40, mass: 1 }, 400).map(({ offset, progress }) => ({
        offset,
        transform: `rotate(${fromRotate + (toRotate - fromRotate) * progress}deg)`,
      }));
      animation = details.animate(frames, { duration: 400, easing: 'linear' });
      iconAnimation = icon.animate(iconFrames, { duration: 400, easing: 'linear' });
      icon.style.transform = `rotate(${toRotate}deg)`;
      animation.finished.catch(() => {}).then(() => {
        details.open = opening;
        details.style.height = '';
      });
    });
  });
}

function setupForm() {
  const form = document.querySelector('.subscribe-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const status = form.querySelector('.form-status');
    if (!input.checkValidity()) {
      status.textContent = 'Digite um endereço de e-mail válido.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    status.textContent = 'Tudo certo — seu pedido de criação de conta foi registrado.';
    form.reset();
  });
}

setupThemeAssets();
startHeroMotion();
setupCommandCenter();
setupReveals();
setupAboutLetters();
setupCounters();
setupWorkflow();
setupDropdown();
setupMobileMenu();
setupBotCarousel();
setupFaq();
setupForm();
document.querySelectorAll('[data-current-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
