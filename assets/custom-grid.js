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

  let currentProduct = null;   // holds the active product JSON
  let selectedOptions = {};    // stores user’s choices (color, size, etc.)

  /**
   * Opens the product popup and fills it with product data
   * @param {string} handle - Shopify product handle
   */
  const openPopup = async (handle) => {
    try {
      // Fetch product details from Shopify’s product.js endpoint
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();
      currentProduct = product;
      selectedOptions = {}; // reset every time popup opens

      // Fill in popup content
      popupImage.src = product.images[0] || '';
      popupTitle.textContent = product.title;
      popupPrice.textContent = `€ ${(product.price / 100).toFixed(2)}`;
      popupDesc.innerHTML = product.description || ""; 

      // Clear old option elements
      popupOptions.innerHTML = "";

      // Shopify convention: option1 = size, option2 = color
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

        let activeColorBtn = null; // keep track of selected button

        colors.forEach(c => {
          const btn = document.createElement("button");
          btn.textContent = c;
          btn.style.padding = "10px";
          btn.style.border = "2px solid #ddd";
          btn.style.borderLeft = `12px solid ${c.toLowerCase()}`; // mini color preview
          btn.style.background = "#fff";
          btn.style.color = "#000";
          btn.style.cursor = "pointer";
          btn.style.width = "100%";
          btn.style.textAlign = "left";
          btn.style.transition = "all 0.3s ease"; // smooth effect

          // Handle user click
          btn.onclick = () => {
            selectedOptions.color = c;

            // reset previous active button
            if (activeColorBtn) {
              activeColorBtn.style.background = "#fff";
              activeColorBtn.style.color = "#000";
              activeColorBtn.style.borderColor = "#ddd";
            }

            // highlight current button
            btn.style.background = "black";
            btn.style.color = "white";
            btn.style.borderColor = "black";

            // update active reference
            activeColorBtn = btn;
          };

          swatchContainer.appendChild(btn);
        });

        colorWrapper.appendChild(swatchContainer);
        popupOptions.appendChild(colorWrapper);

        // Pre-select first color by default
        selectedOptions.color = colors[0];
        // Trigger click on first button so it looks selected
        swatchContainer.querySelector("button")?.click();
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

        // Pre-select first size
        selectedOptions.size = sizes[0];
      }

      // Show popup
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

    // Check dropdowns (in case user changed size)
    popupOptions.querySelectorAll("select[data-option]").forEach(s => {
      selectedOptions[s.dataset.option] = s.value;
    });

    // Match variant (size + color)
    const variant = currentProduct.variants.find(v =>
      (!selectedOptions.size || v.option1 === selectedOptions.size) &&
      (!selectedOptions.color || v.option2 === selectedOptions.color)
    );

    return (variant || currentProduct.variants[0]).id;
  };

  /**
   * Add selected product to Shopify cart
   * Also adds "Soft Winter Jacket" if rule matches
   */
  addBtn.addEventListener("click", async () => {
    const variantId = getSelectedVariantId();
    if (!variantId) return;

    try {
      const addedItems = [];

      // Add chosen product
      await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variantId, quantity: 1 })
      });
      addedItems.push(currentProduct.title);

      // Special exam rule: if user chose Black + Medium → also add jacket
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
        addedItems.push(jacket.title);
      }

      // Show confirmation popup
      showCartPopup(addedItems);

    } catch (err) {
      console.error("Error adding to cart:", err);
    }

    popup.classList.add("hidden"); // close product popup
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

// --- Confirmation popup (lightweight) ---
const cartPopup = document.createElement("div");
cartPopup.id = "cart-popup";
cartPopup.style.position = "fixed";
cartPopup.style.bottom = "20px";
cartPopup.style.right = "20px";
cartPopup.style.padding = "16px 20px";
cartPopup.style.background = "#000";
cartPopup.style.color = "#fff";
cartPopup.style.borderRadius = "8px";
cartPopup.style.fontSize = "14px";
cartPopup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
cartPopup.style.opacity = "0";
cartPopup.style.transition = "opacity 0.3s ease";
cartPopup.style.zIndex = "999";
document.body.appendChild(cartPopup);

/**
 * Show confirmation popup
 * @param {string[]} items - array of item titles added
 */
const showCartPopup = (items) => {
  cartPopup.innerHTML = `
    <strong>Added to cart:</strong><br>
    ${items.map(i => `• ${i}`).join("<br>")}
  `;
  cartPopup.style.opacity = "1";

  // Auto-hide after 3 seconds
  setTimeout(() => {
    cartPopup.style.opacity = "0";
  }, 3000);
};
