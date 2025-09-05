# Google Messages Scraper Chrome Extension

A Chrome extension that scrapes your messages from Google Messages Web (messages.google.com) and sends them to a Google Sheets API.

## Features

* **🤖 Automated Message Scraping**: Scrapes messages from Google Messages Web conversations
* **💬 Multi-Chat Support**: Can scrape multiple conversations containing specific keywords
* **📅 Date Filtering**: Only scrapes messages after a specified threshold date
* **⏱️ Real-time Progress**: Live progress updates with timestamps
* **⚙️ Flexible Configuration**: Customizable search terms, limits, and date ranges
* **🔗 API Integration**: Automatically sends scraped data to Google Sheets via [wrapper API](https://github.com/nikiljos/gsheet-wrapper-api)

## Demo
https://github.com/user-attachments/assets/3aa9cfde-b366-4fc4-a842-b2ae36c54454


## How It Works

1. **Navigate** to [messages.google.com](https://messages.google.com)
2. **Click the extension icon** to open the popup
3. **Configure settings**:
   - **Search Slug**: Keywords to find specific conversations (e.g., "NSESMS", "JIOVOC")
   - **Limit**: Maximum number of threads to scrape
   - **Threshold Date**: Only scrape messages after this date
4. **Choose scraping mode**:
   - **Start Auto Scraping**: Finds and scrapes multiple unread conversations automatically
   - **Scrape Current Chat**: Scrapes all messages (after threshold) from the currently open conversation

## Installation

1. **Clone or download** this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top right)
4. **Click "Load unpacked"** and select the extension folder
5. **Configure** the `config.js` file with your API credentials

## Configuration

### Required Setup

1. **Copy `config.sample.js` to `config.js`**:

   ```bash
   cp config.sample.js config.js
   ```

2. **Update `config.js`** with your settings:
   ```javascript
   const CONFIG = {
     API_ENDPOINT: "your-api-endpoint",
     API_TOKEN: "your-api-token",
     SPREADSHEET_ID: "your-spreadsheet-id",
     SHEET_NAME: "your-sheet-name",
     THRESHOLD_DAY_OFFSET: 7, // Days ago for default threshold
     DEFAULT_SLUG: "your-default-slug",
     DEFAULT_THREAD_LIMIT: 10,
   };
   ```

### Configuration Options

- **API_ENDPOINT**: Your Google Sheets wrapper API endpoint
- **API_TOKEN**: Authentication token for the API
- **SPREADSHEET_ID**: Google Sheets document ID
- **SHEET_NAME**: Name of the sheet tab to write data to
- **THRESHOLD_DAY_OFFSET**: Default number of days ago for threshold date
- **DEFAULT_SLUG**: Default search keywords (comma-separated)
- **DEFAULT_THREAD_LIMIT**: Default maximum conversations to scrape

## Usage

### Auto Scraping Mode

1. Set your search slug
2. Set the limit (number of conversations)
3. Set the threshold date (messages after this date)
4. Click **Start Auto Scraping**
5. Watch the live progress as it:
   - Finds matching conversations
   - Opens each conversation
   - Scrapes messages
   - Sends data to API

### Current Chat Mode

1. Open the conversation you want to scrape
2. Set the threshold date
3. Click **Scrape Current Chat**
4. Watch as it scrapes the current conversation

## Data Format

Scraped messages are sent to the API in the following format:

```javascript
[
  [isoDate, senderId, sheetDate, messageText],
  // ... more messages
];
```

- **isoDate**: ISO timestamp of the message
- **senderId**: Name/ID of the message sender
- **sheetDate**: Formatted date for spreadsheet display
- **messageText**: The actual message content
