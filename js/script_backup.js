// 全局变量
let evaluationData = [];
let teacherData = [];
let currentPage = 1;
let commentsCurrentPage = 1;
const itemsPerPage = 20;
const commentsPerPage = 10;

// 左侧导航菜单功能
function initSideNavigation() {
    const sideNav = document.getElementById('side-nav');
    const navItems = document.querySelectorAll('.nav-item');
    
    // 点击导航项时定位到对应模块
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement && !targetElement.classList.contains('hidden')) {
                // 移除所有激活状态
                navItems.forEach(nav => nav.classList.remove('active'));
                // 添加当前激活状态
                this.classList.add('active');
                
                // 平滑滚动到目标元素
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 监听滚动事件，自动高亮当前可见的模块
    let ticking = false;
    function updateActiveNav() {
        if (!ticking) {
            requestAnimationFrame(() => {
                const sections = ['dashboard', 'teacher-analysis', 'comments-section', 'detailed-data'];
                let currentSection = '';
                
                sections.forEach(sectionId => {
                    const element = document.getElementById(sectionId);
                    if (element && !element.classList.contains('hidden')) {
                        const rect = element.getBoundingClientRect();
                        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                            currentSection = sectionId;
                        }
                    }
                });
                
                // 更新激活状态
                navItems.forEach(item => {
                    const targetId = item.getAttribute('data-target');
                    if (targetId === currentSection) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
                
                ticking = false;
            });
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', updateActiveNav);
    
    return sideNav;
}

// 显示/隐藏导航菜单
function toggleSideNavigation(show) {
    const sideNav = document.getElementById('side-nav');
    if (show) {
        sideNav.classList.remove('hidden');
    } else {
        sideNav.classList.add('hidden');
    }
}

// 文件上传处理
function handleFileUpload(event, fileType) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const data = parseCSV(csv);
        
        if (fileType === 'evaluation') {
            evaluationData = data;
            displayFileInfo('evaluation-file-info', file.name, data.length);
        } else if (fileType === 'teacher') {
            teacherData = data;
            displayFileInfo('teacher-file-info', file.name, data.length);
        }
        
        // 检查是否两个文件都已上传
        if (evaluationData.length > 0 && teacherData.length > 0) {
            document.getElementById('analyze-btn').disabled = false;
        }
    };
    reader.readAsText(file);
}

// CSV解析函数
function parseCSV(csv) {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }
    
    return data;
}

// 解析CSV行（处理引号内的逗号）
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim().replace(/"/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim().replace(/"/g, ''));
    return result;
}

// 显示文件信息
function displayFileInfo(containerId, fileName, recordCount) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="file-info">
            <div class="file-name-container">
                <i class="bi bi-file-earmark-text file-icon"></i>
                <span>${fileName}</span>
                <span class="file-separator">|</span>
                <span>${recordCount} 条记录</span>
            </div>
            <button class="secondary-btn" onclick="clearFile('${containerId}')">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;
}

// 清除文件
function clearFile(containerId) {
    document.getElementById(containerId).innerHTML = '';
    if (containerId === 'evaluation-file-info') {
        evaluationData = [];
        document.getElementById('evaluation-file').value = '';
    } else if (containerId === 'teacher-file-info') {
        teacherData = [];
        document.getElementById('teacher-file').value = '';
    }
    
    // 禁用分析按钮
    if (evaluationData.length === 0 || teacherData.length === 0) {
        document.getElementById('analyze-btn').disabled = true;
    }
}

// 显示数据看板
function showDashboard() {
    // 隐藏上传区域
    document.getElementById('upload-section').classList.add('hidden');
    
    // 显示数据看板
    document.getElementById('dashboard').classList.remove('hidden');
    
    // 显示悬浮按钮
    document.getElementById('floating-btn').classList.remove('hidden');
    
    // 显示左侧导航菜单
    toggleSideNavigation(true);
    
    // 初始化导航功能
    initSideNavigation();
    
    // 生成数据看板
    generateDashboard();
}

// 重新上传数据
function reuploadData() {
    // 隐藏所有数据展示区域
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('teacher-analysis').classList.add('hidden');
    document.getElementById('comments-section').classList.add('hidden');
    document.getElementById('detailed-data').classList.add('hidden');
    
    // 隐藏悬浮按钮和导航菜单
    document.getElementById('floating-btn').classList.add('hidden');
    toggleSideNavigation(false);
    
    // 显示上传区域
    document.getElementById('upload-section').classList.remove('hidden');
    
    // 重置文件输入
    document.getElementById('evaluation-file').value = '';
    document.getElementById('teacher-file').value = '';
    
    // 清空文件信息显示
    document.getElementById('evaluation-file-info').innerHTML = '';
    document.getElementById('teacher-file-info').innerHTML = '';
    
    // 重置全局变量
    evaluationData = [];
    teacherData = [];
} 