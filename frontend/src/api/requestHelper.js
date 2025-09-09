function buildRequest(init) {
    const headers = new Headers(init?.headers);
    let body;
    if (init?.json !== undefined) {
        headers.set('Content-Type', 'application/json');
        body = JSON.stringify(init.json);
    }
    else if (init?.form) {
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
        const params = new URLSearchParams();
        Object.entries(init.form).forEach(([k, v]) => params.append(k, v));
        body = params.toString();
    }
    return { ...init, headers, body };
}
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';
// Create a custom API error with detailed information
function createApiError(status, message, details) {
    const error = new Error(message);
    error.status = status;
    error.details = details;
    // Categorize errors
    if (status === 401 || status === 403) {
        error.category = 'auth';
    }
    else if (status === 404) {
        error.category = 'not_found';
    }
    else if (status === 409) {
        error.category = 'conflict';
    }
    else if (status >= 400 && status < 500) {
        error.category = 'validation';
    }
    else if (status >= 500) {
        error.category = 'server';
    }
    else {
        error.category = 'network';
    }
    return error;
}
// Enhanced error message handling
function getSpecificErrorMessage(status, responseText, path) {
    // Common specific error patterns
    if (responseText.includes('Student ID already exists')) {
        return 'This Student ID is already in use. Please choose a different ID.';
    }
    if (responseText.includes('Email already registered')) {
        return 'This email address is already registered. Please use a different email.';
    }
    if (responseText.includes('Invalid enrollment period')) {
        return 'The enrollment period has ended. Please contact administration for assistance.';
    }
    if (responseText.includes('Classroom capacity exceeded')) {
        return 'This classroom has reached its maximum capacity. Please choose a different classroom.';
    }
    if (responseText.includes('Insufficient permissions')) {
        return 'You do not have permission to perform this action. Please contact your administrator.';
    }
    // Generic error messages based on status
    switch (status) {
        case 400:
            return responseText || 'Invalid request. Please check your input and try again.';
        case 401:
            return 'Your session has expired. Please log in again.';
        case 403:
            return 'You do not have permission to access this resource.';
        case 404:
            if (path.includes('/students/'))
                return 'Student not found.';
            if (path.includes('/classrooms/'))
                return 'Classroom not found.';
            if (path.includes('/academic-years/'))
                return 'Academic year not found.';
            return 'The requested resource was not found.';
        case 409:
            return 'This operation conflicts with existing data. Please refresh and try again.';
        case 422:
            return responseText || 'The submitted data is invalid. Please check your input.';
        case 500:
            return 'A server error occurred. Please try again later or contact support.';
        case 503:
            return 'The service is temporarily unavailable. Please try again later.';
        default:
            return responseText || `Request failed with status ${status}`;
    }
}
export async function apiFetch(path, init) {
    const token = localStorage.getItem('token');
    const headers = new Headers(init?.headers);
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    try {
        const res = await fetch(`${BASE}${path}`, buildRequest({ ...init, headers }));
        if (res.status === 401) {
            localStorage.removeItem('token');
            // bubble up for UI to redirect to /login
        }
        if (!res.ok) {
            const responseText = await res.text().catch(() => '');
            let errorDetails;
            try {
                errorDetails = JSON.parse(responseText);
            }
            catch {
                // Response is not JSON, use as plain text
            }
            const specificMessage = getSpecificErrorMessage(res.status, responseText, path);
            throw createApiError(res.status, specificMessage, errorDetails);
        }
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? (await res.json()) : undefined;
    }
    catch (error) {
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            const networkError = createApiError(0, 'Network connection failed. Please check your internet connection and try again.');
            networkError.category = 'network';
            throw networkError;
        }
        // Re-throw API errors as-is
        if (error && typeof error === 'object' && 'status' in error) {
            throw error;
        }
        // Handle other unexpected errors
        const unexpectedError = createApiError(0, 'An unexpected error occurred. Please try again.');
        unexpectedError.category = 'network';
        throw unexpectedError;
    }
}
export const request = apiFetch; // alias for compatibility
