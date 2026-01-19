// Configuration
const CONFIG = {
    GNEWS_API_KEY: 'bea02426fb330008691f353533eb2384', // Replace with your actual API key
    GNEWS_BASE_URL: 'https://gnews.io/api/v4/',
    DEFAULT_QUERY: 'AI technology robotics machine learning',
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
    isLoading: false,
    useDemoData: false
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
    updateSystemLog('> Initializing NeuraScan System v2.1.4...', 'info');
    updateSystemLog('> Loading core modules...', 'info');
    updateSystemLog('> Checking system integrity...', 'info');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize visitor count
    initializeVisitorCount();
    
    // Set last update time immediately
    updateLastUpdateTime();
    
    // Check network status first
    if (!navigator.onLine) {
        updateSystemLog('> WARNING: Network connection offline', 'warning');
        updateSystemLog('> Using local cache and demo data', 'info');
        state.useDemoData = true;
        loadDemoData();
        elements.apiStatus.style.background = '#ffa500';
    } else {
        // Test API connection
        const apiConnected = await testAPIConnection();
        
        if (apiConnected) {
            await loadArticles();
        } else {
            updateSystemLog('> API connection unavailable', 'warning');
            updateSystemLog('> Switching to demo mode...', 'info');
            state.useDemoData = true;
            loadDemoData();
        }
    }
    
    updateSystemLog('> System initialization complete', 'success');
    updateSystemLog('> Ready for data queries', 'info');
}

function setupEventListeners() {
    // Search functionality
    elements.searchInput.addEventListener('input', debounce(handleSearch, 500));
    
    // Refresh button
    elements.refreshBtn.addEventListener('click', () => {
        if (state.useDemoData) {
            updateSystemLog('> Demo mode: Refreshing local data', 'info');
            loadDemoData();
        } else {
            updateSystemLog('> Manual refresh requested...', 'info');
            loadArticles();
        }
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
    
    // Network status listener
    window.addEventListener('online', () => {
        updateSystemLog('> Network connection restored', 'success');
        elements.apiStatus.style.background = 'var(--accent)';
    });
    
    window.addEventListener('offline', () => {
        updateSystemLog('> Network connection lost', 'warning');
        elements.apiStatus.style.background = '#ffa500';
    });
}

async function testAPIConnection() {
    // First check if API key is properly set
    if (!CONFIG.GNEWS_API_KEY || CONFIG.GNEWS_API_KEY === 'YOUR_GNEWS_API_KEY_HERE') {
        updateSystemLog('> API: Not configured', 'warning');
        updateSystemLog('> Add your GNews API key to script.js', 'info');
        updateSystemLog('> Using demonstration mode', 'info');
        elements.apiStatus.style.background = '#ffa500'; // Orange for warning
        return false;
    }
    
    updateSystemLog('> Testing API connection...', 'info');
    
    try {
        // Simple test request
        const testUrl = `${CONFIG.GNEWS_BASE_URL}search?q=test&token=${CONFIG.GNEWS_API_KEY}&lang=en&max=1`;
        
        const response = await fetch(testUrl);
        
        if (response.ok) {
            updateSystemLog('> API: Connection successful', 'success');
            elements.apiStatus.style.background = 'var(--accent)';
            elements.apiStatus.classList.add('online');
            return true;
        } else {
            updateSystemLog(`> API: Server error (${response.status})`, 'error');
            elements.apiStatus.style.background = '#ff4757';
            return false;
        }
    } catch (error) {
        updateSystemLog('> API: Network error', 'error');
        updateSystemLog('> Using local data storage', 'info');
        elements.apiStatus.style.background = '#ff4757';
        return false;
    }
}

async function loadArticles() {
    // Prevent multiple simultaneous loads
    if (state.isLoading) return;
    
    state.isLoading = true;
    state.currentPage = 1;
    
    updateSystemLog('> Fetching latest intelligence...', 'info');
    showLoadingState();
    
    // Use demo data if we're in demo mode
    if (state.useDemoData) {
        updateSystemLog('> Using demonstration data', 'info');
        state.isLoading = false;
        loadDemoData();
        return;
    }
    
    // Check API key one more time
    if (!CONFIG.GNEWS_API_KEY || CONFIG.GNEWS_API_KEY === 'YOUR_GNEWS_API_KEY_HERE') {
        updateSystemLog('> ERROR: API key not configured', 'error');
        updateSystemLog('> Please update CONFIG.GNEWS_API_KEY in script.js', 'info');
        state.useDemoData = true;
        state.isLoading = false;
        loadDemoData();
        return;
    }
    
    try {
        // Build the API URL with proper encoding
        const query = state.searchQuery || CONFIG.DEFAULT_QUERY;
        const encodedQuery = encodeURIComponent(query);
        const url = `${CONFIG.GNEWS_BASE_URL}search?q=${encodedQuery}&token=${CONFIG.GNEWS_API_KEY}&lang=en&max=20`;
        
        console.log('API Request URL (key hidden):', url.replace(CONFIG.GNEWS_API_KEY, 'API_KEY_HIDDEN'));
        
        updateSystemLog(`> Querying: "${query}"`, 'info');
        
        // Use fetch with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeout);
        
        console.log('Response status:', response.status);
        
        // Handle different response statuses
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your GNews API key.');
        }
        
        if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response received:', data);
        
        // Check for GNews API errors
        if (data.errors && Array.isArray(data.errors)) {
            throw new Error(`GNews API Error: ${data.errors[0]}`);
        }
        
        if (!data.articles || data.articles.length === 0) {
            updateSystemLog('> No articles found. Using demo data.', 'info');
            state.useDemoData = true;
            loadDemoData();
            return;
        }
        
        // Process articles
        state.articles = data.articles.map(article => ({
            title: article.title || 'Untitled Article',
            description: article.description || 'No description available.',
            content: article.content || '',
            url: article.url || '#',
            image: article.image || null,
            source: {
                name: article.source?.name || 'Unknown Source',
                url: article.source?.url || '#'
            },
            id: generateId(),
            category: categorizeArticle(article),
            publishedAt: formatDate(article.publishedAt),
            isDemo: false
        }));
        
        updateSystemLog(`> Retrieved ${state.articles.length} intelligence reports`, 'success');
        updateArticleCount();
        filterArticles();
        renderArticles();
        updateLastUpdateTime();
        updateCategoryCounts();
        
    } catch (error) {
        console.error('API Error details:', error);
        
        // User-friendly error messages
        let errorMessage = 'Failed to retrieve data';
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout. Please check your connection.';
        } else if (error.message.includes('API key')) {
            errorMessage = 'Invalid API key configuration.';
        } else if (error.message.includes('Rate limit')) {
            errorMessage = 'API rate limit exceeded.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        updateSystemLog(`> ERROR: ${errorMessage}`, 'error');
        updateSystemLog('> Switching to demonstration mode', 'info');
        
        // Fall back to demo data
        state.useDemoData = true;
        loadDemoData();
        
    } finally {
        state.isLoading = false;
    }
}

function categorizeArticle(article) {
    const title = (article.title || '').toLowerCase();
    const content = (article.content || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    
    const fullText = title + ' ' + description + ' ' + content;
    
    // Define keywords for each category
    const keywordMap = {
        'ai': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'chatgpt', 'gpt', 'llm', 'openai', 'transformers'],
        'robotics': ['robot', 'robotics', 'automation', 'drone', 'autonomous', 'boston dynamics', 'humanoid', 'industrial robot', 'robotic arm'],
        'cybersecurity': ['cyber', 'security', 'hack', 'hacker', 'encryption', 'malware', 'ransomware', 'data breach', 'firewall', 'vulnerability'],
        'quantum': ['quantum', 'qubit', 'quantum computing', 'quantum physics', 'superposition', 'entanglement'],
        'tech': ['technology', 'tech', 'innovation', 'startup', 'silicon valley', 'tech news', 'digital', 'software', 'hardware']
    };
    
    // Score each category
    let bestScore = 0;
    let bestCategory = 'tech'; // Default
    
    for (const [category, keywords] of Object.entries(keywordMap)) {
        let score = 0;
        keywords.forEach(keyword => {
            if (fullText.includes(keyword)) {
                score += 1;
            }
        });
        
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }
    
    return bestCategory;
}

function formatDate(dateString) {
    if (!dateString) return 'Recent';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffHours < 168) { // Less than 7 days
            const days = Math.floor(diffHours / 24);
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        return 'Recent';
    }
}

function loadDemoData() {
    updateSystemLog('> Loading demonstration intelligence...', 'info');
    
    const demoArticles = [
        {
            title: "OpenAI Unveils GPT-5 with Revolutionary Multimodal Capabilities",
            description: "The latest iteration of OpenAI's language model demonstrates unprecedented reasoning abilities and seamless integration across text, image, and audio modalities.",
            content: "GPT-5 showcases significant improvements in logical reasoning, mathematical problem-solving, and creative tasks. Early benchmarks indicate a 40% performance improvement over previous models.",
            source: { name: "AI Research Journal", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            category: "ai",
            isDemo: true
        },
        {
            title: "Boston Dynamics Atlas Robots Achieve Full Autonomy in Warehouse Operations",
            description: "Latest software update enables humanoid robots to operate independently in complex warehouse environments, marking a major milestone in industrial automation.",
            content: "The autonomous system allows robots to navigate, identify objects, and perform tasks without human intervention, reducing operational costs by 60%.",
            source: { name: "Robotics Weekly", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            category: "robotics",
            isDemo: true
        },
        {
            title: "Quantum Computer Reaches 1000-Qubit Milestone, Breaking Error Rate Records",
            description: "Researchers achieve stable quantum computing with unprecedented qubit count while maintaining error rates below 0.1%, paving way for practical applications.",
            content: "The breakthrough was achieved using novel error-correction techniques and cryogenic cooling systems, bringing fault-tolerant quantum computing closer to reality.",
            source: { name: "Quantum Computing Today", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            category: "quantum",
            isDemo: true
        },
        {
            title: "Neuralink's Brain-Computer Interface Enables Paralyzed Patients to Control Digital Devices",
            description: "Clinical trial results show successful neural signal decoding, allowing patients with spinal cord injuries to operate computers and prosthetics through thought alone.",
            content: "The implantable device achieves 95% accuracy in command recognition and shows no significant adverse effects after 12 months of testing.",
            source: { name: "NeuroTech Insights", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            category: "ai",
            isDemo: true
        },
        {
            title: "Autonomous Delivery Networks Expand to 50 Cities Worldwide",
            description: "Self-driving delivery vehicles and drones now service millions of customers, reducing delivery times and environmental impact.",
            content: "The network handles over 500,000 deliveries daily with 99.8% on-time performance and zero traffic incidents reported.",
            source: { name: "Autonomous Systems Review", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            category: "robotics",
            isDemo: true
        },
        {
            title: "New AI Algorithm Predicts Protein Structures with 99% Accuracy",
            description: "Breakthrough in computational biology revolutionizes drug discovery and disease understanding by accurately predicting protein folding in seconds.",
            content: "The algorithm, named ProteoFold, reduces prediction time from months to seconds while maintaining unprecedented accuracy levels.",
            source: { name: "BioTech Innovations", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            category: "ai",
            isDemo: true
        },
        {
            title: "Major Cybersecurity Firm Thwarts Global Ransomware Attack",
            description: "Real-time threat detection system prevents widespread encryption attack targeting critical infrastructure across three continents.",
            content: "The AI-powered defense system identified and neutralized the attack vector within 47 seconds of detection, protecting over 10,000 organizations.",
            source: { name: "CyberDefense Quarterly", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            category: "cybersecurity",
            isDemo: true
        },
        {
            title: "Tesla Optimus Robots Begin Manufacturing Trial in Gigafactory",
            description: "Humanoid robots successfully assemble electric vehicle components in pilot program, demonstrating industrial applicability.",
            content: "The trial shows robots performing complex assembly tasks with 99.5% accuracy and 300% faster than human workers for specific operations.",
            source: { name: "Manufacturing Tech", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            category: "robotics",
            isDemo: true
        },
        {
            title: "Global Consortium Establishes Ethical AI Development Standards",
            description: "Industry leaders agree on comprehensive framework for responsible AI development, addressing bias, transparency, and accountability.",
            content: "The standards mandate independent auditing, explainable AI systems, and ethical review boards for all AI development projects.",
            source: { name: "AI Ethics Council", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            category: "ai",
            isDemo: true
        },
        {
            title: "Quantum Internet Prototype Demonstrates Secure Communication over 100km",
            description: "Breakthrough in quantum networking enables theoretically unbreakable encryption for long-distance communications.",
            content: "The prototype uses entangled photon pairs to establish secure quantum keys, demonstrating practical quantum key distribution.",
            source: { name: "Quantum Networks", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
            category: "quantum",
            isDemo: true
        },
        {
            title: "AI-Powered Medical Diagnosis System Approved for Clinical Use",
            description: "FDA approves first comprehensive AI diagnostic tool that analyzes medical images, lab results, and patient history with 98% accuracy.",
            content: "The system reduces diagnostic time from days to minutes and has shown particular effectiveness in early cancer detection.",
            source: { name: "Medical AI Today", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
            category: "ai",
            isDemo: true
        },
        {
            title: "Swarm Robotics Enables Autonomous Ocean Cleanup Operations",
            description: "Fleets of AI-controlled robots successfully remove plastic waste from ocean surfaces, demonstrating scalable environmental solutions.",
            content: "The swarm system coordinates hundreds of robots to efficiently cover large areas while avoiding marine life.",
            source: { name: "Environmental Robotics", url: "#" },
            url: "#",
            image: null,
            publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
            category: "robotics",
            isDemo: true
        }
    ];
    
    // Process demo articles
    state.articles = demoArticles.map(article => ({
        ...article,
        id: generateId(),
        category: article.category || 'tech',
        publishedAt: formatDate(article.publishedAt)
    }));
    
    updateSystemLog(`> Loaded ${state.articles.length} demonstration articles`, 'success');
    updateSystemLog('> To use real data, add your GNews API key', 'info');
    updateSystemLog('> Get a free key at: https://gnews.io/', 'info');
    
    updateArticleCount();
    filterArticles();
    renderArticles();
    updateLastUpdateTime();
    updateCategoryCounts();
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
            article.content.toLowerCase().includes(query)
        );
    }
    
    // Update article count display
    updateArticleCount();
}

function renderArticles() {
    const startIndex = (state.currentPage - 1) * CONFIG.ARTICLES_PER_PAGE;
    const endIndex = startIndex + CONFIG.ARTICLES_PER_PAGE;
    const articlesToShow = state.filteredArticles.slice(startIndex, endIndex);
    
    elements.articlesContainer.innerHTML = '';
    
    if (articlesToShow.length === 0) {
        elements.articlesContainer.innerHTML = `
            <div class="loading-article" style="grid-column: 1 / -1;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <p style="color: var(--primary); font-family: var(--font-tech);">NO RESULTS FOUND</p>
                <p style="color: var(--accent); margin-top: 0.5rem;">Try a different search term or category</p>
                <button class="cyber-btn-sm" style="margin-top: 1rem;" onclick="handleCategoryChange('all')">
                    VIEW ALL ARTICLES
                </button>
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
    const categoryColors = {
        'ai': '#0ff0fc',
        'robotics': '#ff00ff',
        'tech': '#00ff9d',
        'cybersecurity': '#ff9d00',
        'quantum': '#9d00ff'
    };
    
    const color = categoryColors[article.category] || '#0ff0fc';
    const isDemo = article.isDemo || false;
    
    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
        <div class="article-category" style="background: rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.2); color: ${color};">
            ${article.category.toUpperCase()}
            ${isDemo ? ' (DEMO)' : ''}
        </div>
        <div class="article-content">
            <div class="article-source">
                <div class="source-icon" style="background: ${color};"></div>
                <span>${article.source.name}</span>
            </div>
            <h3 class="article-title">${article.title}</h3>
            <p class="article-description">${article.description}</p>
            <div class="article-meta">
                <span class="article-date">${article.publishedAt}</span>
                <a href="${article.url}" target="_blank" class="read-more" style="color: ${color};">
                    ${isDemo ? 'DEMO' : 'ACCESS'} →
                </a>
            </div>
        </div>
    `;
    
    return card;
}

function updateSystemLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    
    // Add timestamp
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    logEntry.textContent = `[${timestamp}] ${message}`;
    logEntry.style.fontFamily = 'var(--font-mono)';
    logEntry.style.fontSize = '0.8rem';
    logEntry.style.marginBottom = '0.3rem';
    
    // Color coding
    switch(type) {
        case 'error':
            logEntry.style.color = '#ff4757';
            break;
        case 'success':
            logEntry.style.color = 'var(--accent)';
            break;
        case 'warning':
            logEntry.style.color = '#ffa500';
            break;
        case 'info':
            logEntry.style.color = 'var(--primary)';
            break;
        default:
            logEntry.style.color = '#a0a0c0';
    }
    
    elements.systemLog.appendChild(logEntry);
    
    // Keep only last 15 log entries
    const entries = elements.systemLog.children;
    if (entries.length > 15) {
        elements.systemLog.removeChild(entries[0]);
    }
    
    // Auto-scroll to bottom
    elements.systemLog.scrollTop = elements.systemLog.scrollHeight;
}

function updateArticleCount() {
    const totalArticles = state.articles.length;
    const filteredCount = state.filteredArticles.length;
    
    if (filteredCount === totalArticles) {
        elements.articleCount.textContent = totalArticles;
    } else {
        elements.articleCount.textContent = `${filteredCount}/${totalArticles}`;
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    
    elements.lastUpdate.textContent = `${dateString} ${timeString}`;
}

function updateCategoryCounts() {
    const counts = {
        all: state.articles.length,
        ai: state.articles.filter(a => a.category === 'ai').length,
        robotics: state.articles.filter(a => a.category === 'robotics').length,
        tech: state.articles.filter(a => a.category === 'tech').length,
        cybersecurity: state.articles.filter(a => a.category === 'cybersecurity').length,
        quantum: state.articles.filter(a => a.category === 'quantum').length
    };
    
    document.querySelectorAll('.category-count').forEach(element => {
        const category = element.closest('.category-item').dataset.category;
        element.textContent = counts[category] || 0;
    });
    
    // Update trending items
    document.querySelectorAll('.trending-item').forEach((item, index) => {
        const trendText = item.querySelector('.trend-text');
        const trendBar = item.querySelector('.trend-bar');
        
        if (index === 0) {
            trendText.textContent = `AI (${counts.ai})`;
            trendBar.style.width = `${Math.min(100, counts.ai * 20)}px`;
        } else if (index === 1) {
            trendText.textContent = `Robotics (${counts.robotics})`;
            trendBar.style.width = `${Math.min(100, counts.robotics * 20)}px`;
        } else if (index === 2) {
            trendText.textContent = `Tech (${counts.tech})`;
            trendBar.style.width = `${Math.min(100, counts.tech * 20)}px`;
        }
    });
}

function updatePaginationButtons() {
    const totalPages = Math.ceil(state.filteredArticles.length / CONFIG.ARTICLES_PER_PAGE);
    
    elements.prevPage.disabled = state.currentPage === 1;
    elements.nextPage.disabled = state.currentPage === totalPages || totalPages === 0;
    
    elements.prevPage.style.opacity = elements.prevPage.disabled ? '0.5' : '1';
    elements.prevPage.style.cursor = elements.prevPage.disabled ? 'not-allowed' : 'pointer';
    
    elements.nextPage.style.opacity = elements.nextPage.disabled ? '0.5' : '1';
    elements.nextPage.style.cursor = elements.nextPage.disabled ? 'not-allowed' : 'pointer';
    
    elements.prevPage.title = elements.prevPage.disabled ? 'No previous page' : 'Previous page';
    elements.nextPage.title = elements.nextPage.disabled ? 'No next page' : 'Next page';
}

function handleSearch() {
    state.searchQuery = elements.searchInput.value.trim();
    
    if (state.searchQuery) {
        updateSystemLog(`> Search query: "${state.searchQuery}"`, 'info');
    } else {
        updateSystemLog('> Search cleared', 'info');
    }
    
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
    updateSystemLog(`> Category: ${category.toUpperCase()}`, 'info');
    filterArticles();
    state.currentPage = 1;
    renderArticles();
}

function handleViewChange(view) {
    const container = elements.articlesContainer;
    
    switch(view) {
        case 'list':
            container.style.gridTemplateColumns = '1fr';
            updateSystemLog('> View: List mode', 'info');
            break;
        case 'compact':
            container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            updateSystemLog('> View: Compact mode', 'info');
            break;
        case 'grid':
        default:
            container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
            updateSystemLog('> View: Grid mode', 'info');
            break;
    }
    
    // Re-render articles with new layout
    renderArticles();
}

function showLoadingState() {
    elements.articlesContainer.innerHTML = `
        <div class="loading-article" style="grid-column: 1 / -1;">
            <div class="pulse-loader"></div>
            <p>CONNECTING TO INTELLIGENCE NETWORK...</p>
            <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--accent);">
                ${state.useDemoData ? 'Using demonstration data' : 'Fetching live data...'}
            </div>
        </div>
    `;
}

function initializeVisitorCount() {
    // Start with a random base count
    let count = 1428 + Math.floor(Math.random() * 200);
    
    // Update display
    const updateDisplay = () => {
        elements.visitorCount.textContent = count.toString().padStart(4, '0');
    };
    
    updateDisplay();
    
    // Simulate visitor fluctuations
    setInterval(() => {
        // Small random change (-2 to +2)
        const change = Math.floor(Math.random() * 5) - 2;
        count = Math.max(1400, count + change);
        updateDisplay();
    }, 10000); // Update every 10 seconds
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
    return 'art_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Auto-refresh every 10 minutes (only if not in demo mode)
setInterval(() => {
    if (!state.isLoading && document.visibilityState === 'visible' && !state.useDemoData) {
        updateSystemLog('> Auto-refresh triggered', 'info');
        loadArticles();
    }
}, 600000); // 10 minutes

// Update time every 30 seconds
setInterval(updateLastUpdateTime, 30000);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (state.useDemoData) {
            loadDemoData();
        } else {
            loadArticles();
        }
    }
    
    // / to focus search
    if (e.key === '/' && document.activeElement !== elements.searchInput) {
        e.preventDefault();
        elements.searchInput.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === elements.searchInput) {
        elements.searchInput.value = '';
        handleSearch();
    }
});

// Debug function for console
window.debugNeuraScan = function() {
    console.log('=== NEURASCAN DEBUG INFO ===');
    console.log('State:', state);
    console.log('Config:', { ...CONFIG, GNEWS_API_KEY: CONFIG.GNEWS_API_KEY ? '***' + CONFIG.GNEWS_API_KEY.slice(-4) : 'Not set' });
    console.log('Online:', navigator.onLine);
    console.log('Demo mode:', state.useDemoData);
    console.log('Articles:', state.articles.length);
    console.log('Filtered:', state.filteredArticles.length);
    console.log('Current page:', state.currentPage);
    console.log('Category:', state.currentCategory);
    console.log('Search:', state.searchQuery);
    console.log('===========================');
    
    updateSystemLog('Debug info printed to console', 'info');
    return state;
};

// Initialize the API status indicator
elements.apiStatus.style.width = '10px';
elements.apiStatus.style.height = '10px';
elements.apiStatus.style.borderRadius = '50%';
elements.apiStatus.style.display = 'inline-block';
elements.apiStatus.style.margin = '0 5px';
elements.apiStatus.style.background = '#ff4757'; // Start with red (offline)

// Add offline/online detection
window.addEventListener('load', () => {
    if (navigator.onLine) {
        elements.apiStatus.style.background = 'var(--accent)';
    } else {
        elements.apiStatus.style.background = '#ff4757';
    }
});
