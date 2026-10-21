// ==============================================================================
// MERCHANT DASHBOARD LOGIC (VANILLA JS)
// ==============================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "saas_merchant_token";
  const STORE_KEY = "saas_merchant_store_id";

  // Palette of common kids fashion colors
  const STANDARD_COLORS = [
    { hex: "#d5a76e", uz: "Qumrang" },
    { hex: "#819267", uz: "Zaytunrang" },
    { hex: "#e9e2d2", uz: "Qaymoqrang" },
    { hex: "#2165d5", uz: "Ko‘k" },
    { hex: "#f2d333", uz: "Sariq" },
    { hex: "#edd276", uz: "Oltin rang" },
    { hex: "#efb7ae", uz: "Shaftolirang" },
    { hex: "#d9e6c2", uz: "Yalpizrang" },
    { hex: "#fffefa", uz: "Oq" },
    { hex: "#89a071", uz: "Yashil" },
    { hex: "#c7dcf2", uz: "Och moviy" },
    { hex: "#2361d7", uz: "To‘q moviy" },
    { hex: "#f3d9d5", uz: "Pushti" },
    { hex: "#f3d34d", uz: "Xantal sariq" },
    { hex: "#2c61d6", uz: "Yorqin moviy" },
    { hex: "#111827", uz: "Qora" }
  ];

  // Standard kids sizes
  const STANDARD_SIZES = [
    "92–98 sm · 2–3 yosh",
    "98–104 sm · 3–4 yosh",
    "104–110 sm · 4–5 yosh",
    "110–116 sm · 5–6 yosh",
    "122–128 sm · 7–8 yosh",
    "134–140 sm · 9–10 yosh"
  ];

  function resolveStoreSlug() {
    const urlParam = new URLSearchParams(window.location.search).get("store");
    if (urlParam && urlParam.trim()) return urlParam.trim().toLowerCase();
    const stored = localStorage.getItem(STORE_KEY);
    if (stored && stored.trim()) return stored.trim().toLowerCase();
    const host = window.location.hostname.toLowerCase();
    if (host && !["localhost", "127.0.0.1"].includes(host)) {
      const parts = host.split(".");
      if (parts.length >= 3 && parts[0] !== "www" && !host.endsWith(".vercel.app")) return parts[0];
    }
    return "kids-shop";
  }

  const state = {
    token: sessionStorage.getItem(STORAGE_KEY) || "",
    storeId: resolveStoreSlug(),
    store: null,
    orders: [],
    products: [],
    orderFilter: "all",
    orderSearch: "",
    productSearch: "",
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  // DOM Elements
  const loginScreen = $("#loginScreen");
  const dashboardApp = $("#dashboardApp");
  const merchantLoginForm = $("#merchantLoginForm");
  const loginStoreId = $("#loginStoreId");
  const loginPassword = $("#loginPassword");
  const loginError = $("#loginError");
  const btnSubmitLogin = $("#btnSubmitLogin");
  const toggleLoginPassBtn = $("#toggleLoginPassBtn");
  const merchantLogoutBtn = $("#merchantLogoutBtn");

  // Topbar
  const topStoreName = $("#topStoreName");
  const topStoreSlug = $("#topStoreSlug");
  const topStorePlan = $("#topStorePlan");
  const storeColorDot = $("#storeColorDot");
  const btnViewLiveStore = $("#btnViewLiveStore");

  // Tabs
  const navTabs = $$(".nav-tab");
  const tabOrders = $("#tabOrders");
  const tabProducts = $("#tabProducts");
  const tabSettings = $("#tabSettings");
  const tabAnalytics = $("#tabAnalytics");
  const badgeOrdersCount = $("#badgeOrdersCount");
  const badgeProductsCount = $("#badgeProductsCount");

  // Orders DOM
  const ordersListContainer = $("#ordersListContainer");
  const orderSearchInput = $("#orderSearchInput");
  const orderFilterPills = $$(".filter-pill");

  // Products DOM
  const productsGridContainer = $("#productsGridContainer");
  const productSearchInput = $("#productSearchInput");
  const btnOpenNewProductModal = $("#btnOpenNewProductModal");
  const productModal = $("#productModal");
  const productEditForm = $("#productEditForm");
  const btnCloseProductModal = $("#btnCloseProductModal");
  const btnCancelProductModal = $("#btnCancelProductModal");
  const colorCheckboxesContainer = $("#colorCheckboxesContainer");
  const sizeCheckboxesContainer = $("#sizeCheckboxesContainer");
  const imageFileInput = $("#imageFileInput");
  const btnTriggerUpload = $("#btnTriggerUpload");
  const modalImagePreview = $("#modalImagePreview");
  const prodImageUrl = $("#prodImageUrl");
  const uploadStatusText = $("#uploadStatusText");
  const productFormError = $("#productFormError");
  const btnSaveProductSubmit = $("#btnSaveProductSubmit");

  // Settings DOM
  const storeSettingsForm = $("#storeSettingsForm");
  const settingStoreName = $("#settingStoreName");
  const settingThemeColor = $("#settingThemeColor");
  const settingThemeColorLabel = $("#settingThemeColorLabel");
  const settingCustomDomain = $("#settingCustomDomain");
  const telegramSettingsForm = $("#telegramSettingsForm");
  const settingTelegramChatId = $("#settingTelegramChatId");
  const btnTestTelegram = $("#btnTestTelegram");

  // Analytics DOM
  const kpiTodayRev = $("#kpiTodayRev");
  const kpiTodayOrders = $("#kpiTodayOrders");
  const kpiWeekRev = $("#kpiWeekRev");
  const kpiWeekOrders = $("#kpiWeekOrders");
  const kpiMonthRev = $("#kpiMonthRev");
  const kpiMonthOrders = $("#kpiMonthOrders");
  const kpiTotalRev = $("#kpiTotalRev");
  const kpiTotalOrders = $("#kpiTotalOrders");
  const topProductsTableContainer = $("#topProductsTableContainer");

  const toastContainer = $("#toastContainer");

  // Helpers
  function formatMoney(n) {
    return new Intl.NumberFormat("uz-UZ").format(n || 0) + " so‘m";
  }

  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.25s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  async function apiFetch(endpoint, options = {}) {
    options.headers = options.headers || {};
    options.headers["Content-Type"] = "application/json";
    if (state.token) {
      options.headers["Authorization"] = `Bearer ${state.token}`;
    }
    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      logout();
      throw new Error("Sessiya muddati tugadi. Qaytadan kiring.");
    }
    return res;
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  async function checkSession() {
    loginStoreId.value = state.storeId;
    if (!state.token) {
      showLogin();
      return;
    }
    try {
      const res = await apiFetch("/api/merchant/auth", {
        method: "POST",
        body: JSON.stringify({ action: "verify" }),
      });
      if (res.ok) {
        const data = await res.json();
        state.store = data.store;
        showDashboard();
        loadAllData();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    state.token = "";
    sessionStorage.removeItem(STORAGE_KEY);
    loginScreen.classList.remove("hidden");
    dashboardApp.classList.add("hidden");
  }

  function showDashboard() {
    loginScreen.classList.add("hidden");
    dashboardApp.classList.remove("hidden");
    updateTopbarBranding();
  }

  function updateTopbarBranding() {
    const s = state.store || { name: state.storeId, id: state.storeId, theme_color: "#285ae8", plan: "basic" };
    topStoreName.textContent = s.name || "Do‘kon";
    topStoreSlug.textContent = s.id || state.storeId;
    topStorePlan.textContent = (s.plan || "BASIC").toUpperCase();
    storeColorDot.style.background = s.theme_color || "#285ae8";
    btnViewLiveStore.href = `/?store=${encodeURIComponent(s.id || state.storeId)}`;
  }

  function logout() {
    apiFetch("/api/merchant/auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => {});
    showLogin();
    showToast("Tizimdan chiqildi", "success");
  }

  merchantLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    btnSubmitLogin.disabled = true;
    btnSubmitLogin.querySelector("span").textContent = "Kirilmoqda…";

    const idOrPhone = loginStoreId.value.trim();
    const password = loginPassword.value.trim();

    try {
      const payload = {
        action: "login",
        password,
      };
      if (idOrPhone.startsWith("+") || /^\d+$/.test(idOrPhone)) {
        payload.phone = idOrPhone;
      } else {
        payload.storeId = idOrPhone.toLowerCase();
      }

      const res = await fetch("/api/merchant/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Kirish xatosi");

      state.token = data.token;
      state.store = data.store;
      state.storeId = data.store.id;
      sessionStorage.setItem(STORAGE_KEY, data.token);
      localStorage.setItem(STORE_KEY, data.store.id);

      loginPassword.value = "";
      showDashboard();
      loadAllData();
      showToast(`Xush kelibsiz, ${data.store.name}!`, "success");
    } catch (err) {
      loginError.textContent = err.message;
    } finally {
      btnSubmitLogin.disabled = false;
      btnSubmitLogin.querySelector("span").textContent = "Kabinetga Kirish";
    }
  });

  toggleLoginPassBtn.addEventListener("click", () => {
    const isP = loginPassword.type === "password";
    loginPassword.type = isP ? "text" : "password";
    toggleLoginPassBtn.textContent = isP ? "🔒" : "👁";
  });

  merchantLogoutBtn.addEventListener("click", logout);

  // ==========================================================================
  // TAB NAVIGATION
  // ==========================================================================
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      navTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;

      tabOrders.classList.toggle("hidden", target !== "orders");
      tabProducts.classList.toggle("hidden", target !== "products");
      tabSettings.classList.toggle("hidden", target !== "settings");
      tabAnalytics.classList.toggle("hidden", target !== "analytics");

      if (target === "orders") loadOrders();
      if (target === "products") loadProducts();
      if (target === "settings") loadSettings();
      if (target === "analytics") loadAnalytics();
    });
  });

  function loadAllData() {
    loadOrders();
    loadProducts();
    loadSettings();
    loadAnalytics();
  }

  // ==========================================================================
  // ORDERS MANAGEMENT (TAB 1)
  // ==========================================================================
  async function loadOrders() {
    ordersListContainer.innerHTML = `<div class="loading-state">Buyurtmalar yuklanmoqda…</div>`;
    try {
      const res = await apiFetch("/api/merchant/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Buyurtmalarni yuklab bo‘lmadi");

      state.orders = data.orders || [];
      badgeOrdersCount.textContent = state.orders.length;
      renderOrders();
    } catch (err) {
      ordersListContainer.innerHTML = `<div class="loading-state text-rose">Xatolik: ${err.message}</div>`;
    }
  }

  function getFilteredOrders() {
    let list = [...state.orders];
    const q = state.orderSearch.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (o) =>
          (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
          (o.phone && o.phone.includes(q)) ||
          (o.id && o.id.toLowerCase().includes(q))
      );
    }

    if (state.orderFilter !== "all") {
      list = list.filter((o) => o.status === state.orderFilter);
    }

    return list;
  }

  function renderOrders() {
    const list = getFilteredOrders();
    if (!list.length) {
      ordersListContainer.innerHTML = `<div class="empty-state">Hozircha buyurtmalar mavjud emas.</div>`;
      return;
    }

    ordersListContainer.innerHTML = list
      .map((ord) => {
        const shortId = String(ord.id).slice(0, 8).toUpperCase();
        const dateStr = new Date(ord.created_at).toLocaleString("uz-UZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const statusLabels = {
          new: "Yangi",
          confirmed: "Tasdiqlangan",
          packing: "Yig‘ilmoqda",
          sent: "Yo‘lda",
          completed: "Yetkazilgan",
          cancelled: "Bekor qilingan",
        };

        const items = ord.order_items || [];
        const itemsHtml = items.length
          ? items
              .map(
                (i) => `
            <div class="order-item-row">
              <span class="order-item-desc">• ${esc(i.product_name)} (${esc(i.size || "Standart")}${i.color ? ` - ${esc(i.color)}` : ""}) × ${i.quantity} dona</span>
              <span class="order-item-meta">${formatMoney(Number(i.unit_price) * Number(i.quantity))}</span>
            </div>`
              )
              .join("")
          : `<div style="font-size:12px;color:var(--text-dim)">Tarkib yuklanmadi</div>`;

        return `
        <article class="order-card" data-order-id="${esc(ord.id)}">
          <div class="order-card-top">
            <div>
              <span class="order-id-tag">#${shortId}</span>
              <span class="order-date-tag ml-2">🕒 ${dateStr}</span>
            </div>
            <span class="status-badge status-${ord.status}">${statusLabels[ord.status] || ord.status}</span>
          </div>

          <div class="order-body-grid">
            <div class="customer-info-box">
              <div class="customer-name">👤 ${esc(ord.customer_name)}</div>
              <a href="tel:${esc(ord.phone)}" class="customer-phone-link">📞 ${esc(ord.phone)} (Qo‘ng‘iroq)</a>
              <div class="customer-address">📍 ${esc(ord.region || "")}, ${esc(ord.district || "")}, ${esc(ord.address || "")}</div>
              ${ord.comment ? `<div class="customer-comment">💬 Izoh: ${esc(ord.comment)}</div>` : ""}
            </div>

            <div class="order-items-list">
              ${itemsHtml}
            </div>
          </div>

          <div class="order-card-bottom">
            <div class="order-total-sum">Jami: ${formatMoney(ord.total)} (${ord.payment === "card" ? "Karta" : "Yetkazilganda to‘lov"})</div>
            <div class="order-actions-bar">
              ${
                ord.status === "new"
                  ? `<button class="btn-state" data-set-status="confirmed" data-id="${esc(ord.id)}">✅ Tasdiqlash</button>`
                  : ""
              }
              ${
                ord.status === "confirmed"
                  ? `<button class="btn-state" data-set-status="sent" data-id="${esc(ord.id)}">🚚 Yo‘lga chiqdi</button>`
                  : ""
              }
              ${
                ord.status === "sent"
                  ? `<button class="btn-state" data-set-status="completed" data-id="${esc(ord.id)}">🏁 Yetkazildi</button>`
                  : ""
              }
              ${
                ord.status !== "completed" && ord.status !== "cancelled"
                  ? `<button class="btn-state" style="color:var(--color-rose)" data-set-status="cancelled" data-id="${esc(ord.id)}">❌ Bekor qilish</button>`
                  : ""
              }
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  orderSearchInput.addEventListener("input", (e) => {
    state.orderSearch = e.target.value;
    renderOrders();
  });

  orderFilterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      orderFilterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      state.orderFilter = pill.dataset.orderStatus;
      renderOrders();
    });
  });

  ordersListContainer.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-set-status]");
    if (!btn) return;

    const { setStatus, id } = btn.dataset;
    btn.disabled = true;
    btn.textContent = "…";

    try {
      const res = await apiFetch("/api/merchant/orders", {
        method: "PATCH",
        body: JSON.stringify({ orderId: id, status: setStatus }),
      });
      if (!res.ok) throw new Error("Statusni yangilashda xatolik");

      showToast("Buyurtma holati yangilandi!", "success");
      loadOrders();
      loadAnalytics();
    } catch (err) {
      showToast(err.message, "error");
      btn.disabled = false;
    }
  });

  // ==========================================================================
  // PRODUCTS MANAGEMENT (TAB 2)
  // ==========================================================================
  async function loadProducts() {
    productsGridContainer.innerHTML = `<div class="loading-state">Mahsulotlar yuklanmoqda…</div>`;
    try {
      const res = await apiFetch("/api/merchant/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Mahsulotlarni yuklab bo‘lmadi");

      state.products = data.products || [];
      badgeProductsCount.textContent = state.products.length;
      renderProducts();
    } catch (err) {
      productsGridContainer.innerHTML = `<div class="loading-state text-rose">Xatolik: ${err.message}</div>`;
    }
  }

  function renderProducts() {
    let list = [...state.products];
    const q = state.productSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          (p.name_uz && p.name_uz.toLowerCase().includes(q)) ||
          (p.name_ru && p.name_ru.toLowerCase().includes(q)) ||
          (p.id && p.id.toLowerCase().includes(q))
      );
    }

    if (!list.length) {
      productsGridContainer.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">Mahsulotlar mavjud emas. Yangi mahsulot qo‘shing!</div>`;
      return;
    }

    productsGridContainer.innerHTML = list
      .map((p) => {
        const swatchesHtml = (p.colors || [])
          .map((c) => `<span class="swatch-dot" style="background:${esc(c)}"></span>`)
          .join("");

        const sizesHtml = (p.sizes || [])
          .map((s) => `<span class="size-pill-mini">${esc(s)}</span>`)
          .join("");

        return `
        <article class="prod-dash-card" data-product-id="${esc(p.id)}">
          <div class="prod-img-wrap">
            <img src="${esc(p.image_url || "/images/look-safari.webp")}" alt="${esc(p.name_uz)}" loading="lazy" />
            ${p.badge ? `<span class="prod-badge-tag">${esc(p.badge)}</span>` : ""}
          </div>

          <div class="prod-dash-body">
            <div class="prod-dash-title">${esc(p.name_uz)}</div>
            <div class="prod-dash-price">${formatMoney(p.price)}${p.old_price ? `<s>${formatMoney(p.old_price)}</s>` : ""}</div>
            ${swatchesHtml ? `<div class="prod-swatches-row">${swatchesHtml}</div>` : ""}
            ${sizesHtml ? `<div class="prod-sizes-pills">${sizesHtml}</div>` : ""}
          </div>

          <div class="prod-dash-footer">
            <span class="stock-tag">Zaxira: <b>${p.stock || 0} dona</b></span>
            <div style="display:flex;gap:6px">
              <button class="btn-card-action" data-action="edit-product" data-id="${esc(p.id)}">✏️</button>
              <button class="btn-card-action" data-action="delete-product" data-id="${esc(p.id)}" style="color:var(--color-rose)">🗑</button>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  productSearchInput.addEventListener("input", (e) => {
    state.productSearch = e.target.value;
    renderProducts();
  });

  // Modal: Checkbox lists populate
  function populateCheckboxes(selectedColors = [], selectedSizes = []) {
    colorCheckboxesContainer.innerHTML = STANDARD_COLORS.map(
      (c) => `
      <label class="color-check-item">
        <input type="checkbox" name="colorChoice" value="${c.hex}" ${selectedColors.includes(c.hex) ? "checked" : ""} />
        <span class="swatch-dot" style="background:${c.hex}"></span>
        <span>${c.uz}</span>
      </label>`
    ).join("");

    sizeCheckboxesContainer.innerHTML = STANDARD_SIZES.map(
      (s) => `
      <label class="size-check-item">
        <input type="checkbox" name="sizeChoice" value="${esc(s)}" ${selectedSizes.includes(s) ? "checked" : ""} />
        <span>${esc(s)}</span>
      </label>`
    ).join("");
  }

  btnOpenNewProductModal.addEventListener("click", () => {
    $("#productModalTitle").textContent = "Yangi Mahsulot Qo‘shish";
    productEditForm.reset();
    $("#editProductId").value = "";
    modalImagePreview.src = "/images/look-safari.webp";
    prodImageUrl.value = "/images/look-safari.webp";
    populateCheckboxes(["#2165d5", "#d5a76e"], STANDARD_SIZES.slice(0, 3));
    productModal.classList.remove("hidden");
  });

  function closeModal() {
    productModal.classList.add("hidden");
  }
  btnCloseProductModal.addEventListener("click", closeModal);
  btnCancelProductModal.addEventListener("click", closeModal);

  // Edit / Delete delegate
  productsGridContainer.addEventListener("click", async (e) => {
    const editBtn = e.target.closest("[data-action='edit-product']");
    if (editBtn) {
      const p = state.products.find((x) => x.id === editBtn.dataset.id);
      if (!p) return;

      $("#productModalTitle").textContent = "Mahsulotni Tahrirlash";
      $("#editProductId").value = p.id;
      $("#prodNameUz").value = p.name_uz || "";
      $("#prodNameRu").value = p.name_ru || "";
      $("#prodPrice").value = p.price || 0;
      $("#prodOldPrice").value = p.old_price || "";
      $("#prodStock").value = p.stock || 0;
      $("#prodCategory").value = p.category || "boys";
      $("#prodType").value = p.type || "sets";
      $("#prodBadge").value = p.badge || "";
      modalImagePreview.src = p.image_url || "/images/look-safari.webp";
      prodImageUrl.value = p.image_url || "/images/look-safari.webp";

      populateCheckboxes(p.colors || [], p.sizes || []);
      productModal.classList.remove("hidden");
      return;
    }

    const delBtn = e.target.closest("[data-action='delete-product']");
    if (delBtn) {
      const p = state.products.find((x) => x.id === delBtn.dataset.id);
      if (!p) return;
      if (!confirm(`"${p.name_uz}" mahsulotini rostdan ham o‘chirmoqchimisiz?`)) return;

      try {
        const res = await apiFetch(`/api/merchant/products?id=${encodeURIComponent(p.id)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("O‘chirishda xatolik");
        showToast("Mahsulot o‘chirildi!", "success");
        loadProducts();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  });

  // Image Upload with WebP Canvas Compression
  btnTriggerUpload.addEventListener("click", () => imageFileInput.click());
  imageFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadStatusText.textContent = "Rasm WebP ga siqilmoqda…";
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      const canvas = document.createElement("canvas");
      const maxDim = 1200;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      const webpDataUrl = canvas.toDataURL("image/webp", 0.85);
      modalImagePreview.src = webpDataUrl;
      prodImageUrl.value = webpDataUrl;
      uploadStatusText.textContent = `Siqildi: ${Math.round(webpDataUrl.length / 1024)} KB (WebP). Saqlashga tayyor.`;
    } catch {
      uploadStatusText.textContent = "Rasmni qayta ishlashda xatolik yuz berdi.";
    }
  });

  // Submit Product Form
  productEditForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    productFormError.textContent = "";
    btnSaveProductSubmit.disabled = true;

    const editId = $("#editProductId").value.trim();
    const colors = $$("input[name='colorChoice']:checked").map((c) => c.value);
    const sizes = $$("input[name='sizeChoice']:checked").map((s) => s.value);

    const payload = {
      id: editId || undefined,
      name_uz: $("#prodNameUz").value.trim(),
      name_ru: $("#prodNameRu").value.trim(),
      price: Number($("#prodPrice").value) || 0,
      old_price: $("#prodOldPrice").value ? Number($("#prodOldPrice").value) : null,
      stock: Number($("#prodStock").value) || 0,
      category: $("#prodCategory").value,
      type: $("#prodType").value,
      badge: $("#prodBadge").value.trim(),
      image_url: prodImageUrl.value.trim(),
      colors,
      sizes: sizes.length ? sizes : STANDARD_SIZES.slice(0, 3),
    };

    try {
      const method = editId ? "PATCH" : "POST";
      const res = await apiFetch("/api/merchant/products", {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Saqlashda xatolik");

      closeModal();
      showToast(editId ? "Mahsulot yangilandi!" : "Yangi mahsulot qo‘shildi!", "success");
      loadProducts();
    } catch (err) {
      productFormError.textContent = err.message;
    } finally {
      btnSaveProductSubmit.disabled = false;
    }
  });

  // ==========================================================================
  // SETTINGS & TELEGRAM INTEGRATION (TAB 3)
  // ==========================================================================
  async function loadSettings() {
    try {
      const res = await apiFetch("/api/merchant/settings");
      const data = await res.json();
      if (!res.ok) return;

      const s = data.store;
      state.store = s;
      updateTopbarBranding();

      settingStoreName.value = s.name || "";
      settingThemeColor.value = s.theme_color || "#285ae8";
      settingThemeColorLabel.textContent = s.theme_color || "#285ae8";
      settingCustomDomain.value = s.custom_domain || "";
      settingTelegramChatId.value = s.telegram_chat_id || "";
    } catch {}
  }

  settingThemeColor.addEventListener("input", (e) => {
    settingThemeColorLabel.textContent = e.target.value;
  });

  storeSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#btnSaveStoreSettings").disabled = true;
    try {
      const res = await apiFetch("/api/merchant/settings", {
        method: "PATCH",
        body: JSON.stringify({
          name: settingStoreName.value.trim(),
          theme_color: settingThemeColor.value,
        }),
      });
      if (!res.ok) throw new Error("Saqlashda xatolik");
      showToast("Do‘kon sozlamalari saqlandi!", "success");
      loadSettings();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      $("#btnSaveStoreSettings").disabled = false;
    }
  });

  telegramSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#btnSaveTelegramSettings").disabled = true;
    try {
      const res = await apiFetch("/api/merchant/settings", {
        method: "PATCH",
        body: JSON.stringify({
          telegram_chat_id: settingTelegramChatId.value.trim(),
        }),
      });
      if (!res.ok) throw new Error("Saqlashda xatolik");
      showToast("Telegram guruh ID saqlandi!", "success");
      loadSettings();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      $("#btnSaveTelegramSettings").disabled = false;
    }
  });

  btnTestTelegram.addEventListener("click", async () => {
    btnTestTelegram.disabled = true;
    btnTestTelegram.textContent = "Xabar yuborilmoqda…";
    try {
      const res = await apiFetch("/api/merchant/settings", {
        method: "POST",
        body: JSON.stringify({ action: "test_telegram" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xabar yuborilmadi");
      showToast("✅ Telegram guruhingizga sinov xabari yuborildi!", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      btnTestTelegram.disabled = false;
      btnTestTelegram.textContent = "⚡ Sinov Xabari Yuborish";
    }
  });

  // ==========================================================================
  // SALES ANALYTICS (TAB 4)
  // ==========================================================================
  async function loadAnalytics() {
    try {
      const res = await apiFetch("/api/merchant/analytics");
      const data = await res.json();
      if (!res.ok) return;

      const s = data.stats;
      kpiTodayRev.textContent = formatMoney(s.today?.revenue || 0);
      kpiTodayOrders.textContent = `${s.today?.orders || 0} ta buyurtma`;

      kpiWeekRev.textContent = formatMoney(s.week?.revenue || 0);
      kpiWeekOrders.textContent = `${s.week?.orders || 0} ta buyurtma`;

      kpiMonthRev.textContent = formatMoney(s.month?.revenue || 0);
      kpiMonthOrders.textContent = `${s.month?.orders || 0} ta buyurtma`;

      kpiTotalRev.textContent = formatMoney(s.total?.revenue || 0);
      kpiTotalOrders.textContent = `${s.total?.orders || 0} ta buyurtma`;

      const topProducts = s.topProducts || [];
      if (!topProducts.length) {
        topProductsTableContainer.innerHTML = `<div class="empty-state">Hali sotilgan mahsulotlar mavjud emas.</div>`;
      } else {
        topProductsTableContainer.innerHTML = topProducts
          .map(
            (item, index) => `
          <div class="top-prod-row">
            <div>
              <span style="font-weight:700;color:var(--text-dim);margin-right:8px">#${index + 1}</span>
              <span class="top-prod-name">${esc(item.name)}</span>
            </div>
            <div class="top-prod-stat">${item.qty} dona sotildi (${formatMoney(item.revenue)})</div>
          </div>`
          )
          .join("");
      }
    } catch {}
  }

  function esc(val) {
    return String(val || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Escape modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Init
  checkSession();
})();
