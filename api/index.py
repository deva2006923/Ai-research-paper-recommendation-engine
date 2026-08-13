import sys
import os
from pathlib import Path
import traceback

# Add project root directory to sys.path so Vercel serverless runtime can import 'app'
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from app.main import app as fastapi_app
    
    async def app(scope, receive, send):
        try:
            await fastapi_app(scope, receive, send)
        except Exception as e:
            print("CRITICAL ASGI INVOCATION ERROR:", e, flush=True)
            traceback.print_exc()
            # Try to return the raw stack trace as a 500 response
            if scope["type"] == "http":
                try:
                    await send({
                        "type": "http.response.start",
                        "status": 500,
                        "headers": [(b"content-type", b"text/plain")],
                    })
                    await send({
                        "type": "http.response.body",
                        "body": (f"CRITICAL ASGI ERROR:\n{e}\n\n{traceback.format_exc()}").encode(),
                    })
                except Exception as inner_e:
                    print("Failed to send custom 500 response:", inner_e, flush=True)
            raise e

except Exception as e:
    print("CRITICAL: Vercel Serverless Function Startup Error:", e, flush=True)
    traceback.print_exc()
    raise e
