import React, { useState, useEffect } from 'react';
import { Book, CreateBookDto } from '../types/book';
import { Input } from './Input';
import { Button } from './Button';

interface BookFormProps {
    book?: Book;
    onSubmit: (data: CreateBookDto) => Promise<void>;
    onCancel: () => void;
}

export const BookForm: React.FC<BookFormProps> = ({
    book,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState<CreateBookDto>({
        title: '',
        author: '',
        publishYear: undefined,
        isRead: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (book) {
            setFormData({
                title: book.title,
                author: book.author,
                publishYear: book.publishYear,
                isRead: book.isRead,
            });
        }
    }, [book]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.author.trim()) {
            newErrors.author = 'Author is required';
        }

        if (
            formData.publishYear &&
            (formData.publishYear < 0 || formData.publishYear > new Date().getFullYear())
        ) {
            newErrors.publishYear = 'Invalid year';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setSubmitting(true);
        try {
            await onSubmit(formData);
            onCancel();
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
                placeholder="Enter book title"
            />

            <Input
                label="Author *"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                error={errors.author}
                placeholder="Enter author name"
            />

            <Input
                label="Publish Year"
                type="number"
                value={formData.publishYear || ''}
                onChange={(e) =>
                    setFormData({
                        ...formData,
                        publishYear: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                }
                error={errors.publishYear}
                placeholder="e.g., 2023"
            />

            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="isRead"
                    checked={formData.isRead}
                    onChange={(e) =>
                        setFormData({ ...formData, isRead: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary-500 
                     focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 
                     transition-colors cursor-pointer"
                />
                <label htmlFor="isRead" className="text-dark-200 cursor-pointer">
                    I've already read this book
                </label>
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
};
