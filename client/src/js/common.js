document.addEventListener('DOMContentLoaded', () => {
    // Đánh dấu menu active dựa trên URL hiện tại
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}); 