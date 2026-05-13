import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import FieldCategory, Field
from app.schemas import (
    CategoryCreate, CategoryResponse,
    FieldCreate, FieldUpdate, FieldResponse,
    ParseRequest, ParseResponse,
    MessageResponse,
)
from app.services.field_parser import parse_fields

router = APIRouter(prefix="/api/fields", tags=["fields"])


# ===== 分类管理 =====
@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(FieldCategory).order_by(FieldCategory.id).all()


@router.post("/categories", response_model=CategoryResponse)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    cat = FieldCategory(name=data.name, table_name=data.table_name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


# ===== 字段解析 =====
@router.post("/parse", response_model=ParseResponse)
def parse_field_text(data: ParseRequest, db: Session = Depends(get_db)):
    """解析自然语言字段文本并保存"""
    parsed = parse_fields(data.text)
    if not parsed:
        raise HTTPException(status_code=400, detail="未能解析出任何字段")

    # 创建分类
    cat = FieldCategory(name=data.category_name, table_name=data.table_name)
    db.add(cat)
    db.flush()

    for f in parsed:
        field = Field(
            category_id=cat.id,
            field_name=f.field_name,
            field_type=f.field_type,
            description=f.description,
            enum_values=f.enum_values,
            is_dimension=f.is_dimension,
            is_measure=f.is_measure,
        )
        db.add(field)

    db.commit()
    db.refresh(cat)

    return ParseResponse(
        category_name=cat.name,
        table_name=cat.table_name or "",
        fields=parsed,
    )


# ===== 字段 CRUD =====
@router.get("", response_model=list[FieldResponse])
def list_fields(
    category_id: int | None = None,
    search: str = "",
    db: Session = Depends(get_db),
):
    query = db.query(Field)
    if category_id:
        query = query.filter(Field.category_id == category_id)
    if search:
        query = query.filter(
            Field.field_name.contains(search) | Field.description.contains(search)
        )
    return query.order_by(Field.id).all()


@router.post("", response_model=FieldResponse)
def create_field(data: FieldCreate, db: Session = Depends(get_db)):
    field = Field(**data.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.put("/{field_id}", response_model=FieldResponse)
def update_field(field_id: int, data: FieldUpdate, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="字段不存在")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(field, key, val)
    db.commit()
    db.refresh(field)
    return field


@router.delete("/{field_id}", response_model=MessageResponse)
def delete_field(field_id: int, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="字段不存在")
    db.delete(field)
    db.commit()
    return MessageResponse(message="删除成功")


@router.delete("/categories/{cat_id}", response_model=MessageResponse)
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(FieldCategory).filter(FieldCategory.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="分类不存在")
    db.delete(cat)
    db.commit()
    return MessageResponse(message="删除成功")
