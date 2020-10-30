const request = require("request");
const cheerio = require("cheerio");
const Influx = require("influx");

var influx = new Influx.InfluxDB({
  host: '127.0.0.1',
  database: 'xvideos_aiden_valentine_stats_db',
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

request('https://www.xvideos.com/pornstar-channels/aidenvalentineofficial', function(error, response, html) {
  if (!error && response.statusCode == 200) {
    var $ = cheerio.load(html);

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
        database: 'xvideos_aiden_valentine_stats_db',
        precision: 's',
      })
      .catch(error => {
        console.error(`Error saving data to InfluxDB! ${err.stack}`)
      });

  }
});
