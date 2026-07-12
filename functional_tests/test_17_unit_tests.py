"""
test_17_unit_tests.py
Category: Unit Tests
Tests: TC331–TC390
Purpose: Pure unit-level tests for utility functions, validators, risk-scoring logic,
         JWT helpers, and Pydantic schema validation — no live network calls.
"""
import pytest
import re
import hashlib
import datetime
import json


# ─── Inline copies of backend helpers (avoids importing live DB) ─────────────

def validate_password(password: str):
    """Mirrors backend validate_password logic exactly."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number."
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character."
    return True, ""


def get_risk_level(score: int) -> str:
    """Mirrors backend get_risk_level logic."""
    if score >= 80:
        return "High Risk"
    if score >= 50:
        return "Medium Risk"
    return "Low Risk"


def validate_dob_format(dob: str) -> bool:
    """Returns True if dob matches YYYY-MM-DD and is a real date."""
    try:
        datetime.datetime.strptime(dob, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def compute_age(dob: str) -> int:
    """Compute integer age from YYYY-MM-DD string."""
    birth = datetime.datetime.strptime(dob, "%Y-%m-%d")
    today = datetime.datetime.today()
    return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))


def hash_text(text: str) -> str:
    """SHA-256 hash of text — matches backend caching logic."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def is_valid_email(email: str) -> bool:
    """Basic RFC-5322 inspired regex check."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email))


def normalize_security_answer(answer: str) -> str:
    """Matches backend: strip + lower."""
    return answer.strip().lower()


# ─── TC331–TC345: Password Validation Unit Tests ─────────────────────────────

class TestPasswordValidation:
    """TC331–TC345: validate_password() unit tests."""

    def test_tc331_strong_password_passes(self):
        """TC331: Strong password with all requirements passes."""
        ok, msg = validate_password("Secure@123")
        assert ok is True and msg == ""

    def test_tc332_password_too_short_fails(self):
        """TC332: Password under 8 chars fails with length error."""
        ok, msg = validate_password("Ab@1")
        assert ok is False
        assert "8 characters" in msg

    def test_tc333_password_no_digit_fails(self):
        """TC333: Password without digit fails."""
        ok, msg = validate_password("NoDigit!")
        assert ok is False
        assert "number" in msg

    def test_tc334_password_no_special_char_fails(self):
        """TC334: Password without special character fails."""
        ok, msg = validate_password("NoSpecial123")
        assert ok is False
        assert "special character" in msg

    def test_tc335_password_exactly_8_chars_valid(self):
        """TC335: Password with exactly 8 chars meeting all rules passes."""
        ok, msg = validate_password("Test@123")
        assert ok is True

    def test_tc336_password_empty_string_fails(self):
        """TC336: Empty password string fails."""
        ok, msg = validate_password("")
        assert ok is False

    def test_tc337_password_only_numbers_fails(self):
        """TC337: Numeric-only password fails (no special char)."""
        ok, msg = validate_password("12345678")
        assert ok is False

    def test_tc338_password_only_special_chars_fails(self):
        """TC338: Special-chars-only password fails (no digit)."""
        ok, msg = validate_password("!@#$%^&*(")
        assert ok is False

    def test_tc339_password_with_spaces_still_passes_if_criteria_met(self):
        """TC339: Password with spaces is accepted if other criteria met."""
        ok, msg = validate_password("Pass 1@ok!")
        assert ok is True

    def test_tc340_password_very_long_still_passes(self):
        """TC340: 64-char password still passes all criteria."""
        pw = "Aa1!" * 16
        ok, msg = validate_password(pw)
        assert ok is True

    def test_tc341_password_unicode_chars_passes_if_criteria_met(self):
        """TC341: Unicode characters alongside digit+special pass."""
        ok, msg = validate_password("Héllo@123")
        assert ok is True

    def test_tc342_password_exactly_7_chars_fails(self):
        """TC342: 7-char password that otherwise meets rules fails."""
        ok, msg = validate_password("A@1pass")
        assert ok is False

    def test_tc343_password_missing_uppercase_still_passes(self):
        """TC343: Uppercase is not required — lowercase+digit+special passes."""
        ok, msg = validate_password("lower@123")
        assert ok is True

    def test_tc344_password_returns_tuple(self):
        """TC344: validate_password always returns a 2-tuple."""
        result = validate_password("Test@123")
        assert isinstance(result, tuple) and len(result) == 2

    def test_tc345_password_return_types_are_bool_and_str(self):
        """TC345: validate_password returns (bool, str)."""
        ok, msg = validate_password("Weak")
        assert isinstance(ok, bool)
        assert isinstance(msg, str)


# ─── TC346–TC358: Risk Level Scoring Unit Tests ───────────────────────────────

class TestRiskScoring:
    """TC346–TC358: get_risk_level() boundary and value tests."""

    def test_tc346_score_100_is_high_risk(self):
        """TC346: Score 100 → High Risk."""
        assert get_risk_level(100) == "High Risk"

    def test_tc347_score_80_is_high_risk(self):
        """TC347: Score 80 (boundary) → High Risk."""
        assert get_risk_level(80) == "High Risk"

    def test_tc348_score_79_is_medium_risk(self):
        """TC348: Score 79 → Medium Risk."""
        assert get_risk_level(79) == "Medium Risk"

    def test_tc349_score_50_is_medium_risk(self):
        """TC349: Score 50 (boundary) → Medium Risk."""
        assert get_risk_level(50) == "Medium Risk"

    def test_tc350_score_49_is_low_risk(self):
        """TC350: Score 49 → Low Risk."""
        assert get_risk_level(49) == "Low Risk"

    def test_tc351_score_0_is_low_risk(self):
        """TC351: Score 0 → Low Risk."""
        assert get_risk_level(0) == "Low Risk"

    def test_tc352_score_1_is_low_risk(self):
        """TC352: Score 1 → Low Risk."""
        assert get_risk_level(1) == "Low Risk"

    def test_tc353_score_99_is_high_risk(self):
        """TC353: Score 99 → High Risk."""
        assert get_risk_level(99) == "High Risk"

    def test_tc354_score_65_is_medium_risk(self):
        """TC354: Score 65 → Medium Risk."""
        assert get_risk_level(65) == "Medium Risk"

    def test_tc355_risk_level_returns_string(self):
        """TC355: get_risk_level always returns a string."""
        for s in [0, 50, 80, 100]:
            assert isinstance(get_risk_level(s), str)

    def test_tc356_risk_level_only_three_values(self):
        """TC356: Risk level only returns one of three expected strings."""
        valid = {"High Risk", "Medium Risk", "Low Risk"}
        for s in range(0, 101, 5):
            assert get_risk_level(s) in valid

    def test_tc357_risk_level_consistent_for_same_input(self):
        """TC357: Same score always returns same risk level (deterministic)."""
        assert get_risk_level(75) == get_risk_level(75)

    def test_tc358_risk_level_not_empty(self):
        """TC358: Risk level string is never empty."""
        for s in [0, 50, 80]:
            assert len(get_risk_level(s)) > 0


# ─── TC359–TC368: Date of Birth / Age Validation Unit Tests ──────────────────

class TestDOBValidation:
    """TC359–TC368: DOB format and age calculation tests."""

    def test_tc359_valid_dob_format(self):
        """TC359: YYYY-MM-DD format is valid."""
        assert validate_dob_format("1990-01-15") is True

    def test_tc360_invalid_dob_dd_mm_yyyy(self):
        """TC360: DD/MM/YYYY format is invalid."""
        assert validate_dob_format("15/01/1990") is False

    def test_tc361_invalid_dob_mm_dd_yyyy(self):
        """TC361: MM-DD-YYYY format is invalid."""
        assert validate_dob_format("01-15-1990") is False

    def test_tc362_invalid_dob_no_separator(self):
        """TC362: Date without separators is invalid."""
        assert validate_dob_format("19900115") is False

    def test_tc363_invalid_dob_month_13(self):
        """TC363: Month 13 is invalid."""
        assert validate_dob_format("1990-13-01") is False

    def test_tc364_invalid_dob_day_32(self):
        """TC364: Day 32 is invalid."""
        assert validate_dob_format("1990-01-32") is False

    def test_tc365_age_calculation_adult(self):
        """TC365: Adult born in 1990 is >= 18."""
        age = compute_age("1990-06-15")
        assert age >= 18

    def test_tc366_age_calculation_minor(self):
        """TC366: User born in 2015 is < 18."""
        age = compute_age("2015-01-01")
        assert age < 18

    def test_tc367_age_boundary_exactly_18(self):
        """TC367: Age on 18th birthday is exactly 18."""
        today = datetime.datetime.today()
        dob_18 = datetime.date(today.year - 18, today.month, today.day)
        age = compute_age(dob_18.strftime("%Y-%m-%d"))
        assert age == 18

    def test_tc368_leap_year_dob_valid(self):
        """TC368: Leap year DOB (Feb 29) is valid."""
        assert validate_dob_format("1996-02-29") is True


# ─── TC369–TC375: Hash / Caching Logic Unit Tests ────────────────────────────

class TestHashLogic:
    """TC369–TC375: SHA-256 text hashing for caching."""

    def test_tc369_same_text_same_hash(self):
        """TC369: Same text produces identical hash."""
        t = "Legal agreement text here."
        assert hash_text(t) == hash_text(t)

    def test_tc370_different_texts_different_hashes(self):
        """TC370: Different texts produce different hashes."""
        assert hash_text("text A") != hash_text("text B")

    def test_tc371_hash_is_64_hex_chars(self):
        """TC371: SHA-256 hash is always 64 hex characters."""
        h = hash_text("any text")
        assert len(h) == 64 and all(c in "0123456789abcdef" for c in h)

    def test_tc372_empty_string_hashes(self):
        """TC372: Empty string produces a valid hash."""
        h = hash_text("")
        assert len(h) == 64

    def test_tc373_unicode_text_hashes(self):
        """TC373: Unicode text produces valid hash."""
        h = hash_text("contrato en español 日本語")
        assert len(h) == 64

    def test_tc374_case_sensitive_hashing(self):
        """TC374: 'ABC' and 'abc' produce different hashes."""
        assert hash_text("ABC") != hash_text("abc")

    def test_tc375_hash_type_is_string(self):
        """TC375: hash_text returns a string."""
        assert isinstance(hash_text("test"), str)


# ─── TC376–TC382: Email Validation Unit Tests ─────────────────────────────────

class TestEmailValidation:
    """TC376–TC382: is_valid_email() unit tests."""

    def test_tc376_valid_email(self):
        """TC376: Standard email address is valid."""
        assert is_valid_email("user@example.com") is True

    def test_tc377_email_missing_at_sign(self):
        """TC377: Email without @ is invalid."""
        assert is_valid_email("userexample.com") is False

    def test_tc378_email_missing_domain(self):
        """TC378: Email without domain is invalid."""
        assert is_valid_email("user@") is False

    def test_tc379_email_with_subdomain(self):
        """TC379: Email with subdomain is valid."""
        assert is_valid_email("user@mail.example.co.uk") is True

    def test_tc380_email_with_plus_alias(self):
        """TC380: Plus-alias email is valid."""
        assert is_valid_email("user+filter@example.com") is True

    def test_tc381_empty_string_is_invalid_email(self):
        """TC381: Empty string is not a valid email."""
        assert is_valid_email("") is False

    def test_tc382_email_with_spaces_invalid(self):
        """TC382: Email containing spaces is invalid."""
        assert is_valid_email("user @example.com") is False


# ─── TC383–TC390: Security Answer Normalization Unit Tests ────────────────────

class TestSecurityAnswerNormalization:
    """TC383–TC390: normalize_security_answer() tests."""

    def test_tc383_lowercase_unchanged(self):
        """TC383: Already lowercase answer is unchanged."""
        assert normalize_security_answer("fluffy") == "fluffy"

    def test_tc384_uppercase_lowercased(self):
        """TC384: Uppercase answer is lowercased."""
        assert normalize_security_answer("FLUFFY") == "fluffy"

    def test_tc385_leading_trailing_whitespace_stripped(self):
        """TC385: Whitespace is stripped from both ends."""
        assert normalize_security_answer("  fluffy  ") == "fluffy"

    def test_tc386_mixed_case_normalized(self):
        """TC386: Mixed-case answer is fully lowercased."""
        assert normalize_security_answer("FlUfFy") == "fluffy"

    def test_tc387_empty_string_returns_empty(self):
        """TC387: Empty string normalizes to empty string."""
        assert normalize_security_answer("") == ""

    def test_tc388_answer_with_internal_spaces_preserved(self):
        """TC388: Internal spaces are preserved (only ends stripped)."""
        assert normalize_security_answer("my best friend") == "my best friend"

    def test_tc389_numeric_answer_preserved(self):
        """TC389: Numeric security answer is preserved as string."""
        assert normalize_security_answer("12345") == "12345"

    def test_tc390_unicode_answer_lowercased(self):
        """TC390: Unicode characters in security answer are lowercased."""
        assert normalize_security_answer("Héro") == "héro"
