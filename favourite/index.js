document.addEventListener('DOMContentLoaded', () => {
    const favoritesContainer = document.getElementById('favorites-items');
    const apiUrl = 'http://localhost:3000';
    let favorites = [];
    let products = [];
    
    async function loadFavoritesData() {
        try {
            const [favoritesResponse, productsResponse] = await Promise.all([
                fetch(`${apiUrl}/favorites`),
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
                    <p>Your favorites list is empty</p>
                    <a href="../shop/index.html" class="continue-shopping">Browse Products</a>
                </div>
            `;
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
                            <button class="add-to-cart-btn">Add to Cart</button>
                            <button class="remove-favorite-btn"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });
        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
            btn.addEventListener('click', removeFavorite);
        });
    }
    
    async function addToCart(e) {
        const itemElement = e.target.closest('.favorite-item');
        const favId = itemElement.dataset.id;
        const favorite = favorites.find(f => f.id == favId);
        try {
            const cartResponse = await fetch(`${apiUrl}/cart?productId=${favorite.productId}`);
            const existingItems = await cartResponse.json();
            if (existingItems.length > 0) {
                await fetch(`${apiUrl}/cart/${existingItems[0].id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        quantity: existingItems[0].quantity + 1
                    })
                });
            } else {
                await fetch(`${apiUrl}/cart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productId: favorite.productId,
                        quantity: 1
                    })
                });
            }
            
            alert('Product added to cart!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('There was an error adding the product to cart.');
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
        } catch (error) {
            console.error('Error removing favorite:', error);
            alert('There was an error removing the item from favorites.');
        }
    }
    loadFavoritesData();
});