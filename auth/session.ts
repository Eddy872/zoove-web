import type { AuthSession } from "@/types/auth";

const SESSION_KEY = "zooveSession";

export function saveAuthSession(
    session: AuthSession
): void {
    if (typeof window === "undefined") {
        return;
    }

    sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session)
    );

    sessionStorage.removeItem("animal");
}

export function getAuthSession(): AuthSession | null {
    if (typeof window === "undefined") {
        return null;
    }

    const storedSession =
        sessionStorage.getItem(SESSION_KEY);

    if (!storedSession) {
        return null;
    }

    try {
        return JSON.parse(storedSession) as AuthSession;
    } catch {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export function clearAuthSession(): void {
    if (typeof window === "undefined") {
        return;
    }

    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("animal");
}
