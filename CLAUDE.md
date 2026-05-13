# SQL 点选式生成器

## 项目概述
一个 Web 工具，产品经理通过点选字段的方式，结合大模型 API 自动生成 MySQL SQL 语句。字段元数据以自然语言形式从数据库表结构复制粘贴导入。

## 启动命令

```bash
# 后端 (Python FastAPI, 端口 8000)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 前端 (React + Vite, 端口 5173)
cd frontend
npx vite --host 0.0.0.0 --port 5173
```

启动后打开 http://localhost:5173 访问。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 18 + TypeScript + Vite |
| UI 库 | Ant Design 5 (中文) + Tailwind CSS |
| 后端 | Python 3 + FastAPI |
| 数据库 | SQLite (本地文件 `backend/sql_builder.db`) |
| ORM | SQLAlchemy |
| LLM | OpenAI 兼容接口 (openai Python SDK) |

## 项目结构

```
SQL/
├── backend/
│   ├── main.py                    # FastAPI 入口，CORS，路由注册
│   ├── requirements.txt
│   └── app/
│       ├── database.py            # SQLite 连接 & 建表
│       ├── models.py              # 表: field_categories, fields, metric_templates, query_history, app_settings
│       ├── schemas.py             # Pydantic 模型
│       ├── routers/
│       │   ├── fields.py          # 字段 CRUD + 解析 API (/api/fields)
│       │   ├── query.py           # SQL 生成 + 历史 API (/api/query)
│       │   └── settings.py        # 配置 + 测试 API (/api/settings)
│       └── services/
│           ├── field_parser.py    # 自然语言字段解析 (DDL/表格/列表)
│           └── llm_service.py     # LLM 调用 & prompt 构建
├── frontend/
│   ├── vite.config.ts             # 含 /api 代理到 localhost:8000
│   └── src/
│       ├── api/index.ts           # Axios 封装
│       ├── types/index.ts         # TS 类型定义
│       ├── pages/
│       │   ├── BuilderPage.tsx    # 主页面: 三栏 SQL 构建器
│       │   ├── FieldsPage.tsx     # 字段管理: 粘贴解析 + CRUD
│       │   └── SettingsPage.tsx   # API 配置: URL/Key/Model + 连接测试
│       └── components/
│           ├── Layout.tsx         # 顶部导航 (构建器/字段管理/设置)
│           ├── FieldSelector.tsx  # 左侧字段搜索 & 分类树
│           ├── MetricSelector.tsx # 维度/指标/排序配置
│           ├── FilterBuilder.tsx  # WHERE 条件构建 (枚举值联动)
│           └── SQLPreview.tsx     # SQL 展示 + 复制
```

## 使用流程

1. **设置页** `/settings` — 配置 OpenAI 兼容 API (URL/Key/Model)，测试连接
2. **字段管理** `/fields` — 粘贴表结构文本，支持三种格式:
   - DDL: `user_id int(11) NOT NULL COMMENT "用户ID"`
   - 制表符分隔: `user_id\tint\t用户ID`
   - 简单列表: `user_id - 用户ID`
3. **构建器** `/` — 左侧选字段 → 中间配维度/指标/筛选/排序 → 生成 SQL → 右侧复制

## 数据库表结构

- `app_settings` — 单行配置 (api_base_url, api_key, model)
- `field_categories` — 字段分类 (name, table_name)
- `fields` — 字段明细 (field_name, field_type, description, enum_values JSON, is_dimension, is_measure)
- `metric_templates` — 快速指标模板
- `query_history` — 查询历史 (selections JSON, generated_sql)

## 关键设计决策

- API Key 明文存储在本地 SQLite，仅单用户使用
- 字段解析自动判断维度(varchar/date/id) vs 指标(int/decimal/amount)，用户可手动调整
- 枚举值格式 `0-未知 1-男 2-女` 自动提取为 JSON `["0-未知","1-男","2-女"]`
- 有枚举值的字段在筛选器中自动展示下拉选项
- LLM prompt 包含完整表结构上下文 + MySQL 语法规则，temperature=0.1
