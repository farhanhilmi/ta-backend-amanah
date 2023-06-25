export const ERROR_STATUS = {
    OK: {
        code: 200,
        message: 'OK',
    },
    BAD_REQUEST: {
        code: 400,
        message: 'Bad Request',
    },
    VALIDATION_ERROR: {
        code: 422,
        message: 'Validation Error',
    },
    WRONG_CREDETENTIALS: {
        code: 401,
        message: 'Invalid Credentials',
    },
    IUNSUFFICIENT_BALANCE: {
        code: 402,
        message: 'Insufficient Balance',
    },
    UN_AUTHORIZED: {
        code: 403,
        message: 'Unauthorized',
    },
    NOT_FOUND: {
        code: 404,
        message: 'Not Found',
    },
    INTERNAL_ERROR: {
        code: 500,
        message: 'Internal Server Error',
    },
    CONFLICT_ERROR: {
        code: 409,
        message: 'Conflict Error',
    },
};

// const throwError = (message, status) => {
//     var err = new Error(message);
//     err.status = status;
//     throw err;
// };

// const validationError = (message) => {
//     var err = new Error(message);
//     err.status = 400;
//     throw err;
// };

export class ErrorHandler extends Error {
    constructor(statusCode, message, status) {
        super();
        this.statusCode = statusCode;
        this.message = message;
        this.status = status;
    }
}

export class RequestError extends ErrorHandler {
    constructor(message = ERROR_STATUS.BAD_REQUEST.message) {
        super(
            ERROR_STATUS.BAD_REQUEST.code,
            message,
            ERROR_STATUS.BAD_REQUEST.message,
        );
    }
}

export class ValidationError extends ErrorHandler {
    constructor(message = ERROR_STATUS.VALIDATION_ERROR.message) {
        super(
            ERROR_STATUS.VALIDATION_ERROR.code,
            message,
            ERROR_STATUS.VALIDATION_ERROR.message,
        );
    }
}

export class CredentialsError extends ErrorHandler {
    constructor(message = ERROR_STATUS.WRONG_CREDETENTIALS.message) {
        super(
            ERROR_STATUS.WRONG_CREDETENTIALS.code,
            message,
            ERROR_STATUS.WRONG_CREDETENTIALS.message,
        );
    }
}

export class AuthorizeError extends ErrorHandler {
    constructor(message = ERROR_STATUS.UN_AUTHORIZED.message) {
        super(
            ERROR_STATUS.UN_AUTHORIZED.code,
            message,
            ERROR_STATUS.UN_AUTHORIZED.message,
        );
    }
}
export class InsufficientError extends ErrorHandler {
    constructor(message = ERROR_STATUS.IUNSUFFICIENT_BALANCE.message) {
        super(
            ERROR_STATUS.IUNSUFFICIENT_BALANCE.code,
            message,
            ERROR_STATUS.IUNSUFFICIENT_BALANCE.message,
        );
    }
}
export class NotFoundError extends ErrorHandler {
    constructor(message = ERROR_STATUS.NOT_FOUND.message) {
        super(
            ERROR_STATUS.NOT_FOUND.code,
            message,
            ERROR_STATUS.NOT_FOUND.message,
        );
    }
}

export class DataConflictError extends ErrorHandler {
    constructor(message = ERROR_STATUS.CONFLICT_ERROR.message) {
        super(
            ERROR_STATUS.CONFLICT_ERROR.code,
            message,
            ERROR_STATUS.CONFLICT_ERROR.message,
        );
    }
}

export class ActiveLoanError extends ErrorHandler {
    constructor(message = 'You have an active loan') {
        super(409, message, 'FAILED');
    }
}

// const jajaa = new NotFoundError('Tidak ditemukan');
// console.log(jajaa);
