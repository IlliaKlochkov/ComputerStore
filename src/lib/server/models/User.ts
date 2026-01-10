import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IUser {
    user_id?: number;
    full_name: string;
    password_hash: string;
    email: string;
    phone_number: string;
    role: string; // Змінено з role_id на role (string)
}

export interface UserFilters {
    search?: string;
    role?: string; // Фільтруємо по рядку
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export class User {
    private _id: number | null = null;
    private _fullName: string;
    private _passwordHash: string;
    private _email: string;
    private _phone: string;
    private _role: string;

    constructor(data: IUser) {
        this._id = data.user_id || null;
        this._fullName = data.full_name;
        this._passwordHash = data.password_hash;
        this._email = data.email;
        this._phone = data.phone_number;
        this._role = data.role;
    }

    get passwordHash() { return this._passwordHash; }
    get role() { return this._role; } // Геттер для ролі

    toJSON(): IUser {
        return {
            user_id: this._id || undefined,
            full_name: this._fullName,
            password_hash: this._passwordHash,
            email: this._email,
            phone_number: this._phone,
            role: this._role
        };
    }

    static async findByEmail(email: string): Promise<User | null> {
        const rows = await runDBCommand('SELECT * FROM user WHERE email = ?', [email]) as IUser[];
        if (!rows.length) return null;
        return new User(rows[0]);
    }

    static async findById(id: number): Promise<User | null> {
        const rows = await runDBCommand('SELECT * FROM user WHERE user_id = ?', [id]) as IUser[];
        if (!rows.length) return null;
        return new User(rows[0]);
    }

    static async findWithFilters(filters: UserFilters): Promise<User[]> {
        // Прибрано JOIN, оскільки роль тепер у таблиці user
        let sql = `SELECT * FROM user WHERE 1=1`;
        const params: any[] = [];

        if (filters.search) {
            sql += ' AND (full_name LIKE ? OR email LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.role) {
            sql += ' AND role = ?';
            params.push(filters.role);
        }

        const allowedSorts = ['full_name', 'email', 'role'];
        const orderBy = (filters.sortBy && allowedSorts.includes(filters.sortBy)) ? filters.sortBy : 'user_id';
        const orderDir = (filters.sortDir && filters.sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IUser[];
        return rows.map(r => new User(r));
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE user SET full_name=?, password_hash=?, email=?, phone_number=?, role=? WHERE user_id=?',
                [this._fullName, this._passwordHash, this._email, this._phone, this._role, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO user (full_name, password_hash, email, phone_number, role) VALUES (?, ?, ?, ?, ?)',
                [this._fullName, this._passwordHash, this._email, this._phone, this._role]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM user WHERE user_id=?', [this._id]);
    }
}