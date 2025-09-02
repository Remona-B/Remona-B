// Run only after the page has fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Grab references to popup elements once
  const popup = document.getElementById('product-popup');
  const popupImage = document.getElementById('popup-image');
  const popupTitle = document.getElementById('popup-title');
  const popupPrice = document.getElementById('popup-price');
  const popupDesc = document.getElementById('popup-description');
  const popupOptions = document.getElementById('popup-options');
  const addBtn = document.getElementById('popup-add');
  const closeBtn = popup.querySelector('.close');

  let currentProduct = null;   // will hold the active product JSON
  let selectedOptions = {};    // track user’s choices (color, size, etc.)

  /**
   * Opens the product popup and fills it with product data
   * @param {string} handle - Shopify product handle
   */
  const openPopup = async (handle) => {
    try {
      // Fetch product details via Shopify’s JS API, the CSV for example
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();
      currentProduct = product;
      selectedOptions = {}; // reset options every time popup opens

      // Fill in the popup with product data
      popupImage.src = product.images[0] || '';
      popupTitle.textContent = product.title;
      popupPrice.textContent = `€ ${(product.price / 100).toFixed(2)}`;
      popupDesc.innerHTML = product.description || ""; // dynamic description fetched from the CSV

      popupOptions.innerHTML = ""; // clear old options

      // Assume Shopify variant structure: option1 = size, option2 = color
      const sizes = [...new Set(product.variants.map(v => v.option1))];
      const colors = [...new Set(product.variants.map(v => v.option2))];

      // --- Render color swatches as buttons ---
      if (colors.length > 0) {
        const colorWrapper = document.createElement("div");
        colorWrapper.innerHTML = `<label>Color</label>`;

        const swatchContainer = document.createElement("div");
        swatchContainer.style.display = "grid";
        swatchContainer.style.gridTemplateColumns = "1fr 1fr"; // two buttons per row
        swatchContainer.style.gap = "1px";

        colors.forEach(c => {
          const btn = document.createElement("button");
          btn.textContent = c;
          btn.style.padding = "10px";
          btn.style.border = "2px solid #ddd";
          btn.style.borderLeft = `12px solid ${c.toLowerCase()}`; // simple color preview
          btn.style.background = "#fff";
          btn.style.cursor = "pointer";
          btn.style.width = "100%";
          btn.style.textAlign = "left";

          // Handle user click
          btn.onclick = () => {
            selectedOptions.color = c;

            // reset all to grey
            swatchContainer.querySelectorAll("button").forEach(b => {
              b.style.borderColor = "#ddd";
            });
            // highlight selected
            btn.style.background = "black";
            btn.style.color="white";
          };

          swatchContainer.appendChild(btn);
        });

        colorWrapper.appendChild(swatchContainer);
        popupOptions.appendChild(colorWrapper);

        // pre-select first color by default
        selectedOptions.color = colors[0];
      }

      // --- Render size dropdown ---
      if (sizes.length > 1) {
        const sizeWrapper = document.createElement("div");
        sizeWrapper.innerHTML = `
          <label>Size</label>
          <select data-option="size" style="width:100%;padding:10px;border:1px solid #ddd;">
            ${sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
          </select>
        `;
        popupOptions.appendChild(sizeWrapper);

        // pre-select first size
        selectedOptions.size = sizes[0];
      }

      // Show the popup
      popup.classList.remove("hidden");
    } catch (err) {
      console.error("Error loading product:", err);
    }
  };

  /**
   * Finds the correct variant ID based on selected options
   */
  const getSelectedVariantId = () => {
    if (!currentProduct) return null;

    // Check dropdowns in case user changed size
    popupOptions.querySelectorAll("select[data-option]").forEach(s => {
      selectedOptions[s.dataset.option] = s.value;
    });

    // Find a matching variant (size + color)
    const variant = currentProduct.variants.find(v =>
      (!selectedOptions.size || v.option1 === selectedOptions.size) &&
      (!selectedOptions.color || v.option2 === selectedOptions.color)
    );

    return (variant || currentProduct.variants[0]).id;
  };

  /**
   * Add selected product to Shopify cart
   * Also adds "Soft Winter Jacket" if rules match
   */
  addBtn.addEventListener("click", async () => {
    const variantId = getSelectedVariantId();
    if (!variantId) return;

    try {
      // Add chosen product
      await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      });

      // hiring exam rule: add jacket if user chose Black + Medium
      if (
        selectedOptions.color?.toLowerCase() === "black" &&
        selectedOptions.size?.toLowerCase() === "medium"
      ) {
        const jacketHandle = "soft-winter-jacket"; // replace with exact Shopify handle
        const res = await fetch(`/products/${jacketHandle}.js`);
        const jacket = await res.json();
        const jacketVariantId = jacket.variants[0].id;

        await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: jacketVariantId, quantity: 1 })
        });
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    }

    popup.classList.add("hidden"); // close popup
  });

  // Attach quick-view buttons (one per product card)
  document.querySelectorAll(".quick-view").forEach(btn => {
    btn.addEventListener("click", () => openPopup(btn.dataset.handle));
  });

  // Close popup when clicking "X"
  closeBtn?.addEventListener("click", () => popup.classList.add("hidden"));

  // Also close popup when pressing ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !popup.classList.contains("hidden")) {
      popup.classList.add("hidden");
    }
  });
});
