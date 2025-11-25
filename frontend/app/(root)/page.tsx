// import Generator from "../../components/Generator";

// export default function Home() {
//   return (
//     // <main className="min-h-screen bg-zinc-50">
//     //   <Generator />
//     // </main>
//     <div className="p-4">
//       <h1>Hello World</h1>
//     </div>
//   );
// }

import Generator from "@/components/Generator";
import { getCurrentUser } from "@/lib/actions/users.action";
import { redirect } from "next/navigation";


const Home = async ({ children }: { children: React.ReactNode }) => {
  const currentUser = await getCurrentUser();

  if (!currentUser) return redirect("/sign-in");

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* <Generator /> */}
      {children}
    </main>
  );
};

export default Home;

