// 統計頁面管理類
class StatsPageManager {
    constructor() {
        this.dataManager = new SurveyDataManager();
        this.currentDate = null;
        this.bubbleColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
        ];
        
        this.init();
    }

    init() {
        this.setupDateSelector();
        this.setupEventListeners();
        this.loadInitialData();
    }

    // 設置日期選擇器
    setupDateSelector() {
        const dateSelect = document.getElementById('dateSelect');
        const availableDates = this.dataManager.getAvailableDates();
        
        // 清空現有選項
        dateSelect.innerHTML = '<option value="">選擇日期</option>';
        
        // 添加可用日期
        availableDates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = this.formatDate(date);
            dateSelect.appendChild(option);
        });
        
        // 如果有日期，默認選擇最新的
        if (availableDates.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const paramDate = urlParams.get('date');
            const defaultDate = paramDate && availableDates.includes(paramDate) 
                ? paramDate 
                : availableDates[0];
            
            dateSelect.value = defaultDate;
            this.currentDate = defaultDate;
        }
    }

    // 設置事件監聽器
    setupEventListeners() {
        const dateSelect = document.getElementById('dateSelect');
        dateSelect.addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.updateStats();
        });
    }

    // 加載初始數據
    loadInitialData() {
        if (this.currentDate) {
            this.updateStats();
        } else {
            this.showNoData();
        }
    }

    // 更新統計顯示
    updateStats() {
        if (!this.currentDate) {
            this.showNoData();
            return;
        }

        const stats = this.dataManager.getAnswerStats(this.currentDate);
        const totalResponses = this.dataManager.getDataByDate(this.currentDate).length;
        
        // 更新回應數量
        document.getElementById('responseCount').textContent = `共收到 ${totalResponses} 份回應`;
        
        if (stats.length === 0) {
            this.showNoData();
        } else {
            this.renderBubbles(stats);
        }
    }

    // 渲染泡泡
    renderBubbles(stats) {
        const container = document.getElementById('bubblesContainer');
        const noDataMessage = document.getElementById('noDataMessage');
        
        // 隱藏無數據消息
        noDataMessage.style.display = 'none';
        
        // 清空現有泡泡
        const existingBubbles = container.querySelectorAll('.bubble');
        existingBubbles.forEach(bubble => bubble.remove());
        
        // 計算泡泡大小
        const maxCount = Math.max(...stats.map(s => s.count));
        
        stats.forEach((stat, index) => {
            const bubble = this.createBubble(stat, maxCount, index);
            container.appendChild(bubble);
        });
        
        // 防止泡泡重疊
        setTimeout(() => {
            this.adjustBubblePositions();
        }, 100);
    }

    // 創建單個泡泡
    createBubble(stat, maxCount, index) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        // 計算大小
        const size = this.calculateBubbleSize(stat.count, maxCount);
        const color = this.bubbleColors[index % this.bubbleColors.length];
        
        // 隨機位置
        const left = Math.random() * 80 + 5; // 5% - 85%
        const top = Math.random() * 60 + 10; // 10% - 70%
        
        // 設置樣式
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.backgroundColor = color;
        bubble.style.left = left + '%';
        bubble.style.top = top + '%';
        bubble.style.animationDelay = (Math.random() * 5) + 's';
        
        // 設置內容
        bubble.innerHTML = `
            <div class="bubble-text">${this.escapeHtml(stat.original)}</div>
            <div class="bubble-count">${stat.count}</div>
        `;
        
        // 添加點擊事件
        bubble.addEventListener('click', () => {
            this.showBubbleDetails(stat);
        });
        
        return bubble;
    }

    // 計算泡泡大小
    calculateBubbleSize(count, maxCount) {
        const minSize = 60;
        const maxSize = 200;
        
        if (maxCount <= 1) {
            return minSize;
        }
        
        const ratio = count / maxCount;
        return minSize + (maxSize - minSize) * ratio;
    }

    // 調整泡泡位置避免重疊
    adjustBubblePositions() {
        const bubbles = document.querySelectorAll('.bubble');
        const container = document.getElementById('bubblesContainer');
        const containerRect = container.getBoundingClientRect();
        
        bubbles.forEach((bubble, index) => {
            let attempts = 0;
            let overlapping = true;
            
            while (overlapping && attempts < 10) {
                overlapping = false;
                const bubbleRect = bubble.getBoundingClientRect();
                
                for (let i = 0; i < bubbles.length; i++) {
                    if (i === index) continue;
                    
                    const otherBubble = bubbles[i];
                    const otherRect = otherBubble.getBoundingClientRect();
                    
                    const distance = Math.sqrt(
                        Math.pow(bubbleRect.left - otherRect.left, 2) + 
                        Math.pow(bubbleRect.top - otherRect.top, 2)
                    );
                    
                    const minDistance = (bubbleRect.width + otherRect.width) / 2 + 20;
                    
                    if (distance < minDistance) {
                        overlapping = true;
                        break;
                    }
                }
                
                if (overlapping) {
                    const newLeft = Math.random() * 80 + 5;
                    const newTop = Math.random() * 60 + 10;
                    bubble.style.left = newLeft + '%';
                    bubble.style.top = newTop + '%';
                    attempts++;
                }
            }
        });
    }

    // 顯示泡泡詳情
    showBubbleDetails(stat) {
        const message = `"${stat.original}"\n\n共有 ${stat.count} 人提到了這個答案`;
        alert(message);
    }

    // 顯示無數據狀態
    showNoData() {
        const container = document.getElementById('bubblesContainer');
        const noDataMessage = document.getElementById('noDataMessage');
        
        // 清空泡泡
        const existingBubbles = container.querySelectorAll('.bubble');
        existingBubbles.forEach(bubble => bubble.remove());
        
        // 顯示無數據消息
        noDataMessage.style.display = 'block';
        
        // 更新回應數量
        document.getElementById('responseCount').textContent = '共收到 0 份回應';
    }

    // 格式化日期顯示
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[date.getDay()];
        
        return `${year}-${month}-${day} (週${weekday})`;
    }

    // HTML轉義
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 頁面加載完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    new StatsPageManager();
});

