export function getErrorMessage(error, fallback) {
    const responseMessage = error?.response?.data?.error?.message
        || error?.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
        return responseMessage;
    }

    if (error?.isAxiosError && !error.response) {
        return "Unable to reach the server. Check your connection and try again.";
    }

    if (!error?.isAxiosError && typeof error?.message === "string" && error.message.trim()) {
        return error.message;
    }

    return fallback;
}
