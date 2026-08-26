/* =========================================================================
   [JS:STORAGE] — everything touching localStorage lives here.
   In a real production build, these functions would instead call a secure
   backend API. localStorage is used ONLY because this is a single-file
   mobile-friendly demo/prototype. It is NOT secure for real account,
   payment, or order data — do not use this pattern in production.
   ========================================================================= */
const DB_KEYS = {
  USERS: 'usc_users',
  PRODUCTS: 'usc_products',
  ORDERS: 'usc_orders',
  SESSION: 'usc_session',
  SEEDED: 'usc_seeded_v1',
  CART: 'usc_cart'
};

function dbLoad(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function dbSave(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers(){ return dbLoad(DB_KEYS.USERS, []); }
function saveUsers(u){ dbSave(DB_KEYS.USERS, u); }
function getProducts(){ return dbLoad(DB_KEYS.PRODUCTS, []); }
function saveProducts(p){ dbSave(DB_KEYS.PRODUCTS, p); }
function getOrders(){ return dbLoad(DB_KEYS.ORDERS, []); }
function saveOrders(o){ dbSave(DB_KEYS.ORDERS, o); }
function getSession(){ return dbLoad(DB_KEYS.SESSION, null); }
function saveSession(s){ dbSave(DB_KEYS.SESSION, s); }
function clearSession(){ localStorage.removeItem(DB_KEYS.SESSION); }

/* -- Cart -- */
function getCart(){ return dbLoad(DB_KEYS.CART, []); }
function saveCart(c){ dbSave(DB_KEYS.CART, c); }
function cartCount(){ return getCart().reduce((s,i)=>s+i.qty, 0); }
function addToCart(productId, qty){
  qty = qty || 1;
  const cart = getCart();
  const existing = cart.find(i => i.productId === productId);
  const product = getProduct(productId);
  if(!product) return;
  const maxQty = Math.max(0, product.stock);
  if(existing){
    existing.qty = Math.min(existing.qty + qty, maxQty || existing.qty + qty);
  } else {
    cart.push({productId, qty: Math.min(qty, maxQty || qty)});
  }
  saveCart(cart);
  refreshCartBadge();
}
function setCartQty(productId, qty){
  let cart = getCart();
  const product = getProduct(productId);
  const maxQty = product ? Math.max(1, product.stock) : 99;
  if(qty <= 0){
    cart = cart.filter(i => i.productId !== productId);
  } else {
    const item = cart.find(i => i.productId === productId);
    if(item) item.qty = Math.min(qty, maxQty);
  }
  saveCart(cart);
  refreshCartBadge();
}
function removeFromCart(productId){
  saveCart(getCart().filter(i => i.productId !== productId));
  refreshCartBadge();
}
function clearCart(){ saveCart([]); refreshCartBadge(); }
function cartLineItems(){
  return getCart().map(i => {
    const product = getProduct(i.productId);
    return product ? {product, qty:i.qty, lineTotal: product.price*i.qty} : null;
  }).filter(Boolean);
}
function cartTotal(){
  return cartLineItems().reduce((s,i)=>s+i.lineTotal, 0);
}
function refreshCartBadge(){
  const badge = document.getElementById('cartBadge');
  if(!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count>0 ? 'flex' : 'none';
}

function uid(prefix){
  return prefix + '-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random()*90+10);
}

// simple 1x1-ish placeholder colored swatch, used when a product has no
// uploaded image yet — keeps everything inside this one HTML file with no
// external image dependency.
function placeholderImg(seed){
  const colors = ['8A2432','D9A441','4A5568','6B1B26','B9862F'];
  const c = colors[Math.abs(hashStr(seed)) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
    <rect width="300" height="300" fill="#${c}"/>
    <text x="50%" y="50%" font-family="Poppins,sans-serif" font-size="26" fill="#FAF7F2"
      text-anchor="middle" dominant-baseline="middle" opacity="0.85">USC</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i); h|=0;} return h; }

function seedData(){
  if(localStorage.getItem(DB_KEYS.SEEDED)) return;

  // demo owner + demo customer accounts (see login screen for credentials)
  saveUsers([
    {username:'owner', password:'1234', role:'owner', name:'Shop Owner'},
    {username:'customer', password:'1234', role:'customer', name:'Demo Customer', mobile:'9876543210'}
  ]);

  const sample = [
    {
      id: uid('P'),
      name:'Premium Leatherette Bike Seat Cover',
      price:399, size:'Universal Bike Fit', material:'PU Leatherette',
      details:'Rich stitched PU leatherette cover with breathable mesh lining. Water resistant surface, easy wipe-clean finish. Snug tailored fit for most commuter and sports bikes. Sold per piece — wholesale bulk pricing available.',
      deliveryDays:'5-7 days', stock:120,
      images:[]
    },
    {
      id: uid('P'),
      name:'Air-Mesh Cushion Scooter & Bike Cover',
      price:249, size:'Universal', material:'Air-Mesh Fabric + Foam Cushion',
      details:'Soft cushioned cover for long rides. Reduces back strain, breathable air-mesh outer fabric, elastic-fit corners for a snug install on scooters and bikes.',
      deliveryDays:'3-5 days', stock:200,
      images:[]
    },
    {
      id: uid('P'),
      name:'Heavy-Duty Waterproof Bike Seat Cover',
      price:549, size:'Universal Bike Fit', material:'Waterproof Rexine',
      details:'Diamond-quilted waterproof rexine with contrast piping, premium showroom look. Rain-proof stitching, built to withstand daily outdoor parking and long wholesale-use durability.',
      deliveryDays:'6-9 days', stock:80,
      images:[]
    }
  ];
  saveProducts(sample);
  saveOrders([]);
  localStorage.setItem(DB_KEYS.SEEDED, '1');
}

/* =========================================================================
   [JS:UTIL] — toast notifications, modal/bottom-sheet, validation helpers
   ========================================================================= */
function toast(msg, type){
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast fade-in' + (type ? ' '+type : '');
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(()=>{ el.style.transition='opacity .3s'; el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 2200);
}

function openSheet(innerHtml, opts){
  opts = opts || {};
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="overlay ${opts.center?'center':''}" id="sheetOverlay">
      <div class="sheet slide-up" role="dialog" aria-modal="true">
        ${opts.center ? '' : '<div class="handle"></div>'}
        ${innerHtml}
      </div>
    </div>`;
  document.getElementById('sheetOverlay').addEventListener('click', (e)=>{
    if(e.target.id === 'sheetOverlay') closeSheet();
  });
}
function closeSheet(){
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
}

function confirmDialog({icon, title, message, okLabel, okClass, onConfirm}){
  openSheet(`
    <div class="confirm-box">
      <div class="glyph">${icon || '⚠️'}</div>
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="row">
        <button class="btn btn-ghost" onclick="closeSheet()">Cancel</button>
        <button class="btn ${okClass || 'btn-primary'}" id="confirmOkBtn">${okLabel || 'Confirm'}</button>
      </div>
    </div>`, {center:true});
  document.getElementById('confirmOkBtn').onclick = ()=>{ closeSheet(); onConfirm(); };
}

function validateMobile(v){ return /^[6-9]\d{9}$/.test(v.trim()); }
function validatePincode(v){ return /^\d{6}$/.test(v.trim()); }
function formatINR(n){ return '₹' + Number(n).toLocaleString('en-IN'); }
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* =========================================================================
   [JS:AUTH] — demo authentication (frontend-only). In production this must
   be replaced by a real backend with hashed passwords and server sessions.
   ========================================================================= */
function attemptLogin(role, username, password){
  const users = getUsers();
  const found = users.find(u => u.username === username.trim() && u.password === password && u.role === role);
  if(!found) return null;
  const session = {role: found.role, username: found.username, name: found.name};
  saveSession(session);
  return session;
}

function registerCustomer({name, username, password, mobile}){
  const users = getUsers();
  if(users.some(u => u.username === username)) return {ok:false, msg:'That username is already taken.'};
  users.push({username, password, role:'customer', name, mobile});
  saveUsers(users);
  return {ok:true};
}

function logout(){
  clearSession();
  route('login');
}

/* =========================================================================
   [JS:PRODUCTS] — owner CRUD + shared lookups
   ========================================================================= */
function addProduct(product){
  const products = getProducts();
  products.unshift(product);
  saveProducts(products);
}
function updateProduct(id, patch){
  const products = getProducts();
  const idx = products.findIndex(p => p.id === id);
  if(idx === -1) return;
  products[idx] = {...products[idx], ...patch};
  saveProducts(products);
}
function deleteProduct(id){
  saveProducts(getProducts().filter(p => p.id !== id));
}
function getProduct(id){
  return getProducts().find(p => p.id === id);
}

/* =========================================================================
   [JS:ORDERS] — order + payment lifecycle helpers
   ========================================================================= */
function minAdvance(price){ return Math.ceil(price * 0.5); }

function createOrder(order){
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
}
function updateOrder(id, patch){
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if(idx === -1) return;
  orders[idx] = {...orders[idx], ...patch};
  saveOrders(orders);
  return orders[idx];
}
function getOrder(id){
  return getOrders().find(o => o.id === id);
}
function remainingBalance(order){
  return Math.max(0, order.totalAmount - order.paidAmount);
}

/* =========================================================================
   STATE — small in-memory bits that don't need to persist across reloads
   (current screen, transient selections while filling a form, etc.)
   ========================================================================= */
const UI = {
  screen: 'login',
  loginRole: 'customer',
  currentProductId: null,
  sliderIndex: 0,
  pendingOrderDraft: null,   // holds order form values before payment
  selectedPayMethod: 'upi',
  ownerNewImages: [null, null, null],
  editingProductId: null,
  searchQuery: '',
  sortMode: 'newest'
};

function route(screen, params){
  UI.screen = screen;
  if(params) Object.assign(UI, params);
  window.scrollTo(0,0);
  render();
}

/* =========================================================================
   [JS:CUSTOMER-UI]
   ========================================================================= */

function topbarHtml(role){
  const session = getSession();
  const profileBtn = role === 'customer'
    ? `<button class="icon-btn" onclick="openCustomerProfile()" aria-label="Profile">👤</button>`
    : `<button class="icon-btn" onclick="openOwnerProfile()" aria-label="Profile">👤</button>`;
  const cartBtn = role === 'customer'
    ? `<button class="icon-btn" onclick="route('cart')" aria-label="Cart">🛒<span class="badge" id="cartBadge" style="display:${cartCount()>0?'flex':'none'}">${cartCount()}</span></button>`
    : '';
  return `
  <div class="topbar">
    <div class="brand"><span class="mark">US</span> Unique Seat Cover</div>
    ${role === 'customer' ? `
    <div class="searchwrap">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FAF7F2" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <input type="search" id="searchInput" placeholder="Search seat covers, size, material..." value="${escapeHtml(UI.searchQuery)}" oninput="onSearchInput(this.value)">
    </div>` : `<div style="flex:1"></div>`}
    ${cartBtn}
    ${profileBtn}
  </div>`;
}

function onSearchInput(v){
  UI.searchQuery = v;
  renderProductGrid();
}

function renderCustomerHome(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="page">
        <h1 class="page-title">Our Stocks</h1>
        <p class="page-sub">Genuine seat covers, fitted &amp; delivered across Tamil Nadu.</p>
        <div class="toolbar" id="filterToolbar">
          ${['newest','Price: Low to High','Price: High to Low','In Stock only'].map(f=>{
            const key = f==='newest'?'newest':f==='Price: Low to High'?'lowhigh':f==='Price: High to Low'?'highlow':'instock';
            const label = f==='newest' ? 'Newest' : f;
            return `<button class="chip ${UI.sortMode===key?'active':''}" onclick="setSort('${key}')">${label}</button>`;
          }).join('')}
        </div>
        <div id="productGrid" class="product-grid"></div>
      </div>
    </div>`;
  renderProductGrid();
}

function setSort(mode){ UI.sortMode = mode; renderProductGrid(); }

function renderProductGrid(){
  const grid = document.getElementById('productGrid');
  if(!grid) return;
  let products = getProducts();

  const q = UI.searchQuery.trim().toLowerCase();
  if(q){
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q) ||
      p.size.toLowerCase().includes(q));
  }
  if(UI.sortMode === 'lowhigh') products = [...products].sort((a,b)=>a.price-b.price);
  else if(UI.sortMode === 'highlow') products = [...products].sort((a,b)=>b.price-a.price);
  else if(UI.sortMode === 'instock') products = products.filter(p=>p.stock>0);

  if(products.length === 0){
    grid.outerHTML = `<div class="empty-state" id="productGrid">
      <div class="glyph">🪑</div>
      <h3>No seat covers available right now.</h3>
      <p>${q ? 'Try a different search term.' : 'Please check back soon.'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = products.map(p => `
    <div class="product-card seam-box" onclick="openProduct('${p.id}')">
      <div class="thumb">
        ${p.stock<=0 ? '<span class="stock-flag">Out of Stock</span>' : ''}
        <img src="${p.images[0] || placeholderImg(p.id)}" alt="${escapeHtml(p.name)}">
      </div>
      <div class="body">
        <div class="title">${escapeHtml(p.name)}</div>
        <div class="price-row"><span class="price">${formatINR(p.price)}</span></div>
        <div class="meta">${escapeHtml(p.deliveryDays)} delivery · ${escapeHtml(p.size)}</div>
        <div class="cta-row">
          <button class="btn btn-outline" ${p.stock<=0?'disabled':''} onclick="event.stopPropagation(); addToCart('${p.id}',1); toast('Added to cart.', 'success');">Add to Cart</button>
          <button class="btn btn-primary" ${p.stock<=0?'disabled':''} onclick="event.stopPropagation(); openProduct('${p.id}', true)">Order Now</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openProduct(id, jumpToOrder){
  UI.currentProductId = id;
  UI.sliderIndex = 0;
  route('productDetails');
  if(jumpToOrder){
    setTimeout(()=> startOrder(id), 50);
  }
}

function renderProductDetails(){
  const p = getProduct(UI.currentProductId);
  const app = document.getElementById('app');
  if(!p){ route('customerHome'); return; }
  const images = p.images.length ? p.images : [placeholderImg(p.id)];

  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="subnav">
        <button class="back" onclick="route('customerHome')">← Back to Stocks</button>
      </div>
      <div class="pd-layout">
        <div class="slider" id="pdSlider">
          <div class="slides" id="pdSlides" style="transform:translateX(-${UI.sliderIndex*100}%)">
            ${images.map(src => `<div class="slide"><img src="${src}" alt="${escapeHtml(p.name)}"></div>`).join('')}
          </div>
          ${images.length>1 ? `
          <button class="nav-btn prev" onclick="slidePD(-1)" aria-label="Previous image">‹</button>
          <button class="nav-btn next" onclick="slidePD(1)" aria-label="Next image">›</button>
          <div class="dots">${images.map((_,i)=>`<span class="${i===UI.sliderIndex?'active':''}"></span>`).join('')}</div>` : ''}
        </div>
        <div class="pd-info">
          <div class="pd-title">${escapeHtml(p.name)}</div>
          <div class="pd-price">${formatINR(p.price)}</div>
          <div class="pd-tags">
            <span class="tag">🚚 ${escapeHtml(p.deliveryDays)}</span>
            <span class="tag gold">${p.stock>0 ? p.stock+' in stock' : 'Out of stock'}</span>
          </div>
          <div class="spec-grid">
            <div class="spec-item"><div class="label">Size</div><div class="value">${escapeHtml(p.size)}</div></div>
            <div class="spec-item"><div class="label">Material</div><div class="value">${escapeHtml(p.material)}</div></div>
            <div class="spec-item"><div class="label">Delivery</div><div class="value">${escapeHtml(p.deliveryDays)}</div></div>
          </div>
          <hr class="seam">
          <p class="pd-desc">${escapeHtml(p.details)}</p>
        </div>
      </div>
      <div class="sticky-cta">
        <div class="price-block">
          <div class="lbl">Price</div>
          <div class="amt">${formatINR(p.price)}</div>
        </div>
        <button class="btn btn-outline" ${p.stock<=0?'disabled':''} onclick="addToCart('${p.id}',1); toast('Added to cart.', 'success');">
          Add to Cart
        </button>
        <button class="btn btn-primary" ${p.stock<=0?'disabled':''} onclick="startOrder('${p.id}')">
          ${p.stock<=0 ? 'Out of Stock' : 'Order Now'}
        </button>
      </div>
    </div>`;

  // basic touch swipe support
  let touchStartX = null;
  const sliderEl = document.getElementById('pdSlider');
  sliderEl.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
  sliderEl.addEventListener('touchend', e => {
    if(touchStartX===null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 40) slidePD(dx > 0 ? -1 : 1);
    touchStartX = null;
  });
}

function slidePD(dir){
  const p = getProduct(UI.currentProductId);
  const count = p.images.length || 1;
  UI.sliderIndex = (UI.sliderIndex + dir + count) % count;
  renderProductDetails();
}

function renderCart(){
  const app = document.getElementById('app');
  const lines = cartLineItems();
  const total = cartTotal();
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="subnav"><button class="back" onclick="route('customerHome')">← Back to Stocks</button></div>
      <div class="page">
        <h1 class="page-title">Your Cart</h1>
        <p class="page-sub">Adjust quantities before checking out.</p>
        ${lines.length===0 ? emptyStateHtml('🛒','Your cart is empty.','Add some seat covers to get started.') : `
          ${lines.map(l => `
          <div class="list-card">
            <img src="${l.product.images[0] || placeholderImg(l.product.id)}" alt="${escapeHtml(l.product.name)}">
            <div class="content">
              <div class="top-row">
                <div><div class="name">${escapeHtml(l.product.name)}</div><div class="oid">${formatINR(l.product.price)} each</div></div>
              </div>
              <div class="cart-qty-row">
                <div class="qty-stepper">
                  <button onclick="setCartQty('${l.product.id}', ${l.qty-1}); renderCart();" aria-label="Decrease quantity">−</button>
                  <span>${l.qty}</span>
                  <button onclick="setCartQty('${l.product.id}', ${l.qty+1}); renderCart();" aria-label="Increase quantity">+</button>
                </div>
                <div class="amounts"><div>Line Total<br><b>${formatINR(l.lineTotal)}</b></div></div>
              </div>
              <div class="actions">
                <button class="btn btn-danger btn-sm" onclick="removeFromCart('${l.product.id}'); renderCart();">Remove</button>
              </div>
            </div>
          </div>`).join('')}
          <div class="order-summary">
            <div class="row total"><span>Cart Total</span><span class="v">${formatINR(total)}</span></div>
          </div>
          <button class="btn btn-primary btn-block" onclick="startCartCheckout()">Proceed to Checkout</button>
        `}
      </div>
    </div>`;
}

function startOrder(productId){
  const p = getProduct(productId);
  if(!p || p.stock<=0) return;
  const session = getSession();
  UI.currentProductId = productId;
  UI.checkoutItems = [{productId, qty:1}];
  UI.pendingOrderDraft = {
    shopName: '',
    customerName: session && session.role==='customer' ? session.name : '',
    mobile: session && session.mobile ? session.mobile : '',
    addressLine1: '', addressLine2: '',
    pincode: ''
  };
  route('orderDetails');
}

function startCartCheckout(){
  const cart = getCart();
  if(cart.length===0){ toast('Your cart is empty.', 'error'); return; }
  const session = getSession();
  UI.currentProductId = cart[0].productId;
  UI.checkoutItems = cart.map(i => ({productId:i.productId, qty:i.qty}));
  UI.pendingOrderDraft = {
    shopName: '',
    customerName: session && session.role==='customer' ? session.name : '',
    mobile: session && session.mobile ? session.mobile : '',
    addressLine1: '', addressLine2: '',
    pincode: ''
  };
  route('orderDetails');
}

function checkoutLineItems(){
  return (UI.checkoutItems||[]).map(i => {
    const product = getProduct(i.productId);
    return product ? {product, qty:i.qty, lineTotal: product.price*i.qty} : null;
  }).filter(Boolean);
}
function checkoutTotal(){
  return checkoutLineItems().reduce((s,i)=>s+i.lineTotal, 0);
}

function renderOrderDetails(){
  const lines = checkoutLineItems();
  const app = document.getElementById('app');
  if(!lines.length){ route('customerHome'); return; }
  const draft = UI.pendingOrderDraft || {};
  const total = checkoutTotal();

  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="subnav">
        <button class="back" onclick="route(UI.checkoutItems.length>1 ? 'cart' : 'productDetails')">← Back</button>
      </div>
      <div class="page">
        <h1 class="page-title">Order Details</h1>
        <p class="page-sub">Confirm your details, then choose a payment method.</p>

        <div class="order-summary">
          ${lines.map(l => `<div class="row"><span>${escapeHtml(l.product.name)} × ${l.qty}</span><span class="v">${formatINR(l.lineTotal)}</span></div>`).join('')}
          <div class="row total"><span>Total</span><span class="v">${formatINR(total)}</span></div>
        </div>

        <div class="field" id="fld-shopname">
          <label>Customer Shop Name</label>
          <input type="text" id="odShopName" placeholder="Your shop / business name" value="${escapeHtml(draft.shopName||'')}">
          <div class="err">Please enter your shop name.</div>
        </div>
        <div class="field" id="fld-name">
          <label>Customer Name</label>
          <input type="text" id="odName" placeholder="Full name" value="${escapeHtml(draft.customerName||'')}">
          <div class="err">Please enter your name.</div>
        </div>
        <div class="field" id="fld-mobile">
          <label>Mobile Number</label>
          <input type="tel" id="odMobile" placeholder="10-digit mobile number" maxlength="10" value="${escapeHtml(draft.mobile||'')}">
          <div class="err">Enter a valid 10-digit Indian mobile number.</div>
        </div>
        <div class="field" id="fld-addr1">
          <label>Address Line 1</label>
          <input type="text" id="odAddr1" placeholder="Shop no., street, area" value="${escapeHtml(draft.addressLine1||'')}">
          <div class="err">Please enter your address (at least 5 characters).</div>
        </div>
        <div class="field">
          <label>Address Line 2 <span style="font-weight:400;color:var(--slate-light);">(optional)</span></label>
          <input type="text" id="odAddr2" placeholder="Landmark, city (optional)" value="${escapeHtml(draft.addressLine2||'')}">
        </div>
        <div class="field" id="fld-pincode">
          <label>Pincode</label>
          <input type="text" id="odPincode" placeholder="6-digit pincode" maxlength="6" value="${escapeHtml(draft.pincode||'')}">
          <div class="err">Enter a valid 6-digit pincode.</div>
        </div>

        <button class="btn btn-primary btn-block" onclick="submitOrderDetails()">Continue to Payment</button>
      </div>
    </div>`;
}

function submitOrderDetails(){
  const shopName = document.getElementById('odShopName').value.trim();
  const name = document.getElementById('odName').value.trim();
  const mobile = document.getElementById('odMobile').value.trim();
  const addr1 = document.getElementById('odAddr1').value.trim();
  const addr2 = document.getElementById('odAddr2').value.trim();
  const pincode = document.getElementById('odPincode').value.trim();

  let valid = true;
  toggleFieldError('fld-shopname', shopName.length < 2); if(shopName.length<2) valid=false;
  toggleFieldError('fld-name', name.length < 2); if(name.length<2) valid=false;
  const mobOk = validateMobile(mobile); toggleFieldError('fld-mobile', !mobOk); if(!mobOk) valid=false;
  toggleFieldError('fld-addr1', addr1.length < 5); if(addr1.length<5) valid=false;
  const pinOk = validatePincode(pincode); toggleFieldError('fld-pincode', !pinOk); if(!pinOk) valid=false;

  if(!valid){ toast('Please fix the highlighted fields.', 'error'); return; }

  UI.pendingOrderDraft = {shopName, customerName:name, mobile, addressLine1:addr1, addressLine2:addr2, pincode};
  UI.selectedPayMethod = 'upi';
  route('payment');
}

function toggleFieldError(fieldId, hasError){
  const el = document.getElementById(fieldId);
  if(el) el.classList.toggle('invalid', !!hasError);
}

function renderPayment(){
  const lines = checkoutLineItems();
  const app = document.getElementById('app');
  if(!lines.length){ route('customerHome'); return; }
  const price = checkoutTotal();
  const advance = minAdvance(price);

  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="subnav">
        <button class="back" onclick="route('orderDetails')">← Back to Order Details</button>
      </div>
      <div class="page">
        <h1 class="page-title">Payment</h1>
        <p class="page-sub">A minimum of 50% advance is required to submit your order.</p>

        <div class="order-summary">
          <div class="row"><span>Order Total</span><span class="v">${formatINR(price)}</span></div>
          <div class="row advance"><span>Minimum Advance Payment (50%)</span><span class="v">${formatINR(advance)}</span></div>
          <div class="row balance"><span>Remaining Balance (if paying minimum)</span><span class="v">${formatINR(price-advance)}</span></div>
        </div>

        <div class="section-head"><h2>Choose Payment Method</h2><hr class="seam"></div>
        <div class="pay-methods" id="payMethods">
          ${[['upi','🔗','UPI'],['qr','▦','Generate QR']].map(([key,em,label])=>`
            <button class="pay-method ${UI.selectedPayMethod===key?'active':''}" onclick="selectPayMethod('${key}')">
              <span class="em">${em}</span><span class="nm">${label}</span>
            </button>`).join('')}
        </div>

        <div class="section-head"><h2>Amount to Pay Now</h2><hr class="seam"></div>
        <div class="amount-pad">
          <input type="number" id="payAmount" value="${advance}" min="${advance}" max="${price}">
        </div>
        <div class="field hint" style="margin-bottom:14px;">Minimum ${formatINR(advance)} · Maximum ${formatINR(price)}</div>
        <div class="quick-amt">
          <button onclick="setPayAmount(${advance})">Min 50%</button>
          <button onclick="setPayAmount(${Math.round((advance+price)/2)})">Half + Half</button>
          <button onclick="setPayAmount(${price})">Full Amount</button>
        </div>

        <div id="qrArea"></div>

        <button class="btn btn-gold btn-block" onclick="payNow(${advance}, ${price})">Pay Now</button>
      </div>
    </div>`;

  if(UI.selectedPayMethod === 'qr') renderQrPreview(advance);
}

function selectPayMethod(key){
  UI.selectedPayMethod = key;
  renderPayment();
}
function setPayAmount(v){
  document.getElementById('payAmount').value = v;
  if(UI.selectedPayMethod === 'qr') renderQrPreview(v);
}

function renderQrPreview(amount){
  const area = document.getElementById('qrArea');
  if(!area) return;
  area.innerHTML = `
    <div class="qr-box">
      <div class="demo-label">Demo QR — not a real payment code</div>
      <canvas id="qrCanvas" width="160" height="160"></canvas>
      <div style="font-size:13px;font-weight:600;">Scan to pay ${formatINR(amount)}</div>
    </div>`;
  drawFakeQr(document.getElementById('qrCanvas'), amount);
}

// Draws a QR-style pattern for demo purposes only. This is NOT a scannable
// or functional payment code — a real deployment must use a licensed UPI /
// payment-gateway QR generation library and a live payment gateway.
function drawFakeQr(canvas, seedNum){
  const ctx = canvas.getContext('2d');
  const size = 16, cell = canvas.width/size;
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  let seed = seedNum + 7;
  function rnd(){ seed = (seed*9301+49297)%233280; return seed/233280; }
  ctx.fillStyle = '#14171C';
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      const isFinder = (x<4&&y<4)||(x>size-5&&y<4)||(x<4&&y>size-5);
      if(isFinder || rnd() > 0.55) ctx.fillRect(x*cell, y*cell, cell-1, cell-1);
    }
  }
}

// Opens the device's UPI app chooser to collect a real payment.
// NOTE: this hands off to the UPI app and does NOT create/record the order
// in this demo's local order list on its own — see payNow() for that flow.
function openUPIPayment(amount) {
  const upiId = "9361358996@fam";
  const shopName = "Unique Seat Cover";

  const upiUrl =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(shopName)}` +
    `&am=${encodeURIComponent(amount)}` +
    `&cu=INR`;

  window.location.href = upiUrl;
}

function payNow(advance, price){
  const amtInput = document.getElementById('payAmount');
  let amt = Number(amtInput.value);
  if(isNaN(amt) || amt < advance){
    toast(`Minimum advance payment is ${formatINR(advance)}.`, 'error');
    return;
  }
  if(amt > price){
    toast('Payment cannot exceed the order total.', 'error');
    return;
  }

  const draft = UI.pendingOrderDraft;
  const lines = checkoutLineItems();
  if(!lines.length){ toast('Your cart is empty.', 'error'); return; }
  const session = getSession();

  const items = lines.map(l => ({
    productId: l.product.id, productName: l.product.name,
    productImage: l.product.images[0] || placeholderImg(l.product.id),
    price: l.product.price, qty: l.qty, lineTotal: l.lineTotal
  }));
  const isMultiItem = items.length > 1;
  const firstItem = items[0];

  const order = {
    id: uid('ORD'),
    items,
    productId: firstItem.productId,
    productName: isMultiItem ? `${firstItem.productName} + ${items.length-1} more item${items.length>2?'s':''}` : firstItem.productName,
    productImage: firstItem.productImage,
    productPrice: price, totalAmount: price,
    shopName: draft.shopName, customerName: draft.customerName, mobile: draft.mobile,
    addressLine1: draft.addressLine1, addressLine2: draft.addressLine2, pincode: draft.pincode,
    customerUsername: session ? session.username : 'guest',
    paymentMethod: UI.selectedPayMethod,
    paidAmount: amt, remainingBalance: price-amt,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  createOrder(order);

  // reduce stock for each ordered item
  items.forEach(it => {
    const product = getProduct(it.productId);
    if(product) updateProduct(it.productId, {stock: Math.max(0, product.stock - it.qty)});
  });

  // if this checkout came from the cart, empty it now that the order is placed
  if(isMultiItem || getCart().some(c => c.productId === firstItem.productId)){
    clearCart();
  }

  if(UI.selectedPayMethod === 'upi'){
    openUPIPayment(amt);
  }

  toast('Payment simulated successfully.', 'success');
  UI.lastOrderId = order.id;
  route('orderConfirmation');
}

function renderOrderConfirmation(){
  const order = getOrder(UI.lastOrderId);
  const app = document.getElementById('app');
  if(!order){ route('customerHome'); return; }
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="success-screen">
        <div class="ring">✓</div>
        <h2>Your Order request is Submitted Successfully...</h2>
        <p>We'll get started on fitting and delivery right away.</p>
        <div class="receipt">
          <div class="row"><span>Order ID</span><span class="v">${order.id}</span></div>
          <div class="row"><span>Shop Name</span><span class="v">${escapeHtml(order.shopName||'-')}</span></div>
          ${(order.items||[]).map(it => `<div class="row"><span>${escapeHtml(it.productName)} × ${it.qty}</span><span class="v">${formatINR(it.lineTotal)}</span></div>`).join('') || `<div class="row"><span>Product</span><span class="v">${escapeHtml(order.productName)}</span></div>`}
          <div class="row"><span>Delivery Address</span><span class="v">${escapeHtml(order.addressLine1||'-')}${order.addressLine2?', '+escapeHtml(order.addressLine2):''}</span></div>
          <div class="row"><span>Pincode</span><span class="v">${escapeHtml(order.pincode||'-')}</span></div>
          <div class="row"><span>Amount Paid</span><span class="v">${formatINR(order.paidAmount)}</span></div>
          <div class="row"><span>Remaining Balance</span><span class="v">${order.remainingBalance>0?formatINR(order.remainingBalance):'Fully Paid'}</span></div>
          <div class="row"><span>Order Status</span><span class="v">${order.status}</span></div>
          <div class="row"><span>Delivery Days</span><span class="v">${escapeHtml(getProduct(order.productId)?.deliveryDays || '-')}</span></div>
        </div>
        <div style="display:flex; gap:10px; margin-top:22px; width:100%; max-width:360px;">
          <button class="btn btn-outline" style="flex:1;" onclick="route('customerOrders')">View Orders</button>
          <button class="btn btn-primary" style="flex:1;" onclick="route('customerHome')">Continue Shopping</button>
        </div>
      </div>
    </div>`;
}

function renderCustomerOrders(){
  const session = getSession();
  const orders = getOrders().filter(o => o.customerUsername === session.username);
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="subnav"><button class="back" onclick="route('customerHome')">← Back to Stocks</button></div>
      <div class="page">
        <h1 class="page-title">My Orders</h1>
        <p class="page-sub">Track your seat cover orders and delivery status.</p>
        ${orders.length===0 ? emptyStateHtml('📦','No orders yet.','Your placed orders will show up here.') :
          orders.map(orderCardHtml).join('')}
      </div>
    </div>`;
}

function orderCardHtml(o){
  const balance = remainingBalance(o);
  return `
  <div class="list-card">
    <img src="${o.productImage}" alt="${escapeHtml(o.productName)}">
    <div class="content">
      <div class="top-row">
        <div>
          <div class="name">${escapeHtml(o.productName)}</div>
          <div class="oid">${o.id}</div>
        </div>
        <span class="badge-status ${o.status==='Completed'?'completed':'pending'}">${o.status}</span>
      </div>
      <div class="sub">${new Date(o.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})} · ${formatINR(o.totalAmount)}</div>
      <div class="amounts">
        <div>Paid<br><b>${formatINR(o.paidAmount)}</b></div>
        <div>Balance<br><b style="color:${balance>0?'var(--danger)':'var(--success)'}">${balance>0?formatINR(balance):'Fully Paid'}</b></div>
      </div>
    </div>
  </div>`;
}

function renderCustomerPending(){
  const session = getSession();
  const orders = getOrders().filter(o => o.customerUsername === session.username && remainingBalance(o) > 0);
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('customer')}
      <div class="subnav"><button class="back" onclick="route('customerHome')">← Back to Stocks</button></div>
      <div class="page">
        <h1 class="page-title">Pending Payments</h1>
        <p class="page-sub">Clear your remaining balance any time before delivery.</p>
        ${orders.length===0 ? emptyStateHtml('✅',"You're all paid up.","No outstanding balances right now.") :
          orders.map(o => `
          <div class="list-card">
            <img src="${o.productImage}" alt="${escapeHtml(o.productName)}">
            <div class="content">
              <div class="top-row">
                <div><div class="name">${escapeHtml(o.productName)}</div><div class="oid">${o.id}</div></div>
              </div>
              <div class="amounts">
                <div>Total<br><b>${formatINR(o.totalAmount)}</b></div>
                <div>Paid<br><b>${formatINR(o.paidAmount)}</b></div>
                <div>Pending<br><b style="color:var(--danger)">${formatINR(remainingBalance(o))}</b></div>
              </div>
              <div class="actions">
                <button class="btn btn-gold btn-sm" onclick="openPayBalance('${o.id}')">Pay Now</button>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function openPayBalance(orderId){
  const o = getOrder(orderId);
  const balance = remainingBalance(o);
  openSheet(`
    <div class="sheet-head"><h3>Pay Remaining Balance</h3><button class="close-x" onclick="closeSheet()">✕</button></div>
    <div class="order-summary">
      <div class="row"><span>Order</span><span class="v">${o.id}</span></div>
      <div class="row"><span>Total Amount</span><span class="v">${formatINR(o.totalAmount)}</span></div>
      <div class="row balance"><span>Pending Balance</span><span class="v">${formatINR(balance)}</span></div>
    </div>
    <div class="field">
      <label>Amount to Pay</label>
      <input type="number" id="balAmt" value="${balance}" min="1" max="${balance}">
      <div class="hint">You can pay up to ${formatINR(balance)}.</div>
    </div>
    <button class="btn btn-primary btn-block" onclick="submitBalancePayment('${orderId}')">Pay Now</button>
  `);
}

function submitBalancePayment(orderId){
  const o = getOrder(orderId);
  const balance = remainingBalance(o);
  const amt = Number(document.getElementById('balAmt').value);
  if(isNaN(amt) || amt <= 0){ toast('Enter a valid amount.', 'error'); return; }
  if(amt > balance){ toast('Amount exceeds the pending balance.', 'error'); return; }

  const newPaid = o.paidAmount + amt;
  updateOrder(orderId, {paidAmount:newPaid, remainingBalance: o.totalAmount-newPaid});
  closeSheet();
  toast(newPaid>=o.totalAmount ? 'Fully paid! Thank you.' : 'Payment recorded.', 'success');
  route('customerPendingPayments');
}

function emptyStateHtml(glyph, title, sub){
  return `<div class="empty-state"><div class="glyph">${glyph}</div><h3>${title}</h3><p>${sub}</p></div>`;
}

function openCustomerProfile(){
  const session = getSession();
  const orders = getOrders().filter(o=>o.customerUsername===session.username);
  const pendingCount = orders.filter(o=>remainingBalance(o)>0).length;
  openSheet(`
    <div class="drawer-user">
      <div class="av">${(session.name||'C')[0].toUpperCase()}</div>
      <div><div class="nm">${escapeHtml(session.name)}</div><div class="role">Customer account</div></div>
    </div>
    <div class="menu-row" onclick="closeSheet(); route('customerOrders')">
      <span class="em">📦</span><span class="lbl">Orders</span><span class="cnt">${orders.length}</span>
    </div>
    <div class="menu-row" onclick="closeSheet(); route('customerPendingPayments')">
      <span class="em">💰</span><span class="lbl">Pending Payments</span><span class="cnt">${pendingCount}</span>
    </div>
    <div class="menu-row danger" onclick="closeSheet(); confirmLogout()">
      <span class="em">🚪</span><span class="lbl">Logout</span>
    </div>
  `);
}

function confirmLogout(){
  confirmDialog({
    icon:'🚪', title:'Log out?', message:'You will need to sign in again to place or track orders.',
    okLabel:'Log out', okClass:'btn-danger', onConfirm: logout
  });
}

/* =========================================================================
   [JS:OWNER-UI]
   ========================================================================= */
function renderOwnerDashboard(){
  const products = getProducts();
  const orders = getOrders();
  const pending = orders.filter(o=>o.status==='Pending');
  const completed = orders.filter(o=>o.status==='Completed');
  const totalPending = pending.reduce((s,o)=>s+remainingBalance(o),0);

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('owner')}
      <div class="page">
        <h1 class="page-title">Owner Dashboard</h1>
        <p class="page-sub">Manage stock, orders and customers for Unique Seat Cover.</p>

        <div class="tile-grid">
          <div class="tile accent"><div class="num">${products.length}</div><div class="lbl">Products in Stock</div></div>
          <div class="tile"><div class="num">${pending.length}</div><div class="lbl">Pending Orders</div></div>
          <div class="tile"><div class="num">${completed.length}</div><div class="lbl">Completed Orders</div></div>
          <div class="tile"><div class="num">${formatINR(totalPending)}</div><div class="lbl">Balance Due</div></div>
        </div>

        <div class="section-head"><h2>Manage</h2><hr class="seam"></div>
        <div class="menu-row" onclick="route('addStock')"><span class="em">➕</span><span class="lbl">Add New Seat Cover</span></div>
        <div class="menu-row" onclick="route('manageProducts')"><span class="em">🗂️</span><span class="lbl">Manage Products</span><span class="cnt">${products.length}</span></div>
        <div class="menu-row" onclick="route('pendingOrders')"><span class="em">⏳</span><span class="lbl">Pending Orders</span><span class="cnt">${pending.length}</span></div>
        <div class="menu-row" onclick="route('completedOrders')"><span class="em">✅</span><span class="lbl">Completed Orders</span><span class="cnt">${completed.length}</span></div>
        <div class="menu-row" onclick="route('ownerCustomers')"><span class="em">🧑‍🤝‍🧑</span><span class="lbl">Customers</span></div>
      </div>
    </div>`;
}

function openOwnerProfile(){
  const orders = getOrders();
  const pending = orders.filter(o=>o.status==='Pending');
  const completed = orders.filter(o=>o.status==='Completed');
  openSheet(`
    <div class="drawer-user">
      <div class="av" style="background:var(--ink)">O</div>
      <div><div class="nm">Shop Owner</div><div class="role">Owner account</div></div>
    </div>
    <div class="menu-row" onclick="closeSheet(); route('pendingOrders')"><span class="em">⏳</span><span class="lbl">Pending Orders</span><span class="cnt">${pending.length}</span></div>
    <div class="menu-row" onclick="closeSheet(); route('completedOrders')"><span class="em">✅</span><span class="lbl">Completed Orders</span><span class="cnt">${completed.length}</span></div>
    <div class="menu-row" onclick="closeSheet(); route('ownerCustomers')"><span class="em">🧑‍🤝‍🧑</span><span class="lbl">Customer Names</span></div>
    <div class="menu-row danger" onclick="closeSheet(); confirmLogout()"><span class="em">🚪</span><span class="lbl">Logout</span></div>
  `);
}

/* -- Add Stock -- */
function renderAddStock(){
  UI.ownerNewImages = [null,null,null];
  UI.editingProductId = null;
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('owner')}
      <div class="subnav"><button class="back" onclick="route('ownerDashboard')">← Back to Dashboard</button></div>
      <div class="page">
        <h1 class="page-title">Add New Seat Cover</h1>
        <p class="page-sub">Up to 3 images. This will appear immediately in customer "Our Stocks".</p>
        ${productFormHtml()}
        <button class="btn btn-primary btn-block" onclick="saveNewProduct()">Add Stock</button>
      </div>
    </div>`;
}

function productFormHtml(existing){
  const p = existing || {name:'',price:'',size:'',material:'',details:'',deliveryDays:'',stock:''};
  return `
    <div class="section-head"><h2>Product Images (max 3)</h2><hr class="seam"></div>
    <div class="img-uploader" id="imgUploader">
      ${[0,1,2].map(i => imgSlotHtml(i)).join('')}
    </div>
    <p class="field hint" style="margin-bottom:18px;">Tap a box to upload, tap ✕ to remove.</p>

    <div class="field" id="fld-pname">
      <label>Product Name / Title</label>
      <input type="text" id="pfName" value="${escapeHtml(p.name)}" placeholder="e.g. Premium Leatherette Bike Seat Cover">
      <div class="err">Enter a product name.</div>
    </div>
    <div class="field-row">
      <div class="field" id="fld-pprice">
        <label>Price (₹)</label>
        <input type="number" id="pfPrice" value="${p.price}" placeholder="3999">
        <div class="err">Enter a valid price.</div>
      </div>
      <div class="field" id="fld-pstock">
        <label>Stock Quantity</label>
        <input type="number" id="pfStock" value="${p.stock}" placeholder="10">
        <div class="err">Enter a valid stock quantity (0 or more).</div>
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Size</label>
        <input type="text" id="pfSize" value="${escapeHtml(p.size)}" placeholder="Universal">
      </div>
      <div class="field">
        <label>Material</label>
        <input type="text" id="pfMaterial" value="${escapeHtml(p.material)}" placeholder="PU Leather">
      </div>
    </div>
    <div class="field" id="fld-pdays">
      <label>Delivery Days</label>
      <input type="text" id="pfDays" value="${escapeHtml(p.deliveryDays)}" placeholder="5-7 days">
      <div class="err">Enter delivery days, e.g. 5-7 days.</div>
    </div>
    <div class="field">
      <label>Details / Description</label>
      <textarea id="pfDetails" rows="4" placeholder="Full details about fit, material, comfort, etc.">${escapeHtml(p.details)}</textarea>
    </div>
  `;
}

function imgSlotHtml(i){
  const src = UI.ownerNewImages[i];
  return `
  <div class="img-slot" id="imgSlot${i}">
    ${src ? `<img src="${src}"><button class="rm" onclick="removeOwnerImage(${i})">✕</button>`
          : `<span class="plus">+</span><input type="file" accept="image/*" onchange="onOwnerImageChosen(event, ${i})">`}
  </div>`;
}

function onOwnerImageChosen(evt, index){
  const file = evt.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ toast('Please choose an image file.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    UI.ownerNewImages[index] = reader.result;
    document.getElementById('imgSlot'+index).outerHTML = imgSlotHtml(index).replace(`id="imgSlot${index}"`, `id="imgSlot${index}"`);
  };
  reader.readAsDataURL(file);
}
function removeOwnerImage(index){
  UI.ownerNewImages[index] = null;
  document.getElementById('imgSlot'+index).outerHTML = imgSlotHtml(index);
}

function readProductForm(){
  const name = document.getElementById('pfName').value.trim();
  const price = Number(document.getElementById('pfPrice').value);
  const stock = Number(document.getElementById('pfStock').value);
  const size = document.getElementById('pfSize').value.trim() || 'Universal';
  const material = document.getElementById('pfMaterial').value.trim() || '-';
  const days = document.getElementById('pfDays').value.trim();
  const details = document.getElementById('pfDetails').value.trim();

  let valid = true;
  toggleFieldError('fld-pname', name.length<2); if(name.length<2) valid=false;
  toggleFieldError('fld-pprice', !(price>0)); if(!(price>0)) valid=false;
  toggleFieldError('fld-pstock', isNaN(stock) || stock<0); if(isNaN(stock)||stock<0) valid=false;
  toggleFieldError('fld-pdays', days.length<1); if(days.length<1) valid=false;

  if(!valid) return null;
  const images = UI.ownerNewImages.filter(Boolean);
  return {name, price, stock, size, material, deliveryDays:days, details, images};
}

function saveNewProduct(){
  const data = readProductForm();
  if(!data){ toast('Please fix the highlighted fields.', 'error'); return; }
  addProduct({id: uid('P'), ...data});
  toast('Seat cover added to stock.', 'success');
  route('manageProducts');
}

/* -- Manage Products -- */
function renderManageProducts(){
  const products = getProducts();
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('owner')}
      <div class="subnav"><button class="back" onclick="route('ownerDashboard')">← Back to Dashboard</button></div>
      <div class="page">
        <h1 class="page-title">Manage Products</h1>
        <p class="page-sub">Edit prices, stock, delivery days or remove items.</p>
        ${products.length===0 ? emptyStateHtml('🗂️','No products yet.','Add your first seat cover to get started.') :
          products.map(p => `
          <div class="list-card">
            <img src="${p.images[0] || placeholderImg(p.id)}" alt="${escapeHtml(p.name)}">
            <div class="content">
              <div class="top-row">
                <div><div class="name">${escapeHtml(p.name)}</div><div class="oid">${formatINR(p.price)} · ${p.stock>0? p.stock+' in stock' : 'Out of stock'}</div></div>
              </div>
              <div class="sub">${escapeHtml(p.size)} · ${escapeHtml(p.material)} · ${escapeHtml(p.deliveryDays)}</div>
              <div class="actions">
                <button class="btn btn-outline btn-sm" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn-ghost btn-sm" onclick="quickStock('${p.id}')">Stock/Price</button>
                <button class="btn btn-danger btn-sm" onclick="askDeleteProduct('${p.id}')">Delete</button>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function editProduct(id){
  UI.editingProductId = id;
  const p = getProduct(id);
  UI.ownerNewImages = [p.images[0]||null, p.images[1]||null, p.images[2]||null];
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('owner')}
      <div class="subnav"><button class="back" onclick="route('manageProducts')">← Back to Products</button></div>
      <div class="page">
        <h1 class="page-title">Edit Seat Cover</h1>
        ${productFormHtml(p)}
        <button class="btn btn-primary btn-block" onclick="saveEditedProduct('${id}')">Save Changes</button>
      </div>
    </div>`;
}

function saveEditedProduct(id){
  const data = readProductForm();
  if(!data){ toast('Please fix the highlighted fields.', 'error'); return; }
  updateProduct(id, data);
  toast('Product updated.', 'success');
  route('manageProducts');
}

function quickStock(id){
  const p = getProduct(id);
  openSheet(`
    <div class="sheet-head"><h3>Update Stock &amp; Price</h3><button class="close-x" onclick="closeSheet()">✕</button></div>
    <div class="field"><label>Price (₹)</label><input type="number" id="qsPrice" value="${p.price}"></div>
    <div class="field"><label>Stock Quantity</label><input type="number" id="qsStock" value="${p.stock}"></div>
    <div class="field"><label>Delivery Days</label><input type="text" id="qsDays" value="${escapeHtml(p.deliveryDays)}"></div>
    <button class="btn btn-primary btn-block" onclick="saveQuickStock('${id}')">Save</button>
  `);
}
function saveQuickStock(id){
  const price = Number(document.getElementById('qsPrice').value);
  const stock = Number(document.getElementById('qsStock').value);
  const days = document.getElementById('qsDays').value.trim();
  if(!(price>0)){ toast('Enter a valid price.', 'error'); return; }
  if(isNaN(stock) || stock<0){ toast('Stock cannot be negative.', 'error'); return; }
  updateProduct(id, {price, stock, deliveryDays: days || getProduct(id).deliveryDays});
  closeSheet();
  toast('Stock updated.', 'success');
  route('manageProducts');
}

function askDeleteProduct(id){
  const p = getProduct(id);
  confirmDialog({
    icon:'🗑️', title:'Delete this product?',
    message:`"${p.name}" will be removed from stock and customers will no longer see it.`,
    okLabel:'Delete', okClass:'btn-danger',
    onConfirm: () => { deleteProduct(id); toast('Product deleted.', 'success'); route('manageProducts'); }
  });
}

/* -- Pending / Completed orders -- */
function renderPendingOrders(){
  const orders = getOrders().filter(o=>o.status==='Pending');
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('owner')}
      <div class="subnav"><button class="back" onclick="route('ownerDashboard')">← Back to Dashboard</button></div>
      <div class="page">
        <h1 class="page-title">Pending Orders</h1>
        ${orders.length===0 ? emptyStateHtml('⏳','No pending orders.','New orders will appear here as customers check out.') :
          orders.map(ownerOrderCardHtml).join('')}
      </div>
    </div>`;
}

function renderCompletedOrders(){
  const orders = getOrders().filter(o=>o.status==='Completed');
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('owner')}
      <div class="subnav"><button class="back" onclick="route('ownerDashboard')">← Back to Dashboard</button></div>
      <div class="page">
        <h1 class="page-title">Completed Orders</h1>
        ${orders.length===0 ? emptyStateHtml('✅','No completed orders yet.','Orders you mark completed will be listed here.') :
          orders.map(ownerOrderCardHtml).join('')}
      </div>
    </div>`;
}

function ownerOrderCardHtml(o){
  const balance = remainingBalance(o);
  return `
  <div class="list-card">
    <img src="${o.productImage}" alt="${escapeHtml(o.productName)}">
    <div class="content">
      <div class="top-row">
        <div><div class="name">${escapeHtml(o.customerName)}</div><div class="oid">${o.id}</div></div>
        <span class="badge-status ${o.status==='Completed'?'completed':'pending'}">${o.status}</span>
      </div>
      <div class="sub">${escapeHtml(o.shopName||'-')} · ${escapeHtml(o.productName)}</div>
      <div class="sub">${escapeHtml(o.mobile)} · ${escapeHtml(o.addressLine1||'-')}${o.addressLine2?', '+escapeHtml(o.addressLine2):''} · Pincode ${escapeHtml(o.pincode)}</div>
      <div class="sub">Method: ${escapeHtml((o.paymentMethod||'upi').toUpperCase())} · ${new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
      <div class="amounts">
        <div>Total<br><b>${formatINR(o.totalAmount)}</b></div>
        <div>Paid<br><b>${formatINR(o.paidAmount)}</b></div>
        <div>Balance<br><b style="color:${balance>0?'var(--danger)':'var(--success)'}">${balance>0?formatINR(balance):'Fully Paid'}</b></div>
      </div>
      ${o.status==='Pending' ? `<div class="actions"><button class="btn btn-success btn-sm" onclick="markCompleted('${o.id}')">Mark as Completed</button></div>` : ''}
    </div>
  </div>`;
}

function markCompleted(orderId){
  confirmDialog({
    icon:'✅', title:'Mark order as completed?',
    message:'The customer will see this order as Completed.',
    okLabel:'Mark Completed', okClass:'btn-success',
    onConfirm: () => {
      updateOrder(orderId, {status:'Completed', completedAt: new Date().toISOString()});
      toast('Order marked completed.', 'success');
      route('pendingOrders');
    }
  });
}

/* -- Customers -- */
function renderOwnerCustomers(){
  const orders = getOrders();
  const map = {};
  orders.forEach(o => {
    const key = o.mobile || o.customerName;
    if(!map[key]) map[key] = {name:o.customerName, mobile:o.mobile, orders:0, total:0, paid:0};
    map[key].orders += 1;
    map[key].total += o.totalAmount;
    map[key].paid += o.paidAmount;
  });
  const customers = Object.values(map);

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen fade-in">
      ${topbarHtml('owner')}
      <div class="subnav"><button class="back" onclick="route('ownerDashboard')">← Back to Dashboard</button></div>
      <div class="page">
        <h1 class="page-title">Customers</h1>
        <p class="page-sub">Everyone who has placed an order with Unique Seat Cover.</p>
        ${customers.length===0 ? emptyStateHtml('🧑‍🤝‍🧑','No customers yet.','Customers will appear here after their first order.') :
          customers.map(c => {
            const pending = c.total - c.paid;
            return `
            <div class="person-card">
              <div class="left">
                <div class="av">${(c.name||'C')[0].toUpperCase()}</div>
                <div class="info">
                  <div class="nm">${escapeHtml(c.name)} ${pending>0 ? `— <span style="color:var(--danger)">Pending ${formatINR(pending)}</span>` : `— <span style="color:var(--success)">Paid</span>`}</div>
                  <div class="ph">${escapeHtml(c.mobile||'-')} · ${c.orders} order${c.orders>1?'s':''}</div>
                </div>
              </div>
              <div class="right">
                <div class="amt">${formatINR(c.total)}</div>
              </div>
            </div>`;
          }).join('')}
      </div>
    </div>`;
}

/* =========================================================================
   [JS:AUTH SCREENS] — login / registration UI
   ========================================================================= */
function renderLogin(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="screen login-shell fade-in">
      <div class="login-hero">
        <div class="mark">US</div>
        <h1>Unique Seat Cover</h1>
        <p>Tamil Nadu · Custom-fit seat covers, delivered</p>
      </div>
      <div class="login-form-wrap" style="max-width:380px; width:100%; margin:0 auto;">
        <div class="role-toggle">
          <button class="${UI.loginRole==='customer'?'active':''}" onclick="setLoginRole('customer')">Customer Login</button>
          <button class="${UI.loginRole==='owner'?'active':''}" onclick="setLoginRole('owner')">Owner Login</button>
        </div>
        <div class="login-card">
          <div class="field">
            <label>Username</label>
            <input type="text" id="loginUser" placeholder="Enter username">
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" id="loginPass" placeholder="Enter password">
          </div>
          <button class="btn btn-primary btn-block" onclick="submitLogin()">Log In</button>
          <div class="demo-box">
            Demo Login —<br>
            ${UI.loginRole==='owner' ? 'Username: owner &nbsp;·&nbsp; Password: 1234' : 'Username: customer &nbsp;·&nbsp; Password: 1234'}
          </div>
          ${UI.loginRole==='customer' ? `<div class="switch-mode" style="color:var(--slate)">New here? <b style="color:var(--maroon); cursor:pointer;" onclick="openRegister()">Create an account</b></div>` : ''}
        </div>
      </div>
    </div>`;
}

function setLoginRole(role){ UI.loginRole = role; renderLogin(); }

function submitLogin(){
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if(!user || !pass){ toast('Enter both username and password.', 'error'); return; }
  const session = attemptLogin(UI.loginRole, user, pass);
  if(!session){ toast('Invalid credentials for this login type.', 'error'); return; }
  toast(`Welcome, ${session.name}!`, 'success');
  route(session.role === 'owner' ? 'ownerDashboard' : 'customerHome');
}

function openRegister(){
  openSheet(`
    <div class="sheet-head"><h3>Create Customer Account</h3><button class="close-x" onclick="closeSheet()">✕</button></div>
    <div class="field"><label>Full Name</label><input type="text" id="regName"></div>
    <div class="field"><label>Mobile Number</label><input type="tel" id="regMobile" maxlength="10"></div>
    <div class="field"><label>Choose Username</label><input type="text" id="regUser"></div>
    <div class="field"><label>Choose Password</label><input type="password" id="regPass"></div>
    <p class="field hint" style="margin-bottom:14px;">Demo accounts only — for a real business this must move to a secure backend.</p>
    <button class="btn btn-primary btn-block" onclick="submitRegister()">Create Account</button>
  `);
}

function submitRegister(){
  const name = document.getElementById('regName').value.trim();
  const mobile = document.getElementById('regMobile').value.trim();
  const username = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  if(name.length<2){ toast('Enter your full name.', 'error'); return; }
  if(!validateMobile(mobile)){ toast('Enter a valid 10-digit mobile number.', 'error'); return; }
  if(username.length<3){ toast('Username must be at least 3 characters.', 'error'); return; }
  if(password.length<4){ toast('Password must be at least 4 characters.', 'error'); return; }
  const res = registerCustomer({name, username, password, mobile});
  if(!res.ok){ toast(res.msg, 'error'); return; }
  closeSheet();
  toast('Account created. You can now log in.', 'success');
  document.getElementById('loginUser') && (document.getElementById('loginUser').value = username);
}

/* =========================================================================
   ROUTER / MAIN RENDER
   ========================================================================= */
function render(){
  closeSheet();
  const session = getSession();

  // guard: protected screens require a matching session
  const customerScreens = ['customerHome','productDetails','cart','orderDetails','payment','orderConfirmation','customerOrders','customerPendingPayments'];
  const ownerScreens = ['ownerDashboard','addStock','manageProducts','pendingOrders','completedOrders','ownerCustomers'];

  if(customerScreens.includes(UI.screen) && (!session || session.role!=='customer')){ UI.screen='login'; }
  if(ownerScreens.includes(UI.screen) && (!session || session.role!=='owner')){ UI.screen='login'; }

  switch(UI.screen){
    case 'login': renderLogin(); break;
    case 'customerHome': renderCustomerHome(); break;
    case 'productDetails': renderProductDetails(); break;
    case 'cart': renderCart(); break;
    case 'orderDetails': renderOrderDetails(); break;
    case 'payment': renderPayment(); break;
    case 'orderConfirmation': renderOrderConfirmation(); break;
    case 'customerOrders': renderCustomerOrders(); break;
    case 'customerPendingPayments': renderCustomerPending(); break;
    case 'ownerDashboard': renderOwnerDashboard(); break;
    case 'addStock': renderAddStock(); break;
    case 'manageProducts': renderManageProducts(); break;
    case 'pendingOrders': renderPendingOrders(); break;
    case 'completedOrders': renderCompletedOrders(); break;
    case 'ownerCustomers': renderOwnerCustomers(); break;
    default: renderLogin();
  }
}

/* boot */
seedData();
const existingSession = getSession();
if(existingSession){
  UI.screen = existingSession.role === 'owner' ? 'ownerDashboard' : 'customerHome';
}
render();