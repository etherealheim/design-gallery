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

- **Smart Upload System**: Drag & drop images/videos with unlimited file support
- **Auto Image Compression**: Automatically compresses images to WebP format, saving up to 70% bandwidth
- **Lazy Loading**: Images load only when needed, improving page performance
- **AI Tagging**: Generates tags automatically (needs OpenAI key)
- **Advanced Search**: Search and filter by tags, file types, and more
- **Mobile Optimized**: Touch-friendly interface with responsive design
- **Dark/Light Themes**: Seamless theme switching
- **Smooth Animations**: Fast, polished interactions (150ms transitions)
- **Anti-Abuse Protection**: Built-in safeguards for shared deployments

## 🚀 Performance Features

- **Image Compression**: Automatic WebP conversion with smart quality settings
- **Lazy Loading**: Images load on-demand using Intersection Observer
- **Infinite Scroll**: Smooth pagination with debounced loading
- **Optimized Storage**: Compressed uploads reduce storage costs by ~70%
- **Fast Animations**: Optimized transitions for snappy interactions

Built with Next.js 15, Supabase, Sharp, and Tailwind. Designed for performance and scalability.

## 🛠️ Technical Highlights

### Image Compression Pipeline
- **Smart Detection**: Only compresses images >100KB for optimal efficiency
- **Format Conversion**: JPEG/PNG → WebP with 85% quality (75% for large files)
- **Size Optimization**: Max 2048px dimensions, progressive encoding
- **Fallback Handling**: Graceful degradation if compression fails

### Performance Optimizations
- **Intersection Observer**: Debounced infinite scroll (500ms) prevents spam
- **Lazy Loading**: Native `loading="lazy"` with blur placeholders  
- **Efficient State**: Optimistic UI updates with functional state management
- **Layout Stability**: Fixed button widths prevent layout shifts

### Anti-Abuse Features
- **Rate Limiting Ready**: Infrastructure for IP-based upload limits
- **Storage Optimization**: 70% bandwidth reduction through compression
- **Error Boundaries**: Comprehensive error handling and user feedback

## Contributing

Want to help make this better? Check out [CONTRIBUTING.md](CONTRIBUTING.md) - we welcome all kinds of contributions!

## License

MIT License - see [LICENSE](LICENSE) for details. Free to use for personal and commercial projects.