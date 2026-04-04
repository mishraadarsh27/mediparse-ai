import os
from dotenv import load_dotenv
import requests

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

def test():
    print(f"URL: {SUPABASE_URL}")
    print(f"KEY: {SUPABASE_KEY[:10]}...")
    try:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/documents?select=id&limit=1", headers=_headers())
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
