"use client";

import { Globe2 } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const supportedLanguages = ["en", "hi", "gu"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

const STORAGE_KEY = "bhada-language";
const COOKIE_NAME = "bhada-language";

type Dictionary = Record<string, string>;

const hi: Dictionary = {
  "Skip to content": "मुख्य सामग्री पर जाएँ",
  Features: "विशेषताएँ",
  "How it works": "यह कैसे काम करता है",
  Pricing: "मूल्य",
  FAQ: "सामान्य प्रश्न",
  "Sign in": "साइन इन करें",
  Dashboard: "डैशबोर्ड",
  "Open dashboard": "डैशबोर्ड खोलें",
  "Start free": "मुफ़्त शुरू करें",
  "Start for free": "मुफ़्त शुरू करें",
  "For independent landlords": "स्वतंत्र मकान मालिकों के लिए",
  "Rent management,": "किराया प्रबंधन,",
  "without the runaround.": "बिना किसी झंझट के।",
  "GST & TDS-ready invoicing, submeter electricity billing, in-app reminders, and one-tap PDF bills — one dashboard, every property.": "GST और TDS के लिए तैयार बिल, सबमीटर बिजली बिलिंग, ऐप में रिमाइंडर और एक टैप में PDF बिल — हर संपत्ति के लिए एक डैशबोर्ड।",
  "Free to get started": "शुरुआत मुफ़्त है",
  "Set up in minutes": "कुछ ही मिनटों में सेटअप",
  "Your data stays yours": "आपका डेटा आपका ही रहता है",
  "Compliant billing, out of the box": "शुरू से ही नियमों के अनुरूप बिलिंग",
  "One combined monthly bill": "एक संयुक्त मासिक बिल",
  "One dashboard": "एक डैशबोर्ड",
  "Every property, every tenant": "हर संपत्ति, हर किरायेदार",
  "From bill to payment": "बिल से भुगतान तक",
  "One place for the entire rent cycle.": "किराये के पूरे चक्र के लिए एक जगह।",
  "The recurring work stays connected—from calculating the month's charges to recording the final payment.": "महीने के शुल्क की गणना से लेकर अंतिम भुगतान दर्ज करने तक, सारा नियमित काम एक साथ जुड़ा रहता है।",
  "GST & TDS-ready invoicing": "GST और TDS के लिए तैयार बिलिंग",
  "Submeter electricity billing": "सबमीटर बिजली बिलिंग",
  "Combined monthly bills": "संयुक्त मासिक बिल",
  "Flexible payment allocation": "लचीला भुगतान आवंटन",
  "PDF bills, shareable anywhere": "PDF बिल, कहीं भी साझा करें",
  "Built-in reminders": "इन-बिल्ट रिमाइंडर",
  "One dashboard, every property": "हर संपत्ति के लिए एक डैशबोर्ड",
  "Live rent status across all units, at a glance.": "सभी यूनिट का किराया स्टेटस एक नज़र में।",
  "This Month's Collections": "इस महीने की वसूली",
  "Rent, electricity, and tax in one bill": "किराया, बिजली और कर एक ही बिल में",
  "GST and TDS calculated automatically, ready to share as a PDF.": "GST और TDS की गणना अपने आप, PDF के रूप में साझा करने के लिए तैयार।",
  Rent: "किराया",
  Electricity: "बिजली",
  "Electricity (submeter)": "बिजली (सबमीटर)",
  "TDS deducted": "TDS कटौती",
  "Total Due": "कुल देय",
  "Download PDF": "PDF डाउनलोड करें",
  Share: "साझा करें",
  "No more chasing rent by memory.": "अब किराया याद रखकर पीछा करने की जरूरत नहीं।",
  "No more spreadsheet math": "अब स्प्रेडशीट की गणना नहीं",
  "Nothing falls through": "कुछ भी छूटे नहीं",
  "One place for every property": "हर संपत्ति के लिए एक जगह",
  "Simple pricing": "सरल मूल्य निर्धारण",
  "Start with one door. Grow when you need to.": "एक यूनिट से शुरू करें। जरूरत के साथ बढ़ें।",
  "For your first rental": "आपकी पहली किराये की संपत्ति के लिए",
  forever: "हमेशा के लिए",
  "For growing landlords": "बढ़ते मकान मालिकों के लिए",
  "Most popular": "सबसे लोकप्रिय",
  "/ month": "/ माह",
  "Sign in to upgrade": "अपग्रेड करने के लिए साइन इन करें",
  "Good to know": "जानना अच्छा है",
  "The details, without the fine print.": "सारी जानकारी, बिना पेचीदा शर्तों के।",
  "Ready to see it with your own properties and tenants?": "अपनी संपत्तियों और किरायेदारों के साथ इसे देखने के लिए तैयार हैं?",
  "Stop tracking rent in your head.": "किराया दिमाग में रखना बंद करें।",
  "Set up your first property in under 3 minutes.": "अपनी पहली संपत्ति 3 मिनट से कम में सेट करें।",
  "GST & TDS ready": "GST और TDS के लिए तैयार",
  "Submeter billing": "सबमीटर बिलिंग",
  "One-tap PDF bills": "एक टैप में PDF बिल",
  "Your data stays private, scoped to your account alone.": "आपका डेटा निजी रहता है और केवल आपके खाते तक सीमित है।",
  Product: "उत्पाद",
  Account: "खाता",
  "Rent management software": "किराया प्रबंधन सॉफ्टवेयर",
  "Built for independent landlords.": "स्वतंत्र मकान मालिकों के लिए बनाया गया।",
  "Back to home": "होम पर वापस जाएँ",
  "Back to sign in": "साइन इन पर वापस जाएँ",
  "Create your workspace": "अपना कार्यक्षेत्र बनाएँ",
  "Welcome back": "वापसी पर स्वागत है",
  "Start tracking rent": "किराये का हिसाब शुरू करें",
  "Sign in to Bhada": "Bhada में साइन इन करें",
  "A clear portfolio is just a minute away.": "एक सुव्यवस्थित पोर्टफोलियो बस एक मिनट दूर है।",
  "Enter your details to continue to your portfolio.": "अपने पोर्टफोलियो में जाने के लिए जानकारी भरें।",
  "Continue with Google": "Google से जारी रखें",
  "or use email": "या ईमेल का उपयोग करें",
  "Full name": "पूरा नाम",
  "Email address": "ईमेल पता",
  Password: "पासवर्ड",
  "Forgot password?": "पासवर्ड भूल गए?",
  "At least 8 characters": "कम से कम 8 अक्षर",
  "Create account": "खाता बनाएँ",
  "Already have an account?": "पहले से खाता है?",
  "New to Bhada?": "Bhada पर नए हैं?",
  "Create an account": "खाता बनाएँ",
  "Check your inbox": "अपना इनबॉक्स देखें",
  "Password reset": "पासवर्ड रीसेट",
  "Let's get you back in.": "आइए आपको फिर से लॉग इन कराएँ।",
  "Send reset link": "रीसेट लिंक भेजें",
  "Choose a new password": "नया पासवर्ड चुनें",
  "Make it strong.": "इसे मजबूत रखें।",
  "New password": "नया पासवर्ड",
  "Confirm new password": "नए पासवर्ड की पुष्टि करें",
  "Update password": "पासवर्ड अपडेट करें",
  "This link has expired": "यह लिंक समाप्त हो गया है",
  "Request a new link": "नया लिंक माँगें",
  Workspace: "कार्यक्षेत्र",
  Manage: "प्रबंधन",
  Overview: "सारांश",
  Properties: "संपत्तियाँ",
  Tenants: "किरायेदार",
  Payments: "भुगतान",
  Settings: "सेटिंग्स",
  "Help center": "सहायता केंद्र",
  Search: "खोजें",
  "Search anything...": "कुछ भी खोजें...",
  Notifications: "सूचनाएँ",
  "No notifications": "कोई सूचना नहीं",
  "No results found": "कोई परिणाम नहीं मिला",
  "Income overview": "आय का सारांश",
  "Rent collected across all properties": "सभी संपत्तियों से वसूला गया किराया",
  "Collection rate": "वसूली दर",
  collected: "वसूला गया",
  "Active properties": "सक्रिय संपत्तियाँ",
  "Across your portfolio": "आपके पूरे पोर्टफोलियो में",
  "Recent payments": "हाल के भुगतान",
  "Latest activity from your tenants": "आपके किरायेदारों की नवीनतम गतिविधि",
  Tenant: "किरायेदार",
  Amount: "राशि",
  Date: "तारीख",
  Balance: "शेष",
  Status: "स्थिति",
  "View all": "सभी देखें",
  "Your active portfolio": "आपका सक्रिय पोर्टफोलियो",
  "View all properties": "सभी संपत्तियाँ देखें",
  Portfolio: "पोर्टफोलियो",
  "Add property": "संपत्ति जोड़ें",
  "No properties found": "कोई संपत्ति नहीं मिली",
  "Add tenant": "किरायेदार जोड़ें",
  "No tenants found": "कोई किरायेदार नहीं मिला",
  "Record payment": "भुगतान दर्ज करें",
  "Financial year": "वित्तीय वर्ष",
  "Rent bills": "किराये के बिल",
  "Electricity bills": "बिजली के बिल",
  Bill: "बिल",
  "Bill month": "बिल का महीना",
  Unit: "यूनिट",
  Payable: "देय राशि",
  Pending: "बाकी",
  "Due date": "देय तिथि",
  Copy: "कॉपी",
  Paid: "भुगतान हुआ",
  Overdue: "अतिदेय",
  Upcoming: "आगामी",
  Overpaid: "अधिक भुगतान",
  "Add electricity bill": "बिजली का बिल जोड़ें",
  "Meter reading": "मीटर रीडिंग",
  Previous: "पिछला",
  "Units used": "उपयोग की गई यूनिट",
  "Bill amount": "बिल राशि",
  Allocation: "आवंटन",
  "Bills paid": "भुगतान किए गए बिल",
  "Total received": "कुल प्राप्त",
  Cancel: "रद्द करें",
  Save: "सहेजें",
  Delete: "हटाएँ",
  Edit: "संपादित करें",
  Close: "बंद करें",
  "Getting started": "शुरुआत करें",
  Support: "सहायता",
  "No articles found": "कोई लेख नहीं मिला",
  "Account settings": "खाता सेटिंग्स",
  "Sign out": "साइन आउट",
  Email: "ईमेल",
  Phone: "फ़ोन",
  Lease: "लीज़",
  "Monthly rent": "मासिक किराया",
  Billing: "बिलिंग",
  Deposit: "जमा राशि",
  "Opening balance": "प्रारंभिक शेष",
  Units: "यूनिट",
};

const gu: Dictionary = {
  "Skip to content": "મુખ્ય સામગ્રી પર જાઓ",
  Features: "સુવિધાઓ",
  "How it works": "તે કેવી રીતે કામ કરે છે",
  Pricing: "કિંમત",
  FAQ: "સામાન્ય પ્રશ્નો",
  "Sign in": "સાઇન ઇન કરો",
  Dashboard: "ડેશબોર્ડ",
  "Open dashboard": "ડેશબોર્ડ ખોલો",
  "Start free": "મફતમાં શરૂ કરો",
  "Start for free": "મફતમાં શરૂ કરો",
  "For independent landlords": "સ્વતંત્ર મકાનમાલિકો માટે",
  "Rent management,": "ભાડા વ્યવસ્થાપન,",
  "without the runaround.": "કોઈ ઝંઝટ વિના।",
  "GST & TDS-ready invoicing, submeter electricity billing, in-app reminders, and one-tap PDF bills — one dashboard, every property.": "GST અને TDS માટે તૈયાર બિલ, સબમીટર વીજળી બિલિંગ, એપમાં રિમાઇન્ડર અને એક ટેપમાં PDF બિલ — દરેક મિલકત માટે એક ડેશબોર્ડ।",
  "Free to get started": "શરૂઆત મફત છે",
  "Set up in minutes": "મિનિટોમાં સેટઅપ",
  "Your data stays yours": "તમારો ડેટા તમારો જ રહે છે",
  "Compliant billing, out of the box": "શરૂઆતથી જ નિયમ અનુસાર બિલિંગ",
  "One combined monthly bill": "એક સંયુક્ત માસિક બિલ",
  "One dashboard": "એક ડેશબોર્ડ",
  "Every property, every tenant": "દરેક મિલકત, દરેક ભાડૂત",
  "From bill to payment": "બિલથી ચુકવણી સુધી",
  "One place for the entire rent cycle.": "ભાડાના સમગ્ર ચક્ર માટે એક જગ્યા।",
  "The recurring work stays connected—from calculating the month's charges to recording the final payment.": "મહિનાના ચાર્જની ગણતરીથી અંતિમ ચુકવણી નોંધવા સુધીનું નિયમિત કામ જોડાયેલું રહે છે।",
  "GST & TDS-ready invoicing": "GST અને TDS માટે તૈયાર બિલિંગ",
  "Submeter electricity billing": "સબમીટર વીજળી બિલિંગ",
  "Combined monthly bills": "સંયુક્ત માસિક બિલ",
  "Flexible payment allocation": "લવચીક ચુકવણી ફાળવણી",
  "PDF bills, shareable anywhere": "PDF બિલ, ગમે ત્યાં શેર કરો",
  "Built-in reminders": "બિલ્ટ-ઇન રિમાઇન્ડર",
  "One dashboard, every property": "દરેક મિલકત માટે એક ડેશબોર્ડ",
  "Live rent status across all units, at a glance.": "તમામ યુનિટની ભાડાની સ્થિતિ એક નજરમાં।",
  "This Month's Collections": "આ મહિનાની વસૂલાત",
  "Rent, electricity, and tax in one bill": "ભાડું, વીજળી અને કર એક જ બિલમાં",
  "GST and TDS calculated automatically, ready to share as a PDF.": "GST અને TDSની આપમેળે ગણતરી, PDF તરીકે શેર કરવા તૈયાર।",
  Rent: "ભાડું",
  Electricity: "વીજળી",
  "Electricity (submeter)": "વીજળી (સબમીટર)",
  "TDS deducted": "TDS કપાત",
  "Total Due": "કુલ બાકી",
  "Download PDF": "PDF ડાઉનલોડ કરો",
  Share: "શેર કરો",
  "No more chasing rent by memory.": "હવે ભાડું યાદ રાખીને પાછળ પડવાની જરૂર નથી।",
  "No more spreadsheet math": "હવે સ્પ્રેડશીટની ગણતરી નહીં",
  "Nothing falls through": "કંઈ છૂટી ન જાય",
  "One place for every property": "દરેક મિલકત માટે એક જગ્યા",
  "Simple pricing": "સરળ કિંમત",
  "Start with one door. Grow when you need to.": "એક યુનિટથી શરૂ કરો। જરૂર મુજબ આગળ વધો।",
  "For your first rental": "તમારી પ્રથમ ભાડાની મિલકત માટે",
  forever: "હંમેશા માટે",
  "For growing landlords": "વિકસતા મકાનમાલિકો માટે",
  "Most popular": "સૌથી લોકપ્રિય",
  "/ month": "/ મહિનો",
  "Sign in to upgrade": "અપગ્રેડ કરવા સાઇન ઇન કરો",
  "Good to know": "જાણવા જેવું",
  "The details, without the fine print.": "બધી વિગતો, ગૂંચવણભરી શરતો વિના।",
  "Ready to see it with your own properties and tenants?": "તમારી મિલકતો અને ભાડૂતો સાથે જોવા તૈયાર છો?",
  "Stop tracking rent in your head.": "ભાડાનો હિસાબ મનમાં રાખવાનું બંધ કરો।",
  "Set up your first property in under 3 minutes.": "તમારી પ્રથમ મિલકત 3 મિનિટથી ઓછા સમયમાં સેટ કરો।",
  "GST & TDS ready": "GST અને TDS માટે તૈયાર",
  "Submeter billing": "સબમીટર બિલિંગ",
  "One-tap PDF bills": "એક ટેપમાં PDF બિલ",
  "Your data stays private, scoped to your account alone.": "તમારો ડેટા ખાનગી અને ફક્ત તમારા ખાતા સુધી મર્યાદિત રહે છે।",
  Product: "ઉત્પાદન",
  Account: "ખાતું",
  "Rent management software": "ભાડા વ્યવસ્થાપન સોફ્ટવેર",
  "Built for independent landlords.": "સ્વતંત્ર મકાનમાલિકો માટે બનાવેલું।",
  "Back to home": "હોમ પર પાછા જાઓ",
  "Back to sign in": "સાઇન ઇન પર પાછા જાઓ",
  "Create your workspace": "તમારું કાર્યક્ષેત્ર બનાવો",
  "Welcome back": "ફરી સ્વાગત છે",
  "Start tracking rent": "ભાડાનો હિસાબ શરૂ કરો",
  "Sign in to Bhada": "Bhadaમાં સાઇન ઇન કરો",
  "A clear portfolio is just a minute away.": "સુવ્યવસ્થિત પોર્ટફોલિયો માત્ર એક મિનિટ દૂર છે।",
  "Enter your details to continue to your portfolio.": "પોર્ટફોલિયોમાં જવા તમારી વિગતો દાખલ કરો।",
  "Continue with Google": "Google સાથે આગળ વધો",
  "or use email": "અથવા ઈમેઇલ વાપરો",
  "Full name": "પૂરું નામ",
  "Email address": "ઈમેઇલ સરનામું",
  Password: "પાસવર્ડ",
  "Forgot password?": "પાસવર્ડ ભૂલી ગયા?",
  "At least 8 characters": "ઓછામાં ઓછા 8 અક્ષર",
  "Create account": "ખાતું બનાવો",
  "Already have an account?": "પહેલેથી ખાતું છે?",
  "New to Bhada?": "Bhada પર નવા છો?",
  "Create an account": "ખાતું બનાવો",
  "Check your inbox": "તમારું ઇનબોક્સ તપાસો",
  "Password reset": "પાસવર્ડ રીસેટ",
  "Let's get you back in.": "ચાલો તમને ફરી લોગ ઇન કરાવીએ।",
  "Send reset link": "રીસેટ લિંક મોકલો",
  "Choose a new password": "નવો પાસવર્ડ પસંદ કરો",
  "Make it strong.": "તેને મજબૂત રાખો।",
  "New password": "નવો પાસવર્ડ",
  "Confirm new password": "નવા પાસવર્ડની પુષ્ટિ કરો",
  "Update password": "પાસવર્ડ અપડેટ કરો",
  "This link has expired": "આ લિંકની મુદત પૂરી થઈ ગઈ છે",
  "Request a new link": "નવી લિંક માગો",
  Workspace: "કાર્યક્ષેત્ર",
  Manage: "વ્યવસ્થાપન",
  Overview: "સારાંશ",
  Properties: "મિલકતો",
  Tenants: "ભાડૂતો",
  Payments: "ચુકવણીઓ",
  Settings: "સેટિંગ્સ",
  "Help center": "મદદ કેન્દ્ર",
  Search: "શોધો",
  "Search anything...": "કંઈપણ શોધો...",
  Notifications: "સૂચનાઓ",
  "No notifications": "કોઈ સૂચના નથી",
  "No results found": "કોઈ પરિણામ મળ્યું નથી",
  "Income overview": "આવકનો સારાંશ",
  "Rent collected across all properties": "તમામ મિલકતોમાંથી વસૂલ થયેલું ભાડું",
  "Collection rate": "વસૂલાત દર",
  collected: "વસૂલ થયું",
  "Active properties": "સક્રિય મિલકતો",
  "Across your portfolio": "તમારા સમગ્ર પોર્ટફોલિયોમાં",
  "Recent payments": "તાજેતરની ચુકવણીઓ",
  "Latest activity from your tenants": "તમારા ભાડૂતોની તાજેતરની પ્રવૃત્તિ",
  Tenant: "ભાડૂત",
  Amount: "રકમ",
  Date: "તારીખ",
  Balance: "બાકી",
  Status: "સ્થિતિ",
  "View all": "બધું જુઓ",
  "Your active portfolio": "તમારો સક્રિય પોર્ટફોલિયો",
  "View all properties": "બધી મિલકતો જુઓ",
  Portfolio: "પોર્ટફોલિયો",
  "Add property": "મિલકત ઉમેરો",
  "No properties found": "કોઈ મિલકત મળી નથી",
  "Add tenant": "ભાડૂત ઉમેરો",
  "No tenants found": "કોઈ ભાડૂત મળ્યો નથી",
  "Record payment": "ચુકવણી નોંધો",
  "Financial year": "નાણાકીય વર્ષ",
  "Rent bills": "ભાડાના બિલ",
  "Electricity bills": "વીજળીના બિલ",
  Bill: "બિલ",
  "Bill month": "બિલનો મહિનો",
  Unit: "યુનિટ",
  Payable: "ચૂકવવાપાત્ર",
  Pending: "બાકી",
  "Due date": "નિયત તારીખ",
  Copy: "કૉપી",
  Paid: "ચૂકવેલ",
  Overdue: "મુદત વીતી",
  Upcoming: "આગામી",
  Overpaid: "વધુ ચૂકવેલ",
  "Add electricity bill": "વીજળીનું બિલ ઉમેરો",
  "Meter reading": "મીટર રીડિંગ",
  Previous: "પાછલું",
  "Units used": "વપરાયેલ યુનિટ",
  "Bill amount": "બિલની રકમ",
  Allocation: "ફાળવણી",
  "Bills paid": "ચૂકવેલા બિલ",
  "Total received": "કુલ પ્રાપ્ત",
  Cancel: "રદ કરો",
  Save: "સાચવો",
  Delete: "કાઢી નાખો",
  Edit: "ફેરફાર કરો",
  Close: "બંધ કરો",
  "Getting started": "શરૂઆત કરો",
  Support: "મદદ",
  "No articles found": "કોઈ લેખ મળ્યો નથી",
  "Account settings": "ખાતા સેટિંગ્સ",
  "Sign out": "સાઇન આઉટ",
  Email: "ઈમેઇલ",
  Phone: "ફોન",
  Lease: "લીઝ",
  "Monthly rent": "માસિક ભાડું",
  Billing: "બિલિંગ",
  Deposit: "ડિપોઝિટ",
  "Opening balance": "શરૂઆતની બાકી",
  Units: "યુનિટ",
};

const dictionaries: Record<Exclude<AppLanguage, "en">, Dictionary> = { hi, gu };

const LanguageContext = createContext({
  language: "en" as AppLanguage,
  setLanguage: (language: AppLanguage) => {
    void language;
  },
  t: (value: string) => value,
});

function translateValue(value: string, language: AppLanguage) {
  if (language === "en") return value;
  const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match || !match[2]) return value;
  const translated = dictionaries[language][match[2]];
  return translated ? `${match[1]}${translated}${match[3]}` : value;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const textRecordsRef = useRef(new WeakMap<Text, { source: string; applied: string }>());
  const attributeRecordsRef = useRef(
    new WeakMap<Element, Map<string, { source: string; applied: string }>>(),
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const browserLanguage = navigator.language.toLowerCase();
    const initial = supportedLanguages.includes(stored as AppLanguage)
      ? (stored as AppLanguage)
      : browserLanguage.startsWith("hi")
        ? "hi"
        : browserLanguage.startsWith("gu")
          ? "gu"
          : "en";
    const frame = window.requestAnimationFrame(() => setLanguageState(initial));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";

    const textRecords = textRecordsRef.current;
    const attributeRecords = attributeRecordsRef.current;
    const attributes = ["placeholder", "title", "aria-label"];

    function translateText(node: Text) {
      if (node.parentElement?.closest("[data-i18n-ignore]")) return;
      const current = node.data;
      const previous = textRecords.get(node);
      const source = previous && current === previous.applied ? previous.source : current;
      const applied = translateValue(source, language);
      textRecords.set(node, { source, applied });
      if (current !== applied) node.data = applied;
    }

    function translateElement(element: Element) {
      if (element.closest("[data-i18n-ignore]")) return;
      const records = attributeRecords.get(element) ?? new Map();
      for (const attribute of attributes) {
        const current = element.getAttribute(attribute);
        if (!current) continue;
        const previous = records.get(attribute);
        const source = previous && current === previous.applied ? previous.source : current;
        const applied = translateValue(source, language);
        records.set(attribute, { source, applied });
        if (current !== applied) element.setAttribute(attribute, applied);
      }
      attributeRecords.set(element, records);
    }

    function translateTree(root: Node) {
      if (root.nodeType === Node.TEXT_NODE) translateText(root as Text);
      if (root.nodeType === Node.ELEMENT_NODE) translateElement(root as Element);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
        else translateElement(node as Element);
      }
    }

    translateTree(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateText(mutation.target as Text);
        for (const node of mutation.addedNodes) translateTree(node);
      }
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t: (text: string) => translateValue(text, language) }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LanguageSwitcher />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <div
      data-i18n-ignore
      className="bhada-language-switcher fixed bottom-4 z-[110] shadow-[0_18px_50px_rgba(0,0,0,.32)] sm:bottom-5"
    >
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value as AppLanguage)}
      >
        <SelectTrigger
          aria-label="Choose language"
          className="h-11 w-[142px] border-white/15 bg-[#171717] px-3 text-[#edede8] hover:border-[#e4c77a]/45 hover:bg-[#1d1d1c] focus:border-[#e4c77a]/60 [&>svg:last-child]:text-[#e4c77a]/70"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Globe2 className="size-4 shrink-0 text-[#e4c77a]" aria-hidden="true" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent
          sideOffset={6}
          className="z-[120] border-[#e4c77a]/25 bg-[#171717] shadow-[0_22px_60px_rgba(0,0,0,.5)]"
        >
          <SelectItem value="en" className="focus:bg-[#e4c77a]/10 data-[state=checked]:text-[#e4c77a]">English</SelectItem>
          <SelectItem value="hi" className="focus:bg-[#e4c77a]/10 data-[state=checked]:text-[#e4c77a]">हिन्दी</SelectItem>
          <SelectItem value="gu" className="focus:bg-[#e4c77a]/10 data-[state=checked]:text-[#e4c77a]">ગુજરાતી</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
