import urllib.parse
import xml.etree.ElementTree as ET
import httpx
from typing import List
from app.schemas import PaperResult

async def search_arxiv(query: str, limit: int = 10) -> List[PaperResult]:
    """
    Search papers on arXiv API asynchronously.
    """
    if not query.strip():
        return []
        
    safe_query = urllib.parse.quote(query)
    url = f"https://export.arxiv.org/api/query?search_query=all:{safe_query}&max_results={limit}"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
        except Exception as e:
            print(f"Error querying arXiv: {e}")
            return []
            
    try:
        root = ET.fromstring(response.content)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        results = []
        for entry in root.findall('atom:entry', ns):
            # Parse title
            title_node = entry.find('atom:title', ns)
            title = " ".join(title_node.text.split()) if title_node is not None and title_node.text else "Untitled"
            
            # Parse abstract
            summary_node = entry.find('atom:summary', ns)
            abstract = " ".join(summary_node.text.split()) if summary_node is not None and summary_node.text else ""
            
            # Parse authors
            authors = []
            for author in entry.findall('atom:author', ns):
                name_node = author.find('atom:name', ns)
                if name_node is not None and name_node.text:
                    authors.append(name_node.text.strip())
            
            # Parse published year
            published_node = entry.find('atom:published', ns)
            year = None
            if published_node is not None and published_node.text:
                try:
                    year = int(published_node.text[:4])
                except ValueError:
                    pass
            
            # Parse URLs
            url_link = None
            pdf_link = None
            id_node = entry.find('atom:id', ns)
            if id_node is not None and id_node.text:
                url_link = id_node.text.strip()
                
            for link in entry.findall('atom:link', ns):
                rel = link.attrib.get('rel')
                title_attrib = link.attrib.get('title')
                href = link.attrib.get('href')
                if rel == 'alternate':
                    url_link = href
                elif rel == 'related' and (title_attrib == 'pdf' or (href and 'pdf' in href)):
                    pdf_link = href
                    
            if not pdf_link and url_link and "arxiv.org/abs/" in url_link:
                pdf_link = url_link.replace("arxiv.org/abs/", "arxiv.org/pdf/") + ".pdf"
                
            results.append(
                PaperResult(
                    title=title,
                    authors=authors,
                    abstract=abstract,
                    url=url_link,
                    venue="arXiv",
                    year=year,
                    citationCount=0,
                    openAccessPdf=pdf_link,
                    source="arxiv"
                )
            )
        return results
    except Exception as e:
        print(f"Error parsing arXiv XML: {e}")
        return []
