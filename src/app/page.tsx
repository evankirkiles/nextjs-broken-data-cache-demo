import styles from "./page.module.css";
import RevalidateButton from "@/app/revalidatebutton";
import PreviousData from "@/app/previousdatas";

export default async function Home() {
  const currTime = await fetch(
    "https://worldtimeapi.org/api/timezone/America/New_York",
    { next: { tags: ["time"] } }
  );
  const data = await currTime.json();
  const output = new Date(data.datetime).toLocaleString();

  return (
    <main className={styles.main}>
      <p>Data last fetched:</p>
      <code id="curr-data">{output}</code>
      <RevalidateButton />
      <p className={styles.nextsection}>Previous fetches:</p>
      <PreviousData />
    </main>
  );
}
