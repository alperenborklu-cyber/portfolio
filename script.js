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
            category: "Motion Design & Industry Trends",
            title: "11 Motion Design Trends Shaping 2026",
            content: `
                <p><strong>The pace of change in motion design has never been faster.</strong> Here's what's defining our industry in 2026—and how you can stay ahead.</p>
                <p>Video and motion design are evolving at a breakneck pace, and 2026 is shaping up to be a year of radical hybrid creativity. Creators are blending cutting-edge AI tools with traditional craft.</p>
                <h3>1. Do It in Post (With AI)</h3>
                <p>AI is now deeply integrated into every editing and creative app. Hybrid AI workflows let you work faster and focus on storytelling.</p>
                <h3>2. Authenticity Through Imperfection</h3>
                <p>Viewers are gravitating toward handheld, raw, and emotionally honest footage. Imperfection signals trust and authenticity.</p>
                <h3>3. Story-Driven Brand Films</h3>
                <p>Brands are realizing that audiences want to feel something. Cinematic storytelling is reclaiming its place in advertising.</p>
                <h3>4. Craft as Luxury</h3>
                <p>We're seeing brands celebrate hand-drawn animation, stop-motion, and mixed-media artistry as a counterweight to generative sameness.</p>
                <h3>5. AI-Generated Actors and Digital Doubles</h3>
                <p>AI video generators can now create consistent AI characters. We're seeing a rise in "digital doubles" based on real people.</p>
                <h3>6. Platform-First Editing</h3>
                <p>Social platforms are becoming full-fledged editing suites. Creators aren't just posting to TikTok—they're editing inside it.</p>
                <h3>7. The End of Aspect Ratio Rules</h3>
                <p>Aspect ratios are no longer creative constraints. AI framing tools let editors instantly adapt a master edit to any ratio.</p>
                <h3>8. Analog Nostalgia</h3>
                <p>We're witnessing a revival of analog aesthetics: film grain, warm lighting, and VHS overlays. Vibe is as powerful as polish.</p>
                <h3>9. Wearable POV Filmmaking</h3>
                <p>With smart glasses, creators are capturing the world exactly as they see it. Raw, intimate, and immersive.</p>
                <h3>10. Minimalistic Editing</h3>
                <p>Minimalistic editing prioritizes authenticity and pacing. Long takes and gentle refinements let audiences actually listen.</p>
                <h3>11. Motion Design Becomes Strategic</h3>
                <p>Motion systems will become the anchor that lets brands flex without losing themselves. Motion knows when to push and when to pause.</p>
                <p><strong>Looking Ahead:</strong> Are you chasing trends, or creating work that feels intentional?</p>
            `
        },
        {
            category: "Motion Design & Industry Trends",
            title: "Motion Design Is Becoming Programmable",
            content: `
                <p><strong>Timelines and keyframes are giving way to rules and logic.</strong> Here's how "programming motion" is changing what it means to be a motion designer.</p>
                <p>Traditional workflows demand hours of manual labor. AI motion design replaces timelines with logic. Instead of manually placing every movement, creators define intent and relationships.</p>
                <h3>The CodeGen Moment for Video</h3>
                <p>Software development changed when AI began generating code. The same shift is happening in video. Motion is described through rules: "A text block fades in over a fixed duration."</p>
                <h3>What Programmable Motion Unlocks</h3>
                <p><strong>1. Personalization at Scale:</strong> Generate 10,000 unique video ads, each perfectly timed.</p>
                <p><strong>2. Template-Based Production:</strong> Non-technical teams input content and receive professional output.</p>
                <p><strong>3. Vibe Editing:</strong> "Make this feel more energetic." AI translates direction into implementation.</p>
                <p><strong>The Economics:</strong> After 50-100 videos, AI motion graphics become dramatically cheaper.</p>
                <p><strong>The Shift:</strong> Designers move away from manual execution and toward system design. The future isn't about choosing a single tool—it's about designing the systems.</p>
            `
        },
        {
            category: "Motion Design & Industry Trends",
            title: "The VFX/Animation Industry in 2026",
            content: `
                <p><strong>After years of disruption, the industry is finding its footing.</strong> Here's where we stand—and where we're heading.</p>
                <p>The industry is balancing uncertainty with opportunity. While business has been roller-coaster, technology like AI, virtual production, and real-time rendering is surging.</p>
                <h3>Key Technologies Reshaping the Industry</h3>
                <p><strong>AI and Machine Learning:</strong> Doing the heavy lifting (roto, clean-up) so artists focus on creative.</p>
                <p><strong>Real-Time Rendering:</strong> Unreal Engine is speeding up decisions and bringing everyone into the creative process earlier.</p>
                <p><strong>Cloud Workflows:</strong> Teams in different countries work like they're in the same room.</p>
                <p><strong>LED Stages:</strong> Becoming cost-effective even for simple sequences.</p>
                <h3>The Human Element</h3>
                <p>Despite tech, human connection remains essential. "The value of human connection will outweigh the pursuit of displacing staff."</p>
                <p><strong>What This Means for Motion Designers:</strong> Specialization in human craft, cross-industry applications, and hybrid workflows are the keys to 2026.</p>
            `
        },
        {
            category: "AI & The Future of Creation",
            title: "AI in Motion Design: From Experimental to Essential",
            content: `
                <p><strong>AI is no longer a novelty—it's becoming as essential as keyframing.</strong> Here's how to integrate AI without losing your creative soul.</p>
                <p>In 2026, AI is deeply integrated. The question is no longer "should I use AI?" but "how do I use it well?"</p>
                <h3>Where AI Adds Real Value</h3>
                <p><strong>1. Automating Tedious Tasks:</strong> Masking, rotoscoping, cleanup.</p>
                <p><strong>2. Speeding Up Iteration:</strong> Explore 20 color variations in minutes.</p>
                <p><strong>3. Handling Complex Effects:</strong> Fire, water, crowds—generated with prompts.</p>
                <h3>The Human Role</h3>
                <p>AI doesn't replace creative direction; it amplifies it. You define the vision, make aesthetic judgments, and bring emotional intelligence.</p>
                <p><strong>The Bottom Line:</strong> The creators who thrive won't be those who resist AI. They'll be those who use AI to handle repetition and their humanity to handle everything else.</p>
            `
        },
        {
            category: "AI & The Future of Creation",
            title: "When AI Does the Heavy Lifting, Story Matters More",
            content: `
                <p><strong>AI can generate infinite content, but it can't make people care.</strong> Storytelling is the ultimate differentiator.</p>
                <p>"The core shortcoming is story." When everyone has access to the same tools, differentiation shifts from technique to intention.</p>
                <h3>What AI Can't Do</h3>
                <p>It can mimic emotion but can't feel it. It can't grasp cultural nuance. It cannot build relationships.</p>
                <h3>Storytelling Techniques for 2026</h3>
                <p><strong>Start with Human Truth:</strong> Behind every product is a human need.</p>
                <p><strong>Create Emotional Arcs:</strong> Even 30-second spots need tension and release.</p>
                <p><strong>Build Worlds:</strong> "Strong brands will creating brand worlds that audiences can engage with."</p>
                <p><strong>Trust Authenticity:</strong> "Perfect is out. Real is in."</p>
                <p><strong>The Future Is Human:</strong> Whether it's a social loop or a film, story is what makes people care. And caring is the rarest commodity.</p>
            `
        },
        {
            category: "AI & The Future of Creation",
            title: "The AI漫剧 Revolution: What Motion Designers Can Learn",
            content: `
                <p><strong>China's AI漫剧 market has exploded from niche experiment to 200 billion RMB industry in just two years.</strong> Here's what Western motion designers need to know.</p>
                <p>This isn't incremental growth. It's explosive transformation. In 2024, the market was less than 30 million RMB. By 2025, it's projected to reach 200 billion RMB.</p>
                <h3>What Is AI漫剧?</h3>
                <p>AI漫剧 refers to animated short-form content created using artificial intelligence. Episodes typically run 3-8 minutes, with AI handling script generation, storyboard design, character modeling, and voice synthesis.</p>
                <h3>How AI Is Reshaping Production</h3>
                <p><strong>1. The Asset Library Revolution:</strong> Central to production is the "主体库" (subject library)—collections of reusable digital assets. When everything is modular, nothing needs to be rebuilt from scratch.</p>
                <p><strong>2. New Specialized Roles:</strong> AI has created new jobs like "Image generation specialists" and "Post-production directors."</p>
                <p><strong>3. From Linear to Iterative:</strong> Production is no longer linear. Teams generate, review, refine, and regenerate rapidly.</p>
                <h3>The Catch: Story Still Wins</h3>
                <p>For all the technological advancement, industry leaders emphasize: "Less than 5% break through—the core shortcoming is story." Teams with sophisticated AI workflows still fail if they can't tell compelling stories.</p>
                <p><strong>Looking Forward:</strong> The revolution shows what happens when AI meets creative ambition at scale. Production explodes. Costs collapse. But story remains the one thing technology can't provide.</p>
            `
        },
        {
            category: "Brand Identity & Commercial Work",
            title: "Why Motion Design Is Becoming a Strategic Brand Asset",
            content: `
                <p><strong>Motion is no longer just decoration—it's how brands stay recognizable in a fragmented, fast-moving world.</strong> Here's why forward-thinking companies are treating motion as strategy.</p>
                <p>"Motion has become essential for brands, and 2026 is when they'll double down." It's not just about making things move. It's about using motion strategically to build recognition and convey personality.</p>
                <h3>What Strategic Motion Looks Like</h3>
                <p><strong>1. Motion Systems, Not Just Animations:</strong> A strategic approach means creating rules. When should the logo animate? How fast are transitions? These rules become the foundation.</p>
                <p><strong>2. Recognition Across Contexts:</strong> From the massive Sphere in Vegas to a mobile feed, motion provides continuity even when the format changes.</p>
                <p><strong>3. Emotional Consistency:</strong> Color and typography convey brand personality, but motion brings it to life. Strategic motion ensures this personality translates everywhere.</p>
                <p><strong>4. Breaking Rules Intentionally:</strong> When you know the rules, you can break them intentionally—and those moments become meaningful.</p>
                <p><strong>The Bottom Line:</strong> Motion design in 2026 isn't about making things move. It's about making brands recognizable, consistent, and emotionally resonant across every possible touchpoint.</p>
            `
        },
        {
            category: "Brand Identity & Commercial Work",
            title: "The End of Visual Identity as the \"Main Event\"",
            content: `
                <p><strong>Recognition without participation doesn't build value.</strong> Here's why forward-thinking brands are moving from consistent identities to immersive worlds.</p>
                <p>"People remember what they do, not what they're shown." Recognition is table stakes. What matters is participation.</p>
                <h3>From Identity to World</h3>
                <p>Instead of focusing on visual consistency, brands need to focus on world-building: creating environments audiences can enter. In a brand world, the logo is an entry point, not the destination.</p>
                <h3>Motion's Role in World-Building</h3>
                <p><strong>Motion creates space:</strong> Through camera movement and depth, motion turns screens into spaces.</p>
                <p><strong>Motion conveys presence:</strong> The way elements move creates a sense of aliveness.</p>
                <p><strong>Motion enables participation:</strong> Interactive motion turns passive viewing into active engagement.</p>
                <p><strong>Designing for Change:</strong> The strongest brands will design brand world experiences as stories that people live, rather than just observe. For motion designers, we're not just making things move—we're creating the spaces where participation unfolds.</p>
            `
        },
        {
            category: "Brand Identity & Commercial Work",
            title: "Why Personality Is Becoming the Ultimate Differentiator",
            content: `
                <p><strong>When AI can generate infinite content, the one thing it can't replicate is genuine personality.</strong> Here's why being human matters more than ever.</p>
                <p>"As AI accelerates sameness, personality will become one of the most valuable differentiators a brand can have." When everyone has access to the same tools, differentiation shifts to personality.</p>
                <h3>What Brand Personality Looks Like</h3>
                <p><strong>Voice and Tone:</strong> Not just what you say, but how you say it.</p>
                <p><strong>Visual Behavior:</strong> How does your brand move? Energetically? Calmly? Motion personality is memorable.</p>
                <p><strong>Imperfections:</strong> "Perfect is out. Real is in." The unpolished moment feels human.</p>
                <h3>What This Means for Motion Designers</h3>
                <p><strong>Less Polish, More Presence:</strong> Instead of smoothing every edge, consider what roughness might communicate.</p>
                <p><strong>Documentary Approaches:</strong> Brand films that feel real communicate authenticity that scripted content can't match.</p>
                <p><strong>The Next Phase:</strong> Branding isn't louder or faster; it's more felt. It's about giving brands the ability to feel like someone.</p>
            `
        },
        {
            category: "Brand Identity & Commercial Work",
            title: "From Minimalism to Curated Maximalism",
            content: `
                <p><strong>The era of ultra-minimalism is giving way to something richer.</strong> Here's what the shift to curated maximalism means for motion designers.</p>
                <p>Brand design is shifting from neutral simplicity to demand for layered, emotionally resonant systems. This is curated maximalism—layered, intentional, and deeply human.</p>
                <h3>What Curated Maximalism Looks Like</h3>
                <p><strong>Layered Visuals:</strong> Texture over image, pattern behind type. Depth rewards attention.</p>
                <p><strong>Rich Texture:</strong> Tactile qualities like grain and material simulation signal humanity.</p>
                <p><strong>Intentional Complexity:</strong> Everything is there for a reason. It's richness with purpose.</p>
                <h3>The Role of Motion</h3>
                <p>Motion reveals how layers relate. It adds texture that feels alive. It establishes the rhythm that guides viewers through complex content.</p>
                <p><strong>Coherence Over Consistency:</strong> In a maximalist world, coherence matters more. Everything should feel connected, even when it looks different.</p>
                <p><strong>The Bottom Line:</strong> Great design doesn't chase attention, it earns belief. Curated maximalism is about creating work so rich that audiences choose to engage.</p>
            `
        },
        {
            category: "Filmmaking",
            title: "From Concept to Screen: How I Develop a Short Film",
            keywords: "short film process, filmmaking workflow, storyboard development",
            content: `
                <p><strong>Every short film begins long before the camera turns on.</strong> For me, filmmaking is not about shooting scenes. It is about building a visual system where <strong>concept, rhythm, light, and narrative evolve together.</strong></p>
                <p>In this article, I break down my complete short film process — from raw idea to final render — and explain how storyboards, visual rhythm, and design thinking shape the final result.</p>
                <h3>1. The Concept: Finding the Emotional Core</h3>
                <p>Before writing a script, I ask: What is the emotional tension? What psychological transformation occurs? What visual metaphor represents that transformation?</p>
                <p>I rarely start with dialogue. I start with atmosphere. Is it cold? Compressed? Chaotic? Still? <strong>That emotional temperature becomes the foundation of everything.</strong></p>
                <h3>2. Narrative Architecture: Structure Before Style</h3>
                <p>With a background in industrial design, I treat narrative like a designed object: Beginning = Stability, Middle = Distortion, End = Transformation or Collapse.</p>
                <p><strong>Structure creates clarity.</strong> Only after structural integrity is established do I refine visual language.</p>
                <h3>3. Storyboarding: Designing Rhythm Visually</h3>
                <p>Storyboarding is where the film begins to breathe. I focus on shot duration rhythm, light direction consistency, and framing tension.</p>
                <p>Storyboards are not about drawing beautifully. <strong>They are about controlling timing and psychological perspective.</strong></p>
                <h3>4. Execution: Light, Color, and Movement</h3>
                <p>Light defines emotional temperature. Color reinforces internal states. Camera movement mirrors psychological movement.</p>
                <p>I do not use light to simply illuminate. <strong>I use light to reveal conflict.</strong></p>
                <h3>5. Post-Production: Sculpting Time</h3>
                <p>Editing is rhythm control. Cut too fast and tension disappears. Cut too slow and energy dissolves. I approach cuts like heartbeat patterns.</p>
                <p><strong>Filmmaking is not a sequence of isolated steps. It is a system of emotional design.</strong></p>
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
                <p>Design trains you to think in systems: Interaction, Structural balance, Flow between components. In cinema, scenes do not exist independently. <strong>They function within a rhythm system.</strong></p>
                <h3>3. Material Sensitivity</h3>
                <p>Design develops sensitivity to material, texture, and surface. In filmmaking, this translates into light texture, sound texture, and environmental realism.</p>
                <p>Atmosphere becomes tactile. <strong>Cinema is not only visual. It is sensory architecture.</strong></p>
                <h3>4. Constraint Is Creative Fuel</h3>
                <p>Design always operates within constraints — physics, budget, usability. Film is the same. Constraints sharpen decision-making. <strong>Limitations often produce stronger work.</strong></p>
                <p>Industrial design did not distract me from filmmaking. It strengthened my structural clarity. <strong>Cinema is not chaos. It is engineered emotion.</strong></p>
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
                <p>Atmosphere collapses when characters explain everything. Strong rhythm allows visual storytelling to dominate. Editing controls psychological pacing.</p>
                <h3>5. Tonal Consistency</h3>
                <p>Atmosphere fails when tonal language shifts randomly. Light, sound, framing, performance — all must belong to the same emotional ecosystem.</p>
                <p><strong>Good atmosphere is not added during post-production. It is designed from the first idea.</strong> Atmosphere is engineered emotion.</p>
            `
        },
        {
            category: "Strategy",
            title: "Color Psychology in Motion: How to Choose Palettes",
            keywords: "color psychology motion design, seo color trends 2026, emotional color palettes",
            content: `
                <p><strong>Does color directly affect your SEO? No—but it powerfully shapes how users feel, stay, and engage with your motion content.</strong></p>
                <p>When a client asks for a "trustworthy" brand video or an "exciting" product reveal, your first instinct might be to reach for blue or red. But in 2026, color choices matter beyond aesthetics—they're strategic levers that influence user engagement metrics search engines now prioritize.</p>
                <h3>The 2026 Reality: User Experience Is SEO</h3>
                <p>Search in 2026 has shifted firmly toward substance, credibility, and genuine usefulness. Google's E-E-A-T framework is now essential. When viewers trust your visuals and stay engaged, you're sending positive signals that search engines interpret as "this content is valuable."</p>
                <h3>Color Psychology Cheat Sheet for Motion Designers</h3>
                <ul>
                    <li><strong>Blue:</strong> Trust, security. Best for Financial, Healthcare. Trend: Dark mode with neon accents.</li>
                    <li><strong>Red/Orange:</strong> Excitement, urgency. Best for CTAs. Trend: High contrast, clashing combinations.</li>
                    <li><strong>Green:</strong> Growth, harmony. Best for Sustainability. Trend: Luminescent greens.</li>
                    <li><strong>Black/Dark:</strong> Premium, power. Best for Luxury. Trend: Glassmorphism with subtle pops.</li>
                </ul>
                <h3>How to Apply Color Psychology</h3>
                <p><strong>1. Start with the emotion:</strong> Ask "What should the audience feel in the first 5 seconds?"</p>
                <p><strong>2. Consider cultural context:</strong> Colors carry different meanings globally. Research cultural associations.</p>
                <p><strong>3. Test for readability:</strong> Poor contrast frustrates viewers. Verify text stands out, especially for mobile.</p>
                <p><strong>The Bottom Line:</strong> Choose colors that align with your emotional goal and test well with your audience. When you do this, viewers stay longer, which search engines reward.</p>
            `
        },
        {
            category: "Technique",
            title: "Directing the Viewer's Eye: Light, Movement, Composition",
            keywords: "visual attention motion design, directing eye movement video, composition techniques",
            content: `
                <p><strong>In a world where viewers decide within seconds whether to stay or scroll, controlling attention isn't just an art—it's a competitive advantage.</strong></p>
                <p>Sixty seconds isn't much time. But with intentional visual direction, you can guide viewers through a complete emotional journey.</p>
                <h3>The Science of Visual Attention</h3>
                <p>Research shows eyes are drawn to: <strong>Brightness and contrast, Movement, Faces and eyes, Leading lines.</strong></p>
                <h3>5 Director's Techniques for Attention Control</h3>
                <p><strong>1. Start with a visual hook:</strong> In the first 2-3 seconds, establish a focal point that demands attention.</p>
                <p><strong>2. Use light as a spotlight:</strong> Keep backgrounds darker or less saturated than your subject. Dark mode with neon accents is perfect for this.</p>
                <p><strong>3. Create leading lines:</strong> Arrange elements so composition lines point toward your key message.</p>
                <p><strong>4. Time your reveals:</strong> Don't show everything at once. Reveal information sequentially.</p>
                <p><strong>5. Match movement to meaning:</strong> Fast movements signal urgency; slow movements feel premium.</p>
                <h3>Composition Frameworks That Work</h3>
                <ul>
                    <li><strong>Rule of Thirds:</strong> Balanced, open.</li>
                    <li><strong>Z-Pattern:</strong> Flows from top-left to bottom-right. Essential for mobile.</li>
                    <li><strong>Center Framing:</strong> Maximum impact, removes ambiguity.</li>
                </ul>
                <p><strong>Practical Exercise:</strong> Watch your last 60-second spot. Pause every 5 seconds and ask: "Where am I looking?" If it's not where you intended, refine it.</p>
            `
        },
        {
            category: "Editing",
            title: "Building Rhythm: Making Corporate Videos Feel Cinematic",
            keywords: "cinematic editing techniques, video pacing rhythm, corporate video editing tips",
            content: `
                <p><strong>Corporate videos don't have to feel like corporate videos.</strong> With intentional rhythm and pacing, you can transform product demos into emotionally resonant experiences.</p>
                <p>Rhythm isn't about cutting fast—it's about cutting right. In 2026, the human touch of intentional pacing is your differentiator.</p>
                <h3>The Three Layers of Rhythmic Editing</h3>
                <p><strong>1. Visual Rhythm:</strong> Cutting on beats, matching movement, shape language.</p>
                <p><strong>2. Emotional Rhythm:</strong> Building tension and release. Contrasting loud/quiet, fast/slow.</p>
                <p><strong>3. Auditory Rhythm:</strong> Sound design as a rhythmic partner. Sync matters more than ever.</p>
                <h3>5 Techniques for Cinematic Corporate Editing</h3>
                <p><strong>1. Start wide, then go deep:</strong> Establish the scene, then move closer.</p>
                <p><strong>2. Use J-cuts and L-cuts:</strong> Let audio lead or trail the visual for seamless flow.</p>
                <p><strong>3. Build rhythmic patterns:</strong> Variation creates interest (e.g., 12 frames, 12, 24, 12).</p>
                <p><strong>4. Cut on movement:</strong> The motion masks the cut, making it feel invisible.</p>
                <p><strong>5. Create pacing contrast:</strong> Alternate fast montages with slow observational moments.</p>
                <p><strong>From Corporate to Captivating:</strong> Identify the emotional arc, map your pacing to it, and layer in sound design. When you master rhythm, "corporate" becomes "cinematic."</p>
            `
        },
        {
            category: "Storytelling",
            title: "From Brief to Narrative: Finding the Story",
            keywords: "video storytelling framework, product reveal narrative, brand intro storytelling",
            content: `
                <p><strong>Every product has a story. sometimes it's hiding.</strong> A client brief often lists features. Your job is to turn a spec sheet into a narrative.</p>
                <p>In 2026, content needs to be "action-led." Storytelling is how you transform information into influence.</p>
                <h3>The 5-Step Brief-to-Narrative Framework</h3>
                <p><strong>1. Find the human truth:</strong> Behind every product is a human need. What does this really do for people?</p>
                <p><strong>2. Identify the emotional arc:</strong> How should viewers feel? Beginning (Curiosity) -> Middle (Hope) -> End (Satisfaction).</p>
                <p><strong>3. Choose your narrative lens:</strong> User journey? Problem-solution? Metaphor?</p>
                <p><strong>4. Structure for retention:</strong> Hook (3s) -> Context (10s) -> Core Message (30s) -> Resolution (10s).</p>
                <p><strong>5. Translate to visual language:</strong> Only now do you think about shots. Each visual must serve the narrative.</p>
                <h3>Example: Transforming a Generic Brief</h3>
                <p><strong>Generic:</strong> "Show project management features."</p>
                <p><strong>Narrative:</strong> Hook: Overwhelmed Creative Director. Context: "Somewhere in this chaos is your best work." Core: Show streamlined dashboard. Resolution: Calm director sipping coffee.</p>
                <p><strong>Why This Matters:</strong> When videos tell genuine stories, viewers watch longer, remember more, and trust your brand.</p>
            `
        },
        {
            category: "Mood",
            title: "Why Atmosphere Matters: Creating Mood That Supports",
            keywords: "video atmosphere mood, cinematic lighting mood, sound design atmosphere",
            content: `
                <p><strong>Atmosphere is the invisible storyteller.</strong> When done right, viewers feel it without noticing it. It tells viewers how to feel before they understand what they're seeing.</p>
                <h3>The Building Blocks of Atmosphere</h3>
                <p><strong>Lighting:</strong> High-key (open, honest), Low-key (dramatic, premium), Warm (nostalgic), Cool (professional).</p>
                <p><strong>Color Palette:</strong> Desaturated (serious), Saturated (energetic), Monochromatic (focused).</p>
                <p><strong>Texture and Depth:</strong> Smooth vs. Rough. Depth of field focuses attention.</p>
                <p><strong>Sound Design:</strong> Ambient textures, musical key, silence. Sound is 50% of the experience.</p>
                <h3>The Atmosphere Checklist</h3>
                <ul>
                    <li><strong>Does it match the message?</strong> Security software shouldn't look ominous.</li>
                    <li><strong>Is it consistent?</strong> Don't shift rules randomly.</li>
                    <li><strong>Does anything distract?</strong> Remove elements that don't contribute.</li>
                </ul>
                <p><strong>2026 Trend: Purposeful Atmosphere.</strong> Don't just chase trends. Use atmosphere to authentically express the brand's energy.</p>
            `
        },
        {
            category: "Technical Insights",
            title: "The Art of the 3D Loop: Infinite Motion Design",
            keywords: "3d loop design tips, seamless motion loops, satisfying 3d animation",
            content: `
                <p><strong>Perfect loops are hypnotic.</strong> They feel both endless and intentional. In 2026, loop design is increasingly valuable for social media, digital signage, and web heroes.</p>
                <h3>The Psychology of Satisfying Loops</h3>
                <p>Our brains seek patterns. The best loops have clear phases, build anticipation, and resolve completely without loose ends.</p>
                <h3>Technical Principles</h3>
                <p><strong>Match start and end states:</strong> Frames must be identical. Position, rotation, lighting.</p>
                <p><strong>Use cyclic motion:</strong> Oscillations and 360° rotations naturally loop.</p>
                <p><strong>Hide the seam:</strong> Make the loop point visually busy or fast to mask the transition.</p>
                <h3>Creative Approaches</h3>
                <ul>
                    <li><strong>Product Reveals:</strong> Loop angles, lighting sweeps.</li>
                    <li><strong>Brand Intros:</strong> Assemble, hold, disassemble.</li>
                    <li><strong>Ambient:</strong> Abstract shapes, slow movement.</li>
                </ul>
                <p><strong>From Good to Great:</strong> Intentionality. If it's a product, show something useful. If ambient, be calm. When viewers watch multiple times, you've achieved the art of the loop.</p>
            `
        },
        {
            category: "Post-Production",
            title: "Beyond the Render: My Post-Production Workflow",
            keywords: "post-production workflow 3d, cinematic compositing tips, color grading motion design",
            content: `
                <p><strong>The render is just the beginning.</strong> Post-production is where raw material becomes cinema. The human touch in post is your competitive advantage.</p>
                <h3>My 5-Stage Workflow</h3>
                <p><strong>1. Render Optimization:</strong> Separate passes (beauty, shadow, reflection). High res, proper color space.</p>
                <p><strong>2. Compositing (The Assembly):</strong> Rebuild the shot. Add atmosphere (fog, dust) in post. Fix issues.</p>
                <p><strong>3. Color Grading (The Mood):</strong> Primary correction, secondary grading (make that blue pop), look development.</p>
                <p><strong>4. Polish and Effects:</strong> Grain/texture, sharpening, lens effects (chromatic aberration, glow), motion blur.</p>
                <p><strong>5. Sound Design:</strong> Ambient bed, spot effects, music, mix.</p>
                <p><strong>Why This Matters:</strong> This systematic approach ensures every pixel serves the story. It's why the work looks "cinematic" and consistent.</p>
            `
        },
        {
            category: "Strategy",
            title: "Simplicity vs. Complexity: Making the Right Choice",
            keywords: "motion design complexity vs simplicity, strategic design choices, 3d simulation vs minimal",
            content: `
                <p><strong>More isn't always better.</strong> Sometimes the most powerful motion is the simplest. The choice is strategic.</p>
                <h3>The Case for Complexity</h3>
                <p>Communicates craftsmanship, immersion, premium value. Best for: Hero product reveals (Gold package), Fantasy/Sci-Fi, Spectacle.</p>
                <h3>The Case for Simplicity</h3>
                <p>Communicates clarity, confidence, speed. Best for: Social media loops (Basic package), Explainers, Mobile-first viewing.</p>
                <h3>The Decision Framework</h3>
                <p>Ask: What's the goal? (Wow vs. Understand). Where will it be viewed? (Cinema vs. Mobile). How long do viewers have? (60s vs. 15s).</p>
                <p><strong>Finding the Balance:</strong> Often the answer is strategic complexity in a simple frame—a clean scene with one beautifully detailed element.</p>
                <p><strong>The Bottom Line:</strong> Choose complexity for immersion. Choose simplicity for clarity.</p>
            `
        },
        {
            category: "Case Study",
            title: "Behind the Scenes: A Personal Project Case Study",
            keywords: "motion design case study, personal project breakdown, creative process sharing",
            content: `
                <p><strong>Sometimes the best learning happens outside client work.</strong> Personal projects are laboratories where we fail safely and discover new approaches.</p>
                <p>Sharing your process builds authority. Clients want to understand how you think.</p>
                <h3>The Breakdown</h3>
                <p><strong>The Concept:</strong> What I set out to create and why.</p>
                <p><strong>The Challenge:</strong> What made this difficult? A simulation? Lighting?</p>
                <p><strong>The Solution:</strong> How I solved it using specific software and techniques.</p>
                <p><strong>What I Learned:</strong> Takeaways for future client work.</p>
                <p><strong>Why Share This?</strong> Clients see the thinking. Other creators learn. I clarify my own approach. Authenticity is rewarded.</p>
            `
        },
        {
            category: "Process",
            title: "What Is a Motion Design \"System\"?",
            keywords: "motion design systems, scalable design framework, brand consistency motion",
            content: `
                <p><strong>Creativity without structure is chaos.</strong> I approach every project as both a creative work and a system. This delivers reliable, resonant results.</p>
                <h3>The 5 Layers of a Motion System</h3>
                <p><strong>1. Strategic Foundation:</strong> Core message, emotional goal, metrics.</p>
                <p><strong>2. Visual Language:</strong> Color, typography, shape, texture.</p>
                <p><strong>3. Motion Principles:</strong> Easing, timing, transitions, rhythm.</p>
                <p><strong>4. Production Framework:</strong> Templates, style guides, review process.</p>
                <p><strong>5. Quality Assurance:</strong> Checklists, testing, revisions.</p>
                <p><strong>Benefits:</strong> Clients get consistency and efficiency. I get creative freedom because the structural decisions are already made. It's the difference between motion design and motion design with intention.</p>
            `
        },
        {
            category: "Client Education",
            title: "My Creative Process: From Concept to Delivery",
            keywords: "creative process steps, motion design workflow client guide, working with animators",
            content: `
                <p><strong>Creative work shouldn't be mysterious.</strong> Here's exactly how I work, so you know what to expect at every step.</p>
                <h3>The 6 Stages</h3>
                <p><strong>1. Discovery (Days 1-3):</strong> Goals, brand, timeline. You get a clear scope.</p>
                <p><strong>2. Concept Development (Days 4-7):</strong> Mood boards, narrative outlines. You get 2-3 directions.</p>
                <p><strong>3. Design & Storyboard (Days 8-14):</strong> Detailed boards, style frames. You review before animation starts.</p>
                <p><strong>4. Production (Days 15-30+):</strong> Modeling, animation, sound. You get milestone reviews.</p>
                <p><strong>5. Revision & Refinement (Days 31-35):</strong> Structured feedback rounds. Fine-tuning.</p>
                <p><strong>6. Final Delivery (Day 36+):</strong> Final renders, assets. Celebration!</p>
                <p><strong>Why This Works:</strong> No surprises. Quality control at every step. Efficiency. Great results because we planned before we built.</p>
            `
        },
        {
            category: "Client Guide",
            title: "Choosing the Right Package: Basic vs Standard vs Gold",
            keywords: "motion design pricing packages, choosing video animation service, video marketing budget",
            content: `
                <p><strong>Not every project needs the full cinematic treatment.</strong> The right package matches your strategic goals.</p>
                <h3>The Packages</h3>
                <p><strong>Basic ($500):</strong> Social media loops, simple messages. Fast turnaround (5 days). Best for Instagram/TikTok.</p>
                <p><strong>Standard ($1,000):</strong> Product reveals, explainers. Commerical rights. Sound design included. Best for Website Heroes, Launches.</p>
                <p><strong>Gold ($2,000):</strong>  Major campaigns. Complex simulations, unlimited revisions. Best for Multi-platform assets.</p>
                <h3>How to Choose</h3>
                <p>Ask: Where will it be seen? What's the goal? (Awareness vs. Emotion). What's the timeline?</p>
                <p><strong>My Commitment:</strong> Whatever you choose, you get my full attention and quality work that serves your goals.</p>
            `
        },
        {
            category: "Client Guide",
            title: "The Value of Revision Rounds",
            keywords: "creative feedback process, video revision guide, working with designers feedback",
            content: `
                <p><strong>Revisions aren't about fixing mistakes—they're about refinement.</strong> They take good work and make it great.</p>
                <h3>My Revision Philosophy</h3>
                <p><strong>Round 1 (Foundation):</strong> Big picture. Story, structure. Does the concept work?</p>
                <p><strong>Round 2 (Refinement):</strong> Details. Color, timing, sound polish.</p>
                <p><strong>Gold Package:</strong> Unlimited rounds until it's perfect.</p>
                <h3>How to Give Great Feedback</h3>
                <p>Be specific ("The blue is too cold"). Reference goals ("Our brand is warmer"). Prioritize. Trust the process.</p>
                <p><strong>The Bottom Line:</strong> You're not buying "fixes." You're buying a partnership to ensure the work is exactly right.</p>
            `
        }
    ];

    const blogModal = document.getElementById('blogModal');
    const blogModalBody = document.getElementById('blogModalBody');
    const closeBlogBtn = document.querySelector('.close-blog');

    // Function to render the blog grid dynamically
    function renderBlogGrid() {
        const blogGrid = document.querySelector('.blog-grid');
        if (!blogGrid) return;

        blogGrid.innerHTML = ''; // Clear existing content

        blogPosts.forEach((post, index) => { // Use all posts
            const article = document.createElement('article');
            article.className = 'blog-card';
            article.onclick = () => openBlogModal(index); // Use index from loop

            // Create a short excerpt from content (strip HTML)
            const tmpDiv = document.createElement('div');
            tmpDiv.innerHTML = post.content;
            const textContent = tmpDiv.textContent || tmpDiv.innerText || "";
            const excerpt = textContent.substring(0, 100) + '...';

            article.innerHTML = `
                <div class="blog-content">
                    <span class="blog-category">${post.category}</span>
                    <h3>${post.title}</h3>
                    <p>${excerpt}</p>
                    <span class="read-more">Read Article &rarr;</span>
                </div>
            `;
            blogGrid.appendChild(article);
        });
    }

    // Call render function on load
    renderBlogGrid();

    window.openBlogModal = function (index) {
        const post = blogPosts[index];
        if (!post) return;

        const htmlContent = `
            <div class="article-header">
                <span class="article-category">${post.category}</span>
                <h2 class="article-title">${post.title}</h2>
            </div>
            <div class="article-body">
                ${post.content}
            </div>
        `;

        if (blogModalBody) blogModalBody.innerHTML = htmlContent;
        if (blogModal) {
            blogModal.classList.add('active');

            // Ensure modal starts at the top
            blogModal.scrollTop = 0;
        }
    }

    if (closeBlogBtn) {
        closeBlogBtn.addEventListener('click', () => {
            if (blogModal) blogModal.classList.remove('active');
            // document.body.style.overflow = ''; // Removed scroll lock
        });
    }

    // Close on outside click for blog modal
    if (blogModal) {
        blogModal.addEventListener('click', (e) => {
            if (e.target === blogModal) {
                blogModal.classList.remove('active');
                // document.body.style.overflow = ''; // Removed scroll lock
            }
        });
    }

});
