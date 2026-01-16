(() => {
  const navList = document.querySelector(".nav-list");
  const moreNav = document.getElementById("moreNav");
  const toggle  = document.getElementById("more-toggle");
  const overlay = document.querySelector(".more-overlay");

  if (!navList || !moreNav || !toggle) return;

  const closeMore = () => {
    toggle.checked = false;
    // 你原本有鎖背景的 change 監聽，這裡補觸發一次更穩
    toggle.dispatchEvent(new Event("change"));
  };

  // 把 has-mega 轉成抽屜手風琴（讀你原本 mega 四欄）
  const buildMegaDetails = (li) => {
    const link = li.querySelector(":scope > a");
    const mega = li.querySelector(":scope > .mega");
    if (!link) return null;

    const details = document.createElement("details");
    details.className = "more-acc";

    const summary = document.createElement("summary");
    summary.className = "more-row";
    summary.innerHTML = `<span class="more-text">${link.textContent.trim()}</span>`;
    details.appendChild(summary);

    const sub = document.createElement("div");
    sub.className = "more-sub";

    if (mega) {
      mega.querySelectorAll(".mega-col").forEach(col => {
        const titleEl = col.querySelector("h4");
        const links = col.querySelectorAll("a");
        if (!titleEl || !links.length) return;

        const group = document.createElement("div");
        group.className = "more-sub-group";

        const title = document.createElement("div");
        title.className = "more-sub-title";
        title.textContent = titleEl.textContent.trim();
        group.appendChild(title);

        links.forEach(a => {
          const aa = document.createElement("a");
          aa.href = a.getAttribute("href") || "#";
          aa.textContent = a.textContent.trim();
          group.appendChild(aa);
        });

        sub.appendChild(group);
      });
    } else {
      // 沒 mega 就做成單一前往
      const a = document.createElement("a");
      a.href = link.getAttribute("href") || "#";
      a.textContent = "前往";
      sub.appendChild(a);
    }

    details.appendChild(sub);
    return details;
  };

  // 一般 li → 抽屜連結
  const buildSimpleLink = (li) => {
    const a = li.querySelector(":scope > a");
    if (!a) return null;

    const aa = document.createElement("a");
    aa.className = "more-link";
    aa.href = a.getAttribute("href") || "#";
    aa.textContent = a.textContent.trim();
    return aa;
  };

  // 生成抽屜內容：完整 navbar
  const renderDrawer = () => {
    moreNav.innerHTML = "";

    const items = Array.from(navList.querySelectorAll(":scope > li"));
    items.forEach(li => {
      if (li.classList.contains("has-mega")) {
        const d = buildMegaDetails(li);
        if (d) moreNav.appendChild(d);
      } else {
        const a = buildSimpleLink(li);
        if (a) moreNav.appendChild(a);
      }
    });

    bindDrawerLinks();
  };

  // 抽屜內點連結：關抽屜 + hash smooth scroll
  const bindDrawerLinks = () => {
    // hash
    moreNav.querySelectorAll("a[href^='#']").forEach(a => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        closeMore();
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 30);
      });
    });

    // 跳頁（例如 cart.html）
    moreNav.querySelectorAll("a[href]:not([href^='#'])").forEach(a => {
      a.addEventListener("click", () => closeMore(), { passive: true });
    });
  };

  // 點背景關閉（你原本有做，我再補一層保險）
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeMore();
    });
  }

  // ESC 關閉抽屜
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && toggle.checked) closeMore();
  });

  // 初始生成（等你的 nav_mega_dynamic.js 把 mega 內容塞好）
  // 保險：load 後做一次 + 150ms 再做一次
  window.addEventListener("load", () => {
    renderDrawer();
    setTimeout(renderDrawer, 150);
  });
})();