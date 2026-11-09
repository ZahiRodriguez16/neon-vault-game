"""Optional public leaderboard API for Neon Vault. No API required to play the game."""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

DATABASE = Path(os.getenv("DATABASE_PATH", str(Path(__file__).parent / "scores.db")))
app = FastAPI(title="Neon Vault leaderboard", version="1.0.0")
origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    try:
        yield db
        db.commit()
    finally:
        db.close()


def initialize() -> None:
    with connect() as db:
        db.execute("""CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            level INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )""")
        db.execute("CREATE INDEX IF NOT EXISTS ix_scores_rank ON scores(score DESC, created_at ASC)")


class ScoreInput(BaseModel):
    name: str = Field(min_length=2, max_length=20)
    score: int = Field(ge=0, le=1000000)
    level: int = Field(ge=1, le=6)

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2 or not all(ch.isalnum() or ch in " _-" for ch in value):
            raise ValueError("Use 2–20 letters, digits, spaces, hyphens or underscores")
        return value


@app.on_event("startup")
def startup() -> None:
    initialize()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/leaderboard")
def leaderboard() -> list[dict]:
    initialize()
    with connect() as db:
        rows = db.execute("SELECT id, name, score, level, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 20").fetchall()
    return [dict(row) for row in rows]


@app.post("/api/scores", status_code=201)
def post_score(payload: ScoreInput) -> dict:
    # This is a demo leaderboard, not an authoritative anti-cheat system. See README.
    if payload.score < 100:
        raise HTTPException(status_code=400, detail="Score too low to submit")
    initialize()
    created_at = datetime.now(timezone.utc).isoformat()
    with connect() as db:
        cursor = db.execute("INSERT INTO scores(name, score, level, created_at) VALUES (?, ?, ?, ?)",
                            (payload.name, payload.score, payload.level, created_at))
        new_id = cursor.lastrowid
    return {"id": new_id, "name": payload.name, "score": payload.score, "level": payload.level, "created_at": created_at}
