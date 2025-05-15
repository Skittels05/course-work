document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'http://localhost:3000';
    const authUser = JSON.parse(sessionStorage.getItem('authUser'));
    
    // Проверка прав администратора
    if (!authUser || authUser.role !== 'admin') {
        window.location.href = '../login/index.html';
        return;
    }

    // Элементы управления
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const productForm = document.getElementById('product-form');
    const productsTable = document.getElementById('products-table').querySelector('tbody');
    const reviewsTable = document.getElementById('reviews-table').querySelector('tbody');
    const filterProduct = document.getElementById('filter-product');
    const filterUser = document.getElementById('filter-user');

    // Переключение вкладок
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Загрузка продуктов
    async function loadProducts() {
        try {
            const response = await fetch(`${apiUrl}/products`);
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    function renderProducts(products) {
        productsTable.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.category}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${product.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${product.id}">Delete</button>
                </td>
            `;
            productsTable.appendChild(row);
        });

        // Обработчики для кнопок
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => editProduct(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    }

    // Загрузка отзывов
    async function loadReviews(productId = '', userId = '') {
        try {
            let url = `${apiUrl}/feedbacks`;
            if (productId) url += `?productId=${productId}`;
            if (userId) url += `?userId=${userId}`;
            
            const response = await fetch(url);
            const reviews = await response.json();
            renderReviews(reviews);
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }

    async function renderReviews(reviews) {
        reviewsTable.innerHTML = '';
        
        // Получаем дополнительные данные (имена продуктов и пользователей)
        const productsResponse = await fetch(`${apiUrl}/products`);
        const products = await productsResponse.json();
        
        const usersResponse = await fetch(`${apiUrl}/users`);
        const users = await usersResponse.json();

        reviews.forEach(review => {
            const product = products.find(p => p.id == review.productId);
            const user = users.find(u => u.id == review.userId);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${review.id}</td>
                <td>${product?.name || 'Unknown'}</td>
                <td>${user ? `${user.firstName} ${user.lastName}` : 'Unknown'}</td>
                <td>${'★'.repeat(review.rating)}</td>
                <td>${new Date(review.date).toLocaleDateString()}</td>
                <td>
                    <button class="action-btn delete-btn" data-id="${review.id}">Delete</button>
                </td>
            `;
            reviewsTable.appendChild(row);
        });

        // Обработчики для кнопок удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteReview(btn.dataset.id));
        });
    }

    // Загрузка фильтров
    async function loadFilters() {
        try {
            const productsResponse = await fetch(`${apiUrl}/products`);
            const products = await productsResponse.json();
            
            const usersResponse = await fetch(`${apiUrl}/users`);
            const users = await usersResponse.json();

            // Заполняем фильтр продуктов
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                filterProduct.appendChild(option);
            });

            // Заполняем фильтр пользователей
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.firstName} ${user.lastName}`;
                filterUser.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    }

    // Обработчики фильтров
    filterProduct.addEventListener('change', () => {
        loadReviews(filterProduct.value, filterUser.value);
    });

    filterUser.addEventListener('change', () => {
        loadReviews(filterProduct.value, filterUser.value);
    });

    // Управление продуктами
    async function editProduct(id) {
        try {
            const response = await fetch(`${apiUrl}/products/${id}`);
            const product = await response.json();
            
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-stock').value = product.stock;
            
            document.getElementById('save-product').textContent = 'Update Product';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Error editing product:', error);
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        try {
            await fetch(`${apiUrl}/products/${id}`, { method: 'DELETE' });
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }

    // Управление отзывами
    async function deleteReview(id) {
        if (!confirm('Are you sure you want to delete this review?')) return;
        
        try {
            await fetch(`${apiUrl}/feedbacks/${id}`, { method: 'DELETE' });
            loadReviews(filterProduct.value, filterUser.value);
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    }

    // Валидация формы продукта
    productForm.addEventListener('input', validateProductForm);
    
    function validateProductForm() {
        let isValid = true;
        
        // Проверка имени
        if (document.getElementById('product-name').value.trim().length < 3) {
            document.getElementById('name-error').textContent = 'Name must be at least 3 characters';
            document.getElementById('name-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('name-error').style.display = 'none';
        }
        
        // Проверка цены
        if (document.getElementById('product-price').value <= 0) {
            document.getElementById('price-error').textContent = 'Price must be greater than 0';
            document.getElementById('price-error').style.display = 'block';
            isValid = false;
        } else {
            document.getElementById('price-error').style.display = 'none';
        }
        
        // Аналогичные проверки для других полей...
        
        document.getElementById('save-product').disabled = !isValid;
    }

    // Отправка формы продукта
    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('product-name').value,
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            description: document.getElementById('product-description').value,
            stock: parseInt(document.getElementById('product-stock').value)
        };
        
        const productId = document.getElementById('product-id').value;
        const method = productId ? 'PUT' : 'POST';
        const url = productId ? `${apiUrl}/products/${productId}` : `${apiUrl}/products`;
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                productForm.reset();
                document.getElementById('save-product').textContent = 'Save Product';
                loadProducts();
                alert('Product saved successfully!');
            } else {
                throw new Error('Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error saving product. Please try again.');
        }
    });

    // Сброс формы
    document.getElementById('reset-form').addEventListener('click', () => {
        productForm.reset();
        document.getElementById('save-product').textContent = 'Save Product';
    });

    // Инициализация
    loadProducts();
    loadReviews();
    loadFilters();
});