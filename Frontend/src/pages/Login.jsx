import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import careConnectLogo from "../assets/care-connect.png";
import { login } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [showRecoveryMessage, setShowRecoveryMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Username / Email is required.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    login(email.trim(), password)
      .then((result) => {
        localStorage.setItem("accessToken", result.data.token);
        localStorage.setItem("user", JSON.stringify(result.data.user));
        toast.success("Welcome back");
        navigate("/worklist");
      })
      .catch((error) => {
        setErrors({ form: error.message || "Unable to sign in." });
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#EEF4FF] via-[#F3F7FF] to-[#EAF1FF] px-4 py-8">
      {/* Decorative background layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(#C9DCFF 1px, transparent 1px), linear-gradient(90deg, #C9DCFF 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black 40%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-44 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-[#DCE8FF] to-[#C7DBFF] blur-2xl sm:-left-32 sm:-top-36"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-40 h-[31rem] w-[31rem] rounded-full bg-gradient-to-tr from-[#DCE8FF] to-[#BFD6FF] blur-2xl sm:-bottom-40 sm:-right-32"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-3xl"
      />

      <section className="relative w-full max-w-[420px] rounded-[28px] border border-white bg-white/90 px-5 py-7 shadow-[0_1px_1px_rgba(61,96,153,0.06),0_24px_60px_-12px_rgba(37,60,116,0.22)] backdrop-blur-xl sm:px-10 sm:py-10">
        {/* Top accent bar */}
        <div
          aria-hidden="true"
          className="absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent sm:inset-x-14"
        />

        <div className="mb-7 text-center sm:mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img
              src={careConnectLogo}
              alt="CareConnect"
              className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px]"
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-[22px]">
            CareConnect
          </h1>
          <p className="mt-1 text-sm font-medium text-blue-600">
            Post-Discharge Follow-Up
          </p>

          <div className="mx-auto mt-4 flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            <ShieldCheck size={13} className="text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">
              Secure coordinator sign-in
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Username / Email
            </label>
            <div className="relative">
              <Mail
                size={17}
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  errors.email ? "text-red-400" : "text-slate-400"
                }`}
              />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="name@hospital.org"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`h-12 w-full rounded-xl border bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                  errors.email ? "border-red-300" : "border-slate-200"
                }`}
              />
            </div>
            {errors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-xs font-medium text-red-600"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-2">
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowRecoveryMessage(true)}
                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 focus:outline-none focus-visible:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock
                size={17}
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  errors.password ? "text-red-400" : "text-slate-400"
                }`}
              />
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder="Password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                className={`h-12 w-full rounded-xl border bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${
                  errors.password ? "border-red-300" : "border-slate-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={
                  isPasswordVisible ? "Hide password" : "Show password"
                }
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:text-blue-600"
              >
                {isPasswordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="mt-1.5 text-xs font-medium text-red-600"
              >
                {errors.password}
              </p>
            )}
          </div>

          {errors.form && (
            <p
              role="alert"
              className="mb-4 mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                !
              </span>
              {errors.form}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#3B7AFF] to-[#2563EB] text-sm font-semibold text-white shadow-[0_10px_20px_-6px_rgba(37,99,235,0.5)] transition-all hover:shadow-[0_12px_24px_-6px_rgba(37,99,235,0.55)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 active:scale-[0.99] active:from-[#2E6FE8] active:to-[#1D4FCB] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          {showRecoveryMessage ? (
            <p
              role="status"
              className="mx-auto max-w-xs text-xs leading-5 text-slate-500"
            >
              Please contact your CareConnect administrator to reset your
              password or restore account access.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Having trouble signing in?{" "}
              <button
                type="button"
                onClick={() => setShowRecoveryMessage(true)}
                className="font-medium text-blue-600 transition-colors hover:text-blue-700 focus:outline-none focus-visible:underline"
              >
                Get help
              </button>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default Login;
