// cart_deeplink.js (for your current cart.html chips-based filters)
(() => {
  const sp = new URLSearchParams(location.search);

  const getAll = (k) => sp.getAll(k).map(v => (v ?? '').toString().trim()).filter(Boolean);
  const get = (k) => (sp.get(k) ?? '').toString().trim();

  const esc = (v) => (window.CSS && CSS.escape) ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, '\\$&');

  // cart 裡的 chip 是 label[data-chip][data-name="types|brands|audiences|prices"][data-value="..."]
  const clickChip = (group, value) => {
    const sel = `[data-chip][data-name="${esc(group)}"][data-value="${esc(value)}"]`;
    const chip = document.querySelector(sel);
    if (!chip) return false;
    chip.click(); // ✅ 觸發你原本 filtersEl click handler
    return true;
  };

  const setKw = (text) => {
    const kw = document.getElementById('kw');
    if (!kw) return false;
    kw.value = text;
    kw.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  };

  const setSaleOnly = () => {
    const btn = document.querySelector('[data-filter-sale]');
    if (!btn) return false;
    // 你的程式是 click toggling onlySale
    btn.click();
    return true;
  };

  // ✅ 等 chips render 完（fetch products.json 後才塞進 facet）
  const waitForChips = (timeoutMs = 6000) => {
    const t0 = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        const ok =
          document.querySelector('#facetTypes [data-chip]') ||
          document.querySelector('#facetBrands [data-chip]') ||
          document.querySelector('#facetAudiences [data-chip]') ||
          document.querySelector('#facetPrices [data-chip]');

        if (ok) return resolve(true);
        if (Date.now() - t0 > timeoutMs) return resolve(false);
        requestAnimationFrame(tick);
      };
      tick();
    });
  };

  const apply = async () => {
    // 1) kw / q
    const kw = get('kw') || get('q');
    if (kw) setKw(kw);

    // 2) 等 chips 出現
    await waitForChips();

    // 3) mapping：URL參數 -> 你的 group 名稱
    // type -> types
    getAll('type').forEach(v => clickChip('types', v));

    // brand -> brands
    getAll('brand').forEach(v => clickChip('brands', v));

    // audience -> audiences
    getAll('audience').forEach(v => clickChip('audiences', v));

    // priceRange -> prices
    getAll('priceRange').forEach(v => clickChip('prices', v));

    // 4) saleOnly=1
    if (get('saleOnly') === '1') setSaleOnly();

    // 5) 有參數就捲到商品列表
    if (
      kw ||
      getAll('type').length ||
      getAll('brand').length ||
      getAll('audience').length ||
      getAll('priceRange').length ||
      get('saleOnly') === '1'
    ) {
      document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();