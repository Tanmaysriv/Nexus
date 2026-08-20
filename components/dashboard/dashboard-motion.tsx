"use client";

import { ReactNode } from "react";

export default function DashboardMotion({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {children}
    </div>
  );
}