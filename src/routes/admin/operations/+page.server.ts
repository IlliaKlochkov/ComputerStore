import { Operation } from '$lib/server/models/Operation';
import { User } from '$lib/server/models/User';
import { Videocard } from '$lib/server/models/Videocard';
import { runDBCommand } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

// Статичні типи операцій
const OPERATION_TYPES = [
    { id: 1, name: 'Purchase' },
    { id: 2, name: 'Restock' },
    { id: 3, name: 'Return' }
];

export const load: PageServerLoad = async ({ url }) => {
    const search = url.searchParams.get('search') || undefined;
    const type = url.searchParams.get('type') || undefined; // String
    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    const operations = await Operation.findWithFilters({ search, type, sortBy, sortDir });
    const users = await User.findWithFilters({});
    const videocards = await Videocard.findAll();

    return {
        operations: operations.map(o => o.toJSON()),
        types: OPERATION_TYPES.map(t => ({...t, value: t.name})), // Для select
        users: users.map(u => u.toJSON()),
        videocards: videocards.map(v => v.toJSON()),
        filters: {
            search,
            type: type,
            sort: sortBy || 'operation_id',
            order: sortDir || 'desc'
        }
    };
};

// Валідація повернення (по рядкам)
async function validateReturn(userId: number, cardId: number, returnQty: number, excludeOpId: number | null = null) {
    // 1. Рахуємо покупки (Purchase)
    let sqlSale = 'SELECT SUM(quantity) as total FROM operation WHERE user_id = ? AND videocard_id = ? AND operation_type = ?';
    const paramsSale = [userId, cardId, 'Purchase'];

    if (excludeOpId) {
        sqlSale += ' AND operation_id != ?';
        paramsSale.push(excludeOpId);
    }

    const resSale = await runDBCommand(sqlSale, paramsSale) as any[];
    const totalBought = Number(resSale[0]?.total || 0);

    if (totalBought === 0) {
        return "User has never purchased this item.";
    }

    // 2. Рахуємо повернення (Return)
    let sqlReturn = 'SELECT SUM(quantity) as total FROM operation WHERE user_id = ? AND videocard_id = ? AND operation_type = ?';
    const paramsReturn = [userId, cardId, 'Return'];

    if (excludeOpId) {
        sqlReturn += ' AND operation_id != ?';
        paramsReturn.push(excludeOpId);
    }

    const resReturn = await runDBCommand(sqlReturn, paramsReturn) as any[];
    const totalReturned = Number(resReturn[0]?.total || 0);

    // 3. Баланс
    const availableToReturn = totalBought - totalReturned;

    if (returnQty > availableToReturn) {
        return `Cannot return ${returnQty}. Max returnable: ${availableToReturn}.`;
    }

    return null;
}

export const actions: Actions = {
    create: async ({ request }) => {
        const fd = await request.formData();

        const userId = Number(fd.get('user_id'));
        const typeName = fd.get('operation_type') as string; // String value
        const cardId = Number(fd.get('videocard_id'));
        const qty = Number(fd.get('quantity'));

        if (qty <= 0) return fail(400, { error: "Quantity must be positive" });

        // Знаходимо ID для бази даних (хоча логіка на рядках, поле в БД NOT NULL)
        const typeObj = OPERATION_TYPES.find(t => t.name === typeName);
        const typeId = typeObj ? typeObj.id : 0;

        try {
            // --- ПЕРЕВІРКА ПОВЕРНЕННЯ ---
            if (typeName === 'Return') {
                const error = await validateReturn(userId, cardId, qty);
                if (error) return fail(400, { error });
            }

            // 1. Створюємо операцію
            const op = new Operation({
                user_id: userId,
                // operation_type_id: typeId, // видаляємо цей рядок
                operation_type: typeName as any, // TypeScript може сваритися на string, тому 'as any' або 'as OperationTypeEnum'
                videocard_id: cardId,
                quantity: qty
            });
            await op.save();

            // 2. ОНОВЛЮЄМО СКЛАД
            const card = await Videocard.findById(cardId);
            if (card) {
                if (typeName === 'Restock' || typeName === 'Return') {
                    // +
                    await runDBCommand('UPDATE videocard SET quantity = quantity + ? WHERE videocard_id = ?', [qty, cardId]);
                } else if (typeName === 'Purchase') {
                    // -
                    if (card.quantity < qty) {
                        return fail(400, { error: `Not enough items in stock! Current: ${card.quantity}` });
                    }
                    await runDBCommand('UPDATE videocard SET quantity = quantity - ? WHERE videocard_id = ?', [qty, cardId]);
                }
            }

            return { success: true };
        } catch (error: any) {
            return fail(500, { error: error.message });
        }
    },

    update: async ({ request }) => {
        const fd = await request.formData();

        const id = Number(fd.get('operation_id'));
        const userId = Number(fd.get('user_id'));
        const typeName = fd.get('operation_type') as string;
        const cardId = Number(fd.get('videocard_id'));
        const qty = Number(fd.get('quantity'));

        if (qty <= 0) return fail(400, { error: "Quantity must be positive" });

        const typeObj = OPERATION_TYPES.find(t => t.name === typeName);
        const typeId = typeObj ? typeObj.id : 0;

        try {
            // --- ПЕРЕВІРКА ПОВЕРНЕННЯ ---
            if (typeName === 'Return') {
                const error = await validateReturn(userId, cardId, qty, id);
                if (error) return fail(400, { error });
            }

            // 1. Стара операція
            const oldOps = await runDBCommand('SELECT * FROM operation WHERE operation_id = ?', [id]) as any[];
            if (!oldOps.length) return fail(404, { error: "Operation not found" });
            const oldOp = oldOps[0];

            // 2. ВІДКАТ
            if (oldOp.operation_type === 'Restock' || oldOp.operation_type === 'Return') {
                await runDBCommand('UPDATE videocard SET quantity = quantity - ? WHERE videocard_id = ?', [oldOp.quantity, oldOp.videocard_id]);
            } else if (oldOp.operation_type === 'Purchase') {
                await runDBCommand('UPDATE videocard SET quantity = quantity + ? WHERE videocard_id = ?', [oldOp.quantity, oldOp.videocard_id]);
            }

            // 3. НОВЕ ЗАСТОСУВАННЯ
            if (typeName === 'Purchase') {
                const cardRes = await runDBCommand('SELECT quantity FROM videocard WHERE videocard_id = ?', [cardId]) as any[];
                const currentStock = cardRes[0]?.quantity || 0;
                if (currentStock < qty) {
                    return fail(400, { error: `Not enough items in stock! Available: ${currentStock}` });
                }
                await runDBCommand('UPDATE videocard SET quantity = quantity - ? WHERE videocard_id = ?', [qty, cardId]);
            } else if (typeName === 'Restock' || typeName === 'Return') {
                await runDBCommand('UPDATE videocard SET quantity = quantity + ? WHERE videocard_id = ?', [qty, cardId]);
            }

            // 4. Оновлення
            const op = new Operation({
                operation_id: id,
                user_id: userId,
                operation_type: typeName as any,
                videocard_id: cardId,
                quantity: qty
            });
            await op.save();

            return { success: true };
        } catch (error: any) {
            return fail(500, { error: error.message });
        }
    },

    delete: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('id'));
        try {
            // Відкат складу
            const oldOps = await runDBCommand('SELECT * FROM operation WHERE operation_id = ?', [id]) as any[];
            if (oldOps.length) {
                const oldOp = oldOps[0];
                if (oldOp.operation_type === 'Restock' || oldOp.operation_type === 'Return') {
                    await runDBCommand('UPDATE videocard SET quantity = quantity - ? WHERE videocard_id = ?', [oldOp.quantity, oldOp.videocard_id]);
                } else if (oldOp.operation_type === 'Purchase') {
                    await runDBCommand('UPDATE videocard SET quantity = quantity + ? WHERE videocard_id = ?', [oldOp.quantity, oldOp.videocard_id]);
                }
            }

            await runDBCommand('DELETE FROM operation WHERE operation_id=?', [id]);
            return { success: true };
        } catch (error: any) {
            return fail(500, { error: error.message });
        }
    }
};