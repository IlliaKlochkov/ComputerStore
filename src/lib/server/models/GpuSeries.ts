import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IGpuSeries {
    gpu_series_id?: number;
    name: string;
    codename: string;
    architecture: string;
    gpu_family_id: number;
}

export class GpuSeries {
    private _id: number | null = null;
    private _name: string;
    private _codename: string;
    private _architecture: string;
    private _familyId: number;

    constructor(data: IGpuSeries) {
        this._id = data.gpu_series_id || null;
        this._name = data.name;
        this._codename = data.codename;
        this._architecture = data.architecture;
        this._familyId = data.gpu_family_id;
    }

    get id() { return this._id; }
    get name() { return this._name; }

    toJSON(): IGpuSeries {
        return {
            gpu_series_id: this._id || undefined,
            name: this._name,
            codename: this._codename,
            architecture: this._architecture,
            gpu_family_id: this._familyId
        };
    }

    static async findWithFilters(search?: string, familyId?: number, sortBy?: string, sortDir?: string): Promise<GpuSeries[]> {
        let sql = 'SELECT * FROM gpu_series WHERE 1=1';
        const params: any[] = [];

        if (search) {
            sql += ' AND (name LIKE ? OR codename LIKE ? OR architecture LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (familyId) {
            sql += ' AND gpu_family_id = ?';
            params.push(familyId);
        }

        const allowedSorts = ['name', 'codename', 'architecture'];
        const orderBy = (sortBy && allowedSorts.includes(sortBy)) ? sortBy : 'name';
        const orderDir = (sortDir && sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IGpuSeries[];
        return rows.map(r => new GpuSeries(r));
    }

    static async findAll(): Promise<GpuSeries[]> {
        const rows = await runDBCommand('SELECT * FROM gpu_series') as IGpuSeries[];
        return rows.map(r => new GpuSeries(r));
    }

    static async findById(id: number): Promise<GpuSeries | null> {
        const rows = await runDBCommand('SELECT * FROM gpu_series WHERE gpu_series_id = ?', [id]) as IGpuSeries[];
        if (!rows.length) return null;
        return new GpuSeries(rows[0]);
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                `UPDATE gpu_series SET name=?, codename=?, architecture=?, gpu_family_id=? WHERE gpu_series_id=?`,
                [this._name, this._codename, this._architecture, this._familyId, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO gpu_series (name, codename, architecture, gpu_family_id) VALUES (?, ?, ?, ?)',
                [this._name, this._codename, this._architecture, this._familyId]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM gpu_series WHERE gpu_series_id=?', [this._id]);
    }
}