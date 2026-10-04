const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');
const songs = require('./songs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ROUND_SECONDS = 8; // a visszaszámlálás hossza másodpercben

app.use(express.static(path.join(__dirname, 'public')));
app.use('/media/instrumental', express.static(path.join(__dirname, 'media', 'instrumental')));
app.use('/media/video', express.static(path.join(__dirname, 'media', 'video')));

app.get('/', (req, res) => {
  res.redirect('/host.html');
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();
const PLAYER_URL = `http://${LOCAL_IP}:${PORT}/player.html`;

app.get('/api/info', async (req, res) => {
  try {
    const qr = await QRCode.toDataURL(PLAYER_URL, { width: 320, margin: 1 });
    res.json({ url: PLAYER_URL, qr });
  } catch (err) {
    res.status(500).json({ error: 'QR generálás sikertelen' });
  }
});

let players = {}; // socket.id -> { name, score, answered }
let currentIndex = -1;
let answersLocked = false;
let roundTimer = null;

function broadcastPlayers() {
  io.emit('players-update', Object.values(players).map((p) => p.name));
}

function getScoreboard() {
  return Object.values(players)
    .map((p) => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

function startRound() {
  answersLocked = false;
  clearTimeout(roundTimer);
  Object.values(players).forEach((p) => (p.answered = null));

  const song = songs[currentIndex];
  io.emit('new-round', {
    index: currentIndex,
    total: songs.length,
    options: song.options,
    instrumental: song.instrumental ? `/media/instrumental/${song.instrumental}` : null,
    duration: ROUND_SECONDS
  });

  roundTimer = setTimeout(() => {
    answersLocked = true;
    io.emit('time-up');
  }, ROUND_SECONDS * 1000);
}

function revealAnswer() {
  if (currentIndex < 0 || currentIndex >= songs.length) return;
  answersLocked = true;
  clearTimeout(roundTimer);
  const song = songs[currentIndex];

  Object.values(players).forEach((p) => {
    if (p.answered === song.correct) p.score += 100;
  });

  const results = Object.values(players).map((p) => ({
    name: p.name,
    answered: p.answered,
    correct: p.answered === song.correct
  }));

  io.emit('reveal', {
    correctIndex: song.correct,
    correctText: song.options[song.correct],
    video: song.video ? `/media/video/${song.video}` : null,
    results,
    scoreboard: getScoreboard()
  });
}

io.on('connection', (socket) => {
  socket.on('join', (name) => {
    const cleanName = (name || '').trim().slice(0, 20) || `Játékos${Object.keys(players).length + 1}`;
    players[socket.id] = { name: cleanName, score: 0, answered: null };
    broadcastPlayers();
    socket.emit('joined', { name: cleanName });

    if (currentIndex >= 0 && currentIndex < songs.length && !answersLocked) {
      const song = songs[currentIndex];
      socket.emit('new-round', {
        index: currentIndex,
        total: songs.length,
        options: song.options,
        instrumental: null, // a lejátszást csak a kezelő gép vezérli
        duration: ROUND_SECONDS
      });
    }
  });

  socket.on('start-quiz', () => {
    currentIndex = 0;
    startRound();
  });

  socket.on('next-question', () => {
    currentIndex++;
    if (currentIndex < songs.length) {
      startRound();
    } else {
      io.emit('quiz-end', getScoreboard());
    }
  });

  socket.on('reveal-answer', () => {
    revealAnswer();
  });

  socket.on('restart-quiz', () => {
    currentIndex = -1;
    answersLocked = false;
    clearTimeout(roundTimer);
    Object.values(players).forEach((p) => {
      p.score = 0;
      p.answered = null;
    });
    io.emit('quiz-reset');
    broadcastPlayers();
  });

  socket.on('submit-answer', (answerIndex) => {
    const player = players[socket.id];
    if (!player || answersLocked || player.answered !== null) return;
    if (typeof answerIndex !== 'number' || answerIndex < 0 || answerIndex > 3) return;
    player.answered = answerIndex;
    socket.emit('answer-received', answerIndex);
    io.emit('answer-count', Object.values(players).filter((p) => p.answered !== null).length);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    broadcastPlayers();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  K-pop Kvíz szerver elindult!');
  console.log(`  Kezelő (gépen):        http://localhost:${PORT}/host.html`);
  console.log(`  Csatlakozás (telefon): ${PLAYER_URL}`);
  console.log('');
});
