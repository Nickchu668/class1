// 數據存儲和管理
class SurveyDataManager {
    constructor() {
        this.storageKey = 'workSurveyData';
    }

    // 獲取當前日期字符串 (YYYY-MM-DD)
    getCurrentDate() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    // 獲取當前時間字符串 (HH:MM:SS)
    getCurrentTime() {
        const now = new Date();
        return now.toTimeString().split(' ')[0];
    }

    // 保存答案到localStorage
    saveAnswer(answer) {
        const currentDate = this.getCurrentDate();
        const currentTime = this.getCurrentTime();
        
        // 獲取現有數據
        let allData = this.getAllData();
        
        // 如果當天沒有數據，創建新的數組
        if (!allData[currentDate]) {
            allData[currentDate] = [];
        }
        
        // 添加新答案
        allData[currentDate].push({
            time: currentTime,
            answer: answer.trim()
        });
        
        // 保存到localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(allData));
        
        return true;
    }

    // 獲取所有數據
    getAllData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    // 獲取指定日期的數據
    getDataByDate(date) {
        const allData = this.getAllData();
        return allData[date] || [];
    }

    // 獲取所有可用日期
    getAvailableDates() {
        const allData = this.getAllData();
        return Object.keys(allData).sort().reverse(); // 按日期倒序排列
    }

    // 統計指定日期的答案頻率
    getAnswerStats(date) {
        const dayData = this.getDataByDate(date);
        const stats = {};
        
        dayData.forEach(entry => {
            const answer = entry.answer.toLowerCase().trim();
            if (stats[answer]) {
                stats[answer].count++;
            } else {
                stats[answer] = {
                    original: entry.answer,
                    count: 1
                };
            }
        });
        
        // 轉換為數組並按頻率排序
        return Object.entries(stats)
            .map(([key, value]) => ({
                answer: key,
                original: value.original,
                count: value.count
            }))
            .sort((a, b) => b.count - a.count);
    }
}

// 初始化數據管理器
const dataManager = new SurveyDataManager();

// DOM 元素
const textarea = document.getElementById('workAnswer');
const charCount = document.getElementById('charCount');
const surveyForm = document.getElementById('surveyForm');
const submitBtn = document.querySelector('.submit-btn');

// 字數統計功能
textarea.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = count;
    
    if (count > 450) {
        charCount.style.color = '#ff6b6b';
    } else {
        charCount.style.color = '#666';
    }
});

// 按鈕波紋效果
submitBtn.addEventListener('click', function(e) {
    const ripple = this.querySelector('.btn-ripple');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('active');
    
    setTimeout(() => {
        ripple.classList.remove('active');
    }, 600);
});

// 表單提交處理
surveyForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const answer = textarea.value.trim();
    
    // 驗證輸入
    if (!answer) {
        showMessage('請輸入您的答案', 'error');
        return;
    }
    
    if (answer.length > 500) {
        showMessage('答案長度不能超過500字', 'error');
        return;
    }
    
    // 顯示加載狀態
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span>提交中...</span>';
    
    // 模擬提交延遲
    setTimeout(() => {
        try {
            // 保存數據
            dataManager.saveAnswer(answer);
            
            // 顯示成功消息
            showMessage('提交成功！正在跳轉到統計頁面...', 'success');
            
            // 清空表單
            textarea.value = '';
            charCount.textContent = '0';
            
            // 跳轉到統計頁面
            setTimeout(() => {
                window.location.href = `stats.html?date=${dataManager.getCurrentDate()}`;
            }, 1500);
            
        } catch (error) {
            console.error('保存數據時出錯:', error);
            showMessage('提交失敗，請重試', 'error');
        } finally {
            // 恢復按鈕狀態
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = '<span>提交</span><div class="btn-ripple"></div>';
        }
    }, 800);
});

// 顯示消息提示
function showMessage(message, type = 'info') {
    // 移除現有消息
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 創建新消息
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type === 'success' ? 'success-message' : 'error-message'}`;
    messageDiv.textContent = message;
    
    // 添加錯誤消息樣式
    if (type === 'error') {
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }
    
    // 插入到表單前面
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, surveyForm);
    
    // 自動移除消息
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// 頁面加載完成後的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否有URL參數中的消息
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const messageType = urlParams.get('type');
    
    if (message) {
        showMessage(decodeURIComponent(message), messageType || 'info');
        
        // 清除URL參數
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    // 設置焦點到文本框
    textarea.focus();
});

