import moment from 'moment';

export function timeAgo(datetime: string): string {
  return moment(datetime).fromNow();
}

export function formatDateTime(datetime: string, format: string = "MMMM D, YYYY h:mm A"): string {
  return moment(datetime).format(format);
}
