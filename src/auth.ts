import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AuthClient = SupabaseClient["auth"];
export type AuthMode = "signin" | "signup" | "forgot" | "reset";

export function authModeAfterSessionEvent(
    currentMode: AuthMode,
    recoveryFlow: boolean,
    hasUser: boolean,
): AuthMode {
    return hasUser || recoveryFlow ? currentMode : "signin";
}

export function hasPermanentSession(
    session: { user?: { is_anonymous?: boolean } } | null | undefined,
): boolean {
    return !!session && session.user?.is_anonymous !== true;
}

export function authErrorMessage(message: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes("invalid login credentials"))
        return "Email hoặc mật khẩu không đúng. Nếu tài khoản tạo bằng Google, hãy đặt mật khẩu trước.";
    if (normalized.includes("email not confirmed"))
        return "Email chưa được xác thực. Hãy kiểm tra hộp thư rồi thử lại.";
    if (normalized.includes("user already registered"))
        return "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng Quên mật khẩu.";
    if (normalized.includes("auth session missing"))
        return "Liên kết khôi phục đã hết hạn hoặc không hợp lệ. Hãy yêu cầu liên kết mới.";
    if (normalized.includes("password") && normalized.includes("different"))
        return "Mật khẩu mới phải khác mật khẩu hiện tại.";
    return "Không thể xử lý yêu cầu xác thực. Vui lòng thử lại.";
}

function check(error: { message: string } | null): void {
    if (error) throw new Error(authErrorMessage(error.message));
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
