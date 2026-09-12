class ResetPassword {
  constructor() {
    this.email = "";
    this.resetToken = "";

    this.init();
  }

  init() {
    this.getQueryParams();
    this.setupEventListeners();
    this.setupPasswordValidation();
  }

  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    this.email = params.get("email") || "";
    this.resetToken = params.get("token") || "";

    if (!this.email || !this.resetToken) {
      this.showError(
        "Invalid reset link. Redirecting to forgot password page...",
      );
      setTimeout(() => {
        window.location.href = "forgot-password.html";
      }, 2000);
    }
  }

  setupEventListeners() {
    const form = document.getElementById("resetForm");
    const toggleBtns = document.querySelectorAll(".toggle-password");

    form.addEventListener("submit", (e) => this.handleSubmit(e));

    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute("data-target");
        const input = document.getElementById(targetId);
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.textContent = isPassword ? "Hide" : "Show";
      });
    });
  }

  setupPasswordValidation() {
    const passwordInput = document.getElementById("newPassword");
    passwordInput.addEventListener("input", () => {
      this.updatePasswordRequirements();
    });
  }

  updatePasswordRequirements() {
    const password = document.getElementById("newPassword").value;

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };

    Object.entries(checks).forEach(([key, met]) => {
      const el = document.querySelector(`[data-req="${key}"]`);
      if (el) {
        el.classList.toggle("checked", met);
        el.classList.toggle("unchecked", !met);
      }
    });
  }

  clearErrors() {
    document.getElementById("newPassword-error").classList.remove("show");
    document.getElementById("confirmPassword-error").classList.remove("show");
    document.getElementById("newPassword").classList.remove("error");
    document.getElementById("confirmPassword").classList.remove("error");
  }

  setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (message) {
      input.classList.add("error");
      errorEl.textContent = message;
      errorEl.classList.add("show");
    } else {
      input.classList.remove("error");
      errorEl.classList.remove("show");
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const submitBtn = e.target.querySelector("[type=submit]");

    this.clearErrors();

    // Validation
    let hasErr = false;

    if (!password) {
      this.setFieldError("newPassword", "Password is required.");
      hasErr = true;
    } else if (password.length < 8) {
      this.setFieldError(
        "newPassword",
        "Password must be at least 8 characters.",
      );
      hasErr = true;
    } else if (!/[A-Z]/.test(password)) {
      this.setFieldError("newPassword", "Must contain an uppercase letter.");
      hasErr = true;
    } else if (!/[a-z]/.test(password)) {
      this.setFieldError("newPassword", "Must contain a lowercase letter.");
      hasErr = true;
    } else if (!/[0-9]/.test(password)) {
      this.setFieldError("newPassword", "Must contain a number.");
      hasErr = true;
    }

    if (!confirmPassword) {
      this.setFieldError("confirmPassword", "Please confirm your password.");
      hasErr = true;
    } else if (password !== confirmPassword) {
      this.setFieldError("confirmPassword", "Passwords do not match.");
      hasErr = true;
    }

    if (hasErr) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";

    try {
      const response = await fetch("/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: this.email,
          password,
          confirmPassword,
          resetToken: this.resetToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess(
          "Password reset successfully! Redirecting to login...",
        );
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        this.showError(data.message || "Failed to reset password.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Reset Password";
      }
    } catch (error) {
      console.error("Password reset error:", error);
      this.showError("An error occurred. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  }

  showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.textContent = message;
    errorDiv.classList.add("show");

    setTimeout(() => {
      errorDiv.classList.remove("show");
    }, 5000);
  }

  showSuccess(message) {
    const successDiv = document.getElementById("successMessage");
    successDiv.textContent = message;
    successDiv.classList.add("show");
  }
}

// Initialize reset password when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ResetPassword();
});
