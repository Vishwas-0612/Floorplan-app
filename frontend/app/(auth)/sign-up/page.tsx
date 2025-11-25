import AuthForm from "@/components/AuthFrom";

function SignUp() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Start designing.
        </h1>
        <p className="text-sm text-slate-600">
          Create an account to build your first professional floorplan.
        </p>
      </div>

      {/* Auth form */}
      <AuthForm type="sign-up" />
    </div>
  );
}

export default SignUp;
