# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Firebase-backed pumpkin carving contest web application with real-time voting, authentication, and admin moderation. The application uses Firebase Firestore for data storage, Firebase Authentication for user management, and Firebase Hosting for deployment.

**Live URL:** https://pumpkin-voting.web.app

## Architecture

### Frontend Architecture (Client-Side Only)

The application follows a **modular JavaScript architecture** with distinct service layers:

- **auth.js** - Authentication service layer that interfaces with Firebase Auth
- **firestore.js** - Database service layer with CRUD operations and real-time listeners
- **script.js** - Main application UI logic (index.html)
- **admin.js** - Admin dashboard UI logic (admin.html)

Key architectural patterns:
- **Real-time synchronization**: Uses Firestore's `onSnapshot()` listeners for live updates
- **Service layer pattern**: Database and auth operations are abstracted into service modules
- **Transaction-based voting**: Votes use Firestore transactions to prevent race conditions
- **Base64 image storage**: Images stored directly in Firestore documents (not Firebase Storage)

### Data Flow

1. **User Registration** → `auth.js:registerUser()` → Creates Firebase Auth user → Creates Firestore user document with `isAdmin` flag from config
2. **Pumpkin Submission** → `script.js:handleSubmit()` → `firestore.js:createPumpkin()` → Creates pumpkin with `status='pending'`
3. **Admin Approval** → `admin.js:handleApprove()` → `firestore.js:updatePumpkinStatus()` → Sets `status='approved'`
4. **Voting** → `script.js:confirmVote()` → `firestore.js:castVote()` → **Transaction**: Delete old vote, create new vote, update vote counts
5. **Real-time Updates** → `firestore.js:listenToApprovedPumpkins()` → `script.js:renderGallery()` → UI updates automatically

### Firestore Collections

```
/users/{userId}
  - displayName, email, isAdmin, votedFor, createdAt

/pumpkins/{pumpkinId}
  - title, description, carverName, image (base64)
  - status ('pending'|'approved'|'rejected')
  - submittedBy, submittedAt, approvedBy, approvedAt
  - voteCount

/votes/{voteId}
  - userId, pumpkinId, votedAt

/config/adminEmails
  - emails: ['admin@example.com']
```

### Admin System

Admins are determined by email address stored in Firestore config:
- Config document: `config/adminEmails` with `emails` array field
- During registration, `auth.js` fetches admin emails and sets `isAdmin` flag
- Admin UI (admin.html) is protected by `admin.js:checkAdminAccess()`
- Security rules prevent users from self-assigning admin privileges

## Common Commands

### Deployment
```bash
# Deploy everything
npx firebase deploy

# Deploy only Firestore rules
npx firebase deploy --only firestore:rules

# Deploy only hosting
npx firebase deploy --only hosting
```

### Admin Setup
```bash
# Add admin emails (edit setup-admin-emails.js first)
node setup-admin-emails.js
```

### Development
```bash
# Run Firebase emulators locally
npm run dev

# Deploy to production
npm run deploy
```

## Critical Implementation Details

### Voting Transaction Logic

Votes are handled with Firestore transactions (`firestore.js:castVote()`) to ensure atomicity:
1. Query for user's existing vote
2. If exists: Delete old vote + decrement old pumpkin's `voteCount`
3. Create new vote + increment new pumpkin's `voteCount`
4. Update user document's `votedFor` field

This prevents race conditions when multiple users vote simultaneously.

### Real-time Listener Management

The application uses persistent listeners that must be cleaned up:
- `galleryUnsubscribe` and `resultsUnsubscribe` store listener references
- Listeners are unsubscribed before creating new ones to prevent memory leaks
- `renderGallery()` and `renderResults()` both set up new listeners each time they're called

### Security Rules Architecture

Firestore rules (`firestore.rules`) enforce security at the database level:
- Users cannot modify `isAdmin` field in their user document
- Pumpkins can only be created with `status='pending'`
- Only admins can update pumpkin status or delete pumpkins
- Vote operations are restricted to one vote per user
- Config collection allows creation only if `adminEmails` document doesn't exist

### Image Storage Strategy

Images are stored as **base64-encoded strings** directly in Firestore documents (not Firebase Storage):
- Reason: User doesn't have Firebase Storage in their plan
- Images are converted to base64 in `script.js:handleSubmit()`
- Stored in `pumpkin.image` field
- Trade-off: Document size limitations vs. no additional storage costs

## Firebase Configuration

The project is configured for Firebase project `pumpkin-voting`:
- Project ID: `pumpkin-voting`
- Hosting URL: https://pumpkin-voting.web.app
- Configuration: `firebase-config.js` (contains API keys)
- Rules: `firestore.rules` (deployed security rules)
- Indexes: `firestore.indexes.json` (composite index for status+submittedAt queries)

## Important Notes

- **No tests**: This project was built as a quick MVP without a testing framework
- **Admin emails**: Managed through Firestore config, not environment variables
- **Two HTML pages**: `index.html` (public) and `admin.html` (admin-only)
- **Halloween theme**: Orange (#f7931e) and dark blue (#16213e) color scheme
- **Real-time by default**: All views use live listeners, not one-time queries
