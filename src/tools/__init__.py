from typing import Dict, Any, Callable, Coroutine

from .read_email import read_email_inbox
from .web_search import web_search
from .http_request import http_request
from .run_python import run_python
from .read_document import read_document

TOOLS: Dict[str, Callable[..., Coroutine[Any, Any, str]]] = {
    "web_search": web_search,
    "http_request": http_request,
    "run_python": run_python,
    "read_email_inbox": read_email_inbox,
    "read_document": read_document,
}


TOOL_DECLARATIONS = [
    {
        "name": "web_search",
        "description": "Search the web for up-to-date information.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }
    },

    {
        "name": "http_request",
        "description": "Send HTTP requests.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
                "method": {
                    "type": "string",
                    "enum": ["GET", "POST"]
                },
                "payload": {
                    "type": "object"
                }
            },
            "required": ["url", "method"]
        }
    },

    {
        "name": "run_python",
        "description": "Execute Python code and return stdout, stderr and exit code.",
        "parameters": {
            "type": "object",
            "properties": {
                "code": {"type": "string"}
            },
            "required": ["code"]
        }
    },

    {
        "name": "read_email_inbox",
        "description": "Read emails from IMAP inbox and return structured messages.",
        "parameters": {
            "type": "object",
            "properties": {
                "host": {"type": "string"},
                "username": {
                    "type": "string",
                    "description": "IGNORED. Automatically injected by system."
                },
                "password": {
                    "type": "string",
                    "description": "IGNORED. Automatically injected by system."
                },
                "limit": {
                    "type": "integer",
                    "default": 10
                },
                "folder": {
                    "type": "string",
                    "default": "INBOX"
                }
            },
            "required": ["host", "username", "password"]
        },
    },
    {
        "name": "read_document",
        "description": (
            "Read documents including PDF, DOCX, XLSX, PPTX, "
            "HTML, Markdown, TXT and images"
        ),
        "parameters": {
            "type": "object",
            "properties": {

                "path": {
                    "type": "string",
                    "description": "Absolute or relative file path"
                },

                "max_chars": {
                    "type": "integer",
                    "description": "Maximum returned characters"
                }

            },

            "required": ["path"]
        }
    }
]