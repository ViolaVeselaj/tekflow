# TekFlow

TekFlow is an invoice delivery and workflow management MVP built for managing client invoices through a simple operational workflow: Created → PickedUp → Delivered → Accepted / PartiallyAccepted / Rejected.

The current MVP supports one Courier workflow and is designed around role-based actions for Admin, Finance, Courier, and Client users.

## Roles

### Admin
- manage and view invoices
- manage clients
- view deliveries
- view PostalCost
- export invoices as PDF and Excel
- change password

### Finance
- manage invoices
- manage clients
- export invoices as PDF and Excel
- change password
- no PostalCost delivery view

### Courier
- view available invoices
- pick up invoices
- mark deliveries as delivered
- change password

### Client
- view own invoices
- accept, partially accept, or reject delivered invoices
- provide comments when required
- change password

## Main MVP features

- JWT authentication
- role-based authorization
- clients CRUD where supported
- safe client delete rules
- invoice create/read/update/delete rules
- Courier pickup and delivery workflow
- client invoice response workflow
- PostalCost visibility restricted to Admin
- PDF invoice export
- Excel invoice export
- Change Password
- Forgot Password
- Reset Password
- password reset tokens with expiration and one-time use
- responsive role-based UI

  ## Database schema

TekFlow currently uses five main PostgreSQL tables.

| Table | Purpose | Main relationships |
|---|---|---|
| `Users` | Stores application users and authentication information for Admin, Finance, Courier, and Client roles. | A Client-role user may be linked to a `Client`. A Courier user may be linked to many `Deliveries`. A user may have multiple `PasswordResetTokens`. |
| `Clients` | Stores client/company information such as name, address, city, contact name, and phone. | One Client can have many `Invoices`. A Client may have one linked Client-role `User`. |
| `Invoices` | Stores invoices and their workflow status. | Each Invoice belongs to one `Client`. An Invoice may have one `Delivery`. |
| `Deliveries` | Stores invoice pickup and delivery information. | Each Delivery belongs to one `Invoice` and records the Courier `User` responsible for the pickup/delivery. |
| `PasswordResetTokens` | Stores hashed password-reset tokens used by the Forgot/Reset Password flow. | Each reset token belongs to one `User`. A User may have multiple historical reset-token records. |

### Main relationships

- `Client 1 → many Invoices`
- `Client 1 → 0..1 Client User`
- `Invoice 1 → 0..1 Delivery`
- `Courier User 1 → many Deliveries`
- `User 1 → many PasswordResetTokens`
  
## Project structure

```text
TekFlow/
├── backend/
├── frontend/
├── docker-compose.yml
├── README.md
```

## Tech stack

### Backend
- .NET 10
- ASP.NET Core Web API
- Entity Framework Core 10
- PostgreSQL
- Npgsql
- JWT Bearer authentication
- ASP.NET Core PasswordHasher
- QuestPDF
- ClosedXML

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Axios
- Lucide React

### Infrastructure
- Docker Compose
- PostgreSQL 17

## Prerequisites

Before running TekFlow locally, install:

- .NET 10 SDK
- Node.js and npm
- Docker Desktop or a compatible Docker engine

## Database setup

This project uses PostgreSQL 17 through Docker.

Docker Compose maps:
- host port `5433` → container port `5432`
- database: `tekflow_db`

The credentials in `docker-compose.yml` are DEVELOPMENT-ONLY credentials.

From the repository root:

```bash
docker compose up -d
```

You can verify the container is running with:

```bash
docker ps
```

## EF Core migrations

Migrations are already included in source control and should be applied as part of local setup.

From `backend/`:

```bash
dotnet ef database update
```

The current migrations include password reset token storage.

Do not create a new migration during normal local setup unless you are intentionally changing the database model.

## Backend setup

From `backend/`:

```bash
dotnet restore
dotnet ef database update
dotnet run
```

The backend is configured for local development and is expected to run at:

```text
http://localhost:5188
```

## Frontend setup

From `frontend/`:

```bash
npm install
npm run dev
```

The frontend is expected to run at:

```text
http://localhost:5173
```

The backend CORS configuration is set for this local frontend origin.

## Development / Demo Accounts

These credentials are for local development/demo use only and must not be used in production.

### Admin
- Email: `admin@tekflow.local`
- Password: `TekFlow123!`

### Finance
- Email: `finance@tekflow.local`
- Password: `TekFlow123!`

### Courier
- Email: `courier@tekflow.local`
- Password: `TekFlow123!`

### Client
- Email: `arta@abccompany.com`
- Password: `Client123!`

## Password reset development behavior

The current development behavior is:

- the Forgot Password endpoint generates a reset link
- in Development, the reset URL is written to backend logs in the form:

```text
DEV PASSWORD RESET LINK: http://localhost:5173/reset-password?token=...
```

- production email delivery is not configured yet
- reset links are not returned by the API
- reset token hashes are stored in the database
- reset tokens expire after 30 minutes
- reset tokens are one-time use

## API workflow overview

1. Admin/Finance creates a Client
2. Admin/Finance creates an Invoice
3. Courier sees the Created invoice
4. Courier picks it up
5. Courier marks it Delivered
6. Client views their own invoice
7. Client responds with:
   - Accepted
   - PartiallyAccepted
   - Rejected

Partial or rejected responses require a comment. Workflow status is controlled by backend business rules.

## Security notes

- passwords are stored hashed
- JWT is used for authentication
- reset tokens are stored hashed
- reset links expire
- reset links are one-time use
- unknown forgot-password emails receive the same generic response
- local credentials and configuration are development-only
- production secrets should be stored in environment variables or user secrets

## Build verification

Optional validation commands:

### Backend

```bash
dotnet build --nologo
```

### Frontend

```bash
npm run build
```

## Current MVP Scope

- one Courier workflow
- no multi-courier assignment or dispatch
- no GPS or route optimization
- no real-time SignalR updates
- production email delivery is not yet configured

## Git hygiene

- do not add generated files
- do not modify `.gitignore` unless a real documentation-related omission is found
- do not include local secrets, `.env` files, build folders, or generated output in the repository

