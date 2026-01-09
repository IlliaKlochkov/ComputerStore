import { runDBCommand } from '$lib/server/db';
import { Gpu } from '$lib/server/models/Gpu';
import { GpuFamily } from '$lib/server/models/GpuFamily';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    // 1. Зчитуємо базові параметри
    const search = url.searchParams.get('search') || undefined;
    const seriesParam = url.searchParams.get('series');
    const seriesId = seriesParam ? Number(seriesParam) : undefined;

    // --- GPU Family ID ---
    const familyParam = url.searchParams.get('gpu_family_id');
    const gpuFamilyId = familyParam ? Number(familyParam) : undefined;

    const coresParam = url.searchParams.get('min_cores');
    const minCores = coresParam ? Number(coresParam) : undefined;
    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    // Частоти
    const minClockParam = url.searchParams.get('min_clock');
    let minClock = minClockParam ? Number(minClockParam) : undefined;
    const maxClockParam = url.searchParams.get('max_clock');
    let maxClock = maxClockParam ? Number(maxClockParam) : undefined;
    if (minClock && maxClock && minClock > maxClock) {
        [minClock, maxClock] = [maxClock, minClock];
    }

    const boostParam = url.searchParams.get('min_boost');
    const minBoostClock = boostParam ? Number(boostParam) : undefined;

    // --- ДАТИ ---
    const minDate = url.searchParams.get('min_date') || undefined;
    const maxDate = url.searchParams.get('max_date') || undefined;

    const cudaParam = url.searchParams.get('cuda');
    let cudaSupport: boolean | undefined = undefined;
    if (cudaParam === '1') cudaSupport = true;
    if (cudaParam === '0') cudaSupport = false;

    // 2. Шукаємо в БД
    const gpuObjects = await Gpu.findWithFilters({
        search,
        seriesId,
        gpuFamilyId,
        minCores,
        minClock,
        maxClock,
        minBoostClock,
        cudaSupport,
        minDate,
        maxDate,
        sortBy,
        sortDir
    });

    // 3. Дані для випадаючих списків
    const series = await runDBCommand('SELECT gpu_series_id AS id, name FROM gpu_series');
    const families = await GpuFamily.findAll();

    return {
        gpu: gpuObjects.map(g => g.toJSON()),
        series,
        families: families.map(f => f.toJSON()),

        filters: {
            search,
            series: seriesId,
            gpu_family_id: gpuFamilyId,
            min_cores: minCores,
            min_clock: minClock,
            max_clock: maxClock,
            min_boost: minBoostClock,
            min_date: minDate, // Повертаємо у FilterBar
            max_date: maxDate, // Повертаємо у FilterBar
            cuda: cudaParam,
            sort: sortBy || 'name',
            order: sortDir || 'asc'
        }
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const fd = await request.formData();
        try {
            const newGpu = new Gpu({
                name: fd.get('name') as string,
                gpu_series_id: Number(fd.get('gpu_series_id')),
                process_technology_nm: Number(fd.get('process_technology_nm')),
                base_clock_mhz: Number(fd.get('base_clock_mhz')),
                boost_clock_mhz: Number(fd.get('boost_clock_mhz')),
                cuda_cores_count: Number(fd.get('cuda_cores_count')),
                cuda_support: fd.has('cuda_support'),
                release_date: fd.get('release_date') as string
            });
            await newGpu.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    update: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('gpu_id'));
        try {
            const updatedGpu = new Gpu({
                gpu_id: id,
                name: fd.get('name') as string,
                gpu_series_id: Number(fd.get('gpu_series_id')),
                process_technology_nm: Number(fd.get('process_technology_nm')),
                base_clock_mhz: Number(fd.get('base_clock_mhz')),
                boost_clock_mhz: Number(fd.get('boost_clock_mhz')),
                cuda_cores_count: Number(fd.get('cuda_cores_count')),
                cuda_support: fd.has('cuda_support'),
                release_date: fd.get('release_date') as string
            });
            await updatedGpu.save();
            return { success: true };
        } catch (error: any) {
            return fail(400, { error: error.message });
        }
    },

    delete: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('id'));
        try {
            const gpu = await Gpu.findById(id);
            if (gpu) await gpu.delete();
            return { success: true };
        } catch (error: any) {
            return fail(500, { error: error.message });
        }
    }
};