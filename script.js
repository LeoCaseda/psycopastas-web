const WHATSAPP_NUMBER = "";
const INSTAGRAM_LINK = "https://www.instagram.com/psycopastas/";
const ADMIN_KEY = "psyco2026";
const CATALOG_STORAGE_KEY = "psycopastas.catalog.v4";
const ADMIN_SESSION_KEY = "psycopastas.admin.unlocked";
const OPTION_SEPARATOR = "|||";
const SUPABASE_URL = "https://qsvigjpadxmotfzhnlue.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wL59UbFVdWW0vm0gVw4thQ_i-go_WIU";

const DB_TABLES = {
  catalog: "catalog_items",
  sauces: "sauces",
  orders: "orders",
};

const DEFAULT_SAUCES = [
  {
    id: "sauce-blanca",
    type: "sauce",
    name: "Blanca / sin salsa",
    tag: "Base",
    detail: "Opción sin salsa",
    description: "Para quienes prefieren que la pasta sea la protagonista.",
  },
  {
    id: "sauce-roja",
    type: "sauce",
    name: "Salsa roja",
    tag: "Clásica",
    detail: "Salsa de tomate",
    description: "Simple, casera y bien compañera.",
  },
  {
    id: "sauce-bolognesa",
    type: "sauce",
    name: "Salsa bolognesa",
    tag: "Intensa",
    detail: "Salsa con carne",
    description: "Más cuerpo y sabor para una comida completa.",
  },
  {
    id: "sauce-crema",
    type: "sauce",
    name: "A la crema",
    tag: "Suave",
    detail: "Salsa cremosa",
    description: "Cremosa, delicada y perfecta para rellenos.",
  },
  {
    id: "sauce-mixta",
    type: "sauce",
    name: "Salsa mixta",
    tag: "Equilibrada",
    detail: "Roja y crema",
    description: "Un punto medio entre lo rojo y lo cremoso.",
  },
  {
    id: "sauce-pimiento",
    type: "sauce",
    name: "Salsa de pimiento",
    tag: "Especial",
    detail: "Salsa de pimiento",
    description: "Una opción distinta para salir del clásico.",
  },
];

const SALT_OPTIONS = ["Con sal", "Sin sal"];
const GRAM_PRESENTATIONS = ["500 g", "1000 g", "Más de 1 kg"];
const DOZEN_PRESENTATIONS = ["1/2 docena", "1 docena", "Más de 1 docena"];

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
  sauces: structuredClone(DEFAULT_SAUCES),
  combos: [],
  offers: [],
};

const quantities = new Map();
let catalog = loadCatalog();
let editingAdminItem = null;
let supabaseClient = null;
let supabaseReady = false;

const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const productGrid = document.querySelector("[data-products]");
const offersGrid = document.querySelector("[data-offers]");
const saucesList = document.querySelector("[data-sauces-list]");
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
      sauces: Array.isArray(parsed.sauces) && parsed.sauces.length ? parsed.sauces : structuredClone(DEFAULT_SAUCES),
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

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !window.supabase?.createClient) {
    return null;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return supabaseClient;
}

function toDbItem(item, sortOrder = 0) {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    tag: item.tag || "",
    detail: item.detail || "",
    description: item.description || "",
    start_date: item.start || null,
    end_date: item.end || null,
    sauce_mode: item.sauceMode || "free",
    fixed_sauce: item.fixedSauce || "",
    sort_order: sortOrder,
    is_active: true,
  };
}

function fromDbItem(item) {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    tag: item.tag || "",
    detail: item.detail || "",
    description: item.description || "",
    start: item.start_date || "",
    end: item.end_date || "",
    sauceMode: item.sauce_mode || "free",
    fixedSauce: item.fixed_sauce || "",
  };
}

function toDbSauce(sauce, sortOrder = 0) {
  return {
    id: sauce.id,
    type: "sauce",
    name: sauce.name,
    tag: sauce.tag || "Salsa",
    detail: sauce.detail || sauce.name,
    description: sauce.description || "",
    sort_order: sortOrder,
    is_active: true,
  };
}

function fromDbSauce(sauce) {
  return {
    id: sauce.id,
    type: "sauce",
    name: sauce.name,
    tag: sauce.tag || "Salsa",
    detail: sauce.detail || sauce.name,
    description: sauce.description || "",
  };
}

async function loadCatalogFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return false;

  const [{ data: items, error: itemsError }, { data: sauces, error: saucesError }] = await Promise.all([
    client.from(DB_TABLES.catalog).select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    client.from(DB_TABLES.sauces).select("*").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  if (itemsError || saucesError) {
    console.warn("Supabase no pudo cargar el catálogo:", itemsError || saucesError);
    supabaseReady = false;
    return false;
  }

  if (!items?.length && !sauces?.length) {
    supabaseReady = true;
    await persistCatalogSnapshotToSupabase();
    return true;
  }

  const mappedItems = (items || []).map(fromDbItem);
  const mappedSauces = (sauces || []).map(fromDbSauce);

  catalog = {
    products: mappedItems.filter((item) => item.type === "product"),
    sauces: mappedSauces.length ? mappedSauces : structuredClone(DEFAULT_SAUCES),
    combos: mappedItems.filter((item) => item.type === "combo"),
    offers: mappedItems.filter((item) => item.type === "offer"),
  };

  saveCatalog();
  supabaseReady = true;
  return true;
}

async function persistCatalogSnapshotToSupabase() {
  const client = getSupabaseClient();
  if (!client) return;

  const catalogItems = [
    ...catalog.products.map((item, index) => toDbItem(item, index)),
    ...catalog.combos.map((item, index) => toDbItem(item, index)),
    ...catalog.offers.map((item, index) => toDbItem(item, index)),
  ];
  const sauceItems = catalog.sauces.map((sauce, index) => toDbSauce(sauce, index));

  const requests = [];
  if (catalogItems.length) {
    requests.push(client.from(DB_TABLES.catalog).upsert(catalogItems, { onConflict: "id" }));
  }
  if (sauceItems.length) {
    requests.push(client.from(DB_TABLES.sauces).upsert(sauceItems, { onConflict: "id" }));
  }

  const results = await Promise.all(requests);
  const failed = results.find((result) => result.error);

  if (failed) {
    console.warn("Supabase no pudo inicializar el catálogo:", failed.error);
    showToast("Catálogo local activo");
  }
}

async function persistAdminItem(collection, item) {
  saveCatalog();

  const client = getSupabaseClient();
  if (!client) return;

  const items = catalog[collection] || [];
  const sortOrder = Math.max(0, items.findIndex((current) => current.id === item.id));
  const table = collection === "sauces" ? DB_TABLES.sauces : DB_TABLES.catalog;
  const payload = collection === "sauces" ? toDbSauce(item, sortOrder) : toDbItem(item, sortOrder);
  const { error } = await client.from(table).upsert(payload, { onConflict: "id" });

  if (error) {
    console.warn("Supabase no pudo guardar el elemento:", error);
    showToast("Guardado local. Revisá Supabase.");
  }
}

async function deleteAdminItemFromSupabase(collection, id) {
  const client = getSupabaseClient();
  if (!client) return;

  const table = collection === "sauces" ? DB_TABLES.sauces : DB_TABLES.catalog;
  const { error } = await client.from(table).delete().eq("id", id);

  if (error) {
    console.warn("Supabase no pudo eliminar el elemento:", error);
    showToast("Eliminado local. Revisá Supabase.");
  }
}

function getOrderPayload(channel = "manual") {
  const form = new FormData(orderForm);
  const selections = [...quantities.values()].filter((item) => item.qty > 0);

  return {
    customer_name: form.get("name")?.trim() || "",
    customer_address: form.get("address")?.trim() || "",
    notes: form.get("notes")?.trim() || "",
    channel,
    status: "generated",
    message: buildMessage(),
    items: selections.map((item) => ({
      id: item.id,
      name: item.name,
      detail: item.detail,
      presentation: item.presentation,
      sauce: item.sauce,
      salt: item.salt,
      quantity: item.qty,
    })),
  };
}

async function saveOrderToSupabase(channel = "manual") {
  const client = getSupabaseClient();
  if (!client) return;

  const payload = getOrderPayload(channel);
  const { error } = await client.from(DB_TABLES.orders).insert(payload);

  if (error) {
    console.warn("Supabase no pudo guardar el pedido:", error);
    showToast("No se guardó en la base");
    return;
  }

  showToast("Pedido guardado");
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

function getSauces() {
  return Array.isArray(catalog.sauces) && catalog.sauces.length
    ? catalog.sauces
    : structuredClone(DEFAULT_SAUCES);
}

function getSauceOptions() {
  return getSauces()
    .map((sauce) => sauce.name?.trim())
    .filter(Boolean);
}

function renderSauceOptions(selectedValue = "") {
  return getSauceOptions()
    .map(
      (sauce) =>
        `<option value="${escapeHTML(sauce)}" ${sauce === selectedValue ? "selected" : ""}>${escapeHTML(sauce)}</option>`
    )
    .join("");
}

function refreshAdminSauceSelects() {
  document.querySelectorAll("[data-admin-sauce-select]").forEach((select) => {
    const selected = select.value;
    select.innerHTML = `<option value="">Cliente elige salsa</option>${renderSauceOptions(selected)}`;
  });
}

function renderSaucesList() {
  if (!saucesList) return;

  const sauces = getSauces();

  saucesList.innerHTML = sauces.length
    ? sauces
        .map(
          (sauce) => `
            <article class="sauce-row">
              <div class="sauce-row-marker" aria-hidden="true"></div>
              <div class="sauce-row-content">
                <div class="sauce-row-title">
                  <strong>${escapeHTML(sauce.name)}</strong>
                  <span>${escapeHTML(sauce.tag || "Salsa")}</span>
                </div>
                <p>${escapeHTML(sauce.description || "Opción disponible para acompañar pastas, combos u ofertas.")}</p>
              </div>
            </article>
          `
        )
        .join("")
    : '<p class="empty-state">No hay salsas cargadas en este momento.</p>';
}

function clearSelectionsUsingSauce(sauceName) {
  [...quantities.entries()].forEach(([key, item]) => {
    if (item.sauce === sauceName) quantities.delete(key);
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

function hasConfigurableSauce(item) {
  return ["combo", "offer"].includes(item.type);
}

function getPresentationOptions(item) {
  if (item.type !== "product") return [];

  return item.name.toLowerCase().includes("sorrentinos") ? DOZEN_PRESENTATIONS : GRAM_PRESENTATIONS;
}

function createSelectionKey(id, presentation, sauce, salt) {
  return [id, presentation, sauce, salt].join(OPTION_SEPARATOR);
}

function getCardOptions(card) {
  const presentation = card.querySelector("[data-presentation-select]")?.value || "";
  const fixedSauce = card.querySelector("[data-fixed-sauce]")?.dataset.fixedSauce;
  const sauce = fixedSauce || card.querySelector("[data-sauce-select]")?.value || getSauceOptions()[0] || "";
  const salt = card.querySelector("[data-salt-option]:checked")?.value || SALT_OPTIONS[0];

  return { presentation, sauce, salt };
}

function getSelectionQty(id, presentation, sauce, salt) {
  return quantities.get(createSelectionKey(id, presentation, sauce, salt))?.qty ?? 0;
}

function syncCardQuantity(card) {
  if (!card) return;

  const id = card.dataset.orderItem;
  const { presentation, sauce, salt } = getCardOptions(card);
  const output = card.querySelector("[data-current-qty]");

  if (output) output.textContent = getSelectionQty(id, presentation, sauce, salt);
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
      if (item.presentation) lines.push(`  Presentación: ${item.presentation}`);
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
  const presentationOptions = getPresentationOptions(item);
  const defaultPresentation = presentationOptions[0] || "";
  const hasFixedSauce = hasConfigurableSauce(item) && item.fixedSauce;
  const defaultSauce = hasFixedSauce ? item.fixedSauce : getSauceOptions()[0] || "";
  const defaultQty = getSelectionQty(item.id, defaultPresentation, defaultSauce, SALT_OPTIONS[0]);
  const saltName = `salt-${item.id}`;
  const presentationSelect = presentationOptions.length
    ? `
      <label>
        Presentación
        <select data-presentation-select aria-label="Elegir presentación para ${escapeHTML(item.name)}">
          ${presentationOptions
            .map((presentation) => `<option value="${escapeHTML(presentation)}">${escapeHTML(presentation)}</option>`)
            .join("")}
        </select>
      </label>
    `
    : "";
  const sauceOptions = renderSauceOptions();
  const sauceControl = hasFixedSauce
    ? `
      <div class="fixed-sauce" data-fixed-sauce="${escapeHTML(item.fixedSauce)}">
        <span>Salsa incluida</span>
        <strong>${escapeHTML(item.fixedSauce)}</strong>
      </div>
    `
    : `
      <label>
        Salsa
        <select data-sauce-select aria-label="Elegir salsa para ${escapeHTML(item.name)}">
          ${sauceOptions}
        </select>
      </label>
    `;
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
        ${presentationSelect}
        ${sauceControl}

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

  renderSaucesList();
  refreshAdminSauceSelects();
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
            <div>
              <strong>${escapeHTML(item.name)}</strong>
              <small>
                ${escapeHTML([item.detail, item.presentation, item.sauce, item.salt].filter(Boolean).join(" · "))}
              </small>
            </div>
            <span>${item.qty}</span>
            <button
              class="summary-remove"
              type="button"
              data-remove-selection="${escapeHTML(item.key)}"
              aria-label="Eliminar ${escapeHTML(item.name)} de la selección"
            >
              Eliminar
            </button>
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

function updateQuantity(id, presentation, sauce, salt, nextQty) {
  const item = findOrderItem(id);
  if (!item) return;

  const qty = Math.max(0, Math.min(99, nextQty));
  const key = createSelectionKey(id, presentation, sauce, salt);

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
    presentation,
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

  if (type === "sauce") {
    const name = data.get("name")?.trim();

    return {
      id: createId(type),
      type,
      name,
      tag: data.get("tag")?.trim() || "Salsa",
      detail: name,
      description: data.get("description")?.trim(),
    };
  }

  const fixedSauce = data.get("fixedSauce") || "";
  const supportsSauceConfig = ["combo", "offer"].includes(type);

  return {
    id: createId(type),
    type,
    name: data.get("name")?.trim(),
    tag: data.get("tag")?.trim() || (type === "combo" ? "Combo" : type === "offer" ? "Oferta" : "Nuevo"),
    detail: data.get("detail")?.trim(),
    description: data.get("description")?.trim(),
    start: data.get("start") || "",
    end: data.get("end") || "",
    sauceMode: supportsSauceConfig && fixedSauce ? "fixed" : "free",
    fixedSauce: supportsSauceConfig ? fixedSauce : "",
  };
}

function clearSelectionsForItem(id) {
  [...quantities.keys()].forEach((key) => {
    if (key.startsWith(`${id}${OPTION_SEPARATOR}`)) quantities.delete(key);
  });
}

function resetAdminForm(form, buttonLabel) {
  form.reset();
  delete form.dataset.editingId;
  const button = form.querySelector("button[type='submit']");
  if (button) button.textContent = buttonLabel;
  editingAdminItem = null;
}

function fillAdminForm(collection, item) {
  const form = document.querySelector(`[data-${collection.slice(0, -1)}-form]`);
  if (!form) return;

  form.dataset.editingId = item.id;
  form.elements.name.value = item.name || "";
  form.elements.tag.value = item.tag || "";
  if (form.elements.detail) form.elements.detail.value = item.detail || "";
  form.elements.description.value = item.description || "";

  if (form.elements.start) form.elements.start.value = item.start || "";
  if (form.elements.end) form.elements.end.value = item.end || "";
  if (form.elements.fixedSauce) form.elements.fixedSauce.value = item.fixedSauce || "";

  const labels = {
    products: "Actualizar producto",
    sauces: "Actualizar salsa",
    combos: "Actualizar combo",
    offers: "Actualizar oferta",
  };

  const button = form.querySelector("button[type='submit']");
  if (button) button.textContent = labels[collection];

  editingAdminItem = { collection, id: item.id };
  activateAdminTab(collection);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveAdminItem(form, collection, type, successLabel, updateLabel, defaultButtonLabel) {
  const item = readAdminItem(form, type);
  const editingId = form.dataset.editingId;
  let savedItem = item;

  if (editingId) {
    const index = catalog[collection].findIndex((current) => current.id === editingId);
    const previousItem = index >= 0 ? catalog[collection][index] : null;
    const updated = { ...item, id: editingId };
    savedItem = updated;

    if (collection === "sauces" && previousItem?.name && previousItem.name !== updated.name) {
      renameSauceReferences(previousItem.name, updated.name);
    }

    if (index >= 0) {
      catalog[collection][index] = updated;
    } else {
      catalog[collection].push(updated);
    }

    clearSelectionsForItem(editingId);
    showToast(updateLabel);
  } else {
    catalog[collection].push(item);
    showToast(successLabel);
  }

  if (collection === "sauces") {
    refreshCatalogSauceReferences();
  }

  await persistAdminItem(collection, savedItem);
  resetAdminForm(form, defaultButtonLabel);
  renderCatalog();
  renderAdminList();
}

function renameSauceReferences(previousName, nextName) {
  [...catalog.combos, ...catalog.offers].forEach((item) => {
    if (item.fixedSauce === previousName) item.fixedSauce = nextName;
  });

  [...quantities.entries()].forEach(([key, item]) => {
    if (item.sauce !== previousName) return;

    const nextKey = createSelectionKey(item.id, item.presentation, nextName, item.salt);
    quantities.delete(key);
    quantities.set(nextKey, { ...item, key: nextKey, sauce: nextName });
  });
}

function refreshCatalogSauceReferences() {
  const sauceNames = new Set(getSauceOptions());

  [...catalog.combos, ...catalog.offers].forEach((item) => {
    if (item.fixedSauce && !sauceNames.has(item.fixedSauce)) {
      item.fixedSauce = "";
      item.sauceMode = "free";
    }
  });

  [...quantities.entries()].forEach(([key, item]) => {
    if (item.sauce && !sauceNames.has(item.sauce)) quantities.delete(key);
  });
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
              const sauce = hasConfigurableSauce(item) && item.fixedSauce ? ` · Salsa fija: ${item.fixedSauce}` : "";
              const detail =
                item.type === "sauce"
                  ? `${item.tag || "Salsa"}${item.description ? ` · ${item.description}` : ""}`
                  : `${item.detail || ""}${range}${sauce}`;

              return `
                <div class="admin-item">
                  <div>
                    <strong>${escapeHTML(item.name)}</strong>
                    <small>${escapeHTML(detail)}</small>
                  </div>

                  <div class="admin-actions">
                    <button class="admin-edit" type="button" data-admin-edit="${escapeHTML(item.id)}" data-admin-type="${type}">
                      Editar
                    </button>
                    <button class="admin-delete" type="button" data-admin-delete="${escapeHTML(item.id)}" data-admin-type="${type}">
                      Eliminar
                    </button>
                  </div>
                </div>
              `;
            })
            .join("")
        : '<p class="empty-state">Sin elementos cargados.</p>'
    }
  `;

  adminList.innerHTML = [
    section("Productos", "products", catalog.products),
    section("Salsas", "sauces", catalog.sauces),
    section("Combos", "combos", catalog.combos),
    section("Ofertas", "offers", catalog.offers),
  ].join("");
}

function showAdminWorkspace() {
  adminLogin.hidden = true;
  adminWorkspace.hidden = false;
  refreshAdminSauceSelects();
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

document.addEventListener("click", async (event) => {
  const quantityButton = event.target.closest("[data-action]");

  if (quantityButton) {
    const card = quantityButton.closest("[data-order-item]");
    const item = findOrderItem(card?.dataset.orderItem);

    if (!card || !item) return;

    const change = quantityButton.dataset.action === "increase" ? 1 : -1;
    const { presentation, sauce, salt } = getCardOptions(card);
    const currentQty = getSelectionQty(card.dataset.orderItem, presentation, sauce, salt);

    updateQuantity(card.dataset.orderItem, presentation, sauce, salt, currentQty + change);
    return;
  }

  const removeSelectionButton = event.target.closest("[data-remove-selection]");

  if (removeSelectionButton) {
    quantities.delete(removeSelectionButton.dataset.removeSelection);
    syncAllCardQuantities();
    renderSummary();
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

  const editButton = event.target.closest("[data-admin-edit]");

  if (editButton) {
    const type = editButton.dataset.adminType;
    const id = editButton.dataset.adminEdit;
    const item = catalog[type].find((current) => current.id === id);

    if (item) fillAdminForm(type, item);
    return;
  }

  const deleteButton = event.target.closest("[data-admin-delete]");

  if (deleteButton) {
    const type = deleteButton.dataset.adminType;
    const id = deleteButton.dataset.adminDelete;

    const removedItem = catalog[type].find((item) => item.id === id);

    catalog[type] = catalog[type].filter((item) => item.id !== id);
    clearSelectionsForItem(id);

    if (type === "sauces" && removedItem?.name) {
      clearSelectionsUsingSauce(removedItem.name);
      refreshCatalogSauceReferences();
    }

    saveCatalog();
    await deleteAdminItemFromSupabase(type, id);
    renderCatalog();
    renderAdminList();
    showToast("Elemento eliminado");
  }
});

document.addEventListener("change", (event) => {
  if (!event.target.closest("[data-presentation-select], [data-sauce-select], [data-salt-option]")) return;

  syncCardQuantity(event.target.closest("[data-order-item]"));
});

clearButton.addEventListener("click", clearQuantities);

copyButton.addEventListener("click", async () => {
  try {
    await copyToClipboard(buildMessage());
    await saveOrderToSupabase("copy");
    showToast("Mensaje copiado");
  } catch {
    showToast("No se pudo copiar");
  }
});

orderLink.addEventListener("click", () => {
  saveOrderToSupabase(WHATSAPP_NUMBER ? "whatsapp" : "instagram");
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

document.querySelector("[data-product-form]").addEventListener("submit", async (event) => {
  event.preventDefault();

  await saveAdminItem(event.currentTarget, "products", "product", "Producto guardado", "Producto actualizado", "Guardar producto");
});

document.querySelector("[data-sauce-form]").addEventListener("submit", async (event) => {
  event.preventDefault();

  await saveAdminItem(event.currentTarget, "sauces", "sauce", "Salsa guardada", "Salsa actualizada", "Guardar salsa");
});

document.querySelector("[data-combo-form]").addEventListener("submit", async (event) => {
  event.preventDefault();

  await saveAdminItem(event.currentTarget, "combos", "combo", "Combo guardado", "Combo actualizado", "Guardar combo");
});

document.querySelector("[data-offer-form]").addEventListener("submit", async (event) => {
  event.preventDefault();

  const item = readAdminItem(event.currentTarget, "offer");

  if (todayAtEnd(item.end) < todayAtStart(item.start)) {
    showToast("Revisá las fechas");
    return;
  }

  await saveAdminItem(event.currentTarget, "offers", "offer", "Oferta guardada", "Oferta actualizada", "Guardar oferta");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  closeNav();
  closeAdminPanel();
});

/* Inicio */

async function startApp() {
  setHeaderState();
  await loadCatalogFromSupabase();
  renderCatalog();
  observeRevealElements();
}

window.addEventListener("scroll", setHeaderState, { passive: true });

startApp();
