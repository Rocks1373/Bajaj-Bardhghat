import { insforge } from './insforge';

// ─── Public API (InsForge SDK) ─────────────────────────────────

export const api = {
    // Products
    getProducts: async (params?: {
        page?: string; limit?: string; search?: string; category?: string;
        modelFamily?: string; availability?: string; minPrice?: string;
        maxPrice?: string; cc?: string; sort?: string;
    }) => {
        const page = parseInt(params?.page || '1');
        const limit = parseInt(params?.limit || '12');
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = insforge.database
            .from('products')
            .select('*', { count: 'exact' })
            .eq('is_deleted', false);

        if (params?.search) {
            query = query.ilike('name', `%${params.search}%`);
        }
        if (params?.category) {
            query = query.eq('category', params.category);
        }
        if (params?.modelFamily) {
            query = query.in('model_family', params.modelFamily.split(','));
        }
        if (params?.availability) {
            query = query.eq('availability', params.availability);
        }
        if (params?.minPrice) {
            query = query.gte('price', parseFloat(params.minPrice));
        }
        if (params?.maxPrice) {
            query = query.lte('price', parseFloat(params.maxPrice));
        }
        if (params?.cc) {
            query = query.in('cc', params.cc.split(',').map(Number));
        }

        // Sorting
        if (params?.sort === 'price_asc') {
            query = query.order('price', { ascending: true });
        } else if (params?.sort === 'price_desc') {
            query = query.order('price', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw new Error(error.message || 'Failed to fetch products');

        return {
            data: data || [],
            meta: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    },

    getProductBySlug: async (slug: string) => {
        const { data, error } = await insforge.database
            .from('products')
            .select('*')
            .eq('slug', slug)
            .eq('is_deleted', false)
            .single();

        if (error) throw new Error('Product not found');
        return data;
    },

    getProduct: async (id: string) => {
        const { data, error } = await insforge.database
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', false)
            .single();

        if (error) throw new Error('Product not found');
        return data;
    },

    // Offers
    getOffers: async (activeOnly = true) => {
        let query = insforge.database
            .from('offers')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (activeOnly) {
            query = query.eq('active', true);
        }

        const { data, error } = await query;
        if (error) throw new Error('Failed to fetch offers');
        return data || [];
    },

    // Leads (public submit)
    submitLead: async (leadData: {
        fullName: string; phone: string; email?: string;
        interestedModel?: string; budget?: number; downPayment?: number;
        tenureMonths?: number; city?: string; message?: string;
    }) => {
        const { data, error } = await insforge.database
            .from('leads')
            .insert({
                full_name: leadData.fullName,
                phone: leadData.phone,
                email: leadData.email || null,
                interested_model: leadData.interestedModel || null,
                budget: leadData.budget || null,
                down_payment: leadData.downPayment || null,
                tenure_months: leadData.tenureMonths || null,
                city: leadData.city || null,
                message: leadData.message || null,
            })
            .select();

        if (error) throw new Error('Failed to submit enquiry');
        return data;
    },

    // Settings
    getSettings: async () => {
        const { data, error } = await insforge.database
            .from('site_settings')
            .select('*');

        if (error) throw new Error('Failed to fetch settings');
        const result: Record<string, any> = {};
        (data || []).forEach((s: any) => { result[s.key] = s.value; });
        return result;
    },

    // Get all products for AI context
    getAllProductsForContext: async () => {
        const { data } = await insforge.database
            .from('products')
            .select('name, slug, category, model_family, cc, price, discounted_price, key_features, specs, availability, emi_starting, description, images, model_3d_url, images_360, video_url, is_used, launch_date, year, tags')
            .eq('is_deleted', false);
        return data || [];
    },
};

// ─── Admin API (still NestJS for admin auth & protected ops) ──

const ADMIN_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function adminFetch(endpoint: string, token: string, options: RequestInit = {}) {
    const res = await fetch(`${ADMIN_API_URL}/api${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
        cache: 'no-store',
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    if (res.headers.get('content-type')?.includes('text/csv')) return res.text();
    return res.json();
}

export const adminApi = {
    // Auth — use InsForge DB directly for admin login
    login: async (email: string, password: string) => {
        // For demo: simple admin login via custom API
        const res = await fetch(`${ADMIN_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
    },

    // Products CRUD via InsForge directly (admin uses anon key + own auth)
    createProduct: async (data: any, token: string) => {
        const { data: result, error } = await insforge.database
            .from('products')
            .insert({
                name: data.name,
                slug: data.slug,
                category: data.category,
                model_family: data.modelFamily,
                cc: data.cc,
                price: data.price,
                discounted_price: data.discountedPrice || null,
                description: data.description,
                key_features: data.keyFeatures || [],
                specs: data.specs || {},
                availability: data.availability || 'IN_STOCK',
                tags: data.tags || [],
                emi_starting: data.emiStarting || null,
                images: data.images || [],
                model_3d_url: data.model3dUrl || null,
                images_360: data.images360 || [],
                video_url: data.videoUrl || null,
                is_used: data.isUsed || false,
                used_bike_images: data.usedBikeImages || [],
                launch_date: data.launchDate || null,
                year: data.year || 2024,
            })
            .select();
        if (error) throw new Error(error.message || 'Failed to create product');
        return result?.[0];
    },

    uploadFile: async (file: File, token: string) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${ADMIN_API_URL}/api/uploads`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload file');
        const data = await res.json();
        return { ...data, url: `${ADMIN_API_URL}${data.url}` };
    },

    uploadMultipleFiles: async (files: FileList | File[], token: string) => {
        const formData = new FormData();
        Array.from(files).forEach(file => formData.append('files', file));
        const res = await fetch(`${ADMIN_API_URL}/api/uploads/multiple`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to upload files');
        const data = await res.json();
        return { ...data, urls: data.urls.map((u: string) => `${ADMIN_API_URL}${u}`) };
    },

    updateProduct: async (id: string, data: any, token: string) => {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.modelFamily !== undefined) updateData.model_family = data.modelFamily;
        if (data.cc !== undefined) updateData.cc = data.cc;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.discountedPrice !== undefined) updateData.discounted_price = data.discountedPrice;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.keyFeatures !== undefined) updateData.key_features = data.keyFeatures;
        if (data.specs !== undefined) updateData.specs = data.specs;
        if (data.availability !== undefined) updateData.availability = data.availability;
        if (data.tags !== undefined) updateData.tags = data.tags;
        if (data.emiStarting !== undefined) updateData.emi_starting = data.emiStarting;
        if (data.images !== undefined) updateData.images = data.images;
        if (data.model3dUrl !== undefined) updateData.model_3d_url = data.model3dUrl;
        if (data.images360 !== undefined) updateData.images_360 = data.images360;
        if (data.videoUrl !== undefined) updateData.video_url = data.videoUrl;
        if (data.isUsed !== undefined) updateData.is_used = data.isUsed;
        if (data.usedBikeImages !== undefined) updateData.used_bike_images = data.usedBikeImages;
        if (data.launchDate !== undefined) updateData.launch_date = data.launchDate;
        if (data.year !== undefined) updateData.year = data.year;
        updateData.updated_at = new Date().toISOString();

        const { data: result, error } = await insforge.database
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select();
        if (error) throw new Error(error.message || 'Failed to update product');
        return result?.[0];
    },

    deleteProduct: async (id: string, token: string) => {
        const { error } = await insforge.database
            .from('products')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw new Error(error.message || 'Failed to delete product');
    },

    // Offers CRUD
    getOffers: async (token: string) => {
        const { data, error } = await insforge.database
            .from('offers')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });
        if (error) throw new Error('Failed to fetch offers');
        return data || [];
    },

    createOffer: async (data: any, token: string) => {
        const { data: result, error } = await insforge.database
            .from('offers')
            .insert({
                type: data.type,
                title: data.title,
                subtitle: data.subtitle || null,
                details: data.details || null,
                apr_from: data.aprFrom || null,
                tenure_range: data.tenureRange || null,
                disclaimer: data.disclaimer || null,
                banner_image: data.bannerImage || null,
                active: data.active !== undefined ? data.active : true,
            })
            .select();
        if (error) throw new Error(error.message || 'Failed to create offer');
        return result?.[0];
    },

    updateOffer: async (id: string, data: any, token: string) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (data.type !== undefined) updateData.type = data.type;
        if (data.title !== undefined) updateData.title = data.title;
        if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
        if (data.details !== undefined) updateData.details = data.details;
        if (data.aprFrom !== undefined) updateData.apr_from = data.aprFrom;
        if (data.tenureRange !== undefined) updateData.tenure_range = data.tenureRange;
        if (data.disclaimer !== undefined) updateData.disclaimer = data.disclaimer;
        if (data.bannerImage !== undefined) updateData.banner_image = data.bannerImage;
        if (data.active !== undefined) updateData.active = data.active;

        const { data: result, error } = await insforge.database
            .from('offers')
            .update(updateData)
            .eq('id', id)
            .select();
        if (error) throw new Error(error.message || 'Failed to update offer');
        return result?.[0];
    },

    deleteOffer: async (id: string, token: string) => {
        const { error } = await insforge.database
            .from('offers')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw new Error(error.message || 'Failed to delete offer');
    },

    // Leads
    getLeads: async (params: Record<string, string>, token: string) => {
        const page = parseInt(params.page || '1');
        const limit = parseInt(params.limit || '20');
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = insforge.database
            .from('leads')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (params.status) {
            query = query.eq('status', params.status);
        }

        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw new Error('Failed to fetch leads');
        return {
            data: data || [],
            meta: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
        };
    },

    updateLead: async (id: string, data: any, token: string) => {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (data.status) updateData.status = data.status;
        if (data.notes !== undefined) updateData.notes = data.notes;

        const { data: result, error } = await insforge.database
            .from('leads')
            .update(updateData)
            .eq('id', id)
            .select();
        if (error) throw new Error('Failed to update lead');
        return result?.[0];
    },

    getLeadStats: async (token: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [{ count: total }, { count: pending }, { count: newToday }] = await Promise.all([
            insforge.database.from('leads').select('*', { count: 'exact', head: true }),
            insforge.database.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
            insforge.database.from('leads').select('*', { count: 'exact', head: true })
                .eq('status', 'NEW').gte('created_at', today.toISOString()),
        ]);
        return { total: total || 0, pending: pending || 0, newToday: newToday || 0 };
    },

    // Settings
    updateSettings: async (data: Record<string, any>, token: string) => {
        for (const [key, value] of Object.entries(data)) {
            const { error } = await insforge.database
                .from('site_settings')
                .update({ value, updated_at: new Date().toISOString() })
                .eq('key', key);

            if (error) {
                // If not found, insert
                await insforge.database.from('site_settings').insert({ key, value });
            }
        }
    },

    // Product stats
    getProductStats: async (token: string) => {
        const [{ count: total }, { count: inStock }] = await Promise.all([
            insforge.database.from('products').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
            insforge.database.from('products').select('*', { count: 'exact', head: true })
                .eq('is_deleted', false).eq('availability', 'IN_STOCK'),
        ]);
        return { total: total || 0, inStock: inStock || 0 };
    },

    // Offer stats
    getOfferStats: async (token: string) => {
        const { count } = await insforge.database
            .from('offers')
            .select('*', { count: 'exact', head: true })
            .eq('is_deleted', false)
            .eq('active', true);
        return { activeOffers: count || 0 };
    },
};
