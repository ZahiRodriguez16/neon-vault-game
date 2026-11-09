# ✦ NEON VAULT — A complete 2D browser game

A playable, original six-level 2D arcade game made with **TypeScript + React + HTML Canvas**, plus an optional **Python + FastAPI + SQLite** global leaderboard. Designed as a substantial full-stack GitHub portfolio project.

## Play

Collect every yellow energy cell to unlock the exit portal. Escape security drones and red hazards before time runs out. Grab green health packs and use your dash wisely.

- **Move:** WASD or arrow keys
- **Dash:** Space or Shift (2.35s cooldown)
- **Pause:** Escape or P
- **Touch:** D-pad and dash button below game
- **Game:** 6 levels, 3 starting hearts, scoring and a saved personal best, sound toggle, fullscreen mode, level completion, pause, game-over, responsive controls

## Tech stack

| Layer | Tech | Purpose |
| --- | --- | --- |
| Gameplay | TypeScript, HTML Canvas | Frame loop, movement, collision, enemy movement, particles |
| UI | React, CSS, HTML | HUD, screens, mobile controls, responsive layout |
| Tooling | Vite, Vitest | Bundling and automated level-format tests |
| Backend (optional) | Python, FastAPI, Pydantic | Global score endpoints and validation |
| Database (optional) | SQL / SQLite | Score persistence and ranking |
| CI/CD | GitHub Actions | Test, build and deploy to GitHub Pages |

## Run locally (frontend)

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Run checks:

```bash
npm test
npm run typecheck
npm run build
```

## Run the optional Python API

Requires Python 3.10+.

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Set `VITE_API_URL=http://localhost:8000` in a frontend `.env.local` file and restart Vite. Interactive API documentation: `http://localhost:8000/docs`.

For production, deploy the Python service separately (e.g. a Python-compatible host), set `CORS_ORIGINS` to the exact deployed GitHub Pages origin, set `DATABASE_PATH` to a persistent volume, and set the repository variable `VITE_API_URL` to the API's HTTPS URL. The default backend CORS setting only permits `http://localhost:5173`.

**Important:** GitHub Pages is static hosting; it cannot run Python. The game, navigation, and local scores work without the API. The optional public scoreboard is **not cheat-proof**, since the score is submitted by a browser; production anti-cheat would require server-verified gameplay or signed replay. Add rate limiting and moderation before opening score submission to an untrusted public audience.

Test backend from project root (after installing requirements):

```bash
pytest backend/tests -q
```

## Deploy to GitHub Pages

1. Create a new public GitHub repository (for example, `neon-vault-game`).
2. Upload the **contents** of this folder, including `.github/workflows/deploy.yml`.
3. Ensure your default branch is `main` and push.
4. GitHub repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. GitHub → **Actions** → wait for “Deploy game to GitHub Pages” to finish.
6. Open `https://USERNAME.github.io/REPOSITORY/`.

The workflow sets the correct Vite base path from your actual repository name. On a `USERNAME.github.io` root repo, adjust the base to `/` in `vite.config.ts`.

## Customize

- Game levels, labels and colors: `src/levels.ts`
- Character physics, scoring, and collision behavior: `src/game.ts`
- Site navigation, visuals and project credits: `src/App.tsx`, `src/styles.css`
- Page title and search description: `index.html`
- Online scoreboard: `backend/main.py`, `src/api.ts`
- Add the real author's GitHub repository URL in `src/App.tsx` (the GitHub buttons point to the GitHub home page as placeholders).

## Scope and caveats

This is a complete playable demonstration project, not a commercial-scale game. Visuals are original canvas primitives, no third-party artwork. Font loading uses Google Fonts with system fallbacks. Best score uses browser localStorage; it is device-specific and may be cleared by users. In-app UI and gameplay are in English and can be localized. The game uses arrow-key/touch movement, so portrait-phone display is smaller than desktop; landscape is recommended.

## License

MIT, see `LICENSE`. You are welcome to publish, customize and expand the project, but describe your actual contributions accurately when using it as a hiring portfolio.
