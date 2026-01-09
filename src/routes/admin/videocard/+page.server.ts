import { Videocard } from '$lib/server/models/Videocard';
import { Gpu } from '$lib/server/models/Gpu';
import { ManufacturerSeries } from '$lib/server/models/ManufacturerSeries';
import { Manufacturer } from '$lib/server/models/Manufacturer';
import { GpuFamily } from '$lib/server/models/GpuFamily';
import { MemoryType } from '$lib/server/models/MemoryType';
import { Operation } from '$lib/server/models/Operation';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    // 1. Зчитуємо параметри фільтрації
    const search = url.searchParams.get('search') || undefined;
    const gpuId = url.searchParams.get('gpu_id') ? Number(url.searchParams.get('gpu_id')) : undefined;
    const manufacturerId = url.searchParams.get('manufacturer_id') ? Number(url.searchParams.get('manufacturer_id')) : undefined;

    // --- НОВЕ: Gpu Family ID ---
    const gpuFamilyId = url.searchParams.get('gpu_family_id') ? Number(url.searchParams.get('gpu_family_id')) : undefined;

    const seriesId = url.searchParams.get('manufacturer_series_id') ? Number(url.searchParams.get('manufacturer_series_id')) : undefined;
    const memoryTypeId = url.searchParams.get('memory_type_id') ? Number(url.searchParams.get('memory_type_id')) : undefined;

    let minPrice = url.searchParams.get('min_price') ? Number(url.searchParams.get('min_price')) : undefined;
    let maxPrice = url.searchParams.get('max_price') ? Number(url.searchParams.get('max_price')) : undefined;
    if (minPrice && maxPrice && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];

    let minMemory = url.searchParams.get('min_memory') ? Number(url.searchParams.get('min_memory')) : undefined;
    let maxMemory = url.searchParams.get('max_memory') ? Number(url.searchParams.get('max_memory')) : undefined;
    if (minMemory && maxMemory && minMemory > maxMemory) [minMemory, maxMemory] = [maxMemory, minMemory];

    let minPsu = url.searchParams.get('min_psu') ? Number(url.searchParams.get('min_psu')) : undefined;
    let maxPsu = url.searchParams.get('max_psu') ? Number(url.searchParams.get('max_psu')) : undefined;

    const minResX = url.searchParams.get('min_res_x') ? Number(url.searchParams.get('min_res_x')) : undefined;
    const minResY = url.searchParams.get('min_res_y') ? Number(url.searchParams.get('min_res_y')) : undefined;

    if (minPsu && maxPsu && minPsu > maxPsu) [minPsu, maxPsu] = [maxPsu, minPsu];

    const maxLength = url.searchParams.get('max_length') ? Number(url.searchParams.get('max_length')) : undefined;
    const color = url.searchParams.get('color') || undefined;
    const inStockParam = url.searchParams.get('in_stock');
    const minQuantity = inStockParam === '1' ? 1 : undefined;

    const rgbParam = url.searchParams.get('rgb');
    let hasIllumination: boolean | undefined = undefined;
    if (rgbParam === '1') hasIllumination = true;
    if (rgbParam === '0') hasIllumination = false;

    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    // 2. Виконуємо запит з новим фільтром
    const videocards = await Videocard.findWithFilters({
        search, gpuId, seriesId, manufacturerId,
        gpuFamilyId, // <--- Передаємо у фільтр
        memoryTypeId, minPrice, maxPrice,
        minMemory, maxMemory, minPsu, maxPsu, maxLength, color,
        minQuantity, hasIllumination, sortBy, sortDir, minResX,
        minResY
    });

    // 3. Завантажуємо довідники
    const gpus = await Gpu.findAll();
    const series = await ManufacturerSeries.findAll();
    const memoryTypes = await MemoryType.findAll();
    const manufacturers = await Manufacturer.findAll();
    const gpuFamilies = await GpuFamily.findAll();

    return {
        videocards: videocards.map(v => v.toJSON()),
        gpus: gpus.map(g => g.toJSON()),
        series: series.map(s => s.toJSON()),
        memoryTypes: memoryTypes.map(m => m.toJSON()),
        manufacturers: manufacturers.map(m => m.toJSON()),
        gpuFamilies: gpuFamilies.map(f => f.toJSON()),

        filters: {
            search,
            gpu_id: gpuId,
            manufacturer_id: manufacturerId,
            gpu_family_id: gpuFamilyId,
            manufacturer_series_id: seriesId,
            memory_type_id: memoryTypeId,
            min_price: minPrice,
            max_price: maxPrice,
            min_memory: minMemory,
            max_memory: maxMemory,
            min_psu: minPsu,
            max_psu: maxPsu,
            max_length: maxLength,
            color,
            in_stock: inStockParam,
            min_res_x: minResX,
            min_res_y: minResY,
            rgb: rgbParam,
            sort: sortBy || 'price',
            order: sortDir || 'desc'
        }
    };
};

export const actions: Actions = {
    create: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(cookies.get('userId')); // Отримуємо ID адміна

        const videocard = new Videocard({
            sku: data.get('sku') as string,
            memory_type_id: Number(data.get('memory_type_id')),
            manufacturer_series_id: Number(data.get('manufacturer_series_id')),
            gpu_id: Number(data.get('gpu_id')),
            memory_size: Number(data.get('memory_size')),
            price: Number(data.get('price')),
            width_mm: Number(data.get('width_mm')),
            height_mm: Number(data.get('height_mm')),
            length_mm: Number(data.get('length_mm')),
            recommended_psu_wattage: Number(data.get('recommended_psu_wattage')),
            has_illumination: data.has('has_illumination'),
            color: data.get('color') as string,
            quantity: Number(data.get('quantity')),
            max_resolution_x: Number(data.get('max_resolution_x')),
            max_resolution_y: Number(data.get('max_resolution_y')),
        });

        await videocard.save();

        // --- ЛОГУВАННЯ ОПЕРАЦІЇ (Supply) ---
        if (userId && !isNaN(userId) && videocard.quantity > 0 && videocard.id) {
            try {
                const op = new Operation({
                    user_id: userId,
                    operation_type_id: 1, // 1 = Supply (Поставка)
                    videocard_id: videocard.id,
                    quantity: videocard.quantity
                });
                await op.save();
            } catch (e) {
                console.error("Failed to log create operation:", e);
            }
        }
    },

    update: async ({ request, cookies }) => {
        const data = await request.formData();
        const userId = Number(cookies.get('userId'));
        const id = Number(data.get('videocard_id'));

        const oldCard = await Videocard.findById(id);
        const oldQty = oldCard ? oldCard.quantity : 0;

        const videocard = new Videocard({
            videocard_id: id,
            sku: data.get('sku') as string,
            memory_type_id: Number(data.get('memory_type_id')),
            manufacturer_series_id: Number(data.get('manufacturer_series_id')),
            gpu_id: Number(data.get('gpu_id')),
            memory_size: Number(data.get('memory_size')),
            price: Number(data.get('price')),
            width_mm: Number(data.get('width_mm')),
            height_mm: Number(data.get('height_mm')),
            length_mm: Number(data.get('length_mm')),
            recommended_psu_wattage: Number(data.get('recommended_psu_wattage')),
            has_illumination: data.has('has_illumination'),
            color: data.get('color') as string,
            quantity: Number(data.get('quantity')),
            max_resolution_x: Number(data.get('max_resolution_x')),
            max_resolution_y: Number(data.get('max_resolution_y')),
        });

        await videocard.save();

        // --- ЛОГУВАННЯ ОПЕРАЦІЇ (Зміна залишку) ---
        if (userId && !isNaN(userId)) {
            const newQty = videocard.quantity;
            const diff = newQty - oldQty;

            if (diff !== 0) {
                try {
                    // Якщо додали (+) -> Supply (1), якщо забрали (-) -> Sale/Write-off (2)
                    const typeId = diff > 0 ? 1 : 2;
                    const qty = Math.abs(diff);

                    const op = new Operation({
                        user_id: userId,
                        operation_type_id: typeId,
                        videocard_id: id,
                        quantity: qty
                    });
                    await op.save();
                } catch (e) {
                    console.error("Failed to log update operation:", e);
                }
            }
        }
    },

    delete: async ({ request }) => {
        const data = await request.formData();
        const id = Number(data.get('id'));
        try {
            const videocard = await Videocard.findById(id);
            if (videocard) {
                await videocard.delete();
            }
            return { success: true };
        } catch (error: any) {
            if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
                return fail(400, { error: "Cannot delete this Videocard because it has Operations history (Sales/Supply). Consider setting quantity to 0 instead." });
            }
            return fail(500, { error: error.message });
        }
    }
};