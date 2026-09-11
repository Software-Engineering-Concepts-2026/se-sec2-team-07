export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const notFound = () => new HttpError(404, 'ไม่พบข้อมูล');
