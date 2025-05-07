from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

# TODO: Add CORSMiddleware for Next.js frontend
# TODO: Include routers from app.endpoints
