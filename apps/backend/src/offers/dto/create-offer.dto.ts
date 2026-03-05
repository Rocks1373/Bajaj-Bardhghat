import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateOfferDto {
    @IsEnum(['FINANCE', 'EXCHANGE', 'GENERAL'])
    type: 'FINANCE' | 'EXCHANGE' | 'GENERAL';

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    subtitle?: string;

    @IsOptional()
    @IsString()
    details?: string;

    @IsOptional()
    @IsNumber()
    aprFrom?: number;

    @IsOptional()
    @IsString()
    tenureRange?: string;

    @IsOptional()
    @IsString()
    disclaimer?: string;

    @IsOptional()
    @IsString()
    bannerImage?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}
