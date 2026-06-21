document.addEventListener("DOMContentLoaded", async () => {
  const contentEl = document.getElementById("profile-content");
  const skeletonEl = document.getElementById("profile-skeleton");

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (_) {
      return iso;
    }
  }

  function formatDateTime(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return iso;
    }
  }

  function initials(fullName) {
    return (fullName || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  }

  // Render user data
  function render(user) {
    // Topbar user info
    const nameEl = document.querySelector(".topbar__user-name");
    const emailEl = document.querySelector(".topbar__user-email");
    const avatarEl = document.querySelector(".topbar__avatar");
    if (nameEl) nameEl.textContent = user.fullName;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = initials(user.fullName);

    // Hide skeleton, show content
    if (skeletonEl) skeletonEl.style.display = "none";
    if (contentEl) contentEl.style.display = "";

    // Profile hero block
    const heroAvatar = document.getElementById("profile-avatar");
    const heroName = document.getElementById("hero-fullName");
    const heroMatric = document.getElementById("hero-matric");
    if (heroAvatar) heroAvatar.textContent = initials(user.fullName);
    if (heroName) heroName.textContent = user.fullName;
    if (heroMatric) heroMatric.textContent = user.matricNumber || "—";

    // Fill info grid
    const fields = {
      "info-fullName": user.fullName,
      "info-email": user.email,
      "info-phone": user.phone,
      "info-matric": user.matricNumber,
      "info-department": user.department,
      "info-level": user.level, // badge in card header
      "info-level-text": user.level, // row in info grid
      "info-dob": formatDate(user.dateOfBirth),
      "info-gender": user.gender || "Not specified",
      "info-lastLogin": formatDateTime(user.lastLogin),
      "info-joined": formatDate(user.createdAt),
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || "—";
    });
  }

  // fetch dashboard date
  try {
    const { ok, data } = await API.get("/dashboard");
    if (ok && data?.success) {
      render(data.user);
    } else {
      if (contentEl)
        contentEl.innerHTML = `
        <p class="alert alert--error">Could not load profile. Please refresh or <a href="/index.html">log in again</a>.</p>`;
      if (skeletonEl) skeletonEl.style.display = "none";
    }
  } catch (err) {
    console.error("Dashboard fetch error:", err);
  }
});
