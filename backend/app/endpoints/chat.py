from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.models.chat_models import ChatRequest
from app.services.chat_service import ChatService, get_chat_service

router = APIRouter()

@router.post("/chat/stream")
async def stream_chat(
    request: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service)
):
    return StreamingResponse(
        chat_service.generate_response_stream(request.message), 
        media_type="text/event-stream"
    )

# TODO:
# - Add Pydantic model for request body (e.g., user message)
# - Implement actual logic to call the inference service (now within ChatService)
# - Handle potential errors from the inference service (now within ChatService) 