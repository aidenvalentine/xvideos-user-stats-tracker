const puppeteer = require('puppeteer');
const request = require('request-promise-native');
const poll = require('promise-poller').default;

const siteDetails = {
  sitekey: '6LcM6ScUAAAAAHFxb4HmgMyNHrfi61bf_USRJ4uo',
  pageurl: 'https://www.xvideos.com/account'
}

// const getUsername = require('./get-username');
// const getPassword = require('./get-password');
const username = "valleytechindustries@gmail.com";
const password = "^HWXgYy6@0TRH4alS7v%5IT!Vw8ZBAFe";
const apiKey = "a944d6976c956a33f3f66cfec53a895a";
// console.log(apiKey);

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
  headless: false,
  slowMo: 10,
  defaultViewport: null
};

(async function main() {
  const browser = await puppeteer.launch(chromeOptions);

  const page = await browser.newPage();

  await page.goto('https://www.xvideos.com/account');

  const requestId = await initiateCaptchaRequest(apiKey);

  // await page.type('#user_reg', getUsername());
  await page.type('body #signin-form_login', username);

  // const password = getPassword();
  await page.type('body #signin-form_password', password);

  page.click('#signin-form > div.form-group.form-buttons > div > button');

  const response = await pollForRequestResults(apiKey, requestId);

  await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${response}";`);

  // page.click('#signin-form > div.form-group.form-buttons > div > button');
  await page.evaluate("document.getElementById('signin-form').submit();");

  await page.waitForSelector('div#page.account-page');

  await page.on('console', msg => console.log(msg.text()));

  await page.on('response', async (response) => {
    if (response.url() == "https://www.xvideos.com/account/uploads/statistics.json") {
      console.log('XHR response received');
      console.log(await response.json());
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
        // stats = result; // Set our global stats object with this nice dataset.
        // cb(result);
      },
      dataType: "json"
    });

    // return await new Promise(resolve => {
    //   setTimeout(() => {
    //     resolve([1, 2, 3]);
    //   }, 3000)
    // });
  });

  // let msg = await page.evaluate(function() {
  //   // The PROPER way of getting the stats via AJAX
  //   $.ajax({
  //     type: "POST",
  //     url: "https://www.xvideos.com/account/uploads/statistics.json",
  //     data: "uploader-stats-filter%5Bdates%5D%5Bfrom%5D=&uploader-stats-filter%5Bdates%5D%5Bto%5D=&with_sub_accounts=0",
  //     success: function(result) {
  //       console.log(result);
  //       // stats = result; // Set our global stats object with this nice dataset.
  //       let msg = result;
  //     },
  //     dataType: "json"
  //   });
  //   return msg;
  // });
  // console.log(msg);

})()

async function initiateCaptchaRequest(apiKey) {
  console.log("Sending request to 2captcha");
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
  console.log("Polling for results");
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