import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { User } from '$lib/server/models/User';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ cookies }) => {
    const userId = cookies.get('userId');

    if (userId) {
        throw redirect(303, '/admin/stats');
    }

    return {};
};

export const actions: Actions = {
    login: async ({ request, cookies }) => {
        const data = await request.formData();
        const email = data.get('email') as string;
        const password = data.get('password') as string;

        if (!email || !password) {
            return fail(400, { email, missing: true });
        }

        try {
            const userModel = await User.findByEmail(email);

            // 1. Перевірка чи існує юзер і чи правильний пароль
            if (!userModel || !await bcrypt.compare(password, userModel.passwordHash)) {
                return fail(400, { email, incorrect: true });
            }

            const user = userModel.toJSON();

            console.log('Login attempt:', user);

            // 2. ПЕРЕВІРКА ПРАВ ДОСТУПУ
            if (user.role_id !== 1) {
                console.log(`Access denied for user ${user.email}. Role ID is ${user.role_id}, expected 1.`);
                return fail(403, { email, error: 'Доступ дозволено лише адміністратору' });
            }

            // 3. ВСТАНОВЛЕННЯ COOKIE
            // Важливо: перетворіть ID в рядок
            if (user.user_id) {
                cookies.set('userId', String(user.user_id), {
                    path: '/',
                    httpOnly: true,
                    secure: false,
                    maxAge: 60 * 60 * 24
                });
            } else {
                return fail(500, { error: 'User ID not found' });
            }

        } catch (error) {
            console.error('Login error:', error);
            return fail(500, { error: 'Database connection error during login' });
        }

        // Якщо все ок - перекидаємо
        throw redirect(303, '/admin/stats');
    },

    register: async ({ request }) => {
        // ... (Ваш код реєстрації без змін, він правильний)
        const data = await request.formData();
        const email = data.get('email') as string;
        const password = data.get('password') as string;
        const fullName = data.get('full_name') as string;
        const phone = data.get('phone') as string;
        const roleId = 2; // Звичайний юзер

        if (!email || !password || !fullName) return fail(400, { register: true, missing: true });

        try {
            const existingUser = await User.findByEmail(email);
            if (existingUser) return fail(400, { register: true, userExists: true });

            const hash = await bcrypt.hash(password, 10);
            const newUser = new User({
                email,
                password_hash: hash,
                full_name: fullName,
                phone_number: phone,
                role_id: roleId
            });
            await newUser.save();
            return { success: true, registered: true };
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.code === 'ER_DUP_ENTRY') return fail(400, { register: true, userExists: true });
            return fail(500, { register: true, error: err.message });
        }
    },

    logout: async ({ cookies }) => {
        cookies.delete('userId', { path: '/' });
        throw redirect(303, '/');
    }
};