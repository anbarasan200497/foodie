/* Menu page: VEG / NON-VEG tabs, search, filters */
(() => {
  const app = document.getElementById("menu-app");
  const grid = document.getElementById("food-grid");
  const empty = document.getElementById("empty-state");
  const count = document.getElementById("result-count");
  const search = document.getElementById("search");
  const price = document.getElementById("price-filter");
  const strip = document.getElementById("cat-strip");
  const sort = document.getElementById("sort-filter");

  const state = { type: app.dataset.startType || "veg", bestseller: false, rating: false, category: "" };
  let timer = null, requestNo = 0;

  function cardHtml(f) {
    const off = f.original_price > f.discounted_price
      ? Math.round((1 - f.discounted_price / f.original_price) * 100) : 0;
    return `
    <article class="card">
      <div class="card-info">
        <div class="card-top"><span class="diet ${f.food_type}" title="${f.food_type === "veg" ? "Vegetarian" : "Non-vegetarian"}"></span>
          ${f.is_bestseller ? '<span class="best">★ Bestseller</span>' : ""}</div>
        <h3>${esc(f.name)}</h3>
        <div class="price-row">
          <span class="now">${rupee(f.discounted_price)}</span>
          ${off ? `<span class="was">${rupee(f.original_price)}</span><span class="off">${off}% off</span>` : ""}
        </div>
        <span class="rate">★ ${Number(f.rating).toFixed(1)}</span>
        <p class="desc">${esc(f.description)}</p>
      </div>
      <div class="card-media">
        <img src="${esc(f.image_url)}" alt="${esc(f.name)}" loading="lazy" onerror="imgFallback(this)">
        <button class="add-btn" type="button" data-add="${f.id}" aria-label="Add ${esc(f.name)}">ADD</button>
      </div>
    </article>`;
  }

  async function load() {
    const mine = ++requestNo;
    const p = new URLSearchParams({ type: state.type });
    if (search.value.trim()) p.set("q", search.value.trim());
    if (state.bestseller) p.set("bestseller", "1");
    if (state.rating) p.set("min_rating", "4");
    if (price.value) p.set("max_price", price.value);
    if (state.category) p.set("category", state.category);
    if (sort.value) p.set("sort", sort.value);

    grid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
    try {
      const data = await api("/api/menu?" + p.toString());
      if (mine !== requestNo) return;       // an older request finished late: ignore it
      grid.innerHTML = data.items.map(cardHtml).join("");
      empty.hidden = data.count > 0;
      count.textContent = data.count ? `${data.count} dish${data.count === 1 ? "" : "es"}` : "";
    } catch (err) {
      grid.innerHTML = "";
      empty.hidden = true;
      toast(err.message, "error");
    }
  }

  async function loadCategories() {
    try {
      const data = await api("/api/categories?type=" + state.type);
      if (!data.items.some((c) => String(c.id) === state.category)) state.category = "";
      strip.innerHTML = data.items.map((c) => `
        <button class="cat-item" type="button" data-cat="${c.id}" aria-pressed="${String(c.id) === state.category}">
          <span class="cat-img"><img src="${esc(c.image_url)}" alt="" loading="lazy" onerror="imgFallback(this)"></span>
          <span class="cat-name">${esc(c.name)}</span>
        </button>`).join("");
      document.querySelector(".mind").hidden = data.items.length === 0;
    } catch (err) {
      document.querySelector(".mind").hidden = true;
    }
  }

  function syncUi() {
    document.querySelectorAll(".type-tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.type === state.type)));
    document.querySelector('[data-filter="bestseller"]').setAttribute("aria-pressed", String(state.bestseller));
    document.querySelector('[data-filter="rating"]').setAttribute("aria-pressed", String(state.rating));
  }

  document.querySelectorAll(".type-tab").forEach((tab) => tab.addEventListener("click", () => {
    state.type = tab.dataset.type; state.category = ""; syncUi(); loadCategories(); load();
    history.replaceState(null, "", state.type === "nonveg" ? "/?type=nonveg" : "/");
  }));
  document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
    state[chip.dataset.filter] = !state[chip.dataset.filter]; syncUi(); load();
  }));
  [price, sort].forEach((el) => el.addEventListener("change", load));
  search.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(load, 300); });
  document.getElementById("clear-filters").addEventListener("click", () => {
    search.value = ""; price.value = ""; sort.value = "";
    state.bestseller = false; state.rating = false; state.category = ""; syncUi(); loadCategories(); load();
  });
  strip.addEventListener("click", (e) => {
    const item = e.target.closest("[data-cat]");
    if (!item) return;
    state.category = state.category === item.dataset.cat ? "" : item.dataset.cat;   // click again = remove filter
    strip.querySelectorAll(".cat-item").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === state.category)));
    load();
  });
  document.getElementById("cat-prev").addEventListener("click", () => strip.scrollBy({ left: -300, behavior: "smooth" }));
  document.getElementById("cat-next").addEventListener("click", () => strip.scrollBy({ left: 300, behavior: "smooth" }));
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (btn) AddonModal.open(Number(btn.dataset.add));
  });

  syncUi();
  loadCategories();
  load();
})();