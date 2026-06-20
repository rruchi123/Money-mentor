import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is not set.")

genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-2.5-flash")


def ask_ai(system_prompt, user_prompt):
    prompt = f"""
{system_prompt}

User:
{user_prompt}
"""

    response = model.generate_content(prompt)

    return response.text