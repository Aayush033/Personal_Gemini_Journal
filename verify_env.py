#!/usr/bin/env python3
"""
Verification script for Personal Gemini Journal local setup.
Tests local environment configuration, .env keys, and server status.

Usage:
    python verify_env.py
"""
import os
import sys
import shutil

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def main():
    print("==========================================================")
    print("  Personal Gemini Journal — Local Environment Verification")
    print("==========================================================")

    # 1. Check Python and Virtual Environment
    is_venv = sys.prefix != sys.base_prefix
    print(f"[*] Python Runtime:     {sys.version.split()[0]} ({sys.executable})")
    print(f"[*] Active Virtualenv:  {'YES (' + sys.prefix + ')' if is_venv else 'NO (Global environment)'}")

    # 2. Check Node & NPM
    node_bin = shutil.which("node")
    npm_bin = shutil.which("npm")
    print(f"[*] Node.js Binary:     {node_bin if node_bin else 'NOT FOUND (run: nodeenv -p)'}")
    print(f"[*] NPM Binary:         {npm_bin if npm_bin else 'NOT FOUND'}")

    # 3. Check GEMINI_API_KEY
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[!] GEMINI_API_KEY:     NOT SET in .env or environment")
        print("    --> Create a .env file containing: GEMINI_API_KEY=\"your_key\"")
    elif api_key == "your_actual_gemini_api_key_here":
        print("[!] GEMINI_API_KEY:     Contains placeholder value from .env.example")
    else:
        masked = api_key[:4] + "..." + api_key[-4:] if len(api_key) > 8 else "***"
        print(f"[✓] GEMINI_API_KEY:     Configured ({masked})")

    # 4. Check Local Server (if running)
    try:
        import requests
        res = requests.get("http://localhost:3000/api/health", timeout=2)
        if res.status_code == 200:
            print("[✓] Local Dev Server:   RUNNING (http://localhost:3000)")
        else:
            print(f"[!] Local Dev Server:   HTTP {res.status_code}")
    except Exception:
        print("[*] Local Dev Server:   NOT RUNNING (start with: npm run dev)")

    print("==========================================================")
    print("Ready to develop! Run 'npm run dev' to launch application.")
    print("==========================================================")

if __name__ == "__main__":
    main()
