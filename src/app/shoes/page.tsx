import { Suspense } from "react";
import type { Metadata } from "next";
import { Browse } from "@/components/browse";

export const metadata: Metadata = {
  title: "Search & Compare Shoe Prices Across Stores",
  description: "Search any shoe, brand or sport and compare live prices across Amazon, Flipkart, Myntra, Zappos, Walmart, Zalando, Nike and more.",
  alternates: { canonical: "/shoes" },
};

export default function ShoesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Browse />
    </Suspense>
  );
}
