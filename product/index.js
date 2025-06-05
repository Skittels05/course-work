document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = "http://localhost:3000";
  const productId = new URLSearchParams(window.location.search).get("id");
  const productContainer = document.getElementById("product-container");
  const reviewsList = document.getElementById("reviews-list");
  const reviewFormContainer = document.getElementById("review-form-container");
  const notPurchasedMessage = document.getElementById("not-purchased-message");
  const loginToReview = document.getElementById("login-to-review");
  const reviewForm = document.getElementById("review-form");
  const ratingStars = document.querySelectorAll(".rating-stars i");
  const reviewText = document.getElementById("review-text");
  const charCount = document.getElementById("char-count");
  const reviewFormTitle = document.querySelector("#review-form-container h3");

  let selectedRating = 0;
  let isLoading = false;
  let existingReviewId = null;
  let isEditMode = false;

  function getTranslatedProductField(product, field) {
    const lang = window.i18n?.currentLang || "en";
    const translatedField = `ru_${field}`;
    return lang === "ru" && product[translatedField]
      ? product[translatedField]
      : product[field];
  }

  function getTranslation(key) {
    if (!window.i18n) return null;
    return (
      key
        .split(".")
        .reduce((o, k) => o?.[k], window.i18n.translations.product) ||
      key.split(".").reduce((o, k) => o?.[k], window.i18n.translations.shop)
    );
  }

  function applyTranslation(element, key, attribute = "textContent") {
    const translation = getTranslation(key);
    if (translation) {
      if (attribute === "textContent") {
        element.textContent = translation;
      } else {
        element.setAttribute(attribute, translation);
      }
    }
  }

  async function loadProduct() {
    if (isLoading) return;
    isLoading = true;

    try {
      const response = await fetch(`${apiUrl}/products/${productId}`);
      const product = await response.json();
      displayProduct(product);
      await loadReviews();
    } catch (error) {
      console.error("Error loading product:", error);
      const message =
        getTranslation("errors.load_product") ||
        "Error loading product details";
      productContainer.innerHTML = `<p class="error-message">${message}</p>`;
    } finally {
      isLoading = false;
    }
  }

  function displayProduct(product) {

    const name = getTranslatedProductField(product, "name");
    const description = getTranslatedProductField(product, "description");
    const ratingText = product.rating
      ? product.rating.toFixed(1)
      : getTranslation("product.no_ratings") || "No ratings yet";

    productContainer.innerHTML = `
            <div class="product-image-container">
                <img src="../assets/shop/${product.id}.jpg" alt="${name}" 
                     class="product-image" onerror="this.src='../assets/shop/placeholder.jpg'">
            </div>
            <div class="product-info">
                <h1 class="product-title">${name}</h1>
                <div class="product-rating">
                    ${renderRatingStars(product.rating || 0)}
                    <span>${ratingText}</span>
                </div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <p class="product-description">${description}</p>
                <button class="add-to-cart" data-id="${
                  product.id
                }" data-i18n="buttons.add_to_cart">Add to Cart</button>
            </div>
        `;


    const addToCartBtn = document.querySelector(".add-to-cart");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", addToCart);
      applyTranslation(addToCartBtn, "buttons.add_to_cart");
    }
  }

  async function loadReviews() {
        try {
            const response = await fetch(`${apiUrl}/feedbacks?productId=${productId}`);
            const reviews = await response.json();
            displayReviews(reviews);
            await updateProductRating(reviews);
            checkPurchaseStatus();
            checkExistingReview(reviews);
        } catch (error) {
            console.error('Error loading reviews:', error);
            const message = getTranslation('errors.load_reviews') || 'Error loading reviews';
            reviewsList.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

  function checkExistingReview(reviews) {
        const authUser = JSON.parse(sessionStorage.getItem('authUser'));
        if (!authUser) return;

        const userReview = reviews.find(review => review.userId === authUser.id);
        if (userReview) {
            existingReviewId = userReview.id;
            isEditMode = true;
            applyTranslation(reviewFormTitle, 'reviews.edit_review');
            selectedRating = userReview.rating;
            reviewText.value = userReview.text;
            charCount.textContent = reviewText.value.length;
            updateRatingStars();

            const reviewCard = document.querySelector(`.review-card[data-review-id="${existingReviewId}"]`);
            if (reviewCard) {
                const controls = document.createElement('div');
                controls.className = 'review-controls';
                controls.innerHTML = `
                    <button class="edit-review-btn" data-i18n="buttons.edit">Edit</button>
                    <button class="delete-review-btn" data-i18n="buttons.delete">Delete</button>
                `;
                reviewCard.appendChild(controls);
                
                applyTranslation(controls.querySelector('.edit-review-btn'), 'buttons.edit');
                applyTranslation(controls.querySelector('.delete-review-btn'), 'buttons.delete');
                
                controls.querySelector('.edit-review-btn').addEventListener('click', () => {
                    reviewFormContainer.style.display = 'block';
                    window.scrollTo({
                        top: reviewFormContainer.offsetTop - 20,
                        behavior: 'smooth'
                    });
                });
                
                controls.querySelector('.delete-review-btn').addEventListener('click', deleteReview);
            }
        }
    }

  async function deleteReview() {
        const confirmMessage = getTranslation('messages.delete_confirm') || 
                             'Are you sure you want to delete your review?';
        if (!confirm(confirmMessage)) return;
        
        try {
            const response = await fetch(`${apiUrl}/feedbacks/${existingReviewId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                existingReviewId = null;
                isEditMode = false;
                reviewForm.reset();
                selectedRating = 0;
                updateRatingStars();
                await loadReviews();
                const successMessage = getTranslation('messages.delete_success') || 
                                      'Your review has been deleted.';
                alert(successMessage);
                reviewFormContainer.style.display = 'none';
            } else {
                throw new Error('Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            const errorMessage = getTranslation('errors.delete_review') || 
                               'Error deleting review. Please try again.';
            alert(errorMessage);
        }
    }

  async function updateProductRating(reviews) {
    if (isLoading) return;
    isLoading = true;

    try {
      if (reviews.length === 0) {
        await updateRatingInProduct(0);
        return;
      }

      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating = totalRating / reviews.length;
      await updateRatingInProduct(averageRating);
    } finally {
      isLoading = false;
    }
  }

  async function updateRatingInProduct(newRating) {
    try {
      const productResponse = await fetch(`${apiUrl}/products/${productId}`);
      const product = await productResponse.json();

      const updatedProduct = {
        ...product,
        rating: parseFloat(newRating.toFixed(1)),
      };

      await fetch(`${apiUrl}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedProduct),
      });

      const productRatingElement = document.querySelector(
        ".product-rating span"
      );
      if (productRatingElement) {
        productRatingElement.textContent = updatedProduct.rating.toFixed(1);
      }

      const ratingStarsElement = document.querySelector(".product-rating");
      if (ratingStarsElement) {
        ratingStarsElement.innerHTML =
          renderRatingStars(updatedProduct.rating) +
          `<span>${updatedProduct.rating.toFixed(1)}</span>`;
      }
    } catch (error) {
      console.error("Error updating product rating:", error);
    }
  }

  function displayReviews(reviews) {
        if (reviews.length === 0) {
            const message = getTranslation('reviews.no_reviews') || 
                          'No reviews yet. Be the first to review!';
            reviewsList.innerHTML = `<p>${message}</p>`;
            return;
        }

        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-card" data-review-id="${review.id}">
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
            applyTranslation(loginToReview, 'reviews.login_required');
            return;
        }

        if (authUser.role === 'admin') {
            notPurchasedMessage.style.display = 'block';
            notPurchasedMessage.innerHTML = `
                <p>${getTranslation('reviews.admin_restriction') || 
                   'Review functionality is not available for your role.'}</p>
            `;
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
                    <p>${getTranslation('reviews.purchase_required') || 
                       'You need to purchase this product before leaving a review.'}</p>
                    <button class="buy-now-btn" data-id="${productId}" data-i18n="buttons.buy_now">Buy Now</button>
                `;
                
                const buyNowBtn = document.querySelector('.buy-now-btn');
                if (buyNowBtn) {
                    buyNowBtn.addEventListener('click', addToCart);
                    applyTranslation(buyNowBtn, 'buttons.buy_now');
                }
            }
        } catch (error) {
            console.error('Error checking purchase status:', error);
        }
    }

  reviewForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const authUser = JSON.parse(sessionStorage.getItem("authUser"));
    if (!authUser) {
      window.location.href = "../login/index.html";
      return;
    }

    if (authUser.role === "admin") {
      const message =
        getTranslation("reviews.admin_restriction") ||
        "Review functionality is not available for your role.";
      alert(message);
      return;
    }

    if (selectedRating === 0) {
      const message =
        getTranslation("reviews.rating_required") || "Please select a rating";
      alert(message);
      return;
    }

    const minReviewLength = 30;
    if (reviewText.value.length < minReviewLength) {
      const message =
        getTranslation("reviews.min_length") ||
        `Review must be at least ${minReviewLength} characters long`;
      alert(message);
      return;
    }

    try {
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode
        ? `${apiUrl}/feedbacks/${existingReviewId}`
        : `${apiUrl}/feedbacks`;

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: parseInt(productId),
          userId: authUser.id,
          userName: `${authUser.nickname}`,
          rating: selectedRating,
          text: reviewText.value,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        reviewForm.reset();
        selectedRating = 0;
        updateRatingStars();
        const reviewsResponse = await fetch(
          `${apiUrl}/feedbacks?productId=${productId}`
        );
        const reviews = await reviewsResponse.json();
        await updateProductRating(reviews);
        displayReviews(reviews);

        const successMessage = isEditMode
          ? getTranslation("messages.review_updated") ||
            "Your review has been updated!"
          : getTranslation("messages.review_thanks") ||
            "Thank you for your review!";
        alert(successMessage);

        if (isEditMode) {
          isEditMode = false;
          existingReviewId = null;
          applyTranslation(reviewFormTitle, "reviews.write_review");
          reviewFormContainer.style.display = "none";
        }
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      const errorMessage =
        getTranslation("errors.submit_review") ||
        "Error submitting review. Please try again.";
      alert(errorMessage);
    }
  });

  function addToCart(event) {
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));
    if (!authUser) {
      sessionStorage.setItem("returnUrl", window.location.href);
      window.location.href = "../login/index.html";
      return;
    }

    const productId = event.target?.dataset?.id || productId;

    fetch(`${apiUrl}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: +productId,
        quantity: 1,
        userId: authUser.id,
      }),
    })
      .then((response) => response.json())
      .then(() => {
        const message =
          getTranslation("messages.added_to_cart") ||
          "Added to cart! Complete your purchase to leave a review.";
        alert(message);
        checkPurchaseStatus();
      })
      .catch((error) => {
        console.error("Error:", error);
        const errorMessage =
          getTranslation("errors.add_to_cart") ||
          "Error adding to cart. Please try again.";
        alert(errorMessage);
      });
  }

  ratingStars.forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.rating);
      updateRatingStars();
    });
  });

  function updateRatingStars() {
    ratingStars.forEach((star) => {
      star.classList.toggle(
        "active",
        parseInt(star.dataset.rating) <= selectedRating
      );
      star.classList.toggle(
        "far",
        parseInt(star.dataset.rating) > selectedRating
      );
      star.classList.toggle(
        "fas",
        parseInt(star.dataset.rating) <= selectedRating
      );
    });
  }

  reviewText.addEventListener("input", () => {
    charCount.textContent = reviewText.value.length;
  });

  function renderRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = "";

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

  window.addEventListener("languageChanged", () => {
    if (window.i18n) {
      window.i18n.applyTranslations("product");
      if (productId) loadProduct();

      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        applyTranslation(el, key);
      });
    }
  });

  if (productId) {
    loadProduct();
  } else {
    const message =
      getTranslation("errors.product_not_found") || "Product not found";
    productContainer.innerHTML = `<p class="error-message">${message}</p>`;
  }
});
