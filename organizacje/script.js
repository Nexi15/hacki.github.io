const ADMIN_PASSWORD = "1312"; // <-- TUTAJSZE HASŁO DO PANELU ADMINA
let isAdmin = false;

let orgs = JSON.parse(localStorage.getItem('lostmc_orgs_v3')) || [
    {
        id: 1,
        name: "THE LOST MC",
        logo: "https://i.imgur.com/2XyZ5yB.png",
        specialItem: "Ciężka Kamizelka Taktyczna",
        desc: "Klub motocyklowy stacjonujący na obszarze Stab City oraz Blaine County.",
        crafts: [
            { 
                item: "Pistolet Heavy", 
                reqs: "50x Stal, 10x Części broni, 2x Sprężyna", 
                img: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400" 
            }
        ]
    }
];

let currentTab = orgs[0]?.id || null;

function saveDataSilent() { localStorage.setItem('lostmc_orgs_v3', JSON.stringify(orgs)); }
function saveDataFull() { localStorage.setItem('lostmc_orgs_v3', JSON.stringify(orgs)); renderTabs(); renderContent(); }

function toggleAdminModal() {
    if (isAdmin) {
        isAdmin = false;
        document.getElementById('adminLoginBtn').innerText = "🔐 PANEL ADMINA";
        document.getElementById('adminLoginBtn').classList.remove('active');
        document.getElementById('addOrgBtn').classList.add('hidden');
        renderContent();
    } else {
        document.getElementById('adminModal').classList.remove('hidden');
    }
}

function loginAdmin() {
    const input = document.getElementById('adminPasswordInput').value;
    if (input === ADMIN_PASSWORD) {
        isAdmin = true;
        document.getElementById('adminModal').classList.add('hidden');
        document.getElementById('adminLoginBtn').innerText = "🔓 VYLOGUJ ADMINA";
        document.getElementById('adminLoginBtn').classList.add('active');
        document.getElementById('addOrgBtn').classList.remove('hidden');
        document.getElementById('adminPasswordInput').value = '';
        renderContent();
    } else {
        alert("Błędne hasło!");
    }
}

function renderTabs() {
    const list = document.getElementById('tabsList');
    list.innerHTML = '';
    orgs.forEach(org => {
        const btn = document.createElement('button');
        btn.className = `tab-item ${org.id === currentTab ? 'active' : ''}`;
        btn.id = `tab-btn-${org.id}`;
        btn.innerText = org.name || "BEZ NAZWY";
        btn.onclick = () => {
            currentTab = org.id;
            renderTabs();
            renderContent();
        };
        list.appendChild(btn);
    });
}

function renderContent() {
    const area = document.getElementById('mainDisplay');
    const org = orgs.find(o => o.id === currentTab);

    if (!org) {
        area.innerHTML = '<div style="color: var(--muted); text-align: center; padding: 40px;">Wybierz lub dodaj organizację.</div>';
        return;
    }

    if (!isAdmin) {
        // WIDOK DLA GRACZY (TYLKO ODCZYT)
        area.innerHTML = `
            <div class="org-profile-header">
                <img src="${org.logo || 'https://via.placeholder.com/90'}" class="org-logo-preview" onerror="this.src='https://via.placeholder.com/90'">
                <div class="org-title-area">
                    <h1>${org.name}</h1>
                    ${org.specialItem ? `<span class="badge-special">⭐ ${org.specialItem}</span>` : ''}
                </div>
            </div>

            <div class="section-label">O FRAKCJI</div>
            <div class="org-description">${org.desc || 'Brak opisu.'}</div>

            <div class="section-label">🔨 DOSTĘPNY CRAFTING</div>
            <div class="crafts-grid">
                ${org.crafts.map(c => `
                    <div class="craft-view-card">
                        ${c.img ? `<img src="${c.img}" class="craft-img" onerror="this.style.display='none'">` : ''}
                        <div class="craft-info">
                            <div class="craft-title">${c.item || 'Brak nazwy'}</div>
                            <div class="craft-reqs"><strong>Składniki:</strong><br>${c.reqs || 'Brak wymagań'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // WIDOK EDYCJI DLA ADMINA
        area.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                <h2>EDYCJA: ${org.name}</h2>
                <button class="btn-danger" onclick="deleteOrg(${org.id})">USUŃ ORGANIZACJĘ</button>
            </div>

            <div class="form-group">
                <label>NAZWA ORGANIZACJI</label>
                <input type="text" value="${org.name}" oninput="updateName(${org.id}, this.value)">
            </div>

            <div class="form-group">
                <label>URL LOGO (ZDJĘCIE FRAKCJI)</label>
                <input type="text" placeholder="https://..." value="${org.logo || ''}" oninput="updateField(${org.id}, 'logo', this.value)">
            </div>

            <div class="form-group">
                <label>UNIKALNY PRZEDMIOT</label>
                <input type="text" placeholder="np. Pistolet Vintage" value="${org.specialItem || ''}" oninput="updateField(${org.id}, 'specialItem', this.value)">
            </div>

            <div class="form-group">
                <label>OPIS / TEREN</label>
                <textarea rows="3" oninput="updateField(${org.id}, 'desc', this.value)">${org.desc}</textarea>
            </div>

            <div style="margin-top: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <label style="margin:0;">RECEPTURY CRAFTINGU</label>
                    <button class="btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="addCraft(${org.id})">+ DODAJ PRZEPIS</button>
                </div>
                ${org.crafts.map((c, index) => `
                    <div class="admin-card">
                        <div style="display:flex; gap:8px; margin-bottom:8px;">
                            <input type="text" placeholder="Nazwa przedmiotu" value="${c.item}" oninput="updateCraft(${org.id}, ${index}, 'item', this.value)">
                            <button class="btn-danger" onclick="removeCraft(${org.id}, ${index})">✕</button>
                        </div>
                        <input type="text" placeholder="URL Zdjęcia przedmiotu (https://...)" value="${c.img || ''}" oninput="updateCraft(${org.id}, ${index}, 'img', this.value)" style="margin-bottom:8px;">
                        <input type="text" placeholder="Wymagane materiały (np. 10x Stal)" value="${c.reqs}" oninput="updateCraft(${org.id}, ${index}, 'reqs', this.value)">
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function updateName(id, val) {
    const org = orgs.find(o => o.id === id);
    if (org) {
        org.name = val;
        saveDataSilent();
        const btn = document.getElementById(`tab-btn-${id}`);
        if (btn) btn.innerText = val || "BEZ NAZWY";
    }
}

function updateField(id, field, val) {
    const org = orgs.find(o => o.id === id);
    if (org) { org[field] = val; saveDataSilent(); }
}

function updateCraft(orgId, index, field, val) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.crafts[index]) { org.crafts[index][field] = val; saveDataSilent(); }
}

function addOrganization() {
    const newOrg = { id: Date.now(), name: "NOWA FRAKCJA", logo: "", specialItem: "", desc: "", crafts: [] };
    orgs.push(newOrg);
    currentTab = newOrg.id;
    saveDataFull();
}

function deleteOrg(id) {
    if (confirm("Usunąć frakcję?")) {
        orgs = orgs.filter(o => o.id !== id);
        currentTab = orgs[0]?.id || null;
        saveDataFull();
    }
}

function addCraft(orgId) {
    const org = orgs.find(o => o.id === orgId);
    if (org) { org.crafts.push({ item: "", reqs: "", img: "" }); saveDataFull(); }
}

function removeCraft(orgId, index) {
    const org = orgs.find(o => o.id === orgId);
    if (org) { org.crafts.splice(index, 1); saveDataFull(); }
}

renderTabs();
renderContent();
