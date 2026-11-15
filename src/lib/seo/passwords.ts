/**
 * Statement-password pages (/banks/[slug]/statement-password), India only.
 *
 * Why: "<bank> statement password" is the biggest bank-related search in India (HDFC ~90k/mo, SBI ~60k+22k, Union
 * ~12k, PNB ~8k, Axis ~6.6k; KD 0–9, OpenSEO 2026-11-16), and our converter now unlocks PDFs in the browser.
 *
 * Accuracy rules: banks rarely publish the rule. `source: "bank"` only where the bank's own site states it
 * (checked 2026-11-16); everything else is "reported" (consistent across several third-party guides) and is
 * worded as such. The email that delivered the statement is always the authority. Examples use fictional people.
 */

export interface PwFormat {
  /** Short rule, e.g. "Your numeric Customer ID". */
  rule: string;
  example?: string;
  source: "bank" | "reported";
  note?: string;
}

export interface BankPassword {
  slug: string;
  /** Short name for headings, e.g. "HDFC Bank". */
  name: string;
  /** The one-paragraph answer shown first (featured-snippet target). */
  answer: string;
  account: PwFormat[];
  card?: { label: string; formats: PwFormat[] };
  /** Where to find the ID the password uses, if any. */
  findId?: [string, string];
  /** Bank-specific reasons the password fails. */
  issues: [string, string][];
  faqs: [string, string][];
  /** Official page that states the rule, for the source note. */
  officialUrl?: string;
}

export const PASSWORDS: BankPassword[] = [
  {
    slug: "hdfc-bank",
    name: "HDFC Bank",
    answer:
      "The password for an HDFC Bank account statement PDF is your numeric Customer ID, with no spaces. HDFC Bank says this on its own NetBanking help page. HDFC credit card statements use a different password, which is usually built from your name and date of birth. The email that came with the statement states the exact rule.",
    account: [
      { rule: "Your numeric Customer ID", example: "Customer ID 123456789 → password 123456789", source: "bank" },
    ],
    card: {
      label: "HDFC credit card statements",
      formats: [
        { rule: "First four letters of your name in CAPITALS + your date and month of birth (DDMM)", example: "Amit Kumar, born 1 January 1990 → AMIT0101", source: "reported" },
      ],
    },
    findId: [
      "Where to find your HDFC Customer ID",
      "It’s printed on your cheque book and on the first page of your passbook, and it’s shown in the HDFC Bank app and NetBanking (it’s the ID you log in with). Customer care can also tell you after verifying you.",
    ],
    issues: [
      ["You typed your NetBanking password", "The PDF password is the Customer ID itself, not the password you log in with."],
      ["It’s a credit card statement", "Card statements don’t use the Customer ID. Use the name-and-birthday format in the card statement email instead."],
      ["Leading zeros or spaces", "Type the Customer ID exactly as printed, digits only, with no spaces."],
    ],
    faqs: [
      ["What is the password for an HDFC Bank statement PDF?", "Your numeric Customer ID, for savings, salary and current account statements, whether emailed or downloaded from NetBanking."],
      ["What is the password for an HDFC credit card statement?", "It’s most often reported as the first four letters of your name in capitals followed by your date and month of birth (DDMM), for example AMIT0101. Check the card statement email, which states the current rule."],
      ["How do I remove the password from an HDFC Bank statement?", "Upload it to our converter and type the Customer ID. We unlock it in your browser and turn it into Excel, CSV or Google Sheets. Or open it with the password and use Print → Save as PDF to save an unlocked copy."],
    ],
    officialUrl: "https://www.hdfc.bank.in/blogs/digital-banking/download-account-statement-via-netbanking",
  },
  {
    slug: "sbi",
    name: "SBI",
    answer:
      "For an SBI account statement sent by email, the password is usually the last five digits of your registered mobile number followed by your date of birth in DDMMYY format, for example 12345110290. Statements downloaded from YONO or other SBI channels can use a different rule, and SBI Card statements have their own. The email or download screen shows the exact rule.",
    account: [
      {
        rule: "Last 5 digits of your registered mobile number + date of birth (DDMMYY)",
        example: "Mobile ending 12345, born 11 February 1990 → 12345110290",
        source: "reported",
        note: "For emailed account statements. Other channels can differ.",
      },
    ],
    card: {
      label: "SBI Card (credit card) statements",
      formats: [
        { rule: "Built from your date of birth and the last four digits of your card", source: "reported", note: "SBI Card is a separate company and its exact order varies, so check the statement email." },
      ],
    },
    issues: [
      ["Your mobile number changed", "The password uses the mobile number SBI has on record. If you changed numbers but never updated it with SBI, use the old one, or update it at your branch."],
      ["Date of birth is DDMMYY", "Six digits, with no slashes: 11 February 1990 is 110290, not 11021990."],
      ["Statement from YONO or a branch", "These can use a different rule from emailed statements. The screen or email that gave you the file says which one."],
    ],
    faqs: [
      ["What is the password for an SBI bank statement PDF?", "For emailed statements it’s usually the last five digits of your registered mobile number plus your date of birth in DDMMYY, for example 12345110290 for a mobile ending 12345 and a birthday of 11 February 1990."],
      ["Why is my SBI statement password not working?", "Most often the mobile number on SBI’s records isn’t the one you use now, or the date was typed as DDMMYYYY instead of DDMMYY. Statements from YONO or a branch can also follow a different rule."],
      ["How do I open an SBI statement PDF without the password?", "You can’t, and you shouldn’t try for a statement that isn’t yours. For your own statement, enter the password in our converter once. It unlocks the file in your browser and gives you Excel, CSV or Google Sheets."],
    ],
  },
  {
    slug: "icici-bank",
    name: "ICICI Bank",
    answer:
      "ICICI Bank credit card statement PDFs open with the last four digits of your card number. ICICI states this on its own website, and the password can’t be changed. Account statements are most often reported to use the first four letters of your name plus your date and month of birth (DDMM), for example amit0101. Check the statement email for the exact rule.",
    account: [
      { rule: "First four letters of your name + date and month of birth (DDMM)", example: "Amit Kumar, born 1 January 1990 → amit0101", source: "reported", note: "Guides disagree on capitals. Our unlock tries both." },
    ],
    card: {
      label: "ICICI credit card statements",
      formats: [{ rule: "Last 4 digits of your credit card number", example: "Card ending 4321 → 4321", source: "bank", note: "ICICI says this can’t be customised or reset." }],
    },
    issues: [
      ["Capitals or lowercase?", "Guides disagree for account statements. You don’t need to guess: our unlock tries both cases automatically."],
      ["Name as on the account", "Use the first four letters of the first name exactly as ICICI has it, without spaces or initials."],
      ["Card and account statements differ", "A card statement only needs the last four card digits. Don’t add your name or birthday."],
    ],
    faqs: [
      ["What is the password for an ICICI credit card statement?", "The last four digits of your credit card number. ICICI says this on its own website and that it can’t be changed or reset."],
      ["What is the password for an ICICI Bank account statement?", "It’s most often reported as the first four letters of your name plus your birth date and month (DDMM). The email with the statement states the exact format."],
      ["Can I convert a locked ICICI statement to Excel?", "Yes. Upload it, enter the password once, and we unlock it in your browser and convert it, with the payee and UPI reference split out of the Transaction Remarks."],
    ],
    officialUrl: "https://www.icici.bank.in/personal-banking/blogs/card/credit-card/credit-card-statement-online",
  },
  {
    slug: "axis-bank",
    name: "Axis Bank",
    answer:
      "Axis Bank account statement PDFs are most often reported to open with the first four letters of your name in CAPITALS followed by your date and month of birth (DDMM), for example AMIT0101. Some statements use your Customer ID instead. Axis says its e-statements are password protected but doesn’t publish the rule, so the email that came with the statement is the authority.",
    account: [
      { rule: "First four letters of your name in CAPITALS + date and month of birth (DDMM)", example: "Amit Kumar, born 1 January 1990 → AMIT0101", source: "reported" },
      { rule: "Your Customer ID", source: "reported", note: "Some statement types use this instead. Try it if the first format fails." },
    ],
    card: {
      label: "Axis Bank credit card statements",
      formats: [{ rule: "First four letters of your name in CAPITALS + date and month of birth (DDMM)", example: "AMIT0101", source: "reported" }],
    },
    issues: [
      ["DDMM, not DDMMYYYY", "Only the day and month: 1 January is 0101."],
      ["Older than three years", "Axis says statements from the past three years are available in internet and mobile banking. Older ones come from a branch, often as a scanned copy, which our converter can read too."],
    ],
    faqs: [
      ["What is the password for an Axis Bank statement PDF?", "It’s most often reported as the first four letters of your name in capitals plus your birth date and month (DDMM), for example AMIT0101. Some statements use your Customer ID. Check the email that came with the statement."],
      ["What is the Axis Bank credit card statement password?", "Usually the same name-plus-birthday pattern: first four letters of your name in capitals plus DDMM. The card statement email states the exact rule."],
      ["Can I convert an Axis Bank statement to Excel?", "Yes. Upload the PDF, enter the password if it’s locked, and download a verified Excel, CSV or Google Sheet."],
    ],
  },
  {
    slug: "kotak-mahindra-bank",
    name: "Kotak Mahindra Bank",
    answer:
      "Kotak Mahindra Bank account statement PDFs are most often reported to open with your CRN (Customer Relationship Number). Kotak credit card statements are commonly reported to use the first four letters of your name plus your date and month of birth (DDMM) instead. The email that came with the statement states the exact rule.",
    account: [{ rule: "Your CRN (Customer Relationship Number)", example: "CRN 123456789 → 123456789", source: "reported" }],
    card: {
      label: "Kotak credit card statements",
      formats: [{ rule: "First four letters of your name + date and month of birth (DDMM)", example: "AMIT0101", source: "reported", note: "Reported sources differ for cards. Check the statement email." }],
    },
    findId: [
      "Where to find your Kotak CRN",
      "It’s the customer number you use to log in to Kotak net banking, shown in your profile in the Kotak app and on your account welcome letter. Customer care can also tell you after verifying you.",
    ],
    issues: [
      ["CRN vs account number", "The CRN identifies you as a customer and is different from your account number."],
      ["Card statement", "Card statements are reported to use a name-and-birthday rule, not the CRN."],
    ],
    faqs: [
      ["What is the password for a Kotak bank statement PDF?", "It’s most often reported as your CRN (Customer Relationship Number), the number you log in to Kotak net banking with."],
      ["What is the Kotak credit card statement password?", "It’s commonly reported as the first four letters of your name plus DDMM of your birth date. Check the card statement email for the current rule."],
      ["Can I convert a Kotak statement to Excel?", "Yes. Upload it, enter the CRN if it’s locked, and we unlock and convert it in one go."],
    ],
  },
  {
    slug: "bank-of-baroda",
    name: "Bank of Baroda",
    answer:
      "Bank of Baroda e-statement PDFs are most often reported to open with the first four letters of your name in lowercase followed by your date and month of birth (DDMM), for example amit0101. Bank of Baroda confirms its emailed statements are password protected, and the email itself explains the rule.",
    account: [{ rule: "First four letters of your name in lowercase + date and month of birth (DDMM)", example: "Amit Kumar, born 1 January 1990 → amit0101", source: "reported" }],
    card: {
      label: "Bank of Baroda credit card statements",
      formats: [{ rule: "First four letters of the name on the card in CAPITALS + DDMM", example: "AMIT0101", source: "reported" }],
    },
    issues: [
      ["Joint accounts", "Use the name and birth date of the holder the email was sent to. If that fails, ask the branch which holder’s details the password uses."],
      ["Lowercase for accounts, capitals for cards", "That’s what’s usually reported. You don’t need to remember: our unlock tries both cases."],
    ],
    faqs: [
      ["What is the password for a Bank of Baroda statement PDF?", "It’s most often reported as the first four letters of your name in lowercase plus your birth date and month (DDMM), for example amit0101. The email with the statement states the exact rule."],
      ["Why won’t my Bank of Baroda statement open?", "The most common causes are capitals vs lowercase, using a full birth year instead of DDMM, or a joint account using the other holder’s details."],
      ["Can I convert a Bank of Baroda statement to Excel?", "Yes, including scanned branch statements. Upload it, enter the password if asked, and download Excel, CSV or Google Sheets."],
    ],
  },
  {
    slug: "punjab-national-bank",
    name: "PNB",
    answer:
      "PNB doesn’t publish its statement password rule, and reported formats differ: most often your account number, sometimes your customer ID or your date of birth (DDMMYYYY). The email that delivered the statement states the rule for your account. Start with that, then try the formats below in order.",
    account: [
      { rule: "Your account number", example: "the full account number, digits only", source: "reported" },
      { rule: "Your customer ID", source: "reported" },
      { rule: "Your date of birth (DDMMYYYY)", example: "1 January 1990 → 01011990", source: "reported" },
    ],
    card: {
      label: "PNB credit card statements",
      formats: [{ rule: "First four letters of your name in lowercase + date of birth (DDMMYYYY)", example: "amit01011990", source: "reported" }],
    },
    issues: [
      ["Different rules are reported", "PNB’s rule seems to depend on how the statement was generated. The email or screen that gave you the file is the only reliable answer."],
      ["Not registered for e-statements", "In PNB Internet Banking, e-statements are under Other Services → Service Requests → New Requests → Email Statement Registration."],
    ],
    faqs: [
      ["What is the password for a PNB bank statement PDF?", "PNB doesn’t publish one rule. It’s most often reported as your account number, and sometimes as your customer ID or date of birth (DDMMYYYY). Check the email that came with the statement."],
      ["How do I get PNB statements by email?", "Register in PNB Internet Banking under Other Services → Service Requests → New Requests → Email Statement Registration, or ask your branch."],
      ["Can I convert a PNB statement to Excel?", "Yes. Upload the PDF, enter the password if it’s locked, and download a verified Excel, CSV or Google Sheet."],
    ],
  },
  {
    slug: "canara-bank",
    name: "Canara Bank",
    answer:
      "Canara Bank doesn’t publish its statement password rule. It’s most often reported to be your Customer ID, and sometimes your date of birth (DDMMYYYY) or your account number plus date of birth. The email or app screen that gave you the statement states the rule for your account.",
    account: [
      { rule: "Your Customer ID", source: "reported" },
      { rule: "Your date of birth (DDMMYYYY)", example: "9 June 1992 → 09061992", source: "reported" },
      { rule: "Your account number + date of birth (DDMMYYYY)", source: "reported" },
    ],
    issues: [
      ["Different rules are reported", "Emailed statements and statements from the Canara ai1 app or a branch may differ. Use the instructions that came with your file."],
    ],
    faqs: [
      ["What is the password for a Canara Bank statement PDF?", "It’s most often reported as your Customer ID, sometimes your date of birth (DDMMYYYY). The email with the statement states the exact rule."],
      ["Can I convert a Canara Bank statement to Excel?", "Yes. Upload the PDF, enter the password if it’s locked, and download Excel, CSV or Google Sheets, with every row checked against the balance."],
    ],
  },
  {
    slug: "union-bank-of-india",
    name: "Union Bank of India",
    answer:
      "Union Bank of India statement PDFs are most often reported to open with the first four letters of your name in CAPITALS followed by your date and month of birth (DDMM), for example AMIT2512 for Amit, born 25 December. The email that came with the statement states the exact rule.",
    account: [
      { rule: "First four letters of your name in CAPITALS + date and month of birth (DDMM)", example: "Amit Verma, born 25 December 1995 → AMIT2512", source: "reported" },
      { rule: "Same, with the full birth date (DDMMYYYY)", example: "AMIT25121995", source: "reported", note: "Try this if the short version fails." },
    ],
    issues: [
      ["Name as on the account", "Use the first four letters of your name exactly as Union Bank has it, without spaces or initials."],
      ["DDMM or DDMMYYYY", "Most reports say DDMM. If that fails, try the full year."],
    ],
    faqs: [
      ["What is the password for a Union Bank of India statement?", "It’s most often reported as the first four letters of your name in capitals plus your birth date and month (DDMM), for example AMIT2512."],
      ["Can I convert a Union Bank statement to Excel?", "Yes. Upload the PDF, enter the password if it’s locked, and download a verified spreadsheet."],
    ],
  },
];

export const passwordBySlug = (slug: string) => PASSWORDS.find((p) => p.slug === slug);

/** Reasons any bank's statement password fails. */
export const COMMON_ISSUES: [string, string][] = [
  ["Capitals vs lowercase", "AMIT0101 and amit0101 are different passwords. (Our unlock tries both for you.)"],
  ["Spaces and initials", "Use the first four letters of your name exactly as the bank has it on the account, with no spaces, dots or initials."],
  ["DDMM vs DDMMYY vs DDMMYYYY", "1 January 1990 can be 0101, 010190 or 01011990 depending on the bank. Use exactly the length the rule asks for."],
  ["Account vs credit card statement", "Most banks use one rule for accounts and another for cards."],
  ["Out-of-date details", "If the bank has an old mobile number or a wrong birth date on file, the password uses those. Update them at the branch."],
];
