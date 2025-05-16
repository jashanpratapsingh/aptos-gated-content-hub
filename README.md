
# AptosGate - NFT-Gated Content Platform

AptosGate is a modern web application that provides access to exclusive content based on NFT ownership verification on the Aptos blockchain. The platform allows creators to gate their premium content (PDFs, videos, etc.) behind NFT ownership requirements.

## Features

- **NFT Verification**: Verify ownership of specific NFTs on the Aptos blockchain to unlock content
- **Content Management**: Upload, manage, and organize premium content including PDFs and videos
- **Responsive Design**: Fully responsive interface that works across all devices
- **Wallet Integration**: Seamless integration with multiple Aptos blockchain wallets
- **User Dashboard**: Personalized dashboard for users to view their accessible content
- **Content Exploration**: Browse available content collections with preview capabilities

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Blockchain**: Aptos blockchain integration with wallet adapters
- **Content Rendering**: PDF viewer, video playback capabilities
- **State Management**: React Query for efficient data fetching and caching
- **Styling**: Custom Aptos-themed design system with Tailwind CSS

## Getting Started

To run the project locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Project Structure

- `/src/components`: UI components used throughout the application
- `/src/pages`: Main page components for each route
- `/src/services`: Service layer for API and blockchain interactions
- `/src/hooks`: Custom React hooks for shared functionality
- `/src/providers`: Context providers for state management

## Deployment

The application can be deployed to any static hosting service. For production builds:

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## License

All rights reserved.
