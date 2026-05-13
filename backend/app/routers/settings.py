from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import SettingsUpdate, SettingsResponse, MessageResponse
from app.services.llm_service import get_settings
from openai import OpenAI

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def read_settings(db: Session = Depends(get_db)):
    return get_settings(db)


@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    settings = get_settings(db)
    settings.api_base_url = data.api_base_url
    settings.api_key = data.api_key
    settings.model = data.model
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/test", response_model=MessageResponse)
def test_connection(db: Session = Depends(get_db)):
    """测试 API 连接"""
    settings = get_settings(db)
    if not settings.api_key:
        return MessageResponse(message="请先配置 API Key")

    try:
        client = OpenAI(
            api_key=settings.api_key,
            base_url=settings.api_base_url,
        )
        client.models.list()
        return MessageResponse(message="连接成功")
    except Exception as e:
        return MessageResponse(message=f"连接失败: {str(e)}")
