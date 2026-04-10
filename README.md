# Euclid Insights

Astro site for Euclid Insights articles and category pages.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start local development server |
| `npm run build` | Build the production bundle |
| `npm run preview` | Run the built site locally |

## Microsoft SSO Preview Access

Preview article routes under `/preview/[token]` are protected by Microsoft SSO.
Published article routes remain prerendered, while preview routes are server-rendered so draft content is not emitted into the static build output.

### Setup

1. Copy `.env.example` to `.env`.
2. Set `MICROSOFT_CLIENT_SECRET`.
3. Set `MICROSOFT_SESSION_SECRET` to a long random string.
4. In Azure App Registration, add the redirect URI:
   `https://insights.euclidinnovations.com/auth/microsoft/callback`
5. Optionally tighten access with `MICROSOFT_ALLOWED_EMAILS` or `MICROSOFT_ALLOWED_EMAIL_DOMAINS`.

### Azure values currently expected

| Variable | Value |
| :--- | :--- |
| `MICROSOFT_CLIENT_ID` | `da987626-0952-4a64-9fc1-bf50159b2950` |
| `MICROSOFT_TENANT_ID` | `8d2ffdf3-3715-4309-a394-1e123d08feca` |
| `MICROSOFT_ALLOWED_TENANT_ID` | `8d2ffdf3-3715-4309-a394-1e123d08feca` |
