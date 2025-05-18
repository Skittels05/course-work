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
        }
    }

    function displayFavoritesItems() {
        if (favorites.length === 0) {
            favoritesContainer.innerHTML = `
                <div class="empty-favorites">
                    <i class="fas fa-heart"></i>
                    <p data-i18n="empty_favorites.message">Your favorites list is empty</p>
                    <a href="../shop/index.html" class="continue-shopping" data-i18n="empty_favorites.browse_products">Browse Products</a>
                </div>
            `;
            applyTranslations(favoritesContainer);
            return;
        }
        
        favoritesContainer.innerHTML = favorites.map(fav => {
            const product = products.find(p => p.id == fav.productId);
            if (!product) return '';
            return `
                <div class="favorite-item" data-id="${fav.id}">
                    <img src="../assets/shop/${product.id}.jpg" alt="${product.name}" 
                         onerror="this.src='../assets/shop/placeholder.jpg'">
                    <div class="favorite-item-info">
                        <h3>${product.name}</h3>
                        <p>${product.category}</p>
                        <div class="favorite-item-price">$${product.price.toFixed(2)}</div>
                        <div class="favorite-item-actions">
                            <button class="add-to-cart-btn" data-i18n="buttons.add_to_cart">Add to Cart</button>
                            <button class="remove-favorite-btn" title="Remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', addToCart);
            applyTranslation(btn, 'buttons.add_to_cart');
        });
        
        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
            btn.addEventListener('click', removeFavorite);
            const title = getTranslation('buttons.remove');
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
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        quantity: existingItems[0].quantity + 1
                    })
                });
            } else {
                await fetch(`${apiUrl}/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: favorite.productId,
                        quantity: 1,
                        userId: authUser.id
                    })
                });
            }
            
            const message = getTranslation('messages.added_to_cart') || 'Product added to cart!';
            alert(message);
        } catch (error) {
            console.error('Error adding to cart:', error);
            const message = getTranslation('messages.add_to_cart_error') || 'There was an error adding the product to cart.';
            alert(message);
        }
    }

    async function removeFavorite(e) {
        const itemElement = e.target.closest('.favorite-item');
        const favId = itemElement.dataset.id;
        
        try {
            await fetch(`${apiUrl}/favorites/${favId}`, {
                method: 'DELETE'
            });
            
            favorites = favorites.filter(f => f.id !== favId);
            displayFavoritesItems();
            
            const message = getTranslation('messages.removed_from_favorites') || 'Item removed from favorites';
            alert(message);
        } catch (error) {
            console.error('Error removing favorite:', error);
            const message = getTranslation('messages.remove_favorite_error') || 'There was an error removing the item from favorites.';
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
            element.textContent = translation;
        }
    }

    function applyTranslations(container) {
        if (!window.i18n) return;
        
        container.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = getTranslation(key);
            if (translation) {
                el.textContent = translation;
            }
        });
    }

    // Handle language changes
    window.addEventListener('languageChanged', () => {
        if (window.i18n) {
            window.i18n.applyTranslations('favourite');
            displayFavoritesItems();
        }
    });

    loadFavoritesData();
});