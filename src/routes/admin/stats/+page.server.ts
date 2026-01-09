import { runDBCommand } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// 1. Загальна статистика складу (Кількість карт та загальна вартість)
	const summaryStats = await runDBCommand(`
        SELECT 
            SUM(quantity) as total_items, 
            SUM(price * quantity) as total_value_usd,
            COUNT(*) as unique_models
        FROM videocard
    `);

	// 2. Статистика по Виробниках (Manufacturer)
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

	// 3. Топ 5 найдорожчих моделей (які є в наявності)
	const expensiveCards = await runDBCommand(`
        SELECT sku, price, quantity 
        FROM videocard 
        WHERE quantity > 0
        ORDER BY price DESC 
        LIMIT 5
    `);

	// 4. Звіт по останнім операціям (Operations Report)
	const operationsReport = await runDBCommand(`
        SELECT 
            o.operation_id,
            u.full_name as user_name,
            ot.name as operation_type,
            v.sku as model_name,
            o.quantity
        FROM operation o
        JOIN user u ON o.user_id = u.user_id
        JOIN operation_type ot ON o.operation_type_id = ot.operation_type_id
        JOIN videocard v ON o.videocard_id = v.videocard_id
        ORDER BY o.operation_id DESC
        LIMIT 50
    `);

	return {
		summary: summaryStats[0],
		byManufacturer: manufacturerStats,
		topExpensive: expensiveCards,
		report: operationsReport
	};
};