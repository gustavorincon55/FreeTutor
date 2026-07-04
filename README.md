# FreeTutor
Free tutoring to kids in need. 

# Contributors
- Gabriel Cavalcante Causin
- Gustavo Rincon
- Benjamin Mason

# How to start the app locally
  cd backend
  venv/bin/python manage.py runserver 8000

  Frontend (separate terminal):
  cd frontend
  npm run dev
  
  Then open http://localhost:5173 in your browser.

  If you're seeing a CORS error after a config change:

  1. Stop the backend (Ctrl+C)
  2. cd backend && venv/bin/python manage.py runserver 8000

  If a port is already in use and you need to free it:
  - lsof -ti:8000 | xargs kill -9   # kill whatever is on port 8000
  - lsof -ti:5173 | xargs kill -9   # kill whatever is on port 5173

  Then start normally again.
