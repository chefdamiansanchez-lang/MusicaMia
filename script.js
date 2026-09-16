const audio = document.getElementById('audio');
const fileInput = document.getElementById('fileInput');
const addBtn = document.getElementById('addBtn');
const songCount = document.getElementById('songCount');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const seek = document.getElementById('seek');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const playlistEl = document.getElementById('playlist');

let playlist = [];
let currentIndex = -1;
let shuffleOn = false;
let repeatOn = false;
let isSeeking = false;

addBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    const rawName = file.name.replace(/\.[^/.]+$/, "");
    let title = rawName;
    let artist = "Desconocido";
    if (rawName.includes(" - ")) {
      const parts = rawName.split(" - ");
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }
    playlist.push({ url, title, artist });
  });
  renderPlaylist();
  songCount.textContent = playlist.length + (playlist.length === 1 ? " canción" : " canciones");
  if (currentIndex === -1 && playlist.length > 0) {
    loadSong(0);
  }
});

function renderPlaylist() {
  playlistEl.innerHTML = "";
  playlist.forEach((song, i) => {
    const li = document.createElement('li');
    if (i === currentIndex) li.classList.add('playing');
    li.innerHTML = `<span class="title">${song.title}</span><span class="artist">${song.artist}</span>`;
    li.addEventListener('click', () => { loadSong(i); playAudio(); });
    playlistEl.appendChild(li);
  });
}

function loadSong(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index;
  const song = playlist[currentIndex];
  audio.src = song.url;
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  renderPlaylist();
  updateMediaSession(song);
}

function playAudio() {
  if (currentIndex === -1 && playlist.length > 0) loadSong(0);
  audio.play();
  playIcon.innerHTML = '<path fill="white" d="M6 5h4v14H6zm8 0h4v14h-4z"/>';
}

function pauseAudio() {
  audio.pause();
  playIcon.innerHTML = '<path fill="white" d="M8 5v14l11-7z"/>';
}

playBtn.addEventListener('click', () => {
  if (audio.paused) playAudio(); else pauseAudio();
});

prevBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  const newIndex = shuffleOn ? randomIndex() : (currentIndex - 1 + playlist.length) % playlist.length;
  loadSong(newIndex);
  playAudio();
});

nextBtn.addEventListener('click', () => {
  goNext();
});

function goNext() {
  if (playlist.length === 0) return;
  const newIndex = shuffleOn ? randomIndex() : (currentIndex + 1) % playlist.length;
  loadSong(newIndex);
  playAudio();
}

function randomIndex() {
  if (playlist.length <= 1) return 0;
  let idx;
  do { idx = Math.floor(Math.random() * playlist.length); } while (idx === currentIndex);
  return idx;
}

shuffleBtn.addEventListener('click', () => {
  shuffleOn = !shuffleOn;
  shuffleBtn.classList.toggle('active', shuffleOn);
});

repeatBtn.addEventListener('click', () => {
  repeatOn = !repeatOn;
  repeatBtn.classList.toggle('active', repeatOn);
});

audio.addEventListener('ended', () => {
  if (repeatOn) {
    audio.currentTime = 0;
    playAudio();
  } else {
    goNext();
  }
});

audio.addEventListener('timeupdate', () => {
  if (!isSeeking && audio.duration) {
    seek.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
});

seek.addEventListener('input', () => { isSeeking = true; });
seek.addEventListener('change', () => {
  if (audio.duration) {
    audio.currentTime = (seek.value / 100) * audio.duration;
  }
  isSeeking = false;
});

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateMediaSession(song) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      artwork: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    });
    navigator.mediaSession.setActionHandler('play', playAudio);
    navigator.mediaSession.setActionHandler('pause', pauseAudio);
    navigator.mediaSession.setActionHandler('previoustrack', () => prevBtn.click());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextBtn.click());
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
