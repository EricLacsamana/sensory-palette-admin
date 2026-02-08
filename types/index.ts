export interface User {
    id: number;
    username: string;
    email?: string;
    role?: string;
    firstName?: string;
    fullName?: string;
    lastName?: string;
    createdAt: string;
}

export interface Login {
    identifier: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    jwt: string;
}

export interface UserResponse {
    id: number;
    documentId?: string;
    username: string;
    email: string;
    firstName?: string;
    fullName?: string;
    lastName?: string;
    createdAt: string;
    publishedAt?: string;
    role?: {
        id: number;
        name: string;
        type: string;
    };
}
// types/strapi.ts

export interface StrapiImageFormat {
    url: string;
    width: number;
    height: number;
    size: number;
    hash: string;
    ext: string;
    mime: string;
    path: string | null;
}

export interface StrapiMedia {
    id: number;
    url: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
    formats?: {
        thumbnail?: StrapiImageFormat;
        small?: StrapiImageFormat;
        medium?: StrapiImageFormat;
        large?: StrapiImageFormat;
    };
}

export interface StrapiResponse<T> {
    data:
        | {
              id: number;
              attributes: T;
          }
        | T;
}
