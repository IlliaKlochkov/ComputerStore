<script lang="ts">
    import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Button, Badge } from "flowbite-svelte";
    import { ChartPieOutline, CashOutline, ArchiveOutline, FileLinesOutline } from "flowbite-svelte-icons";

    let { data } = $props();
    let reportDate = $state(new Date());

    // Режим друку: 'dashboard' (стандартний) або 'pricelist' (прайс)
    let printMode = $state<'dashboard' | 'pricelist'>('dashboard');

    function printReport(mode: 'dashboard' | 'pricelist') {
        reportDate = new Date();
        printMode = mode; // 1. Перемикаємо режим

        const html = document.documentElement;
        const isDark = html.classList.contains('dark');

        // Тимчасово вимикаємо темну тему для кращого друку
        if (isDark) {
            html.classList.remove('dark');
        }

        // 2. Створюємо функцію очистки
        const cleanup = () => {
            printMode = 'dashboard';
            if (isDark) {
                html.classList.add('dark');
            }
            window.removeEventListener('afterprint', cleanup);
        };
        // 3. Підписуємось на подію завершення друку
        window.addEventListener('afterprint', cleanup);
        // 4. Викликаємо друк
        setTimeout(() => {
            window.print();
        }, 100);
    }
</script>

<div class="flex flex-col gap-6 p-4 mx-auto max-w-7xl min-h-screen">

    <div class="hidden print:block text-center border-b-2 border-gray-300">
        <h1 class="text-3xl font-bold text-black uppercase tracking-wider">
            {printMode === 'pricelist' ? 'Current Price List' : 'Inventory Report'}
        </h1>
    </div>

    <div class="flex items-center justify-between print:hidden">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard & Analytics</h1>
        <div class="flex gap-2">
            <Button color="blue" onclick={() => printReport('pricelist')}>
                <FileLinesOutline class="w-4 h-4 mr-2"/> Print Price List
            </Button>
        </div>
    </div>

    <div class="{printMode === 'pricelist' ? 'hidden' : 'block'}">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4 mb-6">
            <Card class="max-w-none bg-blue-50 dark:bg-blue-900 border-blue-200 print:border print:bg-white print:shadow-none">
                <div class="flex items-center gap-4 px-2">
                    <CashOutline class="w-8 h-8 text-blue-600 dark:text-blue-300 print:text-black"/>
                    <div>
                        <h5 class="text-lg font-bold text-gray-900 dark:text-white print:text-black">Total Inventory Value</h5>
                        <p class="text-2xl font-extrabold text-blue-700 dark:text-blue-200 print:text-black">
                            ${data.summary.total_value_usd ? data.summary.total_value_usd.toLocaleString() : '0'}
                        </p>
                    </div>
                </div>
            </Card>

            <Card class="max-w-none bg-green-50 dark:bg-green-900 border-green-200 print:border print:bg-white print:shadow-none">
                <div class="flex items-center gap-4 px-2">
                    <ArchiveOutline class="w-8 h-8 text-green-600 dark:text-green-300 print:text-black"/>
                    <div>
                        <h5 class="text-lg font-bold text-gray-900 dark:text-white print:text-black">Total Items in Stock</h5>
                        <p class="text-2xl font-extrabold text-green-700 dark:text-green-200 print:text-black">
                            {data.summary.total_items || 0} pcs
                        </p>
                    </div>
                </div>
            </Card>

            <Card class="max-w-none bg-purple-50 dark:bg-purple-900 border-purple-200 print:border print:bg-white print:shadow-none">
                <div class="flex items-center gap-4 px-2">
                    <ChartPieOutline class="w-8 h-8 text-purple-600 dark:text-purple-300 print:text-black"/>
                    <div>
                        <h5 class="text-lg font-bold text-gray-900 dark:text-white print:text-black">Unique Models</h5>
                        <p class="text-2xl font-extrabold text-purple-700 dark:text-purple-200 print:text-black">
                            {data.summary.unique_models}
                        </p>
                    </div>
                </div>
            </Card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-6">

            <div class="space-y-6">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 print:shadow-none print:border print:break-inside-avoid">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white print:text-black">Inventory by Manufacturer</h3>
                    <div class="space-y-4">
                        {#each data.byManufacturer as manuf}
                            <div>
                                <div class="flex justify-between mb-1">
                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 print:text-black">{manuf.name}</span>
                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 print:text-black">{manuf.total_quantity} items</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 print:bg-gray-200">
                                    <div class="bg-blue-600 h-2.5 rounded-full print:bg-black"
                                         style="width: {(data.summary.total_items > 0) ? (manuf.total_quantity / data.summary.total_items) * 100 : 0}%"></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 print:shadow-none print:border print:break-inside-avoid">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white print:text-black">Memory Type Analytics (Avg Price)</h3>
                    <Table striped class="print:border print:border-collapse text-sm">
                        <TableHead>
                            <TableHeadCell class="print:bg-gray-100 print:text-black p-2">Memory</TableHeadCell>
                            <TableHeadCell class="print:bg-gray-100 print:text-black p-2 text-center">Models</TableHeadCell>
                            <TableHeadCell class="print:bg-gray-100 print:text-black p-2 text-right">Avg Price</TableHeadCell>
                        </TableHead>
                        <TableBody>
                            {#each data.byMemory as mem}
                                <TableBodyRow>
                                    <TableBodyCell class="p-2 font-medium text-gray-900 dark:text-white print:text-black">
                                        {mem.memory_name}
                                    </TableBodyCell>
                                    <TableBodyCell class="p-2 text-center print:text-black">{mem.model_count}</TableBodyCell>
                                    <TableBodyCell class="p-2 text-right font-bold text-green-600 dark:text-green-400 print:text-black">
                                        ${Number(mem.avg_price).toFixed(0)}
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/each}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 print:shadow-none print:border print:break-inside-avoid">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white print:text-black">Most Expensive Model(s)</h3>
                    <Table striped class="print:border print:border-collapse">
                        <TableHead>
                            <TableHeadCell class="print:bg-gray-100 print:text-black">Model</TableHeadCell>
                            <TableHeadCell class="print:bg-gray-100 print:text-black">Price</TableHeadCell>
                            <TableHeadCell class="print:bg-gray-100 print:text-black">Qty</TableHeadCell>
                        </TableHead>
                        <TableBody>
                            {#each data.mostExpensive as item}
                                <TableBodyRow>
                                    <TableBodyCell class="font-medium text-gray-900 dark:text-white print:text-black">
                                        {item.sku}
                                    </TableBodyCell>
                                    <TableBodyCell class="print:text-black font-bold">${item.price}</TableBodyCell>
                                    <TableBodyCell class="print:text-black">
                                        <Badge color={item.quantity > 0 ? 'green' : 'red'} class="print:border print:border-gray-400 print:text-black">
                                            {item.quantity}
                                        </Badge>
                                    </TableBodyCell>
                                </TableBodyRow>
                            {/each}
                            {#if data.mostExpensive.length === 0}
                                <TableBodyRow>
                                    <TableBodyCell colspan="3" class="text-center">No items in stock</TableBodyCell>
                                </TableBodyRow>
                            {/if}
                        </TableBody>
                    </Table>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 break-inside-avoid print:shadow-none print:border">
                    <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white print:text-black">Recent Operations</h3>
                    <div class="overflow-x-auto">
                        <Table hoverable class="print:border print:border-collapse text-sm">
                            <TableHead>
                                <TableHeadCell class="print:bg-gray-100 print:text-black p-2">ID</TableHeadCell>
                                <TableHeadCell class="print:bg-gray-100 print:text-black p-2">Type</TableHeadCell>
                                <TableHeadCell class="print:bg-gray-100 print:text-black p-2">Model</TableHeadCell>
                                <TableHeadCell class="print:bg-gray-100 print:text-black p-2 text-right">Qty</TableHeadCell>
                            </TableHead>
                            <TableBody>
                                {#each data.report as op}
                                    <TableBodyRow>
                                        <TableBodyCell class="print:text-black p-2">#{op.operation_id}</TableBodyCell>
                                        <TableBodyCell class="print:text-black p-2">
                                            <span class={op.operation_type === 'Restock' ? 'text-green-600 font-bold' : 'text-indigo-600'}>
                                                {op.operation_type}
                                            </span>
                                        </TableBodyCell>
                                        <TableBodyCell class="print:text-black p-2 truncate max-w-[150px]">{op.model_name}</TableBodyCell>
                                        <TableBodyCell class="font-bold print:text-black p-2 text-right">{op.quantity}</TableBodyCell>
                                    </TableBodyRow>
                                {/each}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="{printMode === 'pricelist' ? 'block' : 'hidden'}">
        <Table striped class="w-full text-sm text-left border border-gray-300">
            <TableHead class="bg-gray-100">
                <TableHeadCell class="border border-gray-300 text-black">Manufacturer</TableHeadCell>
                <TableHeadCell class="border border-gray-300 text-black">Model (SKU)</TableHeadCell>
                <TableHeadCell class="border border-gray-300 text-black">Stock Qty</TableHeadCell>
                <TableHeadCell class="border border-gray-300 text-black text-right">Price (USD)</TableHeadCell>
            </TableHead>
            <TableBody>
                {#each data.priceList as item}
                    <TableBodyRow class="border-b border-gray-300">
                        <TableBodyCell class="border border-gray-300 text-black">{item.manufacturer}</TableBodyCell>
                        <TableBodyCell class="border border-gray-300 text-black font-medium">{item.sku}</TableBodyCell>
                        <TableBodyCell class="border border-gray-300 text-black text-center">{item.quantity}</TableBodyCell>
                        <TableBodyCell class="border border-gray-300 text-black text-right font-bold">${item.price}</TableBodyCell>
                    </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
        <div class="mt-8 text-right text-sm">
            <p class="text-sm text-gray-600">Generated on: {reportDate.toLocaleString('en-GB')}</p>
        </div>
    </div>
</div>

<style>
    @media print {
        @page {
            margin: 0;
            size: auto;
        }

        :global(body) {
            margin: 0;
            padding: 20px;
            background-color: white !important;
            color: black !important;
        }

        :global(nav), :global(aside), :global(header) {
            display: none !important;
        }
    }
</style>