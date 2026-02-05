export interface User {
    id: string | number;
    username: string;
    email?: string;
    role?: string;
}

export interface Login {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    jwt: string;
}

export interface Student {
    id: number;
    documentId?: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    diagnosis?: string;
    createdAt: string;
    publishedAt?: string;
    role?: {
        id: number;
        name: string;
        type: string;
    };
}
