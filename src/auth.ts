import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AuthClient = SupabaseClient["auth"];

function check(error: { message: string } | null): void {
    if (error) throw new Error(error.message);
}

export function passwordValidationError(password: string, confirmation: string) {
    if (password.length < 8) return "Mật khẩu cần ít nhất 8 ký tự.";
    if (password !== confirmation) return "Mật khẩu xác nhận không khớp.";
    return "";
}

export async function signInWithEmail(
    auth: AuthClient,
    email: string,
    password: string,
): Promise<User | null> {
    const { data, error } = await auth.signInWithPassword({ email, password });
    check(error);
    return data.user;
}

export async function signUpWithEmail(
    auth: AuthClient,
    email: string,
    password: string,
    emailRedirectTo: string,
) {
    const { data, error } = await auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
    });
    check(error);
    return data;
}

export async function signInWithGoogle(
    auth: AuthClient,
    redirectTo: string,
): Promise<void> {
    const { error } = await auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
    });
    check(error);
}

export async function requestPasswordReset(
    auth: AuthClient,
    email: string,
    redirectTo: string,
): Promise<void> {
    const { error } = await auth.resetPasswordForEmail(email, { redirectTo });
    check(error);
}

export async function updatePassword(
    auth: AuthClient,
    password: string,
): Promise<User | null> {
    const { data, error } = await auth.updateUser({ password });
    check(error);
    return data.user;
}

export async function signOut(auth: AuthClient): Promise<void> {
    const { error } = await auth.signOut();
    check(error);
}
