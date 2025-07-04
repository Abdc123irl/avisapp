
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = [];

app.use(cors());
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GoogleStrategy({
  clientID: 'YOUR_CLIENT_ID_HERE',
  clientSecret: 'YOUR_CLIENT_SECRET_HERE',
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: '/chat.html'
  })
);

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

io.on('connection', socket => {
  socket.on('login', username => {
    socket.username = username;
    users.push(username);
    io.emit('users', users);
  });

  socket.on('sendMessage', data => {
    io.emit('receiveMessage', data);
  });

  socket.on('offer', offer => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', answer => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', candidate => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    users = users.filter(u => u !== socket.username);
    io.emit('users', users);
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
