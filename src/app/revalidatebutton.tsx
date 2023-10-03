"use client";
import s from "./page.module.css";

export default function RevalidateButton() {
  return (
    <button
      className={s.button}
      onClick={() => {
        fetch("/api/revalidate", { method: "POST" });
        setTimeout(() => location.reload(), 1000);
      }}
    >
      Revalidate
    </button>
  );
}
