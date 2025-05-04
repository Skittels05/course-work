document.addEventListener('DOMContentLoaded', () => {
  const productsContainer = document.getElementById('products-container');
  const searchInput = document.getElementById('search-input');
  const apiUrl = 'http://localhost:3000/products';
  let currentSortState = 'neutral';

  // Функция для загрузки продуктов с сервера с параметрами
  function fetchProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${apiUrl}?${queryString}` : apiUrl;

    fetch(url)
      .then(response => response.json())
      .then(products => {
        // Добавляем путь к изображению
        products.forEach(product => {
          product.image = `../assets/shop/${product.id}.jpg`;
        });
        displayProducts(products);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
      });
  }

  // Инициальная загрузка продуктов
  fetchProducts();

  // Поиск товаров
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm.length >= 2) {
      fetchProducts({ q: searchTerm });
    } else if (searchTerm.length === 0) {
      fetchProducts();
    }
  });

  // Настройка кнопки сортировки
  function setupSortButton() {
    const sortToggle = document.getElementById('sort-toggle');
    
    sortToggle.addEventListener('click', () => {
      // Циклически меняем состояния
      switch(currentSortState) {
        case 'neutral':
          currentSortState = 'asc';
          sortToggle.classList.add('asc');
          sortToggle.classList.remove('desc', 'neutral');
          fetchProducts({ _sort: 'price', _order: 'asc' });
          break;
        case 'asc':
          currentSortState = 'desc';
          sortToggle.classList.add('desc');
          sortToggle.classList.remove('asc', 'neutral');
          fetchProducts({ _sort: 'price', _order: 'desc' });
          break;
        case 'desc':
          currentSortState = 'neutral';
          sortToggle.classList.add('neutral');
          sortToggle.classList.remove('asc', 'desc');
          fetchProducts(); // Загружаем без сортировки
          break;
      }
    });
  }

  // Инициализация кнопки сортировки
  setupSortButton();

  // Отображение товаров
  function displayProducts(products) {
    if (products.length === 0) {
      productsContainer.innerHTML = '<p class="no-results">No products found matching your search.</p>';
      return;
    }

    productsContainer.innerHTML = products.map(product => `
      <div class="product-card" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="product-image">
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

    // Добавляем обработчики для кнопок
    document.querySelectorAll('.add-to-cart').forEach(button => {
      button.addEventListener('click', addToCart);
    });
  }

  // Функция добавления в корзину
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
});