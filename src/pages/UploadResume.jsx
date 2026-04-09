import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8000";

export default function UploadResume() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    job_title: "",
    job_description: "",
    required_skills: "",
    experience_years: 0,
  });

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
    if (dropped.length) setFiles(prev => [...prev, ...dropped]);
    else setError("Only PDF files are supported.");
  };

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files).filter(f => f.type === "application/pdf");
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!files.length) return setError("Please upload at least one PDF resume.");
    setError("");
    setLoading(true);
    setProgress(10);

    try {
      

      // Always use batch-screen so ALL data is saved to MongoDB
      const fd = new FormData();
      files.forEach(f => fd.append("files", f));
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      setProgress(40);
      const res = await fetch(`${API}/batch-screen`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Screening failed");
      }
      const data = await res.json();
      const results = data.results;

      setProgress(90);
      sessionStorage.setItem("screening_results", JSON.stringify(results));
      sessionStorage.setItem("job_info", JSON.stringify(form));
      setProgress(100);
      setTimeout(() => navigate("/results"), 300);
    } catch (err) {
      setError(err.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const SUGGESTED_SKILLS = ["Python", "React", "Node.js", "AWS", "Docker", "Machine Learning", "Java", "SQL", "TypeScript", "Kubernetes"];

  const addSuggestedSkill = (skill) => {
    const current = form.required_skills ? form.required_skills.split(",").map(s => s.trim()) : [];
    if (!current.includes(skill)) {
      setForm(f => ({ ...f, required_skills: [...current, skill].join(", ") }));
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="page-header animate-fade-in-up">
          <div className="breadcrumb">
            <span onClick={() => navigate("/")} style={{ cursor: "pointer", color: "#6366f1" }}>🏠 Home</span>
            <span style={{ color: "#334155" }}> / </span>
            <span style={{ color: "#64748b" }}>Workspace</span>
          </div>
          <h1>Recruiter Workspace</h1>
          <p>Step 1: Define Job Requirements & Upload Candidates</p>
        </div>

        <div className="upload-layout">
          {/* Left – Job Details */}
          <div className="panel animate-fade-in-up delay-100">
            <div className="panel-title">
              <span className="panel-icon">1️⃣</span>
              Job Requirements
            </div>

            <div className="field">
              <label>Job Title</label>
              <input
                type="text"
                placeholder="e.g. Senior Python Developer"
                value={form.job_title}
                onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>Job Description</label>
              <textarea
                rows={4}
                placeholder="Paste the full job description here for better matching..."
                value={form.job_description}
                onChange={e => setForm(f => ({ ...f, job_description: e.target.value }))}
              />
            </div>

            <div className="field">
              <label>Required Skills <span className="label-hint">(comma separated)</span></label>
              <input
                type="text"
                placeholder="Python, React, AWS, Docker..."
                value={form.required_skills}
                onChange={e => setForm(f => ({ ...f, required_skills: e.target.value }))}
              />
              <div className="skill-suggestions">
                {SUGGESTED_SKILLS.map(s => (
                  <button key={s} className="suggestion-tag" onClick={() => addSuggestedSkill(s)}>+ {s}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Minimum Experience (years)</label>
              <input
                type="number"
                min="0"
                max="20"
                value={form.experience_years}
                onChange={e => setForm(f => ({ ...f, experience_years: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Right – Upload */}
          <div className="panel animate-fade-in-up delay-200">
            <div className="panel-title">
              <span className="panel-icon">2️⃣</span>
              Upload Resumes
            </div>

            <div
              className={`drop-zone ${dragging ? "dragging" : ""}`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf" multiple hidden onChange={handleFileInput} />
              <div className="drop-icon">📂</div>
              <p className="drop-text">Drag & drop PDF resumes here</p>
              <p className="drop-sub">or click to browse files</p>
              <span className="drop-badge">PDF only • Multiple files supported</span>
            </div>

            {files.length > 0 && (
              <div className="file-list">
                {files.map((f, i) => (
                  <div key={i} className="file-item">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{f.name}</span>
                    <span className="file-size">{(f.size / 1024).toFixed(0)} KB</span>
                    <button className="file-remove" onClick={() => removeFile(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {error && <div className="error-box">⚠️ {error}</div>}

            {loading && (
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="progress-label">Analyzing resumes... {progress}%</span>
              </div>
            )}

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loading || !files.length}
            >
              {loading ? (
                <><span className="spinner" /> Processing...</>
              ) : (
                <><span>🚀 Screen {files.length > 1 ? `${files.length} Resumes` : "Resume"}</span></>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .upload-page { min-height: 100vh; background: #080c14; color: #e2e8f0; font-family: 'DM Sans', sans-serif; padding: 2rem; }
        .upload-container { max-width: 1200px; margin: 0 auto; }

        .page-header { margin-bottom: 2.5rem; padding-top: 1rem; }
        .breadcrumb { font-size: 0.82rem; margin-bottom: 0.75rem; }
        .page-header h1 { font-size: 2rem; font-weight: 800; color: #f1f5f9; margin-bottom: 0.4rem; letter-spacing: -0.02em; }
        .page-header p { color: #64748b; font-size: 0.95rem; }

        .upload-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 800px) { .upload-layout { grid-template-columns: 1fr; } }

        .panel { background: rgba(15,23,42,0.55); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        .panel-title { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; font-size: 1.05rem; color: #f1f5f9; margin-bottom: 0.25rem; }
        .panel-icon { font-size: 1.1rem; }

        .field { display: flex; flex-direction: column; gap: 0.5rem; }
        .field label { font-size: 0.82rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .label-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: #475569; }
        .field input, .field textarea {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 0.7rem 1rem; color: #e2e8f0; font-family: inherit;
          font-size: 0.9rem; resize: vertical; transition: border-color 0.2s;
        }
        .field input:focus, .field textarea:focus {
          outline: none; border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.04);
        }
        .field input::placeholder, .field textarea::placeholder { color: #334155; }

        .skill-suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .suggestion-tag { background: transparent; border: 1px solid rgba(99,102,241,0.25); color: #6366f1; padding: 3px 10px; border-radius: 6px; font-size: 0.73rem; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .suggestion-tag:hover { background: rgba(99,102,241,0.1); }

        .drop-zone {
          border: 2px dashed rgba(99,102,241,0.25); border-radius: 16px; padding: 2.5rem 1.5rem;
          text-align: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255,255,255,0.01);
        }
        .drop-zone:hover { border-color: rgba(99,102,241,0.6); background: rgba(99,102,241,0.04); transform: translateY(-2px); }
        .drop-zone.dragging { border-color: #6366f1; background: rgba(99,102,241,0.1); animation: pulseGlow 1.5s infinite; transform: scale(1.02); }
        .drop-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .drop-text { font-weight: 600; color: #e2e8f0; margin-bottom: 0.3rem; }
        .drop-sub { color: #64748b; font-size: 0.85rem; margin-bottom: 0.75rem; }
        .drop-badge { background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); color: #a5b4fc; padding: 4px 12px; border-radius: 100px; font-size: 0.72rem; }

        .file-list { display: flex; flex-direction: column; gap: 8px; }
        .file-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.6rem 0.9rem; }
        .file-icon { font-size: 1rem; }
        .file-name { flex: 1; font-size: 0.84rem; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { font-size: 0.75rem; color: #475569; }
        .file-remove { background: none; border: none; color: #475569; cursor: pointer; font-size: 0.85rem; padding: 2px 4px; border-radius: 4px; transition: color 0.2s; }
        .file-remove:hover { color: #ef4444; }

        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.85rem; }

        .progress-wrap { display: flex; flex-direction: column; gap: 8px; }
        .progress-bar { height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #06b6d4); border-radius: 999px; transition: width 0.4s ease; }
        .progress-label { font-size: 0.78rem; color: #6366f1; text-align: center; }

        .submit-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border: none;
          padding: 1rem 2rem; border-radius: 12px; font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); margin-top: auto;
          box-shadow: 0 0 20px rgba(99,102,241,0.25);
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 40px rgba(99,102,241,0.5); }
        .submit-btn:active:not(:disabled) { transform: translateY(1px) scale(0.98); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}