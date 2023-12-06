const mongoose = require('mongoose');

const Playlist = new mongoose.Schema({
  Playlist: String,
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'classes'
  },
});

const Playlists = mongoose.model('Playlist', Playlist);

module.exports = Playlists;

