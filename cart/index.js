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

    if (authUser.role === 'admin') {
        checkoutBtn.disabled = true;
        applyTranslation(checkoutBtn, 'messages.admin_checkout_disabled');
        checkoutBtn.style.backgroundColor = '#cccccc';
        checkoutBtn.style.cursor = 'not-allowed';
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
        } catch (error) {
            console.error('Error loading cart data:', error);
        }
    }

    function displayCartItems() {
        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p data-i18n="empty_cart.message">Your cart is empty</p>
                    <a href="../shop/index.html" class="continue-shopping" data-i18n="empty_cart.continue_shopping">Continue Shopping</a>
                </div>
            `;
            applyTranslations(cartItemsContainer);
            checkoutBtn.disabled = true;
            return;
        }
        
        cartItemsContainer.innerHTML = cartItems.map(item => {
            const product = products.find(p => p.id == item.productId);
            return `
                <div class="cart-item" data-id="${item.id}">
                    <img src="../assets/shop/${product.id}.jpg" alt="${product.name}" 
                         onerror="this.src='../assets/shop/placeholder.jpg'">
                    <div class="item-info">
                        <h3>${product.name}</h3>
                        <p>${product.category}</p>
                        <div class="item-price">$${product.price.toFixed(2)}</div>
                    </div>
                    <div class="item-quantity">
                        <button class="quantity-btn minus">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                    <div class="item-total">$${(product.price * item.quantity).toFixed(2)}</div>
                    <button class="remove-item"><i class="fas fa-trash"></i></button>
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
        });
    }

    function updateSummary() {
        const subtotal = cartItems.reduce((sum, item) => {
            const product = products.find(p => p.id == item.productId);
            return sum + (product.price * item.quantity);
        }, 0);
        
        const shipping = subtotal > 50 ? 0 : 5.99;
        const total = subtotal + shipping;
        
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        
        const translations = window.i18n?.translations?.cart?.summary;
        shippingElement.textContent = shipping === 0 ? 
            (translations?.free_shipping || 'FREE') : 
            `$${shipping.toFixed(2)}`;
            
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
            const index = cartItems.findIndex(item => item.id === itemId);
            cartItems[index] = updatedItem;
            
            updateSummary();
        } catch (error) {
            console.error('Error updating quantity:', error);
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
            const product = products.find(p => p.id == cartItems.find(item => item.id == itemId).productId);
            itemElement.querySelector('.item-total').textContent = `$${(product.price * quantity).toFixed(2)}`;
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
        const product = products.find(p => p.id == cartItems.find(item => item.id == itemId).productId);
        itemElement.querySelector('.item-total').textContent = `$${(product.price * quantity).toFixed(2)}`;
    }

    async function removeItem(e) {
        const itemElement = e.target.closest('.cart-item');
        const itemId = itemElement.dataset.id;
        
        try {
            await fetch(`${apiUrl}/cart/${itemId}`, { method: 'DELETE' });
            cartItems = cartItems.filter(item => item.id !== itemId);
            displayCartItems();
            updateSummary();
        } catch (error) {
            console.error('Error removing item:', error);
        }
    }

    checkoutBtn.addEventListener('click', async () => {
        if (authUser.role === 'admin') {
            const translations = window.i18n?.translations?.cart?.messages;
            alert(translations?.admin_checkout_disabled || 'Checkout functionality is not available for admin role');
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

            const translations = window.i18n?.translations?.cart?.messages;
            alert(translations?.order_success || 'Order placed successfully! Your cart has been cleared.');
            
            cartItems = [];
            displayCartItems();
            updateSummary();

        } catch (error) {
            console.error('Checkout error:', error);
            const translations = window.i18n?.translations?.cart?.messages;
            alert(translations?.order_error || 'There was an error processing your order. Please try again.');
        }
    });

    function applyTranslation(element, key) {
        if (!window.i18n) return;
        const translation = window.i18n.getTranslation(window.i18n.translations.cart, key);
        if (translation) {
            element.textContent = translation;
        }
    }

    function applyTranslations(container) {
        if (!window.i18n) return;
        
        container.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = window.i18n.getTranslation(window.i18n.translations.cart, key);
            if (translation) {
                el.textContent = translation;
            }
        });
    }

    window.addEventListener('languageChanged', () => {
        if (window.i18n) {
            window.i18n.applyTranslations('cart');
            updateSummary();
            
            if (authUser.role === 'admin') {
                applyTranslation(checkoutBtn, 'messages.admin_checkout_disabled');
            }
            
            if (cartItems.length === 0) {
                applyTranslations(cartItemsContainer);
            }
        }
    });

    loadCartData();
});