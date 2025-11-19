import { DataSource } from 'typeorm';
import { Book } from '../books/entities/book.entity';

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [Book],
    migrations: ['src/database/migrations/*.ts'],
    synchronize: false,
    logging: true,
});
