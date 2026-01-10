<script lang="ts">
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Button, Drawer, Label, Input, Checkbox, Modal, Select, Alert } from "flowbite-svelte";
    import { EditOutline, TrashBinOutline, ExclamationCircleOutline, ChevronUpOutline, ChevronDownOutline, CloseCircleSolid } from "flowbite-svelte-icons";
    import { enhance, applyAction } from '$app/forms';
    import { page } from '$app/stores';
    import { goto, invalidateAll } from '$app/navigation';
    import type { FieldConfig } from '$lib/types/crud';

    // Додано extraActions до props
    let { items = [], fields = [], entityName = "Item", sort = '', order = 'asc', extraActions } = $props<{
        items: any[],
        fields: FieldConfig[],
        entityName: string,
        sort?: string,
        order?: 'asc' | 'desc' | string,
        extraActions?: any // Snippet
    }>();

    let isDrawerOpen = $state(false);
    let isDeleteModalOpen = $state(false);
    let deleteId = $state<number | string | null>(null);
    let formState = $state<any>({});

    let deleteError = $state<string | null>(null);
    function getEmptyForm() {
        const obj: any = {};
        fields.forEach(f => {
            if (f.type === 'checkbox') obj[f.key] = false;
            else obj[f.key] = '';
        });
        return obj;
    }

    const openDrawer = (row: any = null) => {
        if (row) {
            formState = { ...row };
            fields.forEach(f => {
                if (f.type === 'date' && formState[f.key]) {
                    formState[f.key] = new Date(formState[f.key]).toISOString().split('T')[0];
                }
            });
        } else {
            formState = getEmptyForm();
        }
        isDrawerOpen = true;
    };
    export function openCreate() {
        openDrawer(null);
    }

    const idField = fields.find(f => f.type === 'hidden')?.key || 'id';
    function handleSort(key: string) {
        const url = new URL($page.url);
        if (sort === key) {
            url.searchParams.set('order', order === 'asc' ? 'desc' : 'asc');
        } else {
            url.searchParams.set('sort', key);
            url.searchParams.set('order', 'asc');
        }
        goto(url.toString(), { keepFocus: true });
    }

    function openDeleteModal(id: number | string) {
        deleteId = id;
        deleteError = null;
        isDeleteModalOpen = true;
    }
</script>

<div class="flex flex-col">
    <Table striped shadow>
        <TableHead>
            <TableHeadCell>Actions</TableHeadCell>
            {#each fields.filter(f => !f.hideInTable) as field}
                <TableHeadCell
                        class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none group"
                        onclick={() => handleSort(field.key)}
                >
                    <div class="flex items-center gap-1">
                        {field.label}
                        {#if sort === field.key}
                            {#if order === 'asc'}
                                <ChevronUpOutline class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            {:else}
                                <ChevronDownOutline class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            {/if}
                        {:else}
                             <span class="w-6 h-6 opacity-0 group-hover:opacity-30 transition-opacity">
                                <ChevronUpOutline class="w-6 h-6" />
                             </span>
                        {/if}
                    </div>
                </TableHeadCell>
            {/each}
        </TableHead>
        <TableBody>
            {#each items as row}
                <TableBodyRow>
                    <TableBodyCell>
                        <div class="flex gap-2">
                            {#if extraActions}
                                {@render extraActions(row)}
                            {/if}

                            <Button color="amber" size="xs" onclick={() => openDrawer(row)}><EditOutline class="w-4 h-4" /></Button>
                            <Button color="red" size="xs" onclick={() => openDeleteModal(row[idField])}><TrashBinOutline class="w-4 h-4" /></Button>
                        </div>
                    </TableBodyCell>
                    {#each fields.filter(f => !f.hideInTable) as field}
                        <TableBodyCell>
                            {#if field.type === 'checkbox'}
                                <span class={row[field.key] ? "text-green-500 font-bold" : "text-red-500"}>
                                    {row[field.key] ? 'Yes' : 'No'}
                                </span>
                            {:else if field.format}
                                {field.format(row[field.key])}
                            {:else}
                                {row[field.key]}
                            {/if}
                        </TableBodyCell>
                    {/each}
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>

<Drawer bind:open={isDrawerOpen} placement="right" class="w-full md:w-[400px]">
    <div class="flex justify-between mb-4">
        <h5 class="uppercase font-semibold text-gray-500">{formState[idField] ? 'Edit' : 'New'} {entityName}</h5>
        <Button color="light" size="xs" onclick={() => isDrawerOpen = false}>✕</Button>
    </div>

    {#if $page.form?.error}
        <Alert color="red" class="mb-4">
            <span class="font-medium">Error!</span> {$page.form.error}
        </Alert>
    {/if}

    <form method="POST" action={formState[idField] ? "?/update" : "?/create"} use:enhance={() => async ({ update }) => { await update(); if (!$page.form?.error) isDrawerOpen = false; }} class="space-y-4">
        {#each fields as field}
            {#if field.type === 'hidden'}
                <input type="hidden" name={field.key} value={formState[field.key]} />
            {:else if field.type === 'checkbox'}
                <Checkbox name={field.key} bind:checked={formState[field.key]}>
                    {field.label}
                    {#if field.required}<span class="text-red-500 ml-1">*</span>{/if}
                </Checkbox>
            {:else if field.type === 'select'}
                <Label class="mb-2">
                    {field.label}
                    {#if field.required}<span class="text-red-500 ml-1">*</span>{/if}
                </Label>
                {@const visibleOptions = field.dependentKey && field.filterOptions
                    ? field.filterOptions(field.options || [], formState[field.dependentKey])
                    : (field.options || [])}
                <Select name={field.key} items={visibleOptions} bind:value={formState[field.key]} required={field.required} placeholder="Select..." />
            {:else}
                <div>
                    <Label class="mb-2">
                        {field.label}
                        {#if field.required}<span class="text-red-500 ml-1">*</span>{/if}
                    </Label>
                    <Input type={field.type} name={field.key} bind:value={formState[field.key]} required={field.required} placeholder={field.label} {...field.attributes} />
                </div>
            {/if}
        {/each}
        <Button type="submit" class="w-full" color={formState[idField] ? 'amber' : 'green'}>
            {formState[idField] ? 'Save Changes' : 'Create'}
        </Button>
    </form>
</Drawer>

<Modal bind:open={isDeleteModalOpen} size="xs" autoclose={false}>
    <div class="text-center">
        <ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12" />
        <h3 class="mb-5 text-lg text-gray-500">Delete this {entityName}?</h3>
        {#if deleteError}
            <div class="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-900" role="alert">
                <div class="flex items-center gap-2">
                    <CloseCircleSolid class="w-4 h-4"/>
                    <span class="font-bold">Cannot delete:</span>
                </div>
                <div class="mt-1">{deleteError}</div>
            </div>
        {/if}
        <form method="POST" action="?/delete"
              use:enhance={() => {
                return async ({ result }) => {
                    if (result.type === 'failure') {
                        deleteError = result.data?.error || "Unknown error occurred";
                    } else {
                        isDeleteModalOpen = false;
                        deleteError = null;
                        await applyAction(result);
                        await invalidateAll();
                    }
                };
             }}
              class="inline-flex"
        >
            <input type="hidden" name="id" value={deleteId} />
            <Button color="red" type="submit" class="mr-2">Yes, I'm sure</Button>
        </form>
        <Button color="alternative" onclick={() => isDeleteModalOpen = false}>No, cancel</Button>
    </div>
</Modal>