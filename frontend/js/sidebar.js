/**
 * sidebar.js — Sidebar collapse/expand and mobile overlay logic.
 * Also handles the user-dropdown in the topbar and logout.
 *
 * Expected DOM:
 *   .sidebar           — the sidebar element
 *   .main-area         — the main content wrapper
 *   .sidebar__collapse-btn  — desktop collapse toggle inside sidebar header
 *   .topbar__toggle         — mobile hamburger button in topbar
 *   #sidebar-overlay        — semi-transparent overlay for mobile (optional)
 *   .topbar__user           — clickable user area
 *   #user-dropdown          — dropdown menu
 *   [data-logout]           — logout button/link
 */

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const mainArea = document.querySelector(".main-area");
  const collapseBtn = document.querySelector(".sidebar__collapse-btn");
  const mobileToggle = document.querySelector(".topbar__toggle");
  const overlay = document.getElementById("sidebar-overlay");
  const userMenu = document.querySelector(".topbar__user");
  const dropdown = document.getElementById("user-dropdown");
  const logoutBtn = document.querySelector("[data-logout]");

  /* ── Collapse / expand (desktop) ──────────────────────────────── */
  function toggleCollapse() {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    mainArea && mainArea.classList.toggle("sidebar-collapsed", isCollapsed);
    // Persist across page loads
    localStorage.setItem("sidebarCollapsed", isCollapsed ? "1" : "0");
  }

  // Restore persisted state
  if (localStorage.getItem("sidebarCollapsed") === "1") {
    sidebar && sidebar.classList.add("collapsed");
    mainArea && mainArea.classList.add("sidebar-collapsed");
  }

  collapseBtn && collapseBtn.addEventListener("click", toggleCollapse);

  /* ── Mobile open / close ─────────────────────────────────────── */
  function openMobileSidebar() {
    sidebar && sidebar.classList.add("open");
    overlay && overlay.classList.add("visible");
  }

  function closeMobileSidebar() {
    sidebar && sidebar.classList.remove("open");
    overlay && overlay.classList.remove("visible");
  }

  mobileToggle && mobileToggle.addEventListener("click", openMobileSidebar);
  overlay && overlay.addEventListener("click", closeMobileSidebar);

  // Close mobile sidebar when a nav link is clicked
  document.querySelectorAll(".nav-item[href]").forEach((link) => {
    link.addEventListener("click", closeMobileSidebar);
  });

  /* ── User dropdown ───────────────────────────────────────────── */
  if (userMenu && dropdown) {
    userMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = dropdown.classList.toggle("open");
      userMenu.setAttribute("aria-expanded", open);
    });

    document.addEventListener("click", () => {
      dropdown.classList.remove("open");
      userMenu.setAttribute("aria-expanded", "false");
    });
  }

  /* ── Logout ──────────────────────────────────────────────────── */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await API.post("/auth/logout", {});
      } catch (_) {
        // ignore
      }
      window.location.href = "/index.html";
    });
  }
});
