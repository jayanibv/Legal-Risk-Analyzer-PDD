import re

def split_into_clauses(text):
    # Split using numbered clauses (1., 2., etc.)
    clauses = re.split(r'\n?\d+\.\s', text)

    cleaned = [c.strip() for c in clauses if len(c.strip()) > 30]

    return cleaned