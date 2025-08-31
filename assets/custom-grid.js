document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const popupImage = document.getElementById('popup-image');
  const popupTitle = document.getElementById('popup-title');
  const popupPrice = document.getElementById('popup-price');
  const popupDesc = document.getElementById('popup-description');
  const popupOptions = document.getElementById('popup-options');
  const addBtn = document.getElementById('popup-add');
  const closeBtn = popup.querySelector('.close');

  let currentProduct = null;
  let selectedOptions = {};

  // Open popup
  const openPopup = async (handle) => {
    try {
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();
      currentProduct = product;

      // Fill content
      popupImage.src = product.images[0] || '';
      popupTitle.textContent = product.title;
      popupPrice.textContent = `€ ${(product.price / 100).toFixed(2)}`;


      popupDesc.textContent = "This one-piece swimsuit is crafted from jersey featuring an allover micro Monogram motif in relief.";

      popupOptions.innerHTML = "";

      // Assume option1 = Size, option2 = Color
      const sizes = [...new Set(product.variants.map(v => v.option1))];
      const colors = [...new Set(product.variants.map(v => v.option2))];

      // ---- COLOR BUTTONS FIRST ----
      if (colors.length > 0) {
        const colorWrapper = document.createElement("div");
        colorWrapper.innerHTML = `<label style="display:block;margin:.5rem 0 .25rem;">Color</label>`;
        const swatchContainer = document.createElement("div");
        swatchContainer.style.display = "grid";
        swatchContainer.style.gridTemplateColumns = "1fr 1fr"; // 2 per row
        swatchContainer.style.gap = "1px";

        colors.forEach(c => {
          const btn = document.createElement("button");
          btn.textContent = c;
          btn.style.padding = "10px";
          btn.style.border = "2px solid #ddd";
          btn.style.borderLeft = `12px solid ${c.toLowerCase()}`;
          btn.style.background = "#fff";
          btn.style.cursor = "pointer";
          btn.style.width = "100%";
          btn.style.textAlign = "left";

          btn.onclick = () => {
            selectedOptions.color = c;

            // Highlight selected
            swatchContainer.querySelectorAll("button").forEach(b => {
              b.style.borderColor = "#ddd";
            });
            btn.style.borderColor = "#000";
          };

          swatchContainer.appendChild(btn);
        });

        colorWrapper.appendChild(swatchContainer);
        popupOptions.appendChild(colorWrapper);

        selectedOptions.color = colors[0];
      }

      // ---- SIZE DROPDOWN ----
      if (sizes.length > 1) {
        const sizeWrapper = document.createElement("div");
        sizeWrapper.innerHTML = `
          <label style="display:block;margin:.5rem 0 .25rem;">Size</label>
          <select data-option="size" style="width:100%;padding:10px;border:1px solid #ddd;">
            ${sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
          </select>
        `;
        popupOptions.appendChild(sizeWrapper);

        selectedOptions.size = sizes[0];
      }

      popup.classList.remove("hidden");

    } catch (err) {
      console.error("Error loading product:", err);
    }
  };

  // Get selected variant
  const getSelectedVariantId = () => {
    if (!currentProduct) return null;
    const selects = popupOptions.querySelectorAll("select[data-option]");
    selects.forEach(s => {
      selectedOptions[s.dataset.option] = s.value;
    });

    const variant = currentProduct.variants.find(v =>
      (!selectedOptions.size || v.option1 === selectedOptions.size) &&
      (!selectedOptions.color || v.option2 === selectedOptions.color)
    );
    return (variant || currentProduct.variants[0]).id;
  };

  // Add to cart
  addBtn.addEventListener("click", async () => {
    const variantId = getSelectedVariantId();
    if (!variantId) return;

    await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    });

    popup.classList.add("hidden");
  });

  // Attach quick-view buttons
  document.querySelectorAll(".quick-view").forEach(btn => {
    btn.addEventListener("click", () => openPopup(btn.dataset.handle));
  });

  // Close popup
  closeBtn?.addEventListener("click", () => popup.classList.add("hidden"));
});
