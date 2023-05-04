let paddle;
let ball;
let score;
let chords;
let chordIndex;

function setup() {
  createCanvas(500, 500);
  paddle = new Paddle();
  ball = new Ball();
  score = 0;
  chords = [[60, 64, 67], [65, 69, 72], [67, 71, 74]];
  chordIndex = 0;

  WebMidi.enable(function (err) {
    if (err) {
      console.log("WebMidi could not be enabled.", err);
    }
  });
}

function draw() {
  background(0);
  paddle.show();
  paddle.update();
  ball.show();
  ball.update();

  if (ball.hits(paddle)) {
    ball.changeDirection();
    playChord();
    score++;
  }

  textSize(32);
  fill(255);
  text("Score: " + score, 10, 30);
}

function keyPressed() {
  if (keyCode === UP_ARROW) {
    paddle.move(-1);
  } else if (keyCode === DOWN_ARROW) {
    paddle.move(1);
  }
}

function keyReleased() {
  paddle.move(0);
}

function playChord() {
  let output = WebMidi.outputs[0];
  let chord = chords[chordIndex];
  output.playChord(chord, "all", 0, 1000);

  chordIndex++;
  if (chordIndex >= chords.length) {
    chordIndex = 0;
  }
}

function Ball() {
  // Ball implementation
}

function Paddle() {
  // Paddle implementation
}

function mouseClicked() {
  if (ball.isOutOfBounds()) {
    saveMIDIFile();
  }
}

function saveMIDIFile() {
  // Save MIDI file implementation
}

// Add these lines at the beginning of the script
const MidiWriter = require('midi-writer-js');
let midiChords = [];

// Ball implementation
function Ball() {
  this.x = width / 2;
  this.y = height / 2;
  this.r = 10;
  this.speed = 3;
  this.xspeed = this.speed;
  this.yspeed = this.speed;

  this.show = function () {
    fill(255);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
  };

  this.update = function () {
    this.x += this.xspeed;
    this.y += this.yspeed;

    if (this.y > height - this.r || this.y < this.r) {
      this.yspeed *= -1;
    }

    if (this.x > width) {
      this.xspeed *= -1;
    } else if (this.x < 0) {
      this.reset();
    }
  };

  this.reset = function () {
    this.x = width / 2;
    this.y = height / 2;
    this.xspeed = this.speed;
    this.yspeed = this.speed;
  };

  this.hits = function (paddle) {
    if (this.x - this.r < paddle.x + paddle.w &&
      this.y > paddle.y &&
      this.y < paddle.y + paddle.h) {
      return true;
    }
    return false;
  };

  this.changeDirection = function () {
    this.xspeed *= -1;
  };

  this.isOutOfBounds = function () {
    return this.x < 0;
  };
}

// Paddle implementation
function Paddle() {
  this.x = 20;
  this.y = height / 2 - 50;
  this.w = 20;
  this.h = 100;
  this.speed = 5;
  this.yspeed = 0;

  this.show = function () {
    fill(255);
    rect(this.x, this.y, this.w, this.h);
  };

  this.update = function () {
    this.y += this.yspeed;
    this.y = constrain(this.y, 0, height - this.h);
  };

  this.move = function (dir) {
    this.yspeed = this.speed * dir;
  };
}

// Save MIDI file implementation
function saveMIDIFile() {
  let data = [];
  let header = "MThd\x00\x00\x00\x06\x00\x01\x00\x01\x01\xE0";
  let track = "MTrk";
  let trackLength = 0;
  let trackData = "";

  midiChords.forEach((chord, index) => {
    let deltaTime = index === 0 ? 0 : 480;
    let noteOn = String.fromCharCode(0x90 | 0);
    let noteOff = String.fromCharCode(0x80 | 0);

    chord.forEach((note) => {
      trackData += String.fromCharCode(deltaTime) + noteOn + String.fromCharCode(note) + String.fromCharCode(0x40);
      trackData += String.fromCharCode(480) + noteOff + String.fromCharCode(note) + String.fromCharCode(0x40);
    });
  });

  trackLength = trackData.length;
  track += String.fromCharCode((trackLength >> 24) & 0xFF);
  track += String.fromCharCode((trackLength >> 16) & 0xFF);
  track += String.fromCharCode((trackLength >> 8) & 0xFF);
  track += String.fromCharCode(trackLength & 0xFF);
  track += trackData;

  data.push(header);
  data.push(track);

  let blob = new Blob(data, {type: "audio/midi"});
  let url = URL.createObjectURL(blob);

  let link = document.createElement('a');
  link.href = url;
  link.download = 'PongChords.mid';
  link.click();
}


