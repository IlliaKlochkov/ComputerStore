<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterItem } from "$lib/types/filter";

    let { data } = $props();

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let crudComponent: CrudPage;
    const filterConfig: FilterItem[] = [
        { key: 'search', label: 'Search Name', type: 'text', placeholder: 'e.g. RTX 4090' },

        // --- 1. GPU Family ---
        {
            key: 'gpu_family_id',
            label: 'GPU Family',
            type: 'select',
            options: [
                { value: '', name: 'All Families' },
                ...(data.families ? data.families.map(f => ({ value: f.gpu_family_id, name: f.name })) : [])
            ]
        },

        // 2. Серія
        {
            key: 'series',
            label: 'GPU Series',
            type: 'select',
            options: [{ value: '', name: 'All Series' }, ...(data.series ? data.series.map(s => ({ value: s.id, name: s.name })) : [])]
        },

        {
            type: 'group',
            label: 'Base Clock (MHz)',
            children: [
                { key: 'min_clock', label: 'Min', type: 'number', placeholder: '0' },
                { key: 'max_clock', label: 'Max', type: 'number', placeholder: '3000' }
            ]
        },
        {
            type: 'group',
            label: 'Boost Clock (MHz)',
            children: [
                { key: 'min_boost', label: 'Min', type: 'number' },
                { key: 'max_boost', label: 'Max', type: 'number' }
            ]
        },

        {
            type: 'group',
            label: 'Release Date',
            children: [
                { key: 'min_date', label: 'From', type: 'date' },
                { key: 'max_date', label: 'To', type: 'date' }
            ]
        },

        {
            key: 'cuda',
            label: 'CUDA Support',
            type: 'select',
            options: [
                { value: '', name: 'Any' },
                { value: '1', name: 'Yes (Supported)' },
                { value: '0', name: 'No (Not Supported)' }
            ]
        },
        { key: 'min_cores', label: 'Min Cuda Cores', type: 'number' }
    ];

    const tableConfig: FieldConfig[] = [
        { key: 'gpu_id', label: 'ID', type: 'hidden', hideInTable: true },
        { key: 'name', label: 'Name', type: 'text', required: true },
        {
            key: 'gpu_series_id', label: 'Series', type: 'select', required: true,
            options: data.series ? data.series.map(s => ({ value: s.id, name: s.name })) : [],
            format: (val) => data.series?.find(s => s.id === val)?.name || val
        },
        { key: 'process_technology_nm', label: 'Process (nm)', type: 'number', required: true, attributes: { min: 1 } },
        { key: 'base_clock_mhz', label: 'Base Clock', type: 'number', required: true, attributes: { min: 1 } },
        { key: 'boost_clock_mhz', label: 'Boost Clock', type: 'number', required: true, attributes: { min: 1 } },
        { key: 'release_date', label: 'Release Date', type: 'date', format: (val) => val ? new Date(val).toLocaleDateString() : '-', attributes: { max: today } },
        { key: 'cuda_support', label: 'CUDA', type: 'checkbox' },
        { key: 'cuda_cores_count', label: 'CUDA Cores', type: 'number', required: false, attributes: { min: 0 } }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">GPU Catalog</h1>
        <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total items: <span class="font-bold text-gray-900">{data.gpu.length}</span>
        </div>
    </div>

    <FilterBar
            filters={filterConfig}
            values={data.filters}
            onCreate={() => crudComponent.openCreate()}
    />

    <CrudPage
            bind:this={crudComponent}
            items={data.gpu}
            fields={tableConfig}
            entityName="GPU"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>