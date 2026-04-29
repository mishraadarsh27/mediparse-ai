import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Hello. Just testing connection."}],
        max_tokens=10
    )
    print(f"GROQ_SUCCESS: {completion.choices[0].message.content}")
except Exception as e:
    print(f"GROQ_FAIL: {e}")
