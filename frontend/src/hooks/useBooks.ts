import { useState, useEffect, useCallback } from 'react';
import { Book, CreateBookDto, UpdateBookDto } from '../types/book';
import { bookService } from '../services/bookService';

export const useBooks = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBooks = useCallback(async (search?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await bookService.getAll(search);
            setBooks(data);
        } catch (err) {
            setError('Failed to fetch books');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const addBook = async (data: CreateBookDto) => {
        setError(null);
        try {
            const newBook = await bookService.create(data);
            setBooks((prev) => [newBook, ...prev]);
            return newBook;
        } catch (err) {
            setError('Failed to add book');
            console.error(err);
            throw err;
        }
    };

    const updateBook = async (id: string, data: UpdateBookDto) => {
        setError(null);
        try {
            const updatedBook = await bookService.update(id, data);
            setBooks((prev) =>
                prev.map((book) => (book.id === id ? updatedBook : book))
            );
            return updatedBook;
        } catch (err) {
            setError('Failed to update book');
            console.error(err);
            throw err;
        }
    };

    const deleteBook = async (id: string) => {
        setError(null);
        try {
            await bookService.delete(id);
            setBooks((prev) => prev.filter((book) => book.id !== id));
        } catch (err) {
            setError('Failed to delete book');
            console.error(err);
            throw err;
        }
    };

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    return {
        books,
        loading,
        error,
        fetchBooks,
        addBook,
        updateBook,
        deleteBook,
    };
};
