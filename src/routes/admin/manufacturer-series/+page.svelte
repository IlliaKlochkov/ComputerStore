<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterConfig } from "$lib/types/filter";

    let { data } = $props();
    let crudComponent: CrudPage;

    // --- ФІЛЬТРИ ---
    const filterConfig: FilterConfig[] = [
        { key: 'search', label: 'Search Series', type: 'text', placeholder: 'e.g. ROG Strix' },
        {
            key: 'manufacturer',
            label: 'Manufacturer',
            type: 'select',
            options: [
                { value: '', name: 'All Manufacturers' },
                ...(data.manufacturers ? data.manufacturers.map(m => ({ value: m.manufacturer_id!, name: m.name })) : [])
            ]
        }
    ];

    // --- ТАБЛИЦЯ ---
    const tableConfig: FieldConfig[] = [
        // Прихований ID (зверніть увагу на ключ з одруківкою, як в моделі/БД)
        { key: 'manufacturer_series_id', label: 'ID', type: 'hidden', hideInTable: true },

        { key: 'series_name', label: 'Series Name', type: 'text', required: true, placeholder: 'e.g. Gaming X Trio' },

        {
            key: 'manufacturer_id',
            label: 'Manufacturer',
            type: 'select',
            required: true,
            // Опції для форми редагування
            options: data.manufacturers ? data.manufacturers.map(m => ({ value: m.manufacturer_id!, name: m.name })) : [],
            // Форматер для таблиці (ID -> Name)
            format: (val) => data.manufacturers?.find(m => m.manufacturer_id === val)?.name || val
        }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Manufacturer Series</h1>
        <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total items: <span class="font-bold text-gray-900">{data.seriesList.length}</span>
        </div>
    </div>

    <FilterBar
            filters={filterConfig}
            values={data.filters}
            onCreate={() => crudComponent.openCreate()}
    />

    <CrudPage
            bind:this={crudComponent}
            items={data.seriesList}
            fields={tableConfig}
            entityName="Series"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>