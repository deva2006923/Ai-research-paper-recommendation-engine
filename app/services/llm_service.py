import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional

from app.config import settings
from app.schemas import PaperResult, RepoResult

# Configure Gemini API if key is present
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def is_api_configured() -> bool:
    return bool(settings.GEMINI_API_KEY)

def clean_json_response(text: str) -> str:
    """
    Strips markdown code blocks from LLM response.
    """
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

async def get_differentiation_suggestions(problem_statement: str, papers: List[PaperResult], repos: List[RepoResult]) -> str:
    """
    Generate product differentiation recommendations given problem statement, papers, and GitHub repos.
    """
    if not is_api_configured():
        return (
            "### AI Recommendation (Mock Mode)\n\n"
            "**GEMINI_API_KEY is not configured.** Here is a simulated analysis:\n\n"
            f"1. **Research Gap**: While existing literature addresses general aspects of '{problem_statement}', "
            "there is a gap in low-latency, real-time client synchronization.\n"
            "2. **Differentiation Angle**: Combine vector embeddings with lightweight local caching to minimize "
            "expensive API database roundtrips.\n"
            "3. **Implementation Strategy**: Build a modular pipeline where research parsing is decoupled "
            "from the main recommendation loop via a message broker (e.g. Redis Queue)."
        )

    # Format context
    papers_str = "\n".join([f"- Title: {p.title}\n  Venue: {p.venue} ({p.year})\n  Abstract: {p.abstract or 'N/A'}" for p in papers[:5]])
    repos_str = "\n".join([f"- Name: {r.name}\n  Desc: {r.description or 'N/A'}\n  Stars: {r.stars} | Language: {r.language or 'N/A'}" for r in repos[:5]])

    prompt = f"""
You are an expert AI Research Architect.
The user is building a software solution for the following problem statement:
"{problem_statement}"

Here are the related research papers:
{papers_str}

Here are the existing GitHub repositories:
{repos_str}

Analyze the research papers and repositories. Provide a structured markdown report recommending:
1. **Gaps in Existing Research & Codebases**: What is missing from the academic papers or existing open-source code?
2. **Unique Product Differentiation**: How can the user's project stand out from the competition?
3. **Novel Strategies & Architecture**: Suggest architectural, algorithmic, or pipeline adjustments to build a superior solution.
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini in get_differentiation_suggestions: {e}")
        return f"Error communicating with Gemini: {str(e)}"

async def get_tech_stack_recommendation(problem_statement: str) -> Dict[str, Any]:
    """
    Recommend a tech stack based on the problem statement.
    Returns a dict containing 'recommendation' and 'explanation'.
    """
    if not is_api_configured():
        return {
            "problem_statement": problem_statement,
            "recommendation": {
                "Frontend": {"technology": "Next.js (React)", "reason": "Server-side rendering for search engine optimization and state-of-the-art UI templates."},
                "Backend": {"technology": "FastAPI (Python)", "reason": "Fast asynchronous execution, automatic Swagger OpenAPI docs, and clean integration with ML models."},
                "Database": {"technology": "PostgreSQL + pgvector", "reason": "Relational capabilities for user schema + vector search extension for semantic matching."},
                "AI_ML": {"technology": "PyTorch + Hugging Face Transformers", "reason": "Industry standard libraries for local embedding generation and fine-tuning."}
            },
            "explanation": "### Architectural Overview\n*Mock mode activation due to missing GEMINI_API_KEY.*\n\nWe recommend a classic decoupled 3-tier architecture with FastAPI serving a RESTful API to a Next.js client, and PostgreSQL/pgvector handling storage and spatial search."
        }

    prompt = f"""
You are a Principal Software Architect.
The user's problem statement: "{problem_statement}"

Recommend a production-grade tech stack for this project.
Return your answer as a JSON object with two fields:
1. "recommendation": A dictionary of layers (e.g. "Frontend", "Backend", "Database", "AI_ML", "Deployment"). For each layer, include "technology" (name) and "reason" (why it is chosen).
2. "explanation": A detailed markdown explanation outlining the architectural decisions, database design recommendations, and protocol choices (REST, WebSockets, etc.).

Do NOT wrap the response in markdown code blocks. Return ONLY raw JSON.
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        cleaned_text = clean_json_response(response.text)
        return json.loads(cleaned_text)
    except Exception as e:
        print(f"Error calling Gemini in get_tech_stack_recommendation: {e}")
        # Fallback in case of parsing/API errors
        return {
            "problem_statement": problem_statement,
            "recommendation": {
                "Backend": {"technology": "FastAPI", "reason": "Error parsing LLM response, defaulted."}
            },
            "explanation": f"Failed to retrieve stack from Gemini: {str(e)}"
        }

async def generate_code_scaffold(problem_statement: str, tech_stack: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate starter code scaffold files.
    Returns a dict mapping filename/path to its code content.
    """
    if not is_api_configured():
        return {
            "main.py": "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'message': 'Hello World'}\n",
            "requirements.txt": "fastapi\nuvicorn\n",
            "README.md": f"# Starter scaffold for {problem_statement}\nConfigure your environment and run with `uvicorn main:app --reload`.\n"
        }

    prompt = f"""
You are an Elite Software Engineer.
The user is building a project for this problem statement: "{problem_statement}"
The chosen tech stack is: {json.dumps(tech_stack, indent=2)}

Generate a complete, running starter code scaffold of 3 to 5 key backend/infrastructure files (e.g., main file, requirements/dependency list, configuration settings, or database models).
Provide high-quality, production-ready, fully commented code.

Return your answer as a single JSON object. The JSON must map relative file paths to their full text content:
{{
  "files": {{
    "main.py": "content...",
    "config.py": "content...",
    "requirements.txt": "content...",
    "README.md": "content..."
  }}
}}

Do NOT wrap the response in markdown code blocks. Return ONLY raw JSON content.
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        cleaned_text = clean_json_response(response.text)
        data = json.loads(cleaned_text)
        return data.get("files", data)
    except Exception as e:
        print(f"Error calling Gemini in generate_code_scaffold: {e}")
        return {
            "error.txt": f"Failed to generate code scaffold: {str(e)}"
        }

async def get_chat_response(messages_history: List[Dict[str, str]], new_message: str) -> str:
    """
    Generate multi-turn chat response referencing conversation history.
    messages_history is a list of dicts: [{'role': 'user'|'assistant', 'content': '...'}]
    """
    if not is_api_configured():
        return f"Greetings! (Mock Mode Chat). You asked: '{new_message}'. Please configure GEMINI_API_KEY to activate full AI assistance."

    # Build conversation context
    context = ""
    for msg in messages_history:
        role = "User" if msg['role'] == 'user' else "Assistant"
        context += f"{role}: {msg['content']}\n"
    context += f"User: {new_message}\nAssistant:"

    prompt = f"""
You are an expert AI Research Assistant. You help developers research, design, and build software products based on academic research and state-of-the-art tech.
Provide concise, helpful, and technically accurate responses.

Here is the conversation history:
{context}
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini in get_chat_response: {e}")
        return f"Error communicating with Gemini: {str(e)}"
