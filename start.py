"""
One-click startup script for Scholarly Archive.
Starts backend, opens public tunnel, and prints the live URL.
Run: python start.py
"""
import subprocess
import threading
import time
import sys
import os

def run_backend():
    subprocess.Popen(
        ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

def run_frontend():
    subprocess.Popen(
        ["npm", "run", "dev", "--", "--host"],
        cwd=os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend"),
        shell=True
    )

print("Starting Scholarly Archive...")
print("=" * 50)

# Start backend and frontend
run_backend()
run_frontend()

# Wait for backend to be ready
print("Waiting for servers to start...")
time.sleep(5)

# Start ngrok tunnel on frontend port
try:
    from pyngrok import ngrok, conf

    # Start tunnels
    backend_tunnel = ngrok.connect(8000, "http")
    frontend_tunnel = ngrok.connect(5173, "http")

    backend_url = backend_tunnel.public_url
    frontend_url = frontend_tunnel.public_url

    print("\n" + "=" * 50)
    print("SCHOLARLY ARCHIVE IS LIVE!")
    print("=" * 50)
    print(f"\n FRONTEND (share this):  {frontend_url}")
    print(f" BACKEND API:            {backend_url}")
    print(f" API Docs:               {backend_url}/docs")
    print("\n" + "=" * 50)
    print("Press Ctrl+C to stop all servers\n")

    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down...")
        ngrok.kill()

except Exception as e:
    print(f"\nTunnel error: {e}")
    print("\nFalling back to local URLs:")
    print("  Frontend: http://localhost:5173")
    print("  Backend:  http://localhost:8000")
    print("\nPress Ctrl+C to stop")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
