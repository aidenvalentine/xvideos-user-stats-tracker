const puppeteer = require('puppeteer');
const request = require('request-promise-native').defaults({
  // proxy: 'http://username:password@host:port', // Fixes potential timeout issues.
  strictSSL: false // Fixes potential timeout issues.
});
const Influx = require("influx");

// Get user config from .env file
require('dotenv').config()

// Grab your variables from the .env file. Make sure these values are set!
const dbName = process.env.DB_NAME || "xvideos_aiden_valentine_stats_db";
const dbHost = process.env.DB_HOST || "127.0.0.1";
const dbUser = process.env.DB_USER || "";
const dbPass = process.env.DB_PASS || "";
const dbPort = process.env.DB_PORT || 8086;

// Influx data model for Xvideos User Statistics
var influx = new Influx.InfluxDB({
  host: '127.0.0.1',
  database: dbName,
  username: '',
  password: '',
  port: 8086,
  schema: [{
    measurement: 'user_stats',
    fields: {
      profileHits: Influx.FieldType.INTEGER,
      subscribers: Influx.FieldType.INTEGER,
      videosViews: Influx.FieldType.INTEGER,
      pornstarViews: Influx.FieldType.INTEGER,
      pornActorWorldRanking: Influx.FieldType.INTEGER,
      pornActorContinentRanking: Influx.FieldType.INTEGER,
      pornActorCountryRanking: Influx.FieldType.INTEGER,
      channelWorldRanking: Influx.FieldType.INTEGER,
      channelContinentRanking: Influx.FieldType.INTEGER,
      channelCountryRanking: Influx.FieldType.INTEGER,
      maleGlobalWorldRanking: Influx.FieldType.INTEGER,
      maleGlobalContinentRanking: Influx.FieldType.INTEGER,
      maleGlobalCountryRanking: Influx.FieldType.INTEGER,
      numberOfVideos: Influx.FieldType.INTEGER,
      // votes: Influx.FieldType.INTEGER,
      friends: Influx.FieldType.INTEGER,
      fans: Influx.FieldType.INTEGER,
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
  const browser = await puppeteer.launch(chromeOptions);

  const page = await browser.newPage();

  await page.goto('https://www.xvideos.com/pornstar-channels/aidenvalentineofficial#_tabAboutMe', {waitUntil: 'networkidle2'});

  // var metadata = {}; // Create global variable.

  // Fetch data
  var metadata = await page.evaluate(() => {
    var metadata = {}; // Create global variable.
    // Grab variables from the document
    metadata.profileHits = parseInt($("#pinfo-profile-hits > span").text().replace(/,/g, ""));
    metadata.subscribers = parseInt($("#pinfo-subscribers > span").text().replace(/,/g, ""));
    metadata.videosViews = parseInt($("#pinfo-videos-views > span").text().replace(/,/g, ""));
    metadata.pornstarViews = parseInt($("#pinfo-pornstar-views > span").text().replace(/,/g, ""));
    metadata.pornActorWorldRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(10) > span:nth-child(3) > strong > a").text().replace(/,/g, ""));
    metadata.pornActorContinentRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(10) > span:nth-child(5) > strong > a").text().replace(/,/g, ""));
    metadata.pornActorCountryRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(10) > span:nth-child(7) > strong > a").text().replace(/,/g, ""));
    metadata.channelWorldRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(13) > span:nth-child(3) > strong > a").text().replace(/,/g, ""));
    metadata.channelContinentRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(13) > span:nth-child(5) > strong > a").text().replace(/,/g, ""));
    metadata.channelCountryRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(13) > span:nth-child(7) > strong > a").text().replace(/,/g, ""));
    metadata.maleGlobalWorldRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(16) > span:nth-child(3) > strong > a").text().replace(/,/g, ""));
    metadata.maleGlobalContinentRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(16) > span:nth-child(5) > strong > a").text().replace(/,/g, ""));
    metadata.maleGlobalCountryRanking = parseInt($("#pfinfo-col-col1 > p:nth-child(16) > span:nth-child(7) > strong > a").text().replace(/,/g, ""));
    // var numberOfVideos = $("#tabAboutMe > h4 > a > strong").text().replace(/,/g, "");
    // var votes = $("#pfinfo-col-pict > div.rating-box > div > span").text().replace(/,/g, "");
    // console.log(votes);
    metadata.friends = parseInt($("#tab-friends > span.navbadge").text().split("/")[0].replace(/,/g, "").replace(/\s/g, ""));
    metadata.fans = parseInt($("#tab-friends > span.navbadge").text().split("/")[1].replace(/,/g, "").replace(/\s/g, ""));
    metadata.username = $("#profile-title > h2 > strong").text();
    metadata.numberOfVideos = parseInt($("#tabAboutMe > h4 > a > strong").text()); // TEMP - This is not the most accurate count.
    console.log(metadata);
    return metadata;
  });

  // await page.goto('https://www.xvideos.com/pornstar-channels/aidenvalentineofficial#_tabVideos,videos-new');

  console.log('Data received');
  // var data = await response.detail.json();
  console.log("Adding/updating row in database\n", JSON.stringify(metadata, 2, 2));
  // Write data to database
  influx.writePoints([{
      measurement: 'user_stats',
      tags: {
        username: metadata.username,
      },
      fields: {
        profileHits: metadata.profileHits,
        subscribers: metadata.subscribers,
        videosViews: metadata.videosViews,
        pornstarViews: metadata.pornstarViews,
        pornActorWorldRanking: metadata.pornActorWorldRanking,
        pornActorContinentRanking: metadata.pornActorContinentRanking,
        pornActorCountryRanking: metadata.pornActorCountryRanking,
        channelWorldRanking: metadata.channelWorldRanking,
        channelContinentRanking: metadata.channelContinentRanking,
        channelCountryRanking: metadata.channelCountryRanking,
        maleGlobalWorldRanking: metadata.maleGlobalWorldRanking,
        maleGlobalContinentRanking: metadata.maleGlobalContinentRanking,
        maleGlobalCountryRanking: metadata.maleGlobalCountryRanking,
        numberOfVideos: metadata.numberOfVideos,
        // votes: metadata.votes,
        friends: metadata.friends,
        fans: metadata.fans,
      },
      // timestamp: new Date().getTime(),
    }], {
      database: dbName,
      precision: 's',
    })
    .then(function() {
      console.log("Success!");
      page.close();
      process.exit(0); // Success
    })
    .catch(error => {
      console.error(`Error saving data to InfluxDB! ${error}`)
      page.close();
      process.exit(1); // Failure
    })

})()
