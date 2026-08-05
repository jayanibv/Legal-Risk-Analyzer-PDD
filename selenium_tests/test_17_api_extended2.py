"""
test_17_api_extended2.py
Category: Extended API Edge Cases & Method Validations
Tests: TC331–TC361
"""
import pytest
import requests
from _e2e_helpers import BASE_URL

class TestAPIMethodsAndEdgeCases:
    
    def test_tc331_invalid_method_on_login(self):
        r = requests.get(f"{BASE_URL}/login")
        assert r.status_code == 405

    def test_tc332_invalid_method_on_signup(self):
        r = requests.get(f"{BASE_URL}/signup")
        assert r.status_code == 405

    def test_tc333_invalid_method_on_analyze(self):
        r = requests.get(f"{BASE_URL}/analyze")
        assert r.status_code == 405



    def test_tc335_invalid_method_on_history(self):
        r = requests.post(f"{BASE_URL}/history")
        assert r.status_code in (405, 401)

    def test_tc336_invalid_method_on_me(self):
        r = requests.post(f"{BASE_URL}/me")
        assert r.status_code in (405, 401)

    def test_tc337_invalid_method_on_root(self):
        r = requests.post(f"{BASE_URL}/")
        assert r.status_code == 405

    def test_tc338_put_method_on_login(self):
        r = requests.put(f"{BASE_URL}/login")
        assert r.status_code == 405

    def test_tc339_put_method_on_signup(self):
        r = requests.put(f"{BASE_URL}/signup")
        assert r.status_code == 405

    def test_tc340_put_method_on_analyze(self):
        r = requests.put(f"{BASE_URL}/analyze")
        assert r.status_code == 405



    def test_tc342_put_method_on_history(self):
        r = requests.put(f"{BASE_URL}/history")
        assert r.status_code in (405, 401)

    def test_tc343_put_method_on_me(self):
        r = requests.put(f"{BASE_URL}/me")
        assert r.status_code in (405, 401)

    def test_tc344_delete_method_on_login(self):
        r = requests.delete(f"{BASE_URL}/login")
        assert r.status_code == 405

    def test_tc345_delete_method_on_signup(self):
        r = requests.delete(f"{BASE_URL}/signup")
        assert r.status_code == 405

    def test_tc346_delete_method_on_analyze(self):
        r = requests.delete(f"{BASE_URL}/analyze")
        assert r.status_code == 405



    def test_tc348_delete_method_on_history(self):
        r = requests.delete(f"{BASE_URL}/history")
        assert r.status_code in (405, 401)

    def test_tc349_delete_method_on_me(self):
        r = requests.delete(f"{BASE_URL}/me")
        assert r.status_code in (405, 401)

    def test_tc350_options_method_on_root(self):
        r = requests.options(f"{BASE_URL}/")
        assert r.status_code in (200, 405, 404)

    def test_tc351_options_method_on_login(self):
        r = requests.options(f"{BASE_URL}/login")
        assert r.status_code in (200, 405, 404)

    def test_tc352_options_method_on_signup(self):
        r = requests.options(f"{BASE_URL}/signup")
        assert r.status_code in (200, 405, 404)

    def test_tc353_options_method_on_analyze(self):
        r = requests.options(f"{BASE_URL}/analyze")
        assert r.status_code in (200, 405, 404)



    def test_tc355_options_method_on_history(self):
        r = requests.options(f"{BASE_URL}/history")
        assert r.status_code in (200, 405, 404)

    def test_tc356_options_method_on_me(self):
        r = requests.options(f"{BASE_URL}/me")
        assert r.status_code in (200, 405, 404)

    def test_tc357_head_method_on_root(self):
        r = requests.head(f"{BASE_URL}/")
        assert r.status_code in (200, 405, 404)

    def test_tc358_post_reset_password_no_payload(self):
        r = requests.post(f"{BASE_URL}/reset-password")
        assert r.status_code == 422

    def test_tc359_get_nonexistent_endpoint(self):
        r = requests.get(f"{BASE_URL}/nonexistent-endpoint-12345")
        assert r.status_code == 404

    def test_tc360_post_nonexistent_endpoint(self):
        r = requests.post(f"{BASE_URL}/nonexistent-endpoint-12345")
        assert r.status_code == 404

    def test_tc361_history_invalid_uuid(self):
        r = requests.get(f"{BASE_URL}/history/invalid-uuid")
        assert r.status_code in (422, 401, 404)
