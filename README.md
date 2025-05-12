# Admin Dashboard

A modern admin dashboard for managing bookings, built with Next.js, TypeScript, and Supabase.

## Features

- Real-time booking management
- Status and payment status updates
- Responsive design for mobile and desktop
- Dark mode support
- Automatic polling for new bookings
- Toast notifications for updates

## Tech Stack

- Next.js 14
- TypeScript
- Supabase
- Tailwind CSS
- shadcn/ui components

## Getting Started

1. Clone the repository:
```bash
git clone <your-repo-url>
cd admin-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The following environment variables are required:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment

This project is configured for deployment on Netlify. The build settings are:

- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 18.x

## License

MIT