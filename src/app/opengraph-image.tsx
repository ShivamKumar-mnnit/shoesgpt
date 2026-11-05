import { ImageResponse } from "next/og";

export const alt = "shoesGPT: compare shoe prices across every store";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SHOE =
  "M8 40c0-5 1-12 3-16 1.2-2.4 4.4-2.6 5.8-.4 2.4 3.6 6.4 5.6 10.6 5.6 3 0 5.2-1.8 7-3.8 1.2-1.3 3.2-1.3 4.4 0l6.4 6.4c3 3 8.6 4 12.6 5 2.4.6 3.2 2.2 3.2 3.2v1H8z";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f3f0ea", padding: 70, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 40, color: "#121212" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" style={{ marginRight: 12 }}>
              <path d="M12 0c.6 6.3 5.7 11.4 12 12-6.3.6-11.4 5.7-12 12-.6-6.3-5.7-11.4-12-12C6.3 11.4 11.4 6.3 12 0Z" fill="#ff5a1f" />
            </svg>
            <span>shoes</span>
            <span style={{ fontWeight: 900 }}>GPT</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 900, lineHeight: 0.95, color: "#121212", letterSpacing: -3 }}>
            <span>Same shoe.</span>
            <span>Every store.</span>
            <span style={{ display: "flex" }}>
              <span style={{ background: "#d7f75b", padding: "0 12px" }}>Cheapest first.</span>
            </span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#3a3a3a" }}>
            Amazon, Flipkart, Myntra, Zappos, Walmart, Zalando, Nike and more
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 420 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 400, height: 400, borderRadius: 200, background: "#121212" }}>
            <svg width="300" height="300" viewBox="0 0 64 64">
              <path d={SHOE} fill="#ff5a1f" />
              <path d="M7 41h53v3.5c0 1.4-1.1 2.5-2.5 2.5h-48A2.5 2.5 0 0 1 7 44.5z" fill="#d7f75b" />
            </svg>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
