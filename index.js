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

// Send web crawler to user's profile page
request(xvideosProfileUrl, function(error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);

    // Grab variables from the document
    var profileHits = $("#pinfo-profile-hits > span").text().replace(/,/g, "");
    var subscribers = $("#pinfo-subscribers > span").text().replace(/,/g, "");
    var videosViews = $("#pinfo-videos-views > span").text().replace(/,/g, "");
    var pornstarViews = $("#pinfo-pornstar-views > span").text().replace(/,/g, "");
    var pornActorWorldRanking = $("#pinfo-pornstar-ranks > span:nth-child(3) > strong > a").text().replace(/,/g, "");
    var pornActorContinentRanking = $("#pinfo-pornstar-ranks > span:nth-child(5) > strong > a").text().replace(/,/g, "");
    var pornActorCountryRanking = $("#pinfo-pornstar-ranks > span:nth-child(7) > strong > a").text().replace(/,/g, "");
    var channelWorldRanking = $("#pinfo-channel-ranks > span:nth-child(3) > strong > a").text().replace(/,/g, "");
    var channelContinentRanking = $("#pinfo-channel-ranks > span:nth-child(5) > strong > a").text().replace(/,/g, "");
    var channelCountryRanking = $("#pinfo-channel-ranks > span:nth-child(7) > strong > a").text().replace(/,/g, "");
    var maleGlobalWorldRanking = $("#pinfo-pornstar-global-ranks > span:nth-child(3) > strong > a").text().replace(/,/g, "");
    var maleGlobalContinentRanking = $("#pinfo-pornstar-global-ranks > span:nth-child(5) > strong > a").text().replace(/,/g, "");
    var maleGlobalCountryRanking = $("#pinfo-pornstar-global-ranks > span:nth-child(7) > strong > a").text().replace(/,/g, "");
    var numberOfVideos = $("#tabAboutMe > h4 > a > strong").text().replace(/,/g, "");
    // var votes = $("#pfinfo-col-pict > div.rating-box > div > span").text().replace(/,/g, "");
    // console.log(votes);
    var friends = $("#tab-friends > span.navbadge").text().split("/")[0].replace(/,/g, "").replace(/\s/g, "");
    var fans = $("#tab-friends > span.navbadge").text().split("/")[1].replace(/,/g, "").replace(/\s/g, "");

    // Our parsed meta data object
    var metadata = {
      profileHits: parseInt(profileHits),
      subscribers: parseInt(subscribers),
      videosViews: parseInt(videosViews),
      pornstarViews: parseInt(pornstarViews),
      pornActorWorldRanking: parseInt(pornActorWorldRanking),
      pornActorContinentRanking: parseInt(pornActorContinentRanking),
      pornActorCountryRanking: parseInt(pornActorCountryRanking),
      channelWorldRanking: parseInt(channelWorldRanking),
      channelContinentRanking: parseInt(channelContinentRanking),
      channelCountryRanking: parseInt(channelCountryRanking),
      maleGlobalWorldRanking: parseInt(maleGlobalWorldRanking),
      maleGlobalContinentRanking: parseInt(maleGlobalContinentRanking),
      maleGlobalCountryRanking: parseInt(maleGlobalCountryRanking),
      numberOfVideos: parseInt(numberOfVideos),
      // votes: parseInt(votes),
      friends: parseInt(friends),
      fans: parseInt(fans),
      // timestamp:
    };
    console.log(metadata);

    // Write data to database
    influx.writePoints([{
        measurement: 'user_stats',
        tags: {
          username: "Aiden Valentine Official",
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
            "dashboardId": 1,
            "panelId": 2,
            "time": rows[0].time/100000, // Convert to Unix epoch seconds
            "timeEnd": rows[0].time/100000, // Convert to Unix epoch seconds
            "tags": ["release"],
            "text": `${newVideosCount} new releases`
          }

          // Request settings
          const options = {
            url: 'http://admin:admin@localhost:3001/api/annotations',
            headers: {
              'User-Agent': 'request',
              'content-type': 'application/json',
              'body': data
            }
          };

          // Add Annotation to Subscribers Panel
          request.post(options, function(error, response, html) {
            if (!error && response.statusCode == 200) {
              console.log(response);
            } else {
              console.error("Error adding annotation.");
            }
          });

          // Add Annotation to Profile Hits Panel
          options.header.body.panelId = 27;
          request.post(options, function(error, response, html) {
            if (!error && response.statusCode == 200) {
              console.log(response);
            } else {
              console.error("Error adding annotation.");
            }
          });

          // Add Annotation to Total Views Panel
          options.header.body.panelId = 28;
          request.post(options, function(error, response, html) {
            if (!error && response.statusCode == 200) {
              console.log(response);
            } else {
              console.error("Error adding annotation.");
            }
          });

          // Add Annotation to Own Uploads Views Panel
          options.header.body.panelId = 29;
          request.post(options, function(error, response, html) {
            if (!error && response.statusCode == 200) {
              console.log(response);
            } else {
              console.error("Error adding annotation.");
            }
          });
        }
      })
  }
});
