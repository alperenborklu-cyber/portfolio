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

    // Contact Form Modal
    const contactModal = document.getElementById('contactModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const packageInput = document.getElementById('package');
    const formSubject = document.getElementById('formSubject');

    window.openContactModal = function (tierName) {
        if (contactModal) {
            contactModal.classList.add('active');
            if (packageInput) packageInput.value = tierName;
            if (formSubject) formSubject.value = `New Quote Request: ${tierName}`;
            document.body.style.overflow = 'hidden';
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            contactModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close modal when clicking outside
    // Close modal when clicking outside
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // --- BLOG FUNCTIONALITY ---
    const blogPosts = [
        {
            category: "Filmmaking",
            title: "From Concept to Screen: How I Develop a Short Film",
            keywords: "short film process, filmmaking workflow, storyboard development",
            content: `
                <p><strong>Every short film begins long before the camera turns on.</strong> For me, filmmaking is not about shooting scenes. It is about building a visual system where <strong>concept, rhythm, light, and narrative evolve together.</strong></p>
                <p>In this article, I break down my complete short film process — from raw idea to final render — and explain how storyboards, visual rhythm, and design thinking shape the final result.</p>
                
                <h3>1. The Concept: Finding the Emotional Core</h3>
                <p>Before writing a script, I ask:</p>
                <ul>
                    <li><strong>What is the emotional tension?</strong></li>
                    <li>What psychological transformation occurs?</li>
                    <li>What visual metaphor represents that transformation?</li>
                </ul>
                <p>I rarely start with dialogue. I start with atmosphere. Is it cold? Compressed? Chaotic? Still? <strong>That emotional temperature becomes the foundation of everything.</strong></p>

                <h3>2. Narrative Architecture: Structure Before Style</h3>
                <p>With a background in industrial design, I treat narrative like a designed object:</p>
                <ul>
                    <li>Beginning = Stability</li>
                    <li>Middle = Distortion</li>
                    <li>End = Transformation or Collapse</li>
                </ul>
                <p><strong>Structure creates clarity.</strong> Only after structural integrity is established do I refine visual language. Style without structure is decoration. Structure gives style purpose.</p>

                <h3>3. Storyboarding: Designing Rhythm Visually</h3>
                <p>Storyboarding is where the film begins to breathe. I focus on:</p>
                <ul>
                    <li>Shot duration rhythm</li>
                    <li>Light direction consistency</li>
                    <li>Camera emotional distance</li>
                    <li>Framing tension</li>
                </ul>
                <p>Storyboards are not about drawing beautifully. <strong>They are about controlling timing and psychological perspective.</strong> This stage allows me to test pacing before production begins.</p>

                <h3>4. Execution: Light, Color, and Movement</h3>
                <p>During production:</p>
                <ul>
                    <li>Light defines emotional temperature</li>
                    <li>Color reinforces internal states</li>
                    <li>Camera movement mirrors psychological movement</li>
                </ul>
                <p>I do not use light to simply illuminate. <strong>I use light to reveal conflict.</strong> Visual decisions must serve emotional logic.</p>

                <h3>5. Post-Production: Sculpting Time</h3>
                <p>Editing is rhythm control. Cut too fast and tension disappears. Cut too slow and energy dissolves. I approach cuts like heartbeat patterns. They must feel alive.</p>
                <p>Sound design then becomes the subconscious layer that deepens atmosphere.</p>

                <p><strong>Filmmaking is not a sequence of isolated steps. It is a system of emotional design.</strong><br>Concept → Structure → Storyboard → Light → Rhythm → Sound.<br>When these elements align, the film feels inevitable.</p>
            `
        },
        {
            category: "Design Thinking",
            title: "What Industrial Design Taught Me About Filmmaking",
            keywords: "industrial design and filmmaking, visual storytelling layout",
            content: `
                <p>My background in industrial design fundamentally shaped how I approach filmmaking. At first glance, design and cinema may seem unrelated. But both disciplines revolve around <strong>structure, perception, and controlled experience.</strong></p>

                <h3>1. Form Follows Function — In Story Too</h3>
                <p>In design, every curve has a purpose. In film, every scene must serve transformation. <strong>If a scene looks visually impressive but does not push narrative tension forward, it is decoration, not storytelling.</strong> Purpose creates power.</p>

                <h3>2. Systems Thinking</h3>
                <p>Design trains you to think in systems: Interaction, Structural balance, Flow between components.</p>
                <p>In cinema, scenes do not exist independently. <strong>They function within a rhythm system.</strong> If one moment breaks emotional continuity, the entire experience weakens.</p>

                <h3>3. Material Sensitivity</h3>
                <p>Design develops sensitivity to material, texture, and surface. In filmmaking, this translates into:</p>
                <ul>
                    <li>Light texture</li>
                    <li>Sound texture</li>
                    <li>Environmental realism</li>
                </ul>
                <p>Atmosphere becomes tactile. <strong>Cinema is not only visual. It is sensory architecture.</strong></p>

                <h3>4. Constraint Is Creative Fuel</h3>
                <p>Design always operates within constraints — physics, budget, usability. Film is the same.</p>
                <p>Constraints sharpen decision-making. They eliminate excess. They force clarity. <strong>Limitations often produce stronger work.</strong></p>

                <p>Industrial design did not distract me from filmmaking. It strengthened my structural clarity, visual discipline, and emotional architecture. <strong>Cinema is not chaos. It is engineered emotion.</strong></p>
            `
        },
        {
            category: "Cinematography",
            title: "What Makes Good Atmosphere in Cinema?",
            keywords: "cinematic atmosphere, light, mood",
            content: `
                <p>Atmosphere is not artificial smoke or blue lighting. <strong>Atmosphere is controlled perception.</strong> It is the invisible tension between space, time, and character.</p>

                <h3>1. Spatial Psychology</h3>
                <p>Tight frames create anxiety. Wide emptiness creates isolation. Atmosphere begins with spatial compression and release. <strong>Framing defines emotional distance.</strong></p>

                <h3>2. Light as Emotional Temperature</h3>
                <p>Cold light suggests emotional distance. Warm light suggests intimacy or nostalgia. But contrast between light sources creates internal conflict. <strong>Atmosphere grows through controlled contrast.</strong></p>

                <h3>3. Silence and Restraint</h3>
                <p>Silence is not absence. It amplifies micro-movements, breath, and internal tension. <strong>Atmosphere expands when the film resists over-explanation.</strong></p>

                <h3>4. Rhythm Before Dialogue</h3>
                <p>Atmosphere collapses when characters explain everything. Strong rhythm allows visual storytelling to dominate. Editing controls psychological pacing. Pacing defines immersion.</p>

                <h3>5. Tonal Consistency</h3>
                <p>Atmosphere fails when tonal language shifts randomly. Light, sound, framing, performance — all must belong to the same emotional ecosystem.</p>

                <p><strong>Good atmosphere is not added during post-production. It is designed from the first idea.</strong> Light, space, silence, rhythm — synchronized from concept to final cut. Atmosphere is engineered emotion.</p>
            `
        }
    ];

    const blogModal = document.getElementById('blogModal');
    const blogModalBody = document.getElementById('blogModalBody');
    const closeBlogBtn = document.querySelector('.close-blog');

    window.openBlogModal = function (index) {
        const post = blogPosts[index];
        if (!post) return;

        const htmlContent = `
            <div class="article-header">
                <span class="article-category">${post.category}</span>
                <h2 class="article-title">${post.title}</h2>
                <div class="article-meta">Keywords: ${post.keywords}</div>
            </div>
            <div class="article-body">
                ${post.content}
            </div>
        `;

        if (blogModalBody) blogModalBody.innerHTML = htmlContent;
        if (blogModal) {
            blogModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    if (closeBlogBtn) {
        closeBlogBtn.addEventListener('click', () => {
            if (blogModal) blogModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close on outside click for blog modal
    if (blogModal) {
        blogModal.addEventListener('click', (e) => {
            if (e.target === blogModal) {
                blogModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

});
