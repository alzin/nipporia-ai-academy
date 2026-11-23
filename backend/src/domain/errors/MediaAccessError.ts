/** A member tried to write or delete media outside their own community/<userId>/ folder. */
export class MediaAccessError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.name = 'MediaAccessError';
    this.statusCode = statusCode;
  }
}
