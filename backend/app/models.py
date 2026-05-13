from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class FieldCategory(Base):
    __tablename__ = "field_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, comment="分类名，如 用户表-users")
    table_name = Column(String(255), default="", comment="数据库表名")
    created_at = Column(DateTime, default=func.now())

    fields = relationship("Field", back_populates="category", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("field_categories.id"), nullable=False)
    field_name = Column(String(255), nullable=False, comment="字段名")
    field_type = Column(String(100), default="", comment="字段类型")
    description = Column(Text, default="", comment="字段描述/注释")
    enum_values = Column(Text, nullable=True, comment="枚举值JSON数组")
    is_dimension = Column(Boolean, default=True, comment="是否为维度")
    is_measure = Column(Boolean, default=False, comment="是否为指标")
    created_at = Column(DateTime, default=func.now())

    category = relationship("FieldCategory", back_populates="fields")


class MetricTemplate(Base):
    __tablename__ = "metric_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, comment="模板名称")
    description = Column(Text, default="", comment="模板说明")
    prompt_template = Column(Text, default="", comment="提示词模板")
    category = Column(String(100), default="通用", comment="模板分类")
    created_at = Column(DateTime, default=func.now())


class QueryHistory(Base):
    __tablename__ = "query_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    selections = Column(Text, default="{}", comment="用户选择的JSON")
    generated_sql = Column(Text, default="", comment="生成的SQL")
    created_at = Column(DateTime, default=func.now())


class AppSettings(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, default=1)
    api_base_url = Column(String(500), default="https://api.openai.com/v1")
    api_key = Column(String(500), default="")
    model = Column(String(100), default="gpt-3.5-turbo")
