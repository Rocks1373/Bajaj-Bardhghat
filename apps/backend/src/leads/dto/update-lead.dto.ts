import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateLeadDto {
    @IsOptional()
    @IsEnum(['NEW', 'CONTACTED', 'CLOSED'])
    status?: 'NEW' | 'CONTACTED' | 'CLOSED';

    @IsOptional()
    @IsString()
    notes?: string;
}
