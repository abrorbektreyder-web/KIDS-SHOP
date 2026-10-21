-- ==============================================================================
-- KIDS-SHOP TO SAAS PLATFORM: DYNAMIC STOREFRONT CUSTOMIZATION MIGRATION
-- Har bir do'kon (poyabzal, kiyim, elektronika va h.k.) o'z vitrinasini
-- o'z sohasiga moslab sozlashi uchun yangi ustunlar qo'shiladi.
-- Supabase SQL Editor'da 1 marta ishga tushiriladi (Run).
-- ==============================================================================

do $$
begin
  -- 1. Vitrina bosh sahifa sarlavhasi (Hero Title)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='hero_title') then
    alter table public.stores add column hero_title text default 'Kichik qadamlar,\nkatta sarguzashtlar.';
  end if;

  -- 2. Vitrina bosh sahifa osti matni (Hero Subtitle)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='hero_subtitle') then
    alter table public.stores add column hero_subtitle text default 'Har kun uchun qulay, bolalik uchun esa unutilmas kiyimlar. Kichkintoyingiz erkin harakat qilsin, uslubi esa o‘ziga xos bo‘lsin.';
  end if;

  -- 3. Vitrina bosh banner rasmi (Hero Image URL)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='hero_image_url') then
    alter table public.stores add column hero_image_url text default '/images/look-safari.webp';
  end if;

  -- 4. Bosh banner tugmasi matni (Banner CTA Button Text)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='banner_cta_text') then
    alter table public.stores add column banner_cta_text text default 'Xaridni boshlash';
  end if;

  -- 5. Sayt yuqori e'lonlar satri (Announcement Bar Text)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='announcement_text') then
    alter table public.stores add column announcement_text text default 'Yangi kolleksiya — 2026';
  end if;

  -- 6. Do'kon aloqa telefoni (Contact Phone)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='contact_phone') then
    alter table public.stores add column contact_phone text default '+998900000000';
  end if;

  -- 7. Do'kon Telegram aloqasi / kanali (Contact Telegram)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='contact_telegram') then
    alter table public.stores add column contact_telegram text default '';
  end if;

  -- 8. Maxsus Mahsulot Kategoriyalari (Custom Categories - JSONB)
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='categories') then
    alter table public.stores add column categories jsonb default '[{"id":"all","name_uz":"Barchasi","name_ru":"Все"},{"id":"boys","name_uz":"O‘g‘il bolalar","name_ru":"Для мальчиков"},{"id":"girls","name_uz":"Qiz bolalar","name_ru":"Для девочек"},{"id":"sets","name_uz":"To‘plamlar","name_ru":"Комплекты"}]'::jsonb;
  end if;
end $$;

-- Mavjud do'konlar uchun bo'sh bo'lgan ustunlarni to'ldirish
update public.stores
set 
  hero_title = coalesce(hero_title, 'Kichik qadamlar,\nkatta sarguzashtlar.'),
  hero_subtitle = coalesce(hero_subtitle, 'Har kun uchun qulay, bolalik uchun esa unutilmas kiyimlar. Kichkintoyingiz erkin harakat qilsin, uslubi esa o‘ziga xos bo‘lsin.'),
  hero_image_url = coalesce(hero_image_url, '/images/look-safari.webp'),
  banner_cta_text = coalesce(banner_cta_text, 'Xaridni boshlash'),
  announcement_text = coalesce(announcement_text, 'Yangi kolleksiya — 2026'),
  contact_phone = coalesce(contact_phone, owner_phone, '+998900000000'),
  contact_telegram = coalesce(contact_telegram, ''),
  categories = coalesce(categories, '[{"id":"all","name_uz":"Barchasi","name_ru":"Все"},{"id":"boys","name_uz":"O‘g‘il bolalar","name_ru":"Для мальчиков"},{"id":"girls","name_uz":"Qiz bolalar","name_ru":"Для девочек"},{"id":"sets","name_uz":"To‘plamlar","name_ru":"Комплекты"}]'::jsonb);
