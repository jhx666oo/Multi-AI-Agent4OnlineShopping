# 15｜LLM 选型指南：模型、成本与调用策略

> 本文档给出具体的 LLM 选型建议，包括模型选择、成本控制、调用策略与 fallback 机制。

---

## 一、选型原则

1. **分层使用**：不同任务用不同模型（成本 vs 能力平衡）
2. **工具优先**：可验证事实必须来自工具，LLM 只做"编排/解释/判断"
3. **可替换**：抽象 LLM 调用层，便于切换模型
4. **成本可控**：设置 token 预算，监控成本

---

## 二、模型选型（推荐）

### 2.1 按任务分层

| 任务 | 推荐模型 | 备选 | 理由 |
|------|----------|------|------|
| **Orchestrator / Planner** | GPT-4o-mini | Claude 3.5 Haiku, Gemini 1.5 Flash | 任务拆解/路由，不需要最强推理 |
| **Intent 解析** | GPT-4o-mini | Claude 3.5 Haiku | 结构化输出，Pydantic 友好 |
| **Candidate 筛选** | GPT-4o-mini | Gemini 1.5 Flash | 简单打分/过滤 |
| **深度核验 / 对比** | GPT-4o | Claude 3.5 Sonnet | 长上下文、复杂推理 |
| **Compliance 判断** | GPT-4o | Claude 3.5 Sonnet | 需要理解规则+商品属性 |
| **解释生成** | GPT-4o-mini | Claude 3.5 Haiku | 最终输出给用户 |

### 2.2 向量嵌入

| 用途 | 推荐模型 | 维度 | 成本 |
|------|----------|------|------|
| 证据检索 | **text-embedding-3-small** | 1536 | $0.02/1M tokens |
| 高精度（可选） | text-embedding-3-large | 3072 | $0.13/1M tokens |
| 私有化 | BGE-M3 / E5-large-v2 | 1024 | 自建 |

### 2.3 私有化部署（可选）

| 场景 | 推荐模型 | 说明 |
|------|----------|------|
| 数据合规要求 | **Qwen2.5-72B-Instruct** | 中文友好、性能强 |
| 成本敏感 | **DeepSeek-V3** | 性价比极高 |
| 英文为主 | LLaMA 3.1 70B | 开源生态好 |

---

## 三、成本估算

### 3.1 模型定价（2024.12 参考）

| 模型 | 输入 | 输出 | 上下文窗口 |
|------|------|------|------------|
| GPT-4o-mini | $0.15/1M | $0.60/1M | 128K |
| GPT-4o | $2.50/1M | $10.00/1M | 128K |
| Claude 3.5 Haiku | $0.25/1M | $1.25/1M | 200K |
| Claude 3.5 Sonnet | $3.00/1M | $15.00/1M | 200K |
| Gemini 1.5 Flash | $0.075/1M | $0.30/1M | 1M |

### 3.2 单次 Draft Order 成本估算

假设一次完整的 Draft Order 流程：

| 阶段 | 模型 | 输入 tokens | 输出 tokens | 成本 |
|------|------|-------------|-------------|------|
| Intent 解析 | GPT-4o-mini | 500 | 200 | $0.0002 |
| Candidate 筛选 | GPT-4o-mini | 5,000 | 500 | $0.001 |
| 深度核验 (10个) | GPT-4o | 20,000 | 2,000 | $0.07 |
| 方案生成 | GPT-4o-mini | 3,000 | 1,000 | $0.001 |
| 解释输出 | GPT-4o-mini | 2,000 | 500 | $0.0005 |
| **合计** | - | ~30,000 | ~4,000 | **~$0.08** |

**预估**：单次 Draft Order LLM 成本约 **$0.05 - $0.15**

### 3.3 月度成本预估

| 日订单量 | 月订单量 | LLM 成本/月 | 向量检索/月 |
|----------|----------|-------------|-------------|
| 100 | 3,000 | $240 - $450 | $10 |
| 1,000 | 30,000 | $2,400 - $4,500 | $100 |
| 10,000 | 300,000 | $24,000 - $45,000 | $1,000 |

---

## 四、调用策略

### 4.1 Token 预算管理

```python
# agents/src/orchestrator/budget.py

from pydantic import BaseModel

class TokenBudget(BaseModel):
    """单次任务的 token 预算"""
    intent_parsing: int = 1000
    candidate_screening: int = 10000
    deep_verification: int = 30000  # 最大头
    explanation: int = 5000
    
    total_limit: int = 50000
    cost_limit_usd: float = 0.20

class BudgetTracker:
    def __init__(self, budget: TokenBudget):
        self.budget = budget
        self.used = 0
        self.cost = 0.0
    
    def can_spend(self, tokens: int, model: str) -> bool:
        projected = self.used + tokens
        return projected <= self.budget.total_limit
    
    def record(self, tokens: int, cost: float):
        self.used += tokens
        self.cost += cost
```

### 4.2 模型路由

```python
# agents/src/tools/llm_router.py

from enum import Enum
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

class TaskType(Enum):
    INTENT_PARSING = "intent_parsing"
    CANDIDATE_SCREENING = "candidate_screening"
    DEEP_VERIFICATION = "deep_verification"
    COMPLIANCE_CHECK = "compliance_check"
    EXPLANATION = "explanation"

MODEL_ROUTING = {
    TaskType.INTENT_PARSING: "gpt-4o-mini",
    TaskType.CANDIDATE_SCREENING: "gpt-4o-mini",
    TaskType.DEEP_VERIFICATION: "gpt-4o",
    TaskType.COMPLIANCE_CHECK: "gpt-4o",
    TaskType.EXPLANATION: "gpt-4o-mini",
}

def get_llm(task: TaskType):
    model = MODEL_ROUTING[task]
    if model.startswith("gpt"):
        return ChatOpenAI(model=model)
    elif model.startswith("claude"):
        return ChatAnthropic(model=model)
```

### 4.3 Fallback 机制

```python
# 主模型失败时自动降级

FALLBACK_CHAIN = {
    "gpt-4o": ["claude-3-5-sonnet-latest", "gpt-4o-mini"],
    "gpt-4o-mini": ["claude-3-5-haiku-latest", "gemini-1.5-flash"],
    "claude-3-5-sonnet-latest": ["gpt-4o", "claude-3-5-haiku-latest"],
}

async def call_with_fallback(prompt: str, primary_model: str):
    models = [primary_model] + FALLBACK_CHAIN.get(primary_model, [])
    
    for model in models:
        try:
            return await call_llm(model, prompt)
        except (RateLimitError, TimeoutError) as e:
            logger.warning(f"{model} failed: {e}, trying fallback")
            continue
    
    raise AllModelsFailed("All models failed")
```

---

## 五、Prompt 管理

### 5.1 结构化输出（推荐）

```python
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate

class MissionSpec(BaseModel):
    """采购委托结构化输出"""
    destination_country: str
    budget_amount: float
    budget_currency: str
    arrival_deadline: str | None
    hard_constraints: list[str]
    soft_preferences: list[str]

# 使用 with_structured_output
llm = ChatOpenAI(model="gpt-4o-mini")
structured_llm = llm.with_structured_output(MissionSpec)

result: MissionSpec = structured_llm.invoke(prompt)
```

### 5.2 Prompt 版本化

```
prompts/
├── intent/
│   ├── v1.0.0.txt
│   └── v1.1.0.txt
├── verification/
│   └── v1.0.0.txt
└── explanation/
    └── v1.0.0.txt
```

---

## 六、监控与告警

### 6.1 关键指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| `llm.tokens.total` | 总 token 消耗 | 日预算 80% |
| `llm.cost.usd` | 总成本 | 日预算 80% |
| `llm.latency.p99` | P99 延迟 | > 10s |
| `llm.error.rate` | 错误率 | > 5% |
| `llm.fallback.rate` | 降级率 | > 10% |

### 6.2 成本可视化

```python
# 记录每次调用的成本
from opentelemetry import metrics

meter = metrics.get_meter("llm")
token_counter = meter.create_counter("llm.tokens")
cost_counter = meter.create_counter("llm.cost.usd")

def record_llm_call(model: str, input_tokens: int, output_tokens: int, cost: float):
    token_counter.add(input_tokens + output_tokens, {"model": model})
    cost_counter.add(cost, {"model": model})
```

---

## 七、与框架集成（LangGraph）

```python
# agents/src/graph/nodes.py

from langgraph.graph import StateGraph
from langchain_openai import ChatOpenAI

# 不同节点使用不同模型
def intent_node(state):
    llm = ChatOpenAI(model="gpt-4o-mini")
    # ...

def verification_node(state):
    llm = ChatOpenAI(model="gpt-4o")  # 需要更强推理
    # ...

# 构建图
graph = StateGraph(AgentState)
graph.add_node("intent", intent_node)
graph.add_node("verification", verification_node)
```

---

## 八、总结

| 方面 | 建议 |
|------|------|
| 主力模型 | GPT-4o-mini（编排）+ GPT-4o（核验） |
| 向量嵌入 | text-embedding-3-small |
| 成本控制 | 分层使用 + token 预算 + 监控告警 |
| 可靠性 | Fallback 链 + 超时重试 |
| 结构化输出 | Pydantic + with_structured_output |

