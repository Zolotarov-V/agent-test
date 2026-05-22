import os
import json
import subprocess
import asyncio
import inspect
from typing import Dict
from src.tools import TOOLS, TOOL_DECLARATIONS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from src.logger import init_db, create_run, add_step, finish_run

init_db()

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError(
        "GEMINI_API_KEY missing"
    )

client = genai.Client(
    api_key=API_KEY
)

MODEL = os.getenv("GEMINI_MODEL")


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
            "error": f"Unknown tool {name}"
        }

    tool = TOOLS[name]

    try:

        if inspect.iscoroutinefunction(tool):

            return asyncio.run(
                tool(**args)
            )

        return tool(**args)

    except Exception as e:

        return {
            "error": str(e)
        }


MAX_ITER = 15

def run_agent(prompt):
    run_id = create_run(prompt)
    history = [types.Content(
        role="user",
        parts=[types.Part(text=prompt)]
    )]

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
                if part.text:
                    print("\nGemini:", part.text)
                    add_step(run_id, {"type": "thought", "content": part.text})

                if part.function_call:
                    tool_called = True
                    tool_name = part.function_call.name
                    args = dict(part.function_call.args)
                    print(f"\nTool: {tool_name}")
                    add_step(run_id, {"type": "tool_call", "tool": tool_name, "args": args})

                    result = execute_tool(tool_name, args)
                    print("Observation:", result)
                    add_step(run_id, {"type": "observation", "tool": tool_name, "result": str(result)})

                    history.append(types.Content(
                        role="tool",
                        parts=[types.Part(function_response=types.FunctionResponse(
                            name=tool_name,
                            response={"data": result}
                        ))]
                    ))

            if not tool_called:
                finish_run(run_id, response.text, "done")
                return response.text

        finish_run(run_id, "Iteration limit reached", "error")
        return "Iteration limit reached"

    except Exception as e:
        finish_run(run_id, str(e), "error")
        raise


    # history = [
    #
    #     types.Content(
    #         role="user",
    #         parts=[
    #             types.Part(
    #                 text=prompt
    #             )
    #         ]
    #     )
    #
    # ]
    #
    # MAX_ITER = 15
    #
    # for step in range(MAX_ITER):
    #
    #     print(
    #         f"\n=== ITER {step+1} ==="
    #     )
    #
    #     response = client.models.generate_content(
    #
    #         model=MODEL,
    #
    #         contents=history,
    #
    #         config=types.GenerateContentConfig(
    #
    #             system_instruction=SYSTEM_PROMPT,
    #
    #             tools=[
    #                 types.Tool(
    #                     function_declarations=
    #                     TOOL_DECLARATIONS
    #                 )
    #             ]
    #
    #         )
    #
    #     )
    #
    #     candidate = response.candidates[0]
    #
    #     history.append(
    #         candidate.content
    #     )
    #
    #     tool_called = False
    #
    #     for part in candidate.content.parts:
    #
    #         if part.text:
    #
    #             print(
    #                 "\nGemini:"
    #             )
    #
    #             print(
    #                 part.text
    #             )
    #
    #         if part.function_call:
    #
    #             tool_called = True
    #
    #             tool_name = (
    #                 part.function_call.name
    #             )
    #
    #             args = dict(
    #                 part.function_call.args
    #             )
    #
    #             print(
    #                 f"\nTool: {tool_name}"
    #             )
    #
    #             result = execute_tool(
    #                 tool_name,
    #                 args
    #             )
    #
    #             print(
    #                 "Observation:"
    #             )
    #
    #             print(result)
    #
    #             history.append(
    #
    #                 types.Content(
    #
    #                     role="tool",
    #
    #                     parts=[
    #
    #                         types.Part(
    #                             function_response=
    #                             types.FunctionResponse(
    #
    #                                 name=tool_name,
    #
    #                                 response={"data": result}
    #                             )
    #                         )
    #
    #                     ]
    #
    #                 )
    #
    #             )
    #
    #     if not tool_called:
    #
    #         return response.text
    #
    # return (
    #     "Iteration limit reached"
    # )




if __name__ == "__main__":
    answer = run_agent("""

    Find current AI trends.

    Calculate 25*84.

    Summarize findings.

    """)
    print(
        "\nFINAL:"
    )

    print(answer)