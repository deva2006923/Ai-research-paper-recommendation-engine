# AI Research Paper Recommendation Engine Backend

A modular FastAPI backend service designed to search academic literature (arXiv + Semantic Scholar) and GitHub repositories, recommend software tech stacks, provide AI product differentiation, scaffold starter code, and maintain multi-turn chat sessions with persistent memory.

## Tech Stack Overview
- **Core Framework**: FastAPI (Python 3.13)
- **Database**: SQLite (SQLAlchemy ORM, ready to migrate to PostgreSQL)
- **Authentication**: Google OAuth2 + JWT session token management
- **AI Integrations**: Gemini API via `google-generativeai` (fallback mock capability when API key is not configured)
- **External Queries**: arXiv API (HTTPS XML), Semantic Scholar API (JSON), GitHub Search API

---

## File Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py             # ASGI entry point, lifespan management, CORS
│   ├── config.py           # Pydantic Settings configuration loader
│   ├── database.py         # SQLAlchemy connection pool setup
│   ├── models.py           # User, History, ChatSession, ChatMessage schemas
│   ├── schemas.py          # Pydantic validation request/response structures
│   ├── auth.py             # OAuth Token parser, JWT builders, Admin middleware
│   ├── routers/
│   │   ├── auth.py         # /auth/google
│   │   ├── papers.py       # /papers/search
│   │   ├── repos.py        # /repos/search
│   │   ├── ai.py           # /differentiate, /tech-stack, /generate-code, /assistant/chat
│   │   └── admin.py        # /admin/stats (restricted to prakasshdeva876@gmail.com)
│   └── services/
│       ├── arxiv_service.py       # Async XML arXiv parser
│       ├── semantic_scholar.py    # Async Semantic Scholar search client
│       ├── github_service.py      # Async GitHub Search Client
│       └── llm_service.py         # Google Gemini integration logic
├── requirements.txt        # Package dependencies
└── README.md               # Setup and API documentation
```

---

## Getting Started

### 1. Prerequisites
- Python 3.13 or newer
- Pip (Python Package Installer)

### 2. Setup
Clone the repository and navigate into the project workspace directory:

```bash
cd "AI RESEARCH PAPRT RECOMMENDATION"
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your API credentials:
```bash
copy .env.example .env
```

Set the values in `.env`:
- `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Client ID (Required for live authentication. Leaving empty enables development-only Mock Token login).
- `GEMINI_API_KEY`: Your Gemini API Key (Required for AI generation endpoints. Leaving empty activates safe, local Mock generation text).
- `GITHUB_TOKEN`: Your GitHub Personal Access Token (Highly recommended to bypass the default 5 requests/minute API rate limit).

### 4. Running the Server
Start the local development server:
```bash
uvicorn app.main:app --reload
```
The server will start at `http://127.0.0.1:8000`. You can inspect the interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

---

## API Endpoints Documentation

All endpoints except `POST /auth/google` require a valid JWT bearer token in the headers:
```http
Authorization: Bearer <your_jwt_access_token>
```

### 1. Authentication
#### `POST /auth/google`
Exchange a Google OAuth token for a local session JWT.
- **Request Body**:
  ```json
  {
    "token": "google_oauth_id_token_here"
  }
  ```
- **Local Dev Mock Authentication**:
  If `GOOGLE_CLIENT_ID` is empty or for local testing, pass a token string starting with `mock_` in the format: `mock_Name_email@domain.com`.
  *Example*: `"token": "mock_Joe-Doe_joedoe@gmail.com"`
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "joedoe@gmail.com",
      "name": "Joe Doe",
      "picture": "https://api.dicebear.com/...",
      "created_at": "2026-08-03T14:48:21Z"
    }
  }
  ```

#### `POST /auth/signup`
Register a new user with an email and password.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "Jane Doe"
  }
  ```
- **Response**: Same JWT token structure as `/auth/google`.

#### `POST /auth/login`
Authenticate a user with their email and password.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**: Same JWT token structure as `/auth/google`.

---

### 2. Search Operations
#### `GET /papers/search`
Query arXiv and Semantic Scholar concurrently, remove duplicates, rank, and store search terms.
- **Query Parameters**:
  - `query` (string, required): Problem description or keywords.
  - `limit` (integer, optional, default: 10): Max number of results.
- **Response**:
  ```json
  [
    {
      "title": "Attention Is All You Need",
      "authors": ["Ashish Vaswani", "Noam Shazeer"],
      "abstract": "We propose a new simple network architecture, the Transformer...",
      "url": "https://arxiv.org/abs/1706.03762",
      "venue": "NeurIPS",
      "year": 2017,
      "citationCount": 102450,
      "openAccessPdf": "https://arxiv.org/pdf/1706.03762.pdf",
      "source": "merged"
    }
  ]
  ```

#### `GET /repos/search`
Query the GitHub Search Repositories API for existing open-source codebases.
- **Query Parameters**:
  - `query` (string, required): Search keywords.
  - `limit` (integer, optional, default: 10): Max results.
- **Response**:
  ```json
  [
    {
      "name": "huggingface/transformers",
      "description": "State-of-the-art Machine Learning for PyTorch, TensorFlow, and JAX.",
      "url": "https://github.com/huggingface/transformers",
      "stars": 124000,
      "forks": 27000,
      "language": "Python",
      "owner": "huggingface"
    }
  ]
  ```

---

### 3. AI Features
#### `POST /differentiate`
Analyze research paper summaries and repository lists to recommend development angles.
- **Request Body**:
  ```json
  {
    "problem_statement": "realtime video style transfer",
    "papers": [ ... ],
    "repos": [ ... ]
  }
  ```
- **Response**:
  ```json
  {
    "suggestions": "### Product Differentiation Suggestions\n\n1. **Research Gaps**...\n2. **Product Angles**..."
  }
  ```

#### `POST /tech-stack`
Generate recommended stacks (Frontend, Backend, Database, AI models) with justifications.
- **Request Body**:
  ```json
  {
    "problem_statement": "Realtime AI voice translator"
  }
  ```
- **Response**:
  ```json
  {
    "problem_statement": "Realtime AI voice translator",
    "recommendation": {
      "Frontend": {"technology": "Next.js", "reason": "..."},
      "Backend": {"technology": "FastAPI", "reason": "..."},
      "Database": {"technology": "PostgreSQL", "reason": "..."}
    },
    "explanation": "### Architectural Overview\n..."
  }
  ```

#### `POST /generate-code`
Generate fully commented starter code scaffold files.
- **Request Body**:
  ```json
  {
    "problem_statement": "FastAPI backend",
    "tech_stack": {
      "backend": "FastAPI",
      "database": "SQLite"
    },
    "format": "json" // or "zip"
  }
  ```
- **Responses**:
  - **If `format` is `"json"`**: Returns a JSON representation:
    ```json
    {
      "files": {
        "main.py": "from fastapi import FastAPI...",
        "requirements.txt": "fastapi..."
      }
    }
    ```
  - **If `format` is `"zip"`**: Returns a binary file stream download (`application/zip`) containing the scaffold directories and files directly.

---

### 4. Conversation AI Assistant
#### `POST /assistant/chat`
Interact with a multi-turn chat assistant. Stores full dialogue histories inside the SQLite database.
- **Request Body**:
  ```json
  {
    "message": "Can you elaborate on using pgvector?",
    "session_id": "optional-uuid-string-to-continue-chat"
  }
  ```
- **Response**:
  ```json
  {
    "session_id": "4a71efda-d2bb-49e0-8266-0db4bfd3d5f3",
    "response": "pgvector is an extension for PostgreSQL...",
    "history": [
      {
        "role": "user",
        "content": "Can you elaborate on using pgvector?",
        "timestamp": "2026-08-03T14:49:07Z"
      },
      {
        "role": "assistant",
        "content": "pgvector is an extension for PostgreSQL...",
        "timestamp": "2026-08-03T14:49:07Z"
      }
    ]
  }
  ```

---

### 5. Administration
#### `GET /admin/stats`
Retrieves system aggregates, including users, search records, and session message volumes.
- **Authorization**: Checked server-side against the authenticated user's email. Restricted strictly to `prakasshdeva876@gmail.com`.
- **Response**:
  ```json
  {
    "total_users": 15,
    "total_searches": 42,
    "total_sessions": 8,
    "total_messages": 36,
    "recent_searches": [
      {
        "id": 1,
        "user_id": 2,
        "query": "transformer modeling",
        "timestamp": "2026-08-03T14:49:00Z"
      }
    ],
    "recent_users": [ ... ],
    "all_users_activity": [
      {
        "user": {
          "id": 2,
          "email": "researcher@example.com",
          "name": "Researcher",
          "picture": null,
          "created_at": "2026-08-03T14:48:00Z"
        },
        "searches": [
          {
            "id": 1,
            "query": "transformer modeling",
            "timestamp": "2026-08-03T14:49:00Z"
          }
        ],
        "chat_sessions": [
          {
            "id": "session-uuid",
            "title": "Chat about transformers",
            "created_at": "2026-08-03T14:50:00Z",
            "messages": [
              {
                "id": 1,
                "role": "user",
                "content": "Tell me about transformers",
                "timestamp": "2026-08-03T14:51:00Z"
              }
            ]
          }
        ]
      }
    ]
  }
  ```
