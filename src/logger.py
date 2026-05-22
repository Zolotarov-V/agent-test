import sqlite3
import json
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "runs.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS agent_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT,
            status TEXT DEFAULT 'running',
            steps TEXT DEFAULT '[]',
            result TEXT DEFAULT '',
            created_at TEXT,
            updated_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def create_run(prompt: str) -> int:
    now = datetime.utcnow().isoformat()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO agent_runs (prompt, status, steps, created_at, updated_at) VALUES (?, 'running', '[]', ?, ?)",
        (prompt, now, now)
    )
    run_id = cur.lastrowid
    conn.commit()
    conn.close()
    return run_id

def add_step(run_id: int, step: dict):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT steps FROM agent_runs WHERE id=?", (run_id,)).fetchone()
    steps = json.loads(row[0])
    steps.append(step)
    conn.execute(
        "UPDATE agent_runs SET steps=?, updated_at=? WHERE id=?",
        (json.dumps(steps, ensure_ascii=False), datetime.utcnow().isoformat(), run_id)
    )
    conn.commit()
    conn.close()

def finish_run(run_id: int, result: str, status: str = "done"):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE agent_runs SET status=?, result=?, updated_at=? WHERE id=?",
        (status, result, datetime.utcnow().isoformat(), run_id)
    )
    conn.commit()
    conn.close()

def get_run(run_id: int) -> dict:
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT * FROM agent_runs WHERE id=?", (run_id,)).fetchone()
    conn.close()
    if not row:
        return {}
    keys = ["id", "prompt", "status", "steps", "result", "created_at", "updated_at"]
    d = dict(zip(keys, row))
    d["steps"] = json.loads(d["steps"])
    return d