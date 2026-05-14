export class InvalidTimeRangeError extends Error {
  constructor(message = "startTime must be before endTime") {
    super(message);
    this.name = "InvalidTimeRangeError";
  }
}
