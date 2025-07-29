export function fillSalaryMonths(salaryHistory, year, currentDate = new Date()) {
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const isCurrentYear = currentDate.getFullYear() === year;
  const currentMonthIndex = isCurrentYear ? currentDate.getMonth() : 11;
  const sortedHistory = [...salaryHistory].sort(
    (a, b) => new Date(a.effectiveDate) - new Date(b.effectiveDate)
  );

  let lastSalary = 0;
  const months = [];
  const salaries = [];

  for (let month = 0; month <= currentMonthIndex; month++) {
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    // Find the most recent salary with effectiveDate <= endOfMonth
    const record = [...sortedHistory].reverse().find(
      (r) => new Date(r.effectiveDate) <= endOfMonth
    );
    if (record) lastSalary = record.salary;
    months.push(monthNames[month]);
    salaries.push(lastSalary);
  }

  return { months, salaries };
}