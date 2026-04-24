# Run Guide

## Execution Flow
Run the commands in this order from the project root:

### 1. Install dependencies
```bash
npm install
python3 -m venv .venv
./.venv/bin/pip install -r backend/requirements.txt
```
What it does:
- Downloads and installs all required project packages from `package.json`
- Sets up React, Vite, TailwindCSS, Zustand, Radix UI, and routing dependencies
- Creates a local Python virtual environment for the parser service
- Installs FastAPI, pdfminer, docx2txt, and pytest into `.venv`

### 2. Start the backend parser
```bash
npm run dev:backend
```
What it does:
- Starts the FastAPI parser service on `http://127.0.0.1:8000`
- Exposes `POST /parse-resume` and `GET /health`
- Powers the NLP-based resume extraction used by the frontend

### 3. Start the frontend development server
```bash
npm run dev
```
What it does:
- Starts the Vite development server
- Compiles the React app in development mode
- Gives you a local URL, usually `http://localhost:5173`
- Proxies `/api/*` requests to the FastAPI backend on port `8000`
- Supports hot reload, so UI/code changes appear immediately in the browser

After this command:
- Open `http://localhost:5173`
- Choose `Candidate` or `HR Manager`
- Use the app directly

### 4. Build for production
```bash
npm run build
```
What it does:
- Creates an optimized production build
- Bundles the React app into the `dist/` folder
- Minifies JS/CSS and prepares the app for deployment

Use this when:
- You want to verify the project builds successfully
- You want the final deployable frontend files

### 5. Run the backend smoke test
```bash
npm run test:backend
```
What it does:
- Runs the parser smoke test against the local NLP extraction module

### 6. Preview the production build
```bash
npm run preview
```
What it does:
- Starts a local server for the already-built `dist/` output
- Lets you test the production version locally before deployment

Use this after:
- Running `npm run build`

## Quick Run
If you just want to launch the app and use it:

```bash
npm install
python3 -m venv .venv
./.venv/bin/pip install -r backend/requirements.txt
npm run dev:backend
npm run dev
```
