"use client";

import { Alert, Button, Link, Typography } from "@owlky/react";
import { useEffect, useState } from "react";
import { accountApi, authClient, safeNext } from "./auth-client.js";

/* The sign-in page: GitHub or Google. An MCP client's authorization request (signed query
 * parameters from the authorization server) rides along and resumes after sign-in. */

type Provider = "github" | "google";
const LABELS: Record<Provider, string> = { github: "GitHub", google: "Google" };

export function SignIn() {
  const [providers, setProviders] = useState<readonly Provider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("error"))
      setError("Sign-in didn't complete. Try again, or use the other provider.");
    accountApi<{ providers: Provider[] }>("providers").then(
      ({ data }) => setProviders(data.providers ?? []),
      () => setProviders([]),
    );
  }, []);

  async function signIn(provider: Provider) {
    setBusy(provider);
    setError(null);
    const query = new URLSearchParams(window.location.search);
    const next = safeNext(query.get("next"));
    const { error: failure } = await authClient.signIn.social({
      provider,
      callbackURL: next,
      errorCallbackURL: "/sign-in/?error=provider",
    });
    if (failure) {
      setBusy(null);
      setError(failure.message ?? "Sign-in failed. Try again.");
    }
  }

  return (
    <div className="max-w-[32rem]">
      <Typography variant="h3" component="h1" className="m-0 mb-3">
        Sign in to Owlky
      </Typography>
      <Typography color="textSecondary" className="m-0 mb-8">
        An account gives your AI coding tools access to the Owlky MCP server. The docs, the code
        samples and the packages stay free to use without one.
      </Typography>
      {error ? (
        <Alert severity="error" className="mb-6">
          {error}
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3" data-site-providers="">
        {(["github", "google"] as const).map((provider) => (
          <Button
            key={provider}
            variant="outlined"
            size="lg"
            fullWidth
            loading={busy === provider}
            disabled={providers === null || !providers.includes(provider) || busy !== null}
            onClick={() => signIn(provider)}
          >
            {`Continue with ${LABELS[provider]}`}
          </Button>
        ))}
      </div>
      {providers !== null && providers.length === 0 ? (
        <Alert severity="info" className="mt-6">
          Sign-in isn't configured on this server yet.
        </Alert>
      ) : null}
      <Typography variant="body2" color="textSecondary" className="m-0 mt-8">
        {"By signing in, you agree to the "}
        <Link href="/terms/">terms of use</Link>
        {" and the "}
        <Link href="/privacy/">privacy policy</Link>
        {
          ". We store your name, email address and avatar from the provider, and nothing else from it."
        }
      </Typography>
    </div>
  );
}
