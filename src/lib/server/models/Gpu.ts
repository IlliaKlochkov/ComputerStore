import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';


export interface IGpu {
    gpu_id?: number;
    name: string;
    gpu_series_id: number;
    process_technology_nm: number;
    base_clock_mhz: number;
    boost_clock_mhz: number;
    cuda_cores_count: number;
    cuda_support: number | boolean;
    release_date: Date | string;
}

export interface GpuFilters {
    search?: string;
    seriesId?: number;
    gpuFamilyId?: number;
    minCores?: number;
    minClock?: number;
    maxClock?: number;
    minBoostClock?: number;
    cudaSupport?: boolean;
    minDate?: string;
    maxDate?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export class Gpu {
    private _id: number | null = null;
    private _name: string;
    private _seriesId: number;
    private _processNm: number;
    private _baseClock: number;
    private _boostClock: number;
    private _cudaCores: number;
    private _cudaSupport: boolean;
    private _releaseDate: Date;

    constructor(data: IGpu) {
        this._id = data.gpu_id || null;
        this._name = data.name;
        this._seriesId = data.gpu_series_id;
        this._processNm = data.process_technology_nm;
        this._baseClock = data.base_clock_mhz;
        this._boostClock = data.boost_clock_mhz;
        this._cudaSupport = Boolean(data.cuda_support);
        this._cudaCores = this._cudaSupport ? data.cuda_cores_count : 0;
        this._releaseDate = new Date(data.release_date);
    }

    toJSON(): IGpu {
        return {
            gpu_id: this._id || undefined,
            name: this._name,
            gpu_series_id: this._seriesId,
            process_technology_nm: this._processNm,
            base_clock_mhz: this._baseClock,
            boost_clock_mhz: this._boostClock,
            cuda_cores_count: this._cudaCores,
            cuda_support: this._cudaSupport,
            release_date: this._releaseDate
        };
    }

    async save(): Promise<void> {
        if (!this._cudaSupport) this._cudaCores = 0;
        const dateStr = this._releaseDate.toISOString().split('T')[0];

        if (this._id) {
            await runDBCommand(
                `UPDATE gpu SET name=?, gpu_series_id=?, process_technology_nm=?, base_clock_mhz=?, boost_clock_mhz=?, cuda_cores_count=?, cuda_support=?, release_date=? WHERE gpu_id=?`,
                [this._name, this._seriesId, this._processNm, this._baseClock, this._boostClock, this._cudaCores, this._cudaSupport, dateStr, this._id]
            );
        } else {
            const res = await runDBCommand(
                `INSERT INTO gpu (name, gpu_series_id, process_technology_nm, base_clock_mhz, boost_clock_mhz, cuda_cores_count, cuda_support, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [this._name, this._seriesId, this._processNm, this._baseClock, this._boostClock, this._cudaCores, this._cudaSupport, dateStr]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if (this._id) await runDBCommand('DELETE FROM gpu WHERE gpu_id=?', [this._id]);
    }

    static async findAll(): Promise<Gpu[]> {
        const rows = await runDBCommand('SELECT * FROM gpu') as IGpu[];
        return rows.map(r => new Gpu(r));
    }

    static async findById(id: number): Promise<Gpu | null> {
        const rows = await runDBCommand('SELECT * FROM gpu WHERE gpu_id = ?', [id]) as IGpu[];
        if (!rows.length) return null;
        return new Gpu(rows[0]);
    }

    static async findWithFilters(filters: GpuFilters): Promise<Gpu[]> {
        let sql = `
            SELECT g.* FROM gpu g
            LEFT JOIN gpu_series gs ON g.gpu_series_id = gs.gpu_series_id
            LEFT JOIN gpu_family gf ON gs.gpu_family_id = gf.gpu_family_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.search) { sql += ' AND g.name LIKE ?'; params.push(`%${filters.search}%`); }
        if (filters.seriesId) { sql += ' AND g.gpu_series_id = ?'; params.push(filters.seriesId); }


        if (filters.gpuFamilyId) { sql += ' AND gf.gpu_family_id = ?'; params.push(filters.gpuFamilyId); }

        if (filters.minCores) { sql += ' AND g.cuda_cores_count >= ?'; params.push(filters.minCores); }
        if (filters.minClock) { sql += ' AND g.base_clock_mhz >= ?'; params.push(filters.minClock); }
        if (filters.maxClock) { sql += ' AND g.base_clock_mhz <= ?'; params.push(filters.maxClock); }
        if (filters.minBoostClock) { sql += ' AND g.boost_clock_mhz >= ?'; params.push(filters.minBoostClock); }
        if (filters.cudaSupport !== undefined) { sql += ' AND g.cuda_support = ?'; params.push(filters.cudaSupport ? 1 : 0); }
        if (filters.minDate) { sql += ' AND g.release_date >= ?'; params.push(filters.minDate); }
        if (filters.maxDate) { sql += ' AND g.release_date <= ?'; params.push(filters.maxDate); }

        const allowedSorts = [
            'name',
            'process_technology_nm',
            'base_clock_mhz',
            'boost_clock_mhz',
            'cuda_cores_count',
            'release_date',
            'cuda_support'
        ];


        const orderBy = (filters.sortBy && allowedSorts.includes(filters.sortBy))
            ? `g.${filters.sortBy}`
            : 'g.name';

        const orderDir = (filters.sortDir && filters.sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IGpu[];
        return rows.map(r => new Gpu(r));
    }
}