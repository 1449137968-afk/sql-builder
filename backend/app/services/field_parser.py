import re
import json
from app.schemas import ParsedField


def parse_fields(text: str) -> list[ParsedField]:
    """解析自然语言字段描述，支持多种格式"""
    text = text.strip()
    if not text:
        return []

    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # 检测格式
    if _is_ddl_format(lines):
        return _parse_ddl(lines)
    elif _is_table_format(lines):
        return _parse_table(lines)
    else:
        return _parse_simple(lines)


def extract_enum_values(description: str) -> tuple[str, str | None]:
    """从描述中提取枚举值，返回 (清理后的描述, enum_json)"""
    patterns = [
        r'(\d+[-=]\S+[\s,，]+)+\d+[-=]\S+',
        r'枚举值?[：:]\s*(.+)',
        r'取值[：:]\s*(.+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, description)
        if match:
            enum_text = match.group(0)
            if '枚举' in enum_text or '取值' in enum_text:
                enum_text = match.group(1)

            # 解析如 "0-未知 1-男 2-女"
            items = re.findall(r'(\d+)[-=](\S+)', enum_text)
            if items:
                enum_list = [f"{k}-{v}" for k, v in items]
                clean_desc = description.replace(match.group(0), "").strip().rstrip("，,。.")
                return clean_desc, json.dumps(enum_list, ensure_ascii=False)

    return description, None


def _is_ddl_format(lines: list[str]) -> bool:
    first = lines[0].strip().upper()
    return bool(re.match(r'^\s*`?\w+`?\s+(INT|VARCHAR|BIGINT|TEXT|DATE|DATETIME|DECIMAL|FLOAT|BOOL|TINYINT|CHAR)', first))


def _is_table_format(lines: list[str]) -> bool:
    first = lines[0]
    return '\t' in first or ('  ' in first and len(first.split()) >= 2)


def _parse_ddl(lines: list[str]) -> list[ParsedField]:
    """解析 DDL 格式: user_id int(11) NOT NULL COMMENT '用户ID'"""
    fields = []
    for line in lines:
        # 提取字段名
        name_match = re.match(r'`?(\w+)`?\s+', line)
        if not name_match:
            continue
        field_name = name_match.group(1)

        # 提取类型
        type_match = re.search(r'`?\w+`?\s+(\w+(\([\d,]+\))?)', line, re.IGNORECASE)
        field_type = type_match.group(1) if type_match else ""

        # 提取 COMMENT（支持单引号和双引号）
        comment_match = re.search(r"COMMENT\s+['\"]([^'\"]*)['\"]", line, re.IGNORECASE)
        description = comment_match.group(1) if comment_match else ""

        # 提取枚举值
        description, enum_values = extract_enum_values(description)

        # 判断维度和指标
        is_dimension = _is_dimension_field(field_name, field_type)
        is_measure = _is_measure_field(field_name, field_type)

        fields.append(ParsedField(
            field_name=field_name,
            field_type=field_type,
            description=description,
            enum_values=enum_values,
            is_dimension=is_dimension,
            is_measure=is_measure,
        ))

    return fields


def _parse_table(lines: list[str]) -> list[ParsedField]:
    """解析表格格式: 制表符或空格分隔"""
    fields = []
    # 检测分隔符
    sep = '\t' if '\t' in lines[0] else None

    for line in lines:
        if sep:
            parts = line.split(sep)
        else:
            parts = line.split()

        if len(parts) < 2:
            continue

        field_name = parts[0].strip().strip('`')
        # 判断第二列是类型还是描述
        if re.match(r'^(int|varchar|bigint|text|date|datetime|decimal|float|bool|tinyint|char)', parts[1], re.IGNORECASE):
            field_type = parts[1]
            description = parts[2] if len(parts) > 2 else ""
        else:
            field_type = ""
            description = " ".join(parts[1:])

        description, enum_values = extract_enum_values(description)
        is_dimension = _is_dimension_field(field_name, field_type)
        is_measure = _is_measure_field(field_name, field_type)

        fields.append(ParsedField(
            field_name=field_name,
            field_type=field_type,
            description=description,
            enum_values=enum_values,
            is_dimension=is_dimension,
            is_measure=is_measure,
        ))

    return fields


def _parse_simple(lines: list[str]) -> list[ParsedField]:
    """解析简单格式: 字段名 - 说明 或 字段名：说明"""
    fields = []
    for line in lines:
        # 尝试用 - 或 ： 或 , 或空格分割
        parts = re.split(r'\s*[-：:]\s*', line, maxsplit=1)
        if len(parts) >= 2:
            field_name = parts[0].strip().strip('`')
            rest = parts[1].strip()
        else:
            field_name = line.strip().strip('`')
            rest = ""

        # 尝试从 rest 中提取类型
        type_match = re.match(r'^(int|varchar|bigint|text|date|datetime|decimal|float|bool|tinyint|char)\b', rest, re.IGNORECASE)
        if type_match:
            field_type = type_match.group(1)
            description = rest[len(field_type):].strip().lstrip("-：: ,")
        else:
            field_type = ""
            description = rest

        description, enum_values = extract_enum_values(description)
        is_dimension = _is_dimension_field(field_name, field_type)
        is_measure = _is_measure_field(field_name, field_type)

        fields.append(ParsedField(
            field_name=field_name,
            field_type=field_type,
            description=description,
            enum_values=enum_values,
            is_dimension=is_dimension,
            is_measure=is_measure,
        ))

    return fields


def _is_dimension_field(name: str, field_type: str) -> bool:
    """判断是否为维度字段"""
    type_upper = field_type.upper()
    # 字符串和日期类型通常是维度
    if any(t in type_upper for t in ['VARCHAR', 'CHAR', 'TEXT', 'DATE', 'DATETIME', 'TIME']):
        return True
    # ID类字段通常是维度
    if name.lower().endswith('_id') or name.lower().endswith('id'):
        return True
    if 'name' in name.lower() or 'type' in name.lower() or 'status' in name.lower():
        return True
    return False


def _is_measure_field(name: str, field_type: str) -> bool:
    """判断是否为指标字段"""
    type_upper = field_type.upper()
    # 数值类型通常是指标
    if any(t in type_upper for t in ['INT', 'BIGINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'TINYINT']):
        # 但不是ID类
        if not name.lower().endswith('_id') and not name.lower().endswith('id'):
            return True
    # 金额、数量类字段
    measure_keywords = ['amount', 'price', 'count', 'num', 'total', 'sum', 'fee', 'cost', 'revenue']
    if any(kw in name.lower() for kw in measure_keywords):
        return True
    return False
