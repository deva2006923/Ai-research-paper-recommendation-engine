import urllib.parse
import httpx
from typing import List
from app.schemas import PaperResult

async def search_semantic_scholar(query: str, limit: int = 10) -> List[PaperResult]:
    """
    Search papers on Semantic Scholar API asynchronously.
    """
    if not query.strip():
        return []
        
    safe_query = urllib.parse.quote(query)
    fields = "title,authors,venue,year,abstract,citationCount,openAccessPdf,url"
    url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={safe_query}&limit={limit}&fields={fields}"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            # Handle rate limiting gracefully
            if response.status_code == 429:
                print("Semantic Scholar API rate-limited (HTTP 429).")
                return []
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Error querying Semantic Scholar: {e}")
            return []
            
    results = []
    try:
        papers = data.get("data", [])
        for paper in papers:
            title = paper.get("title", "Untitled")
            abstract = paper.get("abstract", "")
            venue = paper.get("venue", "")
            year = paper.get("year")
            citation_count = paper.get("citationCount", 0)
            url_link = paper.get("url")
            
            # Extract PDF URL
            pdf_info = paper.get("openAccessPdf")
            pdf_link = None
            if pdf_info and isinstance(pdf_info, dict):
                pdf_link = pdf_info.get("url")
                
            # Extract Authors
            authors_data = paper.get("authors", [])
            authors = [author.get("name") for author in authors_data if author.get("name")]
            
            results.append(
                PaperResult(
                    title=title,
                    authors=authors,
                    abstract=abstract,
                    url=url_link,
                    venue=venue or "Semantic Scholar",
                    year=year,
                    citationCount=citation_count,
                    openAccessPdf=pdf_link,
                    source="semanticscholar"
                )
            )
        return results
    except Exception as e:
        print(f"Error parsing Semantic Scholar JSON: {e}")
        return []
