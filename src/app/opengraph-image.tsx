import { ImageResponse } from "next/og";

export const alt = "BankStatementToSheets — bank statements to Excel & Google Sheets, verified to the cent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROWS = [
  ["2026-10-02", "Gusto payroll", "", "3,120.00", "5,486.88"],
  ["2026-10-03", "Zelle to Maria Lopez", "450.00", "", "5,036.88"],
  ["2026-10-06", "Comcast Xfinity", "89.99", "", "4,946.89"],
  ["2026-10-14", "Stripe payout", "", "1,840.50", "6,787.39"],
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f7f6f1", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#0d1512" />
            <path d="M8 11h16M8 16h16M8 21h9M14 8v16" stroke="#f7f6f1" strokeOpacity=".35" strokeWidth="1.5" />
            <path d="M18.5 21.5l2.5 2.5 4.5-5.5" stroke="#c8f25a" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#0d1512" }}>
            BankStatement<span style={{ color: "#66746d" }}>To</span>Sheets
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 44, fontSize: 68, fontWeight: 700, lineHeight: 1.05, color: "#0d1512", letterSpacing: -2 }}>
          <span>Bank statements to Excel</span>
          <span style={{ color: "#0b6e4f" }}>verified to the cent.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40, background: "#fff", border: "2px solid #d2d1c6", borderRadius: 20, overflow: "hidden" }}>
          {ROWS.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 24, padding: "12px 24px", borderTop: i ? "1px solid #e4e3da" : "none", color: "#33413b" }}>
              <span style={{ width: 170, color: "#66746d" }}>{r[0]}</span>
              <span style={{ flex: 1, fontWeight: 600, color: "#0d1512" }}>{r[1]}</span>
              <span style={{ width: 150, textAlign: "right" }}>{r[2]}</span>
              <span style={{ width: 150, textAlign: "right", color: "#0b6e4f" }}>{r[3]}</span>
              <span style={{ width: 170, textAlign: "right" }}>{r[4]}</span>
              <svg style={{ marginLeft: 24 }} width="30" height="30" viewBox="0 0 30 30">
                <circle cx="15" cy="15" r="15" fill="#0b6e4f" />
                <path d="M9 15.5l4 4 8-9" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
