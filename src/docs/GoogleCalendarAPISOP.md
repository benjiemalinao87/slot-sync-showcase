
# Google Calendar API Integration - Standard Operating Procedure (SOP)

## Purpose
This document provides step-by-step instructions for setting up and configuring Google Calendar API integration with our scheduling application. This SOP is intended for technical administrators and IT personnel responsible for implementing and maintaining the system.

## Scope
This procedure covers:
- Creating a Google Cloud Platform project
- Enabling the Google Calendar API
- Setting up OAuth authentication
- Configuring the application to use the Google Calendar API
- Managing calendar access for sales representatives

## Responsibilities
- **IT Administrator**: Initial setup of Google Cloud Platform project and API credentials
- **System Administrator**: Application configuration and maintenance
- **Sales Team Manager**: Managing calendar access and permissions for sales representatives

## Prerequisites
- Google Workspace or Gmail account with administrative privileges
- Access to company Google Calendars
- Administrative access to the scheduling application
- Google Calendar for each sales representative

## Procedure

### 1. Google Cloud Platform Setup

#### 1.1. Create a Google Cloud Project
1. Log in to [Google Cloud Console](https://console.cloud.google.com/) with an administrator account
2. Click on the project dropdown in the top navigation bar
3. Click "New Project"
4. Enter a descriptive project name (e.g., "Company-Scheduling-System")
5. Select your organization (if applicable)
6. Click "Create"
7. Wait for the project to be created, then select it from the dropdown

#### 1.2. Enable Billing (if required)
1. In the Google Cloud Console, go to "Billing"
2. Link an existing billing account or create a new one
3. Follow the prompts to complete the billing setup
   - Note: Google provides a free tier that may be sufficient for small implementations

#### 1.3. Enable Google Calendar API
1. In the left navigation menu, go to "APIs & Services" > "Library"
2. In the search bar, type "Google Calendar API"
3. Click on "Google Calendar API" in the search results
4. Click "Enable"
5. Wait for the API to be enabled (this may take a few moments)

### 2. OAuth Consent Screen Configuration

#### 2.1. Set Up OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select the appropriate User Type:
   - **Internal**: For Google Workspace organizations, limiting access to users within your organization
   - **External**: For allowing any Google account to connect (requires Google verification for production use)
3. Click "Create"
4. Complete the "OAuth consent screen" form:
   - App name: Your application name (e.g., "Company Scheduling System")
   - User support email: Enter an email for user support inquiries
   - App logo: Upload your company logo (optional)
   - App domain: Add your application domains (if applicable)
   - Developer contact information: Enter email address(es) for developers
5. Click "Save and Continue"

#### 2.2. Configure Scopes
1. Click "Add or Remove Scopes"
2. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar.readonly` (for viewing calendars)
   - `https://www.googleapis.com/auth/calendar.events.readonly` (for viewing events)
   - `https://www.googleapis.com/auth/calendar.events` (if the app needs to create events)
3. Click "Save and Continue"

#### 2.3. Add Test Users (for External User Type)
1. Click "Add Users"
2. Enter the email addresses of test users
3. Click "Save and Continue"
4. Review the summary and click "Back to Dashboard"

### 3. Create OAuth Credentials

#### 3.1. Generate OAuth Client ID
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: Select "Web application"
4. Name: Enter a descriptive name (e.g., "Scheduling Web Client")
5. Authorized JavaScript Origins: 
   - Add your development URL (e.g., `http://localhost:5173`)
   - Add your production URL (e.g., `https://scheduling.yourcompany.com`)
6. Authorized Redirect URIs:
   - Add your callback URL (e.g., `http://localhost:5173/auth/callback`)
   - Add your production callback URL (e.g., `https://scheduling.yourcompany.com/auth/callback`)
7. Click "Create"
8. A popup will display your Client ID and Client Secret
9. Click the download icon to download the JSON file containing your credentials
10. Click "OK"

#### 3.2. Securely Store Credentials
1. Save the downloaded JSON file in a secure location
2. Record the Client ID and Client Secret in your company's secure password manager
3. Never share the Client Secret in unsecured communications or include it in frontend code

### 4. Application Configuration

#### 4.1. Add Credentials to Application
1. Open your application's configuration files
2. Add the Client ID to the appropriate configuration:
   ```javascript
   // Config file example
   export const GOOGLE_CLIENT_ID = 'your-client-id';
   export const GOOGLE_REDIRECT_URI = 'http://localhost:5173/auth/callback'; // Update for production
   ```
3. For the Client Secret, use environment variables or a secure backend service

#### 4.2. Set Up Calendar IDs
1. For each sales representative, obtain their Google Calendar ID:
   - Open Google Calendar
   - Go to the settings for the specific calendar
   - Scroll down to "Integrate calendar"
   - Copy the "Calendar ID" value
2. Map each sales representative to their Calendar ID in the application configuration

### 5. Testing the Integration

#### 5.1. Verify Authentication Flow
1. Launch the application in development mode
2. Click the "Connect Google Calendar" button
3. Log in with a test user account
4. Grant the requested permissions
5. Verify that the application returns to the callback URL
6. Check that the authentication tokens are properly stored

#### 5.2. Test Calendar Data Retrieval
1. Select a sales representative in the application
2. Select a date on the calendar
3. Verify that the available time slots accurately reflect the sales representative's Google Calendar availability
4. Verify that busy periods in Google Calendar appear as unavailable in the application

#### 5.3. Test Error Scenarios
1. Test with an invalid calendar ID
2. Test with expired authentication tokens
3. Test with a Google account that has no access to the required calendars
4. Verify appropriate error messages are displayed

### 6. Production Deployment

#### 6.1. Update OAuth Credentials
1. Ensure production URLs are added to the Authorized JavaScript Origins and Redirect URIs in the Google Cloud Console
2. Update the application configuration with production URLs
3. Verify the consent screen is properly configured for production use

#### 6.2. Monitor API Usage
1. In Google Cloud Console, go to "APIs & Services" > "Dashboard"
2. Monitor API usage to ensure you stay within quotas
3. Set up alerts for approaching quota limits if necessary

### 7. Maintenance

#### 7.1. Regular Credential Review
1. Review OAuth credentials every 6 months
2. Verify that authorized domains and redirect URIs are current
3. Remove any unused credentials or test users

#### 7.2. API Monitoring
1. Regularly check API usage and quotas
2. Monitor for any error patterns in API requests
3. Stay updated on Google Calendar API changes and deprecations

#### 7.3. User Access Management
1. When a sales representative leaves the company:
   - Remove their calendar from the application
   - Revoke any direct API access
2. For new sales representatives:
   - Add their calendar to the application
   - Configure appropriate calendar sharing permissions

## Troubleshooting

### Common Issues and Resolutions

#### Authentication Failures
- **Issue**: "Error 400: redirect_uri_mismatch"
  - **Resolution**: Verify the redirect URI in the request exactly matches one of the authorized redirect URIs in the Google Cloud Console

- **Issue**: "Error 403: access_denied"
  - **Resolution**: Verify the user has granted the necessary permissions and that the requested scopes match the configured consent screen

#### Calendar Access Problems
- **Issue**: Unable to access calendar data
  - **Resolution**: Verify the calendar ID is correct and that the authenticated user has permission to access the calendar

- **Issue**: Some events not showing as busy
  - **Resolution**: Check the visibility settings on the calendar events; only events marked as "Busy" will appear in freebusy queries

#### API Quota Exceeded
- **Issue**: "Error 403: Calendar usage limits exceeded"
  - **Resolution**: Check your quota usage in Google Cloud Console and request an increase if necessary, or implement caching to reduce API calls

## References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Calendar API Quotas](https://developers.google.com/calendar/api/guides/quota)
- [Google Cloud Console](https://console.cloud.google.com/)

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-04-18 | System Administrator | Initial document creation |
