import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBooks } from '../hooks/useBooks';
import { bookService } from '../services/bookService';

vi.mock('../services/bookService');

describe('useBooks', () => {
    const mockBooks = [
        {
            id: '1',
            title: 'Test Book',
            author: 'Test Author',
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches books on mount', async () => {
        vi.mocked(bookService.getAll).mockResolvedValue(mockBooks);

        const { result } = renderHook(() => useBooks());

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.books).toEqual(mockBooks);
        expect(bookService.getAll).toHaveBeenCalled();
    });

    it('adds a new book', async () => {
        const newBook = { ...mockBooks[0], id: '2', title: 'New Book' };
        vi.mocked(bookService.getAll).mockResolvedValue(mockBooks);
        vi.mocked(bookService.create).mockResolvedValue(newBook);

        const { result } = renderHook(() => useBooks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await result.current.addBook({
            title: 'New Book',
            author: 'Test Author',
        });

        expect(bookService.create).toHaveBeenCalled();
    });

    it('handles fetch error', async () => {
        vi.mocked(bookService.getAll).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useBooks());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Failed to fetch books');
    });
});
