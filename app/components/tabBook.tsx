"use client";
import "./tabBook.css";

export default function TabBook({ children }: { children: React.ReactNode }) {
  return (
    <div className="tab-book w-full h-full min-h-[414px] flex flex-col">
      <div className="flex flex-row h-full grow-1">{children}</div>
    </div>
  );
}
