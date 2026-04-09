import pandas as pd

# Load dataset with encoding fix
df = pd.read_csv("datasets/resume_data.csv", encoding="utf-8")

# Clean column names
df.columns = df.columns.str.replace("ï»¿", "")
df.columns = df.columns.str.strip()

# Print columns once (for debugging)
print("Dataset Columns:", df.columns)

# Keep only required columns
df = df[[
    "job_position_name",
    "skills_required"
]]

# Remove empty rows
df = df.dropna()

def get_jobs():
    return df