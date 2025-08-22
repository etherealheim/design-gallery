# 🎨 Design Gallery

A clean gallery app for your design assets. Drag, drop, search, and let AI tag your stuff automatically.

## Quick Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/etherealheim/v0-ui-design-gallery.git
   cd v0-ui-design-gallery
   pnpm install
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL scripts from the `scripts/` folder in your Supabase SQL editor (in order)
   - Grab your project URL and keys from Settings → API

3. **Environment Variables**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run it**
   ```bash
   pnpm dev
   ```

That's it! Visit `localhost:3000` and start dropping your design files.

## What it does

- Upload images/videos with drag & drop
- AI generates tags automatically (needs OpenAI key)
- Search and filter your stuff
- Mobile-friendly
- Dark/light themes
- Pretty smooth animations

Built with Next.js 15, Supabase, and Tailwind. Mobile optimized because nobody likes tiny buttons.