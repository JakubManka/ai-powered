import axios from 'axios';
import { Book, CreateBookDto, UpdateBookDto, Statistics } from '../types/book';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const bookService = {
    async getAll(search?: string): Promise<Book[]> {
        const params = search ? { search } : {};
        const response = await api.get<Book[]>('/books', { params });
        return response.data;
    },

    async getOne(id: string): Promise<Book> {
        const response = await api.get<Book>(`/books/${id}`);
        return response.data;
    },

    async create(data: CreateBookDto): Promise<Book> {
        const response = await api.post<Book>('/books', data);
        return response.data;
    },

    async update(id: string, data: UpdateBookDto): Promise<Book> {
        const response = await api.patch<Book>(`/books/${id}`, data);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/books/${id}`);
    },

    async getStatistics(): Promise<Statistics> {
        const response = await api.get<Statistics>('/books/statistics');
        return response.data;
    },
};
