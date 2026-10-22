import type { Locale } from "@/lib/locale";

const en = {
  dir: "ltr" as "ltr" | "rtl",
  meta: {
    title: "AGYAL · Egypt's bonds, T-bills and sukuk",
    description:
      "Invest in Egyptian government bonds, treasury bills and sukuk in EGP and USD, from your phone. Join the AGYAL waitlist.",
    ogTitle: "Invest in Egypt's bonds, T-bills and sukuk",
    ogSub: "In EGP and USD, from your phone. Join the waitlist.",
  },
  brand: "AGYAL",
  nav: {
    yields: "Yields",
    products: "Products",
    how: "How it works",
    partners: "Partners",
    join: "Join",
    switchTo: "عربي",
    switchLabel: "اقرأ بالعربية",
  },
  hero: {
    eyebrow: "Coming soon to Egypt",
    title1: "Egypt's bonds,",
    title2: "in your pocket.",
    sub: "Invest in Egyptian government bonds, treasury bills and sukuk in pounds and dollars, plus a hand-picked selection of high-grade corporate bonds. Join the waitlist for early access.",
    cta: "Join the waitlist",
    cta2: "For brokers & banks",
    phoneTitle: "Today's yields",
  },
  yields: {
    eyebrow: "Indicative yields",
    title: "See what fixed income pays",
    sub: "Recent yields on Egyptian government debt. T-bills pay everything at maturity; bonds pay coupons during the year.",
    currencies: { EGP: "Egyptian pound", USD: "US dollar", EUR: "Euro" },
    atMaturity: "Paid at maturity",
    coupons: (n: number) => (n === 1 ? "1 coupon a year" : `${n} coupons a year`),
    asOf: "As of",
    perYear: "a year",
    note: "Indicative annual yields, before taxes and fees. For information only. Not an offer or investment advice.",
    empty: "Rates will be published soon.",
  },
  products: {
    eyebrow: "What you'll be able to buy",
    title: "All of Egypt's fixed income, in one app",
    items: [
      { key: "tbills", t: "Treasury bills", d: "Short-term government debt from 3 to 12 months, in pounds and dollars." },
      { key: "bonds", t: "Government bonds", d: "Egyptian treasury bonds from 2 to 10 years, with regular coupons." },
      { key: "sukuk", t: "Sukuk", d: "Sharia-compliant government sukuk, in pounds and dollars." },
      { key: "eurobonds", t: "Eurobonds", d: "Egypt's international bonds, issued in US dollars and euros." },
      { key: "corporate", t: "Corporate bonds", d: "High-quality issuers only, screened before they reach the app." },
    ],
  },
  how: {
    eyebrow: "How it will work",
    title: "Three steps to your first bond",
    steps: [
      { t: "Join the waitlist", d: "Leave your name, email and mobile. It takes 30 seconds." },
      { t: "Get early access", d: "We'll invite you as soon as the app opens, before the public launch." },
      { t: "Invest from your phone", d: "Choose a bond, see what it pays and when, and invest through our licensed broker and bank partners." },
    ],
  },
  join: {
    eyebrow: "Early access",
    title: "Be first in line",
    sub: "Join the waitlist and we'll tell you the moment AGYAL opens.",
    name: "Full name",
    email: "Email",
    phone: "Mobile number",
    country: "Country code",
    submit: "Join the waitlist",
    submitting: "Joining…",
    or: "or",
    google: "Continue with Google",
    consent: "By joining you agree to our privacy policy. We'll only contact you about AGYAL.",
    sentTitle: "Check your inbox",
    sentBody: (email: string) => `We sent a confirmation link to ${email}. Tap it to secure your place.`,
    errors: {
      name: "Please enter your name.",
      email: "Please enter a valid email address.",
      phone: "Please enter a valid mobile number.",
      generic: "Something went wrong. Please try again.",
    },
  },
  partners: {
    eyebrow: "For institutions",
    title: "Brokers and banks, let's talk",
    sub: "We're partnering with licensed brokers, banks and asset managers to bring Egyptian fixed income to a new generation of investors. Tell us about your institution and we'll arrange a call.",
    institution: "Institution",
    type: "Type",
    types: { BROKER: "Broker", BANK: "Bank", ASSET_MANAGER: "Asset manager", OTHER: "Other" },
    name: "Your name",
    role: "Role (optional)",
    email: "Work email",
    phone: "Phone (optional)",
    message: "What would you like to discuss? (optional)",
    submit: "Request a call",
    submitting: "Sending…",
    sentTitle: "Thank you. We'll be in touch.",
    sentBody: "We've received your request and will reply within two working days.",
    pickTime: "Or pick a time now",
    errors: {
      institution: "Please enter your institution.",
      name: "Please enter your name.",
      email: "Please enter a valid email address.",
      generic: "Something went wrong. Please try again.",
    },
  },
  faq: {
    title: "Questions",
    items: [
      {
        q: "What is AGYAL?",
        a: "AGYAL (أجيال, \"generations\") is an app we're building so investors in Egypt and across the Arab world can buy Egyptian government bonds, T-bills, sukuk and high-grade corporate bonds from their phone.",
      },
      {
        q: "Is AGYAL open yet?",
        a: "Not yet. We're signing up partners and preparing the launch. Join the waitlist and you'll be among the first to get access.",
      },
      {
        q: "Are the yields on this page guaranteed?",
        a: "No. They are recent indicative yields, before taxes and fees, shown so you can see what Egyptian fixed income pays. The price you get will depend on the market when you invest.",
      },
      {
        q: "Who will hold my investments?",
        a: "AGYAL will work only with licensed brokers and banks in Egypt, who will hold the securities in your name. We'll share full details before launch.",
      },
      {
        q: "Do I need to live in Egypt?",
        a: "Eligibility will depend on our partners and on Egyptian regulations. Join the waitlist with your country code and we'll tell you what's available to you.",
      },
    ],
  },
  footer: {
    disclaimer:
      "AGYAL is in development. This website only collects interest for a waitlist. Nothing on it is an offer to sell, a solicitation to buy any security, or investment advice. Yields shown are indicative, before taxes and fees, and can change at any time.",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
    rights: "All rights reserved.",
  },
  verify: {
    okTitle: "You're on the list",
    okBody: "Your email is confirmed. Taking you to your invite link…",
    okCta: "Continue",
    badTitle: "This link has expired",
    badBody: "Join again with the same email and we'll send you a fresh link.",
    badCta: "Back to AGYAL",
  },
  welcome: {
    title: (name: string) => `You're on the list, ${name}.`,
    sub: "We'll email you as soon as AGYAL opens.",
    refTitle: "Invite your friends",
    refBody: "Share your personal link. Everyone who joins through it is counted here.",
    count: (n: number) => (n === 1 ? "1 friend joined" : `${n} friends joined`),
    copy: "Copy link",
    copied: "Copied",
    shareText:
      "I just joined the AGYAL waitlist: Egyptian bonds, T-bills and sukuk from your phone, in EGP and USD. Join me:",
    pending: "Confirm your email to activate your link. Check your inbox.",
  },
  complete: {
    title: "One last step",
    sub: "Add your mobile number so we can reach you at launch.",
    submit: "Finish",
  },
  legal: {
    back: "Back to AGYAL",
    privacyTitle: "Privacy policy",
    privacy: [
      "AGYAL (agyal.net) collects your name, email address and mobile number when you join the waitlist, and the details you send if you request a partner call. If you continue with Google, we receive your name and email from Google.",
      "We use this information only to manage the waitlist, confirm your email, tell you about AGYAL's launch, and reply to partnership requests. We record which link brought you here (for example a social media post or a friend's invite) to understand what works.",
      "We don't sell your data. It is stored with our hosting and email providers (Vercel, our database provider and Resend), who process it on our behalf.",
      "You can ask us to see, correct or delete your information at any time by emailing hello@agyal.net. Every email we send also lets you reply to unsubscribe.",
    ],
    termsTitle: "Terms of use",
    terms: [
      "This website introduces AGYAL, a fixed income investment app in development, and lets you join a waitlist. Joining does not open an account or create any obligation for you or for us.",
      "Nothing on this website is an offer to sell, a solicitation to buy any security, or investment, tax or legal advice. Yields are indicative, before taxes and fees, may be out of date, and are not a guarantee of future returns.",
      "Investment services will be provided only through licensed brokers and banks, under their own terms, once available.",
      "Questions: hello@agyal.net.",
    ],
  },
  emails: {
    verifySubject: "Confirm your place on the AGYAL waitlist",
    verifyBody: (name: string) =>
      `Hi ${name},\n\nThanks for joining the AGYAL waitlist. Please confirm your email to secure your place:`,
    verifyCta: "Confirm my email",
    verifyFoot: "This link is valid for 7 days. If you didn't sign up, you can ignore this email.",
    welcomeSubject: "You're on the AGYAL waitlist",
    welcomeBody: (name: string) =>
      `Hi ${name},\n\nYou're on the list. We'll email you as soon as AGYAL opens, so you can invest in Egyptian bonds, T-bills and sukuk from your phone.\n\nWant to bring friends along? Share your personal invite link:`,
    welcomeFoot: "AGYAL · agyal.net. Reply to this email to unsubscribe.",
  },
};

export type Dictionary = typeof en;

const ar: Dictionary = {
  dir: "rtl",
  meta: {
    title: "أجيال · سندات مصر وأذون الخزانة والصكوك",
    description:
      "استثمر في السندات الحكومية المصرية وأذون الخزانة والصكوك بالجنيه والدولار من هاتفك. انضم لقائمة انتظار أجيال.",
    ogTitle: "استثمر في سندات مصر وأذون الخزانة والصكوك",
    ogSub: "بالجنيه والدولار، من هاتفك. انضم لقائمة الانتظار.",
  },
  brand: "أجيال",
  nav: {
    yields: "العوائد",
    products: "المنتجات",
    how: "كيف يعمل",
    partners: "الشركاء",
    join: "انضم",
    switchTo: "EN",
    switchLabel: "Read in English",
  },
  hero: {
    eyebrow: "قريبًا في مصر",
    title1: "سندات مصر،",
    title2: "في جيبك.",
    sub: "استثمر في السندات الحكومية المصرية وأذون الخزانة والصكوك بالجنيه والدولار، ومجموعة مختارة من سندات الشركات عالية الجودة. انضم لقائمة الانتظار لتحصل على وصول مبكر.",
    cta: "انضم لقائمة الانتظار",
    cta2: "للوسطاء والبنوك",
    phoneTitle: "عوائد اليوم",
  },
  yields: {
    eyebrow: "عوائد استرشادية",
    title: "اعرف كم تعطيك أدوات الدخل الثابت",
    sub: "أحدث العوائد على أدوات الدين الحكومية المصرية. أذون الخزانة تُصرف كاملة عند الاستحقاق، والسندات تصرف كوبونات خلال السنة.",
    currencies: { EGP: "جنيه مصري", USD: "دولار أمريكي", EUR: "يورو" },
    atMaturity: "تُصرف عند الاستحقاق",
    coupons: (n: number) => (n === 1 ? "كوبون واحد في السنة" : n === 2 ? "كوبونان في السنة" : `${n} كوبونات في السنة`),
    asOf: "بتاريخ",
    perYear: "سنويًا",
    note: "عوائد سنوية استرشادية قبل الضرائب والرسوم. للعلم فقط، وليست عرضًا أو نصيحة استثمارية.",
    empty: "سننشر العوائد قريبًا.",
  },
  products: {
    eyebrow: "ما ستتمكن من شرائه",
    title: "كل أدوات الدخل الثابت المصرية في تطبيق واحد",
    items: [
      { key: "tbills", t: "أذون الخزانة", d: "دين حكومي قصير الأجل من 3 إلى 12 شهرًا، بالجنيه والدولار." },
      { key: "bonds", t: "السندات الحكومية", d: "سندات الخزانة المصرية من سنتين إلى 10 سنوات بكوبونات دورية." },
      { key: "sukuk", t: "الصكوك", d: "صكوك حكومية متوافقة مع الشريعة، بالجنيه والدولار." },
      { key: "eurobonds", t: "اليوروبوند", d: "سندات مصر الدولية المصدرة بالدولار الأمريكي واليورو." },
      { key: "corporate", t: "سندات الشركات", d: "مُصدرون عالِيو الجودة فقط، نراجعهم قبل وصولهم للتطبيق." },
    ],
  },
  how: {
    eyebrow: "كيف سيعمل",
    title: "ثلاث خطوات لأول سند لك",
    steps: [
      { t: "انضم لقائمة الانتظار", d: "اترك اسمك وبريدك ورقم موبايلك. يستغرق ذلك 30 ثانية." },
      { t: "احصل على وصول مبكر", d: "سندعوك فور افتتاح التطبيق وقبل الإطلاق العام." },
      { t: "استثمر من هاتفك", d: "اختر السند، واعرف عائده وموعد صرفه، واستثمر عبر شركائنا المرخّصين من الوسطاء والبنوك." },
    ],
  },
  join: {
    eyebrow: "وصول مبكر",
    title: "كن من الأوائل",
    sub: "انضم لقائمة الانتظار وسنخبرك لحظة افتتاح أجيال.",
    name: "الاسم بالكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الموبايل",
    country: "كود الدولة",
    submit: "انضم لقائمة الانتظار",
    submitting: "جارٍ الانضمام…",
    or: "أو",
    google: "المتابعة باستخدام Google",
    consent: "بانضمامك توافق على سياسة الخصوصية. لن نتواصل معك إلا بخصوص أجيال.",
    sentTitle: "تفقّد بريدك",
    sentBody: (email: string) => `أرسلنا رابط تأكيد إلى ${email}. اضغط عليه لتثبيت مكانك.`,
    errors: {
      name: "من فضلك اكتب اسمك.",
      email: "من فضلك اكتب بريدًا إلكترونيًا صحيحًا.",
      phone: "من فضلك اكتب رقم موبايل صحيحًا.",
      generic: "حدث خطأ ما. حاول مرة أخرى.",
    },
  },
  partners: {
    eyebrow: "للمؤسسات",
    title: "الوسطاء والبنوك، لنتحدث",
    sub: "نتعاون مع وسطاء وبنوك ومديري أصول مرخّصين لنقدّم الدخل الثابت المصري لجيل جديد من المستثمرين. أخبرنا عن مؤسستك وسنرتب مكالمة.",
    institution: "المؤسسة",
    type: "النوع",
    types: { BROKER: "شركة وساطة", BANK: "بنك", ASSET_MANAGER: "إدارة أصول", OTHER: "أخرى" },
    name: "اسمك",
    role: "المنصب (اختياري)",
    email: "البريد الإلكتروني للعمل",
    phone: "الهاتف (اختياري)",
    message: "ما الذي تودّ مناقشته؟ (اختياري)",
    submit: "اطلب مكالمة",
    submitting: "جارٍ الإرسال…",
    sentTitle: "شكرًا لك، سنتواصل معك قريبًا.",
    sentBody: "استلمنا طلبك وسنرد خلال يومَي عمل.",
    pickTime: "أو اختر موعدًا الآن",
    errors: {
      institution: "من فضلك اكتب اسم المؤسسة.",
      name: "من فضلك اكتب اسمك.",
      email: "من فضلك اكتب بريدًا إلكترونيًا صحيحًا.",
      generic: "حدث خطأ ما. حاول مرة أخرى.",
    },
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "ما هو أجيال؟",
        a: "أجيال تطبيق نعمل على بنائه ليتمكن المستثمرون في مصر والعالم العربي من شراء السندات الحكومية المصرية وأذون الخزانة والصكوك وسندات الشركات عالية الجودة من هواتفهم.",
      },
      {
        q: "هل افتُتح أجيال؟",
        a: "ليس بعد. نتعاقد مع الشركاء ونجهّز للإطلاق. انضم لقائمة الانتظار لتكون من أول من يحصل على الوصول.",
      },
      {
        q: "هل العوائد المعروضة مضمونة؟",
        a: "لا. هي عوائد استرشادية حديثة قبل الضرائب والرسوم، نعرضها لتعرف كم تعطي أدوات الدخل الثابت المصرية. السعر الفعلي يعتمد على السوق وقت الاستثمار.",
      },
      {
        q: "من سيحتفظ باستثماراتي؟",
        a: "سيعمل أجيال فقط مع وسطاء وبنوك مرخّصين في مصر، يحتفظون بالأوراق المالية باسمك. سنشارك التفاصيل كاملة قبل الإطلاق.",
      },
      {
        q: "هل يجب أن أكون مقيمًا في مصر؟",
        a: "تعتمد الأهلية على شركائنا وعلى اللوائح المصرية. انضم لقائمة الانتظار مع كود دولتك وسنخبرك بما هو متاح لك.",
      },
    ],
  },
  footer: {
    disclaimer:
      "أجيال قيد التطوير. يجمع هذا الموقع الاهتمام لقائمة انتظار فقط، ولا يُعد أي محتوى فيه عرضًا للبيع أو دعوة لشراء أي ورقة مالية أو نصيحة استثمارية. العوائد المعروضة استرشادية قبل الضرائب والرسوم وقابلة للتغيّر في أي وقت.",
    privacy: "الخصوصية",
    terms: "الشروط",
    contact: "تواصل معنا",
    rights: "جميع الحقوق محفوظة.",
  },
  verify: {
    okTitle: "أنت الآن في القائمة",
    okBody: "تم تأكيد بريدك. ننقلك إلى رابط الدعوة الخاص بك…",
    okCta: "متابعة",
    badTitle: "انتهت صلاحية هذا الرابط",
    badBody: "انضم مرة أخرى بنفس البريد وسنرسل لك رابطًا جديدًا.",
    badCta: "العودة إلى أجيال",
  },
  welcome: {
    title: (name: string) => `أنت في القائمة يا ${name}.`,
    sub: "سنراسلك فور افتتاح أجيال.",
    refTitle: "ادعُ أصدقاءك",
    refBody: "شارك رابطك الخاص. كل من ينضم من خلاله يُحتسب هنا.",
    count: (n: number) => (n === 1 ? "انضم صديق واحد" : n === 2 ? "انضم صديقان" : `انضم ${n} أصدقاء`),
    copy: "نسخ الرابط",
    copied: "تم النسخ",
    shareText:
      "انضممت لقائمة انتظار أجيال: سندات مصر وأذون الخزانة والصكوك من هاتفك، بالجنيه والدولار. انضم معي:",
    pending: "أكّد بريدك لتفعيل رابطك. تفقّد صندوق الوارد.",
  },
  complete: {
    title: "خطوة أخيرة",
    sub: "أضف رقم موبايلك لنتواصل معك عند الإطلاق.",
    submit: "إنهاء",
  },
  legal: {
    back: "العودة إلى أجيال",
    privacyTitle: "سياسة الخصوصية",
    privacy: [
      "يجمع أجيال (agyal.net) اسمك وبريدك الإلكتروني ورقم موبايلك عند انضمامك لقائمة الانتظار، والبيانات التي ترسلها عند طلب مكالمة شراكة. إذا تابعت باستخدام Google نستلم اسمك وبريدك من Google.",
      "نستخدم هذه البيانات فقط لإدارة قائمة الانتظار وتأكيد بريدك وإبلاغك بإطلاق أجيال والرد على طلبات الشراكة. ونسجّل الرابط الذي أوصلك إلينا (مثل منشور على وسائل التواصل أو دعوة من صديق) لنعرف ما ينجح.",
      "لا نبيع بياناتك. تُحفظ لدى مزوّدي الاستضافة والبريد (Vercel ومزوّد قاعدة البيانات وResend) الذين يعالجونها نيابةً عنا.",
      "يمكنك أن تطلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت بمراسلة hello@agyal.net، ويمكنك الرد على أي رسالة منا لإلغاء الاشتراك.",
    ],
    termsTitle: "شروط الاستخدام",
    terms: [
      "يعرّف هذا الموقع بأجيال، وهو تطبيق للاستثمار في الدخل الثابت قيد التطوير، ويتيح لك الانضمام لقائمة انتظار. الانضمام لا يفتح حسابًا ولا يُنشئ أي التزام عليك أو علينا.",
      "لا يُعد أي محتوى في هذا الموقع عرضًا للبيع أو دعوة لشراء أي ورقة مالية أو نصيحة استثمارية أو ضريبية أو قانونية. العوائد استرشادية قبل الضرائب والرسوم، وقد لا تكون محدّثة، ولا تضمن العوائد المستقبلية.",
      "ستُقدَّم خدمات الاستثمار فقط من خلال وسطاء وبنوك مرخّصين وفق شروطهم الخاصة عند توفرها.",
      "للاستفسارات: hello@agyal.net.",
    ],
  },
  emails: {
    verifySubject: "أكّد مكانك في قائمة انتظار أجيال",
    verifyBody: (name: string) =>
      `أهلًا ${name}،\n\nشكرًا لانضمامك لقائمة انتظار أجيال. من فضلك أكّد بريدك لتثبيت مكانك:`,
    verifyCta: "تأكيد بريدي",
    verifyFoot: "الرابط صالح لمدة 7 أيام. إذا لم تقم بالتسجيل، تجاهل هذه الرسالة.",
    welcomeSubject: "أنت الآن في قائمة انتظار أجيال",
    welcomeBody: (name: string) =>
      `أهلًا ${name}،\n\nأنت الآن في القائمة. سنراسلك فور افتتاح أجيال لتستثمر في السندات المصرية وأذون الخزانة والصكوك من هاتفك.\n\nتحب تدعو أصدقاءك؟ شارك رابط الدعوة الخاص بك:`,
    welcomeFoot: "أجيال · agyal.net. رُد على هذه الرسالة لإلغاء الاشتراك.",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
