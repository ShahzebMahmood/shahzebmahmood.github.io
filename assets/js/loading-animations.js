// Loading Animations JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Create page loader
    createPageLoader();
    
    // Initialize loading animations
    initializeAnimations();
    
    // Handle link clicks with loading states
    handleLinkClicks();
    
    // Initialize intersection observer for scroll animations
    initializeScrollAnimations();
});

// Create and show page loader
function createPageLoader() {
    // Check if loader already exists
    if (document.querySelector('.page-loader')) return;
    
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-spinner"></div>
            <div style="margin-top: 1rem; color: white; font-weight: 600;">Loading...</div>
        </div>
    `;
    
    document.body.appendChild(loader);
    
    // Hide loader when page is fully loaded
    window.addEventListener('load', function() {
        setTimeout(() => {
            loader.classList.add('fade-out');
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 500);
        }, 500); // Show loader for at least 500ms
    });
}

// Initialize all animations
function initializeAnimations() {
    // Add loading bar
    createLoadingBar();
    
    // Animate elements that are already visible
    animateVisibleElements();
    
    // Add hover effects to buttons
    addButtonHoverEffects();
}

// Create loading bar at top
function createLoadingBar() {
    const loadingBar = document.createElement('div');
    loadingBar.className = 'loading-bar';
    document.body.appendChild(loadingBar);
    
    // Simulate loading progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 90) {
            clearInterval(interval);
            // Complete on window load
            window.addEventListener('load', () => {
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    loadingBar.classList.add('fade-out');
                    setTimeout(() => {
                        if (loadingBar.parentNode) {
                            loadingBar.parentNode.removeChild(loadingBar);
                        }
                    }, 300);
                }, 200);
            });
        } else {
            loadingBar.style.width = progress + '%';
        }
    }, 200);
}

// Handle link clicks with loading animations
function handleLinkClicks() {
    const links = document.querySelectorAll('a[href^="/"], a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip external links and downloads
            if (href.includes('http') || href.includes('.pdf') || href.includes('mailto')) {
                return;
            }
            
            // Add loading state to button
            if (this.classList.contains('btn')) {
                this.classList.add('btn-loading');
                const originalText = this.innerHTML;
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-loading');
                }, 2000);
            }
        });
    });
}

// Initialize scroll animations using Intersection Observer
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate on scroll
    const elementsToAnimate = document.querySelectorAll('.tech-stack, .current-focus, .featured-content');
    elementsToAnimate.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Animate elements that are already visible
function animateVisibleElements() {
    // Add staggered animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add pulse effect to download button
    const downloadBtn = document.querySelector('a[href*="resume"], a[href*="Resume"]');
    if (downloadBtn) {
        downloadBtn.classList.add('pulse');
    }
}

// Add hover effects to buttons
function addButtonHoverEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
}

// Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', initializeLazyLoading);

// Smooth scroll for anchor links
document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href^="#"]');
    if (target) {
        e.preventDefault();
        const targetId = target.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add typing effect to tagline
function addTypingEffect() {
    const tagline = document.querySelector('.hero-section p');
    if (tagline) {
        const text = tagline.textContent;
        tagline.textContent = '';
        let index = 0;
        
        function typeWriter() {
            if (index < text.length) {
                tagline.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 50);
            }
        }
        
        setTimeout(typeWriter, 1000);
    }
}

// Initialize typing effect after page load
window.addEventListener('load', () => {
    setTimeout(addTypingEffect, 1500);
});