import { useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: "⚡", title: "Instant Parsing", desc: "Extracts name, email, skills, experience from any PDF in seconds" },
    { icon: "🎯", title: "Smart Matching", desc: "TF-IDF & spaCy NLP matches candidates to job requirements precisely" },
    { icon: "📊", title: "Score & Rank", desc: "Multi-factor scoring: skills, experience, and semantic similarity" },
    { icon: "🔍", title: "Skills Extraction", desc: "Identifies 80+ skills across programming, cloud, ML, databases & more" },
    { icon: "📁", title: "Batch Screening", desc: "Upload multiple resumes and get a ranked leaderboard instantly" },
    { icon: "📈", title: "Actionable Insights", desc: "Clear hire/reject recommendations with detailed gap analysis" },
  ];

  const stats = [
    { value: "80+", label: "Skills Tracked" },
    { value: "6", label: "Scoring Dimensions" },
    { value: "100%", label: "Local & Private" },
    { value: "<2s", label: "Per Resume" },
  ];

  return (
    <div className="landing">
      <PublicNavbar />
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="orb orb3" />
          <div className="grid-lines" />
        </div>
        <div className="hero-content">
          <div className="badge">
            <span className="badge-dot" />
            Powered by spaCy & scikit-learn
          </div>
          <h1 className="hero-title">
            Screen Resumes
            <span className="gradient-text"> 10x Faster</span>
            <br />with AI Precision
          </h1>
          <p className="hero-sub">
            Upload PDFs. Define your job requirements. Get instant ranked candidates
            with detailed skill analysis — all running locally, zero data leaks.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("/login")}>
              <span>Start Screening</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="btn-ghost" onClick={() => navigate("/results")}>
              View Sample Results
            </button>
          </div>
          <div className="stats-row">
            {stats.map((s) => (
              <div key={s.label} className="stat-item">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="resume-card">
            <div className="rc-header">
              <div className="rc-avatar">AK</div>
              <div>
                <div className="rc-name">Arjun Kumar</div>
                <div className="rc-title">Senior Python Developer</div>
              </div>
              <div className="rc-score">92%</div>
            </div>
            <div className="rc-skills">
              {["Python", "FastAPI", "AWS", "Docker", "PostgreSQL"].map((s) => (
                <span key={s} className="skill-tag">{s}</span>
              ))}
            </div>
            <div className="rc-bars">
              <div className="rc-bar-row">
                <span>Skills Match</span>
                <div className="rc-bar"><div className="rc-fill" style={{ width: "90%" }} /></div>
                <span>90%</span>
              </div>
              <div className="rc-bar-row">
                <span>Experience</span>
                <div className="rc-bar"><div className="rc-fill" style={{ width: "85%" }} /></div>
                <span>85%</span>
              </div>
              <div className="rc-bar-row">
                <span>Similarity</span>
                <div className="rc-bar"><div className="rc-fill" style={{ width: "78%" }} /></div>
                <span>78%</span>
              </div>
            </div>
            <div className="rc-recommendation">✅ Strong Match — Proceed to Interview</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="section-label">CAPABILITIES</div>
        <h2 className="section-title">Everything you need to hire smarter</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="how-section">
        <div className="section-label">WORKFLOW</div>
        <h2 className="section-title">Three steps to better hiring</h2>
        <div className="steps">
          {[
            { n: "01", title: "Define the Role", desc: "Enter the job title, description, required skills, and experience level." },
            { n: "02", title: "Upload Resumes", desc: "Drop single or multiple PDF resumes. No format restrictions." },
            { n: "03", title: "Get Ranked Results", desc: "Instantly see scored, ranked candidates with actionable recommendations." },
          ].map((step) => (
            <div key={step.n} className="step">
              <div className="step-number">{step.n}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to screen smarter?</h2>
        <p>No account needed. No data leaves your machine.</p>
        <button className="btn-primary large" onClick={() => navigate("/login")}>
          Get Started Free
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      <style>{`
        .landing { background: #080c14; color: #e2e8f0; min-height: 100vh; font-family: 'DM Sans', sans-serif; overflow-x: hidden; }

        /* Hero */
        .hero { position: relative; min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 4rem; padding: 7rem 6rem 4rem; max-width: 1400px; margin: 0 auto; }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; padding: 6rem 2rem 3rem; } .hero-visual { display: none; } }

        .hero-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); }
        .orb1 { width: 500px; height: 500px; background: rgba(99,102,241,0.12); top: -100px; right: -100px; }
        .orb2 { width: 400px; height: 400px; background: rgba(16,185,129,0.08); bottom: 100px; left: -50px; }
        .orb3 { width: 300px; height: 300px; background: rgba(245,158,11,0.06); top: 50%; left: 50%; }
        .grid-lines {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .hero-content { position: relative; z-index: 1; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; padding: 6px 14px; border-radius: 100px; font-size: 0.78rem; font-weight: 500; letter-spacing: 0.02em; margin-bottom: 1.5rem; }
        .badge-dot { width: 7px; height: 7px; background: #6366f1; border-radius: 50%; box-shadow: 0 0 8px #6366f1; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .hero-title { font-size: clamp(2.4rem, 4vw, 3.6rem); font-weight: 800; line-height: 1.1; color: #f1f5f9; margin-bottom: 1.25rem; letter-spacing: -0.03em; }
        .gradient-text { background: linear-gradient(135deg, #6366f1, #06b6d4, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { color: #94a3b8; font-size: 1.05rem; line-height: 1.75; max-width: 500px; margin-bottom: 2rem; }

        .hero-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 3rem; }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none; padding: 0.8rem 1.75rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 30px rgba(99,102,241,0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 50px rgba(99,102,241,0.5); }
        .btn-primary.large { font-size: 1.05rem; padding: 1rem 2.2rem; }
        .btn-ghost { background: transparent; border: 1px solid rgba(148,163,184,0.2); color: #94a3b8; padding: 0.8rem 1.75rem; border-radius: 10px; font-weight: 500; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: rgba(99,102,241,0.5); color: #a5b4fc; background: rgba(99,102,241,0.05); }

        .stats-row { display: flex; gap: 2.5rem; flex-wrap: wrap; }
        .stat-item { display: flex; flex-direction: column; gap: 2px; }
        .stat-value { font-size: 1.6rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }

        /* Resume Card */
        .hero-visual { position: relative; z-index: 1; }
        .resume-card { background: rgba(15,23,42,0.9); border: 1px solid rgba(99,102,241,0.2); border-radius: 20px; padding: 1.75rem; backdrop-filter: blur(20px); box-shadow: 0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04); animation: float 5s ease-in-out infinite; }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }

        .rc-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
        .rc-avatar { width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #06b6d4); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.9rem; flex-shrink: 0; }
        .rc-name { font-weight: 700; color: #f1f5f9; font-size: 0.95rem; }
        .rc-title { color: #64748b; font-size: 0.78rem; margin-top: 2px; }
        .rc-score { margin-left: auto; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 1.6rem; font-weight: 800; }

        .rc-skills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1.2rem; }
        .skill-tag { background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25); color: #a5b4fc; padding: 3px 10px; border-radius: 6px; font-size: 0.73rem; font-weight: 500; }

        .rc-bars { display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.2rem; }
        .rc-bar-row { display: grid; grid-template-columns: 70px 1fr 35px; align-items: center; gap: 10px; font-size: 0.73rem; color: #64748b; }
        .rc-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
        .rc-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #06b6d4); border-radius: 999px; transition: width 1s ease; }
        .rc-recommendation { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #6ee7b7; padding: 10px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 500; text-align: center; }

        /* Features */
        .features-section, .how-section { position: relative; z-index: 10; padding: 5rem 6rem; max-width: 1400px; margin: 0 auto; }
        @media (max-width: 900px) { .features-section, .how-section { padding: 4rem 2rem; } }
        .section-label { font-size: 0.72rem; letter-spacing: 0.15em; color: #6366f1; font-weight: 600; text-transform: uppercase; margin-bottom: 0.75rem; }
        .section-title { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 800; color: #f1f5f9; margin-bottom: 3rem; letter-spacing: -0.02em; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .feature-card { background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 1.75rem; transition: all 0.3s; }
        .feature-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .feature-icon { font-size: 1.8rem; margin-bottom: 1rem; }
        .feature-card h3 { font-size: 1rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.5rem; }
        .feature-card p { color: #64748b; font-size: 0.88rem; line-height: 1.65; }

        /* Steps */
        .steps { display: flex; flex-direction: column; gap: 1.5rem; }
        .step { display: flex; align-items: flex-start; gap: 2rem; background: rgba(15,23,42,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 2rem; }
        .step-number { font-size: 2.5rem; font-weight: 900; color: rgba(99,102,241,0.2); font-variant-numeric: tabular-nums; flex-shrink: 0; line-height: 1; }
        .step-content h3 { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.4rem; }
        .step-content p { color: #64748b; font-size: 0.9rem; line-height: 1.65; }

        /* CTA */
        .cta-section { position: relative; z-index: 10; text-align: center; padding: 5rem 2rem 6rem; background: radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%); }
        .cta-section h2 { font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 800; color: #f1f5f9; margin-bottom: 0.75rem; letter-spacing: -0.02em; }
        .cta-section p { color: #64748b; margin-bottom: 2.5rem; font-size: 1rem; }
      `}</style>
    </div>
  );
}