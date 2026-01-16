// cart_checkout.js（結帳頁專用）
(() => {
  const tbody = document.getElementById("checkoutTbody");
  const totalEl = document.getElementById("checkoutTotal");
  const placeOrder = document.getElementById("placeOrder");
  const fmt = (n) => "NT$" + Number(n || 0).toLocaleString("zh-Hant-TW");

  if (!tbody || !totalEl) return;

  const render = async () => {
    // ✅ 防呆：CartStore 沒載入就直接顯示錯誤
    if (!window.CartStore) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="padding:26px 8px;color:#ef4444;text-align:center;font-weight:800;">
            CartStore 未載入（請確認 cart_store.js 有正確引入且無錯誤）
          </td>
        </tr>`;
      totalEl.textContent = fmt(0);
      return;
    }

    const items = await window.CartStore.getCartDetailed();

    if (!items.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="padding:26px 8px;color:#6b7280;text-align:center;">
            購物車目前是空的。
          </td>
        </tr>`;
      totalEl.textContent = fmt(0);
      return;
    }

    const total = items.reduce((s, it) => s + (it.subtotal || 0), 0);

    tbody.innerHTML = items.map(it => `
  <tr data-id="${it.id}" data-vindex="${it.vIndex ?? ""}" style="border-bottom:1px solid #e5e7eb;">
    <td style="padding:14px 8px;font-weight:800;">${it.name}</td>
    <td style="padding:14px 8px;font-weight:800;">${it.price ? fmt(it.price) : "請洽門市"}</td>
    <td style="padding:14px 8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="dec" type="button"
          style="width:34px;height:34px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-weight:900;cursor:pointer;">-</button>
        <div style="min-width:26px;text-align:center;font-weight:900;">${it.qty}</div>
        <button class="inc" type="button"
          style="width:34px;height:34px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;font-weight:900;cursor:pointer;">+</button>
      </div>
    </td>
    <td style="padding:14px 8px;font-weight:900;">${fmt(it.subtotal)}</td>
    <td style="padding:14px 8px;">
      <button class="rm" type="button"
        style="border:none;background:transparent;color:#ef4444;font-weight:900;cursor:pointer;">移除</button>
    </td>
  </tr>
`).join("");

    totalEl.textContent = fmt(total);
  };

  tbody?.addEventListener("click", (e) => {
  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;

  const id = tr.getAttribute("data-id");
  const vIndexRaw = tr.getAttribute("data-vindex");
  const vIndex = (vIndexRaw === "" || vIndexRaw === null) ? null : Number(vIndexRaw);

  if (!id) return;

  if (e.target.closest(".inc")) {
    const cart = window.CartStore.loadCart();
    const found = cart.find(x => x.id === id && (x.vIndex ?? null) === vIndex);
    window.CartStore.setQty(id, (found?.qty || 0) + 1, vIndex);
    render();
    return;
  }

  if (e.target.closest(".dec")) {
    const cart = window.CartStore.loadCart();
    const found = cart.find(x => x.id === id && (x.vIndex ?? null) === vIndex);
    window.CartStore.setQty(id, Math.max(0, (found?.qty || 0) - 1), vIndex);
    render();
    return;
  }

  if (e.target.closest(".rm")) {
    window.CartStore.removeItem(id, vIndex);
    render();
    return;
  }
});

  placeOrder?.addEventListener("click", async () => {
    // ✅ 示範：送出後清空
    if (window.CartStore?.CART_KEY) {
      localStorage.removeItem(window.CartStore.CART_KEY);
    }
    alert("送出訂單（示範）✅\n已清空購物車");
    await render();
  });

  // ✅ 重要：script 在 body 底部時，直接跑 render 最穩
  render();
})();