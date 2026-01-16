/**
 * search_new.js
 * - loads products.json
 * - handles open/close search modal
 * - search keyword + type
 * - on search / click result: redirect to cart.html with query params
 */
(() => {
  const state = {
    products: [],
    ready: false
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const els = {};

  const cacheEls = () => {
    els.openBtn  = $("#openSearch");
    els.modal    = $("#searchModal");
    els.closeBtn = $("#closeSearch");
    els.type     = $("#searchType");
    els.input    = $("#searchInput");
    els.btn      = $("#searchBtn");
    els.results  = $("#searchResults");
    els.hotWrap  = $("#hotTags");
  };

  const loadProducts = async () => {
    try{
      const res = await fetch("products.json", { cache: "no-store" });
      if(!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      state.products = Array.isArray(data) ? data : [];
    }catch(err){
      console.warn("products.json load failed:", err);
      state.products = [];
    }finally{
      state.ready = true;
      window.PRODUCTS = state.products;
    }
  };

  const openModal = () => {
    if(!els.modal) return;
    els.modal.classList.add("is-open");
    els.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-search-open");
    setTimeout(() => els.input?.focus(), 0);
  };

  const closeModal = () => {
    if(!els.modal) return;
    els.modal.classList.remove("is-open");
    els.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-search-open");
  };

  const escapeHtml = (s="") =>
    String(s).replace(/[&<>"']/g, m => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));

  const matchByType = (p, type, q) => {
    const qq = q.toLowerCase();
    const name  = (p.name  || "").toLowerCase();
    const brand = (p.brand || "").toLowerCase();
    const tags  = (p.tags  || []).join(" ").toLowerCase();
    const desc  = (p.desc  || "").toLowerCase();

    if(type === "product") return name.includes(qq) || desc.includes(qq);
    if(type === "brand")   return brand.includes(qq);
    if(type === "tag")     return tags.includes(qq);
    return (name + " " + brand + " " + tags + " " + desc).includes(qq);
  };

  const renderEmpty = (msg) => {
    if(!els.results) return;
    els.results.innerHTML = `<div class="search-empty">${escapeHtml(msg)}</div>`;
  };

  function renderResults(list){
    if(!list.length){
      els.results.innerHTML = `<div class="search-empty">找不到相關結果</div>`;
      return;
    }

    const q = (els.input.value || "").trim();
    const type = (els.type.value || "all").trim();

    els.results.innerHTML = list.map(p => {
      const tags = (p.tags || [])
        .slice(0, 3)
        .map(t => `<span class="sr-tag">${escapeHtml(t)}</span>`)
        .join("");

      return `
        <div class="sr-item"
             role="button"
             tabindex="0"
             data-q="${escapeHtml(q)}"
             data-type="${escapeHtml(type)}">
          <div class="sr-left">
            <div class="sr-title">${escapeHtml(p.name || "")}</div>
            <div class="sr-sub">${escapeHtml(p.brand || "")}</div>
            <div class="sr-tags">${tags}</div>
          </div>
        </div>
      `;
    }).join("");

    // 點整列 → 跳轉到 cart.html，並帶搜尋字
    els.results.querySelectorAll(".sr-item").forEach(item => {
      const go = () => {
        const q2 = (item.dataset.q || "").trim();
        const t2 = (item.dataset.type || "all").trim();
        location.href = `cart.html?q=${encodeURIComponent(q2)}&type=${encodeURIComponent(t2)}`;
      };

      item.addEventListener("click", go);
      item.addEventListener("keydown", (e) => {
        if(e.key === "Enter" || e.key === " "){
          e.preventDefault();
          go();
        }
      });
    });
  }

  const doSearch = () => {
    if(!state.ready){
      renderEmpty("商品資料載入中…");
      return;
    }

    const q = (els.input?.value || "").trim();
    const type = (els.type?.value || "all").trim();

    if(!q){
      renderEmpty("請輸入關鍵字開始搜尋");
      return;
    }

    // ✅ 你要的是：搜尋就直接跳圖2
    location.href = `cart.html?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`;

    // 如果你想「不要按搜尋也能看到結果清單」，就把上面那行註解掉，
    // 並打開下面兩行：
    // const list = state.products.filter(p => matchByType(p, type, q)).slice(0, 50);
    // renderResults(list);
  };

  const bind = () => {
    els.openBtn?.addEventListener("click", openModal);
    els.closeBtn?.addEventListener("click", closeModal);

    // 點遮罩關閉（看你 modal 結構，若 modal=mask 才能用）
    els.modal?.addEventListener("click", (e) => {
      if(e.target === els.modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape" && els.modal?.classList.contains("is-open")){
        closeModal();
      }
    });

    els.btn?.addEventListener("click", doSearch);
    els.input?.addEventListener("keydown", (e) => {
      if(e.key === "Enter") doSearch();
    });

    els.hotWrap?.addEventListener("click", (e) => {
      const b = e.target.closest(".hot-tag");
      if(!b) return;
      const q = b.getAttribute("data-q") || "";
      if(els.input) els.input.value = q;
      doSearch();
    });
  };

  document.addEventListener("DOMContentLoaded", async () => {
    cacheEls();
    bind();
    renderEmpty("請輸入關鍵字開始搜尋");
    await loadProducts();
  });
})();