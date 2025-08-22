# 🎨 Design Gallery

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

A clean gallery app for your design assets. Drag, drop, search, and let AI tag your stuff automatically.

> **Open Source** - Free to use, modify, and contribute to!

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
   Copy `env.example` to `.env.local` and fill in your keys:
   ```bash
   cp env.example .env.local
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

## Contributing

Want to help make this better? Check out [CONTRIBUTING.md](CONTRIBUTING.md) - we welcome all kinds of contributions!

## License

MIT License - see [LICENSE](LICENSE) for details. Free to use for personal and commercial projects.