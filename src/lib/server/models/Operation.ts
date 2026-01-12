import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

// Тип для операцій (ENUM з БД)
export type OperationTypeEnum = 'supply' | 'sale' | 'writeoff' | 'return';

export interface IOperation {
    operation_id?: number;
    user_id: number;
    operation_type: OperationTypeEnum; // Змінено з ID на ENUM
    videocard_id: number;
    quantity: number;
    operation_date?: Date; // Бажано додати дату, бо вона є в БД

    // Додаткові поля для відображення (JOIN)
    user_name?: string;
    videocard_name?: string;
}

export interface OperationFilters {
    search?: string;
    type?: OperationTypeEnum; // Фільтр по типу-рядку
    userId?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export class Operation {
    private _id: number | null = null;
    private _userId: number;
    private _type: OperationTypeEnum; // Змінено
    private _videocardId: number;
    private _quantity: number;
    private _date: Date | undefined;

    public user_name?: string;
    public videocard_name?: string;

    constructor(data: IOperation) {
        this._id = data.operation_id || null;
        this._userId = data.user_id;
        this._type = data.operation_type;
        this._videocardId = data.videocard_id;
        this._quantity = data.quantity;
        this._date = data.operation_date;

        this.user_name = data.user_name;
        this.videocard_name = data.videocard_name;
    }

    toJSON(): IOperation {
        return {
            operation_id: this._id || undefined,
            user_id: this._userId,
            operation_type: this._type,
            videocard_id: this._videocardId,
            quantity: this._quantity,
            operation_date: this._date,
            user_name: this.user_name,
            videocard_name: this.videocard_name
        };
    }

    static async findWithFilters(filters: OperationFilters): Promise<Operation[]> {
        let sql = `
            SELECT
                o.*,
                u.full_name as user_name,
                v.sku as videocard_name
            FROM operation o
                     JOIN user u ON o.user_id = u.user_id
                     JOIN videocard v ON o.videocard_id = v.videocard_id
            WHERE 1=1
        `;
        // JOIN operation_type прибрано, бо його немає

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

        const allowedSorts = ['operation_id', 'quantity', 'operation_date', 'operation_type'];
        const orderBy = (filters.sortBy && allowedSorts.includes(filters.sortBy)) ? `o.${filters.sortBy}` : 'o.operation_id';
        const orderDir = (filters.sortDir && filters.sortDir.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IOperation[];
        return rows.map(r => new Operation(r));
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE operation SET user_id=?, operation_type=?, videocard_id=?, quantity=? WHERE operation_id=?',
                [this._userId, this._type, this._videocardId, this._quantity, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO operation (user_id, operation_type, videocard_id, quantity) VALUES (?, ?, ?, ?)',
                [this._userId, this._type, this._videocardId, this._quantity]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM operation WHERE operation_id=?', [this._id]);
    }
}