import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:8000";

export default function CandidatePortal() {
  const { user, logout } = useAuth();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState("");

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") { setFile(f); setError(""); }
    else setError("Only PDF files are supported.");
  };

  const handleSubmit = async () => {
    if (!file) return setError("Please upload your resume first.");
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("job_title", "General Application");
      fd.append("job_description", "");
      fd.append("required_skills", "");
      fd.append("experience_years", "0");
      const res = await fetch(`${API}/batch-screen`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Could not process resume.");
      const data = await res.json();
      const r = data.results[0]?.data;
      if (!r) throw new Error("Failed to parse resume.");
      setResult(r);
      const sRes = await fetch(`${API}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name:r.name, skills:r.skills, experience_years:r.experience_years, education:r.education, overall_score:r.overall_score, matched_skills:r.matched_skills, missing_skills:r.missing_skills, job_title:"" })
      });
      setSuggestions(await sRes.json());
      const cRes = await fetch(`${API}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: r.skills, experience_years: r.experience_years })
      });
      setCourses(await cRes.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const scorePct = result ? Math.round(result.overall_score * 100) : 0;
  const scoreColor = scorePct >= 80 ? "#10b981" : scorePct >= 65 ? "#6366f1" : scorePct >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel = scorePct >= 80 ? "Excellent!" : scorePct >= 65 ? "Good Profile" : scorePct >= 50 ? "Needs Work" : "Needs Improvement";
  const r = 54, circ = 2 * Math.PI * r;

  return (
    <div className="cp-page">
      <div className="cp-bg"><div className="o1"/><div className="o2"/></div>

      {/* Header */}
      <header className="cp-nav">
        <div className="cp-logo">
          <div className="cp-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>TalentForge</span>
        </div>
        <div className="cp-nav-right">
          <span className="cp-welcome">👋 {user?.name}</span>
          <span className="cp-role-tag">Candidate</span>
          <button className="cp-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="cp-container">
        {!result ? (
          /* Upload Section */
          <div className="cp-upload-wrap">
            <div className="cp-hero-text">
              <h1>Check Your Resume Score</h1>
              <p>Get instant AI-powered feedback on your resume — score, skill gaps, and a personalised career growth plan.</p>
            </div>
            <div className="cp-upload-card">
              <div className={`cp-drop ${dragging?"dragging":""}`}
                onDrop={handleDrop}
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onClick={()=>fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e=>setFile(e.target.files[0])}/>
                <div className="cp-drop-icon">📄</div>
                <p className="cp-drop-text">Drop your resume here</p>
                <p className="cp-drop-sub">PDF only — click to browse</p>
              </div>
              {file && (
                <div className="cp-file-row">
                  <span>📎 {file.name}</span>
                  <span style={{color:"#475569",fontSize:"0.78rem"}}>{(file.size/1024).toFixed(0)} KB</span>
                  <button onClick={()=>setFile(null)} style={{background:"none",border:"none",color:"#475569",cursor:"pointer"}}>✕</button>
                </div>
              )}
              {error && <div className="cp-error">⚠️ {error}</div>}
              <button className="cp-analyze-btn" onClick={handleSubmit} disabled={loading||!file}>
                {loading?<><span className="spinner"/>Analyzing...</>:"🚀 Analyze My Resume"}
              </button>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="cp-results">
            <button className="cp-back" onClick={()=>{setResult(null);setSuggestions(null);setCourses(null);setFile(null);}}>← Analyze Another Resume</button>

            {/* Big Score */}
            <div className="cp-score-hero">
              <div className="cp-ring-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
                  <circle cx="70" cy="70" r={r} fill="none" stroke={scoreColor} strokeWidth="12"
                    strokeDasharray={`${(scorePct/100)*circ} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 70 70)" style={{transition:"stroke-dasharray 1.5s ease"}}/>
                </svg>
                <div className="cp-ring-inner">
                  <span className="cp-score-num" style={{color:scoreColor}}>{scorePct}%</span>
                  <span className="cp-score-lbl" style={{color:scoreColor}}>{scoreLabel}</span>
                </div>
              </div>
              <div className="cp-score-info">
                <h2>{result.name}</h2>
                <div className="cp-score-meta">
                  <span>📧 {result.email}</span>
                  <span>📞 {result.phone}</span>
                  <span>⏱ {result.experience_years} yrs experience</span>
                </div>
                <p className="cp-summary">{result.summary}</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="cp-section-title">📊 Score Breakdown</div>
            <div className="cp-breakdown">
              {[
                {label:"Skill Match",    val:result.skill_match_score,    icon:"🎯", tip:"How many required skills you have"},
                {label:"Experience",     val:result.experience_score,     icon:"⏱", tip:"Years of experience vs required"},
                {label:"Content Match",  val:result.text_similarity_score,icon:"📝", tip:"How well your resume matches the job"},
              ].map(b => {
                const pct = Math.round(b.val*100);
                const c = pct>=70?"#10b981":pct>=50?"#6366f1":"#f59e0b";
                return (
                  <div key={b.label} className="cp-bd-card">
                    <div className="cp-bd-icon">{b.icon}</div>
                    <div className="cp-bd-label">{b.label}</div>
                    <div className="cp-bd-bar"><div className="cp-bd-fill" style={{width:`${pct}%`,background:c}}/></div>
                    <div className="cp-bd-pct" style={{color:c}}>{pct}%</div>
                    <div className="cp-bd-tip">{b.tip}</div>
                  </div>
                );
              })}
            </div>

            {/* Missing Skills */}
            {result.missing_skills.length > 0 && (
              <>
                <div className="cp-section-title">❌ Skills You Are Missing</div>
                <div className="cp-missing-card">
                  <p className="cp-missing-desc">Add these skills to significantly improve your resume score:</p>
                  <div className="cp-pills">
                    {result.missing_skills.map(s => (
                      <span key={s} className="cp-pill red">{s}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Current Skills */}
            <div className="cp-section-title">✅ Skills on Your Resume ({result.skills.length})</div>
            <div className="cp-skills-card">
              <div className="cp-pills">
                {result.skills.map(s => <span key={s} className="cp-pill blue">{s}</span>)}
              </div>
            </div>

            {/* Suggestions */}
            {suggestions && (
              <>
                <div className="cp-section-title">✨ Your Personalised Growth Plan</div>
                <div className="cp-sugg-grid">

                  <div className="cp-sugg-card">
                    <div className="cp-sugg-title">🚀 Skills to Learn Next</div>
                    <p className="cp-sugg-desc">These skills will boost your profile significantly</p>
                    <div className="cp-pills">
                      {suggestions.next_skills.map(s => <span key={s} className="cp-pill cyan">{s}</span>)}
                    </div>
                  </div>

                  <div className="cp-sugg-card">
                    <div className="cp-sugg-title">💼 Job Roles You Qualify For</div>
                    <p className="cp-sugg-desc">Based on your current skills and experience</p>
                    <div className="cp-pills">
                      {suggestions.job_roles.map(r => <span key={r} className="cp-pill green">{r}</span>)}
                    </div>
                  </div>

                  <div className="cp-sugg-card">
                    <div className="cp-sugg-title">🏢 Companies to Target</div>
                    <p className="cp-sugg-desc">Companies that match your current profile</p>
                    <div className="cp-pills">
                      {suggestions.target_companies.map(c => <span key={c} className="cp-pill amber">{c}</span>)}
                    </div>
                  </div>

                  <div className="cp-sugg-card">
                    <div className="cp-sugg-title">📜 Certifications to Get</div>
                    <p className="cp-sugg-desc">These will make your profile stand out</p>
                    <div className="cp-cert-list">
                      {suggestions.certifications.map(c => (
                        <a key={c.name} href={c.url} target="_blank" rel="noreferrer" className="cp-cert-item">
                          <span className="cp-cert-name">{c.name}</span>
                          <span className="cp-cert-prov">{c.provider} ↗</span>
                        </a>
                      ))}
                    </div>
                  </div>

                </div>
              </>
            )}

            {/* Courses Section */}
            {courses && (
              <>
                <div className="cp-section-title">🎓 Recommended Courses For You</div>
                {Object.entries(courses.grouped).map(([platform, platformCourses]) => {
                  const icons = { YouTube: "▶️", Coursera: "🎓", Udemy: "🟣", freeCodeCamp: "🔥" };
                  const colors = { YouTube: "#ef4444", Coursera: "#06b6d4", Udemy: "#a855f7", freeCodeCamp: "#f59e0b" };
                  return (
                    <div key={platform} className="cp-platform-section">
                      <div className="cp-platform-header" style={{ color: colors[platform] || "#94a3b8" }}>
                        <span>{icons[platform] || "📚"}</span>
                        <span>{platform}</span>
                        <span className="cp-platform-badge">{platformCourses.length} courses</span>
                      </div>
                      <div className="cp-courses-grid">
                        {platformCourses.map(c => (
                          <a key={c.title} href={c.url} target="_blank" rel="noreferrer" className="cp-course-card">
                            <div className="cp-course-top">
                              <span className="cp-course-platform" style={{ color: colors[platform] || "#94a3b8" }}>{platform}</span>
                              <span className={"cp-course-price " + (c.price === "Free" ? "free" : "paid")}>{c.price === "Free" ? "🆓 Free" : "💳 " + c.price}</span>
                            </div>
                            <div className="cp-course-title">{c.title}</div>
                            <div className="cp-course-meta">
                              <span>👤 {c.channel}</span>
                              <span>⏱ {c.duration}</span>
                              <span className={"cp-course-level " + c.level.toLowerCase()}>{c.level}</span>
                            </div>
                            <div className="cp-course-cta">View Course →</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .cp-page{min-height:100vh;background:#080c14;color:#e2e8f0;font-family:'DM Sans',sans-serif;}
        .cp-bg{position:fixed;inset:0;pointer-events:none;z-index:0;}
        .o1{position:absolute;width:500px;height:500px;background:rgba(99,102,241,0.1);top:-100px;right:-100px;border-radius:50%;filter:blur(120px);}
        .o2{position:absolute;width:400px;height:400px;background:rgba(16,185,129,0.07);bottom:0;left:-100px;border-radius:50%;filter:blur(120px);}

        .cp-nav{position:sticky;top:0;z-index:100;background:rgba(8,12,20,0.85);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06);padding:0 2rem;height:60px;display:flex;align-items:center;justify-content:space-between;}
        .cp-logo{display:flex;align-items:center;gap:10px;}
        .cp-logo-icon{width:32px;height:32px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:8px;display:flex;align-items:center;justify-content:center;}
        .cp-logo span{font-weight:800;font-size:1.05rem;color:#f1f5f9;}
        .cp-nav-right{display:flex;align-items:center;gap:0.9rem;}
        .cp-welcome{font-size:0.85rem;color:#64748b;}
        .cp-role-tag{background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);color:#6ee7b7;padding:3px 10px;border-radius:100px;font-size:0.72rem;font-weight:600;}
        .cp-logout{background:transparent;border:1px solid rgba(255,255,255,0.1);color:#64748b;padding:5px 12px;border-radius:8px;font-size:0.8rem;cursor:pointer;font-family:inherit;transition:all 0.2s;}
        .cp-logout:hover{border-color:rgba(239,68,68,0.3);color:#fca5a5;}

        .cp-container{max-width:900px;margin:0 auto;padding:3rem 2rem;position:relative;z-index:1;}

        .cp-upload-wrap{display:flex;flex-direction:column;align-items:center;gap:2rem;}
        .cp-hero-text{text-align:center;}
        .cp-hero-text h1{font-size:2rem;font-weight:800;color:#f1f5f9;letter-spacing:-0.02em;margin-bottom:0.5rem;}
        .cp-hero-text p{color:#64748b;max-width:480px;margin:0 auto;line-height:1.7;}
        .cp-upload-card{background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:2rem;width:100%;max-width:520px;display:flex;flex-direction:column;gap:1.1rem;}
        .cp-drop{border:2px dashed rgba(99,102,241,0.25);border-radius:14px;padding:3rem 1.5rem;text-align:center;cursor:pointer;transition:all 0.25s;}
        .cp-drop:hover,.cp-drop.dragging{border-color:rgba(99,102,241,0.6);background:rgba(99,102,241,0.04);}
        .cp-drop-icon{font-size:2.5rem;margin-bottom:0.75rem;}
        .cp-drop-text{font-weight:600;color:#e2e8f0;margin-bottom:0.3rem;}
        .cp-drop-sub{color:#64748b;font-size:0.85rem;}
        .cp-file-row{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0.65rem 1rem;font-size:0.85rem;color:#cbd5e1;}
        .cp-file-row span:first-child{flex:1;}
        .cp-error{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#fca5a5;padding:0.7rem 1rem;border-radius:10px;font-size:0.85rem;}
        .cp-analyze-btn{background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;padding:0.9rem;border-radius:12px;font-weight:700;font-size:1rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.2s;box-shadow:0 0 30px rgba(99,102,241,0.2);}
        .cp-analyze-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 0 50px rgba(99,102,241,0.4);}
        .cp-analyze-btn:disabled{opacity:0.5;cursor:not-allowed;}

        .cp-results{display:flex;flex-direction:column;gap:1.5rem;}
        .cp-back{background:transparent;border:1px solid rgba(255,255,255,0.1);color:#64748b;padding:7px 16px;border-radius:8px;font-size:0.85rem;cursor:pointer;font-family:inherit;transition:all 0.2s;width:fit-content;}
        .cp-back:hover{border-color:rgba(99,102,241,0.3);color:#a5b4fc;}

        .cp-score-hero{display:flex;align-items:center;gap:2rem;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:2rem;}
        @media(max-width:600px){.cp-score-hero{flex-direction:column;text-align:center;}}
        .cp-ring-wrap{position:relative;width:140px;height:140px;flex-shrink:0;}
        .cp-ring-inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
        .cp-score-num{font-size:2rem;font-weight:900;line-height:1;}
        .cp-score-lbl{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-top:3px;}
        .cp-score-info h2{font-size:1.4rem;font-weight:800;color:#f1f5f9;margin-bottom:0.5rem;}
        .cp-score-meta{display:flex;gap:1.25rem;flex-wrap:wrap;font-size:0.78rem;color:#475569;margin-bottom:0.75rem;}
        .cp-summary{color:#64748b;font-size:0.85rem;line-height:1.65;}

        .cp-section-title{font-size:1rem;font-weight:700;color:#e2e8f0;margin-top:0.5rem;}

        .cp-breakdown{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;}
        @media(max-width:600px){.cp-breakdown{grid-template-columns:1fr;}}
        .cp-bd-card{background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:1.25rem;display:flex;flex-direction:column;gap:7px;}
        .cp-bd-icon{font-size:1.3rem;}
        .cp-bd-label{font-size:0.8rem;font-weight:700;color:#94a3b8;}
        .cp-bd-bar{height:6px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;}
        .cp-bd-fill{height:100%;border-radius:999px;transition:width 1s ease;}
        .cp-bd-pct{font-size:1.25rem;font-weight:800;}
        .cp-bd-tip{font-size:0.72rem;color:#475569;line-height:1.5;}

        .cp-missing-card{background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2);border-radius:14px;padding:1.25rem;}
        .cp-missing-desc{color:#94a3b8;font-size:0.85rem;margin-bottom:0.9rem;}
        .cp-skills-card{background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:1.25rem;}

        .cp-pills{display:flex;flex-wrap:wrap;gap:6px;}
        .cp-pill{padding:4px 12px;border-radius:100px;font-size:0.76rem;font-weight:600;}
        .cp-pill.red{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#fca5a5;}
        .cp-pill.blue{background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);color:#a5b4fc;}
        .cp-pill.cyan{background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.25);color:#67e8f9;}
        .cp-pill.green{background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);color:#6ee7b7;}
        .cp-pill.amber{background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);color:#fcd34d;}

        .cp-sugg-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
        @media(max-width:600px){.cp-sugg-grid{grid-template-columns:1fr;}}
        .cp-sugg-card{background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:1.25rem;display:flex;flex-direction:column;gap:0.6rem;}
        .cp-sugg-title{font-size:0.85rem;font-weight:700;color:#e2e8f0;}
        .cp-sugg-desc{font-size:0.75rem;color:#475569;}
        .cp-cert-list{display:flex;flex-direction:column;gap:6px;}
        .cp-cert-item{display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.55rem 0.9rem;text-decoration:none;transition:all 0.2s;}
        .cp-cert-item:hover{border-color:rgba(99,102,241,0.3);}
        .cp-cert-name{font-size:0.8rem;color:#e2e8f0;font-weight:500;}
        .cp-cert-prov{font-size:0.72rem;color:#6366f1;font-weight:600;white-space:nowrap;margin-left:0.5rem;}

        .cp-platform-section{display:flex;flex-direction:column;gap:0.9rem;margin-bottom:0.5rem;}
        .cp-platform-header{display:flex;align-items:center;gap:8px;font-size:0.85rem;font-weight:700;margin-bottom:0.25rem;}
        .cp-platform-badge{background:rgba(255,255,255,0.06);color:#64748b;padding:2px 8px;border-radius:100px;font-size:0.7rem;font-weight:600;margin-left:4px;}
        .cp-courses-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0.85rem;}
        .cp-course-card{background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:1.1rem;text-decoration:none;display:flex;flex-direction:column;gap:8px;transition:all 0.2s;cursor:pointer;}
        .cp-course-card:hover{border-color:rgba(99,102,241,0.35);transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.3);}
        .cp-course-top{display:flex;justify-content:space-between;align-items:center;}
        .cp-course-platform{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;}
        .cp-course-price{font-size:0.72rem;font-weight:600;padding:2px 8px;border-radius:100px;}
        .cp-course-price.free{background:rgba(16,185,129,0.1);color:#6ee7b7;border:1px solid rgba(16,185,129,0.2);}
        .cp-course-price.paid{background:rgba(168,85,247,0.1);color:#d8b4fe;border:1px solid rgba(168,85,247,0.2);}
        .cp-course-title{font-size:0.88rem;font-weight:700;color:#e2e8f0;line-height:1.4;}
        .cp-course-meta{display:flex;gap:0.75rem;flex-wrap:wrap;font-size:0.72rem;color:#475569;}
        .cp-course-level{padding:1px 7px;border-radius:5px;font-weight:600;}
        .cp-course-level.beginner{background:rgba(16,185,129,0.1);color:#6ee7b7;}
        .cp-course-level.intermediate{background:rgba(245,158,11,0.1);color:#fcd34d;}
        .cp-course-level.advanced{background:rgba(239,68,68,0.1);color:#fca5a5;}
        .cp-course-cta{font-size:0.78rem;color:#6366f1;font-weight:600;margin-top:auto;}
        .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>
    </div>
  );
}