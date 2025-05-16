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

  let allProducts = [];

  async function loadAllProducts() {
    console.log("Loading products from:", apiUrl);
    try {
      const response = await fetch(apiUrl);
      allProducts = await response.json();
      generateCategoryFilters();
      const prices = allProducts.map((product) => product.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

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
      console.error("Error loading products:", error);
      productsContainer.innerHTML =
        "<p>Error loading products. Please try again later.</p>";
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

  function fetchProducts() {
    let filteredProducts = [...allProducts];
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm)
      );
    }

    const checkedCategories = Array.from(
      document.querySelectorAll('input[name="category"]:checked')
    ).map((el) => el.value);

    if (checkedCategories.length > 0) {
      filteredProducts = filteredProducts.filter((product) =>
        checkedCategories.includes(product.category)
      );
    }

    const minPrice = parseFloat(document.getElementById("min-price").value);
    const maxPrice = parseFloat(document.getElementById("max-price").value);
    filteredProducts = filteredProducts.filter(
      (product) => product.price >= minPrice && product.price <= maxPrice
    );

    if (currentSortField && currentSortOrder) {
      filteredProducts.sort((a, b) => {
        if (currentSortField === "price" || currentSortField === "rating") {
          return currentSortOrder === "asc"
            ? a[currentSortField] - b[currentSortField]
            : b[currentSortField] - a[currentSortField];
        }
        if (a[currentSortField] < b[currentSortField]) {
          return currentSortOrder === "asc" ? -1 : 1;
        }
        if (a[currentSortField] > b[currentSortField]) {
          return currentSortOrder === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
    updatePagination(filteredProducts.length);

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    displayProducts(paginatedProducts);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    const productsHTML = await Promise.all(
      products.map(async (product) => {
        const isFavorite = await checkFavorite(product.id);

        return `
        <div class="product-card" data-id="${product.id}">
          <button class="favorite-btn ${isFavorite ? "active" : ""}" data-id="${
          product.id
        }">
            <i class="${isFavorite ? "fas" : "far"} fa-heart"></i>
          </button>
          <a href="../product/index.html?id=${
            product.id
          }" class="product-image-link">
            <img src="../assets/shop/${product.id}.jpg" alt="${product.name}" 
                 class="product-image" onerror="this.src='../assets/shop/placeholder.jpg'">
          </a>
          <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-meta">
              <span class="product-category">${product.category}</span>
              <div class="product-price">$${product.price.toFixed(2)}</div>
              <div class="product-rating">${
                product.rating || product.rating === 0
                  ? `★ ${product.rating.toFixed(1)}`
                  : ""
              }</div>
            </div>
            <button class="add-to-cart">Add to Cart</button>
          </div>
        </div>
      `;
      })
    );

    productsContainer.innerHTML =
      productsHTML.join("") || '<p class="no-results">No products found</p>';

    document.querySelectorAll(".add-to-cart").forEach((btn) => {
      btn.addEventListener("click", addToCart);
    });

    document.querySelectorAll(".favorite-btn").forEach((btn) => {
      btn.addEventListener("click", toggleFavorite);
    });
  }

  // Остальной код остается без изменений...
  async function toggleFavorite(event) {
    event.stopPropagation();
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));
    if (!authUser) {
      window.location.href = "../login/index.html";
      return;
    }

    const btn = event.currentTarget;
    const productId = btn.dataset.id;
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
    const sortDropdown = document.createElement("div");
    sortDropdown.className = "sort-dropdown";

    const sortButton = document.getElementById("sort-toggle");
    sortButton.innerHTML = '<i class="fas fa-sort"></i> Sort';

    const sortOptions = document.createElement("div");
    sortOptions.className = "sort-options";

    const sortCriteria = [
      { name: "Name (A-Z)", value: "name", order: "asc" },
      { name: "Name (Z-A)", value: "name", order: "desc" },
      { name: "Price (Low to High)", value: "price", order: "asc" },
      { name: "Price (High to Low)", value: "price", order: "desc" },
      { name: "Rating (Best first)", value: "rating", order: "desc" },
      { name: "Rating (Worst first)", value: "rating", order: "asc" },
    ];

    sortCriteria.forEach((criterion) => {
      const option = document.createElement("div");
      option.className = "sort-option";
      option.textContent = criterion.name;
      option.addEventListener("click", () => {
        applySort(criterion.value, criterion.order);
        sortButton.innerHTML = `<i class="fas fa-sort"></i> ${criterion.name}`;
        sortOptions.classList.remove("active");
      });
      sortOptions.appendChild(option);
    });

    sortDropdown.appendChild(sortButton);
    sortDropdown.appendChild(sortOptions);
    document.querySelector(".right_container").prepend(sortDropdown);

    sortButton.addEventListener("click", (e) => {
      e.stopPropagation();
      sortOptions.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      sortOptions.classList.remove("active");
    });
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
    totalPages = Math.ceil(totalItems / itemsPerPage);
    pageNumbersContainer.innerHTML = "";

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;

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

    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
  }

  function generateCategoryFilters() {
    const categoryFiltersContainer =
      document.querySelector(".category-filters");
    const allCategories = [...new Set(allProducts.map((p) => p.category))];

    categoryFiltersContainer.innerHTML = "";

    allCategories.forEach((category) => {
      const label = document.createElement("label");
      label.innerHTML = `
      <input type="checkbox" name="category" value="${category}" checked>
      ${category}
    `;
      categoryFiltersContainer.appendChild(label);
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

    minPriceInput.addEventListener("change", resetToFirstPage);
    maxPriceInput.addEventListener("change", resetToFirstPage);
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

    const prices = allProducts.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    document.getElementById("min-price").value = minPrice.toFixed(2);
    document.getElementById("max-price").value = maxPrice.toFixed(2);

    const minSlider = document.getElementById("price-slider-min");
    const maxSlider = document.getElementById("price-slider-max");
    minSlider.value = minPrice;
    maxSlider.value = maxPrice;

    updateRange();
    resetToFirstPage();
  });

  function resetToFirstPage() {
    currentPage = 1;
    fetchProducts();
  }

  function addToCart(event) {
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));
    if (!authUser) {
      sessionStorage.setItem("returnUrl", window.location.href);
      window.location.href = "../login/index.html";
      return;
    }

    const productId = event.target.closest(".product-card").dataset.id;
    fetch("http://localhost:3000/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: +productId,
        quantity: 1,
        userId: authUser.id,
      }),
    })
      .then((response) => response.json())
      .then(() => alert("Added to cart!"))
      .catch((error) => console.error("Error:", error));
  }

  setupSearch();
  setupSorting();
  setupFilters();
  setupPagination();
  loadAllProducts();
});