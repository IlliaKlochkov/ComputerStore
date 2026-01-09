import { GpuSeries } from '$lib/server/models/GpuSeries';
import { GpuFamily } from '$lib/server/models/GpuFamily';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    const search = url.searchParams.get('search') || undefined;
    const familyId = url.searchParams.get('family') ? Number(url.searchParams.get('family')) : undefined;

    // Сортування
    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    const seriesList = await GpuSeries.findWithFilters(search, familyId, sortBy, sortDir);
    const families = await GpuFamily.findAll();

    return {
        seriesList: seriesList.map(s => s.toJSON()),
        families: families.map(f => f.toJSON()),
        filters: {
            search,
            family: familyId,
            sort: sortBy || 'name',
            order: sortDir || 'asc'
        }
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const fd = await request.formData();
        try {
            const newSeries = new GpuSeries({
                name: fd.get('name') as string,
                codename: fd.get('codename') as string,
                architecture: fd.get('architecture') as string,
                gpu_family_id: Number(fd.get('gpu_family_id'))
            });
            await newSeries.save();
            return { success: true };
        } catch (error: any) { return fail(400, { error: error.message }); }
    },
    update: async ({ request }) => {
        const fd = await request.formData();
        try {
            const series = new GpuSeries({
                gpu_series_id: Number(fd.get('gpu_series_id')),
                name: fd.get('name') as string,
                codename: fd.get('codename') as string,
                architecture: fd.get('architecture') as string,
                gpu_family_id: Number(fd.get('gpu_family_id'))
            });
            await series.save();
            return { success: true };
        } catch (error: any) { return fail(400, { error: error.message }); }
    },
    delete: async ({ request }) => {
        const fd = await request.formData();
        try {
            const series = await GpuSeries.findById(Number(fd.get('id')));
            if (series) await series.delete();
            return { success: true };
        } catch (error: any) {
            if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
                return fail(400, { error: "Cannot delete this GPU Series because specific GPUs are using it." });
            }
            return fail(500, { error: error.message });
        }
    }
};