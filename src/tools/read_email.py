import imaplib
import email
import asyncio
from typing import Dict, Any, List
from email.header import decode_header


def _decode_mime_words(s: str) -> str:
    if not s:
        return ""
    decoded_parts = decode_header(s)
    result = ""
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            result += part.decode(encoding or "utf-8", errors="ignore")
        else:
            result += part
    return result


def _extract_body(msg) -> str:
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition"))

            if content_type == "text/plain" and "attachment" not in disposition:
                try:
                    body = part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8",
                        errors="ignore"
                    )
                    break
                except:
                    continue
    else:
        try:
            body = msg.get_payload(decode=True).decode(
                msg.get_content_charset() or "utf-8",
                errors="ignore"
            )
        except:
            body = ""
    return body


async def read_email_inbox(
        host: str,
        username: str,
        password: str,
        limit: int = 10,
        folder: str = "INBOX"
) -> Dict[str, Any]:  # Changed from str to Dict[str, Any]
    """
    AI Agent tool: Read emails from IMAP inbox.

    Returns latest emails as a structured dictionary.
    """

    def _sync_read() -> Dict[str, Any]:
        try:
            mail = imaplib.IMAP4_SSL(host, 993)
            print("IMAP HOST:", host)
            print("USERNAME:", username)
            print("PASSWORD:", password)

            mail.login(username, password)
            mail.select(folder)

            status, messages = mail.search(None, "ALL")
            if status != "OK":
                return {"error": "Failed to fetch emails"}

            email_ids = messages[0].split()
            email_ids = email_ids[-limit:]  # Get latest emails

            emails: List[Dict[str, Any]] = []

            for eid in reversed(email_ids):
                status, msg_data = mail.fetch(eid, "(RFC822)")
                if status != "OK":
                    continue

                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                emails.append({
                    "id": eid.decode(),
                    "from": _decode_mime_words(msg.get("From")),
                    "to": _decode_mime_words(msg.get("To")),
                    "subject": _decode_mime_words(msg.get("Subject")),
                    "date": str(msg.get("Date")),
                    "body": _extract_body(msg)[:2000]  # Chunked limit for LLM processing
                })

            mail.logout()

            return {
                "success": True,
                "count": len(emails),
                "emails": emails
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    # Run blocking IMAP operations safely inside a separate worker thread
    return await asyncio.to_thread(_sync_read)


# Dictionary reference mapping for main.py
TOOLS = {
    "read_email_inbox": read_email_inbox
}

# Python SDK structural declaration helper
from google.genai import types

TOOL_DECLARATIONS = [
    types.FunctionDeclaration(
        name="read_email_inbox",
        description="Read emails from IMAP inbox and return recent emails.",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "limit": types.Schema(
                    type=types.Type.INTEGER,
                    description="Max emails to pull",
                    default=10
                ),
                "folder": types.Schema(
                    type=types.Type.STRING,
                    description="Mail folder source",
                    default="INBOX"
                ),
            },
            required=[]
        )
    )
]