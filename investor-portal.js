// ===== Investor Portal JavaScript =====

document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('investor-login');
    const logoutBtn = document.getElementById('logout-btn');
    const investorName = document.getElementById('investor-name');
    const lastLoginDate = document.getElementById('last-login-date');
    
    // Check if user is already logged in (from session)
    const isLoggedIn = sessionStorage.getItem('investorLoggedIn');
    const savedInvestorName = sessionStorage.getItem('investorName');
    
    if (isLoggedIn === 'true') {
        showDashboard(savedInvestorName);
    }
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember').checked;
            
            // Simple validation (in production, this would be server-side)
            if (email && password) {
                // Extract name from email for demo
                const name = email.split('@')[0]
                    .split('.')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                // Store session
                sessionStorage.setItem('investorLoggedIn', 'true');
                sessionStorage.setItem('investorName', name);
                
                if (rememberMe) {
                    localStorage.setItem('investorEmail', email);
                }
                
                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Authenticating...';
                submitBtn.disabled = true;
                
                // Simulate authentication delay
                setTimeout(() => {
                    showDashboard(name);
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 1500);
            }
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('investorLoggedIn');
            sessionStorage.removeItem('investorName');
            showLogin();
        });
    }
    
    // Show dashboard
    function showDashboard(name) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        // Update investor name
        if (investorName) {
            investorName.textContent = name || 'Investor';
        }
        
        // Update last login date
        if (lastLoginDate) {
            const now = new Date();
            const dateOptions = { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            };
            lastLoginDate.textContent = now.toLocaleDateString('en-US', dateOptions);
        }
        
        // Animate dashboard elements
        animateDashboard();
    }
    
    // Show login
    function showLogin() {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
        
        // Clear form
        if (loginForm) {
            loginForm.reset();
        }
    }
    
    // Animate dashboard elements on load
    function animateDashboard() {
        const cards = document.querySelectorAll('.portfolio-card');
        const sections = document.querySelectorAll('.dashboard-section');
        
        // Animate cards
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // Animate sections
        sections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                section.style.transition = 'all 0.6s ease';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }
    
    // Handle forgot password
    const forgotPassword = document.querySelector('.forgot-password');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Please contact us at info@idlewoodcapital.com to reset your password.');
        });
    }
    
    // Handle document downloads
    const docDownloads = document.querySelectorAll('.doc-download');
    docDownloads.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Simulate download
            const docTitle = this.closest('.document-item').querySelector('.doc-title').textContent;
            
            // Change link text temporarily
            const originalText = this.textContent;
            this.textContent = 'Preparing...';
            
            setTimeout(() => {
                this.textContent = 'Downloaded!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            }, 1000);
            
            console.log(`Downloading: ${docTitle}`);
        });
    });
    
    // Auto-fill email if remembered
    const savedEmail = localStorage.getItem('investorEmail');
    if (savedEmail) {
        const emailInput = document.getElementById('email');
        const rememberCheckbox = document.getElementById('remember');
        
        if (emailInput) {
            emailInput.value = savedEmail;
        }
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
    
    // Add smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Simulate real-time updates
    function simulateUpdates() {
        const updatesFeed = document.querySelector('.updates-feed');
        
        if (updatesFeed && dashboardSection.style.display !== 'none') {
            // Occasionally add a new update
            const random = Math.random();
            if (random < 0.1) { // 10% chance every 10 seconds
                const newUpdate = document.createElement('div');
                newUpdate.className = 'update-item';
                newUpdate.style.opacity = '0';
                newUpdate.innerHTML = `
                    <div class="update-date">Just now</div>
                    <div class="update-content">
                        <h4 class="update-title">Portfolio Update</h4>
                        <p class="update-description">New performance metrics are now available in your dashboard.</p>
                    </div>
                `;
                
                updatesFeed.insertBefore(newUpdate, updatesFeed.firstChild);
                
                setTimeout(() => {
                    newUpdate.style.transition = 'opacity 0.5s ease';
                    newUpdate.style.opacity = '1';
                }, 100);
                
                // Remove last update if too many
                if (updatesFeed.children.length > 5) {
                    updatesFeed.removeChild(updatesFeed.lastChild);
                }
            }
        }
    }
    
    // Run update simulation every 10 seconds
    setInterval(simulateUpdates, 10000);
});

// Add number formatting for portfolio values
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Add percentage formatting
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
}