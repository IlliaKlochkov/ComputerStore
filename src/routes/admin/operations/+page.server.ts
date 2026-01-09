import { Operation } from '$lib/server/models/Operation';
import { OperationType } from '$lib/server/models/OperationType';
import { User } from '$lib/server/models/User';
import { Videocard } from '$lib/server/models/Videocard';
import { runDBCommand } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    const search = url.searchParams.get('search') || undefined;
    const typeId = url.searchParams.get('type') ? Number(url.searchParams.get('type')) : undefined;
    const sortBy = url.searchParams.get('sort') || undefined;
    const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

    const operations = await Operation.findWithFilters({ search, typeId, sortBy, sortDir });
    const types = await OperationType.findAll();
    const users = await User.findWithFilters({});
    const videocards = await Videocard.findAll();

    return {
        operations: operations.map(o => o.toJSON()),
        types: types.map(t => t.toJSON()),
        users: users.map(u => u.toJSON()),
        videocards: videocards.map(v => v.toJSON()),
        filters: {
            search,
            type: typeId,
            sort: sortBy || 'operation_id',
            order: sortDir || 'desc'
        }
    };
};

export const actions: Actions = {
    create: async ({ request, cookies }) => {
        const fd = await request.formData();

        const userId = Number(fd.get('user_id'));
        const typeId = Number(fd.get('operation_type_id'));
        const cardId = Number(fd.get('videocard_id'));
        const qty = Number(fd.get('quantity'));

        if (qty <= 0) return fail(400, { error: "Quantity must be positive" });

        try {
            // 1. Створюємо операцію
            const op = new Operation({
                user_id: userId,
                operation_type_id: typeId,
                videocard_id: cardId,
                quantity: qty
            });
            await op.save();

            // 2. АВТОМАТИЧНО ОНОВЛЮЄМО СКЛАД
            // Припускаємо (перевірте ID у вашій БД!):
            // ID 1 = Supply (Поставка) -> Додаємо (+)
            // ID 2 = Sale (Продаж) -> Віднімаємо (-)
            // ID 3 = Return (Повернення) -> Додаємо (+)

            // Отримуємо поточну карту
            const card = await Videocard.findById(cardId);

            if (card) {
                // Логіка оновлення залишків
                if (typeId === 1 || typeId === 3) {
                    // Поставка або Повернення
                    await runDBCommand('UPDATE videocard SET quantity = quantity + ? WHERE videocard_id = ?', [qty, cardId]);
                } else if (typeId === 2) {
                    // Продаж
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

    delete: async ({ request }) => {
        const fd = await request.formData();
        const id = Number(fd.get('id'));
        try {
            const op = new Operation({ user_id: 0, operation_type_id: 0, videocard_id: 0, quantity: 0 });
            await runDBCommand('DELETE FROM operation WHERE operation_id=?', [id]);
            return { success: true };
        } catch (error: any) {
            return fail(500, { error: error.message });
        }
    }
};