const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUG_KbTYrAyOEh6-NSJNueNLfDiXfsnk7vtwCT0wTJsAMGIbdVNoEXtE-xgyrVd0Wn/exec';
let currentPage = 1;
const itemsPerPage = 12;
let allResults = [];

// 統計資料 - 這些應該會從後端API獲取，這裡先放示例數據
const statsData = {
  '112': { fiveA: 372, passRate: 98.7, avgPoints: 32.6, totalStudents: 18324 },
  '111': { fiveA: 358, passRate: 97.9, avgPoints: 31.8, totalStudents: 18156 },
  '110': { fiveA: 345, passRate: 97.4, avgPoints: 31.2, totalStudents: 17980 }
};

// 更新統計資料顯示
function updateStats(year) {
  const stats = statsData[year];
  if (!stats) return;
  
  const cards = document.querySelectorAll('.highlight-card');
  cards[0].querySelector('h3').textContent = `${year}年5A人數`;
  cards[0].querySelector('p').textContent = stats.fiveA;
  
  cards[1].querySelector('h3').textContent = `${year}年錄取率`;
  cards[1].querySelector('p').textContent = `${stats.passRate}%`;
  
  cards[2].querySelector('h3').textContent = `平均分發積分`;
  cards[2].querySelector('p').textContent = stats.avgPoints;
  
  cards[3].querySelector('h3').textContent = `總考生人數`;
  cards[3].querySelector('p').textContent = stats.totalStudents.toLocaleString();
}

function displayResults(results, page = 1) {
  const resultContainer = document.getElementById('resultContainer');
  const resultMessage = document.getElementById('resultMessage');
  const pageInfo = document.getElementById('pageInfo');
  resultContainer.innerHTML = '';

  if (results.length === 0) {
    resultMessage.textContent = '沒有符合條件的結果';
    document.querySelector('.pagination').style.display = 'none';
  } else {
    resultMessage.textContent = '';
    document.querySelector('.pagination').style.display = 'flex';

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageResults = results.slice(startIndex, endIndex);

    pageResults.forEach((school, index) => {
      const card = document.createElement('div');
      card.classList.add('card', 'fade-in');
      card.style.animationDelay = `${index * 0.1}s`;
      
      card.innerHTML = `
        <div class="school-name">${school.name}</div>
        <div class="school-info">
          <div>
            <div>${school.department}</div>
            <div>${school.group || ''}</div>
          </div>
          <div class="school-score">${school.score}</div>
        </div>
      `;
      
      resultContainer.appendChild(card);
    });

    pageInfo.textContent = `第 ${page} 頁，共 ${Math.ceil(results.length / itemsPerPage)} 頁`;
  }
}

document.getElementById('searchForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const year = document.getElementById('year').value;
  const schoolName = document.getElementById('schoolName').value;
  const department = document.getElementById('department').value;
  const minScore = document.getElementById('minScore').value;

  // 顯示搜尋特效
  const searchOverlay = document.querySelector('.search-overlay');
  searchOverlay.classList.add('active');

  const url = `${SCRIPT_URL}?action=search&year=${encodeURIComponent(year)}&schoolName=${encodeURIComponent(schoolName)}&department=${encodeURIComponent(department)}&minScore=${encodeURIComponent(minScore)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      allResults = data;
      currentPage = 1;
      displayResults(allResults, currentPage);
      // 隱藏搜尋特效
      searchOverlay.classList.remove('active');
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('resultMessage').textContent = '搜尋時發生錯誤，請稍後再試。';
      // 隱藏搜尋特效
      searchOverlay.classList.remove('active');
    });
});

document.getElementById('prevPage').addEventListener('click', function() {
  if (currentPage > 1) {
    currentPage--;
    displayResults(allResults, currentPage);
    // 平滑滾動到頁面頂部
    window.scrollTo({ top: document.querySelector('#resultContainer').offsetTop - 100, behavior: 'smooth' });
  }
});

document.getElementById('nextPage').addEventListener('click', function() {
  if (currentPage < Math.ceil(allResults.length / itemsPerPage)) {
    currentPage++;
    displayResults(allResults, currentPage);
    // 平滑滾動到頁面頂部
    window.scrollTo({ top: document.querySelector('#resultContainer').offsetTop - 100, behavior: 'smooth' });
  }
});

// 切換手機版和桌面版
const toggleViewButton = document.getElementById('toggleView');
toggleViewButton.addEventListener('click', function() {
  document.body.classList.toggle('mobile-view');
  if (document.body.classList.contains('mobile-view')) {
    this.textContent = '💻';
  } else {
    this.textContent = '📱';
  }
  displayResults(allResults, currentPage);
});

// 年份變更事件監聽
document.getElementById('year').addEventListener('change', function() {
  updateStats(this.value);
});

// 手機版菜單切換
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', function() {
  this.classList.toggle('open');
  navLinks.classList.toggle('active');
});

// 點擊菜單外區域關閉菜單
document.addEventListener('click', function(e) {
  if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
    menuToggle.classList.remove('open');
    navLinks.classList.remove('active');
  }
});

// 添加卡片動畫效果
function addCardAnimations() {
  const cards = document.querySelectorAll('.highlight-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
}

// 初始化頁面
document.addEventListener('DOMContentLoaded', function() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  loadingOverlay.classList.add('active');
  
  // 設置初始年份的統計數據
  const initialYear = document.getElementById('year').value;
  updateStats(initialYear);
  
  addCardAnimations();

  fetch(`${SCRIPT_URL}?action=getAll&year=${initialYear}`)
    .then(response => response.json())
    .then(data => {
      allResults = data;
      displayResults(allResults, currentPage);
      // 隱藏載入特效
      loadingOverlay.classList.remove('active');
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('resultMessage').textContent = '載入資料時發生錯誤，請稍後再試。';
      // 隱藏載入特效
      loadingOverlay.classList.remove('active');
    });
});

// 監聽螢幕大小變化，自動切換視圖
window.addEventListener('resize', function() {
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-view');
    toggleViewButton.textContent = '💻';
  } else {
    document.body.classList.remove('mobile-view');
    toggleViewButton.textContent = '📱';
  }
});

// 初始化時檢查螢幕大小
if (window.innerWidth <= 768) {
  document.body.classList.add('mobile-view');
  toggleViewButton.textContent = '💻';
}