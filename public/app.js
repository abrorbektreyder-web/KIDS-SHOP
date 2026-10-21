const PRODUCTS = [
  { id:"look-safari", name:{uz:"Safari mini ko‘ylak",ru:"Комплект Safari mini"}, category:"boys", type:"sets", price:219000, oldPrice:259000, age:"3–8 yosh", colors:["#d5a76e","#819267","#e9e2d2"], image:"/images/product-baby-winter.webp", badge:"HIT", tagline:{uz:"Yengil paxta • kundalik qulaylik",ru:"Лёгкий хлопок • комфорт на каждый день"}, sizes:["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"] },
  { id:"little-adventure", name:{uz:"Adventure kundalik set",ru:"Повседневный комплект Adventure"}, category:"boys", type:"sets", price:289000, age:"2–6 yosh", colors:["#2165d5","#f2d333","#f1ead9"], image:"/images/product-adventure-boy.webp", badge:"YANGI", tagline:{uz:"O‘yin va sarguzasht uchun",ru:"Для игр и приключений"}, sizes:["2–3 yosh","3–4 yosh","5–6 yosh"] },
  { id:"sunshine-dress", name:{uz:"Sunshine yozgi libos",ru:"Летнее платье Sunshine"}, category:"girls", type:"sets", price:249000, oldPrice:299000, age:"3–9 yosh", colors:["#edd276","#efb7ae","#d9e6c2"], image:"/images/product-lilac-girl.webp", badge:"−17%", tagline:{uz:"Yumshoq mato • bayramona kayfiyat",ru:"Мягкая ткань • праздничное настроение"}, sizes:["3–4 yosh","5–6 yosh","7–8 yosh","9–10 yosh"] },
  { id:"little-star-shirt", name:{uz:"Little Star ko‘ylak",ru:"Рубашка Little Star"}, category:"boys", type:"tops", price:179000, age:"2–8 yosh", colors:["#fffefa","#89a071","#c7dcf2"], image:"/images/product-streetwear-boy.webp", badge:"HIT", tagline:{uz:"Nafas oluvchi paxta • qulay bichim",ru:"Дышащий хлопок • удобный крой"}, sizes:["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"] },
  { id:"mini-explorer-set", name:{uz:"Mini Explorer to‘plami",ru:"Комплект Mini Explorer"}, category:"boys", type:"sets", price:329000, age:"4–10 yosh", colors:["#2361d7","#e9dec6"], image:"/images/product-autumn-boy.webp", badge:"YANGI", tagline:{uz:"Yengil qatlamlar • har kungi uslub",ru:"Лёгкие слои • стиль на каждый день"}, sizes:["3–4 yosh","5–6 yosh","7–8 yosh","9–10 yosh"] },
  { id:"flower-day-dress", name:{uz:"Flower Day ko‘ylagi",ru:"Платье Flower Day"}, category:"girls", type:"tops", price:229000, age:"3–8 yosh", colors:["#f3d9d5","#fffefa","#a2b37b"], image:"/images/product-floral-girl.webp", badge:"YANGI", tagline:{uz:"Muloyim ranglar • erkin harakat",ru:"Нежные цвета • свобода движений"}, sizes:["3–4 yosh","5–6 yosh","7–8 yosh"] },
  { id:"sunny-day-set", name:{uz:"Sunny Day qulay set",ru:"Комплект Sunny Day"}, category:"boys", type:"sets", price:269000, oldPrice:319000, age:"2–7 yosh", colors:["#f3d34d","#2c61d6","#ede9df"], image:"/images/product-mustard-vest.webp", badge:"−16%", tagline:{uz:"Yumshoq paxta • faol bolalar uchun",ru:"Мягкий хлопок • для активных детей"}, sizes:["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"] },
  { id:"weekend-dress", name:{uz:"Weekend mini libos",ru:"Платье Weekend mini"}, category:"girls", type:"tops", price:199000, age:"2–7 yosh", colors:["#aabd84","#e2c9a0","#eeb7a5"], image:"/images/product-green-girl.webp", badge:"HIT", tagline:{uz:"Har bir kun — kichik bayram",ru:"Каждый день — маленький праздник"}, sizes:["2–3 yosh","3–4 yosh","5–6 yosh","7–8 yosh"] }
];

const COLOR_NAMES = {
  "#d5a76e": { uz: "Qumrang", ru: "Песочный" },
  "#819267": { uz: "Zaytunrang", ru: "Оливковый" },
  "#e9e2d2": { uz: "Qaymoqrang", ru: "Сливочный" },
  "#2165d5": { uz: "Ko‘k", ru: "Синий" },
  "#f2d333": { uz: "Sariq", ru: "Жёлтый" },
  "#f1ead9": { uz: "Kremoviy", ru: "Кремовый" },
  "#edd276": { uz: "Oltin sariq", ru: "Золотистый" },
  "#efb7ae": { uz: "Shaftolirang", ru: "Персиковый" },
  "#d9e6c2": { uz: "Yalpizrang", ru: "Мятный" },
  "#fffefa": { uz: "Oq", ru: "Белый" },
  "#89a071": { uz: "Yashil", ru: "Зелёный" },
  "#c7dcf2": { uz: "Och moviy", ru: "Светло-голубой" },
  "#2361d7": { uz: "To‘q moviy", ru: "Тёмно-синий" },
  "#e9dec6": { uz: "Bej", ru: "Бежевый" },
  "#f3d9d5": { uz: "Nozik pushti", ru: "Нежно-розовый" },
  "#a2b37b": { uz: "Zaytunrang", ru: "Оливковый" },
  "#f3d34d": { uz: "Xantal sariq", ru: "Горчичный" },
  "#2c61d6": { uz: "Yorqin moviy", ru: "Ярко-синий" },
  "#ede9df": { uz: "Och bej", ru: "Светло-бежевый" },
  "#aabd84": { uz: "Adaçayı yashil", ru: "Шалфей" },
  "#e2c9a0": { uz: "Bug‘doyrang", ru: "Пшеничный" },
  "#eeb7a5": { uz: "Marjonrang", ru: "Коралловый" }
};

function getColorName(hex, lang = "uz") {
  const norm = String(hex || "").toLowerCase();
  if (COLOR_NAMES[norm]) return COLOR_NAMES[norm][lang] || COLOR_NAMES[norm].uz;
  return hex || (lang === "ru" ? "Стандартный" : "Asosiy");
}

const SIZE_METRICS = {
  "2–3 yosh": { sizeUz: "92–98 sm", sizeRu: "92–98 см", ageUz: "2–3 yosh", ageRu: "2–3 года" },
  "3–4 yosh": { sizeUz: "98–104 sm", sizeRu: "98–104 см", ageUz: "3–4 yosh", ageRu: "3–4 года" },
  "4–5 yosh": { sizeUz: "104–110 sm", sizeRu: "104–110 см", ageUz: "4–5 yosh", ageRu: "4–5 лет" },
  "5–6 yosh": { sizeUz: "110–116 sm", sizeRu: "110–116 см", ageUz: "5–6 yosh", ageRu: "5–6 лет" },
  "7–8 yosh": { sizeUz: "122–128 sm", sizeRu: "122–128 см", ageUz: "7–8 yosh", ageRu: "7–8 лет" },
  "9–10 yosh": { sizeUz: "134–140 sm", sizeRu: "134–140 см", ageUz: "9–10 yosh", ageRu: "9–10 лет" }
};

function formatSize(rawSize, lang = "uz") {
  const clean = String(rawSize || "").trim();
  if (SIZE_METRICS[clean]) {
    const m = SIZE_METRICS[clean];
    const s = lang === "ru" ? m.sizeRu : m.sizeUz;
    const a = lang === "ru" ? m.ageRu : m.ageUz;
    return { size: s, age: a, fullLabel: `${s} · ${a}` };
  }
  const age = lang === "ru" ? clean.replace(/ yosh/g, " лет") : clean;
  return { size: clean, age, fullLabel: age };
}

const TEXT = {
  uz:{announcement:"Yangi kolleksiya — KIDS-SHOP 2026",details:"Batafsil",skip:"Asosiy tarkibga o‘tish",navNew:"Yangi kelganlar",navBoys:"O‘g‘il bolalar",navGirls:"Qiz bolalar",navAbout:"Biz haqimizda",heroEyebrow:"2026 YANGI MAVSUM",heroTitle:'Kichik qadamlar,<br /><em>katta</em> sarguzashtlar.',heroText:"Har kun uchun qulay, bolalik uchun esa unutilmas kiyimlar. Kichkintoyingiz erkin harakat qilsin, uslubi esa o‘ziga xos bo‘lsin.",shopNow:"Xaridni boshlash",ourStory:"Bizning hikoya",happyFamilies:"Yangi mavsumdagi kiyimlar",happyFamiliesSub:"Kichkintoyingiz uchun",benefit1:"Yumshoq matolar",benefit1sub:"Nozik teri uchun",benefit2:"Erkin harakat",benefit2sub:"Kun bo‘yi qulay",benefit3:"Sinovdan o‘tgan sifat",benefit3sub:"Ota-onalar tanlovi",benefit4:"Yorqin dizayn",benefit4sub:"Har kunga kayfiyat",collectionEyebrow:"KIDS-SHOP TANLOVI",collectionTitle:'Kichkintoylar uchun <em>topilmalar</em>',viewAll:"Barchasini ko‘rish",filterAll:"Barchasi",filterBoys:"O‘g‘il bolalar",filterGirls:"Qiz bolalar",filterSets:"To‘plamlar",filterSale:"Chegirma",searchPlaceholder:"Mahsulot qidirish",sortFeatured:"Tavsiya etilgan",sortLow:"Avval arzonlari",sortHigh:"Avval qimmatlari",addQuick:"Tanlash",age:"Yosh",soldOut:"Tugagan",emptyTitle:"Hech narsa topilmadi",emptyText:"Boshqa so‘z bilan qidirib ko‘ring.",resetFilters:"Filtrlarni tozalash",bannerEyebrow:"BOLALIK — ENG GO‘ZAL SARGUZASHT",bannerTitle:'Har bir kun —<br /><em>yangi hikoya.</em>',bannerText:"O‘ynashga, yugurishga, kashf qilishga tayyor kiyimlar. Bolalikning har lahzasi uchun KIDS-SHOP yoningizda.",findLook:"O‘z uslubini topish",storyEyebrow:"KICHKINA QUVONCHLAR",storyTitle:'Ular kichkina.<br />Orzulari <em>katta.</em>',storyText:"KIDS-SHOPda bolalar kiyimi faqat chiroyli ko‘rinish uchun emas. Har bir mato, har bir chok — qulaylik, sifat va mehr bilan tanlanadi. Chunki eng zo‘r uslub — o‘zini baxtli his qilish.",learnMore:"Bizni yaqindan tanishing",stat1:"yangi mavsum",stat2:"sayt tillari",stat3:"katalogdagi mahsulotlar",newsletterEyebrow:"KIDS CLUB",newsletterTitle:'Yaxshi yangiliklar,<br /><em>kichik qadamlar.</em>',newsletterText:"Yangi kolleksiya va yoqimli takliflardan birinchilardan bo‘lib xabardor bo‘ling.",phoneLabel:"Telefon raqamingiz",newsletterDisclaimer:"Obuna orqali maxfiylik siyosatimizga rozilik bildirasiz.",deliveryTitle:"O‘zbekiston bo‘ylab yetkazamiz",deliveryText:"Yetkazish muddati operator bilan kelishiladi",returnsTitle:"Almashuv qoidalari",returnsText:"Almashuv uchun operatorga murojaat qiling",supportTitle:"Sizga yordam beramiz",supportText:"Telegram orqali aloqa",footerText:"Kichiklar uchun katta qulaylik.<br />Bolalikni birga rang-barang qilamiz.",footerShop:"Do‘kon",footerNew:"Yangi kelganlar",footerBoys:"O‘g‘il bolalar",footerGirls:"Qiz bolalar",footerSale:"Chegirmalar",footerHelp:"Yordam",footerDelivery:"Yetkazib berish",footerReturns:"Almashtirish va qaytarish",footerSize:"O‘lcham jadvali",footerContact:"Aloqa",footerHours:"Telegram orqali aloqa",footerRights:"Mehr bilan, bolalik uchun.",privacy:"Maxfiylik siyosati",bag:"Savat",searchTitle:"Qidiruv",favoritesTitle:"Sevimlilar",emptyFavorites:"Sevimlilarga hali mahsulot qo‘shilmadi.",emptyCartTitle:"Savatingiz hozircha bo‘sh",emptyCartText:"Kichkintoyingizga yoqqan kiyimni tanlang.",continueShopping:"Xaridni davom ettirish",yourChoice:"SIZNING TANLOVINGIZ",cartTitle:"Savat",orderTotal:"Jami",checkout:"Buyurtmani rasmiylashtirish",deliveryNote:"Yetkazib berish narxi manzilga qarab aniqlanadi.",chooseSize:"O‘lcham va yoshni tanlang",chooseColor:"Rangni tanlang",colorLabel:"Rang",selectSizeError:"Iltimos, o‘lchamni tanlang.",productDetail:"MAHSULOT HAQIDA",addedToCart:"Mahsulot savatga qo‘shildi",removedFavorite:"Sevimlilardan olib tashlandi",addedFavorite:"Sevimlilarga qo‘shildi",checkoutTitle:"Buyurtma ma’lumotlari",name:"Ismingiz",phone:"Telefon raqamingiz",region:"Viloyat",district:"Shahar / tuman",address:"Yetkazib berish manzili",addressHint:"Ko‘cha, uy, xonadon",comment:"Izoh (ixtiyoriy)",payment:"To‘lov usuli",payCod:"Yetkazilganda to‘lash",payTransfer:"Karta orqali (operator tasdiqlaydi)",placeOrder:"Buyurtmani yuborish",backCart:"← Savatga qaytish",requiredError:"Iltimos, majburiy maydonlarni to‘ldiring.",networkError:"Buyurtmani yuborishda xatolik. Qayta urinib ko‘ring.",orderSuccess:"Buyurtmangiz qabul qilindi!",orderThanks:"Operatorimiz tez orada siz bilan bog‘lanadi. Buyurtma raqami:",close:"Yopish",orderReceipt:"Buyurtma",addedNewsletter:"Ishonchingiz uchun rahmat! Yangi kolleksiya va takliflardan birinchilardan bo‘lib xabardor bo‘lasiz.",newsletterSubmitError:"Obuna yuborilmadi. Iltimos, birozdan so‘ng qayta urinib ko‘ring.",newsletterError:"Telefon raqamini to‘g‘ri kiriting.",newLabel:"YANGI",hitLabel:"TOP",sizeLabel:"O‘lcham",qtyLabel:"Soni",searchNoResults:"Mos mahsulot topilmadi.",telegramHint:"Telegram Mini App’dan yuborilgan buyurtma ham guruh va operatorga xabar qiladi."},
  ru:{announcement:"Новая коллекция KIDS-SHOP 2026",details:"Подробнее",skip:"Перейти к содержимому",navNew:"Новинки",navBoys:"Для мальчиков",navGirls:"Для девочек",navAbout:"О нас",heroEyebrow:"НОВЫЙ СЕЗОН 2026",heroTitle:'Маленькие шаги,<br /><em>большие</em> приключения.',heroText:"Удобная одежда на каждый день и незабываемое детство. Пусть малышу будет свободно двигаться и легко быть собой.",shopNow:"Начать покупки",ourStory:"Наша история",happyFamilies:"Одежда нового сезона",happyFamiliesSub:"для вашего малыша",benefit1:"Мягкие ткани",benefit1sub:"Для нежной кожи",benefit2:"Свобода движений",benefit2sub:"Комфорт весь день",benefit3:"Проверенное качество",benefit3sub:"Выбор родителей",benefit4:"Яркий дизайн",benefit4sub:"Настроение каждый день",collectionEyebrow:"ВЫБОР KIDS-SHOP",collectionTitle:'Находки для <em>малышей</em>',viewAll:"Смотреть все",filterAll:"Все товары",filterBoys:"Для мальчиков",filterGirls:"Для девочек",filterSets:"Комплекты",filterSale:"Скидки",searchPlaceholder:"Поиск товаров",sortFeatured:"Рекомендуем",sortLow:"Сначала дешевле",sortHigh:"Сначала дороже",addQuick:"Выбрать",age:"Возраст",soldOut:"Нет в наличии",emptyTitle:"Ничего не найдено",emptyText:"Попробуйте другой запрос.",resetFilters:"Сбросить фильтры",bannerEyebrow:"ДЕТСТВО — ЛУЧШЕЕ ПРИКЛЮЧЕНИЕ",bannerTitle:'Каждый день —<br /><em>новая история.</em>',bannerText:"Одежда для игр, прогулок и открытий. KIDS-SHOP рядом в каждый момент детства.",findLook:"Найти свой стиль",storyEyebrow:"МАЛЕНЬКИЕ РАДОСТИ",storyTitle:'Они маленькие.<br />Их мечты <em>большие.</em>',storyText:"В KIDS-SHOP детская одежда — это не только красивый вид. Каждая ткань и каждый шов выбраны с заботой о комфорте и качестве. Ведь лучший стиль — чувствовать себя счастливым.",learnMore:"Узнать нас ближе",stat1:"новый сезон",stat2:"языка сайта",stat3:"товаров в каталоге",newsletterEyebrow:"KIDS CLUB",newsletterTitle:'Хорошие новости,<br /><em>маленькие шаги.</em>',newsletterText:"Узнавайте о новых коллекциях и приятных предложениях первыми.",phoneLabel:"Ваш номер телефона",newsletterDisclaimer:"Подписываясь, вы принимаете нашу политику конфиденциальности.",deliveryTitle:"Доставляем по всему Узбекистану",deliveryText:"Срок доставки уточнит оператор",returnsTitle:"Условия обмена",returnsText:"Для обмена напишите оператору",supportTitle:"Мы готовы помочь",supportText:"Связь через Telegram",footerText:"Большой комфорт для маленьких.<br />Раскрасим детство вместе.",footerShop:"Магазин",footerNew:"Новинки",footerBoys:"Для мальчиков",footerGirls:"Для девочек",footerSale:"Скидки",footerHelp:"Помощь",footerDelivery:"Доставка",footerReturns:"Обмен и возврат",footerSize:"Таблица размеров",footerContact:"Контакты",footerHours:"Связь через Telegram",footerRights:"С заботой о детстве.",privacy:"Политика конфиденциальности",bag:"Корзина",searchTitle:"Поиск",favoritesTitle:"Избранное",emptyFavorites:"Вы пока не добавили товары в избранное.",emptyCartTitle:"Ваша корзина пока пуста",emptyCartText:"Выберите одежду для вашего малыша.",continueShopping:"Продолжить покупки",yourChoice:"ВАШ ВЫБОР",cartTitle:"Корзина",orderTotal:"Итого",checkout:"Оформить заказ",deliveryNote:"Стоимость доставки зависит от адреса.",chooseSize:"Выберите размер и возраст",chooseColor:"Выберите цвет",colorLabel:"Цвет",selectSizeError:"Пожалуйста, выберите размер.",productDetail:"О ТОВАРЕ",addedToCart:"Товар добавлен в корзину",removedFavorite:"Удалено из избранного",addedFavorite:"Добавлено в избранное",checkoutTitle:"Данные заказа",name:"Ваше имя",phone:"Номер телефона",region:"Область",district:"Город / район",address:"Адрес доставки",addressHint:"Улица, дом, квартира",comment:"Комментарий (необязательно)",payment:"Способ оплаты",payCod:"Оплата при получении",payTransfer:"Картой (подтвердит оператор)",placeOrder:"Отправить заказ",backCart:"← Вернуться в корзину",requiredError:"Пожалуйста, заполните обязательные поля.",networkError:"Не удалось отправить заказ. Попробуйте снова.",orderSuccess:"Ваш заказ принят!",orderThanks:"Наш оператор скоро свяжется с вами. Номер заказа:",close:"Закрыть",orderReceipt:"Заказ",addedNewsletter:"Спасибо за доверие! Вы будете одними из первых узнавать о новых коллекциях и предложениях.",newsletterSubmitError:"Не удалось оформить подписку. Попробуйте ещё раз чуть позже.",newsletterError:"Введите корректный номер телефона.",newLabel:"НОВИНКА",hitLabel:"ХИТ",sizeLabel:"Размер",qtyLabel:"Кол-во",searchNoResults:"Подходящие товары не найдены.",telegramHint:"Заказ из Telegram Mini App также отправит уведомление в группу и оператору."}
};

function resolveStoreSlug() {
  const tgParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (tgParam && typeof tgParam === "string" && tgParam.trim()) return tgParam.trim().toLowerCase();
  const urlParam = new URLSearchParams(window.location.search).get("store");
  if (urlParam && urlParam.trim()) return urlParam.trim().toLowerCase();
  const host = window.location.hostname.toLowerCase();
  if (host && !["localhost", "127.0.0.1"].includes(host)) {
    const parts = host.split(".");
    if (parts.length >= 3 && parts[0] !== "www" && !host.endsWith(".vercel.app")) return parts[0];
  }
  return "kids-shop";
}
const currentStoreSlug = resolveStoreSlug();

function readArray(key){try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[]}catch{return []}}
const storedCart=readArray("kids-cart");
const state={
  lang:localStorage.getItem("kids-lang")==="ru"?"ru":"uz",
  filter:"all",
  search:"",
  sort:"featured",
  cart:storedCart.filter(row=>row&&typeof row.id==="string"&&typeof row.size==="string"&&Number.isInteger(Number(row.qty))&&Number(row.qty)>0&&Number(row.qty)<=99).map(row=>({id:row.id,size:row.size,color:String(row.color||""),qty:Number(row.qty)})),
  favorites:readArray("kids-favorites").filter(id=>typeof id==="string"&&id.length<=80),
  view:"cart",
  selectedProduct:null,
  selectedSize:"",
  selectedColor:"",
  drawerOpen:false
};

const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
const t=(key)=>TEXT[state.lang][key]||TEXT.uz[key]||key;
const ageLabel=(value)=>state.lang==="ru"?String(value).replace(/ yosh/g," лет"):value;
const money=(n)=>`${new Intl.NumberFormat(state.lang==="ru"?"ru-RU":"uz-UZ").format(n)} so‘m`;

function persist(){
  localStorage.setItem("kids-cart",JSON.stringify(state.cart));
  localStorage.setItem("kids-favorites",JSON.stringify(state.favorites));
  $("#cartCount").textContent=state.cart.reduce((n,x)=>n+x.qty,0);
  $("#favoriteCount").textContent=state.favorites.length;
}

function setLanguage(lang){
  state.lang=lang;
  localStorage.setItem("kids-lang",lang);
  document.documentElement.lang=lang;
  $("#languageToggle").innerHTML=lang.toUpperCase()+" <span>⌄</span>";
  $$('[data-i18n]').forEach(el=>{
    const val=t(el.dataset.i18n);
    if(val.includes("<"))el.innerHTML=val;
    else el.textContent=val;
  });
  $("#searchInput").placeholder=t("searchPlaceholder");
  renderProducts();
  if(state.drawerOpen)renderDrawer();
}

function visibleProducts(){
  let list=PRODUCTS.filter(p=>state.filter==="all"||(state.filter==="sale"?!!p.oldPrice:state.filter==="sets"?p.type==="sets":p.category===state.filter));
  if(state.search){
    const q=state.search.toLocaleLowerCase();
    list=list.filter(p=>(p.name[state.lang]+" "+p.tagline[state.lang]).toLocaleLowerCase().includes(q));
  }
  if(state.sort==="price-asc")list.sort((a,b)=>a.price-b.price);
  if(state.sort==="price-desc")list.sort((a,b)=>b.price-a.price);
  return list;
}

function productCard(p){
  const favorite=state.favorites.includes(p.id);
  return `<article class="product-card" data-product="${esc(p.id)}">
    <div class="product-image-wrap">
      <img src="${safeImage(p.image)}" alt="${esc(p.name[state.lang])} — ${esc(p.tagline[state.lang])}" loading="lazy" decoding="async" />
      <span class="product-badge ${p.oldPrice?'sale':''}">${esc(p.badge)}</span>
      <button class="favorite-button" data-action="favorite" data-id="${esc(p.id)}" aria-label="${favorite?t('removedFavorite'):t('addedFavorite')}" aria-pressed="${favorite}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 8.7c0 5-8.5 10-8.5 10s-8.5-5-8.5-10a4.5 4.5 0 0 1 8.5-2 4.5 4.5 0 0 1 8.5 2Z"/></svg>
      </button>
      <button class="add-quick" data-action="select" data-id="${esc(p.id)}">${p.stock<=0?t("soldOut"):t("addQuick")}</button>
    </div>
    <div class="product-meta">
      <span class="product-name">${esc(p.name[state.lang])}</span>
      <span class="product-price">${money(p.price)}${p.oldPrice?`<s>${money(p.oldPrice)}</s>`:""}</span>
      <span class="product-colors" aria-label="${p.colors.length} colors">
        ${p.colors.map(c=>`<i class="swatch" style="background:${safeColor(c)}" title="${esc(getColorName(c, state.lang))}"></i>`).join("")}
      </span>
      <span class="product-age">${esc(ageLabel(p.age))}</span>
      <span class="product-tagline">${esc(p.tagline[state.lang])}</span>
    </div>
  </article>`;
}

function renderProducts(){
  $("#productTotal").textContent=String(PRODUCTS.length).padStart(2,"0");
  const products=visibleProducts();
  $("#productGrid").innerHTML=products.map(productCard).join("");
  $("#productGrid").classList.toggle("hidden",!products.length);
  $("#emptyState").classList.toggle("hidden",!!products.length);
}

function openDrawer(view="cart"){
  state.view=view;
  state.drawerOpen=true;
  $("#overlay").classList.remove("hidden");
  $("#overlay").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  renderDrawer();
  $("#closeDrawer").focus();
}

function closeDrawer(){
  state.drawerOpen=false;
  $("#overlay").classList.add("hidden");
  $("#overlay").setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}

function renderDrawer(){
  let title=state.view==="favorites"?t("favoritesTitle"):state.view==="checkout"?t("checkoutTitle"):state.view==="product"?(state.selectedProduct?.name[state.lang]||t("productDetail")):t("cartTitle");
  $("#drawerTitle").textContent=title;
  $("#drawerEyebrow").textContent=state.view==="product"?t("productDetail"):t("yourChoice");
  let content=$("#drawerContent"),foot=$("#drawerFoot");

  if(state.view==="checkout"){
    renderCheckout(content,foot);
    return;
  }

  if(state.view==="product"&&state.selectedProduct){
    const p=state.selectedProduct;
    if(!state.selectedSize&&p.sizes&&p.sizes.length) state.selectedSize=p.sizes[0];
    if(!state.selectedColor&&p.colors&&p.colors.length) state.selectedColor=p.colors[0];

    const curSizeInfo=state.selectedSize?formatSize(state.selectedSize,state.lang):null;
    const curColorName=state.selectedColor?getColorName(state.selectedColor,state.lang):"";

    content.innerHTML=`
      <img src="${safeImage(p.image)}" alt="${esc(p.name[state.lang])}" decoding="async" style="height:min(38vh,310px);width:100%;object-fit:cover;border-radius:14px"/>
      <p style="font-size:12px;color:#83867e;line-height:1.6;margin:10px 0 8px">${esc(p.tagline[state.lang])}</p>
      <div class="checkout-summary" style="margin-bottom:12px">
        <span>${esc(p.name[state.lang])}</span>
        <b>${money(p.price)}</b>
      </div>

      <!-- RANGNI TANLASH -->
      <div class="product-option-section">
        <div class="option-header">
          <span class="option-title">${t("chooseColor")}</span>
          <span class="option-selected-name" id="selectedColorName">${esc(curColorName)}</span>
        </div>
        <div class="color-options" role="radiogroup" aria-label="${t('chooseColor')}">
          ${(p.colors||[]).map(c=>`
            <button type="button" class="color-chip ${state.selectedColor===c?'selected':''}" data-color="${esc(c)}" aria-pressed="${state.selectedColor===c}">
              <i class="color-circle" style="background:${safeColor(c)}"></i>
              <span class="color-chip-name">${esc(getColorName(c,state.lang))}</span>
              ${state.selectedColor===c?'<span class="color-check">✓</span>':''}
            </button>
          `).join("")}
        </div>
      </div>

      <!-- O'LCHAM VA YOSHNI TANLASH -->
      <div class="product-option-section" style="margin-top:14px">
        <div class="option-header">
          <span class="option-title">${t("chooseSize")}</span>
          <span class="option-selected-name" id="selectedSizeName">${esc(curSizeInfo?curSizeInfo.fullLabel:"")}</span>
        </div>
        <div class="size-options">
          ${(p.sizes||[]).map(s=>{
            const info=formatSize(s,state.lang);
            const isSel=state.selectedSize===s;
            return `
              <button type="button" class="size-chip ${isSel?'selected':''}" data-size="${esc(s)}" aria-pressed="${isSel}" ${p.stock<=0?"disabled":""}>
                <span class="size-val">${esc(info.size)}</span>
                <span class="size-sub">${esc(info.age)}</span>
              </button>
            `;
          }).join("")}
        </div>
        <p class="checkout-error" id="sizeError"></p>
      </div>
    `;

    foot.innerHTML=p.stock<=0
      ?`<button class="button button-dark checkout-button" disabled>${t("soldOut")}</button>`
      :`<button class="button button-dark checkout-button" id="confirmAdd">${state.lang==='uz'?'Savatga qo‘shish':'Добавить в корзину'} · ${money(p.price)}</button>`;
    return;
  }

  if(state.view==="favorites"){
    const list=PRODUCTS.filter(p=>state.favorites.includes(p.id));
    if(!list.length){
      content.innerHTML=`<div class="empty-cart"><span>♡</span><b>${t("favoritesTitle")}</b><p>${t("emptyFavorites")}</p></div>`;
      foot.innerHTML=`<button class="button button-dark checkout-button" id="continueShopping">${t("continueShopping")}</button>`;
    }else{
      content.innerHTML=list.map(p=>cartLine(p,1,true)).join("");
      foot.innerHTML=`<button class="button button-outline checkout-button" id="continueShopping">${t("continueShopping")}</button>`;
    }
    return;
  }

  if(!state.cart.length){
    content.innerHTML=`<div class="empty-cart"><span>✳</span><b>${t("emptyCartTitle")}</b><p>${t("emptyCartText")}</p></div>`;
    foot.innerHTML=`<button class="button button-dark checkout-button" id="continueShopping">${t("continueShopping")}</button>`;
    return;
  }

  content.innerHTML=state.cart.map(row=>{
    const p=PRODUCTS.find(x=>x.id===row.id);
    return p?cartLine(p,row.qty,false,row.size,row.color):"";
  }).join("");

  const total=state.cart.reduce((sum,row)=>sum+(PRODUCTS.find(p=>p.id===row.id)?.price||0)*row.qty,0);
  foot.innerHTML=`
    <div class="subtotal-row"><span>${t("orderTotal")}</span><span>${money(total)}</span></div>
    <button class="button button-dark checkout-button" id="goCheckout">${t("checkout")} <span>→</span></button>
    <p class="checkout-note">${t("deliveryNote")}</p>
  `;
}

function cartLine(p,qty,favorite=false,size="",color=""){
  const sizeInfo=formatSize(size||(p.sizes&&p.sizes[0])||"",state.lang);
  const colorName=color?getColorName(color,state.lang):"";
  const metaDetail=favorite
    ?esc(ageLabel(p.age))
    :`${t("sizeLabel")}: <b>${esc(sizeInfo.fullLabel)}</b>${color?` · ${t("colorLabel")}: <i class="swatch-inline" style="background:${safeColor(color)}"></i> <b>${esc(colorName)}</b>`:""}`;

  return `<div class="cart-line">
    <img src="${safeImage(p.image)}" alt="" decoding="async"/>
    <div>
      <b>${esc(p.name[state.lang])}</b>
      <small>${metaDetail}</small>
      ${favorite
        ?`<button class="remove-line" data-action="favorite" data-id="${esc(p.id)}">${t("removedFavorite")}</button>`
        :`<div class="qty-control">
            <button data-action="qty" data-id="${esc(p.id)}" data-size="${esc(size)}" data-color="${esc(color)}" data-delta="-1" aria-label="−">−</button>
            <span>${qty}</span>
            <button data-action="qty" data-id="${esc(p.id)}" data-size="${esc(size)}" data-color="${esc(color)}" data-delta="1" aria-label="+">+</button>
            <button class="remove-line" data-action="remove" data-id="${esc(p.id)}" data-size="${esc(size)}" data-color="${esc(color)}">${state.lang==="uz"?"Olib tashlash":"Удалить"}</button>
          </div>`
      }
    </div>
    <span class="line-price">${money(p.price*qty)}</span>
  </div>`;
}

function renderCheckout(content,foot){
  const total=state.cart.reduce((sum,row)=>sum+(PRODUCTS.find(p=>p.id===row.id)?.price||0)*row.qty,0);
  const regions=state.lang==="uz"
    ?["Toshkent shahri","Toshkent viloyati","Andijon","Buxoro","Farg‘ona","Jizzax","Xorazm","Namangan","Navoiy","Qashqadaryo","Qoraqalpog‘iston","Samarqand","Sirdaryo","Surxondaryo"]
    :["г. Ташкент","Ташкентская область","Андижан","Бухара","Фергана","Джизак","Хорезм","Наманган","Навои","Кашкадарья","Каракалпакстан","Самарканд","Сырдарья","Сурхандарья"];

  content.innerHTML=`<form id="checkoutForm" class="checkout-form" novalidate>
    <h3>${t("checkoutTitle")}</h3>
    <label>${t("name")} *<input name="name" autocomplete="name" required minlength="2" /></label>
    <label>${t("phone")} *<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67" required minlength="9" /></label>
    <div class="field-row">
      <label>${t("region")} *<select name="region" required><option value="">—</option>${regions.map(r=>`<option>${r}</option>`).join("")}</select></label>
      <label>${t("district")} *<input name="district" required /></label>
    </div>
    <label>${t("address")} *<input name="address" placeholder="${t("addressHint")}" autocomplete="street-address" required /></label>
    <label>${t("comment")}<textarea name="comment" rows="2"></textarea></label>
    <p class="payment-note">${t("payCod")}</p>
    <p class="checkout-error" id="checkoutError" role="alert"></p>
    <div class="checkout-summary"><span>${t("orderTotal")}</span><b>${money(total)}</b></div>
    <button class="button button-dark checkout-button" type="submit">${t("placeOrder")} →</button>
  </form>`;
  foot.innerHTML=`<button class="back-cart" id="backToCart">${t("backCart")}</button><p class="checkout-note">${t("telegramHint")}</p>`;
}

function toast(message){
  const el=$("#toast");
  el.textContent=message;
  el.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove("visible"),2600);
}

function toggleFavorite(id){
  if(state.favorites.includes(id)){
    state.favorites=state.favorites.filter(x=>x!==id);
    toast(t("removedFavorite"));
  }else{
    state.favorites.push(id);
    toast(t("addedFavorite"));
  }
  persist();
  renderProducts();
  if(state.drawerOpen)renderDrawer();
}

function addItem(id,size,color){
  const current=PRODUCTS.find(p=>p.id===id);
  if(!current||current.stock<=0){
    toast(t("soldOut"));
    return;
  }
  if(!size){
    $("#sizeError").textContent=t("selectSizeError");
    return;
  }
  const chosenColor=color||(current.colors&&current.colors[0])||"";
  const item=state.cart.find(x=>x.id===id&&x.size===size&&(x.color||"")===(chosenColor||""));
  if(item)item.qty++;
  else state.cart.push({id,size,color:chosenColor,qty:1});
  persist();
  closeDrawer();
  renderProducts();
  toast(t("addedToCart"));
}

function showOrderSuccess(orderId){
  for(const row of state.cart){
    const p=PRODUCTS.find(x=>x.id===row.id);
    if(p)p.stock=Math.max(0,(p.stock||0)-row.qty);
  }
  renderProducts();
  const thanks=orderId.startsWith("LOCAL-")
    ?(state.lang==="uz"?"Demo buyurtma faqat shu brauzerda saqlandi. Telegramga yuborilmadi.":"Демо-заказ сохранён только в этом браузере. В Telegram не отправлен.")
    :t("orderThanks");
  $("#drawerTitle").textContent=t("orderSuccess");
  $("#drawerEyebrow").textContent=t("orderReceipt");
  $("#drawerContent").innerHTML=`<div class="success-card"><span>✓</span><h3>${t("orderSuccess")}</h3><p>${thanks}<br /><b>${orderId}</b></p></div>`;
  $("#drawerFoot").innerHTML=`<button class="button button-dark checkout-button" id="finishOrder">${t("close")}</button>`;
  state.cart=[];
  persist();
}

async function submitOrder(form){
  const error=$("#checkoutError"),button=$('button[type="submit"]',form);
  error.textContent="";
  if(!form.reportValidity()){
    error.textContent=t("requiredError");
    return;
  }
  button.disabled=true;
  button.textContent=state.lang==="uz"?"Yuborilmoqda…":"Отправка…";
  const data=Object.fromEntries(new FormData(form).entries());
  const total=state.cart.reduce((sum,row)=>sum+(PRODUCTS.find(p=>p.id===row.id)?.price||0)*row.qty,0);
  const payload={
    storeId:currentStoreSlug,customer:{name:data.name,phone:data.phone,region:data.region,district:data.district,address:data.address,comment:data.comment||""},
    payment:"cod",
    lang:state.lang,
    currency:"UZS",
    items:state.cart.map(row=>{
      const p=PRODUCTS.find(x=>x.id===row.id);
      const colorName=getColorName(row.color,state.lang);
      const sizeInfo=formatSize(row.size,state.lang);
      return {
        productId:row.id,
        name:p.name[state.lang],
        size:row.size,
        sizeLabel:sizeInfo.fullLabel,
        color:row.color,
        colorName:colorName,
        qty:row.qty,
        unitPrice:p.price
      };
    }),
    total,
    telegramInitData:window.Telegram?.WebApp?.initData||""
  };

  try{
    const res=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    const result=await res.json();
    if(!res.ok)throw new Error(result.error||"order_failed");
    if(window.Telegram?.WebApp?.initData){
      try{window.Telegram.WebApp.sendData(JSON.stringify({orderId:result.orderId,total}));}catch{}
    }
    showOrderSuccess(result.orderId);
  }catch(err){
    if(["localhost","127.0.0.1"].includes(location.hostname)){
      const orderId=`LOCAL-${Date.now().toString().slice(-8)}`;
      const localOrders=JSON.parse(localStorage.getItem("kids-shop-local-orders")||"[]");
      localOrders.unshift({orderId,createdAt:new Date().toISOString(),...payload});
      localStorage.setItem("kids-shop-local-orders",JSON.stringify(localOrders));
      showOrderSuccess(orderId);
      return;
    }
    error.textContent=t("networkError");
    button.disabled=false;
    button.textContent=t("placeOrder")+" →";
  }
}

document.addEventListener("click",e=>{
  const action=e.target.closest("[data-action]");
  if(action){
    const {action:kind,id,size,color,delta}=action.dataset;
    if(kind==="favorite"){
      e.stopPropagation();
      toggleFavorite(id);
    }
    if(kind==="select"){
      state.selectedProduct=PRODUCTS.find(p=>p.id===id);
      state.selectedSize=(state.selectedProduct?.sizes&&state.selectedProduct.sizes[0])||"";
      state.selectedColor=(state.selectedProduct?.colors&&state.selectedProduct.colors[0])||"";
      openDrawer("product");
    }
    if(kind==="qty"){
      const row=state.cart.find(x=>x.id===id&&x.size===size&&(x.color||"")===(color||""));
      if(row){
        row.qty+=Number(delta);
        if(row.qty<1)state.cart=state.cart.filter(x=>x!==row);
        persist();
        renderDrawer();
      }
    }
    if(kind==="remove"){
      state.cart=state.cart.filter(x=>!(x.id===id&&x.size===size&&(x.color||"")===(color||"")));
      persist();
      renderDrawer();
    }
    return;
  }

  // Color Chip tanlash
  const colorButton=e.target.closest("[data-color]");
  if(colorButton&&state.selectedProduct){
    state.selectedColor=colorButton.dataset.color;
    $$(".color-chip").forEach(b=>{
      const isSel=b===colorButton;
      b.classList.toggle("selected",isSel);
      b.setAttribute("aria-pressed",String(isSel));
      const check=b.querySelector(".color-check");
      if(isSel&&!check){
        b.insertAdjacentHTML("beforeend",'<span class="color-check">✓</span>');
      }else if(!isSel&&check){
        check.remove();
      }
    });
    const colNameEl=$("#selectedColorName");
    if(colNameEl)colNameEl.textContent=getColorName(state.selectedColor,state.lang);
    return;
  }

  // Size Chip tanlash
  const sizeButton=e.target.closest("[data-size]");
  if(sizeButton){
    state.selectedSize=sizeButton.dataset.size;
    $$(".size-chip").forEach(b=>{
      const isSel=b===sizeButton;
      b.classList.toggle("selected",isSel);
      b.setAttribute("aria-pressed",String(isSel));
    });
    const sizeNameEl=$("#selectedSizeName");
    if(sizeNameEl)sizeNameEl.textContent=formatSize(state.selectedSize,state.lang).fullLabel;
    $("#sizeError").textContent="";
    return;
  }

  const filter=e.target.closest("[data-filter]");
  if(filter){
    state.filter=filter.dataset.filter;
    state.view="cart";
    $$(".filter-chip").forEach(b=>b.classList.toggle("active",b===filter));
    renderProducts();
    return;
  }
  if(e.target.closest("#openCart")){
    openDrawer("cart");
    return;
  }
  if(e.target.closest(".favorite-open")){
    state.view="favorites";
    openDrawer("favorites");
    return;
  }
  if(e.target.closest(".search-open")){
    document.querySelector("#catalog").scrollIntoView({behavior:"smooth"});
    setTimeout(()=>$("#searchInput").focus(),350);
    return;
  }
  if(e.target.closest("#closeDrawer")||e.target===$("#overlay")){
    closeDrawer();
    return;
  }
  if(e.target.closest("#continueShopping")){
    closeDrawer();
    $("#catalog").scrollIntoView({behavior:"smooth"});
    return;
  }
  if(e.target.closest("#goCheckout")){
    state.view="checkout";
    renderDrawer();
    return;
  }
  if(e.target.closest("#backToCart")){
    state.view="cart";
    renderDrawer();
    return;
  }
  if(e.target.closest("#confirmAdd")){
    addItem(state.selectedProduct.id,state.selectedSize,state.selectedColor);
    return;
  }
  if(e.target.closest("#finishOrder")){
    closeDrawer();
    return;
  }
  if(e.target.closest("#resetFilters")){
    state.filter="all";
    state.search="";
    $("#searchInput").value="";
    $$('.filter-chip').forEach(b=>b.classList.toggle("active",b.dataset.filter==="all"));
    renderProducts();
    return;
  }
  const card=e.target.closest(".product-card");
  if(card){
    state.selectedProduct=PRODUCTS.find(p=>p.id===card.dataset.product);
    state.selectedSize=(state.selectedProduct?.sizes&&state.selectedProduct.sizes[0])||"";
    state.selectedColor=(state.selectedProduct?.colors&&state.selectedProduct.colors[0])||"";
    openDrawer("product");
  }
});

document.addEventListener("submit",e=>{
  if(e.target.id==="checkoutForm"){
    e.preventDefault();
    submitOrder(e.target);
  }
  if(e.target.id==="newsletterForm"){
    e.preventDefault();
    const input=$("#newsletterPhone");
    const message=$("#newsletterMessage");
    if(input.value.replace(/\D/g,"").length<9){
      message.textContent=t("newsletterError");
      message.style.color="#bd433a";
      return;
    }
    const phone="+998"+input.value.replace(/\D/g,"").slice(-9);
    const button=$("button[type=submit]",e.target);
    button.disabled=true;
    fetch("/api/subscribe",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({phone,lang:state.lang,storeId:currentStoreSlug})
    }).then(async r=>{
      const data=await r.json();
      if(!r.ok)throw new Error(data.error||"subscribe_failed");
      message.textContent=t("addedNewsletter");
      message.style.color="#146d43";
      input.value="";
    }).catch(()=>{
      message.textContent=t("newsletterSubmitError");
      message.style.color="#bd433a";
    }).finally(()=>button.disabled=false);
  }
});

$("#languageToggle").addEventListener("click",()=>setLanguage(state.lang==="uz"?"ru":"uz"));
$("#searchInput").addEventListener("input",e=>{
  state.search=e.target.value;
  renderProducts();
});
$("#sortSelect").addEventListener("change",e=>{
  state.sort=e.target.value;
  renderProducts();
});
$("#overlay").addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&state.drawerOpen)closeDrawer();});

if(window.Telegram?.WebApp){
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

persist();
setLanguage(state.lang);
renderProducts();

fetch("/api/products?store=" + encodeURIComponent(currentStoreSlug)).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
  if(data&&data.store){
    if(data.store.name){
      document.title=data.store.name;
      const brandLogo=document.querySelector(".brand-name")||document.querySelector(".nav-logo");
      if(brandLogo)brandLogo.textContent=data.store.name;
    }
    if(data.store.theme_color){
      document.documentElement.style.setProperty("--color-brand",data.store.theme_color);
    }
  }
  if(Array.isArray(data.products)&&data.products.length){
    PRODUCTS.splice(0,PRODUCTS.length,...data.products);
    renderProducts();
  }
}).catch(()=>{});

function esc(value){
  return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
}
function safeImage(value){
  const url=String(value||"");
  if(/^\/images\/[A-Za-z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(url)){
    return url.replace(/\/(kids-fashion-campaign|look-adventure|look-safari)\.png$/i,"/$1.webp");
  }
  if(/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\/[a-f0-9-]+\.(?:webp|png|jpe?g)$/i.test(url))return url;
  return "/images/look-safari.webp";
}
function safeColor(value){
  return /^#[0-9a-f]{6}$/i.test(String(value))?value:"#e8e5db";
}
