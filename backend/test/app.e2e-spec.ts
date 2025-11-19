import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('BooksController (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        app.setGlobalPrefix('api');

        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);
        await dataSource.synchronize(true); // Clean database
    });

    afterAll(async () => {
        await dataSource.destroy();
        await app.close();
    });

    describe('/api/books (POST)', () => {
        it('should create a new book', () => {
            return request(app.getHttpServer())
                .post('/api/books')
                .send({
                    title: 'The Great Gatsby',
                    author: 'F. Scott Fitzgerald',
                    publishYear: 1925,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body.title).toBe('The Great Gatsby');
                    expect(res.body.author).toBe('F. Scott Fitzgerald');
                    expect(res.body.publishYear).toBe(1925);
                    expect(res.body.isRead).toBe(false);
                });
        });

        it('should fail with invalid data', () => {
            return request(app.getHttpServer())
                .post('/api/books')
                .send({
                    title: '',
                    author: 'Author',
                })
                .expect(400);
        });
    });

    describe('/api/books (GET)', () => {
        it('should return all books', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/books')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should search books by title', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/books?search=Gatsby')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body[0].title).toContain('Gatsby');
        });
    });

    describe('/api/books/statistics (GET)', () => {
        it('should return statistics', () => {
            return request(app.getHttpServer())
                .get('/api/books/statistics')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('total');
                    expect(res.body).toHaveProperty('read');
                    expect(res.body).toHaveProperty('unread');
                });
        });
    });

    describe('/api/books/:id (GET)', () => {
        it('should return a single book', async () => {
            // First create a book
            const createResponse = await request(app.getHttpServer())
                .post('/api/books')
                .send({
                    title: '1984',
                    author: 'George Orwell',
                    publishYear: 1949,
                });

            const bookId = createResponse.body.id;

            return request(app.getHttpServer())
                .get(`/api/books/${bookId}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.id).toBe(bookId);
                    expect(res.body.title).toBe('1984');
                });
        });

        it('should return 404 for non-existent book', () => {
            return request(app.getHttpServer())
                .get('/api/books/non-existent-id')
                .expect(404);
        });
    });

    describe('/api/books/:id (PATCH)', () => {
        it('should update a book', async () => {
            // Create a book first
            const createResponse = await request(app.getHttpServer())
                .post('/api/books')
                .send({
                    title: 'To Kill a Mockingbird',
                    author: 'Harper Lee',
                    publishYear: 1960,
                });

            const bookId = createResponse.body.id;

            return request(app.getHttpServer())
                .patch(`/api/books/${bookId}`)
                .send({ isRead: true })
                .expect(200)
                .expect((res) => {
                    expect(res.body.isRead).toBe(true);
                });
        });
    });

    describe('/api/books/:id (DELETE)', () => {
        it('should delete a book', async () => {
            // Create a book first
            const createResponse = await request(app.getHttpServer())
                .post('/api/books')
                .send({
                    title: 'Book to Delete',
                    author: 'Test Author',
                });

            const bookId = createResponse.body.id;

            await request(app.getHttpServer())
                .delete(`/api/books/${bookId}`)
                .expect(204);

            // Verify it's deleted
            await request(app.getHttpServer())
                .get(`/api/books/${bookId}`)
                .expect(404);
        });
    });
});
