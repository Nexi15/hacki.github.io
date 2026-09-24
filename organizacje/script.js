const ADMIN_PASS = "1312";
let isAdmin = false;

let orgs = [];
let currentOrgId = null;
let saveTimer = null;

// GŁÓWNA OBSŁUGA BAZY DANYCH
function initDatabase() {
    console.log("Łączenie z Firebase...");
    
    database.ref('lostmc_orgs_v4').on('value', (snapshot) => {
        const rawData = snapshot.val();
        console.log("Pobrane dane z Firebase:", rawData);

        if (rawData) {
            orgs = parseData(rawData);
        } else {
            console.warn("Baza zwróciła puste dane!");
            orgs = [];
        }

        if (!currentOrgId && orgs.length > 0) {
            currentOrgId = orgs[0].id;
        }

        renderSidebar();
        
        // Powstrzymaj nadpisywanie widoku jeśli użytkownik aktualnie coś pisze w polu tekstowym
        if (!document.activeElement || (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
            renderMainView();
        }
    }, (error) => {
        console.error("Błąd połączenia z Firebase:", error);
        const view = document.getElementById('mainView');
        if (view) {
            view.innerHTML = `
                <div style="color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid #ef4444; padding:20px; border-radius:12px; text-align:center;">
                    <h3>⚠️ Błąd połączenia z Firebase!</h3>
                    <p style="margin-top:8px;">${error.message}</p>
                    <p style="margin-top:8px; font-size:0.85rem; color:#9ca3af;">Sprawdź zakładkę <b>Rules</b> w konsoli Firebase i upewnij się, że .read oraz .write są ustawione na true.</p>
                </div>
            `;
        }
    });
}

function parseData(data) {
    let list = [];
    if (typeof data === 'object' && !Array.isArray(data)) {
        list = Object.values(data);
    } else if (Array.isArray(data)) {
        list = data;
    }

    return list.map((item, index) => {
        if (typeof item === 'string') {
            return {
                id: Date.now() + index,
                name: item,
                logo: "",
                specialItem: "",
                desc: "Organizacja przeniesiona ze starych wpisów.",
                recipes: []
            };
        }
        return {
            id: item.id || (Date.now() + index),
            name: item.name || "Bez nazwy",
            logo: item.logo || "",
            specialItem: item.specialItem || "",
            desc: item.desc || "",
            recipes: Array.isArray(item.recipes) ? item.recipes : []
        };
    });
}

// ZAPIS DANYCH
function saveChanges(instant = false) {
    clearTimeout(saveTimer);
    const executeSave = () => {
        database.ref('lostmc_orgs_v4').set(orgs).then(() => {
            console.log("Zapisano pomyślnie do Firebase!");
        }).catch((err) => {
            console.error("Błąd podczas zapisu:", err);
            alert("Błąd zapisu! Upewnij się, że w konsoli Firebase w zakładce Rules masz .write: true");
        });
    };

    if (instant) {
        executeSave();
        renderSidebar();
        renderMainView();
    } else {
        saveTimer = setTimeout(executeSave, 600);
    }
}

// LOGOWANIE ADMINA
function toggleAdminModal() {
    if (isAdmin) {
        isAdmin = false;
        document.getElementById('adminBtnText').innerText = "ZALOGUJ ADMINA";
        document.getElementById('adminLoginBtn').classList.remove('active');
        document.getElementById('addOrgBtn').classList.add('hidden');
        renderMainView();
    } else {
        document.getElementById('adminModal').classList.remove('hidden');
    }
}

function loginAdmin() {
    const val = document.getElementById('adminPasswordInput').value;
    if (val === ADMIN_PASS) {
        isAdmin = true;
        document.getElementById('adminModal').classList.add('hidden');
        document.getElementById('adminBtnText').innerText = "WYLOGUJ ADMINA";
        document.getElementById('adminLoginBtn').classList.add('active');
        document.getElementById('addOrgBtn').classList.remove('hidden');
        document.getElementById('adminPasswordInput').value = '';
        renderMainView();
    } else {
        alert("Błędne hasło!");
    }
}

// RENDER SIDEBARU
function renderSidebar() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (orgs.length === 0) {
        container.innerHTML = '<div style="padding:12px; font-size:0.8rem; color:var(--text-muted); text-align:center;">Brak organizacji w bazie.</div>';
        return;
    }

    orgs.forEach(org => {
        const item = document.createElement('div');
        item.className = `tab-item ${org.id === currentOrgId ? 'active' : ''}`;
        item.onclick = () => {
            currentOrgId = org.id;
            renderSidebar();
            renderMainView();
        };

        item.innerHTML = `
            <img src="${org.logo || 'https://via.placeholder.com/36'}" class="tab-icon" onerror="this.src='https://via.placeholder.com/36'">
            <span style="font-weight:600; font-size:0.9rem;">${org.name}</span>
        `;
        container.appendChild(item);
    });
}

// RENDER WIDOKU GŁÓWNEGO
function renderMainView() {
    const view = document.getElementById('mainView');
    if (!view) return;

    const org = orgs.find(o => o.id === currentOrgId);

    if (!org) {
        view.innerHTML = `
            <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                <h2>Baza jest obecnie pusta</h2>
                <p style="margin-top:10px; margin-bottom:20px;">Zaloguj się do panelu admina (hasło: 1312), aby dodać pierwszą organizację i receptury.</p>
                <button class="btn-primary" onclick="toggleAdminModal()">Zaloguj Admina i Dodaj</button>
            </div>
        `;
        return;
    }

    if (!isAdmin) {
        // WIDOK GRACZA
        view.innerHTML = `
            <div class="org-hero">
                <img src="${org.logo || 'https://via.placeholder.com/84'}" class="org-hero-logo" onerror="this.src='https://via.placeholder.com/84'">
                <div class="org-hero-details">
                    <h1>${org.name}</h1>
                    ${org.specialItem ? `<span class="badge-item">⭐ UNIKAT: ${org.specialItem}</span>` : ''}
                </div>
            </div>

            <div class="section-label">O ORGANIZACJI</div>
            <div class="description-box">${org.desc || 'Brak opisu.'}</div>

            <div class="section-label">🔨 DOSTĘPNY CRAFTING</div>
            <div class="crafting-grid">
                ${(org.recipes || []).map(r => `
                    <div class="craft-card">
                        <div class="craft-header">
                            <img src="${r.resultImg || 'https://via.placeholder.com/52'}" onerror="this.src='https://via.placeholder.com/52'">
                            <h4>${r.resultName || 'Przedmiot'}</h4>
                        </div>
                        <div class="ingredients-list">
                            ${(r.ingredients || []).map(ing => `
                                <div class="ing-item">
                                    <div class="ing-left">
                                        <img src="${ing.img || 'https://via.placeholder.com/32'}" onerror="this.src='https://via.placeholder.com/32'">
                                        <span>${ing.name || 'Składnik'}</span>
                                    </div>
                                    <span class="ing-count">${ing.count || '1x'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        // WIDOK ADMINA
        view.innerHTML = `
            <div class="admin-box">
                <div class="admin-head">
                    <h2>EDYCJA: ${org.name}</h2>
                    <button class="btn-danger" onclick="deleteOrg(${org.id})">USUŃ ORGANIZACJĘ</button>
                </div>

                <div class="field">
                    <label>NAZWA ORGANIZACJI</label>
                    <input type="text" value="${org.name}" oninput="updateOrgField(${org.id}, 'name', this.value)">
                </div>

                <div class="field">
                    <label>URL LOGO (ZDJĘCIE)</label>
                    <input type="text" value="${org.logo}" oninput="updateOrgField(${org.id}, 'logo', this.value)">
                </div>

                <div class="field">
                    <label>UNIKATOWY PRZEDMIOT / CECHA</label>
                    <input type="text" value="${org.specialItem}" oninput="updateOrgField(${org.id}, 'specialItem', this.value)">
                </div>

                <div class="field">
                    <label>OPIS ORGANIZACJI</label>
                    <textarea rows="3" oninput="updateOrgField(${org.id}, 'desc', this.value)">${org.desc}</textarea>
                </div>

                <div style="margin-top:28px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span style="font-size:0.75rem; font-weight:800; color:var(--text-muted); letter-spacing:1px;">RECEPTURY CRAFTINGOWE</span>
                        <button class="btn-primary" onclick="addRecipe(${org.id})">+ DODAJ RECEPTURĘ</button>
                    </div>

                    ${(org.recipes || []).map((r, rIdx) => `
                        <div class="recipe-block">
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                                <strong style="color:var(--accent-purple); font-size:0.85rem;">RECEPTURA #${rIdx + 1}</strong>
                                <button class="btn-danger" style="padding:2px 6px; font-size:0.7rem;" onclick="removeRecipe(${org.id},${rIdx})">USUŃ RECEPTURĘ</button>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:10px;">
                                <input type="text" placeholder="Nazwa przedmiotu" value="${r.resultName || ''}" oninput="updateRecipeField(${org.id},${rIdx}, 'resultName', this.value)">
                                <input type="text" placeholder="URL Zdjęcia przedmiotu" value="${r.resultImg || ''}" oninput="updateRecipeField(${org.id},${rIdx}, 'resultImg', this.value)">
                            </div>

                            <label style="font-size:0.68rem; font-weight:800; color:var(--text-muted); display:block; margin-bottom:6px;">SKŁADNIKI:</label>
                            ${(r.ingredients || []).map((ing, iIdx) => `
                                <div class="ing-edit-row">
                                    <input type="text" placeholder="Nazwa składnika" value="${ing.name || ''}" oninput="updateIngredientField(${org.id}, ${rIdx}, ${iIdx}, 'name', this.value)">
                                    <input type="text" placeholder="Ilość" value="${ing.count || ''}" style="max-width:90px;" oninput="updateIngredientField(${org.id}, ${rIdx}, ${iIdx}, 'count', this.value)">
                                    <input type="text" placeholder="URL Zdjęcia" value="${ing.img || ''}" oninput="updateIngredientField(${org.id}, ${rIdx}, ${iIdx}, 'img', this.value)">
                                    <button class="btn-danger" onclick="removeIngredient(${org.id}, ${rIdx}, ${iIdx})">✕</button>
                                </div>
                            `).join('')}
                            <button class="btn-secondary" style="margin-top:6px;" onclick="addIngredient(${org.id},${rIdx})">+ Dodaj Składnik</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// METODY EDYCJI
function updateOrgField(id, field, val) {
    const org = orgs.find(o => o.id === id);
    if (org) {
        org[field] = val;
        saveChanges(false);
        if (field === 'name' || field === 'logo') renderSidebar();
    }
}

function addNewOrganization() {
    const newOrg = { id: Date.now(), name: "NOWA ORGANIZACJA", logo: "", specialItem: "", desc: "", recipes: [] };
    orgs.push(newOrg);
    currentOrgId = newOrg.id;
    saveChanges(true);
}

function deleteOrg(id) {
    if (confirm("Czy na pewno usunąć tę organizację?")) {
        orgs = orgs.filter(o => o.id !== id);
        currentOrgId = orgs[0]?.id || null;
        saveChanges(true);
    }
}

function addRecipe(orgId) {
    const org = orgs.find(o => o.id === orgId);
    if (org) {
        if (!org.recipes) org.recipes = [];
        org.recipes.push({ resultName: "", resultImg: "", ingredients: [] });
        saveChanges(true);
    }
}

function removeRecipe(orgId, rIdx) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes) {
        org.recipes.splice(rIdx, 1);
        saveChanges(true);
    }
}

function updateRecipeField(orgId, rIdx, field, val) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes && org.recipes[rIdx]) {
        org.recipes[rIdx][field] = val;
        saveChanges(false);
    }
}

function addIngredient(orgId, rIdx) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes && org.recipes[rIdx]) {
        if (!org.recipes[rIdx].ingredients) org.recipes[rIdx].ingredients = [];
        org.recipes[rIdx].ingredients.push({ name: "", count: "", img: "" });
        saveChanges(true);
    }
}

function removeIngredient(orgId, rIdx, iIdx) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes && org.recipes[rIdx] && org.recipes[rIdx].ingredients) {
        org.recipes[rIdx].ingredients.splice(iIdx, 1);
        saveChanges(true);
    }
}

function updateIngredientField(orgId, rIdx, iIdx, field, val) {
    const org = orgs.find(o => o.id === orgId);
    if (org && org.recipes && org.recipes[rIdx] && org.recipes[rIdx].ingredients && org.recipes[rIdx].ingredients[iIdx]) {
        org.recipes[rIdx].ingredients[iIdx][field] = val;
        saveChanges(false);
    }
}

// URUCHOMIENIE
window.onload = () => {
    initDatabase();
};
