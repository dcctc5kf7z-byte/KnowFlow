# KnowFlow — Session Handoff

**Date:** 2026-07-05
**Phase:** Spec Written → Ready for User Review
**Next Step:** User reviews spec, then transition to `writing-plans` skill

---

## What Was Done

### 1. Product Definition
- **Name:** KnowFlow
- **Positioning:** Knowledge management tool for everyone, lowering barrier to entry vs Obsidian
- **Core flow:** User inputs scattered text → AI organizes, categorizes, recommends angles, extracts essence, connects to existing knowledge → visual knowledge graph
- **Business model:** Free basic (local rules) + paid deep analysis (AI API credits)

### 2. Tech Stack Confirmed
- React + Next.js + Tailwind CSS
- Supabase (free tier)
- IndexedDB (Dexie.js) for local storage
- Vercel deployment
- PWA support

### 3. Card Module System (4 Cards)
1. 📥 输入与记录 — Raw text storage, language detection, tag suggestions
2. 🧩 归纳与分类 — Category, sub-category, tags, summary, keywords
3. ❓ 推荐思考角度 — Recommended angles list (NOT mandatory questions)
4. 🔬 提炼与关联 — Keywords + golden quotes (MVP, not abstract "reusable frameworks")

### 4. Processing Scenarios (4)
- 快速记录 (Quick capture, local rules)
- 深度消化 (Full AI analysis)
- 写作素材 (Focus on quotes/angles)
- 知识关联 (Focus on cross-entry connections)

Mid-flow scenario switching supported.

### 5. Data Model
- **Entry:** All card outputs in one record (not separate tables per card)
  - Includes: cardStatus, angles (embedded), sourceUrl, sourceType, deletedAt, syncStatus
- **Node:** Reusable knowledge units (keyword, concept, person, tool, other)
  - Includes: deletedAt, syncStatus
- **Link:** Relationships between nodes (weight 1-5, AI-generated, user-adjustable)
  - Includes: syncStatus
- **Draft:** Local IndexedDB + Supabase sync for logged-in users, 30-day retention

### 6. UI/UX Decisions
- **Navigation:** `KnowFlow [+] [🔍] [⚙️]` — no hamburger menu
- **Home:** Knowledge library + FAB modal for capture (not separate capture page)
- **Entry detail:** Step bar + expandable cards (not stacked blocking cards)
- **Knowledge graph:** Progressive (seed ≤2, sprout 3-7, full ≥8) with animations
- **Smart grouping:** 本周新捕获 / 高频回顾 / 待关联孤儿 (hide empty groups)
- **Responsive:** Desktop 3-col, Tablet 2-col, Mobile 1-col with bottom Tab + FAB

### 7. AI Integration
- **Mode A (Local):** TF-IDF, template-based categorization, rule-based. Free, offline.
- **Mode B (API):** OpenAI/Claude semantic analysis. User's own API key.
- **Fallback:** Auto-degrade on API failure, manual + auto recovery
- **Cost transparency:** Estimated cost shown before each card processing

### 8. Card Status States
```
[✅ 已完成] [🔄 处理中] [⏸ 待处理] [⚠️ 已降级] [❌ 失败]
```

---

## What Needs to Be Done Next

### Immediate (This Session)
1. ~~**Write full design spec**~~ → DONE (2026-07-05)
2. ~~**Run spec self-review**~~ → DONE (2026-07-05)
3. **User reviews spec** ← CURRENT STEP
4. **Transition to `writing-plans` skill**

### Future
- [ ] Resolve open questions:
  - Node type "keyword" vs "concept" boundary
  - Interval repetition algorithm choice
  - Batch processing queue implementation
  - Conflict resolution UI
- [ ] Implement MVP
- [ ] Test on Vercel deployment
- [ ] User acceptance testing

---

## Key Design References

| Topic | Location |
|-------|----------|
| Developer log | `CLAUDE.md` → "KnowFlow — Developer Log" section |
| Design decisions | This document |
| Full spec | `docs/superpowers/specs/2026-07-05-knowflow-design.md` ✅ |

---

## Session Context

- **Brainstorming skill** was used for the design process
- Design went through 5 sections: product name, card system, data model, AI integration, UI/UX
- Multiple rounds of user feedback incorporated (card 3 language, card 4 scope, scenario system, empty states, etc.)
- User is familiar with React + Next.js + Supabase stack
- User has no business license (personal project, deploy to international platforms)
