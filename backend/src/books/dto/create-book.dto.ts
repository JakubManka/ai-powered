import { IsString, IsNumber, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateBookDto {
    @IsString()
    @MinLength(1, { message: 'Title cannot be empty' })
    title: string;

    @IsString()
    @MinLength(1, { message: 'Author cannot be empty' })
    author: string;

    @IsOptional()
    @IsNumber()
    publishYear?: number;

    @IsOptional()
    @IsBoolean()
    isRead?: boolean;
}
