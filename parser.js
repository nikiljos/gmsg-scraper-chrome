// Parser functions module
const parseDateString = (dateRaw) => {
  const text = dateRaw.trim();
  const now = new Date();

  // Case 1: Full date with month/day, optional year
  const fullDateMatch = text.match(
    /^(?:[A-Za-z]+, )?([A-Za-z]{3,9}) (\d{1,2})(?:, (\d{4}))? · (\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );
  if (fullDateMatch) {
    const [, mon, day, year, hh, mm, ampm] = fullDateMatch;
    const months = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const monthIdx = months[mon];
    if (monthIdx === undefined) return null;

    let hours = parseInt(hh, 10) % 12;
    if (ampm.toUpperCase() === "PM") hours += 12;

    return new Date(
      year ? parseInt(year, 10) : now.getFullYear(),
      monthIdx,
      parseInt(day, 10),
      hours,
      parseInt(mm, 10)
    );
  }

  // Case 2: Day name + time (no month/day) → most recent past occurrence
  const weekdayMatch = text.match(
    /^([A-Za-z]+) · (\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );
  if (weekdayMatch) {
    const [, weekday, hh, mm, ampm] = weekdayMatch;
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const targetDow = weekdays.findIndex((d) => d.startsWith(weekday));
    if (targetDow < 0) return null;

    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const diff = (d.getDay() - targetDow + 7) % 7;
    d.setDate(d.getDate() - diff);

    let hours = parseInt(hh, 10) % 12;
    if (ampm.toUpperCase() === "PM") hours += 12;
    d.setHours(hours, parseInt(mm, 10));
    return d;
  }

  // Case 3: Time only → assume today
  const timeMatch = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (timeMatch) {
    const [, hh, mm, ampm] = timeMatch;
    const d = new Date(now);
    let hours = parseInt(hh, 10) % 12;
    if (ampm.toUpperCase() === "PM") hours += 12;
    d.setHours(hours, parseInt(mm, 10), 0, 0);
    return d;
  }

  return null;
};

const parseMessages = (arr) => {
  const groups = [];
  let current = null;
  const MAX_DATE_LENGTH = 50; // extended for long month names

  arr.forEach((item) => {
    const text = item.trim();

    const looksLikeDate =
      text.length <= MAX_DATE_LENGTH &&
      text.includes(":") &&
      /(AM|PM)/i.test(text);

    if (looksLikeDate) {
      if (current) groups.push(current);

      current = {
        dateRaw: text,
        date: parseDateString(text),
        messages: [],
      };
    } else if (current) {
      current.messages.push(text);
    }
  });

  if (current) groups.push(current);

  return groups;
};
