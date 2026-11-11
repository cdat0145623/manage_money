BEGIN;

CREATE TABLE IF NOT EXISTS public.categories (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100),
 normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(trim(name), '\s+', ' ', 'g'))) STORED,
 archived boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,id),
 UNIQUE(user_id,normalized_name)
);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE public.schedules ADD COLUMN IF NOT EXISTS category_id uuid;

DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname='expenses_category_owner_fk'
 ) THEN
  ALTER TABLE public.expenses
   ADD CONSTRAINT expenses_category_owner_fk
   FOREIGN KEY(user_id,category_id) REFERENCES public.categories(user_id,id);
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname='schedules_category_owner_fk'
 ) THEN
  ALTER TABLE public.schedules
   ADD CONSTRAINT schedules_category_owner_fk
   FOREIGN KEY(user_id,category_id) REFERENCES public.categories(user_id,id);
 END IF;
END $$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_owner_read ON public.categories;
CREATE POLICY categories_owner_read ON public.categories
 FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
REVOKE ALL ON public.categories FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.categories TO authenticated;
CREATE INDEX IF NOT EXISTS categories_user_active_idx ON public.categories(user_id,archived);
CREATE INDEX IF NOT EXISTS expenses_user_category_idx ON public.expenses(user_id,category_id);
CREATE INDEX IF NOT EXISTS schedules_user_category_idx ON public.schedules(user_id,category_id);

CREATE OR REPLACE FUNCTION public.mutate(action text, payload jsonb, request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 u uuid := auth.uid();
 e expenses;
 s schedules;
 c categories;
 old_receipt mutation_receipts;
 target uuid;
 category_target uuid;
 expense_exists boolean := false;
 schedule_exists boolean := false;
 total bigint;
 first_refund date;
 n integer;
 due date;
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

 IF action='category_create' THEN
  target:=coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
  IF length(trim(coalesce(payload->>'name','')))=0 THEN RAISE EXCEPTION 'Tên hạng mục không được để trống.'; END IF;
  IF EXISTS(
   SELECT 1 FROM categories
   WHERE user_id=u AND normalized_name=lower(regexp_replace(trim(payload->>'name'),'\s+',' ','g'))
  ) THEN RAISE EXCEPTION 'Hạng mục đã tồn tại.'; END IF;
  INSERT INTO categories(id,user_id,name)
   VALUES(target,u,trim(regexp_replace(payload->>'name','\s+',' ','g')));
 ELSIF action='category_rename' THEN
  target:=(payload->>'id')::uuid;
  SELECT * INTO c FROM categories WHERE id=target AND user_id=u FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy hạng mục.'; END IF;
  IF length(trim(coalesce(payload->>'name','')))=0 THEN RAISE EXCEPTION 'Tên hạng mục không được để trống.'; END IF;
  IF EXISTS(
   SELECT 1 FROM categories
   WHERE user_id=u AND id<>target AND normalized_name=lower(regexp_replace(trim(payload->>'name'),'\s+',' ','g'))
  ) THEN RAISE EXCEPTION 'Hạng mục đã tồn tại.'; END IF;
  UPDATE categories SET name=trim(regexp_replace(payload->>'name','\s+',' ','g')) WHERE id=target AND user_id=u;
 ELSIF action='category_archive' THEN
  target:=(payload->>'id')::uuid;
  SELECT * INTO c FROM categories WHERE id=target AND user_id=u FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy hạng mục.'; END IF;
  UPDATE categories SET archived=coalesce((payload->>'archived')::boolean,true) WHERE id=target AND user_id=u;
 ELSIF action='expense' THEN
  target:=(payload->>'id')::uuid;
  category_target:=nullif(payload->>'category_id','')::uuid;
  SELECT * INTO e FROM expenses WHERE id=target AND user_id=u FOR UPDATE;
  expense_exists:=FOUND;
  IF category_target IS NOT NULL THEN
   SELECT * INTO c FROM categories WHERE id=category_target AND user_id=u;
   IF NOT FOUND THEN RAISE EXCEPTION 'Hạng mục không hợp lệ.'; END IF;
   IF c.archived AND (NOT expense_exists OR e.category_id IS DISTINCT FROM category_target) THEN
    RAISE EXCEPTION 'Hạng mục đã lưu trữ.';
   END IF;
  END IF;
  IF expense_exists THEN
   IF e.version<>(payload->>'version')::integer OR payload->>'version' IS NULL THEN RAISE EXCEPTION 'Khoản chi đã thay đổi. Tải lại trước khi sửa.'; END IF;
   IF e.status IN ('cancelled','skipped') THEN RAISE EXCEPTION 'Khoản này đã hủy hoặc bỏ qua.'; END IF;
   SELECT coalesce(sum(amount),0),min(date) INTO total,first_refund FROM refunds WHERE expense_id=target AND user_id=u;
   IF total>(payload->>'amount')::bigint THEN RAISE EXCEPTION 'Số tiền mua thấp hơn tổng đã hoàn.'; END IF;
   IF first_refund<(payload->>'date')::date THEN RAISE EXCEPTION 'Ngày mua không được sau ngày hoàn tiền.'; END IF;
   UPDATE expenses SET description=trim(payload->>'description'),amount=(payload->>'amount')::bigint,date=(payload->>'date')::date,
    channel=payload->>'channel',kind=CASE WHEN schedule_id IS NOT NULL THEN 'recurring' ELSE payload->>'kind' END,
    tag=payload->>'tag',category_id=CASE WHEN payload ? 'category_id' THEN category_target ELSE e.category_id END,months=(payload->>'months')::integer,status='confirmed',version=version+1 WHERE id=target AND user_id=u;
  ELSE
   IF coalesce((payload->>'version')::integer,0)<>0 THEN RAISE EXCEPTION 'Không tìm thấy khoản chi.'; END IF;
   INSERT INTO expenses(id,user_id,description,amount,date,channel,kind,tag,category_id,months,status)
    VALUES(target,u,trim(payload->>'description'),(payload->>'amount')::bigint,(payload->>'date')::date,payload->>'channel',payload->>'kind',payload->>'tag',category_target,(payload->>'months')::integer,'confirmed');
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
  category_target:=nullif(payload->>'category_id','')::uuid;
  SELECT * INTO s FROM schedules WHERE id=target AND user_id=u FOR UPDATE;
  schedule_exists:=FOUND;
  IF category_target IS NOT NULL THEN
   SELECT * INTO c FROM categories WHERE id=category_target AND user_id=u;
   IF NOT FOUND THEN RAISE EXCEPTION 'Hạng mục không hợp lệ.'; END IF;
   IF c.archived AND (NOT schedule_exists OR s.category_id IS DISTINCT FROM category_target) THEN
    RAISE EXCEPTION 'Hạng mục đã lưu trữ.';
   END IF;
  END IF;
  IF schedule_exists THEN
   IF s.version<>(payload->>'version')::integer OR payload->>'version' IS NULL THEN RAISE EXCEPTION 'Lịch đã thay đổi. Tải lại.'; END IF;
   IF s.start_date<>(payload->>'start_date')::date OR s.frequency<>payload->>'frequency' THEN RAISE EXCEPTION 'Tạo lịch mới để đổi chu kỳ hoặc ngày neo.'; END IF;
   UPDATE schedules SET description=trim(payload->>'description'),amount=(payload->>'amount')::bigint,channel=payload->>'channel',tag=payload->>'tag',category_id=CASE WHEN payload ? 'category_id' THEN category_target ELSE s.category_id END,months=(payload->>'months')::integer,
    automatic=(payload->>'automatic')::boolean,active=(payload->>'active')::boolean,version=version+1 WHERE id=target;
  ELSE
   IF coalesce((payload->>'version')::integer,0)<>0 THEN RAISE EXCEPTION 'Không tìm thấy lịch.'; END IF;
   INSERT INTO schedules(id,user_id,description,amount,channel,tag,category_id,months,start_date,frequency,automatic,active)
   VALUES(target,u,trim(payload->>'description'),(payload->>'amount')::bigint,payload->>'channel',payload->>'tag',category_target,(payload->>'months')::integer,(payload->>'start_date')::date,payload->>'frequency',(payload->>'automatic')::boolean,true);
  END IF;
 ELSIF action='sync' OR action='period' THEN
  FOR s IN SELECT * FROM schedules WHERE user_id=u AND active AND ((action='sync' AND automatic) OR (action='period' AND id=(payload->>'id')::uuid)) LOOP
   FOR n IN 0..greatest(0,(extract(year FROM local_today)::integer-extract(year FROM s.start_date)::integer)*12+extract(month FROM local_today)::integer-extract(month FROM s.start_date)::integer) LOOP
    due:=due_date(s.start_date,n,s.frequency);
    EXIT WHEN due>local_today;
    IF action='period' AND n<>(payload->>'period')::integer THEN CONTINUE; END IF;
    INSERT INTO expenses(id,user_id,description,amount,date,channel,kind,tag,category_id,months,status,schedule_id,period)
      VALUES(gen_random_uuid(),u,s.description,s.amount,due,s.channel,'recurring',s.tag,s.category_id,s.months,'pending',s.id,n) ON CONFLICT(schedule_id,period) DO NOTHING;
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
