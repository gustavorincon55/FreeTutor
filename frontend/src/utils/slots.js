export function generateHourSlots(timeWindows) {
  const slots = [];
  for (const w of timeWindows) {
    let [h, m] = w.start.split(':').map(Number);
    const [endH, endM] = w.end.split(':').map(Number);
    const endMins = endH * 60 + endM;
    while (h * 60 + m + 60 <= endMins) {
      const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const nextMins = h * 60 + m + 60;
      const end = `${String(Math.floor(nextMins / 60)).padStart(2, '0')}:${String(nextMins % 60).padStart(2, '0')}`;
      slots.push({ day: w.day, start, end });
      h = Math.floor(nextMins / 60);
      m = nextMins % 60;
    }
  }
  return slots;
}
