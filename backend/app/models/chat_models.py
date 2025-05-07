from pydantic import BaseModel
from typing import List, Dict, Any, Optional # Adjusted import

class ChatRequest(BaseModel):
    message: str
    # Could potentially send hisotry here later, kinda like below
    # history: Optional[List[Dict[str, Any]]] = None 