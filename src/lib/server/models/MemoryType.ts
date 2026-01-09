import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IMemoryType {
    memory_type_id?: number;
    name: string;
    bandwidth: string;
    bus_width_bit: number;
    vram_clock_speed_mhz: number;
}

export interface MemoryTypeFilters {
    search?: string;
    minBus?: number;
    maxBus?: number;
    minClock?: number;
    maxClock?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export class MemoryType {
    private _id: number | null = null;
    private _name: string;
    private _bandwidth: string;
    private _busWidth: number;
    private _clockSpeed: number;

    constructor(data: IMemoryType) {
        this._id = data.memory_type_id || null;
        this._name = data.name;
        this._bandwidth = data.bandwidth;
        this._busWidth = data.bus_width_bit;
        this._clockSpeed = data.vram_clock_speed_mhz;
    }

    toJSON(): IMemoryType {
        return {
            memory_type_id: this._id || undefined,
            name: this._name,
            bandwidth: this._bandwidth,
            bus_width_bit: this._busWidth,
            vram_clock_speed_mhz: this._clockSpeed
        };
    }

    static async findWithFilters(filters: MemoryTypeFilters): Promise<MemoryType[]> {
        let sql = 'SELECT * FROM memory_type WHERE 1=1';
        const params: any[] = [];

        if (filters.search) { sql += ' AND name LIKE ?'; params.push(`%${filters.search}%`); }
        if (filters.minBus) { sql += ' AND bus_width_bit >= ?'; params.push(filters.minBus); }
        if (filters.maxBus) { sql += ' AND bus_width_bit <= ?'; params.push(filters.maxBus); }
        if (filters.minClock) { sql += ' AND vram_clock_speed_mhz >= ?'; params.push(filters.minClock); }
        if (filters.maxClock) { sql += ' AND vram_clock_speed_mhz <= ?'; params.push(filters.maxClock); }

        const allowedSorts = ['name', 'bandwidth', 'bus_width_bit', 'vram_clock_speed_mhz'];
        const orderBy = (filters.sortBy && allowedSorts.includes(filters.sortBy)) ? filters.sortBy : 'name';
        const orderDir = (filters.sortDir && filters.sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IMemoryType[];
        return rows.map(r => new MemoryType(r));
    }

    static async findAll(): Promise<MemoryType[]> {
        const rows = await runDBCommand('SELECT * FROM memory_type') as IMemoryType[];
        return rows.map(r => new MemoryType(r));
    }

    static async findById(id: number): Promise<MemoryType | null> {
        const rows = await runDBCommand('SELECT * FROM memory_type WHERE memory_type_id = ?', [id]) as IMemoryType[];
        if (!rows.length) return null;
        return new MemoryType(rows[0]);
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE memory_type SET name=?, bandwidth=?, bus_width_bit=?, vram_clock_speed_mhz=? WHERE memory_type_id=?',
                [this._name, this._bandwidth, this._busWidth, this._clockSpeed, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO memory_type (name, bandwidth, bus_width_bit, vram_clock_speed_mhz) VALUES (?, ?, ?, ?)',
                [this._name, this._bandwidth, this._busWidth, this._clockSpeed]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM memory_type WHERE memory_type_id=?', [this._id]);
    }
}