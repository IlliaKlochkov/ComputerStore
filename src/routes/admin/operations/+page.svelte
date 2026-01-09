<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterConfig } from "$lib/types/filter";

    let { data } = $props();
    let crudComponent: CrudPage;

    // --- ФІЛЬТРИ ---
    const filterConfig: FilterConfig[] = [
        { key: 'search', label: 'Search User/GPU', type: 'text', placeholder: 'Name...' },
        {
            key: 'type',
            label: 'Operation Type',
            type: 'select',
            options: [
                { value: '', name: 'All Types' },
                ...(data.types ? data.types.map(t => ({ value: t.operation_type_id!, name: t.name })) : [])
            ]
        }
    ];

    // --- ТАБЛИЦЯ ---
    const tableConfig: FieldConfig[] = [
        { key: 'operation_id', label: 'ID', type: 'hidden', hideInTable: false }, // Покажемо ID як номер накладної

        {
            key: 'user_id',
            label: 'User',
            type: 'select',
            required: true,
            options: data.users.map(u => ({ value: u.user_id!, name: `${u.full_name} (${u.email})` })),
            format: (val) => data.users.find(u => u.user_id === val)?.full_name || val
        },

        {
            key: 'operation_type_id',
            label: 'Type',
            type: 'select',
            required: true,
            options: data.types.map(t => ({ value: t.operation_type_id!, name: t.name })),
            format: (val) => data.types.find(t => t.operation_type_id === val)?.name || val
        },

        {
            key: 'videocard_id',
            label: 'Videocard',
            type: 'select',
            required: true,
            options: data.videocards.map(v => ({ value: v.videocard_id!, name: `${v.sku} ($${v.price})` })),
            format: (val) => data.videocards.find(v => v.videocard_id === val)?.sku || val
        },

        { key: 'quantity', label: 'Qty', type: 'number', required: true, attributes: { min: 1 } }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Operations Log</h1>
        <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total records: <span class="font-bold text-gray-900">{data.operations.length}</span>
        </div>
    </div>

    <FilterBar
            filters={filterConfig}
            values={data.filters}
            onCreate={() => crudComponent.openCreate()}
    />

    <CrudPage
            bind:this={crudComponent}
            items={data.operations}
            fields={tableConfig}
            entityName="Operation"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>