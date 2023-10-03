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
    const hash = document.querySelector("#curr-hash")?.innerHTML;
    const data = document.querySelector("#curr-data")?.innerHTML;
    if (data) {
      addData(`${hash} ~ ${data}`);
    }
  }, []);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <table className={s.table}>
      <thead>
        <tr>
          <th>Hash</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {show &&
          [...data].reverse().map((date) => {
            const [hash, time] = date.split(" ~ ");
            return (
              <tr key={date}>
                <td>{hash}</td>
                <td>{time}</td>
              </tr>
            );
          })}
      </tbody>
    </table>
    // <ol className={s.list}>
    //   {show && [...data].map((date) => <li key={date}>{date}</li>)}
    // </ol>
  );
}
