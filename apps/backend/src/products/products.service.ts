import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        modelFamily?: string;
        availability?: string;
        minPrice?: number;
        maxPrice?: number;
        cc?: string;
        sort?: string;
        year?: number;
    }) {
        const page = query.page || 1;
        const limit = query.limit || 12;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = { isDeleted: false };

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { modelFamily: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        if (query.category) {
            where.category = query.category as any;
        }

        if (query.modelFamily) {
            where.modelFamily = { in: query.modelFamily.split(',') };
        }

        if (query.availability) {
            where.availability = query.availability as any;
        }

        if (query.minPrice || query.maxPrice) {
            where.price = {};
            if (query.minPrice) where.price.gte = query.minPrice;
            if (query.maxPrice) where.price.lte = query.maxPrice;
        }

        if (query.cc) {
            where.cc = { in: query.cc.split(',').map(Number) };
        }

        if (query.year) {
            where.year = query.year;
        }

        let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
        if (query.sort === 'price_asc') orderBy = { price: 'asc' };
        else if (query.sort === 'price_desc') orderBy = { price: 'desc' };
        else if (query.sort === 'newest') orderBy = { createdAt: 'desc' };

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { images: { orderBy: { order: 'asc' } } },
                skip,
                take: limit,
                orderBy,
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const product = await this.prisma.product.findFirst({
            where: { id, isDeleted: false },
            include: { images: { orderBy: { order: 'asc' } } },
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findFirst({
            where: { slug, isDeleted: false },
            include: { images: { orderBy: { order: 'asc' } } },
        });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }

    async create(dto: CreateProductDto) {
        const { images, ...productData } = dto;
        return this.prisma.product.create({
            data: {
                ...productData,
                images: images?.length
                    ? {
                        create: images.map((img, i) => ({
                            url: img.url,
                            alt: img.alt || productData.name,
                            order: i,
                        })),
                    }
                    : undefined,
            },
            include: { images: true },
        });
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.findOne(id);
        const { images, ...productData } = dto;

        if (images) {
            // Delete existing images and recreate
            await this.prisma.productImage.deleteMany({ where: { productId: id } });
            await this.prisma.productImage.createMany({
                data: images.map((img, i) => ({
                    url: img.url,
                    alt: img.alt || '',
                    order: i,
                    productId: id,
                })),
            });
        }

        return this.prisma.product.update({
            where: { id },
            data: productData,
            include: { images: { orderBy: { order: 'asc' } } },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.product.update({
            where: { id },
            data: { isDeleted: true },
        });
    }

    async getStats() {
        const total = await this.prisma.product.count({ where: { isDeleted: false } });
        const inStock = await this.prisma.product.count({
            where: { isDeleted: false, availability: 'IN_STOCK' },
        });
        return { total, inStock };
    }
}
