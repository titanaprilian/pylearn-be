export class InvalidTimeRangeError extends Error {
  constructor(message: string = "Start time must be before end time") {
    super(message);
    this.name = "InvalidTimeRangeError";
  }
}

export class CannotDeleteQuestionError extends Error {
  constructor(
    message: string = "Cannot delete question. Questions must be deleted in reverse sequential order.",
  ) {
    super(message);
    this.name = "CannotDeleteQuestionError";
  }
}

export class QuizAttemptValidationError extends Error {
  public code = 400;

  constructor(message: string) {
    super(message);
    this.name = "QuizAttemptValidationError";
  }
}

export class QuizAttemptContextException extends Error {
  public code = 403; // Forbidden to answer closed/wrong student attempts

  constructor(message: string) {
    super(message);
    this.name = "QuizAttemptContextException";
  }
}
