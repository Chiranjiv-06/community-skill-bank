from fastapi import FastAPI

app = FastAPI(
    title="Community Skill Bank API",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "Community Skill Bank API Running"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }