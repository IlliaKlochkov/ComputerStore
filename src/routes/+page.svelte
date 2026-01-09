<script lang="ts">
    import { Card, Button, Label, Input } from 'flowbite-svelte';

    let { form } = $props();
    let isRegister = $state(false);

    function toggleMode() {
        isRegister = !isRegister;
    }
</script>

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
    <div class="mb-8 text-center">
        <h1 class="text-4xl font-extrabold text-primary-900 dark:text-primary-500 mb-2">Store Admin</h1>
        <p class="text-gray-500 dark:text-gray-400">Manage your GPUs and Videocards efficiently</p>
    </div>

    <Card class="w-full max-w-md p-6 shadow-xl border-t-4 border-t-primary-600">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>

        {#if form?.missing}
            <div class="mb-4 text-red-600 text-sm text-center">Please fill in all required fields.</div>
        {/if}
        {#if form?.incorrect}
            <div class="mb-4 text-red-600 text-sm text-center">Invalid email or password.</div>
        {/if}
        {#if form?.userExists}
            <div class="mb-4 text-red-600 text-sm text-center">User with this email already exists.</div>
        {/if}
        {#if form?.error}
            <div class="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded text-center">
                Error: {form.error}
            </div>
        {/if}

        <form method="POST" action={isRegister ? "?/register" : "?/login"} class="flex flex-col space-y-4">

            {#if isRegister}
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <Label class="mb-2">Full Name</Label>
                        <Input type="text" name="full_name" placeholder="John Doe" required>
                        </Input>
                    </div>
                    <div>
                        <Label class="mb-2">Phone</Label>
                        <Input type="text" name="phone" placeholder="+380...">
                        </Input>
                    </div>
                </div>
            {/if}

            <div>
                <Label class="mb-2">Your Email</Label>
                <Input type="email" name="email" placeholder="name@company.com" required value={form?.email ?? ''}>
                </Input>
            </div>

            <div>
                <Label class="mb-2">Password</Label>
                <Input type="password" name="password" placeholder="••••••••" required>
                </Input>
            </div>

            <Button type="submit" color="primary" class="w-full mt-4 font-semibold text-lg">
                {isRegister ? 'Register Now' : 'Sign In'}
            </Button>

            <div class="text-sm font-medium text-gray-500 dark:text-gray-300 text-center mt-4">
                {isRegister ? 'Already have an account?' : 'Not registered?'}
                <button type="button" onclick={toggleMode} class="text-primary-700 hover:underline dark:text-primary-500 ml-1 bg-transparent border-0 p-0 cursor-pointer">
                    {isRegister ? 'Login here' : 'Create account'}
                </button>
            </div>
        </form>
    </Card>
</div>