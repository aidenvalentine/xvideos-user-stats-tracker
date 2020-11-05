const puppeteer = require('puppeteer');
const request = require('request-promise-native').defaults({
  // proxy: 'http://username:password@host:port', // Fixes potential timeout issues.
  strictSSL: false // Fixes potential timeout issues.
});
const poll = require('promise-poller').default;
const Influx = require("influx");

// Get user config from .env file
require('dotenv').config()

const siteDetails = {
  sitekey: '6LcM6ScUAAAAAHFxb4HmgMyNHrfi61bf_USRJ4uo',
  pageurl: 'https://www.xvideos.com/account'
}

// Grab your variables from the .env file. Make sure these values are set!
const username = process.env.XVIDEOS_USERNAME;
const password = process.env.XVIDEOS_PASSWORD;
const apiKey = process.env.CAPTCHA_API_KEY;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbUser = process.env.DB_USER || "";
const dbPass = process.env.DB_PASS || "";
const dbPort = process.env.DB_PORT || 8086;

// Influx data model for Xvideos Earnings Statistics
var earnings = new Influx.InfluxDB({
  host: dbHost,
  database: dbName,
  username: dbUser,
  password: dbPass,
  port: dbPort,
  schema: [{
    measurement: 'earnings_stats',
    fields: {
      totalViews: Influx.FieldType.INTEGER,
      paidViews: Influx.FieldType.INTEGER,
      networkViews: Influx.FieldType.INTEGER,
      xvideosViews: Influx.FieldType.INTEGER,
      freeVideosEarnings: Influx.FieldType.FLOAT,
      totalEarnings: Influx.FieldType.FLOAT,
      xvideosRedEarnings: Influx.FieldType.FLOAT,
    },
    tags: [
      'username'
    ]
  }],
  options: {
    timeout: 5 * 60 * 1000 // Increase the timeout -- it's a lot of data. Fixes potential timeout issues.
  }
})

// Make our browser look less like a robot! An ounce of prevention...
const args = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-infobars',
  '--window-position=0,0',
  '--ignore-certifcate-errors',
  '--ignore-certifcate-errors-spki-list',
  '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
];

const chromeOptions = {
  args,
  executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: false, // To debug, set to true and it'll show the browser window.
  slowMo: 10,
  defaultViewport: null
};

(async function main() {
  var arr = []; // data array for influxdb batch job.

  const browser = await puppeteer.launch(chromeOptions);

  const page = await browser.newPage();

  await page.goto('https://www.xvideos.com/account');

  await page.type('#signin-form_login', username);

  await page.type('#signin-form_password', password);

  const requestId = await initiateCaptchaRequest(apiKey);

  // Manually trigger recaptcha so this script works every time. Maybe we could add logic to tell if recaptcha was triggered or not to decide if we even need to solve one.
  await page.evaluate(`grecaptcha.execute();`);

  const response = await pollForRequestResults(apiKey, requestId);

  await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);

  await page.evaluate("document.getElementById('signin-form').submit();");

  await page.waitForSelector('div#page.account-page');

  await page.on('response', async (response) => {
    if (response.url() == "https://www.xvideos.com/account/uploads/statistics.json") {
      console.log('XHR response received');
      var data = await response.json();
      data.graph_stats.forEach((item, i) => {
        var obj = {
          measurement: 'earnings_stats',
          tags: {
            username: "Aiden Valentine Official",
          },
          fields: {
            totalViews: item.v,
            paidViews: item.r,
            networkViews: item.o,
            xvideosViews: item.x,
            freeVideosEarnings: item.e,
            totalEarnings: item.te,
            xvideosRedEarnings: item.f,
          },
          timestamp: new Date(item.date).getTime() / 1000,
        };
        console.log("Adding item to array.\n", obj);
        arr.push(obj);

        // On last record, send the array w/ earnings data to the database.
        if (i == data.graph_stats.length - 1) {
          writeData(arr);
          console.log(arr);
          console.log("Writing data to database.");
        }
      });
      console.log("Database update complete.");
      await browser.close();
    }
  });

  await page.evaluate(() => {
    // this will be executed within the page, that was loaded before
    // The PROPER way of getting the stats via AJAX
    return $.ajax({
      type: "POST",
      url: "https://www.xvideos.com/account/uploads/statistics.json",
      data: "uploader-stats-filter%5Bdates%5D%5Bfrom%5D=&uploader-stats-filter%5Bdates%5D%5Bto%5D=&with_sub_accounts=0",
      success: function(result) {
        console.log(result);
      },
      dataType: "json"
    });
  });
})()

async function initiateCaptchaRequest(apiKey) {
  console.log("Sending captcha data to 2captcha for solving.");
  const formData = {
    method: 'userrecaptcha',
    googlekey: siteDetails.sitekey,
    key: apiKey,
    pageurl: siteDetails.pageurl,
    json: 1
  };
  const response = await request.post('http://2captcha.com/in.php', {
    form: formData
  });
  return JSON.parse(response).request;
}

async function pollForRequestResults(key, id, retries = 30, interval = 1500, delay = 15000) {
  await timeout(delay);
  return poll({
    taskFn: requestCaptchaResults(key, id),
    interval,
    retries
  });
}

function requestCaptchaResults(apiKey, requestId) {
  const url = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;
  return async function() {
    return new Promise(async function(resolve, reject) {
      const rawResponse = await request.get(url);
      const resp = JSON.parse(rawResponse);
      console.log(resp);
      if (resp.status === 0) return reject(resp.request);
      resolve(resp.request);
    });
  }
}

const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))

// Send as a batch job so we don't kill/overload the database API. It's nice.
function writeData(data) {
  // Write data to database
  earnings.writePoints(data, {
      database: dbName,
      precision: 's',
    })
    .catch(error => {
      console.error(`Error saving data to InfluxDB! ${error}`)
    })
}
