export interface Role {
    type: string;
    name: string;
}
export interface User {
    id: number;
    documentId: string;
    username: string;
    email?: string;
    role?: Role;
    firstName?: string;
    fullName?: string;
    lastName?: string;
    createdAt: string;
    profilePicture: StrapiMedia;
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
    documentId: string;
    username: string;
    email: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    fullName?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | undefined;
    profilePicture?: StrapiMedia;
    createdAt: string;
    publishedAt?: string;

    role?:
        | {
              id: number;
              name: string;
              type: string;
          }
        | string;
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
