import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookList } from '../components/BookList';
import { Book } from '../types/book';

describe('BookList', () => {
    const mockBooks: Book[] = [
        {
            id: '1',
            title: 'Test Book 1',
            author: 'Author 1',
            publishYear: 2023,
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            id: '2',
            title: 'Test Book 2',
            author: 'Author 2',
            isRead: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    const mockHandlers = {
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onToggleRead: vi.fn(),
    };

    it('renders loading state', () => {
        render(<BookList books={[]} loading={true} {...mockHandlers} />);
        expect(screen.getAllByRole('generic').length).toBeGreaterThan(0);
    });

    it('renders empty state when no books', () => {
        render(<BookList books={[]} loading={false} {...mockHandlers} />);
        expect(screen.getByText(/no books found/i)).toBeInTheDocument();
    });

    it('renders book list', () => {
        render(<BookList books={mockBooks} loading={false} {...mockHandlers} />);
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        expect(screen.getByText('Test Book 2')).toBeInTheDocument();
    });

    it('calls onDelete when delete button clicked', async () => {
        render(<BookList books={mockBooks} loading={false} {...mockHandlers} />);
        const deleteButtons = screen.getAllByTitle('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
        });
    });

    it('calls onEdit when edit button clicked', async () => {
        render(<BookList books={mockBooks} loading={false} {...mockHandlers} />);
        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockBooks[0]);
        });
    });

    it('calls onToggleRead when toggle button clicked', async () => {
        render(<BookList books={mockBooks} loading={false} {...mockHandlers} />);
        const toggleButtons = screen.getAllByText(/mark read/i);
        fireEvent.click(toggleButtons[0]);

        await waitFor(() => {
            expect(mockHandlers.onToggleRead).toHaveBeenCalledWith(mockBooks[0]);
        });
    });
});
