const puppeteer = require("puppeteer");
const fs = require("fs");
const converter = require("json-2-csv");

async function startBrowser() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  return { browser, page };
}

async function closeBrowser(browser) {
  return browser.close();
}

async function playTest(url) {
  const { browser, page } = await startBrowser();
  page.setViewport({ width: 1366, height: 768 });
  await page.goto(url);

  // scrap data with payouts

  const data_with_payouts = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll('table[id="payo"] > tbody > tr'),
      (row) =>
        Array.from(row.querySelectorAll("th, td"), (cell) => cell.innerText)
    )
  );
  const data_without_payouts = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll('table[id="wpayo"] > tbody > tr'),
      (row) =>
        Array.from(row.querySelectorAll("th, td"), (cell) => cell.innerText)
    )
  );

  const finalArrayWithPayout = tableToJson(data_with_payouts);
  const finalArrayWithoutPayout = tableToJson(data_without_payouts, false);

  // optional (store in JSON)

  await generateJSON(finalArrayWithPayout, "data-with-payout.json");
  await generateJSON(finalArrayWithoutPayout, "data-without-payout.json");

  // store in CSV format

  await generateCSV(finalArrayWithPayout, "data-with-payout.csv");
  await generateCSV(finalArrayWithoutPayout, "data-without-payout.csv");
  closeBrowser(browser);
  console.log("done");
}

function tableToJson(data, data_with_payouts = true) {
  // don't need the first one
  data.shift();

  let finalArray = [];
  for (let item of data) {
    const obj = {
      symbol: item[0],
      company_name: item[1],
      face_value: item[2],
      last_close: item[3],
    };

    // since this has more fields so we append them
    if (data_with_payouts) {
      obj["bc_from"] = item[4];
      obj["bc_to"] = item[5];
      obj["payout"] = item[6];
    }

    finalArray.push(obj);
  }

  return finalArray;
}

async function generateCSV(data, outputDestPath) {
  const csv = await converter.json2csvAsync(data);
  fs.writeFileSync(outputDestPath, csv);
  console.log("CSV file written successfully");
}

async function generateJSON(data, outputDestPath) {
  fs.writeFileSync(outputDestPath, JSON.stringify(data));
  console.log("JSON written successfully");
}

// this runs when the app runs
(async () => {
  await playTest("https://www.ksestocks.com/BookClosures");
  process.exit(1);
})();
