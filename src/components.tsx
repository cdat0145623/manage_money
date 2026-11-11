import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
    X,
    ArrowUpRight,
    CalendarDays,
    ShoppingBag,
    ArrowLeftRight,
    UsersRound,
    Repeat2,
    Check,
    LoaderCircle,
    RotateCcw,
} from "lucide-react";
import {
    CHANNELS,
    TAGS,
    money,
    today,
    addMonths,
    monthLabel,
    allocationPosition,
    categoryLabel,
} from "./domain.ts";
import type {
    Category,
    Channel,
    Expense,
    Refund,
    Schedule,
} from "./domain.ts";
export const channelIcons = {
    shopping: ShoppingBag,
    transfer: ArrowLeftRight,
    assisted: UsersRound,
};
export function ChannelIcon({ channel }: { channel: Channel }) {
    const Icon = channelIcons[channel];
    return (
        <span className={`channel-icon ${channel}`}>
            <Icon size={19} aria-hidden="true" />
        </span>
    );
}
export function Empty({
    title = "Chưa có khoản chi",
    text = "Thêm khoản chi đầu tiên để bắt đầu theo dõi ngân sách.",
    children,
}: {
    title?: string;
    text?: string;
    children?: ReactNode;
}) {
    return (
        <div className="empty">
            <span className="empty-icon">
                <CalendarDays size={28} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
            {children}
        </div>
    );
}
export function Modal({
    title,
    subtitle,
    children,
    onClose,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const d = ref.current!;
        d.showModal();
        return () => d.close();
    }, []);
    return (
        <dialog
            ref={ref}
            className="dialog"
            onCancel={onClose}
            aria-labelledby="dialog-title"
        >
            <div className="dialog-header">
                <div>
                    <h2 id="dialog-title">{title}</h2>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                <button
                    className="icon-button"
                    aria-label="Đóng"
                    onClick={onClose}
                >
                    <X />
                </button>
            </div>
            {children}
        </dialog>
    );
}
export function LoadingSpinner({ size = 18 }: { size?: number }) {
    return (
        <LoaderCircle
            className="loading-spinner"
            size={size}
            aria-hidden="true"
        />
    );
}
export type Save = (
    action: string,
    payload: unknown,
    requestId: string,
) => Promise<void>;
export type CreateCategory = (name: string) => Promise<Category>;
function useSubmit(save: Save, action: string, onDone: () => void) {
    const [busy, setBusy] = useState(false),
        [error, setError] = useState("");
    const attempt = useRef({ key: "", id: "" });
    async function submit(payload: unknown) {
        const key = JSON.stringify(payload);
        if (attempt.current.key !== key)
            attempt.current = { key, id: crypto.randomUUID() };
        setBusy(true);
        setError("");
        try {
            await save(action, payload, attempt.current.id);
            onDone();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    return { busy, error, submit };
}
export function FormEnd({
    busy,
    error,
    label = "Lưu khoản chi",
}: {
    busy: boolean;
    error: string;
    label?: string;
}) {
    return (
        <footer className="form-end">
            {error && (
                <p className="error" role="alert">
                    {error}
                </p>
            )}
            <button
                className="button primary"
                disabled={busy}
                aria-busy={busy}
                type="submit"
            >
                {busy ? <LoadingSpinner /> : <Check size={18} />}
                {busy ? "Đang lưu…" : label}
            </button>
        </footer>
    );
}
export function CategoryField({
    value,
    categories,
    onChange,
    onCreate,
}: {
    value: string | null;
    categories: Category[];
    onChange: (value: string | null) => void;
    onCreate: CreateCategory;
}) {
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const errorRef = useRef<HTMLElement>(null);
    const creatingRef = useRef(false);
    const visible = categories
        .filter((category) => !category.archived || category.id === value)
        .sort((a, b) => a.name.localeCompare(b.name, "vi"));
    useEffect(() => {
        if (error) errorRef.current?.focus();
    }, [error]);
    async function create() {
        if (creatingRef.current) return;
        if (!name.trim()) {
            setError("Nhập tên hạng mục.");
            return;
        }
        creatingRef.current = true;
        setBusy(true);
        setError("");
        try {
            const category = await onCreate(name);
            onChange(category.id);
            setName("");
            setCreating(false);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            creatingRef.current = false;
            setBusy(false);
        }
    }
    return (
        <label>
            Hạng mục
            <div className="category-control">
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value || null)}
                >
                    <option value="">Chưa phân loại</option>
                    {visible.map((category) => (
                        <option value={category.id} key={category.id}>
                            {category.name}
                            {category.archived ? " (đã lưu trữ)" : ""}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    className="text-button category-create-trigger"
                    onClick={() => {
                        setCreating((open) => !open);
                        setError("");
                    }}
                >
                    {creating ? "Đóng" : "+ Tạo hạng mục"}
                </button>
            </div>
            {creating && (
                <div className="category-create">
                    <input
                        autoFocus
                        aria-label="Tên hạng mục mới"
                        maxLength={100}
                        value={name}
                        placeholder="Ví dụ: Học tập"
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                void create();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="button primary"
                        disabled={busy}
                        aria-busy={busy}
                        onClick={() => void create()}
                    >
                        {busy ? <LoadingSpinner size={16} /> : <Check size={16} />}
                        {busy ? "Đang tạo…" : "Tạo"}
                    </button>
                </div>
            )}
            {error && (
                <small
                    ref={errorRef}
                    className="error"
                    role="alert"
                    tabIndex={-1}
                >
                    {error}
                </small>
            )}
        </label>
    );
}
export function BaseFields({
    values,
    setValues,
    categories,
    onCreateCategory,
}: {
    values: {
        description: string;
        amount: number;
        channel: Channel;
        tag: Expense["tag"];
        category_id: string | null;
        months: number;
    };
    setValues: (values: any) => void;
    categories: Category[];
    onCreateCategory: CreateCategory;
}) {
    const update = (name: string, value: unknown) =>
        setValues({ ...values, [name]: value });
    return (
        <>
            <label>
                Diễn giải
                <input
                    required
                    maxLength={500}
                    value={values.description}
                    placeholder="Bạn đã chi cho việc gì?"
                    onChange={(e) => update("description", e.target.value)}
                />
            </label>
            <label>
                Số tiền (đ)
                <input
                    required
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="9000000000000"
                    step="1"
                    value={values.amount || ""}
                    placeholder="0"
                    onChange={(e) => update("amount", Number(e.target.value))}
                />
                <small>{money(values.amount || 0)}</small>
            </label>
            <div className="form-grid">
                <label>
                    Kênh chi tiêu
                    <select
                        value={values.channel}
                        onChange={(e) => update("channel", e.target.value)}
                    >
                        {Object.entries(CHANNELS).map(([id, name]) => (
                            <option value={id} key={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </label>
                <CategoryField
                    value={values.category_id}
                    categories={categories}
                    onChange={(category_id) => update("category_id", category_id)}
                    onCreate={onCreateCategory}
                />
                <label>
                    Nhãn
                    <select
                        value={values.tag}
                        onChange={(e) => update("tag", e.target.value)}
                    >
                        {TAGS.map((t) => (
                            <option key={t}>{t}</option>
                        ))}
                    </select>
                </label>
            </div>
            <label>
                Số tháng phân bổ
                <input
                    required
                    type="number"
                    min="1"
                    max="1200"
                    step="1"
                    inputMode="numeric"
                    value={values.months || ""}
                    onChange={(e) => update("months", Number(e.target.value))}
                />
                <small>
                    1 tháng nếu ghi nhận toàn bộ chi phí ngay trong tháng mua.
                </small>
            </label>
        </>
    );
}
export function ExpenseForm({
    expense,
    save,
    onClose,
    categories,
    onCreateCategory,
}: {
    expense?: Expense;
    save: Save;
    onClose: () => void;
    categories: Category[];
    onCreateCategory: CreateCategory;
}) {
    const [v, setV] = useState(
        () =>
            expense ?? {
                id: crypto.randomUUID(),
                description: "",
                amount: 0,
                date: today(),
                channel: "shopping" as Channel,
                kind: "once" as Expense["kind"],
                tag: "Tools" as Expense["tag"],
                category_id: null,
                months: 1,
                version: 0,
            },
    );
    const { busy, error, submit } = useSubmit(save, "expense", onClose);
    const end =
        v.date && v.months > 0
            ? addMonths(v.date.slice(0, 7), v.months - 1)
            : "";
    return (
        <form
            className="form-body"
            onSubmit={(e) => {
                e.preventDefault();
                void submit(v);
            }}
        >
            <BaseFields
                values={v}
                setValues={setV}
                categories={categories}
                onCreateCategory={onCreateCategory}
            />
            <div className="form-grid">
                <label>
                    Ngày chi
                    <input
                        required
                        type="date"
                        min="1900-01-01"
                        max={today()}
                        value={v.date}
                        onChange={(e) => setV({ ...v, date: e.target.value })}
                    />
                </label>
                <label>
                    Phân loại
                    <select
                        disabled={!!expense?.schedule_id}
                        value={v.kind}
                        onChange={(e) =>
                            setV({
                                ...v,
                                kind: e.target.value as Expense["kind"],
                            })
                        }
                    >
                        <option value="once">Phát sinh 1 lần</option>
                        <option value="recurring">Tái diễn</option>
                    </select>
                </label>
            </div>
            <div className="allocation-preview">
                <span>
                    Chi phí mỗi tháng
                    <strong>
                        {money(v.months ? Math.floor(v.amount / v.months) : 0)}
                    </strong>
                </span>
                <span>
                    Kỳ cuối<strong>{end ? monthLabel(end) : "—"}</strong>
                </span>
                <small>
                    Phân bổ từ tháng mua. Chênh lệch làm tròn được tính ở kỳ
                    cuối.
                </small>
            </div>
            {expense && (
                <p className="notice">
                    Sửa khoản chi sẽ tính lại báo cáo từ{" "}
                    {expense.date.slice(0, 7)} đến{" "}
                    {addMonths(expense.date.slice(0, 7), expense.months - 1)},
                    cùng các tháng thuộc lịch mới và các tháng hoàn tiền liên
                    quan.
                </p>
            )}
            <FormEnd
                busy={busy}
                error={error}
                label={
                    expense?.status === "pending"
                        ? "Xác nhận đã chi"
                        : "Lưu khoản chi"
                }
            />
        </form>
    );
}
export function ScheduleForm({
    schedule,
    save,
    onClose,
    categories,
    onCreateCategory,
}: {
    schedule?: Schedule;
    save: Save;
    onClose: () => void;
    categories: Category[];
    onCreateCategory: CreateCategory;
}) {
    const [v, setV] = useState(
        () =>
            schedule ?? {
                id: crypto.randomUUID(),
                description: "",
                amount: 0,
                channel: "transfer" as Channel,
                tag: "Tools" as Expense["tag"],
                category_id: null,
                months: 1,
                start_date: today(),
                frequency: "monthly" as Schedule["frequency"],
                automatic: true,
                active: true,
                version: 0,
            },
    );
    const { busy, error, submit } = useSubmit(save, "schedule", onClose);
    return (
        <form
            className="form-body"
            onSubmit={(e) => {
                e.preventDefault();
                void submit(v);
            }}
        >
            <BaseFields
                values={v}
                setValues={setV}
                categories={categories}
                onCreateCategory={onCreateCategory}
            />
            <div className="form-grid">
                <label>
                    Kỳ thanh toán đầu
                    <input
                        type="date"
                        min="1900-01-01"
                        max="2200-12-31"
                        required
                        disabled={!!schedule}
                        value={v.start_date}
                        onChange={(e) =>
                            setV({ ...v, start_date: e.target.value })
                        }
                    />
                </label>
                <label>
                    Thanh toán mỗi
                    <select
                        disabled={!!schedule}
                        value={v.frequency}
                        onChange={(e) =>
                            setV({
                                ...v,
                                frequency: e.target
                                    .value as Schedule["frequency"],
                            })
                        }
                    >
                        <option value="monthly">Tháng</option>
                        <option value="yearly">Năm</option>
                    </select>
                </label>
            </div>
            <label>
                Cách ghi nhận
                <select
                    value={v.automatic ? "auto" : "manual"}
                    onChange={(e) =>
                        setV({ ...v, automatic: e.target.value === "auto" })
                    }
                >
                    <option value="auto">Tự tạo khoản chờ xác nhận</option>
                    <option value="manual">Ghi nhận từng kỳ bằng tay</option>
                </select>
            </label>
            {schedule && (
                <label>
                    Trạng thái
                    <select
                        value={v.active ? "active" : "stopped"}
                        onChange={(e) =>
                            setV({ ...v, active: e.target.value === "active" })
                        }
                    >
                        <option value="active">Đang hoạt động</option>
                        <option value="stopped">Đã ngừng</option>
                    </select>
                </label>
            )}
            <p className="notice">
                Kỳ đến hạn được tạo khi bạn mở hoặc làm mới ứng dụng. Chỉ tính
                chi tiêu sau khi xác nhận. Sửa lịch chỉ áp dụng cho kỳ chưa tạo.
            </p>
            <FormEnd busy={busy} error={error} label="Lưu lịch tái diễn" />
        </form>
    );
}
export function RefundForm({
    expense,
    refunds,
    save,
    onClose,
}: {
    expense: Expense;
    refunds: Refund[];
    save: Save;
    onClose: () => void;
}) {
    const remaining =
        expense.amount -
        refunds
            .filter((r) => r.expense_id === expense.id)
            .reduce((s, r) => s + r.amount, 0);
    const [v, setV] = useState({
        id: crypto.randomUUID(),
        expense_id: expense.id,
        amount: remaining,
        date: today(),
        note: "",
    });
    const { busy, error, submit } = useSubmit(save, "refund", onClose);
    return (
        <form
            className="form-body"
            onSubmit={(e) => {
                e.preventDefault();
                void submit(v);
            }}
        >
            <p className="notice">
                {expense.description}
                <br />
                Có thể hoàn tối đa <strong>{money(remaining)}</strong>.
            </p>
            <label>
                Số tiền hoàn (đ)
                <input
                    type="number"
                    min="1"
                    max={remaining}
                    step="1"
                    required
                    value={v.amount || ""}
                    onChange={(e) =>
                        setV({ ...v, amount: Number(e.target.value) })
                    }
                />
                <small>{money(v.amount)}</small>
            </label>
            <label>
                Ngày nhận hoàn tiền
                <input
                    type="date"
                    min={expense.date}
                    max={today()}
                    required
                    value={v.date}
                    onChange={(e) => setV({ ...v, date: e.target.value })}
                />
            </label>
            <label>
                Ghi chú
                <textarea
                    maxLength={500}
                    value={v.note}
                    onChange={(e) => setV({ ...v, note: e.target.value })}
                />
            </label>
            <p className="notice">
                Giữ nguyên chi phí các tháng trước. Phần còn lại được điều chỉnh
                từ tháng nhận hoàn tiền.
            </p>
            <FormEnd busy={busy} error={error} label="Ghi nhận hoàn tiền" />
        </form>
    );
}
export function ExpenseList({
    expenses,
    refunds,
    month,
    categories,
    onOpen,
}: {
    expenses: Expense[];
    refunds: Refund[];
    month: string;
    categories: Category[];
    onOpen: (e: Expense) => void;
}) {
    if (!expenses.length)
        return (
            <Empty
                title="Chưa có khoản chi phù hợp"
                text="Thử đổi bộ lọc hoặc thêm một khoản chi mới."
            />
        );
    return (
        <div className="expense-list">
            <div className="list-head">
                <span>Khoản chi</span>
                <span>Kênh · nhãn · hạng mục</span>
                <span>Ngày chi</span>
                <span>Số tiền</span>
            </div>
            {expenses.map((e) => (
                <button
                    className="expense-row"
                    key={e.id}
                    onClick={() => onOpen(e)}
                >
                    <span className="expense-name">
                        <ChannelIcon channel={e.channel} />
                        <span>
                            <strong>{e.description}</strong>
                            <small>
                                {e.kind === "recurring" ? (
                                    <>
                                        <Repeat2 size={12} /> Tái diễn
                                    </>
                                ) : (
                                    "Phát sinh 1 lần"
                                )}{" "}
                                · {e.months} tháng phân bổ
                            </small>
                        </span>
                    </span>
                    <span className="row-label">
                        <span>{CHANNELS[e.channel]}</span>
                        <small className={`tag ${e.tag.toLowerCase()}`}>
                            {e.tag}
                        </small>
                        <small className="category-label">
                            {categoryLabel(e, categories)}
                        </small>
                    </span>
                    <time>{e.date.split("-").reverse().join("/")}</time>
                    <span className="row-money">
                        <strong>{money(e.amount)}</strong>
                        <small>
                            {e.status === "pending"
                                ? "Chờ xác nhận"
                                : `${money(allocationPosition(e, refunds, month).current)} / tháng chọn`}
                        </small>
                    </span>
                    <ArrowUpRight className="row-arrow" size={16} />
                </button>
            ))}
        </div>
    );
}
export function Detail({
    expense: e,
    refunds,
    month,
    categories,
    onEdit,
    onRefund,
    onAction,
}: {
    expense: Expense;
    refunds: Refund[];
    month: string;
    categories: Category[];
    onEdit: () => void;
    onRefund: () => void;
    onAction: (action: "skip" | "cancel") => Promise<void>;
}) {
    const [busy, setBusy] = useState(false);
    const position = allocationPosition(e, refunds, month),
        rs = refunds.filter((r) => r.expense_id === e.id);
    async function runAction(action: "skip" | "cancel") {
        setBusy(true);
        try {
            await onAction(action);
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="form-body">
            <div className="detail-amount">
                <ChannelIcon channel={e.channel} />
                <span>{CHANNELS[e.channel]}</span>
                <strong>{money(e.amount)}</strong>
            </div>
            <dl className="detail-grid">
                <div>
                    <dt>Ngày chi</dt>
                    <dd>{e.date}</dd>
                </div>
                <div>
                    <dt>Nhãn</dt>
                    <dd>{e.tag}</dd>
                </div>
                <div>
                    <dt>Hạng mục</dt>
                    <dd>{categoryLabel(e, categories)}</dd>
                </div>
                <div>
                    <dt>Phân loại</dt>
                    <dd>
                        {e.kind === "once" ? "Phát sinh 1 lần" : "Tái diễn"}
                    </dd>
                </div>
                <div>
                    <dt>Trạng thái</dt>
                    <dd>
                        {e.status === "pending"
                            ? "Chờ xác nhận"
                            : "Đã ghi nhận"}
                    </dd>
                </div>
                <div>
                    <dt>Phân bổ</dt>
                    <dd>
                        {e.months} tháng · đến {position.end}
                    </dd>
                </div>
                <div>
                    <dt>Chi phí tháng {month}</dt>
                    <dd>{money(position.current)}</dd>
                </div>
                <div>
                    <dt>Đã phân bổ đến {month}</dt>
                    <dd>
                        {e.status === "confirmed"
                            ? money(position.spent)
                            : "Chưa ghi nhận"}
                    </dd>
                </div>
                <div>
                    <dt>Còn lại tại {month}</dt>
                    <dd>
                        {e.status === "confirmed"
                            ? money(position.remaining)
                            : "Chưa ghi nhận"}
                    </dd>
                </div>
            </dl>
            {rs.length > 0 && (
                <section>
                    <h3>Lịch sử hoàn tiền</h3>
                    {rs.map((r) => (
                        <div key={r.id} className="refund-row">
                            <span>
                                {r.date}
                                <small>{r.note}</small>
                            </span>
                            <strong>{money(r.amount)}</strong>
                        </div>
                    ))}
                </section>
            )}
            <div className="detail-actions">
                <button
                    className="button primary"
                    disabled={busy}
                    onClick={onEdit}
                >
                    {e.status === "pending"
                        ? "Xác nhận đã chi"
                        : "Sửa khoản chi"}
                </button>
                {e.status === "confirmed" && (
                    <button
                        className="button"
                        disabled={
                            busy ||
                            rs.reduce((s, r) => s + r.amount, 0) >= e.amount
                        }
                        onClick={onRefund}
                    >
                        <RotateCcw size={16} />
                        Hoàn tiền
                    </button>
                )}
                <button
                    className="button danger"
                    disabled={busy || rs.length > 0}
                    aria-busy={busy}
                    onClick={() =>
                        void runAction(e.status === "pending" ? "skip" : "cancel")
                    }
                >
                    {busy && <LoadingSpinner size={16} />}
                    {busy
                        ? "Đang xử lý…"
                        : e.status === "pending"
                          ? "Bỏ qua kỳ này"
                          : "Hủy khoản nhập nhầm"}
                </button>
            </div>
        </div>
    );
}
