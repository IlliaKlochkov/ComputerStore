<script lang="ts">
    import { Input, Button, Drawer, Label, Select, Badge } from "flowbite-svelte";
    import { FilterOutline, PlusOutline, CloseOutline, SearchOutline } from "flowbite-svelte-icons";
    import { sineIn } from 'svelte/easing';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { FilterConfig, FilterItem } from "$lib/types/filter";

    let { filters = [], values = {}, resetUrl = $page.url.pathname, onCreate } = $props<{
        filters: FilterItem[];
        values: Record<string, any>;
        resetUrl?: string;
        onCreate?: () => void;
    }>();

    let isFilterDrawerOpen = $state(false);
    let transitionParams = { x: 320, duration: 200, easing: sineIn };

    let localValues = $state<Record<string, any>>({ ...values });

    $effect(() => {
        localValues = { ...values };
    });

    const searchFilter = filters.find(f => 'key' in f && (f.key === 'search' || f.type === 'text')) as FilterConfig | undefined;
    const advancedFilters = filters.filter(f => f !== searchFilter);

    let activeFilters = $derived.by(() => {
        const active: { key: string, label: string, value: any }[] = [];

        const checkFilter = (f: FilterConfig) => {
            const val = values[f.key];
            if (val !== undefined && val !== '' && val !== null) {
                let displayValue = val;
                if (f.type === 'select' && f.options) {
                    const option = f.options.find(o => String(o.value) === String(val));
                    if (option) displayValue = option.name;
                }
                active.push({ key: f.key, label: f.label, value: displayValue });
            }
        };

        advancedFilters.forEach(item => {
            if ('type' in item && item.type === 'group') {
                item.children.forEach(child => checkFilter(child));
            } else {
                checkFilter(item as FilterConfig);
            }
        });

        return active;
    });

    function removeFilter(key: string) {
        const newParams = new URLSearchParams($page.url.searchParams);
        newParams.delete(key);
        newParams.delete('page');
        goto(`?${newParams.toString()}`, { keepFocus: true });
    }
</script>

{#snippet renderInput(filter: FilterConfig)}
    <div class="w-full">
        {#if filter.label}
            <Label class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{filter.label}</Label>
        {/if}

        {#if filter.type === 'select'}
            {@const visibleOptions = filter.dependentKey && filter.filterOptions
                ? filter.filterOptions(filter.options || [], localValues[filter.dependentKey])
                : (filter.options || [])}

            <Select
                    name={filter.key}
                    items={visibleOptions}
                    bind:value={localValues[filter.key]}
                    placeholder={filter.placeholder || "Select..."}
                    class="bg-gray-50 border-gray-300"
            />
        {:else if filter.type === 'number'}
            <Input
                    type="number"
                    name={filter.key}
                    bind:value={localValues[filter.key]}
                    placeholder={filter.placeholder}
                    class="bg-gray-50 border-gray-300"
            />
        {:else if filter.type === 'date'}
            <Input
                    type="date"
                    name={filter.key}
                    bind:value={localValues[filter.key]}
                    class="bg-gray-50 border-gray-300"
            />
        {:else if filter.type === 'text'}
            <Input
                    type="text"
                    name={filter.key}
                    bind:value={localValues[filter.key]}
                    placeholder={filter.placeholder}
                    class="bg-gray-50 border-gray-300"
            />
        {/if}
    </div>
{/snippet}

<div class="">
    <div class="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative z-10">
        <div class="w-full">
            <form method="GET" data-sveltekit-keepfocus class="relative">
                {#each advancedFilters as item}
                    {#if 'type' in item && item.type === 'group'}
                        {#each item.children as child}
                            {#if values[child.key]}<input type="hidden" name={child.key} value={values[child.key]} />{/if}
                        {/each}
                    {:else}
                        {#if values[(item as FilterConfig).key]}<input type="hidden" name={(item as FilterConfig).key} value={values[(item as FilterConfig).key]} />{/if}
                    {/if}
                {/each}

                {#if searchFilter}
                    <div class="relative">
                        <Input type="text" name={searchFilter.key} value={values[searchFilter.key]} placeholder={searchFilter.placeholder || "Search..."} class="pl-8">
                            {#snippet left()} <SearchOutline class="h-5 w-5 text-gray-500 dark:text-gray-400" /> {/snippet}
                        </Input>
                    </div>
                {/if}
            </form>
        </div>

        <div class="flex gap-2 w-full sm:w-auto justify-end">
            <Button color="light" class="relative border-gray-300" onclick={() => isFilterDrawerOpen = true}>
                <FilterOutline class="w-4 h-4 mr-2 text-gray-500" /> Filters
                {#if activeFilters.length > 0}
                    <Badge color="blue" class="ml-2 px-1.5 py-0.5 rounded-full text-xs">{activeFilters.length}</Badge>
                {/if}
            </Button>
            {#if onCreate}
                <Button color="green" class="whitespace-nowrap shadow-sm" onclick={onCreate}>
                    <PlusOutline class="w-4 h-4 mr-1.5" /> Add New
                </Button>
            {/if}
        </div>
    </div>

    {#if activeFilters.length > 0}
        <div class="flex flex-wrap gap-2 mt-3 items-center px-1">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Active filters:</span>
            {#each activeFilters as filter (filter.key)}
                <Badge color="indigo" size="sm" class="px-2 py-1 flex items-center gap-1">
                    <span class="font-semibold">{filter.label}:</span> {filter.value}
                    <button type="button" class="ms-1 text-indigo-400 hover:text-indigo-900 focus:outline-none" onclick={() => removeFilter(filter.key)}>
                        <CloseOutline class="w-3 h-3" />
                    </button>
                </Badge>
            {/each}
            <Button href={resetUrl} size="xs" color="light" class="border-0 bg-transparent hover:bg-red-50 text-red-500 hover:text-red-700 p-1">Clear all</Button>
        </div>
    {/if}
</div>

<Drawer bind:open={isFilterDrawerOpen} placement="right" {transitionParams} class="w-80 border-l border-gray-200">
    <div class="flex items-center justify-between mb-6">
        <h5 class="text-base font-semibold text-gray-500 uppercase tracking-wider">Filters</h5>
        <Button color="light" size="xs" class="p-1.5" onclick={() => isFilterDrawerOpen = false}>
            <CloseOutline class="w-4 h-4" />
        </Button>
    </div>

    <form method="GET" data-sveltekit-keepfocus class="flex flex-col h-full">
        {#if searchFilter && values[searchFilter.key]}
            <input type="hidden" name={searchFilter.key} value={values[searchFilter.key]} />
        {/if}

        <div class="space-y-5 flex-1 overflow-y-auto pr-1">
            {#each advancedFilters as item}
                {#if 'type' in item && item.type === 'group'}
                    <div>
                        {#if item.label}
                            <Label class="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</Label>
                        {/if}
                        <div class="flex gap-2">
                            {#each item.children as child}
                                {@render renderInput(child)}
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div>
                        {@render renderInput(item as FilterConfig)}
                    </div>
                {/if}
            {/each}
        </div>

        <div class="mt-8 pt-4 border-t border-gray-200 flex gap-3">
            <Button type="submit" color="blue" class="w-full shadow-md">Apply Filters</Button>
            <Button href={resetUrl} color="light" class="w-auto border-gray-300 hover:text-red-600">Reset</Button>
        </div>
    </form>
</Drawer>