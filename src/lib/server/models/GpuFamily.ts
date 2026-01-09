import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IGpuFamily {
    gpu_family_id?: number;
    manufacturer_id: number;
    name: string;
    manufacturer_name?: string;
}

export class GpuFamily {
    private _id: number | null = null;
    private _manufacturerId: number;
    private _name: string;
    public manufacturer_name?: string;

    constructor(data: IGpuFamily) {
        this._id = data.gpu_family_id || null;
        this._manufacturerId = data.manufacturer_id;
        this._name = data.name;
        this.manufacturer_name = data.manufacturer_name;
    }

    get id() { return this._id; }
    get name() { return this._name; }

    toJSON(): IGpuFamily {
        return {
            gpu_family_id: this._id || undefined,
            manufacturer_id: this._manufacturerId,
            name: this._name,
            manufacturer_name: this.manufacturer_name
        };
    }

    static async findWithFilters(search?: string, manufacturerId?: number, sortBy?: string, sortDir?: string): Promise<GpuFamily[]> {
        let sql = `
            SELECT gf.*, m.name as manufacturer_name 
            FROM gpu_family gf
            JOIN manufacturer m ON gf.manufacturer_id = m.manufacturer_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (search) {
            sql += ' AND gf.name LIKE ?';
            params.push(`%${search}%`);
        }
        if (manufacturerId) {
            sql += ' AND gf.manufacturer_id = ?';
            params.push(manufacturerId);
        }

        const allowedSorts = ['name', 'manufacturer_name']; // Сортуємо по імені виробника, а не ID
        const orderBy = (sortBy && allowedSorts.includes(sortBy))
            ? (sortBy === 'manufacturer_name' ? 'm.name' : `gf.${sortBy}`)
            : 'gf.name';

        const orderDir = (sortDir && sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IGpuFamily[];
        return rows.map(r => new GpuFamily(r));
    }

    static async findAll(): Promise<GpuFamily[]> {
        const rows = await runDBCommand('SELECT * FROM gpu_family') as IGpuFamily[];
        return rows.map(r => new GpuFamily(r));
    }

    static async findById(id: number): Promise<GpuFamily | null> {
        const rows = await runDBCommand('SELECT * FROM gpu_family WHERE gpu_family_id = ?', [id]) as IGpuFamily[];
        if (!rows.length) return null;
        return new GpuFamily(rows[0]);
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE gpu_family SET name=?, manufacturer_id=? WHERE gpu_family_id=?',
                [this._name, this._manufacturerId, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO gpu_family (name, manufacturer_id) VALUES (?, ?)',
                [this._name, this._manufacturerId]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM gpu_family WHERE gpu_family_id=?', [this._id]);
    }
}