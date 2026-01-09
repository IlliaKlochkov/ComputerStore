<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterConfig } from "$lib/types/filter";

    let { data } = $props();
    let crudComponent: CrudPage;

    // --- ФІЛЬТРИ ---
    const filterConfig: FilterConfig[] = [
        { key: 'search', label: 'Search Name', type: 'text', placeholder: 'e.g. GDDR6X' },

        { key: 'min_bus', label: 'Min Bus Width (bit)', type: 'number' },
        { key: 'max_bus', label: 'Max Bus Width (bit)', type: 'number' },

        { key: 'min_clock', label: 'Min Clock (MHz)', type: 'number' },
        { key: 'max_clock', label: 'Max Clock (MHz)', type: 'number' },
    ];

    // --- ТАБЛИЦЯ ---
    const tableConfig: FieldConfig[] = [
        { key: 'memory_type_id', label: 'ID', type: 'hidden', hideInTable: true },

        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. GDDR6' },

        { key: 'bandwidth', label: 'Bandwidth GB/S', type: 'number', required: true, placeholder: '936', attributes: { min: 1 }},

        { key: 'bus_width_bit', label: 'Bus Width (bit)', type: 'number', required: true, attributes: { min: 1 } },

        { key: 'vram_clock_speed_mhz', label: 'Clock Speed (MHz)', type: 'number', required: true, attributes: { min: 1 } }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Memory Types</h1>
        <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total items: <span class="font-bold text-gray-900">{data.memoryTypes.length}</span>
        </div>
    </div>

    <FilterBar
            filters={filterConfig}
            values={data.filters}
            onCreate={() => crudComponent.openCreate()}
    />

    <CrudPage
            bind:this={crudComponent}
            items={data.memoryTypes}
            fields={tableConfig}
            entityName="Memory Type"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>