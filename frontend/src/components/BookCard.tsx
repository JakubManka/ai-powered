import React from 'react';
import { Book } from '../types/book';
import { Card } from './Card';

interface BookCardProps {
    book: Book;
    onEdit: (book: Book) => void;
    onDelete: (id: string) => void;
    onToggleRead: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
    book,
    onEdit,
    onDelete,
    onToggleRead,
}) => {
    return (
        <Card className="hover:scale-105 transition-transform duration-200">
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-dark-50 flex-1 pr-2">
                        {book.title}
                    </h3>
                    <span
                        className={`${book.isRead ? 'badge-success' : 'badge-warning'
                            } shrink-0`}
                    >
                        {book.isRead ? '✓ Read' : '○ Unread'}
                    </span>
                </div>

                <p className="text-dark-300 mb-2">
                    <span className="text-dark-400">by</span> {book.author}
                </p>

                {book.publishYear && (
                    <p className="text-dark-400 text-sm mb-4">
                        Published: {book.publishYear}
                    </p>
                )}

                <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
                    <button
                        onClick={() => onToggleRead(book)}
                        className="flex-1 btn-secondary text-sm py-2"
                    >
                        {book.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button
                        onClick={() => onEdit(book)}
                        className="btn-secondary text-sm py-2 px-4"
                        title="Edit"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(book.id)}
                        className="btn-danger text-sm py-2 px-4"
                        title="Delete"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </Card>
    );
};
