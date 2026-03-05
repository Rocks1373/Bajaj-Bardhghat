import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('offers')
export class OffersController {
    constructor(private offersService: OffersService) { }

    @Get()
    findAll(@Query('active') active?: string) {
        return this.offersService.findAll(active === 'true');
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.offersService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    create(@Body() dto: CreateOfferDto) {
        return this.offersService.create(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    update(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
        return this.offersService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    remove(@Param('id') id: string) {
        return this.offersService.remove(id);
    }
}
