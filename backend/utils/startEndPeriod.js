export const getStartAndEndOfPeriod = (periodType, today = new Date()) => {
  const start = new Date(today);
  const end = new Date(today);

  if (periodType === 'week') {
    const day = start.getDay();

    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);

    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (periodType === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { startDate: start, endDate: end };
};
