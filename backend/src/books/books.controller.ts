import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
    constructor(private readonly booksService: BooksService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() createBookDto: CreateBookDto) {
        return this.booksService.create(createBookDto);
    }

    @Get()
    findAll(@Query('search') search?: string) {
        return this.booksService.findAll(search);
    }

    @Get('statistics')
    getStatistics() {
        return this.booksService.getStatistics();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.booksService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
        return this.booksService.update(id, updateBookDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.booksService.remove(id);
    }
}
