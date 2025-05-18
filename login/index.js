document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = "http://localhost:3000";
  const loginForm = document.getElementById("loginForm");
  const submitBtn = document.getElementById("submitBtn");
  const successMessage = document.getElementById("successMessage");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  function getTranslation(key, fallback) {
    return window.i18n && window.i18n.getTranslation(window.i18n.translations.login, key) || fallback;
  }

  togglePassword.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    this.classList.toggle("fa-eye-slash");
    this.classList.toggle("fa-eye");
  });

  function validateForm() {
    let isValid = true;

    if (!document.getElementById("login").value.trim()) {
      showError("loginError", getTranslation("login.form.errors.login_required", "Please, enter your phone or email"));
      isValid = false;
    } else {
      hideError("loginError");
    }

    if (!passwordInput.value.trim()) {
      showError("passwordError", getTranslation("login.form.errors.password_required", "Please, enter your password"));
      isValid = false;
    } else {
      hideError("passwordError");
    }

    return isValid;
  }

  function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }

  function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.style.display = "none";
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateForm()) return;

    const login = document.getElementById("login").value.trim();
    const password = passwordInput.value;
    submitBtn.disabled = true;
    submitBtn.textContent = getTranslation("login.form.submit_loading", "Вход...");

    try {
      const isEmail = login.includes("@");
      const queryField = isEmail ? "email" : "phone";
      const response = await fetch(`${apiUrl}/users?${queryField}=${login}`);
      const users = await response.json();

      if (users.length === 0) {
        throw new Error("User is not found");
      }

      const user = users[0];
      if (user.password !== password) {
        throw new Error("Wrong password");
      }

      sessionStorage.setItem(
        "authUser",
        JSON.stringify({
          id: user.id,
          nickname: user.nickname,
          role: user.role,
        })
      );

      successMessage.style.display = "block";
      submitBtn.textContent = getTranslation("login.form.success", "Log in successful");

      const returnUrl = sessionStorage.getItem("returnUrl");
      setTimeout(() => {
        window.location.href = returnUrl || "../home/index.html";
        if (returnUrl) {
          sessionStorage.removeItem("returnUrl");
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);

      if (error.message === "User is not found") {
        showError("loginError", getTranslation("login.form.errors.login_not_found", "User with this data not found"));
      } else if (error.message === "Wrong password") {
        showError("passwordError", getTranslation("login.form.errors.password_wrong", "Wrong password"));
      } else {
        alert(getTranslation("login.form.errors.server_error", "Error occurred. Please, try again"));
      }

      submitBtn.disabled = false;
      submitBtn.textContent = getTranslation("login.form.submit", "Sign in");
    }
  });

  loginForm.addEventListener("input", function () {
    validateForm();
  });

  function checkRememberedUser() {
    const authUser = sessionStorage.getItem("authUser");
    if (!authUser) return;

    try {
      const userData = JSON.parse(authUser);
      document.getElementById("login").value = userData.email || userData.phone;
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }

  checkRememberedUser();
});