// ═══════════════════════════════════════════════════════════════
// Bajaj MCP Server — MCP Tools
// Callable tools that AI agents invoke via MCP protocol
// ═══════════════════════════════════════════════════════════════
import * as db from './database.js';
import { logger } from './logger.js';

// ── Tool definitions ───────────────────────────────────────────
export function getToolDefinitions() {
    return [
        {
            name: 'search_bike',
            description: 'Search for Bajaj motorcycles and scooters by name, category, or keyword. Returns matching bikes with basic info and pricing.',
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search term — bike name (e.g. "Pulsar"), category ("BIKE"/"SCOOTER"), or keyword',
                    },
                },
                required: ['query'],
            },
        },
        {
            name: 'get_bike_specs',
            description: 'Get full technical specifications for a specific Bajaj bike model including engine, power, torque, mileage, dimensions, and features.',
            inputSchema: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        description: 'Bike model name or slug (e.g. "Pulsar NS200" or "bajaj-pulsar-ns200")',
                    },
                },
                required: ['model'],
            },
        },
        {
            name: 'get_price',
            description: 'Get the current price of a Bajaj bike in NPR (Nepalese Rupees), including discounted price and EMI starting amount if available.',
            inputSchema: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        description: 'Bike model name or slug',
                    },
                },
                required: ['model'],
            },
        },
        {
            name: 'get_available_colors',
            description: 'Get all available color options for a specific Bajaj bike model.',
            inputSchema: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        description: 'Bike model name or slug',
                    },
                },
                required: ['model'],
            },
        },
        {
            name: 'get_3d_model',
            description: 'Get the 3D model file URL (GLB/GLTF format) for a specific Bajaj bike, useful for AR/VR viewing and interactive displays.',
            inputSchema: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        description: 'Bike model name or slug',
                    },
                },
                required: ['model'],
            },
        },
        {
            name: 'compare_bikes',
            description: 'Compare two Bajaj bike models side by side — engine specs, price, features, and availability.',
            inputSchema: {
                type: 'object',
                properties: {
                    model1: {
                        type: 'string',
                        description: 'First bike model name or slug',
                    },
                    model2: {
                        type: 'string',
                        description: 'Second bike model name or slug',
                    },
                },
                required: ['model1', 'model2'],
            },
        },
        {
            name: 'get_inventory_status',
            description: 'Check stock availability for a specific bike model or get overall showroom inventory status.',
            inputSchema: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        description: 'Optional bike model name. If omitted, returns full inventory.',
                    },
                },
                required: [],
            },
        },
        {
            name: 'calculate_emi',
            description: 'Calculate EMI (Equated Monthly Installment) for a Bajaj bike purchase with customizable down payment, tenure, and interest rate.',
            inputSchema: {
                type: 'object',
                properties: {
                    model: {
                        type: 'string',
                        description: 'Bike model name or slug',
                    },
                    down_payment_percent: {
                        type: 'number',
                        description: 'Down payment as percentage of price (default: 20)',
                        default: 20,
                    },
                    tenure_months: {
                        type: 'number',
                        description: 'Loan tenure in months (default: 36)',
                        default: 36,
                    },
                    interest_rate: {
                        type: 'number',
                        description: 'Annual interest rate percentage (default: 12)',
                        default: 12,
                    },
                },
                required: ['model'],
            },
        },
    ];
}

// ── Tool handler ───────────────────────────────────────────────
export async function handleToolCall(name, args) {
    const start = Date.now();
    logger.info(`Tool called: ${name}`, { args });

    try {
        let result;

        switch (name) {
            case 'search_bike':
                result = await handleSearchBike(args);
                break;
            case 'get_bike_specs':
                result = await handleGetBikeSpecs(args);
                break;
            case 'get_price':
                result = await handleGetPrice(args);
                break;
            case 'get_available_colors':
                result = await handleGetAvailableColors(args);
                break;
            case 'get_3d_model':
                result = await handleGet3dModel(args);
                break;
            case 'compare_bikes':
                result = await handleCompareBikes(args);
                break;
            case 'get_inventory_status':
                result = await handleGetInventoryStatus(args);
                break;
            case 'calculate_emi':
                result = await handleCalculateEmi(args);
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }

        await db.logMcpAccess({
            toolName: name,
            requestParams: args,
            responseStatus: 'success',
            durationMs: Date.now() - start,
        });

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
        logger.error(`Tool ${name} failed`, { error: error.message, args });
        await db.logMcpAccess({
            toolName: name,
            requestParams: args,
            responseStatus: 'error',
            durationMs: Date.now() - start,
        });
        return {
            content: [{ type: 'text', text: JSON.stringify({ error: error.message, tool: name }) }],
            isError: true,
        };
    }
}

// ── Individual tool handlers ───────────────────────────────────

async function handleSearchBike({ query }) {
    const bikes = await db.searchBikes(query);
    if (bikes.length === 0) {
        return {
            message: `No bikes found matching "${query}"`,
            suggestion: 'Try searching with a different term. Available categories: BIKE, SCOOTER',
        };
    }
    return {
        query,
        results_count: bikes.length,
        bikes: bikes.map(b => ({
            name: b.name,
            slug: b.slug,
            category: b.category,
            engine_cc: b.cc,
            price_npr: b.price,
            discounted_price: b.discountedPrice,
            availability: b.availability,
        })),
    };
}

async function handleGetBikeSpecs({ model }) {
    const bike = await db.getBikeByName(model);
    if (!bike) return { error: `Bike "${model}" not found`, suggestion: 'Use search_bike tool to find the correct model name' };

    return {
        name: bike.name,
        slug: bike.slug,
        category: bike.category,
        model_family: bike.modelFamily,
        year: bike.year,
        engine: {
            displacement_cc: bike.cc,
            ...extractEngineSpecs(bike.specs),
        },
        specifications: bike.specs,
        key_features: bike.keyFeatures,
        description: bike.description,
        tags: bike.tags,
    };
}

async function handleGetPrice({ model }) {
    const bike = await db.getBikeByName(model);
    if (!bike) return { error: `Bike "${model}" not found` };

    return {
        name: bike.name,
        price_npr: bike.price,
        discounted_price_npr: bike.discountedPrice,
        savings_npr: bike.discountedPrice ? bike.price - bike.discountedPrice : 0,
        emi_starting_npr: bike.emiStarting,
        currency: 'NPR',
        showroom: 'Hulhas Auto - Birgunj, Nepal',
    };
}

async function handleGetAvailableColors({ model }) {
    const bike = await db.getBikeByName(model);
    if (!bike) return { error: `Bike "${model}" not found` };

    const colors = await db.getBikeColors(bike.id);
    return {
        name: bike.name,
        colors: colors.length > 0 ? colors : [{ color_name: 'Contact showroom for available colors', hex_code: null }],
        total_colors: colors.length,
    };
}

async function handleGet3dModel({ model }) {
    const bike = await db.getBikeByName(model);
    if (!bike) return { error: `Bike "${model}" not found` };

    return {
        name: bike.name,
        model_3d_url: bike.model3dUrl || null,
        format: bike.model3dUrl ? 'glb' : null,
        available: !!bike.model3dUrl,
        viewer_instructions: bike.model3dUrl
            ? 'Load the GLB file in a Three.js viewer or any GLTF-compatible 3D viewer'
            : 'No 3D model available for this bike yet',
    };
}

async function handleCompareBikes({ model1, model2 }) {
    const [bike1, bike2] = await Promise.all([
        db.getBikeByName(model1),
        db.getBikeByName(model2),
    ]);

    if (!bike1) return { error: `First bike "${model1}" not found` };
    if (!bike2) return { error: `Second bike "${model2}" not found` };

    return {
        comparison: {
            bike_1: formatComparison(bike1),
            bike_2: formatComparison(bike2),
        },
        price_difference_npr: Math.abs(bike1.price - bike2.price),
        cheaper: bike1.price < bike2.price ? bike1.name : bike2.name,
        cc_difference: Math.abs(bike1.cc - bike2.cc),
        more_powerful: bike1.cc > bike2.cc ? bike1.name : bike2.name,
    };
}

async function handleGetInventoryStatus({ model }) {
    if (model) {
        const bike = await db.getBikeByName(model);
        if (!bike) return { error: `Bike "${model}" not found` };

        const inventory = await db.getInventory();
        const bikeInventory = inventory.find(i => i.id === bike.id);

        return {
            name: bike.name,
            availability: bike.availability,
            stock: bikeInventory?.stock ?? 'Contact showroom',
            location: bikeInventory?.showroom_location ?? 'Hulhas Auto - Birgunj',
            in_stock: bike.availability === 'IN_STOCK',
        };
    }

    const inventory = await db.getInventory();
    return {
        showroom: 'Hulhas Auto - Birgunj',
        total_models: inventory.length,
        in_stock: inventory.filter(i => i.availability === 'IN_STOCK').length,
        pre_order: inventory.filter(i => i.availability === 'PRE_ORDER').length,
        out_of_stock: inventory.filter(i => i.availability === 'OUT_OF_STOCK').length,
        inventory: inventory.map(i => ({
            model: i.name,
            stock: i.stock,
            availability: i.availability,
            location: i.showroom_location,
        })),
    };
}

async function handleCalculateEmi({ model, down_payment_percent = 20, tenure_months = 36, interest_rate = 12 }) {
    const bike = await db.getBikeByName(model);
    if (!bike) return { error: `Bike "${model}" not found` };

    const price = bike.discountedPrice || bike.price;
    const downPayment = (price * down_payment_percent) / 100;
    const loanAmount = price - downPayment;
    const monthlyRate = interest_rate / 12 / 100;
    const emi = monthlyRate > 0
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure_months)) / (Math.pow(1 + monthlyRate, tenure_months) - 1)
        : loanAmount / tenure_months;

    return {
        bike: bike.name,
        on_road_price_npr: price,
        down_payment_npr: Math.round(downPayment),
        down_payment_percent,
        loan_amount_npr: Math.round(loanAmount),
        tenure_months,
        interest_rate_annual: interest_rate,
        emi_per_month_npr: Math.round(emi),
        total_payment_npr: Math.round(emi * tenure_months + downPayment),
        total_interest_npr: Math.round(emi * tenure_months - loanAmount),
        currency: 'NPR',
        showroom: 'Hulhas Auto - Birgunj',
        disclaimer: 'EMI calculation is indicative. Actual EMI may vary based on bank policies.',
    };
}

// ── Helpers ────────────────────────────────────────────────────

function formatComparison(bike) {
    return {
        name: bike.name,
        category: bike.category,
        engine_cc: bike.cc,
        price_npr: bike.price,
        discounted_price_npr: bike.discountedPrice,
        key_features: bike.keyFeatures,
        specifications: bike.specs,
        availability: bike.availability,
        year: bike.year,
    };
}

function extractEngineSpecs(specs) {
    if (!specs || typeof specs !== 'object') return {};
    const engine = {};
    const engineKeys = ['power', 'torque', 'mileage', 'fuel_capacity', 'top_speed', 'transmission'];
    for (const key of engineKeys) {
        if (specs[key]) engine[key] = specs[key];
    }
    return engine;
}
