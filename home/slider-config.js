document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [feedbacksResponse, productsResponse] = await Promise.all([
      fetch("http://localhost:3000/feedbacks"),
      fetch("http://localhost:3000/products"),
    ]);

    let feedbacks = await feedbacksResponse.json();
    const products = await productsResponse.json();

    feedbacks = feedbacks
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const productMap = products.reduce((map, product) => {
      map[product.id] = product.name;
      return map;
    }, {});

    const swiperWrapper = document.getElementById("feedback-wrapper");

    const maxTextLength = 300;

    feedbacks.forEach((feedback) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide feedback-slide";

      const date = new Date(feedback.date).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const stars = Array(5)
        .fill()
        .map(
          (_, i) =>
            `<i class="fas fa-star${i < feedback.rating ? "" : "-o"}"></i>`
        )
        .join("");
      let displayText = feedback.text;
      if (displayText.length > maxTextLength) {
        const lastSpaceIndex = displayText.lastIndexOf(" ", maxTextLength - 10);
        displayText = displayText.substring(0, lastSpaceIndex) + "...";
      }

      slide.innerHTML = `
                <div class="user-name">${feedback.userName}</div>
                <div class="date">${date}</div>
                <div class="product-name"><a href="../product/index.html?id=${
                  feedback.productId
                }">${
        productMap[feedback.productId] || "Unknown Product"
      }</a></div>
                <div class="rating">${stars}</div>
                <div class="text">${displayText}</div>
            `;

      swiperWrapper.appendChild(slide);
    });
    new Swiper(".feedback-slider", {
      slidesPerView: 1,
      spaceBetween: 0,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      navigation: {
        enabled: false,
      },
      loop: true,
      grabCursor: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
    });
  } catch (error) {
    console.error("Error loading feedbacks:", error);
    document.getElementById("feedback-wrapper").innerHTML =
      '<div class="swiper-slide feedback-slide"><p>Ошибка загрузки отзывов</p></div>';
  }
});
