<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterConfig } from "$lib/types/filter";

    let { data } = $props();

    let crudComponent: CrudPage;

    // --- ФІЛЬТРИ ---
    const filterConfig: FilterConfig[] = [
        { key: 'search', label: 'Search', type: 'text', placeholder: 'Name, Codename...' },
        {
            key: 'family',
            label: 'GPU Family',
            type: 'select',
            options: [
                { value: '', name: 'All Families' },
                ...(data.families ? data.families.map(f => ({ value: f.gpu_family_id!, name: f.name })) : [])
            ]
        }
    ];

    // --- ТАБЛИЦЯ ТА ФОРМА ---
    const tableConfig: FieldConfig[] = [
        { key: 'gpu_series_id', label: 'ID', type: 'hidden', hideInTable: true },

        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. RTX 40 Series' },

        {
            key: 'gpu_family_id',
            label: 'Family',
            type: 'select',
            required: true,
            // Перетворюємо список сімейств у формат { value, name }
            options: data.families ? data.families.map(f => ({ value: f.gpu_family_id!, name: f.name })) : [],
            // Форматер для відображення назви замість ID в таблиці
            format: (val) => data.families?.find(f => f.gpu_family_id === val)?.name || val
        },

        { key: 'codename', label: 'Codename', type: 'text', placeholder: 'e.g. Ada Lovelace' },
        { key: 'architecture', label: 'Architecture', type: 'text', placeholder: 'e.g. Ada' }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">GPU Series</h1>
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
            entityName="GPU Series"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>