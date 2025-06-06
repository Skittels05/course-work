document.addEventListener("DOMContentLoaded", () => {
  const productsContainer = document.getElementById("products-container");
  const searchInput = document.getElementById("search-input");
  const apiUrl = "http://localhost:3000/products";
  let currentPage = 1;
  let totalPages = 1;
  const itemsPerPage = 6;
  const maxVisiblePages = 4;
  let currentSortField = "";
  let currentSortOrder = "";
  const firstPageBtn = document.getElementById("first-page");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const lastPageBtn = document.getElementById("last-page");
  const pageNumbersContainer = document.getElementById("page-numbers");
  const filterToggle = document.getElementById("filter-toggle");
  const filtersSidebar = document.getElementById("filters-sidebar");
  const closeFilters = document.getElementById("close-filters");
  const overlay = document.getElementById("overlay");
  const applyFiltersBtn = document.getElementById("apply-filters");

  let allCategories = [];
  let categoryTranslationMap = new Map(); // Для хранения соответствия исходных и переведенных категорий

  function getTranslatedProductField(product, field) {
    const lang = window.i18n?.currentLang || 'en';
    const translatedField = `ru_${field}`;
    const result = (lang === 'ru' && product[translatedField]) ? product[translatedField] : product[field];
    console.log("Translating:", { product, field, lang, result });
    return result;
  }

  function getTranslation(key, fallback) {
    const value = window.i18n?.getTranslation(window.i18n.translations.shop, key) || fallback;
    console.log(`Translation for ${key}: ${value}`);
    return value;
  }

  async function loadFilterData() {
    try {
      const lang = window.i18n?.currentLang || 'en';
      const response = await fetch(`${apiUrl}?lang=${lang}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const data = await response.json();
      console.log("Loaded data for filters:", data);

      const products = Array.isArray(data) ? data : data.products || [];
      // Формируем allCategories и map для соответствия переведенных и исходных категорий
      categoryTranslationMap.clear();
      allCategories = [...new Set(products.map(p => {
        const originalCategory = p.category;
        const translatedCategory = getTranslatedProductField(p, 'category');
        categoryTranslationMap.set(translatedCategory, originalCategory);
        return translatedCategory;
      }))];
      console.log("Categories and translation map:", { allCategories, categoryTranslationMap });

      generateCategoryFilters(products);

      const prices = products.map((product) => product.price);
      const minPrice = Math.min(...prices) || 0;
      const maxPrice = Math.max(...prices) || 150;

      document.getElementById("min-price").value = minPrice;
      document.getElementById("max-price").value = maxPrice;
      document.getElementById("price-slider-min").min = minPrice;
      document.getElementById("price-slider-min").max = maxPrice;
      document.getElementById("price-slider-min").value = minPrice;
      document.getElementById("price-slider-max").min = minPrice;
      document.getElementById("price-slider-max").max = maxPrice;
      document.getElementById("price-slider-max").value = maxPrice;

      updateRange();
      fetchProducts();
    } catch (error) {
      console.error("Error loading filter data:", error);
      productsContainer.innerHTML = `<p>${getTranslation("products.errors.load_products", "Error loading products. Please try again later.")}</p>`;
    }
  }

  function updateRange() {
    const minSlider = document.getElementById("price-slider-min");
    const maxSlider = document.getElementById("price-slider-max");
    const minPercent = (minSlider.value / minSlider.max) * 100;
    const maxPercent = (maxSlider.value / maxSlider.max) * 100;

    document.querySelector(".active-range").style.cssText = `
      left: ${minPercent}%;
      right: ${100 - maxPercent}%;
    `;
  }

  async function fetchProducts() {
    console.log("Fetching products, currentPage:", currentPage);
    const searchTerm = searchInput.value.trim().toLowerCase();
    const checkedCategories = Array.from(
      document.querySelectorAll('input[name="category"]:checked')
    ).map((el) => categoryTranslationMap.get(el.value) || el.value); // Используем исходные категории
    const minPrice = parseFloat(document.getElementById("min-price").value);
    const maxPrice = parseFloat(document.getElementById("max-price").value);
    const lang = window.i18n?.currentLang || 'en';

    const params = new URLSearchParams({
      _page: currentPage,
      _limit: itemsPerPage,
      _sort: currentSortField,
      _order: currentSortOrder,
      lang: lang,
    });

    if (searchTerm) {
      params.append('q', searchTerm);
    }
    if (minPrice > 0) {
      params.append('price_gte', minPrice);
    }
    if (maxPrice < 150) {
      params.append('price_lte', maxPrice);
    }
    if (checkedCategories.length > 0 && checkedCategories.length < allCategories.length) {
      checkedCategories.forEach(category => {
        params.append('category', category.trim());
      });
      console.log("Selected categories (original):", checkedCategories);
    } else if (checkedCategories.length === 0) {
      console.log("No categories selected");
    }

    console.log("Request URL:", `${apiUrl}?${params.toString()}`);
    try {
      const response = await fetch(`${apiUrl}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      const data = await response.json();
      console.log("Server response:", data);

      let paginatedProducts = Array.isArray(data) ? data : data.products || [];
      const totalItems = parseInt(response.headers.get('X-Total-Count')) || paginatedProducts.length;
      totalPages = Math.ceil(totalItems / itemsPerPage);

      console.log("Fetched products:", paginatedProducts.length, "totalPages:", totalPages, "totalItems:", totalItems);
      updatePagination(totalItems);
      displayProducts(paginatedProducts);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error fetching products:", error);
      productsContainer.innerHTML = `<p>${getTranslation("products.errors.load_products", "Error loading products. Please try again later.")}</p>`;
    }
  }

  async function checkFavorite(productId) {
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));
    if (!authUser) return false;

    try {
      const response = await fetch(
        `http://localhost:3000/favorites?productId=${productId}&userId=${authUser.id}`
      );
      const favorites = await response.json();
      return favorites.length > 0;
    } catch (error) {
      console.error("Error checking favorites:", error);
      return false;
    }
  }

  async function displayProducts(products) {
    console.log("Displaying products:", products);
    const productsHTML = await Promise.all(
      products.map(async (product) => {
        const isFavorite = await checkFavorite(product.id);
        const name = getTranslatedProductField(product, 'name');
        const description = getTranslatedProductField(product, 'description');
        const category = getTranslatedProductField(product, 'category');
        console.log("Rendered product:", { id: product.id, name, description, category, isFavorite });
        return `
          <div class="product-card" data-id="${product.id}">
            <button class="favorite-btn ${isFavorite ? "active" : ""}" data-id="${product.id}">
              <i class="${isFavorite ? "fas" : "far"} fa-heart"></i>
            </button>
            <a href="../product/index.html?id=${product.id}" class="product-image-link">
              <img src="../assets/shop/${product.id}.jpg" alt="${name}" 
                   class="product-image" onerror="this.src='../assets/shop/placeholder.jpg'">
            </a>
            <div class="product-info">
              <h3 class="product-title">${name}</h3>
              <p>${description}</p>
              <div class="product-meta">
                <span class="product-category">${category}</span>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-rating">${
                  product.rating || product.rating === 0
                    ? `★ ${product.rating.toFixed(1)}`
                    : ""
                }</div>
              </div>
              <button class="add-to-cart">
                <span data-i18n="products.add_to_cart">Add to Cart</span>
              </button>
            </div>
          </div>
        `;
      })
    );

    console.log("Generated HTML array:", productsHTML);
    productsContainer.innerHTML =
      productsHTML.join("") || `<p class="no-results"><span data-i18n="products.no_results">No products found</span></p>`;
    console.log("Set HTML to container:", productsContainer.innerHTML);

    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", addToCart);
    });

    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      btn.addEventListener("click", toggleFavorite);
    });

    if (window.i18n) {
      window.i18n.applyTranslations('shop');
      console.log("Applied translations to dynamically created elements");
    }
  }

  async function toggleFavorite(event) {
    event.stopPropagation();
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));
    if (!authUser) {
      window.location.href = "../login/index.html";
      return;
    }

    const btn = event.currentTarget;
    const productId = btn.closest(".product-card").dataset.id;
    const heartIcon = btn.querySelector("i");
    const isCurrentlyFavorite = btn.classList.contains("active");

    try {
      if (isCurrentlyFavorite) {
        const favoritesResponse = await fetch(
          `http://localhost:3000/favorites?productId=${productId}&userId=${authUser.id}`
        );
        const favorites = await favoritesResponse.json();

        if (favorites.length > 0) {
          await fetch(`http://localhost:3000/favorites/${favorites[0].id}`, {
            method: "DELETE",
          });
        }
      } else {
        await fetch("http://localhost:3000/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: +productId,
            userId: authUser.id,
          }),
        });
      }

      btn.classList.toggle("active");
      heartIcon.classList.toggle("far");
      heartIcon.classList.toggle("fas");
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  }

  function setupSorting() {
    const sortContainer = document.querySelector(".sort-button");
    sortContainer.innerHTML = '';

    const sortDropdown = document.createElement("div");
    sortDropdown.className = "sort-dropdown";

    const sortButton = document.createElement("button");
    sortButton.id = "sort-toggle";
    sortButton.innerHTML = `<i class="fas fa-sort"></i> <span data-i18n="sort.button">${getTranslation("sort.button", "Sort")}</span>`;

    const sortOptions = document.createElement("div");
    sortOptions.className = "sort-options";

    const sortCriteria = [
      { name: getTranslation("sort.options.0.name", "Name (A-Z)"), value: "name", order: "asc" },
      { name: getTranslation("sort.options.1.name", "Name (Z-A)"), value: "name", order: "desc" },
      { name: getTranslation("sort.options.2.name", "Price (Low to High)"), value: "price", order: "asc" },
      { name: getTranslation("sort.options.3.name", "Price (High to Low)"), value: "price", order: "desc" },
      { name: getTranslation("sort.options.4.name", "Rating (Best first)"), value: "rating", order: "desc" },
      { name: getTranslation("sort.options.5.name", "Rating (Worst first)"), value: "rating", order: "asc" }
    ];

    sortCriteria.forEach((criterion, index) => {
      const option = document.createElement("div");
      option.className = "sort-option";
      option.innerHTML = `<span data-i18n="sort.options.${index}.name">${criterion.name}</span>`;
      option.addEventListener("click", () => {
        applySort(criterion.value, criterion.order);
        sortButton.innerHTML = `<i class="fas fa-sort"></i> <span data-i18n="sort.options.${index}.name">${criterion.name}</span>`;
        if (window.i18n) {
          window.i18n.applyTranslations('shop');
          console.log("Applied translations after sort option click");
        }
      });
      sortOptions.appendChild(option);
    });

    sortDropdown.appendChild(sortButton);
    sortDropdown.appendChild(sortOptions);
    sortContainer.appendChild(sortDropdown);

    sortButton.addEventListener("click", (e) => {
      e.stopPropagation();
      sortOptions.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      sortOptions.classList.remove("active");
    });

    if (window.i18n) {
      window.i18n.applyTranslations('shop');
      console.log("Applied translations after setupSorting");
    }
  }

  function applySort(field, order) {
    currentSortField = field;
    currentSortOrder = order;
    resetToFirstPage();
  }

  function setupPagination() {
    firstPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage = 1;
        fetchProducts();
      }
    });
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchProducts();
      }
    });
    nextPageBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchProducts();
      }
    });
    lastPageBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage = totalPages;
        fetchProducts();
      }
    });
  }

  function updatePagination(totalItems) {
    totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    console.log("Pagination data:", { totalItems, totalPages, currentPage });
    pageNumbersContainer.innerHTML = "";

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;

    if (totalPages <= 1) {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = 1;
      pageBtn.className = "active";
      pageNumbersContainer.appendChild(pageBtn);
    } else {
      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.textContent = i;
        pageBtn.className = i === currentPage ? "active" : "";
        pageBtn.addEventListener("click", () => {
          currentPage = i;
          fetchProducts();
        });
        pageNumbersContainer.appendChild(pageBtn);
      }
    }

    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;

    pageNumbersContainer.style.display = 'flex';
    pageNumbersContainer.parentElement.style.display = 'flex';
  }

  function generateCategoryFilters(products) {
    const categoryFiltersContainer = document.querySelector(".category-filters");
    const lang = window.i18n?.currentLang || 'en';

    categoryFiltersContainer.innerHTML = "";

    allCategories.forEach(category => {
      const productWithCategory = products.find(p => {
        const productCategory = lang === 'ru' ? (p.ru_category || p.category) : p.category;
        return productCategory === categoryTranslationMap.get(category) || productCategory === category;
      });

      const categoryName = productWithCategory ? getTranslatedProductField(productWithCategory, 'category') : category;

      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" name="category" value="${category}" ${lang === 'ru' ? '' : 'checked'}>
        <span data-i18n="category.${categoryTranslationMap.get(category) || category}">${categoryName}</span>
      `;
      categoryFiltersContainer.appendChild(label);
    });

    if (window.i18n) {
      window.i18n.applyTranslations('shop');
      console.log("Applied translations to category filters");
    }

    document.querySelectorAll('input[name="category"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        resetToFirstPage();
      });
    });
  }

  function setupFilters() {
    filterToggle.addEventListener("click", () => {
      filtersSidebar.classList.add("active");
      overlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    function closeSidebar() {
      filtersSidebar.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    }

    closeFilters.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);
    applyFiltersBtn.addEventListener("click", () => {
      resetToFirstPage();
      closeSidebar();
    });

    const minPriceInput = document.getElementById("min-price");
    const maxPriceInput = document.getElementById("max-price");
    const minSlider = document.getElementById("price-slider-min");
    const maxSlider = document.getElementById("price-slider-max");

    minSlider.addEventListener("input", () => {
      let value = parseFloat(minSlider.value);
      if (value > parseFloat(maxSlider.value)) {
        value = parseFloat(maxSlider.value);
        minSlider.value = value;
      }
      minPriceInput.value = value.toFixed(2);
      updateRange();
      resetToFirstPage();
    });

    maxSlider.addEventListener("input", () => {
      let value = parseFloat(maxSlider.value);
      if (value < parseFloat(minSlider.value)) {
        value = parseFloat(minSlider.value);
        maxSlider.value = value;
      }
      maxPriceInput.value = value.toFixed(2);
      updateRange();
      resetToFirstPage();
    });

    minPriceInput.addEventListener("change", () => {
      let value = parseFloat(minPriceInput.value);
      if (value > parseFloat(maxPriceInput.value)) {
        value = parseFloat(maxPriceInput.value);
        minPriceInput.value = value;
      }
      minSlider.value = value;
      updateRange();
      resetToFirstPage();
    });

    maxPriceInput.addEventListener("change", () => {
      let value = parseFloat(maxPriceInput.value);
      if (value < parseFloat(minPriceInput.value)) {
        value = parseFloat(minPriceInput.value);
        maxPriceInput.value = value;
      }
      maxSlider.value = value;
      updateRange();
      resetToFirstPage();
    });
  }

  function setupSearch() {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(resetToFirstPage, 500);
    });
  }

  document.getElementById("reset-filters").addEventListener("click", () => {
    document.querySelectorAll('input[name="category"]').forEach((checkbox) => {
      checkbox.checked = true;
    });

    const minPriceInput = document.getElementById("min-price");
    const maxPriceInput = document.getElementById("max-price");
    const minSlider = document.getElementById("price-slider-min");
    const maxSlider = document.getElementById("price-slider-max");
    minPriceInput.value = minSlider.min;
    maxPriceInput.value = maxSlider.max;
    minSlider.value = minSlider.min;
    maxSlider.value = maxSlider.max;

    updateRange();
    currentSortField = "";
    currentSortOrder = "";
    resetToFirstPage();
  });

  function resetToFirstPage() {
    currentPage = 1;
    fetchProducts();
  }

  async function addToCart(event) {
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));
    if (!authUser) {
      sessionStorage.setItem("returnUrl", window.location.href);
      window.location.href = "../login/index.html";
      return;
    }

    const productId = event.target.closest(".product-card").dataset.id;
    try {
      const response = await fetch("http://localhost:3000/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: +productId,
          quantity: 1,
          userId: authUser.id,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.status}`);
      }
      alert(getTranslation("products.errors.cart_success", "Added to cart!"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(getTranslation("products.errors.add_to_cart", "Error adding to cart. Please try again."));
    }
  }

  function handleLanguageChange() {
    console.log("Language changed, applying translations...");
    if (window.i18n) {
      window.i18n.applyTranslations('shop');
    }
    setupSorting();
    loadFilterData();
    fetchProducts();
  }

  function init() {
    console.log("Initializing app...");
    setupSearch();
    setupSorting();
    setupFilters();
    setupPagination();
    loadFilterData();

    window.addEventListener('languageChanged', handleLanguageChange);

    if (window.i18n) {
      window.i18n.applyTranslations('shop');
      console.log("Initial translations applied");
    }
  }

  init();
});