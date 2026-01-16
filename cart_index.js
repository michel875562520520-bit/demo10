// cart_index.js - bind "加入購物車" buttons on index page
(() => {
  const CART_KEY = "demo_cart_v1"; // keep same key as cart.html
  let PRODUCTS = null;

  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch(e){ return []; }
  };
  const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  const updateBadge = () => {
    const badge = document.getElementById("cartBadge");
    if(!badge) return;
    const cart = loadCart();
    const count = cart.reduce((sum, it) => sum + (it.qty || 0), 0);
    badge.textContent = String(count);
    badge.style.display = count ? "inline-flex" : "none";
  };

  // ✅ 改成抓試算表（ProductAPI）
  const ensureProducts = async () => {
    if(PRODUCTS) return PRODUCTS;

    try{
      if (window.ProductAPI?.getProducts) {
        PRODUCTS = await window.ProductAPI.getProducts();
      } else {
        throw new Error("ProductAPI not found");
      }
    }catch(e){
      console.warn("ProductAPI 讀取失敗，最後才 fallback products.json（建議不要再用）", e);
      try{
        const res = await fetch("products.json", { cache: "no-store" });
        PRODUCTS = await res.json();
      }catch(err){
        PRODUCTS = [];
      }
    }

    return PRODUCTS;
  };

  const addToCartById = async (id) => {
    const products = await ensureProducts();
    const p = (products || []).find(x => String(x.id ?? x.ID ?? x.sku ?? "") === String(id));

    if(!p){
      alert("找不到商品資料（請確認試算表是否有此 id）");
      return;
    }

    const cart = loadCart();
    const found = cart.find(x => String(x.id) === String(id));
    if(found) found.qty += 1;
    else cart.push({ id, qty: 1 });

    saveCart(cart);
    updateBadge();
  };

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-cart-btn");
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.getAttribute("data-id");
    if(id) addToCartById(id);
  }, true);

  document.addEventListener("DOMContentLoaded", updateBadge);
  window.addEventListener("storage", updateBadge);
})();