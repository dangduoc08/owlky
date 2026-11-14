"use client";

import {
  Alert,
  AlertTitle,
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@owlky/react";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { accountApi, authClient } from "./auth-client.js";

/* The account page (ADR-0071 § 4, 6): profile, MCP connection, personal access tokens, usage,
 * the marketing opt-in, sign-out and account deletion. Static shell; data from the session. */

interface Token {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}
interface AccountData {
  user: {
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
    providers: string[];
    marketingOptIn: boolean;
    marketingOptInAt: string | null;
  };
  tokens: Token[];
  usage: {
    lastUsedAt: string | null;
    tools: { tool: string; calls: number; lastUsedAt: string }[];
  };
}

interface Client {
  clientId: string;
  name: string;
  connectedAt: string | null;
}

const PROVIDERS: Record<string, string> = { github: "GitHub", google: "Google" };
const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en", { dateStyle: "medium" }) : "Never";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mb-12">
      <Typography variant="h5" component="h2" id={id} className="m-0 mb-3">
        {title}
      </Typography>
      {children}
    </section>
  );
}

export function Account() {
  const [data, setData] = useState<AccountData | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<Token | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [origin, setOrigin] = useState("https://owlky.com");
  const [clients, setClients] = useState<Client[]>([]);

  const load = useCallback(async () => {
    const { status, data: body } = await accountApi<AccountData>("account");
    if (status === 401) {
      window.location.assign("/sign-in/?next=/account/");
      return;
    }
    setData(body);
    const { data: connected } = await accountApi<{ clients: Client[] }>("clients");
    setClients(connected.clients ?? []);
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, [load]);

  async function createToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const days = String(form.get("expires"));
    const { status, data: body } = await accountApi<{ token?: string; message?: string }>(
      "tokens/create",
      {
        name: String(form.get("name") ?? ""),
        expiresInDays: days === "never" ? null : Number(days),
      },
    );
    if (status !== 200 || !body.token) {
      setProblem(body.message ?? "The token couldn't be created.");
      return;
    }
    setProblem(null);
    setCreated(body.token);
    (event.target as HTMLFormElement).reset();
    await load();
  }

  async function revoke(token: Token) {
    await accountApi("tokens/revoke", { id: token.id });
    setRevoking(null);
    await load();
  }

  async function disconnect(client: Client) {
    await accountApi("clients/disconnect", { clientId: client.clientId });
    await load();
  }

  async function setMarketing(optIn: boolean) {
    // The box follows the click at once; the stored value (and its date) comes back after.
    setData((current) =>
      current ? { ...current, user: { ...current.user, marketingOptIn: optIn } } : current,
    );
    await accountApi("marketing", { optIn });
    await load();
  }

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/");
  }

  async function deleteAccount() {
    const { error } = await authClient.deleteUser({});
    if (error) {
      setDeleting(false);
      setProblem(
        error.message ?? "Deleting needs a recent sign-in. Sign out, sign in again, then retry.",
      );
      return;
    }
    window.location.assign("/?account=deleted");
  }

  if (!data)
    return (
      <Typography color="textSecondary" aria-live="polite">
        Loading your account
      </Typography>
    );
  const { user, tokens, usage } = data;

  return (
    <div className="max-w-[48rem]">
      <header className="mb-10 flex flex-wrap items-center gap-4">
        <Avatar src={user.image ?? undefined} alt="">
          {user.name.slice(0, 1)}
        </Avatar>
        <div className="me-auto">
          <Typography variant="h3" component="h1" className="m-0">
            Your account
          </Typography>
          <Typography color="textSecondary" className="m-0">
            {`${user.name} · ${user.email}`}
          </Typography>
        </div>
        <Button variant="outlined" onClick={signOut}>
          Sign out
        </Button>
      </header>
      {problem ? (
        <Alert severity="error" className="mb-8" onClose={() => setProblem(null)}>
          {problem}
        </Alert>
      ) : null}

      <Section id="account-mcp" title="Connect an AI client">
        <Typography className="m-0 mb-3">
          Add the Owlky MCP server to your client by URL. Clients that support OAuth open this site
          to sign in; others send a personal access token.
        </Typography>
        <TextField label="MCP server URL" value={`${origin}/mcp`} readOnly fullWidth />
      </Section>

      <Section id="account-clients" title="Connected clients">
        {clients.length ? (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {clients.map((client) => (
              <li key={client.clientId} className="flex flex-wrap items-center gap-3">
                <Typography component="span" className="me-auto">
                  {`${client.name}, connected on ${date(client.connectedAt)}`}
                </Typography>
                <Button
                  size="sm"
                  color="error"
                  onClick={() => disconnect(client)}
                  aria-label={`Disconnect ${client.name}`}
                >
                  Disconnect
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <Typography color="textSecondary" className="m-0">
            No client has signed in through OAuth yet.
          </Typography>
        )}
      </Section>

      <Section id="account-tokens" title="Personal access tokens">
        <Typography className="m-0 mb-4">
          {
            "Send a token as `Authorization: Bearer <token>` from clients without OAuth. Owlky stores only a hash of it, so copy it when it appears."
          }
        </Typography>
        {created ? (
          <Alert severity="success" className="mb-4" onClose={() => setCreated(null)}>
            <AlertTitle>Copy your new token now</AlertTitle>
            <code data-site-new-token="" className="break-all">
              {created}
            </code>
          </Alert>
        ) : null}
        <form onSubmit={createToken} className="mb-6 flex flex-wrap items-start gap-3">
          <TextField name="name" label="Token name" required size="small" className="grow" />
          <TextField name="expires" label="Expires" select size="small" defaultValue="90">
            <option value="30">In 30 days</option>
            <option value="90">In 90 days</option>
            <option value="366">In a year</option>
            <option value="never">Never</option>
          </TextField>
          <Button type="submit" variant="contained">
            Create token
          </Button>
        </form>
        {tokens.length ? (
          <TableContainer aria-label="Personal access tokens" tabIndex={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell>Last used</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>
                    <span className="sr-only">Actions</span>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>{token.name}</TableCell>
                    <TableCell>
                      <code>{`${token.prefix}…`}</code>
                    </TableCell>
                    <TableCell>{date(token.lastUsedAt)}</TableCell>
                    <TableCell>{token.expiresAt ? date(token.expiresAt) : "Never"}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="sm"
                        color="error"
                        onClick={() => setRevoking(token)}
                        aria-label={`Revoke ${token.name}`}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="textSecondary" className="m-0">
            No tokens yet.
          </Typography>
        )}
      </Section>

      <Section id="account-usage" title="Usage">
        <Typography className="m-0 mb-4">
          {`Last MCP request: ${date(usage.lastUsedAt)}. Owlky counts calls per tool and never stores what you ask or what the tools answer.`}
        </Typography>
        {usage.tools.length ? (
          <TableContainer aria-label="Calls per tool" tabIndex={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tool</TableCell>
                  <TableCell align="right">Calls</TableCell>
                  <TableCell>Last call</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usage.tools.map((row) => (
                  <TableRow key={row.tool}>
                    <TableCell>
                      <code>{row.tool}</code>
                    </TableCell>
                    <TableCell align="right">{row.calls}</TableCell>
                    <TableCell>{date(row.lastUsedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Section>

      <Section id="account-email" title="Email">
        <FormControlLabel
          control={
            <Checkbox checked={user.marketingOptIn} onChange={(checked) => setMarketing(checked)} />
          }
          label="Email me about new Owlky features and offers"
        />
        <Typography variant="body2" color="textSecondary" className="m-0 mt-1">
          {user.marketingOptInAt
            ? `Last changed on ${date(user.marketingOptInAt)}.`
            : "Off unless you turn it on. Account email, such as security notices, doesn't depend on it."}
        </Typography>
      </Section>

      <Section id="account-profile" title="Profile">
        <Typography className="m-0">
          {`Signed in with ${user.providers.map((p) => PROVIDERS[p] ?? p).join(" and ")} since ${date(user.createdAt)}. Your name, email address and avatar come from the provider.`}
        </Typography>
      </Section>

      <Section id="account-delete" title="Delete your account">
        <Typography className="m-0 mb-4">
          Deleting removes your account, tokens and usage counts at once. MCP clients signed in with
          it stop working.
        </Typography>
        <Button variant="outlined" color="error" onClick={() => setDeleting(true)}>
          Delete account
        </Button>
      </Section>

      <Dialog open={revoking !== null} onOpenChange={(open) => (open ? null : setRevoking(null))}>
        <DialogTitle>Revoke this token?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Clients that use "${revoking?.name ?? ""}" lose access to the MCP server at once.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevoking(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => (revoking ? revoke(revoking) : null)}
          >
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleting} onOpenChange={(open) => setDeleting(open)}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your account, personal access tokens and usage counts are removed. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={deleteAccount}>
            Delete account
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
