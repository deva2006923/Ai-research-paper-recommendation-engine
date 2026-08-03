import urllib.parse
import httpx
from typing import List
from app.config import settings
from app.schemas import RepoResult

async def search_github(query: str, limit: int = 10) -> List[RepoResult]:
    """
    Search repositories on GitHub API asynchronously.
    """
    if not query.strip():
        return []
        
    full_query = f"{query} size:>0"
    safe_query = urllib.parse.quote(full_query)
    url = f"https://api.github.com/search/repositories?q={safe_query}&sort=stars&order=desc&per_page={limit}"
    
    headers = {
        "User-Agent": "fastapi-research-recommendation-engine",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # Use optional token to avoid rate limits
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"
        
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url, headers=headers)
            # Handle rate limiting gracefully
            if response.status_code == 403 or response.status_code == 429:
                print("GitHub API rate-limited or forbidden. Returning empty list.")
                return []
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error querying GitHub API: {e}")
            return []
            
    results = []
    try:
        items = data.get("items", [])
        for item in items:
            name = item.get("full_name") or item.get("name") or "Unknown"
            description = item.get("description", "")
            url_link = item.get("html_url") or ""
            stars = item.get("stargazers_count", 0)
            forks = item.get("forks_count", 0)
            language = item.get("language")
            owner = item.get("owner", {}).get("login", "Unknown")
            
            results.append(
                RepoResult(
                    name=name,
                    description=description,
                    url=url_link,
                    stars=stars,
                    forks=forks,
                    language=language,
                    owner=owner
                )
            )
        return results
    except Exception as e:
        print(f"Error parsing GitHub API JSON: {e}")
        return []
