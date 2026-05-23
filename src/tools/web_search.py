"""Async web search via Serper API."""

from __future__ import annotations

import contextvars
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Iterator, List

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "").strip()

_user_serper_api_key: contextvars.ContextVar[str] = contextvars.ContextVar(
    "user_serper_api_key",
    default="",
)


def _active_serper_api_key() -> str:
    return _user_serper_api_key.get() or SERPER_API_KEY


@contextmanager
def serper_api_key_context(key: str) -> Iterator[None]:
    reset = _user_serper_api_key.set((key or "").strip())
    try:
        yield
    finally:
        _user_serper_api_key.reset(reset)


async def web_search(query: str) -> Dict[str, Any]:
    """Search the web for current information, news, and facts."""
    api_key = _active_serper_api_key()
    if not api_key:
        return {"error": "Serper API key is missing. Add your key in Settings."}

    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json",
    }
    payload = {"q": query, "num": 3}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url, headers=headers, json=payload, timeout=10.0
            )
            if response.status_code != 200:
                return {"error": f"Search failed: {response.status_code}"}

            data = response.json()
            results: List[Dict[str, Any]] = []
            for item in data.get("organic", []):
                results.append(
                    {
                        "title": item.get("title"),
                        "snippet": item.get("snippet"),
                        "link": item.get("link"),
                    }
                )
            return {"results": results}
        except Exception as exc:
            return {"error": str(exc)}
