import React from 'react';
import { Book } from '../types/book';
import { BookCard } from './BookCard';

interface BookListProps {
    books: Book[];
    loading: boolean;
    onEdit: (book: Book) => void;
    onDelete: (id: string) => void;
    onToggleRead: (book: Book) => void;
}

export const BookList: React.FC<BookListProps> = ({
    books,
    loading,
    onEdit,
    onDelete,
    onToggleRead,
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="glass-card p-6 animate-pulse">
                        <div className="h-6 bg-white/10 rounded w-3/4 mb-3" />
                        <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-white/10 rounded w-1/3 mb-4" />
                        <div className="h-10 bg-white/10 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-dark-300 mb-2">
                    No books found
                </h3>
                <p className="text-dark-400">
                    Start building your library by adding your first book!
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
                <BookCard
                    key={book.id}
                    book={book}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleRead={onToggleRead}
                />
            ))}
        </div>
    );
};
