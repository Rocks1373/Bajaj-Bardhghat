import { Controller, Get, Post, Query, Body, Delete, Param } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) { }

    /**
     * GET /api/scraper/fetch?url=...&slug=...
     * Fetch bike data from official URL
     */
    @Get('fetch')
    async fetchBikeData(
        @Query('url') url: string,
        @Query('slug') slug: string,
    ) {
        if (!url || !slug) {
            return { error: 'Both url and slug query parameters are required' };
        }
        try {
            const data = await this.scraperService.fetchBikeData(url, slug);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * POST /api/scraper/fetch-batch
     * Fetch multiple models from entry-config format
     */
    @Post('fetch-batch')
    async fetchBatch(
        @Body() body: { models: { model_name: string; slug: string; official_url: string }[] },
    ) {
        const results: any[] = [];
        for (const model of body.models) {
            try {
                const data = await this.scraperService.fetchBikeData(model.official_url, model.slug);
                results.push({ slug: model.slug, success: true, data });
            } catch (error) {
                results.push({ slug: model.slug, success: false, error: error.message });
            }
        }
        return { results };
    }

    /**
     * GET /api/scraper/models
     * Get all cached models
     */
    @Get('models')
    async getAllModels() {
        const models = await this.scraperService.getAllModels();
        return { data: models };
    }

    /**
     * GET /api/scraper/model/:slug
     * Get a specific model by slug
     */
    @Get('model/:slug')
    async getModel(@Param('slug') slug: string) {
        try {
            // Attempt to fetch (will use cache if available)
            const data = await this.scraperService.fetchBikeData(
                `https://www.bajajauto.com/bikes/${slug}`,
                slug,
            );
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * DELETE /api/scraper/cache/:slug
     * Clear cache for a specific model
     */
    @Delete('cache/:slug')
    async clearCache(@Param('slug') slug: string) {
        this.scraperService.clearCache(slug);
        return { success: true, message: `Cache cleared for ${slug}` };
    }

    /**
     * DELETE /api/scraper/cache
     * Clear all cache
     */
    @Delete('cache')
    async clearAllCache() {
        this.scraperService.clearCache();
        return { success: true, message: 'All cache cleared' };
    }
}
