import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async findAll(query: { status?: string; page?: number; limit?: number }) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (query.status) where.status = query.status;

        const [data, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.lead.count({ where }),
        ]);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async create(dto: CreateLeadDto) {
        return this.prisma.lead.create({ data: dto });
    }

    async update(id: string, dto: UpdateLeadDto) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });
        if (!lead) throw new NotFoundException('Lead not found');
        return this.prisma.lead.update({ where: { id }, data: dto });
    }

    async getStats() {
        const [total, newToday, pending] = await Promise.all([
            this.prisma.lead.count(),
            this.prisma.lead.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                    status: 'NEW',
                },
            }),
            this.prisma.lead.count({ where: { status: 'NEW' } }),
        ]);
        return { total, newToday, pending };
    }

    async exportCsv() {
        const leads = await this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
        const headers = 'Full Name,Phone,Email,Interested Model,Budget,Down Payment,Tenure,City,Message,Status,Notes,Created At\n';
        const rows = leads.map(l =>
            `"${l.fullName}","${l.phone}","${l.email || ''}","${l.interestedModel || ''}",${l.budget || ''},${l.downPayment || ''},${l.tenureMonths || ''},"${l.city || ''}","${(l.message || '').replace(/"/g, '""')}","${l.status}","${(l.notes || '').replace(/"/g, '""')}","${l.createdAt.toISOString()}"`
        ).join('\n');
        return headers + rows;
    }
}
