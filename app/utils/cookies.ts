/**
 * Cookie utility functions for managing client-side cookies
 */

export const cookieUtils = {
    /**
     * Set a cookie with specified name, value, and expiration days
     */
    set: (name: string, value: string, days: number = 30): void => {
        if (typeof window === 'undefined') return;

        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

        document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
    },

    /**
     * Get a cookie value by name
     */
    get: (name: string): string | null => {
        if (typeof window === 'undefined') return null;

        const nameEQ = `${name}=`;
        const cookies = document.cookie.split(';');

        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(nameEQ) === 0) {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            }
        }

        return null;
    },

    /**
     * Delete a cookie by name
     */
    delete: (name: string): void => {
        if (typeof window === 'undefined') return;

        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    },

    /**
     * Check if a cookie exists
     */
    exists: (name: string): boolean => {
        return cookieUtils.get(name) !== null;
    }
};

// Cookie names constants
export const COOKIE_NAMES = {
    GEMINI_API_KEY: 'gemini_api_key',
    REPLICATE_API_KEY: 'replicate_api_key',
} as const;
