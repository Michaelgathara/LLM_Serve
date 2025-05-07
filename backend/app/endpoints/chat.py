from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
from app.models.chat_models import ChatRequest

router = APIRouter()

async def fake_stream_generator(user_message: str):
    yield f"data: You said: {user_message}\n\n"
    await asyncio.sleep(0.5)
    for i in range(5):
        yield f"data: Message chunk {i} for '{user_message[:30]}...'\n\n"
        await asyncio.sleep(0.5)

@router.post("/chat/stream")
async def stream_chat(request: ChatRequest):
    return StreamingResponse(fake_stream_generator(request.message), media_type="text/event-stream")

# TODO:
# - Add Pydantic model for request body (e.g., user message)
# - Implement actual logic to call the inference service
# - Handle potential errors from the inference service 