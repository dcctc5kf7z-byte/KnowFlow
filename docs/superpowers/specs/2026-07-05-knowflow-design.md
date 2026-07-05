# KnowFlow — Design Specification

**Version:** 1.1.0
**Date:** 2026-07-05
**Status:** Draft — Self-Reviewed, Pending User Review

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Card Module System](#4-card-module-system)
5. [AI Integration](#5-ai-integration)
6. [UI Design](#6-ui-design) — includes Search (6.9) and Export/Import (6.10)
7. [API Design](#7-api-design)
8. [Error Handling](#8-error-handling)
9. [Performance](#9-performance)
10. [Open Questions](#10-open-questions)
- [Appendix A: File Structure](#appendix-a-file-structure)
- [Appendix B: Dependencies](#appendix-b-dependencies)
- [Appendix C: Environment Variables](#appendix-c-environment-variables)

---

## 1. Product Overview

### 1.1 Vision

KnowFlow is a knowledge management tool that lowers the barrier to entry compared to tools like Obsidian. Users input scattered text, and the AI organizes, categorizes, recommends thinking angles, extracts essence, and connects to existing knowledge — all presented as a visual knowledge graph.

### 1.2 Target Users

Everyone. Core value is **simplicity** — beginners should feel welcomed, not overwhelmed.

### 1.3 Business Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Local rules processing, basic AI, offline mode |
| Pro | TBD | Deep AI analysis, API credits, advanced graph features |

### 1.4 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Next.js | SSR/SSG, app router, built-in optimization |
| Styling | Tailwind CSS | Utility-first, responsive, fast iteration |
| Database | Supabase (free tier) | 500MB DB + 1GB storage + 50K MAU |
| Local Storage | Dexie.js (IndexedDB) | Offline-first, sync-ready |
| AI | OpenAI / Claude API | Hybrid mode: local rules + API |
| Deployment | Vercel | Free, automatic HTTPS, PWA support |

---

## 2. Architecture

### 2.1 High-Level

```
┌─────────────────────────────────────────────────┐
│                    Frontend                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │  Entry  │  │  Node   │  │   Link  │         │
│  │  Store  │  │  Store  │  │  Store  │         │
│  └────┬────┘  └────┬────┘  └────┬────┘         │
│       │            │            │                │
│       └────────────┼────────────┘                │
│                    │                             │
│              ┌─────┴─────┐                       │
│              │  Dexie.js │ (IndexedDB)           │
│              └─────┬─────┘                       │
│                    │                             │
│              ┌─────┴─────┐                       │
│              │ Sync Layer│                       │
│              └─────┬─────┘                       │
└────────────────────┼────────────────────────────┘
                     │
              ┌──────┴──────┐
              │  Supabase   │
              │  - Database │
              │  - Auth     │
              │  - Realtime │
              └─────────────┘
```

### 2.2 Data Flow

```
User Input → Entry (raw) → Card 1 → Card 2 → Card 3 → Card 4
                ↓              ↓          ↓          ↓          ↓
          IndexedDB      IndexedDB  IndexedDB  IndexedDB  IndexedDB
                ↓              ↓          ↓          ↓          ↓
            Supabase      Supabase  Supabase  Supabase  Supabase
                ↓              ↓          ↓          ↓          ↓
              Node ←────────────┴──────────┴──────────┘
                ↓
              Link
```

### 2.3 Sync Architecture

**Offline-First Strategy:**

1. All writes go to IndexedDB first (instant)
2. Background sync pushes to Supabase when online
3. Conflict resolution: last-write-wins (default, no UI) with manual override option

**Sync States:**

```typescript
type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict';
```

**Conflict Resolution Strategy:**

- **Default:** Last-write-wins (by `updatedAt` timestamp). No user intervention needed.
- **Manual override:** If user detects incorrect overwrite, they can view entry history and restore.
- **MVP approach:** Simple last-write-wins. Diff-based merge UI deferred to post-MVP.

**Sync Flow:**

```
Write → IndexedDB (local) → Queue Sync → Supabase (pending) → Confirm (synced)
                                    ↓
                              If conflict → Last-write-wins → Log conflict
                                    ↓
                              User can view history if needed
```

---

## 3. Data Model

### 3.1 Core Entities

#### Entry

All card outputs in a single record (not separate tables per card).

```typescript
interface Entry {
  id: string;                    // UUID
  userId: string;                // Supabase auth.users.id
  title: string;                 // Auto-generated or user-edited
  rawText: string;               // Original input text
  language: string;              // Detected language code (e.g., 'en', 'zh')

  // Card 1: Input & Record
  sourceUrl?: string;            // Optional source URL
  sourceType?: 'paste' | 'url' | 'file' | 'manual';

  // Card 2: Categorize & Classify
  category: string;              // Primary category
  subCategory?: string;          // Optional sub-category
  tags: string[];                // User + AI suggested tags
  summary: string;               // AI-generated summary
  keywords: string[];            // Extracted keywords

  // Card 3: Recommended Angles
  angles: Angle[];               // Embedded angles (NOT independent entity)

  // Card 4: Extract & Connect
  goldenQuotes: GoldenQuote[];   // Important quotes
  extractedNodes: string[];      // References to Node IDs

  // Status & Metadata
  cardStatus: CardStatus;
  scenario: ProcessingScenario;
  processingMode: 'local' | 'api';
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  deletedAt?: string;            // Soft delete
  syncStatus: SyncStatus;
}
```

#### Angle (Embedded in Entry)

```typescript
interface Angle {
  id: string;
  text: string;                  // The recommended thinking angle
  selected: boolean;             // User chose this angle
  source: 'ai' | 'local';       // How it was generated
}
```

#### GoldenQuote (Embedded in Entry)

```typescript
interface GoldenQuote {
  id: string;
  text: string;                  // The quote text
  page?: number;                 // Optional page reference
  context?: string;              // Surrounding context
}
```

#### Node

Reusable knowledge units that can be referenced by multiple entries.

```typescript
interface Node {
  id: string;
  userId: string;
  type: 'keyword' | 'concept' | 'person' | 'tool' | 'other';
  label: string;                 // Display name
  description?: string;          // Optional description
  entryIds: string[];            // References to Entry IDs
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;            // Soft delete
  syncStatus: SyncStatus;
}
```

#### Link

Relationships between nodes.

```typescript
interface Link {
  id: string;
  userId: string;
  sourceNodeId: string;          // From Node
  targetNodeId: string;          // To Node
  relationship: string;          // e.g., "related_to", "part_of", "causes"
  weight: number;                // 1-5, AI-generated, user-adjustable
  source: 'ai' | 'user';
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}
```

#### Draft

Temporary capture before full Entry creation. Stored locally, synced for logged-in users.

```typescript
interface Draft {
  id: string;
  userId?: string;               // Optional for anonymous users
  rawText: string;
  sourceUrl?: string;
  sourceType: 'paste' | 'url' | 'file' | 'manual';
  createdAt: string;
  expiresAt: string;             // Auto-cleanup after 30 days
  convertedToEntryId?: string;   // Set when draft becomes an Entry
}
```

#### UserSettings

Per-user configuration stored in Supabase.

```typescript
interface UserSettings {
  userId: string;
  aiMode: 'local' | 'api' | 'auto';  // auto = hybrid with fallback
  apiKey?: string;                     // Encrypted at rest
  apiProvider: 'openai' | 'anthropic';
  monthlyBudgetUsd: number;            // Max monthly API spend
  currentMonthSpendUsd: number;        // Current month's spend
  preferredLanguage: string;           // UI language
  createdAt: string;
  updatedAt: string;
}
```

#### Conflict

Sync conflict record (logged, not user-facing in MVP).

```typescript
interface Conflict {
  id: string;
  entityType: 'entry' | 'node' | 'link';
  entityId: string;
  localVersion: Record<string, unknown>;  // Local data at conflict time
  remoteVersion: Record<string, unknown>; // Remote data at conflict time
  resolvedBy: 'last-write-wins' | 'user';
  resolvedAt: string;
  createdAt: string;
}
```

#### Card Status

```typescript
type CardStatus = {
  card1: 'pending' | 'processing' | 'completed' | 'degraded' | 'failed';
  card2: 'pending' | 'processing' | 'completed' | 'degraded' | 'failed';
  card3: 'pending' | 'processing' | 'completed' | 'degraded' | 'failed';
  card4: 'pending' | 'processing' | 'completed' | 'degraded' | 'failed';
};
```

**Status States:**

| State | Icon | Meaning |
|-------|------|---------|
| pending | ⏸ | Waiting to process |
| processing | 🔄 | Currently processing (show progress bar) |
| completed | ✅ | User confirmed output |
| degraded | ⚠️ | API failed, using local mode |
| failed | ❌ | Processing failed, retry available |

#### Processing Scenario

```typescript
type ProcessingScenario =
  | 'quick_capture'      // 快速记录 - local rules only
  | 'deep_digest'        // 深度消化 - full AI analysis
  | 'writing_material'   // 写作素材 - focus on quotes/angles
  | 'knowledge_link';    // 知识关联 - focus on connections
```

**Scenario Defaults:**

| Scenario | Default Mode | Cards Processed |
|----------|-------------|-----------------|
| 快速记录 | Local | Card 1 only |
| 深度消化 | API | All 4 cards |
| 写作素材 | API | Card 1, 3, 4 |
| 知识关联 | API | Card 1, 2, 4 |

*Mid-flow scenario switching is supported.*

### 3.2 Database Schema (Supabase)

```sql
-- Entries table
CREATE TABLE entries (
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
CREATE TABLE nodes (
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
CREATE TABLE links (
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

-- Indexes
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_deleted_at ON entries(deleted_at);
CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_nodes_deleted_at ON nodes(deleted_at);
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_source ON links(source_node_id);
CREATE INDEX idx_links_target ON links(target_node_id);

-- User Settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_mode TEXT DEFAULT 'auto' CHECK (ai_mode IN ('local', 'api', 'auto')),
  api_key TEXT,  -- Encrypted at rest via Supabase Vault
  api_provider TEXT DEFAULT 'openai' CHECK (api_provider IN ('openai', 'anthropic')),
  monthly_budget_usd NUMERIC(10,2) DEFAULT 10.00,
  current_month_spend_usd NUMERIC(10,2) DEFAULT 0.00,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drafts table
CREATE TABLE drafts (
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
CREATE TABLE conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('entry', 'node', 'link')),
  entity_id UUID NOT NULL,
  local_version JSONB,
  remote_version JSONB,
  resolved_by TEXT DEFAULT 'last-write-wins',
  resolved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional indexes
CREATE INDEX idx_drafts_user_id ON drafts(user_id);
CREATE INDEX idx_drafts_expires_at ON drafts(expires_at);
CREATE INDEX idx_conflicts_entity ON conflicts(entity_type, entity_id);

-- Row Level Security (RLS)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users own entries" ON entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own nodes" ON nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own links" ON links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own drafts" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own conflicts" ON conflicts FOR ALL USING (
  auth.uid() = (SELECT user_id FROM entries WHERE id = entity_id)
);
```

### 3.3 Local Schema (Dexie.js)

```typescript
const db = new Dexie('KnowFlowDB');

db.version(1).stores({
  entries: 'id, userId, category, createdAt, deletedAt, syncStatus',
  nodes: 'id, userId, type, label, deletedAt, syncStatus',
  links: 'id, userId, sourceNodeId, targetNodeId, syncStatus',
  drafts: 'id, userId, createdAt, expiresAt',
  userSettings: 'userId',
  syncQueue: '++id, entityType, entityId, action, timestamp'
});
```

---

## 4. Card Module System

### 4.1 Card 1: Input & Record (📥)

**Purpose:** Store raw text, detect language, suggest tags.

**Inputs:**
- Raw text (paste, file upload, or manual)
- Optional source URL

**Processing:**
- Language detection (browser API or library)
- Auto-generate title (first N characters or AI-generated)
- Tag suggestions (local rules or AI)

**Outputs:**
- `rawText`, `language`, `title`, `tags`, `sourceUrl`, `sourceType`

**Status Flow:**
```
pending → processing → completed
                  ↓
              degraded (if API fails, skip to local)
                  ↓
              failed (if critical error)
```

### 4.2 Card 2: Categorize & Classify (🧩)

**Purpose:** Categorize content, extract summary and keywords.

**Inputs:**
- Card 1 outputs

**Processing:**
- Category classification (template-based or AI)
- Sub-category assignment
- Tag refinement
- Summary generation
- Keyword extraction (TF-IDF or AI)

**Outputs:**
- `category`, `subCategory`, `tags` (refined), `summary`, `keywords`

**Status Flow:**
```
pending → processing → completed
                  ↓
              degraded
                  ↓
              failed
```

### 4.3 Card 3: Recommended Angles (❓)

**Purpose:** Suggest thinking angles (NOT mandatory questions).

**Inputs:**
- Card 1 + Card 2 outputs

**Processing:**
- Generate 3-5 recommended thinking angles
- User selects which angles interest them

**Outputs:**
- `angles[]` (with `selected` boolean)

**Key Design Decision:**
- Angles are **recommendations**, not requirements
- User chooses what interests them
- No pressure to answer all angles

**Status Flow:**
```
pending → processing → completed
                  ↓
              degraded
                  ↓
              failed
```

### 4.4 Card 4: Extract & Connect (🔬)

**Purpose:** Extract golden quotes and create connections to existing knowledge.

**Inputs:**
- Card 1 + Card 2 + Card 3 outputs
- Existing Nodes in the system

**Processing:**
- Extract golden quotes (MVP: quotes only, not "reusable frameworks")
- Identify existing Nodes that relate to this Entry
- Create new Nodes for significant concepts
- Create Links between related Nodes

**Outputs:**
- `goldenQuotes[]`
- `extractedNodes[]` (references to Node IDs)
- New Nodes and Links created

**Key Design Decision:**
- MVP focuses on **golden quotes**, not abstract "reusable frameworks"
- Connections are suggestions, user confirms

**Status Flow:**
```
pending → processing → completed
                  ↓
              degraded
                  ↓
              failed
```

---

## 5. AI Integration

### 5.1 Hybrid Mode Architecture

```
┌─────────────────────────────────────────────┐
│              Processing Request              │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │  Check API Key    │
        │  & Budget         │
        └─────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
    ▼                           ▼
┌─────────┐               ┌─────────┐
│ Mode A  │               │ Mode B  │
│ (Local) │               │  (API)  │
└────┬────┘               └────┬────┘
     │                         │
     ▼                         ▼
┌─────────┐               ┌─────────┐
│ TF-IDF  │               │ OpenAI/ │
│ Rules   │               │ Claude  │
└────┬────┘               └────┬────┘
     │                         │
     └─────────────┬───────────┘
                   │
           ┌───────▼───────┐
           │  Fallback     │
           │  (if API fails)│
           └───────────────┘
```

### 5.2 Mode A: Local Rules

**Free, offline-capable processing.**

| Feature | Implementation |
|---------|---------------|
| Language Detection | Browser API (`navigator.language`) or `franc-min` |
| Keyword Extraction | TF-IDF (compromise library) |
| Categorization | Template-based rules (predefined categories) |
| Summary | Extractive (first N sentences) |
| Angle Generation | Template-based (predefined angle types) |

**Dependencies:** Minimal (compromise for NLP, nothing else required)

### 5.3 Mode B: API Integration

**Requires user's own API key. Cost displayed before each call.**

| Feature | Implementation |
|---------|---------------|
| Language Detection | API model |
| Keyword Extraction | Semantic analysis |
| Categorization | Semantic classification |
| Summary | Abstractive generation |
| Angle Generation | Creative angle suggestions |
| Quote Extraction | Context-aware extraction |

**Supported APIs:**
- OpenAI (GPT-4o, GPT-4o-mini)
- Claude (Claude Haiku 4.5, Sonnet 5, Opus 4.8)

**Cost Transparency:**

```typescript
interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;  // In USD
  currency: string;
}
```

**User Controls:**
- Monthly API call limit
- Cost per card estimated before processing
- Option to switch to local mode at any time

### 5.4 Fallback Mechanism

```
API Call → Success? 
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
  Yes                  No
    │                   │
    ▼                   ▼
 Use API Result    Auto-degrade to Local
    │                   │
    ▼                   ▼
 Update counter    Show [🔴 降级模式]
    │                   │
    ▼                   ▼
 (3 consecutive    (Next page visit
  successes =       checks for recovery)
  auto-recovery)
```

**Recovery Logic:**
- Track consecutive API successes
- After 3 consecutive successes, auto-recovery to API mode
- User can manually toggle back to API mode

---

## 6. UI Design

### 6.1 Navigation Structure

```
┌─────────────────────────────────────────────────────┐
│  KnowFlow    [+]    [🔍]    [⚙️]                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         Knowledge Library (Home)            │   │
│  │                                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Entry 1 │  │ Entry 2 │  │ Entry 3 │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘   │   │
│  │                                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Entry 4 │  │ Entry 5 │  │ Entry 6 │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                    [🔍] [⚙️]                        │
│                     ▲                               │
│                     │                               │
│              FAB (Quick Capture)                    │
└─────────────────────────────────────────────────────┘
```

### 6.2 Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | KnowledgeLibrary | Home page with smart grouping |
| `/graph` | KnowledgeGraph | Visual knowledge graph |
| `/settings` | Settings | App settings |
| `/library/:id` | EntryDetail | Entry detail with step bar |
| `[+]` FAB | CaptureModal | Two-step: capture → process |

### 6.3 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | Left filter sidebar + 3-column card grid |
| Tablet (768-1023px) | Top filter bar + 2-column grid |
| Mobile (<768px) | Bottom Tab bar + FAB + 1-column list |

### 6.4 Home Page (Knowledge Library)

**Smart Groups:**
- 本周新捕获 (New this week)
- 高频回顾 (Frequently reviewed)
- 待关联孤儿 (Orphan entries needing connections)

**Multi-View Options:**
- Card grid (default)
- List view
- Timeline view

**Empty States:**
- No entries → Welcome message + CTA to capture
- No entries in group → Hide group (don't show empty)

### 6.5 Entry Detail Page

**Step Bar:**
```
[📥 Input] → [🧩 Categorize] → [❓ Angles] → [🔬 Extract]
```

**Expandable Cards:**
- Each card shows status icon
- Click to expand/collapse
- Card content editable after processing
- "Reprocess" button available

### 6.6 Knowledge Graph

**Progressive Experience:**

| Entries | Stage | Visual |
|---------|-------|--------|
| ≤2 | Seed 🌱 | Simple node display |
| 3-7 | Sprout 🌿 | Basic connections |
| ≥8 | Full 🌳 | Complete graph with clustering |

**Features:**
- Zoom/Pan
- Click node to view details
- Drag to rearrange
- Filter by category/tag
- Export as image

### 6.7 Capture Modal (FAB)

**Two-Step Flow:**

```
Step 1: Capture
┌─────────────────────────────┐
│  Paste text or type here    │
│  [________________________] │
│                             │
│  Source: [paste] [url] [file]│
│                             │
│  [Cancel]        [Next →]   │
└─────────────────────────────┘

Step 2: Process
┌─────────────────────────────┐
│  Choose scenario:           │
│  ○ 快速记录 (local)        │
│  ○ 深度消化 (API)          │
│  ○ 写作素材 (API)          │
│  ○ 知识关联 (API)          │
│                             │
│  [← Back]    [Start Processing] │
└─────────────────────────────┘
```

### 6.8 Settings Page

**Grouped Sections:**
1. Quick Operations (export, import, clear)
2. AI Configuration (API key, budget, mode)
3. Data Management (sync, backup, restore)
4. Advanced (debug, about)

### 6.9 Search Feature

**Trigger:** Click 🔍 in header, or `Cmd+K` / `Ctrl+K` keyboard shortcut.

**Search Scope:**
- Entry titles
- Entry raw text
- Entry summary
- Entry tags
- Node labels
- Node descriptions

**Search UI:**

```
┌─────────────────────────────────────────┐
│ 🔍 Search entries, tags, concepts...    │
├─────────────────────────────────────────┤
│ Recent                                  │
│   📝 My note about React hooks          │
│   📝 Machine learning basics            │
│                                         │
│ Tags                                    │
│   🏷️ react  (12 entries)                │
│   🏷️ machine-learning  (5 entries)      │
│                                         │
│ Concepts                                │
│   🔵 React Hooks                        │
│   🔵 Gradient Descent                   │
└─────────────────────────────────────────┘
```

**Implementation:**
- Client-side search using IndexedDB full-text search
- Debounced input (300ms)
- Results grouped by type (Entries, Tags, Concepts)
- Click result → navigate to entry/node detail

### 6.10 Export/Import

**Export Formats:**
- **Markdown:** One `.md` file per Entry, organized by category folder
- **JSON:** Full data export (entries + nodes + links), importable
- **CSV:** Entry list with metadata (for spreadsheet analysis)

**Import:**
- JSON import (from KnowFlow export)
- Markdown import (bulk import from Obsidian/Notion)

**Implementation:** Client-side generation using `Blob` + `URL.createObjectURL` for download. No server round-trip needed.

---

## 7. API Design

### 7.1 Supabase Edge Functions

| Function | Method | Description |
|----------|--------|-------------|
| `/process-card` | POST | Process a single card (1-4) with AI. Handles all card types via `cardNumber` param. |
| `/sync` | POST | Sync all entities (entries, nodes, links) in one batch. Reduces round-trips. |
| `/ai/generate` | POST | Generic AI generation endpoint. Used for angles, quotes, summaries, categorization. |

**Why 3 functions instead of 6:**
- `/process-card` replaces separate card endpoints — one function, `cardNumber` determines behavior
- `/sync` replaces 3 sync endpoints — one batch sync reduces network overhead
- `/ai/generate` replaces 2 AI endpoints — generic prompt-based, `task` param determines output format

### 7.2 Request/Response Examples

#### Process Card (`/process-card`)

```typescript
// Request
interface ProcessCardRequest {
  entryId: string;
  cardNumber: 1 | 2 | 3 | 4;
  scenario: ProcessingScenario;
  mode: 'local' | 'api';
}

// Response
interface ProcessCardResponse {
  success: boolean;
  data?: {
    cardStatus: CardStatus;
    outputs: Partial<Entry>;
    cost?: CostEstimate;
  };
  error?: {
    code: string;
    message: string;
    degraded: boolean;  // true if fell back to local
  };
}
```

#### Sync (`/sync`)

```typescript
// Request
interface SyncRequest {
  entries: Entry[];
  nodes: Node[];
  links: Link[];
  lastSyncAt?: string;  // For incremental sync
}

// Response
interface SyncResponse {
  success: boolean;
  data?: {
    syncedEntries: string[];   // IDs of synced entries
    syncedNodes: string[];     // IDs of synced nodes
    syncedLinks: string[];     // IDs of synced links
    conflicts: Conflict[];     // Any conflicts detected
  };
}
```

#### AI Generate (`/ai/generate`)

```typescript
// Request
interface AIGenerateRequest {
  task: 'categorize' | 'summarize' | 'keywords' | 'angles' | 'quotes';
  input: string;               // Raw text or context
  options?: {
    model?: string;            // Override default model
    maxTokens?: number;
    temperature?: number;
  };
}

// Response
interface AIGenerateResponse {
  success: boolean;
  data?: {
    result: unknown;           // Task-specific output
    cost: CostEstimate;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 8. Error Handling

### 8.1 Error Categories

| Category | Examples | Handling |
|----------|----------|----------|
| Network | Offline, timeout | Queue for retry, show offline indicator |
| API | Rate limit, auth error | Auto-degrade to local, show warning |
| Data | Invalid input, corruption | Validate, show error, offer repair |
| Sync | Conflict, merge failure | Notify user, offer resolution |

### 8.2 Error States

```typescript
interface AppState {
  isOnline: boolean;
  apiMode: 'active' | 'degraded' | 'offline';
  consecutiveApiSuccesses: number;
  pendingSyncCount: number;
  lastError?: {
    type: string;
    message: string;
    timestamp: string;
  };
}
```

### 8.3 Recovery Strategies

| Error | Strategy |
|-------|----------|
| Network timeout | Exponential backoff retry (3 attempts) |
| API rate limit | Wait + retry, or switch to local |
| API auth error | Prompt user to re-enter key |
| Data corruption | Restore from backup, or re-process |
| Sync conflict | Last-write-wins (default), user can view history |

---

## 9. Performance

### 9.1 Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3s |
| Bundle Size | < 200KB (gzipped) |
| Lighthouse Score | > 90 |

### 9.2 Optimizations

- **Code Splitting:** Lazy load routes and heavy components
- **Image Optimization:** Next.js Image component
- **Caching:** Service Worker for static assets
- **Debouncing:** Search and input handlers
- **Virtual Scrolling:** For large entry lists
- **IndexedDB:** Instant local reads

### 9.3 PWA Configuration

```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // Config...
});
```

**Caching Strategy:**
- Static assets: Cache First
- API requests: Network First
- AI API calls: Never cached

---

## 10. Open Questions

### 10.1 Node Type Boundary

**Problem:** How do users distinguish between "keyword" and "concept" nodes?

**Options:**
1. Provide UI examples and tooltips
2. Let AI suggest type, user confirms
3. Simplify to fewer types

**Status:** Needs UI examples to resolve

### 10.2 Interval Repetition Algorithm

**Problem:** Which algorithm for spaced repetition?

**Options:**
1. SM-2 (classic, well-tested)
2. Custom (more control)
3. None (MVP - skip this feature)

**Status:** Needs decision

### 10.3 Batch Processing Queue

**Problem:** How to handle processing multiple entries?

**Options:**
1. Sequential with progress indicator
2. Parallel with concurrency limit
3. Background queue with notification

**Status:** Needs implementation details

### 10.4 Conflict Resolution UI

**Problem:** How to handle sync conflicts?

**Options:**
1. Last-write-wins (simple, no UI)
2. Diff view with manual merge
3. AI-suggested merge

**Status:** Needs UI design

---

## Appendix A: File Structure

```
knowflow/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home (Knowledge Library)
│   │   ├── graph/
│   │   │   └── page.tsx          # Knowledge Graph
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings
│   │   └── library/
│   │       └── [id]/
│   │           └── page.tsx      # Entry Detail
│   ├── components/
│   │   ├── cards/
│   │   │   ├── Card1Input.tsx
│   │   │   ├── Card2Categorize.tsx
│   │   │   ├── Card3Angles.tsx
│   │   │   └── Card4Extract.tsx
│   │   ├── entry/
│   │   │   ├── EntryCard.tsx
│   │   │   └── EntryDetail.tsx
│   │   ├── graph/
│   │   │   └── KnowledgeGraph.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── FAB.tsx
│   │   ├── search/
│   │   │   └── SearchModal.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── local.ts          # Mode A: Local rules
│   │   │   ├── api.ts            # Mode B: API integration
│   │   │   └── fallback.ts       # Fallback logic
│   │   ├── db/
│   │   │   ├── dexie.ts          # IndexedDB setup
│   │   │   └── supabase.ts       # Supabase client
│   │   ├── sync/
│   │   │   ├── syncManager.ts    # Sync orchestration
│   │   │   └── conflictResolver.ts
│   │   └── utils/
│   │       ├── language.ts       # Language detection
│   │       ├── keywords.ts       # TF-IDF extraction
│   │       └── search.ts         # Full-text search
│   ├── stores/
│   │   ├── entryStore.ts         # Entry state management
│   │   ├── nodeStore.ts          # Node state management
│   │   └── uiStore.ts            # UI state
│   └── types/
│       ├── entry.ts              # Entry types
│       ├── node.ts               # Node types
│       ├── link.ts               # Link types
│       ├── draft.ts              # Draft types
│       ├── settings.ts           # UserSettings types
│       └── conflict.ts           # Conflict types
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service Worker
├── supabase/
│   └── functions/
│       ├── process-card/         # Card processing
│       ├── sync/                 # Batch sync
│       └── ai-generate/          # AI generation
└── tests/
    ├── unit/
    └── integration/
```

---

## Appendix B: Dependencies

### Required

| Package | Purpose | Size |
|---------|---------|------|
| react | UI framework | ~40KB |
| next | App framework | ~80KB |
| tailwindcss | Styling | ~10KB |
| dexie | IndexedDB wrapper | ~20KB |
| @supabase/supabase-js | Supabase client | ~30KB |

### Optional (for enhanced features)

| Package | Purpose | Size |
|---------|---------|------|
| compromise | NLP (TF-IDF) | ~50KB |
| d3-force | Knowledge graph layout engine | ~30KB |
| @visx/visx | React + D3 graph visualization | ~60KB |

**Graph Library Decision:** Use `d3-force` for layout computation + `@visx/visx` for React rendering. This gives us:
- Force-directed layout (nodes repel, links attract)
- React-friendly API (no manual DOM manipulation)
- Smaller bundle than full `d3` or `react-force-graph`
- Full control over styling and interaction

---

## Appendix C: Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App (required)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=KnowFlow

# AI API keys are NOT stored in .env — users provide them at runtime via Settings.
# Keys are stored encrypted in Supabase user_settings table.
```

---

**End of Design Specification**
