// ═══════════════════════════════════════════════════════════════
// Bajaj MCP Server — Database Layer
// Connects to the existing PostgreSQL used by the NestJS backend
// ═══════════════════════════════════════════════════════════════
import pg from 'pg';
import { logger } from './logger.js';

const { Pool } = pg;

let pool;

export function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        pool.on('error', (err) => {
            logger.error('Unexpected database pool error', { error: err.message });
        });

        pool.on('connect', () => {
            logger.debug('New database connection established');
        });
    }
    return pool;
}

// ── Query helper with logging ──────────────────────────────────
export async function query(text, params = []) {
    const start = Date.now();
    try {
        const result = await getPool().query(text, params);
        const duration = Date.now() - start;
        logger.debug('Query executed', { text: text.substring(0, 80), duration, rows: result.rowCount });
        return result;
    } catch (error) {
        logger.error('Query failed', { text: text.substring(0, 80), error: error.message });
        throw error;
    }
}

// ── Initialize MCP-specific tables ─────────────────────────────
// These extend the existing Prisma schema with MCP-layer tables
export async function initMcpTables() {
    logger.info('Initializing MCP database tables...');

    await query(`
    -- Bike colors table (linked to products)
    CREATE TABLE IF NOT EXISTS bike_colors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bike_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      color_name VARCHAR(100) NOT NULL,
      hex_code VARCHAR(7),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Inventory table (linked to products)
    CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bike_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      stock INT NOT NULL DEFAULT 0,
      showroom_location VARCHAR(255) NOT NULL DEFAULT 'Hulhas Auto - Birgunj',
      last_updated TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3D models table (linked to products)
    CREATE TABLE IF NOT EXISTS models_3d (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bike_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      glb_url TEXT NOT NULL,
      format VARCHAR(10) DEFAULT 'glb',
      file_size_mb FLOAT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- MCP access logs
    CREATE TABLE IF NOT EXISTS mcp_access_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tool_name VARCHAR(100),
      resource_uri VARCHAR(255),
      client_id VARCHAR(100),
      request_params JSONB,
      response_status VARCHAR(20),
      duration_ms INT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_bike_colors_bike_id ON bike_colors(bike_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_bike_id ON inventory(bike_id);
    CREATE INDEX IF NOT EXISTS idx_models_3d_bike_id ON models_3d(bike_id);
    CREATE INDEX IF NOT EXISTS idx_mcp_logs_created ON mcp_access_logs(created_at);
  `);

    logger.info('MCP tables initialized successfully');
}

// ── Product / Bike queries ─────────────────────────────────────
export async function getAllBikes() {
    const result = await query(`
    SELECT p.id, p.name, p.slug, p.category, p."modelFamily", p.cc,
           p.price, p."discountedPrice", p.description, p."keyFeatures",
           p.specs, p.availability, p.tags, p."emiStarting", p.year,
           p."model3dUrl", p."createdAt", p."updatedAt",
           COALESCE(json_agg(DISTINCT jsonb_build_object(
             'id', pi.id, 'url', pi.url, 'alt', pi.alt, 'order', pi."order"
           )) FILTER (WHERE pi.id IS NOT NULL), '[]') as images,
           COALESCE(json_agg(DISTINCT jsonb_build_object(
             'color', bc.color_name, 'hex', bc.hex_code
           )) FILTER (WHERE bc.id IS NOT NULL), '[]') as colors,
           COALESCE((SELECT json_build_object('stock', inv.stock, 'location', inv.showroom_location)
                     FROM inventory inv WHERE inv.bike_id = p.id LIMIT 1), '{}') as inventory
    FROM products p
    LEFT JOIN product_images pi ON pi."productId" = p.id
    LEFT JOIN bike_colors bc ON bc.bike_id = p.id
    WHERE p."isDeleted" = false
    GROUP BY p.id
    ORDER BY p."createdAt" DESC
  `);
    return result.rows;
}

export async function getBikeBySlug(slug) {
    const result = await query(`
    SELECT p.*, 
           COALESCE(json_agg(DISTINCT jsonb_build_object(
             'id', pi.id, 'url', pi.url, 'alt', pi.alt, 'order', pi."order"
           )) FILTER (WHERE pi.id IS NOT NULL), '[]') as images,
           COALESCE(json_agg(DISTINCT jsonb_build_object(
             'color', bc.color_name, 'hex', bc.hex_code
           )) FILTER (WHERE bc.id IS NOT NULL), '[]') as colors,
           COALESCE((SELECT json_build_object('stock', inv.stock, 'location', inv.showroom_location)
                     FROM inventory inv WHERE inv.bike_id = p.id LIMIT 1), '{}') as inventory,
           COALESCE((SELECT json_build_object('glb_url', m.glb_url, 'format', m.format, 'size_mb', m.file_size_mb)
                     FROM models_3d m WHERE m.bike_id = p.id LIMIT 1), '{}') as model_3d
    FROM products p
    LEFT JOIN product_images pi ON pi."productId" = p.id
    LEFT JOIN bike_colors bc ON bc.bike_id = p.id
    WHERE p.slug = $1 AND p."isDeleted" = false
    GROUP BY p.id
  `, [slug]);
    return result.rows[0] || null;
}

export async function searchBikes(searchTerm) {
    const result = await query(`
    SELECT p.id, p.name, p.slug, p.category, p.cc, p.price,
           p."discountedPrice", p.availability, p.description
    FROM products p
    WHERE p."isDeleted" = false
      AND (
        p.name ILIKE $1 
        OR p.slug ILIKE $1 
        OR p."modelFamily" ILIKE $1
        OR p.description ILIKE $1
        OR $2 = ANY(p.tags)
      )
    ORDER BY p.name
  `, [`%${searchTerm}%`, searchTerm.toLowerCase()]);
    return result.rows;
}

export async function getBikeByName(modelName) {
    const result = await query(`
    SELECT p.*, 
           COALESCE(json_agg(DISTINCT jsonb_build_object(
             'id', pi.id, 'url', pi.url, 'alt', pi.alt
           )) FILTER (WHERE pi.id IS NOT NULL), '[]') as images
    FROM products p
    LEFT JOIN product_images pi ON pi."productId" = p.id
    WHERE p."isDeleted" = false
      AND (p.name ILIKE $1 OR p.slug ILIKE $2)
    GROUP BY p.id
    LIMIT 1
  `, [`%${modelName}%`, `%${modelName.toLowerCase().replace(/\s+/g, '-')}%`]);
    return result.rows[0] || null;
}

export async function getInventory() {
    const result = await query(`
    SELECT p.id, p.name, p.slug, p.category, p.cc, p.price, p.availability,
           COALESCE(inv.stock, 0) as stock,
           COALESCE(inv.showroom_location, 'Hulhas Auto - Birgunj') as showroom_location,
           inv.last_updated
    FROM products p
    LEFT JOIN inventory inv ON inv.bike_id = p.id
    WHERE p."isDeleted" = false
    ORDER BY p.name
  `);
    return result.rows;
}

export async function getBikeColors(bikeId) {
    const result = await query(`
    SELECT color_name, hex_code FROM bike_colors WHERE bike_id = $1
  `, [bikeId]);
    return result.rows;
}

export async function get3dModels() {
    const result = await query(`
    SELECT p.id, p.name, p.slug, m.glb_url, m.format, m.file_size_mb, p."model3dUrl"
    FROM products p
    LEFT JOIN models_3d m ON m.bike_id = p.id
    WHERE p."isDeleted" = false
      AND (m.glb_url IS NOT NULL OR p."model3dUrl" IS NOT NULL)
    ORDER BY p.name
  `);
    return result.rows;
}

export async function getProductImages() {
    const result = await query(`
    SELECT p.id as bike_id, p.name, p.slug,
           COALESCE(json_agg(json_build_object(
             'id', pi.id, 'url', pi.url, 'alt', pi.alt, 'order', pi."order"
           ) ORDER BY pi."order") FILTER (WHERE pi.id IS NOT NULL), '[]') as images
    FROM products p
    LEFT JOIN product_images pi ON pi."productId" = p.id
    WHERE p."isDeleted" = false
    GROUP BY p.id
    ORDER BY p.name
  `);
    return result.rows;
}

// ── Log MCP access ─────────────────────────────────────────────
export async function logMcpAccess({ toolName, resourceUri, clientId, requestParams, responseStatus, durationMs }) {
    try {
        await query(`
      INSERT INTO mcp_access_logs (tool_name, resource_uri, client_id, request_params, response_status, duration_ms)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [toolName, resourceUri, clientId, JSON.stringify(requestParams || {}), responseStatus, durationMs]);
    } catch (e) {
        logger.warn('Failed to log MCP access', { error: e.message });
    }
}

export async function closePool() {
    if (pool) {
        await pool.end();
        logger.info('Database pool closed');
    }
}
