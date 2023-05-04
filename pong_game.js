const paddleHeight = 100;
const paddleWidth = 20;
const ballRadius = 10;
let playerPaddle, ball;
let gameStarted = false;
let midiChords = [];
let midiEnabled = false;

function setup() {
  createCanvas(500, 500);
  playerPaddle = new Paddle(height / 2 - paddleHeight / 2);
  ball = new Ball();
  WebMidi.enable((err) => {
    if (err) {
      console.log("WebMidi could not be enabled.", err);
    } else {
      midiEnabled = true;
    }
  });
}

function draw() {
  background(0);
  playerPaddle.display();
  ball.display();
  ball.update();
  ball.checkPaddleCollision(playerPaddle);
  checkGameOver();

  if (!gameStarted && keyIsPressed && key === " ") {
    gameStarted = true;
    ball.launch();
  }
}

class Paddle {
  constructor(y) {
    this.y = y;
  }

  display() {
    fill(255);
    rect(width - paddleWidth, this.y, paddleWidth, paddleHeight);
  }
}

class Ball {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
    this.xSpeed = 0;
    this.ySpeed = 0;
  }

  display() {
    fill(255);
    ellipse(this.x, this.y, ballRadius * 2);
  }

  update() {
    if (gameStarted) {
      this.x += this.xSpeed;
      this.y += this.ySpeed;

      if (this.y - ballRadius <= 0 || this.y + ballRadius >= height) {
        this.ySpeed *= -1;
      }
    }
  }

  launch() {
    this.xSpeed = -3;
    this.ySpeed = random(-2, 2);
  }

  checkPaddleCollision(paddle) {
    if (this.x + ballRadius >= width - paddleWidth && this.y >= paddle.y && this.y <= paddle.y + paddleHeight) {
      this.xSpeed *= -1.1;
      this.ySpeed *= 1.1;
      playChord();
    }
  }
}

function checkGameOver() {
  if (ball.x - ballRadius <= 0) {
    gameStarted = false;
    ball = new Ball();
    midiChords = [];
  }
}

function playChord() {
  if (midiEnabled) {
    let output = WebMidi.outputs[0];
    if (output) {
      let root = 60 + [0, 5, 7][Math.floor(Math.random() * 3)];
      let chord = [root, root + 4, root + 7];
      midiChords.push(chord);
      output.playChord(chord, 1, {duration: 500});
    }
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW && playerPaddle.y > 0) {
    playerPaddle.y -= 10;
  } else if (keyCode === DOWN_ARROW && playerPaddle.y < height - paddleHeight) {
    playerPaddle.y += 10;
  } else if (key === 'S') {
    saveMIDIFile();
  }
}

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
