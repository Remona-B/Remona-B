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

  // Open popup
  async function openPopup(handle) {
    try {
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();
      currentProduct = product;

      // Fill static content
      popupImage.src = product.images[0] || '';
      popupTitle.textContent = product.title;
      popupPrice.textContent = `${Shopify.currency.active} ${(product.price / 100).toFixed(2)}`;
      popupDesc.textContent =
        "This one-piece swimsuit is crafted from jersey featuring an allover micro Monogram motif in relief.";

      // Build static Size + Color options
      popupOptions.innerHTML = "";

      // SIZE (if available in any option)
      const sizeValues = [...new Set(product.variants.map(v => v.option1))].filter(v => v);
      if (sizeValues.length > 1) {
        popupOptions.innerHTML += `
          <div class="popup-option">
            <label style="display:block;margin:.5rem 0 .25rem;">Size</label>
            <select data-option-index="0" style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px;">
              ${sizeValues.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
          </div>`;
      }

      // COLOR (if available in any option)
      const colorValues = [...new Set(product.variants.map(v => v.option2))].filter(v => v);
      if (colorValues.length > 1) {
        popupOptions.innerHTML += `
          <div class="popup-option">
            <label style="display:block;margin:.5rem 0 .25rem;">Color</label>
            <select data-option-index="1" style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:6px;">
              ${colorValues.map(v => `<option value="${v}">${v}</option>`).join('')}
            </select>
          </div>`;
      }

      popup.classList.remove('hidden');
    } catch (err) {
      console.error('Error loading product:', err);
    }
  }

  // Get selected variant
  function getSelectedVariantId() {
    if (!currentProduct) return null;
    const selects = popupOptions.querySelectorAll('select[data-option-index]');
    const chosen = Array.from(selects).map(s => s.value);
    const variant = currentProduct.variants.find(v =>
      chosen.every((val, i) => v[`option${i + 1}`] === val)
    );
    return (variant || currentProduct.variants[0]).id;
  }

  // Add to cart
  addBtn.addEventListener('click', async () => {
    const variantId = getSelectedVariantId();
    if (!variantId) return;

    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    });

    popup.classList.add('hidden');
  });

  // Quick view triggers
  document.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', () => openPopup(btn.dataset.handle));
  });

  // Close popup
  closeBtn?.addEventListener('click', () => popup.classList.add('hidden'));
});
