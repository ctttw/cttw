const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxUG_KbTYrAyOEh6-NSJNueNLfDiXfsnk7vtwCT0wTJsAMGIbdVNoEXtE-xgyrVd0Wn/exec';
let currentPage = 1;
const itemsPerPage = 12;
let allResults = [];
let comparisonList = []; 
const maxCompareItems = 4; 

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
      
      const isInComparison = comparisonList.some(item => 
        item.name === school.name && 
        item.department === school.department && 
        (item.group || '') === (school.group || '')
      );
      
      card.innerHTML = `
        <div class="school-name">${school.name}</div>
        <div class="school-info">
          <div class="school-score">${school.score}</div>
          <div class="department-info">
            <div class="department-name">${school.department}</div>
            ${school.group ? `<div class="group-name">${school.group}</div>` : ''}
          </div>
        </div>
        <button class="compare-btn ${isInComparison ? 'active' : ''}" data-index="${index}">
          ${isInComparison ? '移除比較' : '加入比較'}
        </button>
      `;
      
      resultContainer.appendChild(card);
      
      const compareBtn = card.querySelector('.compare-btn');
      compareBtn.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const school = pageResults[index];
        toggleCompare(school, this);
      });
    });

    pageInfo.textContent = `第 ${page} 頁，共 ${Math.ceil(results.length / itemsPerPage)} 頁`;
  }
  
  updateComparisonCounter();
}

// 統計資料 - 這些應該會從後端API獲取，這裡先放示例數據
const statsData = {
  '112': { fiveA: 372, passRate: 98.7, avgPoints: 32.6, totalStudents: 18324 },
  '111': { fiveA: 358, passRate: 97.9, avgPoints: 31.8, totalStudents: 18156 },
  '110': { fiveA: 345, passRate: 97.4, avgPoints: 31.2, totalStudents: 17980 }
};

// Function to toggle school in comparison list
function toggleCompare(school, button) {
  const index = comparisonList.findIndex(item => 
    item.name === school.name && 
    item.department === school.department && 
    (item.group || '') === (school.group || '')
  );
  
  if (index > -1) {
    comparisonList.splice(index, 1);
    button.textContent = '加入比較';
    button.classList.remove('active');
  } else {
    if (comparisonList.length >= maxCompareItems) {
      alert(`最多只能比較${maxCompareItems}個學校，請先移除其他學校再加入。`);
      return;
    }
    
    comparisonList.push(school);
    button.textContent = '移除比較';
    button.classList.add('active');
  }
  
  updateComparisonCounter();
  
  localStorage.setItem('comparisonList', JSON.stringify(comparisonList));
}

// Function to update comparison counter
function updateComparisonCounter() {
  const counter = document.getElementById('compareCounter');
  if (counter) {
    counter.textContent = comparisonList.length;
    
    const comparePanel = document.getElementById('comparePanel');
    if (comparisonList.length > 0) {
      comparePanel.style.display = 'flex';
    } else {
      comparePanel.style.display = 'none';
    }
  }
}

// Function to show comparison modal
function showComparisonModal() {
  const modal = document.getElementById('comparisonModal');
  const modalContent = document.getElementById('comparisonContent');
  
  modalContent.innerHTML = '';
  
  if (comparisonList.length === 0) {
    modalContent.innerHTML = '<p class="no-compare-message">尚未加入任何學校進行比較</p>';
  } else {
    const table = document.createElement('table');
    table.className = 'comparison-table';
    
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>項目</th>';
    
    comparisonList.forEach((school, index) => {
      headerRow.innerHTML += `
        <th>
          ${school.name}
          <button class="remove-compare-btn" data-index="${index}">×</button>
        </th>
      `;
    });
    
    table.appendChild(headerRow);
    
    const attributes = [
      { name: '學校', value: school => school.name },
      { name: '群別', value: school => school.department },
      { name: '科別', value: school => school.group || '-' },
      { name: '最低錄取分數', value: school => school.score }
    ];
    
    attributes.forEach(attr => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${attr.name}</td>`;
      
      comparisonList.forEach(school => {
        row.innerHTML += `<td>${attr.value(school)}</td>`;
      });
      
      table.appendChild(row);
    });
    
    modalContent.appendChild(table);
    
    const removeButtons = modalContent.querySelectorAll('.remove-compare-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        comparisonList.splice(index, 1);
        localStorage.setItem('comparisonList', JSON.stringify(comparisonList));
        showComparisonModal(); 
        displayResults(allResults, currentPage);
      });
    });
  }
  
  modal.style.display = 'block';
}

// Function to close comparison modal
function closeComparisonModal() {
  const modal = document.getElementById('comparisonModal');
  modal.style.display = 'none';
}

document.getElementById('searchForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const year = document.getElementById('year').value;
  const schoolName = document.getElementById('schoolName').value;
  const department = document.getElementById('department').value;
  const minScore = document.getElementById('minScore').value;

  const searchOverlay = document.querySelector('.search-overlay');
  searchOverlay.classList.add('active');

  const url = `${SCRIPT_URL}?action=search&year=${encodeURIComponent(year)}&schoolName=${encodeURIComponent(schoolName)}&department=${encodeURIComponent(department)}&minScore=${encodeURIComponent(minScore)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      allResults = data;
      currentPage = 1;
      displayResults(allResults, currentPage);
      searchOverlay.classList.remove('active');
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('resultMessage').textContent = '搜尋時發生錯誤，請稍後再試。';
      searchOverlay.classList.remove('active');
    });
});

document.getElementById('prevPage').addEventListener('click', function() {
  if (currentPage > 1) {
    currentPage--;
    displayResults(allResults, currentPage);
    window.scrollTo({ top: document.querySelector('#resultContainer').offsetTop - 100, behavior: 'smooth' });
  }
});

document.getElementById('nextPage').addEventListener('click', function() {
  if (currentPage < Math.ceil(allResults.length / itemsPerPage)) {
    currentPage++;
    displayResults(allResults, currentPage);
    window.scrollTo({ top: document.querySelector('#resultContainer').offsetTop - 100, behavior: 'smooth' });
  }
});

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

document.getElementById('year').addEventListener('change', function() {
  updateStats(this.value);
});

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', function() {
  this.classList.toggle('open');
  navLinks.classList.toggle('active');
});

document.addEventListener('click', function(e) {
  if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
    menuToggle.classList.remove('open');
    navLinks.classList.remove('active');
  }
});

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

document.addEventListener('DOMContentLoaded', function() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  loadingOverlay.classList.add('active');
  
  const savedList = localStorage.getItem('comparisonList');
  if (savedList) {
    comparisonList = JSON.parse(savedList);
  }
  
  const initialYear = document.getElementById('year').value;
  updateStats(initialYear);
  
  addCardAnimations();

  fetch(`${SCRIPT_URL}?action=getAll&year=${initialYear}`)
    .then(response => response.json())
    .then(data => {
      allResults = data;
      displayResults(allResults, currentPage);
      loadingOverlay.classList.remove('active');
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('resultMessage').textContent = '載入資料時發生錯誤，請稍後再試。';
      loadingOverlay.classList.remove('active');
    });
    
  const modal = document.getElementById('comparisonModal');
  const closeBtn = document.getElementsByClassName('close-modal')[0];
  
  closeBtn.addEventListener('click', closeComparisonModal);
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeComparisonModal();
    }
  });
  
  document.getElementById('compareButton').addEventListener('click', showComparisonModal);
  
  updateComparisonCounter();
});

window.addEventListener('resize', function() {
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-view');
    toggleViewButton.textContent = '💻';
  } else {
    document.body.classList.remove('mobile-view');
    toggleViewButton.textContent = '📱';
  }
});

if (window.innerWidth <= 768) {
  document.body.classList.add('mobile-view');
  toggleViewButton.textContent = '💻';
}