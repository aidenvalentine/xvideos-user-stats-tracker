const request = require("request");
const cheerio = require("cheerio");
const Influx = require("influx");

// Set your variables
var influxDbName = "xvideos_aiden_valentine_stats_db";
var xvideosProfileUrl = "https://www.xvideos.com/pornstar-channels/aidenvalentineofficial";

// Influx data model for Xvideos User Statistics
var influx = new Influx.InfluxDB({
  host: '127.0.0.1',
  database: influxDbName,
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
  }]
})

var metadata = {}; // Create global variable.

// Send web crawler to user's profile page
request(xvideosProfileUrl, function(error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);

    // Grab variables from the document
    metadata.profileHits = parseInt($("#pinfo-profile-hits > span").text().replace(/,/g, ""));
    metadata.subscribers = parseInt($("#pinfo-subscribers > span").text().replace(/,/g, ""));
    metadata.videosViews = parseInt($("#pinfo-videos-views > span").text().replace(/,/g, ""));
    metadata.pornstarViews = parseInt($("#pinfo-pornstar-views > span").text().replace(/,/g, ""));
    metadata.pornActorWorldRanking = parseInt($("#pinfo-pornstar-ranks > span:nth-child(3) > strong > a").text().replace(/,/g, ""));
    metadata.pornActorContinentRanking = parseInt($("#pinfo-pornstar-ranks > span:nth-child(5) > strong > a").text().replace(/,/g, ""));
    metadata.pornActorCountryRanking = parseInt($("#pinfo-pornstar-ranks > span:nth-child(7) > strong > a").text().replace(/,/g, ""));
    metadata.channelWorldRanking = parseInt($("#pinfo-channel-ranks > span:nth-child(3) > strong > a").text().replace(/,/g, ""));
    metadata.channelContinentRanking = parseInt($("#pinfo-channel-ranks > span:nth-child(5) > strong > a").text().replace(/,/g, ""));
    metadata.channelCountryRanking = parseInt($("#pinfo-channel-ranks > span:nth-child(7) > strong > a").text().replace(/,/g, ""));
    metadata.maleGlobalWorldRanking = parseInt($("#pinfo-pornstar-global-ranks > span:nth-child(3) > strong > a").text().replace(/,/g, ""));
    metadata.maleGlobalContinentRanking = parseInt($("#pinfo-pornstar-global-ranks > span:nth-child(5) > strong > a").text().replace(/,/g, ""));
    metadata.maleGlobalCountryRanking = parseInt($("#pinfo-pornstar-global-ranks > span:nth-child(7) > strong > a").text().replace(/,/g, ""));
    // var numberOfVideos = $("#tabAboutMe > h4 > a > strong").text().replace(/,/g, "");
    // var votes = $("#pfinfo-col-pict > div.rating-box > div > span").text().replace(/,/g, "");
    // console.log(votes);
    metadata.friends = parseInt($("#tab-friends > span.navbadge").text().split("/")[0].replace(/,/g, "").replace(/\s/g, ""));
    metadata.fans = parseInt($("#tab-friends > span.navbadge").text().split("/")[1].replace(/,/g, "").replace(/\s/g, ""));
    metadata.username = $("#profile-title > h2 > strong").text();

    // console.log(metadata); // debug

    // Send web crawler to videos page to get the updated # of videos. (More accurate than profile page)
    request(xvideosProfileUrl + "#_tabVideos", function(error, response, html) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(html);
        metadata.numberOfVideos = parseInt($("#tabAboutMe > h4 > a > strong").text());
        console.log(metadata); // debug
        // metadata.numberOfVideos = metadata.numberOfVideos.match(/\d+/g)[0]; // Search resulting text for digits

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
            // timestamp: tidePoint.epoch,
          }], {
            database: influxDbName,
            precision: 's',
          })
          .catch(error => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
          }).then(() => {
            // Get last 2 entries from database to compare the video count.
            return influx.query(`
                select numberOfVideos from user_stats
                order by time desc
                limit 2
              `)
          }).then(rows => {
            rows.forEach(row => console.log(`${row.numberOfVideos} videos at ${row.time}`)); // debug
            // See if the video count has increase. If so, add annotations to Grafana dashboard.
            if (rows[0].numberOfVideos > rows[1].numberOfVideos) {
              var newVideosCount = rows[0].numberOfVideos - rows[1].numberOfVideos;
              console.log(newVideosCount + " new videos.");

              // Grafana create annotation api request body
              var data = {
                "time": rows[0].time, // Convert to Unix epoch seconds
                "timeEnd": rows[0].time, // Convert to Unix epoch seconds
                "tags": ["release"],
                "text": `${newVideosCount} new releases`
              }

              // Request settings
              const options = {
                url: 'http://admin:admin@localhost:3001/api/annotations',
                headers: {
                  "User-Agent": 'request',
                  "content-type": 'application/json'
                },
                body: data,
                json: true
              };

              function addAnnotation(dashboardId, panelId) {
                options.body.dashboardId = dashboardId;
                options.body.panelId = panelId;
                console.log(options);
                request.post(options, function(error, response, html) {
                  if (!error && response.statusCode == 200) {
                    console.log(response.body);
                  } else {
                    console.error("Error adding annotation.", error, response.body);
                  }
                });
              };
              addAnnotation(1, 2); // Subscribers
              addAnnotation(1, 27); // Profile Hits
              addAnnotation(1, 28); // Total Views
              addAnnotation(1, 29); // Own Uploads Views
            }
          })
        }
      })
  }
});
