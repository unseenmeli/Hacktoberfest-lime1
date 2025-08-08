# OneShot App - iOS Build Instructions for App Store

## Prerequisites Completed ✅
- App icon and splash screen added to `/assets/`
- App.json configured with proper bundle identifier and permissions
- User authentication filtering fixed (users only see their own apps)

## Steps to Build for iOS and Upload to App Store

### 1. Build the iOS App with EAS Build

Run the following command in your terminal:
```bash
eas build --platform ios --profile production
```

When prompted:
- Choose "Yes" to log in to your Apple account
- Enter your Apple Developer account credentials
- Let EAS handle the provisioning profiles and certificates

### 2. Alternative: Build Locally for Xcode

If you prefer to build locally and open in Xcode:
```bash
# Build for iOS simulator (for testing)
eas build --platform ios --profile preview --local

# Or build for device
eas build --platform ios --profile production --local
```

### 3. Submit to App Store

Once the build is complete, you can submit directly using EAS:
```bash
eas submit --platform ios
```

Or manually:
1. Download the .ipa file from the EAS build page
2. Open Xcode
3. Go to Window > Organizer
4. Select your app and click "Distribute App"
5. Follow the App Store Connect upload process

### 4. App Store Connect Setup

Before submitting, ensure you have:
1. Created your app in App Store Connect
2. Filled in all required information:
   - App description
   - Keywords
   - Categories
   - Screenshots for required device sizes
   - Privacy policy URL (if needed)

### 5. Important Configuration Details

- **Bundle Identifier**: `fly.dev.oneshot.unseenmeli`
- **Version**: 1.0.0
- **Build Number**: Will auto-increment with each build
- **Supported Devices**: iPhone only (iPad support disabled)
- **Orientation**: Portrait only

### 6. Required Permissions

The app requests the following permissions:
- **Photo Library Access**: For uploading app logos
- **Camera Access**: For taking photos for app logos

### 7. Server Configuration

Ensure your server at `https://one-shot.fly.dev` is running and accessible before submitting to App Store.

### 8. Testing Checklist Before Submission

- [ ] Test user registration and login
- [ ] Test creating a new app
- [ ] Test viewing only your own apps (security check)
- [ ] Test uploading logos from photo library
- [ ] Test dark mode functionality
- [ ] Test keyboard dismissal on all screens
- [ ] Test on different iPhone models

## Troubleshooting

If you encounter issues:

1. **Build fails**: Make sure you have an active Apple Developer account ($99/year)
2. **Certificate issues**: Let EAS manage certificates automatically
3. **Bundle identifier conflict**: Ensure the bundle ID is unique in your Apple Developer account

## Next Steps

After successful App Store submission:
1. Monitor review status in App Store Connect
2. Respond to any review feedback
3. Plan future updates and features

Good luck with your App Store submission! 🚀