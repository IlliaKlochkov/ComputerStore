import { User } from '$lib/server/models/User';
import { Role } from '$lib/server/models/Role';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || undefined;
	const roleId = url.searchParams.get('role') ? Number(url.searchParams.get('role')) : undefined;

	// Сортування
	const sortBy = url.searchParams.get('sort') || undefined;
	const sortDir = url.searchParams.get('order') as 'asc' | 'desc' || undefined;

	const users = await User.findWithFilters({ search, roleId, sortBy, sortDir });
	const roles = await Role.findAll();

	const safeUsers = users.map(u => {
		const json = u.toJSON();
		json.password_hash = '';
		return json;
	});

	return {
		users: safeUsers,
		roles: roles.map(r => r.toJSON()),
		filters: {
			search,
			role: roleId,
			sort: sortBy || 'full_name',
			order: sortDir || 'asc'
		}
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const fd = await request.formData();
		try {
			const rawPassword = fd.get('password_hash') as string;
			if (!rawPassword) throw new Error("Password is required for new user");

			const hash = await bcrypt.hash(rawPassword, 10);

			const newUser = new User({
				full_name: fd.get('full_name') as string,
				email: fd.get('email') as string,
				password_hash: hash,
				phone_number: fd.get('phone_number') as string,
				role_id: Number(fd.get('role_id'))
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
				email: fd.get('email') as string,
				password_hash: finalHash,
				phone_number: fd.get('phone_number') as string,
				role_id: Number(fd.get('role_id'))
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
					error: "Cannot delete this user because they have existing operations history. Please delete operations first."
				});
			}
			return fail(500, { error: error.message || "Failed to delete item." });
		}
	}
}