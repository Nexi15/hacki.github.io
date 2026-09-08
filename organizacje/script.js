let orgs = JSON.parse(localStorage.getItem('lostmc_orgs_v2')) || [
    {
        id: 1,
        name: "THE LOST MC",
        logo: "https://i.imgur.com/2XyZ5yB.png",
        specialItem: "Ciężka Kamizelka Taktyczna",
        desc: "Klub motocyklowy stacjonujący na terenie Stab City.",
        crafts: [
            { item: "Pistolet Heavy", reqs: "50x Stal, 10x Części broni, 2x Sprężyna" },
            { item: "Amunicja 9mm", reqs: "10x Proch, 5x Miedź" }
        ]
    }
];

let currentTab = orgs[0]?.id || null;

function saveDataSilent() {
    localStorage.setItem('lostmc_orgs_v2', JSON.stringify(orgs));
}

function saveDataFull() {
    localStorage.setItem('lostmc_orgs_v2', JSON.stringify(orgs));
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
        area.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 40px;">Wybierz lub stwórz nową organizację.</div>';
        return;
    }

    area.innerHTML = `
        <div class="workspace-header">
            <h2>${org.name}</h2>
            <button class="btn-delete" onclick="deleteOrg(${org.id})">USUŃ ORGANIZACJĘ</button>
        </div>

        <div class="grid-2">
            <div class="form-group">
                <label>NAZWA ORGANIZACJI</label>
                <input type="text" value="${org.name}" oninput="updateName(${org.id}, this.value)">
            </div>
            <div class="form-group">
                <label>UNIKALNY PRZEDMIOT FRAKCJI</label>
                <input type="text" placeholder="np. Specjalny Broń / Kamizelka" value="${org.specialItem || ''}" oninput="updateField(${org.id}, 'specialItem', this.value)">
            </div>
        </div>

        <div class="form-group">
            <label>URL LOGO / ZDJĘCIA ORGANIZACJI</label>
            <input type="text" placeholder="https://i.imgur.com/przykładowy-link.png" value="${org.logo || ''}" oninput="updateLogo(${org.id}, this.value)">
            <div class="image-preview-container" id="imgPreview">
                ${org.logo ? `<img src="${org.logo}" onerror="this.style.display='none'">` : `<span class="no-image">Brak wklejonego zdjęcia</span>`}
            </div>
        </div>

        <div class="form-group">
            <label>OPIS / OPIS REJONU</label>
            <textarea rows="3" oninput="updateField(${org.id}, 'desc', this.value)">${org.desc}</textarea>
        </div>

        <div class="crafting-section">
            <div class="crafting-header">
                <label style="margin:0;">🔨 RECEPTURY CRAFTINGU</label>
                <button class="btn-create" style="padding: 4px 10px; font-size: 0.75rem;" onclick="addCraft(${org.id})">+ DODAJ PRZEPIS</button>
            </div>
            <div id="craftsContainer">
                ${org.crafts.map((c, index) => `
                    <div class="craft-card">
                        <div class="craft-row">
                            <input type="text" placeholder="Wytwarzany przedmiot" value="${c.item}" oninput="updateCraft(${org.id}, ${index}, 'item', this.value)">
                            <button class="btn-remove" onclick="removeCraft(${org.id}, ${index})">✕</button>
                        </div>
                        <input type="text" placeholder="Wymagane materiały (np. 10x Stal, 5x Miedź)" value="${c.reqs}" oninput="updateCraft(${org.id}, ${index}, 'reqs', this.value)">
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

function updateLogo(id, value) {
    const org = orgs.find(o => o.id === id);
    if (org) {
        org.logo = value;
        saveDataSilent();
        const preview = document.getElementById('imgPreview');
        if (preview) {
            preview.innerHTML = value ? `<img src="${value}" onerror="this.style.display='none'">` : `<span class="no-image">Brak wklejonego zdjęcia</span>`;
        }
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
        logo: "",
        specialItem: "",
        desc: "Opis frakcji...",
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

renderTabs();
renderContent();
