import gardenBg from "./assets/garden.png";
import { supabase } from "./supabaseClient";

export default function Auth() {
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <div
      className="auth-page"
      style={{ backgroundImage: `url(${gardenBg})` }}
    >
      <div className="auth-card">
        <p className="auth-eyebrow">Project Evergreen</p>
        <h1 className="auth-title">Seed Inventory</h1>
        <p className="auth-subtext">
          Organize your crops, track quantities, monitor seasonal inventory,
          and keep everything in one clean place.
        </p>

        <div className="auth-feature-list">
          <div className="auth-feature">
            <span>Season-based tracking</span>
          </div>
          <div className="auth-feature">
            <span>Low-stock alerts</span>
          </div>
          <div className="auth-feature">
            <span>Search, filter, and sort crops</span>
          </div>
          <div className="auth-feature">
            <span>Personal account access</span>
          </div>
        </div>

        <button className="primary-btn auth-btn" onClick={signInWithGoogle}>
          Continue with Google
        </button>

        <p className="auth-footnote">
          Sign in to access your personal seed inventory dashboard.
        </p>
      </div>
    </div>
  );
}