/**
 * P5.js 選擇題測驗系統 (莫蘭迪色系設計 - 貓咪圖標除錯優化版)
 * * 修正：
 * - 增大貓咪圖標尺寸 (36) 以確保可見性。
 * - 移除 Y 軸移動和反彈，將貓咪固定在底部，只保留 X 軸移動。
 */

let table;
let allQuestions = [];
let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let quizState = 'loading';
let selectedOption = null;

// ****** 莫蘭迪色系定義 ******
const COLOR_BG = [244, 243, 239]; 
const COLOR_OPTION_DEFAULT = [177, 197, 197];
const COLOR_OPTION_HIGHLIGHT = [157, 155, 157];
const COLOR_BUTTON_ENABLED = [185, 168, 164];
const COLOR_BUTTON_DISABLED = 200;
const COLOR_TEXT = [51, 51, 51]; 
// **********************************

// 定義下一題按鈕的屬性
let nextButton = {
    x: 0,
    y: 0,
    w: 150,
    h: 50,
    text: '下一題'
};

// ****** 貓咪動態圖標狀態定義 ******
let cat = {
    x: 50,       
    y: 0,        
    size: 36,    // 增大尺寸確保可見
    speedX: 2,   // X 軸速度
    // speedY: 0, // 移除 Y 軸移動
    emoji1: 'ヽ(=^･ω･^=)丿', 
    emoji2: 'ヾ(*ΦωΦ)ツ',   
    currentEmoji: 'ヽ(=^･ω･^=)丿',
    lastSwitchTime: 0, 
    switchInterval: 500 // 切換間隔 (0.5 秒)
};
// **********************************

// 預載入函式
function preload() {
    try {
        table = loadTable('questions.csv', 'csv', 'header');
    } catch (e) {
        console.error("載入 CSV 檔案失敗:", e);
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    textAlign(LEFT, TOP);
    textSize(16);
    noStroke(); 
    
    // 設定貓咪的初始 Y 座標在左下角，給予文字大小的緩衝
    cat.y = height - cat.size - 10; 
    
    if (table && table.getRowCount() > 0) {
        for (let r = 0; r < table.getRowCount(); r++) {
            allQuestions.push({
                prompt: table.getString(r, '題目'),
                options: [
                    table.getString(r, '選項A'),
                    table.getString(r, '選項B'),
                    table.getString(r, '選項C'),
                    table.getString(r, '選項D')
                ],
                correctAnswer: table.getString(r, '正確答案').toUpperCase().trim()
            });
        }

        startQuiz(); 
        quizState = 'quiz';
    } else {
        quizState = 'error';
    }
}

// 隨機抽取題目 (最多5題)
function startQuiz() {
    let tempQuestions = [...allQuestions];
    currentQuiz = [];
    userAnswers = [];
    selectedOption = null;

    let numQuestions = min(5, allQuestions.length);
    for (let i = 0; i < numQuestions; i++) {
        let randomIndex = floor(random(tempQuestions.length));
        currentQuiz.push(tempQuestions[randomIndex]);
        tempQuestions.splice(randomIndex, 1); 
    }

    currentQuestionIndex = 0;
}

function draw() {
    background(COLOR_BG); 

    if (quizState === 'loading') {
        fill(COLOR_TEXT);
        textSize(32);
        textAlign(CENTER, CENTER);
        text('載入題庫中...', width / 2, height / 2);
    } else if (quizState === 'error') {
        fill(255, 0, 0);
        textSize(32);
        textAlign(CENTER, CENTER);
        text('錯誤：無法載入題庫或題庫為空！', width / 2, height / 2);
    } else if (quizState === 'quiz') {
        displayQuestion();
        displayNextButton(); 
    } else if (quizState === 'result') {
        displayResult();
    }
    
    // ****** 貓咪的更新和繪製邏輯始終在最上層執行 ******
    updateCat();
    drawCat();
    // ***************************************************
}

// ****** 貓咪的移動和表情切換邏輯 ******
function updateCat() {
    // 1. 移動 (只在 X 軸移動)
    cat.x += cat.speedX;
    
    // 由於 p5.js 的 textWidth() 在不同環境下計算結果可能不同，
    // 這裡我們使用一個固定值作為貓咪圖標的佔用寬度來處理邊界反彈
    const CAT_WIDTH_ESTIMATE = 150; // 估計圖標寬度

    // 左右邊界反彈
    if (cat.x < 10 || cat.x > width - CAT_WIDTH_ESTIMATE) {
        cat.speedX *= -1; // 反轉方向
    }
    
    // 2. 表情切換
    if (millis() - cat.lastSwitchTime > cat.switchInterval) {
        if (cat.currentEmoji === cat.emoji1) {
            cat.currentEmoji = cat.emoji2;
        } else {
            cat.currentEmoji = cat.emoji1;
        }
        cat.lastSwitchTime = millis(); 
    }
}

// 繪製貓咪圖標
function drawCat() {
    // 確保貓咪圖標在測驗或結果畫面才顯示
    if (quizState !== 'loading' && quizState !== 'error') {
        textSize(cat.size);
        fill(COLOR_OPTION_HIGHLIGHT); // 使用高亮色讓貓咪更顯眼
        textAlign(LEFT, TOP);
        
        // 為了確保圖標在左下角，我們在繪製時再次確認 Y 座標
        text(cat.currentEmoji, cat.x, height - cat.size - 10);
    }
}
// *************************************


// 顯示目前的題目與選項
function displayQuestion() {
    let q = currentQuiz[currentQuestionIndex];
    if (!q) {
        quizState = 'result';
        return;
    }

    const marginX = 50;
    const availableWidth = width - marginX * 2;
    const startX = marginX;
    let currentY = height * 0.1;

    // 1. 顯示題號與題目
    textSize(20);
    fill(COLOR_TEXT);
    textAlign(LEFT, TOP);
    text(`第 ${currentQuestionIndex + 1} 題 (共 ${currentQuiz.length} 題):`, startX, currentY);
    currentY += 40;

    textSize(24);
    text(q.prompt, startX, currentY, availableWidth, 100);
    currentY += 100;

    // 2. 顯示選項 (加入高亮邏輯)
    let optionHeight = 60;
    let optionSpacing = 15;
    let optionsLabel = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < q.options.length; i++) {
        let optionLabel = optionsLabel[i];
        let y = currentY + i * (optionHeight + optionSpacing);

        if (selectedOption === optionLabel) {
            fill(COLOR_OPTION_HIGHLIGHT); 
        } else {
            fill(COLOR_OPTION_DEFAULT); 
        }
        
        rect(startX, y, availableWidth, optionHeight, 8); 

        fill(COLOR_TEXT);
        textSize(20);
        text(`${optionLabel}. ${q.options[i]}`, startX + 15, y + optionHeight / 2 - 10, availableWidth - 20);
    }
}

// 顯示並繪製「下一題」按鈕
function displayNextButton() {
    nextButton.w = 150;
    nextButton.h = 50;
    nextButton.x = width - nextButton.w - 50; 
    nextButton.y = height - nextButton.h - 50; 

    let buttonText = '下一題';
    if (currentQuestionIndex === currentQuiz.length - 1) {
        buttonText = '看結果';
    } else if (currentQuestionIndex >= currentQuiz.length) {
        return;
    }

    if (selectedOption === null) { 
        fill(COLOR_BUTTON_DISABLED); 
    } else {
        fill(COLOR_BUTTON_ENABLED); 
    }

    rect(nextButton.x, nextButton.y, nextButton.w, nextButton.h, 10);

    fill(255); 
    textSize(20);
    textAlign(CENTER, CENTER);
    text(buttonText, nextButton.x + nextButton.w / 2, nextButton.y + nextButton.h / 2);
    textAlign(LEFT, TOP);
}


// 滑鼠點擊事件處理
function mouseClicked() {
    if (quizState === 'quiz') {
        const marginX = 50;
        const availableWidth = width - marginX * 2;
        const startX = marginX;
        let optionHeight = 60;
        let optionSpacing = 15;
        let optionsLabel = ['A', 'B', 'C', 'D'];
        let currentY = height * 0.1 + 40 + 100;

        // 1. 檢查是否點擊了選項
        for (let i = 0; i < optionsLabel.length; i++) {
            let optionLabel = optionsLabel[i];
            let y = currentY + i * (optionHeight + optionSpacing);

            if (mouseX > startX && mouseX < startX + availableWidth &&
                mouseY > y && mouseY < y + optionHeight) {

                selectedOption = optionLabel;
                return; 
            }
        }
        
        // 2. 檢查是否點擊了「下一題/看結果」按鈕
        if (selectedOption !== null) { 
            if (mouseX > nextButton.x && mouseX < nextButton.x + nextButton.w &&
                mouseY > nextButton.y && mouseY < nextButton.y + nextButton.h) {
                
                userAnswers[currentQuestionIndex] = selectedOption;
                
                currentQuestionIndex++;
                selectedOption = null; 
                
                if (currentQuestionIndex >= currentQuiz.length) {
                    quizState = 'result';
                }
            }
        }
    } else if (quizState === 'result') {
        startQuiz();
        quizState = 'quiz';
    }
}

// 顯示結果與回饋用詞
function displayResult() {
    let score = 0;
    let total = currentQuiz.length;

    for (let i = 0; i < total; i++) {
        if (userAnswers[i] === currentQuiz[i].correctAnswer) {
            score++;
        }
    }

    let percentage = (score / total) * 100;
    let feedback = '';

    if (percentage === 100) {
        feedback = '太棒了！您獲得了滿分！';
    } else if (percentage >= 80) {
        feedback = '表現非常好，請繼續努力！';
    } else if (percentage >= 60) {
        feedback = '合格了，但有些地方需要加強。';
    } else {
        feedback = '請複習學習材料，期待您的進步。';
    }

    // ==== 繪製結果介面 ====
    textAlign(CENTER, CENTER);

    textSize(48);
    fill(COLOR_TEXT);
    text('測驗結果', width / 2, height * 0.2);

    textSize(80);
    fill(COLOR_OPTION_HIGHLIGHT); 
    text(`${score} / ${total}`, width / 2, height * 0.45);

    textSize(32);
    fill(COLOR_TEXT);
    text(feedback, width / 2, height * 0.65);

    textSize(24);
    fill(COLOR_BUTTON_ENABLED); 
    text('點擊螢幕任意位置重新開始', width / 2, height * 0.85);
}

// 響應式調整：當瀏覽器窗口大小變化時，調整畫布大小和貓咪位置
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // 重設貓咪的 Y 座標以確保它貼近左下角
    cat.y = height - cat.size - 10; 
}