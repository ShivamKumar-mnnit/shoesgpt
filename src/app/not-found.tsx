import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-5 pt-24 text-center">
      <div>
        <p className="text-[10rem] font-black leading-none tracking-tighter text-outline">404</p>
        <p className="mt-2 text-xl font-semibold">This pair walked off.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-paper">Back home</Link>
      </div>
    </div>
  );
}
