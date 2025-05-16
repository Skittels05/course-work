document.addEventListener('DOMContentLoaded', function() {
    const apiUrl = 'http://localhost:3000';
    const productId = new URLSearchParams(window.location.search).get('id');
    const productContainer = document.getElementById('product-container');
    const reviewsList = document.getElementById('reviews-list');
    const reviewFormContainer = document.getElementById('review-form-container');
    const notPurchasedMessage = document.getElementById('not-purchased-message');
    const loginToReview = document.getElementById('login-to-review');
    const reviewForm = document.getElementById('review-form');
    const ratingStars = document.querySelectorAll('.rating-stars i');
    const reviewText = document.getElementById('review-text');
    const charCount = document.getElementById('char-count');

    let selectedRating = 0;

    async function loadProduct() {
        try {
            const response = await fetch(`${apiUrl}/products/${productId}`);
            const product = await response.json();
            displayProduct(product);
            loadReviews();
            checkPurchaseStatus();
        } catch (error) {
            console.error('Error loading product:', error);
            productContainer.innerHTML = '<p>Error loading product details.</p>';
        }
    }

    function displayProduct(product) {
        productContainer.innerHTML = `
            <div class="product-image-container">
                <img src="../assets/shop/${product.id}.jpg" alt="${product.name}" 
                     class="product-image" onerror="this.src='../assets/shop/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h1 class="product-title">${product.name}</h1>
                <div class="product-rating">
                    ${renderRatingStars(product.rating || 0)}
                    <span>${product.rating ? product.rating.toFixed(1) : 'No ratings yet'}</span>
                </div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <p class="product-description">${product.description}</p>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        `;

        document.querySelector('.add-to-cart').addEventListener('click', addToCart);
    }

    async function loadReviews() {
        try {
            const response = await fetch(`${apiUrl}/feedbacks?productId=${productId}`);
            const reviews = await response.json();
            displayReviews(reviews);
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewsList.innerHTML = '<p>Error loading reviews.</p>';
        }
    }

    function displayReviews(reviews) {
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
            return;
        }

        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-author">${review.userName || 'Anonymous'}</span>
                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div class="review-rating">
                    ${renderRatingStars(review.rating)}
                </div>
                <div class="review-text">${review.text}</div>
            </div>
        `).join('');
    }

    async function checkPurchaseStatus() {
        const authUser = JSON.parse(sessionStorage.getItem('authUser'));
        
        if (!authUser) {
            loginToReview.style.display = 'block';
            return;
        }

        if (authUser.role === 'admin') {
            notPurchasedMessage.style.display = 'block';
            notPurchasedMessage.innerHTML = '<p>Review functionality is not available for your role.</p>';
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/orders?userId=${authUser.id}`);
            const orders = await response.json();

            let hasPurchased = false;
            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.productId === parseInt(productId)) {
                        hasPurchased = true;
                    }
                });
            });

            if (hasPurchased) {
                reviewFormContainer.style.display = 'block';
            } else {
                notPurchasedMessage.style.display = 'block';
                notPurchasedMessage.innerHTML = `
                    <p>You need to purchase this product before leaving a review.</p>
                    <button class="buy-now-btn" data-id="${productId}">Buy Now</button>
                `;
                
                document.querySelector('.buy-now-btn').addEventListener('click', addToCart);
            }
        } catch (error) {
            console.error('Error checking purchase status:', error);
        }
    }

    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const authUser = JSON.parse(sessionStorage.getItem('authUser'));
        if (!authUser) {
            window.location.href = '../login/index.html';
            return;
        }

        if (authUser.role === 'admin') {
            alert('Review functionality is not available for your role.');
            return;
        }

        if (selectedRating === 0) {
            alert('Please select a rating');
            return;
        }

        if (reviewText.value.length < 30) {
            alert('Review must be at least 30 characters long');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/feedbacks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: parseInt(productId),
                    userId: authUser.id,
                    userName: `${authUser.firstName} ${authUser.lastName}`,
                    rating: selectedRating,
                    text: reviewText.value,
                    date: new Date().toISOString()
                })
            });

            if (response.ok) {
                reviewForm.reset();
                selectedRating = 0;
                updateRatingStars();
                loadReviews();
                alert('Thank you for your review!');
            } else {
                throw new Error('Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Error submitting review. Please try again.');
        }
    });

    function addToCart(event) {
        const authUser = JSON.parse(sessionStorage.getItem('authUser'));
        if (!authUser) {
            sessionStorage.setItem('returnUrl', window.location.href);
            window.location.href = '../login/index.html';
            return;
        }

        const productId = event.target?.dataset?.id || productId;
        
        fetch(`${apiUrl}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productId: +productId, 
                quantity: 1,
                userId: authUser.id
            })
        })
        .then(response => response.json())
        .then(() => {
            alert('Added to cart! Complete your purchase to leave a review.');
            checkPurchaseStatus();
        })
        .catch(error => console.error('Error:', error));
    }

    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateRatingStars();
        });
    });

    function updateRatingStars() {
        ratingStars.forEach(star => {
            star.classList.toggle('active', parseInt(star.dataset.rating) <= selectedRating);
            star.classList.toggle('far', parseInt(star.dataset.rating) > selectedRating);
            star.classList.toggle('fas', parseInt(star.dataset.rating) <= selectedRating);
        });
    }

    reviewText.addEventListener('input', () => {
        charCount.textContent = reviewText.value.length;
    });

    function renderRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }

        return stars;
    }

    if (productId) {
        loadProduct();
    } else {
        productContainer.innerHTML = '<p>Product not found</p>';
    }
});