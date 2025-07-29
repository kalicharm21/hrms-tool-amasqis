export function getWorkingDays(year) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const startDate = new Date(`${year}-01-01`);
  const endDate = year === currentYear
    ? today
    : new Date(`${year}-12-31`);

  let count = 0;
  let current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay(); 
    if (day !== 0 && day !== 6) {
      count++; 
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}