import { Manufacturer } from '$lib/server/models/Manufacturer';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    const search = url.searchParams.get('search') || undefined;
    const country = url.searchParams.get('country') || undefined;

    // Сортування
    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    const manufacturers = await Manufacturer.findWithFilters(search, country, sortBy, sortDir);
    const countries = await Manufacturer.getDistinctCountries();

    return {
        manufacturers: manufacturers.map(m => m.toJSON()),
        countries,
        filters: {
            search, country,
            sort: sortBy || 'name',
            order: sortDir || 'asc'
        }
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const fd = await request.formData();
        try {
            const newManuf = new Manufacturer({
                name: fd.get('name') as string,
                country_of_origin: fd.get('country_of_origin') as string,
                website_url: fd.get('website_url') as string
            });
            await newManuf.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    update: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('manufacturer_id'));
        try {
            const manuf = new Manufacturer({
                manufacturer_id: id,
                name: fd.get('name') as string,
                country_of_origin: fd.get('country_of_origin') as string,
                website_url: fd.get('website_url') as string
            });
            await manuf.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    delete: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('id'));
        try {
            const manuf = await Manufacturer.findById(id);
            if (manuf) await manuf.delete();
            return { success: true };
        } catch (error: any) {
            // Перехоплення помилки FK
            if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
                return fail(400, { error: "Cannot delete this Manufacturer because it has associated Series. Please delete them first." });
            }
            return fail(500, { error: error.message });
        }
    }
};