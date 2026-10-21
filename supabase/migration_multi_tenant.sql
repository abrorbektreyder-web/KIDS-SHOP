-- ==============================================================================
-- KIDS-SHOP TO SAAS PLATFORM: MULTI-TENANT DATABASE MIGRATION SCRIPT
-- Supabase SQL Editor'da 1 marta ishga tushiriladi (Run).
-- Ushbu skript mavjud tovarlar va buyurtmalarni buzmasdan, ularni 'kids-shop'
-- do'koniga xavfsiz biriktiradi va yangi 20–1000 ta do'kon uchun poydevor yaratadi.
-- ==============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 1. STORES (TENANTS) JADVALI
create table if not exists public.stores (
  id text primary key,                        -- Masalan: 'kids-shop', 'safari-kids', 'alitoys' (slug)
  name text not null,                         -- Do'kon nomi: "KIDS-SHOP Bolalar Kiyimlari"
  owner_phone text not null default '',       -- Tadbirkor telefon raqami (+99890...)
  owner_password_hash text not null default '',-- Admin parol xeshi
  custom_domain text unique,                  -- Shaxsiy domen: masalan 'safarikids.uz'
  logo_url text default '/images/look-safari.webp',
  theme_color text default '#285ae8',         -- Do'konning asosiy rangi
  currency text default 'UZS',
  telegram_chat_id text not null default '',  -- Buyurtmalar boradigan Telegram Group/Channel ID
  telegram_bot_token text,                    -- Ixtiyoriy: agar tadbirkor o'z botini ulasa
  plan text not null default 'basic' check (plan in ('trial', 'basic', 'pro')),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  plan_expires_at timestamptz not null default (now() + interval '365 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. DASTLABKI ASOSIY DO'KONNI KIRITISH (Default Store)
insert into public.stores (id, name, owner_phone, plan, status, theme_color)
values ('kids-shop', 'KIDS-SHOP', '+998900000000', 'pro', 'active', '#285ae8')
on conflict (id) do update set updated_at = now();

-- 3. PRODUCTS JADVALIGA STORE_ID QO'SHISH
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='store_id') then
    alter table public.products add column store_id text not null default 'kids-shop' references public.stores(id) on delete cascade;
  end if;
end $$;

-- Products uchun Primary Key ni (store_id, id) ga almashtirish
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints 
    where constraint_type = 'PRIMARY KEY' and table_name = 'products' and table_schema = 'public' and constraint_name = 'products_pkey'
  ) then
    alter table public.products drop constraint products_pkey cascade;
    alter table public.products add primary key (store_id, id);
  end if;
exception when others then
  null;
end $$;

-- 4. ORDERS JADVALIGA STORE_ID VA OPERATOR USTUNLARINI QO'SHISH
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='store_id') then
    alter table public.orders add column store_id text not null default 'kids-shop' references public.stores(id) on delete cascade;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='accepted_by') then
    alter table public.orders add column accepted_by text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='telegram_message_id') then
    alter table public.orders add column telegram_message_id text;
  end if;
end $$;

-- 5. ORDER_ITEMS JADVALIGA COLOR USTUNINI QO'SHISH
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='order_items' and column_name='color') then
    alter table public.order_items add column color text not null default '';
  end if;
end $$;

-- 6. SUBSCRIBERS JADVALIGA STORE_ID QO'SHISH
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='subscribers' and column_name='store_id') then
    alter table public.subscribers add column store_id text not null default 'kids-shop' references public.stores(id) on delete cascade;
    alter table public.subscribers drop constraint if exists subscribers_pkey;
    alter table public.subscribers add primary key (store_id, phone);
  end if;
end $$;

-- 7. TEZKOR QIDIRUV VA MASSHTABLANISH INDEKSLARI (1000+ DO'KON UCHUN)
create index if not exists idx_stores_status on public.stores (status);
create index if not exists idx_stores_domain on public.stores (custom_domain);
create index if not exists idx_products_store_active on public.products (store_id, active, created_at desc);
create index if not exists idx_orders_store_status on public.orders (store_id, status, created_at desc);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

-- 8. ROW LEVEL SECURITY (RLS) QOIDALARI
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscribers enable row level security;

revoke all on public.stores, public.products, public.orders, public.order_items, public.subscribers from public, anon, authenticated;
grant all on public.stores, public.products, public.orders, public.order_items, public.subscribers to service_role;

-- 9. YANGILANGAN TRANZAKSION PLACE_ORDER FUNKSIYASI (STORE_ID BILAN)
create or replace function public.place_order(order_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  store_row public.stores%rowtype;
  target_store_id text;
  order_key uuid := gen_random_uuid();
  order_total integer := 0;
  line_items jsonb := '[]'::jsonb;
  item_qty integer;
  item_size text;
  item_color text;
  item_name text;
begin
  -- Do'kon identifikatorini aniqlash (Default: 'kids-shop')
  target_store_id := coalesce(order_payload->>'storeId', order_payload->>'store_id', 'kids-shop');
  
  -- Do'kon mavjud va faol ekanini tekshirish
  select * into store_row from public.stores where id = target_store_id and status = 'active';
  if not found then
    raise exception 'store_not_found_or_inactive';
  end if;

  if jsonb_typeof(order_payload->'items') <> 'array' or jsonb_array_length(order_payload->'items') = 0 then
    raise exception 'empty_order';
  end if;

  -- 1-Bosqich: Har bir tovar zaxirasi va o'lchamini tekshirish
  for item in select value from jsonb_array_elements(order_payload->'items') loop
    item_qty := greatest(1, least(20, (item->>'qty')::integer));
    item_size := left(coalesce(item->>'size',''), 32);
    item_color := left(coalesce(item->>'color',''), 50);

    select * into product_row from public.products 
    where id = item->>'productId' and store_id = target_store_id and active = true 
    for update;

    if not found or item_size = '' or not (item_size = any(product_row.sizes)) then 
      raise exception 'product_or_size_unavailable'; 
    end if;

    if product_row.stock < item_qty then 
      raise exception 'out_of_stock'; 
    end if;

    item_name := case when order_payload->>'lang' = 'ru' then product_row.name_ru else product_row.name_uz end;
    order_total := order_total + product_row.price * item_qty;
    line_items := line_items || jsonb_build_array(jsonb_build_object(
      'name', item_name,
      'size', item_size,
      'color', item_color,
      'qty', item_qty,
      'unitPrice', product_row.price
    ));
  end loop;

  -- 2-Bosqich: Buyurtmani saqlash
  insert into public.orders(
    id, store_id, customer_name, phone, region, district, address, comment, payment, language, total
  ) values (
    order_key,
    target_store_id,
    left(order_payload#>>'{customer,name}', 120),
    left(order_payload#>>'{customer,phone}', 32),
    left(order_payload#>>'{customer,region}', 100),
    left(order_payload#>>'{customer,district}', 100),
    left(order_payload#>>'{customer,address}', 500),
    left(coalesce(order_payload#>>'{customer,comment}', ''), 500),
    case when order_payload->>'payment'='card' then 'card' else 'cod' end,
    case when order_payload->>'lang'='ru' then 'ru' else 'uz' end,
    order_total
  );

  -- 3-Bosqich: Buyurtma qatorlarini yozish va zaxirani kamaytirish
  for item in select value from jsonb_array_elements(order_payload->'items') loop
    item_qty := greatest(1, least(20, (item->>'qty')::integer));
    item_size := left(coalesce(item->>'size',''), 32);
    item_color := left(coalesce(item->>'color',''), 50);

    select * into product_row from public.products 
    where id = item->>'productId' and store_id = target_store_id
    for update;

    item_name := case when order_payload->>'lang' = 'ru' then product_row.name_ru else product_row.name_uz end;

    insert into public.order_items(order_id, product_id, product_name, size, color, quantity, unit_price)
    values (order_key, product_row.id, item_name, item_size, item_color, item_qty, product_row.price);

    update public.products 
    set stock = stock - item_qty, updated_at = now() 
    where id = product_row.id and store_id = target_store_id;
  end loop;

  return jsonb_build_object(
    'order_id', order_key,
    'store_id', target_store_id,
    'total', order_total,
    'items', line_items,
    'telegram_chat_id', store_row.telegram_chat_id,
    'telegram_bot_token', store_row.telegram_bot_token,
    'store_name', store_row.name
  );
end;
$$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
