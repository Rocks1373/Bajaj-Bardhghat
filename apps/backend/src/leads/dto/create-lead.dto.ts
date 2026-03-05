import { IsString, IsOptional, IsEmail, IsNumber, Min } from 'class-validator';

export class CreateLeadDto {
    @IsString()
    fullName: string;

    @IsString()
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    interestedModel?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    budget?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    downPayment?: number;

    @IsOptional()
    @IsNumber()
    tenureMonths?: number;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    message?: string;
}
