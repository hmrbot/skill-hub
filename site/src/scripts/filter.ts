/**
 * Client-side catalog filter. No framework — reads data-* attributes off the
 * server-rendered cards and toggles [hidden].
 */

type SortKey = "name" | "category";

function run() {
  const root = document.getElementById("catalog");
  if (!root) return;

  const cards = Array.from(root.querySelectorAll<HTMLElement>(".card"));
  const grid = root.querySelector<HTMLElement>("[data-grid]");
  const countEl = document.querySelector<HTMLElement>("[data-count]");
  const emptyEl = root.querySelector<HTMLElement>("[data-empty]");
  const searchEl = document.querySelector<HTMLInputElement>("[data-search-input]");
  const sortEl = document.querySelector<HTMLSelectElement>("[data-sort]");
  const clearEl = document.querySelector<HTMLButtonElement>("[data-clear]");

  const checks = () => Array.from(document.querySelectorAll<HTMLInputElement>("[data-filter]"));

  function activeSet(group: string): Set<string> {
    return new Set(
      checks()
        .filter((c) => c.dataset.filter === group && c.checked)
        .map((c) => c.value),
    );
  }

  function apply() {
    const cats = activeSet("category");
    const sources = activeSet("source");
    const tags = activeSet("tag");
    const q = (searchEl?.value ?? "").trim().toLowerCase();

    let shown = 0;
    for (const card of cards) {
      const okCat = cats.size === 0 || cats.has(card.dataset.category ?? "");
      const okSrc = sources.size === 0 || sources.has(card.dataset.source ?? "");
      const cardTags = (card.dataset.tags ?? "").split(" ").filter(Boolean);
      const okTag = tags.size === 0 || cardTags.some((t) => tags.has(t));
      const okQ = q === "" || (card.dataset.search ?? "").includes(q);
      const visible = okCat && okSrc && okTag && okQ;
      card.hidden = !visible;
      if (visible) shown++;
    }

    if (countEl) countEl.textContent = String(shown);
    if (emptyEl) emptyEl.hidden = shown !== 0;
  }

  function sortCards(key: SortKey) {
    if (!grid) return;
    const sorted = [...cards].sort((a, b) => {
      if (key === "category") {
        const ca = a.dataset.category ?? "";
        const cb = b.dataset.category ?? "";
        if (ca !== cb) return ca.localeCompare(cb);
      }
      return (a.dataset.name ?? "").localeCompare(b.dataset.name ?? "");
    });
    for (const c of sorted) grid.appendChild(c);
  }

  document.addEventListener("input", (e) => {
    const t = e.target as HTMLElement;
    if (t.matches("[data-filter], [data-search-input]")) apply();
  });
  sortEl?.addEventListener("change", () => sortCards(sortEl.value as SortKey));
  clearEl?.addEventListener("click", () => {
    checks().forEach((c) => (c.checked = false));
    if (searchEl) searchEl.value = "";
    apply();
  });

  apply();
}

run();
