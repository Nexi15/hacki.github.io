let orgs = JSON.parse(localStorage.getItem('lostmc_orgs')) || [
    {
        id: 1,
        name: "THE LOST MC",
        desc: "Klub motocyklowy kontrolujący północną część wyspy.",
        crafts: [
            { item: "Pistolet Heavy", reqs: "50x Stal, 10x Części broni, 2x Sprężyna" },
            { item: "Pancerz Lekki", reqs: "20x Kewlar, 5x Sznurek" }
        ]
    }
];

let currentTab = orgs[0]?.id || null;

function saveDataSilent() {
    localStorage.setItem('lostmc_orgs', JSON.stringify(orgs));
}

function saveDataFull() {
    localStorage.setItem('lostmc_orgs', JSON.stringify(orgs));
    renderTabs();
    renderContent();
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
    const area = document.getElementById('contentArea');
    const org = orgs.find(o => o.id === currentTab);

    if (!org) {
        area.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding-top: 40px;">Wybierz frakcję z listy po lewej lub utwórz nową.</div>';
        return;
    }

    area.innerHTML = `
        <div class="editor-header">
            <h2>${org.name}</h2>
            <button class="btn-danger" onclick="deleteOrg(${org.id})">USUŃ ORGANIZACJĘ</button>
        </div>

        <div class="form-group">
            <label>Nazwa Organizacji</label>
            <input type="text" value="${org.name}" oninput="updateName(${org.id}, this.value)">
        </div>

        <div class="form-group">
            <label>Opis i Terytorium</label>
            <textarea rows="3" oninput="updateField(${org.id}, 'desc', this.value)">${org.desc}</textarea>
        </div>

        <div class="crafting-panel">
            <div class="crafting-header">
                <label style="margin:0;">🔨 RECEPTURY CRAFTINGU</label>
                <button class="btn-primary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="addCraft(${org.id})">+ DODAJ PRZEPIS</button>
            </div>
            <div id="craftsContainer">
                ${org.crafts.map((c, index) => `
                    <div class="craft-card">
                        <div class="craft-row">
                            <input type="text" placeholder="Przedmiot (np. Heavy Pistol)" value="${c.item}" oninput="updateCraft(${org.id}, ${index}, 'item', this.value)">
                            <button class="btn-icon-danger" onclick="removeCraft(${org.id}, ${index})">✕</button>
                        </div>
                        <input type="text" placeholder="Wymagane składniki (np. 10x Stal, 2x Sprężyna)" value="${c.reqs}" oninput="updateCraft(${org.id}, ${index}, 'reqs', this.value)">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function updateName(id, value) {
    const org = orgs.find(o => o.id === id);
    if (org) {
        org.name = value;
        saveDataSilent();
        
        const tabBtn = document.getElementById(`tab-btn-${id}`);
        if (tabBtn) tabBtn.innerText = value || "BEZ NAZWY";
    }
}

function updateField(id, field, value) {
    const org = orgs.find(o => o.id === id);
    if (org) {
        org[field] = value;
        saveDataSilent();
    }
}

function updateCraft(orgId, index, field, value) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.crafts[index]) {
        org.crafts[index][field] = value;
        saveDataSilent();
    }
}

function addOrganization() {
    const newOrg = {
        id: Date.now(),
        name: "NOWA FRAKCJA",
        desc: "Opis frakcji...",
        crafts: []
    };
    orgs.push(newOrg);
    currentTab = newOrg.id;
    saveDataFull();
}

function deleteOrg(id) {
    if (confirm("Czy na pewno chcesz usunąć tę organizację?")) {
        orgs = orgs.filter(o => o.id !== id);
        currentTab = orgs[0]?.id || null;
        saveDataFull();
    }
}

function addCraft(orgId) {
    const org = orgs.find(o => o.id === orgId);
    if (org) {
        org.crafts.push({ item: "", reqs: "" });
        saveDataFull();
    }
}

function removeCraft(orgId, index) {
    const org = orgs.find(o => o.id === orgId);
    if (org) {
        org.crafts.splice(index, 1);
        saveDataFull();
    }
}

renderTabs();
renderContent();
