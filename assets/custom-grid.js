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

      // --- Dynamically render product options (Size, Color, etc.) ---
      product.options.forEach((opt, idx) => {
        const name = opt.name.toLowerCase();

        if (name === "color") {
          // Render colors as swatches
          const colorWrapper = document.createElement("div");
          colorWrapper.innerHTML = `<label>Color</label>`;

          const swatchContainer = document.createElement("div");
          swatchContainer.style.display = "grid";
          swatchContainer.style.gridTemplateColumns = "1fr 1fr"; // two buttons per row
          swatchContainer.style.gap = "4px";

          let activeColorBtn = null;

          opt.values.forEach(c => {
            const btn = document.createElement("button");
            btn.textContent = c;
            btn.style.padding = "10px";
            btn.style.border = "2px solid #ddd";
            btn.style.borderLeft = `12px solid ${c.toLowerCase()}`;
            btn.style.background = "#fff";
            btn.style.color = "#000";
            btn.style.cursor = "pointer";
            btn.style.width = "100%";
            btn.style.textAlign = "left";
            btn.style.transition = "all 0.3s ease";

            btn.onclick = () => {
              selectedOptions.color = c;

              if (activeColorBtn) {
                activeColorBtn.style.background = "#fff";
                activeColorBtn.style.color = "#000";
                activeColorBtn.style.borderColor = "#ddd";
              }

              btn.style.background = "black";
              btn.style.color = "white";
              btn.style.borderColor = "black";
              activeColorBtn = btn;
            };

            swatchContainer.appendChild(btn);
          });

          colorWrapper.appendChild(swatchContainer);
          popupOptions.appendChild(colorWrapper);

          // Preselect first color
          selectedOptions.color = opt.values[0];
          swatchContainer.querySelector("button")?.click();
        }

        if (name === "size") {
          // Render sizes as dropdown
          const sizeWrapper = document.createElement("div");
          sizeWrapper.innerHTML = `
            <label>Size</label>
            <select data-option="size" style="width:100%;padding:10px;border:1px solid #ddd;">
              ${opt.values.map(s => `<option value="${s}">${s}</option>`).join("")}
            </select>
          `;
          popupOptions.appendChild(sizeWrapper);

          // Preselect first size
          selectedOptions.size = opt.values[0];
        }
      });

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

    // Update selectedOptions from dropdowns
    popupOptions.querySelectorAll("select[data-option]").forEach(s => {
      selectedOptions[s.dataset.option] = s.value;
    });

    // Match variant
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

      // Special exam rule: Medium + Black or Medium + White → add jacket
      if (
        selectedOptions.size?.toLowerCase() === "medium" &&
        (selectedOptions.color?.toLowerCase() === "black" ||
         selectedOptions.color?.toLowerCase() === "white")
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

// --- Confirmation popup  ---
const cartPopup = document.createElement("div");
cartPopup.id = "cart-popup";
cartPopup.style.position = "fixed";
cartPopup.style.top = "50%";
cartPopup.style.left = "50%";
cartPopup.style.transform = "translate(-50%, -50%)";
cartPopup.style.padding = "14px 18px";
cartPopup.style.background = "#000";
cartPopup.style.color = "#fff";
cartPopup.style.borderRadius = "8px";
cartPopup.style.fontSize = "13px";
cartPopup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
cartPopup.style.opacity = "0";
cartPopup.style.transition = "opacity 0.3s ease";
cartPopup.style.zIndex = "999";
cartPopup.style.textAlign = "center";
cartPopup.style.maxWidth = "300px";
cartPopup.style.wordWrap = "break-word";
document.body.appendChild(cartPopup);

/**
 * Show confirmation popup
 * @param {string[]} items - array of item titles added
 */
const showCartPopup = (items) => {
  let message = `
    <strong>Added to cart:</strong><br>
    ${items.map(i => `• ${i}`).join("<br>")}
  `;

  // Add rule explanation if triggered
  if (
    selectedOptions.size?.toLowerCase() === "medium" &&
    (selectedOptions.color?.toLowerCase() === "black" ||
     selectedOptions.color?.toLowerCase() === "white")
  ) {
    message += `<br><br><em>Because you selected <strong>${selectedOptions.color} + Medium</strong>, the Soft Winter Jacket was added automatically 🎉</em>`;
  }

  cartPopup.innerHTML = message;
  cartPopup.style.opacity = "1";

  // Auto-hide after 3 seconds
  setTimeout(() => {
    cartPopup.style.opacity = "0";
  }, 3000);
};
