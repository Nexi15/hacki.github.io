let orgData = {};
let currentOrgKey = null;
let isAdmin = false;

// 1. INICJALIZACJA I POBIERANIE DANYCH Z FIREBASE
document.addEventListener("DOMContentLoaded", () => {
    const orgsRef = database.ref('organizacje');
    
    orgsRef.on('value', (snapshot) => {
        orgData = snapshot.val() || {};
        
        // Jeśli nie wybrano jeszcze organizacji, wybierz pierwszą z bazy
        const keys = Object.keys(orgData);
        if (keys.length > 0 && !currentOrgKey) {
            currentOrgKey = keys[0];
        } else if (keys.length === 0) {
            currentOrgKey = null;
        }

        renderSidebar();
        renderView();
    }, (error) => {
        console.error("Błąd pobierania danych:", error);
        document.getElementById('mainView').innerHTML = `
            <div class="loading-state">
                <p style="color: var(--accent-red);">Błąd podczas połączenia z bazą danych Firebase.</p>
            </div>
        `;
    });
});

// 2. RENDEROWANIE MENU BOCZNEGO (SIDEBAR)
function renderSidebar() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;
    
    container.innerHTML = '';

    const keys = Object.keys(orgData);
    if (keys.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Brak organizacji w bazie.</div>';
        return;
    }

    keys.forEach(key => {
        const org = orgData[key];
        const isActive = key === currentOrgKey;
        const craftCount = org.recipes ? org.recipes.length : 0;
        
        const tab = document.createElement('div');
        tab.className = `tab-item ${isActive ? 'active' : ''}`;
        tab.onclick = () => selectOrg(key);

        tab.innerHTML = `
            <img class="tab-icon" src="${org.logo || 'https://via.placeholder.com/44'}" alt="${org.name}">
            <div class="tab-info">
                <div class="org-title">${org.name || 'Bez nazwy'}</div>
                <div class="org-sub">${craftCount} Receptur</div>
            </div>
        `;

        container.appendChild(tab);
    });
}

// 3. WYBÓR ORGANIZACJI
function selectOrg(key) {
    currentOrgKey = key;
    renderSidebar();
    renderView();
}

// 4. RENDEROWANIE GŁÓWNEGO WIDOKU (DETAILS / CRAFTING)
function renderView() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;

    if (!currentOrgKey || !orgData[currentOrgKey]) {
        mainView.innerHTML = `
            <div class="loading-state">
                <p>Wybierz organizację z listy po lewej stronie lub dodaj nową.</p>
            </div>
        `;
        return;
    }

    const org = orgData[currentOrgKey];

    // Tryb Edycji Admina
    if (isAdmin && org.isEditing) {
        renderEditForm(mainView, org);
        return;
    }

    // Widok Standardowy
    let recipesHTML = '';
    if (org.recipes && org.recipes.length > 0) {
        recipesHTML = org.recipes.map(recipe => {
            let ingredientsHTML = '';
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                ingredientsHTML = recipe.ingredients.map(ing => `
                    <div class="ing-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; border: 1px solid var(--card-border);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${ing.icon ? `<img src="${ing.icon}" style="width:24px; height:24px; border-radius:4px; object-fit:cover;">` : ''}
                            <span style="font-size:0.85rem; font-weight: 500;">${ing.name || 'Składnik'}</span>
                        </div>
                        <span style="font-family: monospace; font-weight: bold; color: var(--accent-cyan); background: rgba(6,182,212,0.1); padding: 2px 8px; border-radius: 4px;">x${ing.amount || 1}</span>
                    </div>
                `).join('');
            } else {
                ingredientsHTML = '<p style="color:var(--text-muted); font-size:0.8rem;">Brak wymaganych składników.</p>';
            }

            return `
                <div class="craft-card" style="background: rgba(0,0,0,0.25); border: 1px solid var(--card-border); border-radius: 14px; padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--card-border);">
                        <img src="${recipe.resultIcon || 'https://via.placeholder.com/48'}" style="width:48px; height:48px; border-radius:10px; object-fit:cover; background:#000;">
                        <h4 style="font-size:1rem; font-weight:700;">${recipe.resultName || 'Przedmiot'}</h4>
                    </div>
                    <div>
                        <div style="font-size:0.7rem; font-weight:800; color:var(--text-muted); letter-spacing:1px; margin-bottom:8px;">WYMAGANE SKŁADNIKI:</div>
                        ${ingredientsHTML}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        recipesHTML = '<p style="color: var(--text-muted);">Ta organizacja nie posiada jeszcze przypisanych receptur craftingu.</p>';
    }

    mainView.innerHTML = `
        <!-- HERO BANNER -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); border: 1px solid var(--card-border); padding: 24px; border-radius: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="${org.logo || 'https://via.placeholder.com/80'}" style="width: 80px; height: 80px; border-radius: 16px; object-fit: cover; border: 2px solid var(--card-border-glow);">
                <div>
                    <h1 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 6px;">${org.name || 'Bez nazwy'}</h1>
                    <span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--primary);">FRAKCJA AKTYWNA</span>
                </div>
            </div>
            ${isAdmin ? `<button class="glass-btn" onclick="toggleEditMode('${currentOrgKey}')">✏️ EDYTUJ FRAKCJĘ</button>` : ''}
        </div>

        <!-- OPIS -->
        ${org.description ? `
            <div style="margin-bottom: 28px;">
                <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 1.5px; margin-bottom: 8px;">OPIS / INFORMACJE</div>
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--card-border); padding: 16px; border-radius: 12px; color: #d1d5db; line-height: 1.6; font-size: 0.95rem;">
                    ${org.description}
                </div>
            </div>
        ` : ''}

        <!-- CRAFTING -->
        <div>
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 1.5px; margin-bottom: 14px;">RECEPTURY CRAFTINGU</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                ${recipesHTML}
            </div>
        </div>
    `;
}

// 5. OBSŁUGA WYSZUKIWARKI
function filterOrganizations() {
    const query = document.getElementById('searchOrgInput').value.toLowerCase();
    const tabs = document.querySelectorAll('.tab-item');
    
    tabs.forEach(tab => {
        const title = tab.querySelector('.org-title').innerText.toLowerCase();
        tab.style.display = title.includes(query) ? 'flex' : 'none';
    });
}

// 6. PANEL ADMINA & MODAL
function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    modal.classList.toggle('hidden');
}

function loginAdmin() {
    const input = document.getElementById('adminPasswordInput');
    // Ustaw swoje hasło admina poniżej (domyślnie: admin123)
    if (input.value === "admin123") { 
        isAdmin = true;
        document.getElementById('adminBtnText').innerText = "ADMIN [AKTYWNY]";
        document.getElementById('adminLoginBtn').classList.add('active');
        document.getElementById('addOrgBtn').classList.remove('hidden');
        toggleAdminModal();
        renderSidebar();
        renderView();
    } else {
        alert("Nieprawidłowe hasło!");
    }
    input.value = "";
}

// 7. DODAWANIE & EDYCYJA ORGANIZACJI (ADMIN)
function addNewOrganization() {
    if (!isAdmin) return;
    const newKey = 'org_' + Date.now();
    orgData[newKey] = {
        name: "Nowa Organizacja",
        logo: "",
        description: "Opis organizacji...",
        recipes: []
    };
    currentOrgKey = newKey;
    database.ref('organizacje/' + newKey).set(orgData[newKey]);
}

function toggleEditMode(key) {
    if (!isAdmin) return;
    orgData[key].isEditing = !orgData[key].isEditing;
    renderView();
}

function renderEditForm(container, org) {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--card-border);">
            <h3>Edycja: ${org.name}</h3>
            <div>
                <button class="glass-btn" onclick="toggleEditMode('${currentOrgKey}')">ANULUJ</button>
                <button class="primary-btn" onclick="saveOrgChanges('${currentOrgKey}')">ZAPISZ ZMIANY</button>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px;">
            <label style="font-size:0.8rem; color:var(--text-muted);">Nazwa organizacji:</label>
            <input type="text" id="editName" value="${org.name || ''}" style="background:rgba(0,0,0,0.4); border:1px solid var(--card-border); color:#fff; padding:10px; border-radius:8px;">

            <label style="font-size:0.8rem; color:var(--text-muted);">URL Logo:</label>
            <input type="text" id="editLogo" value="${org.logo || ''}" style="background:rgba(0,0,0,0.4); border:1px solid var(--card-border); color:#fff; padding:10px; border-radius:8px;">

            <label style="font-size:0.8rem; color:var(--text-muted);">Opis:</label>
            <textarea id="editDesc" rows="4" style="background:rgba(0,0,0,0.4); border:1px solid var(--card-border); color:#fff; padding:10px; border-radius:8px;">${org.description || ''}</textarea>

            <button class="glass-btn" style="color:red; border-color:red; margin-top:20px;" onclick="deleteOrganization('${currentOrgKey}')">USUŃ ORGANIZACJĘ</button>
        </div>
    `;
}

function saveOrgChanges(key) {
    const updatedName = document.getElementById('editName').value;
    const updatedLogo = document.getElementById('editLogo').value;
    const updatedDesc = document.getElementById('editDesc').value;

    orgData[key].name = updatedName;
    orgData[key].logo = updatedLogo;
    orgData[key].description = updatedDesc;
    orgData[key].isEditing = false;

    database.ref('organizacje/' + key).set(orgData[key]);
}

function deleteOrganization(key) {
    if (confirm("Czy na pewno chcesz usunąć tę organizację?")) {
        database.ref('organizacje/' + key).remove();
        delete orgData[key];
        currentOrgKey = Object.keys(orgData)[0] || null;
        renderSidebar();
        renderView();
    }
}
