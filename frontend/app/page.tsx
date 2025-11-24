import Generator from "../components/Generator";
import Head from "next/head";
export default function Home() {
  return (
    <>
      <Head>
        <title>Floorplan Generator</title>
      </Head>
      <main>
        <Generator />
      </main>
    </>
  );
}
