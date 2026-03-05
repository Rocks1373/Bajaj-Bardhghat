import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
    constructor(private prisma: PrismaService) { }

    async findAll(activeOnly = false) {
        const where: any = { isDeleted: false };
        if (activeOnly) where.active = true;
        return this.prisma.offer.findMany({ where, orderBy: { createdAt: 'desc' } });
    }

    async findOne(id: string) {
        const offer = await this.prisma.offer.findFirst({
            where: { id, isDeleted: false },
        });
        if (!offer) throw new NotFoundException('Offer not found');
        return offer;
    }

    async create(dto: CreateOfferDto) {
        return this.prisma.offer.create({ data: dto });
    }

    async update(id: string, dto: UpdateOfferDto) {
        await this.findOne(id);
        return this.prisma.offer.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.offer.update({
            where: { id },
            data: { isDeleted: true },
        });
    }

    async getActiveCount() {
        return this.prisma.offer.count({ where: { isDeleted: false, active: true } });
    }
}
