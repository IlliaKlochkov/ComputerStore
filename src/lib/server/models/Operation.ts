import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IOperation {
    operation_id?: number;
    user_id: number;
    operation_type_id: number; // Залишаємо для сумісності з БД (NOT NULL), але логіку будуємо на string
    operation_type: string;    // Основне поле
    videocard_id: number;
    quantity: number;

    // Додаткові поля для відображення (JOIN)
    user_name?: string;
    videocard_name?: string;
    price?: number;
}

export interface OperationFilters {
    search?: string;
    type?: string; // Фільтр по рядку
    userId?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export class Operation {
    private _id: number | null = null;
    private _userId: number;
    private _typeId: number;
    private _typeName: string;
    private _videocardId: number;
    private _quantity: number;

    public user_name?: string;
    public videocard_name?: string;
    public price?: number;

    constructor(data: IOperation) {
        this._id = data.operation_id || null;
        this._userId = data.user_id;
        this._typeId = data.operation_type_id;
        this._typeName = data.operation_type;
        this._videocardId = data.videocard_id;
        this._quantity = data.quantity;

        this.user_name = data.user_name;
        this.videocard_name = data.videocard_name;
        this.price = data.price;
    }

    toJSON(): IOperation {
        return {
            operation_id: this._id || undefined,
            user_id: this._userId,
            operation_type_id: this._typeId,
            operation_type: this._typeName,
            videocard_id: this._videocardId,
            quantity: this._quantity,
            user_name: this.user_name,
            videocard_name: this.videocard_name,
            price: this.price
        };
    }

    static async findWithFilters(filters: OperationFilters): Promise<Operation[]> {
        // Прибрано JOIN з operation_type, оскільки таблиці немає
        let sql = `
            SELECT
                o.*,
                u.full_name as user_name,
                v.sku as videocard_name,
                v.price as price
            FROM operation o
                     JOIN user u ON o.user_id = u.user_id
                     JOIN videocard v ON o.videocard_id = v.videocard_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.search) {
            sql += ' AND (u.full_name LIKE ? OR v.sku LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.type) {
            sql += ' AND o.operation_type = ?';
            params.push(filters.type);
        }
        if (filters.userId) {
            sql += ' AND o.user_id = ?';
            params.push(filters.userId);
        }

        const allowedSorts = ['operation_id', 'quantity', 'operation_type'];
        const orderBy = (filters.sortBy && allowedSorts.includes(filters.sortBy)) ? `o.${filters.sortBy}` : 'o.operation_id';
        const orderDir = (filters.sortDir && filters.sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IOperation[];
        return rows.map(r => new Operation(r));
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE operation SET user_id=?, operation_type_id=?, operation_type=?, videocard_id=?, quantity=? WHERE operation_id=?',
                [this._userId, this._typeId, this._typeName, this._videocardId, this._quantity, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO operation (user_id, operation_type_id, operation_type, videocard_id, quantity) VALUES (?, ?, ?, ?, ?)',
                [this._userId, this._typeId, this._typeName, this._videocardId, this._quantity]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM operation WHERE operation_id=?', [this._id]);
    }
}