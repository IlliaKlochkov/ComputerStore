import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IManufacturerSeries {
    manufacturer_series_id?: number; // Зберігаємо написання як в БД (з помилкою)
    manufacturer_id: number;
    series_name: string;
}


export class ManufacturerSeries {
    private _id: number | null = null;
    private _manufacturerId: number;
    private _seriesName: string;

    constructor(data: IManufacturerSeries) {
        this._id = data.manufacturer_series_id || null;
        this._manufacturerId = data.manufacturer_id;
        this._seriesName = data.series_name;
    }

    get id() { return this._id; }
    get name() { return this._seriesName; }

    toJSON(): IManufacturerSeries {
        return {
            manufacturer_series_id: this._id || undefined,
            manufacturer_id: this._manufacturerId,
            series_name: this._seriesName
        };
    }

    static async findWithFilters(search?: string, manufacturerId?: number, sortBy?: string, sortDir?: string): Promise<ManufacturerSeries[]> {
        let sql = 'SELECT * FROM manufacturer_series WHERE 1=1'; // Ваша назва таблиці (перевірте чи там є typo)
        const params: any[] = [];

        if (search) { sql += ' AND series_name LIKE ?'; params.push(`%${search}%`); }
        if (manufacturerId) { sql += ' AND manufacturer_id = ?'; params.push(manufacturerId); }

        const allowedSorts = ['series_name'];
        const orderBy = (sortBy && allowedSorts.includes(sortBy)) ? sortBy : 'series_name';
        const orderDir = (sortDir && sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;
        const rows = await runDBCommand(sql, params) as IManufacturerSeries[];
        return rows.map(r => new ManufacturerSeries(r));
    }

    static async findAll(): Promise<ManufacturerSeries[]> {
        const rows = await runDBCommand('SELECT * FROM manufacturer_series') as IManufacturerSeries[];
        return rows.map(r => new ManufacturerSeries(r));
    }

    static async findByManufacturerId(manufacturerId: number): Promise<ManufacturerSeries[]> {
        const rows = await runDBCommand('SELECT * FROM manufacturer_series WHERE manufacturer_id = ?', [manufacturerId]) as IManufacturerSeries[];
        return rows.map(r => new ManufacturerSeries(r));
    }

    static async findById(id: number): Promise<ManufacturerSeries | null> {
        const rows = await runDBCommand('SELECT * FROM manufacturer_series WHERE manufacturer_series_id = ?', [id]) as IManufacturerSeries[];
        if (!rows.length) return null;
        return new ManufacturerSeries(rows[0]);
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE manufacturer_series SET manufacturer_id=?, series_name=? WHERE manufacturer_series_id=?',
                [this._manufacturerId, this._seriesName, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO manufacturer_series (manufacturer_id, series_name) VALUES (?, ?)',
                [this._manufacturerId, this._seriesName]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM manufacturer_series WHERE manufacturer_series_id=?', [this._id]);
    }
}