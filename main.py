import os
import json
import subprocess
from typing import Dict

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY missing"
    )

client = genai.Client(
    api_key=API_KEY
)

MODEL = "gemini-2.5-flash"

def web_search(query: str):
    #це заглушка, це не працює
    return {
        "results": [
            f"Fake search result: {query}"
        ]
    }


def run_python(code: str):

    try:

        result = subprocess.run(
            ["python", "-c", code],
            capture_output=True,
            text=True,
            timeout=10
        )

        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "exit_code": result.returncode
        }

    except Exception as e:

        return {
            "error": str(e)
        }


TOOLS = {

    "web_search": web_search,
    "run_python": run_python

}


tool_declarations = [

    types.FunctionDeclaration(
        name="web_search",

        description="Search the web",

        parameters={
            "type": "OBJECT",

            "properties": {

                "query": {
                    "type": "STRING"
                }

            },

            "required": ["query"]

        }
    ),

    types.FunctionDeclaration(
        name="run_python",

        description="Run python code",

        parameters={
            "type": "OBJECT",

            "properties": {

                "code": {
                    "type": "STRING"
                }

            },

            "required": ["code"]

        }
    )

]


SYSTEM_PROMPT = """
You are an autonomous AI agent.

Loop:

Think
Act
Observe
Repeat

Use tools when needed.

Continue until task solved.

Do not hallucinate tool outputs.
"""


def execute_tool(
    name: str,
    args: Dict
):

    if name not in TOOLS:

        return {
            "error":
            f"Unknown tool {name}"
        }

    try:

        return TOOLS[name](**args)

    except Exception as e:

        return {
            "error": str(e)
        }


def run_agent(prompt):

    history = [

        types.Content(
            role="user",
            parts=[
                types.Part(
                    text=prompt
                )
            ]
        )

    ]

    MAX_ITER = 15

    for step in range(MAX_ITER):

        print(
            f"\n=== ITER {step+1} ==="
        )

        response = client.models.generate_content(

            model=MODEL,

            contents=history,

            config=types.GenerateContentConfig(

                system_instruction=SYSTEM_PROMPT,

                tools=[
                    types.Tool(
                        function_declarations=
                        tool_declarations
                    )
                ]

            )

        )

        candidate = response.candidates[0]

        history.append(
            candidate.content
        )

        tool_called = False

        for part in candidate.content.parts:

            if part.text:

                print(
                    "\nGemini:"
                )

                print(
                    part.text
                )

            if part.function_call:

                tool_called = True

                tool_name = (
                    part.function_call.name
                )

                args = dict(
                    part.function_call.args
                )

                print(
                    f"\nTool: {tool_name}"
                )

                result = execute_tool(
                    tool_name,
                    args
                )

                print(
                    "Observation:"
                )

                print(result)

                history.append(

                    types.Content(

                        role="tool",

                        parts=[

                            types.Part(
                                function_response=
                                types.FunctionResponse(

                                    name=tool_name,

                                    response=result

                                )
                            )

                        ]

                    )

                )

        if not tool_called:

            return response.text

    return (
        "Iteration limit reached"
    )


answer = run_agent("""

Find current AI trends.

Calculate 25*84.

Summarize findings.

""")

print(
    "\nFINAL:"
)

print(answer)