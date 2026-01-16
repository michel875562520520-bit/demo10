(() => {
  const API_URL =
    "https://script.google.com/macros/s/AKfycbzstJA-D8aUztIHBqTJSVkUSUPA9YSqelWFp-ENfa1e-09sa3q7wIt7HSVWtLowslDa/exec?sheet=products";

  const CACHE_KEY = "PRODUCTS_CACHE_V1";
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分鐘

  const now = () => Date.now();

  const readCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.data)) return null;
      if (!obj.ts || (now() - obj.ts) > CACHE_TTL_MS) return null;
      return obj.data;
    } catch {
      return null;
    }
  };

  const writeCache = (arr) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now(), data: arr }));
    } catch {}
  };

  const extractArray = (json) => {
    // 1) 直接就是 array
    if (Array.isArray(json)) return json;

    // 2) 常見包裝 key
    if (json && typeof json === "object") {
      if (Array.isArray(json.data)) return json.data;
      if (Array.isArray(json.items)) return json.items;
      if (Array.isArray(json.products)) return json.products;
      if (Array.isArray(json.result)) return json.result;
    }

    return [];
  };

  const fetchFresh = async () => {
    const url = API_URL + (API_URL.includes("?") ? "&" : "?") + "_=" + now();
    const res = await fetch(url, { cache: "no-store" });

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const text = await res.text();

    // ✅ 如果不是 JSON，很可能是 HTML（權限/部署問題）
    if (!ct.includes("application/json")) {
      // 嘗試 parse 一次；不行就丟出明確錯誤
      try {
        const json = JSON.parse(text);
        return extractArray(json);
      } catch {
        throw new Error(
          "API 回傳不是 JSON（可能是 Apps Script 權限未開放 / 回傳了 HTML 頁）"
        );
      }
    }

    const json = JSON.parse(text);
    return extractArray(json);
  };

  window.ProductAPI = {
    async getProducts({ force = false } = {}) {
      if (!force) {
        const cached = readCache();
        if (cached) return cached;
      }

      const arr = await fetchFresh();

      // ✅ 重要：不要把「空陣列」寫進快取（避免你現在這種卡死狀態）
      if (Array.isArray(arr) && arr.length > 0) {
        writeCache(arr);
      } else {
        // 如果拿到空的，順手清掉舊 cache
        try { localStorage.removeItem(CACHE_KEY); } catch {}
      }

      return Array.isArray(arr) ? arr : [];
    },
  };
})();