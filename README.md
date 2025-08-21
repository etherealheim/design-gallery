# 🎨 UI Design Gallery

A modern, responsive design gallery application built with Next.js 15, featuring intelligent file management, automatic tag generation, and seamless user experience for showcasing UI/UX design assets.

## ✨ Features

### 🚀 Core Functionality
- **Drag & Drop Upload** - Intuitive file uploading with visual feedback
- **Smart Tag Generation** - Automatic tagging of design assets using AI
- **Real-time Preview** - Instant preview modal for images and videos
- **Advanced Filtering** - Filter designs by tags, file types, and dates
- **Responsive Grid** - Beautiful, adaptive gallery layout
- **Dark/Light Theme** - Seamless theme switching with system preference detection

### 🔧 Technical Features
- **Next.js 15** with App Router and React Server Components
- **Supabase Integration** - Secure file storage and database management
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Modern, utility-first styling
- **Radix UI** - Accessible, unstyled UI components
- **Framer Motion** - Smooth animations and transitions
- **Zod Validation** - Runtime type validation and error handling

## 🎯 What is this good for?

### For Designers & Creative Teams
- **Portfolio Management** - Organize and showcase your design work
- **Asset Discovery** - Quickly find specific UI components or patterns
- **Design System Documentation** - Catalog design tokens, components, and patterns
- **Client Presentations** - Professional gallery for sharing work with clients
- **Inspiration Collection** - Curate and organize design inspiration

### For Development Teams
- **UI Component Library** - Visual catalog of reusable components
- **Design Handoff** - Bridge between design and development teams
- **Style Guide Management** - Maintain consistent design standards
- **Asset Organization** - Centralized location for all design assets
- **Version Control** - Track design iterations and updates

### For Agencies & Studios
- **Client Asset Management** - Organize work by projects and clients
- **Team Collaboration** - Share and review designs across teams
- **Project Documentation** - Visual documentation of design decisions
- **Brand Asset Libraries** - Maintain brand consistency across projects

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account for storage and database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/etherealheim/v0-ui-design-galleryl.git
   cd v0-ui-design-galleryl
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Database Setup**
   Run the SQL scripts in the `scripts/` directory to set up your Supabase database:
   ```sql
   -- Execute scripts in order: 001_create_uploaded_files_table.sql through 008_setup_storage_and_rls.sql
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

   Visit `http://localhost:3000` to see the application.

## 🏗️ Project Structure

```
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes for file management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main gallery page
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix + Tailwind)
│   ├── gallery-*.tsx     # Gallery-specific components
│   ├── preview-modal.tsx # Image/video preview
│   └── drag-drop-overlay.tsx # File upload UI
├── hooks/                # Custom React hooks
│   ├── use-gallery-state.ts    # Gallery state management
│   ├── use-file-upload.tsx     # File upload logic
│   └── use-preview-modal.ts    # Modal state management
├── lib/                  # Utilities and services
│   ├── services/         # Data and file services
│   ├── supabase/         # Supabase client configuration
│   ├── validation.ts     # Zod schemas
│   └── utils.ts          # Helper functions
└── types/                # TypeScript type definitions
```

## 🔌 API Endpoints

- `POST /api/upload-file` - Upload new design assets
- `POST /api/generate-tags` - Generate AI-powered tags for assets
- `PATCH /api/update-file/[id]` - Update file metadata
- `DELETE /api/delete-file/[id]` - Remove files from gallery
- `POST /api/setup-storage` - Initialize Supabase storage

## 🎨 Supported File Types

- **Images**: JPG, PNG, GIF, SVG, WebP
- **Videos**: MP4, WebM, MOV
- **Design Files**: Figma links, Sketch files (with preview generation)

## 🛠️ Customization

### Styling
- Modify `tailwind.config.js` for custom design tokens
- Update `app/globals.css` for global style overrides
- Customize component themes in `components/ui/`

### AI Tag Generation
- Configure OpenAI prompts in `app/api/generate-tags/route.ts`
- Add custom tag categories in `lib/validation.ts`
- Implement additional AI providers for tag generation

### Storage Configuration
- Modify Supabase policies in the `scripts/` directory
- Configure custom file organization in `lib/services/file-service.ts`
- Add additional storage providers if needed

## 📊 Performance Features

- **Server-Side Rendering** - Fast initial page loads
- **Image Optimization** - Automatic image compression and lazy loading
- **Caching Strategy** - Smart caching for API responses
- **Progressive Loading** - Skeleton screens during data fetching
- **Optimistic Updates** - Immediate UI feedback for user actions

## 🔐 Security

- **Row Level Security** - Supabase RLS policies for data protection
- **Input Validation** - Zod schemas for all API endpoints
- **File Type Validation** - Secure file upload with type checking
- **Environment Variables** - Sensitive data protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework for production
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide React](https://lucide.dev/) - Beautiful icon library

## 🐛 Bug Reports & Feature Requests

Please use the [GitHub Issues](https://github.com/etherealheim/v0-ui-design-galleryl/issues) to report bugs or request features.

---

**Made with ❤️ for the design community**