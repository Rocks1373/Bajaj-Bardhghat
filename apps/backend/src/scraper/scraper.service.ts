import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface BikeData {
    name: string;
    slug: string;
    official_url: string;
    images: string[];
    specs: Record<string, string>;
    engine: Record<string, string>;
    features: string[];
    colors: string[];
    price: number;
    description: string;
    fetched_at: string;
}

@Injectable()
export class ScraperService {
    private readonly logger = new Logger(ScraperService.name);
    private readonly cacheDir = path.join(process.cwd(), 'cache', 'bikes');
    private readonly imageDir = path.join(process.cwd(), 'uploads', 'bike-images');

    constructor() {
        // Ensure cache and image directories exist
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        if (!fs.existsSync(this.imageDir)) {
            fs.mkdirSync(this.imageDir, { recursive: true });
        }
    }

    /**
     * Fetch bike data from official URL.
     * Uses a structured data approach with fallback to curated data.
     * NOTE: Direct web scraping of bajajauto.com may violate their ToS.
     * In production, use their official API or dealer data feed.
     */
    async fetchBikeData(url: string, slug: string): Promise<BikeData> {
        this.logger.log(`Fetching bike data for: ${slug} from ${url}`);

        // Check cache first (valid for 24 hours)
        const cached = this.getCachedData(slug);
        if (cached) {
            this.logger.log(`Returning cached data for ${slug}`);
            return cached;
        }

        try {
            // Attempt to fetch structured data from the official URL
            const bikeData = await this.fetchFromOfficialSource(url, slug);
            this.cacheData(slug, bikeData);
            return bikeData;
        } catch (error) {
            this.logger.warn(`Could not fetch from official source: ${error.message}`);

            // Fallback to curated catalog data
            const fallbackData = this.getFallbackData(slug);
            if (fallbackData) {
                this.cacheData(slug, fallbackData);
                return fallbackData;
            }

            throw new Error(`Unable to fetch data for ${slug}`);
        }
    }

    /**
     * Fetch from official source using HTTP request.
     * Parses structured data (JSON-LD) from the page if available.
     */
    private async fetchFromOfficialSource(url: string, slug: string): Promise<BikeData> {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BajajDealerBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} from ${url}`);
        }

        const html = await response.text();

        // Try to extract JSON-LD structured data
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        let structuredData: any = null;

        if (jsonLdMatch) {
            try {
                structuredData = JSON.parse(jsonLdMatch[1]);
            } catch { /* ignore parse errors */ }
        }

        // Extract title from HTML
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const name = structuredData?.name || titleMatch?.[1]?.split('|')?.[0]?.trim() || slug.replace(/-/g, ' ');

        // Extract Open Graph images
        const ogImages: string[] = [];
        const ogImageRegex = /property="og:image"\s+content="([^"]+)"/g;
        let imgMatch: RegExpExecArray | null;
        while ((imgMatch = ogImageRegex.exec(html)) !== null) {
            ogImages.push(imgMatch[1]);
        }

        // Extract meta description
        const descMatch = html.match(/name="description"\s+content="([^"]+)"/i);
        const description = structuredData?.description || descMatch?.[1] || '';

        // Extract images from src attributes (bike images)
        const srcImages: string[] = [];
        const imgSrcRegex = /src="(https?:\/\/[^"]*(?:bike|pulsar|dominar|avenger|chetak|platina)[^"]*\.(?:jpg|jpeg|png|webp))[^"]*"/gi;
        let srcMatch: RegExpExecArray | null;
        while ((srcMatch = imgSrcRegex.exec(html)) !== null) {
            if (!srcImages.includes(srcMatch[1])) {
                srcImages.push(srcMatch[1]);
            }
        }

        const allImages = [...ogImages, ...srcImages].slice(0, 10);

        // Cache images locally
        await this.cacheImages(slug, allImages);

        return {
            name,
            slug,
            official_url: url,
            images: allImages.length > 0 ? allImages : ['/images/fallback-bike.jpg'],
            specs: this.extractSpecs(html),
            engine: this.extractEngineDetails(html),
            features: this.extractFeatures(html),
            colors: this.extractColors(html),
            price: structuredData?.offers?.price || 0,
            description,
            fetched_at: new Date().toISOString(),
        };
    }

    /**
     * Extract specifications from HTML using common patterns
     */
    private extractSpecs(html: string): Record<string, string> {
        const specs: Record<string, string> = {};
        // Look for spec table patterns
        const specPatterns = [
            /data-label="([^"]+)"[^>]*>([^<]+)/g,
            /<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)/g,
            /"spec_name":\s*"([^"]+)"[^}]*"spec_value":\s*"([^"]+)"/g,
        ];

        for (const pattern of specPatterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(html)) !== null) {
                const key = match[1].trim();
                const value = match[2].trim();
                if (key && value && key.length < 50 && value.length < 100) {
                    specs[key] = value;
                }
            }
        }

        return specs;
    }

    /**
     * Extract engine details
     */
    private extractEngineDetails(html: string): Record<string, string> {
        const engine: Record<string, string> = {};
        const engineTerms = ['displacement', 'max power', 'max torque', 'bore', 'stroke', 'compression', 'fuel system', 'cooling'];

        for (const term of engineTerms) {
            const regex = new RegExp(`${term}[^<]*?[>:]+\\s*([\\d.]+\\s*[a-zA-Z/@ ]+)`, 'i');
            const match = html.match(regex);
            if (match) {
                engine[term] = match[1].trim();
            }
        }

        return engine;
    }

    /**
     * Extract features list
     */
    private extractFeatures(html: string): string[] {
        const features: string[] = [];
        const featurePatterns = [
            /class="[^"]*feature[^"]*"[^>]*>([^<]+)/gi,
            /"feature[_-]?name":\s*"([^"]+)"/gi,
        ];

        for (const pattern of featurePatterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(html)) !== null) {
                const feature = match[1].trim();
                if (feature.length > 3 && feature.length < 100 && !features.includes(feature)) {
                    features.push(feature);
                }
            }
        }

        return features;
    }

    /**
     * Extract available colors
     */
    private extractColors(html: string): string[] {
        const colors: string[] = [];
        const colorPatterns = [
            /(?:color|colour)[^"]*"[^>]*>([^<]+)/gi,
            /"color[_-]?name":\s*"([^"]+)"/gi,
            /alt="[^"]*?\b(Red|Blue|Black|White|Silver|Grey|Green|Yellow|Orange|Pearl|Metallic[^"]*)/gi,
        ];

        for (const pattern of colorPatterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(html)) !== null) {
                const color = match[1].trim();
                if (color.length > 2 && color.length < 50 && !colors.includes(color)) {
                    colors.push(color);
                }
            }
        }

        return colors;
    }

    /**
     * Cache images locally for performance
     */
    private async cacheImages(slug: string, urls: string[]): Promise<void> {
        const slugDir = path.join(this.imageDir, slug);
        if (!fs.existsSync(slugDir)) {
            fs.mkdirSync(slugDir, { recursive: true });
        }

        for (let i = 0; i < urls.length; i++) {
            try {
                const ext = urls[i].split('.').pop()?.split('?')[0] || 'jpg';
                const filename = `${slug}-${i}.${ext}`;
                const filepath = path.join(slugDir, filename);

                if (!fs.existsSync(filepath)) {
                    const response = await fetch(urls[i]);
                    if (response.ok) {
                        const buffer = Buffer.from(await response.arrayBuffer());
                        fs.writeFileSync(filepath, buffer);
                        this.logger.log(`Cached image: ${filename}`);
                    }
                }
            } catch (error) {
                this.logger.warn(`Failed to cache image ${i} for ${slug}: ${error.message}`);
            }
        }
    }

    /**
     * Get cached data if still valid (24h TTL)
     */
    private getCachedData(slug: string): BikeData | null {
        const cachePath = path.join(this.cacheDir, `${slug}.json`);
        if (fs.existsSync(cachePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
                const fetchedAt = new Date(data.fetched_at);
                const now = new Date();
                const hoursDiff = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    return data;
                }
            } catch { /* ignore corrupt cache */ }
        }
        return null;
    }

    /**
     * Cache bike data to disk
     */
    private cacheData(slug: string, data: BikeData): void {
        const cachePath = path.join(this.cacheDir, `${slug}.json`);
        fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
    }

    /**
     * Curated fallback data for popular models
     */
    private getFallbackData(slug: string): BikeData | null {
        const catalog: Record<string, Partial<BikeData>> = {
            'pulsar-ns400': {
                name: 'Pulsar NS400',
                price: 285000,
                description: 'The Pulsar NS400 is Bajaj\'s most powerful naked sport with a 373.27cc liquid-cooled engine delivering 39.65 PS. Features ride-by-wire, dual-channel ABS, adjustable suspension, and a full-digital TFT console with Bluetooth connectivity.',
                specs: {
                    'Displacement': '373.27 cc',
                    'Max Power': '39.65 PS @ 8500 rpm',
                    'Max Torque': '35 Nm @ 7000 rpm',
                    'Kerb Weight': '174 kg',
                    'Top Speed': '165 km/h',
                    'Fuel Tank': '14 L',
                    'Mileage': '30 kmpl',
                    'Transmission': '6-Speed',
                    'Seat Height': '795 mm',
                    'Ground Clearance': '165 mm',
                },
                engine: {
                    'Type': 'Single Cylinder, 4 Stroke, Liquid Cooled, DOHC',
                    'Displacement': '373.27 cc',
                    'Max Power': '39.65 PS @ 8500 rpm',
                    'Max Torque': '35 Nm @ 7000 rpm',
                    'Fuel System': 'Electronic Fuel Injection',
                    'Cooling': 'Liquid Cooled',
                },
                features: ['Ride-by-Wire', 'Dual Channel ABS', 'TFT Console', 'Bluetooth Connectivity', 'Adjustable Suspension', 'LED All-Around', 'Ride Modes', 'USB Charging'],
                colors: ['Cocktail Wine Red', 'Pearl Metallic White', 'Matte Axe Black'],
            },
            'pulsar-ns200': {
                name: 'Pulsar NS200',
                price: 141400,
                description: 'The NS200 is the street-fighting avatar of the Pulsar range. With a 199.5cc liquid-cooled triple-spark DTS-i engine, perimeter frame, and aggressive styling, it\'s built to dominate city streets.',
                specs: {
                    'Displacement': '199.5 cc',
                    'Max Power': '24.5 PS @ 9750 rpm',
                    'Max Torque': '18.74 Nm @ 8000 rpm',
                    'Kerb Weight': '156 kg',
                    'Top Speed': '136 km/h',
                    'Fuel Tank': '12 L',
                    'Mileage': '35 kmpl',
                    'Transmission': '6-Speed',
                    'Seat Height': '805 mm',
                    'Ground Clearance': '169 mm',
                },
                engine: {
                    'Type': 'Single Cylinder, 4 Stroke, Liquid Cooled, Triple Spark DTS-i',
                    'Displacement': '199.5 cc',
                    'Max Power': '24.5 PS @ 9750 rpm',
                    'Max Torque': '18.74 Nm @ 8000 rpm',
                    'Fuel System': 'Fuel Injection',
                    'Cooling': 'Liquid Cooled',
                },
                features: ['Triple Spark DTS-i', 'Liquid Cooling', 'Perimeter Frame', 'ABS', 'Digital Console', 'Projector Headlamp', 'LED Tail Light'],
                colors: ['Burnt Red', 'Pewter Grey', 'Saffire Blue'],
            },
            'pulsar-n250': {
                name: 'Pulsar N250',
                price: 147000,
                description: 'The Pulsar N250 brings quarter-litre performance in a naked-street package. Oil-cooled 249.07cc engine with refined power delivery, USD forks, and Premium semi-digital console.',
                specs: {
                    'Displacement': '249.07 cc',
                    'Max Power': '24.5 PS @ 8750 rpm',
                    'Max Torque': '21.5 Nm @ 6500 rpm',
                    'Kerb Weight': '162 kg',
                    'Top Speed': '140 km/h',
                    'Fuel Tank': '14 L',
                    'Mileage': '35 kmpl',
                    'Transmission': '6-Speed',
                    'Seat Height': '795 mm',
                    'Ground Clearance': '165 mm',
                },
                engine: {
                    'Type': 'Single Cylinder, 4 Stroke, 2 Valve, Oil Cooled',
                    'Displacement': '249.07 cc',
                    'Max Power': '24.5 PS @ 8750 rpm',
                    'Max Torque': '21.5 Nm @ 6500 rpm',
                    'Fuel System': 'Fuel Injection',
                    'Cooling': 'Oil Cooled',
                },
                features: ['USD Front Forks', 'Semi-Digital Console', 'Single Channel ABS', 'LED DRLs', 'Muscular Styling', 'Underbelly Exhaust'],
                colors: ['Racing Red', 'Brooklyn Black', 'Techno Grey'],
            },
            'dominar-400': {
                name: 'Dominar 400',
                price: 225000,
                description: 'The Dominar 400 is Bajaj\'s flagship tourer with a 373.3cc liquid-cooled DOHC engine. Designed for cross-country touring with USD forks, dual-channel ABS, and a full-digital console.',
                specs: {
                    'Displacement': '373.3 cc',
                    'Max Power': '40 PS @ 8650 rpm',
                    'Max Torque': '35 Nm @ 7000 rpm',
                    'Kerb Weight': '184 kg',
                    'Top Speed': '160 km/h',
                    'Fuel Tank': '13 L',
                    'Mileage': '28 kmpl',
                    'Transmission': '6-Speed (Slipper Clutch)',
                    'Seat Height': '800 mm',
                    'Ground Clearance': '157 mm',
                },
                engine: {
                    'Type': 'Single Cylinder, 4 Stroke, Liquid Cooled, DOHC',
                    'Displacement': '373.3 cc',
                    'Max Power': '40 PS @ 8650 rpm',
                    'Max Torque': '35 Nm @ 7000 rpm',
                    'Fuel System': 'Electronic Fuel Injection',
                    'Cooling': 'Liquid Cooled',
                },
                features: ['DOHC Engine', 'Slipper Clutch', 'Dual Channel ABS', 'USD Front Forks', 'Full-Digital Console', 'LED Headlamp', 'Bungee Straps'],
                colors: ['Vine Black', 'Aurora Green', 'Charcoal Black'],
            },
            'pulsar-rs200': {
                name: 'Pulsar RS200',
                price: 164000,
                description: 'The RS200 is the full-faired flagship of the Pulsar sport series. Aggressive supersport styling with a 199.5cc triple-spark engine, projector headlamps, and a race-inspired design.',
                specs: {
                    'Displacement': '199.5 cc',
                    'Max Power': '24.5 PS @ 9750 rpm',
                    'Max Torque': '18.74 Nm @ 8000 rpm',
                    'Kerb Weight': '165 kg',
                    'Top Speed': '140 km/h',
                    'Fuel Tank': '13 L',
                    'Mileage': '35 kmpl',
                    'Transmission': '6-Speed',
                    'Seat Height': '820 mm',
                    'Ground Clearance': '165 mm',
                },
                engine: {
                    'Type': 'Single Cylinder, 4 Stroke, Liquid Cooled, Triple Spark DTS-i',
                    'Displacement': '199.5 cc',
                    'Max Power': '24.5 PS @ 9750 rpm',
                    'Max Torque': '18.74 Nm @ 8000 rpm',
                    'Fuel System': 'Fuel Injection',
                    'Cooling': 'Liquid Cooled',
                },
                features: ['Full Fairing', 'Projector Headlamp', 'ABS', 'Clip-On Handlebars', 'Digital Console', 'LED Tail Light', 'Muscular Tank'],
                colors: ['Racing Red', 'Burnt Orange', 'Pewter Grey'],
            },
            'avenger-cruise-220': {
                name: 'Avenger Cruise 220',
                price: 139000,
                description: 'The Avenger Cruise 220 is India\'s most popular cruiser motorcycle. Relaxed riding geometry, wide handlebars, and a powerful 220cc engine make it perfect for long highway rides.',
                specs: {
                    'Displacement': '220 cc',
                    'Max Power': '19.03 PS @ 8400 rpm',
                    'Max Torque': '17.55 Nm @ 7000 rpm',
                    'Kerb Weight': '155 kg',
                    'Top Speed': '120 km/h',
                    'Fuel Tank': '13 L',
                    'Mileage': '40 kmpl',
                    'Transmission': '5-Speed',
                    'Seat Height': '730 mm',
                    'Ground Clearance': '169 mm',
                },
                engine: {
                    'Type': 'Single Cylinder, 4 Stroke, Oil Cooled, DTS-i',
                    'Displacement': '220 cc',
                    'Max Power': '19.03 PS @ 8400 rpm',
                    'Max Torque': '17.55 Nm @ 7000 rpm',
                    'Fuel System': 'Fuel Injection',
                    'Cooling': 'Oil Cooled',
                },
                features: ['Cruiser Riding Position', 'Wide Handlebars', 'Backrest', 'Digital-Analog Console', 'LED DRLs', 'Windshield'],
                colors: ['Ebony Black', 'Spicy Red', 'Desert Gold'],
            },
            'chetak-electric': {
                name: 'Chetak Electric',
                price: 148000,
                description: 'The iconic Chetak returns as an all-electric scooter. Premium metal body, IP67-rated battery, regenerative braking, and connected features. The future of urban mobility.',
                specs: {
                    'Motor': '4.08 kW BLDC',
                    'Battery': '3.072 kWh Li-Ion',
                    'Range (Eco)': '108 km',
                    'Range (Sport)': '90 km',
                    'Top Speed': '73 km/h',
                    'Charge Time': '5 hours (0-100%)',
                    'Kerb Weight': '127 kg',
                    'Seat Height': '750 mm',
                    'Ground Clearance': '155 mm',
                    'Boot Space': '20 L',
                },
                engine: {
                    'Type': 'BLDC Electric Motor',
                    'Power': '4.08 kW',
                    'Battery': '3.072 kWh Lithium-Ion',
                    'Range': '90–108 km',
                    'Charging': '5 hrs (0-100%), 25% in 1 hr',
                    'Regenerative Braking': 'Yes',
                },
                features: ['IP67 Rated Battery', 'Regenerative Braking', 'Connected Features', 'Digital Console', 'LED Lighting', 'Metal Body', 'Reverse Mode', 'Find My Vehicle'],
                colors: ['Indigo Metallic', 'Brooklyn Black', 'Citrus Rush', 'Hazelnut'],
            },
            'platina-110': {
                name: 'Platina 110',
                price: 72000,
                description: 'The Platina 110 is the ultimate commuter with best-in-class fuel efficiency. Spring-suspended comfort seat, nitrox shock absorbers, and ultra-low maintenance.',
                specs: {
                    'Displacement': '115.45 cc',
                    'Max Power': '8.6 PS @ 7000 rpm',
                    'Max Torque': '9.81 Nm @ 5000 rpm',
                    'Kerb Weight': '117 kg',
                    'Top Speed': '90 km/h',
                    'Fuel Tank': '11 L',
                    'Mileage': '70 kmpl',
                    'Transmission': '5-Speed',
                    'Seat Height': '760 mm',
                    'Ground Clearance': '165 mm',
                },
                engine: {
                    'Type': 'Single Cylinder, 4 Stroke, Air Cooled, DTS-i',
                    'Displacement': '115.45 cc',
                    'Max Power': '8.6 PS @ 7000 rpm',
                    'Max Torque': '9.81 Nm @ 5000 rpm',
                    'Fuel System': 'Carburetor',
                    'Cooling': 'Air Cooled',
                },
                features: ['Spring-Suspended Comfortech Seat', 'Nitrox Shock Absorbers', 'DTS-i Technology', 'CBS', 'Electric Start', 'LED DRL'],
                colors: ['Cocktail Wine Red', 'Charcoal Black', 'Ebony Black with Blue'],
            },
        };

        const data = catalog[slug];
        if (!data) return null;

        return {
            name: data.name || slug,
            slug,
            official_url: `https://www.bajajauto.com/bikes/${slug}`,
            images: data.images || ['/images/fallback-bike.jpg'],
            specs: data.specs || {},
            engine: data.engine || {},
            features: data.features || [],
            colors: data.colors || [],
            price: data.price || 0,
            description: data.description || '',
            fetched_at: new Date().toISOString(),
        };
    }

    /**
     * Get all cached/available models
     */
    async getAllModels(): Promise<BikeData[]> {
        const files = fs.readdirSync(this.cacheDir).filter(f => f.endsWith('.json'));
        const models: BikeData[] = [];

        for (const file of files) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(this.cacheDir, file), 'utf8'));
                models.push(data);
            } catch { /* skip corrupt files */ }
        }

        return models;
    }

    /**
     * Clear cache for a specific model or all
     */
    clearCache(slug?: string): void {
        if (slug) {
            const cachePath = path.join(this.cacheDir, `${slug}.json`);
            if (fs.existsSync(cachePath)) {
                fs.unlinkSync(cachePath);
            }
        } else {
            const files = fs.readdirSync(this.cacheDir);
            for (const file of files) {
                fs.unlinkSync(path.join(this.cacheDir, file));
            }
        }
    }
}
