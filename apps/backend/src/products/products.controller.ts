import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('products')
export class ProductsController {
    constructor(private productsService: ProductsService) { }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('modelFamily') modelFamily?: string,
        @Query('availability') availability?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('cc') cc?: string,
        @Query('sort') sort?: string,
        @Query('year') year?: string,
    ) {
        return this.productsService.findAll({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            search,
            category,
            modelFamily,
            availability,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            cc,
            sort,
            year: year ? parseInt(year) : undefined,
        });
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.productsService.findBySlug(slug);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    create(@Body() dto: CreateProductDto) {
        return this.productsService.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.productsService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    remove(@Param('id') id: string) {
        return this.productsService.remove(id);
    }
}
