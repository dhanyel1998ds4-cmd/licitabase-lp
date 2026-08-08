(function () {
  const catalog = window.LICITABASE_PRICING;
  if (!catalog) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lightTheme = document.documentElement.dataset.theme === 'light';
  const landingBase = lightTheme ? '/light/' : '/';
  const comparisonBase = lightTheme ? '/light/planos/comparar' : '/planos/comparar';
  if (lightTheme && document.body.classList.contains('pricing-compare-page')) {
    document.querySelectorAll('a[href="/"], a[href^="/#"]').forEach((link) => {
      const href = link.getAttribute('href');
      link.setAttribute('href', href === '/' ? landingBase : `/light/${href.slice(1)}`);
    });
  }
  const icons = {
    search: '<circle cx="11" cy="11" r="6.8"/><path d="m16.2 16.2 4.3 4.3"/>',
    growth: '<path d="m4 17 5-5 3.6 3.6L20 8.2"/><path d="M14.5 8.2H20v5.5"/>',
    building: '<path d="M5 21V7l7-3 7 3v14"/><path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1M3 21h18"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/>',
    plug: '<path d="M8 12h8v3a4 4 0 0 1-8 0v-3Z"/><path d="M10 12V7M14 12V7M12 19v3"/>',
    spark: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/>',
    scan: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><circle cx="12" cy="12" r="3"/>',
    users: '<path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M17 11a4 4 0 0 1 4 4v2M16 3.2a4 4 0 0 1 0 7.6"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2v-3ZM20 14a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2v-3ZM17 19c0 1.7-1.3 3-3 3h-2"/>',
    radar: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.4"/><path d="m12 12 6-6M18 6h-3M18 6v3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/><path d="M9.5 4.2A3 3 0 0 1 12 3a3 3 0 0 1 2.5 1.2"/>',
    chart: '<path d="M4 20V5M4 20h16"/><path d="m7 15 3-4 3 2 5-7"/><circle cx="7" cy="15" r="1"/><circle cx="10" cy="11" r="1"/><circle cx="13" cy="13" r="1"/><circle cx="18" cy="6" r="1"/>',
    ai: '<path d="M9 4h6a5 5 0 0 1 5 5v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9a5 5 0 0 1 5-5Z"/><path d="M9 9v6M15 9v6M9 12h6"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    network: '<rect x="3" y="4" width="6" height="5" rx="1.5"/><rect x="15" y="4" width="6" height="5" rx="1.5"/><rect x="9" y="15" width="6" height="5" rx="1.5"/><path d="M6 9v2h12V9M12 11v4"/>',
    workflow: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6h7M7.5 8l3.3 7.7M16.5 8l-3.3 7.7"/>',
    gavel: '<path d="m14.5 5.5 4 4M12.5 7.5l4 4M5 15l8.5-8.5 4 4L9 19H5v-4Z"/><path d="M12 20h9"/>',
    brain: '<path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.5A3.5 3.5 0 0 0 4.5 15a3.5 3.5 0 0 0 5 4.5V4.5ZM14.5 4.5A3.5 3.5 0 0 1 18 8v.5a3.5 3.5 0 0 1 1.5 6.5 3.5 3.5 0 0 1-5 4.5V4.5Z"/><path d="M9.5 9H7.8M14.5 9h1.7M9.5 14H7M14.5 14H17M12 4.5v15"/>',
    infinity: '<path d="M8.5 8.5c-2.8-2.8-6.5-.8-6.5 3.5s3.7 6.3 6.5 3.5l7-7c2.8-2.8 6.5-.8 6.5 3.5s-3.7 6.3-6.5 3.5l-7-7Z"/>',
    document: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/><path d="m14.5 11 1 1 2-2"/>',
    sitemap: '<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="6" height="4" rx="1"/><rect x="15" y="17" width="6" height="4" rx="1"/><path d="M12 7v5M6 17v-5h12v5"/>',
    scale: '<path d="M12 3v18M6 6h12M5 6l-3 6h6L5 6ZM19 6l-3 6h6l-3-6ZM3 12a3 3 0 0 0 5 0M16 12a3 3 0 0 0 6 0M8 21h8"/>',
    check: '<path d="m6.5 12.5 3.2 3.2 7.8-8"/>',
    close: '<path d="m8 8 8 8M16 8l-8 8"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  };

  const icon = (name, className = '') => `
    <svg class="${className}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">
      ${icons[name] || icons.spark}
    </svg>`;

  function queryCycle() {
    const value = new URLSearchParams(window.location.search).get('ciclo');
    return value === 'annual' ? 'annual' : 'monthly';
  }

  function cardMarkup(plan, index) {
    const badge = plan.featured
      ? `<div class="pricing-card__badge">${icon('spark')}<span>${plan.badge}</span></div>`
      : '';
    return `
      <article class="pricing-card${plan.featured ? ' pricing-card--featured' : ''} reveal reveal-item" data-plan-id="${plan.id}" data-reveal-delay="${index * 120}">
        ${badge}
        <header class="pricing-card__header">
          <span class="pricing-card__icon">${icon(plan.icon)}</span>
          <span>
            <h3>${plan.name}</h3>
            <p>${plan.tagline}</p>
          </span>
        </header>
        <div class="pricing-card__divider"></div>
        <div class="pricing-card__price" aria-live="polite">
          <span class="pricing-card__currency">R$</span>
          <strong data-plan-price>0</strong>
          <span class="pricing-card__period">/mês</span>
        </div>
        <p class="pricing-card__billing" data-plan-billing aria-hidden="true"></p>
        <p class="pricing-card__audience">${plan.audience}</p>
        <ul class="pricing-card__features">
          ${plan.features.map((feature) => `<li><span aria-hidden="true">${icon(feature.icon)}</span>${feature.label}</li>`).join('')}
        </ul>
        <a class="button ${plan.featured ? 'button-primary' : 'button-secondary'} pricing-card__action" href="${plan.action.href}">${plan.action.label}</a>
      </article>`;
  }

  function comparisonValue(value) {
    if (value === true) {
      return `<span class="comparison-status comparison-status--yes"><span class="sr-only">Incluído</span>${icon('check')}</span>`;
    }
    if (value === false) {
      return `<span class="comparison-status comparison-status--no"><span class="sr-only">Não incluído</span>${icon('close')}</span>`;
    }
    return `<span class="comparison-value">${value}</span>`;
  }

  function comparisonMarkup() {
    return catalog.comparison.map((group, groupIndex) => `
      <tr class="comparison-group-row">
        <th colspan="4" scope="colgroup">
          <span class="comparison-group__index">${groupIndex + 1}</span>
          <span class="comparison-group__icon">${icon(group.icon)}</span>
          <span><strong>${group.title}</strong><small>${group.description}</small></span>
        </th>
      </tr>
      ${group.rows.map((row) => `
        <tr class="comparison-feature-row">
          <th scope="row">${row.label}</th>
          ${row.values.map((value, planIndex) => `<td data-plan-label="${catalog.plans[planIndex].name}">${comparisonValue(value)}</td>`).join('')}
        </tr>`).join('')}
    `).join('');
  }

  function updateUrlCycle(cycle) {
    const url = new URL(window.location.href);
    url.searchParams.set('ciclo', cycle);
    window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
  }

  function setupPricing(root) {
    const mode = root.dataset.pricingMode || 'cards';
    const cardContainer = root.querySelector('[data-pricing-cards]');
    const comparisonBody = root.querySelector('[data-comparison-body]');
    const cycleButtons = Array.from(root.querySelectorAll('[data-pricing-cycle]'));
    const compareLink = root.querySelector('[data-comparison-link]');
    const backLink = document.querySelector('[data-pricing-back]');
    let cycle = queryCycle();

    if (cardContainer) {
      cardContainer.innerHTML = catalog.plans.map(cardMarkup).join('');
    }
    if (comparisonBody) {
      comparisonBody.innerHTML = comparisonMarkup();
    }

    function render(nextCycle, { updateUrl = true, animate = true } = {}) {
      cycle = nextCycle;
      root.dataset.cycle = cycle;

      cycleButtons.forEach((button) => {
        const active = button.dataset.pricingCycle === cycle;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      catalog.plans.forEach((plan) => {
        const price = plan.prices[cycle];
        root.querySelectorAll(`[data-plan-id="${plan.id}"]`).forEach((container) => {
          const value = container.querySelector('[data-plan-price]');
          const billing = container.querySelector('[data-plan-billing]');
          if (value) {
            value.textContent = String(price.value);
            if (animate && !reduceMotion && typeof value.animate === 'function') {
              value.animate(
                [
                  { opacity: 0.25, transform: 'translateY(5px)' },
                  { opacity: 1, transform: 'translateY(0)' },
                ],
                { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' },
              );
            }
          }
          if (billing) {
            billing.hidden = false;
            billing.textContent = price.total || '\u00a0';
            billing.setAttribute('aria-hidden', String(cycle !== 'annual'));
          }
        });
      });

      if (compareLink) {
        compareLink.href = `${comparisonBase}?ciclo=${cycle}`;
      }
      if (backLink) {
        backLink.href = `${landingBase}?ciclo=${cycle}#pricing`;
      }
      if (updateUrl) updateUrlCycle(cycle);
    }

    cycleButtons.forEach((button) => {
      button.addEventListener('click', () => render(button.dataset.pricingCycle));
    });

    render(cycle, { updateUrl: mode === 'comparison', animate: false });
  }

  document.querySelectorAll('[data-pricing-root]').forEach(setupPricing);
})();
