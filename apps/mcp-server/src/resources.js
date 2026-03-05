// ═══════════════════════════════════════════════════════════════
// Bajaj MCP Server — MCP Resources
// Expose structured data as MCP resources that agents can read
// ═══════════════════════════════════════════════════════════════
import * as db from './database.js';
import { logger } from './logger.js';

// ── Resource definitions for MCP server ────────────────────────
export function getResourceDefinitions() {
    return [
        {
            uri: 'bajaj://bikes',
            name: 'All Bajaj Bikes',
            description: 'Complete list of all Bajaj motorcycles and scooters available at the showroom with pricing, specs, and availability.',
            mimeType: 'application/json',
        },
        {
            uri: 'bajaj://bikes/{slug}',
            name: 'Bike Details',
            description: 'Detailed specifications, features, images, colors, and 3D model for a specific Bajaj bike. Use the bike slug as the identifier.',
            mimeType: 'application/json',
        },
        {
            uri: 'bajaj://inventory',
            name: 'Showroom Inventory',
            description: 'Current stock availability at all showroom locations including stock counts and availability status.',
            mimeType: 'application/json',
        },
        {
            uri: 'bajaj://images',
            name: 'Bike Images',
            description: 'All product images organized by bike model with URLs and alt text.',
            mimeType: 'application/json',
        },
        {
            uri: 'bajaj://models3d',
            name: '3D Models',
            description: 'GLB/GLTF 3D model files for interactive bike viewing and AR experiences.',
            mimeType: 'application/json',
        },
    ];
}

// ── Resource template definitions ──────────────────────────────
export function getResourceTemplateDefinitions() {
    return [
        {
            uriTemplate: 'bajaj://bikes/{slug}',
            name: 'Bike by Slug',
            description: 'Get detailed information about a specific bike by its URL slug (e.g., bajaj-pulsar-ns200)',
            mimeType: 'application/json',
        },
    ];
}

// ── Read a resource by URI ─────────────────────────────────────
export async function readResource(uri) {
    const start = Date.now();
    logger.info(`Reading resource: ${uri}`);

    try {
        // bajaj://bikes
        if (uri === 'bajaj://bikes') {
            const bikes = await db.getAllBikes();
            const response = {
                total: bikes.length,
                bikes: bikes.map(formatBikeSummary),
                lastUpdated: new Date().toISOString(),
            };
            await logAccess(uri, start);
            return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(response, null, 2) }] };
        }

        // bajaj://bikes/{slug}
        const bikeMatch = uri.match(/^bajaj:\/\/bikes\/(.+)$/);
        if (bikeMatch) {
            const slug = bikeMatch[1];
            const bike = await db.getBikeBySlug(slug);
            if (!bike) {
                return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ error: `Bike '${slug}' not found`, available_bikes: 'Use bajaj://bikes to see all available models' }) }] };
            }
            const response = formatBikeDetail(bike);
            await logAccess(uri, start);
            return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(response, null, 2) }] };
        }

        // bajaj://inventory
        if (uri === 'bajaj://inventory') {
            const inventory = await db.getInventory();
            const response = {
                total: inventory.length,
                showroom: 'Hulhas Auto - Birgunj',
                inventory: inventory.map(item => ({
                    model: item.name,
                    slug: item.slug,
                    category: item.category,
                    cc: item.cc,
                    price_npr: item.price,
                    stock: item.stock,
                    availability: item.availability,
                    location: item.showroom_location,
                    lastUpdated: item.last_updated,
                })),
                lastUpdated: new Date().toISOString(),
            };
            await logAccess(uri, start);
            return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(response, null, 2) }] };
        }

        // bajaj://images
        if (uri === 'bajaj://images') {
            const images = await db.getProductImages();
            const response = {
                total: images.length,
                bikes: images.map(item => ({
                    model: item.name,
                    slug: item.slug,
                    images: item.images,
                })),
            };
            await logAccess(uri, start);
            return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(response, null, 2) }] };
        }

        // bajaj://models3d
        if (uri === 'bajaj://models3d') {
            const models = await db.get3dModels();
            const response = {
                total: models.length,
                models: models.map(m => ({
                    model: m.name,
                    slug: m.slug,
                    glb_url: m.glb_url || m.model3dUrl,
                    format: m.format || 'glb',
                    file_size_mb: m.file_size_mb,
                })),
            };
            await logAccess(uri, start);
            return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(response, null, 2) }] };
        }

        throw new Error(`Unknown resource URI: ${uri}`);
    } catch (error) {
        logger.error(`Resource read failed: ${uri}`, { error: error.message });
        throw error;
    }
}

// ── Formatters ─────────────────────────────────────────────────
function formatBikeSummary(bike) {
    return {
        id: bike.id,
        name: bike.name,
        slug: bike.slug,
        category: bike.category,
        engine_cc: bike.cc,
        price_npr: bike.price,
        discounted_price_npr: bike.discountedPrice,
        availability: bike.availability,
        year: bike.year,
        colors: bike.colors || [],
        image_count: Array.isArray(bike.images) ? bike.images.length : 0,
    };
}

function formatBikeDetail(bike) {
    return {
        id: bike.id,
        name: bike.name,
        slug: bike.slug,
        category: bike.category,
        model_family: bike.modelFamily,
        engine_cc: bike.cc,
        price_npr: bike.price,
        discounted_price_npr: bike.discountedPrice,
        emi_starting: bike.emiStarting,
        description: bike.description,
        key_features: bike.keyFeatures,
        specifications: bike.specs,
        availability: bike.availability,
        year: bike.year,
        tags: bike.tags,
        colors: bike.colors || [],
        images: bike.images || [],
        model_3d: bike.model_3d || null,
        inventory: bike.inventory || {},
        created_at: bike.createdAt,
        updated_at: bike.updatedAt,
    };
}

async function logAccess(uri, start) {
    await db.logMcpAccess({
        resourceUri: uri,
        responseStatus: 'success',
        durationMs: Date.now() - start,
    });
}
