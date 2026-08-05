import requests

try:
    # 1. Login to get token
    login_data = {'username': 'testuser_e2e@legalrisk.dev', 'password': 'TestPass@123'}
    res = requests.post('http://127.0.0.1:8000/login', data=login_data)
    token = res.json().get('access_token')
    if not token:
        # signup
        res = requests.post('http://127.0.0.1:8000/signup', json={'name':'Test','email':'testuser_e2e@legalrisk.dev','password':'TestPass@123','dob':'1990-01-01','is_major':True,'security_answer':'test'})
        token = res.json().get('access_token')
        
    print('Got token')
    
    # 2. Test chat
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    import time
    start = time.time()
    res = requests.post('http://127.0.0.1:8000/chat', headers=headers, json={'message': 'what are the cases for theft?'})
    print(f'Time taken: {time.time()-start:.2f}s')
    print('Response:', res.json())
except Exception as e:
    print('Error:', e)
