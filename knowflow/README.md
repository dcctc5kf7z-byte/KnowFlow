# KnowFlow

A knowledge management tool with AI assistance. Lower the barrier to entry compared to tools like Obsidian.

## Features

- **Card-based Processing:** 4-step workflow for organizing knowledge
- **Offline-First:** Works without internet, syncs when online
- **AI Integration:** Hybrid mode with local rules and API fallback
- **Knowledge Graph:** Visualize connections between ideas
- **PWA Support:** Install to desktop, works offline

## Tech Stack

- React 19 + Next.js 16 (App Router)
- TypeScript 5
- Tailwind CSS 4
- Dexie.js 4 (IndexedDB)
- Supabase JS 2
- Zustand 5

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
