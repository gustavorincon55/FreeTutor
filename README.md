# FreeTutor
Free tutoring to kids in need.
 
## Contributors
- Gabriel Cavalcante Causin
- Gustavo Rincon
- Benjamin Mason
## Tech Stack
- **Backend:** Django + Django REST Framework, PostgreSQL
- **Frontend:** React + Vite
---
 
## Prerequisites
 
Install these before you start:
 
- **Python 3.11+** with `venv`
- **Node.js 18+** and `npm`
- **PostgreSQL** (running locally, with a way to run `psql`)
- **Git**
---
 
## 1. Clone the repo
 
```bash
git clone https://github.com/gustavorincon55/FreeTutor.git
cd FreeTutor
```
 
## 2. Set up the database
 
The backend expects a local PostgreSQL database with these exact credentials (see `backend/freetutorproject/settings.py`):
 
- Database name: `freetutordb`
- User: `freetutoruser`
- Password: `111111`
- Host: `localhost`, Port: `5432`
Create them with `psql`:
 
```bash
psql -U postgres
```
 
Then, inside the `psql` prompt:
 
```sql
CREATE DATABASE freetutordb;
CREATE USER freetutoruser WITH PASSWORD '111111';
GRANT ALL PRIVILEGES ON DATABASE freetutordb TO freetutoruser;
\q
```
 
> If `psql -U postgres` doesn't work, your local Postgres install may use a different default admin user/setup — check your OS's Postgres docs.
 
## 3. Set up the backend
 
```bash
cd backend
python -m venv venv
 
# Activate the virtual environment:
source venv/bin/activate      # macOS/Linux
venv\Scripts\activate         # Windows
 
pip install -r requirements.txt
 
python manage.py migrate
python manage.py runserver 8000
```
 
Leave this running. The API is now live at `http://localhost:8000`.
 
> Optional: run `python manage.py createsuperuser` if you want access to Django's admin panel at `http://localhost:8000/admin`.
 
## 4. Set up the frontend
 
In a **new terminal**:
 
```bash
cd frontend
npm install
npm run dev
```
 
Open **http://localhost:5173** in your browser. The frontend talks to `http://localhost:8000` by default — no extra config needed for local dev.
 
---
 
## Troubleshooting
 
**CORS error after a config change**
1. Stop the backend (`Ctrl+C`)
2. Restart it: `cd backend && python manage.py runserver 8000`
**Port already in use**
```bash
lsof -ti:8000 | xargs kill -9   # free port 8000 (backend)
lsof -ti:5173 | xargs kill -9   # free port 5173 (frontend)
```
 
**`django.db.utils.OperationalError` / can't connect to database**
- Confirm PostgreSQL is running (`pg_isready` or check your OS service status)
- Confirm the database/user from Step 2 exist: `psql -U freetutoruser -d freetutordb -h localhost`
**`ModuleNotFoundError` on backend startup**
- Make sure your virtual environment is activated (you should see `(venv)` in your terminal prompt) before running `pip install` or `manage.py`
**Frontend won't start / dependency errors**
- Delete `frontend/node_modules` and `frontend/package-lock.json`, then re-run `npm install`
---
  



