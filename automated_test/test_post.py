import requests
import time

try:
    t0 = time.time()
    r = requests.post("http://localhost:8000/signup", json={})
    print("Status code:", r.status_code)
    print("Response text:", r.text)
    print("Time taken:", time.time() - t0)
except Exception as e:
    print("Exception occurred:", type(e), e)
