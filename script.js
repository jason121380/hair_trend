const state = {
  chart: null,
  posts: [],
  currentView: 'grid'
};

document.addEventListener('DOMContentLoaded', () => {
  initDateRange();
  initTheme();
  initEvents();
  initChart();
  toggleEmptyState(true);
});

function initDateRange() {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 30);

  flatpickr('#date-range', {
    mode: 'range',
    dateFormat: 'Y-m-d',
    defaultDate: [start, today],
    locale: 'zh-tw',
    rangeSeparator: ' 至 '
  });
}

function initTheme() {
  const html = document.documentElement;
  const button = document.getElementById('theme-toggle-btn');
  const icon = button.querySelector('i');
  const saved = localStorage.getItem('theme') || 'dark';

  applyTheme(saved);

  button.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    updateChartTheme(theme);
  }
}

function initEvents() {
  document.getElementById('search-button').addEventListener('click', performSearch);
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  document.getElementById('grid-view').addEventListener('click', () => toggleView('grid'));
  document.getElementById('list-view').addEventListener('click', () => toggleView('list'));

  const backTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('show', window.scrollY > 300);
  });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function toggleEmptyState(isEmpty) {
  document.getElementById('empty-state').style.display = isEmpty ? 'block' : 'none';
  document.querySelector('.results-section').style.display = isEmpty ? 'none' : 'block';
}

function performSearch() {
  const keyword = document.getElementById('search-input').value.trim();
  const dateRange = document.getElementById('date-range').value;

  if (!keyword) {
    alert('請先輸入關鍵字');
    return;
  }

  if (!dateRange) {
    alert('請先選擇日期範圍');
    return;
  }

  const [startDate, endDateRaw] = dateRange.split(' 至 ');
  const endDate = endDateRaw || startDate;

  state.posts = generateMockPosts(keyword, startDate, endDate);
  toggleEmptyState(false);
  renderPosts(state.posts);
  renderKeywords(keyword);
  updateKpi(state.posts);
  updateChart(keyword, startDate, endDate);
}

function toggleView(view) {
  state.currentView = view;
  document.getElementById('posts-list').className = view === 'grid' ? 'grid-view' : 'list-view';
  document.getElementById('grid-view').classList.toggle('active', view === 'grid');
  document.getElementById('list-view').classList.toggle('active', view === 'list');
}

function generateMockPosts(keyword, startDateStr, endDateStr) {
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  let start = new Date(sy, sm - 1, sd);
  let end = new Date(ey, em - 1, ed);

  if (start > end) [start, end] = [end, start];

  const totalDays = Math.max(1, Math.floor((end - start) / 86400000));
  const count = Math.floor(Math.random() * 7) + 12;

  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + Math.floor(Math.random() * (totalDays + 1)));

    const likes = Math.floor(Math.random() * 2200) + 200;
    const comments = Math.floor(Math.random() * 280) + 15;

    return {
      id: `p${i + 1}`,
      date: d,
      image: `https://picsum.photos/seed/${encodeURIComponent(keyword)}-${i}/600/600`,
      content: createMockContent(keyword),
      likes,
      comments,
      link: `https://instagram.com/p/mock${i + 1}`
    };
  }).sort((a, b) => b.date - a.date);
}

function createMockContent(keyword) {
  const opener = ['新發現', '本週最愛', '真心推薦', '最近超常用', '這次想聊聊'];
  const closer = ['歡迎留言分享你們的觀點。', '你會想試試看嗎？', '更多心得之後再整理給大家。'];
  const tags = ['trending', 'insight', 'creatorlife', 'style', 'reels'];

  const op = opener[Math.floor(Math.random() * opener.length)];
  const cl = closer[Math.floor(Math.random() * closer.length)];
  const pickedTags = shuffle(tags).slice(0, 3).map((t) => `#${t}`).join(' ');

  return `${op} #${keyword} 的內容型態，互動比預期更高，尤其在晚上發布的表現最佳。${pickedTags} ${cl}`;
}

function renderPosts(posts) {
  const list = document.getElementById('posts-list');
  list.innerHTML = '';

  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-image"><img src="${post.image}" alt="貼文示意圖" loading="lazy" /></div>
      <div class="post-body">
        <div class="post-meta">
          <span><i class="fa-regular fa-calendar"></i> ${post.date.toLocaleDateString('zh-TW')}</span>
          <span><i class="fa-solid fa-fire"></i> 熱門貼文</span>
        </div>
        <p class="post-content">${post.content}</p>
        <div class="post-stats">
          <span><i class="fa-regular fa-heart"></i> ${post.likes}</span>
          <span><i class="fa-regular fa-comment"></i> ${post.comments}</span>
        </div>
        <div class="post-actions">
          <a class="post-link" target="_blank" rel="noopener" href="${post.link}">原貼文</a>
          <button class="rewrite-button" data-post-id="${post.id}">AI 重寫</button>
        </div>
        <div class="rewritten-content" id="rewrite-${post.id}"></div>
      </div>
    `;
    list.appendChild(card);
  });

  list.className = state.currentView === 'grid' ? 'grid-view' : 'list-view';

  document.querySelectorAll('.rewrite-button').forEach((button) => {
    button.addEventListener('click', () => rewritePost(button.dataset.postId));
  });
}

function rewritePost(postId) {
  const post = state.posts.find((item) => item.id === postId);
  const box = document.getElementById(`rewrite-${postId}`);

  if (box.style.display === 'block') {
    box.style.display = 'none';
    return;
  }

  box.innerHTML = `<strong>AI 建議文案：</strong><br>以「真實成果 + 明確情境 + 行動邀請」重組內容。<br>範例：今天測試 #${extractTag(post.content)}，晚間 8 點發布互動提升明顯，若你也在優化內容節奏，歡迎收藏這篇並留言你的數據。`;
  box.style.display = 'block';
}

function extractTag(content) {
  const matched = content.match(/#([^\s]+)/);
  return matched ? matched[1] : '趨勢主題';
}

function renderKeywords(main) {
  const list = document.getElementById('keywords-list');
  const pool = shuffle([main, '社群策略', '短影音', '互動率', '轉換', '品牌聲量', '行銷漏斗', '內容企劃']);

  list.innerHTML = pool.slice(0, 8).map((kw, i) => `<span class="keyword-tag">#${kw} <strong>${1200 - i * 77}</strong></span>`).join('');
}

function updateKpi(posts) {
  const total = posts.length;
  const avgLikes = Math.round(posts.reduce((s, p) => s + p.likes, 0) / total);
  const avgComments = Math.round(posts.reduce((s, p) => s + p.comments, 0) / total);
  const engagement = ((avgLikes + avgComments) / 100).toFixed(1);

  document.getElementById('kpi-posts').textContent = String(total);
  document.getElementById('kpi-likes').textContent = avgLikes.toLocaleString('en-US');
  document.getElementById('kpi-comments').textContent = avgComments.toLocaleString('en-US');
  document.getElementById('kpi-engagement').textContent = `${engagement}%`;
}

function initChart() {
  const ctx = document.getElementById('trend-chart');
  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: '關鍵字熱度',
        data: [],
        borderColor: '#6f8cff',
        backgroundColor: 'rgba(111, 140, 255, 0.2)',
        tension: 0.35,
        fill: true,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(147, 171, 222, 0.2)' } },
        x: { grid: { display: false } }
      }
    }
  });

  updateChartTheme(document.documentElement.getAttribute('data-theme') || 'dark');
}

function updateChart(keyword, startDateStr, endDateStr) {
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  let start = new Date(sy, sm - 1, sd);
  let end = new Date(ey, em - 1, ed);
  if (start > end) [start, end] = [end, start];

  const days = Math.max(1, Math.floor((end - start) / 86400000));
  const step = days > 28 ? 3 : 1;
  const labels = [];
  const data = [];

  for (let i = 0; i <= days; i += step) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);

    const wave = Math.sin(i / Math.max(1, days) * Math.PI) * 28;
    const noise = Math.random() * 18;
    data.push(Math.round(52 + keyword.length * 5 + wave + noise));
  }

  state.chart.data.labels = labels;
  state.chart.data.datasets[0].data = data;
  state.chart.data.datasets[0].label = `#${keyword} 熱度`;
  state.chart.update();
}

function updateChartTheme(theme) {
  if (!state.chart) return;

  const dark = theme === 'dark';
  state.chart.options.color = dark ? '#d3ddff' : '#2d416d';
  state.chart.options.scales.y.grid.color = dark ? 'rgba(147, 171, 222, 0.2)' : 'rgba(88, 120, 191, 0.22)';
  state.chart.update();
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
