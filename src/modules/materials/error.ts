export class CannotDeleteLevelError extends Error {
  constructor(
    message = "Cannot delete level. Levels must be deleted in reverse sequential order.",
  ) {
    super(message);
    this.name = "CannotDeleteLevelError";
  }
}
