const WHATSAPP_NUMBER = "";
const INSTAGRAM_LINK = "https://www.instagram.com/psycopastas/";
const ADMIN_KEY = "psyco2026";
const CATALOG_STORAGE_KEY = "psycopastas.catalog.v3";
const ADMIN_SESSION_KEY = "psycopastas.admin.unlocked";

const DEFAULT_CATALOG = {
  products: [
    {
      id: "product-fideos-caseros",
      type: "product",
      name: "Fideos caseros",
      tag: "Clásico",
      detail: "Masa al huevo, corte ancho",
      description: "Una receta simple, artesanal y bien de casa, ideal para acompañar con salsas intensas.",
    },
    {
      id: "product-ravioles",
      type: "product",
      name: "Ravioles",
      tag: "Rellenos",
      detail: "Rellenos de estación",
      description: "Cuadraditos generosos, hechos con receta familiar y pensados para una mesa abundante.",
    },
    {
      id: "product-sorrentinos",
      type: "product",
      name: "Sorrentinos",
      tag: "Premium",
      detail: "Formato grande y relleno abundante",
      description: "Redondos, protagonistas y con ese sabor casero que convierte cualquier comida en plan.",
    },
    {
      id: "product-noquis",
      type: "product",
      name: "Ñoquis de papa",
      tag: "Suaves",
      detail: "Suaves, caseros y livianos",
      description: "Bocados tiernos, artesanales y listos para disfrutar con manteca, crema o estofado.",
    },
    {
      id: "product-canelones",
      type: "product",
      name: "Canelones",
      tag: "Casa",
      detail: "Rellenos, salsa y gratinado opcional",
      description: "Para esos almuerzos con mantel largo, receta de familia y ganas de algo especial.",
    },
  ],
  combos: [],
  offers: [],
};

const quantities = new Map();
let catalog = loadCatalog();

const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const productGrid = document.querySelector("[data-products]");
const offersGrid = document.querySelector("[data-offers]");
const summary = document.querySelector("[data-summary]");
const clearButton = document.querySelector("[data-clear]");
const copyButton = document.querySelector("[data-copy]");
const orderLink = document.querySelector("[data-order-link]");
const orderForm = document.querySelector("[data-order-form]");
const toast = document.querySelector("[data-toast]");
const adminPanel = document.querySelector("[data-admin-panel]");
const adminLogin = document.querySelector("[data-admin-login]");
const adminWorkspace = document.querySelector("[data-admin-workspace]");
const adminList = document.querySelector("[data-admin-list]");

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function loadCatalog() {
  try {
    const saved = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!saved) return structuredClone(DEFAULT_CATALOG);

    const parsed = JSON.parse(saved);

    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      combos: Array.isArray(parsed.combos) ? parsed.combos : [],
      offers: Array.isArray(parsed.offers) ? parsed.offers : [],
    };
  } catch {
    return structuredClone(DEFAULT_CATALOG);
  }
}

function saveCatalog() {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function todayAtStart(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function todayAtEnd(dateString) {
  return new Date(`${dateString}T23:59:59`);
}

function isOfferActive(offer) {
  if (!offer.start || !offer.end) return false;

  const now = new Date();

  return now >= todayAtStart(offer.start) && now <= todayAtEnd(offer.end);
}

function formatDate(dateString) {
  if (!dateString) return "";

  return new Date(`${dateString}T12:00:00`).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

function getActiveOffers() {
  return catalog.offers.filter(isOfferActive);
}

function getOrderableItems() {
  return [...catalog.products, ...catalog.combos, ...getActiveOffers()];
}

function findOrderItem(id) {
  return getOrderableItems().find((item) => item.id === id);
}

function setHeaderState() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function closeNav() {
  header.classList.remove("is-open");
  navToggle.setAttribute("aria-label", "Abrir menú");
}

function buildMessage() {
  const form = new FormData(orderForm);
  const name = form.get("name")?.trim();
  const address = form.get("address")?.trim();
  const notes = form.get("notes")?.trim();
  const products = [...quantities.values()].filter((item) => item.qty > 0);

  const lines = ["Hola PsycoPastas, quiero consultar por este pedido:"];

  if (products.length) {
    products.forEach((item) => {
      lines.push(`- ${item.qty} x ${item.name} (${item.detail})`);
    });
  } else {
    lines.push("- Me gustaría consultar disponibilidad.");
  }

  if (name) lines.push(`Nombre: ${name}`);
  if (address) lines.push(`Zona/dirección: ${address}`);
  if (notes) lines.push(`Comentarios: ${notes}`);

  return lines.join("\n");
}

function getOrderLink() {
  if (!WHATSAPP_NUMBER) return INSTAGRAM_LINK;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";

  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function renderOrderCard(item, index, extraClass = "") {
  const qty = quantities.get(item.id)?.qty ?? 0;

  const period =
    item.type === "offer"
      ? `<span class="offer-date">${formatDate(item.start)} al ${formatDate(item.end)}</span>`
      : "";

  return `
    <article class="product-card reveal ${extraClass}" data-order-item="${escapeHTML(item.id)}">
      <div class="product-top">
        <span class="product-number">${String(index).padStart(2, "0")}</span>
        <span class="product-tag">${escapeHTML(item.tag || item.type)}</span>
      </div>

      <h3>${escapeHTML(item.name)}</h3>
      <p>${escapeHTML(item.description)}</p>

      ${period}

      <div class="product-controls">
        <button class="qty-btn" type="button" data-action="decrease" aria-label="Restar ${escapeHTML(item.name)}">-</button>
        <output data-qty-for="${escapeHTML(item.id)}">${qty}</output>
        <button class="qty-btn" type="button" data-action="increase" aria-label="Sumar ${escapeHTML(item.name)}">+</button>
      </div>
    </article>
  `;
}

function renderCatalog() {
  const items = [...catalog.products, ...catalog.combos];
  const activeOffers = getActiveOffers();

  productGrid.innerHTML = items.map((item, index) => renderOrderCard(item, index + 1)).join("");

  offersGrid.innerHTML = activeOffers.length
    ? activeOffers.map((item, index) => renderOrderCard(item, index + 1, "offer-card")).join("")
    : '<p class="empty-panel">No hay ofertas activas en este momento.</p>';

  getOrderableItems().forEach((item) => {
    const current = quantities.get(item.id);

    quantities.set(item.id, {
      id: item.id,
      name: item.name,
      detail: item.detail,
      qty: current?.qty ?? 0,
    });
  });

  renderSummary();

  observeRevealElements(productGrid);
  observeRevealElements(offersGrid);
}

function renderSummary() {
  const products = [...quantities.values()].filter((item) => item.qty > 0);

  if (!products.length) {
    summary.innerHTML = '<p class="empty-state">Todavía no agregaste productos.</p>';
  } else {
    summary.innerHTML = products
      .map(
        (item) => `
          <div class="summary-item">
            <strong>${escapeHTML(item.name)}</strong>
            <span>${item.qty}</span>
            <small>${escapeHTML(item.detail)}</small>
          </div>
        `
      )
      .join("");
  }

  orderLink.href = getOrderLink();
  orderLink.textContent = WHATSAPP_NUMBER ? "Enviar por WhatsApp" : "Enviar por Instagram";
}

function syncQuantityOutputs(id, qty) {
  document.querySelectorAll("[data-qty-for]").forEach((output) => {
    if (output.dataset.qtyFor === id) {
      output.textContent = qty;
    }
  });
}

function updateQuantity(id, nextQty) {
  const item = findOrderItem(id);
  if (!item) return;

  const qty = Math.max(0, Math.min(99, nextQty));

  quantities.set(id, {
    id,
    name: item.name,
    detail: item.detail,
    qty,
  });

  syncQuantityOutputs(id, qty);
  renderSummary();
}

function clearQuantities() {
  quantities.forEach((item, id) => {
    item.qty = 0;
    syncQuantityOutputs(id, 0);
  });

  renderSummary();
}

function readAdminItem(form, type) {
  const data = new FormData(form);

  return {
    id: createId(type),
    type,
    name: data.get("name")?.trim(),
    tag: data.get("tag")?.trim() || (type === "combo" ? "Combo" : type === "offer" ? "Oferta" : "Nuevo"),
    detail: data.get("detail")?.trim(),
    description: data.get("description")?.trim(),
    start: data.get("start") || "",
    end: data.get("end") || "",
  };
}

function renderAdminList() {
  if (!adminList) return;

  const section = (title, type, items) => `
    <h3>${title}</h3>
    ${
      items.length
        ? items
            .map((item) => {
              const range = item.type === "offer" ? ` · ${formatDate(item.start)} al ${formatDate(item.end)}` : "";

              return `
                <div class="admin-item">
                  <div>
                    <strong>${escapeHTML(item.name)}</strong>
                    <small>${escapeHTML(item.detail)}${range}</small>
                  </div>

                  <button class="admin-delete" type="button" data-admin-delete="${escapeHTML(item.id)}" data-admin-type="${type}">
                    Eliminar
                  </button>
                </div>
              `;
            })
            .join("")
        : '<p class="empty-state">Sin elementos cargados.</p>'
    }
  `;

  adminList.innerHTML = [
    section("Productos", "products", catalog.products),
    section("Combos", "combos", catalog.combos),
    section("Ofertas", "offers", catalog.offers),
  ].join("");
}

function showAdminWorkspace() {
  adminLogin.hidden = true;
  adminWorkspace.hidden = false;
  renderAdminList();
}

function openAdminPanel() {
  adminPanel.hidden = false;
  document.body.classList.add("no-scroll");
  closeNav();

  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    showAdminWorkspace();
  } else {
    adminLogin.hidden = false;
    adminWorkspace.hidden = true;
    adminLogin.querySelector("input")?.focus();
  }
}

function closeAdminPanel() {
  adminPanel.hidden = true;
  document.body.classList.remove("no-scroll");
}

function activateAdminTab(name) {
  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminTab === name);
  });

  document.querySelectorAll("[data-admin-pane]").forEach((pane) => {
    pane.classList.toggle("is-active", pane.dataset.adminPane === name);
  });
}

/* Animaciones reveal */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canObserveReveals = "IntersectionObserver" in window && !prefersReducedMotion.matches;

let revealObserver = null;

function revealElement(element) {
  element.classList.add("is-visible");
  element.dataset.revealed = "true";
}

function observeRevealElements(root = document) {
  const elements = Array.from(root.querySelectorAll(".reveal:not([data-reveal-ready])"));

  elements.forEach((element, index) => {
    element.dataset.revealReady = "true";
    element.style.transitionDelay = `${Math.min(index * 45, 260)}ms`;

    if (!canObserveReveals || !revealObserver) {
      revealElement(element);
      return;
    }

    revealObserver.observe(element);
  });
}

if (canObserveReveals) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        revealElement(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -40px",
    }
  );
}

/* Eventos */

document.addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-action]");

  if (quantityButton) {
    const card = quantityButton.closest("[data-order-item]");
    const item = quantities.get(card?.dataset.orderItem);

    if (!card || !item) return;

    const change = quantityButton.dataset.action === "increase" ? 1 : -1;

    updateQuantity(card.dataset.orderItem, item.qty + change);
    return;
  }

  if (event.target.closest("[data-admin-open]")) {
    openAdminPanel();
    return;
  }

  if (event.target.closest("[data-admin-close]")) {
    closeAdminPanel();
    return;
  }

  const tab = event.target.closest("[data-admin-tab]");

  if (tab) {
    activateAdminTab(tab.dataset.adminTab);
    return;
  }

  const deleteButton = event.target.closest("[data-admin-delete]");

  if (deleteButton) {
    const type = deleteButton.dataset.adminType;
    const id = deleteButton.dataset.adminDelete;

    catalog[type] = catalog[type].filter((item) => item.id !== id);
    quantities.delete(id);

    saveCatalog();
    renderCatalog();
    renderAdminList();
    showToast("Elemento eliminado");
  }
});

clearButton.addEventListener("click", clearQuantities);

copyButton.addEventListener("click", async () => {
  try {
    await copyToClipboard(buildMessage());
    showToast("Mensaje copiado");
  } catch {
    showToast("No se pudo copiar");
  }
});

orderLink.addEventListener("click", () => {
  copyToClipboard(buildMessage())
    .then(() => showToast("Mensaje copiado"))
    .catch(() => {});
});

orderForm.addEventListener("input", renderSummary);

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-open");
  navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    closeNav();
  }
});

adminLogin.addEventListener("submit", (event) => {
  event.preventDefault();

  const key = new FormData(adminLogin).get("adminKey");

  if (key !== ADMIN_KEY) {
    showToast("Clave incorrecta");
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  adminLogin.reset();
  showAdminWorkspace();
});

document.querySelector("[data-product-form]").addEventListener("submit", (event) => {
  event.preventDefault();

  const item = readAdminItem(event.currentTarget, "product");

  catalog.products.push(item);
  saveCatalog();

  event.currentTarget.reset();
  renderCatalog();
  renderAdminList();
  showToast("Producto guardado");
});

document.querySelector("[data-combo-form]").addEventListener("submit", (event) => {
  event.preventDefault();

  const item = readAdminItem(event.currentTarget, "combo");

  catalog.combos.push(item);
  saveCatalog();

  event.currentTarget.reset();
  renderCatalog();
  renderAdminList();
  showToast("Combo guardado");
});

document.querySelector("[data-offer-form]").addEventListener("submit", (event) => {
  event.preventDefault();

  const item = readAdminItem(event.currentTarget, "offer");

  if (todayAtEnd(item.end) < todayAtStart(item.start)) {
    showToast("Revisá las fechas");
    return;
  }

  catalog.offers.push(item);
  saveCatalog();

  event.currentTarget.reset();
  renderCatalog();
  renderAdminList();
  showToast("Oferta guardada");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  closeNav();
  closeAdminPanel();
});

/* Inicio */

window.addEventListener("scroll", setHeaderState, { passive: true });

setHeaderState();
renderCatalog();
observeRevealElements();