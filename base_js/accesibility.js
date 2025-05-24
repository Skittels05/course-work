document.addEventListener("DOMContentLoaded", function () {
  console.log("Accessibility system initializing...");

  const config = {
    maxAttempts: 15,
    retryDelay: 200,
    localStorageKey: "a11ySettings",
  };

  const state = {
    elements: {
      toggleBtn: null,
      modal: null,
      applyBtn: null,
      resetBtn: null,
      imageToggle: null,
      fontButtons: null,
      colorButtons: null,
    },
    settings: {
      fontSize: null,
      colorScheme: "default",
      hideImages: false,
      initialized: false,
    },
    originalStyles: {
      bodyClass: "",
      htmlFontSize: "",
    },
  };

  function initialize() {
    console.log("Starting initialization...");

    saveOriginalStyles();

    findElements()
      .then(setupEventListeners)
      .then(loadSavedSettings)
      .then(applyCurrentSettings)
      .then(() => {
        state.settings.initialized = true;
        console.log("Accessibility system ready");
      })
      .catch((error) => {
        console.error("Accessibility init error:", error);
      });
  }

  function saveOriginalStyles() {
    state.originalStyles.bodyClass = document.body.className;
    state.originalStyles.htmlFontSize = document.documentElement.style.fontSize;
    console.log("Original styles saved");
  }

  function restoreOriginalStyles() {
    document.body.className = state.originalStyles.bodyClass;
    document.documentElement.style.fontSize = state.originalStyles.htmlFontSize;
    console.log("Original styles restored");
  }

  function findElements(attempt = 0) {
    return new Promise((resolve, reject) => {
      console.log(`Finding elements (attempt ${attempt + 1})`);

      state.elements = {
        toggleBtn: document.querySelector(".lang_view img"),
        modal: document.getElementById("accessibility-modal"),
        applyBtn: document.querySelector(".apply-btn"),
        resetBtn: document.querySelector(".reset-btn"),
        imageToggle: document.querySelector("#toggle-images"),
        fontButtons: document.querySelectorAll(".font-size-btn"),
        colorButtons: document.querySelectorAll(".color-scheme-btn"),
      };

      const essentialElementsFound =
        state.elements.toggleBtn && state.elements.modal;

      if (essentialElementsFound || attempt >= config.maxAttempts) {
        if (!essentialElementsFound) {
          console.warn("Essential elements not found after max attempts");
        }
        resolve();
      } else {
        setTimeout(
          () => findElements(attempt + 1).then(resolve),
          config.retryDelay
        );
      }
    });
  }

  function setupEventListeners() {
    console.log("Setting up event listeners");

    state.elements.toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleModal();
    });

    document.addEventListener("click", function (e) {
      if (
        state.elements.modal.classList.contains("show") &&
        !state.elements.modal.contains(e.target) &&
        !e.target.closest(".lang_view")
      ) {
        toggleModal(false);
      }
    });

    if (state.elements.fontButtons) {
      state.elements.fontButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
          state.elements.fontButtons.forEach((b) =>
            b.classList.remove("active")
          );
          this.classList.add("active");
          state.settings.fontSize = this.dataset.size;
          console.log("Font size selected:", state.settings.fontSize);
        });
      });
    }

    if (state.elements.colorButtons) {
      state.elements.colorButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
          state.elements.colorButtons.forEach((b) =>
            b.classList.remove("active")
          );
          this.classList.add("active");
          state.settings.colorScheme = this.dataset.scheme;
          console.log("Color scheme selected:", state.settings.colorScheme);

          applyColorScheme();
        });
      });
    }

    if (state.elements.applyBtn) {
      state.elements.applyBtn.addEventListener("click", applySettings);
    }

    if (state.elements.resetBtn) {
      state.elements.resetBtn.addEventListener("click", resetSettings);
    }

    if (state.elements.imageToggle) {
      state.elements.imageToggle.addEventListener("change", function () {
        state.settings.hideImages = !this.checked;
        handleImages();
      });
    }
  }

  function toggleModal(show) {
    if (typeof show !== "boolean") {
      show = !state.elements.modal.classList.contains("show");
    }

    if (show) {
      state.elements.modal.classList.add("show");
      document.body.style.overflow = "hidden";
    } else {
      state.elements.modal.classList.remove("show");
      document.body.style.overflow = "";
    }
    console.log("Modal visibility:", show);
  }

  function loadSavedSettings() {
    const saved = localStorage.getItem(config.localStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        state.settings = {
          fontSize: parsed.fontSize || null,
          colorScheme: parsed.colorScheme || "default",
          hideImages: parsed.hideImages || false,
          initialized: true,
        };

        console.log("Loaded saved settings:", state.settings);

        if (state.elements.imageToggle) {
          state.elements.imageToggle.checked = !state.settings.hideImages;
        }

        if (state.settings.fontSize && state.elements.fontButtons) {
          const activeFontBtn = Array.from(state.elements.fontButtons).find(
            (btn) => btn.dataset.size === state.settings.fontSize
          );
          if (activeFontBtn) activeFontBtn.classList.add("active");
        }

        if (state.settings.colorScheme && state.elements.colorButtons) {
          const activeColorBtn = Array.from(state.elements.colorButtons).find(
            (btn) => btn.dataset.scheme === state.settings.colorScheme
          );
          if (activeColorBtn) activeColorBtn.classList.add("active");
        }
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    return Promise.resolve();
  }

  // Apply current settings
  function applyCurrentSettings() {
    if (state.settings.fontSize) {
      applyFontSize();
    }

    applyColorScheme();

    if (state.settings.initialized) {
      handleImages();
    }
  }

  function applyFontSize() {
    const sizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };

    const newSize = state.settings.fontSize
      ? sizeMap[state.settings.fontSize]
      : "";
    document.documentElement.style.fontSize = newSize;

    // Обработка переносов
    if (state.settings.fontSize && state.settings.fontSize !== "medium") {
      document.body.classList.add("a11y-font-changed");
    } else {
      document.body.classList.remove("a11y-font-changed");
    }

    // Обработка хедера
    const header = document.querySelector("header");
    if (header) {
      if (
        state.settings.fontSize === "medium" ||
        state.settings.fontSize === "large"
      ) {
        header.classList.add("header-flex-wrap");
      } else {
        header.classList.remove("header-flex-wrap");
      }
    }

    // Применяем стили переноса только к элементам внутри main
    const main = document.querySelector("main");
    if (main) {
      const textElements = main.querySelectorAll(
        "p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, div, article, section"
      );

      textElements.forEach((el) => {
        el.style.wordBreak = "break-word";
        el.style.overflowWrap = "anywhere";
      });
    }

    console.log("Font settings applied");
  }

  function applyColorScheme() {
    const allSchemes = [
      "scheme-default",
      "scheme-black-white",
      "scheme-black-green",
      "scheme-white-black",
      "scheme-beige-brown",
      "scheme-blue-darkblue",
    ];
    document.body.classList.remove(...allSchemes);

    if (state.settings.colorScheme) {
      document.body.classList.add(`scheme-${state.settings.colorScheme}`);
    }

    updateCSSCustomProperties(state.settings.colorScheme);

    console.log("Color scheme applied:", state.settings.colorScheme);
  }

  function updateCSSCustomProperties(scheme) {
    const root = document.documentElement;

    switch (scheme) {
      case "black-white":
        root.style.setProperty("--bg-color", "#000");
        root.style.setProperty("--text-color", "#FFF");
        break;
      case "black-green":
        root.style.setProperty("--bg-color", "#000");
        root.style.setProperty("--text-color", "#0F0");
        break;
      case "white-black":
        root.style.setProperty("--bg-color", "#FFF");
        root.style.setProperty("--text-color", "#000");
        break;
      case "beige-brown":
        root.style.setProperty("--bg-color", "#F5F5DC");
        root.style.setProperty("--text-color", "#654321");
        break;
      case "blue-darkblue":
        root.style.setProperty("--bg-color", "#ADD8E6");
        root.style.setProperty("--text-color", "#00008B");
        break;
      default:
        root.style.setProperty("--bg-color", "");
        root.style.setProperty("--text-color", "");
    }
  }

  function handleImages() {
    const main = document.querySelector("main");
    if (!main) {
      console.warn("Main element not found");
      return;
    }

    if (state.settings.hideImages) {
      console.log("Hiding images in main");

      main
        .querySelectorAll('img:not([alt=""]):not(.a11y-processed)')
        .forEach((img) => {
          img.classList.add("a11y-processed");

          if (!img.dataset.originalDisplay) {
            img.dataset.originalDisplay = window.getComputedStyle(img).display;
          }

          const altContainer = document.createElement("div");
          altContainer.className = "a11y-image-alt-container";
          altContainer.innerHTML = `
          <div class="a11y-image-disabled-notice">Image disabled in accessibility mode</div>
          <div class="a11y-image-alt-text">${
            img.alt || "No description available"
          }</div>
        `;

          img.insertAdjacentElement("beforebegin", altContainer);
          img.style.display = "none";
        });
    } else {
      console.log("Restoring images in main");

      main
        .querySelectorAll(".a11y-image-alt-container")
        .forEach((container) => {
          const img = container.nextElementSibling;
          if (img && img.tagName === "IMG") {
            img.style.display = img.dataset.originalDisplay || "block";
            img.classList.remove("a11y-processed");
          }
          container.remove();
        });
    }
  }

  function applySettings() {
    console.log("Applying all settings");
    applyCurrentSettings();
    saveSettings();
    toggleModal(false);
  }

  function resetSettings() {
    console.log("Resetting all settings");

    state.settings = {
      fontSize: null,
      colorScheme: "default",
      hideImages: false,
      initialized: true,
    };
    document.body.classList.remove("a11y-font-changed");
    const header = document.querySelector("header");
    if (header) {
      header.classList.remove("header-flex-wrap");
    }
    if (state.elements.imageToggle) {
      state.elements.imageToggle.checked = true;
    }

    if (state.elements.fontButtons) {
      state.elements.fontButtons.forEach((btn) =>
        btn.classList.remove("active")
      );
      const mediumBtn = Array.from(state.elements.fontButtons).find(
        (btn) => btn.dataset.size === "medium"
      );
      if (mediumBtn) mediumBtn.classList.add("active");
    }

    if (state.elements.colorButtons) {
      state.elements.colorButtons.forEach((btn) =>
        btn.classList.remove("active")
      );
      const defaultBtn = Array.from(state.elements.colorButtons).find(
        (btn) => btn.dataset.scheme === "default"
      );
      if (defaultBtn) defaultBtn.classList.add("active");
    }

    restoreOriginalStyles();
    updateCSSCustomProperties("default");
    handleImages();
    localStorage.removeItem(config.localStorageKey);
    toggleModal(false);
  }

  function saveSettings() {
    localStorage.setItem(
      config.localStorageKey,
      JSON.stringify({
        fontSize: state.settings.fontSize,
        colorScheme: state.settings.colorScheme,
        hideImages: state.settings.hideImages,
      })
    );
    console.log("Settings saved to localStorage");
  }

  if (document.readyState === "complete") {
    initialize();
  } else {
    window.addEventListener("load", initialize);
    document.addEventListener("DOMContentLoaded", initialize);
  }

  document.addEventListener("headerLoaded", initialize);
});
