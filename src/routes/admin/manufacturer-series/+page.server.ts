import { ManufacturerSeries } from '$lib/server/models/ManufacturerSeries';
import { Manufacturer } from '$lib/server/models/Manufacturer';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    const search = url.searchParams.get('search') || undefined;
    const manufacturerId = url.searchParams.get('manufacturer') ? Number(url.searchParams.get('manufacturer')) : undefined;

    // Сортування
    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    const seriesList = await ManufacturerSeries.findWithFilters(search, manufacturerId, sortBy, sortDir);
    const manufacturers = await Manufacturer.findAll();

    return {
        seriesList: seriesList.map(s => s.toJSON()),
        manufacturers: manufacturers.map(m => m.toJSON()),
        filters: {
            search, manufacturer: manufacturerId,
            sort: sortBy || 'series_name',
            order: sortDir || 'asc'
        }
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const fd = await request.formData();
        try {
            const newSeries = new ManufacturerSeries({
                manufacturer_id: Number(fd.get('manufacturer_id')),
                series_name: fd.get('series_name') as string
            });
            await newSeries.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    update: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('manufacturer_series_id')); // ID з одруківкою
        try {
            const series = new ManufacturerSeries({
                manufacturer_series_id: id,
                manufacturer_id: Number(fd.get('manufacturer_id')),
                series_name: fd.get('series_name') as string
            });
            await series.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    delete: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('id'));
        try {
            const series = await ManufacturerSeries.findById(id);
            if (series) await series.delete();
            return { success: true };
        } catch (error: any) {
            if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
                return fail(400, { error: "Cannot delete this Series because there are Videocards assigned to it." });
            }
            return fail(500, { error: error.message });
        }
    }
};