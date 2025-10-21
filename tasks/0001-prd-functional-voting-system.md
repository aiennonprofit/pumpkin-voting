# PRD: Functional Pumpkin Voting System

## Introduction/Overview

The current pumpkin carving contest website is a client-side application using localStorage, which prevents multiple users from seeing the same entries and votes. This makes it unsuitable for a real contest. This PRD describes the transformation into a functional, multi-user voting system with centralized data storage, user authentication, and admin controls to prevent vote manipulation and enable proper contest management.

The goal is to create an MVP quickly using Firebase for backend services, allowing 10-50 participants in a small internal company event to submit pumpkin entries, vote securely, and view results in real-time.

## Goals

1. **Enable centralized data storage** - All users see the same pumpkin entries and vote counts
2. **Prevent vote manipulation** - Implement user authentication to ensure one vote per user
3. **Provide admin controls** - Allow contest organizers to moderate submissions and manage the contest
4. **Deploy to cloud** - Make the application accessible via URL for company-wide access
5. **Quick MVP delivery** - Get a working system operational rapidly using managed services

## User Stories

### Participants (Staff/Volunteers)
- As a participant, I want to create an account and log in, so that I can submit my pumpkin entry
- As a participant, I want to upload my pumpkin photo with a title and description, so that others can see my creation
- As a participant, I want to browse all approved pumpkin entries, so that I can decide which to vote for
- As a participant, I want to cast one vote for my favorite pumpkin, so that I can support the best entry
- As a participant, I want to see real-time vote counts and rankings, so that I know which pumpkins are winning
- As a participant, I want my vote to be secure and counted only once, so that the contest is fair

### Administrators
- As an admin, I want to review submitted pumpkin entries before they appear publicly, so that I can prevent inappropriate content
- As an admin, I want to remove inappropriate or duplicate entries, so that I can maintain contest quality
- As an admin, I want to reset all votes if needed, so that I can restart the contest or fix issues
- As an admin, I want to see who submitted each entry and who voted, so that I can verify contest integrity
- As an admin, I want to close voting at a specific time, so that I can announce official winners

## Functional Requirements

### Authentication System
1. The system must allow users to register with email and password
2. The system must validate email format and require minimum password strength (8+ characters)
3. The system must allow users to log in with their credentials
4. The system must maintain user sessions so users don't need to log in repeatedly
5. The system must allow users to log out
6. The system must display the current logged-in user's name in the header
7. The system must restrict certain actions (submit, vote) to authenticated users only

### Pumpkin Submission
8. The system must allow authenticated users to submit pumpkin entries with:
   - Title (required, max 100 characters)
   - Description (required, max 500 characters)
   - Carver name (required, max 50 characters)
   - Photo upload (required, max 5MB, formats: JPG, PNG, HEIC)
9. The system must store submitted entries in "pending" status by default
10. The system must display submission confirmation to users after upload
11. The system must prevent users from submitting duplicate entries (based on image hash)

### Admin Moderation
12. The system must provide an admin dashboard accessible only to admin users
13. The system must display all pending submissions for admin review
14. The system must allow admins to approve pending submissions (changes status to "approved")
15. The system must allow admins to reject pending submissions with optional reason
16. The system must allow admins to delete any entry (pending or approved)
17. The system must send email notifications to users when their submission is approved/rejected
18. The system must designate at least one initial admin account (configurable via environment variable)

### Voting System
19. The system must display only "approved" pumpkin entries in the voting gallery
20. The system must allow each authenticated user to cast exactly one vote
21. The system must allow users to change their vote to a different pumpkin
22. The system must update vote counts in real-time for all users
23. The system must prevent voting when the contest is marked as "closed" by admin
24. The system must display which pumpkin the current user voted for (visual indicator)

### Results & Leaderboard
25. The system must display pumpkins ranked by vote count (highest first)
26. The system must highlight the winning pumpkin (most votes) with special styling
27. The system must show tie-breaker logic (if needed, earliest submission wins)
28. The system must display total vote count for each pumpkin
29. The system must show the leaderboard in real-time as votes are cast

### Data Persistence & Real-time Updates
30. The system must store all data (users, entries, votes) in Firebase Firestore
31. The system must store pumpkin images in Firebase Storage with secure URLs
32. The system must use Firebase real-time listeners to update vote counts without page refresh
33. The system must maintain data integrity (prevent race conditions in voting)

### Deployment & Access
34. The system must be deployable to Firebase Hosting
35. The system must be accessible via a public URL
36. The system must support HTTPS for secure authentication
37. The system must work on desktop and mobile browsers

## Non-Goals (Out of Scope)

- **Social login** (Google, Microsoft SSO) - Only email/password for MVP
- **Email verification** - Users can register without email confirmation (trust-based for small internal event)
- **Advanced analytics** - No detailed voting trends or user behavior tracking
- **Multi-contest support** - System handles one contest at a time
- **Voting categories** - No "Most Creative", "Scariest", etc. - just one overall winner
- **Comments/reactions** - No commenting on pumpkin entries
- **Native mobile apps** - Web-only, but mobile-responsive
- **Advanced image editing** - No filters, cropping, or enhancement tools
- **Export functionality** - No CSV/PDF export in MVP (can be added later)
- **Password recovery** - No "forgot password" flow in MVP
- **User profiles** - No user profile pages or history

## Design Considerations

### UI/UX
- Maintain the existing festive Halloween theme (orange, dark colors, pumpkin emojis)
- Keep the current three-tab navigation: Vote, Results, Submit Entry
- Add authentication UI: Login/Register modal or page
- Add admin dashboard accessible via button in header (admin users only)
- Show "logged in as [name]" in header with logout button
- Display "Pending Approval" message after submission instead of immediate gallery appearance
- Add visual indicator on gallery cards showing user's voted pumpkin

### Responsive Design
- Ensure all new features work on mobile (320px+) and desktop (1920px+)
- Use responsive modals for login/register forms
- Admin dashboard should be desktop-optimized but functional on tablet

## Technical Considerations

### Firebase Services
- **Firebase Authentication** - For user registration, login, session management
- **Firestore Database** - For storing users, pumpkin entries, votes, admin settings
- **Firebase Storage** - For storing uploaded pumpkin images
- **Firebase Hosting** - For deploying the web application
- **Firebase Security Rules** - To enforce access control at database level

### Database Schema (Firestore)

**Users Collection** (`users/{userId}`)
```
{
  uid: string,
  email: string,
  displayName: string,
  isAdmin: boolean,
  createdAt: timestamp,
  votedFor: string | null  // pumpkinId
}
```

**Pumpkins Collection** (`pumpkins/{pumpkinId}`)
```
{
  id: string,
  title: string,
  description: string,
  carverName: string,
  imageUrl: string,
  status: 'pending' | 'approved' | 'rejected',
  submittedBy: string,  // userId
  submittedAt: timestamp,
  approvedAt: timestamp | null,
  approvedBy: string | null,  // admin userId
  voteCount: number
}
```

**Votes Collection** (`votes/{voteId}`)
```
{
  userId: string,
  pumpkinId: string,
  votedAt: timestamp
}
```

**Config Collection** (`config/contest`)
```
{
  votingOpen: boolean,
  contestName: string,
  createdAt: timestamp
}
```

### Security Rules
- Users can only read their own user document
- Users can only create pumpkin entries when authenticated
- Only admins can update pumpkin status (pending → approved/rejected)
- Users can only vote once (enforced at Firestore level)
- Admin status is read-only (cannot be self-assigned)

### Frontend Architecture
- Migrate from localStorage to Firebase SDK
- Add Firebase initialization and configuration
- Create authentication service module
- Create admin-only route/component for moderation
- Add real-time Firestore listeners for vote updates
- Implement image upload to Firebase Storage with progress indicator

### Environment Variables
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
ADMIN_EMAILS (comma-separated list for initial admins)
```

## Success Metrics

1. **Functionality** - All users see the same entries and votes (no localStorage divergence)
2. **Security** - Zero instances of duplicate voting by same user
3. **Moderation** - 100% of submissions go through pending → approved flow
4. **Uptime** - System accessible 99%+ during contest period
5. **User Adoption** - At least 80% of company participants successfully register and vote
6. **Performance** - Vote updates appear within 2 seconds for all users
7. **Mobile Usage** - At least 40% of users access via mobile device without issues

## Open Questions

1. Should we allow users to edit their pumpkin submission after it's submitted but before approval?
2. What happens to votes if an admin deletes an approved entry? (Reset those votes?)
3. Should the leaderboard be visible before voting closes, or only after?
4. Do we need a countdown timer for when voting closes?
5. Should we send email reminders to users who registered but haven't voted yet?
6. What's the maximum number of pumpkin entries we expect? (affects storage costs)
7. Do we need any age restrictions or terms of service for participants?
8. Should there be a grace period for late submissions after the official deadline?

## Next Steps

1. Set up Firebase project and obtain configuration credentials
2. Generate task list breaking down implementation into atomic sub-tasks
3. Implement authentication system
4. Migrate data layer from localStorage to Firestore
5. Build admin moderation dashboard
6. Implement real-time vote synchronization
7. Deploy to Firebase Hosting
8. Test with small group before company-wide launch
