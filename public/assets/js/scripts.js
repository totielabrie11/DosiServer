window.addEventListener('DOMContentLoaded', event => {

    // Función para reducir el tamaño de la barra de navegación
    const navbarShrink = () => {
        const navbarCollapsible = document.querySelector('#mainNav');
        if (navbarCollapsible) {
            if (window.scrollY === 0) {
                navbarCollapsible.classList.remove('navbar-shrink');
            } else {
                navbarCollapsible.classList.add('navbar-shrink');
            }
        }
    };

    // Reducir la barra de navegación si la página se ha desplazado
    navbarShrink();
    document.addEventListener('scroll', navbarShrink);

    // Verifica todas las etiquetas <section>
    const allSections = document.querySelectorAll('section');
    console.log(`Found ${allSections.length} sections in total:`);

    allSections.forEach((section, index) => {
        console.log(`Section ${index + 1}:`);
        console.log(`Tag: ${section.tagName}`);
        console.log(`ID: ${section.getAttribute('id')}`);
        console.log(`Offset top: ${section.offsetTop}`);
        console.log(`Height: ${section.offsetHeight}`);
    });

    // Implementación personalizada de ScrollSpy
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('#mainNav .nav-link');

    console.log(`Found ${sections.length} sections with ID:`);

    sections.forEach(section => {
        console.log(`Section ID: ${section.getAttribute('id')}`);
        console.log(`Offset top: ${section.offsetTop}`);
        console.log(`Height: ${section.offsetHeight}`);
    });

    function onScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        console.log(`Scroll position: ${scrollPosition}`);

        let activeSectionId = null;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 80; // Ajusta el offset según sea necesario
            const sectionHeight = section.offsetHeight;

            console.log(`Checking section: ${section.getAttribute('id')}`);
            console.log(`Section top: ${sectionTop}, Section height: ${sectionHeight}`);
            console.log(`Section range: [${sectionTop}, ${sectionTop + sectionHeight}]`);

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                activeSectionId = section.getAttribute('id');
                console.log(`Active section found: ${activeSectionId}`);
            }
        });

        if (activeSectionId) {
            removeActiveClasses();
            addActiveClass(activeSectionId);
        } else {
            console.log("No active section found.");
        }
    }

    function removeActiveClasses() {
        console.log("Removing active classes...");
        navLinks.forEach(link => link.classList.remove('active'));
    }

    function addActiveClass(id) {
        const activeLink = document.querySelector(`#mainNav .nav-link[href="#${id}"]`);
        if (activeLink) {
            console.log(`Adding active class to: ${activeLink.href}`);
            activeLink.classList.add('active');
        } else {
            console.log(`Active link not found for section: ${id}`);
        }
    }

    window.addEventListener('scroll', onScroll);
    onScroll(); // Llamar para activar el primer enlace al cargar la página

    // Colapsar la barra de navegación receptiva cuando el toggler es visible
    const navbarToggler = document.querySelector('.navbar-toggler');
    const responsiveNavItems = document.querySelectorAll('#navbarResponsive .nav-link');

    responsiveNavItems.forEach((responsiveNavItem) => {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});
