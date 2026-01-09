import { runDBCommand } from '$lib/server/db';

export interface IOperationType {
    operation_type_id?: number;
    name: string;
    desctiption: string; // У схемі помилка 'desctiption', використовуємо її для сумісності з БД
}

export class OperationType {
    private _id: number | null = null;
    private _name: string;
    private _description: string;

    constructor(data: IOperationType) {
        this._id = data.operation_type_id || null;
        this._name = data.name;
        this._description = data.desctiption;
    }

    toJSON(): IOperationType {
        return { operation_type_id: this._id || undefined, name: this._name, desctiption: this._description };
    }

    static async findAll(): Promise<OperationType[]> {
        const rows = await runDBCommand('SELECT * FROM operation_type') as IOperationType[];
        return rows.map(r => new OperationType(r));
    }
}