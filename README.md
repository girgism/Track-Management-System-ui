# Track Management UI

Angular front-end for the Track Management API. Users sign in, browse tracks, filter them by status, and open a track to see which DSPs it was distributed to and the status of each distribution.

## Features

- **Login**: email and password against the API; JWT kept in `localStorage`, expired tokens treated as signed out.
- **Track list**: title, artist name, genre, release date and status. Filter by status; the filter lives in the URL (`/tracks?status=Submitted`), so it survives reload and the Back button.
- **Track detail**: full track and artist information plus a table of DSP distributions (DSP, submitted date, status).
- **Route protection**: every route except `/login` requires a valid token. A 401 from the API signs the user out and returns them to the page they were on after signing in again.
- **Loading, empty and error states** on both views, with a retry button on errors.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Angular 21, standalone components, no NgModules |
| State | Signals and `rxResource` (no NgRx) |
| Forms | Reactive forms (login) |
| Styling | Tailwind CSS v4 via PostCSS |
| HTTP | `HttpClient` with `withFetch()` and a functional interceptor |
| Routing | Lazy-loaded routes, functional guard, component input binding |

## Prerequisites

- Node.js 20.19+, 22.12+ or 24+ (required by Angular 21)
- npm
- The Track Management API running locally

## Backend required

The UI does not work on its own. It needs the **Track Management API** (ASP.NET Core, .NET 10, EF Core, SQL Server) running locally.

### Setup checklist

1. Local SQL Server reachable with the connection string in the API's `appsettings.Development.json`.
2. Database created and seeded (3+ artists, 8+ tracks across genres and statuses, 3 DSPs, and the admin user below). Apply migrations if the API does not do it on startup:
   ```bash
   dotnet ef database update --project <Infrastructure project> --startup-project <API project>
   ```
3. API running over HTTPS (`dotnet run --project <API project> --launch-profile https`), with the dev certificate trusted: `dotnet dev-certs https --trust`.
4. CORS policy allowing the UI origin `http://localhost:4200`, with the `X-Total-Count` header exposed if you add pagination later.
5. JWT settings (issuer, audience, signing key, expiry) configured, and an admin user seeded with a hashed password.

### Endpoints the UI calls

| Method | Route | Auth | Used by |
|--------|-------|------|---------|
| `POST` | `/api/auth/login` | public | Login |
| `GET` | `/api/tracks?status=` | public (the UI sends the token anyway) | Track list |
| `GET` | `/api/tracks/{id}` | public (the UI sends the token anyway) | Track detail |

The other endpoints from the task (`/api/artists`, `POST /api/tracks`, `POST /api/tracks/{id}/distribute`, `PATCH /api/tracks/{id}/status`) are not called by the UI yet. Write endpoints require authentication.

### Response requirements

- **Track list items** include `artistName`, so the list needs no extra artist lookups.
- **Track detail** includes the `artist` object and a `distributions` array with `dspName`, `submittedAt` and `status`.
- **Enums are serialized as strings** (`JsonStringEnumConverter`), and the `status` query filter accepts those strings.
- **Login response** returns `accessToken` and `expiresAtUtc`.
- **Errors** come back as `ProblemDetails`; validation errors include an `errors` dictionary.

## Getting started

```bash
npm install
ng serve
```

Open `http://localhost:4200` and sign in.

### Login credentials

The app signs in against the admin user seeded by the API. Fill these in from your API's seed data and keep them out of any public repository:

| Field | Value |
|-------|-------|
| Email | `<ADMIN_EMAIL>` |
| Password | `<ADMIN_PASSWORD>` |

These are development credentials only. Change the password and the JWT signing key before deploying anywhere beyond your machine.

### Pointing the app at your API

The API base URL is set in one place, `src/app/core/api-config.ts`:

```ts
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://localhost:7074',
});
```

Change the value to match your API's launch profile (the port is in its `launchSettings.json`). The API must also allow `http://localhost:4200` in its CORS policy.

## Scripts

| Command | Purpose |
|---------|---------|
| `ng serve` | Dev server on port 4200 with live reload |
| `ng build` | Production build into `dist/track-management-ui` |
| `ng test` | Unit tests (not written yet; see Status) |

## API contract used by the UI

| Call | Used for |
|------|----------|
| `POST /api/auth/login` with `{ email, password }` returning `{ accessToken, tokenType, expiresAtUtc }` | Sign in |
| `GET /api/tracks?status={status}` returning an array of tracks with `artistName` | Track list |
| `GET /api/tracks/{id}` returning the track, its `artist` object and a `distributions` array | Track detail |

Enum values (track status, distribution status, genre) are expected as strings, such as `Draft`, `Submitted`, `Distributed`, `Pending`, `Live`, `Rejected`.

These shapes are defined in `src/app/core/models.ts`. If your API returns different field names or enum values, that file is the only place that needs to change, along with `src/app/core/labels.ts` for genre display names.

## Project structure

```
src/app/
  core/
    api-config.ts        API base URL token
    models.ts            API types and status values
    tracks-api.ts        Track endpoints
    http-error.ts        Turns API errors into readable messages
    labels.ts            Display names for genres
    auth/
      auth.service.ts    Login, logout, token storage and expiry
      auth.interceptor.ts  Adds the bearer token, handles 401
      auth.guard.ts      Redirects to /login when not signed in
  layout/
    shell.ts             Header, sign-out and page container
  features/
    login/               Login form
    tracks/
      track-list/        Filterable list
      track-detail/      Track info and distributions
  shared/
    status-badge.ts      Coloured status pill used by both views
  app.routes.ts          Routes and guards
  app.config.ts          Providers (router, HttpClient, interceptor)
```

## Design decisions

- **Filter in the URL.** The status filter is a query parameter read through component input binding, so the list is shareable and Back restores it. Unknown values are ignored and treated as "All".
- **`rxResource` for reads.** It gives loading, error and reload state without hand-written subscriptions; changing the filter or route id refetches automatically and cancels the in-flight request.
- **Token expiry is checked on every use**, not only at login, so an expired token never counts as signed in.
- **Safe redirects.** After login, `returnUrl` is only honoured for same-app paths, so a crafted link cannot send users to another site.
- **Token in `localStorage`.** This keeps the user signed in across reloads. The trade-off is exposure to XSS; the app renders no user HTML and Angular escapes all bindings. A production system could use short-lived tokens with an HttpOnly refresh cookie instead.
- **Colour is never the only signal.** Status badges always include the status text.

## Accessibility

Form fields have labels and inline errors, error messages use `role="alert"`, the result count is announced with `aria-live`, tables have captions and `scope` headers, and every list row has a focusable link, so the UI works with a keyboard alone.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| CORS error in the console | The API's CORS policy does not include `http://localhost:4200` |
| "Cannot reach the server" | The API is not running, or `API_BASE_URL` has the wrong port |
| Browser warns about the certificate | Trust the .NET dev certificate once: `dotnet dev-certs https --trust` |
| Signed out immediately after login | The token's `expiresAtUtc` is in the past, or the API and the machine clocks differ |
| List shows no tracks but the API has data | A `?status=` value in the URL filters everything out; choose "All statuses" |

## Status

The UI covers the login, track list and track detail views. Unit tests are deferred until the API tests are done. Possible next steps: a "Distribute" action (needs an endpoint that lists DSPs), pagination using the `X-Total-Count` header, and a search box.
