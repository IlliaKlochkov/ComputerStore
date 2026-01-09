import { runDBCommand } from '$lib/server/db';

export interface IRole {
    role_id?: number;
    name: string;
    description: string;
}

export class Role {
    private _id: number | null = null;
    private _name: string;
    private _description: string;

    constructor(data: IRole) {
        this._id = data.role_id || null;
        this._name = data.name;
        this._description = data.description;
    }

    toJSON(): IRole {
        return { role_id: this._id || undefined, name: this._name, description: this._description };
    }

    static async findAll(): Promise<Role[]> {
        const rows = await runDBCommand('SELECT * FROM role') as IRole[];
        return rows.map(r => new Role(r));
    }
}