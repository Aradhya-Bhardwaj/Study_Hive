# Workspace Context: StudyHive

StudyHive is a responsive, computer science academic portal designed with industry-grade React standards, 100% offline portability (runs directly via local `file://` or double-clicking `dist/index.html`), secure local session authentication, and interactive visual simulators focusing on Computer Science topics.

---

## 📂 Project Architecture

```
Study_help/
├── dist/                          # Compiled build folder (offline-ready)
├── public/
│   └── favicon.svg                # Application icon
├── src/
│   ├── assets/                    # Static image/vector resources
│   ├── components/                # Core visual UI components
│   │   ├── simulators/            # Interactive laboratory simulations
│   │   │   ├── AmdahlCalculator.jsx   # Parallelism speedup curves
│   │   │   ├── CpuScheduler.jsx       # CPU algorithm gantt tracer (FCFS, SJF, SRTF, Priority, RR)
│   │   │   ├── DiskScheduler.jsx      # Disk head sweep plotter (FCFS, SSTF, SCAN, LOOK, etc.)
│   │   │   └── SubnetCalculator.jsx   # IP CIDR boundary block bitwise calculator
│   │   ├── Dashboard.jsx          # User statistics dashboard, course cards, bookmarks
│   │   ├── Login.jsx              # Tabbed Sign In / Sign Up gateway panel
│   │   ├── Navbar.jsx             # Search bar indexer, theme selector, profile widget
│   │   ├── QuizWidget.jsx         # Practice MCQ assessment card
│   │   ├── SearchOverlay.jsx      # Live query highlighting overlay card
│   │   └── Sidebar.jsx            # Chapter course roadmap sidebar navigation
│   ├── context/
│   │   └── AuthContext.jsx        # Credentials manager and active user sessions
│   ├── data/
│   │   ├── subjects/              # Academic reading contents
│   │   │   ├── coa.js             # Computer Organization & Architecture database
│   │   │   ├── dbms.js            # Database Management Systems database
│   │   │   ├── networking.js      # Computer Networks database
│   │   │   ├── oop.js             # OOP & Java database
│   │   │   └── os.js              # Operating Systems database
│   │   └── quizzes.js             # Consolidated quiz questions database
│   ├── styles/                    # Modular vanilla CSS sheets loaded in index.css
│   │   ├── auth.css               # Portal gateway glassmorphic styles
│   │   ├── base.css               # Global fonts, scrollbars, generic inputs & buttons
│   │   ├── components.css         # Navbar, profile, quiz widgets, search result items
│   │   ├── dashboard.css          # Welcome banner, stats grid cards, subject tiles
│   │   ├── simulators.css         # Gantt rects, grids, vector axes, physics overlays
│   │   ├── subject.css            # Sidebar list items, textbook readers, code frames
│   │   └── variables.css          # Design system color themes (Dark, Light, Sepia)
│   ├── utils/
│   │   └── safeStorage.js         # LocalStorage fallback in-memory database
│   ├── App.jsx                    # Core page router, completion progress, and bookmark states
│   ├── index.css                  # Style bundler importing styles/*.css
│   └── main.jsx                   # Entry point wrapping App in AuthProvider context
├── vite.config.js                 # Bundler config with base: './' base url relative overrides
├── package.json                   # Project scripts and manifest (React 19, Vite 8)
└── README.md                      # General introduction
```

---

## ⚙️ Core Technical Designs

### 1. Offline Portability (`file://` Protocol Support)
- **Relative Linking**: Configured in `vite.config.js` via `base: './'`. Built references map locally, ensuring files run inside isolated browser sandbox tabs when opening `dist/index.html` directly from filesystems.
- **Dependency-Free SVG Graphics**: Visual graphs (Disk sweep paths, Gantt chart bars, Speedup ceilings) are compiled dynamically using React state calculations translated straight into raw SVG vector `<rect>`, `<path>`, and `<circle>` templates. This avoids bundle bloating and third-party library errors on offline assets.

### 2. State-Based Routing (App.jsx)
- **Coordination**: Page state routing is governed by:
  - `activePage`: `'dashboard'` or `'subject'`
  - `activeSubjectId`: `'os'`, `'networking'`, `'dbms'`, `'oop'`, or `'coa'`
  - `activeChapterId` & `activeSectionId`
- **Dynamic Completions**: Kept in the `progress` state (`{ [sectionId]: boolean }`).
- **User Bookmarks**: Kept in the `bookmarks` state array.
- **User Storage Partition**: Saved in `safeStorage` (in-memory + serialized `window.name` fallback) under user keys `studyhive_progress_${username}` and `studyhive_bookmarks_${username}` to ensure isolated user files.

### 3. Integrated Practice Quizzes
- Renders at the bottom of every reader section page using `QuizWidget.jsx`.
- Uses questions from `quizzes.js` associated with the active `sectionId`.
- Provides color validation (green for correct, red for incorrect), explanation alerts, and overall percentage scoreboard metrics.

### 4. Interactive Simulator Integration
Simulators map directly to subject sections using the `simulator` key inside subject databases:
- `cpu-scheduler` -> `CpuScheduler.jsx` (Operating Systems)
- `disk-scheduler` -> `DiskScheduler.jsx` (Operating Systems)
- `subnet-calculator` -> `SubnetCalculator.jsx` (Computer Networks)
- `amdahl-calculator` -> `AmdahlCalculator.jsx` (Computer Organization & Architecture)

---

## 🎨 Theme Modes
Themes are updated by changing the `data-theme` attribute on `document.documentElement`:
1. **Dark (Default)**: Roots in variables CSS; standard deep slate background.
2. **Light**: `document.documentElement.setAttribute('data-theme', 'light')` (High-contrast pure white/light grey canvas).
3. **Sepia**: `document.documentElement.setAttribute('data-theme', 'sepia')` (Warmer paper tone suitable for reading).
