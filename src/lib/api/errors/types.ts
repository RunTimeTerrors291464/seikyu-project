export type ApiErrorBody = {
  status: number;
  errorCode: number;
  message: string;
  errorDetails: unknown;
};

export type DtoFieldErrorMessage = {
  errorCode: number;
  errorMessage: string;
};

export type DtoValidationDetail = {
  errorObject: string;
  errorMessages: DtoFieldErrorMessage[];
};
