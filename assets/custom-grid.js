document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const popupImage = document.getElementById('popup-image');
  const popupTitle = document.getElementById('popup-title');
  const popupPrice = document.getElementById('popup-price');
  const popupDescription = document.getElementById('popup-description');
  const popupOptions = document.getElementById('popup-options');
  const addBtn = document.getElementById('popup-add-to-cart');
  const closeBtn = popup.querySelector('.close');

  let currentProduct = null;

  // Open product popup
  const openPopup = async (handle) => {
    try {
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();
      currentProduct = product;

      popupImage.src = product.images[0] || '';
      popupTitle.textContent = product.title;
      popupPrice.textContent = `${Shopify.currency.active} ${(product.price/100).toFixed(2)}`;
      popupDescription.textContent = product.description || '';

      // Build options (color/size/etc.)
      popupOptions.innerHTML = product.options.map((opt, idx) => {
        const values = [...new Set(product.variants.map(v => v[`option${idx+1}`]))];
        if(values.length <= 5){ 
          return `
            <div class="popup-option">
              <label>${opt}</label>
              <div>
                ${values.map(v => `<button type="button" data-opt="${idx}" data-val="${v}">${v}</button>`).join('')}
              </div>
            </div>
          `;
        } else {
          return `
            <div class="popup-option">
              <label>${opt}</label>
              <select data-opt="${idx}">
                ${values.map(v => `<option value="${v}">${v}</option>`).join('')}
              </select>
            </div>
          `;
        }
      }).join('');

      popup.classList.remove('hidden');
    } catch (err) {
      console.error(err);
    }
  };

  // Get selected variant
  const getSelectedVariant = () => {
    if (!currentProduct) return null;
    const chosen = [];

    popupOptions.querySelectorAll('[data-opt]').forEach(el => {
      if(el.tagName === 'SELECT'){
        chosen[el.dataset.opt] = el.value;
      } else if(el.tagName === 'BUTTON' && el.classList.contains('active')){
        chosen[el.dataset.opt] = el.dataset.val;
      }
    });

    return currentProduct.variants.find(v =>
      chosen.every((val, i) => !val || v[`option${i+1}`] === val)
    ) || currentProduct.variants[0];
  };

  // Click handlers
  document.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', () => openPopup(btn.dataset.handle));
  });

  closeBtn.addEventListener('click', () => popup.classList.add('hidden'));

  // Handle option buttons
  popupOptions.addEventListener('click', (e) => {
    if(e.target.tagName === 'BUTTON'){
      const opt = e.target.dataset.opt;
      popupOptions.querySelectorAll(`button[data-opt="${opt}"]`).forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
    }
  });

  // Add to cart
  addBtn.addEventListener('click', async () => {
    const variant = getSelectedVariant();
    if(!variant) return;

    await fetch('/cart/add.js', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ id:variant.id, quantity:1 })
    });

    popup.classList.add('hidden');
  });
});
