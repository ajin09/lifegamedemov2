let video;
let faceMesh;
let faces = [];
let expression = "인식 대기 중..."; 
let prevExpression = "무표정"; 
let gameState = "SETTINGS"; 

// --- 표정 인식 민감도 설정 변수 ---
// 실시간 내 얼굴 수치
let currentMouthWidth = 0; 
let currentMouthHeight = 0;
// 기준점 (이 수치를 넘어야 표정으로 인식)
let smileThresh = 50; 
let mouthThresh = 25; 

// --- 튜토리얼(체크리스트) 관련 변수 ---
let hasSmiled = false;
let hasOpenedMouth = false;
let hasNeutral = false;
let tutorialCompleteTime = 0; 

// --- 게임 진행 변수 ---
let player;
let items = []; 
let groundY = 400; 
let bgX = 0; 

let currentStage = 1; 
let itemSpawnTimer = 0;

let smileStack = 0;
let openMouthStack = 0;
let itemScores = {
  "기본": 0,    
  "컴퓨터": 0,  
  "음악": 0,
  "책": 0,
  "직업전용": 0, 
  "술담배": 0    
};
let chosenJob = ""; 

let endingTitle = "";
let endingDescription = "";
let endingCalculated = false;
  
// 사운드 관련 변수
let mainTheme01;
  
// --- 애니메이션 관련 추가 변수 ---
let babyAnimationFrames = [];
let currentBabyFrame = 0;
let boyAnimationFrames = []; // Stage 2(청소년기) 애니메이션 프레임 배열
let currentBoyFrame = 0;

function preload() {
  soundFormats('mp3', 'ogg');
  
  mainTheme01 = loadSound('main them idea 01.mp3');
  
  faceMesh = ml5.faceMesh({ maxFaces: 1 });
  
  babyAnimationFrames[0] = loadImage('baby01.png');
  babyAnimationFrames[1] = loadImage('baby02.png');
  babyAnimationFrames[2] = loadImage('baby03.png');
  babyAnimationFrames[3] = loadImage('baby04.png');

  boyAnimationFrames[0] = loadImage('boy01.png');
  boyAnimationFrames[1] = loadImage('boy02.png');
  boyAnimationFrames[2] = loadImage('boy03.png');
  boyAnimationFrames[3] = loadImage('boy04.png');
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  faceMesh.detectStart(video, gotFaces);
  player = new Player();
  
  // 사운드 객체가 로드되었을 경우에만 볼륨 설정
  if (mainTheme01) mainTheme01.setVolume(0.3);
}

function gotFaces(results) {
  faces = results;
  if (faces.length > 0) {
    let keypoints = faces[0].keypoints;
    let leftMouth = keypoints[308];
    let rightMouth = keypoints[78];
    // 실시간 수치 계산
    currentMouthWidth = dist(leftMouth.x, leftMouth.y, rightMouth.x, rightMouth.y);

    let topLip = keypoints[13];
    let bottomLip = keypoints[14];
    currentMouthHeight = dist(topLip.x, topLip.y, bottomLip.x, bottomLip.y);

    // 설정한 민감도(Thresh) 변수를 기준으로 표정 판별
    if (currentMouthHeight > mouthThresh) {
      expression = "입 벌림";
    } else if (currentMouthWidth > smileThresh) {
      expression = "웃음";
    } else {
      expression = "무표정";
    }
  } else {
    expression = "얼굴 인식 안 됨";
  }
}

function draw() {
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  fill(0, 150);
  rect(0, 0, width, height);

  // 상태에 따른 화면 렌더링
  if (gameState === "SETTINGS") {
    drawSettingsScreen();
  } else if (gameState === "TUTORIAL") {
    drawTutorialScreen();
  } else if (gameState === "PLAYING") {
    drawGameScene();
  } else if (gameState === "ENDING") {
    drawEndingScreen();
  }
}

// 1. 민감도 조절 설정 화면
function drawSettingsScreen() {
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("⚙️ 표정 인식 민감도 설정 ⚙️", width / 2, 40);

  fill(255, 255, 0);
  textSize(26);
  text(`현재 인식 상태: [ ${expression} ]`, width / 2, 90);

  if (expression === "웃음") {
    fill(180); textSize(14);
    text("웃으면 캐릭터가 점프합니다!", width / 2, 120);
  }
  if (expression === "입 벌림") {
    fill(180); textSize(14);
    text("입을 벌리면 캐릭터가 더블 점프합니다!", width / 2, 120);
  }
  
  textAlign(LEFT, CENTER);
  fill(255);
  textSize(18);
  text(`1. 내 기본 입꼬리 거리: ${Math.floor(currentMouthWidth)}`, 50, 160);
  text("웃음 인식 기준점 :", 50, 200);

  drawCanvasButton(220, 185, 40, 30, "-", 20);
  textAlign(CENTER, CENTER);
  fill(255);
  text(smileThresh, 290, 200);
  drawCanvasButton(320, 185, 40, 30, "+", 20);

  textAlign(LEFT, TOP);
  fill(180); textSize(14);
  text("Tip: 무표정일 때의 '기본 입꼬리 거리'보다 약 10~20 높게 맞추세요.", 50, 225);

  textAlign(LEFT, CENTER);
  fill(255);
  textSize(18);
  text(`2. 내 기본 입술 거리: ${Math.floor(currentMouthHeight)}`, 50, 290);
  text("입 벌림 인식 기준점 :", 50, 330);

  drawCanvasButton(220, 315, 40, 30, "-", 20);
  textAlign(CENTER, CENTER);
  fill(255);
  text(mouthThresh, 290, 330);
  drawCanvasButton(320, 315, 40, 30, "+", 20);

  textAlign(LEFT, TOP);
  fill(180); textSize(14);
  text("Tip: 다물었을 때의 '기본 입술 거리'보다 약 20~30 높게 맞추세요.", 50, 355);

  drawCanvasButton(width/2 - 120, 410, 240, 50, "설정 완료 및 튜토리얼로", 18);
}

// 2. 표정 체크 튜토리얼 화면
function drawTutorialScreen() {
  if (expression === "웃음") hasSmiled = true;
  if (expression === "입 벌림") hasOpenedMouth = true;
  if (expression === "무표정") hasNeutral = true;

  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("📸 튜토리얼: 표정을 지어보세요 📸", width / 2, 50);
  text("현재 표정: " + expression, width / 2, 100);

  textSize(20);
  textAlign(CENTER, CENTER);
  text("미소를 지어보세요!: " + (hasSmiled ? "✅ 완료" : "❌ 대기중"), width / 2, 200);
  text("입을 벌려보세요: " + (hasOpenedMouth ? "✅ 완료" : "❌ 대기중"), width / 2, 250);
  text("무표정을 지어보세요: " + (hasNeutral ? "✅ 완료" : "❌ 대기중"), width / 2, 300);

  if (hasSmiled && hasOpenedMouth && hasNeutral) {
    textAlign(CENTER, CENTER);
    fill(0, 255, 0); 
    text("완료! 곧 게임이 시작됩니다.", width / 2, 380);

    if (tutorialCompleteTime === 0) {
      tutorialCompleteTime = millis();
    }

    if (millis() - tutorialCompleteTime > 2000) {
      gameState = "PLAYING";
      if (mainTheme01 && !mainTheme01.isPlaying()) {
        mainTheme01.loop();
      }
    }
  }
  drawCanvasButton(width - 140, height - 60, 120, 30, "튜토리얼 스킵 ▶", 15);
}

// 3. 게임 플레이 화면 
function drawGameScene() {
  // 표정 점프 로직
  if (expression !== prevExpression) {
    if (expression === "웃음") {
      player.jump();
      smileStack++; 
    }
    else if (expression === "입 벌림") {
      player.doubleJump();
      openMouthStack++; 
    }
  }
  prevExpression = expression;

  // 바닥 및 배경 렌더링
  stroke(255);
  strokeWeight(2);
  line(0, groundY, width, groundY);
  bgX -= 5; 
  if (bgX <= -50) bgX = 0;
  for (let i = 0; i < width + 50; i += 50) {
    line(i + bgX, groundY, i + bgX - 20, groundY + 20);
  }

  // 아이템 생성
  itemSpawnTimer++;
  if (itemSpawnTimer > 60) {
    spawnItem();
    itemSpawnTimer = 0;
  }

  // 아이템 업데이트 및 충돌 판정
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    item.update();
    item.display();

    let d = dist(player.x + player.size/2, player.y - player.size/2, item.x, item.y);
    
    // 아이템 획득 시
    if (d < player.size/2 + item.size/2) {
      itemScores[item.type]++;
      items.splice(i, 1); 
      
      // --- 스테이지 진행 조건 검사 (아이템 개수 기반) ---
      if (currentStage === 1) {
        if (itemScores["기본"] >= 10) {
          currentStage = 2;
          items = []; // 남은 아이템 초기화
        }
      } 
      else if (currentStage === 2) {
        // 셋 중 하나라도 10개에 도달하면 직업 확정 후 스테이지 3 이동
        if (itemScores["컴퓨터"] >= 10) {
          chosenJob = "개발자";
          currentStage = 3;
          items = [];
        } else if (itemScores["음악"] >= 10) {
          chosenJob = "가수";
          currentStage = 3;
          items = [];
        } else if (itemScores["책"] >= 10) {
          chosenJob = "의사";
          currentStage = 3;
          items = [];
        }
      } 
      else if (currentStage === 3) {
        // 직업 20개 얻으면 엔딩, 혹은 술/담배 10개 얻으면 배드엔딩
        if (itemScores["직업전용"] >= 20 || itemScores["술담배"] >= 10) {
          gameState = "ENDING";
          return;
        }
      }
      
      continue;
    }

    // 화면 밖으로 나간 아이템 삭제
    if (item.x < -50) {
      items.splice(i, 1);
    }
  }

  player.update();
  player.display();

  // UI 텍스트 렌더링
  noStroke();
  fill(255);
  textAlign(LEFT, TOP);

  textSize(16);
  let stageName = currentStage === 1 ? "유아기" : currentStage === 2 ? "청소년기" : "성년기";
  text(`[Stage ${currentStage}] ${stageName}`, 10, 10);

  fill(255, 255, 100); 
  text(`😊 웃은 횟수: ${smileStack}  |  😮 입 벌린 횟수: ${openMouthStack}`, 10, 35);

  fill(255);
  if (currentStage === 1) {
    text("안내: 아이템을 10개 먹어 아기를 성장시키세요!", 10, 65);
    text(`🍼 기본 아이템 습득: ${itemScores["기본"]} / 10`, 10, 85);
  } else if (currentStage === 2) {
    text("안내: 원하는 직업 아이템을 먼저 10개 모으세요!", 10, 65);
    text(`💻 컴퓨터: ${itemScores["컴퓨터"]}/10  |  🎵 음악: ${itemScores["음악"]}/10  |  📚 책: ${itemScores["책"]}/10`, 10, 85);
  } else if (currentStage === 3) {
    text(`당신의 직업: [${chosenJob}] - 직업 아이템을 모아 엔딩을 보세요! (술/담배 10개 주의)`, 10, 65);
    text(`✨ 직업 경험치: ${itemScores["직업전용"]}/20  |  ☠️ 술/담배 누적: ${itemScores["술담배"]}/10`, 10, 85);
  }
  drawStageGauge();
}

function spawnItem() {
  let itemType = "";
  if (currentStage === 1) {
    itemType = "기본";
  } else if (currentStage === 2) {
    let r = random(1);
    if (r < 0.33) itemType = "컴퓨터";
    else if (r < 0.66) itemType = "음악";
    else itemType = "책";
  } else if (currentStage === 3) {
    if (random(1) < 0.5) itemType = "직업전용";
    else itemType = "술담배";
  }
  items.push(new Item(itemType));
}

// 4. 엔딩 화면 
function drawEndingScreen() {
  if (!endingCalculated) {
    calculateEnding();
    endingCalculated = true;
    if (mainTheme01) mainTheme01.stop(); 
  }
  noStroke();
  
  fill(0, 200);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  
  textSize(40);
  fill(255, 215, 0); 
  text(endingTitle, width / 2, 100);

  textSize(20);
  fill(255);
  text(endingDescription, width / 2, 160);

  textAlign(LEFT, CENTER);
  textSize(18);
  text(`[ 내 인생 기록부 ]`, width / 2 - 100, 240);
  text(`😊 웃은 횟수: ${smileStack} 번`, width / 2 - 100, 280);
  text(`😮 입 벌린 횟수: ${openMouthStack} 번`, width / 2 - 100, 310);
  text(`총 표정 변화량: ${smileStack + openMouthStack} (20 이상시 역동적인 삶)`, width / 2 - 100, 340);
  text(`☠️ 술/담배 습득량: ${itemScores["술담배"]}`, width / 2 - 100, 380);

  textAlign(CENTER, CENTER);
  textSize(16);
  fill(150);
  text("새로고침(F5)을 눌러 다시 플레이하세요!", width / 2, 450);
}

function calculateEnding() {
  let totalExpressions = smileStack + openMouthStack;

  if (itemScores["술담배"] >= 10) {
    endingTitle = `일찍 죽은 ${chosenJob}`;
    endingDescription = "성년기에 건강 관리를 하지 못해 안타깝게 조기 사망했습니다...";
  } 
  else if (totalExpressions < 20) {
    endingTitle = `평범하게 산 ${chosenJob}`;
    endingDescription = "큰 풍파 없이 무난하고 안정적인 삶을 추구하며 살았습니다.";
  } 
  else {
    if (openMouthStack > smileStack * 2) {
      endingTitle = `망한 ${chosenJob}`;
      endingDescription = "너무 많은 욕심을 부리다 그만 모든 것을 잃고 배드엔딩을 맞이했습니다.";
    } 
    else {
      endingTitle = `행복한 ${chosenJob}`;
      if (smileStack >= openMouthStack) {
         endingDescription = "밝은 성격 덕분에 주변에 사람이 많고 행복한 삶을 살았습니다!";
      } else {
         endingDescription = "적극적인 성격으로 다양한 경험을 쌓으며 멋진 삶을 살았습니다!";
      }
    }
  }
}

// UI 버튼 클릭 감지 로직
function mousePressed() {
  let isClicked = (bx, by, bw, bh) => mouseX > bx && mouseX < bx + bw && mouseY > by && mouseY < by + bh;

  if (gameState === "SETTINGS") {
    if (isClicked(220, 185, 40, 30)) smileThresh -= 2;
    if (isClicked(320, 185, 40, 30)) smileThresh += 2;
    if (isClicked(220, 315, 40, 30)) mouthThresh -= 1;
    if (isClicked(320, 315, 40, 30)) mouthThresh += 1;

    if (isClicked(width/2 - 120, 410, 240, 50)) {
      gameState = "TUTORIAL";
      if (mainTheme01 && !mainTheme01.isPlaying()) {
        mainTheme01.loop();
      }
    }
  } 
  else if (gameState === "TUTORIAL") {
    if (isClicked(width - 140, height - 60, 120, 30)) {
      gameState = "PLAYING";
      if (mainTheme01 && !mainTheme01.isPlaying()) {
        mainTheme01.loop();
      }
    }
  }
}

// 캔버스 안에 예쁜 네모 버튼을 그려주는 함수
function drawCanvasButton(x, y, w, h, label, tSize) {
  fill(100, 150, 255); 
  rect(x, y, w, h, 8); 

  fill(255); 
  textSize(tSize);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
  
}

function drawStageGauge() {

  let gaugeX = 20;
  let gaugeY = height - 40;
  let gaugeW = 220;
  let gaugeH = 20;

  let progress = 0;
  let maxValue = 10;
  let label = "";

  // -------------------------
  // Stage별 진행도 계산
  // -------------------------

  if (currentStage === 1) {

    progress = itemScores["기본"];
    maxValue = 10;
    label = "성장 게이지";

  } 
  else if (currentStage === 2) {

    progress = max(
      itemScores["컴퓨터"],
      itemScores["음악"],
      itemScores["책"]
    );

    maxValue = 10;
    label = "진로 결정 게이지";

  } 
  else if (currentStage === 3) {

    progress = itemScores["직업전용"];
    maxValue = 20;
    label = "인생 성공 게이지";

  }

  // 게이지 배경
  noStroke();
  fill(80);
  rect(gaugeX, gaugeY, gaugeW, gaugeH, 10);

  // 게이지 채우기
  let fillWidth = map(progress, 0, maxValue, 0, gaugeW);

  // Stage마다 색 다르게
  if (currentStage === 1) {
    fill(100, 200, 255);
  } 
  else if (currentStage === 2) {
    fill(255, 180, 100);
  } 
  else {
    fill(100, 255, 120);
  }

  rect(gaugeX, gaugeY, fillWidth, gaugeH, 10);

  // 테두리
  noFill();
  stroke(255);
  strokeWeight(2);
  rect(gaugeX, gaugeY, gaugeW, gaugeH, 10);

  // 텍스트
  noStroke();
  fill(255);

  textAlign(LEFT, CENTER);
  textSize(14);

  text(
    `${label} : ${progress} / ${maxValue}`,
    gaugeX,
    gaugeY - 15
  );

  // -------------------------
  // Stage3 위험 게이지
  // -------------------------

  if (currentStage === 3) {

    let dangerProgress = itemScores["술담배"];

    fill(80);
    rect(gaugeX + 260, gaugeY, gaugeW, gaugeH, 10);

    let dangerWidth = map(dangerProgress, 0, 10, 0, gaugeW);

    fill(255, 60, 60);
    rect(gaugeX + 260, gaugeY, dangerWidth, gaugeH, 10);

    noFill();
    stroke(255);
    rect(gaugeX + 260, gaugeY, gaugeW, gaugeH, 10);

    noStroke();
    fill(255);

    text(
      `위험 게이지 : ${dangerProgress} / 10`,
      gaugeX + 260,
      gaugeY - 15
    );
  }
}

// --- 클래스들 ---
class Player {
  constructor() {
    this.x = 100;
    this.y = groundY;
    this.size = 40; // 히트박스(충돌 판정) 및 기본 높이
    this.vy = 0; 
    this.gravity = 0.8; 
    this.jumpPower = -12; 
    this.jumpCount = 0; 
  }
  
  jump() {
    if (this.jumpCount === 0) {
      this.vy = this.jumpPower;
      this.jumpCount = 1;
    }
  }
  
  doubleJump() {
    if (this.jumpCount <= 1) {
      this.vy = this.jumpPower * 1.2; 
      this.jumpCount = 2;
    }
  }
  
  update() {
    // 물리 적용 (중력 및 떨어짐)
    this.vy += this.gravity;
    this.y += this.vy;
    
    // 땅바닥 충돌 처리
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.jumpCount = 0; 
    }

    // 애니메이션 프레임 업데이트 (12프레임마다 이미지 변경)
    if (currentStage === 1 && babyAnimationFrames.length > 0) {
      if (frameCount % 12 === 0) {
        currentBabyFrame = (currentBabyFrame + 1) % babyAnimationFrames.length;
      }
    } 
    else if (currentStage === 2 && boyAnimationFrames.length > 0) {
      if (frameCount % 12 === 0) {
        currentBoyFrame = (currentBoyFrame + 1) % boyAnimationFrames.length;
      }
    }
  }
  
  display() {
    if (currentStage === 1 && babyAnimationFrames.length > 0) {
      let img = babyAnimationFrames[currentBabyFrame];
      let ratio = img.width / img.height; 
      let drawHeight = this.size; // 40
      let drawWidth = this.size * ratio; 
      let offsetX = (this.size - drawWidth) / 2;

      image(img, this.x + offsetX, this.y - drawHeight, drawWidth, drawHeight);
      
    } else if (currentStage === 2 && boyAnimationFrames.length > 0) {
      let img = boyAnimationFrames[currentBoyFrame];
      this.size = 120;
      let ratio = img.width / img.height; 
      let drawHeight = this.size;
      let drawWidth = this.size * ratio; 
      let offsetX = (this.size - drawWidth) / 2;

      image(img, this.x + offsetX, this.y - drawHeight, drawWidth, drawHeight);
      
    } else {
      this.size = 40;
      // Stage 3: 기본 노란색 사각형
      fill(255, 204, 0);
      rect(this.x, this.y - this.size, this.size, this.size, 10); 
    }
  }
}

class Item {
  constructor(type) {
    this.type = type;
    let yRange;
    if (currentStage === 1) {
      yRange = 120;
    }
    else if (currentStage === 2 || currentStage === 3) {
      yRange = 240;
    }
    this.x = width + 20; 
    this.y = groundY - random(yRange / 6, yRange); 
    this.size = 30; 
    this.speed = 5; 
  }
  update() {
    this.x -= this.speed;
  }
  display() {
    if (this.type === "기본") fill(255); 
    else if (this.type === "컴퓨터") fill(0, 100, 255); 
    else if (this.type === "음악") fill(255, 100, 200); 
    else if (this.type === "책") fill(100, 255, 100); 
    else if (this.type === "직업전용") fill(255, 255, 0); 
    else if (this.type === "술담배") fill(255, 0, 0); 

    ellipse(this.x, this.y, this.size);
    fill(0);
    textSize(10);
    textAlign(CENTER, CENTER);
    text(this.type.substring(0,2), this.x, this.y);
  }
}