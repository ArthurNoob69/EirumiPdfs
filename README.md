# PDF Library

A beautiful, premium-feeling online PDF library application. Users can upload, manage, and share PDFs with a generated unique public URL. The application features a robust public PDF viewer and is designed specifically to be compatible with Vercel and scalable cloud storage.

## Features

- **Beautiful PDF Library:** Modern, responsive layout with thumbnails, view tracking, and sorting options.
- **Upload & Custom Names:** Drag-and-drop PDF upload with custom title assignment.
- **Public Viewer:** A full-featured PDF viewer with zoom, fullscreen, and pagination – accessible to anyone with the generated link (no login required).
- **Secure File Storage:** Directly integrates with S3-compatible persistent storage (AWS S3, Cloudflare R2, DigitalOcean Spaces, etc.).
- **Vercel Ready:** Uses Next.js App Router API routes, avoiding persistent Node.js processes, making it 100% compatible with Serverless or Edge environments.

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS + Radix UI Primitives + Lucide Icons
- **Database:** MongoDB (via Mongoose)
- **Storage:** Vercel Blob (`@vercel/blob`)
- **PDF Rendering:** `react-pdf`
- **Uploads:** `react-dropzone`
- **Data Fetching:** `swr`

## Installation

```bash
npm install
```

## Environment Variables

Copy the example environment file and fill in your details:

```bash
cp .env.example .env.local
```

### Required Variables:
- `MONGODB_URI`: Connection string for your MongoDB database (e.g., MongoDB Atlas).
- `NEXT_PUBLIC_APP_URL`: The base URL of your application (e.g., `http://localhost:3000`).
- `BLOB_READ_WRITE_TOKEN`: Your Vercel Blob token (automatically generated when linking Blob to your project).

## MongoDB Setup

1. Create a free cluster on MongoDB Atlas.
2. Go to Database Access and create a database user.
3. Go to Network Access and allow connections from anywhere (`0.0.0.0/0`).
4. Get your connection string, replace `<username>` and `<password>`, and set it as `MONGODB_URI`.

## Storage Setup (Vercel Blob)

1. When deploying to Vercel, go to the **Storage** tab.
2. Create a new **Vercel Blob** store.
3. Connect it to your project. Ensure you check the box to **"Add a read-write token env var to this connection"**.
4. This will automatically add the `BLOB_READ_WRITE_TOKEN` to your Vercel environment.
5. (Optional) For local development, copy the `BLOB_READ_WRITE_TOKEN` from Vercel to your `.env.local`.

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Production

Build and start the application locally:

```bash
npm run build
npm start
```

## Vercel Deployment

1. Push your code to a new GitHub repository.
2. Go to Vercel and import your repository.
3. Under **Environment Variables**, add all the variables from your `.env.local`.
4. Click **Deploy**.

## Security Considerations

- **Storage Security:** Since the public viewer loads PDFs directly from storage, the bucket objects must be publicly readable, or you must configure `lib/storage.ts` to generate presigned GET URLs instead of static public URLs.
- **Upload Restrictions:** The `/api/upload/presign` route currently validates content type, but you should configure your S3 bucket to only accept `.pdf` uploads if using presigned URLs.
- **Admin Protection:** In a real-world scenario, you should protect the root page (`/`), rename, and delete API routes with an authentication layer (e.g., NextAuth.js or Clerk) to prevent unauthorized library modifications.
