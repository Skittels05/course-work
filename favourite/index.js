document.addEventListener('DOMContentLoaded', () => {
    const authUser = JSON.parse(sessionStorage.getItem('authUser'));
    if (!authUser) {
        sessionStorage.setItem('returnUrl', window.location.href);
        window.location.href = '../login/index.html';
        return;
    }

    const favoritesContainer = document.getElementById('favorites-items');
    const apiUrl = 'http://localhost:3000';
    let favorites = [];
    let products = [];
    
    // Функция для получения переведенных полей продукта
    function getTranslatedProductField(product, field) {
        const lang = window.i18n?.currentLang || 'en';
        const translatedField = `ru_${field}`;
        return (lang === 'ru' && product[translatedField]) 
            ? product[translatedField] 
            : product[field];
    }

    async function loadFavoritesData() {
        try {
            const [favoritesResponse, productsResponse] = await Promise.all([
                fetch(`${apiUrl}/favorites?userId=${authUser.id}`),
                fetch(`${apiUrl}/products`)
            ]);
            favorites = await favoritesResponse.json();
            products = await productsResponse.json();
            displayFavoritesItems();
        } catch (error) {
            console.error('Error loading favorites data:', error);
            const message = getTranslation('errors.load_favorites') || 'Error loading favorites';
            favoritesContainer.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    function displayFavoritesItems() {
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-heart"></i>
                    <p data-i18n="favourite.empty_message">Your favorites list is empty</p>
                    <a href="../shop/index.html" class="continue-shopping" data-i18n="favourite.browse_products">Browse Products</a>
                </div>
            `;
            applyTranslations(favoritesContainer);
            return;
        }
        
        favoritesContainer.innerHTML = favorites.map(fav => {
            const product = products.find(p => p.id == fav.productId);
            if (!product) return '';
            
            // Используем переведенные поля
            const name = getTranslatedProductField(product, 'name');
            const category = getTranslatedProductField(product, 'category');
            
            return `
                <div class="favorite-item" data-id="${fav.id}">
                    <img src="../assets/shop/${product.id}.jpg" alt="${name}" 
                         onerror="this.src='../assets/shop/placeholder.jpg'">
                    <div class="favorite-item-info">
                        <h3>${name}</h3>
                        <p>${category}</p>
                        <div class="favorite-item-price">$${product.price.toFixed(2)}</div>
                        <div class="favorite-item-actions">
                            <button class="add-to-cart-btn" data-i18n="favourite.add_to_cart">Add to Cart</button>
                            <button class="remove-favorite-btn" data-i18n="[title]favourite.remove_title">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Применяем переводы для динамических элементов
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', addToCart);
            applyTranslation(btn, 'favourite.add_to_cart');
        });
        
        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
            btn.addEventListener('click', removeFavorite);
            const title = getTranslation('favourite.remove_title');
            if (title) btn.setAttribute('title', title);
        });
    }
    
    async function addToCart(e) {
        const itemElement = e.target.closest('.favorite-item');
        const favId = itemElement.dataset.id;
        const favorite = favorites.find(f => f.id == favId);
        
        try {
            const cartResponse = await fetch(`${apiUrl}/cart?productId=${favorite.productId}&userId=${authUser.id}`);
            const existingItems = await cartResponse.json();
            
            if (existingItems.length > 0) {
                await fetch(`${apiUrl}/cart/${existingItems[0].id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        quantity: existingItems[0].quantity + 1
                    })
                });
            } else {
                await fetch(`${apiUrl}/cart`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        productId: favorite.productId,
                        quantity: 1,
                        userId: authUser.id
                    })
                });
            }
            
            const message = getTranslation('favourite.added_to_cart') || 'Product added to cart!';
            alert(message);
        } catch (error) {
            console.error('Error adding to cart:', error);
            const message = getTranslation('favourite.add_to_cart_error') || 'Error adding to cart';
            alert(message);
        }
    }

    async function removeFavorite(e) {
        const itemElement = e.target.closest('.favorite-item');
        const favId = itemElement.dataset.id;
        
        try {
            await fetch(`${apiUrl}/favorites/${favId}`, {
                method: "DELETE"
            });
            
            favorites = favorites.filter(f => f.id != favId);
            displayFavoritesItems();
            
            const message = getTranslation('favourite.removed_from_favorites') || 'Removed from favorites';
            alert(message);
        } catch (error) {
            console.error('Error removing favorite:', error);
            const message = getTranslation('favourite.remove_favorite_error') || 'Error removing from favorites';
            alert(message);
        }
    }

    function getTranslation(key) {
        if (!window.i18n || !window.i18n.translations.favourite) return null;
        return key.split('.').reduce((o, k) => o?.[k], window.i18n.translations.favourite);
    }

    function applyTranslation(element, key) {
        const translation = getTranslation(key);
        if (translation) {
            if (element.hasAttribute('title')) {
                element.setAttribute('title', translation);
            } else {
                element.textContent = translation;
            }
        }
    }

    function applyTranslations(container) {
        if (!window.i18n) return;
        
        container.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = getTranslation(key);
            if (translation) {
                if (el.hasAttribute('title')) {
                    el.setAttribute('title', translation);
                } else {
                    el.textContent = translation;
                }
            }
        });
    }

    // Обработчик изменения языка
    window.addEventListener('languageChanged', () => {
        if (window.i18n) {
            window.i18n.applyTranslations('favourite');
            displayFavoritesItems(); // Перерисовываем элементы с новыми переводами
        }
    });

    loadFavoritesData();
});