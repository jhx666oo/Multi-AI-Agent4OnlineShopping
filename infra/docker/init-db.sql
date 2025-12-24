-- 初始化数据库脚本
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 启用 uuid-ossp 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 schema
CREATE SCHEMA IF NOT EXISTS agent;

-- ========================================
-- 用户与身份
-- ========================================
CREATE TABLE IF NOT EXISTS agent.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    locale VARCHAR(10) DEFAULT 'en-US',
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    risk_tier VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent.user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES agent.users(id),
    label VARCHAR(100),
    country VARCHAR(2) NOT NULL,
    state VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    address_line1 VARCHAR(500),
    address_line2 VARCHAR(500),
    phone VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES agent.users(id) UNIQUE,
    hard_constraints JSONB DEFAULT '[]',
    soft_preferences JSONB DEFAULT '[]',
    brand_blacklist JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- Mission（采购委托）
-- ========================================
CREATE TABLE IF NOT EXISTS agent.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES agent.users(id),
    session_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'created',
    destination_country VARCHAR(2),
    budget_amount DECIMAL(12,2),
    budget_currency VARCHAR(3) DEFAULT 'USD',
    arrival_deadline DATE,
    hard_constraints JSONB DEFAULT '[]',
    soft_preferences JSONB DEFAULT '[]',
    objective_weights JSONB DEFAULT '{"price": 0.4, "speed": 0.3, "risk": 0.3}',
    raw_query TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- AROC（AI-Ready Offer Card）
-- ========================================
CREATE TABLE IF NOT EXISTS agent.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id VARCHAR(255) UNIQUE NOT NULL,
    spu_id VARCHAR(255),
    merchant_id VARCHAR(255),
    category_id VARCHAR(255),
    category_path JSONB,
    titles JSONB NOT NULL,
    brand JSONB,
    attributes JSONB DEFAULT '[]',
    risk_profile JSONB,
    policies JSONB,
    media_refs JSONB,
    version_hash VARCHAR(64),
    source VARCHAR(50) DEFAULT 'merchant_feed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent.skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id VARCHAR(255) UNIQUE NOT NULL,
    offer_id VARCHAR(255) REFERENCES agent.offers(offer_id),
    options JSONB DEFAULT '{}',
    packaging JSONB,
    risk_tags JSONB DEFAULT '[]',
    compliance_tags JSONB DEFAULT '[]',
    barcodes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 合规规则
-- ========================================
CREATE TABLE IF NOT EXISTS agent.compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR(255) UNIQUE NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    applies_to JSONB NOT NULL,
    condition JSONB NOT NULL,
    action VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'block',
    message_template JSONB,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 购物车与草稿订单
-- ========================================
CREATE TABLE IF NOT EXISTS agent.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES agent.users(id),
    session_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS agent.draft_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_order_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES agent.users(id),
    cart_id VARCHAR(255) REFERENCES agent.carts(cart_id),
    mission_id UUID REFERENCES agent.missions(id),
    status VARCHAR(50) DEFAULT 'created',
    items JSONB NOT NULL,
    address_id UUID REFERENCES agent.user_addresses(id),
    shipping_option JSONB,
    pricing_breakdown JSONB,
    tax_estimate JSONB,
    compliance_summary JSONB,
    confirmation_items JSONB DEFAULT '[]',
    consents JSONB DEFAULT '{}',
    evidence_snapshot_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ========================================
-- Evidence Snapshot
-- ========================================
CREATE TABLE IF NOT EXISTS agent.evidence_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES agent.users(id),
    session_id VARCHAR(255),
    mission_id UUID REFERENCES agent.missions(id),
    objects JSONB DEFAULT '{}',
    tool_calls JSONB DEFAULT '[]',
    policy_versions JSONB DEFAULT '{}',
    citations JSONB DEFAULT '[]',
    derived JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 证据库（RAG chunks）
-- ========================================
CREATE TABLE IF NOT EXISTS agent.evidence_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id VARCHAR(255) UNIQUE NOT NULL,
    text TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    offer_id VARCHAR(255),
    sku_id VARCHAR(255),
    category_id VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    doc_version_hash VARCHAR(64),
    offsets JSONB,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建向量索引
CREATE INDEX IF NOT EXISTS idx_evidence_chunks_embedding 
ON agent.evidence_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ========================================
-- 幂等记录
-- ========================================
CREATE TABLE IF NOT EXISTS agent.idempotency_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(255) NOT NULL,
    user_id UUID,
    tool_name VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64),
    response JSONB,
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, tool_name, idempotency_key)
);

-- ========================================
-- 审计日志
-- ========================================
CREATE TABLE IF NOT EXISTS agent.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(255) NOT NULL,
    actor_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(255),
    user_id UUID,
    tool_name VARCHAR(100) NOT NULL,
    request_summary JSONB,
    response_hash VARCHAR(64),
    response_status VARCHAR(50),
    latency_ms INTEGER,
    trace_id VARCHAR(255),
    span_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON agent.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tool_name ON agent.audit_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON agent.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON agent.missions(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_category_id ON agent.offers(category_id);
CREATE INDEX IF NOT EXISTS idx_skus_offer_id ON agent.skus(offer_id);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_evidence_chunks_text_search 
ON agent.evidence_chunks 
USING gin(to_tsvector('english', text));

COMMENT ON SCHEMA agent IS 'Multi-AI-Agent4OnlineShopping 主 schema';

