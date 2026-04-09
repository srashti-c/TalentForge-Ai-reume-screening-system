import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("role"); // role | login | register
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const selectRole = (role) => {
    setSelectedRole(role);
    setMode("login");
    setError(""); setSuccess("");
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(""); setSuccess("");
    setForm({ username: "", password: "", name: "", confirmPassword: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return setError("Please fill in all fields.");
    setLoading(true); setError("");
    const result = await login(form.username, form.password);
    if (result.success) {
      if (result.role !== selectedRole) {
        setError(`This account is registered as a ${result.role}, not a ${selectedRole}. Please select the correct role.`);
        setLoading(false); return;
      }
      navigate(result.role === "recruiter" ? "/upload" : "/candidate");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password || !form.confirmPassword)
      return setError("Please fill in all fields.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");
    setLoading(true); setError(""); setSuccess("");
    const result = await register(form.username, form.password, form.name, selectedRole);
    if (result.success) {
      setSuccess("Account created! You can now sign in.");
      setMode("login");
      setForm(f => ({ ...f, confirmPassword: "", name: "" }));
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
        <div className="grid-lines"/>
      </div>

      <div className="login-box">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="logo-text">TalentForge</span>
        </div>

        {/* Step 1: Role Selection */}
        {mode === "role" && (
          <>
            <h1 className="login-title">Welcome to TalentForge</h1>
            <p className="login-sub">Choose your role to get started</p>
            <div className="role-cards">
              <div className="role-card" onClick={() => selectRole("recruiter")}>
                <div className="role-emoji">👔</div>
                <div>
                  <div className="role-name">Recruiter</div>
                  <div className="role-desc">Screen resumes, rank candidates, view hiring dashboard</div>
                </div>
                <div className="role-arrow">→</div>
              </div>
              <div className="role-card" onClick={() => selectRole("candidate")}>
                <div className="role-emoji">👨‍💻</div>
                <div>
                  <div className="role-name">Candidate</div>
                  <div className="role-desc">Check your resume score and get career suggestions</div>
                </div>
                <div className="role-arrow">→</div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Login or Register */}
        {(mode === "login" || mode === "register") && (
          <>
            <div className="back-role" onClick={() => { setMode("role"); setSelectedRole(null); setError(""); }}>
              ← Back
            </div>

            <div className="selected-role-badge">
              {selectedRole === "recruiter" ? "👔 Recruiter" : "👨‍💻 Candidate"}
            </div>

            {/* Toggle tabs */}
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
                Sign In
              </button>
              <button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => switchMode("register")}>
                Create Account
              </button>
            </div>

            {success && <div className="success-box">✅ {success}</div>}
            {error && <div className="error-box">⚠️ {error}</div>}

            {/* Login Form */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="field">
                  <label>Username</label>
                  <input type="text" placeholder="Enter your username" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} autoFocus />
                </div>
                <div className="field">
                  <label>Password</label>
                  <div className="pass-wrap">
                    <input type={showPass ? "text" : "password"} placeholder="Enter your password"
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <><span className="spinner"/> Signing in...</> : "Sign In →"}
                </button>
                <p className="switch-hint">
                  Don't have an account?{" "}
                  <span className="switch-link" onClick={() => switchMode("register")}>Create one</span>
                </p>
              </form>
            )}

            {/* Register Form */}
            {mode === "register" && (
              <form onSubmit={handleRegister} className="auth-form">
                <div className="field">
                  <label>Full Name</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
                </div>
                <div className="field">
                  <label>Username</label>
                  <input type="text" placeholder="Choose a username" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Password</label>
                  <div className="pass-wrap">
                    <input type={showPass ? "text" : "password"} placeholder="Min. 6 characters"
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                    <button type="button" className="toggle-pass" onClick={() => setShowPass(s => !s)}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Confirm Password</label>
                  <input type="password" placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <><span className="spinner"/> Creating account...</> : "Create Account →"}
                </button>
                <p className="switch-hint">
                  Already have an account?{" "}
                  <span className="switch-link" onClick={() => switchMode("login")}>Sign in</span>
                </p>
              </form>
            )}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-page { min-height: 100vh; background: #080c14; display: flex; align-items: center; justify-content: center; font-family: 'DM Sans', sans-serif; padding: 2rem; position: relative; }
        .login-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); }
        .orb1 { width: 500px; height: 500px; background: rgba(99,102,241,0.12); top: -100px; right: -100px; }
        .orb2 { width: 400px; height: 400px; background: rgba(16,185,129,0.07); bottom: -50px; left: -100px; }
        .orb3 { width: 300px; height: 300px; background: rgba(6,182,212,0.06); top: 50%; left: 40%; }
        .grid-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px); background-size: 60px 60px; }

        .login-box { position: relative; z-index: 1; background: rgba(15,23,42,0.9); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 460px; backdrop-filter: blur(20px); box-shadow: 0 30px 80px rgba(0,0,0,0.5); }

        .login-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
        .logo-icon { width: 38px; height: 38px; background: linear-gradient(135deg,#6366f1,#4f46e5); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(99,102,241,0.4); }
        .logo-text { font-size: 1.2rem; font-weight: 800; color: #f1f5f9; }

        .login-title { font-size: 1.7rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.4rem; letter-spacing: -0.02em; }
        .login-sub { color: #64748b; font-size: 0.9rem; margin-bottom: 1.75rem; }

        .role-cards { display: flex; flex-direction: column; gap: 1rem; }
        .role-card { display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.25rem 1.5rem; cursor: pointer; transition: all 0.25s; }
        .role-card:hover { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.06); transform: translateY(-2px); }
        .role-emoji { font-size: 1.8rem; flex-shrink: 0; }
        .role-name { font-weight: 700; color: #e2e8f0; font-size: 1rem; margin-bottom: 3px; }
        .role-desc { font-size: 0.78rem; color: #64748b; }
        .role-arrow { margin-left: auto; color: #6366f1; font-size: 1.2rem; font-weight: 700; flex-shrink: 0; }

        .back-role { color: #6366f1; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-bottom: 1.25rem; display: inline-block; }
        .back-role:hover { color: #a5b4fc; }

        .selected-role-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; padding: 6px 14px; border-radius: 100px; font-size: 0.82rem; font-weight: 600; margin-bottom: 1.5rem; }

        .auth-tabs { display: flex; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 4px; margin-bottom: 1.5rem; gap: 4px; }
        .auth-tab { flex: 1; background: transparent; border: none; color: #64748b; padding: 8px; border-radius: 8px; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .auth-tab.active { background: rgba(99,102,241,0.15); color: #a5b4fc; }

        .auth-form { display: flex; flex-direction: column; gap: 1rem; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label { font-size: 0.76rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
        .field input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.72rem 1rem; color: #e2e8f0; font-family: inherit; font-size: 0.92rem; transition: border-color 0.2s; width: 100%; }
        .field input:focus { outline: none; border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.04); }
        .field input::placeholder { color: #334155; }

        .pass-wrap { position: relative; }
        .pass-wrap input { padding-right: 3rem; width: 100%; }
        .toggle-pass { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; }

        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; padding: 0.7rem 1rem; border-radius: 10px; font-size: 0.84rem; }
        .success-box { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #6ee7b7; padding: 0.7rem 1rem; border-radius: 10px; font-size: 0.84rem; }

        .submit-btn { background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; border: none; padding: 0.9rem; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 0 30px rgba(99,102,241,0.2); margin-top: 4px; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 50px rgba(99,102,241,0.4); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .switch-hint { text-align: center; font-size: 0.82rem; color: #475569; }
        .switch-link { color: #6366f1; cursor: pointer; font-weight: 600; }
        .switch-link:hover { color: #a5b4fc; }

        .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}