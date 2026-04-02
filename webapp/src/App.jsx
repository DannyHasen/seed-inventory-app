import React, { useEffect, useMemo, useState } from "react";

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
const STORAGE_KEY = "evergreen-crops-v1";
const LOW_STOCK_THRESHOLD = 10;

function loadCrops() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(Boolean).map((crop, index) => ({
      id: crop.id ?? `${Date.now()}-${index}`,
      name: String(crop.name ?? "").trim(),
      season: SEASONS.includes(crop.season) ? crop.season : "SPRING",
      currentAmount:
        Number.isInteger(crop.currentAmount) && crop.currentAmount >= 0
          ? crop.currentAmount
          : 0,
      manualAvgCropPeriodDays:
        crop.manualAvgCropPeriodDays === null ||
        crop.manualAvgCropPeriodDays === undefined
          ? null
          : Number.isInteger(crop.manualAvgCropPeriodDays) &&
            crop.manualAvgCropPeriodDays >= 0
          ? crop.manualAvgCropPeriodDays
          : null,
    }));
  } catch {
    return [];
  }
}

function saveCrops(crops) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
}

function validateCrop(form) {
  const name = form.name.trim();
  if (!name) return "Name is required.";
  if (!SEASONS.includes(form.season)) return "Season is invalid.";
  if (form.currentAmount === "") return "Amount is required.";
  if (!/^\d+$/.test(form.currentAmount)) {
    return "Amount must be a whole number 0 or greater.";
  }
  if (
    form.manualAvgCropPeriodDays !== "" &&
    !/^\d+$/.test(form.manualAvgCropPeriodDays)
  ) {
    return "Avg Days must be a whole number 0 or greater.";
  }
  return null;
}

function normalizeCrop(form, existingId = null) {
  return {
    id: existingId ?? crypto.randomUUID(),
    name: form.name.trim(),
    season: form.season,
    currentAmount: Number(form.currentAmount),
    manualAvgCropPeriodDays:
      form.manualAvgCropPeriodDays === "" ? null : Number(form.manualAvgCropPeriodDays),
  };
}

const emptyForm = {
  name: "",
  season: "SPRING",
  currentAmount: "0",
  manualAvgCropPeriodDays: "",
};

export default function App() {
  const [crops, setCrops] = useState(() => loadCrops());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("alpha-asc");
  const [error, setError] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    saveCrops(crops);
  }, [crops]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const visibleCrops = useMemo(() => {
    const filtered = crops.filter((crop) => {
      const matchesQuery = crop.name.toLowerCase().includes(query.toLowerCase());
      const matchesSeason = seasonFilter === "ALL" || crop.season === seasonFilter;
      return matchesQuery && matchesSeason;
    });

    const seasonOrder = {
      SPRING: 0,
      SUMMER: 1,
      FALL: 2,
      WINTER: 3,
    };

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "alpha-asc":
          return a.name.localeCompare(b.name);
        case "alpha-desc":
          return b.name.localeCompare(a.name);
        case "amount-asc":
          return a.currentAmount - b.currentAmount;
        case "amount-desc":
          return b.currentAmount - a.currentAmount;
        case "days-asc":
          return (a.manualAvgCropPeriodDays ?? Number.MAX_SAFE_INTEGER) -
            (b.manualAvgCropPeriodDays ?? Number.MAX_SAFE_INTEGER);
        case "days-desc":
          return (b.manualAvgCropPeriodDays ?? -1) -
            (a.manualAvgCropPeriodDays ?? -1);
        case "season":
          return seasonOrder[a.season] - seasonOrder[b.season];
        default:
          return 0;
      }
    });

    return sorted;
  }, [crops, query, seasonFilter, sortBy]);

  const lowInventoryCount = useMemo(
    () => crops.filter((c) => c.currentAmount < LOW_STOCK_THRESHOLD).length,
    [crops]
  );

  const visibleCountLabel =
    seasonFilter === "ALL"
      ? `Showing ${visibleCrops.length} crop${visibleCrops.length === 1 ? "" : "s"}`
      : `Showing ${visibleCrops.length} ${seasonFilter.toLowerCase()} crop${visibleCrops.length === 1 ? "" : "s"}`;

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm((prev) => ({
      name: "",
      season: prev.season,
      currentAmount: "0",
      manualAvgCropPeriodDays: "",
    }));
    setEditingId(null);
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateCrop(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalized = normalizeCrop(form, editingId);

    if (editingId) {
      setCrops((prev) =>
        prev.map((crop) => (crop.id === editingId ? normalized : crop))
      );
    } else {
      setCrops((prev) => [normalized, ...prev]);
    }

    resetForm();
  }

  function handleEdit(crop) {
    setEditingId(crop.id);
    setForm({
      name: crop.name,
      season: crop.season,
      currentAmount: String(crop.currentAmount),
      manualAvgCropPeriodDays:
        crop.manualAvgCropPeriodDays === null
          ? ""
          : String(crop.manualAvgCropPeriodDays),
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    const crop = crops.find((item) => item.id === id);
    const confirmed = window.confirm(`Delete ${crop?.name ?? "this crop"}?`);
    if (!confirmed) return;

    setCrops((prev) => prev.filter((crop) => crop.id !== id));

    if (editingId === id) {
      resetForm();
    }
  }

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function clearAll() {
    const confirmed = window.confirm("Delete all saved crops on this device?");
    if (!confirmed) return;
    setCrops([]);
    resetForm();
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Project Evergreen</p>
          <h1>Seed Inventory</h1>
          <p className="subtext">Manage your seed inventory with ease.</p>
        </div>

        <div className="hero-actions">
          {installPrompt && (
            <button className="primary-btn" onClick={handleInstall}>
              Install App
            </button>
          )}
          <button
            className="secondary-btn"
            onClick={clearAll}
            disabled={crops.length === 0}
          >
            Clear All
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Crops</span>
          <strong>{crops.length}</strong>
        </div>
        <div className="stat-card">
          <span>Low Stock</span>
          <strong>{lowInventoryCount}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>{editingId ? "Edit Crop" : "Add Crop"}</h2>
          {editingId && (
            <button className="ghost-btn" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        <form className="crop-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              placeholder="Tomato"
            />
          </label>

          <label>
            <span>Season</span>
            <select
              value={form.season}
              onChange={(e) => updateForm("season", e.target.value)}
            >
              {SEASONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Amount</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.currentAmount}
              onChange={(e) => updateForm("currentAmount", e.target.value)}
              placeholder="0"
            />
          </label>

          <label>
            <span>Avg Days</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.manualAvgCropPeriodDays}
              onChange={(e) => updateForm("manualAvgCropPeriodDays", e.target.value)}
              placeholder="Optional"
            />
          </label>

          <button className="primary-btn" type="submit">
            {editingId ? "Save Changes" : "Add Crop"}
          </button>
        </form>

        {error && <p className="error-banner">{error}</p>}
      </section>

      <section className="panel">
        <div className="panel-header responsive-stack">
          <h2>Inventory</h2>
          <div className="filters-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search crops"
            />

            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
            >
              <option value="ALL">All Seasons</option>
              {SEASONS.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="alpha-asc">Alphabetical (A-Z)</option>
              <option value="alpha-desc">Alphabetical (Z-A)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="days-asc">Avg Days (Low to High)</option>
              <option value="days-desc">Avg Days (High to Low)</option>
              <option value="season">Season</option>
            </select>
          </div>
        </div>

        <p className="results-count">{visibleCountLabel}</p>

        {visibleCrops.length === 0 ? (
          <div className="empty-state">
            <p>No crops found.</p>
            <span>Add one above to get started.</span>
          </div>
        ) : (
          <div className="crop-list">
            {visibleCrops.map((crop) => (
              <article className="crop-card" key={crop.id}>
                <div className="crop-card-top">
                  <div>
                    <h3>{crop.name}</h3>
                    <p>{crop.season}</p>
                  </div>
                  {crop.currentAmount < LOW_STOCK_THRESHOLD && (
                    <span className="low-badge">Low Stock</span>
                  )}
                </div>

                <div className="crop-meta">
                  <div>
                    <span>Amount</span>
                    <strong>{crop.currentAmount}</strong>
                  </div>
                  <div>
                    <span>Avg Days</span>
                    <strong>{crop.manualAvgCropPeriodDays ?? "N/A"}</strong>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="secondary-btn"
                    type="button"
                    onClick={() => handleEdit(crop)}
                  >
                    Edit
                  </button>
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => handleDelete(crop.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}