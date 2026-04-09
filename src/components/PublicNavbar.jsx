import { useNavigate } from "react-router-dom";

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-brand" onClick={() => navigate("/")}>
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="brand-name">TalentForge</span>
        </div>

        <div className="nav-links">
          <button className="nav-link" onClick={() => navigate("/")}>🏠 Home</button>
          <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>✨ Features</button>
          <button className="nav-link" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>⚙️ How it Works</button>
        </div>

        <div className="nav-actions">
          <button className="btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate("/login")}>Get Started →</button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(8,12,20,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); font-family: 'DM Sans', sans-serif; }
        .navbar-inner { max-width: 1400px; margin: 0 auto; padding: 0 2rem; height: 60px; display: flex; align-items: center; gap: 2rem; }
        .nav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .brand-icon { width: 34px; height: 34px; background: linear-gradient(135deg,#6366f1,#4f46e5); border-radius: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(99,102,241,0.4); }
        .brand-name { font-weight: 800; font-size: 1.1rem; color: #f1f5f9; letter-spacing: -0.02em; }
        .nav-links { display: flex; gap: 4px; margin-left: auto; }
        .nav-link { background: none; border: none; color: #64748b; padding: 6px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .nav-link:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
        .nav-actions { display: flex; align-items: center; gap: 0.75rem; }
        .btn-ghost { background: transparent; border: 1px solid rgba(148,163,184,0.2); color: #94a3b8; padding: 7px 16px; border-radius: 8px; font-weight: 500; font-size: 0.88rem; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn-ghost:hover { border-color: rgba(99,102,241,0.4); color: #a5b4fc; }
        .btn-primary { background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; border: none; padding: 7px 16px; border-radius: 8px; font-weight: 600; font-size: 0.88rem; cursor: pointer; font-family: inherit; transition: all 0.2s; white-space: nowrap; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(99,102,241,0.4); }
        @media(max-width:600px) { .nav-links { display: none; } }
      `}</style>
    </nav>
  );
}
