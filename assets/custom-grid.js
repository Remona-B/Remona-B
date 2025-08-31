document.addEventListener('DOMContentLoaded', () => {
  const popup = document.getElementById('product-popup');
  const popupBody = document.getElementById('popup-body');
  const closeBtn = document.querySelector('#product-popup .close');


  const openPopup = async (handle) => {
    const res = await fetch(/products/${handle}.js);
    const product = await res.json();

    const price = (product.price / 100).toFixed(2);

  
    const optionsHtml = product.options.map((optName, idx) => {
      const values = [...new Set(product.variants.map(v => v[option${idx + 1}]))];
      return `
        <label style="display:block;margin:.5rem 0 .25rem 0;">${optName}</label>
        <select data-option-index="${idx}" style="width:100%;padding:.5rem;border:1px solid #ddd;border-radius:8px;">
          ${values.map(v => <option value="${v}">${v}</option>).join('')}
        </select>
      `;
    }).join('');

    popupBody.innerHTML = `
      <div class="popup-product" style="display:grid;grid-template-columns:120px 1fr;gap:1rem;align-items:start;">
        <img src="${product.images[0] || ''}" alt="${product.title}" style="width:120px;height:auto;border-radius:8px;">
        <div>
          <h2 style="margin:0 0 .25rem 0;">${product.title}</h2>
          <p style="margin:0 0 1rem 0;">${Shopify.currency.active} ${price}</p>
          <div class="popup-options">${optionsHtml}</div>
          <button id="popup-add" style="margin-top:1rem;padding:.75rem 1rem;background:#000;color:#fff;border:0;border-radius:8px;cursor:pointer;">
            Add to cart
          </button>
        </div>
      </div>
    `;

    popup.classList.remove('hidden');

    const getSelectedVariantId = () => {
      const selects = popupBody.querySelectorAll('select[data-option-index]');
      const chosen = Array.from(selects).map(s => s.value);
      const variant = product.variants.find(v =>
        chosen.every((val, i) => v[option${i + 1}] === val)
      );
      return (variant || product.variants[0]).id;
    };

    document.getElementById('popup-add').onclick = async () => {
      const variantId = getSelectedVariantId();

      await fetch('/cart/add.js', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: variantId, quantity: 1 })
      });

      popup.classList.add('hidden');
    };
  };


  document.querySelectorAll('.view-details').forEach(btn => {
    btn.addEventListener('click', () => openPopup(btn.dataset.handle));
  });

  if (closeBtn) closeBtn.addEventListener('click', () => popup.classList.add('hidden'));
});
