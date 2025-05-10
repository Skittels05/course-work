document.addEventListener('DOMContentLoaded', () => {
  const productsContainer = document.getElementById('products-container');
  const searchInput = document.getElementById('search-input');
  const apiUrl = 'http://localhost:3000/products';
  let currentSortState = 'neutral';

  const filterToggle = document.getElementById('filter-toggle');
  const filtersSidebar = document.getElementById('filters-sidebar');
  const closeFilters = document.getElementById('close-filters');
  const overlay = document.getElementById('overlay');
  const applyFiltersBtn = document.getElementById('apply-filters');

  function buildUrl() {
    let url = apiUrl + '?';
    const params = [];

    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
      params.push(`name_like=${encodeURIComponent(searchTerm)}`);
    }
    
    if (currentSortState !== 'neutral') {
      params.push(`_sort=price&_order=${currentSortState === 'asc' ? 'asc' : 'desc'}`);
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
    console.log('Fetching URL:', url); 
    
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Network error');
        return response.json();
      })
      .then(products => {
        displayProducts(products);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
      });
  }

  function displayProducts(products) {
    if (!products || products.length === 0) {
      productsContainer.innerHTML = '<p class="no-results">No products found matching your criteria.</p>';
      return;
    }

    productsContainer.innerHTML = products.map(product => `
      <div class="product-card" data-id="${product.id}">
        <img src="../assets/shop/${product.id}.jpg" alt="${product.name}" class="product-image" 
             onerror="this.src='../assets/shop/placeholder.jpg'">
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p>${product.description}</p>
          <div class="product-meta">
            <span class="product-category">${product.category}</span>
            <div class="product-price">$${product.price.toFixed(2)}</div>
          </div>
          <button class="add-to-cart">Add to Cart</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', addToCart);
    });
  }

  function addToCart(event) {
    const productId = event.target.closest('.product-card').dataset.id;
    
    fetch('http://localhost:3000/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: parseInt(productId),
        quantity: 1
      })
    })
    .then(response => response.json())
    .then(data => {
      alert('Product added to cart!');
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
    });
  }

  filterToggle.addEventListener('click', () => {
    filtersSidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  closeFilters.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);

  function closeSidebar() {
    filtersSidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  function updateActiveRange() {
    const minSlider = document.getElementById('price-slider-min');
    const maxSlider = document.getElementById('price-slider-max');
    const activeRange = document.querySelector('.active-range');
    
    const minPercent = (minSlider.value / minSlider.max) * 100;
    const maxPercent = (maxSlider.value / maxSlider.max) * 100;
    
    activeRange.style.setProperty('--min-percent', `${minPercent}%`);
    activeRange.style.setProperty('--max-percent', `${maxPercent}%`);
  }

  function setupSortButton() {
    const sortToggle = document.getElementById('sort-toggle');
    
    sortToggle.addEventListener('click', () => {
      switch(currentSortState) {
        case 'neutral':
          currentSortState = 'asc';
          sortToggle.classList.add('asc');
          sortToggle.classList.remove('desc', 'neutral');
          break;
        case 'asc':
          currentSortState = 'desc';
          sortToggle.classList.add('desc');
          sortToggle.classList.remove('asc', 'neutral');
          break;
        case 'desc':
          currentSortState = 'neutral';
          sortToggle.classList.add('neutral');
          sortToggle.classList.remove('asc', 'desc');
          break;
      }
      fetchProducts();
    });
  }

  function setupPriceFilters() {
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const minSlider = document.getElementById('price-slider-min');
    const maxSlider = document.getElementById('price-slider-max');

    minSlider.addEventListener('input', () => {
      minPriceInput.value = minSlider.value;
      if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
        maxSlider.value = minSlider.value;
        maxPriceInput.value = minSlider.value;
      }
    minSlider.addEventListener('input', updateActiveRange);
    maxSlider.addEventListener('input', updateActiveRange);
    updateActiveRange(); 
    });

    maxSlider.addEventListener('input', () => {
      maxPriceInput.value = maxSlider.value;
      if (parseInt(maxSlider.value) < parseInt(minSlider.value)) {
        minSlider.value = maxSlider.value;
        minPriceInput.value = maxSlider.value;
      }
    });

    minPriceInput.addEventListener('change', () => {
      minSlider.value = minPriceInput.value;
      if (parseInt(minPriceInput.value) > parseInt(maxPriceInput.value)) {
        maxPriceInput.value = minPriceInput.value;
        maxSlider.value = minPriceInput.value;
      }
    });

    maxPriceInput.addEventListener('change', () => {
      maxSlider.value = maxPriceInput.value;
      if (parseInt(maxPriceInput.value) < parseInt(minPriceInput.value)) {
        minPriceInput.value = maxPriceInput.value;
        minSlider.value = maxPriceInput.value;
      }
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
    
    searchInput.value = '';
    currentSortState = 'neutral';
    const sortToggle = document.getElementById('sort-toggle');
    sortToggle.classList.add('neutral');
    sortToggle.classList.remove('asc', 'desc');
    
    fetchProducts();
  });

  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchProducts();
    }, 100);
  });

  applyFiltersBtn.addEventListener('click', () => {
    fetchProducts();
    closeSidebar();
  });

  fetchProducts();
  setupSortButton();
  setupPriceFilters();
});