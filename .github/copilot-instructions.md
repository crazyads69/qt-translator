# QT Translator - AI Coding Agent Instructions

## Project Overview
A Chinese novel translation web application that converts Quick Translator (QT) output to polished Vietnamese text using DeepSeek AI via Vercel AI SDK. The app features dual-panel editing, context menus, auto-save, cloud sync, and GitHub OAuth protection.

## Core Architecture

### Technology Stack
- **Next.js 16 + App Router**: Server Components for auth, API routes for DeepSeek/R2
- **TypeScript**: Strict typing throughout (`Project` interface in `src/lib/storage.ts`)
- **NextAuth.js**: GitHub OAuth with username whitelist in `src/app/api/auth/[...nextauth]/route.ts`
- **Tailwind CSS 4 + shadcn/ui**: Component system configured in `components.json`
- **DeepSeek API + Cloudflare R2**: External service integrations via Vercel AI SDK

### Key Data Flow
```
QT Input → DeepSeek (AI SDK) → Vietnamese Output → LocalStorage + R2 Sync
```

## Critical Implementation Patterns

### 1. Component Structure (Current vs. Intended)
**Current State**: Basic scaffolding with placeholder components
**Target**: Full integration with main editor component

The main application should center around a comprehensive editor component that orchestrates:
- `InputPanel` (QT text) + `OutputPanel` (Vietnamese) side-by-side
- `Toolbar` with translation actions (Translate, Polish, Fix Spelling, Batch All)
- Context menu system for word operations (quick replace, highlight, dictionary lookup)

### 2. State Management Pattern
Use the `Project` interface from `src/lib/storage.ts` as the central data structure:
```typescript
interface Project {
  id: string; title: string; createdAt/updatedAt: string;
  content: { qtInput: string; viOutput: string; };
  metadata: { chapter?, progress?, wordCount?, status? };
}
```

### 3. Authentication Flow
- Middleware: `middleware.ts` protects all routes except auth
- Whitelist: Modify `allowedUsers` array in NextAuth config
- Session: Wrapped in `<Providers>` from `src/components/providers/index.tsx`

### 4. API Integration Points
**Missing but Required:**
- `src/app/api/translate/route.ts` - DeepSeek API endpoint for translation actions
- `src/app/api/r2/save/route.ts` & `load/route.ts` - Cloud storage endpoints
- `src/lib/translator.ts` - Vercel AI SDK client for DeepSeek
- `src/lib/r2.ts` - Cloudflare R2 operations utility

## Development Workflows

### Environment Setup
```bash
# Required environment variables (.env.local)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl
GITHUB_ID=oauth-app-id
GITHUB_SECRET=oauth-app-secret
DEEPSEEK_API_KEY=sk-...
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET=qt-translator-bucket
```

### Development Commands
- `bun dev` - Development server
- `bun run build` - Production build
- `bun run lint` - ESLint check

### Key Dependencies
- `@ai-sdk/deepseek` - Vercel AI SDK for DeepSeek API
- `ai` - Vercel AI SDK core
- `@aws-sdk/client-s3` - S3-compatible operations for R2
- `next-auth` - Authentication
- `uuid` - Project ID generation
- `@radix-ui/*` - Headless UI primitives for context menu/dialogs

## Integration Conventions

### 1. Translation Pipeline
Each translation action (translate, polish, fix_spelling) should:
- Send content to DeepSeek API via Vercel AI SDK with specific system prompts
- Handle errors gracefully (preserve original text)
- Update state immutably
- Trigger auto-save

### 2. Auto-Save Strategy
- **LocalStorage**: Immediate save every 30s + blur events
- **Cloudflare R2**: Manual saves + before-unload protection
- Use `storage.updateContent()` utility consistently

### 3. Context Menu Implementation
Right-click operations on selected text in output panel:
- Quick Replace: Global find/replace with dialog confirmation
- Highlight Words: Toggle yellow highlighting with Set tracking
- Dictionary Links: External lookups (hvdic.thivien.net, Google Translate, Baidu, Rung.vn)

### 4. File Operations
- Import: `.txt` file upload to QT input panel
- Export: Download Vietnamese output as `.txt`
- Use FileReader API for client-side processing

## Component Integration Points

### Main Editor Architecture
The missing main editor component should:
1. Manage global state (qtInput, viOutput, highlightedWords Set)
2. Coordinate between InputPanel and OutputPanel
3. Handle all translation actions via Toolbar
4. Implement auto-save timers
5. Manage loading states for API calls

### UI Component Usage
- Use `Textarea` from `src/components/ui/textarea.tsx` for text inputs
- Use `ContextMenu` components for right-click functionality
- Use `Dialog` components for confirmations (replace text, etc.)
- Use `Button` variants consistently with loading states

## Security Considerations

### OAuth Whitelist
Add GitHub usernames to `allowedUsers` array in `src/app/api/auth/[...nextauth]/route.ts`. The middleware protects all routes.

### API Route Protection
All `/api/` routes (except auth) should validate session:
```typescript
import { getServerSession } from "next-auth/next";
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

## Deployment Considerations

### Vercel Deployment
- Set all environment variables in Vercel dashboard
- Update GitHub OAuth callback URL to production domain
- Ensure `NEXTAUTH_URL` matches deployed URL

### Cloudflare R2 Setup
- Create R2 bucket with appropriate CORS policy
- Generate R2 API tokens with read/write permissions
- Configure custom domain (optional)
- Store credentials securely

## Error Handling Patterns

### API Failures
- DeepSeek API: Preserve original text, show toast notification
- R2 Operations: Fallback to localStorage, show warning
- Auth Failures: Redirect to sign-in page

### Client-Side Resilience
- Implement retry logic for failed API calls
- Validate user input before API requests
- Handle network timeouts gracefully

## Performance Optimizations

### Key Areas
- Debounce auto-save operations
- Implement text chunking for large documents
- Use React.memo for expensive renders (context menu, panels)
- Cache translation results in localStorage

### Bundle Optimization
- Import only needed shadcn/ui components
- Use dynamic imports for heavy features
- Optimize image assets in `/public`

## Testing Strategy
When implementing features, ensure:
1. GitHub OAuth flow works end-to-end
2. Translation actions preserve text on API failure
3. Auto-save triggers correctly (30s timer + blur events)
4. Context menu operations work with text selection
5. File import/export handles various text encodings

Remember: This app's core value is seamless Chinese→Vietnamese translation workflow. Prioritize reliability and data preservation over advanced features.