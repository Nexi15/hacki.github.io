let orgData = {};
let currentOrgKey = null;
let isAdmin = false;

// 1. POŁĄCZENIE Z FIREBASE
document.addEventListener("DOMContentLoaded", () => {
    // Sprawdzamy czy firebase jest poprawnie zainicjalizowany
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase SDK nie zostało załadowane!");
        return;
    }

    const orgsRef = database.ref('organizacje');

    // Nasłuchiwanie zmian na żywo w bazie danych
    orgsRef.on('value', (snapshot) => {
        orgData = snapshot.val() || {};
        
        const keys = Object.keys(orgData);
        if (keys.length > 0 && (!currentOrgKey || !orgData[currentOrgKey])) {
            currentOrgKey = keys[0];
        }

        renderSidebar();
        renderMainView();
    }, (error) => {
        console.error("Błąd pobierania danych:", error);
        document.getElementById('mainView').innerHTML = `
            <div class="loading-state">
                <p style="color: var(--accent-red);">Błąd połączenia z bazą Firebase!</p>
            </div>
        `;
    });
});

// 2. RENDEROWANIE SIDEBARA
function renderSidebar() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;

    container.innerHTML = '';
    const keys = Object.keys(orgData);

    if (keys.length === 0) {
        container.innerHTML = `
            <div style="color: var(--text-muted); font-size: 0.85rem; padding: 12px; text-align: center;">
                Brak organizacji w bazie.
            </div>
        `;
        return;
    }

    keys.forEach(key => {
        const org = orgData[key];
        const isActive = key === currentOrgKey;
        const craftCount = org.recipes ? org.recipes.length : 0;

        const item = document.createElement('div');
        item.className = `org-item ${isActive ? 'active' : ''}`;
        item.onclick = () => selectOrg(key);

        item.innerHTML = `
            <img class="org-item-icon" src="${org.logo || 'https://via.placeholder.com/44'}" alt="${org.name}">
            <div>
                <div class="org-item-title">${org.name || 'Bez nazwy'}</div>
                <div class="org-item-sub">${craftCount} Receptur</div>
            </div>
        `;

        container.appendChild(item);
    });
}

function selectOrg(key) {
    currentOrgKey = key;
    renderSidebar();
    renderMainView();
}

// 3. RENDEROWANIE GŁÓWNEGO WIDOKU
function renderMainView() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;

    if (!currentOrgKey || !orgData[currentOrgKey]) {
        mainView.innerHTML = `
            <div class="loading-state">
                <p>Brak wybranej organizacji. Wybierz opcję z listy po lewej lub utwórz nową w panelu admina.</p>
            </div>
        `;
        return;
    }

    const org = orgData[currentOrgKey];

    // Widok edycji dla Admina
    if (isAdmin && org.isEditing) {
        renderEditMode(mainView, org);
        return;
    }

    // Widok receptur craftingu
    let recipesHTML = '';
    if (org.recipes && org.recipes.length > 0) {
        recipesHTML = org.recipes.map(recipe => {
            let ingredientsHTML = '';
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                ingredientsHTML = recipe.ingredients.map(ing => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; border: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${ing.icon ? `<img src="${ing.icon}" style="width:22px; height:22px; border-radius:4px;">` : ''}
                            <span style="font-size:0.85rem;">${ing.name || 'Składnik'}</span>
                        </div>
                        <span style="font-family: monospace; font-weight: bold; color: var(--accent-cyan);">x${ing.amount || 1}</span>
                    </div>
                `).join('');
            } else {
                ingredientsHTML = '<p style="color:var(--text-muted); font-size:0.8rem;">Brak składników</p>';
            }

            return `
                <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
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
        recipesHTML = '<p style="color: var(--text-muted);">Brak zdefiniowanych receptur craftingu dla tej organizacji.</p>';
    }

    mainView.innerHTML = `
        <!-- HERO HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 24px; border-radius: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 20px;">
                <img src="${org.logo || 'https://via.placeholder.com/80'}" style="width: 80px; height: 80px; border-radius: 16px; object-fit: cover; border: 2px solid var(--border-active);">
                <div>
                    <h1 style="font-family: var(--font-head); font-size: 1.8rem; margin-bottom: 6px;">${org.name || 'Bez nazwy'}</h1>
                    <span class="badge-v">FRAKCJA AKTYWNA</span>
                </div>
            </div>
            ${isAdmin ? `<button class="btn-secondary" onclick="toggleEditMode('${currentOrgKey}')">✏️ EDYTUJ FRAKCJĘ</button>` : ''}
        </div>

        <!-- OPIS -->
        ${org.description ? `
            <div style="margin-bottom: 28px;">
                <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 1.5px; margin-bottom: 8px;">INFORMACJE</div>
                <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; color: #d1d5db; line-height: 1.6; font-size: 0.95rem;">
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

// 4. WYSZUKIWARKA
function filterOrganizations() {
    const query = document.getElementById('searchOrgInput').value.toLowerCase();
    const items = document.querySelectorAll('.org-item');
    
    items.forEach(item => {
        const title = item.querySelector('.org-item-title').innerText.toLowerCase();
        item.style.display = title.includes(query) ? 'flex' : 'none';
    });
}

// 5. PANEL ADMINA MODAL
function openAdminModal() {
    document.getElementById('adminModal').classList.remove('hidden');
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

function loginAdmin() {
    const input = document.getElementById('adminPasswordInput');
    if (input.value === "admin123") {
        isAdmin = true;
        document.getElementById('adminBtnText').innerText = "ADMIN [AKTYWNY]";
        document.getElementById('adminLoginBtn').classList.add('active');
        document.getElementById('addOrgBtn').classList.remove('hidden');
        closeAdminModal();
        renderSidebar();
        renderMainView();
    } else {
        alert("Błędne hasło admina!");
    }
    input.value = "";
}

// 6. ZARZĄDZANIE W BAZIE (DODAWANIE / EDYCYJA)
function addNewOrganization() {
    if (!isAdmin) return;
    const newKey = 'org_' + Date.now();
    orgData[newKey] = {
        name: "Nowa Frakcja",
        logo: "",
        description: "Opis nowej frakcji...",
        recipes: []
    };
    currentOrgKey = newKey;
    database.ref('organizacje/' + newKey).set(orgData[newKey]);
}

function toggleEditMode(key) {
    if (!isAdmin) return;
    orgData[key].isEditing = !orgData[key].isEditing;
    renderMainView();
}

function renderEditMode(container, org) {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--border-color);">
            <h3>Edycja: ${org.name}</h3>
            <div>
                <button class="btn-secondary" onclick="toggleEditMode('${currentOrgKey}')">ANULUJ</button>
                <button class="btn-primary" onclick="saveOrgChanges('${currentOrgKey}')">ZAPISZ</button>
            </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px;">
            <label style="font-size:0.8rem; color:var(--text-muted);">Nazwa Frakcji:</label>
            <input type="text" id="editName" value="${org.name || ''}" style="background:rgba(0,0,0,0.4); border:1px solid var(--border-color); color:#fff; padding:10px; border-radius:8px;">

            <label style="font-size:0.8rem; color:var(--text-muted);">Link do Logo (URL):</label>
            <input type="text" id="editLogo" value="${org.logo || ''}" style="background:rgba(0,0,0,0.4); border:1px solid var(--border-color); color:#fff; padding:10px; border-radius:8px;">

            <label style="font-size:0.8rem; color:var(--text-muted);">Opis Frakcji:</label>
            <textarea id="editDesc" rows="4" style="background:rgba(0,0,0,0.4); border:1px solid var(--border-color); color:#fff; padding:10px; border-radius:8px;">${org.description || ''}</textarea>

            <button class="btn-secondary" style="color:var(--accent-red); border-color:var(--accent-red); margin-top:20px;" onclick="deleteOrganization('${currentOrgKey}')">USUŃ FRAKCJĘ</button>
        </div>
    `;
}

function saveOrgChanges(key) {
    orgData[key].name = document.getElementById('editName').value;
    orgData[key].logo = document.getElementById('editLogo').value;
    orgData[key].description = document.getElementById('editDesc').value;
    orgData[key].isEditing = false;

    database.ref('organizacje/' + key).set(orgData[key]);
}

function deleteOrganization(key) {
    if (confirm("Czy na pewno usunąć tę organizację?")) {
        database.ref('organizacje/' + key).remove();
        delete orgData[key];
        currentOrgKey = Object.keys(orgData)[0] || null;
        renderSidebar();
        renderMainView();
    }
}
