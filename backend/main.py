from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pdfplumber
import re
import io
from datetime import datetime
from typing import Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
from bson import ObjectId
import json

app = FastAPI(title="AI Resume Screening API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MongoDB Connection ──────────────────────────────────────────────────────────
MONGO_URI = "mongodb://localhost:27017"
client = MongoClient(MONGO_URI)
db = client["resume_screening_db"]

# Collections
sessions_col    = db["screening_sessions"]
candidates_col  = db["candidates"]
suggestions_col = db["suggestions"]

def serialize(doc):
    """Convert MongoDB ObjectId to string for JSON serialization."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(d) for d in doc]
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ── Skill Taxonomy ─────────────────────────────────────────────────────────────
SKILLS_DB = {
    "programming": ["python","javascript","typescript","java","c++","c#","go","rust","kotlin","swift","php","ruby","scala","r","matlab","sql","bash"],
    "frameworks":  ["react","angular","vue","django","flask","fastapi","spring","node.js","express","next.js","nuxt","svelte","laravel","rails"],
    "data_ml":     ["machine learning","deep learning","nlp","computer vision","tensorflow","pytorch","keras","scikit-learn","pandas","numpy","spark","hadoop","data analysis","statistics","tableau","power bi"],
    "cloud_devops":["aws","azure","gcp","docker","kubernetes","terraform","ci/cd","jenkins","github actions","linux","devops","microservices","rest api"],
    "databases":   ["mysql","postgresql","mongodb","redis","elasticsearch","cassandra","sqlite","oracle","dynamodb","firebase"],
    "soft_skills": ["leadership","communication","teamwork","problem solving","project management","agile","scrum","collaboration","mentoring"]
}
ALL_SKILLS = [s for grp in SKILLS_DB.values() for s in grp]

# ── Pydantic Models ─────────────────────────────────────────────────────────────
class ScreeningResult(BaseModel):
    name: str
    email: str
    phone: str
    skills: list[str]
    experience_years: float
    education: list[str]
    overall_score: float
    skill_match_score: float
    experience_score: float
    text_similarity_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    recommendation: str
    summary: str

class SuggestionRequest(BaseModel):
    name: str
    skills: list[str]
    experience_years: float
    education: list[str]
    overall_score: float
    matched_skills: list[str]
    missing_skills: list[str]
    job_title: str = ""

# ── Extraction Helpers ─────────────────────────────────────────────────────────
def extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        text = ""
        for page in pdf.pages:
            t = page.extract_text()
            if t: text += t + "\n"
    return text.strip()

def extract_name(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    skip = ["summary","education","experience","skills","objective","profile","contact"]
    for line in lines[:6]:
        words = line.split()
        if 2 <= len(words) <= 3 and all(w.replace("-","").isalpha() for w in words):
            if not any(s in line.lower() for s in skip):
                return line
    return "Unknown"

def extract_email(text: str) -> str:
    m = re.search(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b', text)
    return m.group() if m else "Not found"

def extract_phone(text: str) -> str:
    m = re.search(r'(\+?\d{1,3}[\s\-]?)?(\(?\d{3}\)?[\s\-]?)(\d{3}[\s\-]?\d{4})', text)
    return m.group().strip() if m else "Not found"

def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    return list({s for s in ALL_SKILLS if re.search(r'\b' + re.escape(s) + r'\b', text_lower)})

def extract_experience_years(text: str) -> float:
    for pat in [r'(\d+)\+?\s*years?\s*of\s*experience', r'(\d+)\+?\s*years?\s*experience',
                r'experience\s*of\s*(\d+)\+?\s*years?', r'(\d+)\+?\s*yrs?\s*experience']:
        m = re.search(pat, text.lower())
        if m: return float(m.group(1))
    ranges = re.findall(r'(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|present|current)', text.lower())
    total = sum(max(0, (2024 if e in ["present","current"] else int(e)) - int(s)) for s,e in ranges)
    return round(min(total, 30), 1) if total > 0 else 0.0

def extract_education(text: str) -> list[str]:
    degrees = ["phd","ph.d","doctorate","master","msc","mba","bachelor","bsc","b.tech","m.tech","b.e","m.e","be","me","bca","mca"]
    found = []
    for line in text.split("\n"):
        if any(d in line.lower() for d in degrees) and line.strip() not in found:
            found.append(line.strip()[:120])
    return found[:4]

# ── Scoring ────────────────────────────────────────────────────────────────────
def compute_skill_match(resume_skills, required_skills):
    if not required_skills: return 0.5, resume_skills[:5], []
    req_lower = [s.lower() for s in required_skills]
    matched = [s for s in resume_skills if s.lower() in req_lower]
    missing = [s for s in req_lower if s not in [m.lower() for m in matched]]
    return round(len(matched)/len(req_lower), 3), matched, missing

def compute_experience_score(resume_years, required_years):
    if required_years == 0: return 0.8
    if resume_years >= required_years: return min(1.0, 0.8 + 0.04*(resume_years-required_years))
    return round(max(0.1, (resume_years/required_years)*0.8), 3)

def compute_text_similarity(resume_text, job_description):
    try:
        v = TfidfVectorizer(stop_words="english", max_features=500)
        m = v.fit_transform([resume_text, job_description])
        return round(float(cosine_similarity(m[0:1], m[1:2])[0][0]), 3)
    except: return 0.0

def get_recommendation(score):
    if score >= 0.80: return "Strong Match – Proceed to Interview"
    elif score >= 0.65: return "Good Match – Consider for Interview"
    elif score >= 0.50: return "Partial Match – Review Carefully"
    elif score >= 0.35: return "Weak Match – Skills Gap Present"
    else: return "Poor Match – Does Not Meet Requirements"

def build_summary(name, skills, exp, score, matched):
    top = ", ".join(skills[:4]) if skills else "no specific skills detected"
    mtch = ", ".join(matched[:3]) if matched else "none"
    return f"{name} has {exp} years of experience with key skills in {top}. Matched {len(matched)} required skill(s) including {mtch}. Overall fit score: {round(score*100,1)}%."

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "AI Resume Screening API is running!", "status": "ok", "database": "MongoDB"}

@app.get("/health")
def health():
    try:
        client.admin.command("ping")
        db_status = "connected"
    except:
        db_status = "disconnected"
    return {"status": "healthy", "database": "MongoDB", "db_status": db_status, "version": "2.0.0"}

@app.post("/screen-resume", response_model=ScreeningResult)
async def screen_resume(
    file: UploadFile = File(...),
    job_title: str = "Software Engineer",
    job_description: str = "",
    required_skills: str = "",
    experience_years: int = 0,
    session_id: str = ""
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        content = await file.read()
        text = extract_text_from_pdf(content)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse PDF: {str(e)}")
    if not text or len(text) < 50:
        raise HTTPException(status_code=422, detail="PDF appears empty or unreadable.")

    req_skills = [s.strip().lower() for s in required_skills.split(",") if s.strip()]
    name        = extract_name(text)
    email       = extract_email(text)
    phone       = extract_phone(text)
    skills      = extract_skills(text)
    exp_years   = extract_experience_years(text)
    education   = extract_education(text)

    skill_score, matched, missing = compute_skill_match(skills, req_skills)
    exp_score  = compute_experience_score(exp_years, experience_years)
    text_sim   = compute_text_similarity(text, job_description) if job_description else 0.3
    overall    = round(0.45*skill_score + 0.30*exp_score + 0.25*text_sim, 3) if req_skills else round(0.30*min(len(skills)/10,1.0) + 0.40*exp_score + 0.30*text_sim, 3)

    result = ScreeningResult(
        name=name, email=email, phone=phone, skills=skills,
        experience_years=exp_years, education=education,
        overall_score=overall, skill_match_score=skill_score,
        experience_score=exp_score, text_similarity_score=text_sim,
        matched_skills=matched, missing_skills=missing,
        recommendation=get_recommendation(overall),
        summary=build_summary(name, skills, exp_years, overall, matched)
    )

    # Save candidate to MongoDB
    if session_id:
        candidate_doc = {
            **result.dict(),
            "filename": file.filename,
            "session_id": session_id,
            "screened_at": datetime.now().isoformat()
        }
        inserted = candidates_col.insert_one(candidate_doc)
        # Update session candidate count
        sessions_col.update_one(
            {"_id": ObjectId(session_id)},
            {"$inc": {"total_candidates": 1}}
        )

    return result

@app.post("/batch-screen")
async def batch_screen(
    files: list[UploadFile] = File(...),
    job_title: str = "Software Engineer",
    job_description: str = "",
    required_skills: str = "",
    experience_years: int = 0
):
    # Create a new session document in MongoDB
    session_doc = {
        "job_title": job_title,
        "job_description": job_description,
        "required_skills": required_skills,
        "experience_years": experience_years,
        "total_candidates": 0,
        "created_at": datetime.now().isoformat()
    }
    session_result = sessions_col.insert_one(session_doc)
    session_id = str(session_result.inserted_id)

    req_skills = [s.strip().lower() for s in required_skills.split(",") if s.strip()]

    results = []
    for file in files:
        try:
            # Read file content fresh for each file
            if not file.filename.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="Only PDF files are supported.")

            content = await file.read()
            if not content or len(content) < 100:
                raise HTTPException(status_code=422, detail="File appears empty.")

            text = extract_text_from_pdf(content)
            if not text or len(text) < 50:
                raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

            name        = extract_name(text)
            email       = extract_email(text)
            phone       = extract_phone(text)
            skills      = extract_skills(text)
            exp_years   = extract_experience_years(text)
            education   = extract_education(text)

            skill_score, matched, missing = compute_skill_match(skills, req_skills)
            exp_score  = compute_experience_score(exp_years, experience_years)
            text_sim   = compute_text_similarity(text, job_description) if job_description else 0.3
            overall    = round(0.45*skill_score + 0.30*exp_score + 0.25*text_sim, 3) if req_skills else round(0.30*min(len(skills)/10,1.0) + 0.40*exp_score + 0.30*text_sim, 3)

            result = ScreeningResult(
                name=name, email=email, phone=phone, skills=skills,
                experience_years=exp_years, education=education,
                overall_score=overall, skill_match_score=skill_score,
                experience_score=exp_score, text_similarity_score=text_sim,
                matched_skills=matched, missing_skills=missing,
                recommendation=get_recommendation(overall),
                summary=build_summary(name, skills, exp_years, overall, matched)
            )

            # Save to MongoDB
            candidate_doc = {
                **result.dict(),
                "filename": file.filename,
                "session_id": session_id,
                "screened_at": datetime.now().isoformat()
            }
            candidates_col.insert_one(candidate_doc)
            sessions_col.update_one(
                {"_id": ObjectId(session_id)},
                {"": {"total_candidates": 1}}
            )

            results.append({
                "filename": file.filename,
                "status": "success",
                "data": result.dict(),
                "session_id": session_id
            })

        except HTTPException as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": e.detail,
                "session_id": session_id
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "error": str(e),
                "session_id": session_id
            })

    results.sort(key=lambda x: x.get("data", {}).get("overall_score", 0), reverse=True)
    return {"total": len(results), "session_id": session_id, "results": results}

@app.get("/skills-list")
def get_skills():
    return {"skills_by_category": SKILLS_DB, "total": len(ALL_SKILLS)}

# ── Suggestions ────────────────────────────────────────────────────────────────
@app.post("/suggest")
async def get_suggestions(req: SuggestionRequest):
    skills_lower = [s.lower() for s in req.skills]
    exp   = req.experience_years
    score = req.overall_score

    is_ml       = any(s in skills_lower for s in ["machine learning","tensorflow","pytorch","deep learning","nlp"])
    is_frontend = any(s in skills_lower for s in ["react","angular","vue","next.js","svelte"])
    is_backend  = any(s in skills_lower for s in ["django","flask","fastapi","spring","node.js","express"])
    is_devops   = any(s in skills_lower for s in ["docker","kubernetes","aws","terraform","ci/cd"])
    is_data     = any(s in skills_lower for s in ["pandas","numpy","tableau","power bi","data analysis","spark"])
    is_java     = any(s in skills_lower for s in ["java","spring","kotlin"])
    is_python   = "python" in skills_lower
    is_js       = any(s in skills_lower for s in ["javascript","typescript"])
    level       = "junior" if exp <= 2 else ("mid" if exp <= 6 else "senior")

    next_skills = list(req.missing_skills[:3])
    if is_ml and not is_devops:         next_skills += ["MLOps","Docker","FastAPI (model serving)"]
    if is_ml and "pytorch" not in skills_lower: next_skills.append("PyTorch")
    if is_frontend and not is_backend:  next_skills += ["Node.js","REST API design"]
    if is_backend and not any(s in skills_lower for s in ["docker","kubernetes"]): next_skills += ["Docker","Kubernetes"]
    if is_python and not any(s in skills_lower for s in ["aws","azure","gcp"]): next_skills.append("AWS Cloud Fundamentals")
    if is_data and "machine learning" not in skills_lower: next_skills.append("Machine Learning (scikit-learn)")
    if level == "junior": next_skills += ["Git & GitHub","System Design basics","SQL advanced queries"]
    if level == "mid" and not any(s in skills_lower for s in ["agile","scrum"]): next_skills.append("Agile / Scrum")
    if level == "senior" and "leadership" not in skills_lower: next_skills.append("Engineering Leadership")
    if not any(s in skills_lower for s in ["postgresql","mongodb","mysql"]): next_skills.append("Database design (PostgreSQL)")
    seen = set(x.lower() for x in req.skills + req.matched_skills)
    next_skills = [s for s in dict.fromkeys(next_skills) if s.lower() not in seen][:6]

    companies = []
    if score >= 0.75: companies = ["Google","Microsoft","Amazon"]
    if is_ml or is_data:     companies += {"junior":["TCS iON","Infosys AI","Fractal Analytics"],"mid":["Flipkart AI","Razorpay ML","DataBricks"],"senior":["Google DeepMind","OpenAI","Meta AI"]}[level]
    if is_frontend or is_js: companies += {"junior":["TCS","Infosys","Capgemini"],"mid":["Swiggy","CRED","Meesho"],"senior":["Atlassian","Figma","Vercel"]}[level]
    if is_backend or is_python: companies += {"junior":["HCL Technologies","Tech Mahindra","Mphasis"],"mid":["PhonePe","Groww","Paytm"],"senior":["Stripe","Twilio","HashiCorp"]}[level]
    if is_devops:            companies += {"junior":["Cognizant","ThoughtWorks","Rackspace"],"mid":["Presidio","Rackspace","ThoughtWorks"],"senior":["HashiCorp","Cloudflare","Datadog"]}[level]
    if is_java:              companies += ["Oracle","SAP Labs","Goldman Sachs Tech"]
    if not companies:        companies = {"junior":["TCS","Infosys","Wipro"],"mid":["Accenture","Cognizant","IBM India"],"senior":["Adobe","Salesforce","ServiceNow"]}[level]
    companies = list(dict.fromkeys(companies))[:6]

    roles = []
    if is_ml:       roles += {"junior":["ML Engineer Intern","Junior Data Scientist"],"mid":["Machine Learning Engineer","Data Scientist","NLP Engineer"],"senior":["Senior ML Engineer","Principal Data Scientist","AI Tech Lead"]}[level]
    if is_frontend: roles += {"junior":["Junior Frontend Developer","React Trainee"],"mid":["Frontend Engineer","React Developer"],"senior":["Senior Frontend Engineer","Frontend Architect"]}[level]
    if is_backend:  roles += {"junior":["Junior Backend Developer","Software Engineer"],"mid":["Backend Engineer","Software Engineer II"],"senior":["Senior Backend Engineer","Staff Engineer"]}[level]
    if is_devops:   roles += {"junior":["Junior DevOps Engineer","Cloud Support"],"mid":["DevOps Engineer","Site Reliability Engineer"],"senior":["Senior DevOps Engineer","Platform Engineering Manager"]}[level]
    if is_data:     roles += {"junior":["Data Analyst","BI Analyst"],"mid":["Senior Data Analyst","Data Engineer"],"senior":["Lead Data Engineer","Analytics Manager"]}[level]
    if not roles:   roles = {"junior":["Software Engineer","Associate Developer"],"mid":["Software Engineer II","Full Stack Developer"],"senior":["Senior Software Engineer","Principal Engineer"]}[level]
    roles = list(dict.fromkeys(roles))[:5]

    certs = []
    if is_ml or is_data:     certs += [{"name":"TensorFlow Developer Certificate","provider":"Google","url":"https://www.tensorflow.org/certificate"},{"name":"IBM Data Science Professional","provider":"Coursera","url":"https://www.coursera.org/professional-certificates/ibm-data-science"},{"name":"Deep Learning Specialization","provider":"DeepLearning.AI","url":"https://www.coursera.org/specializations/deep-learning"}]
    if is_devops or any(s in skills_lower for s in ["aws","azure","gcp"]): certs += [{"name":"AWS Certified Solutions Architect","provider":"Amazon","url":"https://aws.amazon.com/certification/certified-solutions-architect-associate/"},{"name":"Certified Kubernetes Administrator","provider":"CNCF","url":"https://www.cncf.io/certification/cka/"}]
    if is_python or is_backend: certs += [{"name":"Python Institute PCEP / PCAP","provider":"Python Institute","url":"https://pythoninstitute.org/"},{"name":"FastAPI & Microservices Bootcamp","provider":"Udemy","url":"https://www.udemy.com/"}]
    if is_frontend or is_js: certs += [{"name":"Meta Frontend Developer Certificate","provider":"Coursera / Meta","url":"https://www.coursera.org/professional-certificates/meta-front-end-developer"},{"name":"Next.js & React Complete Guide","provider":"Udemy","url":"https://www.udemy.com/"}]
    if level in ["mid","senior"]: certs += [{"name":"Certified Scrum Master (CSM)","provider":"Scrum Alliance","url":"https://www.scrumalliance.org/"},{"name":"PMP Certification","provider":"PMI","url":"https://www.pmi.org/certifications/project-management-pmp"}]
    certs.append({"name":"Google IT Support Professional Certificate","provider":"Coursera / Google","url":"https://www.coursera.org/professional-certificates/google-it-support"})
    seen_c = set(); unique_certs = []
    for c in certs:
        if c["name"] not in seen_c: seen_c.add(c["name"]); unique_certs.append(c)

    sugg = {"next_skills": next_skills, "target_companies": companies, "job_roles": roles, "certifications": unique_certs[:5]}

    # Save suggestions to MongoDB
    suggestions_col.insert_one({
        **sugg,
        "candidate_name": req.name,
        "created_at": datetime.now().isoformat()
    })

    return sugg

# ── History / Dashboard Routes ─────────────────────────────────────────────────
@app.get("/history/sessions")
def get_sessions():
    rows = list(sessions_col.find().sort("created_at", -1))
    return serialize(rows)

@app.get("/history/session/{session_id}")
def get_session_detail(session_id: str):
    try:
        session = sessions_col.find_one({"_id": ObjectId(session_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    candidates = list(candidates_col.find({"session_id": session_id}).sort("overall_score", -1))
    return {
        "session":    serialize(session),
        "candidates": serialize(candidates)
    }

@app.get("/history/stats")
def get_stats():
    total_sessions    = sessions_col.count_documents({})
    total_candidates  = candidates_col.count_documents({})
    pipeline_avg = [{"$group": {"_id": None, "avg": {"$avg": "$overall_score"}}}]
    avg_result   = list(candidates_col.aggregate(pipeline_avg))
    avg_score    = round(avg_result[0]["avg"] * 100, 1) if avg_result else 0

    pipeline_dist = [{"$group": {"_id": None,
        "strong":  {"$sum": {"$cond": [{"$gte": ["$overall_score", 0.8]},  1, 0]}},
        "good":    {"$sum": {"$cond": [{"$and": [{"$gte": ["$overall_score", 0.65]}, {"$lt": ["$overall_score", 0.8]}]},  1, 0]}},
        "partial": {"$sum": {"$cond": [{"$and": [{"$gte": ["$overall_score", 0.5]},  {"$lt": ["$overall_score", 0.65]}]}, 1, 0]}},
        "weak":    {"$sum": {"$cond": [{"$lt":  ["$overall_score", 0.5]},  1, 0]}}
    }}]
    dist_result = list(candidates_col.aggregate(pipeline_dist))
    score_dist  = dist_result[0] if dist_result else {"strong":0,"good":0,"partial":0,"weak":0}
    if "_id" in score_dist: del score_dist["_id"]

    recent_sessions = serialize(list(sessions_col.find().sort("created_at", -1).limit(5)))

    return {
        "total_sessions":    total_sessions,
        "total_candidates":  total_candidates,
        "avg_score":         avg_score,
        "score_distribution": score_dist,
        "recent_sessions":   recent_sessions
    }

@app.delete("/history/session/{session_id}")
def delete_session(session_id: str):
    try:
        sessions_col.delete_one({"_id": ObjectId(session_id)})
        candidates_col.delete_many({"session_id": session_id})
    except:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    return {"message": "Session deleted successfully"}

# ── Auth / Users ───────────────────────────────────────────────────────────────
import hashlib

users_col = db["users"]

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    role: str  # "recruiter" or "candidate"

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/auth/register")
def register(req: RegisterRequest):
    if req.role not in ["recruiter", "candidate"]:
        raise HTTPException(status_code=400, detail="Role must be 'recruiter' or 'candidate'")
    if len(req.username.strip()) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if len(req.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full name")

    # Check if username already exists
    existing = users_col.find_one({"username": req.username.strip().lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken. Please choose another.")

    user_doc = {
        "username": req.username.strip().lower(),
        "password": hash_password(req.password),
        "name": req.name.strip(),
        "role": req.role,
        "created_at": datetime.now().isoformat()
    }
    users_col.insert_one(user_doc)
    return {
        "message": "Account created successfully!",
        "username": user_doc["username"],
        "name": user_doc["name"],
        "role": user_doc["role"]
    }

@app.post("/auth/login")
def login(req: LoginRequest):
    user = users_col.find_one({
        "username": req.username.strip().lower(),
        "password": hash_password(req.password)
    })
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "message": "Login successful",
        "username": user["username"],
        "name": user["name"],
        "role": user["role"]
    }

@app.get("/auth/users")
def get_users():
    """For admin/demo purposes — shows all registered users without passwords"""
    users = list(users_col.find({}, {"password": 0}))
    return serialize(users)

# ── Courses Endpoint ────────────────────────────────────────────────────────────
class CoursesRequest(BaseModel):
    skills: list[str]
    experience_years: float

@app.post("/courses")
def get_courses(req: CoursesRequest):
    skills_lower = [s.lower() for s in req.skills]
    level = "junior" if req.experience_years <= 2 else ("mid" if req.experience_years <= 6 else "senior")

    is_ml       = any(s in skills_lower for s in ["machine learning","tensorflow","pytorch","deep learning","nlp"])
    is_frontend = any(s in skills_lower for s in ["react","angular","vue","next.js","svelte"])
    is_backend  = any(s in skills_lower for s in ["django","flask","fastapi","spring","node.js","express"])
    is_devops   = any(s in skills_lower for s in ["docker","kubernetes","aws","terraform","ci/cd"])
    is_data     = any(s in skills_lower for s in ["pandas","numpy","tableau","data analysis","spark"])
    is_python   = "python" in skills_lower
    is_js       = any(s in skills_lower for s in ["javascript","typescript"])

    courses = []

    # ── YouTube (Free) ──────────────────────────────────────────────────────────
    if is_python or is_backend:
        courses.append({"title":"Python Full Course for Beginners","platform":"YouTube","channel":"freeCodeCamp","url":"https://www.youtube.com/watch?v=rfscVS0vtbw","price":"Free","level":"Beginner","duration":"4.5 hrs","tag":"python"})
        courses.append({"title":"FastAPI Full Course","platform":"YouTube","channel":"Bitfumes","url":"https://www.youtube.com/watch?v=7t2alSnE2-I","price":"Free","level":"Intermediate","duration":"3 hrs","tag":"fastapi"})

    if is_js or is_frontend:
        courses.append({"title":"JavaScript Full Course","platform":"YouTube","channel":"freeCodeCamp","url":"https://www.youtube.com/watch?v=PkZNo7MFNFg","price":"Free","level":"Beginner","duration":"3.5 hrs","tag":"javascript"})
        courses.append({"title":"React JS Full Course","platform":"YouTube","channel":"Dave Gray","url":"https://www.youtube.com/watch?v=RVFAyFWO4go","price":"Free","level":"Intermediate","duration":"9 hrs","tag":"react"})
        courses.append({"title":"Next.js Full Course","platform":"YouTube","channel":"Traversy Media","url":"https://www.youtube.com/watch?v=mTz0GXj8NN0","price":"Free","level":"Intermediate","duration":"2 hrs","tag":"nextjs"})

    if is_ml or is_data:
        courses.append({"title":"Machine Learning Course — Andrew Ng","platform":"YouTube","channel":"Stanford / DeepLearning.AI","url":"https://www.youtube.com/watch?v=jGwO_UgTS7I","price":"Free","level":"Intermediate","duration":"10 hrs","tag":"ml"})
        courses.append({"title":"Python for Data Analysis — Full Course","platform":"YouTube","channel":"freeCodeCamp","url":"https://www.youtube.com/watch?v=r-uOLxNrNk8","price":"Free","level":"Beginner","duration":"4 hrs","tag":"data"})
        courses.append({"title":"TensorFlow 2.0 Complete Course","platform":"YouTube","channel":"freeCodeCamp","url":"https://www.youtube.com/watch?v=tPYj3fFJGjk","price":"Free","level":"Advanced","duration":"7 hrs","tag":"tensorflow"})

    if is_devops:
        courses.append({"title":"Docker Full Course","platform":"YouTube","channel":"TechWorld with Nana","url":"https://www.youtube.com/watch?v=3c-iBn73dDE","price":"Free","level":"Beginner","duration":"3 hrs","tag":"docker"})
        courses.append({"title":"Kubernetes Tutorial for Beginners","platform":"YouTube","channel":"TechWorld with Nana","url":"https://www.youtube.com/watch?v=X48VuDVv0do","price":"Free","level":"Intermediate","duration":"4 hrs","tag":"kubernetes"})

    # Always add these
    courses.append({"title":"Git & GitHub Full Course","platform":"YouTube","channel":"freeCodeCamp","url":"https://www.youtube.com/watch?v=RGOj5yH7evk","price":"Free","level":"Beginner","duration":"1 hr","tag":"git"})
    courses.append({"title":"SQL Full Course","platform":"YouTube","channel":"freeCodeCamp","url":"https://www.youtube.com/watch?v=HXV3zeQKqGY","price":"Free","level":"Beginner","duration":"4 hrs","tag":"sql"})

    # ── Coursera ────────────────────────────────────────────────────────────────
    if is_ml or is_data:
        courses.append({"title":"Machine Learning Specialization","platform":"Coursera","channel":"DeepLearning.AI","url":"https://www.coursera.org/specializations/machine-learning-introduction","price":"Paid (Audit Free)","level":"Intermediate","duration":"3 months","tag":"ml"})
        courses.append({"title":"IBM Data Science Professional Certificate","platform":"Coursera","channel":"IBM","url":"https://www.coursera.org/professional-certificates/ibm-data-science","price":"Paid (Audit Free)","level":"Beginner","duration":"5 months","tag":"data"})

    if is_devops:
        courses.append({"title":"Google IT Automation with Python","platform":"Coursera","channel":"Google","url":"https://www.coursera.org/professional-certificates/google-it-automation","price":"Paid (Audit Free)","level":"Intermediate","duration":"6 months","tag":"devops"})

    if is_frontend or is_js:
        courses.append({"title":"Meta Frontend Developer Certificate","platform":"Coursera","channel":"Meta","url":"https://www.coursera.org/professional-certificates/meta-front-end-developer","price":"Paid (Audit Free)","level":"Beginner","duration":"7 months","tag":"frontend"})

    # ── Udemy ───────────────────────────────────────────────────────────────────
    if is_python or is_backend:
        courses.append({"title":"100 Days of Code — Python Bootcamp","platform":"Udemy","channel":"Dr. Angela Yu","url":"https://www.udemy.com/course/100-days-of-code/","price":"Paid (~₹499)","level":"Beginner","duration":"60 hrs","tag":"python"})

    if is_js or is_frontend:
        courses.append({"title":"The Complete JavaScript Course 2024","platform":"Udemy","channel":"Jonas Schmedtmann","url":"https://www.udemy.com/course/the-complete-javascript-course/","price":"Paid (~₹499)","level":"Beginner","duration":"69 hrs","tag":"javascript"})
        courses.append({"title":"React — The Complete Guide 2024","platform":"Udemy","channel":"Maximilian Schwarzmüller","url":"https://www.udemy.com/course/react-the-complete-guide-incl-redux/","price":"Paid (~₹499)","level":"Intermediate","duration":"68 hrs","tag":"react"})

    if is_ml:
        courses.append({"title":"Machine Learning A-Z","platform":"Udemy","channel":"Kirill Eremenko","url":"https://www.udemy.com/course/machinelearning/","price":"Paid (~₹499)","level":"Intermediate","duration":"44 hrs","tag":"ml"})

    if is_devops:
        courses.append({"title":"Docker & Kubernetes: The Practical Guide","platform":"Udemy","channel":"Maximilian Schwarzmüller","url":"https://www.udemy.com/course/docker-kubernetes-the-practical-guide/","price":"Paid (~₹499)","level":"Intermediate","duration":"23 hrs","tag":"devops"})

    # ── freeCodeCamp ────────────────────────────────────────────────────────────
    courses.append({"title":"Responsive Web Design Certification","platform":"freeCodeCamp","channel":"freeCodeCamp","url":"https://www.freecodecamp.org/learn/2022/responsive-web-design/","price":"Free","level":"Beginner","duration":"300 hrs","tag":"frontend"})
    courses.append({"title":"JavaScript Algorithms & Data Structures","platform":"freeCodeCamp","channel":"freeCodeCamp","url":"https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/","price":"Free","level":"Intermediate","duration":"300 hrs","tag":"javascript"})

    if is_data or is_ml:
        courses.append({"title":"Data Analysis with Python Certification","platform":"freeCodeCamp","channel":"freeCodeCamp","url":"https://www.freecodecamp.org/learn/data-analysis-with-python/","price":"Free","level":"Intermediate","duration":"300 hrs","tag":"data"})
        courses.append({"title":"Machine Learning with Python Certification","platform":"freeCodeCamp","channel":"freeCodeCamp","url":"https://www.freecodecamp.org/learn/machine-learning-with-python/","price":"Free","level":"Intermediate","duration":"300 hrs","tag":"ml"})

    # Deduplicate by title
    seen_t = set()
    unique = []
    for c in courses:
        if c["title"] not in seen_t:
            seen_t.add(c["title"])
            unique.append(c)

    # Group by platform
    grouped = {}
    for c in unique:
        grouped.setdefault(c["platform"], []).append(c)

    return {"courses": unique[:20], "grouped": grouped }