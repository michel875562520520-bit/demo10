// cart_page.js（商品列表頁專用）
(() => {
  const $ = (s) => document.querySelector(s);

  const badge = $("#cartBadge");
  const cartLink = $("#cartLink");     // 你右上角 🛒 的 a
  const mask = $("#mask");
  const drawer = $("#drawer");
  const closeCart = $("#closeCart");
  const cartList = $("#cartList");
  const totalPrice = $("#totalPrice");
  const checkoutBtn = $("#checkoutBtn");

  const fmt = (n) => "NT$" + Number(n || 0).toLocaleString("zh-Hant-TW");

  const updateBadge = () => {
    if (!badge) return;
    const count = window.CartStore.cartCount();
    badge.textContent = String(count);
    badge.style.display = count ? "inline-flex" : "none";
  };

  const openDrawer = () => {
    if (!mask || !drawer) return;
    mask.classList.remove("hidden");
    drawer.classList.remove("hidden");
    document.body.classList.add("cart-open");
    renderDrawer();
  };

  const closeDrawer = () => {
    if (!mask || !drawer) return;
    mask.classList.add("hidden");
    drawer.classList.add("hidden");
    document.body.classList.remove("cart-open");
  };

  const renderDrawer = async () => {
    if (!cartList || !totalPrice) return;
    const items = await window.CartStore.getCartDetailed();

    if (!items.length) {
      cartList.innerHTML = `<div class="empty">購物車目前是空的。</div>`;
      totalPrice.textContent = fmt(0);
      updateBadge();
      return;
    }

    const total = items.reduce((s, it) => s + it.subtotal, 0);

    cartList.innerHTML = items.map(it => `
      <div class="cart-item" data-id="${it.id}" data-vidx="${it.vIndex ?? ''}">
        <div>
          <div class="title">${it.name}</div>
          <div class="sub">${it.price ? fmt(it.price) : "請洽門市"}</div>

          <div class="qty">
            <button type="button" class="qty-dec">-</button>
            <div class="n">${it.qty}</div>
            <button type="button" class="qty-inc">+</button>
          </div>

          <div class="remove" role="button" tabindex="0">移除</div>
        </div>

        <div class="price">${fmt(it.subtotal)}</div>
      </div>
    `).join("");

    totalPrice.textContent = fmt(total);
    updateBadge();
  };

  // ✅ 1) 加入購物車（支援 data-add / data-id + qty + variant）
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-cart-btn");
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const id = btn.getAttribute("data-add") || btn.getAttribute("data-id");
  if (!id) return;

  // ✅ 讀 modal 裡面的數量（你有用 $add.dataset.qty）
  const qty = Math.max(1, Number(btn.dataset.qty || 1));

  // ✅ 讀你 modal 塞的 variant
  const vIndex = (btn.dataset.variant === "" || btn.dataset.variant == null)
    ? null
    : Number(btn.dataset.variant);

  const vLabel = btn.dataset.vlabel || "";

  window.CartStore.addToCart(id, qty, vIndex, vLabel);
  updateBadge();

  openDrawer();
}, true);

  // ✅ 2) 點右上角 🛒 打開 drawer（避免跳頁 cart.html）
  if (cartLink) {
    cartLink.addEventListener("click", (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  // ✅ 3) 關閉 drawer
  closeCart?.addEventListener("click", closeDrawer);
  mask?.addEventListener("click", closeDrawer);

  // ✅ 4) drawer 內 + / - / 移除（要帶 vIndex，避免同 id 不同規格打架）
cartList?.addEventListener("click", (e) => {
  const row = e.target.closest(".cart-item");
  if (!row) return;

  const id = row.getAttribute("data-id");
  if (!id) return;

  // ✅ 讀規格索引（可能是 '' → null）
  const vIndexRaw = row.getAttribute("data-vidx");
  const vIndex = (vIndexRaw === "" || vIndexRaw == null) ? null : Number(vIndexRaw);

  const cart = window.CartStore.loadCart();
  const found = cart.find(x => x.id === id && (x.vIndex ?? null) === vIndex);
  const currentQty = found?.qty || 0;

  if (e.target.closest(".qty-inc")) {
    window.CartStore.setQty(id, currentQty + 1, vIndex);
    renderDrawer();
    return;
  }

  if (e.target.closest(".qty-dec")) {
    window.CartStore.setQty(id, Math.max(0, currentQty - 1), vIndex);
    renderDrawer();
    return;
  }

  if (e.target.closest(".remove")) {
    window.CartStore.removeItem(id, vIndex);
    renderDrawer();
    return;
  }
});

  // ✅ 5) 結帳按鈕 → 跳 cart.html
  checkoutBtn?.addEventListener("click", () => {
    location.href = "cartbuying.html";
  });

  // 初始
  document.addEventListener("DOMContentLoaded", updateBadge);
  window.addEventListener("storage", updateBadge);
})();
// ✅ 活動彈跳：同一天只彈一次（可關閉這功能）
const PROMO_KEY = "promo_seen_ymd";

const ymd = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const promoModal = document.querySelector("#promoModal");

const openPromo = () => {
  if (!promoModal) return;
  promoModal.classList.remove("hidden");
  promoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("promo-open");
};

const closePromo = () => {
  if (!promoModal) return;
  promoModal.classList.add("hidden");
  promoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("promo-open");
};

// ✅ 點遮罩 / X 關閉（靠 data-close）
promoModal?.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) {
    closePromo();
  }
});

// ✅ ESC 關閉
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && promoModal && !promoModal.classList.contains("hidden")) {
    closePromo();
  }
});

// ✅ 進頁面自動彈出
document.addEventListener("DOMContentLoaded", () => {
  if (!promoModal) return;

  // 只彈一次：同一天彈過就不彈
  const today = ymd();
  const seen = localStorage.getItem(PROMO_KEY);

  if (seen !== today) {
    openPromo();
    localStorage.setItem(PROMO_KEY, today);
  }
});

