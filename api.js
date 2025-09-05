// API functions module
const addDataToApi = (data) => {
  return fetch(CONFIG.API_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "*/*",
      Authorization: "Bearer " + CONFIG.API_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      spreadsheetId: CONFIG.SPREADSHEET_ID,
      sheetName: CONFIG.SHEET_NAME,
      sheetValueInput: "USER_ENTERED",
      data,
    }),
  }).then((res) => res.json());
};
