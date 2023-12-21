var express = require('express');
var router = express.Router();
const Banner = require('../model/Banner')

require('dotenv').config();

const fetchVideos = async (id) => {
  const apiKey = process.env.YT; // Replace with your actual YouTube API key
  const playlistId = id;// Replace with your actual YouTube playlist ID

  try {
    // Fetch video details including videoId
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&key=${apiKey}&maxResults=50`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const responseData = await response.json();

    // Extract videoIds from the first API call
    const videoIds = responseData.items.map(item => item.contentDetails.videoId).join(',');

    // Fetch video statistics using the extracted videoIds
    const statisticsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
    );

    if (!statisticsResponse.ok) {
      throw new Error(`HTTP error! Status: ${statisticsResponse.status}`);
    }

    const statisticsData = await statisticsResponse.json();

    // Combine information from both API calls
    const videos = responseData.items.map(item => {
      const videoStatistics = statisticsData.items.find(statisticsItem => statisticsItem.id === item.contentDetails.videoId).statistics;

      return {
        title: item.snippet.title,
        description: videoStatistics ? videoStatistics.viewCount : '0',
        thumbnail: item.snippet.thumbnails.medium.url,
        videoId: item.contentDetails.videoId,
      };
    });

    console.log(videos);
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    return [];
  }
};

router.get('/', async function(req, res, next) {
  let link = ""
  try {
    link = await Banner.find()
    console.log(link)
  const videos = await fetchVideos(link[0].playlist);
  console.log(videos.length)
  res.render('index',{videos})

  } catch (e) {
    console.error(e)
  }
  
});

router.get('/onesignal.js', (req, res) => {
  res.sendFile(__dirname + '/public/OneSignalSDKWorker.js');
});

module.exports = router;
