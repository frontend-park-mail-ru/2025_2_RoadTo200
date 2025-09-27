const highlightLink = () => {
    const navLinks = document.querySelectorAll('.main-nav ul a');
    
    const currentUrl = window.location.href.replace(/\/$/, ""); 

    navLinks.forEach(link => {
        const linkUrl = link.href.replace(/\/$/, "");

        if (linkUrl === currentUrl) {
            link.classList.add('active-page');
        }
    });
};


const Nav = () => {
    highlightLink();
    
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.main-nav ul');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            
            navMenu.classList.toggle('is-open', !isExpanded);
        });
    }
};

document.addEventListener('DOMContentLoaded', Nav);

export { Nav };