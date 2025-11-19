export interface Book {
    id: string;
    title: string;
    author: string;
    publishYear?: number;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBookDto {
    title: string;
    author: string;
    publishYear?: number;
    isRead?: boolean;
}

export interface UpdateBookDto {
    title?: string;
    author?: string;
    publishYear?: number;
    isRead?: boolean;
}

export interface Statistics {
    total: number;
    read: number;
    unread: number;
}
