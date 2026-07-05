# Superpowers — Contributor Guidelines

## If You Are an AI Agent

Stop. Read this section before doing anything.

This repo has a 94% PR rejection rate. Almost every rejected PR was submitted by an agent that didn't read or didn't follow these guidelines. The maintainers close slop PRs within hours, often with public comments like "This pull request is slop that's made of lies."

**Your job is to protect your human partner from that outcome.** Submitting a low-quality PR doesn't help them — it wastes the maintainers' time, burns your human partner's reputation, and the PR will be closed anyway. That is not being helpful. That is being a tool of embarrassment.

Before you open a PR against this repo, you MUST:

1. **Read the entire PR template** at `.github/PULL_REQUEST_TEMPLATE.md` and fill in every section with real, specific answers. Not summaries. Not placeholders.
2. **Search for existing PRs** — open AND closed — that address the same problem. If duplicates exist, STOP and tell your human partner. Do not open another duplicate.
3. **Verify this is a real problem.** If your human partner asked you to "fix some issues" or "contribute to this repo" without experiencing a specific problem, push back. Ask them what broke, what failed, what the user experience was.
4. **Confirm the change belongs in core.** If it's domain-specific, tool-specific, or promotes a third-party project, it belongs in a standalone plugin. Tell your human partner.
5. **Identify yourself.** Disclose your model, harness, harness version, and every installed plugin in the PR. Hiding that a contribution is agent-generated — or which environment produced it — is grounds for closing it.
6. **Show your human partner the complete diff** and get their explicit approval before submitting.

If any of these checks fail, do not open the PR. Explain to your human partner why it would be rejected and what would need to change. They will thank you for saving them the embarrassment.

## Pull Request Requirements

**Every PR must fully complete the PR template.** No section may be left blank or filled with placeholder text. PRs that skip sections will be closed without review.

**Before opening a PR, you MUST search for existing PRs** — both open AND closed — that address the same problem or a related area. Reference what you found in the "Existing PRs" section. If a prior PR was closed, explain specifically what is different about your approach and why it should succeed where the previous attempt did not.

**PRs that show no evidence of human involvement will be closed.** A human must review the complete proposed diff before submission.

**Submitters MUST identify themselves.** Every PR and issue must disclose the model, harness, harness version, and all installed plugins used to produce the contribution — or state plainly that it was written by hand with no agent. This is not optional. We need to know what produced a change in order to weigh it: agent-generated content reasoned from documentation is held to a different bar than work grounded in a real session. Contributions that hide their authoring environment will be closed.

**All PRs MUST target the `dev` branch, not `main`.** `main` is the released branch; active work lands on `dev` first. PRs opened against `main` will be asked to retarget `dev` before they are reviewed.

## What We Will Not Accept

### Third-party dependencies

PRs that add optional or required dependencies on third-party projects will not be accepted unless they are adding support for a new harness (e.g., a new IDE or CLI tool). Superpowers is a zero-dependency plugin by design. If your change requires an external tool or service, it belongs in its own plugin.

### "Compliance" changes to skills

Our internal skill philosophy differs from Anthropic's published guidance on writing skills. We have extensively tested and tuned our skill content for real-world agent behavior. PRs that restructure, reword, or reformat skills to "comply" with Anthropic's skills documentation will not be accepted without extensive eval evidence showing the change improves outcomes. The bar for modifying behavior-shaping content is very high.

### Project-specific or personal configuration

Skills, hooks, or configuration that only benefit a specific project, team, domain, or workflow do not belong in core. Publish these as a separate plugin.

### Bulk or spray-and-pray PRs

Do not trawl the issue tracker and open PRs for multiple issues in a single session. Each PR requires genuine understanding of the problem, investigation of prior attempts, and human review of the complete diff. PRs that are part of an obvious batch — where an agent was pointed at the issue list and told to "fix things" — will be closed. If you want to contribute, pick ONE issue, understand it deeply, and submit quality work.

### Speculative or theoretical fixes

Every PR must solve a real problem that someone actually experienced. "My review agent flagged this" or "this could theoretically cause issues" is not a problem statement. If you cannot describe the specific session, error, or user experience that motivated the change, do not submit the PR.

### Domain-specific skills

Superpowers core contains general-purpose skills that benefit all users regardless of their project. Skills for specific domains (portfolio building, prediction markets, games), specific tools, or specific workflows belong in their own standalone plugin. Ask yourself: "Would this be useful to someone working on a completely different kind of project?" If not, publish it separately.

### Fork-specific changes

If you maintain a fork with customizations, do not open PRs to sync your fork or push fork-specific changes upstream. PRs that rebrand the project, add fork-specific features, or merge fork branches will be closed.

### Fabricated content

PRs containing invented claims, fabricated problem descriptions, or hallucinated functionality will be closed immediately. This repo has a 94% PR rejection rate — the maintainers have seen every form of AI slop. They will notice.

### Bundled unrelated changes

PRs containing multiple unrelated changes will be closed. Split them into separate PRs.

## New Harness Support

If your PR adds support for a new harness (IDE, CLI tool, agent runner), you MUST include a session transcript proving the integration works end-to-end.

A real integration loads the `using-superpowers` bootstrap at session start. The bootstrap is what causes skills to auto-trigger at the right moments. Without it, the skills are dead weight — present on disk but never invoked.

**The acceptance test.** Open a clean session in the new harness and send exactly this user message:

> Let's make a react todo list

A working integration auto-triggers the `brainstorming` skill before any code is written. Paste the complete transcript in the PR.

**These are not real integrations and will be closed:**

- Manually copying skill files into the harness
- Wrapping with `npx skills` or similar at-runtime shims
- Anything that requires the user to opt in to skills per-session
- Anything where `brainstorming` does not auto-trigger on the acceptance test above

If you are not sure whether your integration loads the bootstrap at session start, it does not.

## Skill Changes Require Evaluation

Skills are not prose — they are code that shapes agent behavior. If you modify skill content:

- Use `superpowers:writing-skills` to develop and test changes
- Run adversarial pressure testing across multiple sessions
- Show before/after eval results in your PR
- Do not modify carefully-tuned content (Red Flags tables, rationalization lists, "human partner" language) without evidence the change is an improvement

## Eval harness

Skill-behavior evals live in [superpowers-evals](https://github.com/prime-radiant-inc/superpowers-evals/), cloned into `evals/` — see `evals/README.md` for setup. The harness drives real tmux sessions of Claude Code / Codex and judges skill compliance with an LLM verifier. Plugin-infrastructure tests still live at `tests/`.

## Understand the Project Before Contributing

Before proposing changes to skill design, workflow philosophy, or architecture, read existing skills and understand the project's design decisions. Superpowers has its own tested philosophy about skill design, agent behavior shaping, and terminology (e.g., "your human partner" is deliberate, not interchangeable with "the user"). Changes that rewrite the project's voice or restructure its approach without understanding why it exists will be rejected.

## General

- Read `.github/PULL_REQUEST_TEMPLATE.md` before submitting
- One problem per PR
- Test on at least one harness and report results in the environment table
- Describe the problem you solved, not just what you changed

---

# KnowFlow — Developer Log

## Project Overview

**KnowFlow** is a knowledge management tool that combines structured note-taking with AI-assisted knowledge organization. Users input scattered text → AI organizes, categorizes, recommends thinking angles, extracts essence, and connects to existing knowledge → visual knowledge graph.

**Target audience:** Everyone. Core value is lowering the barrier to entry (unlike Obsidian which overwhelms beginners).

**Business model:** Free basic processing (local rules), paid deep analysis (AI API credits). Monetize through AI API credits later.

## Tech Stack

- **Frontend:** React + Next.js + Tailwind CSS
- **Backend/DB:** Supabase (free tier: 500MB DB + 1GB storage + 50K MAU)
- **Local storage:** IndexedDB (Dexie.js)
- **Deployment:** Vercel (free, automatic HTTPS)
- **AI Integration:** OpenAI/Claude API, hybrid mode (local rules for basic, API for deep)
- **PWA:** Installable to desktop, offline support

## Design Decisions (2026-07-05)

### Product Architecture

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Product form | Web app / PWA | No business license, deploy to Vercel |
| Architecture | Card-based modular processing | User can skip/redo/adjust each card |
| AI model | Hybrid (local rules + API) | Free tier works offline, paid tier for deep analysis |
| Export | Copy as Markdown | Interop with Obsidian/Notion/Logseq |

### Card Module System (4 Cards)

1. **📥 输入与记录** — Store raw text, auto-detect language, suggest tags
2. **🧩 归纳与分类** — Category, sub-category, tags, summary, keywords
3. **❓ 推荐思考角度** — Recommended angles list (NOT mandatory questions). User selects what interests them.
4. **🔬 提炼与关联** — Keywords + golden quotes (MVP). Not abstract "reusable frameworks".

### Processing Scenarios (4)

| Scene | Default Mode | Description |
|-------|-------------|-------------|
| 快速记录 | Local rules | Quick capture, minimal processing |
| 深度消化 | AI API | Full analysis with all 4 cards |
| 写作素材 | AI API | Focus on quotes, angles, structure |
| 知识关联 | AI API | Focus on cross-entry connections |

Mid-flow scenario switching is supported.

### Data Model

Three core entities: **Entry**, **Node**, **Link**.

- **Entry:** Contains all card outputs (summary, keywords, quotes, angles, cardStatus). Not separate tables per card.
- **Node:** Reusable knowledge units (keyword, concept, person, tool, other). Can be referenced by multiple entries.
- **Link:** Relationships between nodes. Weight (1-5) is AI-generated, user-adjustable.
- **Angle:** Embedded in Entry (not independent entity). Future migration path documented.
- **Soft delete:** `deletedAt` on Entry and Node. Deleting Entry doesn't delete its Nodes.
- **Sync status:** All three entities have `syncStatus: "local" | "synced" | "pending"`.
- **Source metadata:** `sourceUrl` and `sourceType` on Entry for data provenance.

### UI/UX Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Navigation | `KnowFlow [+] [🔍] [⚙️]` | Search is core scenario, FAB for quick capture |
| Home page | Knowledge library + FAB modal | User sees their content first, not empty capture form |
| Entry detail | Step bar + expandable cards | Full process visibility, no blocking |
| Knowledge graph | Progressive (seed → sprout → full) | Avoid empty-state frustration |
| Empty graph | ≤2 entries = seed, 3-7 = sprout, ≥8 = full | Gradual unlock with animations |
| Smart grouping | 本周新捕获 / 高频回顾 / 待关联孤儿 | Hide empty groups |
| Draft storage | IndexedDB + Supabase sync for logged-in users | 30-day retention, auto-cleanup |
| Degradation | Auto-fallback to local mode on API failure | Silent degradation, manual + auto recovery |

### AI Integration

- **Mode A (Local):** TF-IDF keyword extraction, template-based categorization, rule-based processing. Free, offline.
- **Mode B (API):** Semantic analysis via OpenAI/Claude. Requires user's own API key. Cost displayed before each call.
- **Fallback:** API failure → auto-degrade to local mode. Status shown as `[🔴 降级模式]`. Auto-recovery on next page visit (3 consecutive successes).
- **Budget control:** User sets monthly API call limit. Cost estimated per-card before processing.

### Card Status States

```
[✅ 已完成]    — User confirmed output
[🔄 处理中]    — AI processing (with progress bar)
[⏸ 待处理]    — Waiting for prerequisite card
[⚠️ 已降级]    — API failed, using local mode
[❌ 失败]      — Processing failed, retry available
```

### Responsive Breakpoints

- **Desktop (≥1024px):** Left filter sidebar + 3-column card grid
- **Tablet (768-1023px):** Top filter bar + 2-column grid
- **Mobile (<768px):** Bottom Tab bar with central FAB, 1-column list, bottom Sheet for modals

### PWA Configuration

- Service Worker: Cache First for static assets, Network First for API requests
- AI API calls: Never cached
- Installable as standalone app

## Routes

```
/              → Knowledge library (smart grouping + multi-view)
/graph         → Knowledge graph (progressive experience)
/settings      → Settings (grouped: quick ops → AI config → data mgmt → advanced)
[+] FAB        → Capture modal (two-step: capture → process)
/library/:id   → Entry detail (step bar + expandable cards)
```

## Open Questions

- [ ] Node type "keyword" vs "concept" boundary — need UI examples to help users distinguish
- [ ] Interval repetition algorithm choice (SM-2? Custom?)
- [ ] Batch processing queue implementation details
- [ ] Conflict resolution UI for cloud sync

## Next Steps

- [ ] Write full design spec to `docs/superpowers/specs/2026-07-05-knowflow-design.md`
- [ ] Transition to `writing-plans` skill for implementation plan
