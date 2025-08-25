// ===== Mobile Navigation Toggle =====
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Smooth Scrolling for Navigation Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 100; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Animate elements on scroll
const animateElements = document.querySelectorAll('.stat-item, .feature-item, .portfolio-item, .team-member');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===== Counter Animation for Stats =====
const animateCounters = () => {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.textContent;
        const isPercentage = target.includes('%');
        const isCurrency = target.includes('$') || target.includes('M') || target.includes('+');
        
        let numericTarget;
        if (isCurrency) {
            numericTarget = parseInt(target.replace(/[^0-9]/g, ''));
        } else if (isPercentage) {
            numericTarget = parseInt(target.replace('%', ''));
        } else {
            numericTarget = parseInt(target.replace('+', ''));
        }
        
        let current = 0;
        const increment = numericTarget / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= numericTarget) {
                current = numericTarget;
                clearInterval(timer);
            }
            
            let displayValue;
            if (isCurrency && target.includes('$')) {
                displayValue = `$${Math.floor(current)}M+`;
            } else if (isPercentage) {
                displayValue = `${Math.floor(current)}%`;
            } else {
                displayValue = `${Math.floor(current)}+`;
            }
            
            counter.textContent = displayValue;
        }, 20);
    });
};

// Trigger counter animation when stats section is visible
const statsSection = document.querySelector('.about-stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(statsSection);
}

// ===== Contact Form Handling =====
const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const formElements = this.elements;
    
    // Simple validation
    let isValid = true;
    for (let element of formElements) {
        if (element.hasAttribute('required') && !element.value.trim()) {
            isValid = false;
            element.style.borderColor = '#ef4444';
            break;
        } else {
            element.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        }
    }
    
    if (isValid) {
        // Simulate form submission
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            submitBtn.textContent = 'Message Sent!';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #065f46 100%)';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                this.reset();
            }, 2000);
        }, 1000);
    }
});

// ===== Portfolio Item Hover Effects =====
const portfolioItems = document.querySelectorAll('.portfolio-item');

portfolioItems.forEach(item => {
    const overlay = item.querySelector('.portfolio-overlay');
    
    item.addEventListener('mouseenter', () => {
        overlay.style.opacity = '1';
    });
    
    item.addEventListener('mouseleave', () => {
        overlay.style.opacity = '0';
    });
});

// ===== Parallax Effect for Hero Section =====
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    
    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// ===== Button Hover Effects =====
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// ===== Typing Effect for Hero Title =====
const typeWriter = (element, text, speed = 100) => {
    let i = 0;
    element.innerHTML = '';
    
    const type = () => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    };
    
    type();
};

// ===== Initialize on Page Load =====
window.addEventListener('load', () => {
    // Add any initialization code here
    console.log('Idlewood Capital website loaded successfully');
    
    // Preload images for better performance
    const imageUrls = [
        // Add any image URLs here when you add actual images
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
});

// ===== Performance Optimization =====
// Debounce function for scroll events
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(() => {
    const scrolled = window.pageYOffset;
    
    // Navbar scroll effect
    if (scrolled > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Parallax effect
    const hero = document.querySelector('.hero');
    if (hero) {
        const rate = scrolled * -0.3;
        hero.style.transform = `translateY(${rate}px)`;
    }
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// ===== Accessibility Improvements =====
// Focus management for mobile menu
mobileMenu.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        mobileMenu.click();
    }
});

// Skip to main content functionality
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
        const firstFocusable = document.querySelector('a, button, input, textarea, select');
        if (document.activeElement === firstFocusable) {
            // User is tabbing from the first focusable element
            // Could add a "Skip to main content" link here
        }
    }
});

// ===== Error Handling =====
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    // You could send error reports to a logging service here
});

// ===== Browser Support Checks =====
const checkBrowserSupport = () => {
    // Check for CSS Grid support
    if (!CSS.supports('display', 'grid')) {
        console.warn('CSS Grid not supported. Layout may not display correctly.');
    }
    
    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported. Animations may not work.');
        // Fallback: show all elements immediately
        animateElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }
};

checkBrowserSupport();