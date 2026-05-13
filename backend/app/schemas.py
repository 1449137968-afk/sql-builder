from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ===== 字段分类 =====
class CategoryCreate(BaseModel):
    name: str
    table_name: str = ""


class CategoryResponse(BaseModel):
    id: int
    name: str
    table_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ===== 字段 =====
class FieldCreate(BaseModel):
    category_id: int
    field_name: str
    field_type: str = ""
    description: str = ""
    enum_values: Optional[str] = None
    is_dimension: bool = True
    is_measure: bool = False


class FieldUpdate(BaseModel):
    category_id: Optional[int] = None
    field_name: Optional[str] = None
    field_type: Optional[str] = None
    description: Optional[str] = None
    enum_values: Optional[str] = None
    is_dimension: Optional[bool] = None
    is_measure: Optional[bool] = None


class FieldResponse(BaseModel):
    id: int
    category_id: int
    field_name: str
    field_type: str
    description: str
    enum_values: Optional[str] = None
    is_dimension: bool
    is_measure: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ===== 字段解析 =====
class ParseRequest(BaseModel):
    text: str
    category_name: str = "默认分类"
    table_name: str = ""


class ParsedField(BaseModel):
    field_name: str
    field_type: str
    description: str
    enum_values: Optional[str] = None
    is_dimension: bool
    is_measure: bool


class ParseResponse(BaseModel):
    category_name: str
    table_name: str
    fields: list[ParsedField]


# ===== SQL 生成 =====
class Measure(BaseModel):
    field: str
    agg_func: str = "COUNT"  # COUNT, SUM, AVG, MAX, MIN


class Filter(BaseModel):
    field: str
    operator: str = "="  # =, !=, >, <, >=, <=, LIKE, IN, BETWEEN
    value: str = ""


class OrderBy(BaseModel):
    field: str
    direction: str = "ASC"  # ASC, DESC


class GenerateRequest(BaseModel):
    dimensions: list[str] = []
    measures: list[Measure] = []
    filters: list[Filter] = []
    order_by: list[OrderBy] = []
    limit: Optional[int] = None
    tables: list[str] = []
    natural_prompt: str = ""


class GenerateResponse(BaseModel):
    sql: str


# ===== 应用设置 =====
class SettingsUpdate(BaseModel):
    api_base_url: str = "https://api.openai.com/v1"
    api_key: str = ""
    model: str = "gpt-3.5-turbo"


class SettingsResponse(BaseModel):
    id: int
    api_base_url: str
    api_key: str
    model: str

    model_config = {"from_attributes": True}


# ===== 通用 =====
class MessageResponse(BaseModel):
    message: str
