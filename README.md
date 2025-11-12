# Tallac Frontend

Next.js frontend application for Tallac CRM system.

## Features

- User authentication and authorization
- Role-based access control
- Leads management
- Companies management
- Activities tracking
- Knowledge Base
- Territory management
- Team management
- Location management

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Context** - State management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Project Structure

```
nextjs-frontend/
├── app/                    # Next.js app directory
│   ├── activities/         # Activities page
│   ├── company/            # Company management
│   ├── knowledge-base/     # Knowledge Base
│   ├── login/              # Login page
│   ├── prospects/          # Prospects/Leads page
│   └── ...
├── components/             # React components
├── contexts/               # React contexts
├── utils/                  # Utility functions
└── ...
```

## Deployment

This application can be deployed to:
- Vercel
- AWS App Runner
- Docker containers

See deployment documentation for more details.

## License

Private - All rights reserved

