import httpx
import asyncio

async def main():
    print("Logging in with mock token...")
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=30.0) as client:
        # 1. Login to get JWT
        login_res = await client.post("/auth/google", json={"token": "mock_Test_test@test.com"})
        if login_res.status_code != 200:
            print("Login failed:", login_res.status_code, login_res.text)
            return
            
        jwt_token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        # 2. Test searchPapers
        print("\nTesting /papers/search...")
        papers_res = await client.get("/papers/search?query=test&limit=2", headers=headers)
        print("papers status:", papers_res.status_code)
        if papers_res.status_code != 200:
            print("papers error:", papers_res.text)
            
        # 3. Test searchRepos
        print("\nTesting /repos/search...")
        repos_res = await client.get("/repos/search?query=test&limit=2", headers=headers)
        print("repos status:", repos_res.status_code)
        if repos_res.status_code != 200:
            print("repos error:", repos_res.text)

        # 4. Test differentiate with tricky string
        print("\nTesting /differentiate with tricky regex/file paths...")
        diff_payload = {
            "problem_statement": "Build a parser for C:\\Users\\Name\\Path and extract regex ^[a-z]\\escape$ \n with raw newlines and trailing commas.",
            "papers": [],
            "repos": []
        }
        diff_res = await client.post("/differentiate", json=diff_payload, headers=headers)
        print("differentiate status:", diff_res.status_code)
        if diff_res.status_code == 200:
            data = diff_res.json()
            score = data.get("suggested_product_direction", {}).get("feasibility_score", 0)
            if score == 0:
                print("differentiate ERROR: Hit the fallback! Parsing failed.")
            else:
                print("differentiate SUCCESS: Parsed LLM response without hitting fallback.")

        # 5. Test tech-stack
        print("\nTesting /tech-stack...")
        ts_res = await client.post("/tech-stack", json={"problem_statement": "AI recommendation"}, headers=headers)
        print("tech-stack status:", ts_res.status_code)
        if ts_res.status_code != 200:
            print("tech-stack error:", ts_res.text)
            return
            
        tech_stack = ts_res.json().get("recommendation", {})
        
        # 6. Test generate-code with tricky string
        print("\nTesting /generate-code with tricky string...")
        code_res = await client.post("/generate-code", json={
            "problem_statement": "Write a python regex script parsing C:\\Windows\\System32 and finding \\n \\t \\escape and output 'quotes' and \"double quotes\"", 
            "tech_stack": tech_stack, 
            "format": "json"
        }, headers=headers)
        print("generate-code status:", code_res.status_code)
        if code_res.status_code != 200:
            print("generate-code error:", code_res.text)
        else:
            files = code_res.json().get("files", {})
            if "error_fallback.txt" in files or "error.txt" in files:
                print("generate-code ERROR: Hit the fallback! Parsing failed.")
            else:
                print("generate-code SUCCESS: Parsed LLM response without hitting fallback.")

asyncio.run(main())
