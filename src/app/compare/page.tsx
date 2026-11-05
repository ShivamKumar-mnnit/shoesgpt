import type { Metadata } from "next";
import { CompareView } from "@/components/compare-view";

export const metadata: Metadata = { title: "Compare shoes side by side", robots: { index: false, follow: true } };

export default function ComparePage() {
  return <CompareView />;
}
