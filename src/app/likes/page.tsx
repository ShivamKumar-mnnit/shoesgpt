import type { Metadata } from "next";
import { LikesView } from "@/components/likes-view";

export const metadata: Metadata = { title: "Liked shoes", robots: { index: false, follow: true } };

export default function LikesPage() {
  return <LikesView />;
}
