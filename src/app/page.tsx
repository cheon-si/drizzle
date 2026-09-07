"use client";

import { useActionState } from "react";
import { Coffee } from "lucide-react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={action}
        className="w-full max-w-xs rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-cream-deep"
      >
        <div className="mb-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-coral/15 text-coral-deep">
            <Coffee size={28} />
          </div>
          <h1 className="mt-2 text-lg font-semibold">@42drizzle</h1>
        </div>
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          autoFocus
          required
          className="w-full rounded-xl border border-cream-deep bg-cream px-4 py-3 outline-none focus:border-latte"
        />
        {state?.error && (
          <p className="mt-2 text-sm text-coral-deep">{state.error}</p>
        )}
        <button
          disabled={pending}
          className="mt-4 w-full rounded-xl bg-coral py-3 font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          들어가기
        </button>
      </form>
    </main>
  );
}
