// 获取canvas和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏对象
const game = {
    // 球的属性
    ball: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 8,
        speedX: 5,
        speedY: 5,
        maxSpeed: 8
    },
    
    // 玩家拨片（左侧）
    player: {
        x: 20,
        y: canvas.height / 2 - 50,
        width: 15,
        height: 100,
        speed: 6,
        dy: 0
    },
    
    // AI拨片（右侧）
    ai: {
        x: canvas.width - 35,
        y: canvas.height / 2 - 50,
        width: 15,
        height: 100,
        speed: 5.5
    },
    
    // 计分
    playerScore: 0,
    aiScore: 0,
    
    // 游戏状态
    gameRunning: true
};

// 键盘输入状态
const keys = {
    ArrowUp: false,
    ArrowDown: false
};

// 鼠标位置
let mouseY = canvas.height / 2;

// 事件监听器
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
    if (e.key.toLowerCase() === 'r') resetGame();
    if (e.key === 'Escape') window.location.href = '../';
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// 重置游戏
function resetGame() {
    game.ball.x = canvas.width / 2;
    game.ball.y = canvas.height / 2;
    game.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 5;
    game.ball.speedY = (Math.random() - 0.5) * 8;
    game.player.y = canvas.height / 2 - 50;
    game.ai.y = canvas.height / 2 - 50;
}

// 更新玩家拨片位置
function updatePlayer() {
    // 鼠标控制
    if (mouseY - game.player.height / 2 > 0 && mouseY - game.player.height / 2 < canvas.height - game.player.height) {
        game.player.y = mouseY - game.player.height / 2;
    }
    
    // 方向键控制
    if (keys.ArrowUp && game.player.y > 0) {
        game.player.y -= game.player.speed;
    }
    if (keys.ArrowDown && game.player.y < canvas.height - game.player.height) {
        game.player.y += game.player.speed;
    }
    
    // 边界检测
    if (game.player.y < 0) game.player.y = 0;
    if (game.player.y > canvas.height - game.player.height) {
        game.player.y = canvas.height - game.player.height;
    }
}

// 更新AI拨片位置
function updateAI() {
    const aiCenter = game.ai.y + game.ai.height / 2;
    const ballCenter = game.ball.y;
    const difference = ballCenter - aiCenter;
    
    // AI跟踪球，但有一定的反应延迟
    if (difference > 35) {
        if (game.ai.y < canvas.height - game.ai.height) {
            game.ai.y += game.ai.speed;
        }
    } else if (difference < -35) {
        if (game.ai.y > 0) {
            game.ai.y -= game.ai.speed;
        }
    }
    
    // 边界检测
    if (game.ai.y < 0) game.ai.y = 0;
    if (game.ai.y > canvas.height - game.ai.height) {
        game.ai.y = canvas.height - game.ai.height;
    }
}

// 更新球的位置
function updateBall() {
    game.ball.x += game.ball.speedX;
    game.ball.y += game.ball.speedY;
    
    // 上下墙壁碰撞
    if (game.ball.y - game.ball.radius < 0 || game.ball.y + game.ball.radius > canvas.height) {
        game.ball.speedY = -game.ball.speedY;
        
        // 防止球卡在墙壁里
        if (game.ball.y - game.ball.radius < 0) {
            game.ball.y = game.ball.radius;
        }
        if (game.ball.y + game.ball.radius > canvas.height) {
            game.ball.y = canvas.height - game.ball.radius;
        }
    }
    
    // 玩家拨片碰撞检测
    if (
        game.ball.x - game.ball.radius < game.player.x + game.player.width &&
        game.ball.y > game.player.y &&
        game.ball.y < game.player.y + game.player.height
    ) {
        game.ball.speedX = -game.ball.speedX;
        game.ball.x = game.player.x + game.player.width + game.ball.radius;
        
        // 根据碰撞位置调整球的Y轴速度
        const collidePoint = game.ball.y - (game.player.y + game.player.height / 2);
        const collideNormalized = collidePoint / (game.player.height / 2);
        game.ball.speedY = collideNormalized * game.ball.maxSpeed;
    }
    
    // AI拨片碰撞检测
    if (
        game.ball.x + game.ball.radius > game.ai.x &&
        game.ball.y > game.ai.y &&
        game.ball.y < game.ai.y + game.ai.height
    ) {
        game.ball.speedX = -game.ball.speedX;
        game.ball.x = game.ai.x - game.ball.radius;
        
        // 根据碰撞位置调整球的Y轴速度
        const collidePoint = game.ball.y - (game.ai.y + game.ai.height / 2);
        const collideNormalized = collidePoint / (game.ai.height / 2);
        game.ball.speedY = collideNormalized * game.ball.maxSpeed;
    }
    
    // 计分和重置
    if (game.ball.x < 0) {
        game.aiScore++;
        document.getElementById('aiScore').textContent = game.aiScore;
        resetGame();
    }
    if (game.ball.x > canvas.width) {
        game.playerScore++;
        document.getElementById('playerScore').textContent = game.playerScore;
        resetGame();
    }
}

// 绘制球
function drawBall() {
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 球的光晕效果
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.ball.x, game.ball.y, game.ball.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
}

// 绘制拨片
function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // 拨片的发光效果
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowColor = 'transparent';
}

// 绘制中线
function drawCenterLine() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

// 绘制游戏元素
function draw() {
    // 清空画布
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制中线
    drawCenterLine();
    
    // 绘制拨片和球
    drawPaddle(game.player, '#4ECDC4');
    drawPaddle(game.ai, '#FFE66D');
    drawBall();
}

// 游戏循环
function gameLoop() {
    updatePlayer();
    updateAI();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

// 开始游戏
gameLoop();