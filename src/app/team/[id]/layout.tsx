import { Suspense } from "react";
import { Rail } from "@/components/Rail";

export default function TeamLayout({ children }: LayoutProps<"/team/[id]">) {
  return (
    <div className="min-h-screen md:pl-[56px]">
      {/* The rail reads the route's id, which is only known at request time. */}
      <Suspense fallback={<div className="fixed inset-y-0 left-0 hidden w-[56px] border-r border-border md:block" />}>
        <Rail />
      </Suspense>
      <main className="mx-auto max-w-[1440px] px-4 pt-6 pb-24 sm:px-8 md:pb-10">{children}</main>
    </div>
  );
}
