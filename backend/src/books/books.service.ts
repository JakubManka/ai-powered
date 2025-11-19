import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
    constructor(
        @InjectRepository(Book)
        private readonly bookRepository: Repository<Book>,
    ) { }

    async create(createBookDto: CreateBookDto): Promise<Book> {
        const book = this.bookRepository.create(createBookDto);
        return await this.bookRepository.save(book);
    }

    async findAll(search?: string): Promise<Book[]> {
        if (search) {
            return await this.bookRepository.find({
                where: [
                    { title: Like(`%${search}%`) },
                    { author: Like(`%${search}%`) },
                ],
                order: { createdAt: 'DESC' },
            });
        }
        return await this.bookRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Book> {
        const book = await this.bookRepository.findOne({ where: { id } });
        if (!book) {
            throw new NotFoundException(`Book with ID ${id} not found`);
        }
        return book;
    }

    async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
        const book = await this.findOne(id);
        Object.assign(book, updateBookDto);
        return await this.bookRepository.save(book);
    }

    async remove(id: string): Promise<void> {
        const book = await this.findOne(id);
        await this.bookRepository.remove(book);
    }

    async getStatistics(): Promise<{
        total: number;
        read: number;
        unread: number;
    }> {
        const total = await this.bookRepository.count();
        const read = await this.bookRepository.count({ where: { isRead: true } });
        const unread = total - read;

        return { total, read, unread };
    }
}
