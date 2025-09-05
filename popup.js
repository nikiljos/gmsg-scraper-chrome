// Popup script for handling button clicks and checking current tab
document.addEventListener("DOMContentLoaded", async () => {
  // Listen for progress updates from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "progressUpdate") {
      const resultDiv = document.getElementById("result");
      const timestamp = new Date().toLocaleTimeString();

      let statusClass = "info";
      if (request.type === "success") statusClass = "success";
      if (request.type === "warning") statusClass = "warning";
      if (request.type === "error") statusClass = "error";

      // Add new progress message to the result div
      const progressDiv = document.createElement("div");
      progressDiv.className = `status ${statusClass}`;
      progressDiv.style.marginBottom = "8px";
      progressDiv.style.fontSize = "12px";

      // Create timestamp element
      const timestampDiv = document.createElement("div");
      timestampDiv.textContent = `${timestamp}`;
      timestampDiv.style.fontFamily = "monospace";
      timestampDiv.style.fontSize = "11px";
      timestampDiv.style.color = "#666";
      timestampDiv.style.marginBottom = "3px";

      // Create message element
      const messageDiv = document.createElement("div");
      messageDiv.textContent = request.message;
      // messageDiv.style.paddingLeft = "4px";

      progressDiv.appendChild(timestampDiv);
      progressDiv.appendChild(messageDiv);
      resultDiv.appendChild(progressDiv);

      // Scroll to bottom to show latest message
      resultDiv.scrollTop = resultDiv.scrollHeight;
    }
  });
  const statusDiv = document.getElementById("status");
  const scrapeBtn = document.getElementById("scrapeBtn");
  const scrapeCurrentBtn = document.getElementById("scrapeCurrentBtn");
  const slugInput = document.getElementById("slugInput");
  const limitInput = document.getElementById("limitInput");
  const thresholdDateInput = document.getElementById("thresholdDateInput");

  // Set default values from config
  slugInput.value = CONFIG.DEFAULT_SLUG;
  limitInput.value = CONFIG.DEFAULT_THREAD_LIMIT;

  // Set default threshold date (n days ago) in local timezone
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - CONFIG.THRESHOLD_DAY_OFFSET);

  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const year = daysAgo.getFullYear();
  const month = String(daysAgo.getMonth() + 1).padStart(2, "0");
  const day = String(daysAgo.getDate()).padStart(2, "0");
  const hours = String(daysAgo.getHours()).padStart(2, "0");
  const minutes = String(daysAgo.getMinutes()).padStart(2, "0");

  thresholdDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;

  // Check if current tab is on Google Messages
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.url && tab.url.includes("messages.google.com")) {
      statusDiv.textContent = "Ready to scrape! You are on Google Messages.";
      statusDiv.className = "status success";
      scrapeBtn.disabled = false;
      scrapeCurrentBtn.disabled = false;
    } else {
      statusDiv.textContent = "Please navigate to messages.google.com first.";
      statusDiv.className = "status error";
      scrapeBtn.disabled = true;
      scrapeCurrentBtn.disabled = true;
    }
  } catch (error) {
    statusDiv.textContent = "Error checking current page.";
    statusDiv.className = "status error";
    scrapeBtn.disabled = true;
    scrapeCurrentBtn.disabled = true;
  }

  // Handle scrape button click
  scrapeBtn.addEventListener("click", async () => {
    const slug = slugInput.value.trim();
    const limit = parseInt(limitInput.value) || 3;
    const thresholdDate = new Date(thresholdDateInput.value);

    if (!slug) {
      chrome.runtime.sendMessage({
        action: "progressUpdate",
        message: "Please enter a search slug.",
        type: "error",
      });
      return;
    }

    if (!thresholdDateInput.value) {
      chrome.runtime.sendMessage({
        action: "progressUpdate",
        message: "Please select a threshold date.",
        type: "error",
      });
      return;
    }

    scrapeBtn.disabled = true;
    scrapeBtn.textContent = "Scraping...";
    chrome.runtime.sendMessage({
      action: "progressUpdate",
      message: "Starting scrape process...",
      type: "info",
    });

    try {
      // Send message to content script to start scraping
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "startScraping",
        slug: slug,
        limit: limit,
        thresholdDate: thresholdDate.toISOString(),
      });

      if (response && response.success) {
        // Send final success message as progress update
        chrome.runtime.sendMessage({
          action: "progressUpdate",
          message: `Scraping completed! Found ${response.threadsFound} threads.`,
          type: "success",
        });
      } else {
        // Send final warning message as progress update
        chrome.runtime.sendMessage({
          action: "progressUpdate",
          message: `Scraping completed with message: ${
            response?.message || "Unknown response"
          }`,
          type: "warning",
        });
      }
    } catch (error) {
      // Send error message as progress update
      chrome.runtime.sendMessage({
        action: "progressUpdate",
        message: `Error: ${error.message}`,
        type: "error",
      });
    } finally {
      scrapeBtn.disabled = false;
      scrapeBtn.textContent = "Start Scraping";
    }
  });

  // Handle scrape current chat button click
  scrapeCurrentBtn.addEventListener("click", async () => {
    const thresholdDate = new Date(thresholdDateInput.value);

    if (!thresholdDateInput.value) {
      chrome.runtime.sendMessage({
        action: "progressUpdate",
        message: "Please select a threshold date.",
        type: "error",
      });
      return;
    }

    scrapeCurrentBtn.disabled = true;
    scrapeCurrentBtn.textContent = "Scraping...";
    chrome.runtime.sendMessage({
      action: "progressUpdate",
      message: "Scraping current chat...",
      type: "info",
    });

    try {
      // Send message to content script to scrape current chat
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "scrapeCurrentChat",
        thresholdDate: thresholdDate.toISOString(),
      });

      if (response && response.success) {
        // Send final success message as progress update
        chrome.runtime.sendMessage({
          action: "progressUpdate",
          message: `Current chat scraped successfully! ${response.message}`,
          type: "success",
        });
      } else {
        // Send final warning message as progress update
        chrome.runtime.sendMessage({
          action: "progressUpdate",
          message: `Scraping completed with message: ${
            response?.message || "Unknown response"
          }`,
          type: "warning",
        });
      }
    } catch (error) {
      // Send error message as progress update
      chrome.runtime.sendMessage({
        action: "progressUpdate",
        message: `Error: ${error.message}`,
        type: "error",
      });
    } finally {
      scrapeCurrentBtn.disabled = false;
      scrapeCurrentBtn.textContent = "Scrape Current Chat";
    }
  });
});
