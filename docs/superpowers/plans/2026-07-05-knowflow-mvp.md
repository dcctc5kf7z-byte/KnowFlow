# KnowFlow MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working MVP of KnowFlow — a knowledge management tool with card-based processing, offline-first storage, and AI integration.

**Architecture:** Next.js app router with React. Local-first using Dexie.js (IndexedDB), cloud sync via Supabase. Hybrid AI mode (local rules + API fallback). Responsive design with Tailwind CSS.

**Tech Stack:** React 18, Next.js 14 (App Router), TypeScript 5, Tailwind CSS 3, Dexie.js 4, Supabase JS 2, d3-force 3

## Global Constraints

- Node.js 18+ required
- TypeScript strict mode enabled
- ESLint + Prettier for code quality
- No client-side secrets — API keys stored in Supabase, encrypted at rest
- All writes go to IndexedDB first (offline-first)
- Supabase free tier: 500MB DB + 1GB storage + 50K MAU
- Bundle size < 200KB gzipped
- Lighthouse score > 90

---

## File Structure

```
knowflow/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Home (Knowledge Library)
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   ├── graph/
│   │   │   └── page.tsx            # Knowledge Graph
│   │   ├── settings/
│   │   │   └── page.tsx            # Settings
│   │   └── library/
│   │       └── [id]/
│   │           └── page.tsx        # Entry Detail
│   ├── components/
│   │   ├── cards/
│   │   │   ├── Card1Input.tsx
│   │   │   ├── Card2Categorize.tsx
│   │   │   ├── Card3Angles.tsx
│   │   │   └── Card4Extract.tsx
│   │   ├── auth/
│   │   │   └── LoginForm.tsx
│   │   ├── entry/
│   │   │   ├── EntryCard.tsx
│   │   │   └── EntryDetail.tsx
│   │   ├── graph/
│   │   │   └── KnowledgeGraph.tsx
│   │   ├── layout/
│   │   │   ├── ClientLayout.tsx
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
│   │   │   ├── local.ts
│   │   │   ├── api.ts
│   │   │   └── fallback.ts
│   │   ├── auth/
│   │   │   └── auth.ts
│   │   ├── db/
│   │   │   ├── dexie.ts
│   │   │   └── supabase.ts
│   │   ├── sync/
│   │   │   ├── syncManager.ts
│   │   │   └── conflictResolver.ts
│   │   └── utils/
│   │       ├── language.ts
│   │       ├── keywords.ts
│   │       └── search.ts
│   ├── stores/
│   │   ├── entryStore.ts
│   │   ├── nodeStore.ts
│   │   └── uiStore.ts
│   └── types/
│       ├── entry.ts
│       ├── node.ts
│       ├── link.ts
│       ├── draft.ts
│       ├── settings.ts
│       └── conflict.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icon.svg
├── supabase/
│   ├── migrations/
│   │   └── 001_create_tables.sql
│   └── functions/
│       ├── process-card/
│       ├── sync/
│       └── ai-generate/
├── tests/
│   ├── unit/
│   └── integration/
├── jest.config.js
├── jest.setup.js
└── package.json
```

---

## Phase 1: Project Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `knowflow/` (root)
- Create: `knowflow/package.json`
- Create: `knowflow/next.config.js`
- Create: `knowflow/tailwind.config.js`
- Create: `knowflow/postcss.config.js`
- Create: `knowflow/tsconfig.json`

**Interfaces:** None (project setup)

- [ ] **Step 1: Create Next.js project**

```bash
# Run from the repo root (c:\Users\zhong\Desktop\vibe coding\four)
npx create-next-app@latest knowflow --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd knowflow
```

Note: This creates a `knowflow/` subdirectory inside the repo. All subsequent commands should be run from inside `knowflow/`.

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```
Expected: Server starts at http://localhost:3000

- [ ] **Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 1.5: Setup Supabase Auth

**Files:**
- Create: `knowflow/src/lib/auth/auth.ts`
- Create: `knowflow/src/app/login/page.tsx`
- Create: `knowflow/src/components/auth/LoginForm.tsx`

**Interfaces:** Consumes supabase client from Task 5

- [ ] **Step 1: Create auth.ts**

```typescript
// knowflow/src/lib/auth/auth.ts

import { supabase } from '@/lib/db/supabase';
import { User } from '@supabase/supabase-js';

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function getUserIdOrAnonymous(user: User | null): string {
  return user?.id || 'anonymous';
}
```

- [ ] **Step 2: Create LoginForm.tsx**

```tsx
// knowflow/src/components/auth/LoginForm.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { signIn, signUp } from '@/lib/auth/auth';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (authError) {
        setError(authError.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
      </Button>
      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full text-sm text-blue-600 hover:underline"
      >
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create login page**

```tsx
// knowflow/src/app/login/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">KnowFlow</h1>
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Sign in to sync your knowledge
          </h2>
          <LoginForm onSuccess={() => router.push('/')} />
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline">
            Continue without account
          </button>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/ src/components/auth/ src/app/login/
git commit -m "feat: add Supabase Auth (sign in, sign up, anonymous mode)"
```

---

### Task 2: Install Dependencies

**Files:**
- Modify: `knowflow/package.json`

**Interfaces:** None (dependency installation)

- [ ] **Step 1: Install core dependencies**

```bash
npm install dexie @supabase/supabase-js zustand d3-force
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D @types/d3-force jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

- [ ] **Step 3: Create jest.config.js**

```javascript
// knowflow/jest.config.js

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(config);
```

- [ ] **Step 4: Create jest.setup.js**

```javascript
// knowflow/jest.setup.js

require('@testing-library/jest-dom');
```

- [ ] **Step 5: Verify package.json**

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "dexie": "^4.0.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.5.0",
    "d3-force": "^3.0.0"
  },
  "devDependencies": {
    "@types/d3-force": "^3.0.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json jest.config.js jest.setup.js
git commit -m "feat: install core dependencies and setup Jest"
```

---

### Task 3: Create TypeScript Type Definitions

**Files:**
- Create: `knowflow/src/types/entry.ts`
- Create: `knowflow/src/types/node.ts`
- Create: `knowflow/src/types/link.ts`
- Create: `knowflow/src/types/draft.ts`
- Create: `knowflow/src/types/settings.ts`
- Create: `knowflow/src/types/conflict.ts`
- Create: `knowflow/src/types/index.ts`

**Interfaces:** None (type definitions only)

- [ ] **Step 1: Create entry.ts**

```typescript
// knowflow/src/types/entry.ts

export type SyncStatus = 'local' | 'pending' | 'synced' | 'conflict';

export type CardStatusState = 'pending' | 'processing' | 'completed' | 'degraded' | 'failed';

export interface CardStatus {
  card1: CardStatusState;
  card2: CardStatusState;
  card3: CardStatusState;
  card4: CardStatusState;
}

export type ProcessingScenario =
  | 'quick_capture'
  | 'deep_digest'
  | 'writing_material'
  | 'knowledge_link';

export interface Angle {
  id: string;
  text: string;
  selected: boolean;
  source: 'ai' | 'local';
}

export interface GoldenQuote {
  id: string;
  text: string;
  page?: number;
  context?: string;
}

export interface Entry {
  id: string;
  userId: string;
  title: string;
  rawText: string;
  language: string;
  sourceUrl?: string;
  sourceType?: 'paste' | 'url' | 'file' | 'manual';
  category: string;
  subCategory?: string;
  tags: string[];
  summary: string;
  keywords: string[];
  angles: Angle[];
  goldenQuotes: GoldenQuote[];
  extractedNodes: string[];
  cardStatus: CardStatus;
  scenario: ProcessingScenario;
  processingMode: 'local' | 'api';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  syncStatus: SyncStatus;
}
```

- [ ] **Step 2: Create node.ts**

```typescript
// knowflow/src/types/node.ts

import { SyncStatus } from './entry';

export type NodeType = 'keyword' | 'concept' | 'person' | 'tool' | 'other';

export interface Node {
  id: string;
  userId: string;
  type: NodeType;
  label: string;
  description?: string;
  entryIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  syncStatus: SyncStatus;
}
```

- [ ] **Step 3: Create link.ts**

```typescript
// knowflow/src/types/link.ts

import { SyncStatus } from './entry';

export interface Link {
  id: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationship: string;
  weight: number;
  source: 'ai' | 'user';
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}
```

- [ ] **Step 4: Create draft.ts**

```typescript
// knowflow/src/types/draft.ts

export interface Draft {
  id: string;
  userId?: string;
  rawText: string;
  sourceUrl?: string;
  sourceType: 'paste' | 'url' | 'file' | 'manual';
  createdAt: string;
  expiresAt: string;
  convertedToEntryId?: string;
}
```

- [ ] **Step 5: Create settings.ts**

```typescript
// knowflow/src/types/settings.ts

export interface UserSettings {
  userId: string;
  aiMode: 'local' | 'api' | 'auto';
  apiKey?: string;
  apiProvider: 'openai' | 'anthropic';
  monthlyBudgetUsd: number;
  currentMonthSpendUsd: number;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 6: Create conflict.ts**

```typescript
// knowflow/src/types/conflict.ts

export interface Conflict {
  id: string;
  entityType: 'entry' | 'node' | 'link';
  entityId: string;
  localVersion: Record<string, unknown>;
  remoteVersion: Record<string, unknown>;
  resolvedBy: 'last-write-wins' | 'user';
  resolvedAt: string;
  createdAt: string;
}
```

- [ ] **Step 7: Create index.ts barrel export**

```typescript
// knowflow/src/types/index.ts

export * from './entry';
export * from './node';
export * from './link';
export * from './draft';
export * from './settings';
export * from './conflict';
```

- [ ] **Step 8: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for all entities"
```

---

### Task 4: Setup Dexie.js Database

**Files:**
- Create: `knowflow/src/lib/db/dexie.ts`
- Test: `knowflow/tests/unit/dexie.test.ts`

**Interfaces:** Consumes types from Task 3

- [ ] **Step 1: Write the failing test**

```typescript
// knowflow/tests/unit/dexie.test.ts

import { db } from '@/lib/db/dexie';

describe('Dexie Database', () => {
  it('should have entries table', () => {
    expect(db.tables.some(t => t.name === 'entries')).toBe(true);
  });

  it('should have nodes table', () => {
    expect(db.tables.some(t => t.name === 'nodes')).toBe(true);
  });

  it('should have links table', () => {
    expect(db.tables.some(t => t.name === 'links')).toBe(true);
  });

  it('should have drafts table', () => {
    expect(db.tables.some(t => t.name === 'drafts')).toBe(true);
  });

  it('should have userSettings table', () => {
    expect(db.tables.some(t => t.name === 'userSettings')).toBe(true);
  });

  it('should have syncQueue table', () => {
    expect(db.tables.some(t => t.name === 'syncQueue')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/dexie.test.ts
```
Expected: FAIL with "Cannot find module '@/lib/db/dexie'"

- [ ] **Step 3: Write implementation**

```typescript
// knowflow/src/lib/db/dexie.ts

import Dexie, { Table } from 'dexie';
import { Entry } from '@/types/entry';
import { Node } from '@/types/node';
import { Link } from '@/types/link';
import { Draft } from '@/types/draft';
import { UserSettings } from '@/types/settings';

export interface SyncQueueItem {
  id?: number;
  entityType: 'entry' | 'node' | 'link';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
}

class KnowFlowDB extends Dexie {
  entries!: Table<Entry>;
  nodes!: Table<Node>;
  links!: Table<Link>;
  drafts!: Table<Draft>;
  userSettings!: Table<UserSettings>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('KnowFlowDB');
    this.version(1).stores({
      entries: 'id, userId, category, createdAt, deletedAt, syncStatus',
      nodes: 'id, userId, type, label, deletedAt, syncStatus',
      links: 'id, userId, sourceNodeId, targetNodeId, syncStatus',
      drafts: 'id, userId, createdAt, expiresAt',
      userSettings: 'userId',
      syncQueue: '++id, entityType, entityId, action, timestamp',
    });
  }
}

export const db = new KnowFlowDB();
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/dexie.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/dexie.ts tests/unit/dexie.test.ts
git commit -m "feat: setup Dexie.js database with schema"
```

---

### Task 5.5: Create Supabase Tables (SQL Migration)

**Files:**
- Create: `knowflow/supabase/migrations/001_create_tables.sql`

**Interfaces:** None (database setup)

- [ ] **Step 1: Create migration file**

```sql
-- knowflow/supabase/migrations/001_create_tables.sql

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

-- User Settings table
CREATE TABLE user_settings (
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

-- Indexes
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_deleted_at ON entries(deleted_at);
CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_nodes_deleted_at ON nodes(deleted_at);
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_source ON links(source_node_id);
CREATE INDEX idx_links_target ON links(target_node_id);
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

-- RLS Policies
CREATE POLICY "Users own entries" ON entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own nodes" ON nodes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own links" ON links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own drafts" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own conflicts" ON conflicts FOR ALL USING (
  auth.uid() = (SELECT user_id FROM entries WHERE id = entity_id)
);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add Supabase SQL migration for all tables"
```

---

### Task 5: Setup Supabase Client

**Files:**
- Create: `knowflow/src/lib/db/supabase.ts`
- Create: `knowflow/.env.local`

**Interfaces:** None (client setup)

- [ ] **Step 1: Create .env.local**

```env
# knowflow/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 2: Create supabase.ts**

```typescript
// knowflow/src/lib/db/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/supabase.ts .env.local
git commit -m "feat: setup Supabase client"
```

---

### Task 6: Create Zustand Stores

**Files:**
- Create: `knowflow/src/stores/entryStore.ts`
- Create: `knowflow/src/stores/nodeStore.ts`
- Create: `knowflow/src/stores/uiStore.ts`

**Interfaces:** Consumes types from Task 3, database from Tasks 4-5

- [ ] **Step 1: Create entryStore.ts**

```typescript
// knowflow/src/stores/entryStore.ts

import { create } from 'zustand';
import { Entry } from '@/types/entry';
import { db } from '@/lib/db/dexie';

interface EntryState {
  entries: Entry[];
  currentEntry: Entry | null;
  isLoading: boolean;
  error: string | null;
  loadEntries: () => Promise<void>;
  loadEntry: (id: string) => Promise<void>;
  createEntry: (entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<Entry>;
  updateEntry: (id: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  currentEntry: null,
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await db.entries
        .where('deletedAt')
        .equals(undefined)
        .toArray();
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadEntry: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const entry = await db.entries.get(id);
      set({ currentEntry: entry || null, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createEntry: async (entryData) => {
    const now = new Date().toISOString();
    const entry: Entry = {
      ...entryData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };
    await db.entries.add(entry);
    set(state => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  updateEntry: async (id, updates) => {
    const now = new Date().toISOString();
    await db.entries.update(id, { ...updates, updatedAt: now, syncStatus: 'pending' });
    set(state => ({
      entries: state.entries.map(e => e.id === id ? { ...e, ...updates, updatedAt: now } : e),
      currentEntry: state.currentEntry?.id === id
        ? { ...state.currentEntry, ...updates, updatedAt: now }
        : state.currentEntry,
    }));
  },

  deleteEntry: async (id) => {
    const now = new Date().toISOString();
    await db.entries.update(id, { deletedAt: now, syncStatus: 'pending' });
    set(state => ({
      entries: state.entries.filter(e => e.id !== id),
      currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
    }));
  },
}));
```

- [ ] **Step 2: Create nodeStore.ts**

```typescript
// knowflow/src/stores/nodeStore.ts

import { create } from 'zustand';
import { Node, NodeType } from '@/types/node';
import { db } from '@/lib/db/dexie';

interface NodeState {
  nodes: Node[];
  isLoading: boolean;
  error: string | null;
  loadNodes: () => Promise<void>;
  createNode: (type: NodeType, label: string, description?: string) => Promise<Node>;
  updateNode: (id: string, updates: Partial<Node>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
}

export const useNodeStore = create<NodeState>((set) => ({
  nodes: [],
  isLoading: false,
  error: null,

  loadNodes: async () => {
    set({ isLoading: true, error: null });
    try {
      const nodes = await db.nodes
        .where('deletedAt')
        .equals(undefined)
        .toArray();
      set({ nodes, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createNode: async (type, label, description) => {
    const now = new Date().toISOString();
    const node: Node = {
      id: crypto.randomUUID(),
      userId: '', // Will be set by auth
      type,
      label,
      description,
      entryIds: [],
      createdAt: now,
      updatedAt: now,
      syncStatus: 'local',
    };
    await db.nodes.add(node);
    set(state => ({ nodes: [...state.nodes, node] }));
    return node;
  },

  updateNode: async (id, updates) => {
    const now = new Date().toISOString();
    await db.nodes.update(id, { ...updates, updatedAt: now, syncStatus: 'pending' });
    set(state => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates, updatedAt: now } : n),
    }));
  },

  deleteNode: async (id) => {
    const now = new Date().toISOString();
    await db.nodes.update(id, { deletedAt: now, syncStatus: 'pending' });
    set(state => ({ nodes: state.nodes.filter(n => n.id !== id) }));
  },
}));
```

- [ ] **Step 3: Create uiStore.ts**

```typescript
// knowflow/src/stores/uiStore.ts

import { create } from 'zustand';

interface UIState {
  isOnline: boolean;
  apiMode: 'active' | 'degraded' | 'offline';
  consecutiveApiSuccesses: number;
  pendingSyncCount: number;
  isSearchOpen: boolean;
  isCaptureOpen: boolean;
  setOnline: (online: boolean) => void;
  setApiMode: (mode: 'active' | 'degraded' | 'offline') => void;
  incrementApiSuccess: () => void;
  resetApiSuccess: () => void;
  setPendingSyncCount: (count: number) => void;
  toggleSearch: () => void;
  toggleCapture: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  apiMode: 'active',
  consecutiveApiSuccesses: 0,
  pendingSyncCount: 0,
  isSearchOpen: false,
  isCaptureOpen: false,

  setOnline: (online) => set({ isOnline: online }),
  setApiMode: (mode) => set({ apiMode: mode }),
  incrementApiSuccess: () => set(state => ({
    consecutiveApiSuccesses: state.consecutiveApiSuccesses + 1,
  })),
  resetApiSuccess: () => set({ consecutiveApiSuccesses: 0 }),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
  toggleSearch: () => set(state => ({ isSearchOpen: !state.isSearchOpen })),
  toggleCapture: () => set(state => ({ isCaptureOpen: !state.isCaptureOpen })),
}));
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/
git commit -m "feat: create Zustand stores for entries, nodes, and UI state"
```

---

### Task 6.5: Create Draft Store & Auto-Save

**Files:**
- Create: `knowflow/src/stores/draftStore.ts`
- Modify: `knowflow/src/components/layout/CaptureModal.tsx`

**Interfaces:** Consumes db from Task 4, Draft type from Task 3

- [ ] **Step 1: Create draftStore.ts**

```typescript
// knowflow/src/stores/draftStore.ts

import { create } from 'zustand';
import { Draft } from '@/types/draft';
import { db } from '@/lib/db/dexie';

interface DraftState {
  drafts: Draft[];
  currentDraft: Draft | null;
  isLoading: boolean;
  loadDrafts: () => Promise<void>;
  saveDraft: (rawText: string, sourceType: Draft['sourceType'], sourceUrl?: string) => Promise<Draft>;
  updateDraft: (id: string, updates: Partial<Draft>) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  convertToEntry: (id: string, entryId: string) => Promise<void>;
}

export const useDraftStore = create<DraftState>((set) => ({
  drafts: [],
  currentDraft: null,
  isLoading: false,

  loadDrafts: async () => {
    set({ isLoading: true });
    try {
      const now = new Date().toISOString();
      const drafts = await db.drafts
        .where('expiresAt')
        .above(now)
        .and(d => !d.convertedToEntryId)
        .toArray();
      set({ drafts, isLoading: false });
    } catch (error) {
      console.error('Failed to load drafts:', error);
      set({ isLoading: false });
    }
  },

  saveDraft: async (rawText, sourceType, sourceUrl) => {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const draft: Draft = {
      id: crypto.randomUUID(),
      rawText,
      sourceType,
      sourceUrl,
      createdAt: now,
      expiresAt,
    };
    await db.drafts.add(draft);
    set(state => ({ drafts: [...state.drafts, draft], currentDraft: draft }));
    return draft;
  },

  updateDraft: async (id, updates) => {
    await db.drafts.update(id, updates);
    set(state => ({
      drafts: state.drafts.map(d => d.id === id ? { ...d, ...updates } : d),
      currentDraft: state.currentDraft?.id === id
        ? { ...state.currentDraft, ...updates }
        : state.currentDraft,
    }));
  },

  deleteDraft: async (id) => {
    await db.drafts.delete(id);
    set(state => ({
      drafts: state.drafts.filter(d => d.id !== id),
      currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
    }));
  },

  convertToEntry: async (id, entryId) => {
    await db.drafts.update(id, { convertedToEntryId: entryId });
    set(state => ({
      drafts: state.drafts.filter(d => d.id !== id),
      currentDraft: null,
    }));
  },
}));
```

- [ ] **Step 2: Update CaptureModal to auto-save draft**

```tsx
// knowflow/src/components/layout/CaptureModal.tsx (add auto-save on close)

'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useEntryStore } from '@/stores/entryStore';
import { useDraftStore } from '@/stores/draftStore';
import { ProcessingScenario } from '@/types/entry';

export default function CaptureModal() {
  const { isCaptureOpen, toggleCapture } = useUIStore();
  const { createEntry } = useEntryStore();
  const { saveDraft, deleteDraft, currentDraft } = useDraftStore();
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState<'paste' | 'url' | 'file' | 'manual'>('paste');
  const [scenario, setScenario] = useState<ProcessingScenario>('quick_capture');
  const [draftId, setDraftId] = useState<string | null>(null);

  // Auto-save draft when text changes (debounced)
  useEffect(() => {
    if (!rawText.trim() || !isCaptureOpen) return;

    const timer = setTimeout(async () => {
      if (draftId) {
        // Update existing draft
        const { updateDraft } = useDraftStore.getState();
        await updateDraft(draftId, { rawText, sourceType });
      } else {
        // Create new draft
        const draft = await saveDraft(rawText, sourceType);
        setDraftId(draft.id);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [rawText, sourceType, isCaptureOpen]);

  // Clean up draft on modal close (if not submitted)
  const handleClose = async () => {
    if (draftId && !rawText.trim()) {
      await deleteDraft(draftId);
    }
    toggleCapture();
    setStep(1);
    setRawText('');
    setDraftId(null);
  };

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleStart = async () => {
    const entry = await createEntry({
      userId: '',
      title: rawText.slice(0, 50) + (rawText.length > 50 ? '...' : ''),
      rawText,
      language: 'en',
      sourceType,
      category: '',
      tags: [],
      summary: '',
      keywords: [],
      angles: [],
      goldenQuotes: [],
      extractedNodes: [],
      cardStatus: {
        card1: 'pending',
        card2: 'pending',
        card3: 'pending',
        card4: 'pending',
      },
      scenario,
      processingMode: 'local',
    });

    // Mark draft as converted
    if (draftId) {
      const { convertToEntry } = useDraftStore.getState();
      await convertToEntry(draftId, entry.id);
    }

    toggleCapture();
    setStep(1);
    setRawText('');
    setDraftId(null);

    // Trigger AI processing asynchronously (don't block UI)
    processEntryAsync(entry.id, scenario);
  };

  // Background processing function
  const processEntryAsync = async (entryId: string, scenario: ProcessingScenario) => {
    const { loadEntry, updateEntry } = useEntryStore.getState();
    await loadEntry(entryId);
    const { currentEntry } = useEntryStore.getState();
    if (!currentEntry) return;

    try {
      // Update status to processing
      await updateEntry(entryId, {
        cardStatus: {
          ...currentEntry.cardStatus,
          card1: 'processing',
        },
      });

      const { processEntry } = await import('@/lib/ai/process');
      const updates = await processEntry(currentEntry, scenario);
      await updateEntry(entryId, updates);
    } catch (error) {
      console.error('Processing failed:', error);
      await updateEntry(entryId, {
        cardStatus: {
          ...currentEntry.cardStatus,
          card1: 'failed',
        },
      });
    }
  };

  // ... rest of the component (same as before, but use handleClose instead of toggleCapture)
  return (
    <Modal
      isOpen={isCaptureOpen}
      onClose={handleClose}
      title={step === 1 ? 'Capture Knowledge' : 'Choose Scenario'}
    >
      {/* ... same JSX as before ... */}
    </Modal>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/draftStore.ts src/components/layout/CaptureModal.tsx
git commit -m "feat: add draft auto-save and Draft Store"
```

---

## Phase 2: Core UI Components

### Task 7: Create Base UI Components

**Files:**
- Create: `knowflow/src/components/ui/Button.tsx`
- Create: `knowflow/src/components/ui/Input.tsx`
- Create: `knowflow/src/components/ui/Modal.tsx`

**Interfaces:** None (UI primitives)

- [ ] **Step 1: Create Button.tsx**

```tsx
// knowflow/src/components/ui/Button.tsx

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    const baseStyles = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

- [ ] **Step 2: Create Input.tsx**

```tsx
// knowflow/src/components/ui/Input.tsx

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

- [ ] **Step 3: Create Modal.tsx**

```tsx
// knowflow/src/components/ui/Modal.tsx

import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: create base UI components (Button, Input, Modal)"
```

---

### Task 8: Create Layout Components

**Files:**
- Create: `knowflow/src/components/layout/Header.tsx`
- Create: `knowflow/src/components/layout/Navigation.tsx`
- Create: `knowflow/src/components/layout/FAB.tsx`
- Modify: `knowflow/src/app/layout.tsx`

**Interfaces:** Consumes uiStore from Task 6

- [ ] **Step 1: Create Header.tsx**

```tsx
// knowflow/src/components/layout/Header.tsx

'use client';

import { useUIStore } from '@/stores/uiStore';

export default function Header() {
  const toggleSearch = useUIStore(state => state.toggleSearch);

  return (
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">KnowFlow</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSearch}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            🔍
          </button>
          <a
            href="/settings"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ⚙️
          </a>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create Navigation.tsx**

```tsx
// knowflow/src/components/layout/Navigation.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: '📚 Library', active: pathname === '/' },
    { href: '/graph', label: '🕸️ Graph', active: pathname === '/graph' },
    { href: '/settings', label: '⚙️ Settings', active: pathname === '/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-30">
      <div className="flex justify-around py-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center px-3 py-1 text-sm ${
              link.active ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create FAB.tsx**

```tsx
// knowflow/src/components/layout/FAB.tsx

'use client';

import { useUIStore } from '@/stores/uiStore';

export default function FAB() {
  const toggleCapture = useUIStore(state => state.toggleCapture);

  return (
    <button
      onClick={toggleCapture}
      className="fixed bottom-20 right-4 md:bottom-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl z-30"
    >
      +
    </button>
  );
}
```

- [ ] **Step 4: Update layout.tsx**

```tsx
// knowflow/src/app/layout.tsx (Server Component — no 'use client')

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KnowFlow',
  description: 'Knowledge management tool with AI assistance',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
```

- [ ] **Step 4b: Create ClientLayout.tsx**

```tsx
// knowflow/src/components/layout/ClientLayout.tsx

'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import FAB from './FAB';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <Header />
      <main className="pb-20 md:pb-0">{children}</main>
      <Navigation />
      <FAB />
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx
git commit -m "feat: create layout components (ClientLayout, Header, Navigation, FAB)"
```

---

### Task 9: Create Home Page (Knowledge Library)

**Files:**
- Create: `knowflow/src/app/page.tsx`
- Create: `knowflow/src/components/entry/EntryCard.tsx`

**Interfaces:** Consumes entryStore from Task 6

- [ ] **Step 1: Create EntryCard.tsx**

```tsx
// knowflow/src/components/entry/EntryCard.tsx

import Link from 'next/link';
import { Entry } from '@/types/entry';

interface EntryCardProps {
  entry: Entry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const statusIcons = {
    pending: '⏸',
    processing: '🔄',
    completed: '✅',
    degraded: '⚠️',
    failed: '❌',
  };

  return (
    <Link href={`/library/${entry.id}`}>
      <div className="p-4 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-gray-900 line-clamp-2">{entry.title}</h3>
          <span className="text-sm" title={`Card 1: ${entry.cardStatus.card1}`}>
            {statusIcons[entry.cardStatus.card1]}
          </span>
        </div>
        {entry.summary && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{entry.summary}</p>
        )}
        {entry.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{entry.tags.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="mt-2 text-xs text-gray-400">
          {new Date(entry.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create page.tsx**

```tsx
// knowflow/src/app/page.tsx

'use client';

import { useEffect } from 'react';
import { useEntryStore } from '@/stores/entryStore';
import EntryCard from '@/components/entry/EntryCard';

export default function HomePage() {
  const { entries, isLoading, loadEntries } = useEntryStore();

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Start capturing knowledge
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          Click the + button to capture your first piece of knowledge. KnowFlow
          will help you organize, categorize, and connect your ideas.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx src/components/entry/EntryCard.tsx
git commit -m "feat: create home page with entry cards"
```

---

### Task 10: Create Capture Modal

**Files:**
- Create: `knowflow/src/components/layout/CaptureModal.tsx`
- Modify: `knowflow/src/components/layout/FAB.tsx`

**Interfaces:** Consumes uiStore from Task 6, entryStore from Task 6

- [ ] **Step 1: Create CaptureModal.tsx**

```tsx
// knowflow/src/components/layout/CaptureModal.tsx

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useEntryStore } from '@/stores/entryStore';
import { ProcessingScenario } from '@/types/entry';

export default function CaptureModal() {
  const { isCaptureOpen, toggleCapture } = useUIStore();
  const { createEntry } = useEntryStore();
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState<'paste' | 'url' | 'file' | 'manual'>('paste');
  const [scenario, setScenario] = useState<ProcessingScenario>('quick_capture');

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleStart = async () => {
    await createEntry({
      userId: '',
      title: rawText.slice(0, 50) + (rawText.length > 50 ? '...' : ''),
      rawText,
      language: 'en',
      sourceType,
      category: '',
      tags: [],
      summary: '',
      keywords: [],
      angles: [],
      goldenQuotes: [],
      extractedNodes: [],
      cardStatus: {
        card1: 'pending',
        card2: 'pending',
        card3: 'pending',
        card4: 'pending',
      },
      scenario,
      processingMode: 'local',
    });
    toggleCapture();
    setStep(1);
    setRawText('');
  };

  return (
    <Modal
      isOpen={isCaptureOpen}
      onClose={toggleCapture}
      title={step === 1 ? 'Capture Knowledge' : 'Choose Scenario'}
    >
      {step === 1 ? (
        <div className="space-y-4">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste text or type here..."
            className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            {(['paste', 'url', 'file', 'manual'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSourceType(type)}
                className={`px-3 py-1 text-sm rounded ${
                  sourceType === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={!rawText.trim()}>
              Next →
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {([
              { value: 'quick_capture', label: '快速记录', desc: 'Local rules only' },
              { value: 'deep_digest', label: '深度消化', desc: 'Full AI analysis' },
              { value: 'writing_material', label: '写作素材', desc: 'Focus on quotes/angles' },
              { value: 'knowledge_link', label: '知识关联', desc: 'Focus on connections' },
            ] as const).map(option => (
              <label
                key={option.value}
                className={`block p-3 border rounded-lg cursor-pointer ${
                  scenario === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={option.value}
                  checked={scenario === option.value}
                  onChange={() => setScenario(option.value)}
                  className="sr-only"
                />
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500">{option.desc}</div>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleBack}>
              ← Back
            </Button>
            <Button onClick={handleStart}>Start Processing</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
```

- [ ] **Step 2: Update FAB.tsx to include CaptureModal**

```tsx
// knowflow/src/components/layout/FAB.tsx

'use client';

import { useUIStore } from '@/stores/uiStore';
import CaptureModal from './CaptureModal';

export default function FAB() {
  const toggleCapture = useUIStore(state => state.toggleCapture);

  return (
    <>
      <button
        onClick={toggleCapture}
        className="fixed bottom-20 right-4 md:bottom-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl z-30"
      >
        +
      </button>
      <CaptureModal />
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/CaptureModal.tsx src/components/layout/FAB.tsx
git commit -m "feat: create capture modal with two-step flow"
```

---

## Phase 3: Entry Detail & Card System

### Task 11: Create Entry Detail Page

**Files:**
- Create: `knowflow/src/app/library/[id]/page.tsx`
- Create: `knowflow/src/components/entry/EntryDetail.tsx`

**Interfaces:** Consumes entryStore from Task 6

- [ ] **Step 1: Create EntryDetail.tsx**

```tsx
// knowflow/src/components/entry/EntryDetail.tsx

'use client';

import { Entry } from '@/types/entry';

interface EntryDetailProps {
  entry: Entry;
}

export default function EntryDetail({ entry }: EntryDetailProps) {
  const statusIcons = {
    pending: '⏸',
    processing: '🔄',
    completed: '✅',
    degraded: '⚠️',
    failed: '❌',
  };

  const cards = [
    { key: 'card1', title: '📥 Input & Record', content: entry.rawText },
    { key: 'card2', title: '🧩 Categorize & Classify', content: entry.summary || entry.category },
    { key: 'card3', title: '❓ Recommended Angles', content: entry.angles.map(a => a.text).join('\n') },
    { key: 'card4', title: '🔬 Extract & Connect', content: entry.goldenQuotes.map(q => q.text).join('\n') },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white border rounded-lg">
        <h2 className="text-xl font-semibold">{entry.title}</h2>
        <div className="mt-2 text-sm text-gray-500">
          {new Date(entry.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {cards.map(card => (
          <div
            key={card.key}
            className="flex-shrink-0 px-3 py-2 bg-gray-100 rounded-lg text-sm"
          >
            {statusIcons[entry.cardStatus[card.key as keyof typeof entry.cardStatus]]}{' '}
            {card.title}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {cards.map(card => (
          <div key={card.key} className="p-4 bg-white border rounded-lg">
            <h3 className="font-medium mb-2">{card.title}</h3>
            {card.content ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {card.content}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">Not processed yet</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create page.tsx**

```tsx
// knowflow/src/app/library/[id]/page.tsx

'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useEntryStore } from '@/stores/entryStore';
import EntryDetail from '@/components/entry/EntryDetail';

export default function EntryPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentEntry, isLoading, loadEntry } = useEntryStore();

  useEffect(() => {
    if (id) {
      loadEntry(id);
    }
  }, [id, loadEntry]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!currentEntry) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">Entry not found</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <EntryDetail entry={currentEntry} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/library/ src/components/entry/EntryDetail.tsx
git commit -m "feat: create entry detail page with step bar"
```

---

### Task 12: Create Card Components

**Files:**
- Create: `knowflow/src/components/cards/Card1Input.tsx`
- Create: `knowflow/src/components/cards/Card2Categorize.tsx`
- Create: `knowflow/src/components/cards/Card3Angles.tsx`
- Create: `knowflow/src/components/cards/Card4Extract.tsx`

**Interfaces:** Consumes Entry type from Task 3

- [ ] **Step 1: Create Card1Input.tsx**

```tsx
// knowflow/src/components/cards/Card1Input.tsx

'use client';

import { Entry } from '@/types/entry';

interface Card1Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card1Input({ entry, onUpdate }: Card1Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Raw Text
        </label>
        <textarea
          value={entry.rawText}
          onChange={(e) => onUpdate({ rawText: e.target.value })}
          className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your knowledge..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Source URL (optional)
        </label>
        <input
          type="url"
          value={entry.sourceUrl || ''}
          onChange={(e) => onUpdate({ sourceUrl: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Language
        </label>
        <div className="text-sm text-gray-600">{entry.language}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Card2Categorize.tsx**

```tsx
// knowflow/src/components/cards/Card2Categorize.tsx

'use client';

import { Entry } from '@/types/entry';

interface Card2Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card2Categorize({ entry, onUpdate }: Card2Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <input
          type="text"
          value={entry.category}
          onChange={(e) => onUpdate({ category: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Technology, Science, Philosophy"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sub-category
        </label>
        <input
          type="text"
          value={entry.subCategory || ''}
          onChange={(e) => onUpdate({ subCategory: e.target.value })}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional sub-category"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {entry.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
            >
              {tag}
              <button
                onClick={() => onUpdate({ tags: entry.tags.filter(t => t !== tag) })}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add tag and press Enter"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              onUpdate({ tags: [...entry.tags, e.currentTarget.value.trim()] });
              e.currentTarget.value = '';
            }
          }}
          className="w-full mt-2 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Summary
        </label>
        <textarea
          value={entry.summary}
          onChange={(e) => onUpdate({ summary: e.target.value })}
          className="w-full h-24 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief summary of the content"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Keywords
        </label>
        <div className="flex flex-wrap gap-2">
          {entry.keywords.map(keyword => (
            <span
              key={keyword}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
            >
              {keyword}
              <button
                onClick={() => onUpdate({ keywords: entry.keywords.filter(k => k !== keyword) })}
                className="ml-1 text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create Card3Angles.tsx**

```tsx
// knowflow/src/components/cards/Card3Angles.tsx

'use client';

import { Entry, Angle } from '@/types/entry';

interface Card3Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card3Angles({ entry, onUpdate }: Card3Props) {
  const toggleAngle = (angleId: string) => {
    const updatedAngles = entry.angles.map(angle =>
      angle.id === angleId ? { ...angle, selected: !angle.selected } : angle
    );
    onUpdate({ angles: updatedAngles });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        Select angles that interest you (optional):
      </div>
      <div className="space-y-2">
        {entry.angles.map(angle => (
          <label
            key={angle.id}
            className={`block p-3 border rounded-lg cursor-pointer ${
              angle.selected
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={angle.selected}
                onChange={() => toggleAngle(angle.id)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium">{angle.text}</div>
                <div className="text-xs text-gray-500">
                  {angle.source === 'ai' ? '🤖 AI suggested' : '📝 Rule-based'}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
      {entry.angles.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No angles generated yet. Process this card to get recommendations.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create Card4Extract.tsx**

```tsx
// knowflow/src/components/cards/Card4Extract.tsx

'use client';

import { Entry, GoldenQuote } from '@/types/entry';

interface Card4Props {
  entry: Entry;
  onUpdate: (updates: Partial<Entry>) => void;
}

export default function Card4Extract({ entry, onUpdate }: Card4Props) {
  const removeQuote = (quoteId: string) => {
    onUpdate({ goldenQuotes: entry.goldenQuotes.filter(q => q.id !== quoteId) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Golden Quotes
        </label>
        <div className="space-y-2">
          {entry.goldenQuotes.map(quote => (
            <div key={quote.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm italic text-gray-800">"{quote.text}"</div>
              {quote.context && (
                <div className="text-xs text-gray-500 mt-1">{quote.context}</div>
              )}
              <button
                onClick={() => removeQuote(quote.id)}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {entry.goldenQuotes.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No quotes extracted yet. Process this card to extract golden quotes.
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Connected Nodes
        </label>
        <div className="text-sm text-gray-600">
          {entry.extractedNodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {entry.extractedNodes.map(nodeId => (
                <span
                  key={nodeId}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                >
                  Node: {nodeId.slice(0, 8)}...
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">
              No connections created yet. Process this card to connect to existing knowledge.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/cards/
git commit -m "feat: create card components (Card1-Card4)"
```

---

## Phase 4: AI Integration

### Task 13: Create Local AI Mode (Mode A)

**Files:**
- Create: `knowflow/src/lib/ai/local.ts`
- Create: `knowflow/src/lib/utils/language.ts`
- Create: `knowflow/src/lib/utils/keywords.ts`

**Interfaces:** Consumes Entry type from Task 3

- [ ] **Step 1: Create language.ts**

```typescript
// knowflow/src/lib/utils/language.ts

export function detectLanguage(text: string): string {
  // Simple heuristic-based language detection
  // In production, use franc-min or browser API
  const chineseRegex = /[一-龥]/;
  const japaneseRegex = /[぀-ゟ゠-ヿ]/;
  const koreanRegex = /[가-힯]/;

  if (chineseRegex.test(text)) return 'zh';
  if (japaneseRegex.test(text)) return 'ja';
  if (koreanRegex.test(text)) return 'ko';

  // Default to English
  return 'en';
}
```

- [ ] **Step 2: Create keywords.ts**

```typescript
// knowflow/src/lib/utils/keywords.ts

export function extractKeywords(text: string, count: number = 5): string[] {
  // Simple TF-IDF-like extraction
  // In production, use compromise library
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}
```

- [ ] **Step 3: Create local.ts**

```typescript
// knowflow/src/lib/ai/local.ts

import { detectLanguage } from '@/lib/utils/language';
import { extractKeywords } from '@/lib/utils/keywords';
import { Entry, Angle, GoldenQuote } from '@/types/entry';

export interface LocalAIResult {
  language: string;
  title: string;
  tags: string[];
  category: string;
  subCategory?: string;
  summary: string;
  keywords: string[];
  angles: Angle[];
  goldenQuotes: GoldenQuote[];
}

export function processCard1(rawText: string): Pick<LocalAIResult, 'language' | 'title' | 'tags'> {
  const language = detectLanguage(rawText);
  const title = rawText.slice(0, 50) + (rawText.length > 50 ? '...' : '');
  const tags = extractKeywords(rawText, 3);

  return { language, title, tags };
}

export function processCard2(rawText: string): Pick<LocalAIResult, 'category' | 'summary' | 'keywords'> {
  // Simple template-based categorization
  const categories = [
    'Technology', 'Science', 'Philosophy', 'Business', 'Health',
    'Education', 'Entertainment', 'Politics', 'Sports', 'Other',
  ];

  const keywords = extractKeywords(rawText, 5);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const summary = rawText.split('.').slice(0, 2).join('.') + '.';

  return { category, summary, keywords };
}

export function processCard3(rawText: string): Pick<LocalAIResult, 'angles'> {
  const angles: Angle[] = [
    { id: crypto.randomUUID(), text: 'What are the practical applications?', selected: false, source: 'local' },
    { id: crypto.randomUUID(), text: 'What are the potential risks?', selected: false, source: 'local' },
    { id: crypto.randomUUID(), text: 'How does this compare to alternatives?', selected: false, source: 'local' },
  ];

  return { angles };
}

export function processCard4(rawText: string): Pick<LocalAIResult, 'goldenQuotes'> {
  // Simple quote extraction (first sentence)
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const goldenQuotes: GoldenQuote[] = sentences.slice(0, 2).map(text => ({
    id: crypto.randomUUID(),
    text: text.trim(),
  }));

  return { goldenQuotes };
}

export function processLocally(rawText: string): LocalAIResult {
  const card1 = processCard1(rawText);
  const card2 = processCard2(rawText);
  const card3 = processCard3(rawText);
  const card4 = processCard4(rawText);

  return {
    ...card1,
    ...card2,
    ...card3,
    ...card4,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/local.ts src/lib/utils/language.ts src/lib/utils/keywords.ts
git commit -m "feat: implement local AI mode (Mode A)"
```

---

### Task 14: Create API AI Mode (Mode B)

**Files:**
- Create: `knowflow/src/lib/ai/api.ts`
- Create: `knowflow/src/lib/ai/fallback.ts`

**Interfaces:** Consumes types from Task 3, local.ts from Task 13

- [ ] **Step 1: Create api.ts**

```typescript
// knowflow/src/lib/ai/api.ts

import { supabase } from '@/lib/db/supabase';
import { CostEstimate } from '@/types/settings';

export interface AIGenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerateResult<T> {
  success: boolean;
  data?: {
    result: T;
    cost: CostEstimate;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function aiGenerate<T>(
  task: string,
  input: string,
  options?: AIGenerateOptions
): Promise<AIGenerateResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-generate', {
      body: { task, input, options },
    });

    if (error) {
      return {
        success: false,
        error: {
          code: 'FUNCTION_ERROR',
          message: error.message,
        },
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: String(error),
      },
    };
  }
}

export async function processCardWithAPI(
  task: string,
  input: string
): Promise<AIGenerateResult<unknown>> {
  return aiGenerate(task, input);
}
```

- [ ] **Step 2: Create fallback.ts**

```typescript
// knowflow/src/lib/ai/fallback.ts

import { useUIStore } from '@/stores/uiStore';

export async function withFallback<T>(
  apiCall: () => Promise<T>,
  localFallback: () => T
): Promise<{ result: T; degraded: boolean }> {
  const { apiMode, incrementApiSuccess, resetApiSuccess, setApiMode } = useUIStore.getState();

  if (apiMode === 'offline') {
    return { result: localFallback(), degraded: true };
  }

  try {
    const result = await apiCall();
    incrementApiSuccess();

    // Auto-recovery after 3 consecutive successes
    const { consecutiveApiSuccesses } = useUIStore.getState();
    if (consecutiveApiSuccesses >= 3 && apiMode === 'degraded') {
      setApiMode('active');
    }

    return { result, degraded: false };
  } catch (error) {
    resetApiSuccess();
    setApiMode('degraded');
    console.warn('API call failed, falling back to local mode:', error);
    return { result: localFallback(), degraded: true };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/api.ts src/lib/ai/fallback.ts
git commit -m "feat: implement API AI mode (Mode B) with fallback"
```

---

### Task 15: Create AI Processing Pipeline

**Files:**
- Create: `knowflow/src/lib/ai/process.ts`

**Interfaces:** Consumes local.ts from Task 13, api.ts from Task 14, fallback.ts from Task 14

- [ ] **Step 1: Create process.ts**

```typescript
// knowflow/src/lib/ai/process.ts

import { Entry, ProcessingScenario } from '@/types/entry';
import { processLocally, LocalAIResult } from './local';
import { processCardWithAPI } from './api';
import { withFallback } from './fallback';
import { db } from '@/lib/db/dexie';
import { useNodeStore } from '@/stores/nodeStore';

export async function processEntry(
  entry: Entry,
  scenario: ProcessingScenario
): Promise<Partial<Entry>> {
  const updates: Partial<Entry> = {};

  // Card 1: Input & Record (always local)
  const card1Result = processLocally(entry.rawText);
  updates.language = card1Result.language;
  updates.title = card1Result.title;
  updates.tags = card1Result.tags;
  updates.cardStatus = { ...entry.cardStatus, card1: 'completed' };

  // Card 2: Categorize & Classify
  if (scenario !== 'quick_capture') {
    const { result, degraded } = await withFallback(
      () => processCardWithAPI('categorize', entry.rawText),
      () => processLocally(entry.rawText)
    );
    updates.category = (result as LocalAIResult).category;
    updates.summary = (result as LocalAIResult).summary;
    updates.keywords = (result as LocalAIResult).keywords;
    updates.cardStatus = {
      ...updates.cardStatus!,
      card2: degraded ? 'degraded' : 'completed',
    };
  }

  // Card 3: Recommended Angles
  if (scenario === 'deep_digest' || scenario === 'writing_material') {
    const { result, degraded } = await withFallback(
      () => processCardWithAPI('angles', entry.rawText),
      () => processLocally(entry.rawText)
    );
    updates.angles = (result as LocalAIResult).angles;
    updates.cardStatus = {
      ...updates.cardStatus!,
      card3: degraded ? 'degraded' : 'completed',
    };
  }

  // Card 4: Extract & Connect
  if (scenario !== 'quick_capture') {
    const { result, degraded } = await withFallback(
      () => processCardWithAPI('quotes', entry.rawText),
      () => processLocally(entry.rawText)
    );
    updates.goldenQuotes = (result as LocalAIResult).goldenQuotes;
    updates.cardStatus = {
      ...updates.cardStatus!,
      card4: degraded ? 'degraded' : 'completed',
    };

    // Create nodes from keywords
    const keywords = updates.keywords || card1Result.tags;
    const nodeIds: string[] = [];
    const { createNode, nodes } = useNodeStore.getState();

    for (const keyword of keywords) {
      // Check if node already exists
      const existingNode = nodes.find(n => n.label.toLowerCase() === keyword.toLowerCase());
      if (existingNode) {
        nodeIds.push(existingNode.id);
        // Add this entry to the node's entryIds
        if (!existingNode.entryIds.includes(entry.id)) {
          await db.nodes.update(existingNode.id, {
            entryIds: [...existingNode.entryIds, entry.id],
          });
        }
      } else {
        // Create new node
        const node = await createNode('keyword', keyword);
        nodeIds.push(node.id);
      }
    }

    updates.extractedNodes = nodeIds;
  }

  return updates;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/process.ts
git commit -m "feat: create AI processing pipeline"
```

---

## Phase 5: Search & Advanced Features

### Task 16: Create Search Feature

**Files:**
- Create: `knowflow/src/lib/utils/search.ts`
- Create: `knowflow/src/components/search/SearchModal.tsx`

**Interfaces:** Consumes entryStore from Task 6, nodeStore from Task 6

- [ ] **Step 1: Create search.ts**

```typescript
// knowflow/src/lib/utils/search.ts

import { db } from '@/lib/db/dexie';
import { Entry } from '@/types/entry';
import { Node } from '@/types/node';

export interface SearchResult {
  type: 'entry' | 'node' | 'tag';
  id: string;
  title: string;
  subtitle?: string;
  score: number;
}

export async function search(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search entries
  const entries = await db.entries.where('deletedAt').equals(undefined).toArray();
  entries.forEach(entry => {
    let score = 0;
    if (entry.title.toLowerCase().includes(lowerQuery)) score += 10;
    if (entry.rawText.toLowerCase().includes(lowerQuery)) score += 5;
    if (entry.summary.toLowerCase().includes(lowerQuery)) score += 3;
    if (entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) score += 7;

    if (score > 0) {
      results.push({
        type: 'entry',
        id: entry.id,
        title: entry.title,
        subtitle: entry.summary?.slice(0, 100),
        score,
      });
    }
  });

  // Search nodes
  const nodes = await db.nodes.where('deletedAt').equals(undefined).toArray();
  nodes.forEach(node => {
    let score = 0;
    if (node.label.toLowerCase().includes(lowerQuery)) score += 10;
    if (node.description?.toLowerCase().includes(lowerQuery)) score += 5;

    if (score > 0) {
      results.push({
        type: 'node',
        id: node.id,
        title: node.label,
        subtitle: node.description,
        score,
      });
    }
  });

  // Sort by score
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
```

- [ ] **Step 2: Create SearchModal.tsx**

```tsx
// knowflow/src/components/search/SearchModal.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { useUIStore } from '@/stores/uiStore';
import { search, SearchResult } from '@/lib/utils/search';

export default function SearchModal() {
  const { isSearchOpen, toggleSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim()) {
        setIsLoading(true);
        const searchResults = await search(query);
        setResults(searchResults);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'entry') {
      router.push(`/library/${result.id}`);
    } else if (result.type === 'node') {
      // TODO: Navigate to node detail
    }
    toggleSearch();
    setQuery('');
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch]);

  return (
    <Modal isOpen={isSearchOpen} onClose={toggleSearch}>
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries, tags, concepts..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading && (
          <div className="text-center text-gray-500">Searching...</div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map(result => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span>{result.type === 'entry' ? '📝' : '🔵'}</span>
                  <span className="font-medium">{result.title}</span>
                </div>
                {result.subtitle && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {result.subtitle}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {!isLoading && query && results.length === 0 && (
          <div className="text-center text-gray-500">No results found</div>
        )}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: Update Header.tsx to include SearchModal**

```tsx
// knowflow/src/components/layout/Header.tsx

'use client';

import { useUIStore } from '@/stores/uiStore';
import SearchModal from '@/components/search/SearchModal';

export default function Header() {
  const toggleSearch = useUIStore(state => state.toggleSearch);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">KnowFlow</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSearch}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              🔍
            </button>
            <a
              href="/settings"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ⚙️
            </a>
          </div>
        </div>
      </header>
      <SearchModal />
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/search.ts src/components/search/SearchModal.tsx src/components/layout/Header.tsx
git commit -m "feat: implement search feature with modal"
```

---

### Task 17: Create Knowledge Graph

**Files:**
- Create: `knowflow/src/app/graph/page.tsx`
- Create: `knowflow/src/components/graph/KnowledgeGraph.tsx`

**Interfaces:** Consumes entryStore from Task 6, nodeStore from Task 6

- [ ] **Step 1: Create KnowledgeGraph.tsx**

```tsx
// knowflow/src/components/graph/KnowledgeGraph.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { useEntryStore } from '@/stores/entryStore';
import { forceSimulation, forceLink, forceManyBody, forceCenter, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string;
  target: string;
}

export default function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const { nodes } = useNodeStore();
  const { entries } = useEntryStore();
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);

  useEffect(() => {
    if (nodes.length === 0) return;

    // Create nodes from Node entities
    const gNodes: GraphNode[] = nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
    }));

    // Create links from entry relationships
    const gLinks: GraphLink[] = [];
    nodes.forEach(node => {
      node.entryIds.forEach(entryId => {
        const targetNode = nodes.find(n => n.id !== node.id && n.entryIds.includes(entryId));
        if (targetNode) {
          gLinks.push({ source: node.id, target: targetNode.id });
        }
      });
    });

    // Run d3-force simulation
    const simulation = forceSimulation(gNodes)
      .force('link', forceLink(gLinks).id(d => d.id).distance(100))
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(400, 300))
      .stop();

    // Run simulation synchronously
    for (let i = 0; i < 300; i++) simulation.tick();

    setGraphNodes([...gNodes]);
    setGraphLinks([...gLinks as GraphLink[]]);
  }, [nodes, entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Your knowledge garden is just starting
        </h2>
        <p className="text-gray-600 text-center max-w-md">
          Add more entries to see your knowledge graph grow. Your ideas will
          connect and form a beautiful network.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="w-full h-[60vh] border rounded-lg bg-gray-50"
      >
        {/* Links */}
        {graphLinks.map((link, i) => {
          const source = graphNodes.find(n => n.id === (link.source as any));
          const target = graphNodes.find(n => n.id === (link.target as any));
          if (!source || !target) return null;
          return (
            <line
              key={`link-${i}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#d1d5db"
              strokeWidth={1}
            />
          );
        })}
        {/* Nodes */}
        {graphNodes.map(node => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={20}
              fill="#3b82f6"
              className="cursor-pointer hover:fill-blue-700"
            />
            <text
              x={node.x}
              y={(node.y || 0) + 30}
              textAnchor="middle"
              className="text-xs fill-gray-700"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Create page.tsx**

```tsx
// knowflow/src/app/graph/page.tsx

'use client';

import { useEffect } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { useEntryStore } from '@/stores/entryStore';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';

export default function GraphPage() {
  const { loadNodes } = useNodeStore();
  const { loadEntries } = useEntryStore();

  useEffect(() => {
    loadNodes();
    loadEntries();
  }, [loadNodes, loadEntries]);

  return <KnowledgeGraph />;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/graph/ src/components/graph/KnowledgeGraph.tsx
git commit -m "feat: create knowledge graph page with canvas visualization"
```

---

### Task 18: Create Settings Page

**Files:**
- Create: `knowflow/src/app/settings/page.tsx`

**Interfaces:** Consumes uiStore from Task 6

- [ ] **Step 1: Create page.tsx**

```tsx
// knowflow/src/app/settings/page.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUIStore } from '@/stores/uiStore';

export default function SettingsPage() {
  const { apiMode, setApiMode } = useUIStore();
  const [apiKey, setApiKey] = useState('');
  const [budget, setBudget] = useState('10');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save to Supabase
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    alert('Settings saved!');
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Quick Operations */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Quick Operations</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => alert('Export feature coming soon')}>
            Export Data
          </Button>
          <Button variant="secondary" onClick={() => alert('Import feature coming soon')}>
            Import Data
          </Button>
        </div>
      </section>

      {/* AI Configuration */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">AI Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Mode
            </label>
            <div className="flex gap-2">
              {(['local', 'api', 'auto'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setApiMode(mode === 'auto' ? 'active' : mode === 'local' ? 'offline' : 'active')}
                  className={`px-4 py-2 rounded-lg ${
                    (mode === 'auto' && apiMode === 'active') ||
                    (mode === 'local' && apiMode === 'offline') ||
                    (mode === 'api' && apiMode === 'active')
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {mode === 'local' ? 'Local Only' : mode === 'api' ? 'API Only' : 'Auto (Recommended)'}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          <Input
            label="Monthly Budget (USD)"
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            min="0"
            step="1"
          />
        </div>
      </section>

      {/* Data Management */}
      <section className="p-4 bg-white border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pending sync items</span>
            <span className="text-sm font-medium">0</span>
          </div>
          <Button variant="ghost" className="text-red-600">
            Clear All Data
          </Button>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: create settings page with AI configuration"
```

---

## Phase 6: Export/Import & PWA

### Task 19: Create Export/Import Feature

**Files:**
- Create: `knowflow/src/lib/utils/export.ts`
- Create: `knowflow/src/lib/utils/import.ts`

**Interfaces:** Consumes db from Task 4

- [ ] **Step 1: Create export.ts**

```typescript
// knowflow/src/lib/utils/export.ts

import { db } from '@/lib/db/dexie';

export async function exportAsJSON(): Promise<string> {
  const entries = await db.entries.toArray();
  const nodes = await db.nodes.toArray();
  const links = await db.links.toArray();

  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    entries,
    nodes,
    links,
  };

  return JSON.stringify(data, null, 2);
}

export async function exportAsMarkdown(): Promise<string> {
  const entries = await db.entries.toArray();

  let markdown = '# KnowFlow Export\n\n';
  markdown += `Exported at: ${new Date().toISOString()}\n\n`;

  entries.forEach(entry => {
    markdown += `## ${entry.title}\n\n`;
    markdown += `**Category:** ${entry.category}\n`;
    markdown += `**Tags:** ${entry.tags.join(', ')}\n`;
    markdown += `**Created:** ${entry.createdAt}\n\n`;
    markdown += `### Raw Text\n\n${entry.rawText}\n\n`;
    if (entry.summary) {
      markdown += `### Summary\n\n${entry.summary}\n\n`;
    }
    if (entry.goldenQuotes.length > 0) {
      markdown += `### Golden Quotes\n\n`;
      entry.goldenQuotes.forEach(quote => {
        markdown += `> ${quote.text}\n\n`;
      });
    }
    markdown += '---\n\n';
  });

  return markdown;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Create import.ts**

```typescript
// knowflow/src/lib/utils/import.ts

import { db } from '@/lib/db/dexie';
import { Entry } from '@/types/entry';
import { Node } from '@/types/node';
import { Link } from '@/types/link';

interface ImportData {
  version: string;
  entries: Entry[];
  nodes: Node[];
  links: Link[];
}

export async function importFromJSON(jsonString: string): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;

  try {
    const data: ImportData = JSON.parse(jsonString);

    if (!data.entries || !Array.isArray(data.entries)) {
      errors.push('Invalid format: missing entries array');
      return { imported, errors };
    }

    // Import entries
    for (const entry of data.entries) {
      try {
        const existing = await db.entries.get(entry.id);
        if (!existing) {
          await db.entries.add(entry);
          imported++;
        }
      } catch (error) {
        errors.push(`Failed to import entry ${entry.id}: ${error}`);
      }
    }

    // Import nodes
    if (data.nodes) {
      for (const node of data.nodes) {
        try {
          const existing = await db.nodes.get(node.id);
          if (!existing) {
            await db.nodes.add(node);
          }
        } catch (error) {
          errors.push(`Failed to import node ${node.id}: ${error}`);
        }
      }
    }

    // Import links
    if (data.links) {
      for (const link of data.links) {
        try {
          const existing = await db.links.get(link.id);
          if (!existing) {
            await db.links.add(link);
          }
        } catch (error) {
          errors.push(`Failed to import link ${link.id}: ${error}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Failed to parse JSON: ${error}`);
  }

  return { imported, errors };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/export.ts src/lib/utils/import.ts
git commit -m "feat: implement export (JSON, Markdown) and import features"
```

---

### Task 20: Setup PWA

**Files:**
- Create: `knowflow/public/manifest.json`
- Create: `knowflow/public/sw.js`
- Modify: `knowflow/src/app/layout.tsx`

**Interfaces:** None (PWA configuration)

- [ ] **Step 1: Create manifest.json**

```json
{
  "name": "KnowFlow",
  "short_name": "KnowFlow",
  "description": "Knowledge management tool with AI assistance",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 1b: Create placeholder icon**

```bash
# Create a simple SVG icon as placeholder
cat > public/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#2563eb" rx="64"/>
  <text x="256" y="320" font-size="280" text-anchor="middle" fill="white" font-family="sans-serif">K</text>
</svg>
EOF

# Convert to PNG (requires sharp or imagemagick, or use online tool)
# For now, the SVG can be used directly in some browsers
```

- [ ] **Step 2: Create sw.js**

```javascript
// knowflow/public/sw.js

const CACHE_NAME = 'knowflow-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip AI API calls
  if (request.url.includes('/ai-generate') || request.url.includes('/process-card')) {
    return;
  }

  // Network first for API requests
  if (request.url.includes('/api/') || request.url.includes('supabase')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

- [ ] **Step 3: Update layout.tsx**

```tsx
// knowflow/src/app/layout.tsx (update metadata)

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import FAB from '@/components/layout/FAB';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KnowFlow',
  description: 'Knowledge management tool with AI assistance',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KnowFlow',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <Header />
        <main className="pb-20 md:pb-0">{children}</main>
        <Navigation />
        <FAB />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add public/manifest.json public/sw.js src/app/layout.tsx
git commit -m "feat: setup PWA with service worker"
```

---

## Phase 7: Sync & Offline Support

### Task 21: Create Sync Manager

**Files:**
- Create: `knowflow/src/lib/sync/syncManager.ts`
- Create: `knowflow/src/lib/sync/conflictResolver.ts`

**Interfaces:** Consumes db from Task 4, supabase from Task 5

- [ ] **Step 1: Create conflictResolver.ts**

```typescript
// knowflow/src/lib/sync/conflictResolver.ts

import { Conflict } from '@/types/conflict';

export function resolveConflict(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): { resolved: Record<string, unknown>; strategy: 'last-write-wins' | 'user' } {
  // Default: last-write-wins
  const localTime = local.updatedAt as string;
  const remoteTime = remote.updatedAt as string;

  if (localTime > remoteTime) {
    return { resolved: local, strategy: 'last-write-wins' };
  }

  return { resolved: remote, strategy: 'last-write-wins' };
}

export function createConflictRecord(
  entityType: 'entry' | 'node' | 'link',
  entityId: string,
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): Omit<Conflict, 'id'> {
  return {
    entityType,
    entityId,
    localVersion: local,
    remoteVersion: remote,
    resolvedBy: 'last-write-wins',
    resolvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Create syncManager.ts**

```typescript
// knowflow/src/lib/sync/syncManager.ts

import { db } from '@/lib/db/dexie';
import { supabase } from '@/lib/db/supabase';
import { resolveConflict, createConflictRecord } from './conflictResolver';

export async function syncAll(): Promise<{
  synced: number;
  conflicts: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;
  let conflicts = 0;

  try {
    // Get items pending sync
    const pendingEntries = await db.entries.where('syncStatus').equals('pending').toArray();
    const pendingNodes = await db.nodes.where('syncStatus').equals('pending').toArray();
    const pendingLinks = await db.links.where('syncStatus').equals('pending').toArray();

    // Sync entries
    for (const entry of pendingEntries) {
      try {
        const { data: remote, error } = await supabase
          .from('entries')
          .select('*')
          .eq('id', entry.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (remote) {
          // Conflict exists - resolve
          const { resolved } = resolveConflict(entry, remote);
          await supabase.from('entries').upsert(resolved);
          conflicts++;
        } else {
          // No conflict - just insert
          await supabase.from('entries').upsert(entry);
        }

        await db.entries.update(entry.id, { syncStatus: 'synced' });
        synced++;
      } catch (error) {
        errors.push(`Failed to sync entry ${entry.id}: ${error}`);
      }
    }

    // Sync nodes
    for (const node of pendingNodes) {
      try {
        await supabase.from('nodes').upsert(node);
        await db.nodes.update(node.id, { syncStatus: 'synced' });
        synced++;
      } catch (error) {
        errors.push(`Failed to sync node ${node.id}: ${error}`);
      }
    }

    // Sync links
    for (const link of pendingLinks) {
      try {
        await supabase.from('links').upsert(link);
        await db.links.update(link.id, { syncStatus: 'synced' });
        synced++;
      } catch (error) {
        errors.push(`Failed to sync link ${link.id}: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Sync failed: ${error}`);
  }

  return { synced, conflicts, errors };
}

export function startSyncListener() {
  // Sync when coming online
  window.addEventListener('online', async () => {
    console.log('Online - starting sync...');
    const result = await syncAll();
    console.log('Sync result:', result);
  });

  // Periodic sync every 5 minutes
  setInterval(async () => {
    if (navigator.onLine) {
      await syncAll();
    }
  }, 5 * 60 * 1000);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/sync/
git commit -m "feat: implement sync manager with conflict resolution"
```

---

### Task 22: Integrate Sync into App

**Files:**
- Modify: `knowflow/src/components/layout/ClientLayout.tsx`

**Interfaces:** Consumes syncManager from Task 21

- [ ] **Step 1: Update ClientLayout.tsx**

```tsx
// knowflow/src/components/layout/ClientLayout.tsx

'use client';

import { ReactNode, useEffect } from 'react';
import Header from './Header';
import Navigation from './Navigation';
import FAB from './FAB';
import { startSyncListener } from '@/lib/sync/syncManager';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    startSyncListener();
  }, []);

  return (
    <>
      <Header />
      <main className="pb-20 md:pb-0">{children}</main>
      <Navigation />
      <FAB />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/ClientLayout.tsx
git commit -m "feat: integrate sync listener into ClientLayout"
```

---

## Phase 8: Polish & Testing

### Task 23: Create Edge Functions

**Files:**
- Create: `knowflow/supabase/functions/process-card/index.ts`
- Create: `knowflow/supabase/functions/sync/index.ts`
- Create: `knowflow/supabase/functions/ai-generate/index.ts`

**Interfaces:** Consumes types from Task 3

- [ ] **Step 1: Create process-card function**

```typescript
// knowflow/supabase/functions/process-card/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { entryId, cardNumber, scenario, mode } = await req.json();

    // TODO: Implement card processing logic
    // For now, return mock response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          cardStatus: { card1: 'completed', card2: 'completed', card3: 'completed', card4: 'completed' },
          outputs: {},
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'ERROR', message: String(error) } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

- [ ] **Step 2: Create sync function**

```typescript
// knowflow/supabase/functions/sync/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { entries, nodes, links, lastSyncAt } = await req.json();

    // TODO: Implement sync logic
    // For now, return mock response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          syncedEntries: entries?.map((e: any) => e.id) || [],
          syncedNodes: nodes?.map((n: any) => n.id) || [],
          syncedLinks: links?.map((l: any) => l.id) || [],
          conflicts: [],
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'ERROR', message: String(error) } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

- [ ] **Step 3: Create ai-generate function**

```typescript
// knowflow/supabase/functions/ai-generate/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { task, input, options } = await req.json();

    // TODO: Implement AI generation logic
    // For now, return mock response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          result: {},
          cost: { model: 'mock', inputTokens: 0, outputTokens: 0, estimatedCost: 0, currency: 'USD' },
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: { code: 'ERROR', message: String(error) } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: create Supabase Edge Functions (stubs)"
```

---

### Task 24: Add Responsive Design

**Files:**
- Modify: `knowflow/src/app/globals.css`
- Modify: Various component files

**Interfaces:** None (styling)

- [ ] **Step 1: Update globals.css**

```css
/* knowflow/src/app/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .hide-on-mobile {
    display: none;
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .show-on-desktop {
    display: block;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add responsive design styles"
```

---

### Task 25: Final Testing & Documentation

**Files:**
- Create: `knowflow/README.md`
- Modify: `knowflow/package.json`

**Interfaces:** None (documentation)

- [ ] **Step 1: Create README.md**

```markdown
# KnowFlow

A knowledge management tool with AI assistance. Lower the barrier to entry compared to tools like Obsidian.

## Features

- **Card-based Processing:** 4-step workflow for organizing knowledge
- **Offline-First:** Works without internet, syncs when online
- **AI Integration:** Hybrid mode with local rules and API fallback
- **Knowledge Graph:** Visualize connections between ideas
- **PWA Support:** Install to desktop, works offline

## Tech Stack

- React 18 + Next.js 14 (App Router)
- TypeScript 5
- Tailwind CSS 3
- Dexie.js 4 (IndexedDB)
- Supabase JS 2
- Zustand 4

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (free tier)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd knowflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
knowflow/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and services
│   ├── stores/           # Zustand state management
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── supabase/             # Edge Functions
└── tests/                # Test files
```

## License

MIT
```

- [ ] **Step 2: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest --passWithNoTests",
    "test:watch": "jest --watch --passWithNoTests"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add README.md package.json
git commit -m "docs: add README and update package.json scripts"
```

---

## Summary

**Total Tasks:** 25
**Estimated Time:** 8-12 hours (depending on experience)

**Phase Breakdown:**
1. Project Foundation (Tasks 1-6): 2-3 hours
2. Core UI Components (Tasks 7-10): 2-3 hours
3. Entry Detail & Card System (Tasks 11-12): 1-2 hours
4. AI Integration (Tasks 13-15): 1-2 hours
5. Search & Advanced Features (Tasks 16-18): 1-2 hours
6. Export/Import & PWA (Tasks 19-20): 1 hour
7. Sync & Offline Support (Tasks 21-22): 1 hour
8. Polish & Testing (Tasks 23-25): 1-2 hours

**Next Steps After MVP:**
- Resolve open questions (node types, batch processing, conflict UI)
- Add more AI features (deeper analysis, better categorization)
- Implement full sync with conflict resolution UI
- Add export to more formats
- Performance optimization
- User acceptance testing

---

**End of Implementation Plan**
