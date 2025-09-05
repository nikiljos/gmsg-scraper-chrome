// Main content script for Google Messages scraping
// This script runs on https://messages.google.com/*

// Utility function
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main scraping function
const scrapeAndPostData = async (thresholdDate = null) => {
  sendProgressUpdate("Scraping messages from current chat...", "info");
  thresholdDate &&
    sendProgressUpdate(
      `Using threshold date: ${thresholdDate.toLocaleString("en-GB")}`,
      "info"
    );
  // --- Scrape data from DOM ---
  const scrapedData = Array.from(
    document.querySelectorAll(".text-msg.msg-content, .tombstone-timestamp")
  ).map((el) => el.innerText);

  const senderId = document.querySelector(
    ".title > .ng-star-inserted"
  ).innerText;

  sendProgressUpdate(
    `Found ${scrapedData.length} message elements from ${senderId}`,
    "info"
  );

  const parsedMessages = parseMessages(scrapedData);
  // console.log({senderId,parsedMessages})
  const final2dArray = [];

  parsedMessages.slice(-10).forEach((msgGrp) => {
    if (thresholdDate && !(msgGrp.date > thresholdDate)) {
      return;
    }

    const isoDate = msgGrp.date?.toISOString();
    const sheetDate = msgGrp.date?.toLocaleString("en-US", {
      hour12: false,
    });

    msgGrp.messages?.forEach((msg) => {
      const msgArray = [isoDate, senderId, sheetDate, msg];
      final2dArray.push(msgArray);
    });
  });

  // console.log(final2dArray)
  sendProgressUpdate(
    `Processing ${final2dArray.length} messages to send to API...`,
    "info"
  );

  const apiRes =
    final2dArray.length > 0
      ? await addDataToApi(final2dArray)
      : { message: "No messages to insert" };

  if (final2dArray.length > 0) {
    sendProgressUpdate(
      `Successfully sent ${final2dArray.length} messages to API`,
      "success"
    );
  } else {
    sendProgressUpdate(
      "No messages to insert (all messages were before threshold date)",
      "warning"
    );
  }

  console.log(apiRes);

  return apiRes;
};

// Helper function to send progress updates
function sendProgressUpdate(message, type = "info") {
  chrome.runtime.sendMessage({
    action: "progressUpdate",
    message: message,
    type: type,
  });
}

// Main function to open chats and scrape
async function openChatAndScrape(slugs, limit = 2, thresholdDate = null) {
  let threadsFound = 0;
  let totalChats = 0;

  // First, count total chats
  for (const slug of slugs) {
    const elements = Array.from(document.querySelectorAll(".unread > .name"))
      .filter((elt) => elt.innerText.includes(slug))
      .slice(0, limit);
    totalChats += elements.length;
  }

  sendProgressUpdate(`Found ${totalChats} total chats to scrape`, "info");

  let currentChat = 0;
  for (const slug of slugs) {
    const elements = Array.from(document.querySelectorAll(".unread > .name"))
      .filter((elt) => elt.innerText.includes(slug))
      .slice(0, limit)
      .reverse();

    console.log("Found", elements.length, "threads for slug:", slug);
    sendProgressUpdate(
      `Processing slug "${slug}" - ${elements.length} chats`,
      "info"
    );

    for (const elt of elements) {
      currentChat++;
      sendProgressUpdate(
        `Opening chat ${currentChat}/${totalChats} (${elt.innerText})...`,
        "info"
      );
      elt.click();

      sendProgressUpdate(`Waiting 6 seconds for chat to load...`, "info");
      await sleep(6 * 1000); // wait N s before moving to next element

      sendProgressUpdate(
        `Scraping chat ${currentChat}/${totalChats}...`,
        "info"
      );
      await scrapeAndPostData(thresholdDate); // wait until this finishes

      // sendProgressUpdate(
      //   `Completed chat ${currentChat}/${totalChats}`,
      //   "success"
      // );
    }
    console.log("Bye 👋");

    threadsFound += elements.length;
  }

  sendProgressUpdate(
    `All chats scraped! Found ${threadsFound} threads total.`,
    "success"
  );
  return { threadsFound };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startScraping") {
    const { slug, limit, thresholdDate } = request;

    const slugList = slug.split(",").map((x) => x.trim());
    const thresholdDateObj = thresholdDate ? new Date(thresholdDate) : null;
    // Execute scraping function
    openChatAndScrape(slugList, limit, thresholdDateObj)
      .then((result) => {
        sendResponse({
          success: true,
          message: "Scraping completed successfully",
          threadsFound: result.threadsFound,
        });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          message: error.message,
        });
      });

    // Return true to indicate we will send a response asynchronously
    return true;
  }

  if (request.action === "scrapeCurrentChat") {
    // Execute scrapeAndPostData function directly
    const { thresholdDate } = request;
    const thresholdDateObj = thresholdDate ? new Date(thresholdDate) : null;
    sendProgressUpdate("Starting to scrape current chat...", "info");
    scrapeAndPostData(thresholdDateObj)
      .then((result) => {
        sendResponse({
          success: true,
          message: result.message || "Current chat scraped successfully",
        });
      })
      .catch((error) => {
        sendProgressUpdate(`Error: ${error.message}`, "error");
        sendResponse({
          success: false,
          message: error.message,
        });
      });

    // Return true to indicate we will send a response asynchronously
    return true;
  }
});
