import test from "node:test";
import assert from "node:assert/strict";
import {
    passwordValidationError,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    requestPasswordReset,
    updatePassword,
    signOut,
} from "../src/auth.ts";
import type { AuthClient } from "../src/auth.ts";

function fakeAuth(overrides: Partial<Record<string, unknown>> = {}) {
    const calls: Array<[string, unknown]> = [];
    const auth = {
        signInWithPassword: async (input: unknown) => {
            calls.push(["signInWithPassword", input]);
            return { data: { user: { id: "u1" } }, error: null };
        },
        signUp: async (input: unknown) => {
            calls.push(["signUp", input]);
            return { data: { user: { id: "u1" }, session: null }, error: null };
        },
        signInWithOAuth: async (input: unknown) => {
            calls.push(["signInWithOAuth", input]);
            return { data: { provider: "google", url: "https://example.test" }, error: null };
        },
        resetPasswordForEmail: async (email: string, options: unknown) => {
            calls.push(["resetPasswordForEmail", { email, options }]);
            return { data: {}, error: null };
        },
        updateUser: async (input: unknown) => {
            calls.push(["updateUser", input]);
            return { data: { user: { id: "u1" } }, error: null };
        },
        signOut: async () => {
            calls.push(["signOut", undefined]);
            return { error: null };
        },
        ...overrides,
    } as unknown as AuthClient;
    return { auth, calls };
}

test("email sign in forwards credentials and returns the user", async () => {
    const { auth, calls } = fakeAuth();
    const user = await signInWithEmail(auth, "a@example.com", "secret123");
    assert.deepEqual(user, { id: "u1" });
    assert.deepEqual(calls[0], [
        "signInWithPassword",
        { email: "a@example.com", password: "secret123" },
    ]);
});

test("signup includes the confirmation redirect", async () => {
    const { auth, calls } = fakeAuth();
    await signUpWithEmail(auth, "a@example.com", "secret123", "https://app.test");
    assert.deepEqual(calls[0], [
        "signUp",
        {
            email: "a@example.com",
            password: "secret123",
            options: { emailRedirectTo: "https://app.test" },
        },
    ]);
});

test("Google, reset, update password, and sign out use Supabase auth", async () => {
    const { auth, calls } = fakeAuth();
    await signInWithGoogle(auth, "https://app.test");
    await requestPasswordReset(auth, "a@example.com", "https://app.test/reset");
    await updatePassword(auth, "new-secret123");
    await signOut(auth);
    assert.deepEqual(calls, [
        ["signInWithOAuth", { provider: "google", options: { redirectTo: "https://app.test" } }],
        ["resetPasswordForEmail", { email: "a@example.com", options: { redirectTo: "https://app.test/reset" } }],
        ["updateUser", { password: "new-secret123" }],
        ["signOut", undefined],
    ]);
});

test("password validation explains mismatched or short passwords", () => {
    assert.equal(passwordValidationError("short", "short"), "Mật khẩu cần ít nhất 8 ký tự.");
    assert.equal(passwordValidationError("long-enough", "different"), "Mật khẩu xác nhận không khớp.");
    assert.equal(passwordValidationError("long-enough", "long-enough"), "");
});

test("auth errors are localized and actionable", async () => {
    const invalid = fakeAuth({
        signInWithPassword: async () => ({
            data: { user: null },
            error: { message: "Invalid login credentials" },
        }),
    });
    await assert.rejects(
        signInWithEmail(invalid.auth, "google@example.com", "wrong"),
        /Email hoặc mật khẩu không đúng.*Google.*đặt mật khẩu/,
    );

    const expired = fakeAuth({
        updateUser: async () => ({
            data: { user: null },
            error: { message: "Auth session missing" },
        }),
    });
    await assert.rejects(
        updatePassword(expired.auth, "new-secret123"),
        /Liên kết khôi phục đã hết hạn hoặc không hợp lệ/,
    );
});
