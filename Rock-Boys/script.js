(function () {
  "use strict";

  const STORAGE_KEY = "rockboys_orders";

  const LABELS = {
    shirt: "Shirt",
    pant: "Pant",
    alteration: "Alteration",
  };

  let cart = [];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const elCustomerName = $("#customer-name");
  const elMobile = $("#mobile");
  const elCartList = $("#cart-list");
  const elCartEmpty = $("#cart-empty");
  const elTotalAmount = $("#total-amount");
  const elBtnInvoice = $("#btn-invoice");
  const elInvoicePanel = $("#invoice-panel");
  const elInvoiceContent = $("#invoice-content");
  const elBtnNewBill = $("#btn-new-bill");
  const elStatToday = $("#stat-today");
  const elStatMonth = $("#stat-month");
  const elBarToday = $("#bar-today");
  const elBarMonth = $("#bar-month");
  const elOrdersList = $("#orders-list");
  const elOrdersEmpty = $("#orders-empty");
  const elAlterationAmount = $("#alteration-amount");
  const elBtnAddAlteration = $("#btn-add-alteration");
  const elBtnClearRecords = $("#btn-clear-records");

  function formatMoney(amount) {
    return "₹" + amount.toLocaleString("en-IN");
  }

  function getOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  function isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function isSameMonth(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  }

  function calcTotal(items) {
    return items.reduce((sum, line) => sum + line.price * line.qty, 0);
  }

  function getLineKey(line) {
    if (line.item === "alteration") {
      return "alteration-" + line.price;
    }
    return line.item;
  }

  function getLineLabel(line) {
    if (line.item === "alteration") {
      return "Alteration — " + formatMoney(line.price);
    }
    return LABELS[line.item];
  }

  function flashButton(btn, className) {
    const cls = className || "product-btn--flash";
    btn.classList.add(cls);
    setTimeout(() => btn.classList.remove(cls), 250);
  }

  function addToCart(item, price) {
    const existing = cart.find((line) => line.item === item);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ item, price, qty: 1 });
    }
    renderCart();
  }

  function addAlteration(amount) {
    const price = Math.round(amount);
    const existing = cart.find(
      (line) => line.item === "alteration" && line.price === price
    );
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ item: "alteration", price, qty: 1 });
    }
    renderCart();
  }

  function removeFromCart(lineKey) {
    const line = cart.find((l) => getLineKey(l) === lineKey);
    if (!line) return;
    line.qty -= 1;
    if (line.qty <= 0) {
      cart = cart.filter((l) => getLineKey(l) !== lineKey);
    }
    renderCart();
  }

  function handleAddAlteration() {
    const raw = elAlterationAmount.value.trim();
    const amount = Number(raw);

    if (!raw || !Number.isFinite(amount) || amount <= 0) {
      elAlterationAmount.classList.add("alteration-amount-input--error");
      elAlterationAmount.focus();
      setTimeout(() => {
        elAlterationAmount.classList.remove("alteration-amount-input--error");
      }, 1500);
      return;
    }

    addAlteration(amount);
    elAlterationAmount.value = "";
    flashButton(elBtnAddAlteration, "btn-add-alteration--flash");
    elAlterationAmount.focus();
  }

  function renderCart() {
    elCartList.innerHTML = "";
    const total = calcTotal(cart);

    if (cart.length === 0) {
      elCartEmpty.hidden = false;
      elBtnInvoice.disabled = true;
    } else {
      elCartEmpty.hidden = true;
      elBtnInvoice.disabled = false;

      cart.forEach((line) => {
        const lineKey = getLineKey(line);
        const label = getLineLabel(line);
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML =
          '<span class="cart-item-info">' +
          '<span class="cart-item-qty">' + line.qty + "×</span>" +
          "<span>" + escapeHtml(label) + "</span>" +
          "</span>" +
          '<span class="cart-item-price">' + formatMoney(line.price * line.qty) + "</span>";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "cart-item-remove";
        removeBtn.setAttribute("aria-label", "Remove one " + label);
        removeBtn.textContent = "−";
        removeBtn.addEventListener("click", () => removeFromCart(lineKey));

        li.appendChild(removeBtn);
        elCartList.appendChild(li);
      });
    }

    elTotalAmount.textContent = formatMoney(total);
  }

  function validateBill() {
    const name = elCustomerName.value.trim();
    const mobile = elMobile.value.replace(/\D/g, "");

    if (!name) {
      elCustomerName.focus();
      elCustomerName.style.borderColor = "var(--red)";
      setTimeout(() => {
        elCustomerName.style.borderColor = "";
      }, 1500);
      return null;
    }

    if (mobile.length < 10) {
      elMobile.focus();
      elMobile.style.borderColor = "var(--red)";
      setTimeout(() => {
        elMobile.style.borderColor = "";
      }, 1500);
      return null;
    }

    if (cart.length === 0) return null;

    return { name, mobile };
  }

  function buildInvoiceHtml(order) {
    const dateStr = new Date(order.date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    let rows = "";
    order.items.forEach((line) => {
      rows +=
        '<div class="invoice-row">' +
        "<span>" + line.qty + "× " + escapeHtml(getLineLabel(line)) + "</span>" +
        "<span>" + formatMoney(line.price * line.qty) + "</span>" +
        "</div>";
    });

    return (
      "<h3>ROCK BOYS — Invoice</h3>" +
      '<div class="invoice-row"><span>Customer</span><span>' + escapeHtml(order.customerName) + "</span></div>" +
      '<div class="invoice-row"><span>Mobile</span><span>' + escapeHtml(order.mobile) + "</span></div>" +
      '<div class="invoice-row"><span>Date</span><span>' + dateStr + "</span></div>" +
      rows +
      '<div class="invoice-total"><span>TOTAL</span><span>' + formatMoney(order.total) + "</span></div>"
    );
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function generateInvoice() {
    const customer = validateBill();
    if (!customer) return;

    const items = cart.map((l) => ({ ...l }));
    const total = calcTotal(items);
    const order = {
      id: Date.now().toString(36),
      customerName: customer.name,
      mobile: customer.mobile,
      items,
      total,
      date: new Date().toISOString(),
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);

    elInvoiceContent.innerHTML = buildInvoiceHtml(order);
    elInvoicePanel.hidden = false;
    elInvoicePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });

    cart = [];
    renderCart();
    updateAnalytics();
  }

  function resetBill() {
    cart = [];
    elCustomerName.value = "";
    elMobile.value = "";
    elAlterationAmount.value = "";
    elInvoicePanel.hidden = true;
    elInvoiceContent.innerHTML = "";
    renderCart();
    elCustomerName.focus();
  }

  function clearAllRecords() {
    const orders = getOrders();
    if (orders.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Clear ALL saved orders?\n\nToday and month earnings will reset to zero. This cannot be undone."
    );
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    updateAnalytics();
  }

  function updateAnalytics() {
    const orders = getOrders();
    const now = new Date();

    let todayTotal = 0;
    let monthTotal = 0;

    orders.forEach((order) => {
      const d = new Date(order.date);
      if (isSameDay(d, now)) todayTotal += order.total;
      if (isSameMonth(d, now)) monthTotal += order.total;
    });

    elStatToday.textContent = formatMoney(todayTotal);
    elStatMonth.textContent = formatMoney(monthTotal);

    const maxVal = Math.max(todayTotal, monthTotal, 1);
    elBarToday.style.height = Math.round((todayTotal / maxVal) * 100) + "%";
    elBarMonth.style.height = Math.round((monthTotal / maxVal) * 100) + "%";

    renderOrdersList(orders);

    if (elBtnClearRecords) {
      elBtnClearRecords.disabled = orders.length === 0;
    }
  }

  function renderOrdersList(orders) {
    elOrdersList.innerHTML = "";

    if (orders.length === 0) {
      elOrdersEmpty.hidden = false;
      return;
    }

    elOrdersEmpty.hidden = true;
    const recent = orders.slice(0, 20);

    recent.forEach((order) => {
      const li = document.createElement("li");
      li.className = "order-card";

      const itemSummary = order.items
        .map((l) => l.qty + "× " + getLineLabel(l))
        .join(", ");

      const dateStr = new Date(order.date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      li.innerHTML =
        '<div class="order-card-header">' +
        "<span>" + escapeHtml(order.customerName) + "</span>" +
        '<span class="order-card-total">' + formatMoney(order.total) + "</span>" +
        "</div>" +
        '<div class="order-card-meta">' + escapeHtml(order.mobile) + " · " + dateStr + "</div>" +
        '<div class="order-card-items">' + escapeHtml(itemSummary) + "</div>";

      elOrdersList.appendChild(li);
    });
  }

  function switchView(viewName) {
    const billing = $("#view-billing");
    const analytics = $("#view-analytics");

    $$(".nav-btn").forEach((btn) => {
      const active = btn.dataset.view === viewName;
      btn.classList.toggle("nav-btn--active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (viewName === "billing") {
      billing.hidden = false;
      billing.classList.add("view--active");
      analytics.hidden = true;
      analytics.classList.remove("view--active");
    } else {
      billing.hidden = true;
      billing.classList.remove("view--active");
      analytics.hidden = false;
      analytics.classList.add("view--active");
      updateAnalytics();
    }
  }

  function init() {
    $$(".products .product-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.dataset.item;
        const price = Number(btn.dataset.price);
        addToCart(item, price);
        flashButton(btn);
      });
    });

    elBtnAddAlteration.addEventListener("click", handleAddAlteration);
    elAlterationAmount.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddAlteration();
      }
    });

    elBtnInvoice.addEventListener("click", generateInvoice);
    elBtnNewBill.addEventListener("click", resetBill);

    $$(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });

    elBtnClearRecords.addEventListener("click", clearAllRecords);

    elMobile.addEventListener("input", () => {
      elMobile.value = elMobile.value.replace(/\D/g, "").slice(0, 10);
    });

    renderCart();
    updateAnalytics();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
