from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio

router = APIRouter()

async def fake_stream_generator():
    for i in range(10):
        yield f"data: Message chunk {i}\n\n" # SSE format
        await asyncio.sleep(0.5)

@router.post("/chat/stream")
async def stream_chat():
    return StreamingResponse(fake_stream_generator(), media_type="text/event-stream")

# TODO:
# - Add Pydantic model for request body (e.g., user message)
# - Implement actual logic to call the inference service
# - Handle potential errors from the inference service 