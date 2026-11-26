// Landing page copy for English, Hindi and Gujarati. Each language is a real,
// server-rendered page (/, /hi, /gu) so search engines index it.
import { ESTATE_PLAN, FREE_PLAN, PORTFOLIO_PLAN } from "@/lib/plans";

export type LandingLocale = "en" | "hi" | "gu";

export type LandingCopy = {
  htmlLang: string;
  meta: { title: string; description: string };
  nav: { features: string; how: string; pricing: string; faq: string; signIn: string; startFree: string; skip: string };
  hero: { eyebrow: string; line1: string; line2: string; subtitle: string; cta: string; bullets: [string, string, string] };
  capabilities: [{ value: string; label: string }, { value: string; label: string }, { value: string; label: string }];
  features: { eyebrow: string; title: string; desc: string; items: { title: string; desc: string }[] };
  mockCollect: { title: string; sub: string; header: string; paid: string; due: string; overdue: string; remind: string };
  mockBill: { title: string; sub: string; rent: string; electricity: string; total: string; pay: string; scan: string };
  reasons: { title: string; items: { title: string; desc: string }[] };
  pricing: {
    eyebrow: string;
    title: string;
    desc: string;
    free: { label: string; per: string; desc: string; features: string[]; cta: string };
    portfolio: { label: string; per: string; yearly: string; desc: string; features: string[]; cta: string };
    estate: { label: string; per: string; desc: string; features: string[]; cta: string };
    note: string;
  };
  faqSection: { eyebrow: string; title: string; desc: string; ready: string };
  faqs: { question: string; answer: string }[];
  cta: { title: string; sub: string; bullets: [string, string, string]; privacy: string };
  footer: { blurb: string; product: string; account: string; rentSoftware: string; rentTracking: string; copyright: string; built: string };
};

const en: LandingCopy = {
  htmlLang: "en-IN",
  meta: {
    title: "Rent Management Software for Landlords in India",
    description:
      "Track rent, send WhatsApp reminders with a UPI pay link, and share GST and TDS-ready bills and rent receipts. Free for your first rental.",
  },
  nav: { features: "Features", how: "How it works", pricing: "Pricing", faq: "FAQ", signIn: "Sign in", startFree: "Start free", skip: "Skip to content" },
  hero: {
    eyebrow: "For independent landlords",
    line1: "Rent management,",
    line2: "without the runaround.",
    subtitle:
      "See who has paid, remind the rest on WhatsApp in one tap, and let tenants pay by UPI. Bills, GST, TDS, electricity and rent receipts are handled for you.",
    cta: "Start for free",
    bullets: ["Free for your first rental", "Import from Excel", "Money goes straight to your bank"],
  },
  capabilities: [
    { value: "WhatsApp + UPI", label: "Remind and get paid faster" },
    { value: "GST + TDS", label: "Compliant billing, out of the box" },
    { value: "Rent receipts", label: "Ready for your tenants' HRA" },
  ],
  features: {
    eyebrow: "From bill to payment",
    title: "One place for the entire rent cycle.",
    desc: "Bills are created every month on their own. You tap Remind, the tenant pays by UPI, you tap Paid, and their receipt goes out.",
    items: [
      { title: "WhatsApp reminders in one tap", desc: "WhatsApp opens with the amount, due date and bill link ready to send. Remind everyone who is late in under a minute." },
      { title: "UPI QR on every bill", desc: "Add your UPI ID once. Every bill shows a QR code and a Pay now button, and the money goes straight to your account." },
      { title: "Rent receipts for HRA", desc: "Record a payment and send a receipt with your PAN and the amount in words, ready for your tenant's HRA claim." },
      { title: "GST & TDS-ready invoicing", desc: "Set GST and TDS per tenant and every rent bill applies them automatically. No manual maths, no surprises." },
      { title: "Submeter electricity billing", desc: "Log a meter reading and get an exact electricity charge for that unit, on its own bill." },
      { title: "Set up from Excel", desc: "Paste your rent register from Excel or Google Sheets, or type 101-110 to add a whole floor of rooms at once." },
    ],
  },
  mockCollect: { title: "Who has paid, who hasn't", sub: "The first thing you see every morning.", header: "Collect rent", paid: "PAID", due: "DUE", overdue: "LATE", remind: "Remind" },
  mockBill: { title: "A bill tenants can pay", sub: "Opens from WhatsApp in any browser. No app to install.", rent: "Rent", electricity: "Electricity (submeter)", total: "Amount due", pay: "Pay now", scan: "Scan with any UPI app" },
  reasons: {
    title: "No more chasing rent by memory.",
    items: [
      { title: "No more spreadsheet maths", desc: "GST, TDS and submeter electricity calculate themselves, correctly, every month." },
      { title: "Nothing falls through", desc: "Your home screen lists who is late, and a morning email tells you who to remind." },
      { title: "One place for every property", desc: "Properties, units, tenants, bills and payments, all connected in one calm dashboard." },
    ],
  },
  pricing: {
    eyebrow: "Simple pricing",
    title: "Start with one door. Grow when you need to.",
    desc: "No setup fees or contracts. Your records stay safe if you change plans.",
    free: {
      label: "For your first rental",
      per: "forever",
      desc: "Everything you need for one small property.",
      features: [`${FREE_PLAN.propertyLimit} property`, `Up to ${FREE_PLAN.unitLimit} units`, "WhatsApp reminders and UPI bills", "GST, TDS and electricity billing", "Rent receipts"],
      cta: "Start for free",
    },
    portfolio: {
      label: "For growing landlords",
      per: "/ month",
      yearly: `or ₹${PORTFOLIO_PLAN.yearlyPrice} a year`,
      desc: "Room for a few buildings and their tenants.",
      features: [`Up to ${PORTFOLIO_PLAN.propertyLimit} properties`, `Up to ${PORTFOLIO_PLAN.unitLimit} units`, `Everything in ${FREE_PLAN.name}`, "CSV exports"],
      cta: "Sign in to upgrade",
    },
    estate: {
      label: "For PGs, hostels and bigger buildings",
      per: "/ month",
      desc: "When you have more rooms than most.",
      features: [`Up to ${ESTATE_PLAN.propertyLimit} properties`, `Up to ${ESTATE_PLAN.unitLimit} units or beds`, `Everything in ${PORTFOLIO_PLAN.name}`],
      cta: "Sign in to upgrade",
    },
    note: "No GST charged. Prices are final. Secure recurring billing by Razorpay; cancel anytime.",
  },
  faqSection: {
    eyebrow: "Good to know",
    title: "The details, without the fine print.",
    desc: "Straight answers about reminders, payments, bills and privacy.",
    ready: "Ready to see it with your own properties and tenants?",
  },
  faqs: [
    { question: "Do my tenants need to install anything?", answer: "No. Tenants get a WhatsApp message with a link to their bill. It opens in any browser and shows a UPI QR code and a Pay now button. Their receipt is a link too." },
    { question: "Does Bhadaa collect the rent money?", answer: "No. Tenants pay straight to your UPI ID, so the money lands in your own bank account. You tap Mark paid when it arrives." },
    { question: "Does it handle GST and TDS on rent bills?", answer: "Yes. Turn on GST and/or TDS per tenant with the rate you need, and every rent bill applies the right amounts automatically." },
    { question: "Can my tenants get rent receipts for HRA?", answer: "Yes. Every payment you record has a rent receipt with your name, PAN, the property address and the amount in words. Send it on WhatsApp in one tap." },
    { question: "How does submeter electricity billing work?", answer: "Log the meter reading each month and Bhadaa works out the units used and the charge for that tenant." },
    { question: "Is there GST on the plans?", answer: "No. Bhadaa is not GST registered, so the prices you see are the prices you pay." },
  ],
  cta: {
    title: "Stop tracking rent in your head.",
    sub: "Set up your first property in under 3 minutes, or paste it from Excel.",
    bullets: ["WhatsApp reminders", "UPI pay links", "Rent receipts"],
    privacy: "Your data stays private, scoped to your account alone.",
  },
  footer: {
    blurb: "Rent tracking, WhatsApp reminders, UPI bills and rent receipts for independent landlords.",
    product: "Product",
    account: "Account",
    rentSoftware: "Rent management software",
    rentTracking: "Rent tracking software",
    copyright: "© 2026 Bhadaa. Rent, without the runaround.",
    built: "Built for independent landlords.",
  },
};

const hi: LandingCopy = {
  htmlLang: "hi-IN",
  meta: {
    title: "मकान मालिकों के लिए किराया प्रबंधन ऐप",
    description:
      "किराये का हिसाब रखें, WhatsApp पर UPI पेमेंट लिंक के साथ रिमाइंडर भेजें, और GST-TDS वाले बिल और किराया रसीद साझा करें। पहली प्रॉपर्टी के लिए मुफ़्त।",
  },
  nav: { features: "विशेषताएँ", how: "कैसे काम करता है", pricing: "कीमत", faq: "सवाल-जवाब", signIn: "साइन इन", startFree: "मुफ़्त शुरू करें", skip: "मुख्य सामग्री पर जाएँ" },
  hero: {
    eyebrow: "मकान मालिकों के लिए",
    line1: "किराया वसूली,",
    line2: "बिना किसी झंझट के।",
    subtitle:
      "देखें किसने किराया दिया, बाकी लोगों को एक टैप में WhatsApp पर याद दिलाएँ, और किरायेदार UPI से भुगतान करें। बिल, GST, TDS, बिजली और किराया रसीद सब अपने आप।",
    cta: "मुफ़्त शुरू करें",
    bullets: ["पहली प्रॉपर्टी के लिए मुफ़्त", "Excel से इम्पोर्ट करें", "पैसा सीधे आपके बैंक में"],
  },
  capabilities: [
    { value: "WhatsApp + UPI", label: "जल्दी याद दिलाएँ, जल्दी भुगतान पाएँ" },
    { value: "GST + TDS", label: "नियमों के अनुसार बिलिंग" },
    { value: "किराया रसीद", label: "किरायेदार के HRA के लिए तैयार" },
  ],
  features: {
    eyebrow: "बिल से भुगतान तक",
    title: "किराये का पूरा काम, एक ही जगह।",
    desc: "हर महीने बिल अपने आप बनते हैं। आप रिमाइंडर भेजें, किरायेदार UPI से भुगतान करे, आप ‘भुगतान हुआ’ दबाएँ और रसीद चली जाए।",
    items: [
      { title: "एक टैप में WhatsApp रिमाइंडर", desc: "राशि, देय तारीख और बिल का लिंक लिखा हुआ WhatsApp खुलता है। एक मिनट में सभी बकायादारों को याद दिलाएँ।" },
      { title: "हर बिल पर UPI QR", desc: "एक बार अपनी UPI ID डालें। हर बिल पर QR कोड और ‘अभी भुगतान करें’ बटन होगा, और पैसा सीधे आपके खाते में आएगा।" },
      { title: "HRA के लिए किराया रसीद", desc: "भुगतान दर्ज करें और आपके PAN व शब्दों में राशि वाली रसीद भेजें, किरायेदार के HRA क्लेम के लिए तैयार।" },
      { title: "GST और TDS वाले बिल", desc: "हर किरायेदार के लिए GST और TDS सेट करें, हर बिल में अपने आप जुड़ जाएगा। कोई हिसाब-किताब नहीं।" },
      { title: "सबमीटर बिजली बिल", desc: "मीटर रीडिंग डालें और उस यूनिट का सही बिजली बिल अपने आप बन जाएगा।" },
      { title: "Excel से सेटअप", desc: "अपना किराया रजिस्टर Excel या Google Sheets से पेस्ट करें, या 101-110 लिखकर पूरी मंज़िल के कमरे एक साथ जोड़ें।" },
    ],
  },
  mockCollect: { title: "किसने दिया, किसने नहीं", sub: "हर सुबह सबसे पहले यही दिखता है।", header: "किराया वसूली", paid: "भुगतान हुआ", due: "देय", overdue: "बकाया", remind: "याद दिलाएँ" },
  mockBill: { title: "ऐसा बिल जिसे किरायेदार तुरंत भर सके", sub: "WhatsApp से किसी भी ब्राउज़र में खुलता है। कोई ऐप नहीं चाहिए।", rent: "किराया", electricity: "बिजली (सबमीटर)", total: "देय राशि", pay: "अभी भुगतान करें", scan: "किसी भी UPI ऐप से स्कैन करें" },
  reasons: {
    title: "अब किराया याद रखकर पीछा करने की ज़रूरत नहीं।",
    items: [
      { title: "स्प्रेडशीट का हिसाब ख़त्म", desc: "GST, TDS और सबमीटर बिजली हर महीने अपने आप सही गणना होती है।" },
      { title: "कुछ भी नहीं छूटता", desc: "होम स्क्रीन पर बकायादारों की सूची, और सुबह का ईमेल बताता है किसे याद दिलाना है।" },
      { title: "हर प्रॉपर्टी एक जगह", desc: "प्रॉपर्टी, यूनिट, किरायेदार, बिल और भुगतान, सब एक साफ़ डैशबोर्ड में।" },
    ],
  },
  pricing: {
    eyebrow: "सरल कीमत",
    title: "एक यूनिट से शुरू करें। ज़रूरत हो तो बढ़ाएँ।",
    desc: "कोई सेटअप फ़ीस या कॉन्ट्रैक्ट नहीं। प्लान बदलने पर भी आपका रिकॉर्ड सुरक्षित रहता है।",
    free: {
      label: "पहली प्रॉपर्टी के लिए",
      per: "हमेशा के लिए",
      desc: "एक छोटी प्रॉपर्टी के लिए सब कुछ।",
      features: [`${FREE_PLAN.propertyLimit} प्रॉपर्टी`, `${FREE_PLAN.unitLimit} यूनिट तक`, "WhatsApp रिमाइंडर और UPI बिल", "GST, TDS और बिजली बिल", "किराया रसीद"],
      cta: "मुफ़्त शुरू करें",
    },
    portfolio: {
      label: "बढ़ते मकान मालिकों के लिए",
      per: "/ माह",
      yearly: `या ₹${PORTFOLIO_PLAN.yearlyPrice} सालाना`,
      desc: "कुछ बिल्डिंग और उनके किरायेदारों के लिए।",
      features: [`${PORTFOLIO_PLAN.propertyLimit} प्रॉपर्टी तक`, `${PORTFOLIO_PLAN.unitLimit} यूनिट तक`, `${FREE_PLAN.name} की सारी सुविधाएँ`, "CSV एक्सपोर्ट"],
      cta: "अपग्रेड के लिए साइन इन करें",
    },
    estate: {
      label: "PG, हॉस्टल और बड़ी बिल्डिंग के लिए",
      per: "/ माह",
      desc: "जब कमरे ज़्यादा हों।",
      features: [`${ESTATE_PLAN.propertyLimit} प्रॉपर्टी तक`, `${ESTATE_PLAN.unitLimit} यूनिट या बेड तक`, `${PORTFOLIO_PLAN.name} की सारी सुविधाएँ`],
      cta: "अपग्रेड के लिए साइन इन करें",
    },
    note: "कोई GST नहीं। यही अंतिम कीमत है। Razorpay से सुरक्षित भुगतान; कभी भी रद्द करें।",
  },
  faqSection: {
    eyebrow: "जानने लायक",
    title: "सारी जानकारी, बिना छोटे अक्षरों की शर्तों के।",
    desc: "रिमाइंडर, भुगतान, बिल और प्राइवेसी के सीधे जवाब।",
    ready: "अपनी प्रॉपर्टी और किरायेदारों के साथ आज़माना चाहते हैं?",
  },
  faqs: [
    { question: "क्या किरायेदारों को कोई ऐप डाउनलोड करना होगा?", answer: "नहीं। किरायेदार को WhatsApp पर बिल का लिंक मिलता है, जो किसी भी ब्राउज़र में खुलता है और उसमें UPI QR कोड व ‘अभी भुगतान करें’ बटन होता है। रसीद भी एक लिंक ही है।" },
    { question: "क्या Bhadaa किराये का पैसा लेता है?", answer: "नहीं। किरायेदार सीधे आपकी UPI ID पर भुगतान करते हैं, पैसा आपके अपने बैंक खाते में आता है। पैसा आने पर आप ‘भुगतान हुआ’ दबाएँ।" },
    { question: "क्या यह किराये के बिल पर GST और TDS संभालता है?", answer: "हाँ। हर किरायेदार के लिए ज़रूरी दर से GST और/या TDS चालू करें, हर बिल में सही राशि अपने आप लगेगी।" },
    { question: "क्या किरायेदारों को HRA के लिए किराया रसीद मिलेगी?", answer: "हाँ। हर दर्ज भुगतान की रसीद में आपका नाम, PAN, प्रॉपर्टी का पता और शब्दों में राशि होती है। एक टैप में WhatsApp पर भेजें।" },
    { question: "सबमीटर बिजली बिल कैसे बनता है?", answer: "हर महीने मीटर रीडिंग डालें, Bhadaa इस्तेमाल हुई यूनिट और उस किरायेदार का बिल निकाल देता है।" },
    { question: "क्या प्लान पर GST लगता है?", answer: "नहीं। Bhadaa GST में रजिस्टर्ड नहीं है, इसलिए जो कीमत दिखती है वही आप चुकाते हैं।" },
  ],
  cta: {
    title: "किराया दिमाग़ में रखना बंद करें।",
    sub: "पहली प्रॉपर्टी 3 मिनट में सेट करें, या Excel से पेस्ट करें।",
    bullets: ["WhatsApp रिमाइंडर", "UPI पेमेंट लिंक", "किराया रसीद"],
    privacy: "आपका डेटा निजी है और सिर्फ़ आपके खाते में रहता है।",
  },
  footer: {
    blurb: "मकान मालिकों के लिए किराये का हिसाब, WhatsApp रिमाइंडर, UPI बिल और किराया रसीद।",
    product: "प्रोडक्ट",
    account: "खाता",
    rentSoftware: "किराया प्रबंधन सॉफ्टवेयर",
    rentTracking: "किराया ट्रैकिंग सॉफ्टवेयर",
    copyright: "© 2026 Bhadaa. किराया, बिना झंझट के।",
    built: "मकान मालिकों के लिए बनाया गया।",
  },
};

const gu: LandingCopy = {
  htmlLang: "gu-IN",
  meta: {
    title: "મકાન માલિકો માટે ભાડા મેનેજમેન્ટ એપ",
    description:
      "ભાડાનો હિસાબ રાખો, WhatsApp પર UPI પેમેન્ટ લિંક સાથે યાદ અપાવો, અને GST-TDS વાળા બિલ અને ભાડાની રસીદ મોકલો. પહેલી પ્રોપર્ટી માટે મફત.",
  },
  nav: { features: "સુવિધાઓ", how: "કેવી રીતે ચાલે છે", pricing: "કિંમત", faq: "પ્રશ્નો", signIn: "સાઇન ઇન", startFree: "મફત શરૂ કરો", skip: "મુખ્ય સામગ્રી પર જાઓ" },
  hero: {
    eyebrow: "મકાન માલિકો માટે",
    line1: "ભાડાની વસૂલાત,",
    line2: "કોઈ માથાકૂટ વગર.",
    subtitle:
      "જુઓ કોણે ભાડું ભર્યું, બાકીનાને એક ટેપમાં WhatsApp પર યાદ અપાવો, અને ભાડુઆત UPIથી ચૂકવે. બિલ, GST, TDS, લાઇટ બિલ અને ભાડાની રસીદ બધું આપમેળે.",
    cta: "મફત શરૂ કરો",
    bullets: ["પહેલી પ્રોપર્ટી માટે મફત", "Excelમાંથી ઇમ્પોર્ટ કરો", "પૈસા સીધા તમારી બેંકમાં"],
  },
  capabilities: [
    { value: "WhatsApp + UPI", label: "ઝડપથી યાદ અપાવો, ઝડપથી પૈસા મેળવો" },
    { value: "GST + TDS", label: "નિયમ મુજબ બિલિંગ" },
    { value: "ભાડાની રસીદ", label: "ભાડુઆતના HRA માટે તૈયાર" },
  ],
  features: {
    eyebrow: "બિલથી ચુકવણી સુધી",
    title: "ભાડાનું આખું કામ, એક જ જગ્યાએ.",
    desc: "દર મહિને બિલ આપમેળે બને છે. તમે યાદ અપાવો, ભાડુઆત UPIથી ચૂકવે, તમે ‘ચૂકવાયું’ દબાવો અને રસીદ મોકલાઈ જાય.",
    items: [
      { title: "એક ટેપમાં WhatsApp રિમાઇન્ડર", desc: "રકમ, છેલ્લી તારીખ અને બિલની લિંક લખેલું WhatsApp ખુલે છે. એક મિનિટમાં બધા બાકીદારોને યાદ અપાવો." },
      { title: "દરેક બિલ પર UPI QR", desc: "એક વાર તમારી UPI ID નાખો. દરેક બિલ પર QR કોડ અને ‘હમણાં ચૂકવો’ બટન હશે, અને પૈસા સીધા તમારા ખાતામાં આવશે." },
      { title: "HRA માટે ભાડાની રસીદ", desc: "ચુકવણી નોંધો અને તમારા PAN તથા શબ્દોમાં રકમ વાળી રસીદ મોકલો, ભાડુઆતના HRA ક્લેમ માટે તૈયાર." },
      { title: "GST અને TDS વાળા બિલ", desc: "દરેક ભાડુઆત માટે GST અને TDS સેટ કરો, દરેક બિલમાં આપમેળે ઉમેરાશે. કોઈ ગણતરી નહીં." },
      { title: "સબમીટર લાઇટ બિલ", desc: "મીટર રીડિંગ નાખો અને તે યુનિટનું સાચું લાઇટ બિલ આપમેળે બની જશે." },
      { title: "Excelથી સેટઅપ", desc: "તમારું ભાડા રજિસ્ટર Excel કે Google Sheetsમાંથી પેસ્ટ કરો, અથવા 101-110 લખીને આખા માળની રૂમ એકસાથે ઉમેરો." },
    ],
  },
  mockCollect: { title: "કોણે ભર્યું, કોણે નહીં", sub: "દરરોજ સવારે સૌથી પહેલાં આ જ દેખાય છે.", header: "ભાડાની વસૂલાત", paid: "ચૂકવાયું", due: "બાકી", overdue: "મોડું", remind: "યાદ અપાવો" },
  mockBill: { title: "એવું બિલ જે ભાડુઆત તરત ચૂકવી શકે", sub: "WhatsAppથી કોઈ પણ બ્રાઉઝરમાં ખુલે છે. કોઈ એપ જોઈતી નથી.", rent: "ભાડું", electricity: "લાઇટ બિલ (સબમીટર)", total: "ચૂકવવાની રકમ", pay: "હમણાં ચૂકવો", scan: "કોઈ પણ UPI એપથી સ્કેન કરો" },
  reasons: {
    title: "હવે ભાડું યાદ રાખીને પાછળ પડવાની જરૂર નથી.",
    items: [
      { title: "સ્પ્રેડશીટની ગણતરી ખતમ", desc: "GST, TDS અને સબમીટર લાઇટ બિલ દર મહિને આપમેળે સાચું ગણાય છે." },
      { title: "કંઈ છૂટતું નથી", desc: "હોમ સ્ક્રીન પર બાકીદારોની યાદી, અને સવારનો ઇમેઇલ જણાવે છે કોને યાદ અપાવવું." },
      { title: "દરેક પ્રોપર્ટી એક જગ્યાએ", desc: "પ્રોપર્ટી, યુનિટ, ભાડુઆત, બિલ અને ચુકવણી, બધું એક સાફ ડેશબોર્ડમાં." },
    ],
  },
  pricing: {
    eyebrow: "સરળ કિંમત",
    title: "એક યુનિટથી શરૂ કરો. જરૂર પડે ત્યારે વધારો.",
    desc: "કોઈ સેટઅપ ફી કે કોન્ટ્રાક્ટ નહીં. પ્લાન બદલો તો પણ તમારો રેકોર્ડ સુરક્ષિત રહે છે.",
    free: {
      label: "પહેલી પ્રોપર્ટી માટે",
      per: "હંમેશા માટે",
      desc: "એક નાની પ્રોપર્ટી માટે બધું જ.",
      features: [`${FREE_PLAN.propertyLimit} પ્રોપર્ટી`, `${FREE_PLAN.unitLimit} યુનિટ સુધી`, "WhatsApp રિમાઇન્ડર અને UPI બિલ", "GST, TDS અને લાઇટ બિલ", "ભાડાની રસીદ"],
      cta: "મફત શરૂ કરો",
    },
    portfolio: {
      label: "વધતા મકાન માલિકો માટે",
      per: "/ મહિનો",
      yearly: `અથવા ₹${PORTFOLIO_PLAN.yearlyPrice} વાર્ષિક`,
      desc: "થોડી બિલ્ડિંગ અને તેના ભાડુઆતો માટે.",
      features: [`${PORTFOLIO_PLAN.propertyLimit} પ્રોપર્ટી સુધી`, `${PORTFOLIO_PLAN.unitLimit} યુનિટ સુધી`, `${FREE_PLAN.name}ની બધી સુવિધાઓ`, "CSV એક્સપોર્ટ"],
      cta: "અપગ્રેડ માટે સાઇન ઇન કરો",
    },
    estate: {
      label: "PG, હોસ્ટેલ અને મોટી બિલ્ડિંગ માટે",
      per: "/ મહિનો",
      desc: "જ્યારે રૂમ વધારે હોય.",
      features: [`${ESTATE_PLAN.propertyLimit} પ્રોપર્ટી સુધી`, `${ESTATE_PLAN.unitLimit} યુનિટ અથવા બેડ સુધી`, `${PORTFOLIO_PLAN.name}ની બધી સુવિધાઓ`],
      cta: "અપગ્રેડ માટે સાઇન ઇન કરો",
    },
    note: "કોઈ GST નહીં. આ જ અંતિમ કિંમત છે. Razorpayથી સુરક્ષિત ચુકવણી; ગમે ત્યારે રદ કરો.",
  },
  faqSection: {
    eyebrow: "જાણવા જેવું",
    title: "બધી માહિતી, ઝીણા અક્ષરોની શરતો વગર.",
    desc: "રિમાઇન્ડર, ચુકવણી, બિલ અને પ્રાઇવસીના સીધા જવાબ.",
    ready: "તમારી પ્રોપર્ટી અને ભાડુઆતો સાથે અજમાવવા તૈયાર છો?",
  },
  faqs: [
    { question: "શું ભાડુઆતોએ કોઈ એપ ડાઉનલોડ કરવી પડશે?", answer: "ના. ભાડુઆતને WhatsApp પર બિલની લિંક મળે છે, જે કોઈ પણ બ્રાઉઝરમાં ખુલે છે અને તેમાં UPI QR કોડ અને ‘હમણાં ચૂકવો’ બટન હોય છે. રસીદ પણ એક લિંક જ છે." },
    { question: "શું Bhadaa ભાડાના પૈસા લે છે?", answer: "ના. ભાડુઆત સીધા તમારી UPI ID પર ચૂકવે છે, પૈસા તમારા પોતાના બેંક ખાતામાં આવે છે. પૈસા આવે ત્યારે તમે ‘ચૂકવાયું’ દબાવો." },
    { question: "શું તે ભાડાના બિલ પર GST અને TDS સંભાળે છે?", answer: "હા. દરેક ભાડુઆત માટે જરૂરી દરે GST અને/અથવા TDS ચાલુ કરો, દરેક બિલમાં સાચી રકમ આપમેળે લાગશે." },
    { question: "શું ભાડુઆતોને HRA માટે ભાડાની રસીદ મળશે?", answer: "હા. દરેક નોંધાયેલી ચુકવણીની રસીદમાં તમારું નામ, PAN, પ્રોપર્ટીનું સરનામું અને શબ્દોમાં રકમ હોય છે. એક ટેપમાં WhatsApp પર મોકલો." },
    { question: "સબમીટર લાઇટ બિલ કેવી રીતે બને છે?", answer: "દર મહિને મીટર રીડિંગ નાખો, Bhadaa વપરાયેલા યુનિટ અને તે ભાડુઆતનું બિલ ગણી આપે છે." },
    { question: "શું પ્લાન પર GST લાગે છે?", answer: "ના. Bhadaa GSTમાં રજિસ્ટર્ડ નથી, એટલે જે કિંમત દેખાય છે તે જ તમે ચૂકવો છો." },
  ],
  cta: {
    title: "ભાડું મગજમાં રાખવાનું બંધ કરો.",
    sub: "પહેલી પ્રોપર્ટી 3 મિનિટમાં સેટ કરો, અથવા Excelમાંથી પેસ્ટ કરો.",
    bullets: ["WhatsApp રિમાઇન્ડર", "UPI પેમેન્ટ લિંક", "ભાડાની રસીદ"],
    privacy: "તમારો ડેટા ખાનગી છે અને ફક્ત તમારા ખાતામાં રહે છે.",
  },
  footer: {
    blurb: "મકાન માલિકો માટે ભાડાનો હિસાબ, WhatsApp રિમાઇન્ડર, UPI બિલ અને ભાડાની રસીદ.",
    product: "પ્રોડક્ટ",
    account: "ખાતું",
    rentSoftware: "ભાડા મેનેજમેન્ટ સોફ્ટવેર",
    rentTracking: "ભાડા ટ્રેકિંગ સોફ્ટવેર",
    copyright: "© 2026 Bhadaa. ભાડું, માથાકૂટ વગર.",
    built: "મકાન માલિકો માટે બનાવેલું.",
  },
};

export const landingCopy: Record<LandingLocale, LandingCopy> = { en, hi, gu };

export const landingPaths: Record<LandingLocale, string> = { en: "/", hi: "/hi", gu: "/gu" };
export const landingLanguageNames: Record<LandingLocale, string> = { en: "English", hi: "हिन्दी", gu: "ગુજરાતી" };
