import Link from "next/link";

export default function TeamNotFound() {
  return (
    <div className="card mx-auto mt-16 max-w-[520px] p-8">
      <h1 className="text-[20px] font-semibold">No team with that ID</h1>
      <p className="mt-2 text-[14px] text-soft">
        FPL has no entry under this number. Check the digits after /entry/ in the address of your Points page.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-text px-5 py-2 text-[14px] font-semibold text-ground">
        Try another ID
      </Link>
    </div>
  );
}
