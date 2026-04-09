import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SCORE_CONFIG = {
  high:   { min: 80, color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", label: "Strong Match",  dot: "#10b981" },
  medium: { min: 65, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", label: "Good Match",    dot: "#f59e0b" },
  low:    { min: 0,  color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  label: "Weak Match",    dot: "#ef4444" },
};

function getConfig(score) {
  const pct = Math.round(score * 100);
  if (pct >= 80) return { ...SCORE_CONFIG.high, pct };
  if (pct >= 65) return { ...SCORE_CONFIG.medium, pct };
  return { ...SCORE_CONFIG.low, pct };
}

function ScoreRing({ score }) {
  const { pct, color } = getConfig(score);
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 35 35)" style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"0.9rem", color }}>{pct}%</div>
    </div>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [jobInfo, setJobInfo] = useState({});
  const [shortlisted, setShortlisted] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    const r = sessionStorage.getItem("screening_results");
    const j = sessionStorage.getItem("job_info");
    if (r) setResults(JSON.parse(r));
    if (j) setJobInfo(JSON.parse(j));
  }, []);

  const toggleShortlist = (idx) => {
    setShortlisted(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const exportShortlisted = () => {
    const rows = results
      .filter((_, i) => shortlisted.has(i))
      .map((r, i) => {
        const d = r.data;
        return `${i+1},${d.name},${d.email},${d.phone},${Math.round(d.overall_score*100)}%,${d.recommendation}`;
      });
    const csv = ["Rank,Name,Email,Phone,Score,Recommendation", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `shortlisted_${jobInfo.job_title || "candidates"}.csv`;
    a.click();
  };

  const successResults = results.filter(r => r.status === "success");
  const filteredResults = results.filter(r => {
    if (!r.data) return filter === "all";
    const pct = Math.round(r.data.overall_score * 100);
    if (filter === "all") return true;
    if (filter === "strong") return pct >= 80;
    if (filter === "good") return pct >= 65 && pct < 80;
    if (filter === "weak") return pct < 65;
    if (filter === "shortlisted") return shortlisted.has(results.indexOf(r));
    return true;
  });

  const strongCount = successResults.filter(r => Math.round(r.data.overall_score*100) >= 80).length;
  const goodCount = successResults.filter(r => { const p = Math.round(r.data.overall_score*100); return p >= 65 && p < 80; }).length;
  const weakCount = successResults.filter(r => Math.round(r.data.overall_score*100) < 65).length;
  const avgScore = successResults.length ? Math.round(successResults.reduce((a,r) => a + r.data.overall_score, 0) / successResults.length * 100) : 0;

  if (!results.length) return (
    <div className="rp-page" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📭</div>
        <h2 style={{ color:"#f1f5f9", marginBottom:"0.5rem" }}>No Results Yet</h2>
        <p style={{ color:"#64748b", marginBottom:"2rem" }}>Upload resumes to see screening results.</p>
        <button className="rp-btn-primary" onClick={() => navigate("/upload")}>Start Screening →</button>
      </div>
      <style>{rpStyles}</style>
    </div>
  );

  return (
    <div className="rp-page">
      <div className="rp-container">

        {/* Header */}
        <div className="rp-header animate-fade-in-up">
          <div>
            <h1>🏆 Scoring Board</h1>
            {jobInfo.job_title ? <p className="rp-job-label">📋 Rank for {jobInfo.job_title} — Step 2: Review & Contact</p> : <p className="rp-job-label">Step 2: Review & Contact</p>}
          </div>
          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
            {shortlisted.size > 0 && (
              <button className="rp-btn-export" onClick={exportShortlisted}>
                ⬇️ Export Shortlisted ({shortlisted.size})
              </button>
            )}
            <button className="rp-btn-outline" onClick={() => navigate("/upload")}>← Screen More</button>
          </div>
        </div>

        {/* Score Legend */}
        <div className="rp-legend">
          <div className="legend-item"><span className="legend-dot green"/>Strong Match (80%+)</div>
          <div className="legend-item"><span className="legend-dot amber"/>Good Match (65–79%)</div>
          <div className="legend-item"><span className="legend-dot red"/>Weak Match (&lt;65%)</div>
        </div>

        {/* Stats */}
        <div className="rp-stats animate-fade-in-up delay-100">
          <div className="rp-stat"><span className="rp-stat-num">{results.length}</span><span className="rp-stat-lbl">Total Screened</span></div>
          <div className="rp-stat green"><span className="rp-stat-num">{strongCount}</span><span className="rp-stat-lbl">🟢 Strong</span></div>
          <div className="rp-stat amber"><span className="rp-stat-num">{goodCount}</span><span className="rp-stat-lbl">🟡 Good</span></div>
          <div className="rp-stat red"><span className="rp-stat-num">{weakCount}</span><span className="rp-stat-lbl">🔴 Weak</span></div>
          <div className="rp-stat blue"><span className="rp-stat-num">{avgScore}%</span><span className="rp-stat-lbl">Avg Score</span></div>
          <div className="rp-stat purple"><span className="rp-stat-num">{shortlisted.size}</span><span className="rp-stat-lbl">⭐ Shortlisted</span></div>
        </div>

        {/* Filters */}
        <div className="rp-filters">
          {[
            { key:"all", label:`All (${results.length})` },
            { key:"strong", label:`🟢 Strong (${strongCount})` },
            { key:"good",   label:`🟡 Good (${goodCount})` },
            { key:"weak",   label:`🔴 Weak (${weakCount})` },
            { key:"shortlisted", label:`⭐ Shortlisted (${shortlisted.size})` },
          ].map(f => (
            <button key={f.key} className={`rp-filter ${filter===f.key?"active":""}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Candidate Cards */}
        <div className="rp-cards">
          {filteredResults.map((result, i) => {
            const globalIdx = results.indexOf(result);
            const d = result.data;
            if (!d) return (
              <div key={i} className="rp-card error-card">
                <span style={{ color:"#fca5a5" }}>❌ {result.filename} — {result.error}</span>
              </div>
            );
            const cfg = getConfig(d.overall_score);
            const isShortlisted = shortlisted.has(globalIdx);
            const isExpanded = expandedIdx === globalIdx;
            const delayClass = `delay-${Math.min((globalIdx + 2) * 100, 500)}`;

            return (
              <div key={i} className={`rp-card animate-fade-in-up ${delayClass}`} style={{ borderColor: cfg.border, background: isShortlisted ? `${cfg.bg}` : "rgba(15,23,42,0.55)", backdropFilter: "blur(24px)" }}>
                {/* Color bar on left */}
                <div className="rp-card-bar" style={{ background: cfg.color }} />

                <div className="rp-card-main">
                  {/* Top row */}
                  <div className="rp-card-top">
                    <div className="rp-rank" style={{ color: cfg.color }}>#{globalIdx+1}</div>
                    <ScoreRing score={d.overall_score} />
                    <div className="rp-candidate-info">
                      <div className="rp-name">{d.name}</div>
                      <div className="rp-meta">
                        <span>📧 {d.email}</span>
                        <span>📞 {d.phone}</span>
                        <span>⏱ {d.experience_years} yrs exp</span>
                      </div>
                      <div className="rp-match-badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        <span className="match-dot" style={{ background: cfg.color }} />
                        {cfg.label}
                      </div>
                    </div>

                    {/* Skills preview */}
                    <div className="rp-skills-preview">
                      {d.matched_skills.slice(0,4).map(s => (
                        <span key={s} className="rp-skill matched">{s}</span>
                      ))}
                      {d.missing_skills.slice(0,2).map(s => (
                        <span key={s} className="rp-skill missing">{s}</span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="rp-actions">
                      <button
                        className={`rp-shortlist-btn ${isShortlisted ? "shortlisted" : ""}`}
                        onClick={() => toggleShortlist(globalIdx)}
                        title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                      >
                        {isShortlisted ? "⭐ Shortlisted" : "☆ Shortlist"}
                      </button>
                      <a href={`mailto:${d.email}?subject=Interview Invitation — ${jobInfo.job_title || "Position"}&body=Dear ${d.name},%0D%0A%0D%0AWe were impressed by your profile during our initial screening and would like to invite you for an interview.%0D%0A%0D%0APlease let us know your availability in the coming days so we can schedule a time to speak.%0D%0A%0D%0AWe look forward to hearing from you!%0D%0A%0D%0ABest regards`}
                        className="rp-email-btn">
                        ✉️ Send Interview Invite
                      </a>
                      <button className="rp-expand-btn" onClick={() => setExpandedIdx(isExpanded ? null : globalIdx)}>
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="rp-expanded animate-fade-in-scale">
                      <div className="rp-expanded-grid">
                        <div className="rp-detail-section">
                          <div className="rp-detail-title">Score Breakdown</div>
                          {[
                            { label:"Skill Match",    value: d.skill_match_score },
                            { label:"Experience",     value: d.experience_score },
                            { label:"Text Similarity",value: d.text_similarity_score },
                          ].map(b => {
                            const pct = Math.round(b.value*100);
                            const c = pct>=70?"#10b981":pct>=50?"#6366f1":"#f59e0b";
                            return (
                              <div key={b.label} className="rp-mini-bar">
                                <span>{b.label}</span>
                                <div className="rp-bar-track"><div className="rp-bar-fill" style={{width:`${pct}%`,background:c}}/></div>
                                <span style={{color:c,fontWeight:700}}>{pct}%</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="rp-detail-section">
                          <div className="rp-detail-title">All Skills ({d.skills.length})</div>
                          <div className="rp-all-skills">
                            {d.skills.map(s => (
                              <span key={s} className={`rp-skill ${d.matched_skills.includes(s)?"matched":"neutral"}`}>{s}</span>
                            ))}
                          </div>
                        </div>

                        <div className="rp-detail-section">
                          <div className="rp-detail-title">Education</div>
                          {d.education.length ? d.education.map((e,i) => (
                            <div key={i} className="rp-edu">🎓 {e}</div>
                          )) : <div className="rp-edu" style={{color:"#475569"}}>Not detected</div>}
                        </div>

                        <div className="rp-detail-section">
                          <div className="rp-detail-title">Missing Skills</div>
                          {d.missing_skills.length ? (
                            <div className="rp-all-skills">
                              {d.missing_skills.map(s => <span key={s} className="rp-skill missing">{s}</span>)}
                            </div>
                          ) : <div style={{color:"#10b981",fontSize:"0.85rem"}}>✅ All required skills matched!</div>}
                        </div>
                      </div>

                      <div className="rp-summary-box">
                        <div className="rp-detail-title">Summary</div>
                        <p>{d.summary}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {shortlisted.size > 0 && (
          <div className="rp-shortlist-bar">
            <span>⭐ {shortlisted.size} candidate{shortlisted.size>1?"s":""} shortlisted</span>
            <button className="rp-btn-export" onClick={exportShortlisted}>⬇️ Export as CSV</button>
          </div>
        )}

      </div>
      <style>{rpStyles}</style>
    </div>
  );
}

const rpStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .rp-page { min-height:100vh; background:#080c14; color:#e2e8f0; font-family:'DM Sans',sans-serif; padding:2rem; padding-top:5rem; }
  .rp-container { max-width:1100px; margin:0 auto; }

  .rp-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem; }
  .rp-header h1 { font-size:1.9rem; font-weight:800; color:#f1f5f9; letter-spacing:-0.02em; }
  .rp-job-label { color:#64748b; font-size:0.88rem; margin-top:4px; }

  .rp-legend { display:flex; gap:1.5rem; margin-bottom:1.25rem; flex-wrap:wrap; }
  .legend-item { display:flex; align-items:center; gap:6px; font-size:0.8rem; color:#64748b; }
  .legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .legend-dot.green { background:#10b981; box-shadow:0 0 6px #10b981; }
  .legend-dot.amber { background:#f59e0b; box-shadow:0 0 6px #f59e0b; }
  .legend-dot.red { background:#ef4444; box-shadow:0 0 6px #ef4444; }

  .rp-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:0.75rem; margin-bottom:1.25rem; }
  @media(max-width:700px){ .rp-stats { grid-template-columns:repeat(3,1fr); } }
  .rp-stat { background:rgba(15,23,42,0.8); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:0.9rem; display:flex; flex-direction:column; gap:3px; }
  .rp-stat-num { font-size:1.5rem; font-weight:800; color:#f1f5f9; }
  .rp-stat.green .rp-stat-num { color:#10b981; }
  .rp-stat.amber .rp-stat-num { color:#f59e0b; }
  .rp-stat.red .rp-stat-num { color:#ef4444; }
  .rp-stat.blue .rp-stat-num { color:#06b6d4; }
  .rp-stat.purple .rp-stat-num { color:#a5b4fc; }
  .rp-stat-lbl { font-size:0.68rem; color:#475569; text-transform:uppercase; letter-spacing:0.07em; }

  .rp-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:1.5rem; }
  .rp-filter { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:#64748b; padding:6px 14px; border-radius:8px; font-size:0.82rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  .rp-filter:hover, .rp-filter.active { background:rgba(99,102,241,0.1); border-color:rgba(99,102,241,0.4); color:#a5b4fc; transform: translateY(-1px); }

  .rp-cards { display:flex; flex-direction:column; gap:0.85rem; }
  .rp-card { border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; display:flex; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .rp-card:hover { box-shadow:0 12px 40px rgba(0,0,0,0.35); transform: translateY(-3px); border-color: rgba(255,255,255,0.15); }
  .rp-card.error-card { padding:1rem 1.5rem; align-items:center; }
  .rp-card-bar { width:5px; flex-shrink:0; }
  .rp-card-main { flex:1; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:0; }
  .rp-card-top { display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
  .rp-rank { font-size:0.78rem; font-weight:800; min-width:28px; }
  .rp-candidate-info { flex:1; min-width:0; }
  .rp-name { font-size:1rem; font-weight:700; color:#f1f5f9; margin-bottom:4px; }
  .rp-meta { display:flex; gap:0.9rem; flex-wrap:wrap; font-size:0.74rem; color:#475569; margin-bottom:6px; }
  .rp-match-badge { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:100px; font-size:0.75rem; font-weight:600; }
  .match-dot { width:7px; height:7px; border-radius:50%; }

  .rp-skills-preview { display:flex; flex-wrap:wrap; gap:5px; max-width:220px; }
  .rp-skill { padding:3px 9px; border-radius:6px; font-size:0.7rem; font-weight:500; }
  .rp-skill.matched { background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); color:#6ee7b7; }
  .rp-skill.missing { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#fca5a5; }
  .rp-skill.neutral { background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); color:#a5b4fc; }

  .rp-actions { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; flex-wrap:wrap; }
  .rp-shortlist-btn { background:transparent; border:1px solid rgba(255,255,255,0.1); color:#64748b; padding:6px 12px; border-radius:8px; font-size:0.78rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
  .rp-shortlist-btn:hover { border-color:rgba(245,158,11,0.4); color:#fcd34d; }
  .rp-shortlist-btn.shortlisted { background:rgba(245,158,11,0.1); border-color:rgba(245,158,11,0.35); color:#fcd34d; }
  .rp-email-btn { background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; padding:8px 16px; border-radius:8px; font-size:0.85rem; font-weight:700; cursor:pointer; text-decoration:none; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1); white-space:nowrap; box-shadow:0 4px 15px rgba(16,185,129,0.3); }
  .rp-email-btn:hover { background:linear-gradient(135deg,#059669,#047857); transform:translateY(-2px); box-shadow:0 8px 25px rgba(16,185,129,0.5); }
  .rp-expand-btn { background:none; border:none; color:#475569; cursor:pointer; font-size:0.8rem; padding:4px 8px; }

  .rp-expanded { border-top:1px solid rgba(255,255,255,0.06); margin-top:1rem; padding-top:1rem; }
  .rp-expanded-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1rem; }
  @media(max-width:600px){ .rp-expanded-grid { grid-template-columns:1fr; } }
  .rp-detail-section { display:flex; flex-direction:column; gap:8px; }
  .rp-detail-title { font-size:0.7rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.1em; }
  .rp-mini-bar { display:grid; grid-template-columns:100px 1fr 40px; align-items:center; gap:8px; font-size:0.75rem; color:#64748b; }
  .rp-bar-track { height:5px; background:rgba(255,255,255,0.05); border-radius:999px; overflow:hidden; }
  .rp-bar-fill { height:100%; border-radius:999px; transition:width 1s ease; }
  .rp-all-skills { display:flex; flex-wrap:wrap; gap:5px; }
  .rp-edu { font-size:0.82rem; color:#94a3b8; background:rgba(255,255,255,0.03); padding:5px 10px; border-radius:7px; }
  .rp-summary-box { background:rgba(99,102,241,0.04); border:1px solid rgba(99,102,241,0.15); border-radius:10px; padding:0.9rem 1.1rem; }
  .rp-summary-box p { color:#94a3b8; font-size:0.85rem; line-height:1.7; margin-top:5px; }

  .rp-shortlist-bar { position:fixed; bottom:2rem; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.95); border:1px solid rgba(245,158,11,0.3); border-radius:100px; padding:0.75rem 1.5rem; display:flex; align-items:center; gap:1.25rem; backdrop-filter:blur(20px); box-shadow:0 10px 40px rgba(0,0,0,0.4); z-index:50; }
  .rp-shortlist-bar span { font-size:0.88rem; color:#fcd34d; font-weight:600; }

  .rp-btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:white; border:none; padding:0.8rem 1.75rem; border-radius:10px; font-weight:700; font-size:0.95rem; cursor:pointer; font-family:inherit; }
  .rp-btn-outline { background:transparent; border:1px solid rgba(99,102,241,0.3); color:#a5b4fc; padding:0.65rem 1.25rem; border-radius:10px; font-weight:600; font-size:0.88rem; cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
  .rp-btn-outline:hover { background:rgba(99,102,241,0.08); }
  .rp-btn-export { background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); color:#fcd34d; padding:0.65rem 1.25rem; border-radius:10px; font-weight:600; font-size:0.85rem; cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
  .rp-btn-export:hover { background:rgba(245,158,11,0.2); }
`;