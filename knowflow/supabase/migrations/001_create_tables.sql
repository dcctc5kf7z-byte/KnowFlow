-- KnowFlow — Initial schema
-- Run this in the Supabase SQL editor after creating your project.

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('paste', 'url', 'file', 'manual')),
  category TEXT,
  sub_category TEXT,
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  keywords TEXT[] DEFAULT '{}',
  angles JSONB DEFAULT '[]',
  golden_quotes JSONB DEFAULT '[]',
  extracted_nodes UUID[] DEFAULT '{}',
  card_status JSONB DEFAULT '{"card1":"pending","card2":"pending","card3":"pending","card4":"pending"}',
  scenario TEXT DEFAULT 'quick_capture',
  processing_mode TEXT DEFAULT 'local',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced'
);

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('keyword', 'concept', 'person', 'tool', 'other')),
  label TEXT NOT NULL,
  description TEXT,
  entry_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced'
);

-- Links table
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  weight INTEGER CHECK (weight >= 1 AND weight <= 5),
  source TEXT DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced'
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_mode TEXT DEFAULT 'auto' CHECK (ai_mode IN ('local', 'api', 'auto')),
  api_key TEXT,
  api_provider TEXT DEFAULT 'openai' CHECK (api_provider IN ('openai', 'anthropic')),
  monthly_budget_usd NUMERIC(10,2) DEFAULT 10.00,
  current_month_spend_usd NUMERIC(10,2) DEFAULT 0.00,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT CHECK (source_type IN ('paste', 'url', 'file', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  converted_to_entry_id UUID REFERENCES entries(id)
);

-- Conflicts table (audit log)
CREATE TABLE IF NOT EXISTS conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('entry', 'node', 'link')),
  entity_id UUID NOT NULL,
  local_version JSONB,
  remote_version JSONB,
  resolved_by TEXT DEFAULT 'last-write-wins',
  resolved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (IF NOT EXISTS supported in PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_deleted_at ON entries(deleted_at);
CREATE INDEX IF NOT EXISTS idx_nodes_user_id ON nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_deleted_at ON nodes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_node_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_node_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_expires_at ON drafts(expires_at);
CREATE INDEX IF NOT EXISTS idx_conflicts_entity ON conflicts(entity_type, entity_id);

-- Row Level Security (RLS) — idempotent, safe to re-run
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users own entries" ON entries;
DROP POLICY IF EXISTS "Users own nodes" ON nodes;
DROP POLICY IF EXISTS "Users own links" ON links;
DROP POLICY IF EXISTS "Users own settings" ON user_settings;
DROP POLICY IF EXISTS "Users own drafts" ON drafts;
DROP POLICY IF EXISTS "Users own conflicts" ON conflicts;

CREATE POLICY "Users own entries" ON entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own nodes" ON nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own links" ON links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own drafts" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own conflicts" ON conflicts FOR ALL USING (
  auth.uid() = (SELECT user_id FROM entries WHERE id = entity_id)
);
