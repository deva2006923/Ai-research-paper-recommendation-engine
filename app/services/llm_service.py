import asyncio
import json
from groq import Groq
from typing import List, Dict, Any, Optional

from app.config import settings
from app.schemas import PaperResult, RepoResult

# Configure Groq client if key is present
_client: Optional[Groq] = None

def _get_client() -> Optional[Groq]:
    global _client
    if not settings.GROQ_API_KEY:
        return None
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY, timeout=30.0)
    return _client

def is_api_configured() -> bool:
    return bool(settings.GROQ_API_KEY)

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

import re
def parse_llm_json(text: str) -> Dict[str, Any]:
    """
    Robustly parses JSON from LLM output, handling common formatting errors.
    Raises ValueError with the original JSONDecodeError message if parsing fails after sanitization.
    """
    text = clean_json_response(text)
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as err:
        original_err = err
        
        # Sanitization pass
        # 1. Remove trailing commas
        sanitized = re.sub(r',\s*([\]}])', r'\1', text)
        
        # 2. Context-aware sanitization for unescaped newlines and invalid escapes inside strings
        in_string = False
        escape = False
        result = []
        for char in sanitized:
            if in_string:
                if escape:
                    if char in '"\\/bfnrtu':
                        result.append('\\' + char)
                    else:
                        # Invalid escape, replace with double backslash
                        result.append('\\\\' + char)
                    escape = False
                elif char == '\\':
                    escape = True
                elif char == '"':
                    in_string = False
                    result.append(char)
                elif char == '\n':
                    result.append('\\n')
                elif char == '\t':
                    result.append('\\t')
                else:
                    result.append(char)
            else:
                if char == '"':
                    in_string = True
                result.append(char)
        if escape:
            result.append('\\\\')
            
        sanitized = "".join(result)
        
        try:
            return json.loads(sanitized)
        except json.JSONDecodeError:
            # If it still fails, raise the original error for the retry prompt
            raise ValueError(str(original_err))

async def get_differentiation_suggestions(problem_statement: str, papers: List[PaperResult], repos: List[RepoResult]) -> Dict[str, Any]:
    """
    Generate product differentiation recommendations given problem statement, papers, and GitHub repos.
    Returns structured JSON.
    """
    if not is_api_configured():
        return {
            "existing_landscape_summary": "The current market addresses generic approaches but lacks specific real-time focus.",
            "identified_gap": "There is a distinct gap in low-latency, real-time client synchronization that leverages local caching.",
            "why_this_gap_exists": "Most academic research focuses on accuracy over speed, and open-source repos are mostly proof-of-concept scripts without edge-device considerations.",
            "suggested_product_direction": {
                "title": "Local Vector Caching Platform",
                "description": "Combine vector embeddings with lightweight local caching on the edge.",
                "feasibility_score": 8,
                "justification": "Minimizes expensive API database roundtrips while utilizing standard edge technology."
            },
            "suggestions": "### AI Recommendation (Mock Mode)\n\n**GROQ_API_KEY is not configured.** Here is a simulated analysis."
        }

    # Format context and aggressively truncate to prevent 413 Token Limit errors
    def truncate(text: str, limit: int = 800) -> str:
        if not text: return "N/A"
        return text if len(text) <= limit else text[:limit] + "..."

    papers_str = "\n".join([f"- Title: {p.title}\n  Venue: {p.venue} ({p.year})\n  Abstract: {truncate(p.abstract)}" for p in papers[:5]])
    repos_str = "\n".join([f"- Name: {r.name}\n  Desc: {truncate(r.description)}\n  Stars: {r.stars} | Language: {r.language or 'N/A'}" for r in repos[:5]])
    
    if len(papers_str) > 12000:
        papers_str = papers_str[:12000] + "\n... (truncated)"
    if len(repos_str) > 12000:
        repos_str = repos_str[:12000] + "\n... (truncated)"

    prompt = f"""
You are an expert AI Research Architect.
The user is building a software solution for the following problem statement:
"{problem_statement}"

Here are the related research papers (what's been researched academically):
{papers_str}

Here are the existing GitHub repositories (what's actually been built/open-sourced):
{repos_str}

Analyze the research papers and repositories. Cross-reference them together to identify a genuinely NEW problem statement — a specific, distinct problem or angle that is NOT already solved by the existing research papers or GitHub repos it was given.
Provide a structured JSON report recommending:
1. "existing_landscape_summary": (string) Brief summary of what current papers/repos already solve.
2. "identified_gap": (string) One clear, specific NEW problem statement that stands apart from what exists, explained in 2-3 sentences.
3. "why_this_gap_exists": (string) Reasoning grounded in the actual papers/repos data (cite what's missing or underexplored).
4. "suggested_product_direction": An object with:
   - "title": (string) The product idea name
   - "description": (string) A concrete product idea addressing the new problem statement
   - "feasibility_score": (integer 1-10) How feasible it is
   - "justification": (string) Short justification for feasibility
5. "suggestions": A human-readable markdown summary synthesizing all of this information beautifully.

CRITICAL INSTRUCTION: You must ensure all newlines, tabs, quotes, and control characters inside the JSON string values are properly escaped so that the output is strictly valid JSON that can be parsed by Python's json.loads().
Return ONLY raw JSON matching this structure. Do NOT wrap the response in markdown code blocks.
"""
    try:
        client = _get_client()
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional AI Research Architect. You respond ONLY with valid JSON. Ensure strings are properly escaped."},
                {"role": "user", "content": prompt}
            ]
        )
        try:
            data = parse_llm_json(response.choices[0].message.content)
            return data
        except ValueError as json_err:
            print(f"JSON Parsing Error in get_differentiation_suggestions: {json_err}. Initiating retry...")
            retry_prompt = f"Your previous response failed to parse as valid JSON due to this error: {str(json_err)}.\nPlease return the exact same content but ensure ALL strings and control characters are properly JSON-escaped. Do NOT include markdown code blocks, just raw JSON."
            try:
                retry_resp = await asyncio.to_thread(
                    client.chat.completions.create,
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a professional AI Research Architect. You respond ONLY with valid JSON. Ensure strings are properly escaped."},
                        {"role": "user", "content": prompt},
                        {"role": "assistant", "content": response.choices[0].message.content},
                        {"role": "user", "content": retry_prompt}
                    ]
                )
                data = parse_llm_json(retry_resp.choices[0].message.content)
                return data
            except Exception as retry_err:
                print(f"Retry failed in get_differentiation_suggestions: {retry_err}")
                return {
                    "existing_landscape_summary": "N/A",
                    "identified_gap": "N/A",
                    "why_this_gap_exists": "N/A",
                    "suggested_product_direction": {
                        "title": "Error",
                        "description": "Error parsing LLM response after retry",
                        "feasibility_score": 0,
                        "justification": "N/A"
                    },
                    "suggestions": f"### Error parsing AI response\n\nFailed to parse JSON even after retry.\n\nError: {str(retry_err)}"
                }
    except Exception as e:
        print(f"Error calling Groq in get_differentiation_suggestions: {e}")
        return {
            "existing_landscape_summary": "N/A",
            "identified_gap": "N/A",
            "why_this_gap_exists": "N/A",
            "suggested_product_direction": {
                "title": "Error",
                "description": "Error parsing LLM response",
                "feasibility_score": 0,
                "justification": "N/A"
            },
            "suggestions": f"Error communicating with Groq: {str(e)}"
        }

async def get_tech_stack_recommendation(problem_statement: str) -> Dict[str, Any]:
    """
    Recommend a tech stack based on the problem statement.
    Returns a dict containing 'recommendation' and 'explanation'.
    """
    if not is_api_configured():
        return {
            "problem_statement": problem_statement,
            "recommendation": {
                "Frontend": [
                    {"name": "Next.js (React)", "reason": "Server-side rendering for search engine optimization and state-of-the-art UI templates.", "complexity": "Intermediate", "recommended": True},
                    {"name": "React + Vite", "reason": "Fast build times and simpler static deployment.", "complexity": "Beginner", "recommended": False},
                    {"name": "Vue.js (Nuxt)", "reason": "Excellent developer experience with approachability.", "complexity": "Intermediate", "recommended": False}
                ],
                "Backend": [
                    {"name": "FastAPI (Python)", "reason": "Fast asynchronous execution, automatic Swagger OpenAPI docs, and clean integration with ML models.", "complexity": "Intermediate", "recommended": True},
                    {"name": "Express.js (Node)", "reason": "Ubiquitous Javascript backend, easy to hire for.", "complexity": "Beginner", "recommended": False},
                    {"name": "Go (Fiber)", "reason": "Extremely high performance for concurrent requests.", "complexity": "Advanced", "recommended": False}
                ],
                "Database": [
                    {"name": "PostgreSQL + pgvector", "reason": "Relational capabilities for user schema + vector search extension for semantic matching.", "complexity": "Intermediate", "recommended": True},
                    {"name": "MongoDB", "reason": "Flexible document schema, great for rapid prototyping.", "complexity": "Beginner", "recommended": False},
                    {"name": "Redis + RediSearch", "reason": "In-memory speed for extreme low-latency retrieval.", "complexity": "Advanced", "recommended": False}
                ],
                "AI_ML": [
                    {"name": "PyTorch + Hugging Face Transformers", "reason": "Industry standard libraries for local embedding generation and fine-tuning.", "complexity": "Intermediate", "recommended": True},
                    {"name": "TensorFlow", "reason": "Robust production deployment ecosystem.", "complexity": "Advanced", "recommended": False},
                    {"name": "OpenAI / Anthropic APIs", "reason": "Offload complexity of hosting models.", "complexity": "Beginner", "recommended": False}
                ]
            },
            "explanation": "### Architectural Overview\n*Mock mode activation due to missing GROQ_API_KEY.*\n\nWe recommend a classic decoupled 3-tier architecture with FastAPI serving a RESTful API to a Next.js client, and PostgreSQL/pgvector handling storage and spatial search."
        }

    prompt = f"""
You are a Principal Software Architect.
The user's problem statement: "{problem_statement}"

Recommend a production-grade tech stack for this project.
Return your answer as a JSON object with two fields:
1. "recommendation": A dictionary of layers (e.g. "Frontend", "Backend", "Database", "AI_ML", "Deployment"). For each layer, provide an array of 3-4 viable alternative options.
Each option must be an object containing:
  - "name": (string) the technology name
  - "reason": (string) why it is a good fit
  - "complexity": (string) "Beginner", "Intermediate", or "Advanced"
  - "recommended": (boolean) true for the best/primary recommendation, false for the alternatives. Exactly one option per layer should have recommended=true.
2. "explanation": A detailed markdown explanation outlining the architectural decisions, database design recommendations, and protocol choices (REST, WebSockets, etc.).

Do NOT wrap the response in markdown code blocks. Return ONLY raw JSON.
"""
    try:
        client = _get_client()
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a Principal Software Architect. You respond only with raw JSON matching the request structure."},
                {"role": "user", "content": prompt}
            ]
        )
        try:
            return parse_llm_json(response.choices[0].message.content)
        except ValueError as json_err:
            print(f"JSON Parsing Error in get_tech_stack_recommendation: {json_err}. Initiating retry...")
            retry_prompt = f"Your previous response failed to parse as valid JSON due to this error: {str(json_err)}.\nPlease return the exact same content but ensure ALL strings and control characters are properly JSON-escaped. Do NOT include markdown code blocks, just raw JSON."
            try:
                retry_resp = await asyncio.to_thread(
                    client.chat.completions.create,
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a Principal Software Architect. You respond only with raw JSON matching the request structure."},
                        {"role": "user", "content": prompt},
                        {"role": "assistant", "content": response.choices[0].message.content},
                        {"role": "user", "content": retry_prompt}
                    ]
                )
                return parse_llm_json(retry_resp.choices[0].message.content)
            except Exception as retry_err:
                raise Exception(f"Failed to parse LLM response after retry: {retry_err}")
    except Exception as e:
        print(f"Error calling Groq in get_tech_stack_recommendation: {e}")
        # Fallback in case of parsing/API errors
        return {
            "problem_statement": problem_statement,
            "recommendation": {
                "Backend": [
                    {"name": "FastAPI", "reason": "Error parsing LLM response, defaulted.", "complexity": "Intermediate", "recommended": True}
                ]
            },
            "explanation": f"Failed to retrieve stack from Groq: {str(e)}"
        }

async def generate_code_scaffold(problem_statement: str, tech_stack: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate starter code scaffold files.
    Returns a dict mapping filename/path to its code content.
    """
    if not is_api_configured():
        return {
            "app/main.py": "from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get('/')\ndef read_root():\n    return {'message': 'Hello World'}\n",
            "requirements.txt": "fastapi\nuvicorn\n",
            ".env.example": "DATABASE_URL=sqlite:///./test.db\n",
            "README.md": f"# Starter scaffold for {problem_statement}\nConfigure your environment and run with `uvicorn app.main:app --reload`.\n"
        }

    prompt = f"""
You are an Elite Software Engineer.
The user is building a project for this problem statement: "{problem_statement}"
The chosen tech stack is: {json.dumps(tech_stack, indent=2)}

Generate a comprehensive, realistic, running starter project folder structure tailored to the chosen tech stack. 
You MUST provide actual working code in each file, NOT just generic placeholders.
Specifically, generate a robust project spanning at least 5-8 files across proper directories. For example, for a Python/FastAPI backend, include:
- app/main.py
- app/routers/items.py
- app/services/logic.py
- app/models.py
- tests/test_main.py
- requirements.txt or package.json
- .env.example
- A highly detailed README.md for the generated project with setup instructions.

Provide high-quality, production-ready, fully commented code that specifically uses the technologies mentioned in the tech stack (e.g., if FastAPI is recommended, write actual FastAPI endpoints; if PostgreSQL, write actual SQLAlchemy models).

Return your answer as a single JSON object. The JSON must map relative file paths to their full text content:
{{
  "files": {{
    "app/main.py": "working code...",
    "app/routers/example.py": "working code...",
    "tests/test_main.py": "working code...",
    "requirements.txt": "content...",
    ".env.example": "content...",
    "README.md": "content..."
  }}
}}

CRITICAL INSTRUCTION: You must ensure all newlines, tabs, quotes, and control characters inside the JSON string values are properly escaped (e.g., use \\n for newlines, \\t for tabs, \\" for quotes) so that the output is strictly valid JSON that can be parsed by Python's json.loads().
Do NOT wrap the response in markdown code blocks. Return ONLY raw valid JSON content.
"""
    try:
        client = _get_client()
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are an Elite Software Engineer. You respond only with raw JSON matching the request structure. Ensure all string values are properly JSON-escaped."},
                {"role": "user", "content": prompt}
            ]
        )
        try:
            data = parse_llm_json(response.choices[0].message.content)
            return data.get("files", data)
        except ValueError as json_err:
            print(f"JSON Parsing Error in generate_code_scaffold: {json_err}. Initiating retry...")
            retry_prompt = f"Your previous response failed to parse as valid JSON due to this error: {str(json_err)}.\nPlease return the exact same file structure but ensure ALL strings are properly JSON-escaped (e.g., escape newlines as \\n). Do NOT include markdown code blocks, just raw JSON."
            try:
                retry_resp = await asyncio.to_thread(
                    client.chat.completions.create,
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": "You are an Elite Software Engineer. You respond only with raw JSON matching the request structure. Ensure all string values are properly JSON-escaped."},
                        {"role": "user", "content": prompt},
                        {"role": "assistant", "content": response.choices[0].message.content},
                        {"role": "user", "content": retry_prompt}
                    ]
                )
                data = parse_llm_json(retry_resp.choices[0].message.content)
                return data.get("files", data)
            except Exception as retry_err:
                return {
                    "error_fallback.txt": f"LLM returned invalid JSON after retry. Error: {str(retry_err)}\n\nPlease try again.",
                    "raw_output.txt": retry_resp.choices[0].message.content[:2000] if 'retry_resp' in locals() else response.choices[0].message.content[:2000] + "\n\n... (truncated)"
                }
                
    except Exception as e:
        print(f"Error calling Groq in generate_code_scaffold: {e}")
        return {
            "error.txt": f"Failed to generate code scaffold API call: {str(e)}"
        }

async def get_chat_response(messages_history: List[Dict[str, str]], new_message: str) -> str:
    """
    Generate multi-turn chat response referencing conversation history.
    messages_history is a list of dicts: [{'role': 'user'|'assistant', 'content': '...'}]
    """
    if not is_api_configured():
        return f"Greetings! (Mock Mode Chat). You asked: '{new_message}'. Please configure GROQ_API_KEY to activate full AI assistance."

    # Build conversation context
    context_msgs = [{"role": "system", "content": "You are an expert AI Research Assistant. You help developers research, design, and build software products based on academic research and state-of-the-art tech. Provide concise, helpful, and technically accurate responses."}]
    for msg in messages_history:
        context_msgs.append({"role": msg['role'], "content": msg['content']})
    context_msgs.append({"role": "user", "content": new_message})

    try:
        client = _get_client()
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.GROQ_MODEL,
            messages=context_msgs
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq in get_chat_response: {e}")
        return f"Error communicating with Groq: {str(e)}"

