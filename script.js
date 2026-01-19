// Configuration
const CONFIG = {
    GNEWS_API_KEY: 'bea02426fb330008691f353533eb2384', // Replace with your actual API key
    GNEWS_BASE_URL: 'https://gnews.io/api/v4/',
    DEFAULT_QUERY: '(AI OR Artificial Intelligence OR Machine Learning OR Robotics OR Technology)',
    ARTICLES_PER_PAGE: 9,
    DEFAULT_CATEGORY: 'ai'
};

// State Management
let state = {
    articles: [],
    filteredArticles: [],
    currentPage: 1,
    currentCategory: 'all',
    searchQuery: '',
    isLoading: false
};

// DOM Elements
const elements = {
    articlesContainer: document.getElementById('articlesContainer'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    articleCount: document.getElementById('articleCount'),
    lastUpdate: document.getElementById('lastUpdate'),
    currentPage: document.getElementById('currentPage'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    systemLog: document.getElementById('systemLog'),
    apiStatus: document.getElementById('apiStatus'),
    visitorCount: document.getElementById('visitorCount')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    updateSystemLog('> Initializing NeuraScan System...');
    updateSystemLog('> Loading modules...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize visitor count
    initializeVisitorCount();
    
    // Test API connection
    await testAPIConnection();
    
    // Load initial articles
    await loadArticles();
    
    updateSystemLog('> System ready. Awaiting commands...');
}

function setupEventListeners() {
    // Search functionality
    elements.searchInput.addEventListener('input', debounce(handleSearch, 500));
    
    // Refresh button
    elements.refreshBtn.addEventListener('click', () => {
        updateSystemLog('> Manual refresh requested...');
        loadArticles();
    });
    
    // Category navigation
    document.querySelectorAll('.nav-link, .category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.currentTarget.dataset.category;
            handleCategoryChange(category);
        });
    });
    
    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            handleViewChange(e.currentTarget.dataset.view);
        });
    });
    
    // Pagination
    elements.prevPage.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderArticles();
        }
    });
    
    elements.nextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredArticles.length / CONFIG.ARTICLES_PER_PAGE);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderArticles();
        }
    });
}

async function testAPIConnection() {
    try {
        updateSystemLog('> Testing API connection...');
        elements.apiStatus.classList.add('online');
        elements.apiStatus.style.background = 'var(--accent)';
        updateSystemLog('> API: CONNECTED');
        return true;
    } catch (error) {
        updateSystemLog('> API: CONNECTION FAILED', 'error');
        elements.apiStatus.style.background = '#ff4757';
        return false;
    }
}

async function loadArticles() {
    if (state.isLoading) return;
    
    state.isLoading = true;
    state.currentPage = 1;
    
    updateSystemLog('> Fetching latest intelligence...');
    showLoadingState();
    
    try {
        const query = state.searchQuery || CONFIG.DEFAULT_QUERY;
        const url = `${CONFIG.GNEWS_BASE_URL}search?q=${encodeURIComponent(query)}&token=${CONFIG.GNEWS_API_KEY}&lang=en&max=50`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            // Process and categorize articles
            state.articles = data.articles.map(article => ({
                ...article,
                id: generateId(),
                category: categorizeArticle(article),
                publishedAt: new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }));
            
            updateSystemLog(`> Retrieved ${state.articles.length} intelligence reports`);
            updateArticleCount();
            filterArticles();
            renderArticles();
            updateLastUpdateTime();
            
            // Update category counts
            updateCategoryCounts();
        } else {
            throw new Error('No articles found');
        }
        
    } catch (error) {
        console.error('Error loading articles:', error);
        updateSystemLog('> ERROR: Failed to retrieve data', 'error');
        showErrorState();
    } finally {
        state.isLoading = false;
    }
}

function categorizeArticle(article) {
    const title = article.title.toLowerCase();
    const content = article.content?.toLowerCase() || '';
    const description = article.description?.toLowerCase() || '';
    
    const text = title + ' ' + description + ' ' + content;
    
    if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning') || text.includes('neural')) {
        return 'ai';
    } else if (text.includes('robot') || text.includes('automation') || text.includes('drone') || text.includes('autonomous')) {
        return 'robotics';
    } else if (text.includes('cyber') || text.includes('security') || text.includes('hack') || text.includes('encryption')) {
        return 'cybersecurity';
    } else if (text.includes('quantum') || text.includes('computing') || text.includes('physics')) {
        return 'quantum';
    } else {
        return 'tech';
    }
}

function filterArticles() {
    if (state.currentCategory === 'all') {
        state.filteredArticles = state.articles;
    } else {
        state.filteredArticles = state.articles.filter(article => 
            article.category === state.currentCategory
        );
    }
    
    // Apply search filter
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        state.filteredArticles = state.filteredArticles.filter(article =>
            article.title.toLowerCase().includes(query) ||
            article.description.toLowerCase().includes(query) ||
            article.content?.toLowerCase().includes(query)
        );
    }
}

function renderArticles() {
    const startIndex = (state.currentPage - 1) * CONFIG.ARTICLES_PER_PAGE;
    const endIndex = startIndex + CONFIG.ARTICLES_PER_PAGE;
    const articlesToShow = state.filteredArticles.slice(startIndex, endIndex);
    
    elements.articlesContainer.innerHTML = '';
    
    if (articlesToShow.length === 0) {
        elements.articlesContainer.innerHTML = `
            <div class="loading-article">
                <div class="pulse-loader"></div>
                <p>NO INTELLIGENCE FOUND FOR CURRENT FILTERS</p>
            </div>
        `;
        return;
    }
    
    articlesToShow.forEach(article => {
        const articleElement = createArticleCard(article);
        elements.articlesContainer.appendChild(articleElement);
    });
    
    // Update pagination
    elements.currentPage.textContent = state.currentPage;
    updatePaginationButtons();
}

function createArticleCard(article) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
        <div class="article-category">${article.category.toUpperCase()}</div>
        <div class="article-content">
            <div class="article-source">
                <div class="source-icon"></div>
                <span>${article.source.name}</span>
            </div>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-description">${article.description || 'No description available.'}</p>
            <div class="article-meta">
                <span class="article-date">${article.publishedAt}</span>
                <a href="${article.url}" target="_blank" class="read-more">ACCESS →</a>
            </div>
        </div>
    `;
    
    return card;
}

function updateSystemLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.textContent = message;
    
    if (type === 'error') {
        logEntry.style.color = '#ff4757';
    } else if (type === 'success') {
        logEntry.style.color = 'var(--accent)';
    }
    
    elements.systemLog.appendChild(logEntry);
    elements.systemLog.scrollTop = elements.systemLog.scrollHeight;
}

function updateArticleCount() {
    elements.articleCount.textContent = state.articles.length;
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    elements.lastUpdate.textContent = timeString;
}

function updateCategoryCounts() {
    const counts = {
        all: state.articles.length,
        ai: state.articles.filter(a => a.category === 'ai').length,
        robotics: state.articles.filter(a => a.category === 'robotics').length,
        tech: state.articles.filter(a => a.category === 'tech').length
    };
    
    document.querySelectorAll('.category-count').forEach(element => {
        const category = element.closest('.category-item').dataset.category;
        element.textContent = counts[category] || 0;
    });
}

function updatePaginationButtons() {
    const totalPages = Math.ceil(state.filteredArticles.length / CONFIG.ARTICLES_PER_PAGE);
    
    elements.prevPage.disabled = state.currentPage === 1;
    elements.nextPage.disabled = state.currentPage === totalPages || totalPages === 0;
    
    elements.prevPage.style.opacity = elements.prevPage.disabled ? '0.5' : '1';
    elements.nextPage.style.opacity = elements.nextPage.disabled ? '0.5' : '1';
}

function handleSearch() {
    state.searchQuery = elements.searchInput.value.trim();
    updateSystemLog(`> Searching for: "${state.searchQuery || 'all intelligence'}"`);
    filterArticles();
    state.currentPage = 1;
    renderArticles();
}

function handleCategoryChange(category) {
    // Update active states
    document.querySelectorAll('.nav-link, .category-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) {
            item.classList.add('active');
        }
    });
    
    // Update state and render
    state.currentCategory = category;
    updateSystemLog(`> Filtering: ${category.toUpperCase()} intelligence`);
    filterArticles();
    state.currentPage = 1;
    renderArticles();
}

function handleViewChange(view) {
    // This would change the layout of articles
    updateSystemLog(`> Changing view to: ${view.toUpperCase()} MODE`);
    // Implementation would change CSS classes on articlesContainer
}

function showLoadingState() {
    elements.articlesContainer.innerHTML = `
        <div class="loading-article">
            <div class="pulse-loader"></div>
            <p>CONNECTING TO NEWS NETWORK...</p>
        </div>
    `;
}

function showErrorState() {
    elements.articlesContainer.innerHTML = `
        <div class="loading-article">
            <div style="color: #ff4757; font-size: 3rem;">⚠️</div>
            <p>NETWORK CONNECTION FAILED</p>
            <button class="cyber-btn-sm" style="margin-top: 1rem;" onclick="loadArticles()">RETRY CONNECTION</button>
        </div>
    `;
}

function initializeVisitorCount() {
    // Generate a random visitor count for demo purposes
    const baseCount = 1428;
    const randomIncrement = Math.floor(Math.random() * 100);
    elements.visitorCount.textContent = (baseCount + randomIncrement).toString().padStart(4, '0');
    
    // Simulate occasional updates
    setInterval(() => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const current = parseInt(elements.visitorCount.textContent);
        const newCount = Math.max(1400, current + change);
        elements.visitorCount.textContent = newCount.toString().padStart(4, '0');
    }, 10000);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Auto-refresh every 5 minutes
setInterval(() => {
    if (!state.isLoading && document.visibilityState === 'visible') {
        updateSystemLog('> Auto-refreshing intelligence...');
        loadArticles();
    }
}, 300000);

// Update time every second
setInterval(updateLastUpdateTime, 1000);
