import { MemoryType } from '$lib/server/models/MemoryType';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || undefined;
	const minBus = url.searchParams.get('min_bus') ? Number(url.searchParams.get('min_bus')) : undefined;
	const maxBus = url.searchParams.get('max_bus') ? Number(url.searchParams.get('max_bus')) : undefined;
	const minClock = url.searchParams.get('min_clock') ? Number(url.searchParams.get('min_clock')) : undefined;
	const maxClock = url.searchParams.get('max_clock') ? Number(url.searchParams.get('max_clock')) : undefined;

	// Сортування
	const sortBy = url.searchParams.get('sort') || undefined;
	const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

	const items = await MemoryType.findWithFilters({
		search, minBus, maxBus, minClock, maxClock,
		sortBy, sortDir
	});

	return {
		memoryTypes: items.map(i => i.toJSON()),
		filters: {
			search, min_bus: minBus, max_bus: maxBus, min_clock: minClock, max_clock: maxClock,
			sort: sortBy || 'name',
			order: sortDir || 'asc'
		}
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		try {
			const newType = new MemoryType({
				name: fd.get('name') as string,
				bandwidth: fd.get('bandwidth') as string,
				bus_width_bit: Number(fd.get('bus_width_bit')),
				vram_clock_speed_mhz: Number(fd.get('vram_clock_speed_mhz'))
			});
			await newType.save();
			return { success: true };
		} catch (error: any) {
			return fail(400, { error: error.message });
		}
	},

	update: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('memory_type_id'));
		try {
			const type = new MemoryType({
				memory_type_id: id,
				name: fd.get('name') as string,
				bandwidth: fd.get('bandwidth') as string,
				bus_width_bit: Number(fd.get('bus_width_bit')),
				vram_clock_speed_mhz: Number(fd.get('vram_clock_speed_mhz'))
			});
			await type.save();
			return { success: true };
		} catch (error: any) {
			return fail(400, { error: error.message });
		}
	},

	delete: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		try {
			const type = await MemoryType.findById(id);
			if (type) await type.delete();
			return { success: true };
		} catch (error: any) {
			if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
				return fail(400, { error: "Cannot delete this Memory Type because it is used by some Videocards." });
			}
			return fail(500, { error: error.message });
		}
	}
};