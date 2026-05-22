import os
import asyncio
import inspect
from typing import Dict, Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

from tools import TOOLS, TOOL_DECLARATIONS
from logger import init_db, create_run, add_step, finish_run


init_db()
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY missing")

client = genai.Client(api_key=API_KEY)
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "").replace(" ", "")
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "").strip()
IMAP_HOST = os.getenv("IMAP_HOST", "imap.gmail.com").strip()

SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "1")#ДОПИСАТИ СИСТЕМНИЙ ПРОМПТ ЗА ЗАМОВЧЕННЯМ

def execute_tool(name: str, args: Dict[str, Any]):
    if name not in TOOLS:
        return {"error": f"Unknown tool {name}"}

    tool = TOOLS[name]

    try:
        if inspect.iscoroutinefunction(tool):
            return asyncio.run(tool(**args))
        return tool(**args)
    except Exception as e:
        return {"error": str(e)}


def prepare_tool_args(tool_name: str, raw_args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Safe injection layer (never trust model for secrets)
    """

    if tool_name == "read_email_inbox":
        limit = 50
        folder = "INBOX"

        if isinstance(raw_args, dict):
            if isinstance(raw_args.get("limit"), int):
                limit = raw_args["limit"]

            if isinstance(raw_args.get("folder"), str):
                folder = raw_args["folder"]

        return {
            "host": IMAP_HOST,
            "username": EMAIL_USERNAME,
            "password": EMAIL_PASSWORD,
            "limit": limit,
            "folder": folder,
        }

    return dict(raw_args or {})


# ---------------- AGENT LOOP (MERGED CORE) ----------------

MAX_ITER = int(os.getenv("MAX_ITER", 20))


def run_agent(prompt: str):
    run_id = create_run(prompt)

    history = [
        types.Content(
            role="user",
            parts=[types.Part(text=prompt)]
        )
    ]

    try:
        for step in range(MAX_ITER):

            response = client.models.generate_content(
                model=MODEL,
                contents=history,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    tools=[types.Tool(function_declarations=TOOL_DECLARATIONS)]
                )
            )

            candidate = response.candidates[0]
            history.append(candidate.content)

            tool_called = False

            for part in candidate.content.parts:
                print("ITER " + str(step) + ": ")
                # ---------------- TEXT OUTPUT ----------------
                if part.text:
                    print("\nGemini:", part.text)
                    add_step(run_id, {
                        "type": "thought",
                        "content": part.text
                    })

                # ---------------- TOOL CALL ----------------
                if part.function_call:
                    tool_called = True

                    tool_name = part.function_call.name
                    raw_args = dict(part.function_call.args or {})

                    args = prepare_tool_args(tool_name, raw_args)

                    print(f"\nTool: {tool_name}")
                    add_step(run_id, {
                        "type": "tool_call",
                        "tool": tool_name,
                        "args": raw_args
                    })

                    result = execute_tool(tool_name, args)

                    print("Observation:", result)

                    add_step(run_id, {
                        "type": "observation",
                        "tool": tool_name,
                        "result": result
                    })

                    history.append(
                        types.Content(
                            role="tool",
                            parts=[
                                types.Part(
                                    function_response=types.FunctionResponse(
                                        name=tool_name,
                                        response=result if isinstance(result, dict)
                                        else {"result": result}
                                    )
                                )
                            ]
                        )
                    )

            # ---------------- STOP CONDITION ----------------
            if not tool_called:
                final_text = response.text
                finish_run(run_id, final_text, "done")
                return final_text

        finish_run(run_id, "Iteration limit reached", "error")
        return "Iteration limit reached"

    except Exception as e:
        finish_run(run_id, str(e), "error")
        raise



if __name__ == "__main__":
    user_prompt = """
Analyze the file "resource.pdf".

Instructions:
1. Read the document using available tools.
2. Identify what the document is about.
3. Provide a concise summary in 3–7 sentences.
4. Mention the document type (report, manual, article, invoice, presentation, etc.) if recognizable.
5. Mention key topics, entities, or important sections found in the document.
6. Do not quote large parts of the document.
7. If the document cannot be read, explain why.

Return only the final summary.
    """

    print("\nFINAL:")
    answer = run_agent(user_prompt)
    print(answer)