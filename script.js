/* ============================================================
   CUSTOM FASHION / MORE COLORS - Kids Fashion
   Funcionalidad: menú móvil, dos catálogos paginados, flechas,
    swipe táctil and cart.
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   1. DATOS
   ------------------------------------------------------------ */

// Main collection products. Real photos only.
// Para añadir más, agrega un objeto aquí.
const PRODUCTS = [
  { id: 1,  name: 'Custom Fashion T-Shirt',    price: 9.99,  img: 'images/kids-tshirt.png',   flag: 'New' },
  { id: 3,  name: 'Custom Fashion Jeans',      price: 12.99, img: 'images/kids-jeans.jpg' },
  { id: 4,  name: 'Custom Fashion Jacket',     price: 15.99, img: 'images/kids-coat.webp' },
  { id: 7,  name: 'Custom Fashion Sneakers',   price: 18.99, img: 'images/kids-shoes.jpg',   flag: 'Best' },
  { id: 13, name: 'Custom Fashion Boots',      price: 16.99, img: 'images/kids-boots.webp',  flag: 'New' },
  { id: 14, name: 'Custom Fashion Swimsuit',   price: 10.99, img: 'images/kids-swimsuit.webp' }
];

// Second collection: More Colors (photos from the "more colors" folder)
const THEORY_PRODUCTS = [
  { id: 101, name: 'More Colors T-Shirt',   price: 8.99,  img: 'images/more-colors/tshirt.webp',      flag: 'New' },
  { id: 102, name: 'More Colors Skirt',     price: 11.99, img: 'images/more-colors/skirt.webp' },
  { id: 103, name: 'More Colors Dress',     price: 14.99, img: 'images/more-colors/dress.jpg',       flag: 'Best' },
  { id: 104, name: 'More Colors Heels',     price: 12.99, img: 'images/more-colors/heels.jpg' },
  { id: 105, name: 'More Colors Bag',       price: 13.99, img: 'images/more-colors/bag.webp' },
  { id: 106, name: 'More Colors Cap',       price: 6.99,  img: 'images/more-colors/cap.jpg' },
  { id: 107, name: 'More Colors Waterproof', price: 17.99, img: 'images/more-colors/waterproof.jpg' },
  { id: 108, name: 'More Colors Deadem',    price: 13.99, img: 'images/more-colors/deadem.jpg' }
];

const ALL_PRODUCTS = [...PRODUCTS, ...THEORY_PRODUCTS];

function findProduct(id) {
  return ALL_PRODUCTS.find((x) => x.id === id);
}

const ROWS_PER_PAGE = 2; // filas visibles por página

/* ------------------------------------------------------------
   2. UTILIDADES
   ------------------------------------------------------------ */

const $ = (sel) => document.querySelector(sel);

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

const CART_STORAGE_KEY = 'customfashion_cart_v1';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/* ------------------------------------------------------------
   3. CATÁLOGO PAGINADO (reutilizable)
   ------------------------------------------------------------ */

// Nº de columnas según el ancho (coincide con los breakpoints de CSS)
function getColumns() {
  const w = window.innerWidth;
  if (w >= 1024) return 4; // escritorio
  if (w >= 681)  return 3; // tablet
  return 2;                // celular
}

function cardTemplate(p) {
  return `
    <article class="product-card">
      <div class="card-media">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        ${p.flag ? `<span class="card-flag">${p.flag}</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-name">${p.name}</h3>
        <span class="card-price">${formatPrice(p.price)}</span>
        <button class="add-btn" data-id="${p.id}">Add to Cart</button>
      </div>
    </article>`;
}

// Fabrica un catálogo paginado (grid + dots + flechas + swipe)
function buildCatalog(cfg) {
  const { gridEl, viewportEl, dotsEl, prevBtn, nextBtn, products } = cfg;
  const state = { pageIndex: 0 };

  function ipp() {
    return getColumns() * ROWS_PER_PAGE;
  }

  function pages() {
    const out = [];
    const size = ipp();
    for (let i = 0; i < products.length; i += size) {
      out.push(products.slice(i, i + size));
    }
    return out;
  }

  function render() {
    const allPages = pages();
    if (state.pageIndex > allPages.length - 1) state.pageIndex = allPages.length - 1;

    gridEl.classList.add('switching');

    window.setTimeout(() => {
      gridEl.innerHTML = allPages[state.pageIndex].map(cardTemplate).join('');
      gridEl.classList.remove('switching');
    }, 210);

    dotsEl.innerHTML = allPages.length <= 1
      ? ''
      : Array.from({ length: allPages.length }, (_, i) =>
          `<button class="dot${i === state.pageIndex ? ' active' : ''}" data-page="${i}" aria-label="Page ${i + 1}"></button>`
        ).join('');

    prevBtn.disabled = state.pageIndex <= 0;
    nextBtn.disabled = state.pageIndex >= allPages.length - 1 || allPages.length <= 1;
  }

  function goTo(index) {
    const allPages = pages();
    if (index < 0 || index > allPages.length - 1) return;
    state.pageIndex = index;
    render();
  }

  prevBtn.addEventListener('click', () => goTo(state.pageIndex - 1));
  nextBtn.addEventListener('click', () => goTo(state.pageIndex + 1));

  dotsEl.addEventListener('click', (e) => {
    const dot = e.target.closest('.dot');
    if (dot) goTo(Number(dot.dataset.page));
  });

  let startX = null;
  let startY = null;

  viewportEl.addEventListener('pointerdown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
  });

  viewportEl.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      goTo(state.pageIndex + (dx > 0 ? -1 : 1));
    }
    startX = null;
    startY = null;
  });

  viewportEl.addEventListener('pointercancel', () => {
    startX = null;
    startY = null;
  });

  gridEl.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-btn');
    if (addBtn) addToCart(Number(addBtn.dataset.id));
  });

  render();
  return { render, goTo, ipp };
}

const catalogs = [];
const catalogMain = buildCatalog({
  gridEl:     $('#catalogGrid'),
  viewportEl: $('#catalogViewport'),
  dotsEl:     $('#catalogDots'),
  prevBtn:    $('#prevBtn'),
  nextBtn:    $('#nextBtn'),
  products:   PRODUCTS
});
catalogs.push(catalogMain);

const catalogTheory = buildCatalog({
  gridEl:     $('#theoryGrid'),
  viewportEl: $('#theoryViewport'),
  dotsEl:     $('#theoryDots'),
  prevBtn:    $('#theoryPrevBtn'),
  nextBtn:    $('#theoryNextBtn'),
  products:   THEORY_PRODUCTS
});
catalogs.push(catalogTheory);

/* ------------------------------------------------------------
   4. MENÚ MÓVIL
   ------------------------------------------------------------ */

const menuToggle = $('#menuToggle');
const siteNav    = $('#siteNav');

function closeMenu() {
  menuToggle.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  siteNav.classList.remove('open');
}

menuToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  menuToggle.classList.toggle('open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') closeMenu();
});

/* ------------------------------------------------------------
   6. CARRITO
   ------------------------------------------------------------ */

const cartBtn        = $('#cartButton');
const cartCount      = $('#cartCount');
const cartDrawer     = $('#cartDrawer');
const cartOverlay    = $('#cartOverlay');
const closeCartBtn   = $('#closeCart');
const cartItemsEl    = $('#cartItems');
const cartSubtotalEl = $('#cartSubtotal');
const checkoutBtn    = $('#checkoutBtn');
const toastEl        = $('#toast');

let cart = loadCart();
let toastTimeout = null;

function findLine(id) {
  return cart.find((it) => it.id === id);
}

function cartQuantity() {
  return cart.reduce((sum, it) => sum + it.qty, 0);
}

function cartSubtotal() {
  return cart.reduce((sum, it) => {
    const p = findProduct(it.id);
    return p ? sum + p.price * it.qty : sum;
  }, 0);
}

function cartLines() {
  return cart.map((item) => {
    const p = findProduct(item.id);
    return { ...item, product: p };
  });
}

function addToCart(id) {
  const p = findProduct(id);
  if (!p) return;

  const found = findLine(id);
  if (found) found.qty += 1;
  else cart.push({ id, qty: 1 });

  saveCart();
  updateCartUI();
  showToast(`${p.name} added to cart`);

  const clicked = document.querySelector(`.add-btn[data-id="${id}"]`);
  if (clicked) {
    clicked.textContent = 'Added \u2713';
    const orig = clicked.textContent;
    window.setTimeout(() => {
      clicked.textContent = orig === 'Added \u2713' ? 'Add to Cart' : orig;
    }, 900);
  }
}

function changeQty(id, delta) {
  const item = findLine(id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) item.qty = 1;
  saveCart();
  updateCartUI();
}

function removeItem(id) {
  cart = cart.filter((it) => it.id !== id);
  saveCart();
  updateCartUI();
}

function updateCartUI() {
  cartCount.textContent = cartQuantity();
  cartCount.classList.remove('pop');
  void cartCount.offsetWidth;
  cartCount.classList.add('pop');

  const lines = cartLines();

  if (lines.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="empty-emoji">&#128722;</span>
        <p>Your cart is empty.<br>Add a piece from the collections!</p>
      </div>`;
  } else {
    cartItemsEl.innerHTML = lines.map((line) => {
      return `
        <div class="cart-item">
          <img src="${line.product.img}" alt="${line.product.name}" />
          <div class="cart-item-info">
            <span class="cart-item-name">${line.product.name}</span>
            <div class="qty-control">
              <button class="qty-btn" data-action="minus" data-id="${line.id}" aria-label="Decrease quantity">&minus;</button>
              <span class="qty-value">${line.qty}</span>
              <button class="qty-btn" data-action="plus" data-id="${line.id}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">${formatPrice(line.product.price)} each</span>
            <span class="cart-item-total">${formatPrice(line.product.price * line.qty)}</span>
          </div>
          <button class="remove-btn" data-action="remove" data-id="${line.id}">Remove</button>
        </div>`;
    }).join('');
  }

  cartSubtotalEl.textContent = formatPrice(cartSubtotal());
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ------------------------------------------------------------
   7. EVENTOS GLOBALES
   ------------------------------------------------------------ */

cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCartDrawer);
cartOverlay.addEventListener('click', closeCartDrawer);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCartDrawer();
});

cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);

  if (btn.dataset.action === 'plus')   changeQty(id, 1);
  if (btn.dataset.action === 'minus')  changeQty(id, -1);
  if (btn.dataset.action === 'remove') removeItem(id);
});

checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Your cart is empty');
    return;
  }
  showToast('Checkout coming soon!');
});

window.addEventListener('resize', () => catalogs.forEach((c) => c.render()));

/* ------------------------------------------------------------
   8. INICIALIZACIÓN
   ------------------------------------------------------------ */

updateCartUI();