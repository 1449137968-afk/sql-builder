import json
import re
from openai import OpenAI
from app.models import FieldCategory, Field, AppSettings
from app.schemas import GenerateRequest
from sqlalchemy.orm import Session


def get_settings(db: Session) -> AppSettings:
    settings = db.query(AppSettings).filter(AppSettings.id == 1).first()
    if not settings:
        settings = AppSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def build_table_schema_text(db: Session, tables: list[str] | None = None) -> str:
    """构建表结构文本给 LLM"""
    query = db.query(FieldCategory)

    if tables:
        # 通过 table_name 或包含的字段来匹配
        pass

    categories = query.all()
    parts = []

    for cat in categories:
        fields = db.query(Field).filter(Field.category_id == cat.id).all()
        if not fields:
            continue

        table_info = f"## 表: {cat.name}"
        if cat.table_name:
            table_info += f" ({cat.table_name})"
        parts.append(table_info)
        parts.append("| 字段名 | 类型 | 说明 | 枚举值 |")
        parts.append("|--------|------|------|--------|")

        for f in fields:
            enum_display = ""
            if f.enum_values:
                try:
                    enum_list = json.loads(f.enum_values)
                    enum_display = ", ".join(enum_list)
                except (json.JSONDecodeError, TypeError):
                    enum_display = str(f.enum_values)

            parts.append(f"| {f.field_name} | {f.field_type} | {f.description} | {enum_display} |")

        parts.append("")

    return "\n".join(parts)


def generate_sql(db: Session, request: GenerateRequest) -> str:
    """调用 LLM 生成 SQL"""
    settings = get_settings(db)

    if not settings.api_key:
        raise ValueError("请先在设置中配置 API Key")

    client = OpenAI(
        api_key=settings.api_key,
        base_url=settings.api_base_url,
    )

    schema_text = build_table_schema_text(db, request.tables)

    # 构建用户 prompt
    user_parts = ["根据以下表信息生成 MySQL SQL 查询语句：", ""]

    if request.dimensions:
        user_parts.append(f"- 维度（GROUP BY）：{', '.join(request.dimensions)}")

    if request.measures:
        measure_strs = [f"{m.agg_func}({m.field})" for m in request.measures]
        user_parts.append(f"- 指标（聚合）：{', '.join(measure_strs)}")

    if request.filters:
        filter_strs = [f"{f.field} {f.operator} {f.value}" for f in request.filters]
        user_parts.append(f"- 筛选条件：{' AND '.join(filter_strs)}")

    if request.order_by:
        order_strs = [f"{o.field} {o.direction}" for o in request.order_by]
        user_parts.append(f"- 排序：{', '.join(order_strs)}")

    if request.limit:
        user_parts.append(f"- 限制行数：{request.limit}")

    if request.tables:
        user_parts.append(f"- 涉及的表：{', '.join(request.tables)}")

    if request.natural_prompt:
        user_parts.append(f"- 额外说明：{request.natural_prompt}")

    user_prompt = "\n".join(user_parts)

    system_prompt = (
        "你是一个 MySQL SQL 专家。根据提供的表结构和查询要求，生成正确的 MySQL SQL 语句。\n\n"
        "规则：\n"
        "1. 只返回 SQL 语句，不要任何解释或 markdown 代码块标记\n"
        "2. 使用标准 MySQL 语法\n"
        "3. 表名和字段名用反引号 ` 包裹\n"
        "4. 字符串值用单引号包裹\n"
        "5. 如果涉及多表查询，使用合适的 JOIN\n"
        "6. 确保 GROUP BY 包含所有非聚合字段\n"
        "7. 对于模糊匹配使用 LIKE，对于多个值使用 IN"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"{schema_text}\n\n{user_prompt}"},
    ]

    response = client.chat.completions.create(
        model=settings.model,
        messages=messages,
        temperature=0.1,
    )

    sql = response.choices[0].message.content.strip()

    # 清除可能的 markdown 代码块标记
    if sql.startswith("```"):
        sql = re.sub(r'^```\w*\n?', '', sql)
        sql = re.sub(r'\n?```$', '', sql)

    return sql

