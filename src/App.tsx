import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
    BarChart3,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    FileChartColumn,
    Globe2,
    KeyRound,
    LayoutDashboard,
    LockKeyhole,
    LogOut,
    Mail,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    Repeat2,
    Settings2,
    SlidersHorizontal,
    WalletCards,
} from "lucide-react";
import {
    getUser,
    getSession,
    loadData,
    localTest,
    login,
    loginWithGoogle,
    mutate,
    logout,
    register,
    resetPassword,
    setPassword,
    subscribeToAuth,
} from "./api.ts";
import {
    authModeAfterSessionEvent,
    passwordValidationError,
} from "./auth.ts";
import type { AuthMode } from "./auth.ts";
import {
    CHANNELS,
    DEFAULT_BUDGETS,
    EMPTY,
    addMonths,
    allocation,
    allocationPosition,
    budgetFor,
    categoryLabel,
    matchesCategory,
    monthLabel,
    money,
    today,
    totals,
} from "./domain.ts";
import type {
    Category,
    CategoryFilter,
    Channel,
    Data,
    Expense,
    Refund,
    Schedule,
} from "./domain.ts";
import {
    Detail,
    Empty,
    ExpenseForm,
    ExpenseList,
    FormEnd,
    LoadingSpinner,
    Modal,
    RefundForm,
    ScheduleForm,
    channelIcons,
} from "./components.tsx";

type Page = "overview" | "expenses" | "reports" | "budgets";
const pageLabels: Record<Page, string> = {
    overview: "Tổng quan",
    expenses: "Khoản chi",
    reports: "Báo cáo & phân bổ",
    budgets: "Ngân sách",
};
const nav = [
    { id: "overview" as Page, label: "Tổng quan", icon: LayoutDashboard },
    { id: "expenses" as Page, label: "Khoản chi", icon: WalletCards },
    { id: "reports" as Page, label: "Báo cáo", icon: BarChart3 },
    { id: "budgets" as Page, label: "Ngân sách", icon: Settings2 },
];
function route(): Page {
    const p = location.hash.replace("#/", "") as Page;
    return pageLabels[p] ? p : "overview";
}
function useRoute() {
    const [page, setPage] = useState<Page>(route);
    useEffect(() => {
        const on = () => setPage(route());
        addEventListener("hashchange", on);
        return () => removeEventListener("hashchange", on);
    }, []);
    return [
        page,
        (p: Page) => {
            location.hash = `/${p}`;
        },
    ] as const;
}

function CategoryManager({
    categories,
    onAction,
    onCreate,
    onClose,
}: {
    categories: Category[];
    onAction: (action: string, payload: unknown) => Promise<void>;
    onCreate: (name: string) => Promise<Category>;
    onClose: () => void;
}) {
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState("");
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const ordered = [...categories].sort((a, b) =>
        a.name.localeCompare(b.name, "vi"),
    );
    async function run(action: string, payload: unknown, key: string) {
        setBusy(key);
        setError("");
        try {
            await onAction(action, payload);
            setEditing(null);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy("");
        }
    }
    async function create() {
        const name = newName.trim();
        if (!name) {
            setError("Nhập tên hạng mục.");
            return;
        }
        setBusy("create");
        setError("");
        try {
            await onCreate(name);
            setNewName("");
            setCreating(false);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy("");
        }
    }
    return (
        <Modal
            title="Quản lý hạng mục"
            subtitle="Đổi tên hoặc lưu trữ hạng mục của bạn."
            onClose={onClose}
        >
            <div className="form-body category-manager">
                <div className="category-manager-actions">
                    <button
                        type="button"
                        className="button primary"
                        disabled={!!busy}
                        onClick={() => {
                            setCreating((open) => !open);
                            setError("");
                        }}
                    >
                        {!creating && <Plus size={16} />}
                        {creating ? "Đóng tạo" : "Tạo hạng mục"}
                    </button>
                </div>
                {creating && (
                    <form
                        className="category-manager-create"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void create();
                        }}
                    >
                        <input
                            autoFocus
                            aria-label="Tên hạng mục mới"
                            maxLength={100}
                            value={newName}
                            placeholder="Ví dụ: Học tập"
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="button primary"
                            disabled={busy === "create"}
                            aria-busy={busy === "create"}
                        >
                            {busy === "create" ? "Đang tạo…" : "Tạo"}
                        </button>
                    </form>
                )}
                {error && (
                    <p className="error" role="alert">
                        {error}
                    </p>
                )}
                {!ordered.length ? (
                    <Empty
                        title="Chưa có hạng mục"
                        text="Tạo hạng mục đầu tiên bằng nút phía trên."
                    />
                ) : (
                    <div className="category-list">
                        {ordered.map((category) => (
                            <div className="category-row" key={category.id}>
                                {editing === category.id ? (
                                    <input
                                        autoFocus
                                        aria-label={`Đổi tên hạng mục ${category.name}`}
                                        maxLength={100}
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                    />
                                ) : (
                                    <span>
                                        <strong>{category.name}</strong>
                                        <small>
                                            {category.archived
                                                ? "Đã lưu trữ"
                                                : "Đang sử dụng"}
                                        </small>
                                    </span>
                                )}
                                <div className="category-row-actions">
                                    {editing === category.id ? (
                                        <>
                                            <button
                                                type="button"
                                                className="button primary"
                                                disabled={busy === category.id}
                                                aria-busy={busy === category.id}
                                                onClick={() =>
                                                    void run(
                                                        "category_rename",
                                                        { id: category.id, name: draft },
                                                        category.id,
                                                    )
                                                }
                                            >
                                                {busy === category.id ? "Đang lưu…" : "Lưu"}
                                            </button>
                                            <button
                                                type="button"
                                                className="button"
                                                disabled={!!busy}
                                                onClick={() => setEditing(null)}
                                            >
                                                Hủy
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="button"
                                                disabled={!!busy}
                                                onClick={() => {
                                                    setDraft(category.name);
                                                    setEditing(category.id);
                                                    setError("");
                                                }}
                                            >
                                                Đổi tên
                                            </button>
                                            <button
                                                type="button"
                                                className="button"
                                                disabled={!!busy}
                                                onClick={() =>
                                                    void run(
                                                        "category_archive",
                                                        {
                                                            id: category.id,
                                                            archived: !category.archived,
                                                        },
                                                        category.id,
                                                    )
                                                }
                                            >
                                                {category.archived ? "Khôi phục" : "Lưu trữ"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

function CategoryFilterOptions({ categories }: { categories: Category[] }) {
    return (
        <>
            <option value="all">Tất cả hạng mục</option>
            <option value="uncategorized">Chưa phân loại</option>
            {[...categories]
                .sort((a, b) => a.name.localeCompare(b.name, "vi"))
                .map((category) => (
                    <option value={category.id} key={category.id}>
                        {category.name}
                        {category.archived ? " (đã lưu trữ)" : ""}
                    </option>
                ))}
        </>
    );
}

function MonthPicker({
    month,
    onChange,
}: {
    month: string;
    onChange: (m: string) => void;
}) {
    return (
        <div className="month-picker">
            <button
                className="icon-button"
                aria-label="Tháng trước"
                onClick={() => onChange(addMonths(month, -1))}
            >
                <ChevronLeft />
            </button>
            <button
                className="month-name"
                onClick={() => {
                    const input = document.getElementById(
                        "month-input",
                    ) as HTMLInputElement | null;
                    input?.showPicker?.();
                }}
            >
                {monthLabel(month)}
            </button>
            <input
                id="month-input"
                type="month"
                value={month}
                onChange={(e) => onChange(e.target.value)}
                aria-label="Chọn tháng"
            />
            <button
                className="icon-button"
                aria-label="Tháng sau"
                onClick={() => onChange(addMonths(month, 1))}
            >
                <ChevronRight />
            </button>
        </div>
    );
}
function PageHeader({
    title,
    description,
    month,
    onMonth,
    action,
}: {
    title: string;
    description?: string;
    month?: string;
    onMonth?: (m: string) => void;
    action?: React.ReactNode;
}) {
    return (
        <header className="page-header">
            <div>
                <p className="eyebrow">
                    {title === "Tổng quan"
                        ? "SỔ CHI TIÊU CỦA BẠN"
                        : "QUẢN LÝ CHI TIÊU"}
                </p>
                <h1>{title}</h1>
                {description && (
                    <p className="page-description">{description}</p>
                )}
            </div>
            <div className="header-tools">
                {month && onMonth && (
                    <MonthPicker month={month} onChange={onMonth} />
                )}{" "}
                {action}
            </div>
        </header>
    );
}
function StatCard({
    label,
    value,
    sub,
    tone = "neutral",
    icon: Icon,
}: {
    label: string;
    value: string;
    sub?: string;
    tone?: string;
    icon?: typeof CircleDollarSign;
}) {
    return (
        <article className={`stat-card ${tone}`}>
            <div className="stat-top">
                <span>{label}</span>
                {Icon && <Icon size={19} />}
            </div>
            <strong>{value}</strong>
            {sub && <small>{sub}</small>}
        </article>
    );
}
function Progress({ value, total }: { value: number; total: number }) {
    const percent = total
        ? Math.max(0, Math.min(100, (value / total) * 100))
        : 0;
    return (
        <div
            className="progress"
            aria-label={`${Math.round(percent)} phần trăm ngân sách`}
        >
            <span style={{ width: `${percent}%` }} />
        </div>
    );
}
function ChannelCard({
    channel,
    spent,
    refunds,
    budget,
    onClick,
}: {
    channel: Channel;
    spent: number;
    refunds: number;
    budget: number;
    onClick: () => void;
}) {
    const Icon = channelIcons[channel];
    const net = spent - refunds;
    const over = net > budget;
    return (
        <button
            className={`channel-card ${over ? "over" : ""}`}
            onClick={onClick}
        >
            <div className="channel-title">
                <span className={`channel-icon ${channel}`}>
                    <Icon size={18} />
                </span>
                <span>{CHANNELS[channel]}</span>
                <span className="channel-arrow">↗</span>
            </div>
            <strong>{money(net)}</strong>
            <p>đã chi ròng · ngân sách {money(budget)}</p>
            <Progress value={net} total={budget} />
            <div className="channel-foot">
                <span>
                    {over
                        ? `Vượt ${money(net - budget)}`
                        : `Còn ${money(budget - net)}`}
                </span>
                <span>{money(spent)} gộp</span>
            </div>
        </button>
    );
}

function Overview({
    data,
    month,
    onMonth,
    setPage,
    setFilter,
}: {
    data: Data;
    month: string;
    onMonth: (m: string) => void;
    setPage: (p: Page) => void;
    setFilter: (f: string) => void;
}) {
    const t = totals(data.expenses, data.refunds, month, month);
    const pending = data.expenses.filter((e) => e.status === "pending").length;
    const ending = data.expenses.filter(
        (e) =>
            e.status === "confirmed" &&
            allocationPosition(e, data.refunds, month).end === month,
    );
    const channels = Object.keys(CHANNELS) as Channel[];
    return (
        <>
            <PageHeader
                title="Tổng quan"
                description="Nhìn nhanh tiền đã chi và chi phí đang được phân bổ."
                month={month}
                onMonth={onMonth}
                action={
                    <button
                        className="button primary"
                        onClick={() => setPage("expenses")}
                    >
                        <Plus size={18} />
                        Thêm khoản chi
                    </button>
                }
            />
            <section className="stat-grid">
                <StatCard
                    label="Chi ròng tháng này"
                    value={money(t.net)}
                    sub={`Gộp ${money(t.gross)} · hoàn ${money(t.refunds)}`}
                    icon={CircleDollarSign}
                    tone={t.net > 20000000 ? "warning" : "positive"}
                />
                <StatCard
                    label="Chi phí phân bổ"
                    value={money(t.allocated)}
                    sub="Từ các khoản còn hiệu lực"
                    icon={BarChart3}
                />
                <StatCard
                    label="Đang chờ xác nhận"
                    value={String(pending)}
                    sub={
                        pending
                            ? "Khoản tái diễn cần kiểm tra"
                            : "Không có khoản chờ"
                    }
                    icon={Repeat2}
                />
                <StatCard
                    label="Kết thúc phân bổ"
                    value={String(ending.length)}
                    sub={
                        ending.length
                            ? "Trong tháng đang xem"
                            : "Chưa có khoản kết thúc"
                    }
                    icon={FileChartColumn}
                />
            </section>
            <section className="section-block">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">NGÂN SÁCH THEO KÊNH</p>
                        <h2>Tháng này bạn đang ở đâu?</h2>
                    </div>
                    <button
                        className="text-button"
                        onClick={() => setPage("budgets")}
                    >
                        Điều chỉnh ngân sách <ChevronRight size={16} />
                    </button>
                </div>
                <div className="channel-grid">
                    {channels.map((ch) => (
                        <ChannelCard
                            key={ch}
                            channel={ch}
                            budget={budgetFor(data, month, ch)}
                            spent={data.expenses
                                .filter(
                                    (e) =>
                                        e.status === "confirmed" &&
                                        e.date.slice(0, 7) === month &&
                                        e.channel === ch,
                                )
                                .reduce((s, e) => s + e.amount, 0)}
                            refunds={data.refunds
                                .filter(
                                    (r) =>
                                        r.date.slice(0, 7) === month &&
                                        data.expenses.find(
                                            (e) => e.id === r.expense_id,
                                        )?.channel === ch,
                                )
                                .reduce((s, r) => s + r.amount, 0)}
                            onClick={() => {
                                setFilter(ch);
                                setPage("expenses");
                            }}
                        />
                    ))}
                </div>
            </section>
            <section className="two-column">
                <div className="panel">
                    <div className="section-heading compact">
                        <div>
                            <p className="eyebrow">PHÂN BỔ</p>
                            <h2>Chi phí tháng {month.slice(5)}</h2>
                        </div>
                        <button
                            className="text-button"
                            onClick={() => setPage("reports")}
                        >
                            Mở báo cáo <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="allocation-callout">
                        <div className="allocation-number">
                            {money(t.allocated)}
                        </div>
                        <p>
                            Tổng chi phí sử dụng ghi nhận trong{" "}
                            {monthLabel(month).toLowerCase()}.
                        </p>
                    </div>
                    {ending.slice(0, 3).map((e) => (
                        <div className="mini-row" key={e.id}>
                            <span>
                                <strong>{e.description}</strong>
                                <small>Kỳ cuối · {e.months} tháng</small>
                            </span>
                            <strong>
                                {money(
                                    allocationPosition(e, data.refunds, month)
                                        .current,
                                )}
                            </strong>
                        </div>
                    ))}
                    {!ending.length && (
                        <p className="muted">
                            Chưa có khoản nào kết thúc phân bổ trong tháng này.
                        </p>
                    )}
                </div>
                <div className="panel">
                    <div className="section-heading compact">
                        <div>
                            <p className="eyebrow">GẦN ĐÂY</p>
                            <h2>Khoản chi mới nhất</h2>
                        </div>
                        <button
                            className="text-button"
                            onClick={() => setPage("expenses")}
                        >
                            Xem tất cả <ChevronRight size={16} />
                        </button>
                    </div>
                    {data.expenses
                        .filter(
                            (e) => !["cancelled", "skipped"].includes(e.status),
                        )
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 4)
                        .map((e) => (
                            <div className="mini-row" key={e.id}>
                                <span>
                                    <strong>{e.description}</strong>
                                    <small>
                                        {CHANNELS[e.channel]} · {e.date}
                                    </small>
                                </span>
                                <strong>{money(e.amount)}</strong>
                            </div>
                        ))}
                    {!data.expenses.length && <Empty />}
                </div>
            </section>
        </>
    );
}

function ExpensesPage({
    data,
    month,
    onMonth,
    onSaved,
    initialFilter,
    onCreateCategory,
    onCategoryAction,
}: {
    data: Data;
    month: string;
    onMonth: (m: string) => void;
    onSaved: () => Promise<unknown>;
    initialFilter?: string;
    onCreateCategory: (name: string) => Promise<Category>;
    onCategoryAction: (action: string, payload: unknown) => Promise<void>;
}) {
    const [tab, setTab] = useState<"expenses" | "pending" | "schedules">(
        initialFilter === "pending" ? "pending" : "expenses",
    );
    const [query, setQuery] = useState("");
    const [channel, setChannel] = useState(
        initialFilter && initialFilter !== "pending" ? initialFilter : "all",
    );
    const [tag, setTag] = useState("all");
    const [kind, setKind] = useState("all");
    const [category, setCategory] = useState<CategoryFilter>("all");
    const [modal, setModal] = useState<
        "new" | "edit" | "detail" | "refund" | "schedule" | "categories" | null
    >(null);
    const [selected, setSelected] = useState<Expense>();
    const [schedule, setSchedule] = useState<Schedule>();
    const [toast, setToast] = useState("");
    const save = async (action: string, payload: unknown, id: string) => {
        await mutate(action, payload, id);
        await onSaved();
        setToast("Đã lưu thay đổi");
        setTimeout(() => setToast(""), 2400);
    };
    const list = useMemo(
        () =>
            data.expenses
                .filter(
                    (e) =>
                        !["cancelled", "skipped"].includes(e.status) &&
                        (tab === "pending"
                            ? e.status === "pending"
                            : tab === "expenses"
                              ? e.status === "confirmed"
                              : true),
                )
                .filter(
                    (e) =>
                        !query ||
                        e.description
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                )
                .filter((e) => channel === "all" || e.channel === channel)
                .filter((e) => tag === "all" || e.tag === tag)
                .filter((e) => kind === "all" || e.kind === kind)
                .filter((e) => matchesCategory(e, category))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [data, query, channel, tag, kind, category, tab],
    );
    const open = (e: Expense, mode: "detail" | "edit" = "detail") => {
        setSelected(e);
        setModal(mode);
    };
    return (
        <>
            <PageHeader
                title="Khoản chi"
                description="Ghi nhận từng khoản và kiểm tra các kỳ tái diễn."
                month={month}
                onMonth={onMonth}
                action={
                    <div className="header-actions">
                        <button
                            className="button"
                            onClick={() => setModal("categories")}
                        >
                            Quản lý hạng mục
                        </button>
                        <button
                            className="button primary"
                            onClick={() => {
                                setSelected(undefined);
                                setModal("new");
                            }}
                        >
                            <Plus size={18} />
                            Thêm khoản chi
                        </button>
                    </div>
                }
            />
            <div className="tabs">
                <button
                    className={tab === "expenses" ? "active" : ""}
                    onClick={() => setTab("expenses")}
                >
                    Đã ghi nhận{" "}
                    <span>
                        {
                            data.expenses.filter(
                                (e) => e.status === "confirmed",
                            ).length
                        }
                    </span>
                </button>
                <button
                    className={tab === "pending" ? "active" : ""}
                    onClick={() => setTab("pending")}
                >
                    Chờ xác nhận{" "}
                    <span>
                        {
                            data.expenses.filter((e) => e.status === "pending")
                                .length
                        }
                    </span>
                </button>
                <button
                    className={tab === "schedules" ? "active" : ""}
                    onClick={() => setTab("schedules")}
                >
                    Lịch tái diễn{" "}
                    <span>{data.schedules.filter((s) => s.active).length}</span>
                </button>
            </div>
            {tab !== "schedules" ? (
                <>
                    <div className="filters">
                        <input
                            aria-label="Tìm diễn giải"
                            placeholder="Tìm theo diễn giải…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <select
                            value={channel}
                            onChange={(e) => setChannel(e.target.value)}
                        >
                            <option value="all">Tất cả kênh</option>
                            {Object.entries(CHANNELS).map(([id, name]) => (
                                <option key={id} value={id}>
                                    {name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={kind}
                            onChange={(e) => setKind(e.target.value)}
                        >
                            <option value="all">Tất cả phân loại</option>
                            <option value="once">Phát sinh 1 lần</option>
                            <option value="recurring">Tái diễn</option>
                        </select>
                        <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                        >
                            <option value="all">Tất cả nhãn</option>
                            <option>Asset</option>
                            <option>Tools</option>
                            <option>Allocation</option>
                        </select>
                        <select
                            aria-label="Lọc khoản chi theo hạng mục"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <CategoryFilterOptions categories={data.categories} />
                        </select>
                        <span className="filter-count">
                            <SlidersHorizontal size={16} />
                            {list.length} khoản
                        </span>
                    </div>
                    <ExpenseList
                        expenses={list}
                        refunds={data.refunds}
                        month={month}
                        categories={data.categories}
                        onOpen={(e) => open(e)}
                    />
                </>
            ) : (
                <ScheduleList
                    schedules={data.schedules}
                    expenses={data.expenses}
                    categories={data.categories}
                    onOpen={(s) => {
                        setSchedule(s);
                        setModal("schedule");
                    }}
                    onNew={() => {
                        setSchedule(undefined);
                        setModal("schedule");
                    }}
                />
            )}
            {toast && (
                <div className="toast" role="status">
                    {toast}
                </div>
            )}
            {modal === "new" && (
                <Modal
                    title="Thêm khoản chi"
                    subtitle="Lưu ngay vào sổ chi tiêu của bạn."
                    onClose={() => setModal(null)}
                >
                    <ExpenseForm
                        save={save}
                        onClose={() => setModal(null)}
                        categories={data.categories}
                        onCreateCategory={onCreateCategory}
                    />
                </Modal>
            )}
            {modal === "edit" && selected && (
                <Modal
                    title={
                        selected.status === "pending"
                            ? "Xác nhận khoản tái diễn"
                            : "Sửa khoản chi"
                    }
                    subtitle={selected.description}
                    onClose={() => setModal(null)}
                >
                    <ExpenseForm
                        expense={selected}
                        save={save}
                        onClose={() => setModal(null)}
                        categories={data.categories}
                        onCreateCategory={onCreateCategory}
                    />
                </Modal>
            )}
            {modal === "detail" && selected && (
                <Modal
                    title={selected.description}
                    subtitle="Chi tiết khoản chi"
                    onClose={() => setModal(null)}
                >
                    <Detail
                        expense={selected}
                        refunds={data.refunds}
                        month={month}
                        categories={data.categories}
                        onEdit={() => setModal("edit")}
                        onRefund={() => setModal("refund")}
                        onAction={async (action) => {
                            try {
                                await save(
                                    action,
                                    {
                                        id: selected.id,
                                        version: selected.version,
                                    },
                                    crypto.randomUUID(),
                                );
                                setModal(null);
                            } catch (err) {
                                setToast((err as Error).message);
                                setTimeout(() => setToast(""), 4000);
                            }
                        }}
                    />
                </Modal>
            )}
            {modal === "refund" && selected && (
                <Modal
                    title="Ghi nhận hoàn tiền"
                    subtitle={selected.description}
                    onClose={() => setModal(null)}
                >
                    <RefundForm
                        expense={selected}
                        refunds={data.refunds}
                        save={save}
                        onClose={() => setModal(null)}
                    />
                </Modal>
            )}
            {modal === "schedule" && (
                <Modal
                    title={
                        schedule ? "Sửa lịch tái diễn" : "Thêm lịch tái diễn"
                    }
                    subtitle="Tạo khoản chờ xác nhận theo kỳ."
                    onClose={() => setModal(null)}
                >
                    <ScheduleForm
                        schedule={schedule}
                        save={save}
                        onClose={() => setModal(null)}
                        categories={data.categories}
                        onCreateCategory={onCreateCategory}
                    />
                </Modal>
            )}
            {modal === "categories" && (
                <CategoryManager
                    categories={data.categories}
                    onAction={onCategoryAction}
                    onCreate={onCreateCategory}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}
function ScheduleList({
    schedules,
    expenses,
    categories,
    onOpen,
    onNew,
}: {
    schedules: Schedule[];
    expenses: Expense[];
    categories: Category[];
    onOpen: (s: Schedule) => void;
    onNew: () => void;
}) {
    return (
        <div className="schedule-list">
            <div className="schedule-head">
                <div>
                    <p className="eyebrow">LỊCH ĐANG THEO DÕI</p>
                    <h2>Tái diễn mà bạn kiểm soát được</h2>
                </div>
                <button className="button primary" onClick={onNew}>
                    <Plus size={18} />
                    Thêm lịch
                </button>
            </div>
            {!schedules.length ? (
                <Empty
                    title="Chưa có lịch tái diễn"
                    text="Tạo lịch để ứng dụng chuẩn bị khoản chờ xác nhận cho bạn."
                />
            ) : (
                schedules.map((s) => {
                    const count = expenses.filter(
                        (e) => e.schedule_id === s.id && e.status === "pending",
                    ).length;
                    return (
                        <button
                            className="schedule-row"
                            key={s.id}
                            onClick={() => onOpen(s)}
                        >
                            <span className="channel-icon transfer">
                                <Repeat2 size={19} />
                            </span>
                            <span>
                                <strong>{s.description}</strong>
                                <small>
                                    {money(s.amount)} ·{" "}
                                    {s.frequency === "monthly"
                                        ? "mỗi tháng"
                                        : "mỗi năm"}{" "}
                                    · {s.automatic ? "Tự tạo" : "Nhập tay"} ·{" "}
                                    {categoryLabel(s, categories)}
                                </small>
                            </span>
                            <span
                                className={
                                    s.active ? "status active" : "status"
                                }
                            >
                                {s.active ? "Đang chạy" : "Đã ngừng"}
                            </span>
                            <span>
                                {count ? `${count} chờ xác nhận` : "Đã đồng bộ"}
                            </span>
                            <ChevronRight size={18} />
                        </button>
                    );
                })
            )}
        </div>
    );
}

function ReportsPage({
    data,
    month,
    onMonth,
}: {
    data: Data;
    month: string;
    onMonth: (m: string) => void;
}) {
    const [mode, setMode] = useState<"spent" | "allocated">("spent");
    const [group, setGroup] = useState<
        "channel" | "tag" | "kind" | "category"
    >("channel");
    const [status, setStatus] = useState("all");
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<CategoryFilter>("all");
    const [range, setRange] = useState({ from: month, to: month });
    useEffect(() => setRange({ from: month, to: month }), [month]);
    const { from, to } = range;
    const filtered = data.expenses
        .filter(
            (e) =>
                e.status === "confirmed" &&
                (!query ||
                    e.description.toLowerCase().includes(query.toLowerCase())),
        )
        .filter(
            (e) =>
                status === "all" ||
                allocationPosition(e, data.refunds, to).status === status,
        );
    const categoryFiltered = filtered.filter((e) =>
        matchesCategory(e, category),
    );
    const total = totals(categoryFiltered, data.refunds, from, to);
    const buckets = new Map<string, number>();
    for (const e of categoryFiltered) {
        const key =
            group === "channel"
                ? CHANNELS[e.channel]
                : group === "tag"
                  ? e.tag
                  : group === "kind"
                    ? e.kind === "once"
                        ? "Phát sinh 1 lần"
                        : "Tái diễn"
                    : categoryLabel(e, data.categories);
        const value =
            mode === "spent"
                ? e.date.slice(0, 7) >= from && e.date.slice(0, 7) <= to
                    ? e.amount
                    : 0
                : Object.entries(allocation(e, data.refunds))
                      .filter(([m]) => m >= from && m <= to)
                      .reduce((s, [, v]) => s + v, 0);
        buckets.set(key, (buckets.get(key) || 0) + value);
    }
    const ending = categoryFiltered.filter(
        (e) =>
            allocationPosition(e, data.refunds, to).end >= from &&
            allocationPosition(e, data.refunds, to).end <= to,
    );
    return (
        <>
            <PageHeader
                title="Báo cáo & phân bổ"
                description="Tách tiền đã thanh toán khỏi chi phí sử dụng theo tháng."
                month={month}
                onMonth={onMonth}
            />
            <div className="report-switch">
                <button
                    className={mode === "spent" ? "active" : ""}
                    onClick={() => setMode("spent")}
                >
                    Tiền đã chi
                </button>
                <button
                    className={mode === "allocated" ? "active" : ""}
                    onClick={() => setMode("allocated")}
                >
                    Chi phí phân bổ
                </button>
            </div>
            <div className="report-toolbar">
                <label className="range-filter">
                    <span>Từ</span>
                    <span className="month-input-shell">
                        <input
                            type="month"
                            value={from}
                            onChange={(e) =>
                                setRange({ ...range, from: e.target.value })
                            }
                        />
                    </span>
                </label>
                <label className="range-filter">
                    <span>Đến</span>
                    <span className="month-input-shell">
                        <input
                            type="month"
                            value={to}
                            onChange={(e) =>
                                setRange({ ...range, to: e.target.value })
                            }
                        />
                    </span>
                </label>
                <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value as typeof group)}
                >
                    <option value="channel">Nhóm theo kênh</option>
                    <option value="tag">Nhóm theo nhãn</option>
                    <option value="kind">Nhóm theo phân loại</option>
                    <option value="category">Nhóm theo hạng mục</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                >
                    <option value="all">Mọi trạng thái</option>
                    <option value="future">Chưa bắt đầu</option>
                    <option value="active">Đang phân bổ</option>
                    <option value="ended">Đã hết</option>
                </select>
                <select
                    aria-label="Lọc báo cáo theo hạng mục"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <CategoryFilterOptions categories={data.categories} />
                </select>
                <input
                    placeholder="Tìm diễn giải…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <section className="stat-grid report-stats">
                <StatCard
                    label={mode === "spent" ? "Tiền đã chi" : "Chi phí phân bổ"}
                    value={money(
                        mode === "spent" ? total.net : total.allocated,
                    )}
                    sub={`Trong ${from === to ? monthLabel(from).toLowerCase() : `${monthLabel(from)} – ${monthLabel(to)}`}`}
                    icon={BarChart3}
                />
                <StatCard
                    label="Giá trị mua gộp"
                    value={money(total.gross)}
                    sub={`Hoàn tiền ${money(total.refunds)}`}
                    icon={CircleDollarSign}
                />
                <StatCard
                    label="Khoản kết thúc trong kỳ"
                    value={String(ending.length)}
                    sub="Có thể kiểm tra lại lịch sử"
                    icon={FileChartColumn}
                />
            </section>
            <div className="report-grid">
                <section className="panel">
                    <div className="section-heading compact">
                        <div>
                            <p className="eyebrow">PHÂN BỔ THEO NHÓM</p>
                            <h2>
                                {group === "channel"
                                    ? "Kênh"
                                    : group === "tag"
                                      ? "Nhãn"
                                      : group === "kind"
                                        ? "Phân loại"
                                        : "Hạng mục"}
                            </h2>
                        </div>
                    </div>
                    <div className="bucket-list">
                        {[...buckets.entries()]
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, value]) => (
                                <div className="bucket" key={name}>
                                    <div>
                                        <strong>{name}</strong>
                                        <span>{money(value)}</span>
                                    </div>
                                    <Progress
                                        value={value}
                                        total={
                                            mode === "spent"
                                                ? total.net
                                                : total.allocated
                                        }
                                    />
                                </div>
                            ))}
                        {!buckets.size && <Empty />}
                    </div>
                </section>
                <section className="panel">
                    <div className="section-heading compact">
                        <div>
                            <p className="eyebrow">KẾT THÚC PHÂN BỔ</p>
                            <h2>Khoản cần chú ý</h2>
                        </div>
                    </div>
                    {ending.slice(0, 8).map((e) => (
                        <div className="mini-row" key={e.id}>
                            <span>
                                <strong>{e.description}</strong>
                                <small>
                                    Kỳ cuối{" "}
                                    {
                                        allocationPosition(e, data.refunds, to)
                                            .end
                                    }{" "}
                                    · {e.tag}
                                </small>
                            </span>
                            <strong>
                                {money(
                                    allocationPosition(e, data.refunds, to)
                                        .current,
                                )}
                            </strong>
                        </div>
                    ))}
                    {!ending.length && (
                        <p className="muted">
                            Không có khoản nào kết thúc trong khoảng này.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

function BudgetsPage({
    data,
    month,
    onMonth,
    onSaved,
}: {
    data: Data;
    month: string;
    onMonth: (m: string) => void;
    onSaved: () => Promise<unknown>;
}) {
    const formatBudget = (value: number | string) =>
        String(value)
            .replace(/\D/g, "")
            .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const parseBudget = (value: string) =>
        Number(value.replace(/\D/g, "")) || 0;
    const readBudgets = () =>
        Object.fromEntries(
            (Object.keys(CHANNELS) as Channel[]).map((ch) => [
                ch,
                formatBudget(budgetFor(data, month, ch)),
            ]),
        ) as Record<Channel, string>;
    const [values, setValues] = useState<Record<Channel, string>>(readBudgets);
    const [busy, setBusy] = useState(false),
        [error, setError] = useState(""),
        [saved, setSaved] = useState(false);
    useEffect(() => setValues(readBudgets()), [data, month]);
    const total = Object.values(values).reduce(
        (sum, value) => sum + parseBudget(value),
        0,
    );
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            await mutate(
                "budget",
                {
                    month,
                    items: Object.entries(values).map(([channel, amount]) => ({
                        channel,
                        amount: parseBudget(amount),
                    })),
                },
                crypto.randomUUID(),
            );
            await onSaved();
            setSaved(true);
            setTimeout(() => setSaved(false), 2200);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <>
            <PageHeader
                title="Ngân sách"
                description="Đặt hạn mức riêng cho từng kênh của mỗi tháng."
                month={month}
                onMonth={onMonth}
            />
            <form className="budget-layout" onSubmit={submit}>
                <section className="panel budget-form">
                    <div className="section-heading compact">
                        <div>
                            <p className="eyebrow">THIẾT LẬP HẠN MỨC</p>
                            <h2>{monthLabel(month)}</h2>
                        </div>
                    </div>
                    {(Object.keys(CHANNELS) as Channel[]).map((ch) => (
                        <label className="budget-field" key={ch}>
                            <span>
                                <span className={`channel-icon ${ch}`}>
                                    <CircleDollarSign size={17} />
                                </span>
                                {CHANNELS[ch]}
                            </span>
                            <div className="budget-input-wrap">
                                <input
                                    className="budget-input"
                                    type="text"
                                    inputMode="numeric"
                                    value={values[ch]}
                                    aria-label={`Ngân sách ${CHANNELS[ch]}`}
                                    placeholder="0"
                                    onFocus={(e) => e.currentTarget.select()}
                                    onChange={(e) =>
                                        setValues({
                                            ...values,
                                            [ch]: formatBudget(e.target.value),
                                        })
                                    }
                                />
                                <span aria-hidden="true">₫</span>
                            </div>
                        </label>
                    ))}
                    <div className="budget-total">
                        <span>Tổng ngân sách</span>
                        <strong>{money(total)}</strong>
                    </div>
                    <FormEnd
                        busy={busy}
                        error={error}
                        label={saved ? "Đã lưu" : "Lưu ngân sách"}
                    />
                </section>
                <section className="panel budget-explainer">
                    <div className="budget-orb">
                        <WalletCards size={30} />
                    </div>
                    <p className="eyebrow">NGUYÊN TẮC</p>
                    <h2>Ngân sách là tiền bạn thực sự cho phép chi.</h2>
                    <p>
                        Chi phí phân bổ được hiển thị riêng, nên một khoản mua
                        lớn không làm bạn quên rằng tiền đã rời khỏi ngân sách
                        ngay trong tháng mua.
                    </p>
                    <ul>
                        <li>Không chuyển dư sang tháng sau.</li>
                        <li>Vượt ngân sách vẫn được lưu và cảnh báo.</li>
                        <li>Thay tháng này không đổi lịch sử tháng khác.</li>
                    </ul>
                </section>
            </form>
        </>
    );
}

function appUrl(query?: string) {
    const url = new URL(window.location.href);
    url.hash = "";
    url.search = query ? `?${query}` : "";
    return url.toString();
}

function AuthScreen({
    initialMode,
    onAuthenticated,
}: {
    initialMode: AuthMode;
    onAuthenticated: () => Promise<void>;
}) {
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [email, setEmail] = useState(localTest ? "local@test" : "");
    const [password, setPasswordValue] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const title =
        mode === "signup"
            ? "Tạo tài khoản"
            : mode === "forgot"
              ? "Lấy lại mật khẩu"
              : mode === "reset"
                ? "Đặt mật khẩu mới"
                : "Đăng nhập";

    function changeMode(next: AuthMode) {
        setMode(next);
        setError("");
        setNotice("");
        setPasswordValue("");
        setConfirmation("");
        if (next !== "reset") history.replaceState({}, "", appUrl());
    }

    async function submit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");
        if (mode !== "forgot" && mode !== "signin") {
            const passwordError = passwordValidationError(
                password,
                confirmation,
            );
            if (passwordError) {
                setError(passwordError);
                return;
            }
        }
        setBusy(true);
        try {
            if (mode === "signin") {
                await login(email.trim(), password);
                await onAuthenticated();
            } else if (mode === "signup") {
                const result = await register(
                    email.trim(),
                    password,
                    appUrl(),
                );
                if (result.session) await onAuthenticated();
                else
                    setNotice(
                        "Đã tạo tài khoản. Hãy kiểm tra email để xác thực trước khi đăng nhập.",
                    );
            } else if (mode === "forgot") {
                await resetPassword(email.trim(), appUrl("auth=reset"));
                setNotice(
                    "Nếu email tồn tại, hướng dẫn khôi phục đã được gửi. Hãy kiểm tra hộp thư.",
                );
            } else {
                await setPassword(password);
                history.replaceState({}, "", appUrl());
                await onAuthenticated();
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="auth-screen">
            <section className="auth-card" aria-labelledby="auth-title">
                <div className="auth-brand">
                    <span className="brand-mark">
                        <CircleDollarSign size={30} />
                    </span>
                    <p className="eyebrow">THU CHI</p>
                </div>
                <h1 id="auth-title">{title}</h1>
                <p className="auth-description">
                    {mode === "signup"
                        ? "Tạo sổ chi tiêu riêng của bạn."
                        : mode === "forgot"
                          ? "Nhập email đã đăng ký để nhận liên kết khôi phục."
                          : mode === "reset"
                            ? "Chọn mật khẩu mới cho tài khoản của bạn."
                            : "Theo dõi ngân sách thực chi và chi phí phân bổ trong cùng một nơi."}
                </p>
                <form className="auth-form" onSubmit={(e) => void submit(e)}>
                    {mode !== "reset" && (
                        <label>
                            <span>Email</span>
                            <div className="auth-input">
                                <Mail size={18} aria-hidden="true" />
                                <input
                                    required
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    placeholder="you@example.com"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </label>
                    )}
                    {mode !== "forgot" && (
                        <label>
                            <span>{mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}</span>
                            <div className="auth-input">
                                <LockKeyhole size={18} aria-hidden="true" />
                                <input
                                    required
                                    type="password"
                                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                                    minLength={8}
                                    value={password}
                                    placeholder="Ít nhất 8 ký tự"
                                    onChange={(e) => setPasswordValue(e.target.value)}
                                />
                            </div>
                        </label>
                    )}
                    {(mode === "signup" || mode === "reset") && (
                        <label>
                            <span>Xác nhận mật khẩu</span>
                            <div className="auth-input">
                                <LockKeyhole size={18} aria-hidden="true" />
                                <input
                                    required
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    value={confirmation}
                                    placeholder="Nhập lại mật khẩu"
                                    onChange={(e) => setConfirmation(e.target.value)}
                                />
                            </div>
                        </label>
                    )}
                    {error && <p className="error" role="alert">{error}</p>}
                    {notice && <p className="auth-notice" role="status">{notice}</p>}
                    <button
                        className="button primary auth-submit"
                        disabled={busy}
                        aria-busy={busy}
                        type="submit"
                    >
                        {busy && <LoadingSpinner />}
                        {busy ? "Đang xử lý…" : mode === "signup" ? "Tạo tài khoản" : mode === "forgot" ? "Gửi liên kết" : mode === "reset" ? "Lưu mật khẩu" : "Đăng nhập"}
                    </button>
                </form>
                {(mode === "signin" || mode === "signup") && !localTest && (
                    <>
                        <div className="auth-divider"><span>hoặc</span></div>
                        <button
                            className="button auth-google"
                            type="button"
                            disabled={busy}
                            aria-busy={busy}
                            onClick={() => {
                                setError("");
                                setBusy(true);
                                void loginWithGoogle(appUrl()).catch((e) => {
                                    setError((e as Error).message);
                                    setBusy(false);
                                });
                            }}
                        >
                            {busy ? <LoadingSpinner /> : <Globe2 size={18} />}
                            {busy ? "Đang kết nối…" : "Tiếp tục với Google"}
                        </button>
                    </>
                )}
                <div className="auth-links">
                    {mode === "signin" && (
                        <>
                            <button type="button" onClick={() => changeMode("forgot")}>Quên mật khẩu?</button>
                            <button type="button" onClick={() => changeMode("signup")}>Tạo tài khoản mới</button>
                        </>
                    )}
                    {mode === "signup" && <button type="button" onClick={() => changeMode("signin")}>Đã có tài khoản? Đăng nhập</button>}
                    {mode === "forgot" && <button type="button" onClick={() => changeMode("signin")}>Quay lại đăng nhập</button>}
                    {mode === "reset" && <button type="button" onClick={() => changeMode("signin")}>Hủy</button>}
                </div>
                {localTest && <p className="auth-footnote">Local test dùng mật khẩu trong output/local-test-password.txt.</p>}
            </section>
        </main>
    );
}

function SetPasswordDialog({
    onClose,
    onDone,
}: {
    onClose: () => void;
    onDone: () => Promise<void>;
}) {
    const [password, setPasswordValue] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function submit(e: FormEvent) {
        e.preventDefault();
        const validation = passwordValidationError(password, confirmation);
        if (validation) return setError(validation);
        setBusy(true);
        setError("");
        try {
            await setPassword(password);
            await onDone();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <Modal title="Đặt mật khẩu" subtitle="Dùng email tài khoản để đăng nhập lần sau." onClose={onClose}>
            <form className="form-body" onSubmit={(e) => void submit(e)}>
                <label>
                    Mật khẩu mới
                    <input required minLength={8} type="password" value={password} onChange={(e) => setPasswordValue(e.target.value)} />
                </label>
                <label>
                    Xác nhận mật khẩu
                    <input required minLength={8} type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
                </label>
                <FormEnd busy={busy} error={error} label="Lưu mật khẩu" />
            </form>
        </Modal>
    );
}

export default function App() {
    const [ready, setReady] = useState(false),
        [data, setData] = useState<Data>(EMPTY),
        [error, setError] = useState("");
    const recoveryFlow = new URLSearchParams(window.location.search).get("auth") === "reset";
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [logoutBusy, setLogoutBusy] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>(recoveryFlow ? "reset" : "signin");
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            return localStorage.getItem("thu-chi-sidebar-collapsed") === "true";
        } catch {
            return false;
        }
    });
    const [page, setPage] = useRoute();
    const [month, setMonth] = useState(today().slice(0, 7));
    const [initialFilter, setInitialFilter] = useState<string>();
    async function refresh(): Promise<Data> {
        const next = await loadData();
        setData(next);
        return next;
    }
    async function createCategory(name: string): Promise<Category> {
        const id = crypto.randomUUID();
        await mutate("category_create", { id, name }, id);
        const next = await refresh();
        const created = next.categories.find((category) => category.id === id);
        if (!created) throw new Error("Không tải được hạng mục vừa tạo.");
        return created;
    }
    async function updateCategory(action: string, payload: unknown) {
        await mutate(action, payload, crypto.randomUUID());
        await refresh();
    }
    async function startSession(activeUser?: User | null) {
        try {
            const current = activeUser ?? (await getUser());
            if (!current) {
                setAuthenticated(false);
                setUser(null);
                return;
            }
            await mutate("sync", {}, crypto.randomUUID()).catch(
                () => undefined,
            );
            await refresh();
            setUser(current);
            setAuthenticated(true);
            setError("");
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setReady(true);
        }
    }
    async function start() {
        try {
            const hasSession = await getSession();
            if (hasSession && !recoveryFlow) await startSession();
        } catch (e) {
            setError((e as Error).message);
            setReady(true);
        } finally {
            setReady(true);
        }
    }
    async function handleLogout() {
        setLogoutBusy(true);
        setError("");
        try {
            await logout();
            setAuthenticated(false);
            setUser(null);
            setData(EMPTY);
            setAuthMode("signin");
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLogoutBusy(false);
        }
    }
    useEffect(() => {
        const stop = subscribeToAuth((activeUser) => {
            if (!activeUser) {
                setAuthenticated(false);
                setUser(null);
                setData(EMPTY);
                setAuthMode(authModeAfterSessionEvent(authMode, recoveryFlow, false));
                setReady(true);
            } else if (!recoveryFlow) {
                void startSession(activeUser);
            }
        });
        void start();
        return stop;
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem(
                "thu-chi-sidebar-collapsed",
                String(sidebarCollapsed),
            );
        } catch {
            // Ignore unavailable storage; the in-memory preference still works.
        }
    }, [sidebarCollapsed]);
    if (!ready)
        return (
            <main className="loading-screen">
                <div className="brand-mark">
                    <CircleDollarSign size={30} />
                </div>
                <p>Đang mở sổ chi tiêu…</p>
            </main>
        );
    if (error)
        return (
            <main className="loading-screen">
                <div className="brand-mark">
                    <CircleDollarSign size={30} />
                </div>
                <p className="error" role="alert">
                    {error}
                </p>
            </main>
        );
    if (!authenticated)
        return (
            <AuthScreen
                initialMode={authMode}
                onAuthenticated={() => startSession()}
            />
        );
    const goExpenses = (filter: string) => {
        setInitialFilter(filter);
        setPage("expenses");
    };
    return (
        <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
            <aside className="sidebar">
                <div className="brand sidebar-brand">
                    <div className="sidebar-brand-identity">
                        <span className="brand-mark small">
                            <CircleDollarSign size={22} />
                        </span>
                        <span>
                            thu<span>chi</span>
                        </span>
                    </div>
                    <button
                        className="sidebar-toggle icon-button"
                        aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                        aria-pressed={sidebarCollapsed}
                        title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                        onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                    >
                        {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>
                <nav>
                    {nav.map((n) => {
                        const Icon = n.icon;
                        return (
                            <button
                                key={n.id}
                                className={page === n.id ? "active" : ""}
                                aria-label={n.label}
                                title={n.label}
                                onClick={() => setPage(n.id)}
                            >
                                <Icon size={19} />
                                <span>{n.label}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="sidebar-bottom">
                    <div className="environment">
                        <span className="live-dot" />
                        <span className="environment-label">
                            {localTest ? "Local test" : "Supabase"}
                        </span>
                    </div>
                    {user?.email && <small className="account-email">{user.email}</small>}
                    <button
                        className="sidebar-action"
                        aria-label="Đặt mật khẩu"
                        title="Đặt mật khẩu"
                        onClick={() => setPasswordOpen(true)}
                    >
                        <KeyRound size={17} />
                        <span>Đặt mật khẩu</span>
                    </button>
                    <button
                        className="sidebar-action"
                        aria-label="Đăng xuất"
                        title="Đăng xuất"
                        disabled={logoutBusy}
                        aria-busy={logoutBusy}
                        onClick={() => void handleLogout()}
                    >
                        {logoutBusy ? (
                            <LoadingSpinner size={17} />
                        ) : (
                            <LogOut size={17} />
                        )}
                        <span>{logoutBusy ? "Đang đăng xuất…" : "Đăng xuất"}</span>
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <div className="mobile-top">
                    <div className="brand">
                        <span className="brand-mark small">
                            <CircleDollarSign size={22} />
                        </span>
                        <span>
                            thu<span>chi</span>
                        </span>
                    </div>
                    <button
                        className="icon-button mobile-password"
                        aria-label="Đặt mật khẩu"
                        onClick={() => setPasswordOpen(true)}
                    >
                        <KeyRound size={19} />
                    </button>
                    <button
                        className="icon-button mobile-logout"
                        aria-label="Đăng xuất"
                        aria-busy={logoutBusy}
                        disabled={logoutBusy}
                        onClick={() => void handleLogout()}
                    >
                        {logoutBusy ? (
                            <LoadingSpinner size={20} />
                        ) : (
                            <LogOut size={20} />
                        )}
                    </button>
                </div>
                {page === "overview" && (
                    <Overview
                        data={data}
                        month={month}
                        onMonth={setMonth}
                        setPage={setPage}
                        setFilter={goExpenses}
                    />
                )}{" "}
                {page === "expenses" && (
                    <ExpensesPage
                        data={data}
                        month={month}
                        onMonth={setMonth}
                        onSaved={refresh}
                        initialFilter={initialFilter}
                        onCreateCategory={createCategory}
                        onCategoryAction={updateCategory}
                    />
                )}{" "}
                {page === "reports" && (
                    <ReportsPage data={data} month={month} onMonth={setMonth} />
                )}{" "}
                {page === "budgets" && (
                    <BudgetsPage
                        data={data}
                        month={month}
                        onMonth={setMonth}
                        onSaved={refresh}
                    />
                )}
            </main>
            {passwordOpen && (
                <SetPasswordDialog
                    onClose={() => setPasswordOpen(false)}
                    onDone={async () => {
                        setPasswordOpen(false);
                        await startSession();
                    }}
                />
            )}
            <nav className="bottom-nav">
                {nav.map((n) => {
                    const Icon = n.icon;
                    return (
                        <button
                            key={n.id}
                            className={page === n.id ? "active" : ""}
                            onClick={() => setPage(n.id)}
                        >
                            <Icon size={19} />
                            <span>{n.label.split(" ")[0]}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
