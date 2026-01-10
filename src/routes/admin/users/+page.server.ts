import { User } from '$lib/server/models/User';
// import { Role } from '$lib/server/models/Role'; // Видалено
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

// Статичний список ролей, оскільки таблиці role немає
const ROLES = [
	{ value: 'admin', name: 'Administrator' },
	{ value: 'manager', name: 'Manager' },
	{ value: 'user', name: 'User' }
];

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || undefined;
	const role = url.searchParams.get('role') || undefined;

	// Сортування
	const sortBy = url.searchParams.get('sort') || undefined;
	const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

	const users = await User.findWithFilters({ search, role, sortBy, sortDir });

	// Повертаємо статичні ролі замість запиту до БД
	const roles = ROLES;

	const safeUsers = users.map(u => {
		const json = u.toJSON();
		json.password_hash = '';
		return json;
	});

	return {
		users: safeUsers,
		roles: roles,
		filters: {
			search,
			role: role,
			sort: sortBy || 'full_name',
			order: sortDir || 'asc'
		}
	};
};

// --- ДОПОМІЖНА ФУНКЦІЯ ВАЛІДАЦІЇ ---
function validateUserData(email: string, phone: string) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return "Invalid email format.";
	}

	if (phone && phone.trim() !== '') {
		const phoneRegex = /^\+380\d{9}$/;
		if (!phoneRegex.test(phone)) {
			return "Phone number must be in format +380XXXXXXXXX";
		}
	}
	return null;
}

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		try {
			const email = fd.get('email') as string;
			const phone = fd.get('phone_number') as string;

			const validationError = validateUserData(email, phone);
			if (validationError) return fail(400, { error: validationError });

			const rawPassword = fd.get('password_hash') as string;
			if (!rawPassword) throw new Error("Password is required for new user");

			const hash = await bcrypt.hash(rawPassword, 10);

			const newUser = new User({
				full_name: fd.get('full_name') as string,
				email: email,
				password_hash: hash,
				phone_number: phone,
				role: fd.get('role') as string // Тепер рядок
			});
			await newUser.save();
			return { success: true };
		} catch (error: any) {
			if (error.code === 'ER_DUP_ENTRY') {
				return fail(400, { error: "User with this email already exists." });
			}
			return fail(400, { error: error.message });
		}
	},

	update: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('user_id'));
		try {
			const email = fd.get('email') as string;
			const phone = fd.get('phone_number') as string;

			const validationError = validateUserData(email, phone);
			if (validationError) return fail(400, { error: validationError });

			const currentUser = await User.findById(id);
			if (!currentUser) throw new Error("User not found");

			const rawPassword = fd.get('password_hash') as string;
			let finalHash = currentUser.toJSON().password_hash;

			if (rawPassword && rawPassword.trim() !== '') {
				finalHash = await bcrypt.hash(rawPassword, 10);
			}

			const user = new User({
				user_id: id,
				full_name: fd.get('full_name') as string,
				email: email,
				password_hash: finalHash,
				phone_number: phone,
				role: fd.get('role') as string // Тепер рядок
			});
			await user.save();
			return { success: true };
		} catch (error: any) {
			if (error.code === 'ER_DUP_ENTRY') {
				return fail(400, { error: "User with this email already exists." });
			}
			return fail(400, { error: error.message });
		}
	},

	delete: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		try {
			const user = await User.findById(id);
			if (user) await user.delete();
			return { success: true };
		} catch (error: any) {
			console.error("Delete error:", error);
			if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
				return fail(400, {
					error: "Cannot delete this user because they have existing operations history."
				});
			}
			return fail(500, { error: error.message || "Failed to delete item." });
		}
	}
}