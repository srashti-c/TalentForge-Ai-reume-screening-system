"""
Synthetic Resume Dataset Generator
Generates realistic resume data as JSON + CSV for training/testing
Run: python generate_dataset.py
"""

import json
import csv
import random
from datetime import datetime, timedelta

random.seed(42)

# ── Data pools ─────────────────────────────────────────────────────────────────
FIRST_NAMES = [
    "Aarav", "Priya", "Rahul", "Ananya", "Vikram", "Sneha", "Arjun", "Pooja",
    "Rohan", "Divya", "Karan", "Meera", "Nikhil", "Kavya", "Suresh", "Lakshmi",
    "James", "Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Jessica",
    "Chen", "Li", "Wei", "Mei", "Zhang", "Yuki", "Kenji", "Aisha", "Omar", "Fatima",
    "Carlos", "Maria", "Luis", "Sofia", "Ahmed", "Zara", "Raj", "Nisha", "Dev", "Riya"
]

LAST_NAMES = [
    "Sharma", "Patel", "Kumar", "Singh", "Gupta", "Verma", "Joshi", "Mehta",
    "Shah", "Nair", "Reddy", "Iyer", "Pillai", "Das", "Bose", "Roy",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Wilson", "Anderson", "Taylor", "Thomas", "Jackson", "White", "Harris", "Martin",
    "Wang", "Li", "Zhang", "Chen", "Liu", "Yang", "Huang", "Tanaka", "Kim"
]

UNIVERSITIES = [
    "IIT Bombay", "IIT Delhi", "IIT Madras", "BITS Pilani", "NIT Trichy",
    "Delhi University", "Pune University", "Anna University", "VTU Bangalore",
    "MIT", "Stanford University", "Carnegie Mellon", "UC Berkeley", "Caltech",
    "University of Toronto", "University of Melbourne", "TU Munich",
    "National University of Singapore", "IIM Ahmedabad", "ISB Hyderabad"
]

DEGREES = [
    "B.Tech in Computer Science", "B.Tech in Information Technology",
    "B.E in Electronics", "B.Sc in Computer Science", "BCA",
    "M.Tech in Computer Science", "M.Tech in Data Science", "MCA",
    "MBA in Technology Management", "M.Sc in Artificial Intelligence",
    "Ph.D in Machine Learning", "B.Tech in Software Engineering"
]

COMPANIES = [
    "TCS", "Infosys", "Wipro", "HCL Technologies", "Tech Mahindra",
    "Accenture", "Cognizant", "Capgemini", "IBM India", "Oracle India",
    "Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix",
    "Flipkart", "Zomato", "Swiggy", "Paytm", "Razorpay", "CRED",
    "Startup Hub", "InnovateTech", "DataSoft Solutions", "CloudNine Systems"
]

JOB_TITLES = {
    "junior": ["Junior Developer", "Software Engineer I", "Associate Engineer",
               "Junior Data Analyst", "Associate Developer", "Trainee Engineer"],
    "mid": ["Software Engineer", "Senior Software Engineer", "Data Engineer",
            "Full Stack Developer", "Backend Developer", "Frontend Developer",
            "Data Scientist", "ML Engineer", "DevOps Engineer", "Cloud Engineer"],
    "senior": ["Senior Engineer", "Lead Engineer", "Principal Engineer",
               "Engineering Manager", "Senior Data Scientist", "Staff Engineer",
               "Tech Lead", "Solutions Architect", "Senior ML Engineer"]
}

SKILLS_POOL = {
    "programming": ["Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "Kotlin", "SQL", "R"],
    "frameworks": ["React", "Angular", "Vue", "Django", "Flask", "FastAPI", "Spring Boot", "Node.js", "Next.js"],
    "data_ml": ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "scikit-learn",
                "Pandas", "NumPy", "NLP", "Computer Vision", "Data Analysis", "Tableau"],
    "cloud_devops": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Jenkins"],
    "databases": ["MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Firebase", "DynamoDB"],
    "soft": ["Agile", "Scrum", "Leadership", "Communication", "Problem Solving", "Teamwork", "Mentoring"]
}

ACHIEVEMENTS = [
    "Reduced system latency by {p}% through query optimization",
    "Led a team of {n} engineers to deliver project on time",
    "Increased test coverage from {a}% to {b}%",
    "Designed and deployed microservices handling {n}K+ requests/day",
    "Implemented CI/CD pipeline reducing deployment time by {p}%",
    "Built recommendation engine improving user engagement by {p}%",
    "Migrated legacy system to cloud saving ${n}K annually",
    "Mentored {n} junior developers across quarterly cycles",
    "Developed REST API serving {n}M+ users globally",
    "Achieved {p}% uptime SLA for critical production systems"
]

CERTIFICATIONS = [
    "AWS Certified Solutions Architect", "Google Cloud Professional",
    "Microsoft Azure Fundamentals", "Certified Kubernetes Administrator",
    "TensorFlow Developer Certificate", "AWS Certified Developer",
    "Oracle Java Certified", "Scrum Master (CSM)", "PMP Certification",
    "Docker Certified Associate"
]

SUMMARY_TEMPLATES = [
    "Results-driven {title} with {exp} years of experience in {domain}. Proficient in {skills}. Passionate about building scalable solutions.",
    "Experienced {title} specializing in {domain} with {exp}+ years of hands-on experience. Strong background in {skills}.",
    "Dynamic {title} with {exp} years of expertise in {domain}. Skilled in {skills} with a track record of delivering high-impact projects.",
    "Detail-oriented {title} with {exp} years in {domain}. Expert in {skills}. Committed to continuous learning and innovation.",
    "Innovative {title} bringing {exp} years of experience in {domain}. Core competencies include {skills}."
]

def random_date(start_year: int, end_year: int) -> str:
    month = random.randint(1, 12)
    return f"{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month-1]} {random.randint(start_year, end_year)}"

def pick_skills(n_total: int) -> list[str]:
    skills = []
    for category, pool in SKILLS_POOL.items():
        n = random.randint(1, min(3, len(pool)))
        skills.extend(random.sample(pool, n))
    return list(set(skills))[:n_total]

def generate_achievement() -> str:
    tmpl = random.choice(ACHIEVEMENTS)
    return tmpl.format(
        p=random.randint(15, 60),
        n=random.randint(2, 20),
        a=random.randint(20, 50),
        b=random.randint(60, 95)
    )

def generate_resume(idx: int) -> dict:
    # Basic info
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"
    email = f"{first.lower()}.{last.lower()}{random.randint(1,99)}@{'gmail' if random.random()>0.3 else 'outlook'}.com"
    phone = f"+91 {random.randint(7000,9999)}{random.randint(100000,999999)}"

    # Experience level
    level = random.choices(["junior", "mid", "senior"], weights=[0.25, 0.50, 0.25])[0]
    exp_map = {"junior": (0, 2), "mid": (2, 7), "senior": (7, 18)}
    exp_years = round(random.uniform(*exp_map[level]), 1)

    # Skills
    n_skills = {"junior": 5, "mid": 10, "senior": 15}[level]
    skills = pick_skills(n_skills)

    # Job title
    title = random.choice(JOB_TITLES[level])

    # Domain based on skills
    if any(s in skills for s in ["TensorFlow", "PyTorch", "Machine Learning", "NLP"]):
        domain = "Machine Learning and AI"
    elif any(s in skills for s in ["React", "Angular", "Vue", "Next.js"]):
        domain = "Frontend Development"
    elif any(s in skills for s in ["AWS", "Docker", "Kubernetes", "Terraform"]):
        domain = "Cloud & DevOps"
    elif any(s in skills for s in ["Django", "Flask", "FastAPI", "Spring Boot"]):
        domain = "Backend Development"
    else:
        domain = "Software Engineering"

    # Summary
    summary_tmpl = random.choice(SUMMARY_TEMPLATES)
    top_skills = ", ".join(random.sample(skills, min(3, len(skills))))
    summary = summary_tmpl.format(title=title, exp=int(exp_years), domain=domain, skills=top_skills)

    # Education
    degree = random.choice(DEGREES)
    university = random.choice(UNIVERSITIES)
    grad_year = datetime.now().year - int(exp_years) - random.randint(0, 2)
    gpa = round(random.uniform(6.5, 9.8), 1)
    education = [{
        "degree": degree,
        "institution": university,
        "year": str(max(2000, grad_year)),
        "gpa": f"{gpa}/10"
    }]
    if random.random() > 0.6:
        education.append({
            "degree": random.choice([d for d in DEGREES if "M." in d or "MBA" in d or "Ph.D" in d]),
            "institution": random.choice(UNIVERSITIES),
            "year": str(max(2001, grad_year + 2)),
            "gpa": f"{round(random.uniform(7.0, 9.5), 1)}/10"
        })

    # Work experience
    work_exp = []
    companies_used = random.sample(COMPANIES, min(int(exp_years / 1.5) + 1, len(COMPANIES)))
    current_year = datetime.now().year
    year_cursor = current_year
    for i, company in enumerate(companies_used[:4]):
        duration = round(random.uniform(0.8, 3.5), 1)
        end_year = year_cursor
        start_year = int(end_year - duration)
        role_title = random.choice(JOB_TITLES[level if i == 0 else "mid"])
        achievements = [generate_achievement() for _ in range(random.randint(2, 4))]
        work_exp.append({
            "company": company,
            "title": role_title,
            "start": random_date(start_year, start_year),
            "end": "Present" if i == 0 else random_date(end_year, end_year),
            "achievements": achievements
        })
        year_cursor = start_year

    # Certifications
    certs = random.sample(CERTIFICATIONS, random.randint(0, 3)) if exp_years > 1 else []

    # Score simulation (ground truth for ML training)
    base_score = {
        "junior": random.uniform(0.30, 0.60),
        "mid": random.uniform(0.50, 0.80),
        "senior": random.uniform(0.65, 0.95)
    }[level]

    return {
        "id": idx,
        "name": name,
        "email": email,
        "phone": phone,
        "level": level,
        "experience_years": exp_years,
        "title": title,
        "domain": domain,
        "summary": summary,
        "skills": skills,
        "education": education,
        "work_experience": work_exp,
        "certifications": certs,
        "simulated_score": round(base_score + len(certs) * 0.02 + len(skills) * 0.005, 3),
        "label": "hire" if base_score > 0.6 else "reject"
    }

def generate_job_descriptions(n: int = 20) -> list[dict]:
    roles = [
        {
            "title": "Senior Python Developer",
            "required_skills": ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
            "experience_years": 4,
            "description": "We are looking for a Senior Python Developer to join our backend team. You will design and implement scalable APIs, work with cloud infrastructure, and mentor junior developers."
        },
        {
            "title": "Data Scientist",
            "required_skills": ["Python", "Machine Learning", "TensorFlow", "Pandas", "SQL"],
            "experience_years": 3,
            "description": "Seeking a Data Scientist to build predictive models and derive insights from large datasets. Experience with deep learning frameworks required."
        },
        {
            "title": "Frontend Developer",
            "required_skills": ["React", "TypeScript", "Next.js", "CSS", "REST API"],
            "experience_years": 2,
            "description": "Join our product team to build beautiful, performant web interfaces. You'll work closely with designers and backend engineers."
        },
        {
            "title": "DevOps Engineer",
            "required_skills": ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
            "experience_years": 3,
            "description": "We need a DevOps Engineer to manage our cloud infrastructure, automate deployments, and ensure system reliability."
        },
        {
            "title": "Full Stack Developer",
            "required_skills": ["React", "Node.js", "Python", "MongoDB", "Docker"],
            "experience_years": 3,
            "description": "Full stack role covering both frontend React development and Python/Node.js backend services."
        },
        {
            "title": "ML Engineer",
            "required_skills": ["Python", "PyTorch", "MLOps", "Docker", "AWS"],
            "experience_years": 3,
            "description": "Looking for an ML Engineer to productionize machine learning models and build robust ML pipelines."
        },
        {
            "title": "Junior Software Engineer",
            "required_skills": ["Python", "JavaScript", "SQL", "Git"],
            "experience_years": 0,
            "description": "Entry-level position for fresh graduates eager to learn and grow. Good problem-solving skills required."
        },
        {
            "title": "Backend Engineer – Java",
            "required_skills": ["Java", "Spring Boot", "MySQL", "Redis", "Microservices"],
            "experience_years": 4,
            "description": "Backend engineering role focused on Java microservices, high-throughput systems, and database optimization."
        }
    ]
    return [{**r, "id": i+1} for i, r in enumerate(roles)]


if __name__ == "__main__":
    print("🔄 Generating synthetic resume dataset...")

    N = 200
    resumes = [generate_resume(i+1) for i in range(N)]
    jobs = generate_job_descriptions()

    # Save JSON
    with open("dataset_resumes.json", "w") as f:
        json.dump(resumes, f, indent=2)

    with open("dataset_jobs.json", "w") as f:
        json.dump(jobs, f, indent=2)

    # Save CSV (flat format for ML training)
    csv_rows = []
    for r in resumes:
        csv_rows.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "level": r["level"],
            "experience_years": r["experience_years"],
            "title": r["title"],
            "domain": r["domain"],
            "num_skills": len(r["skills"]),
            "skills": ", ".join(r["skills"]),
            "num_certifications": len(r["certifications"]),
            "education_count": len(r["education"]),
            "simulated_score": r["simulated_score"],
            "label": r["label"]
        })

    with open("dataset_resumes.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=csv_rows[0].keys())
        writer.writeheader()
        writer.writerows(csv_rows)

    # Stats
    hire = sum(1 for r in resumes if r["label"] == "hire")
    reject = N - hire
    print(f"\n✅ Dataset generated successfully!")
    print(f"   📄 {N} resumes  →  dataset_resumes.json + dataset_resumes.csv")
    print(f"   💼 {len(jobs)} job descriptions  →  dataset_jobs.json")
    print(f"   🏷️  Labels: {hire} hire / {reject} reject")
    print(f"\n   Levels: Junior={sum(1 for r in resumes if r['level']=='junior')} | "
          f"Mid={sum(1 for r in resumes if r['level']=='mid')} | "
          f"Senior={sum(1 for r in resumes if r['level']=='senior')}")
