import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      // Apple icons need a solid background, so this one keeps the light site colour.
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f0ea" }}>
        <svg width="160" height="160" viewBox="0 0 64 64">
          <circle cx="46" cy="15" r="12.5" fill="#ffffff" stroke="#121212" strokeWidth="2.5" />
          <path d="M46 10.4l4.4 3.2-1.7 5.2h-5.4l-1.7-5.2z" fill="#121212" />
          <path
            d="M3 50c0-5 1-12 3-16 1.2-2.4 4.4-2.6 5.8-.4 2.4 3.6 6.4 5.6 10.6 5.6 3 0 5.2-1.8 7-3.8 1.2-1.3 3.2-1.3 4.4 0l6.4 6.4c3 3 8.6 4 12.6 5 2.4.6 3.2 2.2 3.2 3.2v1H3z"
            fill="#ff5a1f"
            stroke="#121212"
            strokeWidth="1.5"
          />
          <path d="M2 51h53v3.5c0 1.4-1.1 2.5-2.5 2.5h-48A2.5 2.5 0 0 1 2 54.5z" fill="#d7f75b" stroke="#121212" strokeWidth="1.5" />
          <path d="M10 57v3.5M22 57v3.5M38 57v3.5M48 57v3.5" stroke="#121212" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
