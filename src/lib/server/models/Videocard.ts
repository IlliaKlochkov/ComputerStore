import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IVideocard {
    videocard_id?: number;
    memory_type_id: number;
    manufacturer_series_id: number;
    sku: string;
    memory_size: number;
    width_mm: number;
    height_mm: number;
    length_mm: number;
    recommended_psu_wattage: number;
    has_illumination: number | boolean;
    max_resolution_x?: number;
    max_resolution_y?: number;
    color: string;
    gpu_id: number;
    quantity: number;
    price: number;
    manufacturer_name?: string;
    manufacturer_id?: number;
}

export interface VideocardFilters {
    search?: string;
    gpuId?: number;
    seriesId?: number;
    manufacturerId?: number;

    gpuFamilyId?: number;

    memoryTypeId?: number;
    minPrice?: number;
    maxPrice?: number;
    minMemory?: number;
    maxMemory?: number;
    hasIllumination?: boolean;
    color?: string;
    minPsu?: number;
    maxPsu?: number;
    minResX?: number;
    minResY?: number;
    maxLength?: number;
    minQuantity?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export class Videocard {
    private _id: number | null = null;
    private _memoryTypeId: number;
    private _seriesId: number;
    private _sku: string;
    private _memorySize: number;
    private _widthMm: number;
    private _heightMm: number;
    private _lengthMm: number;
    private _maxResX: number; // Нове
    private _maxResY: number; // Нове
    private _recommendedPsu: number;
    private _hasIllumination: boolean;
    private _color: string;
    private _gpuId: number;
    private _quantity: number;
    private _price: number;

    public manufacturer_name?: string;
    // @ts-ignore
    public manufacturer_id?: number;

    constructor(data: IVideocard) {
        this._id = data.videocard_id || null;
        this._memoryTypeId = data.memory_type_id;
        this._seriesId = data.manufacturer_series_id;
        this._sku = data.sku;
        this._memorySize = data.memory_size;
        this._widthMm = data.width_mm || 0;
        this._heightMm = data.height_mm || 0;
        this._lengthMm = data.length_mm || 0;
        this._recommendedPsu = data.recommended_psu_wattage || 0;
        this._hasIllumination = Boolean(data.has_illumination);
        this._maxResX = data.max_resolution_x || 0; // Нове
        this._maxResY = data.max_resolution_y || 0; // Нове
        this._color = data.color || '';
        this._gpuId = data.gpu_id;
        this._quantity = data.quantity || 0;
        this._price = data.price;

        this.manufacturer_name = data.manufacturer_name;
        this.manufacturer_id = data.manufacturer_id;
    }

    get id() { return this._id; }
    get sku() { return this._sku; }
    get quantity() { return this._quantity; }

    toJSON(): IVideocard {
        return {
            videocard_id: this._id || undefined,
            memory_type_id: this._memoryTypeId,
            manufacturer_series_id: this._seriesId,
            sku: this._sku,
            memory_size: this._memorySize,
            width_mm: this._widthMm,
            height_mm: this._heightMm,
            length_mm: this._lengthMm,
            recommended_psu_wattage: this._recommendedPsu,
            has_illumination: this._hasIllumination,
            max_resolution_x: this._maxResX, // Нове
            max_resolution_y: this._maxResY, // Нове
            color: this._color,
            gpu_id: this._gpuId,
            quantity: this._quantity,
            price: this._price,
            manufacturer_name: this.manufacturer_name,
            manufacturer_id: this.manufacturer_id
        };
    }

    static async findWithFilters(filters: VideocardFilters): Promise<Videocard[]> {
        let sql = `
            SELECT v.*,
                   m.name AS manufacturer_name,
                   m.manufacturer_id AS manufacturer_id
            FROM videocard v
                     LEFT JOIN manufacturer_series ms ON v.manufacturer_series_id = ms.manufacturer_series_id
                     LEFT JOIN manufacturer m ON ms.manufacturer_id = m.manufacturer_id
                     
                     LEFT JOIN gpu g ON v.gpu_id = g.gpu_id
                     LEFT JOIN gpu_series gs ON g.gpu_series_id = gs.gpu_series_id
                     LEFT JOIN gpu_family gf ON gs.gpu_family_id = gf.gpu_family_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.search) { sql += ' AND v.sku LIKE ?'; params.push(`%${filters.search}%`); }
        if (filters.gpuId) { sql += ' AND v.gpu_id = ?'; params.push(filters.gpuId); }
        if (filters.seriesId) { sql += ' AND v.manufacturer_series_id = ?'; params.push(filters.seriesId); }
        if (filters.manufacturerId) { sql += ' AND m.manufacturer_id = ?'; params.push(filters.manufacturerId); }

        // --- Фільтр по сімейству GPU ---
        if (filters.gpuFamilyId) { sql += ' AND gf.gpu_family_id = ?'; params.push(filters.gpuFamilyId); }

        if (filters.memoryTypeId) { sql += ' AND v.memory_type_id = ?'; params.push(filters.memoryTypeId); }
        if (filters.minPrice) { sql += ' AND v.price >= ?'; params.push(filters.minPrice); }
        if (filters.maxPrice) { sql += ' AND v.price <= ?'; params.push(filters.maxPrice); }
        if (filters.minMemory) { sql += ' AND v.memory_size >= ?'; params.push(filters.minMemory); }
        if (filters.maxMemory) { sql += ' AND v.memory_size <= ?'; params.push(filters.maxMemory); }

        if (filters.hasIllumination !== undefined) {
            sql += ' AND v.has_illumination = ?';
            params.push(filters.hasIllumination ? 1 : 0);
        }
        if (filters.color) { sql += ' AND v.color LIKE ?'; params.push(`%${filters.color}%`); }

        if (filters.minResX) { sql += ' AND v.max_resolution_x >= ?'; params.push(filters.minResX); }
        if (filters.minResY) { sql += ' AND v.max_resolution_y >= ?'; params.push(filters.minResY); }

        if (filters.minPsu) { sql += ' AND v.recommended_psu_wattage >= ?'; params.push(filters.minPsu); }
        if (filters.maxPsu) { sql += ' AND v.recommended_psu_wattage <= ?'; params.push(filters.maxPsu); }
        if (filters.maxLength) { sql += ' AND v.length_mm <= ?'; params.push(filters.maxLength); }

        if (filters.minQuantity !== undefined) { sql += ' AND v.quantity >= ?'; params.push(filters.minQuantity); }

        const allowedSorts = ['sku', 'price', 'memory_size', 'length_mm', 'quantity', 'recommended_psu_wattage'];
        const orderBy = (filters.sortBy && allowedSorts.includes(filters.sortBy)) ? `v.${filters.sortBy}` : 'v.price';
        const defaultDir = orderBy === 'v.price' ? 'DESC' : 'ASC';
        const orderDir = (filters.sortDir && ['asc', 'desc'].includes(filters.sortDir.toLowerCase()))
            ? filters.sortDir.toUpperCase()
            : defaultDir;

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IVideocard[];
        return rows.map(r => new Videocard(r));
    }

    static async findAll(): Promise<Videocard[]> {
        const rows = await runDBCommand('SELECT * FROM videocard') as IVideocard[];
        return rows.map(row => new Videocard(row));
    }

    static async findById(id: number): Promise<Videocard | null> {
        const rows = await runDBCommand('SELECT * FROM videocard WHERE videocard_id = ?', [id]) as IVideocard[];
        if (rows.length === 0) return null;
        return new Videocard(rows[0]);
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                `UPDATE videocard
                 SET memory_type_id=?, manufacturer_series_id=?, sku=?, memory_size=?,
                     width_mm=?, height_mm=?, length_mm=?, recommended_psu_wattage=?,
                     has_illumination=?, color=?, gpu_id=?, quantity=?, price=?,
                     max_resolution_x=?, max_resolution_y=?  -- Додано в SQL
                 WHERE videocard_id=?`,
                [
                    this._memoryTypeId, this._seriesId, this._sku, this._memorySize,
                    this._widthMm, this._heightMm, this._lengthMm, this._recommendedPsu,
                    this._hasIllumination ? 1 : 0, this._color, this._gpuId, this._quantity, this._price,
                    this._maxResX, this._maxResY, // Додано значення
                    this._id
                ]
            );
        } else {
            const result = await runDBCommand(
                `INSERT INTO videocard
                 (memory_type_id, manufacturer_series_id, sku, memory_size, width_mm, height_mm, length_mm, recommended_psu_wattage, has_illumination, color, gpu_id, quantity, price, max_resolution_x, max_resolution_y)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Додано знаки питань
                [
                    this._memoryTypeId, this._seriesId, this._sku, this._memorySize,
                    this._widthMm, this._heightMm, this._lengthMm, this._recommendedPsu,
                    this._hasIllumination ? 1 : 0, this._color, this._gpuId, this._quantity, this._price,
                    this._maxResX, this._maxResY // Додано значення
                ]
            ) as ResultSetHeader;
            this._id = result.insertId;
        }
    }

    async delete(): Promise<void> {
        if (!this._id) return;
        await runDBCommand('DELETE FROM videocard WHERE videocard_id = ?', [this._id]);
        this._id = null;
    }
}