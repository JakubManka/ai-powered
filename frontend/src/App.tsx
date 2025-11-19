import { useState } from 'react';
import { Book, CreateBookDto, UpdateBookDto } from './types/book';
import { useBooks } from './hooks/useBooks';
import { useStatistics } from './hooks/useStatistics';
import { Statistics } from './components/Statistics';
import { SearchBar } from './components/SearchBar';
import { BookList } from './components/BookList';
import { BookForm } from './components/BookForm';
import { Modal } from './components/Modal';
import { Button } from './components/Button';

function App() {
    const { books, loading, error, fetchBooks, addBook, updateBook, deleteBook } =
        useBooks();
    const { statistics, loading: statsLoading, refetch: refetchStats } =
        useStatistics();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);

    const handleSearch = (query: string) => {
        fetchBooks(query);
    };

    const handleAddBook = async (data: CreateBookDto) => {
        await addBook(data);
        refetchStats();
    };

    const handleUpdateBook = async (data: CreateBookDto) => {
        if (editingBook) {
            await updateBook(editingBook.id, data as UpdateBookDto);
            refetchStats();
        }
    };

    const handleDeleteBook = async (id: string) => {
        if (confirm('Are you sure you want to delete this book?')) {
            await deleteBook(id);
            refetchStats();
        }
    };

    const handleToggleRead = async (book: Book) => {
        await updateBook(book.id, { isRead: !book.isRead });
        refetchStats();
    };

    const openAddModal = () => {
        setEditingBook(undefined);
        setIsModalOpen(true);
    };

    const openEditModal = (book: Book) => {
        setEditingBook(book);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBook(undefined);
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-12 text-center animate-fade-in">
                    <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-4">
                        📚 Book Library Manager
                    </h1>
                    <p className="text-dark-300 text-lg">
                        Manage your personal book collection with ease
                    </p>
                    <p className="text-dark-500 text-sm mt-2">
                        Created with Claude Sonnet 4.5 and Google Antigravity
                    </p>
                </header>

                {/* Statistics */}
                <Statistics statistics={statistics} loading={statsLoading} />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <SearchBar onSearch={handleSearch} />
                    </div>
                    <Button onClick={openAddModal} className="sm:w-auto">
                        + Add New Book
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="glass-card p-4 mb-6 border-red-500/50 bg-red-500/10">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Book List */}
                <BookList
                    books={books}
                    loading={loading}
                    onEdit={openEditModal}
                    onDelete={handleDeleteBook}
                    onToggleRead={handleToggleRead}
                />

                {/* Add/Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={editingBook ? 'Edit Book' : 'Add New Book'}
                >
                    <BookForm
                        book={editingBook}
                        onSubmit={editingBook ? handleUpdateBook : handleAddBook}
                        onCancel={closeModal}
                    />
                </Modal>
            </div>
        </div>
    );
}

export default App;
