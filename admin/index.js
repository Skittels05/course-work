document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = "http://localhost:3000";
  const authUser = JSON.parse(sessionStorage.getItem("authUser"));

  if (!authUser || authUser.role !== "admin") {
    window.location.href = "../login/index.html";
    return;
  }

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const productForm = document.getElementById("product-form");
  const productsTable = document
    .getElementById("products-table")
    .querySelector("tbody");
  const reviewsTable = document
    .getElementById("reviews-table")
    .querySelector("tbody");
  const filterProduct = document.getElementById("filter-product");
  const filterUser = document.getElementById("filter-user");

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
    productsTable.innerHTML = "";
    products.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>$${product.price.toFixed(2)}</td>
                        <td>${product.category}</td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${
                              product.id
                            }">Edit</button>
                            <button class="action-btn delete-btn" data-id="${
                              product.id
                            }">Delete</button>
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
    reviewsTable.innerHTML = "";

    const productsResponse = await fetch(`${apiUrl}/products`);
    const products = await productsResponse.json();

    const usersResponse = await fetch(`${apiUrl}/users`);
    const users = await usersResponse.json();

    reviews.forEach((review) => {
      const product = products.find((p) => p.id == review.productId);
      const user = users.find((u) => u.id == review.userId);

      const row = document.createElement("tr");
      row.innerHTML = `
                        <td>${review.id}</td>
                        <td>${product?.name || "Unknown"}</td>
                        <td>${
                          user
                            ? `${user.firstName} ${user.lastName}`
                            : "Unknown"
                        }</td>
                        <td>${"★".repeat(review.rating)}</td>
                        <td class="review-text" title="${
                          review.text || "No text"
                        }">${review.text || "No text"}</td>
                        <td>${new Date(review.date).toLocaleDateString()}</td>
                        <td>
                            <button class="action-btn delete-btn" data-id="${
                              review.id
                            }">Delete</button>
                        </td>
                    `;
      reviewsTable.appendChild(row);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteReview(btn.dataset.id));
    });
  }

  async function loadFilters() {
    try {
      const productsResponse = await fetch(`${apiUrl}/products`);
      const products = await productsResponse.json();

      const usersResponse = await fetch(`${apiUrl}/users`);
      const users = await usersResponse.json();

      filterProduct.innerHTML = '<option value="">All Products</option>';
      products.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = product.name;
        filterProduct.appendChild(option);
      });

      filterUser.innerHTML = '<option value="">All Users</option>';
      users.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = `${user.firstName} ${user.lastName}`;
        filterUser.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  }

  filterProduct.addEventListener("change", () => {
    loadReviews(filterProduct.value, filterUser.value);
  });

  filterUser.addEventListener("change", () => {
    loadReviews(filterProduct.value, filterUser.value);
  });

  async function editProduct(id) {
    try {
      const response = await fetch(`${apiUrl}/products/${id}`);
      const product = await response.json();

      document.getElementById("product-id").value = product.id;
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-price").value = product.price;
      document.getElementById("product-category").value = product.category;
      document.getElementById("product-description").value =
        product.description;

      document.getElementById("save-product").textContent = "Update Product";
      document.getElementById("save-product").disabled = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error editing product:", error);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await fetch(`${apiUrl}/products/${id}`, { method: "DELETE" });
      loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }

  async function deleteReview(id) {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await fetch(`${apiUrl}/feedbacks/${id}`, { method: "DELETE" });
      loadReviews(filterProduct.value, filterUser.value);
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  }

  productForm.addEventListener("input", validateProductForm);

  function validateProductForm() {
    let isValid = true;

    const name = document.getElementById("product-name").value.trim();
    if (name.length < 3) {
      document.getElementById("name-error").textContent =
        "Name must be at least 3 characters";
      document.getElementById("name-error").style.display = "block";
      isValid = false;
    } else {
      document.getElementById("name-error").style.display = "none";
    }

    const price = document.getElementById("product-price").value;
    if (price <= 0) {
      document.getElementById("price-error").textContent =
        "Price must be greater than 0";
      document.getElementById("price-error").style.display = "block";
      isValid = false;
    } else {
      document.getElementById("price-error").style.display = "none";
    }

    const category = document.getElementById("product-category").value.trim();
    if (category.length < 2) {
      document.getElementById("category-error").textContent =
        "Category must be at least 2 characters";
      document.getElementById("category-error").style.display = "block";
      isValid = false;
    } else {
      document.getElementById("category-error").style.display = "none";
    }

    const description = document
      .getElementById("product-description")
      .value.trim();
    if (description.length < 10) {
      document.getElementById("description-error").textContent =
        "Description must be at least 10 characters";
      document.getElementById("description-error").style.display = "block";
      isValid = false;
    } else {
      document.getElementById("description-error").style.display = "none";
    }

    document.getElementById("save-product").disabled = !isValid;
  }
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
        document.getElementById("save-product").textContent = "Save Product";
        document.getElementById("save-product").disabled = true;
        loadProducts();
        alert("Product saved successfully!");
      } else {
        throw new Error("Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product. Please try again.");
    }
  });

  document.getElementById("reset-form").addEventListener("click", () => {
    productForm.reset();
    document.getElementById("product-id").value = "";
    document.getElementById("save-product").textContent = "Save Product";
    document.getElementById("save-product").disabled = true;

    document.querySelectorAll(".error-message").forEach((el) => {
      el.style.display = "none";
    });
  });

  loadProducts();
  loadReviews();
  loadFilters();
});
