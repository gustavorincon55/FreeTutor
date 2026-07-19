import { useEffect, useState } from 'react';
import api from '../api';

export default function Calendar() {
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        api.get('/api/sessions/')
        .then((response) => {
            const confirmedSessions = response.data.filter(
                (session) => session.status === 'confirmed'
            );

            setSessions(confirmedSessions);
        })
        .catch(() => {
            setSessions([]);
        });
}, []);

return (
    <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h2>
        {sessions.length === 0 && (
            <p className="text-sm text-gray-400">No confirmed sessions yet.</p>
        )}

        <div className="flex flex-col gap-3">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className="bg-white border border-blue-100 rounded-xl p-4"
                >
                    <p className="font-semibold capitalize">{session.topic}</p>
                    <p className="text-sm text-gray-500">
                        {session.day} ·  {session.start_time}-{session.end_time}
                    </p>
                    <p className="text-sm text-gray-500">
                        Tutor: {session.tutor?.username || 'None'}
                    </p>
                    <p className="text-sm text-gray-500">
                        Learner: {session.learner.username}
                    </p>
                    <p className="text-sm text-gray-500">
                        Meeting link: {' '}
                        {session.meeting_link ? (
                            <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                            >
                                Open meeting
                            </a>
                        ) : (
                            'No link added'
                        )}
                    </p>
                    <p className="text-sm text-gray-500">
                        Notes: {session.notes || 'No notes added'}
                    </p>
                </div>
            ))}
        </div>
    </div>
);
}