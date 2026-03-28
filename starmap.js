import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0';

let cn_extractor, en_extractor;
let cn_matrix, en_matrix;

// 1. 初始化双核 AI 引擎和直觉矩阵
async function initStarmap() {
    try {
        // 并行拉取 Hugging Face 的量化小模型
        const [cn_model, en_model] = await Promise.all([
            pipeline('feature-extraction', 'Xenova/bge-small-zh-v1.5', { quantized: true }),
            pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true })
        ]);
        cn_extractor = cn_model;
        en_extractor = en_model;

        // 并行拉取你本地炼制的 10KB 矩阵
        const [cn_res, en_res] = await Promise.all([
            fetch('cn_matrix.json'),
            fetch('en_matrix.json')
        ]);
        cn_matrix = await cn_res.json();
        en_matrix = await en_res.json();

        document.getElementById('loading').innerText = "✅ Neural Engines Online. Start typing!";
        document.getElementById('loading').style.color = "#00ff00";
        document.getElementById('chat-input').disabled = false;
        
    } catch (error) {
        console.error("引擎启动失败:", error);
        document.getElementById('loading').innerText = "❌ Error loading models or matrices.";
        document.getElementById('loading').style.color = "red";
    }
}

// 2. 核心数学算法：向量 ✖️ 你的直觉矩阵
function computeScores(embedding, matrix) {
    // Ridge Regression 的权重形状是 (2, 维度)
    const weights_X = matrix.weights[0];
    const weights_Y = matrix.weights[1];
    const bias_X = matrix.intercepts[0];
    const bias_Y = matrix.intercepts[1];

    let x = bias_X;
    let y = bias_Y;

    // 矩阵乘法求和
    for (let i = 0; i < embedding.length; i++) {
        x += embedding[i] * weights_X[i];
        y += embedding[i] * weights_Y[i];
    }

    // 限制在 -1 到 1 之间，防止越界飞出屏幕
    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));

    return [x, y];
}

// 3. 实时打字追踪 (防抖)
let typingTimer;
document.getElementById('chat-input').addEventListener('input', (e) => {
    const text = e.target.value.trim();
    clearTimeout(typingTimer);

    // 回到中心点如果清空了文本
    if (text.length === 0) {
        updateEmojiPosition(0, 0);
        return;
    }

    // 用户停止打字 400 毫秒后触发计算
    typingTimer = setTimeout(async () => {
        // 极简语言路由：包含中文就走中文核，否则走英文核
        const isChinese = /[\u4e00-\u9fa5]/.test(text);
        let x_score = 0, y_score = 0;

        if (isChinese) {
            // 提取特征 (注意：bge-small 默认没有 mean pooling，但 Transformers.js 会自动处理)
            const output = await cn_extractor(text, { pooling: 'mean', normalize: true });
            [x_score, y_score] = computeScores(output.data, cn_matrix);
        } else {
            const output = await en_extractor(text, { pooling: 'mean', normalize: true });
            [x_score, y_score] = computeScores(output.data, en_matrix);
        }

        // 把计算结果更新到 UI
        updateEmojiPosition(x_score, y_score);
        
    }, 400); 
});

// 4. 控制 Emoji 在星图上移动
function updateEmojiPosition(x, y) {
    // 调试信息
    document.getElementById('debug-info').innerText = `X: ${x.toFixed(2)} | Y: ${y.toFixed(2)}`;

    // 将 -1 到 1 的数学坐标，转换为 0% 到 100% 的 CSS 绝对定位坐标
    // 注意：CSS 的 Top 是往下走的，所以 Y 轴要做个翻转 (1 - ...)
    const cssX = ((x + 1) / 2) * 100;
    const cssY = ((1 - y) / 2) * 100;

    const emojiElement = document.getElementById('user-emoji');
    emojiElement.style.left = `${cssX}%`;
    emojiElement.style.top = `${cssY}%`;
}

// 页面加载时启动引擎
window.onload = initStarmap;