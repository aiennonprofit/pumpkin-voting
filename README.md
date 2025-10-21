# Pumpkin Carving Contest Website

A festive web application for hosting a pumpkin carving contest with voting functionality.

## Features

- **Submit Pumpkin Entries**: Staff can upload photos, titles, and descriptions of their carved pumpkins
- **Vote for Favorites**: Staff, volunteers, and the public can cast votes for their favorite pumpkins
- **View Results**: Real-time leaderboard showing vote counts with the winner highlighted
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Festive Theme**: Halloween-themed design with orange and dark colors

## How to Use

### Getting Started

1. Open `index.html` in your web browser
2. No installation or server required - it runs entirely in the browser!

### Submitting a Pumpkin

1. Click the "Submit Entry" button in the navigation
2. Fill in:
   - Pumpkin Title (required)
   - Description (required)
   - Your Name (required)
   - Upload a photo of your pumpkin (required)
3. Click "Submit Pumpkin"
4. Your entry will appear in the voting gallery

### Voting

1. Click the "Vote" button to view all pumpkin entries
2. Browse the gallery of pumpkins
3. Click on your favorite pumpkin
4. Confirm your vote in the modal
5. Users can change their vote by voting for a different pumpkin

### Viewing Results

1. Click the "Results" button to see the leaderboard
2. Pumpkins are ranked by number of votes
3. The winner is highlighted with a gold crown

## Technical Details

- **Storage**: Uses browser localStorage to save entries and votes
- **Data Persistence**: All data persists between sessions on the same device
- **Vote Tracking**: Prevents multiple votes from the same browser (but allows vote changes)
- **Image Handling**: Photos are stored as base64 encoded strings

## Limitations

This is a simple, client-side implementation suitable for:
- Small to medium-sized contests
- Internal company events
- Situations where advanced security isn't critical

### Current Limitations:

- Data is stored locally per device (not synced across users)
- Vote tracking is browser-based (can be bypassed with different browsers/devices)
- No backend server or database

## Upgrading to a Full Solution

If you need a more robust solution with:
- Centralized data storage
- Stronger vote security
- Multi-device synchronization
- User authentication

You would need to add:
- Backend server (Node.js, Python, etc.)
- Database (MongoDB, PostgreSQL, etc.)
- User authentication system
- API endpoints for data management

## Browser Support

Works in all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## File Structure

```
pumpkin-voting/
├── index.html      # Main HTML structure
├── styles.css      # Styling and animations
├── script.js       # Application logic
└── README.md       # Documentation
```

## Customization

Feel free to customize:
- Colors in `styles.css`
- Text and labels in `index.html`
- Voting rules in `script.js`

Enjoy your pumpkin carving contest!
