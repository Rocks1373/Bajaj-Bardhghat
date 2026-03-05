import {
    IsString, IsEnum, IsNumber, IsOptional,
    IsArray, IsBoolean, IsObject, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductImageDto {
    @IsString()
    url: string;

    @IsOptional()
    @IsString()
    alt?: string;
}

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsEnum(['BIKE', 'SCOOTER'])
    category: 'BIKE' | 'SCOOTER';

    @IsString()
    modelFamily: string;

    @IsNumber()
    @Min(0)
    cc: number;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsNumber()
    discountedPrice?: number;

    @IsString()
    description: string;

    @IsArray()
    @IsString({ each: true })
    keyFeatures: string[];

    @IsOptional()
    @IsObject()
    specs?: Record<string, any>;

    @IsOptional()
    @IsEnum(['IN_STOCK', 'PRE_ORDER', 'OUT_OF_STOCK'])
    availability?: 'IN_STOCK' | 'PRE_ORDER' | 'OUT_OF_STOCK';

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsNumber()
    emiStarting?: number;

    @IsOptional()
    @IsNumber()
    year?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageDto)
    images?: ProductImageDto[];

    @IsOptional()
    @IsString()
    model3dUrl?: string;
}
