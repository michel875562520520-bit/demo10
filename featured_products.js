// featured_products.js
(async () => {
  const track = document.getElementById("featuredTrack");
  if (!track) return;

  // ✅ 取得試算表商品（products_api.js 會提供 window.ProductAPI）
  let products = [];
  try {
    if (!window.ProductAPI?.getProducts) throw new Error("ProductAPI not found");
    products = await window.ProductAPI.getProducts();
  } catch (e) {
    console.warn("讀取試算表商品失敗，請確認 products_api.js 有載入且 API 可用", e);
    products = [];
  }

  // ✅ 欄位容錯：你的 sheet 欄位可能是 name/title、image/img、desc/description...
  const norm = (p) => ({
    id: p.id ?? p.ID ?? p.sku ?? "",
    name: p.name ?? p.title ?? p.productName ?? "",
    desc: p.desc ?? p.description ?? p.spec ?? "",
    image: p.image ?? p.img ?? p.imageUrl ?? p.photo ?? "",
  });

  const all = (Array.isArray(products) ? products : []).map(norm).filter(p => p.id || p.name);

  // ✅ Fisher-Yates 洗牌
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ✅ 隨機抽 20 個（如果不足 20 就全拿）
  const PICK = 20;
  const picked = all.length > PICK ? shuffle(all).slice(0, PICK) : all;

  // ✅ 分頁：每頁 4 張（你原本 CSS 就是 4 欄）
  const PAGE_SIZE = 4;
  const pages = [];
  for (let i = 0; i < picked.length; i += PAGE_SIZE) {
    pages.push(picked.slice(i, i + PAGE_SIZE));
  }

  // ✅ 產生 HTML（點卡片跳 cart.html，kw 用商品 name）
  track.innerHTML = pages
    .map(
      (page) => `
      <div class="products-page">
        <div class="products-grid">
          ${page
            .map((p) => {
              const name = p.name || "";
              const kw = encodeURIComponent(name || p.id || "");
              const img = p.image ? encodeURI(p.image) : "";
              const desc = (p.desc || "").replace(/\n/g, "<br>");
              const safeAlt = String(name).replace(/"/g, "&quot;");

              return `
  <div class="product-card product-link" data-id="${p.id || ""}">
    <div class="product-img">
      <img src="${img}" alt="${safeAlt}" onerror="this.style.display='none'">
    </div>
    <h3 class="product-title">${name}</h3>
    <p class="product-desc">${desc}</p>
  </div>
`;
            })
            .join("")}
        </div>
      </div>
    `
    )
    .join("");

  // ===== slider 基本 =====
  track.style.display = "flex";
  track.style.transition = "transform .45s ease";
  track.style.willChange = "transform";

  const pageEls = Array.from(track.querySelectorAll(".products-page"));
  pageEls.forEach((pg) => (pg.style.flex = "0 0 100%"));

  const slider = track.closest(".products-slider");
  if (slider) {
    slider.style.overflow = "hidden";
    slider.style.touchAction = "pan-y";
  }

  // ✅ 你 HTML 固定有 p1~p5，最多可顯示 5 頁（20 個剛好 5 頁）
  const radios = Array.from(document.querySelectorAll('input.p-radio[name="p"]'));
  const usable = radios.slice(0, pages.length);

  let curIdx = 0;
  const go = (idx) => {
    const i = Math.max(0, Math.min(idx, pages.length - 1));
    curIdx = i;
    track.style.transform = `translateX(-${i * 100}%)`;
    if (usable[i]) usable[i].checked = true;
  };

  let startIdx = usable.findIndex((r) => r.checked);
  if (startIdx < 0) startIdx = 0;
  go(startIdx);

  usable.forEach((r, i) => {
    r.addEventListener("change", () => {
      if (r.checked) go(i);
    });
  });

  // =========================
  // ✅ 拖曳滑動（你原本的穩定版保留）
  // =========================
  if (!slider) return;

  let isDown = false;
  let startX = 0;
  let dx = 0;

  let dragged = false;
  let captured = false;
  let downLink = null;

  const DRAG_START_PX = 28;
  const SNAP_THRESHOLD_RATIO = 0.2;

  const onDown = (e) => {
    isDown = true;
    dragged = false;
    captured = false;
    dx = 0;
    startX = e.clientX;
    downLink = e.target.closest?.("a.product-card") || null;
  };

  const onMove = (e) => {
    if (!isDown) return;

    dx = e.clientX - startX;

    if (!dragged && Math.abs(dx) >= DRAG_START_PX) {
      dragged = true;
      track.style.transition = "none";

      if (!captured && slider.setPointerCapture) {
        try {
          slider.setPointerCapture(e.pointerId);
          captured = true;
        } catch (_) {}
      }
    }

    if (!dragged) return;

    const percent = (dx / (slider.clientWidth || 1)) * 100;
    track.style.transform = `translateX(-${curIdx * 100 - percent}%)`;
    e.preventDefault();
  };

  const onUp = (e) => {
    if (!isDown) return;
    isDown = false;

    if (!dragged) {
  downLink = null;
  return;
}

    track.style.transition = "transform .45s ease";
    const threshold = (slider.clientWidth || 1) * SNAP_THRESHOLD_RATIO;

    if (dx > threshold) go(curIdx - 1);
    else if (dx < -threshold) go(curIdx + 1);
    else go(curIdx);

    downLink = null;
  };

  slider.addEventListener("pointerdown", onDown);
  slider.addEventListener("pointermove", onMove, { passive: false });
  slider.addEventListener("pointerup", onUp);
  slider.addEventListener("pointercancel", onUp);
  slider.addEventListener("pointerleave", onUp);

  window.addEventListener("resize", () => go(curIdx));
})();