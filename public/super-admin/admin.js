// ==============================================================================
// SUPER ADMIN DASHBOARD LOGIC (VANILLA JS)
// ==============================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "saas_super_admin_token";

  const state = {
    token: sessionStorage.getItem(STORAGE_KEY) || "",
    stores: [],
    stats: {},
    filter: "all",
    search: "",
  };

  // DOM Elements
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const loginScreen = $("#loginScreen");
  const dashboardApp = $("#dashboardApp");
  const loginForm = $("#loginForm");
  const adminPassword = $("#adminPassword");
  const loginError = $("#loginError");
  const loginSubmitBtn = $("#loginSubmitBtn");
  const togglePasswordBtn = $("#togglePasswordBtn");
  const logoutBtn = $("#logoutBtn");

  // KPI Elements
  const kpiTotalStores = $("#kpiTotalStores");
  const kpiStoresSub = $("#kpiStoresSub");
  const kpiActiveStores = $("#kpiActiveStores");
  const kpiTotalOrders = $("#kpiTotalOrders");
  const kpiTotalRevenue = $("#kpiTotalRevenue");
  const kpiEstimatedMRR = $("#kpiEstimatedMRR");
  const kpiExpiringSub = $("#kpiExpiringSub");

  // Table
  const storesTableBody = $("#storesTableBody");
  const searchInput = $("#searchInput");
  const filterBtns = $$(".filter-btn");

  // Modals
  const newStoreModal = $("#newStoreModal");
  const newStoreForm = $("#newStoreForm");
  const openNewStoreModalBtn = $("#openNewStoreModalBtn");
  const storeNameInput = $("#storeName");
  const storeSlugInput = $("#storeSlug");
  const btnGenPassword = $("#btnGenPassword");
  const ownerPasswordInput = $("#ownerPassword");
  const themeColorInput = $("#themeColor");
  const themeColorLabel = $("#themeColorLabel");
  const newStoreError = $("#newStoreError");
  const btnSubmitNewStore = $("#btnSubmitNewStore");

  const successStoreModal = $("#successStoreModal");
  const viewLinksModal = $("#viewLinksModal");
  const toastContainer = $("#toastContainer");

  // Helper: Format Money
  function formatMoney(amount) {
    return new Intl.NumberFormat("uz-UZ").format(amount || 0) + " so‘m";
  }

  // Toast Notification
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

  // API Client with Auth Header
  async function apiFetch(endpoint, options = {}) {
    options.headers = options.headers || {};
    options.headers["Content-Type"] = "application/json";
    if (state.token) {
      options.headers["Authorization"] = `Bearer ${state.token}`;
    }
    const res = await fetch(endpoint, options);
    if (res.status === 401) {
      // Session expired
      logout();
      throw new Error("Sessiya muddati tugadi. Qaytadan kiring.");
    }
    return res;
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  async function checkSession() {
    if (!state.token) {
      showLogin();
      return;
    }
    try {
      const res = await apiFetch("/api/super-admin/auth", {
        method: "POST",
        body: JSON.stringify({ action: "verify" }),
      });
      if (res.ok) {
        showDashboard();
        loadDashboardData();
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
  }

  function logout() {
    apiFetch("/api/super-admin/auth", {
      method: "POST",
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => {});
    showLogin();
    showToast("Tizimdan chiqildi", "success");
  }

  // Handle Login Submit
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.querySelector("span").textContent = "Kirilmoqda…";

    const password = adminPassword.value.trim();

    try {
      const res = await fetch("/api/super-admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Kirish xatosi");

      state.token = data.token;
      sessionStorage.setItem(STORAGE_KEY, data.token);
      adminPassword.value = "";
      showDashboard();
      loadDashboardData();
      showToast("Xush kelibsiz, Super Admin!", "success");
    } catch (err) {
      loginError.textContent =
        err.message === "invalid_credentials"
          ? "Maxfiy kalit noto‘g‘ri kiritildi!"
          : err.message === "rate_limited"
          ? "Urinishlar limiti oshdi. 10 daqiqadan so‘ng urinib ko‘ring."
          : err.message;
    } finally {
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.querySelector("span").textContent = "Tizimga Kirish";
    }
  });

  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = adminPassword.type === "password";
    adminPassword.type = isPassword ? "text" : "password";
    togglePasswordBtn.textContent = isPassword ? "🔒" : "👁";
  });

  logoutBtn.addEventListener("click", logout);

  // ==========================================================================
  // DASHBOARD DATA LOADER
  // ==========================================================================
  async function loadDashboardData() {
    storesTableBody.innerHTML = `<tr><td colspan="6" class="loading-state">Ma’lumotlar bazadan yuklanmoqda…</td></tr>`;

    try {
      const res = await apiFetch("/api/super-admin/stores");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Yuklashda xatolik");

      state.stores = data.stores || [];
      state.stats = data.stats || {};

      renderKPIs();
      renderStoresTable();
    } catch (err) {
      storesTableBody.innerHTML = `<tr><td colspan="6" class="loading-state text-rose">Xatolik: ${err.message}</td></tr>`;
      showToast(err.message, "error");
    }
  }

  function renderKPIs() {
    const s = state.stats;
    kpiTotalStores.textContent = s.totalStores || 0;
    kpiStoresSub.textContent = `${s.activeStores || 0} faol · ${s.suspendedStores || 0} to‘xtatilgan`;
    kpiActiveStores.textContent = s.activeStores || 0;
    kpiTotalOrders.textContent = (s.totalOrders || 0).toLocaleString();
    kpiTotalRevenue.textContent = `Tushum: ${formatMoney(s.totalPlatformRevenue || 0)}`;
    kpiEstimatedMRR.textContent = formatMoney(s.estimatedMRR || 0);
    kpiExpiringSub.textContent = `${s.expiringSoon || 0} ta do‘kon muddati yaqin`;
  }

  // ==========================================================================
  // STORES TABLE RENDER
  // ==========================================================================
  function getFilteredStores() {
    let list = [...state.stores];
    const q = state.search.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.id && s.id.toLowerCase().includes(q)) ||
          (s.owner_phone && s.owner_phone.includes(q))
      );
    }

    if (state.filter === "active") list = list.filter((s) => s.status === "active");
    if (state.filter === "suspended") list = list.filter((s) => s.status === "suspended");
    if (state.filter === "expiring") list = list.filter((s) => s.days_left > 0 && s.days_left <= 7);

    return list;
  }

  function renderStoresTable() {
    const list = getFilteredStores();
    if (!list.length) {
      storesTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Hech qanday do‘kon topilmadi.</td></tr>`;
      return;
    }

    storesTableBody.innerHTML = list
      .map((store) => {
        const isActive = store.status === "active";
        const daysLeftClass =
          store.days_left <= 0 ? "danger" : store.days_left <= 5 ? "warning" : "";
        const daysText =
          store.days_left <= 0
            ? "Muddati tugagan!"
            : `${store.days_left} kun qoldi`;

        return `
        <tr data-store-id="${esc(store.id)}">
          <td>
            <div class="store-meta-cell">
              <span class="store-color-dot" style="background:${esc(store.theme_color)}"></span>
              <div>
                <div class="store-cell-name">${esc(store.name)}</div>
                <div class="store-cell-slug">${esc(store.id)}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-weight:600">${esc(store.owner_phone || "—")}</div>
            <div style="font-size:11px;color:var(--text-dim)">ID: ${esc(store.telegram_chat_id || "Ulanmagan")}</div>
          </td>
          <td>
            <span class="plan-badge plan-${esc(store.plan)}">${esc(store.plan.toUpperCase())}</span>
            <div class="days-left-text ${daysLeftClass}">${daysText}</div>
          </td>
          <td>
            <div style="font-weight:700">${store.order_count || 0} ta</div>
            <div style="font-size:11px;color:var(--text-dim)">${formatMoney(store.total_revenue || 0)}</div>
          </td>
          <td>
            <span class="pill ${isActive ? "pill-active" : "pill-suspended"}">
              ${isActive ? "Faol" : "To‘xtatilgan"}
            </span>
          </td>
          <td class="text-right">
            <div class="action-buttons-group">
              <button class="btn-icon-action" data-action="view-links" data-id="${esc(store.id)}" title="Havolalarni ko‘rish">🔗</button>
              <button class="btn-icon-action success" data-action="extend-plan" data-id="${esc(store.id)}" title="+30 kun muddat qo‘shish">⏳ +30 kun</button>
              <button class="btn-icon-action ${isActive ? "danger" : "success"}" data-action="toggle-status" data-id="${esc(store.id)}" data-status="${store.status}">
                ${isActive ? "🛑 Bloklash" : "🟢 Yoqish"}
              </button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  // Search and Filter Listeners
  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    renderStoresTable();
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.filter = btn.dataset.filter;
      renderStoresTable();
    });
  });

  // Table Action Buttons Delegate
  storesTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const { action, id, status } = btn.dataset;
    const store = state.stores.find((s) => s.id === id);
    if (!store) return;

    // 1. Havolalarni ko'rish
    if (action === "view-links") {
      openViewLinksModal(store);
      return;
    }

    // 2. Muddatni +30 kun uzaytirish
    if (action === "extend-plan") {
      if (!confirm(`"${store.name}" do‘koni muddatini +30 kunga uzaytirmoqchimisiz?`)) return;
      btn.disabled = true;
      btn.textContent = "…";
      try {
        const res = await apiFetch("/api/super-admin/stores", {
          method: "PATCH",
          body: JSON.stringify({ action: "extend_plan", storeId: id, days: 30 }),
        });
        if (!res.ok) throw new Error("Muddatni uzaytirishda xatolik");
        showToast(`"${store.name}" obunasi +30 kunga uzaytirildi!`, "success");
        loadDashboardData();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
        btn.textContent = "⏳ +30 kun";
      }
      return;
    }

    // 3. Statusni almashtirish (Faol / Bloklash)
    if (action === "toggle-status") {
      const nextStatus = status === "active" ? "suspended" : "active";
      const promptText =
        nextStatus === "suspended"
          ? `"${store.name}" do‘konini BLOKLAMOQCHIMISIZ?\nBloklansa, uning vitrinasi mijozlarga ochilmaydi.`
          : `"${store.name}" do‘konini qayta FAOLLASHTIRMOQCHIMISIZ?`;

      if (!confirm(promptText)) return;
      btn.disabled = true;
      btn.textContent = "…";
      try {
        const res = await apiFetch("/api/super-admin/stores", {
          method: "PATCH",
          body: JSON.stringify({ action: "toggle_status", storeId: id, status: nextStatus }),
        });
        if (!res.ok) throw new Error("Statusni yangilashda xatolik");
        showToast(
          nextStatus === "active" ? `"${store.name}" faollashtirildi!` : `"${store.name}" bloklandi!`,
          nextStatus === "active" ? "success" : "error"
        );
        loadDashboardData();
      } catch (err) {
        showToast(err.message, "error");
        btn.disabled = false;
      }
    }
  });

  // ==========================================================================
  // NEW STORE MODAL & SLUG LOGIC
  // ==========================================================================
  openNewStoreModalBtn.addEventListener("click", () => {
    newStoreError.textContent = "";
    newStoreForm.reset();
    themeColorInput.value = "#285ae8";
    themeColorLabel.textContent = "#285ae8";
    generatePassword();
    newStoreModal.classList.remove("hidden");
    storeNameInput.focus();
  });

  // Auto-slug generator from store name
  storeNameInput.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    // Only auto-fill if user hasn't heavily customized slug manually
    const translit = val
      .replace(/o‘|o'/g, "o")
      .replace(/g‘|g'/g, "g")
      .replace(/sh/g, "sh")
      .replace(/ch/g, "ch")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    storeSlugInput.value = translit.slice(0, 40);
  });

  themeColorInput.addEventListener("input", (e) => {
    themeColorLabel.textContent = e.target.value;
  });

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    ownerPasswordInput.value = pass;
  }
  btnGenPassword.addEventListener("click", generatePassword);

  // Submit New Store
  newStoreForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    newStoreError.textContent = "";
    btnSubmitNewStore.disabled = true;
    btnSubmitNewStore.querySelector("span").textContent = "Yaratilmoqda…";

    const payload = {
      name: storeNameInput.value.trim(),
      id: storeSlugInput.value.trim().toLowerCase(),
      owner_phone: $("#ownerPhone").value.trim(),
      owner_password: ownerPasswordInput.value.trim(),
      telegram_chat_id: $("#telegramChatId").value.trim(),
      plan: $("#storePlan").value,
      days: Number($("#storeDays").value) || 30,
      theme_color: themeColorInput.value,
    };

    try {
      const res = await apiFetch("/api/super-admin/stores", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Yaratishda xatolik yuz berdi");

      // Success! Close form modal, open success links modal
      newStoreModal.classList.add("hidden");
      openSuccessModal(data);
      loadDashboardData();
      showToast(`"${payload.name}" do‘koni muvaffaqiyatli ochildi!`, "success");
    } catch (err) {
      newStoreError.textContent = err.message;
    } finally {
      btnSubmitNewStore.disabled = false;
      btnSubmitNewStore.querySelector("span").textContent = "Do‘konni Ochish";
    }
  });

  // Success Modal
  function openSuccessModal(data) {
    const s = data.store;
    const links = data.links;
    const creds = data.credentials;

    $("#successStoreTitle").textContent = `${s.name} do‘koni tayyor!`;
    $("#linkWeb").textContent = links.web;
    $("#linkTg").textContent = links.telegram;
    $("#linkAdmin").textContent = links.admin;

    const preparedMsg = `🎉 Assalomu alaykum! Do‘koningiz muvaffaqiyatli ishga tushirildi:

🏪 Do‘kon: ${s.name}
🌐 Veb-sayt: ${links.web}
📱 Telegram Mini App: ${links.telegram}

🔐 Boshqaruv Admin Paneli:
Havola: ${links.admin}
Login (Telefon): ${creds.login}
Parol: ${creds.password}

Barcha tushgan buyurtmalar avtomatik Telegram guruhingizga boradi. Hayrli savdolar!`;

    $("#preparedFullMsgText").textContent = preparedMsg;
    successStoreModal.classList.remove("hidden");
  }

  // View Links Modal
  function openViewLinksModal(store) {
    $("#viewLinksTitle").textContent = store.name;
    $("#viewLinksSlug").textContent = `Identifikator: ${store.id}`;
    $("#viewLinkWeb").textContent = store.links.web;
    $("#viewLinkTg").textContent = store.links.telegram;
    $("#viewLinkAdmin").textContent = store.links.admin;
    viewLinksModal.classList.remove("hidden");
  }

  // Copy buttons
  document.addEventListener("click", (e) => {
    const copyBtn = e.target.closest("[data-copy-target]");
    if (copyBtn) {
      const targetId = copyBtn.dataset.copyTarget;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        navigator.clipboard.writeText(targetEl.textContent.trim());
        copyBtn.textContent = "Nusxalandi! ✓";
        setTimeout(() => (copyBtn.textContent = "Nusxalash"), 2000);
        showToast("Havola buferga nusxalandi!", "success");
      }
      return;
    }

    if (e.target.id === "btnCopyFullTelegramMsg") {
      const text = $("#preparedFullMsgText").textContent;
      navigator.clipboard.writeText(text);
      e.target.textContent = "Nusxalandi! ✓";
      setTimeout(() => (e.target.textContent = "Barchasini Nusxalash"), 2000);
      showToast("Tadbirkor xabarnomasi nusxalandi!", "success");
      return;
    }

    // Close modals
    const closeBtn = e.target.closest("[data-close-modal]");
    if (closeBtn) {
      const modalId = closeBtn.dataset.closeModal;
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add("hidden");
    }
  });

  // Close modals on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      $$(".modal-backdrop").forEach((m) => m.classList.add("hidden"));
    }
  });

  function esc(val) {
    return String(val || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Init
  checkSession();
})();
