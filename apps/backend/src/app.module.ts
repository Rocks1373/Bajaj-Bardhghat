import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OffersModule } from './offers/offers.module';
import { LeadsModule } from './leads/leads.module';
import { SettingsModule } from './settings/settings.module';
import { UploadsModule } from './uploads/uploads.module';
import { ScraperModule } from './scraper/scraper.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        ProductsModule,
        OffersModule,
        LeadsModule,
        SettingsModule,
        UploadsModule,
        ScraperModule,
    ],
    controllers: [AppController]
})
export class AppModule { }
