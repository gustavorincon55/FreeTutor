import { useEffect, useState } from 'react';
import api from '../api';

export default function Calendar() {
    const [sessions, setSessions] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays = [];

    for (let i = 0; i < startingDay; i++) {
        calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthName = currentDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
    });

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

const getSessionsForDay = (day) => {
    if (!day) {
        return [];
    }

    return sessions.filter((session) => {
        const sessionDate = new Date(`${session.day}T00:00:00`);

        return (
            sessionDate.getFullYear() === year &&
            sessionDate.getMonth() === month &&
            sessionDate.getDate() === day
        );
    });
};

return (
    <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
            <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
                Previous
            </button>

            <h2 className="text-2xl font-bold text-gray-900">
                {monthName}
            </h2>

            <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
                Next
            </button>
        </div>

        <div className="grid grid-cols-7 border border-gray-200">
            {weekDays.map((day) => (
                <div
                    key={day}
                    className="bg-gray-100 border border-gray-200 p-3 text-center font-semibold"
                >
                    {day}
                </div>
            ))}

            {calendarDays.map((day, index) => (
                <div
                    key={index}
                    className="min-h-28 border border-gray-200 p-2 bg-white"
                >
                {day && (
                    <>
                        <p className="font-semibold text-gray-700 mb-2">
                            {day}
                        </p>

                        <div className="flex flex-col gap-1">
                            {getSessionsForDay(day).map((session) => (
                                <div
                                    key={session.id}
                                    className="bg-blue-100 rounded p-2 text-xs"
                                >
                                    <p className="font-semibold capitalize">
                                        {session.topic}
                                    </p>

                                    <p>
                                        {session.start_time} - {session.end_time}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                </div>
            ))}
        </div>
    </div>
);
}