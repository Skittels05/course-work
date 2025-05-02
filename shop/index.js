document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('products-container');
    const apiUrl = 'http://localhost:3000/products';
  
    // Получаем товары с сервера
    fetch(apiUrl)
      .then(response => response.json())
      .then(products => {
        displayProducts(products);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
      });
  
    // Отображаем товары
    function displayProducts(products) {
      productsContainer.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" class="product-image">
          <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
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