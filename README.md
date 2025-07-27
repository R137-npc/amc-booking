# AMC Resource Booking System

A comprehensive web-based resource booking system built with React, TypeScript, and Supabase for managing machine bookings in startup incubation programs.

## Features

- **Multi-role Authentication**: Support for startup users, AMC admins, and IMA admins
- **Machine Management**: Categorized machine inventory with status tracking
- **Booking System**: Three types of bookings (weekly planning, same-week exceptional, monthly provisional)
- **Token Management**: Credit-based system for resource allocation
- **Real-time Calendar**: Visual booking calendar with conflict detection
- **Analytics Dashboard**: Usage statistics and reporting
- **Audit Trail**: Complete system activity logging

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context API
- **Icons**: Heroicons
- **Build Tool**: Vite

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd amc-booking-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Database Setup

The database schema is automatically created through Supabase migrations. The migrations include:

- **User profiles** with role-based access control
- **Machine types and machines** with status tracking
- **Booking system** with approval workflow
- **Audit logging** for system changes
- **Row Level Security (RLS)** policies

### 5. Create Admin Users

After setting up Supabase, you'll need to create admin users through the Supabase Auth interface or by running SQL commands in the Supabase SQL editor.

Example admin users:
- AMC Admin: `admin@hamani.amc` / `AMC13719`
- IMA Admin: `admin@ramzi.ima` / `IMA12345`

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── booking/        # Booking management
│   ├── calendar/       # Calendar view
│   ├── common/         # Shared components
│   ├── dashboard/      # Role-specific dashboards
│   ├── layout/         # Layout components
│   ├── settings/       # System settings
│   └── tokens/         # Token management
├── contexts/           # React Context providers
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── main.tsx           # Application entry point
```

## Database Schema

### Core Tables

- **profiles**: User information and token balances
- **machine_types**: Categories of machines (3D Printer, CNC, etc.)
- **machines**: Individual machine instances
- **bookings**: Booking requests and approvals
- **availability_blocks**: IMA internal time blocks
- **audit_logs**: System activity tracking

### Key Features

- **Row Level Security**: Users can only access their own data
- **Real-time subscriptions**: Live updates across all clients
- **Automatic token calculation**: Database triggers handle token accounting
- **Audit trail**: All changes are automatically logged

## User Roles

### Startup Users
- Create and manage bookings
- View token balance and usage
- Access personal calendar

### AMC Administrators
- Approve/reject booking requests
- Manage user accounts and token allocation
- Full system analytics and reporting
- Machine and category management

### IMA Administrators
- Manage machine availability
- View institutional usage reports
- Control machine status and maintenance

## Booking Types

1. **Weekly Planning**: Regular weekly bookings submitted by Friday
2. **Same Week Exceptional**: Emergency bookings requiring justification
3. **Monthly Provisional**: Long-term provisional bookings

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Deployment

The application can be deployed to any static hosting service:

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Ensure environment variables are set in your hosting platform

Popular deployment options:
- Vercel
- Netlify
- Supabase Hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.