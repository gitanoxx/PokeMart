/* ====== Catálogo Pokémon ====== */
window.ITEMS = [
  { id:'pokeball',    slug:'poke-ball',    nombre:'Poké Ball',     price:200,  desc:'Bola estándar para capturar Pokémon.' , tag:'Básico' },
  { id:'greatball',   slug:'great-ball',   nombre:'Great Ball',    price:600,  desc:'Mayor tasa de captura.',                tag:'Mejorada' },
  { id:'ultraball',   slug:'ultra-ball',   nombre:'Ultra Ball',    price:1200, desc:'Alta tasa de captura.',                 tag:'Premium' },
  { id:'potion',      slug:'potion',       nombre:'Poción',        price:300,  desc:'Restaura 20 PS.',                       tag:'Curación' },
  { id:'superpotion', slug:'super-potion', nombre:'Súper Poción',  price:700,  desc:'Restaura 50 PS.',                       tag:'Curación' },
  { id:'revive',      slug:'revive',       nombre:'Revivir',       price:1500, desc:'Revive a un Pokémon con 50% PS.',      tag:'Combate' },
  { id:'rarecandy',   slug:'rare-candy',   nombre:'Caramelo Raro', price:4800, desc:'Sube 1 nivel al Pokémon.',              tag:'Raro' },
  { id:'repel',       slug:'repel',        nombre:'Repelente',     price:350,  desc:'Aleja Pokémon salvajes por un tiempo.', tag:'Exploración' },
  { id:'escape',      slug:'escape-rope',  nombre:'Cuerda Huida',  price:550,  desc:'Escapa de cuevas al instante.',         tag:'Exploración' },
];

/* ====== Estilos para animaciones ====== */
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -60%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translate(-50%, -50%); }
    to { opacity: 0; transform: translate(-50%, -40%); }
  }
`;
document.head.appendChild(style);

/* ====== Estado Global ====== */
window.money = parseInt(localStorage.getItem('money')) || 2000;
window.cartItems = new Map(JSON.parse(localStorage.getItem('cartItems') || '[]'));
window.currentUser = localStorage.getItem('currentUser');

// Si no existe getItemSprite (porque estamos en la página del carrito), creamos un fallback
if (!window.getItemSprite) {
  const spriteCache = new Map();
  const FALLBACK_GITHUB = (slug)=> `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

  window.getItemSprite = async function(slug){
    if(!slug) return '';
    if(spriteCache.has(slug)) return spriteCache.get(slug);
    const finalUrl = FALLBACK_GITHUB(slug);
    spriteCache.set(slug, finalUrl);
    return finalUrl;
  }
}

// Detectar en qué página estamos
const isCartPage = window.location.pathname.includes('cart.html');

// Referencias DOM para la página del carrito
let $cartItems, $cartTotal;

/* ====== Funciones ====== */
window.setMoney = function(val) {
  window.money = Math.max(0, val);
  // Actualizar el elemento money si existe (ya sea en la página principal o en el carrito)
  const moneyElement = window.$money || document.getElementById('money');
  if (moneyElement) {
    moneyElement.textContent = window.money;
  }
  localStorage.setItem('money', window.money);
}

window.toast = function(msg, ok = true) {
  if (!window.$toastBubble || !window.$toast) return;
  window.$toastBubble.innerHTML = ''; // Limpiar cualquier contenido previo
  window.$toastBubble.textContent = msg;
  window.$toastBubble.className = 'bubble';
  
  const style = {
    background: ok ? '#d4edda' : '#f8d7da',
    color: ok ? '#155724' : '#721c24',
    border: `1px solid ${ok ? '#c3e6cb' : '#f5c6cb'}`,
    padding: '10px 14px',
    borderRadius: '12px',
    fontWeight: '700',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    display: 'inline-block'
  };
  
  Object.assign(window.$toastBubble.style, style);
  window.$toast.classList.add('show');
  
  clearTimeout(window.toast.t);
  window.toast.t = setTimeout(() => window.$toast.classList.remove('show'), 1600);
}

window.updateCart = function() {
  localStorage.setItem('cartItems', JSON.stringify(Array.from(window.cartItems.entries())));
  window.renderCart();
}

// Función para cargar el sprite de un item
function loadItemSprite(item, row) {
  if (!item.slug) return;
  
  const img = row.querySelector('.sprite');
  if (!img) return;

  window.getItemSprite(item.slug)
    .then(url => { 
      if (url) {
        img.src = url;
        img.onload = () => {
          row.classList.add('loaded');
        };
      }
    })
    .catch(() => {
      const iconDiv = row.querySelector('.meta > div:first-child');
      iconDiv.textContent = '🧩';
    });
}

window.renderCart = function() {
  // Verificar si estamos en la página del carrito
  if (isCartPage && $cartItems && $cartTotal) {
    $cartItems.innerHTML = '';
    if (window.cartItems.size === 0) {
      $cartItems.innerHTML = '<div class="empty-cart">Tu carrito está vacío. ¡Vuelve a la tienda para comprar!</div>';
      $cartTotal.textContent = '0₽';
      return;
    }

    let total = 0;
    const frag = document.createDocumentFragment();

    for (const [id, qty] of window.cartItems.entries()) {
      const item = window.ITEMS.find(x => x.id === id);
      if (!item) continue;

      const itemTotal = item.price * qty;
      total += itemTotal;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="meta">
          <div style="width:28px;height:28px;display:grid;place-items:center">
            ${item.slug ? `<img class="sprite" style="width:28px;height:28px" alt="${item.nombre}"/>` : '🧩'}
          </div>
          <div class="item-details">
            <div class="item-name">${item.nombre}</div>
            <div class="item-price">${item.price}₽ x ${qty}</div>
          </div>
        </div>
        <div class="item-total">${itemTotal}₽</div>
        <div class="item-actions">
          <button class="btn secondary" data-action="remove" data-id="${id}">Eliminar</button>
        </div>
      `;
      frag.appendChild(row);
      loadItemSprite(item, row);
    }

    $cartItems.appendChild(frag);
    $cartTotal.textContent = `${total}₽`;
  }
  // Si estamos en la página principal, renderizar el mini carrito
  else if (window.$cartList) {
    window.$cartList.innerHTML = '';
    if (window.cartItems.size === 0) {
      window.$cartList.innerHTML = '<div style="opacity:.8">Tu mochila está vacía. ¡Hazte con todos! 🧢</div>';
      return;
    }

    const frag = document.createDocumentFragment();
    for (const [id, qty] of window.cartItems.entries()) {
      const item = window.ITEMS.find(x => x.id === id);
      if (!item) continue;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="meta">
          <div style="width:28px;height:28px;display:grid;place-items:center">
            ${item.slug ? `<img class="sprite" style="width:28px;height:28px" alt="${item.nombre}"/>` : '🧩'}
          </div>
          <div>${item.nombre}</div>
        </div>
        <div class="qty">x${qty}</div>
        <div class="price">${item.price * qty}₽</div>
        <button class="btn secondary" data-sell="${id}">Descartar</button>
      `;
      frag.appendChild(row);
      loadItemSprite(item, row);
    }
    window.$cartList.appendChild(frag);
  }
}

/* ====== Event Listeners ====== */
if (isCartPage) {
  document.addEventListener('DOMContentLoaded', () => {
    // Inicializar elementos DOM
    $cartItems = document.getElementById('cartItems');
    $cartTotal = document.getElementById('cartTotal');
    
    if ($cartItems && $cartTotal) {
      window.setMoney(window.money);
      window.renderCart();
    }

    // Configurar event listener para eliminar items
    if ($cartItems) {
      $cartItems.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="remove"]');
        if (!btn) return;

        const id = btn.dataset.id;
        const item = window.ITEMS.find(x => x.id === id);
        if (!item) return;

        window.cartItems.delete(id);
        window.updateCart();
        window.toast(`${item.nombre} eliminado del carrito`);
      });
    }

    // Configurar event listener para el checkout
    const btnCheckout = document.getElementById('btnCheckout');
    if (btnCheckout) {
      btnCheckout.addEventListener('click', () => {
        if (window.cartItems.size === 0) {
          window.toast('El carrito está vacío', false);
          return;
        }

        // Mostrar mensaje de agradecimiento grande en pantalla
        const thanksMessage = document.createElement('div');
        thanksMessage.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          text-align: center;
          z-index: 1000;
          animation: fadeIn 0.5s ease-out;
        `;
        thanksMessage.innerHTML = `
          <h2 style="color: #2c3e50; margin-bottom: 1rem; font-size: 2rem;">¡Gracias por tu compra! 🎉</h2>
          <p style="color: #34495e; font-size: 1.2rem;">¡Vuelve pronto a PokéMart!</p>
        `;
        document.body.appendChild(thanksMessage);

        window.cartItems.clear();
        window.updateCart();
        window.toast('¡Compra realizada con éxito! 🎉');
        
        setTimeout(() => {
          thanksMessage.style.animation = 'fadeOut 0.5s ease-in forwards';
          setTimeout(() => {
            document.body.removeChild(thanksMessage);
            window.location.href = 'index.html';
          }, 500);
        }, 2000);
      });
    }
  });
}

// Si no estamos en la página del carrito, no necesitamos hacer nada más aquí
