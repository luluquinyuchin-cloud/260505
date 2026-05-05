let capture;
let faceMesh;
let predictions = [];

// 指定要連線的點編號
const pointsToConnect = [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide(); // 隱藏預設的影片元件，只顯示在畫布上

  // 初始化 FaceMesh 模型
  faceMesh = ml5.facemesh(capture, () => console.log("Model Ready!"));
  
  // 當偵測到臉部資料時更新 predictions 變數
  faceMesh.on("predict", results => {
    predictions = results;
  });
}

function draw() {
  background('#e7c6ff');

  // 顯示文字：水平置中，位於影像上方的背景區域
  fill(0); // 設定文字為黑色
  textSize(32); // 設定文字大小
  textAlign(CENTER, CENTER);
  text("教科414730571", width / 2, height * 0.15);

  // 計算等比例縮放 (不拉長，限制在畫布 50% 內)
  let videoAspect = capture.width / capture.height;
  let targetW = width * 0.5;
  let targetH = height * 0.5;
  
  let vW, vH;
  if (videoAspect > targetW / targetH) {
    vW = targetW;
    vH = vW / videoAspect;
  } else {
    vH = targetH;
    vW = vH * videoAspect;
  }

  let vx = (width - vW) / 2;
  let vy = (height - vH) / 2;

  // 將影像顯示在畫布正中間
  imageMode(CORNER);
  image(capture, vx, vy, vW, vH);

  // 如果有偵測到臉部點位
  if (predictions.length > 0) {
    let keypoints = predictions[0].scaledMesh;

    stroke(255, 0, 0); // 紅色線條
    strokeWeight(15); // 線條粗細為 15
    noFill();

    for (let i = 0; i < pointsToConnect.length - 1; i++) {
      let p1_idx = pointsToConnect[i];
      let p2_idx = pointsToConnect[i + 1];

      // 將點位座標從攝影機解析度映射到畫布顯示的大小與位置
      let x1 = map(keypoints[p1_idx][0], 0, capture.width, vx, vx + vW);
      let y1 = map(keypoints[p1_idx][1], 0, capture.height, vy, vy + vH);
      let x2 = map(keypoints[p2_idx][0], 0, capture.width, vx, vx + vW);
      let y2 = map(keypoints[p2_idx][1], 0, capture.height, vy, vy + vH);

      line(x1, y1, x2, y2);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
