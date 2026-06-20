# Money Mentor 💰

AI-powered personal finance planning platform built with **React**, **FastAPI**, and **Google Gemini AI**.

## Overview

Money Mentor helps users analyze their financial health, generate personalized investment recommendations, estimate tax savings, calculate emergency funds, and interact with an AI-powered financial assistant.

The application combines financial planning algorithms with conversational AI to provide practical and personalized financial guidance.

---

## Features

* 🤖 AI-powered financial assistant using **Google Gemini**
* 📊 Personalized financial analysis dashboard
* 💰 Monthly SIP recommendations
* 🎯 Goal-based financial planning
* 🛡️ Risk profile assessment
* 💸 Tax saving estimation
* 🚨 Emergency fund calculation
* 📈 Interactive charts and analytics
* 📄 PDF report generation
* 🔐 JWT authentication with bcrypt password hashing
* 📱 Responsive user interface

---

## Tech Stack

### Frontend

* React 19
* Tailwind CSS
* Chart.js
* react-chartjs-2
* Axios
* html2canvas
* jsPDF
* React Markdown

### Backend

* FastAPI
* Python
* Pydantic
* python-dotenv
* JWT Authentication
* bcrypt

### AI

* Google Gemini API

---

## Getting Started

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Create a **backend/.env**

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=your_secret_key
```

---

### Frontend

```bash
cd frontend

npm install

npm start
```

Create a **frontend/.env**

```env
REACT_APP_API_URL=http://127.0.0.1:8000
```

---

## API Endpoints

| Method | Endpoint       | Description                              |
| ------ | -------------- | ---------------------------------------- |
| POST   | `/auth/signup` | Register a new user                      |
| POST   | `/auth/login`  | Authenticate user                        |
| POST   | `/analyze`     | Generate personalized financial analysis |
| POST   | `/chat`        | AI-powered financial assistant           |

---

## Project Structure

```
Money-Mentor
│
├── backend
│   ├── agents
│   ├── auth
│   ├── models
│   ├── services
│   └── main.py
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
└── README.md
```

---

## Notes

* User authentication uses JWT tokens.
* Passwords are securely hashed using bcrypt.
* Google Gemini powers the AI financial assistant.
* User financial data is used to generate personalized AI recommendations.
* Backend runs at **http://127.0.0.1:8000**
* Frontend runs at **http://localhost:3000**

---

## Future Improvements

* AI conversation memory
* Portfolio performance tracking
* Financial health score
* Expense categorization
* Live market data integration
* Cloud database integration

---

## Author

**Ruchi Raj**
