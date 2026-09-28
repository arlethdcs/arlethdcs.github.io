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
// w/h = dimensiones reales del archivo; reservan espacio y evitan
// saltos de layout y parpadeo al hacer scroll.
const PRODUCTS = [
  { id: 1,  name: 'Custom Fashion T-Shirt',  price: 9.99,  img: 'images/kids-tshirt.png',  w: 665,  h: 665,  flag: 'New' },
  { id: 3,  name: 'Custom Fashion Jeans',    price: 12.99, img: 'images/kids-jeans.jpg',  w: 750,  h: 999 },
  { id: 4,  name: 'Custom Fashion Jacket',   price: 15.99, img: 'images/kids-coat.webp',  w: 1946, h: 2574 },
  { id: 7,  name: 'Custom Fashion Sneakers', price: 18.99, img: 'images/kids-shoes.jpg',  w: 250,  h: 250,  flag: 'Best' },
  { id: 13, name: 'Custom Fashion Boots',    price: 16.99, img: 'images/kids-boots.webp', w: 600,  h: 900,  flag: 'New' },
  { id: 14, name: 'Custom Fashion Swimsuit', price: 10.99, img: 'images/kids-swimsuit.webp', w: 1800, h: 2600 }
];

// Second collection: More Colors (photos from the "more colors" folder)
const THEORY_PRODUCTS = [
  { id: 101, name: 'More Colors T-Shirt',   price: 8.99,  img: 'images/more-colors/tshirt.webp',     w: 512,  h: 637,  flag: 'New' },
  { id: 102, name: 'More Colors Skirt',     price: 11.99, img: 'images/more-colors/skirt.webp',      w: 900,  h: 1342 },
  { id: 103, name: 'More Colors Dress',     price: 14.99, img: 'images/more-colors/dress.jpg',       w: 900,  h: 1200, flag: 'Best' },
  { id: 104, name: 'More Colors Heels',     price: 12.99, img: 'images/more-colors/heels.jpg',       w: 554,  h: 554 },
  { id: 105, name: 'More Colors Bag',       price: 13.99, img: 'images/more-colors/bag.webp',        w: 668,  h: 886 },
  { id: 106, name: 'More Colors Cap',       price: 6.99,  img: 'images/more-colors/cap.jpg',         w: 194,  h: 259 },
  { id: 107, name: 'More Colors Waterproof', price: 17.99, img: 'images/more-colors/waterproof.jpg', w: 387,  h: 516 },
  { id: 108, name: 'More Colors Deadem',    price: 13.99, img: 'images/more-colors/deadem.jpg',      w: 350,  h: 350 }
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
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    /* Modo privado, cuota agotada o almacenamiento bloqueado:
       el carrito sigue funcionando en memoria durante la sesión. */
  }
}

// Elimina del carrito los ids que ya no existen en el catálogo.
// Sin esto, un producto retirado de PRODUCTS dejaba line.product
//undefined y reventaba updateCartUI al abrir el carrito.
function pruneCart() {
  const before = cart.length;
  cart = cart.filter((it) => ALL_PRODUCTS.some((p) => p.id === it.id));
  if (cart.length !== before) saveCart();
}

/* ------------------------------------------------------------
   3. CATÁLOGO PAGINADO (reutilizable)
   ------------------------------------------------------------ */

// Nº de columnas según el ancho. Los breakpoints viven en una sola fuente
// de verdad (MQ_DESKTOP / MQ_TABLET) compartida con las media queries de CSS.
const MQ_DESKTOP = '(min-width: 1024px)';
const MQ_TABLET  = '(min-width: 681px)';

const mqDesktop = window.matchMedia(MQ_DESKTOP);
const mqTablet  = window.matchMedia(MQ_TABLET);

function getColumns() {
  if (mqDesktop.matches) return 4; // escritorio
  if (mqTablet.matches)  return 3; // tablet
  return 2;                        // celular
}

function cardTemplate(p, i) {
  // Solo la primera imagen de la página es prioritaria: es la que entra
  // en el viewport al cargar. El resto se pide bajo demanda.
  const loading = i === 0 ? 'eager' : 'lazy';
  const priority = i === 0 ? 'high' : 'auto';

  return `
    <article class="product-card">
      <div class="card-media">
        <img src="${p.img}" alt="${p.name}"
             width="${p.w}" height="${p.h}"
             loading="${loading}" fetchpriority="${priority}"
             decoding="async" />
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
  const { gridEl, viewportEl, dotsEl, prevBtn, nextBtn, products, label } = cfg;
  const state = { pageIndex: 0 };
  let switchTimer = null;

  function ipp() {
    return getColumns() * ROWS_PER_PAGE;
  }

  // Devuelve siempre al menos una página: así paint() nunca recibe
  // un array vacío y no hay que comprobar el caso en todas partes.
  function pages() {
    const out = [];
    const size = ipp();
    for (let i = 0; i < products.length; i += size) {
      out.push(products.slice(i, i + size));
    }
    return out.length ? out : [[]];
  }

  // Pintado inmediato, sin transición. Es lo que se usa en la primera
  // carga y al redimensionar, donde una animación solo produce parpadeo.
  function paint() {
    const allPages = pages();
    if (state.pageIndex > allPages.length - 1) state.pageIndex = allPages.length - 1;
    if (state.pageIndex < 0) state.pageIndex = 0;

    const items = allPages[state.pageIndex];
    gridEl.innerHTML = items.map((p, i) => cardTemplate(p, i)).join('');

    dotsEl.innerHTML = allPages.length <= 1
      ? ''
      : Array.from({ length: allPages.length }, (_, i) =>
          `<button class="dot${i === state.pageIndex ? ' active' : ''}" data-page="${i}" aria-label="${label} page ${i + 1} of ${allPages.length}" aria-current="${i === state.pageIndex ? 'true' : 'false'}"></button>`
        ).join('');

    prevBtn.disabled = state.pageIndex <= 0;
    nextBtn.disabled = state.pageIndex >= allPages.length - 1 || allPages.length <= 1;
  }

  // Cambio de página con la transición de desvanecido.
  function goTo(index) {
    const allPages = pages();
    if (index < 0 || index > allPages.length - 1) return;
    state.pageIndex = index;

    window.clearTimeout(switchTimer);
    gridEl.classList.add('switching');
    switchTimer = window.setTimeout(paint, 210);

    viewportEl.setAttribute(
      'aria-label',
      `${label}, page ${index + 1} of ${allPages.length}`
    );
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

  paint();
  return { goTo, repaint: paint };
}

const catalogs = [];
const catalogMain = buildCatalog({
  gridEl:     $('#catalogGrid'),
  viewportEl: $('#catalogViewport'),
  dotsEl:     $('#catalogDots'),
  prevBtn:    $('#prevBtn'),
  nextBtn:    $('#nextBtn'),
  products:   PRODUCTS,
  label:      'Fashion 31'
});
catalogs.push(catalogMain);

const catalogTheory = buildCatalog({
  gridEl:     $('#theoryGrid'),
  viewportEl: $('#theoryViewport'),
  dotsEl:     $('#theoryDots'),
  prevBtn:    $('#theoryPrevBtn'),
  nextBtn:    $('#theoryNextBtn'),
  products:   THEORY_PRODUCTS,
  label:      'More Colors'
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
  return cart
    .map((item) => ({ ...item, product: findProduct(item.id) }))
    .filter((line) => line.product); // ids retirados del catálogo
}

function flashAdded(btn) {
  if (!btn || btn.dataset.busy === '1') return;

  btn.dataset.busy = '1';
  btn.textContent = 'Added \u2713';
  btn.disabled = true;

  window.setTimeout(() => {
    btn.dataset.busy = '0';
    btn.textContent = 'Add to Cart';
    btn.disabled = false;
  }, 900);
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

  flashAdded(document.querySelector(`.add-btn[data-id="${id}"]`));
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
          <img src="${line.product.img}" alt="${line.product.name}" width="66" height="82" loading="lazy" />
          <div class="cart-item-info">
            <span class="cart-item-name">${line.product.name}</span>
            <div class="qty-control">
              <button class="qty-btn" data-action="minus" data-id="${line.id}" aria-label="Decrease quantity of ${line.product.name}"${line.qty <= 1 ? ' disabled' : ''}>&minus;</button>
              <span class="qty-value">${line.qty}</span>
              <button class="qty-btn" data-action="plus" data-id="${line.id}" aria-label="Increase quantity of ${line.product.name}">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">${formatPrice(line.product.price)} each</span>
            <span class="cart-item-total">${formatPrice(line.product.price * line.qty)}</span>
          </div>
          <button class="remove-btn" data-action="remove" data-id="${line.id}" aria-label="Remove ${line.product.name} from cart">Remove</button>
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

// El carrito es un <dialog> modal: hay que mover el foco dentro, retenerlo
// mientras está abierto y devolverlo al elemento de partida al cerrarlo.
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
const pageRegions = ['.site-header', '.ticker', 'main', '.site-footer', '.skip-link']
  .map((sel) => document.querySelector(sel))
  .filter(Boolean);

let lastFocused = null;

function isCartOpen() {
  return cartDrawer.classList.contains('open');
}

function openCart() {
  lastFocused = document.activeElement;

  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartDrawer.inert = false;
  document.body.style.overflow = 'hidden';
  pageRegions.forEach((el) => { el.inert = true; });

  closeCartBtn.focus();
}

function closeCartDrawer() {
  if (!isCartOpen()) return;

  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.inert = true;
  document.body.style.overflow = '';
  pageRegions.forEach((el) => { el.inert = false; });

  // Si no sabemos de dónde veníamos (p. ej. se abrió con Enter o por
  // código), devolvemos el foco al botón del carrito en vez de dejarlo
  // perdido en el <body>.
  const target = lastFocused && lastFocused !== document.body && typeof lastFocused.focus === 'function'
    ? lastFocused
    : cartBtn;

  target.focus();
  lastFocused = null;
}

// Mantiene el foco dentro del carrito mientras esté abierto.
function trapFocus(e) {
  if (e.key !== 'Tab' || !isCartOpen()) return;

  const focusable = [...cartDrawer.querySelectorAll(FOCUSABLE)]
    .filter((el) => el.offsetParent !== null);

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ------------------------------------------------------------
   7. EVENTOS GLOBALES
   ------------------------------------------------------------ */

cartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCartDrawer);
cartOverlay.addEventListener('click', closeCartDrawer);
document.addEventListener('keydown', (e) => {
  trapFocus(e);

  if (e.key === 'Escape') {
    // Primero se cierra el carrito; si no está abierto, el menú móvil.
    if (isCartOpen()) closeCartDrawer();
    else closeMenu();
  }
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

// Al redimensionar solo repintamos (sin transición) y una vez por frame.
// Antes se encolaba un setTimeout de 210 ms por cada pixel de arrastre.
let resizeRaf = null;
window.addEventListener('resize', () => {
  if (resizeRaf) return;
  resizeRaf = window.requestAnimationFrame(() => {
    resizeRaf = null;
    catalogs.forEach((c) => c.repaint());
  });
});

/* ------------------------------------------------------------
   8. SCROLL SPY (marca la sección activa del menú)
   ------------------------------------------------------------ */

const navLinks = [...siteNav.querySelectorAll('a[href^="#"]')];

if (navLinks.length && 'IntersectionObserver' in window) {
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const visible = new Set();

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });

      // Si varias secciones se solapan, gana la primera en orden de lectura.
      const active = sections.find((s) => visible.has(s));
      if (!active) return;

      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${active.id}`;
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((s) => spy.observe(s));
}

/* ------------------------------------------------------------
   9. INICIALIZACIÓN
   ------------------------------------------------------------ */

pruneCart();
updateCartUI();