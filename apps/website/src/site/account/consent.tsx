"use client";

import { Alert, Button, Typography } from "@owlky/react";
import { useEffect, useState } from "react";
import { authClient } from "./auth-client.js";

/* The OAuth consent step: an MCP client registered itself and asks to act for the signed-in
 * person. The authorization server sends the browser here with a signed copy of the request;
 * the answer goes back through `oauth2.consent` and the browser returns to the client. */

const SCOPES: Record<string, string> = {
  mcp: "Use the Owlky MCP server with your account",
  openid: "Know who you are on Owlky",
  profile: "See your name and avatar",
  email: "See your email address",
  offline_access: "Stay connected until you revoke it",
};

export function Consent() {
  const [client, setClient] = useState<{ name: string; uri: string | undefined } | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setScopes((query.get("scope") ?? "").split(" ").filter(Boolean));
    const clientId = query.get("client_id");
    if (!clientId) {
      setError("This page is part of an MCP client's sign-in. Start again from the client.");
      return;
    }
    authClient.oauth2.publicClient({ query: { client_id: clientId } }).then(({ data }) => {
      const found = data as { client_name?: string; client_uri?: string } | null;
      setClient({ name: found?.client_name || "An MCP client", uri: found?.client_uri });
    });
  }, []);

  async function answer(accept: boolean) {
    setBusy(true);
    const { error: failure } = await authClient.oauth2.consent({ accept });
    if (failure) {
      setBusy(false);
      setError(failure.message ?? "The answer couldn't be sent. Start again from the client.");
    }
  }

  return (
    <div className="max-w-[32rem]">
      <Typography variant="h3" component="h1" className="m-0 mb-3">
        Connect an AI client
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {client && !error ? (
        <>
          <Typography className="m-0 mb-4">
            <strong>{client.name}</strong>
            {" wants to:"}
          </Typography>
          <ul className="m-0 mb-6 ps-6">
            {scopes.map((scope) => (
              <li key={scope}>
                <Typography component="span">{SCOPES[scope] ?? scope}</Typography>
              </li>
            ))}
          </ul>
          <Typography variant="body2" color="textSecondary" className="m-0 mb-6">
            Only allow clients you started yourself. You can disconnect it at any time on your
            account page.
          </Typography>
          <div className="flex gap-3">
            <Button variant="contained" disabled={busy} onClick={() => answer(true)}>
              Allow
            </Button>
            <Button variant="outlined" disabled={busy} onClick={() => answer(false)}>
              Deny
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
