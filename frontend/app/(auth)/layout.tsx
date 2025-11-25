import type React from "react";
import { getCurrentUser } from "@/lib/actions/users.action";
import { redirect } from "next/navigation";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  // Redirect authenticated users to home page
  const currentUser = await getCurrentUser();
  if (currentUser) return redirect("/");
  return (
    <div className="flex min-h-screen bg-background">
      <section className="hidden w-1/2 items-center justify-center bg-slate-900 blueprint-grid lg:flex xl:w-2/5">
        <div className="flex max-h-[600px] max-w-[450px] flex-col justify-center space-y-16">
          {/* Logo area */}
          <div className="space-y-2">
            <div className="text-4xl font-bold text-slate-200 tracking-tight">
              Architect
            </div>
            <p className="text-sm text-slate-400">
              Professional Floorplan Design Platform
            </p>
          </div>

          {/* Testimonial/Welcome section */}
          <div className="space-y-4 border-l-2 border-slate-700 pl-6">
            <p className="text-lg font-light text-slate-100 leading-relaxed">
              "The precision and clarity this platform brings to our
              architectural workflow is unmatched. Design faster, collaborate
              better."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-slate-700"></div>
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Alex Morgan
                </p>
                <p className="text-xs text-slate-400">Senior Architect</p>
              </div>
            </div>
          </div>

          {/* Design specs */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Features</div>
              <ul className="text-slate-300 space-y-1">
                <li className="text-xs">• Real-time collaboration</li>
                <li className="text-xs">• Precision tools</li>
                <li className="text-xs">• Cloud storage</li>
              </ul>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Security</div>
              <ul className="text-slate-300 space-y-1">
                <li className="text-xs">• End-to-end encryption</li>
                <li className="text-xs">• SOC 2 compliant</li>
                <li className="text-xs">• Version history</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-10 lg:px-10">
        {/* Mobile logo */}
        <div className="mb-12 lg:hidden text-center">
          <div className="text-2xl font-bold text-slate-900">Architect</div>
          <p className="text-xs text-slate-500 mt-1">Design Platform</p>
        </div>

        {/* Form container with max-width */}
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
};

export default AuthLayout;
