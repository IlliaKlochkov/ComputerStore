<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterConfig } from "$lib/types/filter";

    let { data } = $props();
    let crudComponent: CrudPage;
    // --- ФІЛЬТРИ ---
    const filterConfig: FilterConfig[] = [
        { key: 'search', label: 'Search User', type: 'text', placeholder: 'Name or Email...' },
        {
            key: 'role',
            label: 'Role',
            type: 'select',
            options: [
                { value: '', name: 'All Roles' },
                ...(data.roles ? data.roles.map(r => ({ value: r.value, name: r.name })) : [])
            ]
        }
    ];
    // --- ТАБЛИЦЯ ---
    const tableConfig: FieldConfig[] = [
        { key: 'user_id', label: 'ID', type: 'hidden', hideInTable: true },

        { key: 'full_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Ivan Ivanov' },

        {
            key: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            placeholder: 'mail@example.com'
        },

        {
            key: 'password_hash',
            label: 'Password',
            type: 'password',
            required: false,
            hideInTable: true,
            placeholder: 'Leave empty to keep current',
            attributes: { minlength: 6 }
        },

        {
            key: 'phone_number',
            label: 'Phone',
            type: 'text',
            required: false,
            placeholder: '+380XXXXXXXXX',
            attributes: {
                maxlength: 13,
                pattern: "^\\+380\\d{9}$",
                title: "Format: +380XXXXXXXXX",
                oninput: "if(!this.value.startsWith('+380')) this.value = '+380' + this.value.replace(/[^0-9]/g, '').substring(0,9);"
            }
        },

        {
            key: 'role', // Використовуємо поле role (string)
            label: 'Role',
            type: 'select',
            required: true,
            // Мапимо статичні ролі
            options: data.roles ? data.roles.map(r => ({ value: r.value, name: r.name })) : [],
            format: (val) => data.roles?.find(r => r.value === val)?.name || val
        }
    ];
</script>

<div class="flex flex-col mx-auto p-4 gap-6 container">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Total users: <span class="font-bold text-gray-900">{data.users.length}</span>
        </div>
    </div>

    <FilterBar
            filters={filterConfig}
            values={data.filters}
            onCreate={() => crudComponent.openCreate()}
    />

    <CrudPage
            bind:this={crudComponent}
            items={data.users}
            fields={tableConfig}
            entityName="User"
            sort={data.filters.sort}
            order={data.filters.order}
    />
</div>