import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import entryConfig from '@/data/entry-config.json';

const entryConfig_whatsapp = (entryConfig as any).showroom?.whatsapp || '';

const insforge = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL || 'https://76w8jrzf.us-east.insforge.app',
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '',
});

export async function POST(request: NextRequest) {
    try {
        const { messages, sessionId } = await request.json();

        // Fetch all products for context
        const { data: products } = await insforge.database
            .from('products')
            .select('name, slug, category, model_family, cc, price, discounted_price, key_features, specs, availability, emi_starting, description, tags, is_used, launch_date, year, images_360, model_3d_url')
            .eq('is_deleted', false);

        // Fetch active offers
        const { data: offers } = await insforge.database
            .from('offers')
            .select('type, title, subtitle, details, apr_from, tenure_range, disclaimer')
            .eq('is_deleted', false)
            .eq('active', true);

        // Fetch settings
        const { data: settings } = await insforge.database
            .from('site_settings')
            .select('key, value');

        const productContext = (products || []).map((p: any) => {
            const specs = typeof p.specs === 'string' ? JSON.parse(p.specs) : p.specs;
            const priceStr = `NPR ${(p.discounted_price || p.price).toLocaleString('en-IN')}${p.discounted_price ? ` (original NPR ${p.price.toLocaleString('en-IN')})` : ''}`;
            const launchStr = p.launch_date ? ` | Launching: ${new Date(p.launch_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : '';
            const usedStr = p.is_used ? ' [USED BIKE]' : '';
            const has3d = p.model_3d_url ? ' [3D View Available]' : '';
            const has360 = (p.images_360 || []).length > 0 ? ' [360° View Available]' : '';
            return `**${p.name}**${usedStr}${has3d}${has360} (${p.category}, ${p.year || 2024})
  - Model Family: ${p.model_family} | CC: ${p.cc || 'Electric'}
  - Price: ${priceStr}${launchStr}
  - Availability: ${p.availability} | EMI from: NPR ${p.emi_starting}/mo
  - Features: ${(p.key_features || []).join(', ')}
  - Tags: ${(p.tags || []).join(', ')}
  - Specs: ${Object.entries(specs || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
  - ${p.description}`;
        }).join('\n\n');

        const offersContext = (offers || []).map((o: any) =>
            `**${o.title}** (${o.type}): ${o.subtitle || ''} ${o.details || ''} ${o.apr_from ? `APR from ${o.apr_from}%` : ''} ${o.tenure_range ? `Tenure: ${o.tenure_range}` : ''}`
        ).join('\n');

        const companyInfo = (settings || []).find((s: any) => s.key === 'company_info')?.value;

        const systemPrompt = `You are the AI sales assistant for **Ulhas Bajaj (Hulhas Auto)**, an authorized Bajaj motorcycle and scooter dealership in Bardaghat, Nawalparasi, Nepal.

YOUR PERSONALITY:
- Friendly, knowledgeable, and enthusiastic about Bajaj motorcycles and scooters
- Professional yet approachable — like a helpful showroom salesperson
- Always guide customers toward making an enquiry via WhatsApp or visiting the showroom
- Use emojis sparingly for a modern feel
- All prices are in Nepali Rupees (NPR)

SHOWROOM INFO:
Name: Ulhas Bajaj (Authorized Bajaj Dealer)
Location: Bardaghat, Nawalparasi, Nepal
WhatsApp: ${(companyInfo as any)?.whatsapp || entryConfig_whatsapp || 'available at showroom'}
${companyInfo ? `Additional Info: ${JSON.stringify(companyInfo)}` : ''}

AVAILABLE PRODUCTS (live inventory — prices in NPR):
${productContext}

CURRENT OFFERS:
${offersContext || 'Check with showroom for latest offers'}

RULES:
1. ONLY discuss products available at Ulhas Bajaj (listed above)
2. All prices are in NPR (Nepali Rupees) — NOT Indian Rupees
3. Provide accurate pricing, specs, and features from the data above
4. Help compare models when asked
5. Suggest suitable models based on customer needs (budget, use case, preferences)
6. Calculate approximate EMI when asked (use formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1), where r = 11% annual / 12 for Nepal)
7. Always encourage customers to WhatsApp the showroom or visit in person
8. If asked about models not in inventory, politely say they're not currently available at this showroom
9. For used bikes, mention they are pre-owned and suggest visiting to inspect
10. Keep responses concise but helpful (max 200 words)
11. For models with "3D View Available", mention customers can view the bike in 3D on the website
12. Do NOT make up specifications or features not in the data
13. For upcoming/PRE_ORDER bikes, mention the expected launch date if available`;

        // Call InsForge AI
        const completion = await insforge.ai.chat.completions.create({
            model: 'deepseek/deepseek-v3.2',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages.slice(-10), // Keep last 10 messages for context
            ],
            temperature: 0.7,
            maxTokens: 500,
        });

        const reply = completion.choices[0].message.content;

        // Save to chat_messages table
        if (sessionId) {
            await insforge.database.from('chat_messages').insert([
                { session_id: sessionId, role: 'user', content: messages[messages.length - 1].content },
                { session_id: sessionId, role: 'assistant', content: reply },
            ]);
        }

        return NextResponse.json({ reply });
    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to get response', details: error.message },
            { status: 500 }
        );
    }
}
