import dayjs from "dayjs";

export const getDateTimeFormat = (date: string) => {
  if(!date) return 'N/A'
  return dayjs(date).format("MMMM DD, YYYY hh:mm A");
};
export const getDateFormat = (date: string) => {
  return dayjs(date).format("DD MMM YYYY");
};