document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = "http://localhost:3000";
  const form = document.getElementById("registrationForm");
  const submitBtn = document.getElementById("submitBtn");
  const successMessage = document.getElementById("successMessage");
  const manualPasswordFields = document.getElementById("manualPasswordFields");
  const generateNicknameBtn = document.getElementById("generateNickname");
  const generatePasswordBtn = document.getElementById("generatePassword");
  const termsModal = document.getElementById("termsModal");
  const termsLink = document.getElementById("termsLink");
  const closeModal = document.querySelector(".close");
  const agreementCheckbox = document.getElementById("agreement");
  const acceptTermsBtn = document.getElementById("acceptTerms");
  const termsContent = document.querySelector(".terms-content");

  let nicknameAttempts = 0;
  const maxNicknameAttempts = 5;
  let isTermsRead = false;
  let termsModalOpenTime = null;

  const commonPasswords = [
    "password",
    "123456",
    "123456789",
    "12345",
    "qwerty",
    "password1",
    "12345678",
    "111111",
    "1234567",
    "123123",
  ];

  const nicknameSuffixes = [
    "",
    "_",
    "-",
    ".",
    "X",
    "Z",
    "007",
    "42",
    "99",
    "2024",
  ];

  function getTranslation(key, fallback) {
    return window.i18n && window.i18n.getTranslation(window.i18n.translations.registration, key) || fallback;
  }

  function initForm() {
    const birthDateInput = document.getElementById("birthDate");
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - 16,
      today.getMonth(),
      today.getDate()
    );
    birthDateInput.max = maxDate.toISOString().split("T")[0];
    manualPasswordFields.style.display = "none";
    agreementCheckbox.disabled = true;
    submitBtn.disabled = true;
    setupTermsListener();
  }

  function setupTermsListener() {
    if (termsContent) {
      // Проверка прокрутки
      termsContent.addEventListener("scroll", function () {
        const isAtBottom =
          termsContent.scrollTop + termsContent.clientHeight >=
          termsContent.scrollHeight - 10;
        if (isAtBottom) {
          isTermsRead = true;
          console.log("Terms fully scrolled, isTermsRead set to true");
        }
      });
    } else {
      console.warn("Terms content element (.terms-content) not found");
    }

    // Таймер для модального окна
    termsLink.addEventListener("click", function (e) {
      e.preventDefault();
      termsModal.style.display = "block";
      termsModalOpenTime = Date.now();
      console.log("Terms modal opened at:", termsModalOpenTime);
    });
  }

  agreementCheckbox.addEventListener("click", function (e) {
    if (agreementCheckbox.disabled) {
      e.preventDefault();
      showError("agreementError", getTranslation("registration.form.errors.terms_not_read", "You must read and accept the terms"));
      console.log("Checkbox click prevented, terms not read");
    }
  });

  generateNicknameBtn.addEventListener("click", function () {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();

    if (!firstName || !lastName) {
      showError("nicknameError", getTranslation("registration.form.errors.nickname_missing_names", "Please enter your first and last name first"));
      return;
    }

    nicknameAttempts++;

    if (nicknameAttempts >= maxNicknameAttempts) {
      document.getElementById("nickname").readOnly = false;
      generateNicknameBtn.disabled = true;
      hideError("nicknameError");
      return;
    }

    const nickname = generateNickname(firstName, lastName);
    document.getElementById("nickname").value = nickname;
    checkFieldAvailability(
      "nickname",
      nickname,
      "nicknameError",
      getTranslation("registration.form.errors.nickname_already_taken", "This nickname is already taken")
    );
  });

  generatePasswordBtn.addEventListener("click", function () {
    const password = generatePassword();
    document.getElementById("password").value = password;
    document.getElementById("confirmPassword").value = password;
    validatePassword();
  });

  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      const icon = this.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });

  function generatePassword() {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()";

    let password = "";
    password += getRandomChar(uppercase);
    password += getRandomChar(lowercase);
    password += getRandomChar(numbers);
    password += getRandomChar(symbols);

    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += getRandomChar(allChars);
    }

    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  }

  function getRandomChar(charSet) {
    return charSet.charAt(Math.floor(Math.random() * charSet.length));
  }

  function generateNickname(firstName, lastName) {
    const firstPart = firstName.substring(0, Math.min(3, firstName.length));
    const secondPart = lastName.substring(0, Math.min(3, lastName.length));
    const randomNum = Math.floor(Math.random() * 990) + 10;
    const randomSuffix =
      nicknameSuffixes[Math.floor(Math.random() * nicknameSuffixes.length)];

    const combinations = [
      firstPart + secondPart + randomNum,
      firstPart.charAt(0) + "_" + secondPart + randomNum,
      firstPart + randomNum + randomSuffix,
      firstPart + secondPart.charAt(0) + randomNum,
      firstPart.charAt(0) + secondPart + randomSuffix,
    ];

    return combinations[Math.floor(Math.random() * combinations.length)];
  }

  async function checkFieldAvailability(
    fieldName,
    value,
    errorElementId,
    errorMessage
  ) {
    try {
      const response = await fetch(
        `${apiUrl}/users?${fieldName}=${encodeURIComponent(value)}`
      );
      const users = await response.json();

      if (users.length > 0) {
        showError(errorElementId, errorMessage);
        return false;
      } else {
        hideError(errorElementId);
        return true;
      }
    } catch (error) {
      console.error(`Error checking ${fieldName}:`, error);
      showError(errorElementId, getTranslation(`registration.form.errors.${fieldName}_error_checking`, `Error checking ${fieldName}`));
      return false;
    }
  }

  async function validateUniqueFields() {
    const email = document.getElementById("email").value.trim();
    const nickname = document.getElementById("nickname").value.trim();
    const phone = document.getElementById("phone").value.trim();

    const isEmailUnique = await checkFieldAvailability(
      "email",
      email,
      "emailError",
      getTranslation("registration.form.errors.email_already_registered", "This email is already registered")
    );
    const isNicknameUnique = await checkFieldAvailability(
      "nickname",
      nickname,
      "nicknameError",
      getTranslation("registration.form.errors.nickname_already_taken", "This nickname is already taken")
    );
    const isPhoneUnique = await checkFieldAvailability(
      "phone",
      phone,
      "phoneError",
      getTranslation("registration.form.errors.phone_already_registered", "This phone number is already registered")
    );

    return isEmailUnique && isNicknameUnique && isPhoneUnique;
  }

  function validateForm() {
    let isValid = true;

    if (
      !validateRequiredField(
        "lastName",
        "lastNameError",
        getTranslation("registration.form.errors.last_name_required", "Enter your last name")
      )
    ) {
      isValid = false;
    }

    if (
      !validateRequiredField(
        "firstName",
        "firstNameError",
        getTranslation("registration.form.errors.first_name_required", "Enter your first name")
      )
    ) {
      isValid = false;
    }

    if (!validateBirthDate()) {
      isValid = false;
    }

    if (!validatePhoneFormat()) {
      isValid = false;
    }

    if (!validateEmailFormat()) {
      isValid = false;
    }

    if (
      !validateRequiredField(
        "nickname",
        "nicknameError",
        getTranslation("registration.form.errors.nickname_required", "Enter or generate a nickname")
      )
    ) {
      isValid = false;
    }

    if (!validatePassword()) {
      isValid = false;
    }

    if (!isTermsRead) {
      showError("agreementError", getTranslation("registration.form.errors.terms_not_read", "You must read the terms and conditions"));
      isValid = false;
    } else if (!agreementCheckbox.checked) {
      showError("agreementError", getTranslation("registration.form.errors.agreement_error", "You must accept the agreement terms"));
      isValid = false;
    } else {
      hideError("agreementError");
    }

    submitBtn.disabled = !isValid;
    return isValid;
  }

  async function validateFormWithUniqueness() {
    const isFormValid = validateForm();
    if (!isFormValid) return false;

    const areFieldsUnique = await validateUniqueFields();
    submitBtn.disabled = !areFieldsUnique;
    return areFieldsUnique;
  }

  function validateRequiredField(fieldId, errorId, errorMessage) {
    const value = document.getElementById(fieldId).value.trim();
    if (!value) {
      showError(errorId, errorMessage);
      return false;
    } else {
      hideError(errorId);
      return true;
    }
  }

  function validateBirthDate() {
    const birthDate = new Date(document.getElementById("birthDate").value);
    if (!birthDate || isNaN(birthDate.getTime())) {
      showError("birthDateError", getTranslation("registration.form.errors.birth_date_required", "Enter your birth date"));
      return false;
    }

    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 16,
      today.getMonth(),
      today.getDate()
    );

    if (birthDate > minAgeDate) {
      showError("birthDateError", getTranslation("registration.form.errors.birth_date_age", "You must be at least 16 years old"));
      return false;
    }

    hideError("birthDateError");
    return true;
  }

  function validatePhoneFormat() {
    const phone = document.getElementById("phone").value.trim();
    if (!phone) {
      showError("phoneError", getTranslation("registration.form.errors.phone_required", "Enter your phone number"));
      return false;
    }

    if (!/^\+375(24|25|29|33|44)\d{7}$/.test(phone)) {
      showError(
        "phoneError",
        getTranslation("registration.form.errors.phone_error", "Enter a valid Belarusian phone number (+375XXXXXXXXX)")
      );
      return false;
    }

    hideError("phoneError");
    return true;
  }

  function validateEmailFormat() {
    const email = document.getElementById("email").value.trim();
    if (!email) {
      showError("emailError", getTranslation("registration.form.errors.email_required", "Enter your email"));
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("emailError", getTranslation("registration.form.errors.email_error", "Enter a valid email"));
      return false;
    }

    hideError("emailError");
    return true;
  }

  function validatePassword() {
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!password) {
      showError("passwordError", getTranslation("registration.form.errors.password_required", "Enter password"));
      return false;
    }

    if (password.length < 8 || password.length > 20) {
      showError("passwordError", getTranslation("registration.form.errors.password_length", "Password must be 8-20 characters"));
      return false;
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      showError(
        "passwordError",
        getTranslation("registration.form.errors.password_format", "Password must contain uppercase, lowercase, numbers and symbols")
      );
      return false;
    }

    if (commonPasswords.includes(password.toLowerCase())) {
      showError("passwordError", getTranslation("registration.form.errors.password_common", "This password is too common"));
      return false;
    }

    if (!confirmPassword) {
      showError("confirmPasswordError", getTranslation("registration.form.errors.confirm_password_required", "Confirm your password"));
      return false;
    }

    if (password !== confirmPassword) {
      showError("confirmPasswordError", getTranslation("registration.form.errors.confirm_password_error", "Passwords do not match"));
      return false;
    }

    hideError("passwordError");
    hideError("confirmPasswordError");
    return true;
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

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!(await validateFormWithUniqueness())) {
      return;
    }

    const nickname = document.getElementById("nickname").value.trim();
    const isNicknameAvailable = await checkFieldAvailability(
      "nickname",
      nickname,
      "nicknameError",
      getTranslation("registration.form.errors.nickname_already_taken", "This nickname is already taken")
    );

    if (!isNicknameAvailable) {
      return;
    }

    const userData = {
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      middleName: document.getElementById("middleName").value.trim(),
      birthDate: document.getElementById("birthDate").value,
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      nickname: nickname,
      password: document.getElementById("password").value,
      registrationDate: new Date().toISOString(),
      agreement: agreementCheckbox.checked,
    };

    try {
      const response = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Server error: " + response.status);
      }

      successMessage.style.display = "block";
      window.location.href =
        "../login/index.html?fromRegistration=true&email=" +
        encodeURIComponent(userData.email);
      form.reset();
      submitBtn.disabled = true;
      agreementCheckbox.disabled = true;
      isTermsRead = false;
    } catch (error) {
      console.error("Registration error:", error);
      alert(getTranslation("registration.form.errors.server_error", "Registration error. Please try again."));
    }
  });

  termsLink.addEventListener("click", function (e) {
    e.preventDefault();
    termsModal.style.display = "block";
  });

  closeModal.addEventListener("click", function () {
    termsModal.style.display = "none";
    console.log("Terms modal closed");
  });

  window.addEventListener("click", function (event) {
    if (event.target === termsModal) {
      termsModal.style.display = "none";
      console.log("Terms modal closed by clicking outside");
    }
  });

  acceptTermsBtn.addEventListener("click", function () {
    console.log("Accept terms button clicked, isTermsRead:", isTermsRead);
    const timeSpent = Date.now() - termsModalOpenTime;
    if (!isTermsRead && timeSpent >= 3000) {
      isTermsRead = true;
      console.log("3 seconds elapsed, isTermsRead set to true");
    }
    if (isTermsRead) {
      agreementCheckbox.disabled = false;
      agreementCheckbox.checked = true;
      termsModal.style.display = "none";
      hideError("agreementError");
      validateForm();
      console.log("Terms accepted, checkbox enabled and checked");
    } else {
      showError("agreementError", getTranslation("registration.form.errors.terms_not_read", "Please read the terms (scroll or wait 3 seconds)"));
      console.log("Terms not read, showing error");
    }
  });

  form.addEventListener("input", function () {
    validateForm();
  });

  initForm();
});