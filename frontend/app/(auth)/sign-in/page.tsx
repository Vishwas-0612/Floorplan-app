import AuthForm from "@/components/AuthFrom";

function SignIn() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Access your projects.
        </h1>
        <p className="text-sm text-slate-600">
          Enter your credentials to continue planning and designing.
        </p>
      </div>

      {/* Auth form */}
      <AuthForm type="sign-in" />
    </div>
  );
}

export default SignIn;
