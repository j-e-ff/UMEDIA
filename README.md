This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Cloudflare R2 File Upload Setup

This project includes a file upload component that uploads images to Cloudflare R2. To set this up:

1. Create a `.env.local` file in the root directory with the following variables:

```env
# Cloudflare R2 Configuration (Server-side)
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=umedia-images

# Cloudflare R2 Configuration (Client-side - for public URLs)
NEXT_PUBLIC_R2_ACCOUNT_ID=c2923f473ee042d74ad1e1e864759842
NEXT_PUBLIC_R2_BUCKET_NAME=umedia-images
```

2. Get your R2 credentials from the Cloudflare dashboard
3. The public domain for your bucket is automatically constructed using your account ID: `https://c2923f473ee042d74ad1e1e864759842.r2.cloudflarestorage.com/umedia-images/`
4. Make sure your bucket is configured for public access if you want to display uploaded images

The file upload component is located at `app/components/FileUpload.tsx` and the API route at `app/api/upload-url/route.ts`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
