const ERROR_CODES_BY_STATUS = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    429: "RATE_LIMITED",
};

function sendApiError(res, status, message, code, extra = {}) {
    const errorCode = code || ERROR_CODES_BY_STATUS[status] || "INTERNAL_SERVER_ERROR";

    return res.status(status).json({
        success: false,
        message,
        error: {
            code: errorCode,
            message,
        },
        ...extra,
    });
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const isUploadError = error.name === "MulterError";
    const status = error.code === "LIMIT_FILE_SIZE" || error.type === "entity.too.large"
        ? 413
        : isUploadError
            ? 400
        : Number.isInteger(error.status) && error.status >= 400 && error.status < 600
            ? error.status
            : 500;
    const message = error.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the 20 MB limit."
        : error.type === "entity.too.large"
            ? "Request body is too large."
        : isUploadError
            ? "The uploaded file could not be processed."
        : error.type === "entity.parse.failed"
            ? "Request body contains invalid JSON."
            : status < 500
                ? error.message || "The request could not be processed."
                : "An internal server error occurred.";

    if (status >= 500) {
        console.error("Unhandled request error:", error);
    }

    const code = status === 500
        ? "INTERNAL_SERVER_ERROR"
        : status === 413
            ? "PAYLOAD_TOO_LARGE"
            : error.code === "UNSUPPORTED_MEDIA_TYPE"
                ? "UNSUPPORTED_MEDIA_TYPE"
            : isUploadError
                ? "UPLOAD_INVALID"
                : undefined;

    return sendApiError(res, status, message, code);
}

module.exports = {
    sendApiError,
    errorHandler,
};
