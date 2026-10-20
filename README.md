# KIDS-SHOP

Uzbek/Russian children’s clothing storefront prepared for Vercel. The static storefront includes a responsive catalog, search/filter/sort, favorites, size selection, cart, checkout form, Telegram Mini App support, newsletter sign-up, and a private admin panel for products, stock, and order status.

## Deploy

1. Connect this folder’s Git repository to Vercel. No build command or package installation is required; Vercel serves the static pages and runs `api/*.js` as serverless functions.
2. Create a Supabase project. In its SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) once. This creates the product catalog, inventory, orders, order lines, subscriber list, and the transactional `place_order` function. Sample names, prices, stock, and photos are placeholders; update them before taking real orders.
3. Create a Telegram bot with BotFather, add it as an administrator to the order group or channel with permission to send messages, and configure the Mini App URL in BotFather.
4. Add the values in [`.env.example`](.env.example) under Vercel **Project Settings → Environment Variables**. `SUPABASE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` are server-only secrets. Never add them to `config.js` or commit real values. The API accepts the newer Supabase secret key and keeps a compatibility fallback for legacy `service_role` keys.
5. Set `TELEGRAM_GROUP_ID` to the destination group or channel ID. The bot must be allowed to post there. The order API writes the order and decrements stock inside one database transaction before sending the report to that destination. Keep `ORDERS_ENABLED=false` until the catalog and destination are ready; switch it to `true` to open checkout.
6. Set a long, unique `ADMIN_PASSWORD` and a randomly generated `ADMIN_SESSION_SECRET` with at least 32 characters. Open `/admin/` to manage products, stock, order status, and call the customer.

## Run locally

1. From this folder, run `py -3 local_server.py` in PowerShell (or double-click `start-local.bat`).
2. Open [http://127.0.0.1:4173](http://127.0.0.1:4173).
3. Product browsing, language switching, favorites, cart, and checkout preview work locally. Local demo orders are saved in this browser only (`localStorage` key `kids-shop-local-orders`) and are not sent to Telegram or stored as real orders. Stop the server with `Ctrl+C`.
4. Real order submission requires the Vercel functions plus configured Supabase and Telegram credentials. For now, checkout only offers cash on delivery; the online payment options were removed.

## Images and catalog

Three reference images provided in the task are copied into `public/images/`. The starter catalog uses them as temporary campaign/product imagery. Replace the image URLs and sample product details in the admin panel with the store’s actual products. For new image files, add them to `public/images/` and use URLs such as `/images/item-name.webp`.

## Still needed before launch

- Real product titles, descriptions, sizes, prices, available quantities, and their photos.
- Final delivery price/timing/returns rules and real store support contacts. Review all business copy before launch; the remaining sample catalog names, product details, and images are placeholders.
- Current payment method: cash on delivery. No card gateway is connected.
- A customer sign-in method. Phone OTP needs an SMS provider; email magic links need a verified email sender. Favorites currently stay in the current browser, and the account/order-history UI is not wired until the sign-in provider is chosen.
- The final Mini App bot username and Telegram group/operator chat IDs.

The static storefront files live in `public/`; `vercel.json` explicitly sets this as the output directory so Vercel serves `public/index.html`.
