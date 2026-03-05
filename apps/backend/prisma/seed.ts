import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@hulhasauto.com' },
        update: {},
        create: {
            email: 'admin@hulhasauto.com',
            password: hashedPassword,
            name: 'Hulhas Admin',
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user created');

    // Seed products
    const products = [
        {
            name: 'Bajaj Pulsar NS200',
            slug: 'pulsar-ns200',
            category: 'BIKE' as const,
            modelFamily: 'Pulsar',
            cc: 200,
            price: 141400,
            discountedPrice: 138000,
            description: 'The Bajaj Pulsar NS200 is a powerful naked street bike featuring a 199.5cc liquid-cooled, fuel-injected engine. It delivers 24.5 PS of power and comes with a perimeter frame for excellent handling and stability.',
            keyFeatures: ['Liquid-cooled Engine', 'Perimeter Frame', 'LED DRLs', 'Digital Console', 'Split Seat'],
            specs: { engine: '199.5cc', power: '24.5 PS @ 9750 rpm', torque: '18.5 Nm @ 8000 rpm', transmission: '6-speed', brakes: 'Disc/Disc', weight: '156 kg', fuelTank: '12 L', mileage: '35-40 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['New', 'Popular', 'Offer'],
            emiStarting: 3999,
            year: 2024,
        },
        {
            name: 'Bajaj Pulsar 150',
            slug: 'pulsar-150',
            category: 'BIKE' as const,
            modelFamily: 'Pulsar',
            cc: 150,
            price: 110000,
            description: 'The iconic Bajaj Pulsar 150 continues to be the benchmark in the 150cc segment. With its reliable engine and aggressive styling, it offers the perfect blend of performance and efficiency.',
            keyFeatures: ['Twin Spark Engine', 'Nitrox Suspension', 'Digital-Analog Console', 'Split Seat', 'Alloy Wheels'],
            specs: { engine: '149.5cc', power: '14 PS @ 8500 rpm', torque: '13.25 Nm @ 6500 rpm', transmission: '5-speed', brakes: 'Disc/Drum', weight: '148 kg', fuelTank: '15 L', mileage: '50-55 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Bestseller'],
            emiStarting: 2999,
            year: 2024,
        },
        {
            name: 'Bajaj Pulsar RS200',
            slug: 'pulsar-rs200',
            category: 'BIKE' as const,
            modelFamily: 'Pulsar',
            cc: 200,
            price: 164000,
            description: 'The Pulsar RS200 is a full-faired sport bike that combines aggressive styling with performance. Featuring a liquid-cooled engine, projector headlamps, and clip-on handlebars for a true sportbike experience.',
            keyFeatures: ['Full Fairing', 'Projector Headlamps', 'ABS', 'Clip-on Handlebars', 'Racing DNA'],
            specs: { engine: '199.5cc', power: '24.5 PS @ 9750 rpm', torque: '18.6 Nm @ 8000 rpm', transmission: '6-speed', brakes: 'Disc/Disc ABS', weight: '165 kg', fuelTank: '13 L', mileage: '33-38 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Sport', 'New'],
            emiStarting: 4499,
            year: 2024,
        },
        {
            name: 'Bajaj Dominar 400',
            slug: 'dominar-400',
            category: 'BIKE' as const,
            modelFamily: 'Dominar',
            cc: 373,
            price: 225000,
            discountedPrice: 219000,
            description: 'The Bajaj Dominar 400 is a power cruiser designed for long-distance touring with supreme comfort. Its 373cc engine delivers effortless performance while the twin-barrel exhaust produces a distinctive sound.',
            keyFeatures: ['Twin-barrel Exhaust', 'USD Forks', 'LED Headlamp', 'TFT Display', 'Touring Comfort'],
            specs: { engine: '373.3cc', power: '40 PS @ 8650 rpm', torque: '35 Nm @ 6500 rpm', transmission: '6-speed', brakes: 'Disc/Disc Dual ABS', weight: '184 kg', fuelTank: '13 L', mileage: '28-32 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Premium', 'Offer', 'Touring'],
            emiStarting: 5999,
            year: 2024,
        },
        {
            name: 'Bajaj Avenger Street 160',
            slug: 'avenger-street-160',
            category: 'BIKE' as const,
            modelFamily: 'Avenger',
            cc: 160,
            price: 117000,
            description: 'The Avenger Street 160 offers a comfortable cruising experience at an accessible price. With its low seat height and relaxed riding posture, it is perfect for comfortable city commuting and weekend getaways.',
            keyFeatures: ['Low Seat Height', 'LED Tail Lamp', 'Twin Spark Engine', 'Comfortable Posture', 'Alloy Wheels'],
            specs: { engine: '160cc', power: '15 PS @ 8500 rpm', torque: '13.7 Nm @ 7000 rpm', transmission: '5-speed', brakes: 'Disc/Drum', weight: '155 kg', fuelTank: '13 L', mileage: '45-50 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Cruiser', 'Comfort'],
            emiStarting: 3299,
            year: 2024,
        },
        {
            name: 'Bajaj Avenger Cruise 220',
            slug: 'avenger-cruise-220',
            category: 'BIKE' as const,
            modelFamily: 'Avenger',
            cc: 220,
            price: 139000,
            description: 'The Avenger Cruise 220 is the ultimate cruiser in its class. With its chrome-heavy styling, windscreen, and backrest, it delivers a premium cruising experience with ample power from its 220cc engine.',
            keyFeatures: ['Windscreen', 'Backrest', 'Chrome Finish', 'DTS-i Engine', 'Cruise Ergonomics'],
            specs: { engine: '220cc', power: '19 PS @ 8400 rpm', torque: '17.55 Nm @ 7000 rpm', transmission: '5-speed', brakes: 'Disc/Drum', weight: '158 kg', fuelTank: '13 L', mileage: '38-42 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Cruiser', 'Premium'],
            emiStarting: 3799,
            year: 2024,
        },
        {
            name: 'Bajaj Platina 110',
            slug: 'platina-110',
            category: 'BIKE' as const,
            modelFamily: 'Platina',
            cc: 110,
            price: 72000,
            description: 'The Bajaj Platina 110 is the most comfortable commuter bike in India. With its segment-best cushioned seat, anti-skid braking, and excellent fuel efficiency, it makes daily commuting a pleasure.',
            keyFeatures: ['ComforTec Technology', 'Anti-skid Braking', 'Nitrox Suspension', 'Spring Soft Seat', 'Best-in-class Mileage'],
            specs: { engine: '115.45cc', power: '8.6 PS @ 7000 rpm', torque: '9.81 Nm @ 5000 rpm', transmission: '4-speed', brakes: 'Drum/Drum', weight: '118 kg', fuelTank: '11.5 L', mileage: '70-75 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Commuter', 'Fuel Efficient'],
            emiStarting: 1999,
            year: 2024,
        },
        {
            name: 'Bajaj Pulsar N250',
            slug: 'pulsar-n250',
            category: 'BIKE' as const,
            modelFamily: 'Pulsar',
            cc: 250,
            price: 147000,
            description: 'The Pulsar N250 is the most powerful Pulsar ever built. With a 250cc oil-cooled engine, USD forks, and aggressive street-naked styling, it sets a new benchmark in the quarter-litre segment.',
            keyFeatures: ['250cc Oil-cooled Engine', 'USD Forks', 'LED Headlamp', 'Adjustable Levers', 'Dual-channel ABS'],
            specs: { engine: '249.07cc', power: '24.5 PS @ 8750 rpm', torque: '21.5 Nm @ 6500 rpm', transmission: '6-speed', brakes: 'Disc/Disc ABS', weight: '163 kg', fuelTank: '14 L', mileage: '35-40 kmpl' },
            availability: 'PRE_ORDER' as const,
            tags: ['New', 'Power'],
            emiStarting: 4199,
            year: 2024,
        },
        {
            name: 'Bajaj Chetak Electric',
            slug: 'chetak-electric',
            category: 'SCOOTER' as const,
            modelFamily: 'Chetak',
            cc: 0,
            price: 148000,
            description: 'The legendary Chetak returns in an electric avatar. With retro-modern design, IP67-rated battery, and connected features, the Chetak Electric combines nostalgia with cutting-edge technology.',
            keyFeatures: ['Electric Motor', 'IP67 Battery', 'Connected Features', 'Retro Design', 'Zero Emissions'],
            specs: { motor: '4.08 kW Electric', power: '5.4 PS', torque: '16 Nm', range: '108 km (Eco)', chargingTime: '5 hours', weight: '118 kg', battery: '3.0 kWh Lithium-Ion', topSpeed: '73 kmph' },
            availability: 'IN_STOCK' as const,
            tags: ['Electric', 'Premium', 'New'],
            emiStarting: 4299,
            year: 2024,
        },
        {
            name: 'Bajaj Pulsar F250',
            slug: 'pulsar-f250',
            category: 'BIKE' as const,
            modelFamily: 'Pulsar',
            cc: 250,
            price: 152000,
            description: 'The Pulsar F250 is a semi-faired sport tourer that combines Pulsar DNA with touring capability. Its 250cc engine, single-piece seat, and semi-fairing make it ideal for both city riding and highway cruising.',
            keyFeatures: ['Semi-Faired Design', 'Single-piece Seat', 'LED Lighting', 'USB Charger', 'Touring Ready'],
            specs: { engine: '249.07cc', power: '24.5 PS @ 8750 rpm', torque: '21.5 Nm @ 6500 rpm', transmission: '6-speed', brakes: 'Disc/Disc ABS', weight: '165 kg', fuelTank: '14 L', mileage: '33-38 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Sport Tourer', 'Popular'],
            emiStarting: 4399,
            year: 2024,
        },
        {
            name: 'Bajaj CT 110X',
            slug: 'ct-110x',
            category: 'BIKE' as const,
            modelFamily: 'CT',
            cc: 110,
            price: 65000,
            description: 'The Bajaj CT 110X is built rugged for Indian roads. With raised ground clearance, rugged looks, and a reliable engine, it handles rough terrain with ease while remaining economical.',
            keyFeatures: ['Rugged Build', 'High Ground Clearance', 'DTS-i Engine', 'Tubeless Tyres', 'Grab Rail'],
            specs: { engine: '115.3cc', power: '8.48 PS @ 7000 rpm', torque: '9.81 Nm @ 5000 rpm', transmission: '4-speed', brakes: 'Drum/Drum', weight: '122 kg', fuelTank: '10.5 L', mileage: '65-70 kmpl' },
            availability: 'IN_STOCK' as const,
            tags: ['Commuter', 'Value'],
            emiStarting: 1799,
            year: 2024,
        },
        {
            name: 'Bajaj Chetak Premium',
            slug: 'chetak-premium',
            category: 'SCOOTER' as const,
            modelFamily: 'Chetak',
            cc: 0,
            price: 168000,
            description: 'The Chetak Premium takes electric innovation further with enhanced range, premium finishes, and advanced connectivity. Every detail exudes craftsmanship and modern engineering.',
            keyFeatures: ['Extended Range', 'Premium Finish', 'App Connectivity', 'Reverse Mode', 'LED Lighting'],
            specs: { motor: '4.08 kW Electric', power: '5.4 PS', torque: '16 Nm', range: '126 km (Eco)', chargingTime: '5 hours', weight: '120 kg', battery: '3.2 kWh Lithium-Ion', topSpeed: '73 kmph' },
            availability: 'PRE_ORDER' as const,
            tags: ['Electric', 'Premium', 'Exchange'],
            emiStarting: 4899,
            year: 2024,
        },
    ];

    for (const product of products) {
        const created = await prisma.product.upsert({
            where: { slug: product.slug },
            update: {},
            create: {
                ...product,
                images: {
                    create: [
                        { url: `/api/placeholder/${product.slug}.jpg`, alt: product.name, order: 0 },
                    ],
                },
            },
        });
        console.log(`  ✅ Product: ${created.name}`);
    }

    // Seed offers
    const offers = [
        {
            type: 'FINANCE' as const,
            title: 'Easy EMI Starting ₹1,999/month',
            subtitle: 'Ride home your dream Bajaj today with flexible financing options',
            aprFrom: 8.99,
            tenureRange: '12-60 months',
            disclaimer: '*Terms and conditions apply. Interest rates vary based on credit profile. Processing fees additional.',
            active: true,
        },
        {
            type: 'FINANCE' as const,
            title: 'Zero Down Payment Festive Offer',
            subtitle: 'Limited period offer on select models - ride now, pay later',
            aprFrom: 9.49,
            tenureRange: '18-48 months',
            disclaimer: '*Available on select models only. Offer valid till stock lasts.',
            active: true,
        },
        {
            type: 'EXCHANGE' as const,
            title: 'Exchange Your Old Bike & Save Up to ₹15,000',
            subtitle: 'Get the best value for your old two-wheeler',
            details: 'Bring any brand, any condition two-wheeler and get up to ₹15,000 off on a brand new Bajaj. Instant valuation, same-day exchange. Valid on all models.',
            active: true,
        },
        {
            type: 'GENERAL' as const,
            title: 'Free Insurance on Select Models',
            subtitle: 'Comprehensive 1-year insurance free with every purchase this month',
            details: 'Get comprehensive insurance coverage absolutely free when you purchase any Pulsar or Dominar model. Offer valid for a limited period.',
            active: true,
        },
    ];

    for (const offer of offers) {
        await prisma.offer.create({ data: offer });
    }
    console.log('✅ Offers created');

    // Seed settings
    const settings = [
        {
            key: 'finance_rules',
            value: {
                defaultInterestRate: 8.99,
                minDownPayment: 10,
                maxTenure: 60,
                processingFee: 2.5,
                minLoanAmount: 30000,
            },
        },
        {
            key: 'emi_calculator',
            value: {
                defaultInterest: 9.5,
                processingFee: 999,
                insurancePercent: 2.5,
            },
        },
        {
            key: 'company_info',
            value: {
                name: 'Hulhas Auto',
                tagline: 'Your Trusted Bajaj Partner Since 2005',
                address: 'NH-7, Main Road, Opposite City Mall, Kathmandu',
                phone: '+977-9801234567',
                whatsapp: '+977-9801234567',
                email: 'info@hulhasauto.com',
                mapUrl: 'https://maps.google.com',
                workingHours: 'Mon-Sat: 9:00 AM - 7:00 PM | Sun: 10:00 AM - 4:00 PM',
            },
        },
    ];

    for (const setting of settings) {
        await prisma.siteSettings.upsert({
            where: { key: setting.key },
            update: { value: setting.value },
            create: setting,
        });
    }
    console.log('✅ Settings created');

    // Seed sample leads
    const leads = [
        { fullName: 'Rajan Sharma', phone: '+977-9841234567', email: 'rajan@example.com', interestedModel: 'Pulsar NS200', budget: 150000, downPayment: 30000, tenureMonths: 24, city: 'Kathmandu', message: 'Interested in the NS200. Please share the best offer.' },
        { fullName: 'Sita Devi', phone: '+977-9851234567', interestedModel: 'Chetak Electric', budget: 160000, city: 'Pokhara', message: 'Want to know about charging infrastructure.' },
        { fullName: 'Kiran Thapa', phone: '+977-9861234567', email: 'kiran@example.com', interestedModel: 'Dominar 400', budget: 230000, downPayment: 50000, tenureMonths: 36, city: 'Biratnagar' },
    ];

    for (const lead of leads) {
        await prisma.lead.create({ data: lead });
    }
    console.log('✅ Sample leads created');

    console.log('\n🎉 Seeding complete!');
    console.log('📧 Admin login: admin@hulhasauto.com');
    console.log('🔑 Admin password: admin123');
}

main()
    .catch(e => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
