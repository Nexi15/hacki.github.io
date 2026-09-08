// Domyślne dane (zapisywane w przeglądarce)
let orgs = JSON.parse(localStorage.getItem('lostmc_orgs')) || [
    {
        id: 1,
        name: "The Lost MC",
        desc: "Klub motocyklowy kontrolujący północną część wyspy.",
        crafts: [
            { item: "Pistolet Heavy", reqs: "50x Stal, 10x Części broni, 2x Sprężyna" },
            { item: "Pancerz Lekki", reqs: "20x Kewlar, 5x Sznurek" }
        ]
    }
];

let currentTab = orgs[0]?.id || null;

function saveData() {
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
        btn.innerText = org.name || "Bez nazwy";
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
        area.innerHTML = '<p style="color: #8a9ea8;">Wybierz lub dodaj organizację z panelu po lewej.</p>';
        return;
    }

    area.innerHTML = `
        <div class="editor-card">
            <div class="editor-header">
                <h2>Edycja: ${org.name}</h2>
                <button class="delete-btn" onclick="deleteOrg(${org.id})">Usuń organizację</button>
            </div>

            <div>
                <label>Nazwa Organizacji</label>
                <input type="text" value="${org.name}" oninput="updateField(${org.id}, 'name', this.value)">
            </div>

            <div>
                <label>Opis / Rejon</label>
                <textarea rows="3" oninput="updateField(${org.id}, 'desc', this.value)">${org.desc}</textarea>
            </div>

            <div class="craft-section">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <label style="margin:0;">🔨 CRAFTING</label>
                    <button class="add-btn" style="padding: 4px 8px; font-size:0.75rem;" onclick="addCraft(${org.id})">+ Dodaj Przepis</button>
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

function addOrganization() {
    const newOrg = {
        id: Date.now(),
        name: "Nowa Organizacja",
        desc: "Opis organizacji...",
        crafts: []
    };
    orgs.push(newOrg);
    currentTab = newOrg.id;
    saveData();
}

function deleteOrg(id) {
    if (confirm("Na pewno chcesz usunąć tę organizację?")) {
        orgs = orgs.filter(o => o.id !== id);
        currentTab = orgs[0]?.id || null;
        saveData();
    }
}

function updateField(id, field, value) {
    const org = orgs.find(o => o.id === id);
    if (org) {
        org[field] = value;
        saveData();
    }
}

function addCraft(orgId) {
    const org = orgs.find(o => o.id === orgId);
    if (org) {
        org.crafts.push({ item: "", reqs: "" });
        saveData();
    }
}

function updateCraft(orgId, index, field, value) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.crafts[index]) {
        org.crafts[index][field] = value;
        saveData();
    }
}

function removeCraft(orgId, index) {
    const org = orgs.find(o => o.id === orgId);
    if (org) {
        org.crafts.splice(index, 1);
        saveData();
    }
}

// Inicjalizacja
renderTabs();
renderContent();
