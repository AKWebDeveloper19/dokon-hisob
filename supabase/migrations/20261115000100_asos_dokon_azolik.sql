-- 1-bosqich: do‘konlar, a’zolik, xodim loginlari, PIN, kassa qurilmalari, audit.
-- Xavfsizlik modeli:
--   * Har biznes yozuvi shop_id bilan bog‘langan, barcha jadvallarda RLS yoqilgan.
--   * O‘zgartirish amallari faqat SECURITY DEFINER funksiyalar orqali (to‘g‘ridan-to‘g‘ri yozish yo‘q).
--   * A’zolik tekshiruvi JWT `iat` vaqtini `sessions_valid_after` bilan solishtiradi, shuning uchun
--     xodim o‘chirilganda yoki PIN almashtirilganda eski tokenlar darhol kuchini yo‘qotadi.
--   * PIN hash va qurilma token hash’i mijozga hech qachon qaytmaydi.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Turlar
-- ---------------------------------------------------------------------------
create type public.shop_status as enum ('active', 'suspended');
create type public.member_role as enum ('owner', 'cashier');

-- ---------------------------------------------------------------------------
-- Jadvallar
-- ---------------------------------------------------------------------------
create table public.shops (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(btrim(name)) between 2 and 120),
  timezone      text not null default 'Asia/Tashkent',
  currency      text not null default 'UZS' check (currency = 'UZS'),
  status        public.shop_status not null default 'active',
  is_demo       boolean not null default false,
  lock_minutes  integer not null default 5 check (lock_minutes between 1 and 120),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.memberships (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references public.shops (id) on delete cascade,
  user_id               uuid not null references auth.users (id) on delete cascade,
  role                  public.member_role not null,
  can_discount          boolean not null default false,
  can_refund            boolean not null default false,
  can_write_off         boolean not null default false,
  can_receive           boolean not null default false,
  active                boolean not null default true,
  -- Shu vaqtdan oldin berilgan tokenlar bu do‘konga kira olmaydi.
  sessions_valid_after  timestamptz not null default '-infinity',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (shop_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

-- Xodimning kirish logini (email o‘rniga). Supabase Auth’da u sintetik email sifatida saqlanadi.
create table public.staff_logins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  login       text not null unique check (login ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  created_at  timestamptz not null default now()
);

-- PIN faqat hash ko‘rinishida. Mijoz rollari bu jadvalga umuman kira olmaydi.
create table public.membership_pins (
  membership_id    uuid primary key references public.memberships (id) on delete cascade,
  pin_hash         text not null,
  failed_attempts  integer not null default 0,
  locked_until     timestamptz,
  updated_at       timestamptz not null default now()
);

create table public.pos_devices (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 60),
  token_hash    text not null unique,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz,
  revoked_at    timestamptz,
  revoked_by    uuid references auth.users (id) on delete set null
);
create index pos_devices_shop_idx on public.pos_devices (shop_id);

create table public.audit_log (
  id             bigint generated always as identity primary key,
  shop_id        uuid not null references public.shops (id) on delete cascade,
  actor_user_id  uuid,
  action         text not null,
  entity         text,
  entity_id      text,
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index audit_log_shop_created_idx on public.audit_log (shop_id, created_at desc);

alter table public.shops            enable row level security;
alter table public.profiles         enable row level security;
alter table public.memberships      enable row level security;
alter table public.staff_logins     enable row level security;
alter table public.membership_pins  enable row level security;
alter table public.pos_devices      enable row level security;
alter table public.audit_log        enable row level security;

-- ---------------------------------------------------------------------------
-- Ichki yordamchilar (private sxema PostgREST orqali ochilmaydi)
-- ---------------------------------------------------------------------------
create function private.raise_code(p_code text, p_detail text default null)
returns void language plpgsql as $$
begin
  raise exception using errcode = 'P0001', message = p_code, detail = coalesce(p_detail, '');
end $$;

create function private.audit(
  p_shop uuid, p_action text, p_entity text default null,
  p_entity_id text default null, p_details jsonb default '{}'::jsonb, p_actor uuid default null
) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (shop_id, actor_user_id, action, entity, entity_id, details)
  values (p_shop, coalesce(p_actor, auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

create function private.token_hash(p_token text)
returns text language sql immutable set search_path = '' as $$
  select encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;

-- Foydalanuvchining barcha Supabase sessiyalarini (refresh tokenlarini) o‘chiradi.
create function private.revoke_auth_sessions(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  delete from auth.sessions where user_id = p_user;
$$;

-- PIN qoidasi: 4–6 raqam, bir xil raqamlar va ketma-ketlik (1234, 4321) taqiqlanadi.
create function private.assert_pin_ok(p_pin text)
returns void language plpgsql set search_path = '' as $$
begin
  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    perform private.raise_code('invalid_pin_format');
  end if;
  if p_pin ~ '^([0-9])\1+$'
     or position(p_pin in '0123456789') > 0
     or position(p_pin in '9876543210') > 0 then
    perform private.raise_code('weak_pin');
  end if;
end $$;

create function private.jwt_issued_at()
returns timestamptz language sql stable set search_path = '' as $$
  select to_timestamp(coalesce((auth.jwt() ->> 'iat')::double precision, 0));
$$;

-- ---------------------------------------------------------------------------
-- RLS uchun ochiq yordamchilar
-- ---------------------------------------------------------------------------
create function public.member_role_in(p_shop uuid)
returns public.member_role
language sql stable security definer set search_path = '' as $$
  select m.role
  from public.memberships m
  where m.shop_id = p_shop
    and m.user_id = auth.uid()
    and m.active
    and private.jwt_issued_at() > m.sessions_valid_after;
$$;

create function public.is_shop_member(p_shop uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.member_role_in(p_shop) is not null;
$$;

create function public.is_shop_owner(p_shop uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.member_role_in(p_shop) = 'owner', false);
$$;

create function public.shop_is_writable(p_shop uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shops s where s.id = p_shop and s.status = 'active');
$$;

create function private.require_owner(p_shop uuid, p_write boolean default true)
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    perform private.raise_code('not_authenticated');
  end if;
  if not public.is_shop_owner(p_shop) then
    perform private.raise_code('forbidden');
  end if;
  if p_write and not public.shop_is_writable(p_shop) then
    perform private.raise_code('shop_suspended');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS siyosatlari (faqat o‘qish; yozish funksiyalar orqali)
-- ---------------------------------------------------------------------------
create policy shops_select on public.shops
  for select to authenticated using (public.is_shop_member(id));

create policy memberships_select on public.memberships
  for select to authenticated
  using ((user_id = auth.uid() and active) or public.is_shop_owner(shop_id));

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.user_id = profiles.user_id and public.is_shop_member(m.shop_id)
    )
  );

create policy staff_logins_select on public.staff_logins
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.user_id = staff_logins.user_id and public.is_shop_owner(m.shop_id)
    )
  );

create policy pos_devices_select on public.pos_devices
  for select to authenticated using (public.is_shop_owner(shop_id));

create policy audit_log_select on public.audit_log
  for select to authenticated using (public.is_shop_owner(shop_id));

-- membership_pins uchun siyosat yo‘q: authenticated/anon hech narsa ko‘rmaydi.

-- ---------------------------------------------------------------------------
-- Foydalanuvchi chaqiradigan funksiyalar
-- ---------------------------------------------------------------------------

-- Yangi do‘kon: do‘kon + egasi a’zoligi bitta tranzaksiyada.
create function public.create_shop(p_name text, p_timezone text default 'Asia/Tashkent', p_full_name text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := auth.uid();
  v_shop uuid;
begin
  if v_uid is null then
    perform private.raise_code('not_authenticated');
  end if;
  if p_name is null or char_length(btrim(p_name)) < 2 then
    perform private.raise_code('invalid_input', 'name');
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    perform private.raise_code('invalid_input', 'timezone');
  end if;

  insert into public.shops (name, timezone, created_by)
  values (btrim(p_name), p_timezone, v_uid)
  returning id into v_shop;

  insert into public.profiles (user_id, full_name)
  values (v_uid, coalesce(btrim(p_full_name), ''))
  on conflict (user_id) do update
    set full_name = case when btrim(coalesce(p_full_name, '')) = '' then public.profiles.full_name
                         else btrim(p_full_name) end,
        updated_at = now();

  insert into public.memberships (shop_id, user_id, role, can_discount, can_refund, can_write_off, can_receive)
  values (v_shop, v_uid, 'owner', true, true, true, true);

  perform private.audit(v_shop, 'shop.created', 'shop', v_shop::text, jsonb_build_object('name', btrim(p_name)));
  return v_shop;
end $$;

-- Joriy foydalanuvchining shu do‘kondagi konteksti (a’zo bo‘lmasa null).
create function public.get_shop_context(p_shop uuid)
returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'shop_id', s.id,
    'shop_name', s.name,
    'timezone', s.timezone,
    'currency', s.currency,
    'status', s.status,
    'is_demo', s.is_demo,
    'lock_minutes', s.lock_minutes,
    'membership_id', m.id,
    'role', m.role,
    'can_discount', m.can_discount,
    'can_refund', m.can_refund,
    'can_write_off', m.can_write_off,
    'can_receive', m.can_receive,
    'full_name', coalesce(p.full_name, ''),
    'has_pin', exists (select 1 from public.membership_pins mp where mp.membership_id = m.id)
  )
  from public.shops s
  join public.memberships m on m.shop_id = s.id and m.user_id = auth.uid()
  left join public.profiles p on p.user_id = m.user_id
  where s.id = p_shop and public.is_shop_member(s.id);
$$;

create function public.update_shop_settings(p_shop uuid, p_name text, p_timezone text, p_lock_minutes integer)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_owner(p_shop);
  if p_name is null or char_length(btrim(p_name)) < 2 or char_length(btrim(p_name)) > 120 then
    perform private.raise_code('invalid_input', 'name');
  end if;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = p_timezone) then
    perform private.raise_code('invalid_input', 'timezone');
  end if;
  if p_lock_minutes is null or p_lock_minutes not between 1 and 120 then
    perform private.raise_code('invalid_input', 'lock_minutes');
  end if;

  update public.shops
     set name = btrim(p_name), timezone = p_timezone, lock_minutes = p_lock_minutes, updated_at = now()
   where id = p_shop;

  perform private.audit(p_shop, 'shop.settings_updated', 'shop', p_shop::text,
    jsonb_build_object('name', btrim(p_name), 'timezone', p_timezone, 'lock_minutes', p_lock_minutes));
end $$;

-- Xodim qo‘shish. Auth foydalanuvchisini server (service role) oldindan yaratadi,
-- so‘ng egasi o‘z sessiyasi bilan shu funksiyani chaqiradi.
create function public.add_staff_member(
  p_shop uuid, p_user uuid, p_login text, p_full_name text,
  p_can_discount boolean default false, p_can_refund boolean default false,
  p_can_write_off boolean default false, p_can_receive boolean default false
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_login text := lower(btrim(coalesce(p_login, '')));
  v_membership uuid;
begin
  perform private.require_owner(p_shop);
  if not exists (select 1 from auth.users u where u.id = p_user) then
    perform private.raise_code('not_found', 'user');
  end if;
  if exists (select 1 from public.memberships m where m.user_id = p_user) then
    perform private.raise_code('user_already_member');
  end if;
  if v_login !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then
    perform private.raise_code('invalid_input', 'login');
  end if;
  if exists (select 1 from public.staff_logins sl where sl.login = v_login) then
    perform private.raise_code('login_taken');
  end if;
  if p_full_name is null or char_length(btrim(p_full_name)) < 2 then
    perform private.raise_code('invalid_input', 'full_name');
  end if;

  insert into public.staff_logins (user_id, login) values (p_user, v_login);
  insert into public.profiles (user_id, full_name) values (p_user, btrim(p_full_name))
    on conflict (user_id) do update set full_name = excluded.full_name, updated_at = now();
  insert into public.memberships (shop_id, user_id, role, can_discount, can_refund, can_write_off, can_receive)
  values (p_shop, p_user, 'cashier', coalesce(p_can_discount, false), coalesce(p_can_refund, false),
          coalesce(p_can_write_off, false), coalesce(p_can_receive, false))
  returning id into v_membership;

  perform private.audit(p_shop, 'staff.added', 'membership', v_membership::text,
    jsonb_build_object('login', v_login, 'full_name', btrim(p_full_name)));
  return v_membership;
end $$;

-- Kassir ruxsatlari va ismi.
create function public.update_staff_member(
  p_membership uuid, p_full_name text,
  p_can_discount boolean, p_can_refund boolean, p_can_write_off boolean, p_can_receive boolean
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_m public.memberships;
begin
  select * into v_m from public.memberships where id = p_membership;
  if not found then perform private.raise_code('not_found', 'membership'); end if;
  perform private.require_owner(v_m.shop_id);
  if v_m.role <> 'cashier' then perform private.raise_code('forbidden', 'owner_membership'); end if;
  if p_full_name is null or char_length(btrim(p_full_name)) < 2 then
    perform private.raise_code('invalid_input', 'full_name');
  end if;

  update public.memberships
     set can_discount = coalesce(p_can_discount, false),
         can_refund = coalesce(p_can_refund, false),
         can_write_off = coalesce(p_can_write_off, false),
         can_receive = coalesce(p_can_receive, false),
         updated_at = now()
   where id = p_membership;
  update public.profiles set full_name = btrim(p_full_name), updated_at = now() where user_id = v_m.user_id;

  perform private.audit(v_m.shop_id, 'staff.updated', 'membership', p_membership::text,
    jsonb_build_object('can_discount', p_can_discount, 'can_refund', p_can_refund,
                       'can_write_off', p_can_write_off, 'can_receive', p_can_receive));
end $$;

-- Kassirni faollashtirish yoki nofaol qilish. Nofaol qilinsa, sessiyalari bekor bo‘ladi.
create function public.set_staff_active(p_membership uuid, p_active boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_m public.memberships;
begin
  select * into v_m from public.memberships where id = p_membership;
  if not found then perform private.raise_code('not_found', 'membership'); end if;
  perform private.require_owner(v_m.shop_id);
  if v_m.role <> 'cashier' then perform private.raise_code('forbidden', 'owner_membership'); end if;

  if p_active then
    update public.memberships set active = true, updated_at = now() where id = p_membership;
  else
    update public.memberships
       set active = false, sessions_valid_after = now(), updated_at = now()
     where id = p_membership;
    perform private.revoke_auth_sessions(v_m.user_id);
  end if;

  perform private.audit(v_m.shop_id, case when p_active then 'staff.activated' else 'staff.deactivated' end,
    'membership', p_membership::text);
end $$;

-- Xodimning barcha sessiyalarini bekor qilish (masalan, parol tiklangandan keyin).
create function public.revoke_staff_sessions(p_membership uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_m public.memberships;
begin
  select * into v_m from public.memberships where id = p_membership;
  if not found then perform private.raise_code('not_found', 'membership'); end if;
  perform private.require_owner(v_m.shop_id, false);
  if v_m.role <> 'cashier' then perform private.raise_code('forbidden', 'owner_membership'); end if;

  update public.memberships set sessions_valid_after = now(), updated_at = now() where id = p_membership;
  perform private.revoke_auth_sessions(v_m.user_id);
  perform private.audit(v_m.shop_id, 'staff.sessions_revoked', 'membership', p_membership::text);
end $$;

-- Parolini tiklash uchun: egasi shu do‘kon kassirining user_id’sini oladi.
create function public.staff_user_for_password_reset(p_membership uuid)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_m public.memberships;
begin
  select * into v_m from public.memberships where id = p_membership;
  if not found then perform private.raise_code('not_found', 'membership'); end if;
  perform private.require_owner(v_m.shop_id);
  if v_m.role <> 'cashier' then perform private.raise_code('forbidden', 'owner_membership'); end if;
  perform private.audit(v_m.shop_id, 'staff.password_reset', 'membership', p_membership::text);
  return v_m.user_id;
end $$;

-- PIN o‘rnatish yoki almashtirish (faqat egasi). Kassir PIN’i almashsa, sessiyalari bekor bo‘ladi.
create function public.set_member_pin(p_membership uuid, p_pin text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_m public.memberships;
  v_had_pin boolean;
begin
  select * into v_m from public.memberships where id = p_membership;
  if not found then perform private.raise_code('not_found', 'membership'); end if;
  perform private.require_owner(v_m.shop_id);
  perform private.assert_pin_ok(p_pin);

  v_had_pin := exists (select 1 from public.membership_pins where membership_id = p_membership);

  insert into public.membership_pins (membership_id, pin_hash, failed_attempts, locked_until, updated_at)
  values (p_membership, extensions.crypt(p_pin, extensions.gen_salt('bf', 10)), 0, null, now())
  on conflict (membership_id) do update
    set pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = null, updated_at = now();

  if v_had_pin and v_m.user_id <> auth.uid() then
    update public.memberships set sessions_valid_after = now(), updated_at = now() where id = p_membership;
    perform private.revoke_auth_sessions(v_m.user_id);
  end if;

  perform private.audit(v_m.shop_id, case when v_had_pin then 'pin.changed' else 'pin.set' end,
    'membership', p_membership::text);
end $$;

-- Joriy brauzerni kassa qurilmasi sifatida bog‘lash. Token serverda yaratiladi va faqat hash saqlanadi.
create function public.register_device(p_shop uuid, p_name text, p_token text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  perform private.require_owner(p_shop);
  if p_name is null or char_length(btrim(p_name)) not between 1 and 60 then
    perform private.raise_code('invalid_input', 'name');
  end if;
  if p_token is null or char_length(p_token) < 32 then
    perform private.raise_code('invalid_input', 'token');
  end if;

  insert into public.pos_devices (shop_id, name, token_hash, created_by)
  values (p_shop, btrim(p_name), private.token_hash(p_token), auth.uid())
  returning id into v_id;

  perform private.audit(p_shop, 'device.registered', 'pos_device', v_id::text, jsonb_build_object('name', btrim(p_name)));
  return v_id;
end $$;

create function public.revoke_device(p_device uuid)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.pos_devices where id = p_device;
  if v_shop is null then perform private.raise_code('not_found', 'device'); end if;
  perform private.require_owner(v_shop, false);

  update public.pos_devices
     set revoked_at = coalesce(revoked_at, now()), revoked_by = coalesce(revoked_by, auth.uid())
   where id = p_device;
  perform private.audit(v_shop, 'device.revoked', 'pos_device', p_device::text);
end $$;

-- Egasi uchun xodimlar ro‘yxati (PIN holati bilan, hash’siz).
create function public.list_shop_members(p_shop uuid)
returns table (
  membership_id uuid, user_id uuid, full_name text, login text, role public.member_role, active boolean,
  can_discount boolean, can_refund boolean, can_write_off boolean, can_receive boolean,
  has_pin boolean, pin_locked_until timestamptz, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  perform private.require_owner(p_shop, false);
  return query
  select m.id, m.user_id, coalesce(p.full_name, ''), sl.login, m.role, m.active,
         m.can_discount, m.can_refund, m.can_write_off, m.can_receive,
         (mp.membership_id is not null),
         case when mp.locked_until > now() then mp.locked_until end,
         m.created_at
  from public.memberships m
  left join public.profiles p on p.user_id = m.user_id
  left join public.staff_logins sl on sl.user_id = m.user_id
  left join public.membership_pins mp on mp.membership_id = m.id
  where m.shop_id = p_shop
  order by m.role, m.active desc, coalesce(p.full_name, '');
end $$;

-- ---------------------------------------------------------------------------
-- Faqat server (service_role) chaqiradigan funksiyalar: kassa qurilmasi va PIN
-- ---------------------------------------------------------------------------
create function public.device_lookup(p_token text)
returns table (device_id uuid, device_name text, shop_id uuid, shop_name text, shop_status public.shop_status,
               lock_minutes integer, is_demo boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
begin
  return query
  update public.pos_devices d
     set last_seen_at = now()
    from public.shops s
   where d.token_hash = private.token_hash(p_token)
     and d.revoked_at is null
     and s.id = d.shop_id
  returning d.id, d.name, s.id, s.name, s.status, s.lock_minutes, s.is_demo;
end $$;

create function public.device_staff_list(p_token text)
returns table (membership_id uuid, full_name text, role public.member_role, has_pin boolean)
language sql stable security definer set search_path = '' as $$
  select m.id, coalesce(p.full_name, ''), m.role, (mp.membership_id is not null)
  from public.pos_devices d
  join public.memberships m on m.shop_id = d.shop_id and m.active
  left join public.profiles p on p.user_id = m.user_id
  left join public.membership_pins mp on mp.membership_id = m.id
  where d.token_hash = private.token_hash(p_token) and d.revoked_at is null
  order by m.role, coalesce(p.full_name, '');
$$;

-- PIN tekshiruvi. Xato javob ham tranzaksiyani yakunlaydi, shuning uchun urinishlar soni saqlanadi.
-- code: ok | device_invalid | member_invalid | no_pin | locked | wrong_pin
create function public.pin_check(p_token text, p_membership uuid, p_pin text)
returns table (ok boolean, code text, user_id uuid, shop_id uuid, attempts_left integer, locked_until timestamptz)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_device public.pos_devices;
  v_m      public.memberships;
  v_pin    public.membership_pins;
  v_max    constant integer := 5;
  v_lock   constant interval := interval '5 minutes';
begin
  select * into v_device from public.pos_devices d
   where d.token_hash = private.token_hash(coalesce(p_token, '')) and d.revoked_at is null;
  if not found then
    return query select false, 'device_invalid', null::uuid, null::uuid, null::integer, null::timestamptz;
    return;
  end if;

  select * into v_m from public.memberships m
   where m.id = p_membership and m.shop_id = v_device.shop_id and m.active;
  if not found then
    perform private.audit(v_device.shop_id, 'pin.rejected', 'pos_device', v_device.id::text,
      jsonb_build_object('reason', 'member_invalid', 'membership_id', p_membership), null);
    return query select false, 'member_invalid', null::uuid, null::uuid, null::integer, null::timestamptz;
    return;
  end if;

  select * into v_pin from public.membership_pins mp where mp.membership_id = v_m.id for update;
  if not found then
    return query select false, 'no_pin', null::uuid, null::uuid, null::integer, null::timestamptz;
    return;
  end if;

  if v_pin.locked_until is not null and v_pin.locked_until > now() then
    perform private.audit(v_device.shop_id, 'pin.rejected', 'membership', v_m.id::text,
      jsonb_build_object('reason', 'locked', 'device_id', v_device.id), v_m.user_id);
    return query select false, 'locked', null::uuid, null::uuid, 0, v_pin.locked_until;
    return;
  end if;

  if extensions.crypt(coalesce(p_pin, ''), v_pin.pin_hash) = v_pin.pin_hash then
    update public.membership_pins set failed_attempts = 0, locked_until = null where membership_id = v_m.id;
    update public.pos_devices set last_seen_at = now() where id = v_device.id;
    perform private.audit(v_device.shop_id, 'pin.success', 'membership', v_m.id::text,
      jsonb_build_object('device_id', v_device.id), v_m.user_id);
    return query select true, 'ok', v_m.user_id, v_m.shop_id, v_max, null::timestamptz;
    return;
  end if;

  if v_pin.failed_attempts + 1 >= v_max then
    update public.membership_pins
       set failed_attempts = 0, locked_until = now() + v_lock
     where membership_id = v_m.id
     returning * into v_pin;
    perform private.audit(v_device.shop_id, 'pin.locked', 'membership', v_m.id::text,
      jsonb_build_object('device_id', v_device.id), v_m.user_id);
    return query select false, 'locked', null::uuid, null::uuid, 0, v_pin.locked_until;
    return;
  end if;

  update public.membership_pins set failed_attempts = failed_attempts + 1
   where membership_id = v_m.id returning * into v_pin;
  perform private.audit(v_device.shop_id, 'pin.failed', 'membership', v_m.id::text,
    jsonb_build_object('device_id', v_device.id, 'attempt', v_pin.failed_attempts), v_m.user_id);
  return query select false, 'wrong_pin', null::uuid, null::uuid, v_max - v_pin.failed_attempts, null::timestamptz;
end $$;

-- ---------------------------------------------------------------------------
-- Huquqlar. Supabase standart holatda anon/authenticated’ga hamma narsani beradi,
-- shuning uchun avval hammasini olib qo‘yamiz, keyin kerakligini beramiz.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

grant select on public.shops, public.memberships, public.profiles, public.staff_logins, public.audit_log
  to authenticated;
grant select (id, shop_id, name, created_by, created_at, last_seen_at, revoked_at, revoked_by)
  on public.pos_devices to authenticated;

grant execute on function
  public.member_role_in(uuid),
  public.is_shop_member(uuid),
  public.is_shop_owner(uuid),
  public.shop_is_writable(uuid),
  public.create_shop(text, text, text),
  public.get_shop_context(uuid),
  public.list_shop_members(uuid),
  public.update_shop_settings(uuid, text, text, integer),
  public.add_staff_member(uuid, uuid, text, text, boolean, boolean, boolean, boolean),
  public.update_staff_member(uuid, text, boolean, boolean, boolean, boolean),
  public.set_staff_active(uuid, boolean),
  public.revoke_staff_sessions(uuid),
  public.staff_user_for_password_reset(uuid),
  public.set_member_pin(uuid, text),
  public.register_device(uuid, text, text),
  public.revoke_device(uuid)
to authenticated;

grant execute on function
  public.device_lookup(text),
  public.device_staff_list(text),
  public.pin_check(text, uuid, text)
to service_role;

grant all on all tables in schema public to service_role;
