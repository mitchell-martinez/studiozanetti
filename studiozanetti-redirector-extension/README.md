# Studio Zanetti Redirector Extension

A Chrome extension that redirects clicks on `studiozanetti.com.au` links to their equivalent pages on `studiozanetti.mitchellmartinez.tech` when you're browsing the `mitchellmartinez.tech` version of the site.

## How It Works

- **Only activates on**: `studiozanetti.mitchellmartinez.tech`
- **Intercepts links to**: `studiozanetti.com.au` and `www.studiozanetti.com.au`
- **Redirects to**: The equivalent page on `studiozanetti.mitchellmartinez.tech`
- **On studiozanetti.com.au**: No interception—you can browse normally

## Installation

### For Development/Testing

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Navigate to and select the `studiozanetti-redirector-extension` folder
5. The extension should now appear in your extensions list

### For Regular Use

Once you're satisfied with testing:
1. Package the extension as a `.crx` file for distribution
2. Or continue using the unpacked version from the developer mode

## Files

- `manifest.json` - Extension configuration and permissions
- `content.js` - Script that runs on mitchellmartinez.tech and intercepts studiozanetti.com.au links

## Example

- **Current site**: `studiozanetti.mitchellmartinez.tech`
- **You click a link to**: `studiozanetti.com.au/portfolio/project-1`
- **You're redirected to**: `studiozanetti.mitchellmartinez.tech/portfolio/project-1`

## Permissions

The extension requests:
- `activeTab` - To detect which tab is active
- `scripting` - To run the content script on mitchellmartinez.tech pages
- Host permissions for both `studiozanetti.mitchellmartinez.tech` and `www.studiozanetti.mitchellmartinez.tech`
