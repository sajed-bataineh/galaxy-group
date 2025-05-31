// تأثير التمرير على الـ navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.headnavbar');
    const scrolled = window.scrollY;
    
    if (scrolled > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all animated elements
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-left, .slide-right, .scale-in, .slide-up');
    animatedElements.forEach(el => observer.observe(el));

    // Add smooth scrolling for anchor links
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

    // Add number counter animation
    const numberElement = document.querySelector('.costomer .number');
    if (numberElement) {
        const animateNumber = (element, target, duration = 2000) => {
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                element.textContent = '+' + Math.floor(current);
            }, 16);
        };

        const numberObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateNumber(numberElement, 200);
                    numberObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        numberObserver.observe(numberElement);
    }
});

// Add scroll-triggered animations for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroText = document.querySelector('.head .text');
    const video = document.querySelector('.head .video video');
    
    if (heroText && scrolled < window.innerHeight) {
        const opacity = 1 - (scrolled / window.innerHeight) * 1.5;
        heroText.style.opacity = Math.max(0, opacity);
    }
    
    if (video && scrolled < window.innerHeight) {
        const scale = 1 + (scrolled / window.innerHeight) * 0.1;
        video.style.transform = `scale(${scale})`;
    }
});
