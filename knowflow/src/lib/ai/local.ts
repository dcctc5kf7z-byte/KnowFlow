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

// ─── Card 1: Input & Record ───────────────────────────────────────────────────

export function processCard1(rawText: string): Pick<LocalAIResult, 'language' | 'title' | 'tags'> {
  const language = detectLanguage(rawText);

  // Smarter title: first meaningful sentence or clause, capped at 60 chars
  const title = extractTitle(rawText, language);

  // Extract tags: keywords + detected entities
  const keywords = extractKeywords(rawText, 5);
  const entities = extractEntities(rawText);
  const tags = [...new Set([...keywords, ...entities])].slice(0, 6);

  return { language, title, tags };
}

function extractTitle(text: string, language: string): string {
  // Try to find the first meaningful sentence
  const sentences = text
    .split(/[。！？.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 4 && s.length < 200);

  if (sentences.length > 0) {
    const first = sentences[0];
    return first.length > 60 ? first.slice(0, 57) + '...' : first;
  }

  // Fallback: first 60 chars
  return text.length > 60 ? text.slice(0, 57) + '...' : text;
}

function extractEntities(text: string): string[] {
  const entities: string[] = [];

  // Detect capitalized words (English proper nouns / tech terms)
  const capitalWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  entities.push(...capitalWords.filter(w => w.length > 2));

  // Detect Chinese terms in parentheses — often domain-specific
  const cnTerms = text.match(/（[^）]+）/g) || [];
  entities.push(...cnTerms.map(t => t.slice(1, -1)));

  // Detect tech patterns: file extensions, camelCase, snake_case
  const techPatterns = text.match(/\b\w+\.\w{2,4}\b/g) || []; // e.g. style.css
  entities.push(...techPatterns);

  // Detect code-like references
  const codeRefs = text.match(/`[^`]+`/g) || [];
  entities.push(...codeRefs.map(r => r.slice(1, -1)));

  return [...new Set(entities)].slice(0, 4);
}

// ─── Card 2: Categorize & Classify ────────────────────────────────────────────

export function processCard2(rawText: string): Pick<LocalAIResult, 'category' | 'summary' | 'keywords' | 'subCategory'> {
  const keywords = extractKeywords(rawText, 8);
  const category = categorizeText(rawText, keywords);
  const summary = generateSummary(rawText);
  const subCategory = detectSubCategory(rawText, category);

  return { category, summary, keywords, subCategory };
}

function categorizeText(text: string, keywords: string[]): string {
  const lower = text.toLowerCase();

  // Rule-based categorization with scoring
  const scores: Record<string, number> = {
    'Technology': 0,
    'Science': 0,
    'Philosophy': 0,
    'Business': 0,
    'Health': 0,
    'Education': 0,
    'Creative': 0,
    'Life': 0,
  };

  // Tech signals
  if (/\b(code|api|function|component|react|next|css|html|python|git|npm|node)\b/i.test(lower)) scores.Technology += 3;
  if (/\b(bug|error|debug|deploy|build|test)\b/i.test(lower)) scores.Technology += 2;
  if (/\b(软件|代码|编程|开发|框架|接口|数据库)\b/.test(text)) scores.Technology += 3;

  // Science signals
  if (/\b(experiment|hypothesis|theory|research|data|analysis)\b/i.test(lower)) scores.Science += 2;
  if (/\b(实验|假设|理论|研究|数据|分析)\b/.test(text)) scores.Science += 3;

  // Philosophy signals
  if (/\b(philosophy|ethics|meaning|existence|consciousness|truth)\b/i.test(lower)) scores.Philosophy += 3;
  if (/\b(哲学|伦理|意义|存在|意识|真理|思考|思维)\b/.test(text)) scores.Philosophy += 3;

  // Business signals
  if (/\b(business|market|revenue|strategy|product|customer)\b/i.test(lower)) scores.Business += 2;
  if (/\b(商业|市场|营收|策略|产品|用户|运营)\b/.test(text)) scores.Business += 3;

  // Health signals
  if (/\b(health|exercise|diet|sleep|mental|wellness)\b/i.test(lower)) scores.Health += 2;
  if (/\b(健康|运动|饮食|睡眠|心理|养生)\b/.test(text)) scores.Health += 3;

  // Education signals
  if (/\b(learn|teach|study|course|skill|knowledge)\b/i.test(lower)) scores.Education += 2;
  if (/\b(学习|教学|课程|技能|知识|教育)\b/.test(text)) scores.Education += 3;

  // Creative signals
  if (/\b(design|art|music|write|creative|story)\b/i.test(lower)) scores.Creative += 2;
  if (/\b(设计|艺术|音乐|写作|创意|故事)\b/.test(text)) scores.Creative += 3;

  // Life signals
  if (/\b(life|family|friend|travel|food|daily)\b/i.test(lower)) scores.Life += 2;
  if (/\b(生活|家庭|朋友|旅行|美食|日常)\b/.test(text)) scores.Life += 3;

  // Pick highest score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'Other';
}

function detectSubCategory(text: string, category: string): string | undefined {
  const lower = text.toLowerCase();

  const subCategories: Record<string, Record<string, string[]>> = {
    Technology: {
      'Frontend': ['react', 'vue', 'css', 'html', 'component', 'ui', '前端'],
      'Backend': ['api', 'server', 'database', 'sql', 'node', '后端'],
      'DevOps': ['deploy', 'ci/cd', 'docker', 'kubernetes', '运维'],
      'AI/ML': ['ai', 'machine learning', 'neural', 'gpt', 'llm', '人工智能'],
    },
    Philosophy: {
      'Epistemology': ['knowledge', 'truth', 'belief', '认识论'],
      'Ethics': ['moral', 'ethics', 'good', 'right', '伦理'],
      'Metaphysics': ['existence', 'reality', 'consciousness', '形而上学'],
    },
  };

  const categorySubs = subCategories[category];
  if (!categorySubs) return undefined;

  for (const [sub, signals] of Object.entries(categorySubs)) {
    if (signals.some(s => lower.includes(s))) return sub;
  }
  return undefined;
}

function generateSummary(text: string): string {
  // Extract first 2-3 meaningful sentences as summary
  const sentences = text
    .split(/[。！？.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8 && s.length < 300);

  if (sentences.length === 0) return text.slice(0, 150);

  const summaryParts = sentences.slice(0, 2);
  const joined = summaryParts.join('。');
  return joined.length > 200 ? joined.slice(0, 197) + '...' : joined;
}

// ─── Card 3: Recommended Angles ───────────────────────────────────────────────

export function processCard3(rawText: string, category?: string): Pick<LocalAIResult, 'angles'> {
  const lower = rawText.toLowerCase();
  const angles: Angle[] = [];

  // Category-specific thinking angles
  const anglePool: Record<string, string[]> = {
    Technology: [
      '这个方案的可扩展性如何？',
      '有没有更简洁的实现方式？',
      '在生产环境中的性能表现如何？',
      '与现有技术栈的兼容性怎样？',
      '维护成本和学习曲线如何？',
    ],
    Philosophy: [
      '这个观点的前提假设是什么？',
      '反方会如何反驳？',
      '这个思想在实践中如何应用？',
      '与其他哲学流派有何异同？',
      '对个人生活有什么启示？',
    ],
    Business: [
      '目标用户是谁？痛点是什么？',
      '商业模式是否可持续？',
      '竞争对手如何应对？',
      '投入产出比如何？',
      '有哪些潜在风险？',
    ],
    Science: [
      '这个结论的置信度如何？',
      '实验设计是否合理？',
      '有哪些混淆变量？',
      '能否复现这个结果？',
      '对现有理论有什么挑战？',
    ],
    Education: [
      '核心概念如何用简单语言解释？',
      '有哪些直观的例子？',
      '常见的误解是什么？',
      '如何循序渐进地学习？',
      '与已知知识如何关联？',
    ],
    Creative: [
      '灵感来源是什么？',
      '如何突破常规思维？',
      '用户体验的关键触点在哪？',
      '有哪些可以借鉴的设计模式？',
      '如何平衡创意与实用性？',
    ],
  };

  // Primary angles from category
  const primaryAngles = anglePool[category || 'Technology'] || anglePool.Technology;
  const selectedPrimary = primaryAngles.slice(0, 2);
  selectedPrimary.forEach(text => {
    angles.push({ id: crypto.randomUUID(), text, selected: false, source: 'local' });
  });

  // Content-aware angles
  if (/\b(问题|bug|错误|失败|困难)\b/.test(rawText)) {
    angles.push({
      id: crypto.randomUUID(),
      text: '根本原因是什么？有没有系统性的解决方案？',
      selected: false,
      source: 'local',
    });
  }

  if (/\b(比较|对比|vs|区别|差异)\b/.test(lower)) {
    angles.push({
      id: crypto.randomUUID(),
      text: '比较的核心维度有哪些？各有什么优劣？',
      selected: false,
      source: 'local',
    });
  }

  if (/\b(想法|思考|观点|认为|觉得)\b/.test(rawText)) {
    angles.push({
      id: crypto.randomUUID(),
      text: '这个观点有哪些支持和反对的证据？',
      selected: false,
      source: 'local',
    });
  }

  // Generic but useful angles
  angles.push({
    id: crypto.randomUUID(),
    text: '这个知识点如何与我已有的知识关联？',
    selected: false,
    source: 'local',
  });

  angles.push({
    id: crypto.randomUUID(),
    text: '如何用一句话向别人解释这个内容？',
    selected: false,
    source: 'local',
  });

  return { angles: angles.slice(0, 5) };
}

// ─── Card 4: Extract & Connect ────────────────────────────────────────────────

export function processCard4(rawText: string): Pick<LocalAIResult, 'goldenQuotes'> {
  const goldenQuotes: GoldenQuote[] = [];

  // Strategy 1: Find highlighted / emphasized text
  const highlighted = rawText.match(/[*_]{1,3}[^*_]+[*_]{1,3}/g) || [];
  highlighted.forEach(text => {
    goldenQuotes.push({
      id: crypto.randomUUID(),
      text: text.replace(/[*_]{1,3}/g, '').trim(),
    });
  });

  // Strategy 2: Find quoted text
  const quoted = rawText.match(/[""「」『』][^""「」『』]+[""「」『』]/g) || [];
  quoted.forEach(text => {
    const clean = text.slice(1, -1).trim();
    if (clean.length > 10) {
      goldenQuotes.push({ id: crypto.randomUUID(), text: clean });
    }
  });

  // Strategy 3: Find sentences with key signal words
  const sentences = rawText.split(/[。！？.!?\n]+/).filter(s => s.trim().length > 15);
  const signalWords = /(?:重要的是|关键|核心|本质|实际上|本质上|important|key|essential|fundamental|actually|in essence)/i;

  sentences.forEach(s => {
    if (signalWords.test(s) && goldenQuotes.length < 5) {
      goldenQuotes.push({
        id: crypto.randomUUID(),
        text: s.trim(),
      });
    }
  });

  // Strategy 4: Find definition-like patterns (X is Y / X 是 Y)
  const definitions = rawText.match(/[^。！？.!?]*(?:是|为|叫做|refers to|is defined as|means)[^。！？.!?]+/gi) || [];
  definitions.forEach(d => {
    if (d.trim().length > 10 && goldenQuotes.length < 5) {
      goldenQuotes.push({
        id: crypto.randomUUID(),
        text: d.trim(),
      });
    }
  });

  // Strategy 5: If still few quotes, extract first substantial sentences
  if (goldenQuotes.length < 2) {
    const substantial = sentences
      .filter(s => s.trim().length > 20)
      .slice(0, 2);
    substantial.forEach(s => {
      goldenQuotes.push({ id: crypto.randomUUID(), text: s.trim() });
    });
  }

  // Deduplicate by similarity
  const seen = new Set<string>();
  const unique = goldenQuotes.filter(q => {
    const key = q.text.toLowerCase().slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { goldenQuotes: unique.slice(0, 4) };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function processLocally(rawText: string): LocalAIResult {
  const card1 = processCard1(rawText);
  const card2 = processCard2(rawText);
  const card3 = processCard3(rawText, card2.category);
  const card4 = processCard4(rawText);

  return {
    ...card1,
    ...card2,
    ...card3,
    ...card4,
  };
}
