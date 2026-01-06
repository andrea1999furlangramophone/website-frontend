// 1. Inject Footer on every page
document.addEventListener("DOMContentLoaded", function() {
    const footerHTML = `
        <div class="newsletter">
            <h3 data-key="news_title">Join the Inner Circle</h3>
            <p data-key="news_text">Be the first to know about secret venues.</p>
            <form class="newsletter-form">
                <input type="email" placeholder="Email...">
                <button type="submit" data-key="btn_signup">Sign Up</button>
            </form>
        </div>
        
        <div class="social-icons">
            <a href="https://www.facebook.com/YOUR_PAGE" target="_blank"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.instagram.com/YOUR_PAGE" target="_blank"><i class="fab fa-instagram"></i></a>
            <a href="https://www.youtube.com/YOUR_CHANNEL" target="_blank"><i class="fab fa-youtube"></i></a>
        </div>

        <div class="copyright">
            &copy; 2026 Koncertna udruga Gramophone. Buje, Istria.
        </div>
    `;

    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = footerHTML;
    } else {
        // If it's the home page (which has a footer tag already), we append inside
        const existingFooter = document.querySelector("footer");
        if(existingFooter && !existingFooter.innerHTML.includes("social-icons")) {
             // Logic for home page if needed, but home page structure is slightly different
             // For simplicity, let's keep home page footer in index.html, 
             // but add the social links there manually or via this script.
             
             // Let's rely on the pages having id="footer-placeholder"
        }
    }
    
    // Load Language
    const savedLang = localStorage.getItem('preferredLang') || 'hr';
    setLanguage(savedLang);

    // Mobile hamburger toggle
    const hamb = document.querySelector('.hamburger');
    const navEl = document.querySelector('nav');
    if(hamb && navEl) {
        hamb.addEventListener('click', function() {
            const isOpen = navEl.classList.toggle('open');
            hamb.setAttribute('aria-expanded', String(!!isOpen));
        });
        // Close menu when a navigation link is clicked
        document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', function(){
            navEl.classList.remove('open');
            hamb.setAttribute('aria-expanded','false');
        }));
    }
});

// 2. Language Logic
function setLanguage(lang) {
    // Update Text
    const elements = document.querySelectorAll('[data-key]');
    elements.forEach(element => {
        const key = element.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Update Buttons
    const buttons = document.querySelectorAll('.lang-switch span');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.getElementById('btn-' + lang);
    if(activeBtn) activeBtn.classList.add('active');

    localStorage.setItem('preferredLang', lang);
}

// ===== Events manager (CRUD) =====
document.addEventListener('DOMContentLoaded', function() {
    initEventsManager();
});

function initEventsManager() {
    const addBtn = document.getElementById('btn-add-concert');
    const eventsList = document.getElementById('events-list');
    if(!eventsList) return;

    // Admin UI elements
   

    // Modal elements
    const infoModal = document.getElementById('info-modal');
    const infoBody = document.getElementById('info-body');
    const infoClose = document.getElementById('info-close');
    const formModal = document.getElementById('form-modal');
    const formClose = document.getElementById('form-close');
    const formCancel = document.getElementById('form-cancel');
    const concertForm = document.getElementById('concert-form');

    // Admin functionality removed — ensure admin-only UI elements are hidden
    function updateAdminUI() {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('show'));
        if(addBtn) addBtn.remove();
        const btnAdmin = document.getElementById('btn-admin'); if(btnAdmin) btnAdmin.remove();
        const btnLogout = document.getElementById('btn-logout'); if(btnLogout) btnLogout.remove();
    }

    // Standard modal wiring
    // admin add button removed above; keep modal close wiring
    infoClose && infoClose.addEventListener('click', () => hideModal(infoModal));
    formClose && formClose.addEventListener('click', () => hideModal(formModal));
    formCancel && formCancel.addEventListener('click', () => hideModal(formModal));

    concertForm && concertForm.addEventListener('submit', function(e){
        e.preventDefault();
        const fd = new FormData(concertForm);
        const data = {
            id: concertForm.dataset.editId || Date.now().toString(),
            day: fd.get('day'),
            month: fd.get('month'),
            time: fd.get('time'),
            title: fd.get('title'),
            location: fd.get('location'),
            description: fd.get('description')
        };
        saveConcert(data);
        hideModal(formModal);
        renderConcerts();
    });

    // Render initially
    updateAdminUI();
    renderConcerts();

    // Wire any existing static Info buttons (for static cards present in HTML)
    function wireStaticInfoButtons() {
        document.querySelectorAll('.info-btn').forEach(btn => {
            // avoid attaching duplicate listeners
            if (btn.dataset.wired) return;
            btn.dataset.wired = '1';
            btn.addEventListener('click', function() {
                const card = btn.closest('.event-card');
                if(!card) return;
                const day = card.querySelector('.date-box .day')?.textContent.trim() || '';
                const month = card.querySelector('.date-box .month')?.textContent.trim() || '';
                const title = card.querySelector('.event-details h3')?.textContent.trim() || '';
                const locText = card.querySelector('.event-details span')?.textContent.trim() || '';
                let location = locText;
                let time = '';
                if (locText.includes('|')) {
                    const parts = locText.split('|').map(s => s.trim());
                    location = parts[0] || '';
                    time = parts[1] || '';
                }
                // If the card contains a hidden .info-content, use its innerHTML as modular content
                const infoHtmlEl = card.querySelector('.info-content');
                const html = infoHtmlEl ? infoHtmlEl.innerHTML.trim() : '';
                const concert = { id: 'static', day, month, time, title, location, description: '', html };
                openInfoModal(concert);
            });
        });
    }

    // run once to wire static buttons in the DOM
    wireStaticInfoButtons();

    function getConcerts() {
        const raw = localStorage.getItem('concerts');
        if(!raw) {
            // Do not inject a sample event automatically; return empty list so static events remain authoritative.
            return [];
        }
        try { return JSON.parse(raw); } catch(e){ return []; }
    }

    function saveConcert(concert) {
        const list = getConcerts().filter(c => c.id !== concert.id);
        list.push(concert);
        localStorage.setItem('concerts', JSON.stringify(list));
    }

    function deleteConcert(id) {
        const list = getConcerts().filter(c => c.id !== id);
        localStorage.setItem('concerts', JSON.stringify(list));
        renderConcerts();
    }

    function renderConcerts() {
        const list = getConcerts();
        // Render only the dynamic (good) events from localStorage; ignore any static DOM event-cards
        eventsList.innerHTML = '';
        if (!list || !list.length) return;
        list.sort((a,b) => String(a.id).localeCompare(String(b.id)));
        const admin = false;
        list.forEach(concert => {
            const card = document.createElement('div');
            card.className = 'event-card';

            const dateBox = document.createElement('div');
            dateBox.className = 'date-box';
            dateBox.innerHTML = `<span class="day">${concert.day}</span><span class="month">${concert.month}</span>`;

            const details = document.createElement('div');
            details.className = 'event-details';
            details.innerHTML = `<h3>${concert.title}</h3><span>${concert.location} ${concert.time ? '| ' + concert.time : ''}</span><br>`;

            const mapLink = document.createElement('a');
            mapLink.className = 'map-link';
            mapLink.href = 'https://maps.google.com/?q=Buje';
            mapLink.target = '_blank';
            mapLink.textContent = 'View Map';
            details.appendChild(mapLink);

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '8px';

            // Tickets link (per-event if provided, otherwise default to Entrio)
            const ticketsLink = document.createElement('a');
            ticketsLink.className = 'btn btn-primary';
            ticketsLink.href = concert.tickets || 'https://www.entrio.hr';
            ticketsLink.target = '_blank';
            ticketsLink.textContent = 'Tickets';
            actions.appendChild(ticketsLink);

            const infoBtn = document.createElement('button');
            infoBtn.className = 'btn btn-primary';
            infoBtn.textContent = 'Info';
            infoBtn.addEventListener('click', () => openInfoModal(concert));

            actions.appendChild(infoBtn);

            if(admin) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn';
                editBtn.textContent = 'Edit';
                editBtn.addEventListener('click', () => openFormModal(concert));

                const delBtn = document.createElement('button');
                delBtn.className = 'btn';
                delBtn.textContent = 'Delete';
                delBtn.addEventListener('click', () => {
                    if(confirm('Delete this concert?')) deleteConcert(concert.id);
                });

                actions.appendChild(editBtn);
                actions.appendChild(delBtn);
            }

            card.appendChild(dateBox);
            card.appendChild(details);
            card.appendChild(actions);

            eventsList.appendChild(card);
        });
    }

    function openInfoModal(concert) {
        // Build a modular modal: title, metadata, and HTML content (if provided)
        function esc(s){ return String(s || '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

        const title = esc(concert.title || '');
        const day = esc(concert.day || '');
        const month = esc(concert.month || '');
        const time = esc(concert.time || '');
        const location = esc(concert.location || '');

        // If `html` exists, insert as raw HTML into the .info-html container.
        const customHtml = concert.html || '';

        infoBody.innerHTML = `
            <h2>${title}</h2>
            <p><strong>Date:</strong> ${day} ${month} ${time ? '| ' + time : ''}</p>
            <p><strong>Location:</strong> ${location}</p>
            <div class="info-html">${customHtml || (concert.description ? '<p>' + esc(concert.description) + '</p>' : '')}</div>
        `;
        showModal(infoModal);
    }

    function openFormModal(concert) {
        // Admin UI removed — this function is a no-op.
        return;
    }

    function showModal(el) { if(!el) return; el.classList.remove('hidden'); el.setAttribute('aria-hidden', 'false'); }
    function hideModal(el) { if(!el) return; el.classList.add('hidden'); el.setAttribute('aria-hidden', 'true'); }
}