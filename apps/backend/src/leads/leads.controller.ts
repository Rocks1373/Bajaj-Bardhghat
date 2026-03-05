import {
    Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Res, Header,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('leads')
export class LeadsController {
    constructor(private leadsService: LeadsService) { }

    // Public: submit enquiry
    @Post()
    create(@Body() dto: CreateLeadDto) {
        return this.leadsService.create(dto);
    }

    // Admin: list leads
    @Get()
    @UseGuards(JwtAuthGuard, AdminGuard)
    findAll(
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.leadsService.findAll({
            status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    // Admin: update lead
    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
        return this.leadsService.update(id, dto);
    }

    // Admin: export CSV
    @Get('export/csv')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async exportCsv(@Res() res: Response) {
        const csv = await this.leadsService.exportCsv();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
        res.send(csv);
    }

    // Admin: stats
    @Get('stats')
    @UseGuards(JwtAuthGuard, AdminGuard)
    getStats() {
        return this.leadsService.getStats();
    }
}
