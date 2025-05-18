document.addEventListener("DOMContentLoaded", async function () {
    if (!window.i18n) {
        window.i18n = new I18nManager();
        await Promise.all([
            i18n.loadTranslations('header'),
            i18n.loadTranslations('admin')
        ]);
        i18n.applyTranslations('header');
        i18n.applyTranslations('admin');
    }

    const t = (key) => {
        return window.i18n?.getTranslation(window.i18n.translations.admin, key) || key;
    };

    const apiUrl = "http://localhost:3000";
    const authUser = JSON.parse(sessionStorage.getItem("authUser"));

    if (!authUser || authUser.role !== "admin") {
        window.location.href = "../login/index.html";
        return;
    }

    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const productForm = document.getElementById("product-form");
    const productsTable = document.getElementById("products-table")?.querySelector("tbody");
    const reviewsTable = document.getElementById("reviews-table")?.querySelector("tbody");
    const filterProduct = document.getElementById("filter-product");
    const filterUser = document.getElementById("filter-user");
    const saveProductBtn = document.getElementById("save-product");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabBtns.forEach((b) => b.classList.remove("active"));
            tabContents.forEach((c) => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
        });
    });

    async function loadProducts() {
        try {
            const response = await fetch(`${apiUrl}/products`);
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error("Error loading products:", error);
        }
    }

    function renderProducts(products) {
        if (!productsTable) return;
        
        productsTable.innerHTML = "";
        products.forEach((product) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.category}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${product.id}">
                        ${t('products.actions.edit')}
                    </button>
                    <button class="action-btn delete-btn" data-id="${product.id}">
                        ${t('products.actions.delete')}
                    </button>
                </td>
            `;
            productsTable.appendChild(row);
        });

        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", () => editProduct(btn.dataset.id));
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
        });
    }

    async function loadReviews(productId = "", userId = "") {
        try {
            let url = `${apiUrl}/feedbacks`;
            if (productId || userId) {
                url += `?${productId ? `productId=${productId}` : ""}${
                    userId ? `&userId=${userId}` : ""
                }`;
            }

            const response = await fetch(url);
            const reviews = await response.json();
            renderReviews(reviews);
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    }

    async function renderReviews(reviews) {
        if (!reviewsTable) return;

        try {
            const [productsResponse, usersResponse] = await Promise.all([
                fetch(`${apiUrl}/products`),
                fetch(`${apiUrl}/users`)
            ]);
            const products = await productsResponse.json();
            const users = await usersResponse.json();

            reviewsTable.innerHTML = "";
            reviews.forEach((review) => {
                const product = products.find((p) => p.id == review.productId);
                const user = users.find((u) => u.id == review.userId);

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${review.id}</td>
                    <td>${product?.name || t('reviews.messages.unknown_product')}</td>
                    <td>${user ? `${user.firstName} ${user.lastName}` : t('reviews.messages.unknown_user')}</td>
                    <td>${"★".repeat(review.rating)}</td>
                    <td class="review-text" title="${review.text || t('reviews.messages.no_text')}">
                        ${review.text || t('reviews.messages.no_text')}
                    </td>
                    <td>${new Date(review.date).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn delete-btn" data-id="${review.id}">
                            ${t('reviews.actions.delete')}
                        </button>
                    </td>
                `;
                reviewsTable.appendChild(row);
            });

            document.querySelectorAll(".delete-btn").forEach((btn) => {
                btn.addEventListener("click", () => deleteReview(btn.dataset.id));
            });
        } catch (error) {
            console.error("Error rendering reviews:", error);
        }
    }

    async function loadFilters() {
        try {
            const [productsResponse, usersResponse] = await Promise.all([
                fetch(`${apiUrl}/products`),
                fetch(`${apiUrl}/users`)
            ]);
            const products = await productsResponse.json();
            const users = await usersResponse.json();

            if (filterProduct) {
                filterProduct.innerHTML = `<option value="">${t('reviews.all_products')}</option>`;
                products.forEach((product) => {
                    const option = document.createElement("option");
                    option.value = product.id;
                    option.textContent = product.name;
                    filterProduct.appendChild(option);
                });
            }

            if (filterUser) {
                filterUser.innerHTML = `<option value="">${t('reviews.all_users')}</option>`;
                users.forEach((user) => {
                    const option = document.createElement("option");
                    option.value = user.id;
                    option.textContent = `${user.firstName} ${user.lastName}`;
                    filterUser.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading filters:", error);
        }
    }

    if (filterProduct) {
        filterProduct.addEventListener("change", () => {
            loadReviews(filterProduct.value, filterUser.value);
        });
    }

    if (filterUser) {
        filterUser.addEventListener("change", () => {
            loadReviews(filterProduct.value, filterUser.value);
        });
    }

    async function editProduct(id) {
        try {
            const response = await fetch(`${apiUrl}/products/${id}`);
            const product = await response.json();

            document.getElementById("product-id").value = product.id;
            document.getElementById("product-name").value = product.name;
            document.getElementById("product-price").value = product.price;
            document.getElementById("product-category").value = product.category;
            document.getElementById("product-description").value = product.description;

            if (saveProductBtn) {
                saveProductBtn.textContent = t('products.update_button');
                saveProductBtn.disabled = false;
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error("Error editing product:", error);
        }
    }

    async function deleteProduct(id) {
        if (!confirm(t('products.messages.delete_confirm'))) return;

        try {
            await fetch(`${apiUrl}/products/${id}`, { method: "DELETE" });
            loadProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
            alert(t('products.messages.delete_error'));
        }
    }

    async function deleteReview(id) {
        if (!confirm(t('reviews.messages.delete_confirm'))) return;

        try {
            await fetch(`${apiUrl}/feedbacks/${id}`, { method: "DELETE" });
            loadReviews(filterProduct?.value, filterUser?.value);
        } catch (error) {
            console.error("Error deleting review:", error);
            alert(t('reviews.messages.delete_error'));
        }
    }

    if (productForm) {
        productForm.addEventListener("input", validateProductForm);
    }

    function validateProductForm() {
        let isValid = true;

        const name = document.getElementById("product-name").value.trim();
        if (name.length < 3) {
            document.getElementById("name-error").textContent = t('products.errors.name_length');
            document.getElementById("name-error").style.display = "block";
            isValid = false;
        } else {
            document.getElementById("name-error").style.display = "none";
        }

        const price = document.getElementById("product-price").value;
        if (price <= 0) {
            document.getElementById("price-error").textContent = t('products.errors.price_positive');
            document.getElementById("price-error").style.display = "block";
            isValid = false;
        } else {
            document.getElementById("price-error").style.display = "none";
        }

        const category = document.getElementById("product-category").value.trim();
        if (category.length < 2) {
            document.getElementById("category-error").textContent = t('products.errors.category_length');
            document.getElementById("category-error").style.display = "block";
            isValid = false;
        } else {
            document.getElementById("category-error").style.display = "none";
        }

        const description = document.getElementById("product-description").value.trim();
        if (description.length < 10) {
            document.getElementById("description-error").textContent = t('products.errors.description_length');
            document.getElementById("description-error").style.display = "block";
            isValid = false;
        } else {
            document.getElementById("description-error").style.display = "none";
        }

        if (saveProductBtn) {
            saveProductBtn.disabled = !isValid;
        }
    }

    if (productForm) {
        productForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const productData = {
                name: document.getElementById("product-name").value,
                price: parseFloat(document.getElementById("product-price").value),
                category: document.getElementById("product-category").value,
                description: document.getElementById("product-description").value,
                rating: 0,
            };

            const productId = document.getElementById("product-id").value;
            const method = productId ? "PUT" : "POST";
            const url = productId
                ? `${apiUrl}/products/${productId}`
                : `${apiUrl}/products`;

            try {
                if (!productId) {
                    const response = await fetch(`${apiUrl}/products`);
                    const products = await response.json();
                    const maxId = products.reduce((max, product) => {
                        const numId = Number(product.id);
                        return numId > max ? numId : max;
                    }, 0);

                    productData.id = (maxId + 1).toString();
                }

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(productData),
                });

                if (response.ok) {
                    productForm.reset();
                    document.getElementById("product-id").value = "";
                    if (saveProductBtn) {
                        saveProductBtn.textContent = t('products.save_button');
                        saveProductBtn.disabled = true;
                    }
                    loadProducts();
                    alert(t('products.messages.save_success'));
                } else {
                    throw new Error("Failed to save product");
                }
            } catch (error) {
                console.error("Error saving product:", error);
                alert(t('products.messages.save_error'));
            }
        });
    }

    const resetFormBtn = document.getElementById("reset-form");
    if (resetFormBtn) {
        resetFormBtn.addEventListener("click", () => {
            if (productForm) productForm.reset();
            document.getElementById("product-id").value = "";
            if (saveProductBtn) {
                saveProductBtn.textContent = t('products.save_button');
                saveProductBtn.disabled = true;
            }

            document.querySelectorAll(".error-message").forEach((el) => {
                el.style.display = "none";
            });
        });
    }

    window.addEventListener("languageChanged", () => {
        if (window.i18n) {
            window.i18n.applyTranslations('admin');
            
            loadProducts();
            loadReviews(filterProduct?.value, filterUser?.value);
            loadFilters();
            if (saveProductBtn && document.getElementById("product-id").value) {
                saveProductBtn.textContent = t('products.update_button');
            }
        }
    });
    loadProducts();
    loadReviews();
    loadFilters();
});