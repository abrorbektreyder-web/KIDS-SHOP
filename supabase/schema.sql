-- Run once in Supabase SQL Editor before taking real orders.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name_uz text not null,
  name_ru text not null,
  category text not null check (category in ('boys','girls')),
  type text not null default 'sets',
  price integer not null check (price >= 0),
  old_price integer check (old_price is null or old_price >= price),
  age text not null default '',
  colors text[] not null default '{}',
  image_url text not null default '/images/look-safari.webp',
  badge text not null default '',
  tagline_uz text not null default '',
  tagline_ru text not null default '',
  sizes text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  region text not null,
  district text not null,
  address text not null,
  comment text not null default '',
  payment text not null check (payment in ('cod','card')),
  language text not null default 'uz' check (language in ('uz','ru')),
  total integer not null check (total >= 0),
  status text not null default 'new' check (status in ('new','confirmed','packing','sent','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0)
);

create table if not exists public.subscribers (
  phone text primary key,
  language text not null default 'uz' check (language in ('uz','ru')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Public client roles get no direct write access. Server functions use the service role key.
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscribers enable row level security;
revoke all on public.products, public.orders, public.order_items, public.subscribers from public, anon, authenticated;
grant all on public.products, public.orders, public.order_items, public.subscribers to service_role;

create or replace function public.place_order(order_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  product_row public.products%rowtype;
  order_key uuid := gen_random_uuid();
  order_total integer := 0;
  line_items jsonb := '[]'::jsonb;
  item_qty integer;
  item_size text;
  item_name text;
begin
  if jsonb_typeof(order_payload->'items') <> 'array' or jsonb_array_length(order_payload->'items') = 0 then
    raise exception 'empty_order';
  end if;
  for item in select value from jsonb_array_elements(order_payload->'items') loop
    item_qty := greatest(1, least(20, (item->>'qty')::integer));
    item_size := left(coalesce(item->>'size',''),32);
    select * into product_row from public.products where id = item->>'productId' and active = true for update;
    if not found or item_size = '' or not (item_size = any(product_row.sizes)) then raise exception 'product_or_size_unavailable'; end if;
    if product_row.stock < item_qty then raise exception 'out_of_stock'; end if;
    item_name := case when order_payload->>'lang' = 'ru' then product_row.name_ru else product_row.name_uz end;
    order_total := order_total + product_row.price * item_qty;
    line_items := line_items || jsonb_build_array(jsonb_build_object('name',item_name,'size',item_size,'qty',item_qty,'unitPrice',product_row.price));
  end loop;
  insert into public.orders(id,customer_name,phone,region,district,address,comment,payment,language,total)
  values(order_key, left(order_payload#>>'{customer,name}',120), left(order_payload#>>'{customer,phone}',32), left(order_payload#>>'{customer,region}',100), left(order_payload#>>'{customer,district}',100), left(order_payload#>>'{customer,address}',500), left(coalesce(order_payload#>>'{customer,comment}',''),500), case when order_payload->>'payment'='card' then 'card' else 'cod' end, case when order_payload->>'lang'='ru' then 'ru' else 'uz' end, order_total);
  for item in select value from jsonb_array_elements(order_payload->'items') loop
    item_qty := greatest(1, least(20, (item->>'qty')::integer));
    item_size := left(coalesce(item->>'size',''),32);
    select * into product_row from public.products where id = item->>'productId' for update;
    item_name := case when order_payload->>'lang' = 'ru' then product_row.name_ru else product_row.name_uz end;
    insert into public.order_items(order_id,product_id,product_name,size,quantity,unit_price) values(order_key,product_row.id,item_name,item_size,item_qty,product_row.price);
    update public.products set stock = stock - item_qty, updated_at = now() where id = product_row.id;
  end loop;
  return jsonb_build_object('order_id',order_key,'total',order_total,'items',line_items);
end;
$$;
revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

insert into public.products(id,name_uz,name_ru,category,type,price,old_price,age,colors,image_url,badge,tagline_uz,tagline_ru,sizes,stock)
values
('look-safari','Safari mini ko‘ylak','Комплект Safari mini','boys','sets',219000,259000,'3–8 yosh',array['#d5a76e','#819267','#e9e2d2'],'/images/product-baby-winter.webp','HIT','Yengil paxta • kundalik qulaylik','Лёгкий хлопок • комфорт на каждый день',array['2–3 yosh','3–4 yosh','5–6 yosh','7–8 yosh'],10),
('little-adventure','Adventure kundalik set','Повседневный комплект Adventure','boys','sets',289000,null,'2–6 yosh',array['#2165d5','#f2d333','#f1ead9'],'/images/product-adventure-boy.webp','YANGI','O‘yin va sarguzasht uchun','Для игр и приключений',array['2–3 yosh','3–4 yosh','5–6 yosh'],10),
('sunshine-dress','Sunshine yozgi libos','Летнее платье Sunshine','girls','sets',249000,299000,'3–9 yosh',array['#edd276','#efb7ae','#d9e6c2'],'/images/product-lilac-girl.webp','−17%','Yumshoq mato • bayramona kayfiyat','Мягкая ткань • праздничное настроение',array['3–4 yosh','5–6 yosh','7–8 yosh','9–10 yosh'],10),
('little-star-shirt','Little Star ko‘ylak','Рубашка Little Star','boys','tops',179000,null,'2–8 yosh',array['#fffefa','#89a071','#c7dcf2'],'/images/product-streetwear-boy.webp','HIT','Nafas oluvchi paxta • qulay bichim','Дышащий хлопок • удобный крой',array['2–3 yosh','3–4 yosh','5–6 yosh','7–8 yosh'],10),
('mini-explorer-set','Mini Explorer to‘plami','Комплект Mini Explorer','boys','sets',329000,null,'4–10 yosh',array['#2361d7','#e9dec6'],'/images/product-autumn-boy.webp','YANGI','Yengil qatlamlar • har kungi uslub','Лёгкие слои • стиль на каждый день',array['3–4 yosh','5–6 yosh','7–8 yosh','9–10 yosh'],10),
('flower-day-dress','Flower Day ko‘ylagi','Платье Flower Day','girls','tops',229000,null,'3–8 yosh',array['#f3d9d5','#fffefa','#a2b37b'],'/images/product-floral-girl.webp','YANGI','Muloyim ranglar • erkin harakat','Нежные цвета • свобода движений',array['3–4 yosh','5–6 yosh','7–8 yosh'],10),
('sunny-day-set','Sunny Day qulay set','Комплект Sunny Day','boys','sets',269000,319000,'2–7 yosh',array['#f3d34d','#2c61d6','#ede9df'],'/images/product-mustard-vest.webp','−16%','Yumshoq paxta • faol bolalar uchun','Мягкий хлопок • для активных детей',array['2–3 yosh','3–4 yosh','5–6 yosh','7–8 yosh'],10),
('weekend-dress','Weekend mini libos','Платье Weekend mini','girls','tops',199000,null,'2–7 yosh',array['#aabd84','#e2c9a0','#eeb7a5'],'/images/product-green-girl.webp','HIT','Har bir kun — kichik bayram','Каждый день — маленький праздник',array['2–3 yosh','3–4 yosh','5–6 yosh','7–8 yosh'],10)
on conflict (id) do nothing;
