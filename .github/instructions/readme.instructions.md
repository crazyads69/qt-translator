---
applyTo: '**'
---
# QT Translator - Chinese Novel Translation Tool

A modern web application for translating Chinese novels from Quick Translator (QT) output to polished Vietnamese text using DeepSeek AI via Vercel AI SDK.

## ✨ Features

- **Dual-Panel Editor**: Side-by-side QT input and Vietnamese output
- **AI-Powered Translation**: Uses DeepSeek API via Vercel AI SDK for:
  - QT to Vietnamese translation
  - Text polishing & refinement
  - Spell checking
- **Context Menu**: Right-click any word to:
  - Quick replace across document
  - Highlight words
  - Lookup in Han-Viet dictionary
  - Search on Google Translate, Baidu Baike, Rung.vn
- **Auto-Save**:
  - LocalStorage backup every 30 seconds
  - Save on blur/lose focus
  - Cloud sync to Cloudflare R2
- **Before Unload Protection**: Warns before closing tab with unsaved changes
- **OAuth Protection**: GitHub OAuth for private deployment
- **Import/Export**: Load .txt files and export results

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Auth**: NextAuth.js (GitHub OAuth)
- **AI**: DeepSeek API via Vercel AI SDK
- **Storage**: 
  - LocalStorage (quick auto-save)
  - Cloudflare R2 (permanent cloud backup)

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** 18+ installed (or **Bun** for faster package management)
2. **DeepSeek API Key** from [DeepSeek Platform](https://platform.deepseek.com/)
3. **GitHub OAuth App** credentials:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App
   - Set Homepage URL: `http://localhost:3000`
   - Set Callback URL: `http://localhost:3000/api/auth/callback/github`
4. **Cloudflare R2 Bucket** with credentials:
   - Create an R2 bucket in Cloudflare dashboard
   - Create R2 API token with read/write permissions
   - Get endpoint URL, access key ID, and secret access key

## 🚀 Setup Instructions

### 1. Clone and Install

```bash
cd qt-translator
bun install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# DeepSeek API (via Vercel AI SDK)
DEEPSEEK_API_KEY=sk-...

# Cloudflare R2
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your-r2-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-r2-secret-key
CLOUDFLARE_R2_BUCKET=your-bucket-name
```

### 3. Configure GitHub OAuth Whitelist

Edit `app/api/auth/[...nextauth]/route.ts` and add your GitHub username:

```typescript
const allowedUsers = [
  "your-github-username"  // Add your username here
];
```

### 4. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add all environment variables from `.env.local`
4. Update GitHub OAuth callback URL:
   - Go to GitHub OAuth App settings
   - Change callback to: `https://your-app.vercel.app/api/auth/callback/github`
   - Update `NEXTAUTH_URL` in Vercel env vars
5. Deploy!

## 🎯 Usage Guide

### Basic Workflow

1. **Import QT Text**
   - Paste Quick Translator output into left panel
   - Or click "Import" to upload a .txt file

2. **Translate**
   - Click "Translate" to convert QT → Vietnamese
   - Or use "Batch All" for line-by-line translation

3. **Refine**
   - Click "Polish Text" to improve flow
   - Click "Fix Spelling" to check errors
   - Edit manually in the output panel

4. **Word Operations**
   - Select any word → Right-click
   - Choose "Quick Replace" to replace all occurrences
   - Choose "Highlight Word" to mark it
   - Or lookup in external dictionaries

5. **Save**
   - Auto-saves to LocalStorage every 30 seconds
   - Click "Save to Cloud" for S3 backup
   - Export as .txt file when done

### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Manual save (browser default)
- `Ctrl/Cmd + A`: Select all text
- Right-click: Open context menu

## 🏗️ Project Structure

```
qt-translator/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth configuration
│   │   ├── translate/             # DeepSeek API endpoint
│   │   └── r2/                    # R2 save/load endpoints
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page
├── components/
│   ├── editor/
│   │   ├── editor.tsx             # Main editor component
│   │   ├── input-panel.tsx        # QT input panel
│   │   ├── output-panel.tsx       # Vietnamese output panel
│   │   └── toolbar.tsx            # Toolbar component
│   ├── ui/                        # shadcn/ui components
│   └── providers.tsx              # NextAuth provider
├── lib/
│   ├── storage.ts                 # LocalStorage utilities
│   ├── translator.ts              # DeepSeek API client (Vercel AI SDK)
│   ├── r2.ts                      # R2 utilities
│   └── utils.ts                   # Helper functions
└── middleware.ts                  # Auth middleware
```

## 🔧 Configuration

### Customizing Translation Prompts

Edit `app/api/translate/route.ts` to customize DeepSeek's behavior:

```typescript
// Adjust system prompts for each action
switch (action) {
  case "translate":
    systemPrompt = "Your custom translation prompt...";
    break;
  // ...
}
```

### Adjusting Auto-Save Interval

Edit `components/editor/editor.tsx`:

```typescript
setTimeout(() => {
  saveToLocalStorage();
}, 30000); // Change 30000 (30 seconds) to your preferred interval
```

### R2 Bucket Structure

Default structure: `{username}/projects/{projectId}.json`

Customize in `app/api/r2/save/route.ts`:

```typescript
const key = `${githubUsername}/projects/${projectId}.json`;
// Change to your preferred structure
```

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check GitHub OAuth credentials
- Verify your username is in the whitelist
- Ensure callback URL matches

### Translation Fails
- Verify DeepSeek API key is correct
- Check API usage limits at DeepSeek platform
- Review console for error messages

### R2 Save Fails
- Verify Cloudflare R2 credentials
- Check R2 bucket permissions
- Ensure endpoint URL is correct

### Context Menu Not Working
- Make sure text is selected before right-clicking
- Try refreshing the page
- Check browser console for errors

## 📝 Development Notes

### Adding New Translation Actions

1. Add action type to `lib/translator.ts`:
```typescript
export type TranslateAction = "translate" | "polish" | "fix_spelling" | "your_action";
```

2. Add handler in `app/api/translate/route.ts`
3. Add button in `components/editor/editor.tsx`

### Extending Context Menu

Edit `components/editor/output-panel.tsx`:

```typescript
<ContextMenuItem onClick={() => yourAction()}>
  <YourIcon className="mr-2 h-4 w-4" />
  Your Action
</ContextMenuItem>
```

## 🤝 Contributing

This is a personal project, but feel free to fork and customize for your needs!

## 📄 License

MIT License - feel free to use for personal projects

## 🙏 Acknowledgments

- Quick Translator tool and Vietnamese translation community
- DeepSeek AI for powerful language models
- Vercel AI SDK for seamless API integration
- Cloudflare R2 for reliable cloud storage
- shadcn/ui for beautiful components
- Next.js team for the amazing framework

---

**Happy Translating! 📚✨**

If you encounter any issues, check the console logs or open an issue on GitHub.