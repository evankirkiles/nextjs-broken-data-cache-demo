"use client";
import s from "./page.module.css";

import { useEffect, useReducer, useState } from "react";

export default function PreviousData() {
  const [show, setShow] = useState(false);
  const [data, addData] = useReducer(
    (_: Set<string>, data: string) => {
      const newSet = new Set(_);
      newSet.add(data);
      localStorage.setItem("data-persistor", JSON.stringify([...newSet]));
      return newSet;
    },
    [] as string[],
    (init) => {
      if (typeof window !== "undefined") {
        init = JSON.parse(
          localStorage.getItem("data-persistor") || "[]"
        ) as string[];
      }
      return new Set(init);
    }
  );
  // on load, load in curr-data to localstorage
  useEffect(() => {
    const data = document.querySelector("#curr-data")?.innerHTML;
    if (data) {
      addData(data);
    }
  }, []);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <ol className={s.list}>
      {show && [...data].map((date) => <li key={date}>{date}</li>)}
    </ol>
  );
}
