import requests

try:
    with open("backend/Masterclass-1SKJ.pdf", "rb") as f:
        res = requests.post("http://localhost:8000/api/upload", files={"file": f})
        print(res.status_code)
        print(res.text[:500])
except Exception as e:
    print(e)
