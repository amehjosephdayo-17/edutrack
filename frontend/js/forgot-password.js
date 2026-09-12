/**
 * forgot-password.js
 * Three-step OTP flow:
 *  Step 1 — verify email + matric number (POST /auth/forgot-password/request-otp)
 *  Step 2 — verify OTP                    (POST /auth/forgot-password/verify-otp)
 *  Step 3 — set new password              (POST /auth/forgot-password/reset)
 */

document.addEventListener("DOMContentLoaded", () => {
  const stepRequest = document.getElementById("step-request");

  /* ── Utilities ──────────────────────────────────────────────── */
  function setFieldError(id, msg) {
    const el = document.getElementById(id);
    const errEl = document.getElementById(id + "-error");
    if (el) el.classList.toggle("error", !!msg);
    if (errEl) errEl.textContent = msg || "";
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

  /* ── Password show/hide toggles ─────────────────────────────── */
  document.querySelectorAll(".input-wrapper__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrapper")?.querySelector("input");
      if (!input) return;
      const isText = input.type === "text";
      input.type = isText ? "password" : "text";
      btn.setAttribute(
        "aria-label",
        isText ? "Show password" : "Hide password",
      );
      btn.querySelector(".icon-eye").style.display = isText ? "block" : "none";
      btn.querySelector(".icon-eye-off").style.display = isText
        ? "none"
        : "block";
    });
  });

  /* ── Step 1: Request OTP by verifying identity ───────────────── */
  const requestForm = document.getElementById("request-form");
  const requestAlert = document.getElementById("request-alert");

  requestForm &&
    requestForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      setAlert(requestAlert, "");
      setFieldError("email", "");
      setFieldError("matricNumber", "");

      const email = val("email");
      const matricNumber = val("matricNumber");

      let hasErr = false;
      if (!email) {
        setFieldError("email", "Email is required.");
        hasErr = true;
      }
      if (!matricNumber) {
        setFieldError("matricNumber", "Matric number is required.");
        hasErr = true;
      }
      if (hasErr) return;

      const btn = requestForm.querySelector("[type=submit]");
      btn.classList.add("btn--loading");
      btn.disabled = true;

      // Step 1: Request OTP
      const { ok, data } = await API.post("/auth/forgot-password/request-otp", {
        email,
        matricNumber,
      });

      btn.classList.remove("btn--loading");
      btn.disabled = false;

      if (ok && data?.success) {
        // Redirect to OTP verification page
        const encodedEmail = encodeURIComponent(data.email);
        window.location.href = `/verify-otp.html?email=${encodedEmail}&type=reset`;
        return;
      }

      if (data?.errors) {
        Object.entries(data.errors).forEach(([f, m]) => setFieldError(f, m));
      } else {
        setAlert(
          requestAlert,
          data?.message || "Verification failed. Please check your details.",
        );
      }
    });
});
