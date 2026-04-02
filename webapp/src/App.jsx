import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"];
const LOW_STOCK_THRESHOLD = 10;

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

const emptyForm = {
  name: "",
  season: "SPRING",
  currentAmount: "0",
  manualAvgCropPeriodDays: "",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [query, setQuery] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("alpha-asc");
  const [error, setError] = useState("");
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchCrops();
    } else {
      setCrops([]);
    }
  }, [session]);

  async function fetchCrops() {
    const { data, error } = await supabase
      .from("crops")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching crops:", error);
      return;
    }

    const mapped = (data || []).map((crop) => ({
      id: crop.id,
      name: crop.name,
      season: crop.season,
      currentAmount: crop.current_amount,
      manualAvgCropPeriodDays: crop.manual_avg_crop_period_days,
    }));

    setCrops(mapped);
  }

  const visibleCrops = useMemo(() => {
    const filtered = crops.filter((crop) => {
      const matchesQuery = crop.name.toLowerCase().includes(query.toLowerCase());
      const matchesSeason =
        seasonFilter === "ALL" || crop.season === seasonFilter;
      return matchesQuery && matchesSeason;
    });

    const seasonOrder = {
      SPRING: 0,
      SUMMER: 1,
      FALL: 2,
      WINTER: 3,
    };

    return [...filtered].sort((a, b) => {
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
          return (
            (a.manualAvgCropPeriodDays ?? Number.MAX_SAFE_INTEGER) -
            (b.manualAvgCropPeriodDays ?? Number.MAX_SAFE_INTEGER)
          );
        case "days-desc":
          return (
            (b.manualAvgCropPeriodDays ?? -1) -
            (a.manualAvgCropPeriodDays ?? -1)
          );
        case "season":
          return seasonOrder[a.season] - seasonOrder[b.season];
        default:
          return 0;
      }
    });
  }, [crops, query, seasonFilter, sortBy]);

  const lowInventoryCount = useMemo(
    () => crops.filter((c) => c.currentAmount < LOW_STOCK_THRESHOLD).length,
    [crops]
  );

  const visibleCountLabel =
    seasonFilter === "ALL"
      ? `Showing ${visibleCrops.length} crop${
          visibleCrops.length === 1 ? "" : "s"
        }`
      : `Showing ${visibleCrops.length} ${seasonFilter.toLowerCase()} crop${
          visibleCrops.length === 1 ? "" : "s"
        }`;

  const user = session?.user;
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const userAvatar =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "";

  const userEmail = user?.email || "";

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

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateCrop(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      user_id: session.user.id,
      name: form.name.trim(),
      season: form.season,
      current_amount: Number(form.currentAmount),
      manual_avg_crop_period_days:
        form.manualAvgCropPeriodDays === ""
          ? null
          : Number(form.manualAvgCropPeriodDays),
    };

    if (editingId) {
      const { error } = await supabase
        .from("crops")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Error updating crop:", error);
        setError("Could not update crop.");
        return;
      }
    } else {
      const { error } = await supabase.from("crops").insert(payload);

      if (error) {
        console.error("Error inserting crop:", error);
        setError("Could not add crop.");
        return;
      }
    }

    await fetchCrops();
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

  async function handleDelete(id) {
    const crop = crops.find((item) => item.id === id);
    const confirmed = window.confirm(`Delete ${crop?.name ?? "this crop"}?`);
    if (!confirmed) return;

    const { error } = await supabase.from("crops").delete().eq("id", id);

    if (error) {
      console.error("Error deleting crop:", error);
      setError("Could not delete crop.");
      return;
    }

    await fetchCrops();

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

  async function clearAll() {
    const confirmed = window.confirm("Delete all your saved crops?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("crops")
      .delete()
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error clearing crops:", error);
      setError("Could not clear crops.");
      return;
    }

    await fetchCrops();
    resetForm();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <div className="app-shell">
        <section className="panel">
          <p>Loading...</p>
        </section>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Project Evergreen</p>
          <h1>Seed Inventory</h1>
          <p className="subtext">
            Manage your seed inventory with ease.
          </p>
        </div>

        <div className="hero-actions">
          <div className="user-chip">
            {userAvatar ? (
              <img className="user-avatar" src={userAvatar} alt={userName} />
            ) : (
              <div className="user-avatar fallback-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="user-details">
              <strong>{userName}</strong>
              <span>{userEmail}</span>
            </div>
          </div>

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

          <button className="ghost-btn" onClick={handleSignOut}>
            Sign Out
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
              onChange={(e) =>
                updateForm("manualAvgCropPeriodDays", e.target.value)
              }
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