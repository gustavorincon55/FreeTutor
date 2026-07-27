import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const CREATORS = [
  { name: 'Gabriel Cavalcante Causin', github: 'https://github.com/gabrielcalk' },
  { name: 'Gustavo Rincon', github: 'https://github.com/gustavorincon55' },
  { name: 'Benjamin Mason', github: 'https://github.com/BennyM-55' },
];

const STEPS = [
  {
    title: 'Post what you offer or need',
    body: 'Tutors post subjects they can teach; learners post subjects they want help with, along with the times that work for them.',
  },
  {
    title: 'Match by availability',
    body: 'FreeTutor lines up tutor and learner availability automatically, so you only see requests and offers that actually fit your schedule.',
  },
  {
    title: 'Confirm and meet',
    body: 'Once both sides confirm a session, you get a shared meeting link and notes space, plus a calendar view of everything upcoming.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    api.get('/api/profile/')
      .then(() => navigate('/feed', { replace: true }))
      .catch(() => setCheckingAuth(false));
  }, [navigate]);

  if (checkingAuth) return null;

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="max-w-5xl mx-auto flex items-center justify-between px-6 py-6">
        <span className="text-xl font-bold text-blue-600">FreeTutor</span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-blue-600 font-semibold text-sm no-underline px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm no-underline rounded-lg px-4 py-2 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="text-center py-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free tutoring, matched to your schedule.
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            FreeTutor connects people who want to teach with people who want to learn — no cost,
            no middleman. Set your availability, post what you can offer or what you need, and get
            matched with someone whose schedule lines up with yours.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-700 hover:bg-blue-600 text-white font-semibold no-underline rounded-lg px-6 py-3 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-blue-200 text-blue-700 font-semibold no-underline rounded-lg px-6 py-3 hover:bg-blue-100 transition-colors"
            >
              Log In
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16">
          {STEPS.map((step) => (
            <div key={step.title} className="bg-white rounded-2xl border border-blue-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 m-0">{step.body}</p>
            </div>
          ))}
        </section>

        <section className="pb-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Built by</h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {CREATORS.map((creator) => (
              <a
                key={creator.name}
                href={creator.github}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-blue-100 rounded-full px-4 py-2 text-sm font-medium text-gray-700 no-underline hover:border-blue-400 hover:text-blue-700 transition-colors"
              >
                {creator.name}
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
