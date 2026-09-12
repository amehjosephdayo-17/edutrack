class OTPVerification {
  constructor() {
    this.email = "";
    this.otpType = "registration"; // 'registration' or 'reset'
    this.timerInterval = null;
    this.timeRemaining = 600; // 10 minutes in seconds
    this.resendCooldown = 0;
    this.maxAttempts = 5;
    this.attempts = 0;

    this.init();
  }

  init() {
    this.getQueryParams();
    this.setupEventListeners();
    this.startTimer();
    this.displayEmail();
    this.focusFirstInput();
  }

  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    this.email = params.get("email") || "";
    this.otpType = params.get("type") || "registration";

    if (!this.email) {
      this.showError("Email not provided. Redirecting...");
      setTimeout(() => {
        window.location.href =
          this.otpType === "registration"
            ? "register.html"
            : "forgot-password.html";
      }, 2000);
    }
  }

  displayEmail() {
    const emailDisplay = document.getElementById("displayEmail");
    if (emailDisplay && this.email) {
      // Mask email: am***.com
      const [username, domain] = this.email.split("@");
      const maskedUsername = username.charAt(0) + username.charAt(1) + "***";
      const maskedEmail = `${maskedUsername}@${domain}`;
      emailDisplay.textContent = maskedEmail;
    }
  }

  setupEventListeners() {
    const inputs = document.querySelectorAll(".otp-input");
    const verifyBtn = document.getElementById("verifyBtn");
    const resendBtn = document.getElementById("resendBtn");
    const backLink = document.getElementById("backLink");

    // OTP input navigation
    inputs.forEach((input, index) => {
      input.addEventListener("input", (e) =>
        this.handleOTPInput(e, index, inputs),
      );
      input.addEventListener("keydown", (e) =>
        this.handleKeyDown(e, index, inputs),
      );
      input.addEventListener("paste", (e) => this.handlePaste(e, inputs));
    });

    verifyBtn.addEventListener("click", () => this.verifyOTP());
    resendBtn.addEventListener("click", () => this.resendOTP());
    backLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href =
        this.otpType === "registration"
          ? "register.html"
          : "forgot-password.html";
    });

    // Set back link href
    backLink.href =
      this.otpType === "registration"
        ? "register.html"
        : "forgot-password.html";
  }

  handleOTPInput(e, index, inputs) {
    const value = e.target.value;

    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      e.target.value = "";
      return;
    }

    // Move to next input if digit is entered
    if (value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }

    // Enable/disable verify button based on all fields filled
    this.updateVerifyButtonState(inputs);
  }

  handleKeyDown(e, index, inputs) {
    if (e.key === "Backspace") {
      if (!e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputs[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  }

  handlePaste(e, inputs) {
    e.preventDefault();
    const pastedData = (e.clipboardData || window.clipboardData).getData(
      "text",
    );
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      inputs.forEach((input, index) => {
        input.value = digits[index] || "";
      });
      this.updateVerifyButtonState(inputs);
    }
  }

  updateVerifyButtonState(inputs) {
    const verifyBtn = document.getElementById("verifyBtn");
    const allFilled = Array.from(inputs).every(
      (input) => input.value.trim() !== "",
    );
    verifyBtn.disabled = !allFilled;
  }

  focusFirstInput() {
    const inputs = document.querySelectorAll(".otp-input");
    if (inputs.length > 0) {
      inputs[0].focus();
    }
  }

  getOTPCode() {
    const inputs = document.querySelectorAll(".otp-input");
    return Array.from(inputs)
      .map((input) => input.value)
      .join("");
  }

  async verifyOTP() {
    if (this.attempts >= this.maxAttempts) {
      this.showError("Too many failed attempts. Please request a new OTP.");
      document.getElementById("verifyBtn").disabled = true;
      return;
    }

    const otp = this.getOTPCode();

    if (otp.length !== 6) {
      this.showError("Please enter all 6 digits.");
      return;
    }

    const verifyBtn = document.getElementById("verifyBtn");
    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";

    try {
      const endpoint =
        this.otpType === "registration"
          ? "/auth/register/verify-otp"
          : "/auth/forgot-password/verify-otp";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: this.email,
          otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess(data.message);
        setTimeout(() => {
          if (this.otpType === "registration") {
            window.location.href = "index.html";
          } else {
            // Redirect to password reset page with token and email
            window.location.href = `reset-password.html?email=${encodeURIComponent(
              this.email,
            )}&token=${encodeURIComponent(data.resetToken)}`;
          }
        }, 1500);
      } else {
        this.attempts++;
        this.showError(data.message || "Invalid OTP. Please try again.");
        this.clearOTPInputs();
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify OTP";
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      this.showError("An error occurred. Please try again.");
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify OTP";
    }
  }

  async resendOTP() {
    if (this.resendCooldown > 0) {
      return;
    }

    const resendBtn = document.getElementById("resendBtn");
    resendBtn.disabled = true;
    resendBtn.textContent = "Sending...";

    try {
      const endpoint =
        this.otpType === "registration"
          ? "/auth/register/request-otp"
          : "/auth/forgot-password/request-otp";

      // For resend, we need the original data
      // For now, we'll show a message to re-register/reset request
      if (this.otpType === "registration") {
        this.showError("Please go back to registration and submit again.");
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend Code";
        return;
      } else {
        this.showError("Please go back to forgot password and request again.");
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend Code";
        return;
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      this.showError("Failed to resend OTP. Please try again.");
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend Code";
    }
  }

  clearOTPInputs() {
    const inputs = document.querySelectorAll(".otp-input");
    inputs.forEach((input) => {
      input.value = "";
      input.classList.remove("error");
    });
    this.focusFirstInput();
  }

  startTimer() {
    const timerValue = document.getElementById("timerValue");
    const resendBtn = document.getElementById("resendBtn");

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      // Update timer styling when < 2 minutes
      const timerContainer = document.querySelector(".otp-timer");
      if (this.timeRemaining < 120) {
        timerContainer.classList.add("warning");
      }

      // Timer expired
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        timerContainer.textContent = "Code expired";
        timerContainer.classList.remove("warning");
        document.getElementById("verifyBtn").disabled = true;
        resendBtn.disabled = false;
        this.showError(
          "OTP has expired. Click 'Resend Code' to get a new one.",
        );
      }

      // Resend cooldown (allow resend after 30 seconds or when timer < 2 mins)
      if (this.timeRemaining === 30 || this.timeRemaining === 60) {
        resendBtn.disabled = false;
      }
    }, 1000);
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

// Initialize OTP verification when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new OTPVerification();
});
