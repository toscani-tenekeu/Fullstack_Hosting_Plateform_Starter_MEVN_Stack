# Hosting Platform Frontend

Frontend for a web hosting platform boilerplate to start a hosting company.

Compatible with:

- Shared Hosting
- VPS Services

Backend part: [fullstack-hosting-plateform-express-mongodb-backend-part](https://github.com/toscani-tenekeu/fullstack-hosting-plateform-express-mongodb-backend-part)

## Screenshots

<table>
  <tr>
    <td width="50%">
      <strong>Home page</strong><br>
      <img src="docs/images/home-page.svg" alt="Home page screenshot">
    </td>
    <td width="50%">
      <strong>Pricing page</strong><br>
      <img src="docs/images/pricing-page.svg" alt="Pricing page screenshot">
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Customer dashboard overview</strong><br>
      <img src="docs/images/customer-dashboard-overview.svg" alt="Customer dashboard overview screenshot">
    </td>
    <td width="50%">
      <strong>Customer profile and invoices</strong><br>
      <img src="docs/images/customer-profile-and-invoices.svg" alt="Customer profile and invoices screenshot">
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Customer subscription details</strong><br>
      <img src="docs/images/customer-subscription-details.svg" alt="Customer subscription details screenshot">
    </td>
    <td width="50%">
      <strong>Customer credentials modal</strong><br>
      <img src="docs/images/customer-credentials-modal.svg" alt="Customer credentials modal screenshot">
    </td>
  </tr>
  <tr>
    <td width="50%">
      <strong>Customer invoice details</strong><br>
      <img src="docs/images/customer-invoice-details.svg" alt="Customer invoice details screenshot">
    </td>
    <td width="50%">
      <strong>Admin dashboard overview</strong><br>
      <img src="docs/images/admin-dashboard-overview.svg" alt="Admin dashboard overview screenshot">
    </td>
  </tr>
</table>

## Requirements

- Node.js minimum: `20.19.0`
- Node.js recommended: `24.16.0`
- npm recommended: `11.13.0`
- Running backend API
- Clerk publishable key

## Installation

```bash
git clone https://github.com/toscani-tenekeu/fullstack-hosting-plateform-vuejs-frontend-part.git
cd fullstack-hosting-plateform-vuejs-frontend-part
npm install
cp .env.example .env
```

## Environment

Set these values in `.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_BASE_URL=http://localhost:3000
```

Do not add `/api` to `VITE_API_BASE_URL`.

## Run

```bash
npm run dev
```

Open:

- `http://localhost:5173`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test:unit
npm run test:e2e
npm run lint
```

## What It Includes

- Public website
- Pricing pages
- Clerk sign-in and sign-up
- Customer dashboard
- Admin dashboard
- Subscription views
- Invoice views
- Profile management
- Order request flow

## Notes

- Backend base URL example: `http://localhost:3000`
- Default currency: `XAF`
- Payments are manual by default
- Replace the placeholder logo in `src/components/SiteHeader.vue` and `src/components/SiteFooter.vue`
