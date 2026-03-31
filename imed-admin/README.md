# Admin Panel - Educational Platform

A hierarchical, context-based Admin Panel for managing an educational platform built with Next.js (App Router) + TypeScript.

## Features

- **Authentication**: Phone number-based login with token stored in localStorage
- **Protected Routes**: All `/admin/*` routes are protected
- **Hierarchical Navigation**: Context-based content management
  - Categories → Courses → Modules → Lessons
  - Breadcrumb navigation for easy orientation
  - Add/Edit actions within parent context
- **CRUD Operations**: Full Create, Read, Update, Delete functionality for:
  - Categories (with nested courses)
  - Courses (with nested modules)
  - Modules (with nested lessons)
  - Lessons (with video, PDF resources, and test PDFs)
  - Banners
  - Notifications
  - Users (View only)

## Project Structure

```
imed-admin/
├── app/
│   ├── admin/
│   │   ├── login/          # Login page
│   │   ├── dashboard/       # Dashboard with stats
│   │   ├── categories/      # Categories list
│   │   │   └── [categoryId]/  # Category detail with courses
│   │   │       └── courses/
│   │   │           └── [courseId]/  # Course detail with modules
│   │   │               └── modules/
│   │   │                   └── [moduleId]/  # Module detail with lessons
│   │   │                       └── lessons/
│   │   │                           └── [lessonId]/  # Lesson detail page
│   │   ├── banners/         # Banners CRUD
│   │   ├── notifications/   # Notifications CRUD
│   │   ├── users/           # Users view
│   │   └── layout.tsx       # Admin layout wrapper with auth check
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx  # Main admin layout
│   │   ├── Sidebar.tsx      # Sidebar navigation
│   │   └── Header.tsx       # Top header with logout
│   └── ui/
│       ├── Breadcrumb.tsx   # Breadcrumb navigation component
│       ├── Table.tsx        # Reusable table component
│       ├── Modal.tsx        # Reusable modal component
│       ├── Input.tsx        # Form input component
│       ├── Textarea.tsx     # Textarea component
│       ├── Select.tsx       # Select dropdown component
│       ├── Checkbox.tsx     # Checkbox component
│       └── Button.tsx       # Button component
├── services/
│   ├── auth.ts              # Authentication service
│   └── api.ts               # API service layer (currently using mock data)
├── types/
│   └── index.ts             # TypeScript interfaces
├── mock/
│   └── data.ts              # Mock data for development
└── lib/
    └── auth.ts              # Auth utilities
```

## Routing Structure

The admin panel uses a hierarchical routing structure:

- `/admin/categories` - List all categories
- `/admin/categories/[categoryId]` - Category detail with courses list
- `/admin/categories/[categoryId]/courses/[courseId]` - Course detail with modules list
- `/admin/categories/[categoryId]/courses/[courseId]/modules/[moduleId]` - Module detail with lessons list
- `/admin/categories/[categoryId]/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]` - Lesson detail page

Each page shows:
- Breadcrumb navigation showing the full hierarchy
- Parent entity information
- List of child entities (clickable to navigate deeper)
- Add/Edit actions within the context

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login

- Navigate to `/admin/login`
- Enter any phone number (no validation for now)
- You'll be redirected to the dashboard

## API Integration

The project is structured to easily integrate with a real API. Here's what needs to be updated:

### 1. Update `services/api.ts`

Replace the mock functions with actual API calls. Each API module (e.g., `categoriesApi`, `coursesApi`) has the following methods:
- `getAll()` - Fetch all items
- `getById(id)` - Fetch single item
- `create(data)` - Create new item
- `update(id, data)` - Update existing item
- `delete(id)` - Delete item

### 2. Update `services/auth.ts`

Replace the `login` function with your actual authentication endpoint:

```typescript
login: async (phone: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await response.json();
  authService.setToken(data.token);
  return data;
}
```

### 3. Add API Base URL

Create a config file or environment variable for your API base URL:

```typescript
// lib/config.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

## Components Usage

### Breadcrumb Component

```tsx
<Breadcrumb
  items={[
    { label: 'Categories', href: '/admin/categories' },
    { label: 'Programming', href: '/admin/categories/1' },
    { label: 'React Course' }
  ]}
/>
```

### Table Component

```tsx
<Table
  data={items}
  columns={[
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { 
      key: 'date', 
      header: 'Date',
      render: (item) => new Date(item.date).toLocaleDateString()
    }
  ]}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Modal Component

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Item"
>
  {/* Form content */}
</Modal>
```

### Form Components

All form components (Input, Textarea, Select, Checkbox) follow a similar pattern:

```tsx
<Input
  label="Name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  required
/>
```

## Data Models

### Category
- `id`, `name`, `createdAt`, `updatedAt`

### Course
- `id`, `title`, `image`, `description`, `isPublic`, `categoryId`, `createdAt`, `updatedAt`

### Module
- `id`, `courseId`, `title`, `order`, `createdAt`, `updatedAt`

### Lesson
- `id`, `moduleId`, `title`, `videoUrl`, `pdfResource`, `testPdf`, `isFree`, `createdAt`, `updatedAt`
- **Lesson Detail Page Features:**
  - Video player (supports YouTube, Vimeo embeds, or direct video URLs)
  - PDF Resource viewer (view only, no download)
  - Test PDF viewer (view only, no download)
  - Free/Paid toggle

### Banner
- `id`, `image`, `link`, `createdAt`, `updatedAt`

### Notification
- `id`, `image`, `title`, `description`, `createdAt`, `updatedAt`

### User
- `id`, `name`, `phone`, `email`, `purchasedCourses[]`, `createdAt`

## Navigation Flow

1. **Categories Page** (`/admin/categories`)
   - Lists all categories
   - Click a category to view its courses

2. **Category Detail** (`/admin/categories/[categoryId]`)
   - Shows category name and description
   - Lists all courses in this category
   - Click a course to view its modules
   - Add new courses within this category

3. **Course Detail** (`/admin/categories/[categoryId]/courses/[courseId]`)
   - Shows course information
   - Lists all modules in this course
   - Click a module to view its lessons
   - Add new modules within this course

4. **Module Detail** (`/admin/categories/[categoryId]/courses/[courseId]/modules/[moduleId]`)
   - Shows module information
   - Lists all lessons in this module
   - Click a lesson to view/edit it
   - Add new lessons within this module

5. **Lesson Detail** (`/admin/categories/[categoryId]/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]`)
   - Shows lesson title and type (Free/Paid)
   - Video player (YouTube, Vimeo, or direct video)
   - PDF Resource viewer (iframe, view only)
   - Test PDF viewer (iframe, view only)
   - Edit button to modify lesson details

## Notes

- All components are client components (`'use client'`) for interactivity
- Authentication is handled client-side with localStorage
- Mock data is stored in memory and will reset on page refresh
- The UI is minimal and can be easily styled later
- All API calls are separated into service files for easy replacement
- Breadcrumb navigation provides clear context of current location
- Add/Edit actions are contextual (within parent entity)

## Future Improvements

- Add proper form validation
- Add loading states and error handling
- Implement proper OTP authentication
- Add pagination for tables
- Add search/filter functionality
- Add image upload functionality
- Add proper error boundaries
- Add toast notifications for user feedback
- Add drag-and-drop reordering for modules and lessons

