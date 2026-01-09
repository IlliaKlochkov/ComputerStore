import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IManufacturer {
    manufacturer_id?: number;
    name: string;
    country_of_origin: string;
    website_url: string;
}

export class Manufacturer {
    private _id: number | null = null;
    private _name: string;
    private _country: string;
    private _website: string;

    constructor(data: IManufacturer) {
        this._id = data.manufacturer_id || null;
        this._name = data.name;
        this._country = data.country_of_origin;
        this._website = data.website_url;
    }

    get id() { return this._id; }
    get name() { return this._name; }

    toJSON(): IManufacturer {
        return {
            manufacturer_id: this._id || undefined,
            name: this._name,
            country_of_origin: this._country,
            website_url: this._website
        };
    }

    static async findWithFilters(search?: string, country?: string, sortBy?: string, sortDir?: string): Promise<Manufacturer[]> {
        let sql = 'SELECT * FROM manufacturer WHERE 1=1';
        const params: any[] = [];

        if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
        if (country) { sql += ' AND country_of_origin = ?'; params.push(country); }

        const allowedSorts = ['name', 'country_of_origin'];
        const orderBy = (sortBy && allowedSorts.includes(sortBy)) ? sortBy : 'name';
        const orderDir = (sortDir && sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;
        const rows = await runDBCommand(sql, params) as IManufacturer[];
        return rows.map(r => new Manufacturer(r));
    }

    static async getDistinctCountries(): Promise<string[]> {
        const rows = await runDBCommand('SELECT DISTINCT country_of_origin FROM manufacturer ORDER BY country_of_origin') as { country_of_origin: string }[];
        return rows.map(r => r.country_of_origin).filter(Boolean); // filter(Boolean) прибирає пусті рядки, якщо такі є
    }

    static async findAll(): Promise<Manufacturer[]> {
        const rows = await runDBCommand('SELECT * FROM manufacturer') as IManufacturer[];
        return rows.map(r => new Manufacturer(r));
    }

    static async findById(id: number): Promise<Manufacturer | null> {
        const rows = await runDBCommand('SELECT * FROM manufacturer WHERE manufacturer_id = ?', [id]) as IManufacturer[];
        if (!rows.length) return null;
        return new Manufacturer(rows[0]);
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE manufacturer SET name=?, country_of_origin=?, website_url=? WHERE manufacturer_id=?',
                [this._name, this._country, this._website, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO manufacturer (name, country_of_origin, website_url) VALUES (?, ?, ?)',
                [this._name, this._country, this._website]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if (this._id) await runDBCommand('DELETE FROM manufacturer WHERE manufacturer_id = ?', [this._id]);
    }
}