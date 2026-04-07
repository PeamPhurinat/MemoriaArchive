# MemoriaArchive – Test Suite

## Directory Structure

```
tests/
├── unit/                          # Jest unit tests (backend services)
│   ├── services/
│   │   ├── interviewFormatterService.test.js
│   │   └── sttService.test.js
│   ├── controllers/
│   │   └── projectController.test.js
│   └── middleware/
│       └── authMiddleware.test.js
├── system/                        # Robot Framework system tests (browser)
│   ├── resources/
│   │   └── common.resource
│   ├── 01_auth.robot
│   ├── 02_projects.robot
│   ├── 03_project_detail.robot
│   ├── 04_review.robot
│   └── 05_dashboard.robot
├── requirements.txt               # Python Robot Framework dependencies
└── README.md
```

---

## 1. Unit Tests (Jest)

### Pre-conditions
- Node.js 18+ installed
- Run from the project root (`MemoriaArchive/`)

### Install Jest (if not already present)
```bash
npm install --save-dev jest
```

### Run all unit tests
```bash
npx jest --config jest.server.config.js
```

### Run with coverage
```bash
npx jest --config jest.server.config.js --coverage
```

---

## 2. System Tests (Robot Framework)

### Pre-conditions
1. Python 3.10+ installed
2. Install Robot Framework and Browser Library:
   ```bash
   pip install -r tests/requirements.txt
   rfbrowser init
   ```
3. Create a test Supabase user:
   - Email: `testuser@memoriaarchive.test`
   - Password: `TestPass123!`
4. Start the app:
   ```bash
   # Terminal 1 – backend
   node server/src/index.js
   # Terminal 2 – frontend
   npm start
   ```

### Run all system tests
```bash
robot --outputdir results tests/system/
```

### Run a single suite
```bash
robot --outputdir results tests/system/01_auth.robot
```

### Run by tag
```bash
robot --outputdir results --include smoke tests/system/
```

### View HTML report
Open `results/report.html` in a browser after the run.

---

## Test Suite Overview

| Suite | File | Test Cases | Feature |
|-------|------|-----------|---------|
| TS-01 | 01_auth.robot | 8 | Authentication |
| TS-02 | 02_projects.robot | 9 | Project Management |
| TS-03 | 03_project_detail.robot | 12 | Project Detail & Memories |
| TS-04 | 04_review.robot | 12 | Review & 3D Generation |
| TS-05 | 05_dashboard.robot | 8 | Dashboard & Route Guards |

**Unit Tests:** 4 test files · ~40 test cases total
