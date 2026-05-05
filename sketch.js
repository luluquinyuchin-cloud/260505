let capture;
let faceMesh;
let predictions = [];
let currentMode = 0;

let heartAnim = 0, tearAnim = 0, cyberAnim = 0;

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

const noseTip = 1;
const leftCheek = 234, rightCheek = 454;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();

  faceMesh = ml5.faceMesh(() => {
    console.log("Model Ready!");
    faceMesh.detectStart(capture, results => { predictions = results; });
  });

  // 建立五個特效切換按鈕
  const modes = [
    { label: '😳 原版', id: 0 },
    { label: '😍 愛心眼', id: 1 },
    { label: '🥹 感動淚', id: 2 },
    { label: '🤡 小丑', id: 3 },
    { label: '✨ 無', id: 4 },
  ];

  let bar = createDiv('');
  bar.style('position', 'fixed');
  bar.style('bottom', '0');
  bar.style('left', '0');
  bar.style('right', '0');
  bar.style('display', 'flex');
  bar.style('justify-content', 'center');
  bar.style('gap', '14px');
  bar.style('padding', '14px 20px');
  bar.style('background', 'rgba(20,20,40,0.85)');
  bar.style('z-index', '999');

  modes.forEach(m => {
    let btn = createButton(m.label);
    btn.parent(bar);
    btn.style('background', m.id === 0 ? 'rgba(255,100,200,0.35)' : 'rgba(255,255,255,0.08)');
    btn.style('border', m.id === 0 ? '1.5px solid #ff64c8' : '1.5px solid rgba(255,255,255,0.2)');
    btn.style('color', '#fff');
    btn.style('border-radius', '50px');
    btn.style('padding', '10px 22px');
    btn.style('font-size', '15px');
    btn.style('cursor', 'pointer');
    btn.id('btn-' + m.id);
    btn.mousePressed(() => {
      currentMode = m.id;
      // 更新所有按鈕樣式
      modes.forEach(mm => {
        let b = select('#btn-' + mm.id);
        if (mm.id === currentMode) {
          b.style('background', 'rgba(255,100,200,0.35)');
          b.style('border', '1.5px solid #ff64c8');
        } else {
          b.style('background', 'rgba(255,255,255,0.08)');
          b.style('border', '1.5px solid rgba(255,255,255,0.2)');
        }
      });
    });
  });
}

function draw() {
  background('#0d0d1a');

  heartAnim += 0.08;
  tearAnim += 0.04;
  cyberAnim += 0.03;

  // 計算影像縮放
  let vW = 0, vH = 0;
  let vx = width / 2, vy = height / 2;

  if (capture.width > 0 && capture.height > 0) {
    let videoAspect = capture.width / capture.height;
    let targetW = width * 0.52;
    let targetH = height * 0.72;

    if (videoAspect > targetW / targetH) {
      vW = targetW;
      vH = vW / videoAspect;
    } else {
      vH = targetH;
      vW = vH * videoAspect;
    }

    vx = (width - vW) / 2;
    vy = (height - vH) / 2 - 10;
  }

  imageMode(CORNER);
  if (vW > 0) image(capture, vx, vy, vW, vH);

  // 標題文字
  fill(255);
  noStroke();
  textSize(28);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text('414730571 黃榆秦', width / 2, 38);

  if (predictions.length > 0) {
    let keypoints = predictions[0].keypoints;

    const toCanvas = (p) => ({
      x: map(p.x, 0, capture.width, vx, vx + vW),
      y: map(p.y, 0, capture.height, vy, vy + vH)
    });

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

    // 輔助：繪製臉部輪廓填充（evenodd 挖洞）
    const drawFaceFill = (fillColor) => {
      let contourPts = faceContour.map(idx => toCanvas(keypoints[idx]));
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(0, 0, width, height);
      drawingContext.moveTo(contourPts[0].x, contourPts[0].y);
      for (let i = 1; i < contourPts.length; i++) {
        drawingContext.lineTo(contourPts[i].x, contourPts[i].y);
      }
      drawingContext.closePath();
      drawingContext.fillStyle = fillColor;
      drawingContext.fill('evenodd');
      drawingContext.restore();
    };

    // ──────────────────────────────────────────────
    // Mode 0: 😳 原版
    // ──────────────────────────────────────────────
    if (currentMode === 0) {
      drawFaceFill('#fdf0d5');
      drawLines(faceContour, color(0, 200, 255), 2);
      drawLines(pointsToConnect1, color(255, 0, 0), 1);
      drawLines(pointsToConnect2, color(255, 0, 0), 1);
      drawLines(rightEyeOuter, color(40, 40, 40), 15);
      drawLines(rightEyeInner, color(255, 0, 0), 1);
      drawLines(leftEyeOuter, color(40, 40, 40), 15);
      drawLines(leftEyeInner, color(255, 0, 0), 1);
    }

    // ──────────────────────────────────────────────
    // Mode 1: 😍 愛心眼
    // ──────────────────────────────────────────────
    else if (currentMode === 1) {
      drawFaceFill('#ffe0f0');
      drawLines(faceContour, color(255, 100, 180), 2);
      drawLines(pointsToConnect1, color(255, 50, 150), 2);
      drawLines(pointsToConnect2, color(255, 50, 150), 2);

      const drawHeart = (cx, cy, sz) => {
        let s = sz * (1 + 0.15 * Math.sin(heartAnim));
        drawingContext.save();
        drawingContext.translate(cx, cy);
        drawingContext.scale(s, s);
        drawingContext.beginPath();
        drawingContext.moveTo(0, -8);
        drawingContext.bezierCurveTo(8, -20, 22, -10, 0, 8);
        drawingContext.bezierCurveTo(-22, -10, -8, -20, 0, -8);
        drawingContext.fillStyle = 'rgba(255,50,120,0.95)';
        drawingContext.fill();
        drawingContext.restore();

        // 周圍小愛心
        let sr = sz * 10;
        for (let a = 0; a < 360; a += 45) {
          let ax = cx + sr * Math.cos(radians(a + heartAnim * 30));
          let ay = cy + sr * Math.sin(radians(a + heartAnim * 30));
          let ss = (2 + Math.sin(heartAnim + a) * 1) * 0.4;
          drawingContext.save();
          drawingContext.translate(ax, ay);
          drawingContext.scale(ss, ss);
          drawingContext.beginPath();
          drawingContext.moveTo(0, -8);
          drawingContext.bezierCurveTo(8, -20, 22, -10, 0, 8);
          drawingContext.bezierCurveTo(-22, -10, -8, -20, 0, -8);
          drawingContext.fillStyle = 'rgba(255,180,210,0.7)';
          drawingContext.fill();
          drawingContext.restore();
        }
      };

      let re = toCanvas(keypoints[468] || keypoints[33]);
      let le = toCanvas(keypoints[473] || keypoints[263]);
      let eyeW = Math.abs(re.x - le.x);
      drawHeart(re.x, re.y, eyeW / 10);
      drawHeart(le.x, le.y, eyeW / 10);

      let nose = toCanvas(keypoints[noseTip]);
      fill(255, 100, 180);
      noStroke();
      textSize(22);
      textAlign(CENTER, CENTER);
      text('❤', nose.x - 15, nose.y - 8);
      text('❤', nose.x + 15, nose.y - 8);
    }

    // ──────────────────────────────────────────────
    // Mode 2: 🥹 感動淚
    // ──────────────────────────────────────────────
    else if (currentMode === 2) {
      drawFaceFill('#eef7ff');
      drawLines(faceContour, color(100, 160, 255), 2);
      drawLines(pointsToConnect1, color(80, 140, 255), 1.5);
      drawLines(pointsToConnect2, color(80, 140, 255), 1.5);
      drawLines(rightEyeInner, color(100, 180, 255), 1.5);
      drawLines(leftEyeInner, color(100, 180, 255), 1.5);

      const drawTear = (ex, ey) => {
        let t = (tearAnim * 40) % 160;
        noStroke();
        for (let i = 0; i < 3; i++) {
          let drop = (t + i * 55) % 160;
          let alpha = drop < 120 ? 230 : map(drop, 120, 160, 230, 0);
          drawingContext.save();
          drawingContext.translate(ex, ey + drop * 0.5);
          drawingContext.beginPath();
          drawingContext.arc(0, 0, 4, 0, Math.PI * 2);
          drawingContext.fillStyle = `rgba(100,180,255,${alpha / 255})`;
          drawingContext.fill();
          drawingContext.restore();
        }
        fill(150, 210, 255, 120);
        ellipse(ex, ey + 5, 16, 8);
      };

      let re = toCanvas(keypoints[33] || keypoints[133]);
      let le = toCanvas(keypoints[263] || keypoints[362]);
      drawTear(re.x + 2, re.y + 4);
      drawTear(le.x - 2, le.y + 4);
    }

    // ──────────────────────────────────────────────
    // Mode 3: 🤡 小丑
    // ──────────────────────────────────────────────
    else if (currentMode === 3) {
      drawFaceFill('#ffffff');
      drawLines(faceContour, color(0, 0, 0), 2);

      let nose = toCanvas(keypoints[noseTip]);
      let re = toCanvas(keypoints[133] || keypoints[33]);
      let le = toCanvas(keypoints[362] || keypoints[263]);
      let lc = toCanvas(keypoints[leftCheek]);
      let rc = toCanvas(keypoints[rightCheek]);
      let eyeW = Math.abs(re.x - le.x);

      // 紅鼻子
      noStroke();
      fill(255, 40, 40);
      ellipse(nose.x, nose.y, eyeW * 0.9, eyeW * 0.9);

      // 腮紅
      fill(255, 40, 40, 60);
      let lcAdj = {x: lc.x + (nose.x - lc.x) * 0.25, y: lc.y};
      let rcAdj = {x: rc.x + (nose.x - rc.x) * 0.25, y: rc.y};
      ellipse(lcAdj.x, lcAdj.y, eyeW * 0.8, eyeW * 0.65);
      ellipse(rcAdj.x, rcAdj.y, eyeW * 0.8, eyeW * 0.65);

      // 黑眼圈改為藍色實線
      drawLines(rightEyeOuter, color(0, 100, 255), 12);
      drawLines(leftEyeOuter, color(0, 100, 255), 12);

      // 小丑嘴巴：用指定點串接成紅色粗線
      drawLines(pointsToConnect1, color(255, 0, 0), 15);
    }

    // ──────────────────────────────────────────────
    // Mode 4: 無特效
    // ──────────────────────────────────────────────
    else if (currentMode === 4) {
      // 無任何特效，只顯示攝像頭畫面
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}