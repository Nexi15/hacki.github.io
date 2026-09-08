const ADMIN_PASSWORD = "1312";
let isAdmin = false;

let orgs = JSON.parse(localStorage.getItem('lostmc_orgs_v4')) || [
    {
        id: 1,
        name: "THE LOST MC",
        logo: "https://i.imgur.com/2XyZ5yB.png",
        specialItem: "Broń Długa",
        desc: "Klub motocyklowy stacjonujący na obszarze Stab City oraz Blaine County.",
        recipes: [
            {
                resultName: "Pistolet Heavy",
                resultImg: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400",
                ingredients: [
                    { name: "Stal", count: "50x", img: "https://via.placeholder.com/60" },
                    { name: "Sprężyna", count: "2x", img: "https://via.placeholder.com/60" }
                ]
            }
        ]
    }
];

let currentTab = orgs[0]?.id || null;

function saveDataSilent() { localStorage.setItem('lostmc_orgs_v4', JSON.stringify(orgs)); }
function saveDataFull() { localStorage.setItem('lostmc_orgs_v4', JSON.stringify(orgs)); renderTabs(); renderContent(); }

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
        document.getElementById('adminLoginBtn').innerText = "🔓 WYLOGUJ ADMINA";
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
        // WIDOK DLA GRACZY
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

            <div class="section-label">🔨 RECEPTURY CRAFTINGU</div>
            <div class="crafts-container">
                ${(org.recipes || []).map(r => `
                    <div class="recipe-card">
                        <div class="result-box">
                            <img src="${r.resultImg || 'https://via.placeholder.com/140'}" class="result-img" onerror="this.src='https://via.placeholder.com/140'">
                            <span class="result-title">${r.resultName || 'Przedmiot KOŃCOWY'}</span>
                        </div>
                        <div class="ingredients-list">
                            ${(r.ingredients || []).map(ing => `
                                <div class="ingredient-item">
                                    <img src="${ing.img || 'https://via.placeholder.com/48'}" class="ing-img" onerror="this.src='https://via.placeholder.com/48'">
                                    <div class="ing-details">
                                        <span class="ing-name">${ing.name || 'Składnik'}</span>
                                        <span class="ing-count">${ing.count || '1x'}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // PANEL ADMINA
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
                <label>URL LOGO ORGANIZACJI</label>
                <input type="text" value="${org.logo || ''}" oninput="updateField(${org.id}, 'logo', this.value)">
            </div>

            <div class="form-group">
                <label>UNIKALNY PRZEDMIOT</label>
                <input type="text" value="${org.specialItem || ''}" oninput="updateField(${org.id}, 'specialItem', this.value)">
            </div>

            <div class="form-group">
                <label>OPIS FRAKCJI</label>
                <textarea rows="3" oninput="updateField(${org.id}, 'desc', this.value)">${org.desc}</textarea>
            </div>

            <div style="margin-top: 24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <label style="margin:0;">RECEPTURY CRAFTINGU</label>
                    <button class="btn-primary" style="padding:4px 8px; font-size:0.75rem;" onclick="addRecipe(${org.id})">+ DODAJ RECEPTURĘ</button>
                </div>

                ${(org.recipes || []).map((r, rIdx) => `
                    <div class="admin-recipe-box">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <strong style="color:var(--red);">PRZEPIS #${rIdx + 1}</strong>
                            <button class="btn-danger" style="padding:2px 6px; font-size:0.7rem;" onclick="removeRecipe(${org.id}, ${rIdx})">USUŃ PRZEPIS</button>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:12px;">
                            <input type="text" placeholder="Nazwa wyniku (np. Pistolet)" value="${r.resultName}" oninput="updateRecipe(${org.id}, ${rIdx}, 'resultName', this.value)">
                            <input type="text" placeholder="URL Zdjęcia wyniku" value="${r.resultImg}" oninput="updateRecipe(${org.id}, ${rIdx}, 'resultImg', this.value)">
                        </div>

                        <label>SKŁADNIKI:</label>
                        ${(r.ingredients || []).map((ing, iIdx) => `
                            <div class="admin-ing-row">
                                <input type="text" placeholder="Nazwa (np. Stal)" value="${ing.name}" oninput="updateIngredient(${org.id}, ${rIdx}, ${iIdx}, 'name', this.value)">
                                <input type="text" placeholder="Ilość (np. 10x)" value="${ing.count}" style="width:90px;" oninput="updateIngredient(${org.id}, ${rIdx}, ${iIdx}, 'count', this.value)">
                                <input type="text" placeholder="URL Zdjęcia składnika" value="${ing.img}" oninput="updateIngredient(${org.id}, ${rIdx}, ${iIdx}, 'img', this.value)">
                                <button class="btn-danger" onclick="removeIngredient(${org.id}, ${rIdx}, ${iIdx})">✕</button>
                            </div>
                        `).join('')}
                        <button class="btn-sec" style="font-size:0.75rem; padding:4px 8px; margin-top:4px;" onclick="addIngredient(${org.id}, ${rIdx})">+ Dodaj Składnik</button>
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

function addOrganization() {
    const newOrg = { id: Date.now(), name: "NOWA FRAKCJA", logo: "", specialItem: "", desc: "", recipes: [] };
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

/* RECEPTURY I SKŁADNIKI */
function addRecipe(orgId) {
    const org = orgs.find(o => o.id === orgId);
    if (org) {
        if(!org.recipes) org.recipes = [];
        org.recipes.push({ resultName: "", resultImg: "", ingredients: [] });
        saveDataFull();
    }
}

function removeRecipe(orgId, rIdx) {
    const org = orgs.find(o => o.id === orgId);
    if (org) { org.recipes.splice(rIdx, 1); saveDataFull(); }
}

function updateRecipe(orgId, rIdx, field, val) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes[rIdx]) { org.recipes[rIdx][field] = val; saveDataSilent(); }
}

function addIngredient(orgId, rIdx) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes[rIdx]) {
        if(!org.recipes[rIdx].ingredients) org.recipes[rIdx].ingredients = [];
        org.recipes[rIdx].ingredients.push({ name: "", count: "", img: "" });
        saveDataFull();
    }
}

function removeIngredient(orgId, rIdx, iIdx) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes[rIdx]) {
        org.recipes[rIdx].ingredients.splice(iIdx, 1);
        saveDataFull();
    }
}

function updateIngredient(orgId, rIdx, iIdx, field, val) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes[rIdx] && org.recipes[rIdx].ingredients[iIdx]) {
        org.recipes[rIdx].ingredients[iIdx][field] = val;
        saveDataSilent();
    }
}

renderTabs();
renderContent();
