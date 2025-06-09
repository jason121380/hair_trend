document.addEventListener('DOMContentLoaded', function() {
    // 設置今天和一個月前的日期作為預設值
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // 初始化 flatpickr 日期範圍選擇器
    flatpickr("#date-range", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [oneMonthAgo, today],
        locale: "zh-tw",
        rangeSeparator: " 至 ",
        showMonths: 1,
        static: true,
        plugins: []
    });
    
    // 初始化圖表
    initChart();
    
    // 初始顯示空狀態，隱藏結果區域
    toggleEmptyState(true);
    
    // 監聽搜尋按鈕點擊事件
    document.getElementById('search-button').addEventListener('click', performSearch);
    
    // 監聽Enter鍵搜尋
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // 監聽視圖切換按鈕
    document.getElementById('grid-view').addEventListener('click', function() {
        toggleView('grid');
    });
    
    document.getElementById('list-view').addEventListener('click', function() {
        toggleView('list');
    });
    
    // 滾動事件 - 為黏性卡片添加增強陰影
    window.addEventListener('scroll', function() {
        const chartContainer = document.querySelector('.chart-container');
        if (!chartContainer) return;
        
        // 當滾動超過100px時，添加增強陰影
        if (window.scrollY > 100) {
            chartContainer.classList.add('sticky-active');
        } else {
            chartContainer.classList.remove('sticky-active');
        }

        // 顯示或隱藏回到頂部按鈕
        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        }
    });
    
    // 主題切換功能
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            const htmlElement = document.documentElement;
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // 更新主題
            htmlElement.setAttribute('data-theme', newTheme);
            
            // 存儲主題偏好到本地存儲
            localStorage.setItem('theme', newTheme);
            
            // 更新圖表主題
            updateChartTheme(newTheme);
        });
        
        // 從本地存儲加載主題偏好
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            if (window.trendChart) {
                updateChartTheme(savedTheme);
            }
        }
    }

    // 回到頂部按鈕點擊事件
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

// 切換空狀態和結果區域的顯示
function toggleEmptyState(showEmpty) {
    const emptyState = document.getElementById('empty-state');
    const resultsSection = document.querySelector('.results-section');
    
    if (showEmpty) {
        emptyState.style.display = 'flex';
        resultsSection.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        resultsSection.style.display = 'block';
        
        // 添加淡入動畫效果
        resultsSection.style.animation = 'fadeIn 0.5s ease';
    }
}

// 切換貼文列表視圖
function toggleView(viewType) {
    const postsList = document.getElementById('posts-list');
    const gridButton = document.getElementById('grid-view');
    const listButton = document.getElementById('list-view');
    
    if (viewType === 'grid') {
        postsList.className = 'grid-view';
        gridButton.classList.add('active');
        listButton.classList.remove('active');
    } else {
        postsList.className = 'list-view';
        listButton.classList.add('active');
        gridButton.classList.remove('active');
    }
}

// 假資料生成函數
function generateFakeData(keyword, startDate, endDate) {
    const posts = [];
    
    // 安全地解析開始和結束日期
    let startTime, endTime, dayDiff;
    
    try {
        // 解析 YYYY-MM-DD 格式的日期
        const [startYear, startMonth, startDay] = startDate.split('-').map(num => parseInt(num, 10));
        const [endYear, endMonth, endDay] = endDate.split('-').map(num => parseInt(num, 10));
        
        // 創建日期對象
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);
        
        // 檢查日期是否有效
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error("無效日期");
        }
        
        startTime = start.getTime();
        endTime = end.getTime();
        dayDiff = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
        
        // 確保至少有一天的差異
        if (dayDiff < 0) {
            // 如果開始日期在結束日期之後，則交換
            [startTime, endTime] = [endTime, startTime];
            dayDiff = Math.abs(dayDiff);
        } else if (dayDiff === 0) {
            // 如果是同一天，設為至少1天差異
            dayDiff = 1;
        }
    } catch (error) {
        console.error("日期解析錯誤:", error);
        // 使用預設的日期範圍 (今天和一個月前)
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        startTime = oneMonthAgo.getTime();
        endTime = today.getTime();
        dayDiff = 30; // 約一個月
    }
    
    // 生成10-20篇假貼文
    const postCount = Math.floor(Math.random() * 11) + 10;
    
    for (let i = 0; i < postCount; i++) {
        // 隨機日期在所選範圍內
        const randomDayOffset = Math.floor(Math.random() * (dayDiff + 1));
        const postDate = new Date(startTime + randomDayOffset * 24 * 60 * 60 * 1000);
        
        // 生成帶有關鍵字的隨機貼文內容
        const content = generateRandomContent(keyword);

        // 產生隨機圖片
        const imageId = Math.floor(Math.random() * 1000) + 100;
        const imageUrl = `https://picsum.photos/id/${imageId}/500/500`;
        
        posts.push({
            id: `post_${i}`,
            date: postDate,
            content: content,
            image: imageUrl,
            likes: Math.floor(Math.random() * 1000) + 50,
            comments: Math.floor(Math.random() * 100) + 5,
            link: `https://instagram.com/p/${generateRandomString(11)}`
        });
    }
    
    // 按日期排序
    posts.sort((a, b) => b.date - a.date);
    
    return posts;
}

// 生成隨機內容
function generateRandomContent(keyword) {
    const prefixes = [
        "今天我想分享",
        "大家有沒有關注",
        "最近發現一個超棒的",
        "分享一下我的",
        "你們知道嗎？",
        "終於找到了理想的"
    ];
    
    const suffixes = [
        "真的很推薦給大家！",
        "希望對你們有幫助～",
        "大家來討論一下吧！",
        "喜歡的話請幫我按讚❤️",
        "有什麼建議都可以告訴我",
        "歡迎在下方留言分享你的看法"
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // 隨機添加相關的熱門標籤
    const relatedTags = generateRelatedTags(keyword);
    const randomTags = [];
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const randomTag = relatedTags[Math.floor(Math.random() * relatedTags.length)];
        if (!randomTags.includes(randomTag)) {
            randomTags.push(randomTag);
        }
    }
    
    const tagsText = randomTags.map(tag => `#${tag}`).join(' ');
    
    return `${prefix}關於#${keyword}的心得，這是我最近很喜歡的主題。${generateRandomString(20)}#${keyword} ${tagsText} ${generateRandomString(30)}。${suffix}`;
}

// 生成相關標籤
function generateRelatedTags(keyword) {
    // 根據不同關鍵字生成相關標籤
    const commonTags = ['生活', '分享', '推薦', '2023', '熱門'];
    
    // 針對特定關鍵字的相關標籤
    const keywordSpecificTags = {
        '美食': ['foodie', '美食推薦', '餐廳', '小吃', '甜點', '下午茶'],
        '旅遊': ['travel', '打卡', '景點', '旅行', '國外', '國內旅遊'],
        '穿搭': ['fashion', 'ootd', '時尚', '搭配', '風格', '流行'],
        '美妝': ['beauty', '彩妝', '保養', '化妝', 'skincare', 'makeup'],
        '健身': ['fitness', '運動', '健康', '瘦身', '肌肉', '重訓'],
        '3C': ['科技', '開箱', '評測', '手機', '電腦', '數位'],
        '寵物': ['pet', '狗', '貓', '毛小孩', '可愛', '寵物用品']
    };
    
    // 檢查關鍵字是否在預定義的標籤中
    const specificTags = Object.keys(keywordSpecificTags).find(key => 
        keyword.includes(key)
    );
    
    // 如果找到對應的特定標籤，返回特定標籤和通用標籤的組合
    if (specificTags) {
        return [...keywordSpecificTags[specificTags], ...commonTags];
    }
    
    // 如果沒有對應的特定標籤，生成一些隨機通用標籤
    const genericTags = [
        '流行', '趨勢', 'instagram', 'instagood', 'photooftheday',
        '探索', '發現', keyword + '推薦', keyword + '分享'
    ];
    
    return [...genericTags, ...commonTags];
}

// 生成隨機字串
function generateRandomString(length) {
    const sentences = [
        "這個產品真的很好用，質感也很棒。",
        "最近天氣很舒適，很適合出門走走。",
        "分享一下我的日常穿搭，希望大家喜歡。",
        "這家店的食物真的太美味了，推薦給大家。",
        "今天去了一個很棒的地方，風景超美的。",
        "這本書讓我學到很多，推薦給有興趣的朋友。",
        "今天的妝容是我最近很喜歡的風格。",
        "這款產品使用起來非常方便，效果也很好。"
    ];
    
    // 隨機選擇幾個句子組合
    const sentenceCount = Math.ceil(length / 30);
    let result = "";
    
    for (let i = 0; i < sentenceCount; i++) {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        result += sentences[randomIndex] + " ";
    }
    
    return result.trim();
}

// 執行搜尋
function performSearch() {
    const keyword = document.getElementById('search-input').value.trim();
    const dateRange = document.getElementById('date-range').value;
    
    if (!keyword) {
        alert('請輸入搜尋關鍵字');
        return;
    }
    
    if (!dateRange) {
        alert('請選擇日期範圍');
        return;
    }
    
    // 解析日期範圍
    const dates = dateRange.split(' 至 ');
    let startDate = dates[0];
    let endDate = dates.length > 1 ? dates[1] : dates[0];
    
    // 顯示結果區域，隱藏空狀態
    toggleEmptyState(false);
    
    // 獲取假資料
    const posts = generateFakeData(keyword, startDate, endDate);
    
    // 顯示貼文列表
    displayPosts(posts);
    
    // 更新圖表
    updateChart(keyword, startDate, endDate);
    
    // 顯示熱門關鍵字和趨勢字
    displayKeywords(keyword, startDate, endDate);
}

// 顯示貼文列表
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-list');
    postsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p class="no-results">沒有找到相關貼文</p>';
        return;
    }
    
    // 添加延遲顯示的動畫效果
    posts.forEach((post, index) => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.id = post.id;
        postElement.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;
        postElement.style.opacity = '0';
        
        // 確保日期格式化正確
        let formattedDate;
        try {
            formattedDate = post.date instanceof Date && !isNaN(post.date) 
                ? post.date.toLocaleDateString('zh-TW') 
                : '日期未知';
        } catch(e) {
            console.error("日期格式化錯誤:", e);
            formattedDate = '日期未知';
        }
        
        postElement.innerHTML = `
            <div class="post-image">
                <img src="${post.image}" alt="Instagram 貼文圖片" loading="lazy">
            </div>
            <div class="post-header">
                <h3>Instagram 貼文</h3>
                <span class="post-date">${formattedDate}</span>
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            <div class="post-stats">
                <i class="far fa-heart"></i> ${post.likes} | <i class="far fa-comment"></i> ${post.comments}
            </div>
            <div class="post-actions">
                <a href="${post.link}" target="_blank" class="post-link">查看原始貼文</a>
                <button class="rewrite-button" data-id="${post.id}">
                    <i class="fas fa-magic"></i> 一鍵轉寫
                </button>
            </div>
            <div class="rewritten-content" id="rewritten-${post.id}"></div>
        `;
        
        postsContainer.appendChild(postElement);
    });
    
    // 添加轉寫按鈕事件監聽
    document.querySelectorAll('.rewrite-button').forEach(button => {
        button.addEventListener('click', handleRewrite);
    });
}

// 處理轉寫功能
function handleRewrite(e) {
    const postId = e.target.closest('.rewrite-button').getAttribute('data-id');
    const rewrittenElement = document.getElementById(`rewritten-${postId}`);
    
    // 如果已經有轉寫內容，切換顯示/隱藏
    if (rewrittenElement.textContent) {
        rewrittenElement.style.display = rewrittenElement.style.display === 'none' ? 'block' : 'none';
        return;
    }
    
    // 顯示載入中
    rewrittenElement.innerHTML = '<div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> 轉寫中...</div>';
    rewrittenElement.style.display = 'block';
    
    // 模擬 AI 轉寫延遲
    setTimeout(() => {
        const originalContent = document.querySelector(`#${postId} .post-content`).textContent;
        const rewrittenContent = generateRewrite(originalContent);
        rewrittenElement.innerHTML = `<strong><i class="fas fa-robot"></i> AI 轉寫結果:</strong><br>${rewrittenContent}`;
    }, 1000);
}

// 生成轉寫內容
function generateRewrite(originalContent) {
    // 簡單的轉寫邏輯 - 實際應用會使用 AI 服務
    const originalWords = originalContent.split(' ');
    const keyPoints = [];
    
    // 從原文中提取關鍵點（模擬）
    for (let i = 0; i < originalWords.length; i += 7) {
        if (i < originalWords.length) {
            const segment = originalWords.slice(i, Math.min(i + 7, originalWords.length)).join(' ');
            if (segment.length > 15) {
                keyPoints.push(segment);
            }
        }
    }
    
    // 組合成摘要
    let summary = '這篇貼文主要分享了以下內容：<br><ul>';
    keyPoints.slice(0, 3).forEach(point => {
        summary += `<li>${point}</li>`;
    });
    summary += '</ul>';
    
    // 添加結論
    summary += '<br>總結來說，這篇貼文主要是關於' + 
               (originalContent.includes('#') ? originalContent.split('#')[1].split(' ')[0] : '生活分享') + 
               '的心得與推薦。';
    
    return summary;
}

// 顯示熱門關鍵字和趨勢字
function displayKeywords(mainKeyword, startDate, endDate) {
    const keywordsContainer = document.getElementById('keywords-list');
    keywordsContainer.innerHTML = '';
    
    // 生成熱門關鍵字和趨勢字
    const keywords = generateKeywordsData(mainKeyword);
    
    // 格式化日期範圍字串
    let dateRangeStr;
    
    // 確保日期格式正確
    try {
        const [startYear, startMonth, startDay] = startDate.split('-').map(num => parseInt(num, 10));
        const [endYear, endMonth, endDay] = endDate.split('-').map(num => parseInt(num, 10));
        
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);
        
        // 檢查日期是否有效
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error("無效日期");
        }
        
        dateRangeStr = `${start.toLocaleDateString('zh-TW')} - ${end.toLocaleDateString('zh-TW')}`;
    } catch (error) {
        console.error("日期格式化錯誤:", error);
        dateRangeStr = `${startDate} - ${endDate}`;
    }
    
    // 顯示日期範圍
    const dateRangeElement = document.createElement('div');
    dateRangeElement.className = 'date-range';
    dateRangeElement.innerHTML = `<i class="far fa-calendar-alt"></i> 分析時間範圍: ${dateRangeStr}`;
    keywordsContainer.appendChild(dateRangeElement);
    
    // 顯示主關鍵字
    const mainKeywordElement = document.createElement('div');
    mainKeywordElement.className = 'keyword-tag trending';
    mainKeywordElement.innerHTML = `#${mainKeyword} <span class="count">${Math.floor(Math.random() * 500) + 1000}</span>`;
    keywordsContainer.appendChild(mainKeywordElement);
    
    // 顯示熱門關鍵字
    keywords.forEach((kw, index) => {
        const keywordElement = document.createElement('div');
        keywordElement.className = `keyword-tag${kw.trending ? ' trending' : ''}`;
        keywordElement.innerHTML = `#${kw.text} <span class="count">${kw.count}</span>`;
        keywordElement.style.animation = `fadeIn 0.3s ease forwards ${index * 0.05}s`;
        keywordElement.style.opacity = '0';
        keywordsContainer.appendChild(keywordElement);
    });
}

// 生成熱門關鍵字和趨勢字數據
function generateKeywordsData(mainKeyword) {
    const relatedTags = generateRelatedTags(mainKeyword);
    const keywords = [];
    
    // 為關鍵字生成隨機出現次數並標記是否為趨勢字
    relatedTags.forEach(tag => {
        const count = Math.floor(Math.random() * 500) + 100;
        const trending = Math.random() > 0.7; // 約 30% 的標籤為趨勢字
        
        keywords.push({
            text: tag,
            count: count,
            trending: trending
        });
    });
    
    // 按出現次數排序
    keywords.sort((a, b) => b.count - a.count);
    
    // 返回前 15 個關鍵字
    return keywords.slice(0, 15);
}

// 初始化圖表
function initChart() {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    // 設定 Chart.js 全局配色
    Chart.defaults.color = '#ececec';
    Chart.defaults.borderColor = '#3a3a3a';
    
    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '關鍵詞出現頻率',
                data: [],
                backgroundColor: 'rgba(16, 163, 127, 0.2)',
                borderColor: '#10a37f',
                borderWidth: 2,
                tension: 0.3,
                pointBackgroundColor: '#10a37f',
                pointBorderColor: '#ffffff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: "'Inter', 'Noto Sans TC', sans-serif",
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#242424',
                    titleFont: {
                        family: "'Inter', 'Noto Sans TC', sans-serif",
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: "'Inter', 'Noto Sans TC', sans-serif",
                        size: 13
                    },
                    padding: 10,
                    borderColor: '#3a3a3a',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#2a2a2a'
                    },
                    title: {
                        display: true,
                        text: '出現次數',
                        font: {
                            family: "'Inter', 'Noto Sans TC', sans-serif",
                            size: 14
                        }
                    }
                },
                x: {
                    grid: {
                        color: '#2a2a2a'
                    },
                    title: {
                        display: true,
                        text: '日期',
                        font: {
                            family: "'Inter', 'Noto Sans TC', sans-serif",
                            size: 14
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// 更新圖表
function updateChart(keyword, startDate, endDate) {
    // 生成日期標籤
    const labels = [];
    const data = [];
    
    // 安全地解析開始和結束日期
    let start, end, dayDiff;
    
    try {
        // 解析 YYYY-MM-DD 格式的日期
        const [startYear, startMonth, startDay] = startDate.split('-').map(num => parseInt(num, 10));
        const [endYear, endMonth, endDay] = endDate.split('-').map(num => parseInt(num, 10));
        
        // 創建日期對象
        start = new Date(startYear, startMonth - 1, startDay);
        end = new Date(endYear, endMonth - 1, endDay);
        
        // 檢查日期是否有效
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error("無效日期");
        }
        
        dayDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
        
        // 確保至少有一天的差異
        if (dayDiff < 0) {
            // 如果開始日期在結束日期之後，則交換
            [start, end] = [end, start];
            dayDiff = Math.abs(dayDiff);
        } else if (dayDiff === 0) {
            // 如果是同一天，設為至少1天差異
            dayDiff = 1;
        }
    } catch (error) {
        console.error("日期解析錯誤:", error);
        // 使用預設的日期範圍 (今天和一個月前)
        end = new Date();
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        dayDiff = 30; // 約一個月
    }
    
    // 如果日期範圍太大，則使用週或月為單位
    let interval = 1; // 默認間隔1天
    let intervalUnit = 'day';
    
    if (dayDiff > 60) {
        interval = 7;
        intervalUnit = 'week';
    } else if (dayDiff > 14) {
        interval = 2;
        intervalUnit = 'day';
    }
    
    // 生成日期標籤和隨機資料
    for (let i = 0; i <= dayDiff; i += interval) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        
        // 格式化日期
        const formattedDate = currentDate.toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric'
        });
        
        labels.push(formattedDate);
        
        // 生成基於關鍵字長度的趨勢數據（確保有趨勢）
        const base = keyword.length * 10;
        const trend = Math.sin(i / dayDiff * Math.PI) * base * 0.5;
        const random = Math.random() * base * 0.3;
        data.push(Math.max(0, Math.round(base + trend + random)));
    }
    
    // 更新圖表
    window.trendChart.data.labels = labels;
    window.trendChart.data.datasets[0].data = data;
    window.trendChart.data.datasets[0].label = `"${keyword}" 出現頻率`;
    
    // 清空動畫以設置新數據
    window.trendChart.update('none');
    
    // 重新應用動畫
    window.trendChart.update();
}

// 更新圖表主題
function updateChartTheme(theme) {
    if (!window.trendChart) return;
    
    // 設定 Chart.js 全局配色
    if (theme === 'dark') {
        Chart.defaults.color = '#ececec';
        Chart.defaults.borderColor = '#3a3a3a';
        
        window.trendChart.options.scales.y.grid.color = '#2a2a2a';
        window.trendChart.options.scales.x.grid.color = '#2a2a2a';
        window.trendChart.options.plugins.tooltip.backgroundColor = '#242424';
    } else {
        Chart.defaults.color = '#333333';
        Chart.defaults.borderColor = '#d0d0d0';
        
        window.trendChart.options.scales.y.grid.color = '#e0e0e0';
        window.trendChart.options.scales.x.grid.color = '#e0e0e0';
        window.trendChart.options.plugins.tooltip.backgroundColor = '#f8f8f8';
        window.trendChart.options.plugins.tooltip.titleColor = '#333333';
        window.trendChart.options.plugins.tooltip.bodyColor = '#555555';
    }
    
    // 更新圖表
    window.trendChart.update();
} 