import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getHello() {
        return {
            message: 'Hulhas Auto API is running',
            status: 'ok',
            timestamp: new Date().toISOString()
        };
    }
}
