# What's New Onboarding Feature

This document explains the "What's New" onboarding feature in Logday that shows platform-specific content to users on their first two app visits.

## Overview

The "What's New" feature displays a modal with a series of slides to introduce users to new features or improvements in the app. It's designed to:

- Only show on the first two app opens/visits
- Display different content based on platform (web or iOS)
- Provide a beautiful, engaging introduction to the app

## Implementation Details

### Components

1. **OnboardingContext**: Manages the onboarding state, tracks visit counts, and determines whether to show the modal.
2. **WhatsNewModal**: The UI component that displays the slides with images, titles, and descriptions.

### Database

The feature uses a `user_onboarding` table in Supabase to track:
- User ID
- Visit count
- Creation and update timestamps

This ensures the onboarding state persists across devices and sessions.

## Customizing Content

To update the content shown in the "What's New" modal, edit the `webContent` and `iosContent` arrays in the `WhatsNewModal.tsx` file.

Each slide requires:
- `title`: The headline for the slide
- `description`: A brief explanation of the feature
- `imageUrl`: A URL to an image (preferably from Unsplash)

Example:
```typescript
const webContent: WhatsNewSlide[] = [
  {
    title: "Welcome to the new Logday",
    description: "We've made significant improvements to help you track your fitness journey more effectively.",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
  },
  // Add more slides as needed
];
```

## Testing

To test the onboarding flow:
1. Reset a user's visit count in the Supabase database
2. Log in to the app to see the "What's New" modal
3. After dismissing, log out and log back in to see it one more time
4. On the third login, the modal should no longer appear

## Future Improvements

Potential enhancements:
- Add animation transitions between slides
- Implement a "Skip All" button
- Add the ability to recall the "What's New" modal from settings
- Create a version-based system to show new features on major updates
