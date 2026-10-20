(() => {
  const miniApp = Boolean(window.Telegram?.WebApp?.initData);
  document.body.classList.toggle("telegram-miniapp", miniApp);

  const total = document.getElementById("productTotal");
  const heroTotal = document.getElementById("heroProofCount");
  const syncTotal = () => {
    if (total && heroTotal) heroTotal.textContent = total.textContent;
  };
  syncTotal();
  if (total && heroTotal) new MutationObserver(syncTotal).observe(total, { childList: true, characterData: true, subtree: true });

  const selectFilter = (filter) => {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      const active = chip.dataset.filter === filter;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-filter-link]").forEach((link) => {
      if (link.closest(".desktop-nav")) {
        if (link.dataset.filterLink === filter) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      }
    });
  };

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.classList.contains("active")));
  });
  document.addEventListener("click", (event) => {
    const chip = event.target.closest(".filter-chip[data-filter]");
    if (chip) {
      selectFilter(chip.dataset.filter);
      return;
    }
    const link = event.target.closest("[data-filter-link]");
    if (link) {
      const chip = [...document.querySelectorAll(".filter-chip[data-filter]")]
        .find((item) => item.dataset.filter === link.dataset.filterLink);
      if (chip) chip.click();
      else selectFilter(link.dataset.filterLink);
    }
  });
})();
