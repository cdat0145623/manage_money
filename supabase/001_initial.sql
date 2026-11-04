BEGIN;
CREATE TABLE public.expenses (
 id uuid PRIMARY KEY, user_id uuid NOT NULL DEFAULT auth.uid(), description text NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 500),
 amount bigint NOT NULL CHECK(amount BETWEEN 1 AND 9000000000000), date date NOT NULL CHECK(date BETWEEN '1900-01-01' AND '2200-12-31'),
 channel text NOT NULL CHECK(channel IN ('shopping','transfer','assisted')), kind text NOT NULL CHECK(kind IN ('once','recurring')),
 tag text NOT NULL CHECK(tag IN ('Asset','Tools','Allocation')), months integer NOT NULL CHECK(months BETWEEN 1 AND 1200),
 status text NOT NULL CHECK(status IN ('pending','confirmed','skipped','cancelled')), schedule_id uuid, period integer CHECK(period>=0), version integer NOT NULL DEFAULT 1,
 UNIQUE(user_id,id), UNIQUE(schedule_id,period), CHECK((schedule_id IS NULL)=(period IS NULL)), CHECK(schedule_id IS NULL OR kind='recurring')
);
CREATE TABLE public.schedules (
 id uuid PRIMARY KEY, user_id uuid NOT NULL DEFAULT auth.uid(), description text NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 500),
 amount bigint NOT NULL CHECK(amount BETWEEN 1 AND 9000000000000), channel text NOT NULL CHECK(channel IN ('shopping','transfer','assisted')),
 tag text NOT NULL CHECK(tag IN ('Asset','Tools','Allocation')), months integer NOT NULL CHECK(months BETWEEN 1 AND 1200),
 start_date date NOT NULL CHECK(start_date BETWEEN '1900-01-01' AND '2200-12-31'), frequency text NOT NULL CHECK(frequency IN ('monthly','yearly')),
 automatic boolean NOT NULL, active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1, UNIQUE(user_id,id)
);
ALTER TABLE public.expenses ADD FOREIGN KEY(user_id,schedule_id) REFERENCES public.schedules(user_id,id);
CREATE TABLE public.refunds (
 id uuid PRIMARY KEY, user_id uuid NOT NULL DEFAULT auth.uid(), expense_id uuid NOT NULL, amount bigint NOT NULL CHECK(amount BETWEEN 1 AND 9000000000000),
 date date NOT NULL CHECK(date BETWEEN '1900-01-01' AND '2200-12-31'), note text NOT NULL DEFAULT '' CHECK(length(note)<=500),
 FOREIGN KEY(user_id,expense_id) REFERENCES public.expenses(user_id,id)
);
CREATE TABLE public.budgets (
 user_id uuid NOT NULL DEFAULT auth.uid(), month text NOT NULL CHECK(month ~ '^(19|20|21|22)[0-9]{2}-(0[1-9]|1[0-2])$'),
 channel text NOT NULL CHECK(channel IN ('shopping','transfer','assisted')), amount bigint NOT NULL CHECK(amount BETWEEN 0 AND 9000000000000), PRIMARY KEY(user_id,month,channel)
);
CREATE TABLE public.mutation_receipts (user_id uuid NOT NULL, id uuid NOT NULL, action text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(user_id,id));
ALTER TABLE public.mutation_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mutation_receipts FROM PUBLIC, anon, authenticated;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['expenses','schedules','refunds','budgets'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY owner_read ON public.%I FOR SELECT TO authenticated USING (user_id = (select auth.uid()))',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
  EXECUTE format('CREATE INDEX ON public.%I(user_id)',t);
 END LOOP;
END $$;
CREATE FUNCTION public.due_date(anchor date, n integer, frequency text) RETURNS date LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT (anchor + make_interval(months => n * CASE WHEN frequency='yearly' THEN 12 ELSE 1 END))::date
$$;
CREATE FUNCTION public.mutate(action text, payload jsonb, request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 u uuid := auth.uid(); e expenses; s schedules; r refunds; old_receipt mutation_receipts; target uuid; v integer; total bigint; first_refund date; n integer; due date;
 local_today date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Cần đăng nhập.'; END IF;
 IF request_id IS NULL THEN RAISE EXCEPTION 'Thiếu mã thao tác.'; END IF;
 -- ponytail: serialize writes per owner; replace with per-entity locks if shared high-volume books become a requirement.
 PERFORM pg_advisory_xact_lock(hashtextextended(u::text,0));
 SELECT * INTO old_receipt FROM mutation_receipts WHERE user_id=u AND id=request_id;
 IF FOUND THEN
  IF old_receipt.action<>action OR old_receipt.payload<>payload THEN RAISE EXCEPTION 'Mã thao tác đã dùng cho nội dung khác.'; END IF;
  RETURN jsonb_build_object('ok',true);
 END IF;
 IF action='expense' THEN
  target:=(payload->>'id')::uuid;
  SELECT * INTO e FROM expenses WHERE id=target AND user_id=u FOR UPDATE;
  IF FOUND THEN
   IF e.version<>(payload->>'version')::integer OR payload->>'version' IS NULL THEN RAISE EXCEPTION 'Khoản chi đã thay đổi. Tải lại trước khi sửa.'; END IF;
   IF e.status IN ('cancelled','skipped') THEN RAISE EXCEPTION 'Khoản này đã hủy hoặc bỏ qua.'; END IF;
   SELECT coalesce(sum(amount),0),min(date) INTO total,first_refund FROM refunds WHERE expense_id=target AND user_id=u;
   IF total>(payload->>'amount')::bigint THEN RAISE EXCEPTION 'Số tiền mua thấp hơn tổng đã hoàn.'; END IF;
   IF first_refund<(payload->>'date')::date THEN RAISE EXCEPTION 'Ngày mua không được sau ngày hoàn tiền.'; END IF;
   UPDATE expenses SET description=trim(payload->>'description'),amount=(payload->>'amount')::bigint,date=(payload->>'date')::date,
    channel=payload->>'channel',kind=CASE WHEN schedule_id IS NOT NULL THEN 'recurring' ELSE payload->>'kind' END,
    tag=payload->>'tag',months=(payload->>'months')::integer,status='confirmed',version=version+1 WHERE id=target AND user_id=u;
  ELSE
   IF coalesce((payload->>'version')::integer,0)<>0 THEN RAISE EXCEPTION 'Không tìm thấy khoản chi.'; END IF;
   INSERT INTO expenses(id,user_id,description,amount,date,channel,kind,tag,months,status)
    VALUES(target,u,trim(payload->>'description'),(payload->>'amount')::bigint,(payload->>'date')::date,payload->>'channel',payload->>'kind',payload->>'tag',(payload->>'months')::integer,'confirmed');
  END IF;
 ELSIF action='cancel' OR action='skip' THEN
  SELECT * INTO e FROM expenses WHERE id=(payload->>'id')::uuid AND user_id=u FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy khoản chi.'; END IF;
  IF e.version<>(payload->>'version')::integer OR payload->>'version' IS NULL THEN RAISE EXCEPTION 'Khoản chi đã thay đổi. Tải lại.'; END IF;
  IF EXISTS(SELECT 1 FROM refunds WHERE expense_id=e.id AND user_id=u) THEN RAISE EXCEPTION 'Không thể hủy khoản có hoàn tiền.'; END IF;
  IF action='skip' AND e.status<>'pending' THEN RAISE EXCEPTION 'Chỉ bỏ qua khoản đang chờ.'; END IF;
  IF action='cancel' AND e.status<>'confirmed' THEN RAISE EXCEPTION 'Chỉ hủy khoản đã ghi nhận.'; END IF;
  UPDATE expenses SET status=CASE WHEN action='skip' THEN 'skipped' ELSE 'cancelled' END,version=version+1 WHERE id=e.id;
 ELSIF action='refund' THEN
  SELECT * INTO e FROM expenses WHERE id=(payload->>'expense_id')::uuid AND user_id=u FOR UPDATE;
  IF NOT FOUND OR e.status<>'confirmed' THEN RAISE EXCEPTION 'Khoản mua không hợp lệ.'; END IF;
  SELECT coalesce(sum(amount),0) INTO total FROM refunds WHERE expense_id=e.id AND user_id=u;
  IF total+(payload->>'amount')::bigint>e.amount THEN RAISE EXCEPTION 'Tổng hoàn vượt số tiền mua.'; END IF;
  IF (payload->>'date')::date<e.date THEN RAISE EXCEPTION 'Ngày hoàn không được trước ngày mua.'; END IF;
  INSERT INTO refunds(id,user_id,expense_id,amount,date,note) VALUES((payload->>'id')::uuid,u,e.id,(payload->>'amount')::bigint,(payload->>'date')::date,coalesce(payload->>'note',''));
 ELSIF action='budget' THEN
  IF jsonb_array_length(payload->'items')<>3 THEN RAISE EXCEPTION 'Cần ngân sách đủ 3 kênh.'; END IF;
  IF (SELECT count(DISTINCT x->>'channel') FROM jsonb_array_elements(payload->'items') x)<>3 THEN RAISE EXCEPTION 'Cần đúng ba kênh ngân sách khác nhau.'; END IF;
  INSERT INTO budgets(user_id,month,channel,amount)
   SELECT u,payload->>'month',x->>'channel',(x->>'amount')::bigint FROM jsonb_array_elements(payload->'items') x
   ON CONFLICT(user_id,month,channel) DO UPDATE SET amount=excluded.amount;
 ELSIF action='schedule' THEN
  target:=(payload->>'id')::uuid;
  SELECT * INTO s FROM schedules WHERE id=target AND user_id=u FOR UPDATE;
  IF FOUND THEN
   IF s.version<>(payload->>'version')::integer OR payload->>'version' IS NULL THEN RAISE EXCEPTION 'Lịch đã thay đổi. Tải lại.'; END IF;
   IF s.start_date<>(payload->>'start_date')::date OR s.frequency<>payload->>'frequency' THEN RAISE EXCEPTION 'Tạo lịch mới để đổi chu kỳ hoặc ngày neo.'; END IF;
   UPDATE schedules SET description=trim(payload->>'description'),amount=(payload->>'amount')::bigint,channel=payload->>'channel',tag=payload->>'tag',months=(payload->>'months')::integer,
    automatic=(payload->>'automatic')::boolean,active=(payload->>'active')::boolean,version=version+1 WHERE id=target;
  ELSE
   IF coalesce((payload->>'version')::integer,0)<>0 THEN RAISE EXCEPTION 'Không tìm thấy lịch.'; END IF;
   INSERT INTO schedules(id,user_id,description,amount,channel,tag,months,start_date,frequency,automatic,active)
   VALUES(target,u,trim(payload->>'description'),(payload->>'amount')::bigint,payload->>'channel',payload->>'tag',(payload->>'months')::integer,(payload->>'start_date')::date,payload->>'frequency',(payload->>'automatic')::boolean,true);
  END IF;
 ELSIF action='sync' OR action='period' THEN
  FOR s IN SELECT * FROM schedules WHERE user_id=u AND active AND ((action='sync' AND automatic) OR (action='period' AND id=(payload->>'id')::uuid)) LOOP
   FOR n IN 0..greatest(0,(extract(year FROM local_today)::integer-extract(year FROM s.start_date)::integer)*12+extract(month FROM local_today)::integer-extract(month FROM s.start_date)::integer) LOOP
    due:=due_date(s.start_date,n,s.frequency);
    EXIT WHEN due>local_today;
    IF action='period' AND n<>(payload->>'period')::integer THEN CONTINUE; END IF;
    INSERT INTO expenses(id,user_id,description,amount,date,channel,kind,tag,months,status,schedule_id,period)
      VALUES(gen_random_uuid(),u,s.description,s.amount,due,s.channel,'recurring',s.tag,s.months,'pending',s.id,n) ON CONFLICT(schedule_id,period) DO NOTHING;
   END LOOP;
  END LOOP;
 ELSE RAISE EXCEPTION 'Thao tác không hợp lệ.';
 END IF;
 INSERT INTO mutation_receipts(user_id,id,action,payload) VALUES(u,request_id,action,payload);
 RETURN jsonb_build_object('ok',true);
END $$;
REVOKE ALL ON FUNCTION public.mutate(text,jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mutate(text,jsonb,uuid) TO authenticated;
COMMIT;
