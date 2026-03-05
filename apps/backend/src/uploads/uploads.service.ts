import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Storage adapter interface for future S3 migration
export interface StorageAdapter {
    save(file: Express.Multer.File): Promise<string>;
    delete(filePath: string): Promise<void>;
}

@Injectable()
export class UploadsService implements StorageAdapter {
    private uploadDir: string;

    constructor() {
        this.uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async save(file: Express.Multer.File): Promise<string> {
        const ext = path.extname(file.originalname);
        const filename = `${uuid()}${ext}`;
        const filePath = path.join(this.uploadDir, filename);
        fs.writeFileSync(filePath, file.buffer);
        return `/uploads/${filename}`;
    }

    async saveMultiple(files: Express.Multer.File[]): Promise<string[]> {
        return Promise.all(files.map(f => this.save(f)));
    }

    async delete(filePath: string): Promise<void> {
        const fullPath = path.join(this.uploadDir, path.basename(filePath));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }
}
