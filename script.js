const WHATSAPP_NUMBER = "";
const INSTAGRAM_LINK = "https://www.instagram.com/psycopastas/";
const ADMIN_KEY = "psyco2026";
const CATALOG_STORAGE_KEY = "psycopastas.catalog.v4";
const ADMIN_SESSION_KEY = "psycopastas.admin.unlocked";
const OPTION_SEPARATOR = "|||";

const SAUCE_OPTIONS = [
  "Blanca / sin salsa",
  "Salsa roja",
  "Salsa bolognesa",
  "A la crema",
  "Salsa mixta",
  "Salsa de pimiento",
];

const SALT_OPTIONS = ["Con sal", "Sin sal"];

const DEFAULT_CATALOG = {
  products: [
    {
      id: "product-fettuccine",
      type: "product",
      name: "Fettuccine",
      tag: "Clásico",
      detail: "Pasta artesanal de corte ancho",
      description: "Cintas caseras con buena textura, ideales para acompañar con salsas intensas.",
    },
    {
      id: "product-noquis-papa",
      type: "product",
      name: "Ñoquis de papa",
      tag: "Suaves",
      detail: "Ñoquis artesanales de papa",
      description: "Bocados tiernos, simples y bien de casa para una comida abundante.",
    },
    {
      id: "product-noquis-zapallo",
      type: "product",
      name: "Ñoquis de zapallo",
      tag: "Especial",
      detail: "Ñoquis artesanales de zapallo",
      description: "Una opción suave y distinta, con sabor casero y personalidad propia.",
    },
    {
      id: "product-sorrentinos-jyq",
      type: "product",
      name: "Sorrentinos JyQ",
      tag: "Rellenos",
      detail: "Jamón y queso",
      description: "Sorrentinos grandes, clásicos y pensados para una comida protagonista.",
    },
    {
      id: "product-sorrentinos-zym",
      type: "product",
      name: "Sorrentinos ZyM",
      tag: "Rellenos",
      detail: "Zapallo y muzzarella",
      description: "Una combinación cremosa y artesanal para salir del clásico de siempre.",
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

function createSelectionKey(id, sauce, salt) {
  return [id, sauce, salt].join(OPTION_SEPARATOR);
}

function getCardOptions(card) {
  const sauce = card.querySelector("[data-sauce-select]")?.value || SAUCE_OPTIONS[0];
  const salt = card.querySelector("[data-salt-option]:checked")?.value || SALT_OPTIONS[0];

  return { sauce, salt };
}

function getSelectionQty(id, sauce, salt) {
  return quantities.get(createSelectionKey(id, sauce, salt))?.qty ?? 0;
}

function syncCardQuantity(card) {
  if (!card) return;

  const id = card.dataset.orderItem;
  const { sauce, salt } = getCardOptions(card);
  const output = card.querySelector("[data-current-qty]");

  if (output) output.textContent = getSelectionQty(id, sauce, salt);
}

function syncAllCardQuantities() {
  document.querySelectorAll("[data-order-item]").forEach(syncCardQuantity);
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
      lines.push(`  Salsa: ${item.sauce}`);
      lines.push(`  Sal: ${item.salt}`);
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
  const defaultQty = getSelectionQty(item.id, SAUCE_OPTIONS[0], SALT_OPTIONS[0]);
  const saltName = `salt-${item.id}`;
  const sauceOptions = SAUCE_OPTIONS.map(
    (sauce) => `<option value="${escapeHTML(sauce)}">${escapeHTML(sauce)}</option>`
  ).join("");
  const saltOptions = SALT_OPTIONS.map(
    (salt, saltIndex) => `
      <label class="salt-option">
        <input
          type="radio"
          name="${escapeHTML(saltName)}"
          value="${escapeHTML(salt)}"
          data-salt-option
          ${saltIndex === 0 ? "checked" : ""}
        />
        <span>${escapeHTML(salt)}</span>
      </label>
    `
  ).join("");

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

      <div class="order-options">
        <label>
          Salsa
          <select data-sauce-select aria-label="Elegir salsa para ${escapeHTML(item.name)}">
            ${sauceOptions}
          </select>
        </label>

        <fieldset class="salt-field">
          <legend>Sal</legend>
          <div class="salt-options">
            ${saltOptions}
          </div>
        </fieldset>
      </div>

      <div class="product-controls">
        <button class="qty-btn" type="button" data-action="decrease" aria-label="Restar ${escapeHTML(item.name)}">-</button>
        <output data-current-qty>${defaultQty}</output>
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
            <small>${escapeHTML(item.detail)} · ${escapeHTML(item.sauce)} · ${escapeHTML(item.salt)}</small>
          </div>
        `
      )
      .join("");
  }

  orderLink.href = getOrderLink();
  orderLink.textContent = WHATSAPP_NUMBER ? "Enviar por WhatsApp" : "Enviar por Instagram";
}

function syncQuantityOutputs(id, qty) {
  syncAllCardQuantities();
}

function updateQuantity(id, sauce, salt, nextQty) {
  const item = findOrderItem(id);
  if (!item) return;

  const qty = Math.max(0, Math.min(99, nextQty));
  const key = createSelectionKey(id, sauce, salt);

  if (qty === 0) {
    quantities.delete(key);
    syncAllCardQuantities();
    renderSummary();
    return;
  }

  quantities.set(key, {
    id,
    key,
    name: item.name,
    detail: item.detail,
    sauce,
    salt,
    qty,
  });

  syncQuantityOutputs(id, qty);
  renderSummary();
}

function clearQuantities() {
  quantities.clear();
  syncAllCardQuantities();

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
    const item = findOrderItem(card?.dataset.orderItem);

    if (!card || !item) return;

    const change = quantityButton.dataset.action === "increase" ? 1 : -1;
    const { sauce, salt } = getCardOptions(card);
    const currentQty = getSelectionQty(card.dataset.orderItem, sauce, salt);

    updateQuantity(card.dataset.orderItem, sauce, salt, currentQty + change);
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
    [...quantities.keys()].forEach((key) => {
      if (key.startsWith(`${id}${OPTION_SEPARATOR}`)) quantities.delete(key);
    });

    saveCatalog();
    renderCatalog();
    renderAdminList();
    showToast("Elemento eliminado");
  }
});

document.addEventListener("change", (event) => {
  if (!event.target.closest("[data-sauce-select], [data-salt-option]")) return;

  syncCardQuantity(event.target.closest("[data-order-item]"));
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
