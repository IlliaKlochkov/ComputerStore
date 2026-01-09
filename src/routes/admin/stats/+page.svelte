<script lang="ts">
    import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Button, Badge } from "flowbite-svelte";
    import { PrinterOutline, ChartPieOutline, CashOutline, ArchiveOutline } from "flowbite-svelte-icons";

    let { data } = $props();
    let reportDate = $state(new Date());

    function printReport() {
        reportDate = new Date();
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');

        if (isDark) {
            html.classList.remove('dark');
        }

        setTimeout(() => {
            window.print();
            if (isDark) {
                html.classList.add('dark');
            }
        }, 50);
    }
</script>

<div class="flex flex-col gap-6 p-4 mx-auto max-w-7xl print-content min-h-screen">

    <div class="hidden print:block mb-8 text-center border-b-2 border-gray-300 pb-4">
        <h1 class="text-3xl font-bold text-black uppercase tracking-wider mb-2">Inventory & Operations Report</h1>
    </div>

    <div class="flex items-center justify-between print:hidden">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard & Analytics</h1>
        <Button color="light" onclick={printReport}>
            <PrinterOutline class="w-4 h-4 mr-2"/> Print Report
        </Button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-4">
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
                        {data.summary.total_items} pcs
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

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1 print:block print:space-y-6">
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
            <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white print:text-black">Top 5 Most Expensive Models</h3>
            <Table striped class="print:border print:border-collapse">
                <TableHead>
                    <TableHeadCell class="print:bg-gray-100 print:text-black">Model</TableHeadCell>
                    <TableHeadCell class="print:bg-gray-100 print:text-black">Price</TableHeadCell>
                    <TableHeadCell class="print:bg-gray-100 print:text-black">Qty</TableHeadCell>
                </TableHead>
                <TableBody>
                    {#each data.topExpensive as item}
                        <TableBodyRow>
                            <TableBodyCell class="font-medium text-gray-900 dark:text-white print:text-black">
                                {item.sku}
                            </TableBodyCell>
                            <TableBodyCell class="print:text-black">${item.price}</TableBodyCell>
                            <TableBodyCell class="print:text-black">
                                <Badge color={item.quantity > 0 ? 'green' : 'red'} class="print:border print:border-gray-400 print:text-black">
                                    {item.quantity}
                                </Badge>
                            </TableBodyCell>
                        </TableBodyRow>
                    {/each}
                </TableBody>
            </Table>
        </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 break-inside-avoid print:shadow-none print:border print:mt-6">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white print:text-black">Recent Operations Report</h3>
        <Table hoverable class="print:border print:border-collapse">
            <TableHead>
                <TableHeadCell class="print:bg-gray-100 print:text-black">ID</TableHeadCell>
                <TableHeadCell class="print:bg-gray-100 print:text-black">User</TableHeadCell>
                <TableHeadCell class="print:bg-gray-100 print:text-black">Type</TableHeadCell>
                <TableHeadCell class="print:bg-gray-100 print:text-black">Videocard Model</TableHeadCell>
                <TableHeadCell class="print:bg-gray-100 print:text-black">Quantity</TableHeadCell>
            </TableHead>
            <TableBody>
                {#each data.report as op}
                    <TableBodyRow>
                        <TableBodyCell class="print:text-black">#{op.operation_id}</TableBodyCell>
                        <TableBodyCell class="print:text-black">{op.user_name}</TableBodyCell>
                        <TableBodyCell class="print:text-black">
                            <Badge color={op.operation_type === 'Supply' ? 'green' : 'indigo'} class="print:border print:border-gray-400 print:text-black">
                                {op.operation_type}
                            </Badge>
                        </TableBodyCell>
                        <TableBodyCell class="print:text-black">{op.model_name}</TableBodyCell>
                        <TableBodyCell class="font-bold print:text-black">{op.quantity}</TableBodyCell>
                    </TableBodyRow>
                {/each}
            </TableBody>
        </Table>
    </div>

    <div class="hidden print:block border-t-2 border-gray-300">
        <div class="flex justify-between items-end text-sm text-gray-600">
            <span>© GPU Inventory Management System</span>
            <span class="text-right">
                Report Generated on:<br>
                <span class="font-bold text-black text-lg">{reportDate.toLocaleString('en-GB')}</span>
            </span>
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
            padding: 0;
            background-color: white !important;
        }

        .print-content {
            padding: 20mm !important;
            max-width: none !important;
            width: 100% !important;
            /* Забезпечуємо висоту на весь лист для правильного позиціонування футера */
            min-height: 100vh;
        }

        :global(nav), :global(aside), :global(header) {
            display: none !important;
        }

        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
</style>