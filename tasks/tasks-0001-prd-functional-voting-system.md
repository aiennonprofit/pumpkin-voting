# Task List: Functional Pumpkin Voting System

## Relevant Files

### Configuration & Setup
- `firebase-config.js` - Firebase project configuration and initialization
- `.firebaserc` - Firebase project aliases for deployment
- `firebase.json` - Firebase Hosting and rules configuration
- `.env.example` - Template for environment variables (admin emails, etc.)
- `package.json` - NPM dependencies (Firebase SDK, etc.)

### Core Application Files (Modified)
- `index.html` - Add Firebase SDK scripts, auth UI, admin navigation
- `script.js` - Migrate from localStorage to Firebase APIs
- `styles.css` - Add styles for auth modals, admin dashboard

### New Application Files
- `auth.js` - Authentication service (register, login, logout, session management)
- `admin.html` - Admin moderation dashboard page
- `admin.js` - Admin dashboard logic (approve/reject/delete submissions)
- `admin.css` - Styles for admin dashboard
- `firestore.js` - Firestore database service (CRUD operations for pumpkins, votes)
- `storage.js` - Firebase Storage service (image upload/retrieval)

### Firebase Configuration Files
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `firestore.indexes.json` - Firestore composite indexes (if needed)

### Notes

- No testing framework in current project - tests not included in MVP
- Firebase SDK will be loaded via CDN initially (can migrate to npm later)
- Admin dashboard will be a separate HTML page accessible via header button for admin users
- Environment variables will be managed through Firebase Hosting configuration

## Tasks

- [x] 1.0 Firebase Project Setup & Configuration
  - [x] 1.1 Create new Firebase project in Firebase Console with name "pumpkin-voting"
  - [x] 1.2 Enable Firebase Authentication (Email/Password provider)
  - [x] 1.3 Enable Firestore Database in production mode
  - [x] 1.4 Enable Firebase Storage (SKIPPED - using base64 in Firestore instead)
  - [x] 1.5 Create `firebase-config.js` with project credentials (API key, project ID, etc.)
  - [x] 1.6 Create `package.json` and install Firebase SDK via npm
  - [x] 1.7 Create `.env.example` with ADMIN_EMAILS placeholder
  - [x] 1.8 Add Firebase SDK initialization in `index.html` or create firebase initialization module

- [ ] 2.0 User Authentication System
  - [x] 2.1 Create `auth.js` module with register, login, logout, and getCurrentUser functions
  - [x] 2.2 Add login/register modal HTML to `index.html`
  - [x] 2.3 Style auth modal in `styles.css` (responsive, Halloween theme)
  - [x] 2.4 Implement user registration with email/password validation (min 8 chars)
  - [x] 2.5 Implement user login with error handling
  - [x] 2.6 Implement logout functionality
  - [x] 2.7 Add authentication state observer to detect login/logout events
  - [x] 2.8 Display logged-in user's name and logout button in header
  - [x] 2.9 Show login/register button for unauthenticated users in header
  - [x] 2.10 Restrict "Submit Entry" and "Vote" actions to authenticated users only
  - [x] 2.11 Create user document in Firestore on registration with isAdmin flag
  - [x] 2.12 Set isAdmin=true for emails listed in ADMIN_EMAILS environment variable

- [ ] 3.0 Database Migration from localStorage to Firestore
  - [ ] 3.1 Create `firestore.js` service module with functions for pumpkin and vote operations
  - [ ] 3.2 Design Firestore collections structure (users, pumpkins, votes, config)
  - [ ] 3.3 Replace `loadData()` to fetch pumpkins from Firestore instead of localStorage
  - [ ] 3.4 Replace `saveData()` to save pumpkins to Firestore with status='pending'
  - [ ] 3.5 Update `handleSubmit()` to save pumpkin with submittedBy (user ID) and createdAt timestamp
  - [ ] 3.6 Update `renderGallery()` to display only pumpkins with status='approved'
  - [ ] 3.7 Update vote tracking to save votes in Firestore votes collection
  - [ ] 3.8 Implement vote count aggregation by counting votes per pumpkin
  - [ ] 3.9 Update `confirmVote()` to prevent duplicate votes using Firestore transaction
  - [ ] 3.10 Remove all localStorage references from `script.js`

- [ ] 4.0 Admin Moderation Dashboard
  - [ ] 4.1 Create `admin.html` page with header, pending submissions section, and approved entries section
  - [ ] 4.2 Create `admin.css` with styles for moderation interface (cards, action buttons)
  - [ ] 4.3 Create `admin.js` module to handle admin-only logic
  - [ ] 4.4 Add "Admin Dashboard" button in header (visible only to admin users)
  - [ ] 4.5 Implement admin access control - redirect non-admins away from admin page
  - [ ] 4.6 Fetch and display all pending pumpkin submissions with images and details
  - [ ] 4.7 Implement approve button - updates pumpkin status to 'approved', sets approvedAt and approvedBy
  - [ ] 4.8 Implement reject button - updates pumpkin status to 'rejected'
  - [ ] 4.9 Implement delete button - removes pumpkin document and associated votes from Firestore
  - [ ] 4.10 Add confirmation dialogs for reject and delete actions
  - [ ] 4.11 Display approved entries with option to delete if needed
  - [ ] 4.12 Add "Reset All Votes" button to delete all documents in votes collection

- [ ] 5.0 Real-time Vote Synchronization
  - [ ] 5.1 Add Firestore real-time listener in `renderGallery()` for approved pumpkins
  - [ ] 5.2 Add Firestore real-time listener for votes collection to update counts live
  - [ ] 5.3 Update vote count display on pumpkin cards when votes change
  - [ ] 5.4 Add real-time listener in `renderResults()` to update leaderboard automatically
  - [ ] 5.5 Implement optimistic UI updates for voting (show vote immediately, rollback on error)
  - [ ] 5.6 Add visual indicator on pumpkin cards showing which one current user voted for

- [ ] 6.0 Image Storage Migration to Firebase Storage
  - [ ] 6.1 Create `storage.js` module with uploadImage and getImageUrl functions
  - [ ] 6.2 Update `handleSubmit()` to upload image to Firebase Storage instead of base64
  - [ ] 6.3 Generate unique filename for each image using timestamp and user ID
  - [ ] 6.4 Store Firebase Storage download URL in pumpkin document's imageUrl field
  - [ ] 6.5 Add upload progress indicator during image upload
  - [ ] 6.6 Implement error handling for failed uploads (file too large, network error)
  - [ ] 6.7 Update image preview to work with Storage URLs
  - [ ] 6.8 Validate file type (JPG, PNG, HEIC) and size (max 5MB) before upload

- [ ] 7.0 Deployment & Production Setup
  - [ ] 7.1 Create `firestore.rules` with security rules (users can't set isAdmin, one vote per user, etc.)
  - [ ] 7.2 Create `storage.rules` with security rules (authenticated uploads only, file size limits)
  - [ ] 7.3 Deploy Firestore security rules using Firebase CLI
  - [ ] 7.4 Deploy Storage security rules using Firebase CLI
  - [ ] 7.5 Create `firebase.json` for Firebase Hosting configuration
  - [ ] 7.6 Create `.firebaserc` with project alias
  - [ ] 7.7 Deploy application to Firebase Hosting using `firebase deploy --only hosting`
  - [ ] 7.8 Set up environment variables in Firebase Hosting config for ADMIN_EMAILS
  - [ ] 7.9 Test deployed application with multiple users voting simultaneously
  - [ ] 7.10 Verify admin moderation workflow in production
