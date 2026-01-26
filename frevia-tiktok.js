document.addEventListener('DOMContentLoaded', () => {
    const apiKey = "AIzaSyD2eD5fjVNKguL_o_MSCWs4zDKsYL4MCOA"; // APIキーの設定

    // --- 1. スクロールスパイ (ナビゲーション追従) ---
    const navLinks = document.querySelectorAll('.p-nav__link');
    const sections = document.querySelectorAll('.p-section');

    const handleScroll = () => {
        let activeId = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // ヘッダー分の高さを考慮して判定エリアを調整
            if (window.scrollY >= sectionTop - 150) {
                activeId = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', handleScroll);

    // --- 2. モバイルメニュー ---
    const hamburger = document.getElementById('js-hamburger');
    const sidebar = document.getElementById('sidebar-nav');
    // メニュー外クリックやリンククリックで閉じる処理を追加
    hamburger.addEventListener('click', () => sidebar.classList.toggle('is-open'));
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if(window.innerWidth <= 960) sidebar.classList.remove('is-open');
        });
    });

    // --- 3. 拡散の仕組み (Ladder Logic) ---
    const ladderData = {
        1: { title: "Step 1: 初期テスト", desc: "動画公開直後、まず200〜500人のテストユーザーに表示されます。「スワイプせずに見続けられるか」が最大の関門です。", criteria: "フル視聴率 30%以上推奨" },
        2: { title: "Step 2: 中規模拡散", desc: "初期テストをクリアすると、1,000〜5,000人へ拡大。カテゴリーへの関連性が評価され始めます。", criteria: "いいね率 8%以上推奨" },
        3: { title: "Step 3: おすすめ拡大", desc: "一気に1万回再生を超え、メインフィードへの長期掲載が確定。保存数と共有数が爆発の鍵です。", criteria: "シェア・保存数の継続的な伸び" }
    };

    const ladderBtns = document.querySelectorAll('.p-ladder__btn');
    const ladderDisplay = document.getElementById('ladder-detail-content');

    const updateLadder = (step) => {
        const data = ladderData[step];
        ladderDisplay.innerHTML = `
            <div class="fade-in">
                <h3 class="c-card__title" style="font-size:1.5rem">${data.title}</h3>
                <p style="margin-bottom:1.5rem">${data.desc}</p>
                <div style="background:var(--color-bg-body); padding:1.2rem; border-left:4px solid var(--color-primary); font-weight:700">
                    突破条件: ${data.criteria}
                </div>
            </div>
        `;
    };

    ladderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ladderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateLadder(btn.dataset.step);
        });
    });
    updateLadder(1); // 初期表示

    // --- 4. バズ度シミュレーター ---
    const simInputs = ['input-retention', 'input-completion', 'input-engagement'];
    const updateSim = () => {
        const r = parseFloat(document.getElementById('input-retention').value);
        const c = parseFloat(document.getElementById('input-completion').value);
        const e = parseFloat(document.getElementById('input-engagement').value);

        document.getElementById('val-retention').innerText = `${r}%`;
        document.getElementById('val-completion').innerText = `${c}%`;
        document.getElementById('val-engagement').innerText = `${e}%`;

        // 重み付け計算
        const score = (r * 0.4) + (c * 0.5) + (e * 5);
        let tier = 'C';
        if (score > 85) tier = 'S';
        else if (score > 65) tier = 'A';
        else if (score > 40) tier = 'B';

        document.getElementById('result-tier').innerText = tier;
        document.getElementById('score-bar').style.width = `${Math.min(score, 100)}%`;
    };
    simInputs.forEach(id => document.getElementById(id).addEventListener('input', updateSim));
    updateSim();

    // --- 5. Chart.js 初期化 ---
    const initCharts = () => {
        const ctxM = document.getElementById('metricsChart').getContext('2d');
        new Chart(ctxM, {
            type: 'bar',
            data: {
                labels: ['完了率', '再生時間', '保存', 'いいね'],
                datasets: [{ data: [90, 80, 60, 25], backgroundColor: '#23a5bb' }]
            },
            options: { indexAxis: 'y', plugins: { legend: { display: false } }, maintainAspectRatio: false }
        });

        const ctxR = document.getElementById('retentionChart').getContext('2d');
        new Chart(ctxR, {
            type: 'line',
            data: {
                labels: ['0s', '2s', '5s', '10s', '30s'],
                datasets: [{ label: 'バズ動画', data: [100, 85, 70, 60, 50], borderColor: '#e84233', tension: 0.4 }]
            },
            options: { maintainAspectRatio: false }
        });
    };
    initCharts();

    // --- 6. AI 連携 (Gemini API) ---
    async function callGemini(prompt) {
        if (!apiKey) return "APIキーが設定されていません。";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: "あなたはTikTok戦略の専門家です。データに基づき、具体的で即効性のある日本語のアドバイスを提供してください。" }] }
                })
            });
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (e) {
            return "AIとの通信中にエラーが発生しました。";
        }
    }

    // 診断アドバイス
    document.getElementById('btn-analyze-stats').addEventListener('click', async () => {
        const r = document.getElementById('input-retention').value;
        const c = document.getElementById('input-completion').value;
        const e = document.getElementById('input-engagement').value;
        const target = document.getElementById('ai-stats-result');
        const textField = document.getElementById('ai-stats-text');

        target.classList.remove('hidden');
        textField.innerText = "AIが数値を分析中...";

        const prompt = `TikTok動画の数値：維持率${r}%、完了率${c}%、反応率${e}%。現状の課題と、次の1本で試すべき具体的な改善策を3行で教えて。`;
        textField.innerText = await callGemini(prompt);
    });

    // 企画提案
    document.getElementById('btn-generate-concept').addEventListener('click', async () => {
        const topic = document.getElementById('ai-input-topic').value;
        if (!topic) return;
        const container = document.getElementById('ai-concepts-container');
        const empty = document.getElementById('ai-empty-state');
        
        empty.innerText = "バズる企画を考案中...";
        container.classList.add('hidden');

        const prompt = `ジャンル「${topic}」で、視聴完了率を最大化する動画コンセプトを2つ提案して。形式：【タイトル】/【開始2秒のフック】/【構成のポイント】`;
        const result = await callGemini(prompt);
        
        container.innerHTML = `<div class="c-card" style="grid-column: 1 / -1"><p style="white-space:pre-wrap">${result}</p></div>`;
        container.classList.remove('hidden');
        empty.classList.add('hidden');
    });
});