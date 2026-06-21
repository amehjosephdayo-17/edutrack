/**
 * settings.js — Profile update + password change logic.
 */

document.addEventListener("DOMContentLoaded", async () => {
  /* ── Utilities ────────────────────────────────────────────────── */
  function setFieldError(id, msg) {
    const el = document.getElementById(id);
    const errEl = document.getElementById(id + "-error");
    if (el) el.classList.toggle("error", !!msg);
    if (errEl) errEl.textContent = msg || "";
  }

  function clearErrors(ids) {
    ids.forEach((id) => setFieldError(id, ""));
  }

  function setAlert(el, msg, type = "error") {
    if (!el) return;
    el.textContent = msg;
    el.className = `alert alert--${type}`;
    el.classList.toggle("hidden", !msg);
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function initials(name) {
    return (name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join("");
  }

  /* ── Load current profile ─────────────────────────────────────── */
  async function loadProfile() {
    const { ok, data } = await API.get("/settings/profile");
    if (!ok || !data?.success) return;
    const u = data.user;

    // Topbar
    const nameEl = document.querySelector(".topbar__user-name");
    const emailEl = document.querySelector(".topbar__user-email");
    const avatarEl = document.querySelector(".topbar__avatar");
    if (nameEl) nameEl.textContent = u.fullName;
    if (emailEl) emailEl.textContent = u.email;
    if (avatarEl) avatarEl.textContent = initials(u.fullName);

    // Profile form fields
    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || "";
    };

    setVal("fullName", u.fullName);
    setVal("email", u.email);
    setVal("phone", u.phone);
    setVal("matricNumber", u.matricNumber);
    setVal("department", u.department);
    setVal("level", u.level);
    // Format date as YYYY-MM-DD for <input type="date">
    if (u.dateOfBirth) {
      setVal(
        "dateOfBirth",
        new Date(u.dateOfBirth).toISOString().split("T")[0],
      );
    }
    setVal("gender", u.gender || "");
  }

  await loadProfile();

  /* ── Profile update form ──────────────────────────────────────── */
  const profileForm = document.getElementById("profile-form");
  const profileAlert = document.getElementById("profile-alert");
  const PROFILE_FIELDS = [
    "fullName",
    "email",
    "phone",
    "department",
    "level",
    "dateOfBirth",
  ];

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors(PROFILE_FIELDS);
      setAlert(profileAlert, "");

      const payload = {
        fullName: val("fullName"),
        email: val("email"),
        phone: val("phone"),
        department: val("department"),
        level: val("level"),
        dateOfBirth: val("dateOfBirth"),
        gender: val("gender") || "",
      };

      // Basic client checks
      let hasErr = false;
      if (!payload.fullName) {
        setFieldError("fullName", "Full name is required.");
        hasErr = true;
      }
      if (!payload.email) {
        setFieldError("email", "Email is required.");
        hasErr = true;
      }
      if (!payload.phone) {
        setFieldError("phone", "Phone number is required.");
        hasErr = true;
      }
      if (!payload.department) {
        setFieldError("department", "Department is required.");
        hasErr = true;
      }
      if (!payload.level) {
        setFieldError("level", "Level is required.");
        hasErr = true;
      }
      if (!payload.dateOfBirth) {
        setFieldError("dateOfBirth", "Date of birth is required.");
        hasErr = true;
      }
      if (hasErr) return;

      const btn = profileForm.querySelector("[type=submit]");
      btn.classList.add("btn--loading");
      btn.disabled = true;

      const { ok, data } = await API.patch("/settings/profile", payload);

      btn.classList.remove("btn--loading");
      btn.disabled = false;

      if (ok && data?.success) {
        setAlert(profileAlert, "Profile updated successfully.", "success");
        // Refresh topbar
        const nameEl = document.querySelector(".topbar__user-name");
        const emailEl = document.querySelector(".topbar__user-email");
        const avatarEl = document.querySelector(".topbar__avatar");
        if (nameEl) nameEl.textContent = data.user.fullName;
        if (emailEl) emailEl.textContent = data.user.email;
        if (avatarEl) avatarEl.textContent = initials(data.user.fullName);
        return;
      }

      if (data?.errors) {
        Object.entries(data.errors).forEach(([f, m]) => setFieldError(f, m));
      } else {
        setAlert(
          profileAlert,
          data?.message || "Update failed. Please try again.",
        );
      }
    });
  }

  /* ── Password change form ─────────────────────────────────────── */
  const passwordForm = document.getElementById("password-form");
  const passwordAlert = document.getElementById("password-alert");
  const PWD_FIELDS = ["currentPassword", "password", "confirmPassword"];

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors(PWD_FIELDS);
      setAlert(passwordAlert, "");

      const currentPassword =
        document.getElementById("currentPassword")?.value || "";
      const password = document.getElementById("password")?.value || "";
      const confirmPassword =
        document.getElementById("confirmPassword")?.value || "";

      let hasErr = false;
      if (!currentPassword) {
        setFieldError("currentPassword", "Current password is required.");
        hasErr = true;
      }
      if (!password) {
        setFieldError("password", "New password is required.");
        hasErr = true;
      } else if (password.length < 8) {
        setFieldError("password", "Password must be at least 8 characters.");
        hasErr = true;
      } else if (!/[A-Z]/.test(password)) {
        setFieldError("password", "Must contain an uppercase letter.");
        hasErr = true;
      } else if (!/[a-z]/.test(password)) {
        setFieldError("password", "Must contain a lowercase letter.");
        hasErr = true;
      } else if (!/[0-9]/.test(password)) {
        setFieldError("password", "Must contain a number.");
        hasErr = true;
      }
      if (!confirmPassword) {
        setFieldError("confirmPassword", "Please confirm your new password.");
        hasErr = true;
      } else if (confirmPassword !== password) {
        setFieldError("confirmPassword", "Passwords do not match.");
        hasErr = true;
      }
      if (hasErr) return;

      const btn = passwordForm.querySelector("[type=submit]");
      btn.classList.add("btn--loading");
      btn.disabled = true;

      const { ok, data } = await API.post("/settings/password", {
        currentPassword,
        password,
        confirmPassword,
      });

      btn.classList.remove("btn--loading");
      btn.disabled = false;

      if (ok && data?.success) {
        setAlert(
          passwordAlert,
          "Password changed. Redirecting to login…",
          "success",
        );
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 1800);
        return;
      }

      if (data?.errors) {
        Object.entries(data.errors).forEach(([f, m]) => setFieldError(f, m));
      } else {
        setAlert(passwordAlert, data?.message || "Password change failed.");
      }
    });
  }

  /* ── Password show/hide toggles ─────────────────────────────────── */
  document.querySelectorAll(".input-wrapper__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrapper = btn.closest(".input-wrapper");
      const input = wrapper && wrapper.querySelector("input");
      if (!input) return;
      const isText = input.type === "text";
      input.type = isText ? "password" : "text";
      btn.setAttribute(
        "aria-label",
        isText ? "Show password" : "Hide password",
      );
    });
  });
});
