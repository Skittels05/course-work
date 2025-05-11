document.addEventListener('DOMContentLoaded', () => {
  const productsContainer = document.getElementById('products-container');
  const searchInput = document.getElementById('search-input');
  const apiUrl = 'http://localhost:3000/products';
  let currentPage = 1;
  let totalPages = 1;
  const itemsPerPage = 6;
  const maxVisiblePages = 5;
  let currentSortField = '';
  let currentSortOrder = '';
  const firstPageBtn = document.getElementById('first-page');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const lastPageBtn = document.getElementById('last-page');
  const pageNumbersContainer = document.getElementById('page-numbers');
  const filterToggle = document.getElementById('filter-toggle');
  const filtersSidebar = document.getElementById('filters-sidebar');
  const closeFilters = document.getElementById('close-filters');
  const overlay = document.getElementById('overlay');
  const applyFiltersBtn = document.getElementById('apply-filters');
  function buildUrl() {
    let url = apiUrl + `?_page=${currentPage}&_limit=${itemsPerPage}&`;
    const params = [];

    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      params.push(`q=${encodeURIComponent(searchTerm)}`);
    }

    if (currentSortField && currentSortOrder) {
      params.push(`_sort=${currentSortField}&_order=${currentSortOrder}`);
    }

    const checkedCategories = Array.from(
      document.querySelectorAll('input[name="category"]:checked')
    ).map(el => el.value);
    
    checkedCategories.forEach(category => {
      params.push(`category=${encodeURIComponent(category)}`);
    });

    const minPrice = parseInt(document.getElementById('min-price').value) || 0;
    const maxPrice = parseInt(document.getElementById('max-price').value) || 150;
    
    if (minPrice > 0) params.push(`price_gte=${minPrice}`);
    if (maxPrice < 150) params.push(`price_lte=${maxPrice}`);
    
    return url + params.join('&');
  }

  function fetchProducts() {
    const url = buildUrl();
    fetch(url)
      .then(response => {
        const totalItems = parseInt(response.headers.get('X-Total-Count')) || 0;
        totalPages = Math.ceil(totalItems / itemsPerPage);
        updatePagination(totalItems);
        return response.json();
      })
      .then(products => {
        displayProducts(products);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(error => {
        console.error('Error:', error);
        productsContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
      });
  }

  function displayProducts(products) {
    productsContainer.innerHTML = products?.length ? products.map(product => `
      <div class="product-card" data-id="${product.id}">
        <img src="../assets/shop/${product.id}.jpg" alt="${product.name}" 
             class="product-image" onerror="this.src='../assets/shop/placeholder.jpg'">
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p>${product.description}</p>
          <div class="product-meta">
            <span class="product-category">${product.category}</span>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            ${product.rating ? `<div class="product-rating">★ ${product.rating.toFixed(1)}</div>` : ''}
          </div>
          <button class="add-to-cart">Add to Cart</button>
        </div>
      </div>
    `).join('') : '<p class="no-results">No products found</p>';
    document.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', addToCart);
    });
  }

  function setupSorting() {
    const sortDropdown = document.createElement('div');
    sortDropdown.className = 'sort-dropdown';
    
    const sortButton = document.getElementById('sort-toggle');
    sortButton.innerHTML = '<i class="fas fa-sort"></i> Sort';
    
    const sortOptions = document.createElement('div');
    sortOptions.className = 'sort-options';
    
    const sortCriteria = [
      { name: 'Name (A-Z)', value: 'name', order: 'asc' },
      { name: 'Name (Z-A)', value: 'name', order: 'desc' },
      { name: 'Price (Low to High)', value: 'price', order: 'asc' },
      { name: 'Price (High to Low)', value: 'price', order: 'desc' },
      { name: 'Rating (Best first)', value: 'rating', order: 'desc' },
      { name: 'Rating (Worst first)', value: 'rating', order: 'asc' }
    ];

    sortCriteria.forEach(criterion => {
      const option = document.createElement('div');
      option.className = 'sort-option';
      option.textContent = criterion.name;
      option.addEventListener('click', () => {
        applySort(criterion.value, criterion.order);
        sortButton.innerHTML = `<i class="fas fa-sort"></i> ${criterion.name}`;
        sortOptions.classList.remove('active');
      });
      sortOptions.appendChild(option);
    });

    sortDropdown.appendChild(sortButton);
    sortDropdown.appendChild(sortOptions);
    document.querySelector('.right_container').prepend(sortDropdown);

    sortButton.addEventListener('click', (e) => {
      e.stopPropagation();
      sortOptions.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      sortOptions.classList.remove('active');
    });
  }
  function applySort(field, order) {
    currentSortField = field;
    currentSortOrder = order;
    resetToFirstPage();
  }
  function setupPagination() {
    firstPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage = 1;
        fetchProducts();
      }
    });
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchProducts();
      }
    });
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchProducts();
      }
    });
    lastPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage = totalPages;
        fetchProducts();
      }
    });
  }

  function updatePagination(totalItems) {
    totalPages = Math.ceil(totalItems / itemsPerPage);
    pageNumbersContainer.innerHTML = '';
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        fetchProducts();
      });
      pageNumbersContainer.appendChild(pageBtn);
    }
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
  }

  function setupFilters() {
    filterToggle.addEventListener('click', () => {
      filtersSidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    function closeSidebar() {
      filtersSidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    closeFilters.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    applyFiltersBtn.addEventListener('click', () => {
      resetToFirstPage();
      closeSidebar();
    });

    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const minSlider = document.getElementById('price-slider-min');
    const maxSlider = document.getElementById('price-slider-max');

    function updateRange() {
      const minPercent = (minSlider.value / minSlider.max) * 100;
      const maxPercent = (maxSlider.value / maxSlider.max) * 100;
      document.querySelector('.active-range').style.cssText = `
        left: ${minPercent}%;
        right: ${100 - maxPercent}%;
      `;
    }
    minSlider.addEventListener('input', () => {
      minPriceInput.value = minSlider.value;
      if (+minSlider.value > +maxSlider.value) {
        maxSlider.value = minSlider.value;
        maxPriceInput.value = minSlider.value;
      }
      updateRange();
    });
    maxSlider.addEventListener('input', () => {
      maxPriceInput.value = maxSlider.value;
      if (+maxSlider.value < +minSlider.value) {
        minSlider.value = maxSlider.value;
        minPriceInput.value = maxSlider.value;
      }
      updateRange();
    });
    minPriceInput.addEventListener('change', resetToFirstPage);
    maxPriceInput.addEventListener('change', resetToFirstPage);
  }

  function setupSearch() {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(resetToFirstPage, 500);
    });
  }

  document.getElementById('reset-filters').addEventListener('click', () => {
    document.querySelectorAll('input[name="category"]').forEach(checkbox => {
      checkbox.checked = true;
    });
    document.getElementById('min-price').value = 0;
    document.getElementById('max-price').value = 150;
    document.getElementById('price-slider-min').value = 0;
    document.getElementById('price-slider-max').value = 150;
    resetToFirstPage();
  });

  function resetToFirstPage() {
    currentPage = 1;
    fetchProducts();
  }

  function addToCart(event) {
    const productId = event.target.closest('.product-card').dataset.id;
    fetch('http://localhost:3000/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: +productId, quantity: 1 })
    })
    .then(response => response.json())
    .then(() => alert('Added to cart!'))
    .catch(error => console.error('Error:', error));
  }

  setupSearch();
  setupSorting();
  setupFilters();
  setupPagination();
  fetchProducts();
});