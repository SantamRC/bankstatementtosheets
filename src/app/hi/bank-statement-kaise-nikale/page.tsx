import type { Metadata } from "next";
import Link from "next/link";
import { HREFLANG, pageMeta } from "@/lib/seo/meta";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FinalCTA } from "@/components/landing/Sections";
import { Breadcrumbs, Faq, Points, Section, SeoHero } from "@/components/seo/Blocks";
import { FREE_PAGES } from "@/lib/plans";

const path = HREFLANG.download["hi-IN"];

export const metadata: Metadata = pageMeta({
  title: "बैंक स्टेटमेंट कैसे निकाले? नेट बैंकिंग, ऐप और ब्रांच से (PDF)",
  description:
    "बैंक स्टेटमेंट कैसे निकाले: नेट बैंकिंग या मोबाइल ऐप से PDF डाउनलोड करें। SBI, HDFC, ICICI, Axis, Kotak, Bank of Baroda, PNB, Canara और Union Bank के स्टेप, पासवर्ड और Excel में बदलने का तरीका।",
  path,
  absoluteTitle: true,
  languages: HREFLANG.download,
  locale: "hi_IN",
});

const PICK = "तारीख की अवधि (date range) चुनें और स्टेटमेंट PDF में डाउनलोड करें।";

// Mirrors the English steps in lib/seo/banks.ts. Menu names stay in English because that's how the banks' apps show them.
const BANKS: [string, string, string[]][] = [
  ["State Bank of India (SBI)", "sbi", ["OnlineSBI (इंटरनेट बैंकिंग) या YONO SBI ऐप में लॉग इन करें।", "My Accounts में Account Statement खोलें।", PICK]],
  ["HDFC Bank", "hdfc-bank", ["HDFC Bank NetBanking या HDFC Bank ऐप में लॉग इन करें।", "अपना खाता खोलें और Account Statement चुनें (पुराने स्टेटमेंट के लिए Download historical statement)।", PICK]],
  ["ICICI Bank", "icici-bank", ["ICICI Bank Internet Banking या iMobile ऐप में लॉग इन करें।", "अपने बैंक खाते में जाकर Account Statement चुनें।", PICK]],
  ["Axis Bank", "axis-bank", ["Axis Bank Internet Banking या Axis Mobile ऐप में लॉग इन करें।", "Accounts खोलें और Statement (Detailed statement) चुनें।", PICK]],
  ["Kotak Mahindra Bank", "kotak-mahindra-bank", ["Kotak नेट बैंकिंग या Kotak ऐप में लॉग इन करें।", "Statements में जाकर Account statement चुनें।", PICK]],
  ["Bank of Baroda", "bank-of-baroda", ["bob World Internet banking या bob World ऐप में लॉग इन करें।", "Accounts खोलें और Account Statement चुनें।", PICK]],
  ["Punjab National Bank (PNB)", "punjab-national-bank", ["PNB ONE ऐप या PNB इंटरनेट बैंकिंग में लॉग इन करें।", "Accounts में जाकर Account Statement चुनें।", PICK]],
  ["Canara Bank", "canara-bank", ["Canara Bank नेट बैंकिंग या Canara ai1 ऐप में लॉग इन करें।", "अपना खाता खोलें और Account Statement चुनें।", PICK]],
  ["Union Bank of India", "union-bank-of-india", ["Union Bank इंटरनेट बैंकिंग या Vyom ऐप में लॉग इन करें।", "Accounts में जाकर Account Statement चुनें।", PICK]],
];

const link = "font-medium text-brand underline-offset-2 hover:underline";

export default function Page() {
  return (
    <>
      <Navbar />
      <main lang="hi">
        <Breadcrumbs home="होम" items={[["बैंक स्टेटमेंट कैसे निकाले", path]]} />
        <SeoHero
          eyebrow="गाइड · भारत"
          title="बैंक स्टेटमेंट कैसे निकाले?"
          accent="2 मिनट में, घर बैठे।"
          intro="ज़्यादातर बैंक नेट बैंकिंग या मोबाइल ऐप से किसी भी अवधि का स्टेटमेंट PDF में डाउनलोड करने देते हैं। यहाँ तरीके हैं, 9 बड़े भारतीय बैंकों के स्टेप हैं, और PDF का पासवर्ड व Excel में बदलने का तरीका भी।"
          cta={{ primary: "स्टेटमेंट को Excel में बदलें", secondary: "प्राइसिंग देखें", perks: [`${FREE_PAGES} पेज मुफ़्त`, "कार्ड की ज़रूरत नहीं", "PDF सेव नहीं होती"] }}
        />

        <Section kicker="तरीके" title="बैंक स्टेटमेंट निकालने के तरीके">
          <Points
            items={[
              ["नेट बैंकिंग या मोबाइल ऐप (सबसे तेज़)", "लॉग इन करें, Account Statement खोलें, तारीख चुनें और PDF डाउनलोड करें। ज़्यादातर बैंकों में इसका कोई शुल्क नहीं लगता।"],
              ["ईमेल स्टेटमेंट", "बैंक हर महीने रजिस्टर्ड ईमेल पर स्टेटमेंट भेजता है। ऐप या नेट बैंकिंग से किसी खास अवधि का स्टेटमेंट ईमेल पर भी मँगवा सकते हैं। ये PDF अक्सर पासवर्ड से लॉक होती हैं।"],
              ["ब्रांच या पासबुक", "पुराने स्टेटमेंट, बंद खाते, या बैंक की मुहर (stamp) वाला स्टेटमेंट चाहिए तो ब्रांच में आवेदन करें। कुछ बैंक इसका शुल्क लेते हैं।"],
            ]}
          />
          <p className="mt-6 max-w-3xl leading-relaxed text-ink-soft">
            <strong className="text-ink">मिनी स्टेटमेंट</strong> (ATM, SMS या मिस्ड कॉल से) में सिर्फ़ आख़िरी कुछ लेन-देन दिखते हैं। लोन, वीज़ा या
            इनकम टैक्स के लिए पूरा स्टेटमेंट ही चाहिए।
          </p>
        </Section>

        <Section kicker="स्टेप बाय स्टेप" title="अपने बैंक से स्टेटमेंट कैसे डाउनलोड करें">
          <p className="max-w-3xl text-sm text-muted">
            बैंक अपने ऐप बदलते रहते हैं, इसलिए मेन्यू के नाम थोड़े अलग हो सकते हैं। मेन्यू के नाम अंग्रेज़ी में दिए हैं क्योंकि ऐप में वे ऐसे ही दिखते हैं।
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BANKS.map(([name, slug, steps]) => (
              <div key={slug} className="rounded-2xl border border-line-strong bg-card p-5">
                <h3 className="font-semibold">{name} स्टेटमेंट कैसे निकाले</h3>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
                  {steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <Link href={`/banks/${slug}`} hrefLang="en" className="mt-3 inline-block text-xs text-brand underline-offset-2 hover:underline">
                  {name} statement to Excel (English)
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">बैंकों के नाम उनके मालिकों के ट्रेडमार्क हैं। BankStatementToSheets किसी बैंक से जुड़ा नहीं है।</p>
        </Section>

        <Section kicker="पासवर्ड" title="स्टेटमेंट PDF पासवर्ड माँग रही है?">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              ईमेल से आए स्टेटमेंट आमतौर पर पासवर्ड से लॉक होते हैं। पासवर्ड का नियम उसी ईमेल में लिखा होता है, जैसे आपका Customer ID, या नाम के पहले
              चार अक्षर और जन्मतिथि (DDMM)। नेट बैंकिंग से सीधे डाउनलोड किया गया स्टेटमेंट अक्सर लॉक नहीं होता।
            </p>
            <p>
              बैंक के हिसाब से पासवर्ड के आम फ़ॉर्मैट और अनलॉक कॉपी बनाने का तरीका:{" "}
              <Link href="/bank-statement-password" hrefLang="en" className={link}>Bank statement PDF password (English)</Link>।
            </p>
          </div>
        </Section>

        <Section kicker="Excel में बदलें" title="स्टेटमेंट को Excel में कैसे बदलें">
          <div className="max-w-3xl space-y-4 leading-relaxed text-ink-soft">
            <p>
              ITR, लोन या अकाउंटिंग के लिए लेन-देन Excel में चाहिए? PDF को{" "}
              <Link href="/convert" className={link}>कन्वर्टर</Link> पर अपलोड करें। हर लेन-देन निकाला जाता है, लंबे UPI/NEFT/IMPS विवरण से साफ़
              नाम और रेफ़रेंस नंबर अलग कॉलम में आते हैं, और हर पंक्ति स्टेटमेंट के बैलेंस से मिलाकर जाँची जाती है। फिर Excel, CSV या Google Sheets
              डाउनलोड करें।
            </p>
            <p className="text-sm text-muted">
              ध्यान दें: ऐप अभी अंग्रेज़ी में है। आपकी PDF सिर्फ़ मेमोरी में प्रोसेस होती है और कभी सेव नहीं होती।
            </p>
          </div>
        </Section>

        <Faq
          title="अक्सर पूछे जाने वाले सवाल"
          items={[
            ["बैंक स्टेटमेंट ऑनलाइन कैसे निकाले?", "अपने बैंक की नेट बैंकिंग या मोबाइल ऐप में लॉग इन करें, Account Statement खोलें, तारीख की अवधि चुनें और PDF डाउनलोड करें।"],
            ["क्या मोबाइल से बैंक स्टेटमेंट निकाल सकते हैं?", "हाँ। SBI का YONO, HDFC Bank ऐप, ICICI iMobile, Axis Mobile और दूसरे बैंक ऐप से स्टेटमेंट PDF डाउनलोड या ईमेल पर मँगवा सकते हैं।"],
            ["पुराना बैंक स्टेटमेंट कैसे निकाले?", "नेट बैंकिंग में आमतौर पर कुछ साल पुराना स्टेटमेंट मिल जाता है। उससे पुराना या बंद खाते का स्टेटमेंट चाहिए तो ब्रांच में आवेदन करें।"],
            ["बैंक स्टेटमेंट PDF का पासवर्ड क्या होता है?", "यह बैंक और खाते के हिसाब से अलग होता है, जैसे Customer ID या नाम और जन्मतिथि का मेल। सही नियम स्टेटमेंट वाले ईमेल में लिखा होता है।"],
            ["क्या डाउनलोड किया गया स्टेटमेंट मान्य है?", "ज़्यादातर बैंक और लोन देने वाले नेट बैंकिंग से डाउनलोड किया गया PDF स्टेटमेंट मान लेते हैं। कुछ जगह बैंक की मुहर वाला स्टेटमेंट माँगा जाता है, पहले पूछ लें।"],
            ["बैंक स्टेटमेंट को Excel में कैसे बदलें?", `PDF को BankStatementToSheets पर अपलोड करें और Excel डाउनलोड करें। पहले ${FREE_PAGES} पेज मुफ़्त हैं, कार्ड की ज़रूरत नहीं।`],
          ]}
        />
        <section className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm text-muted sm:px-6">
          <Link href={HREFLANG.download.en} hrefLang="en" lang="en" className="text-brand underline-offset-2 hover:underline">Read this guide in English</Link>
        </section>
        <FinalCTA
          t={{
            title: "स्टेटमेंट दोबारा टाइप करना बंद करें।",
            accent: "सीधे Excel में पाएँ।",
            body: `पहले ${FREE_PAGES} पेज मुफ़्त हैं। कोई कार्ड नहीं, बस PDF डालें।`,
            cta: "मुफ़्त में बदलें",
          }}
        />
      </main>
      <Footer />
    </>
  );
}
