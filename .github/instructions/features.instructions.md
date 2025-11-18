---
applyTo: '**'
---
# 📚 Features Documentation

Comprehensive guide to all QT Translator features.

## 🎨 User Interface

### Dual-Panel Editor

**Left Panel: QT Input**
- Read-only display (can be edited for corrections)
- Line numbers synchronized with output
- Word and line count statistics
- Accepts paste and file upload

**Right Panel: Vietnamese Output**
- Fully editable
- Real-time updates
- Context menu integration
- Highlight and replace support

### Toolbar

**Project Management**
- Title editing (inline)
- Import .txt files
- Export to .txt
- Save to cloud (S3)
- Clear all content
- Unsaved changes indicator

**Control Bar**
- Translate: Convert QT → Vietnamese
- Polish Text: Refine and smooth text
- Fix Spelling: Check and correct errors
- Batch All: Process line by line

## 🤖 AI Features (DeepSeek via Vercel AI SDK)

### 1. Translation (QT → Vietnamese)

**What it does:**
- Converts messy QT output to natural Vietnamese
- Understands Sino-Vietnamese (Hán Việt) words
- Fixes word order and grammar
- Maintains original meaning

**Best for:**
- Initial translation from QT
- Processing entire chapters
- Getting a baseline translation

**Example:**
```
Input (QT):  "cừu con cừu con là nữ chủ nhân vật"
Output (VI): "Dương Dương là nữ chính của câu chuyện"
```

### 2. Polish Text

**What it does:**
- Improves flow and readability
- Removes awkward phrasing
- Enhances natural feel
- Maintains original style

**Best for:**
- After initial translation
- Making text more elegant
- Final refinement

**Example:**
```
Before: "Cô ấy đi tới chợ mua rau sau đó về nhà nấu ăn"
After:  "Cô ấy đến chợ mua rau rồi về nhà nấu ăn"
```

### 3. Fix Spelling

**What it does:**
- Corrects typos
- Fixes tone marks (dấu thanh)
- Fixes basic grammar
- Preserves style and structure

**Best for:**
- Final proofreading
- Catching small errors
- Before publishing

**Example:**
```
Before: "Cô ay đang di học"
After:  "Cô ấy đang đi học"
```

### 4. Batch Processing

**What it does:**
- Processes text line by line
- Shows progress (X/Y lines)
- Continues on errors (keeps original)
- Good for long documents

**Best for:**
- Long chapters
- When you want sentence-level control
- Processing multiple paragraphs

## 🖱️ Context Menu Features

### Quick Replace

**How to use:**
1. Select a word in output panel
2. Right-click → "Quick Replace"
3. Enter replacement text
4. Replaces ALL occurrences

**Example:**
- Selected: "Dương Dương"
- Replace with: "Yang Yang"
- All instances updated instantly

**Use cases:**
- Fixing character names
- Correcting repeated mistakes
- Standardizing terms

### Highlight Word

**How to use:**
1. Select a word
2. Right-click → "Highlight Word"
3. Word is highlighted in yellow
4. Click again to remove

**Use cases:**
- Mark words to review later
- Track character names
- Identify terms to research

### Dictionary Lookup

**Available dictionaries:**

1. **Hán Việt Dictionary** (hvdic.thivien.net)
   - Best for: Sino-Vietnamese words
   - Shows: Etymology, meaning, examples

2. **Google Translate**
   - Best for: Quick translations
   - Shows: Multiple meanings, usage

3. **Baidu Baike** (Chinese Wikipedia)
   - Best for: Chinese cultural terms
   - Shows: Detailed explanations, history

4. **Rung.vn Dictionary**
   - Best for: Vietnamese definitions
   - Shows: Vietnamese meanings, synonyms

## 💾 Storage & Sync

### LocalStorage (Auto-Save)

**How it works:**
- Saves every 30 seconds automatically
- Saves when you click outside textarea (blur)
- Saves entire project state
- Persists between browser sessions

**What's saved:**
- Project ID and title
- QT input text
- Vietnamese output text
- Metadata (word count, progress)

**Recovery:**
- Reopen browser → Work restored
- Survives page refresh
- Survives browser crash

### R2 Cloud Backup

**How it works:**
- Manual: Click "Save to Cloud" button
- Automatic: When closing tab/browser
- Saves to Cloudflare R2 bucket
- Organized by username and project ID

**Storage structure:**
```
r2://your-bucket/
  └── your-github-username/
      └── projects/
          ├── project-id-1.json
          ├── project-id-2.json
          └── ...
```

**JSON format:**
```json
{
  "id": "uuid",
  "title": "Chapter 1 Translation",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z",
  "content": {
    "qtInput": "...",
    "viOutput": "..."
  },
  "metadata": {
    "wordCount": 3500,
    "progress": 75
  }
}
```

## 🔐 Security Features

### GitHub OAuth

**What it protects:**
- Entire application
- All API endpoints
- Prevents unauthorized access

**How it works:**
1. User visits site
2. Redirects to GitHub login
3. Checks username against whitelist
4. Grants/denies access

**Customization:**
```typescript
// Edit app/api/auth/[...nextauth]/route.ts
const allowedUsers = [
  "your-username",
  "collaborator-username"
];
```

### Before Unload Protection

**What it does:**
- Warns before closing tab
- Prevents accidental data loss
- Auto-syncs to S3 on close

**When it triggers:**
- Closing browser tab
- Closing browser window
- Navigating away from page
- Only if there's content or unsaved changes

## 📊 Statistics & Tracking

**Word Count**
- Real-time count in both panels
- Counts actual words (not just characters)
- Filters empty strings

**Line Count**
- Tracks lines in both panels
- Updates in real-time

**Progress Indicator**
- Shows unsaved changes status
- Updates after every edit
- Clears after save

**Highlighted Words**
- Shows count of highlighted words
- Displayed in status bar

## ⚡ Performance Features

### Efficient Re-renders
- Only updates changed panels
- Debounced auto-save
- Optimized context menu

### Error Handling
- Graceful API failures
- Keeps original text on error
- User-friendly error messages
- Retry capability

### Rate Limiting
- Prevents API abuse
- Queues requests properly
- Shows processing status

## 🎯 Workflow Recommendations

### For New Translations

1. **Import** QT text
2. **Batch All** to translate line by line
3. **Polish Text** to refine
4. **Manual edits** as needed
5. **Fix Spelling** for final check
6. **Save to Cloud** when done

### For Editing Existing Work

1. **Import** previous translation
2. **Manual edits** in output panel
3. **Polish specific sections**
4. **Context menu** for word lookups
5. **Auto-save** handles backup

### For Quick Translations

1. **Paste** QT text
2. **Translate** button
3. **Quick edits**
4. **Export** as .txt

## 💡 Tips & Tricks

**Better Translations:**
- Process 2-3 paragraphs at a time
- Use Polish after major edits
- Keep original QT for reference

**Faster Editing:**
- Use Quick Replace for repeated terms
- Highlight difficult words for later
- Keep dictionary tabs open

**Data Safety:**
- Save to cloud frequently
- Export backups periodically
- Don't rely on browser alone

**Context Menu:**
- Select before right-clicking
- Try multiple dictionaries
- Bookmark useful references

## 🔧 Customization Options

All features can be customized by editing the source code:

- **Translation prompts**: `app/api/translate/route.ts`
- **Auto-save interval**: `components/editor/editor.tsx`
- **Dictionary links**: `components/editor/output-panel.tsx`
- **R2 structure**: `app/api/r2/save/route.ts`
- **UI styling**: `app/globals.css`

## 🐛 Known Limitations

- Max file size: ~5MB (browser limitation)
- API rate limits apply (DeepSeek API)
- LocalStorage: ~5-10MB per site
- Context menu only works on selected text
- R2 requires Cloudflare credentials

## 🚀 Future Enhancements

Possible features to add:

- [ ] Translation history/versioning
- [ ] Custom dictionary management
- [ ] Batch file processing
- [ ] Export to DOCX/PDF
- [ ] Real-time collaboration
- [ ] Translation memory
- [ ] Glossary management
- [ ] Statistics dashboard

---

