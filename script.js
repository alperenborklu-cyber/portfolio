document.addEventListener('DOMContentLoaded', () => {
    // Check if running via file:// protocol
    if (window.location.protocol === 'file:') {
        const warning = document.createElement('div');
        warning.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: #d9534f; color: white; text-align: center; padding: 15px; z-index: 10000; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
        warning.innerHTML = '<strong>WARNING:</strong> You are viewing this file directly. Dynamic features (Editing/Deleting) will NOT work.<br>Please open <a href="http://localhost:8000" style="color: #fff; text-decoration: underline;">http://localhost:8000</a> in your browser.';
        document.body.appendChild(warning);
    }

    // Header Scroll Effect
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    // Animation Classes List
    const animClasses = ['anim-tornado', 'anim-elastic', 'anim-flip', 'anim-drop', 'anim-arrive', 'anim-worm'];

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Pick a RANDOM animation
                const randomAnim = animClasses[Math.floor(Math.random() * animClasses.length)];
                entry.target.classList.add(randomAnim);

                // entry.target.classList.add('visible'); // No longer using generic visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe Gallery Items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        // Reduced delay for chaotic feel
        item.style.animationDelay = `${index * 100}ms`;
        observer.observe(item);
    });

    // Observe Text Elements (Titles, Paragraphs, Buttons in sections)
    // Create a separate observer for text if we want them to be simple,
    // OR we can just add 'visible' to them manually.
    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const textElements = document.querySelectorAll('.section-header, .about-content h2, .about-content p, .contact-section h2, .contact-section p, .contact-section .btn-secondary');

    textElements.forEach((el, index) => {
        el.classList.add('scroll-animate');
        textObserver.observe(el);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });



    // Gallery Admin Features (Delete & Edit) - Localhost Only
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
        console.log("Running on localhost: Admin features enabled.");
        const allGalleryItems = document.querySelectorAll('.gallery-item');
        allGalleryItems.forEach(item => {

            // --- Edit Button ---
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.innerHTML = '&#9998;'; // Pencil icon
            editBtn.title = 'Edit Title/Subtitle';

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const overlay = item.querySelector('.overlay');
                const h3 = overlay.querySelector('h3');
                const p = overlay.querySelector('p');

                const isEditable = h3.isContentEditable;

                if (!isEditable) {
                    // Enter Edit Mode
                    h3.contentEditable = "true";
                    p.contentEditable = "true";
                    overlay.style.opacity = "1"; // Keep overlay visible
                    item.classList.add('editing');

                    editBtn.innerHTML = '&#10003;'; // Checkmark
                    editBtn.style.background = 'rgba(40, 167, 69, 0.9)';
                    h3.focus();
                } else {
                    // Save Changes
                    h3.contentEditable = "false";
                    p.contentEditable = "false";
                    overlay.style.opacity = "";
                    item.classList.remove('editing');

                    editBtn.innerHTML = '&#9998;';
                    editBtn.style.background = '';

                    const img = item.querySelector('img');
                    const src = img ? img.getAttribute('src') : 'unknown';

                    // Send update to server
                    fetch('/update-title', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            src: src,
                            title: h3.innerText,
                            subtitle: p.innerText
                        })
                    }).then(response => {
                        if (response.ok) {
                            console.log('Title updated on server');
                        } else {
                            console.error('Failed to update title on server');
                            alert('Could not save changes. Ensure "server.py" is running.');
                        }
                    }).catch(err => {
                        console.error('Error:', err);
                        alert('Could not save changes. Ensure "server.py" is running.');
                    });
                }
            });

            // --- Delete Button ---
            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.innerHTML = '&times;';
            btn.title = 'Delete Permanently';

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('PERMANENTLY DELETE using server? This cannot be undone.')) {
                    const img = item.querySelector('img');
                    const src = img ? img.getAttribute('src') : null;

                    if (src) {
                        fetch('/delete-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ src: src })
                        }).then(response => {
                            if (response.ok) {
                                // UI Removal
                                item.style.transform = 'scale(0)';
                                item.style.opacity = '0';
                                setTimeout(() => {
                                    item.remove();
                                    console.log(`[DELETED] ${src}`);
                                }, 300);
                            } else {
                                alert('Failed to delete. Ensure "server.py" is running.');
                            }
                        }).catch(err => {
                            console.error('Error deleting:', err);
                            if (window.location.protocol === 'file:') {
                                alert('Error: You are using the file:// protocol. Please use http://localhost:8000');
                            } else {
                                alert('Error contacting server. Ensure "server.py" is running and you are at http://localhost:8000');
                            }
                        });
                    }
                }
            });

            // Prevent click propagation when editing
            const overlay = item.querySelector('.overlay');
            if (overlay) {
                overlay.addEventListener('click', (e) => {
                    const h3 = overlay.querySelector('h3');
                    if (h3 && h3.isContentEditable) {
                        e.stopPropagation();
                    }
                });
            }

            item.appendChild(editBtn);
            item.appendChild(btn);
        });
    }

    // Lightbox Functionality
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const closeLightbox = document.querySelector('.close-lightbox');

    // Add click event to all existing gallery items
    function attachLightboxEvents() {
        const items = document.querySelectorAll('.gallery-item');
        items.forEach(item => {
            // Remove previous event listener to avoid duplicates if re-attaching
            item.removeEventListener('click', openLightboxHandler);
            item.addEventListener('click', openLightboxHandler);
        });
    }

    function openLightboxHandler(e) {
        // Don't open if clicking a delete/edit button
        if (e.target.closest('.delete-btn') || e.target.closest('.edit-btn')) return;
        // Don't open if clicking inside the overlay when editing
        if (this.classList.contains('editing')) return;

        const img = this.querySelector('img');
        if (!img) return; // specific safety check

        const titleProps = this.querySelector('h3');
        const descProps = this.querySelector('p');

        const title = titleProps ? titleProps.innerText : '';
        const desc = descProps ? descProps.innerText : '';

        lightbox.classList.add('active');
        lightboxImg.src = img.src;
        lightboxCaption.innerHTML = `<span style="color:var(--accent-color);">${title}</span> ${desc ? ' - ' + desc : ''}`;
        document.body.classList.add('lightbox-open');
    }

    // Close Lightbox
    if (closeLightbox) {
        closeLightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
            document.body.classList.remove('lightbox-open');
        });
    }

    // Close on outside click
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
                document.body.classList.remove('lightbox-open');
            }
        });
    }

    // Initial attachment
    attachLightboxEvents();

});
