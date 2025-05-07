from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.endpoints import chat # Import the chat router

app = FastAPI()

# Add CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(chat.router, prefix="/api") # Include the chat router

@app.get("/")
async def root():
    return {"message": "Hello World"}

# TODO: Include routers from app.endpoints
