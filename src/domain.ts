export const CHANNELS = {
    shopping: "Ứng dụng mua sắm",
    transfer: "Mua chuyển khoản",
    assisted: "Nhờ chi hộ",
} as const;
export type Channel = keyof typeof CHANNELS;
export const TAGS = ["Asset", "Tools", "Allocation"] as const;
export type Tag = (typeof TAGS)[number];
export interface Category {
    id: string;
    user_id: string;
    name: string;
    archived: boolean;
    created_at: string;
}
export type CategoryFilter = "all" | "uncategorized" | string;
export const DEFAULT_BUDGETS: Record<Channel, number> = {
    shopping: 10000000,
    transfer: 5000000,
    assisted: 5000000,
};
export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    channel: Channel;
    kind: "once" | "recurring";
    tag: Tag;
    category_id: string | null;
    months: number;
    status: "pending" | "confirmed" | "skipped" | "cancelled";
    schedule_id: string | null;
    period: number | null;
    version: number;
}
export interface Refund {
    id: string;
    expense_id: string;
    amount: number;
    date: string;
    note: string;
}
export interface Schedule {
    id: string;
    description: string;
    amount: number;
    channel: Channel;
    tag: Tag;
    category_id: string | null;
    months: number;
    start_date: string;
    frequency: "monthly" | "yearly";
    automatic: boolean;
    active: boolean;
    version: number;
}
export interface Budget {
    month: string;
    channel: Channel;
    amount: number;
}
export interface Data {
    categories: Category[];
    expenses: Expense[];
    refunds: Refund[];
    schedules: Schedule[];
    budgets: Budget[];
}
export const EMPTY: Data = {
    categories: [],
    expenses: [],
    refunds: [],
    schedules: [],
    budgets: [],
};
export function normalizeCategoryName(name: string): string {
    return name.trim().replace(/\s+/g, " ");
}
export function categoryLabel(
    item: { category_id: string | null },
    categories: Category[],
): string {
    return (
        categories.find((category) => category.id === item.category_id)?.name ??
        "Chưa phân loại"
    );
}
export function matchesCategory(
    item: { category_id: string | null },
    filter: CategoryFilter,
): boolean {
    if (filter === "all") return true;
    if (filter === "uncategorized") return item.category_id === null;
    return item.category_id === filter;
}
export const money = (v: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(v);
export const today = () =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
export const monthNumber = (m: string) =>
    Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
export function addMonths(m: string, count: number): string {
    const n = monthNumber(m) + count;
    return `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, "0")}`;
}
export const monthLabel = (m: string) =>
    `Tháng ${Number(m.slice(5, 7))}, ${m.slice(0, 4)}`;
export function monthRange(start: string, end: string): string[] {
    const result: string[] = [];
    for (let m = start; m <= end; m = addMonths(m, 1)) result.push(m);
    return result;
}
export function dueDate(
    start: string,
    period: number,
    frequency: Schedule["frequency"],
): string {
    const month = addMonths(
        start.slice(0, 7),
        period * (frequency === "yearly" ? 12 : 1),
    );
    const last = new Date(
        Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
    ).getUTCDate();
    return `${month}-${String(Math.min(Number(start.slice(8, 10)), last)).padStart(2, "0")}`;
}
export function allocation(
    e: Expense,
    refunds: Refund[],
): Record<string, number> {
    if (e.status !== "confirmed") return {};
    const start = e.date.slice(0, 7);
    const result: Record<string, number> = {};
    const base = Math.floor(e.amount / e.months);
    for (let i = 0; i < e.months; i++)
        result[addMonths(start, i)] =
            i === e.months - 1 ? e.amount - base * (e.months - 1) : base;
    const grouped: Record<string, number> = {};
    for (const r of refunds.filter((r) => r.expense_id === e.id))
        grouped[r.date.slice(0, 7)] =
            (grouped[r.date.slice(0, 7)] ?? 0) + r.amount;
    const end = addMonths(start, e.months - 1);
    for (const month of Object.keys(grouped).sort()) {
        const future = Object.keys(result).filter((m) => m >= month);
        const balance =
            future.reduce((s, m) => s + result[m], 0) - grouped[month];
        for (const m of future) result[m] = 0;
        if (month > end || balance < 0) result[month] = balance;
        else {
            const months = monthRange(month, end);
            const part = Math.floor(balance / months.length);
            months.forEach((m, i) => {
                result[m] =
                    i === months.length - 1
                        ? balance - part * (months.length - 1)
                        : part;
            });
        }
    }
    return result;
}
export function allocationPosition(
    e: Expense,
    refunds: Refund[],
    month: string,
) {
    const rows = allocation(e, refunds);
    const end = addMonths(e.date.slice(0, 7), e.months - 1);
    const spent = Object.entries(rows)
        .filter(([m]) => m <= month)
        .reduce((s, [, v]) => s + v, 0);
    // Future refunds must not rewrite the remaining balance in a historical view.
    const net =
        e.amount -
        refunds
            .filter((r) => r.expense_id === e.id && r.date.slice(0, 7) <= month)
            .reduce((s, r) => s + r.amount, 0);
    return {
        end,
        spent,
        remaining: net - spent,
        current: rows[month] ?? 0,
        status:
            month < e.date.slice(0, 7)
                ? "future"
                : month > end
                  ? "ended"
                  : "active",
    };
}
export function totals(
    expenses: Expense[],
    refunds: Refund[],
    from: string,
    to: string,
) {
    let gross = 0,
        returned = 0,
        allocated = 0;
    for (const e of expenses.filter((e) => e.status === "confirmed")) {
        if (e.date.slice(0, 7) >= from && e.date.slice(0, 7) <= to)
            gross += e.amount;
        returned += refunds
            .filter(
                (r) =>
                    r.expense_id === e.id &&
                    r.date.slice(0, 7) >= from &&
                    r.date.slice(0, 7) <= to,
            )
            .reduce((s, r) => s + r.amount, 0);
        allocated += Object.entries(allocation(e, refunds))
            .filter(([m]) => m >= from && m <= to)
            .reduce((s, [, v]) => s + v, 0);
    }
    return { gross, refunds: returned, net: gross - returned, allocated };
}
export function budgetFor(data: Data, month: string, channel: Channel) {
    return (
        data.budgets.find((b) => b.month === month && b.channel === channel)
            ?.amount ?? DEFAULT_BUDGETS[channel]
    );
}
