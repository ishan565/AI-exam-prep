# 🚀 AI-Powered Exam Prep Platform  

An intelligent exam-prep web app built with **Next.js (App Router, TypeScript)** and **PostgreSQL**.  
This platform helps students transform study notes into personalized question banks, quizzes, and adaptive learning dashboards — powered by **OpenAI** and enhanced with **Supabase Auth**.  

---

## ✨ Features

- 🔐 **Authentication** — Secure login/signup with Supabase  
- 📚 **Reverse Question Generation** — Turn definitions, notes, or answers into exam-style questions  
- ⚡ **Difficulty Modes** — Easy, Medium, Hard question generation  
- 📄 **Bulk Upload** — Upload PDFs/notes → Auto-generate question banks  
- 📝 **AI Notes Summarizer** — Highlight key concepts and compress big notes into digestible chunks  
- 🧠 **Quiz Mode** — Take quizzes with instant feedback and explanations  
- 🎮 **Gamification** — Badges, streaks, leaderboards for motivation  
- 📊 **Dashboards** — Track progress, weak areas, and performance trends  
- 🎙️ **Optional Voice Input** — Speak your answers, get questions generated  

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js 14 (App Router)](https://nextjs.org/) — React framework with server-side rendering
- [TypeScript](https://www.typescriptlang.org/) — Strongly typed JS for safer development
- [TailwindCSS](https://tailwindcss.com/) — Modern utility-first CSS for styling  

**Backend**
- [PostgreSQL](https://www.postgresql.org/) — Relational database for users, notes, and question banks  
- [Supabase Auth](https://supabase.com/) — Authentication and session handling  
- [OpenAI API](https://platform.openai.com/) — Natural language question generation  
- [Node.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/router-handlers) — Serverless endpoints inside Next.js  

**Infra**
- [Vercel](https://vercel.com/) — Hosting and serverless functions  
- [Docker (optional)](https://www.docker.com/) — Containerized local dev  
- [GitHub Actions](https://docs.github.com/en/actions) — CI/CD automation  

---

## 🗄️ Database Schema (Postgres)

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notes
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  note_id INT REFERENCES notes(id),
  question_type TEXT,
  difficulty TEXT,
  question_text TEXT,
  answer TEXT
);

-- Quiz Results
CREATE TABLE quiz_results (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  score INT,
  taken_at TIMESTAMP DEFAULT NOW()
);
