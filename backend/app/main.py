from fastapi import FastAPI

app = FastAPI(title="DataCaliper Training API")


@app.get("/")
def root():
    return {"message": "DataCaliper Training API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}