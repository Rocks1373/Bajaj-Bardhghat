import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('settings')
export class SettingsController {
    constructor(private settingsService: SettingsService) { }

    @Get()
    getAll() {
        return this.settingsService.getAll();
    }

    @Patch()
    @UseGuards(JwtAuthGuard, AdminGuard)
    updateMany(@Body() data: Record<string, any>) {
        return this.settingsService.updateMany(data);
    }
}
