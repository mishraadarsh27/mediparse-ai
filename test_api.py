import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"Testing API Key: {api_key[:10]}...{api_key[-5:]}")

try:
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Say 'API is working!' in exactly 3 words"}],
        max_tokens=50
    )
    print(f"✅ SUCCESS: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ ERROR: {e}")
