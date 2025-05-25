document.addEventListener('DOMContentLoaded', () => {
    const authUser = JSON.parse(sessionStorage.getItem('authUser'));
    if (!authUser) {
        sessionStorage.setItem('returnUrl', window.location.href);
        window.location.href = '../login/index.html';
        return;
    }
    const cartItemsContainer = document.getElementById('cart-items');
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const apiUrl = 'http://localhost:3000';
    
    let cartItems = [];
    let products = [];
    function getTranslatedProductField(product, field) {
        const lang = window.i18n?.currentLang || 'en';
        const translatedField = `ru_${field}`;
        return (lang === 'ru' && product[translatedField]) 
            ? product[translatedField] 
            : product[field];
    }
    function initCheckoutButton() {
        if (authUser.role === 'admin') {
            checkoutBtn.disabled = true;
            applyTranslation(checkoutBtn, 'messages.admin_checkout_disabled');
            checkoutBtn.style.backgroundColor = '#cccccc';
            checkoutBtn.style.cursor = 'not-allowed';
        } else {
            applyTranslation(checkoutBtn, 'buttons.checkout');
        }
    }

    async function loadCartData() {
        try {
            const [cartResponse, productsResponse] = await Promise.all([
                fetch(`${apiUrl}/cart?userId=${authUser.id}`),
                fetch(`${apiUrl}/products`)
            ]);
            
            cartItems = await cartResponse.json();
            products = await productsResponse.json();
            
            displayCartItems();
            updateSummary();
            initCheckoutButton();
        } catch (error) {
            console.error('Error loading cart data:', error);
            const message = getTranslation('errors.load_cart') || 'Error loading cart data';
            cartItemsContainer.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    function displayCartItems() {
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p data-i18n="cart.empty_message">Your cart is empty</p>
                    <a href="../shop/index.html" class="continue-shopping" data-i18n="cart.continue_shopping">Continue Shopping</a>
                </div>
            `;
            applyTranslations(cartItemsContainer);
            checkoutBtn.disabled = true;
            return;
        }
        
        cartItemsContainer.innerHTML = cartItems.map(item => {
            const product = products.find(p => p.id == item.productId);
            if (!product) return '';
            const name = getTranslatedProductField(product, 'name');
            const category = getTranslatedProductField(product, 'category');
            
            return `
                <div class="cart-item" data-id="${item.id}">
                    <img src="../assets/shop/${product.id}.jpg" alt="${name}" 
                         onerror="this.src='../assets/shop/placeholder.jpg'">
                    <div class="item-info">
                        <h3>${name}</h3>
                        <p>${category}</p>
                        <div class="item-price">$${product.price.toFixed(2)}</div>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                    <div class="item-total">$${(product.price * item.quantity).toFixed(2)}</div>
                    <button class="remove-item" data-i18n="[title]buttons.remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
            btn.addEventListener('click', decreaseQuantity);
        });
        
        document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
            btn.addEventListener('click', increaseQuantity);
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', removeItem);
            applyTranslation(btn, 'buttons.remove', 'title');
        });
    }

    function updateSummary() {
        const subtotal = cartItems.reduce((sum, item) => {
            const product = products.find(p => p.id == item.productId);
            return sum + (product.price * item.quantity);
        }, 0);
        
        const shipping = subtotal > 50 ? 0 : 5.99;
        const total = subtotal + shipping;

        const translations = window.i18n?.translations?.cart?.summary;
        
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        shippingElement.textContent = shipping === 0 
            ? (translations?.free_shipping || 'FREE') 
            : `$${shipping.toFixed(2)}`;
        totalElement.textContent = `$${total.toFixed(2)}`;
        
        checkoutBtn.disabled = cartItems.length === 0 || authUser.role === 'admin';
    }

    async function updateQuantity(itemId, newQuantity) {
        if (newQuantity < 1) return;
        
        try {
            const response = await fetch(`${apiUrl}/cart/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: newQuantity })
            });
            
            const updatedItem = await response.json();
            const index = cartItems.findIndex(item => item.id == itemId);
            cartItems[index] = updatedItem;
            
            updateSummary();
        } catch (error) {
            console.error('Error updating quantity:', error);
            const message = getTranslation('errors.update_quantity') || 'Error updating quantity';
            alert(message);
        }
    }
    function decreaseQuantity(e) {
        const itemElement = e.target.closest('.cart-item');
        const itemId = itemElement.dataset.id;
        const quantityElement = itemElement.querySelector('.item-quantity span');
        let quantity = parseInt(quantityElement.textContent);
        
        if (quantity > 1) {
            quantity--;
            quantityElement.textContent = quantity;
            updateQuantity(itemId, quantity);
            updateItemTotal(itemElement, quantity);
        }
    }
    function increaseQuantity(e) {
        const itemElement = e.target.closest('.cart-item');
        const itemId = itemElement.dataset.id;
        const quantityElement = itemElement.querySelector('.item-quantity span');
        let quantity = parseInt(quantityElement.textContent);
        quantity++;
        quantityElement.textContent = quantity;
        updateQuantity(itemId, quantity);
        updateItemTotal(itemElement, quantity);
    }

    function updateItemTotal(itemElement, quantity) {
        const itemId = itemElement.dataset.id;
        const product = products.find(p => p.id == cartItems.find(item => item.id == itemId).productId);
        if (product) {
            itemElement.querySelector('.item-total').textContent = `$${(product.price * quantity).toFixed(2)}`;
        }
    }
    async function removeItem(e) {
        const itemElement = e.target.closest('.cart-item');
        const itemId = itemElement.dataset.id;
        
        try {
            await fetch(`${apiUrl}/cart/${itemId}`, { method: 'DELETE' });
            cartItems = cartItems.filter(item => item.id != itemId);
            displayCartItems();
            updateSummary();
            
            const message = getTranslation('messages.item_removed') || 'Item removed from cart';
            alert(message);
        } catch (error) {
            console.error('Error removing item:', error);
            const message = getTranslation('errors.remove_item') || 'Error removing item from cart';
            alert(message);
        }
    }
    checkoutBtn.addEventListener('click', async () => {
        if (authUser.role === 'admin') {
            const message = getTranslation('messages.admin_checkout_disabled') || 
                           'Checkout is not available for admin role';
            alert(message);
            return;
        }

        try {
            const orderResponse = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    items: cartItems,
                    total: parseFloat(totalElement.textContent.replace('$', '')),
                    userId: authUser.id
                })
            });
            
            if (!orderResponse.ok) throw new Error('Order failed');

            await Promise.all(
                cartItems.map(item => 
                    fetch(`${apiUrl}/cart/${item.id}`, { method: 'DELETE' })
                )
            );
            const message = getTranslation('messages.order_success') || 
                          'Order placed successfully! Your cart has been cleared.';
            alert(message);
            
            cartItems = [];
            displayCartItems();
            updateSummary();

        } catch (error) {
            console.error('Checkout error:', error);
            const message = getTranslation('messages.order_error') || 
                           'There was an error processing your order. Please try again.';
            alert(message);
        }
    });
    function getTranslation(key) {
        if (!window.i18n) return null;
        return key.split('.').reduce((o, k) => o?.[k], window.i18n.translations.cart) ||
               key.split('.').reduce((o, k) => o?.[k], window.i18n.translations.shop) ||
               key.split('.').reduce((o, k) => o?.[k], window.i18n.translations.favourite);
    }

    function applyTranslation(element, key, attribute = 'textContent') {
        const translation = getTranslation(key);
        if (translation) {
            if (attribute === 'textContent') {
                element.textContent = translation;
            } else {
                element.setAttribute(attribute, translation);
            }
        }
    }

    function applyTranslations(container) {
        if (!window.i18n) return;
        
        container.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            applyTranslation(el, key);
        });
    }
    window.addEventListener('languageChanged', () => {
        if (window.i18n) {
            window.i18n.applyTranslations('cart');
            displayCartItems(); 
            updateSummary(); 
            initCheckoutButton(); 
            document.querySelectorAll('.remove-item').forEach(btn => {
                applyTranslation(btn, 'buttons.remove', 'title');
            });
        }
    });

    loadCartData();
});