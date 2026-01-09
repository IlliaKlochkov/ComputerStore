<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterConfig } from "$lib/types/filter";

    let { data } = $props();
    let crudComponent: CrudPage;

    // --- ФІЛЬТРИ ---
    const filterConfig: FilterConfig[] = [
        { key: 'search', label: 'Search Name', type: 'text', placeholder: 'e.g. Asus' },
        {
            key: 'country',
            label: 'Country',
            type: 'select',
            options: [
                { value: '', name: 'All Countries' },
                ...(data.countries ? data.countries.map(c => ({ value: c, name: c })) : [])
            ]
        }
    ];

    // --- ТАБЛИЦЯ ---
    const tableConfig: FieldConfig[] = [
        { key: 'manufacturer_id', label: 'ID', type: 'hidden', hideInTable: true },

        {
            key: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            placeholder: 'Company Name',
            attributes: { minlength: 2 }
        },

        {
            key: 'country_of_origin',
            label: 'Country',
            type: 'text',
            required: true,
            placeholder: 'e.g. Taiwan',
            attributes: { minlength: 2 }
        },

        {
            key: 'website_url',
            label: 'Website',
            type: 'text',
            placeholder: 'https://...',
            attributes: { type: 'url' }
        }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Manufacturers</h1>
        <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total items: <span class="font-bold text-gray-900">{data.manufacturers.length}</span>
        </div>
    </div>

    <FilterBar
            filters={filterConfig}
            values={data.filters}
            onCreate={() => crudComponent.openCreate()}
    />

    <CrudPage
            bind:this={crudComponent}
            items={data.manufacturers}
            fields={tableConfig}
            entityName="Manufacturer"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>