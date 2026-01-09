import { GpuFamily } from '$lib/server/models/GpuFamily';
import { Manufacturer } from '$lib/server/models/Manufacturer';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    // 1. Параметри
    const search = url.searchParams.get('search') || undefined;
    const manufacturerId = url.searchParams.get('manufacturer') ? Number(url.searchParams.get('manufacturer')) : undefined;

    // Сортування
    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    // 2. Отримання даних
    const families = await GpuFamily.findWithFilters(search, manufacturerId, sortBy, sortDir);

    // 3. Отримання списку всіх виробників для випадаючого списку
    const manufacturers = await Manufacturer.findAll();

    return {
        families: families.map(f => f.toJSON()),
        manufacturers: manufacturers.map(m => m.toJSON()),
        filters: {
            search,
            manufacturer: manufacturerId,
            sort: sortBy || 'name',
            order: sortDir || 'asc'
        }
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const fd = await request.formData();
        try {
            const newFamily = new GpuFamily({
                name: fd.get('name') as string,
                manufacturer_id: Number(fd.get('manufacturer_id')) // Беремо ID
            });
            await newFamily.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    update: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('gpu_family_id'));
        try {
            const family = new GpuFamily({
                gpu_family_id: id,
                name: fd.get('name') as string,
                manufacturer_id: Number(fd.get('manufacturer_id')) // Беремо ID
            });
            await family.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    delete: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('id'));
        try {
            const family = await GpuFamily.findById(id);
            if (family) await family.delete();
            return { success: true };
        } catch (error: any) {
            if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
                return fail(400, { error: "Cannot delete this Family because it has associated GPU Series." });
            }
            return fail(500, { error: error.message });
        }
    }
};