<script lang="ts">
    import CrudPage from "$lib/components/CrudPage.svelte";
    import FilterBar from "$lib/components/FilterBar.svelte";
    import { Button } from "flowbite-svelte";
    import { PrinterOutline } from "flowbite-svelte-icons";
    import type { FieldConfig } from "$lib/types/crud";
    import type { FilterConfig } from "$lib/types/filter";

    let { data } = $props();
    let crudComponent: CrudPage;
    let receiptOp = $state<any>(null);

    const formattedDate = new Date().toLocaleString('uk-UA', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    function printReceipt(op: any) {
        receiptOp = op;
        setTimeout(() => {
            window.print();
        }, 100);
    }

    // --- Логіка для заголовків чека ---
    function getReceiptTitle(type: string) {
        switch (type) {
            case 'Purchase': return 'Sales Receipt';
            case 'Return': return 'Return Receipt';
            case 'Restock': return 'Stock Entry';
            default: return 'Operation Receipt';
        }
    }

    function getUserLabel(type: string) {
        switch (type) {
            case 'Restock': return 'Processed By'; // Для поповнення це співробітник
            default: return 'Customer'; // Для покупок/повернень це клієнт
        }
    }

    function getTotalLabel(type: string) {
        switch (type) {
            case 'Return': return 'Refund Total';
            case 'Restock': return 'Total Value';
            default: return 'Total';
        }
    }
    // ----------------------------------

    const filterConfig: FilterConfig[] = [
        { key: 'search', label: 'Search User/GPU', type: 'text', placeholder: 'Name...' },
        {
            key: 'type',
            label: 'Operation Type',
            type: 'select',
            options: [
                { value: '', name: 'All Types' },
                ...(data.types ? data.types.map(t => ({ value: t.name, name: t.name })) : [])
            ]
        }
    ];

    const tableConfig: FieldConfig[] = [
        { key: 'operation_id', label: 'ID', type: 'hidden', hideInTable: false },
        {
            key: 'user_id',
            label: 'User',
            type: 'select',
            required: true,
            options: data.users.map(u => ({ value: u.user_id!, name: `${u.full_name} (${u.email})` })),
            format: (val) => data.users.find(u => u.user_id === val)?.full_name || val
        },
        {
            key: 'operation_type', // String field
            label: 'Type',
            type: 'select',
            required: true,
            options: data.types.map(t => ({ value: t.name, name: t.name })),
            format: (val) => val
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

<svelte:head>
    <style>
        @media print {
            @page {
                margin: 0 !important;
                size: auto !important;
            }
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: 100% !important;
                width: 100% !important;
                overflow: visible !important;
                background: white !important;
            }
            nav, aside, header, footer, .no-print, button, .flex.items-center.justify-between {
                display: none !important;
            }
            div[style*="display: contents"] {
                display: block !important;
            }
        }
    </style>
</svelte:head>

<div class="flex flex-col mx-auto p-4 gap-6 container print:hidden">
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
    >
        {#snippet extraActions(row)}
            <Button color="light" size="xs" onclick={() => printReceipt(row)} class="mr-2">
                <PrinterOutline class="w-4 h-4" />
            </Button>
        {/snippet}
    </CrudPage>
</div>

{#if receiptOp}
    <div class="hidden print:flex fixed top-0 left-0 w-full h-full bg-white z-[9999] flex-col items-center justify-start p-10 text-black">
        <div class="border-b-2 border-black pb-4 mb-6 w-full text-center">
            <h1 class="text-3xl font-bold uppercase">{getReceiptTitle(receiptOp.operation_type)}</h1>
            <p class="text-sm text-gray-600">GPU Store Inc.</p>
        </div>

        <div class="w-full max-w-lg space-y-3 mb-8 font-mono text-sm">
            <div class="flex justify-between border-b border-gray-300 pb-1">
                <span class="font-bold">Date:</span>
                <span>{formattedDate}</span>
            </div>
            <div class="flex justify-between border-b border-gray-300 pb-1">
                <span class="font-bold">Order ID:</span>
                <span>#{receiptOp.operation_id}</span>
            </div>
            <div class="flex justify-between border-b border-gray-300 pb-1">
                <span class="font-bold">{getUserLabel(receiptOp.operation_type)}:</span>
                <span>{receiptOp.user_name}</span>
            </div>
            <div class="flex justify-between border-b border-gray-300 pb-1">
                <span class="font-bold">Type:</span>
                <span>{receiptOp.operation_type}</span>
            </div>
        </div>

        <table class="w-full max-w-lg text-left mb-8 font-mono text-sm">
            <thead class="border-b-2 border-black">
            <tr>
                <th class="py-2">Item</th>
                <th class="py-2 text-center">Qty</th>
                <th class="py-2 text-right">Price</th>
                <th class="py-2 text-right">{getTotalLabel(receiptOp.operation_type)}</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td class="py-2">{receiptOp.videocard_name}</td>
                <td class="py-2 text-center">{receiptOp.quantity}</td>
                <td class="py-2 text-right">${receiptOp.price || 'N/A'}</td>
                <td class="py-2 text-right font-bold">${(receiptOp.price || 0) * receiptOp.quantity}</td>
            </tr>
            </tbody>
        </table>

        <div class="text-center text-xs w-full border-t border-gray-300">
            <p class="mb-1 text-gray-500">Generated at {formattedDate}</p>
            {#if receiptOp.operation_type === 'Return'}
                <p class="mt-2 font-bold uppercase border-2 border-black inline-block px-2 py-1">Refund Approved</p>
            {/if}
        </div>
    </div>
{/if}