import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookForm } from '../components/BookForm';
import { Book } from '../types/book';

describe('BookForm', () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockOnCancel = vi.fn();

    const mockBook: Book = {
        id: '1',
        title: 'Existing Book',
        author: 'Existing Author',
        publishYear: 2020,
        isRead: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty form for new book', () => {
        render(<BookForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

        expect(screen.getByPlaceholderText(/enter book title/i)).toHaveValue('');
        expect(screen.getByPlaceholderText(/enter author name/i)).toHaveValue('');
        expect(screen.getByText(/add book/i)).toBeInTheDocument();
    });

    it('renders form with book data for editing', () => {
        render(
            <BookForm
                book={mockBook}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />
        );

        expect(screen.getByDisplayValue('Existing Book')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Author')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2020')).toBeInTheDocument();
        expect(screen.getByText(/update book/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
        render(<BookForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

        const submitButton = screen.getByText(/add book/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/title is required/i)).toBeInTheDocument();
            expect(screen.getByText(/author is required/i)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
        render(<BookForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

        const titleInput = screen.getByPlaceholderText(/enter book title/i);
        const authorInput = screen.getByPlaceholderText(/enter author name/i);
        const submitButton = screen.getByText(/add book/i);

        fireEvent.change(titleInput, { target: { value: 'New Book' } });
        fireEvent.change(authorInput, { target: { value: 'New Author' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                title: 'New Book',
                author: 'New Author',
                publishYear: undefined,
                isRead: false,
            });
        });
    });

    it('calls onCancel when cancel button clicked', () => {
        render(<BookForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

        const cancelButton = screen.getByText(/cancel/i);
        fireEvent.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalled();
    });
});
