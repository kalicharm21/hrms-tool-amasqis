import { DateTime } from 'luxon';

export const getStartOfDayInTimeZone = (date, timeZone) => {
  return DateTime.fromJSDate(date, { zone: 'utc' })
    .setZone(timeZone)
    .startOf('day')
    .toJSDate();
};
