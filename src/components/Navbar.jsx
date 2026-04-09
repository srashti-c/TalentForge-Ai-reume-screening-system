import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const navLinks = [
    { path: "/",          label: "🏠 Home" },
    { path: "/upload",    label: "📄 Screen Resumes" },
    { path: "/results",   label: "🏆 Leaderboard" },
    { path: "/dashboard", label: "📊 Workspace" },
  ];

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <nav className="navbar animate-fade-in-up">
      <div className="navbar-inner">
        <div className="nav-brand" onClick={() => navigate("/upload")}>
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="brand-name">TalentForge</span>
        </div>

        <div className="nav-links">
          {navLinks.map(link => (
            <button key={link.path} className={`nav-link ${pathname === link.path ? "active" : ""}`}
              onClick={() => navigate(link.path)}>
              {link.label}
            </button>
          ))}
        </div>

        <div className="nav-right">
          {user && (
            <span className="nav-user">👔 {user.name}</span>
          )}
          <button className="nav-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(8,12,20,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.06); font-family: 'DM Sans', sans-serif; }
        .navbar-inner { max-width: 1400px; margin: 0 auto; padding: 0 2rem; height: 60px; display: flex; align-items: center; gap: 2rem; }
        .nav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .brand-icon { width: 34px; height: 34px; background: linear-gradient(135deg,#6366f1,#4f46e5); border-radius: 9px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(99,102,241,0.4); }
        .brand-name { font-weight: 800; font-size: 1.1rem; color: #f1f5f9; letter-spacing: -0.02em; }
        .nav-links { display: flex; gap: 8px; margin-left: auto; }
        .nav-link { position: relative; background: none; border: none; color: #64748b; padding: 8px 16px; border-radius: 10px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-family: inherit; overflow: hidden; }
        .nav-link::before { content: ""; position: absolute; inset: 0; background: rgba(99,102,241,0.1); transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index: -1; border-radius: 10px; }
        .nav-link:hover { color: #e2e8f0; }
        .nav-link:hover::before { transform: translateY(0); }
        .nav-link.active { color: #f1f5f9; background: rgba(99,102,241,0.15); box-shadow: inset 0 0 0 1px rgba(99,102,241,0.3); }
        .nav-right { display: flex; align-items: center; gap: 1rem; }
        .nav-user { font-size: 0.85rem; color: #94a3b8; white-space: nowrap; font-weight: 500; }
        .nav-logout { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; padding: 6px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .nav-logout:hover { background: rgba(239,68,68,0.2); box-shadow: 0 0 15px rgba(239,68,68,0.2); transform: translateY(-1px); }
        @media(max-width:600px) { .nav-links { display: none; } }
      `}</style>
    </nav>
  );
}