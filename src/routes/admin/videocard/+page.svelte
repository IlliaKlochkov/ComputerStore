<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterItem } from "$lib/types/filter";

    let { data } = $props();
    let crudComponent: CrudPage;

    // Мапи для відображення
    const gpuMap = new Map(data.gpus.map(g => [g.gpu_id, g.name]));
    const seriesMap = new Map(data.series.map(s => [s.manufacturer_series_id, s.series_name]));
    const memTypeMap = new Map(data.memoryTypes.map(m => [m.memory_type_id, m.name]));
    const manufacturerMap = new Map(data.manufacturers.map(m => [m.manufacturer_id, m.name]));

    const filterConfig: FilterItem[] = [
        { key: 'search', label: 'Search Model', type: 'text', placeholder: 'e.g. Gaming OC' },

        // --- 1. GPU Family ---
        {
            key: 'gpu_family_id',
            label: 'GPU Family',
            type: 'select',
            options: [
                { value: '', name: 'All GPU Families' },
                ...(data.gpuFamilies ? data.gpuFamilies.map(f => ({ value: f.gpu_family_id, name: f.name })) : [])
            ]
        },

        // --- 2. GPU Chip ---
        {
            key: 'gpu_id',
            label: 'GPU Chip',
            type: 'select',
            options: [{ value: '', name: 'All GPUs' }, ...data.gpus.map(g => ({ value: g.gpu_id, name: g.name }))]
        },

        // 3. Виробник
        {
            key: 'manufacturer_id',
            label: 'Manufacturer',
            type: 'select',
            options: [
                { value: '', name: 'All Manufacturers' },
                ...data.manufacturers.map(m => ({ value: m.manufacturer_id, name: m.name }))
            ]
        },

        // 4. Серія (Залежить від виробника)
        {
            key: 'manufacturer_series_id',
            label: 'Series',
            type: 'select',
            options: [
                { value: '', name: 'All Series', man_id: 0 },
                ...data.series.map(s => ({
                    value: s.manufacturer_series_id,
                    name: s.series_name,
                    man_id: s.manufacturer_id
                }))
            ],
            dependentKey: 'manufacturer_id',
            filterOptions: (options, parentVal) => {
                if (!parentVal) return options;
                return options.filter(opt => !opt.man_id || opt.man_id == parentVal || opt.value === '');
            }
        },

        {
            type: 'group',
            label: 'Memory',
            children: [
                {
                    key: 'memory_type_id',
                    label: 'Type',
                    type: 'select',
                    options: [{ value: '', name: 'Any Type' }, ...data.memoryTypes.map(m => ({ value: m.memory_type_id, name: m.name }))]
                },
                { key: 'min_memory', label: 'Min Size (GB)', type: 'number', placeholder: '4' },
                { key: 'max_memory', label: 'Max Size (GB)', type: 'number', placeholder: '24' },
            ]
        },
        {
            type: 'group',
            label: 'Price Range ($)',
            children: [
                { key: 'min_price', label: 'Min', type: 'number', placeholder: '0' },
                { key: 'max_price', label: 'Max', type: 'number', placeholder: '5000' },
            ]
        },
        {
            type: 'group',
            label: 'Specs',
            children: [
                { key: 'min_psu', label: 'Min PSU (W)', type: 'number', placeholder: '600' },
                { key: 'max_length', label: 'Max Length (mm)', type: 'number', placeholder: '320' },
                { key: 'color', label: 'Color', type: 'text', placeholder: 'White...' },
            ]
        },
        {
            key: 'rgb',
            label: 'RGB Illumination',
            type: 'select',
            options: [{ value: '', name: 'Any' }, { value: '1', name: 'Yes' }, { value: '0', name: 'No' }]
        },
        {
            key: 'in_stock',
            label: 'Availability',
            type: 'select',
            options: [{ value: '', name: 'Show All' }, { value: '1', name: 'In Stock Only' }]
        },
        {
            type: 'group',
            label: 'Mininimal Max Resolution',
            children: [
                { key: 'min_res_x', label: 'Width (px)', type: 'number', placeholder: '7680' },
                { key: 'min_res_y', label: 'Height (px)', type: 'number', placeholder: '4320' }
            ]
        },
    ];

    const fields: FieldConfig[] = [
        { key: 'videocard_id', label: 'ID', type: 'hidden', hideInTable: true },

        {
            key: 'manufacturer_id',
            label: 'Manufacturer',
            type: 'select',
            required: true,
            hideInTable: false,
            options: data.manufacturers.map(m => ({ value: m.manufacturer_id, name: m.name })),
            format: (val) => manufacturerMap.get(val) || val
        },

        {
            key: 'manufacturer_series_id',
            label: 'Series',
            type: 'select',
            required: true,
            options: data.series.map(s => ({
                value: s.manufacturer_series_id,
                name: s.series_name,
                man_id: s.manufacturer_id
            })),
            format: (val) => seriesMap.get(val) || val,
            dependentKey: 'manufacturer_id',
            filterOptions: (options, parentVal) => {
                if (!parentVal) return [];
                return options.filter(opt => opt.man_id == parentVal);
            }
        },

        { key: 'sku', label: 'Model Name', type: 'text', required: true, placeholder: 'e.g. Gaming OC' },
        {
            key: 'gpu_id',
            label: 'GPU',
            type: 'select',
            required: true,
            options: data.gpus.map(g => ({ value: g.gpu_id, name: g.name })),
            format: (val) => gpuMap.get(val) || val
        },
        {
            key: 'memory_type_id',
            label: 'Memory Type',
            type: 'select',
            required: true,
            options: data.memoryTypes.map(m => ({ value: m.memory_type_id, name: m.name })),
            format: (val) => memTypeMap.get(val) || val
        },
        { key: 'memory_size', label: 'Size (GB)', type: 'number', required: true, attributes: { min: 1 } },
        { key: 'color', label: 'Color', type: 'text' },
        { key: 'has_illumination', label: 'RGB', type: 'checkbox', format: (val) => val ? 'Yes' : 'No' },
        { key: 'recommended_psu_wattage', label: 'PSU (W)', type: 'number', attributes: { min: 0, step: 50 } },
        {
            key: 'max_resolution_x',
            label: 'Max Res X',
            type: 'number',
            required: false,
            placeholder: '7680',
            attributes: { min: 0 }
        },
        {
            key: 'max_resolution_y',
            label: 'Max Res Y',
            type: 'number',
            required: false,
            placeholder: '4320',
            attributes: { min: 0 }
        },
        { key: 'length_mm', label: 'Length (mm)', type: 'number',  attributes: {min: 1} },
        { key: 'quantity', label: 'Qty', type: 'number', attributes: { min: 0 } },
        { key: 'price', label: 'Price', type: 'number', required: true, format: (val) => `$${val}`, attributes: { min: 0, step: 0.01 } }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Videocards</h1>
        <span class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total: <b>{data.videocards.length}</b>
        </span>
    </div>

    <FilterBar
            filters={filterConfig}
            values={data.filters}
            onCreate={() => crudComponent.openCreate()}
    />

    <CrudPage
            bind:this={crudComponent}
            items={data.videocards}
            fields={fields}
            entityName="Videocard"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>