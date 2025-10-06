// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navbar = document.querySelector('.navbar');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }));
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll animation to elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.biodata-card, .social-link, .section-title, .interest-item, .education-item').forEach(el => {
        observer.observe(el);
    });
    
    // Add animation classes dynamically
    const style = document.createElement('style');
    style.textContent = `
        .biodata-card, .social-link, .section-title, .interest-item, .education-item {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s, transform 0.8s;
        }
        
        .biodata-card.animate-in, .social-link.animate-in, .section-title.animate-in, .interest-item.animate-in, .education-item.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .biodata-card:nth-child(1) {
            transition-delay: 0.1s;
        }
        
        .biodata-card:nth-child(2) {
            transition-delay: 0.3s;
        }
        
        .interest-item:nth-child(1) {
            transition-delay: 0.1s;
        }
        
        .interest-item:nth-child(2) {
            transition-delay: 0.2s;
        }
        
        .interest-item:nth-child(3) {
            transition-delay: 0.3s;
        }
        
        .interest-item:nth-child(4) {
            transition-delay: 0.4s;
        }
        
        .education-item:nth-child(1) {
            transition-delay: 0.1s;
        }
        
        .education-item:nth-child(2) {
            transition-delay: 0.2s;
        }
        
        .education-item:nth-child(3) {
            transition-delay: 0.3s;
        }
        
        .education-item:nth-child(4) {
            transition-delay: 0.4s;
        }
        
        .social-link:nth-child(1) {
            transition-delay: 0.1s;
        }
        
        .social-link:nth-child(2) {
            transition-delay: 0.3s;
        }
    `;
    document.head.appendChild(style);
    
    // Add parallax effect to background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.neon-background');
        parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
    });
    
    // Add typing effect to home title
    const titleElement = document.querySelector('.title-main');
    const originalText = titleElement.textContent;
    titleElement.textContent = '';
    
    let i = 0;
    function typeWriter() {
        if (i < originalText.length) {
            titleElement.textContent += originalText.charAt(i);
            i++;
            setTimeout(typeWriter, 150);
        }
    }
    
    // Start typing effect when page loads
    setTimeout(typeWriter, 1000);
    
    // Create floating formulas
    function createFloatingFormulas() {
        const formulasContainer = document.getElementById('floating-formulas');
        const formulas = [
            'E = mc²',
            'F = ma',
            'a² + b² = c²',
            '∇·E = ρ/ε₀',
            '∇×E = -∂B/∂t',
            '∫f(x)dx',
            'lim x→∞',
            '∂²u/∂t² = c²∇²u',
            'e^(iπ) + 1 = 0',
            'ψ = A sin(kx - ωt)',
            'a² + b² = c²',
            'F = G(m₁m₂)/r²',
            '∇²ψ + k²ψ = 0',
            'S = k log W',
            'PV = nRT',
            'λ = h/p'
        ];
        
        for (let i = 0; i < 20; i++) {
            const formula = document.createElement('div');
            formula.className = 'formula';
            formula.textContent = formulas[Math.floor(Math.random() * formulas.length)];
            
            // Random position and animation delay
            formula.style.left = `${Math.random() * 100}%`;
            formula.style.animationDelay = `${Math.random() * 20}s`;
            formula.style.fontSize = `${Math.random() * 10 + 20}px`;
            
            formulasContainer.appendChild(formula);
        }
    }
    
    // Create interactive particles
    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            // Random animation
            particle.style.animation = `floatParticle ${Math.random() * 10 + 10}s linear infinite`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            
            particlesContainer.appendChild(particle);
        }
        
        // Add CSS for particle animation
        const particleStyle = document.createElement('style');
        particleStyle.textContent = `
            @keyframes floatParticle {
                0%, 100% {
                    transform: translate(0, 0) scale(1);
                    opacity: 0;
                }
                10% {
                    opacity: 0.8;
                }
                50% {
                    transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.5);
                }
                90% {
                    opacity: 0.8;
                }
            }
        `;
        document.head.appendChild(particleStyle);
    }
    
    // Interactive formula display
    const formulaText = document.querySelector('.formula-text');
    const formulas = [
        'E = mc²',
        'F = ma',
        'a² + b² = c²',
        '∇·E = ρ/ε₀',
        'e^(iπ) + 1 = 0',
        'ψ = A sin(kx - ωt)'
    ];
    
    let formulaIndex = 0;
    
    function changeFormula() {
        formulaIndex = (formulaIndex + 1) % formulas.length;
        formulaText.textContent = formulas[formulaIndex];
    }
    
    formulaText.addEventListener('click', changeFormula);
    
    // Auto change formula every 5 seconds
    setInterval(changeFormula, 5000);
    
    // Mouse move effect for social links
    document.querySelectorAll('.social-link').forEach(link => {
        link.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.style.setProperty('--mouse-x', `${x}px`);
            this.style.setProperty('--mouse-y', `${y}px`);
        });
    });
    
    // Initialize
    createFloatingFormulas();
    createParticles();
});


