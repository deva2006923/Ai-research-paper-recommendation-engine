import sys
import os
from pathlib import Path

# Add project root directory to sys.path so Vercel serverless runtime can import 'app'
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from app.main import app
except Exception as e:
    import traceback
    print("Vercel Serverless Function Startup Error:", e)
    traceback.print_exc()
    raise e
