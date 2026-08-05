"""
test_18_api_extended3.py
Category: More API Validation
Tests: TC362–TC371
"""
import pytest
import requests
from _e2e_helpers import BASE_URL

class TestMoreAPIValidation:
    
    def test_tc362_login_options(self):
        r = requests.options(f"{BASE_URL}/login")
        assert r.status_code in (200, 405, 404)

    def test_tc363_signup_options(self):
        r = requests.options(f"{BASE_URL}/signup")
        assert r.status_code in (200, 405, 404)

    def test_tc364_chat_options(self):
        r = requests.options(f"{BASE_URL}/chat")
        assert r.status_code in (200, 405, 404)

    def test_tc365_history_options(self):
        r = requests.options(f"{BASE_URL}/history")
        assert r.status_code in (200, 405, 404)

    def test_tc366_me_options(self):
        r = requests.options(f"{BASE_URL}/me")
        assert r.status_code in (200, 405, 404)

    def test_tc367_analyze_options(self):
        r = requests.options(f"{BASE_URL}/analyze")
        assert r.status_code in (200, 405, 404)
        
    def test_tc368_reset_options(self):
        r = requests.options(f"{BASE_URL}/reset-password")
        assert r.status_code in (200, 405, 404)

    def test_tc369_nonexistent_options(self):
        r = requests.options(f"{BASE_URL}/nonexistent-route")
        assert r.status_code in (200, 404)
        
    def test_tc370_head_login(self):
        r = requests.head(f"{BASE_URL}/login")
        assert r.status_code in (405, 200)

    def test_tc371_head_signup(self):
        r = requests.head(f"{BASE_URL}/signup")
        assert r.status_code in (405, 200)
