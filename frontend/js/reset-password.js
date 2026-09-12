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
      this.showError("Invalid reset link. Redirecting to forgot password page...");
      setTimeout(() => {
        window.location.href = "forgot-password.html";
      }, 2000);
    }
  }

  setupEventListeners() {
    const form = document.getElementById("resetPasswordForm");
    const toggleBtn1 = document.getElementById("togglePassword1");
    const toggleBtn2 = document.getElementById("togglePassword2");

    form.addEventListener("submit", (e) => this.handleSubmit(e));
    toggleBtn1.addEventListener("click", (e) => this.togglePassword(e, "newPassword"));
    toggleBtn2.addEventListener("click", (e) => this.togglePassword(e, "confirmPassword"));
  }

  setupPasswordValidation() {
    const passwordInput = document.getElementById("newPassword");
    const requirementsDiv = document.getElementById("passwordRequirements");

    passwordInput.addEventListener("input", () => {
      this.updatePasswordRequirements();
    });
  }

  updatePasswordRequirements() {
    const password = document.getElementById("newPassword").value;
    const requirementsDiv = document.getElementById("passwordRequirements");

    const requirements = [
      { text: "At least 8 characters", met: password.length >= 8 },
      { text: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { text: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { text: "Contains number", met: /[0-9]/.test(password) },
    ];

    requirementsDiv.innerHTML = requirements
      .map(
        (req) =>
          `<div class="requirement ${req.met ? "met" : ""}">
        <span class="requirement-icon">${req.met ? "✓" : "○"}</span>
        ${req.text}
      </div>`,
      )
      .join("");
  }

  togglePassword(e, fieldId) {
    e.preventDefault();
    const input = document.getElementById(fieldId);
    const btn = e.currentTarget;
    const span = btn.querySelector("span");

    if (input.type === "password") {
      input.type = "text";
      span.textContent = "Hide";
    } else {
      input.type = "password";
      span.textContent = "Show";
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Validation
    if (!password) {
      this.showError("Password is required.");
      return;
    }

    if (password.length < 8) {
      this.showError("Password must be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      this.showError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      this.showError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      this.showError("Password must contain at least one number.");
      return;
    }

    if (password !== confirmPassword) {
      this.showError("Passwords do not match.");
      return;
    }

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
        this.showSuccess("Password reset successfully! Redirecting to login...");
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
    errorDiv.style.display = "block";

    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  }

  showSuccess(message) {
    const successDiv = document.getElementById("successMessage");
    successDiv.textContent = message;
    successDiv.style.display = "block";
  }
}

// Initialize reset password when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ResetPassword();
});
