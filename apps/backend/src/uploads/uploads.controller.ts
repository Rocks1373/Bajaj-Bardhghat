import {
    Controller, Post, UseGuards, UseInterceptors,
    UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UploadsController {
    constructor(private uploadsService: UploadsService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const url = await this.uploadsService.save(file);
        return { url };
    }

    @Post('multiple')
    @UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 50 * 1024 * 1024 } }))
    async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
        const urls = await this.uploadsService.saveMultiple(files);
        return { urls };
    }
}
