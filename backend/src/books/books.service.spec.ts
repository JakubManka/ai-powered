import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('BooksService', () => {
    let service: BooksService;
    let repository: Repository<Book>;

    const mockBook: Book = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Book',
        author: 'Test Author',
        publishYear: 2023,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        count: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BooksService,
                {
                    provide: getRepositoryToken(Book),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<BooksService>(BooksService);
        repository = module.get<Repository<Book>>(getRepositoryToken(Book));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new book', async () => {
            const createBookDto = {
                title: 'Test Book',
                author: 'Test Author',
                publishYear: 2023,
            };

            mockRepository.create.mockReturnValue(mockBook);
            mockRepository.save.mockResolvedValue(mockBook);

            const result = await service.create(createBookDto);

            expect(repository.create).toHaveBeenCalledWith(createBookDto);
            expect(repository.save).toHaveBeenCalledWith(mockBook);
            expect(result).toEqual(mockBook);
        });
    });

    describe('findAll', () => {
        it('should return all books', async () => {
            const books = [mockBook];
            mockRepository.find.mockResolvedValue(books);

            const result = await service.findAll();

            expect(repository.find).toHaveBeenCalledWith({
                order: { createdAt: 'DESC' },
            });
            expect(result).toEqual(books);
        });

        it('should return filtered books when search query is provided', async () => {
            const books = [mockBook];
            mockRepository.find.mockResolvedValue(books);

            const result = await service.findAll('Test');

            expect(repository.find).toHaveBeenCalled();
            expect(result).toEqual(books);
        });
    });

    describe('findOne', () => {
        it('should return a book by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockBook);

            const result = await service.findOne(mockBook.id);

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { id: mockBook.id },
            });
            expect(result).toEqual(mockBook);
        });

        it('should throw NotFoundException when book not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('non-existent-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should update a book', async () => {
            const updateBookDto = { title: 'Updated Title' };
            const updatedBook = { ...mockBook, ...updateBookDto };

            mockRepository.findOne.mockResolvedValue(mockBook);
            mockRepository.save.mockResolvedValue(updatedBook);

            const result = await service.update(mockBook.id, updateBookDto);

            expect(repository.save).toHaveBeenCalled();
            expect(result.title).toEqual(updateBookDto.title);
        });
    });

    describe('remove', () => {
        it('should remove a book', async () => {
            mockRepository.findOne.mockResolvedValue(mockBook);
            mockRepository.remove.mockResolvedValue(mockBook);

            await service.remove(mockBook.id);

            expect(repository.remove).toHaveBeenCalledWith(mockBook);
        });
    });

    describe('getStatistics', () => {
        it('should return reading statistics', async () => {
            mockRepository.count.mockResolvedValueOnce(10); // total
            mockRepository.count.mockResolvedValueOnce(6); // read

            const result = await service.getStatistics();

            expect(result).toEqual({
                total: 10,
                read: 6,
                unread: 4,
            });
        });
    });
});
