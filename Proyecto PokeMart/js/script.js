/* ====== Estado ====== */

// Variables DOM globales
window.$items = null;
window.$cartList = null;
window.$toast = null;
window.$toastBubble = null;
window.$filterControls = null;
window.$filterBtns = null;
window.$authButtons = null;
window.$wallet = null;
window.$logoutContainer = null;
window.$currentUserSpan = null;

// Usando las funciones de cart.js

// Lógica de autenticación en la página
function updateAuthUI() {
  if (currentUser) {
    window.$authButtons.classList.add('d-none');
    window.$wallet.classList.remove('d-none');
    window.$logoutContainer.classList.remove('d-none');
    window.$currentUserSpan.textContent = `Hola, ${currentUser}!`;
    // Aquí podrías cargar el dinero y la mochila del usuario desde localStorage
  } else {
    window.$authButtons.classList.remove('d-none');
    window.$wallet.classList.add('d-none');
    window.$logoutContainer.classList.add('d-none');
  }
}

// Event Listeners para los nuevos botones
document.getElementById('btnLogin').addEventListener('click', () => {
  window.location.href = 'login.html';
});

document.getElementById('btnRegister').addEventListener('click', () => {
  window.location.href = 'login.html'; // Puedes redirigir al mismo login y manejar el estado
});

document.getElementById('btnLogout').addEventListener('click', () => {
  localStorage.removeItem('currentUser');
  currentUser = null;
  updateAuthUI();
  setMoney(900000000); // O resetear el estado de la tienda
  window.cartItems.clear();
  window.renderCart();
  window.toast('Sesión cerrada. ¡Vuelve pronto!', true);
});

// El resto de tu código JS se mantiene igual...
/* ====== Sprites desde PokéAPI con caché y fallback ====== */
const spriteCache = new Map();
const FALLBACK_GITHUB = (slug)=> `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`;

window.getItemSprite = async function(slug){
  if(!slug) return '';
  if(spriteCache.has(slug)) return spriteCache.get(slug);
  try{
    const res = await fetch(`https://pokeapi.co/api/v2/item/${slug}`);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const data = await res.json();
    const url = data?.sprites?.default || '';
    const finalUrl = url || FALLBACK_GITHUB(slug);
    spriteCache.set(slug, finalUrl);
    return finalUrl;
  }catch(e){
    const finalUrl = FALLBACK_GITHUB(slug);
    spriteCache.set(slug, finalUrl);
    return finalUrl;
  }
}

/* ====== Render ====== */
async function renderItems(){
  if (!window.ITEMS || !$items) {
    console.error('ITEMS o elemento items no están definidos');
    return;
  }

  // Limpiar el contenedor de items primero
  $items.innerHTML = '';
  
  const frag = document.createDocumentFragment();
  const loadingPromises = [];
  
  window.ITEMS.forEach(it =>{
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="icon" aria-hidden="true">
        ${it.slug ? `<img class="sprite" alt="${it.nombre}" />` : '🧩'}
      </div>
      <h4>${it.nombre}</h4>
      <p>${it.desc}</p>
      <div class="tag">${it.tag || ''}</div>
      <div class="price">
        <span>${it.price}₽</span>
        <button class="btn buy" data-id="${it.id}">Añadir</button>
      </div>
    `;
    frag.appendChild(card);

    if(it.slug){
      const img = card.querySelector('.sprite');
      const promise = getItemSprite(it.slug)
        .then(url => { 
          if (url) {
            img.src = url;
            img.onload = () => {
              card.classList.add('loaded');
            };
          } else {
            throw new Error('No sprite URL');
          }
        })
        .catch(() => {
          const iconDiv = card.querySelector('.icon');
          iconDiv.textContent = '🧩';
        });
      loadingPromises.push(promise);
    }
  });
  
  $items.appendChild(frag);
  
  try {
    // Esperar a que todas las imágenes se carguen
    await Promise.all(loadingPromises);
    console.log('Todos los items se han cargado correctamente');
  } catch (error) {
    console.error('Error al cargar algunos sprites:', error);
  }
  
  // Agregar el event listener solo una vez
  if (!$items.hasAttribute('data-initialized')) {
    $items.addEventListener('click', onBuyClick);
    $items.setAttribute('data-initialized', 'true');
  }
}

function onBuyClick(e){
  const btn = e.target.closest('.buy');
  if(!btn) return;

  // NUEVA VALIDACIÓN: Si no hay usuario logeado, mostrar un mensaje y detener la compra
  if (!currentUser) {
    toast('Debes iniciar sesión para comprar.', false);
    btn.animate([
      { transform:'translateX(0)' },
      { transform:'translateX(-4px)' },
      { transform:'translateX(4px)' },
      { transform:'translateX(0)' },
    ], { duration: 220 });
    return;
  }

  const id = btn.dataset.id;
  const it = window.ITEMS.find(x=>x.id===id);
  if(!it) return;
  if(window.money < it.price){
    window.toast('Dinero insuficiente (₽).', false);
    btn.animate([
      { transform:'translateX(0)' },
      { transform:'translateX(-4px)' },
      { transform:'translateX(4px)' },
      { transform:'translateX(0)' },
    ], { duration: 220 });
    return;
  }
  window.setMoney(window.money - it.price);
  // Actualizar el carrito
  window.cartItems.set(id, (window.cartItems.get(id)||0)+1);
  
  // Actualizar el carrito y guardar en localStorage
  window.updateCart();
  localStorage.setItem('cartItems', JSON.stringify(Array.from(window.cartItems.entries())));
  
  window.toast(`¡Compraste ${it.nombre}! ✅`);
}

// Usando renderCart de cart.js

function setupCartListeners() {
  if (!window.$cartList) return;
  
  window.$cartList.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-sell]');
    if(!btn) return;

    const id = btn.dataset.sell;
    const it = window.ITEMS.find(x=>x.id===id);
    const qty = window.cartItems.get(id) || 0;
    if(qty <= 0) return;

    // Actualizar el carrito
    window.cartItems.set(id, qty - 1);
    
    if(qty - 1 <= 0) {
      window.cartItems.delete(id);
    }
    
    const refund = it.price;
    window.setMoney(window.money + refund);
    
    // Actualizar el carrito y guardar en localStorage
    window.updateCart();
    localStorage.setItem('cartItems', JSON.stringify(Array.from(window.cartItems.entries())));
    
    window.toast(`Devolviste ${it.nombre} (+${refund}₽)`);
  });
}

/* ====== Nueva funcionalidad de filtrado ====== */
function filterItems(filterTag) {
  const cards = $items.querySelectorAll('.card');
  cards.forEach(card => {
    const cardTag = card.querySelector('.tag').textContent;
    if (filterTag === 'all' || cardTag === filterTag) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function setupFilterListeners() {
  if (!window.$filterControls || !window.$filterBtns) return;

  window.$filterControls.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const filterValue = btn.dataset.filter;
    filterItems(filterValue);

    window.$filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

// Los event listeners se configuran en initializeApp

// Arranque
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

function initializeApp() {
  // Asegurarse de que estamos en la página principal y que ITEMS está cargado
  if (!window.ITEMS) {
    console.error('ITEMS no está disponible. Asegúrate de que cart.js se carga primero.');
    return;
  }

  // Inicializar elementos DOM
  window.$items = document.getElementById('items');
  if (window.$items) {
    window.$money = document.getElementById('money');
    window.$cartList = document.getElementById('cartList');
    window.$toast = document.getElementById('toast');
    window.$toastBubble = document.getElementById('toastBubble');
    window.$filterControls = document.querySelector('.filter-controls');
    window.$filterBtns = document.querySelectorAll('.filter-btn');
    window.$authButtons = document.getElementById('auth-buttons');
    window.$wallet = document.getElementById('wallet');
    window.$logoutContainer = document.getElementById('logout-btn-container');
    window.$currentUserSpan = document.getElementById('currentUserSpan');

    // Debug
    console.log('Inicializando aplicación...');
    console.log('Items disponibles:', window.ITEMS);
    console.log('Elemento items:', window.$items);
    
    // Actualizar interfaz
    updateAuthUI();
    
    // Establecer el dinero inicial (usar el valor guardado o el valor por defecto)
    const savedMoney = parseInt(localStorage.getItem('money')) || 900000000;
    console.log('Dinero inicial:', savedMoney);
    window.setMoney(savedMoney);
    
    // Configurar event listeners
    setupCartListeners();
    setupFilterListeners();
    
    // Configurar botones de control
    if (document.getElementById('btnReset')) {
      document.getElementById('btnReset').addEventListener('click', ()=>{
        window.cartItems.clear(); 
        window.setMoney(900000000); 
        window.renderCart(); 
        window.toast('Poké Mart reiniciada');
      });
    }

    if (document.getElementById('btnAdd')) {
      document.getElementById('btnAdd').addEventListener('click', ()=>{
        window.setMoney(window.money + 50); 
        window.toast('+50₽');
      });
    }

    if (document.getElementById('btnGoToCart')) {
      document.getElementById('btnGoToCart').addEventListener('click', () => {
        if (!currentUser) {
          window.toast('Debes iniciar sesión para ver tu carrito.', false);
          return;
        }
        
        // Guardar el estado actual en localStorage
        localStorage.setItem('cartItems', JSON.stringify(Array.from(window.cartItems.entries())));
        localStorage.setItem('money', window.money.toString());
        
        // Redirigir al carrito
        window.location.href = 'cart.html';
      });
    }

    // Renderizar items solo si están disponibles
    if (window.ITEMS && window.ITEMS.length > 0) {
      renderItems();
      window.renderCart();
    } else {
      console.error('Error: window.ITEMS no está disponible o está vacío');
    }
  }
}