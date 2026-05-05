let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏預設的影片元件，只顯示在畫布上
}

function draw() {
  background('#e7c6ff');

  // 顯示文字：水平置中，位於影像上方的背景區域
  fill(0); // 設定文字為黑色
  textSize(32); // 設定文字大小
  textAlign(CENTER, CENTER);
  text("教科123456789", width / 2, height * 0.15);

  // 計算影像寬高為畫布的 50%
  let vW = width * 0.5;
  let vH = height * 0.5;

  // 將影像顯示在畫布正中間
  imageMode(CENTER);
  image(capture, width / 2, height / 2, vW, vH);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
