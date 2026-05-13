import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import QueryHistory
from app.schemas import GenerateRequest, GenerateResponse
from app.services.llm_service import generate_sql

router = APIRouter(prefix="/api/query", tags=["query"])


@router.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest, db: Session = Depends(get_db)):
    try:
        sql = generate_sql(db, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL 生成失败: {str(e)}")

    # 保存历史
    history = QueryHistory(
        selections=json.dumps(request.model_dump(), ensure_ascii=False),
        generated_sql=sql,
    )
    db.add(history)
    db.commit()

    return GenerateResponse(sql=sql)


@router.get("/history")
def get_history(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    total = db.query(QueryHistory).count()
    items = (
        db.query(QueryHistory)
        .order_by(QueryHistory.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": item.id,
                "selections": item.selections,
                "generated_sql": item.generated_sql,
                "created_at": item.created_at.isoformat(),
            }
            for item in items
        ],
    }
