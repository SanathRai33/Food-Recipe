class ApiResponse {
    constructor(success, message, data = null, errors = null) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errors = errors;
        this.timestamp = new Date().toISOString();
    }

    static success(message, data = null) {
        return new ApiResponse(true, message, data);
    }

    static error(message, errors = null, statusCode = 400) {
        const response = new ApiResponse(false, message, null, errors);
        response.statusCode = statusCode;
        return response;
    }

    static paginated(message, data, pagination) {
        const response = new ApiResponse(true, message, data);
        response.pagination = pagination;
        return response;
    }
}

const sendResponse = (res, response) => {
    const statusCode = response.statusCode || (response.success ? 200 : 400);
    return res.status(statusCode).json(response);
};

module.exports = {
    ApiResponse,
    sendResponse
};