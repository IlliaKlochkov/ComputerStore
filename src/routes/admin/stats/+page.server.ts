import { runDBCommand } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // 1. Загальна статистика склад (SUM, COUNT)
    const summaryStats = await runDBCommand(`
        SELECT
            SUM(quantity) as total_items,
            SUM(price * quantity) as total_value_usd,
            COUNT(*) as unique_models
        FROM videocard
    `);

    // 2. Статистика по Виробниках (COUNT, SUM, GROUP BY)
    const manufacturerStats = await runDBCommand(`
        SELECT
            m.name,
            COUNT(v.videocard_id) as model_count,
            SUM(v.quantity) as total_quantity
        FROM videocard v
                 JOIN manufacturer_series ms ON v.manufacturer_series_id = ms.manufacturer_series_id
                 JOIN manufacturer m ON ms.manufacturer_id = m.manufacturer_id
        GROUP BY m.manufacturer_id, m.name
        ORDER BY total_quantity DESC
    `);

    // 3. Найдорожча модель (MAX + підзапит)
    const expensiveCards = await runDBCommand(`
        SELECT sku, price, quantity 
        FROM videocard 
        WHERE price = (SELECT MAX(price) FROM videocard WHERE quantity > 0)
        AND quantity > 0
    `);

    // 4. Статистика по Типу пам'яті (AVG, COUNT, GROUP BY)
    const memoryStats = await runDBCommand(`
        SELECT
            mt.name as memory_name,
            COUNT(v.videocard_id) as model_count,
            AVG(v.price) as avg_price
        FROM videocard v
                 JOIN memory_type mt ON v.memory_type_id = mt.memory_type_id
        WHERE v.quantity > 0
        GROUP BY mt.memory_type_id, mt.name
        ORDER BY avg_price DESC
    `);

    // 5. Звіт по останнім операціям (ВИПРАВЛЕНО)
    // Прибрано JOIN з operation_type, оскільки це тепер текстове поле в таблиці operation
    const operationsReport = await runDBCommand(`
        SELECT
            o.operation_id,
            u.full_name as user_name,
            o.operation_type,
            v.sku as model_name,
            o.quantity
        FROM operation o
                 JOIN user u ON o.user_id = u.user_id
                 JOIN videocard v ON o.videocard_id = v.videocard_id
        ORDER BY o.operation_id DESC
        LIMIT 50
    `);

    // 6. Повний прайс-лист (для друку)
    const priceList = await runDBCommand(`
        SELECT
            v.sku,
            v.price,
            v.quantity,
            m.name as manufacturer
        FROM videocard v
                 JOIN manufacturer_series ms ON v.manufacturer_series_id = ms.manufacturer_series_id
                 JOIN manufacturer m ON ms.manufacturer_id = m.manufacturer_id
        WHERE v.quantity > 0
        ORDER BY m.name ASC, v.price DESC
    `);

    return {
        summary: summaryStats[0],
        byManufacturer: manufacturerStats,
        mostExpensive: expensiveCards,
        byMemory: memoryStats,
        report: operationsReport,
        priceList: priceList
    };
};