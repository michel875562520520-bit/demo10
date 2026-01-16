/* nav_mega_dynamic.js
 * 目的：Navbar「全部商品」的 mega 內容改成吃試算表資料（ProductAPI）
 * 依 types / brands / audiences 動態產生 <a href="cart.html?...">
 */

(() => {
  const norm = (s) => (s ?? "").toString().trim().toLowerCase();

  // 你 cart.html 目前的字典（保持一致）
  const TYPE_DICT = {
    food:  { label: "食品" },
    c3:    { label: "3C" },
    cloth: { label: "服飾" },
    home:  { label: "居家" },
  };

  const AUD_DICT = {
    pregnant: { label: "孕婦專區" },
    kids:     { label: "小孩專區" },
    adult:    { label: "成人專區" },
    senior:   { label: "樂齡專區" },
  };

  // 價格區間：通常固定（跟你原本一致）
  const PRICE_OPTIONS = [
    { value: "0-99",    label: "$0-99" },
    { value: "100-200", label: "$100-200" },
    { value: "201-500", label: "$201-500" },
    { value: "501-999", label: "$501-999" },
    { value: "1000+",   label: "$1000+" },
  ];

  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

  const buildTypesFromProducts = (list) => {
    const types = [];
    (list || []).forEach(p => {
      const arr = Array.isArray(p.types) ? p.types : (p.type ? [p.type] : []);
      arr.forEach(t => types.push(norm(t)));
    });
    return uniq(types).sort();
  };

  const buildAudiencesFromProducts = (list) => {
    const auds = [];
    (list || []).forEach(p => {
      const arr = Array.isArray(p.audiences) ? p.audiences : [];
      arr.forEach(a => auds.push(norm(a)));
    });
    return uniq(auds).sort();
  };

  const buildBrandsFromProducts = (list) => {
    const brands = [];
    (list || []).forEach(p => {
      const b = (p.brand || "").toString().trim() || "其他";
      brands.push(b);
    });
    return uniq(brands).sort((a,b) => a.localeCompare(b, "zh-Hant"));
  };

  const aHTML = (href, text) => `<a href="${href}">${text}</a>`;

  const renderCol = (colEl, itemsHTML) => {
    if (!colEl) return;
    const box = colEl.querySelector(".mega-links");
    if (!box) return;
    box.innerHTML = itemsHTML || "";
  };

  const renderAllMegas = (products) => {
    // 找到頁面上所有 mega 的四欄容器
    const colsTypes = document.querySelectorAll('.mega-col[data-mega-col="types"]');
    const colsBrands = document.querySelectorAll('.mega-col[data-mega-col="brands"]');
    const colsAuds = document.querySelectorAll('.mega-col[data-mega-col="audiences"]');
    const colsPrices = document.querySelectorAll('.mega-col[data-mega-col="prices"]');

    const types = buildTypesFromProducts(products);
    const brands = buildBrandsFromProducts(products);
    const auds = buildAudiencesFromProducts(products);

    const typeLinks = types.map(code => {
      const label = TYPE_DICT[code]?.label || code; // 試算表有新 code 也能顯示
      return aHTML(`cart.html?type=${encodeURIComponent(code)}`, label);
    }).join("");

    const brandLinks = brands.map(b => {
      return aHTML(`cart.html?brand=${encodeURIComponent(b)}`, b);
    }).join("");

    const audLinks = auds.map(code => {
      const label = AUD_DICT[code]?.label || code;
      return aHTML(`cart.html?audience=${encodeURIComponent(code)}`, label);
    }).join("");

    const priceLinks = PRICE_OPTIONS.map(r => {
      return aHTML(`cart.html?priceRange=${encodeURIComponent(r.value)}`, r.label);
    }).join("");

    colsTypes.forEach(col => renderCol(col, typeLinks));
    colsBrands.forEach(col => renderCol(col, brandLinks));
    colsAuds.forEach(col => renderCol(col, audLinks));
    colsPrices.forEach(col => renderCol(col, priceLinks));
  };

  const boot = async () => {
    if (!window.ProductAPI?.getProducts) {
      console.warn("nav_mega_dynamic: ProductAPI not found. Please include products_api.js first.");
      return;
    }

    try {
      const products = await window.ProductAPI.getProducts({ force: false });
      renderAllMegas(Array.isArray(products) ? products : []);
    } catch (err) {
      console.error("nav_mega_dynamic: load products failed:", err);
      // 失敗就至少把價格塞上去（避免 mega 空白）
      renderAllMegas([]);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();