const Banner = require('../model/Banner')
const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const AdminModel = require('../model/Admin')
const Teacher = require('../model/Teachers');
const Students = require('../model/Students');
const Classes = require('../model/classes')
const Parents = require('../model/Parents')
const Payments = require('../model/Payments')
const Attendences = require('../model/Attendences');

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
  const instructors = [
    {
      name: "Professor Celestia Starlight",
      role: "Cosmic Education Guide",
      image: "img/team-1.jpg",
      social: [
        { icon: "fab fa-facebook-f", link: "#" },
        { icon: "fab fa-twitter", link: "#" },
        { icon: "fab fa-instagram", link: "#" }
      ]
    },
    {
      name: "Dr. Quantum Lumina",
      role: "Chief Learning Navigator",
      image: "img/team-2.jpg",
      social: [
        { icon: "fab fa-facebook-f", link: "#" },
        { icon: "fab fa-twitter", link: "#" },
        { icon: "fab fa-instagram", link: "#" }
      ]
    },
    {
      name: "Captain Nebula Beacon",
      role: "Educational Voyager-in-Chief",
      image: "img/team-3.jpg",
      social: [
        { icon: "fab fa-facebook-f", link: "#" },
        { icon: "fab fa-twitter", link: "#" },
        { icon: "fab fa-instagram", link: "#" }
      ]
    },
    {
      name: "Madam Solaris Insight",
      role: "Enlightenment Engineer",
      image: "img/team-4.jpg",
      social: [
        { icon: "fab fa-facebook-f", link: "#" },
        { icon: "fab fa-twitter", link: "#" },
        { icon: "fab fa-instagram", link: "#" }
      ]
    }
  ];
  // testimonials.js

const testimonials = [
  {
    name: "Sophia Rodriguez",
    designation: "Learning Pioneers",
    image: "img/testimonial-1.jpg",
    text: "Dive into a cosmos of knowledge at Cosmos Mastery School. Our courses spark curiosity, leading students on a journey of discovery that goes beyond textbooks."
  },
  {
    name: "Elijah Thompson",
    designation: "Stellar Scholars",
    image: "img/testimonial-2.jpg",
    text: "Navigate the virtual cosmos with engaging online classes. Skilled instructors create an immersive learning experience, fostering critical thinking skills for future success."
  },
  {
    name: "Ava Patel",
    designation: "Knowledge Voyagers",
    image: "img/testimonial-3.jpg",
    text: "Earn stellar international certificates as you progress. These not only validate expertise but also open doors to exciting opportunities, empowering you to shine on a global scale."
  },
  {
    name: "Caleb Morgan",
    designation: "Cosmic Achievers",
    image: "img/testimonial-4.jpg",
    text: "Beyond courses, we empower students for lifelong learning. Graduates leave not just with knowledge but also the skills and confidence to navigate the real-world cosmos."
  }
];

module.exports = testimonials;

  try {
    link = await Banner.find();
    const teachers = await Teacher.find();
    const  students = await Students.find()
  const videos = await fetchVideos(link[0].playlist);
  
  res.render('index',{videos,teachers,students,instructors,testimonials})

} catch (e) {
  console.error(e);
  res.status(500).send('Internal Server Error');
}
  
});

router.get('/onesignal.js', (req, res) => {
  res.sendFile(__dirname + '/public/OneSignalSDKWorker.js');
});

router.get('/about',(re,rs)=>{
  rs.render('about_home')
})
module.exports = router;
