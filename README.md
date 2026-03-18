# 🐾 Animal Helper

A prototype platform for shelter transparency, developed during the ID2 Impact Hackathon 2026.

<img width="100%" alt="App Preview" src="https://github.com/user-attachments/assets/3a94cada-49c0-4abc-b0be-6e1b97678855" />

---

## About the Project

Animal Helper is a prototype of a shelter transparency platform developed during the Idea2Impact Hackathon 2026 in collaboration with Animal Helper and Fundacja Psia Krew.

The project addresses a real-world problem:
lack of accessible, structured, and comparable data about animal shelters.

Instead of relying only on scattered information or emotional opinions, the platform introduces a data-driven and explainable system that combines:

- structured public data
- welfare indicators
- community feedback

---

## Problem

Information about animal shelters is:

- fragmented across multiple sources (municipalities, BIP, websites, social media)
- often incomplete or outdated
- difficult to verify and compare

There is no single, user-friendly public layer that allows citizens to:

- understand how a shelter operates
- compare shelters
- assess transparency and potential risks

---

## Solution

We created a map-based platform that aggregates and structures shelter data into a single interface.

The system provides:

- Interactive Map - explore shelters geographically
- Shelter Profiles - structured information about each facility
- Trust Score - explainable evaluation based on data and reviews
- Structured Reviews - category-based user feedback
- Reporting System - submit issues or concerns

---

## Trust Score (Core Idea)

Instead of a simple rating, we use a weighted model:

**Final Score = (Structured Score × 0.55) + (Review Score × 0.45)**

### Structured Score includes:

- legal and administrative data
- veterinary oversight
- transparency level
- welfare indicators (capacity, mortality, adoption activity)

### Review Score includes:

- structured user feedback
- category-based evaluation
- credibility adjustments (anti-spam, weighting)

The goal is not to create a hate ranking, but to provide a balanced and explainable trust signal.

---

## Key Features

- Interactive map (OpenStreetMap)
- Shelter data aggregation and normalization
- Trust scoring algorithm
- Review system with categories
- Incident reporting system
- Backend API with automatic score calculation

---

## 🛠️ Tech Stack

### Backend

- Python 3.13+
- FastAPI
- PostgreSQL
- Pydantic

### Frontend

- React 19
- Vite
- TailwindCSS
- Leaflet / React-Leaflet

---

## ⚙️ Getting Started

### 1. Backend

```bash
cd backend
uv sync
cd app
python main.py
```

Backend runs at:

- http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

- http://localhost:5173

---

## What Happens Automatically

When the backend starts:

- shelter scores are calculated automatically
- structural and review data are analyzed
- systemic issues are detected across multiple categories

---

## Project Status

This project is an early-stage prototype, created within limited hackathon time.

### What is implemented:

- core data model
- scoring logic
- basic UI and map
- API and data flow

### What is not fully implemented yet:

- advanced filtering
- full verification system
- trend analysis
- complete data coverage

---

## Future Development

Planned improvements include:

- shelter verification system
- advanced filtering and search
- trend analysis of reviews
- improved data completeness
- public event and volunteer modules
- lost & found animals system
- map-based safety navigation for dog owners

---

## Context

This project was created as part of:

- Idea2Impact Hackathon 2026
- collaboration with Animal Helper
- in response to a real challenge proposed by Fundacja Psia Krew

🔗 https://www.idea2impact.pl/
🔗 https://www.animalhelper.pl/

---

## 👥 Team

Project developed by a student team (UG, 2026)

---

## 📌 Note

This repository represents a prototype and concept validation, not a finished production system.
The project is currently being considered for further development in collaboration with external partners.
