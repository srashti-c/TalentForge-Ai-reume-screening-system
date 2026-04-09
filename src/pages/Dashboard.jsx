import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

const REC_COLORS = {
  "Strong Match – Proceed to Interview":   { color: "#10b981", bg: "rgba(16,185,129,0.12)", icon: "🏆" },
  "Good Match – Consider for Interview":   { color: "#6366f1", bg: "rgba(99,102,241,0.12)", icon: "✅" },
  "Partial Match – Review Carefully":      { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "⚡" },
  "Weak Match – Skills Gap Present":       { color: "#f97316", bg: "rgba(249,115,22,0.12)", icon: "⚠️" },
  "Poor Match – Does Not Meet Requirements":{ color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: "❌" },
};

function ScoreBar({ value, color }) {
  return (
    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${Math.round(value * 100)}%`, background: color, borderRadius: 999, transition: "width 1s ease" }} />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        fetch(`${API}/history/stats`),
        fetch(`${API}/history/sessions`),
      ]);
      setStats(await statsRes.json());
      setSessions(await sessionsRes.json());
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetail = async (id) => {
    if (selectedSession === id) { setSelectedSession(null); setSessionDetail(null); return; }
    setSelectedSession(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/history/session/${id}`);
      const data = await res.json();
      // Parse JSON strings from SQLite
      data.candidates = data.candidates.map(c => ({
        ...c,
        skills: safeJSON(c.skills, []),
        matched_skills: safeJSON(c.matched_skills, []),
        missing_skills: safeJSON(c.missing_skills, []),
        education: safeJSON(c.education, []),
      }));
      setSessionDetail(data);
    } catch { setSessionDetail(null); }
    finally { setDetailLoading(false); }
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this session and all its candidates?")) return;
    setDeleting(id);
    await fetch(`${API}/history/session/${id}`, { method: "DELETE" });
    if (selectedSession === id) { setSelectedSession(null); setSessionDetail(null); }
    await fetchData();
    setDeleting(null);
  };

  const safeJSON = (val, fallback) => { try { return JSON.parse(val); } catch { return fallback; } };

  const dist = stats?.score_distribution || {};
  const distTotal = (dist.strong||0) + (dist.good||0) + (dist.partial||0) + (dist.weak||0) || 1;

  if (loading) return (
    <div className="dash-page" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={{ textAlign:"center", color:"#64748b" }}>
        <div className="spinner large" style={{ margin:"0 auto 1rem" }} />
        <p>Loading dashboard...</p>
      </div>
      <style>{baseStyles}</style>
    </div>
  );

  return (
    <div className="dash-page">
      <div className="dash-container">

        {/* Header */}
        <div className="dash-header animate-fade-in-up">
          <div>
            <div className="breadcrumb">
              <span onClick={() => navigate("/")} style={{ cursor:"pointer", color:"#6366f1" }}>Home</span>
              <span style={{ color:"#334155" }}> / </span>
              <span style={{ color:"#64748b" }}>Dashboard</span>
            </div>
            <h1>Screening History</h1>
            <p>All your past screening sessions and candidate data stored in <code>resume_screening.db</code></p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/upload")}>
            + New Screening
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card blue animate-fade-in-up delay-100">
              <div className="stat-icon">📋</div>
              <div className="stat-body">
                <div className="stat-num">{stats.total_sessions}</div>
                <div className="stat-lbl">Total Sessions</div>
              </div>
            </div>
            <div className="stat-card purple animate-fade-in-up delay-200">
              <div className="stat-icon">👤</div>
              <div className="stat-body">
                <div className="stat-num">{stats.total_candidates}</div>
                <div className="stat-lbl">Candidates Screened</div>
              </div>
            </div>
            <div className="stat-card green animate-fade-in-up delay-300">
              <div className="stat-icon">📊</div>
              <div className="stat-body">
                <div className="stat-num">{stats.avg_score}%</div>
                <div className="stat-lbl">Average Score</div>
              </div>
            </div>
            <div className="stat-card amber animate-fade-in-up delay-400">
              <div className="stat-icon">🏆</div>
              <div className="stat-body">
                <div className="stat-num">{dist.strong || 0}</div>
                <div className="stat-lbl">Strong Matches</div>
              </div>
            </div>
          </div>
        )}

        {/* Score Distribution */}
        {stats && stats.total_candidates > 0 && (
          <div className="panel">
            <div className="panel-title">📈 Score Distribution</div>
            <div className="dist-grid">
              {[
                { label: "Strong (80%+)", key: "strong", color: "#10b981" },
                { label: "Good (65–79%)", key: "good",   color: "#6366f1" },
                { label: "Partial (50–64%)", key: "partial", color: "#f59e0b" },
                { label: "Weak (<50%)", key: "weak",   color: "#ef4444" },
              ].map(d => {
                const count = dist[d.key] || 0;
                const pct = Math.round((count / distTotal) * 100);
                return (
                  <div key={d.key} className="dist-row">
                    <span className="dist-label">{d.label}</span>
                    <ScoreBar value={count / distTotal} color={d.color} />
                    <span className="dist-count" style={{ color: d.color }}>{count}</span>
                    <span className="dist-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="panel">
          <div className="panel-title">🗂️ All Screening Sessions</div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>📭</div>
              <p>No sessions yet. Screen some resumes to see history here.</p>
              <button className="btn-primary" onClick={() => navigate("/upload")} style={{ marginTop:"1rem" }}>
                Start Screening →
              </button>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map(s => (
                <div key={s.id}>
                  <div className={`session-row ${selectedSession === s.id ? "active" : ""}`}
                       onClick={() => fetchSessionDetail(s.id)}>
                    <div className="session-left">
                      <div className="session-id">#{s.id}</div>
                      <div>
                        <div className="session-title">{s.job_title || "Untitled Session"}</div>
                        <div className="session-meta">
                          <span>👤 {s.total_candidates} candidate{s.total_candidates !== 1 ? "s" : ""}</span>
                          <span>🕐 {s.created_at}</span>
                          {s.required_skills && <span>🎯 {s.required_skills.split(",").slice(0,3).join(", ")}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="session-right">
                      <button className="delete-btn" onClick={(e) => deleteSession(s.id, e)}
                              disabled={deleting === s.id}>
                        {deleting === s.id ? "..." : "🗑️"}
                      </button>
                      <span className="expand-arrow">{selectedSession === s.id ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Session Detail */}
                  {selectedSession === s.id && (
                    <div className="session-detail animate-fade-in-scale">
                      {detailLoading ? (
                        <div style={{ padding:"1.5rem", color:"#64748b", display:"flex", gap:"10px", alignItems:"center" }}>
                          <span className="spinner" /> Loading candidates...
                        </div>
                      ) : sessionDetail ? (
                        <div>
                          {sessionDetail.session.job_description && (
                            <div className="detail-jd">
                              <span className="detail-label">Job Description:</span>
                              <span className="detail-value">{sessionDetail.session.job_description.slice(0,200)}{sessionDetail.session.job_description.length > 200 ? "..." : ""}</span>
                            </div>
                          )}
                          <div className="candidates-table">
                            <div className="table-header">
                              <span>Candidate</span>
                              <span>Score</span>
                              <span>Experience</span>
                              <span>Recommendation</span>
                              <span>Skills Matched</span>
                            </div>
                            {sessionDetail.candidates.length === 0 ? (
                              <div style={{ padding:"1rem 1.5rem", color:"#475569", fontSize:"0.85rem" }}>No candidates in this session.</div>
                            ) : sessionDetail.candidates.map(c => {
                              const rec = REC_COLORS[c.recommendation] || REC_COLORS["Partial Match – Review Carefully"];
                              const scorePct = Math.round(c.overall_score * 100);
                              const scoreColor = scorePct >= 80 ? "#10b981" : scorePct >= 65 ? "#6366f1" : scorePct >= 50 ? "#f59e0b" : "#ef4444";
                              return (
                                <div key={c.id} className="table-row">
                                  <div className="td-candidate">
                                    <div className="td-avatar">{(c.name || "?")[0]}</div>
                                    <div>
                                      <div className="td-name">{c.name}</div>
                                      <div className="td-email">{c.email}</div>
                                    </div>
                                  </div>
                                  <div className="td-score" style={{ color: scoreColor }}>{scorePct}%</div>
                                  <div className="td-exp">{c.experience_years} yrs</div>
                                  <div>
                                    <span className="rec-tag" style={{ background: rec.bg, color: rec.color }}>
                                      {rec.icon} {c.recommendation?.split("–")[0].trim()}
                                    </span>
                                  </div>
                                  <div className="td-skills">
                                    {c.matched_skills.slice(0,3).map(sk => (
                                      <span key={sk} className="mini-skill">{sk}</span>
                                    ))}
                                    {c.matched_skills.length > 3 && <span className="mini-skill more">+{c.matched_skills.length - 3}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding:"1rem 1.5rem", color:"#ef4444", fontSize:"0.85rem" }}>Failed to load session data.</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DB Info Box */}
        <div className="db-info-box">
          <div className="db-info-icon">🗄️</div>
          <div>
            <div className="db-info-title">Data Storage</div>
            <div className="db-info-text">
              All screening data is stored locally in <code>resume_screening.db</code> inside your <code>backend/</code> folder.
              This is a SQLite database file — you can open it with any SQLite viewer like <strong>DB Browser for SQLite</strong>.
              Tables: <code>screening_sessions</code>, <code>candidates</code>, <code>suggestions</code>.
            </div>
          </div>
        </div>

      </div>

      <style>{baseStyles}</style>
    </div>
  );
}

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .dash-page { min-height: 100vh; background: #080c14; color: #e2e8f0; font-family: 'DM Sans', sans-serif; padding: 2rem; }
  .dash-container { max-width: 1100px; margin: 0 auto; }

  .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-top: 1rem; }
  .breadcrumb { font-size: 0.82rem; margin-bottom: 0.6rem; }
  .dash-header h1 { font-size: 2rem; font-weight: 800; color: #f1f5f9; letter-spacing: -0.02em; }
  .dash-header p { color: #64748b; font-size: 0.88rem; margin-top: 4px; }
  .dash-header code { background: rgba(99,102,241,0.12); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-size: 0.82rem; }

  .btn-primary { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; font-family: inherit; white-space: nowrap; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(99,102,241,0.4); }

  .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
  @media(max-width:700px){ .stats-grid { grid-template-columns: repeat(2,1fr); } }
  .stat-card { background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; }
  .stat-icon { font-size: 1.6rem; }
  .stat-num { font-size: 1.9rem; font-weight: 800; }
  .stat-lbl { font-size: 0.73rem; color: #475569; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 2px; }
  .stat-card.blue .stat-num { color: #06b6d4; }
  .stat-card.purple .stat-num { color: #a5b4fc; }
  .stat-card.green .stat-num { color: #10b981; }
  .stat-card.amber .stat-num { color: #fcd34d; }

  .panel { background: rgba(15,23,42,0.55); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
  .panel-title { font-size: 0.9rem; font-weight: 700; color: #e2e8f0; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem; }

  .dist-grid { display: flex; flex-direction: column; gap: 12px; }
  .dist-row { display: grid; grid-template-columns: 140px 1fr 36px 44px; align-items: center; gap: 12px; font-size: 0.82rem; }
  .dist-label { color: #64748b; }
  .dist-count { font-weight: 700; text-align: right; }
  .dist-pct { color: #475569; font-size: 0.75rem; }

  .sessions-list { display: flex; flex-direction: column; gap: 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
  .session-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .session-row:hover { background: rgba(255,255,255,0.03); }
  .session-row.active { background: rgba(99,102,241,0.06); border-left: 3px solid #6366f1; }
  .session-left { display: flex; align-items: center; gap: 1rem; }
  .session-id { font-size: 0.75rem; font-weight: 700; color: #475569; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; white-space: nowrap; }
  .session-title { font-weight: 700; color: #e2e8f0; font-size: 0.95rem; }
  .session-meta { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.75rem; color: #475569; margin-top: 3px; }
  .session-right { display: flex; align-items: center; gap: 0.75rem; }
  .delete-btn { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
  .delete-btn:hover { background: rgba(239,68,68,0.1); }
  .expand-arrow { color: #475569; font-size: 0.75rem; }

  .session-detail { background: rgba(8,12,20,0.6); border-top: 1px solid rgba(255,255,255,0.05); }
  .detail-jd { padding: 1rem 1.5rem 0; font-size: 0.82rem; color: #64748b; line-height: 1.6; }
  .detail-label { color: #475569; font-weight: 600; margin-right: 8px; }
  .detail-value { color: #64748b; }

  .candidates-table { padding: 1rem 0; }
  .table-header { display: grid; grid-template-columns: 2fr 80px 100px 1.5fr 1.5fr; padding: 0.5rem 1.5rem; font-size: 0.7rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; }
  .table-row { display: grid; grid-template-columns: 2fr 80px 100px 1.5fr 1.5fr; padding: 0.75rem 1.5rem; align-items: center; border-top: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
  .table-row:hover { background: rgba(255,255,255,0.02); }
  .td-candidate { display: flex; align-items: center; gap: 10px; }
  .td-avatar { width: 32px; height: 32px; background: linear-gradient(135deg,#6366f1,#06b6d4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: white; flex-shrink: 0; }
  .td-name { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; }
  .td-email { font-size: 0.72rem; color: #475569; }
  .td-score { font-size: 1rem; font-weight: 800; }
  .td-exp { font-size: 0.82rem; color: #64748b; }
  .rec-tag { padding: 3px 10px; border-radius: 100px; font-size: 0.72rem; font-weight: 600; }
  .td-skills { display: flex; flex-wrap: wrap; gap: 4px; }
  .mini-skill { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); color: #a5b4fc; padding: 2px 7px; border-radius: 5px; font-size: 0.68rem; font-weight: 500; }
  .mini-skill.more { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #475569; }

  .empty-state { text-align: center; padding: 3rem 1rem; color: #475569; }
  .empty-state p { font-size: 0.9rem; }

  .db-info-box { display: flex; gap: 1rem; align-items: flex-start; background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.15); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
  .db-info-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
  .db-info-title { font-weight: 700; color: #a5b4fc; margin-bottom: 5px; font-size: 0.9rem; }
  .db-info-text { color: #64748b; font-size: 0.83rem; line-height: 1.7; }
  .db-info-text code { background: rgba(99,102,241,0.12); color: #a5b4fc; padding: 1px 6px; border-radius: 4px; font-size: 0.8rem; }
  .db-info-text strong { color: #94a3b8; }

  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.15); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .spinner.large { width: 32px; height: 32px; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;