# EduBridge Dashboard - Quick Reference Guide

## 📂 File Structure

```
app/dashboard/
├── page.tsx                          # Main entry point with role routing
└── components/
    ├── DashboardHeader.tsx           # Shared header (all roles)
    ├── StatCard.tsx                  # Reusable statistics card
    ├── ActionButton.tsx              # Reusable action button
    ├── NotificationPanel.tsx         # Notification component
    ├── SchoolAdminDashboard.tsx      # School admin dashboard
    ├── DonorDashboard.tsx            # Donor dashboard
    └── VolunteerDashboard.tsx        # Volunteer dashboard
```

## 🎨 Component Props Reference

### StatCard
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'pink' | 'teal';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}
```

### ActionButton
```typescript
interface ActionButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  gradient: string;
}
```

### DashboardHeader
```typescript
interface DashboardHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
}
```

## 🎯 Dashboard Features by Role

### School Administrator
| Feature | Component Location | Key Elements |
|---------|-------------------|--------------|
| Stats Overview | 8 stat cards | Requests, Sessions, Messages, Ratings |
| Request Management | Table view | CRUD operations, Search, Filter |
| Donations | Card list | Donor info, Status, Amount |
| Volunteer Sessions | Card list + Proposals | Schedule, Approve/Decline |
| Messages | List view | Unread indicators, Timestamps |
| Feedback | Rating breakdown | Stars, Percentages, Comments |

### Donor
| Feature | Component Location | Key Elements |
|---------|-------------------|--------------|
| Impact Stats | 8 stat cards | Amount, Schools, Students, Rating |
| Request Discovery | Carousel | Urgent requests, Categories, Locations |
| Donation Management | Table view | History, Status, Type |
| Analytics | Charts section | Category breakdown, Monthly trends |
| Communications | List view | School messages, Feedback |
| Recommendations | Grid view | AI-powered, Match percentage |

### Volunteer
| Feature | Component Location | Key Elements |
|---------|-------------------|--------------|
| Impact Stats | 8 stat cards | Sessions, Students, Hours, Rating |
| Session Management | Tabbed interface | Upcoming, Proposed, Completed, Cancelled |
| Opportunities | Grid view | Subject, Location, Level filters |
| Calendar | Mini calendar | Monthly view, Session markers, Export |
| Messages | List view | Session-organized, Previews |
| Team Management | Grid view (orgs) | Members, Roles, Statistics |

## 🎨 Color Palette

### Primary Colors
- **Blue**: Primary actions, information
  - `from-blue-600` `to-indigo-600`
- **Green**: Success, donations, positive metrics
  - `from-green-600` `to-emerald-600`
- **Purple**: Volunteer/teaching activities
  - `from-purple-600` `to-pink-600`

### Status Colors
- **Green-100/700**: Completed, Confirmed, Active
- **Yellow-100/700**: Pending, In Progress
- **Orange-100/700**: Warning, Medium urgency
- **Red-100/700**: High urgency, Cancelled, Error
- **Blue-100/700**: Info, In Transit
- **Purple-100/700**: Special status

## 📊 Mock Data Examples

### School Admin - Sample Request
```typescript
{
  title: 'Science Lab Equipment',
  category: 'Resources',
  urgency: 'High',
  status: 'Pending',
  date: '2026-01-15',
  interested: 12
}
```

### Donor - Sample Donation
```typescript
{
  school: 'Sunrise School',
  request: 'Braille Materials',
  type: 'Money',
  amount: '$800',
  status: 'Delivered',
  date: '2026-01-15'
}
```

### Volunteer - Sample Session
```typescript
{
  title: 'Mathematics for Beginners',
  school: 'Sunrise School for the Blind',
  date: '2026-01-20',
  time: '10:00 AM - 12:00 PM',
  students: 25,
  topic: 'Basic Algebra',
  status: 'Confirmed'
}
```

## 🔧 Common Customizations

### Adding a New Stat Card
```tsx
<StatCard
  title="Your Metric"
  value={42}
  color="blue"
  trend={{ value: '+5 this week', isPositive: true }}
  icon={
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Your icon path */}
    </svg>
  }
/>
```

### Adding a New Action Button
```tsx
<ActionButton
  title="Your Action"
  description="Description of what this does"
  gradient="bg-gradient-to-br from-blue-50 to-indigo-50"
  icon={
    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Your icon path */}
    </svg>
  }
  onClick={() => {/* Your handler */}}
/>
```

### Adding a Status Badge
```tsx
<span className={`px-3 py-1 rounded-full text-xs font-medium ${
  status === 'Active' ? 'bg-green-100 text-green-700' :
  status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
  'bg-gray-100 text-gray-700'
}`}>
  {status}
</span>
```

## 🚀 Quick Start Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format
```

## 🔍 Debugging Tips

### Check User Role
```typescript
console.log('User role:', profile.role);
```

### Verify Props Passed
```typescript
console.log('Dashboard props:', { firstName, schoolName });
```

### Test Conditional Rendering
```typescript
{profile.role === 'school_admin' && (
  <div>Only for school admins</div>
)}
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }  /* sm: */

/* Tablet */
@media (min-width: 640px) { }  /* sm: */
@media (min-width: 768px) { }  /* md: */

/* Desktop */
@media (min-width: 1024px) { } /* lg: */
@media (min-width: 1280px) { } /* xl: */
```

## 🎯 Grid Layouts Used

```tsx
/* Single to 4-column responsive grid */
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

/* Two-column layout */
className="grid grid-cols-1 lg:grid-cols-2 gap-6"

/* Three-column layout */
className="grid grid-cols-1 md:grid-cols-3 gap-4"
```

## 🎨 Common Tailwind Patterns

### Card Container
```tsx
className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
```

### Hover Effect
```tsx
className="hover:shadow-md transition-all duration-200"
```

### Gradient Background
```tsx
className="bg-gradient-to-r from-blue-600 to-indigo-600"
```

### Flex Center
```tsx
className="flex items-center justify-center"
```

## ⚡ Performance Tips

1. **Use Server Components**: Keep data fetching in server components
2. **Minimize Client Components**: Only mark interactive parts as 'use client'
3. **Optimize Images**: Use Next.js Image component when adding images
4. **Lazy Load**: Use dynamic imports for heavy components
5. **Memoization**: Use React.memo for expensive re-renders

## 📚 Icon Library

All icons use Heroicons via inline SVG:
- **User**: Profile, Team members
- **Building**: Schools, Organizations  
- **Chart**: Statistics, Analytics
- **Calendar**: Sessions, Scheduling
- **Message**: Communications
- **Star**: Ratings, Feedback
- **Bell**: Notifications
- **Search**: Discovery, Browse

## 🔐 Authentication Flow

```
1. User logs in → auth/login
2. Supabase validates → creates session
3. Middleware checks session
4. Redirects to /dashboard
5. Page.tsx fetches profile
6. Renders role-specific dashboard
```

## 🎓 Learning Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)

## 📞 Need Help?

Common issues and solutions:

**Dashboard not rendering?**
→ Check user authentication and profile data

**Styles not applying?**
→ Verify Tailwind classes and check for typos

**TypeScript errors?**
→ Check interface definitions and prop types

**Components not found?**
→ Verify import paths are correct

---

*Last Updated: January 18, 2026*
