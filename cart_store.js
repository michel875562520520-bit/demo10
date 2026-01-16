// cart_store.js (共用：商品頁 + cart.html + cartbuying.html)
(() => {
  const CART_KEY = "demo_cart_v1";
  let PRODUCTS_CACHE = null;

  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  };

  const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  const fetchProducts = async () => {
  if (PRODUCTS_CACHE) return PRODUCTS_CACHE;

  try {
    // ✅ 改用你的 API
    const data = await window.ProductAPI.getProducts();
    PRODUCTS_CACHE = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("products API load failed", e);
    PRODUCTS_CACHE = [];
  }
  return PRODUCTS_CACHE;
};

  // ✅ 依「商品 + variant」找價格
  const pickPrice = (p, vIndex) => {
    const vs = Array.isArray(p?.variants) ? p.variants : [];
    const v = (Number.isFinite(Number(vIndex)) && vs.length)
      ? vs[Number(vIndex)]
      : null;

    const base = (v?.originalPrice ?? v?.price ?? p?.originalPrice ?? p?.price);
    const sale = (v?.salePrice ?? p?.salePrice);

    // 有特價就用特價
    if (sale != null && base != null && Number(sale) < Number(base)) {
      const sn = Number(sale);
      return Number.isFinite(sn) ? sn : 0;
    }

    // 沒特價就用 base
    if (base != null) {
      const bn = Number(base);
      return Number.isFinite(bn) ? bn : 0;
    }

    // ✅ 完全沒填最外層價錢 → 用 variants 的最低價
    const prices = vs
      .map(x => x?.salePrice ?? x?.originalPrice ?? x?.price)
      .map(Number)
      .filter(n => Number.isFinite(n));

    if (prices.length) return Math.min(...prices);
    return 0;
  };

  // ✅ 用來合併同商品同規格
  const keyOf = (id, vIndex) => `${id}__v:${vIndex ?? ""}`;

  const getCartDetailed = async () => {
    const cart = loadCart();
    const products = await fetchProducts();
    const map = new Map(products.map(p => [p.id, p]));

    return cart
      .map(it => {
        const p = map.get(it.id);
        if (!p) return null;

        const price = pickPrice(p, it.vIndex);
        const qty = Number(it.qty || 0);

        // 顯示用：若有規格就拼在名稱後
        const vs = Array.isArray(p.variants) ? p.variants : [];
        const v = (Number.isFinite(Number(it.vIndex)) && vs.length) ? vs[Number(it.vIndex)] : null;
        const vLabel = it.vLabel || v?.label || v?.name || "";

        const name = vLabel ? `${p.name}（${vLabel}）` : (p.name || it.id);

        return {
          id: it.id,
          vIndex: it.vIndex ?? null,
          vLabel: vLabel || "",
          qty,
          name,
          desc: p.desc || "",
          image: p.image || "",
          price,
          subtotal: price * qty,
        };
      })
      .filter(Boolean);
  };

  const cartCount = () => loadCart().reduce((s, it) => s + (it.qty || 0), 0);

  // ✅ 支援：一次加多個 + 指定規格
  const addToCart = (id, addQty = 1, vIndex = null, vLabel = "") => {
    const cart = loadCart();
    const qty = Math.max(1, Number(addQty) || 1);

    const key = keyOf(id, vIndex);
    const found = cart.find(x => keyOf(x.id, x.vIndex) === key);

    if (found) {
      found.qty += qty;
    } else {
      cart.push({ id, qty, vIndex, vLabel });
    }
    saveCart(cart);
  };

  const setQty = (id, qty, vIndex = null) => {
    const cart = loadCart();
    const key = keyOf(id, vIndex);
    const found = cart.find(x => keyOf(x.id, x.vIndex) === key);
    if (!found) return;

    found.qty = Math.max(0, Number(qty) || 0);
    const next = cart.filter(x => (x.qty || 0) > 0);
    saveCart(next);
  };

  const removeItem = (id, vIndex = null) => {
    const key = keyOf(id, vIndex);
    const cart = loadCart().filter(x => keyOf(x.id, x.vIndex) !== key);
    saveCart(cart);
  };

  window.CartStore = {
    CART_KEY,
    loadCart,
    saveCart,
    fetchProducts,
    getCartDetailed,
    cartCount,
    addToCart,
    setQty,
    removeItem,
  };
})();