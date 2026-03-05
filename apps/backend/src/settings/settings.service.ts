import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async getAll() {
        const settings = await this.prisma.siteSettings.findMany();
        const result: Record<string, any> = {};
        settings.forEach(s => { result[s.key] = s.value; });
        return result;
    }

    async get(key: string) {
        const setting = await this.prisma.siteSettings.findUnique({ where: { key } });
        return setting?.value || null;
    }

    async upsert(key: string, value: any) {
        return this.prisma.siteSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    async updateMany(data: Record<string, any>) {
        const operations = Object.entries(data).map(([key, value]) =>
            this.prisma.siteSettings.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            }),
        );
        return this.prisma.$transaction(operations);
    }
}
