(() => {
    const buttons = document.querySelectorAll('button.btn');
    const pages = document.querySelectorAll('.page');
    const progressBar = document.querySelector('.progress');
    const choiceHistoryElem = document.getElementById('choice-history');
    const inventoryListElem = document.getElementById('inventory-list');
    const endingsListElem = document.getElementById('endings-list');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const ambientPlayer = document.getElementById('ambient-player');
    const sfxPlayer = document.getElementById('sfx-player');
    const transitionSfx = document.getElementById('transition-sfx');
    const body = document.body;
    const container = document.querySelector('.container');

    const pageOrder = ['page-index', 'page1', 'page2a', 'page2b', 'ending1', 'ending2', 'ending3', 'ending4'];
    let inventory = [];
    let choiceHistory = [];
    let unlockedEndings = [];
    let typingTimeout = null;
    const SAVE_KEY = 'choose-your-adventure-save';
    let currentPageId = 'page-index';

    // Enhanced typewriter effect with random speed variation
    function typeText(element, text, callback = null) {
        if (typingTimeout) clearTimeout(typingTimeout);
        element.textContent = '';
        let index = 0;
        const cursor = element.nextElementSibling;
        if (cursor) cursor.style.visibility = 'visible';

        function type() {
            if (index < text.length) {
                // Add slight randomness to typing speed for natural feel
                const speed = 20 + Math.random() * 20;
                
                // Occasionally pause at punctuation
                const char = text.charAt(index);
                if (index > 0 && ['.', ',', ';', '!', '?'].includes(char)) {
                    element.textContent += char;
                    index++;
                    typingTimeout = setTimeout(type, 200 + Math.random() * 300);
                } else {
                    element.textContent += char;
                    index++;
                    typingTimeout = setTimeout(type, speed);
                }
            } else if (callback) {
                if (cursor) cursor.style.visibility = 'visible';
                callback();
            }
        }
        type();
    }

    function showPage(id, options = {}) {
        const { skipTyping = false } = options;
        
        // Play transition sound
        playSfx('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3', 0.3);
        
        // Container animation
        container.style.transform = 'translateY(-10px)';
        container.style.boxShadow = '0 15px 35px rgba(8, 12, 26, 0.9)';
        setTimeout(() => {
            container.style.transform = 'translateY(0)';
            container.style.boxShadow = '0 12px 30px rgba(8, 12, 26, 0.8)';
        }, 300);

        pages.forEach(page => {
            if (page.id === id) {
                page.classList.add('active');
                body.dataset.scene = id;
                
                // Add animation class based on page type
                if (id.startsWith('ending')) {
                    page.classList.add('fade-in');
                    setTimeout(() => page.classList.remove('fade-in'), 1000);
                } else {
                    page.classList.add('slide-up');
                    setTimeout(() => page.classList.remove('slide-up'), 1000);
                }
                
                const pElem = page.querySelector('.dialog-box p') || page.querySelector('p');
                if (pElem) {
                    if (!skipTyping) {
                        typeText(pElem, pElem.dataset.fulltext || pElem.textContent);
                    } else {
                        if (typingTimeout) clearTimeout(typingTimeout);
                        pElem.textContent = pElem.dataset.fulltext || pElem.textContent;
                        const cursor = pElem.nextElementSibling;
                        if (cursor) cursor.style.visibility = 'visible';
                    }
                }
                
                playAmbientSoundForScene(id);
                updateProgress(id);
                
                setTimeout(() => {
                    const focusable = page.querySelector('button');
                    if (focusable) focusable.focus();
                }, 550);
            } else {
                page.classList.remove('active');
                const cursor = page.querySelector('.typing-cursor');
                if (cursor) cursor.style.visibility = 'hidden';
            }
        });
        
        currentPageId = id;
        saveProgress();
    }

    function updateProgress(currentId) {
        const idx = pageOrder.indexOf(currentId);
        if (idx === -1) {
            progressBar.style.width = '0%';
        } else {
            progressBar.style.width = ((idx + 1) / pageOrder.length) * 100 + '%';
        }
    }

    function updateTheme(newTheme) {
        if (newTheme === 'light') {
            body.classList.remove('dark');
            body.classList.add('light');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            playSfx('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3', 0.2);
        } else {
            body.classList.remove('light');
            body.classList.add('dark');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            playSfx('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3', 0.2);
        }
        try {
            localStorage.setItem('choose-your-adventure-theme', newTheme);
        } catch {}
    }

    themeToggle.onclick = () => {
        updateTheme(body.classList.contains('dark') ? 'light' : 'dark');
    };

    function playAmbientSoundForScene(sceneId) {
        let soundUrl = '';
        switch(sceneId) {
            case 'page-index': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-calm-wind-in-the-forest-1254.mp3'; break;
            case 'page1': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-forest-ambience-1685.mp3'; break;
            case 'page2a': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-river-water-flowing-1248.mp3'; break;
            case 'page2b': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-wind-in-the-mountains-1252.mp3'; break;
            case 'ending1': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-rain-and-thunder-ambience-2403.mp3'; break;
            case 'ending2': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-dark-ambient-horror-566.mp3'; break;
            case 'ending3': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-suspense-dark-ambience-566.mp3'; break;
            case 'ending4': soundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-mysterious-cave-ambience-568.mp3'; break;
        }
        if (soundUrl) {
            ambientPlayer.src = soundUrl;
            ambientPlayer.volume = 0.2;
            ambientPlayer.play().catch(()=>{});
        } else {
            ambientPlayer.pause();
            ambientPlayer.src = '';
        }
    }

    function playSfx(url, volume = 0.5) {
        sfxPlayer.src = url;
        sfxPlayer.volume = volume;
        sfxPlayer.play().catch(() => {});
    }

    function saveProgress() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify({
                currentPage: currentPageId,
                choiceHistory,
                inventory,
                unlockedEndings
            }));
        } catch(e) {}
    }

    function loadProgress() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return false;
            const data = JSON.parse(saved);
            if (!data) return false;
            if (data.choiceHistory) choiceHistory = data.choiceHistory;
            if (data.inventory) inventory = data.inventory;
            if (data.unlockedEndings) unlockedEndings = data.unlockedEndings;
            updateChoiceUI();
            updateInventoryUI();
            updateEndingsUI();
            if (data.currentPage && pageOrder.includes(data.currentPage)) {
                showPage(data.currentPage, { skipTyping:true });
                return true;
            }
            return false;
        } catch(e) {
            return false;
        }
    }

    function addChoice(text, toPage) {
        choiceHistory.push({ choice: text, page: toPage });
        updateChoiceUI();
    }

    function updateChoiceUI() {
        choiceHistoryElem.innerHTML = '';
        if (choiceHistory.length === 0) {
            const li = document.createElement('li');
            li.textContent = '(No choices made yet)';
            choiceHistoryElem.appendChild(li);
        } else {
            choiceHistory.slice().reverse().forEach(c => {
                const li = document.createElement('li');
                li.textContent = c.choice;
                choiceHistoryElem.appendChild(li);
            });
        }
    }

    function addItem(item) {
        if (!inventory.includes(item)) {
            inventory.push(item);
            playSfx('https://assets.mixkit.co/sfx/preview/mixkit-extra-bonus-in-a-video-game-2045.mp3', 0.4);
            updateInventoryUI();
            
            // Item notification animation
            const notification = document.createElement('div');
            notification.innerHTML = `<i class="fas fa-plus-circle"></i> ${item} added to inventory`;
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'rgba(92, 184, 92, 0.9)';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '25px';
            notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            notification.style.zIndex = '100';
            notification.style.animation = 'slideUp 0.5s ease-out, fadeIn 0.5s ease-out';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'fadeIn 0.5s ease-out reverse';
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        }
    }

    function updateInventoryUI() {
        inventoryListElem.innerHTML = '';
        if (inventory.length === 0) {
            const li = document.createElement('li');
            li.textContent = '(No items collected)';
            inventoryListElem.appendChild(li);
        } else {
            inventory.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                inventoryListElem.appendChild(li);
            });
        }
    }

    function unlockEnding(id, title) {
        if (!unlockedEndings.find(e => e.id === id)) {
            unlockedEndings.push({ id, title });
            playSfx('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3', 0.6);
            updateEndingsUI();
            
            // Ending unlocked notification
            const notification = document.createElement('div');
            notification.innerHTML = `<i class="fas fa-trophy"></i> Ending Unlocked: ${title}`;
            notification.style.position = 'fixed';
            notification.style.top = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'rgba(76, 174, 76, 0.9)';
            notification.style.color = 'white';
            notification.style.padding = '12px 24px';
            notification.style.borderRadius = '25px';
            notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            notification.style.zIndex = '100';
            notification.style.animation = 'slideUp 0.5s ease-out, fadeIn 0.5s ease-out';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'fadeIn 0.5s ease-out reverse';
                setTimeout(() => notification.remove(), 500);
            }, 4000);
        }
    }

    function updateEndingsUI() {
        endingsListElem.innerHTML = '';
        if (unlockedEndings.length === 0) {
            const li = document.createElement('li');
            li.textContent = '(No endings unlocked)';
            endingsListElem.appendChild(li);
        } else {
            unlockedEndings.slice().reverse().forEach(e => {
                const li = document.createElement('li');
                li.textContent = e.title;
                endingsListElem.appendChild(li);
            });
        }
    }

    function prepareTexts() {
        pages.forEach(page => {
            const p = page.querySelector('.dialog-box p') || page.querySelector('p');
            if (p) p.dataset.fulltext = p.textContent;
        });
    }

    sidebarToggle.addEventListener('click', () => {
        const isActive = sidebar.classList.contains('active');
        playSfx('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3', 0.3);
        if (isActive) {
            sidebar.classList.remove('active');
            sidebarToggle.innerHTML = '☰';
            sidebarToggle.classList.remove('active');
        } else {
            sidebar.classList.add('active');
            sidebarToggle.innerHTML = '✕';
            sidebarToggle.classList.add('active');
            sidebar.focus();
        }
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            e.target !== sidebarToggle) {
            sidebar.classList.remove('active');
            sidebarToggle.innerHTML = '☰';
            sidebarToggle.classList.remove('active');
        }
    });

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            if (!target) return;

            playSfx('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3', 0.4);
            
            // Button press animation
            button.classList.add('pulse');
            setTimeout(() => button.classList.remove('pulse'), 1000);
            
            buttons.forEach(b => b.disabled = true);
            setTimeout(() => buttons.forEach(b => b.disabled = false), 700);

            if (!(currentPageId === 'page-index' && target === 'page-index')) {
                if (currentPageId !== target) addChoice(button.textContent.trim(), target);
            }

            if (currentPageId === 'page2a' && target === 'ending1') addItem('Rusty Boat');
            if (currentPageId === 'page2b' && target === 'ending4') addItem('Ancient Map');

            if (target.startsWith('ending')) {
                const endingTitle = document.getElementById(target).querySelector('h2').textContent;
                unlockEnding(target, endingTitle);
            }

            showPage(target);
        });
    });

    function init() {
        prepareTexts();
        updateChoiceUI();
        updateInventoryUI();
        updateEndingsUI();
        const loaded = loadProgress();
        if (!loaded) showPage('page-index', { skipTyping: true });
    }

    const savedTheme = localStorage.getItem('choose-your-adventure-theme');
    updateTheme(savedTheme || 'dark');
    window.addEventListener('beforeunload', saveProgress);
    init();
})();