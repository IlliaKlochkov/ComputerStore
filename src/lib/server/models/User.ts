import { runDBCommand } from '$lib/server/db';
import type { ResultSetHeader } from 'mysql2';

export interface IUser {
    user_id?: number;
    full_name: string;
    password_hash: string;
    email: string;
    phone_number: string;
    role_id: number;
    role_name?: string; // Для відображення
}


export interface UserFilters {
    search?: string;
    roleId?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export class User {
    private _id: number | null = null;
    private _fullName: string;
    private _passwordHash: string;
    private _email: string;
    private _phone: string;
    private _roleId: number;
    private _roleName: string | undefined;

    constructor(data: IUser) {
        this._id = data.user_id || null;
        this._fullName = data.full_name;
        this._passwordHash = data.password_hash;
        this._email = data.email;
        this._phone = data.phone_number;
        this._roleId = data.role_id;
        this._roleName = data.role_name;
    }

    get passwordHash() { return this._passwordHash; }

    toJSON(): IUser {
        return {
            user_id: this._id || undefined,
            full_name: this._fullName,
            password_hash: this._passwordHash,
            email: this._email,
            phone_number: this._phone,
            role_id: this._roleId,
            role_name: this._roleName
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
        let sql = `
            SELECT u.*, r.name as role_name 
            FROM user u
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.search) {
            sql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }
        if (filters.roleId) {
            sql += ' AND u.role_id = ?';
            params.push(filters.roleId);
        }

        const allowedSorts = ['full_name', 'email', 'role_name'];
        const orderBy = (filters.sortBy && allowedSorts.includes(filters.sortBy)) ? filters.sortBy : 'u.user_id';
        const orderDir = (filters.sortDir && filters.sortDir.toLowerCase() === 'desc') ? 'DESC' : 'ASC';

        sql += ` ORDER BY ${orderBy} ${orderDir}`;

        const rows = await runDBCommand(sql, params) as IUser[];
        return rows.map(r => new User(r));
    }

    async save(): Promise<void> {
        if (this._id) {
            await runDBCommand(
                'UPDATE user SET full_name=?, password_hash=?, email=?, phone_number=?, role_id=? WHERE user_id=?',
                [this._fullName, this._passwordHash, this._email, this._phone, this._roleId, this._id]
            );
        } else {
            const res = await runDBCommand(
                'INSERT INTO user (full_name, password_hash, email, phone_number, role_id) VALUES (?, ?, ?, ?, ?)',
                [this._fullName, this._passwordHash, this._email, this._phone, this._roleId]
            ) as ResultSetHeader;
            this._id = res.insertId;
        }
    }

    async delete(): Promise<void> {
        if(this._id) await runDBCommand('DELETE FROM user WHERE user_id=?', [this._id]);
    }
}