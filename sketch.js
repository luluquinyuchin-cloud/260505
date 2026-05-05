let capture;
let faceMesh;
let predictions = [];

// 嘴唇外圈
const pointsToConnect1 = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
// 嘴唇內圈
const pointsToConnect2 = [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184];

// 右眼外圈 (黑眼圈)
const rightEyeOuter = [247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 25, 130, 247];
// 右眼內圈
const rightEyeInner = [246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 246];

// 左眼外圈 (黑眼圈)
const leftEyeOuter = [467, 260, 259, 257, 258, 286, 414, 463, 341, 256, 252, 253, 254, 339, 255, 359, 467];
// 左眼內圈
const leftEyeInner = [466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 466];

// 臉部輪廓
const faceContour = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();

  faceMesh = ml5.faceMesh(() => {
    console.log("Model Ready!");
    faceMesh.detectStart(capture, results => { predictions = results; });
  });
}

function draw() {
  background('#e7c6ff');

  // 文字
  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("教科123456789", width / 2, height * 0.15);

  // 計算影像縮放
  let vW = 0, vH = 0;
  let vx = width / 2, vy = height / 2;

  if (capture.width > 0 && capture.height > 0) {
    let videoAspect = capture.width / capture.height;
    let targetW = width * 0.5;
    let targetH = height * 0.5;

    if (videoAspect > targetW / targetH) {
      vW = targetW;
      vH = vW / videoAspect;
    } else {
      vH = targetH;
      vW = vH * videoAspect;
    }

    vx = (width - vW) / 2;
    vy = (height - vH) / 2;
  }

  imageMode(CORNER);
  if (vW > 0) image(capture, vx, vy, vW, vH);

  if (predictions.length > 0) {
    let keypoints = predictions[0].keypoints;

    // 輔助：將關鍵點轉換為畫布座標
    const toCanvas = (p) => ({
      x: map(p.x, 0, capture.width, vx, vx + vW),
      y: map(p.y, 0, capture.height, vy, vy + vH)
    });

    // 輔助：畫線段串接
    const drawLines = (points, col, weight) => {
      stroke(col);
      strokeWeight(weight);
      noFill();
      for (let i = 0; i < points.length - 1; i++) {
        let p1 = toCanvas(keypoints[points[i]]);
        let p2 = toCanvas(keypoints[points[i + 1]]);
        line(p1.x, p1.y, p2.x, p2.y);
      }
    };

    // ── 臉部輪廓外側填充 fdf0d5 ──────────────────────────────
    // 先將整個畫布蓋上 fdf0d5，再以臉部輪廓剪裁還原影像
    // 做法：在臉部輪廓路徑上建立遮罩，把輪廓以外填滿 fdf0d5

    // 收集臉部輪廓點
    let contourPts = faceContour.map(idx => toCanvas(keypoints[idx]));

    // 使用 drawingContext 做路徑裁切 (canvas 2D API)
    drawingContext.save();

    // 建立「全畫布 - 臉部輪廓」的複合路徑（evenodd 填充）
    drawingContext.beginPath();
    // 外層大矩形（整個畫布）
    drawingContext.rect(0, 0, width, height);
    // 臉部輪廓（逆時針，讓 evenodd 做「挖洞」）
    drawingContext.moveTo(contourPts[0].x, contourPts[0].y);
    for (let i = 1; i < contourPts.length; i++) {
      drawingContext.lineTo(contourPts[i].x, contourPts[i].y);
    }
    drawingContext.closePath();

    drawingContext.fillStyle = '#fdf0d5';
    drawingContext.fill('evenodd');

    drawingContext.restore();

    // ── 臉部輪廓藍色（螢光藍）線條 ──────────────────────────
    drawLines(faceContour, color(0, 200, 255), 2);

    // ── 嘴唇 ────────────────────────────────────────────────
    drawLines(pointsToConnect1, color(255, 0, 0), 1);
    drawLines(pointsToConnect2, color(255, 0, 0), 1);

    // ── 右眼外圈（黑眼圈，粗細15） ──────────────────────────
    drawLines(rightEyeOuter, color(40, 40, 40), 15);
    // 右眼內圈
    drawLines(rightEyeInner, color(255, 0, 0), 1);

    // ── 左眼外圈（黑眼圈，粗細15） ──────────────────────────
    drawLines(leftEyeOuter, color(40, 40, 40), 15);
    // 左眼內圈
    drawLines(leftEyeInner, color(255, 0, 0), 1);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}