# UmmahWay Admin

## Environment Security

Client-side Vite variables must only contain public values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only variables must not use the `VITE_` prefix:

- `SUPABASE_SERVICE_ROLE_KEY`
- optional `SUPABASE_URL` if different from `VITE_SUPABASE_URL`

Never configure `VITE_SUPABASE_SERVICE_ROLE_KEY` locally or in Vercel. Vite
can expose `VITE_` variables to browser code.

## Account & Contact Setup

The admin console now includes self-service account pages for any signed-in
user. Super admins still see all management tabs, Jamaah timing editors see
their assigned timing tools, and regular users see account status plus contact
support.

Apply these SQL files in Supabase:

- `../italian-muslim-app/supabase/2026-07-01-premium-access.sql` for premium
  status and purchase event history.
- `sql/2026-07-20-support-contact-messages.sql` for contact form storage and
  rate limiting.

The `/api/contact` endpoint validates submissions, rate-limits by IP and email,
and stores messages addressed to `support@ummahway.com` in
`public.support_messages`. Email forwarding can be added once an email provider
transfer is approved and configured server-side.

## Country Domains, SEO, And Password Reset Redirects

The public website understands the domains currently owned for UmmahWay:

- `ummahway.com` is the global entry point and country chooser.
- `ummahway.eu` is also treated as a generic Europe entry point and country
  chooser.
- `ummahway.co.uk` serves United Kingdom masjids.
- `ummahway.de` serves Germany masjids.
- `ummahway.nl` serves Netherlands masjids.

`ummahway.app` is not configured because the registrar screenshot shows it as a
recommendation, not an owned domain.

Country-specific domains can still be extended with `VITE_COUNTRY_DOMAINS`.
Use semicolons between countries and commas between domains:

```env
VITE_COUNTRY_DOMAINS=uk=ummahway.co.uk,www.ummahway.co.uk;de=ummahway.de,www.ummahway.de;nl=ummahway.nl,www.ummahway.nl
```

The owned country domains above are already baked in, so this variable is only
needed when adding more country domains later. The website also detects
country-code top-level domains such as `.it`, `.de`, `.fr`, `.nl`, `.be`,
`.es`, `.ca`, and `.co.uk`. Generic domains such as `.com` and `.eu` show a
country selector so users can choose the country they want.

For Supabase password reset links, add every production reset URL in Supabase:

1. Open Supabase Dashboard.
2. Go to Authentication > URL Configuration.
3. Set Site URL to the main production domain.
4. Add each country URL under Redirect URLs, for example:

```text
https://ummahway.com/reset-password
https://www.ummahway.com/reset-password
https://ummahway.eu/reset-password
https://www.ummahway.eu/reset-password
https://ummahway.co.uk/reset-password
https://www.ummahway.co.uk/reset-password
https://ummahway.de/reset-password
https://www.ummahway.de/reset-password
https://ummahway.nl/reset-password
https://www.ummahway.nl/reset-password
http://localhost:5173/reset-password
```

For production, prefer exact redirect URLs instead of broad wildcards. The reset
password email template should link to `{{ .ConfirmationURL }}`.

## Supabase Signup Email Confirmation

The web app includes a dedicated email confirmation page at:

```text
https://ummahway.com/confirm-email
```

It also supports the Supabase-style alias:

```text
https://ummahway.com/auth/confirm
```

For the best onboarding flow from the mobile app, use a custom Supabase
confirmation email that sends the user to the confirmation page with the
Supabase token hash:

1. Open Supabase Dashboard.
2. Go to Authentication > Email Templates.
3. Open the Confirm signup template.
4. Use this link for the main confirm button:

```html
<a href="{{ .SiteURL }}/confirm-email?token_hash={{ .TokenHash }}&type=email">
  Confirm my email
</a>
```

Keep Site URL set to:

```text
https://ummahway.com
```

If you use the default `{{ .ConfirmationURL }}` instead of the custom token
hash link, add these confirmation URLs under Authentication > URL Configuration
> Redirect URLs as well:

```text
https://ummahway.com/confirm-email
https://www.ummahway.com/confirm-email
https://ummahway.eu/confirm-email
https://www.ummahway.eu/confirm-email
https://ummahway.co.uk/confirm-email
https://www.ummahway.co.uk/confirm-email
https://ummahway.de/confirm-email
https://www.ummahway.de/confirm-email
https://ummahway.nl/confirm-email
https://www.ummahway.nl/confirm-email
http://localhost:5173/confirm-email
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
