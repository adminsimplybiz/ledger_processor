# Setup Instructions

## Quick Start

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Start Frontend Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Production Build

### Frontend

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Environment Variables

### Frontend
No environment variables required for basic functionality.

## Troubleshooting

### Port Already in Use
- Frontend: Change port by setting `PORT=3001 npm start`

### Module Not Found Errors
- Frontend: Run `npm install` again

### TypeScript Errors
- Ensure all dependencies are installed: `npm install`
- Check that `tsconfig.json` is properly configured

