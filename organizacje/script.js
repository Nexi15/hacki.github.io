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

// Zapis bez przeładowywania interfejsu (brak gubienia ostrości)
function saveDataSilent() {
    localStorage.setItem('lostmc_orgs', JSON.stringify(orgs));
}

// Zapis z odświeżeniem (wywoływany przy zmianach strukturalnych)
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
        btn.className = `tab-btn ${org.id === currentTab ? 'active' : ''}`;
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
        area.innerHTML = '<p style="color: #666; font-size: 1.1rem;">Wybierz lub dodaj organizację z panelu po lewej.</p>';
        return;
    }

    area.innerHTML = `
        <div class="editor-card">
            <div class="editor-header">
                <h2>EDYCJA: ${org.name}</h2>
                <button class="delete-btn" onclick="deleteOrg(${org.id})">USUŃ ORGANIZACJĘ</button>
            </div>

            <div>
                <label>Nazwa Organizacji</label>
                <input type="text" value="${org.name}" oninput="updateName(${org.id}, this.value)">
            </div>

            <div>
                <label>Opis / Rejon</label>
                <textarea rows="3" oninput="updateField(${org.id}, 'desc', this.value)">${org.desc}</textarea>
            </div>

            <div class="craft-section">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <label style="margin:0;">🔨 RECUPERY / CRAFTING</label>
                    <button class="add-btn" style="padding: 4px 10px; font-size:0.8rem;" onclick="addCraft(${org.id})">+ DODAJ PRZEPIS</button>
                </div>
                <div id="craftsContainer">
                    ${org.crafts.map((c, index) => `
                        <div class="craft-item">
                            <div class="craft-row">
                                <input type="text" placeholder="Przedmiot (np. Pistolet)" value="${c.item}" oninput="updateCraft(${org.id}, ${index}, 'item', this.value)">
                                <button class="remove-craft-btn" onclick="removeCraft(${org.id}, ${index})">✕</button>
                            </div>
                            <input type="text" placeholder="Wymagane materiały (np. 10x Stal, 5x Miedź)" value="${c.reqs}" oninput="updateCraft(${org.id}, ${index}, 'reqs', this.value)">
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function updateName(id, value) {
    const org = orgs.find(o => o.id === id);
    if (org) {
        org.name = value;
        saveDataSilent();
        
        // Aktualizacja nazwy na zakładce w panelu bocznym bez niszczenia pola tekstowego
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
        name: "NOWA ORGANIZACJA",
        desc: "Opis działania organizacji...",
        crafts: []
    };
    orgs.push(newOrg);
    currentTab = newOrg.id;
    saveDataFull();
}

function deleteOrg(id) {
    if (confirm("Na pewno chcesz usunąć tę organizację?")) {
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

// Inicjalizacja
renderTabs();
renderContent();
