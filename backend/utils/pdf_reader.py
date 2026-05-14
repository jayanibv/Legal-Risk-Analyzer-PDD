import pdfplumber

def extract_text_from_pdf(file):
    text = ""

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"

    # 🔥 CLEAN TEXT
    text = text.replace("\n", " ")
    text = " ".join(text.split())  # remove extra spaces

    return text