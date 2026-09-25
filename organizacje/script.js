let orgData = {};
let currentOrgKey = null;
let isAdmin = false;

// Pobieranie danych w czasie rzeczywistym z Firebase
database.ref('organizacje').on('value', (snapshot) => {
    const raw = snapshot.val();
    orgData = {};

    if (raw) {
        if (Array.isArray(raw)) {
            raw.forEach((item, idx) => {
                if (item) orgData['org_' + idx] = item;
            });
        } else if (typeof raw === 'object') {
            orgData = raw;
        }
    }

    const keys = Object.keys(orgData);
    if (keys.length > 0 && (!currentOrgKey || !orgData[currentOrgKey])) {
        currentOrgKey = keys[0];
    }

    renderSidebar();
    renderMainView();
}, (error) => {
    console.error("Błąd bazy danych:", error);
    const view = document.getElementById('mainView');
    if (view) {
        view.innerHTML = `
            <div class="loading-spinner">
                <p style="color:var(--accent-red); font-weight:bold;">Błąd połączenia z bazą Firebase!</p>
                <p style="font-size:0.8rem; color:var(--text-muted);">Sprawdź uprawnienia i reguły (Rules) w Firebase Console.</p>
            </div>`;
    }
});

function renderSidebar() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;
    
    container.innerHTML = '';

    const keys = Object.keys(orgData);
    if (keys.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:12px; color:var(--text-muted); font-size:0.85rem;">Brak frakcji. Zaloguj się do panelu admina, aby dodać pierwszą!</div>';
        return;
    }

    keys.forEach(key => {
        const org = orgData[key] || {};
        const isActive = key === currentOrgKey;
        
        let craftCount = 0;
        if (org.recipes) {
            craftCount = Array.isArray(org.recipes) ? org.recipes.length : Object.keys(org.recipes).length;
        }
        
        const tab = document.createElement('div');
        tab.className = `tab-item ${isActive ? 'active' : ''}`;
        tab.onclick = () => selectOrg(key);

        tab.innerHTML = `
            <img class="tab-icon" src="${org.logo || 'https://via.placeholder.com/40'}" alt="${org.name || 'Logo'}">
            <div class="tab-info">
                <div class="org-title">${org.name || 'Bez nazwy'}</div>
                <div class="org-sub">${craftCount} receptur(y)</div>
            </div>
        `;

        container.appendChild(tab);
    });
}

function selectOrg(key) {
    currentOrgKey = key;
    renderSidebar();
    renderMainView();
}

function filterOrganizations() {
    const query = document.getElementById('searchOrgInput').value.toLowerCase();
    const tabs = document.querySelectorAll('.tab-item');
    
    tabs.forEach(tab => {
        const titleEl = tab.querySelector('.org-title');
        if (titleEl) {
            const title = titleEl.innerText.toLowerCase();
            tab.style.display = title.includes(query) ? 'flex' : 'none';
        }
    });
}

function renderMainView() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;

    if (!currentOrgKey || !orgData[currentOrgKey]) {
        mainView.innerHTML = `
            <div class="loading-spinner">
                <p>Baza danych jest pusta lub brak wybranej organizacji.</p>
            </div>`;
        return;
    }

    const org = orgData[currentOrgKey];

    if (isAdmin && org.isEditing) {
        renderEditView(mainView, org);
        return;
    }

    let recipesHtml = '';
    if (org.recipes) {
        const recipesArr = Array.isArray(org.recipes) ? org.recipes : Object.values(org.recipes);
        
        recipesArr.forEach(r => {
            if (!r) return;
            let ingHtml = '';
            
            if (r.ingredients) {
                const ingArr = Array.isArray(r.ingredients) ? r.ingredients : Object.values(r.ingredients);
                ingArr.forEach(i => {
                    if (!i) return;
                    ingHtml += `
                        <div class="ing-item">
                            <div class="ing-left">
                                ${i.icon ? `<img src="${i.icon}" alt="icon">` : ''}
                                <span>${i.name || 'Składnik'}</span>
                            </div>
                            <span class="ing-count">x${i.amount || 1}</span>
                        </div>
                    `;
                });
            }

            recipesHtml += `
                <div class="craft-card">
                    <div class="craft-header">
                        <img src="${r.resultIcon || 'https://via.placeholder.com/48'}" alt="${r.resultName || 'Item'}">
                        <h4>${r.resultName || 'Nieznany przedmiot'}</h4>
                    </div>
                    <div class="section-label">WYMAGANE SKŁADNIKI:</div>
                    <div class="ingredients-list">
                        ${ingHtml || '<p style="font-size:0.8rem; color:var(--text-muted)">Brak składników</p>'}
                    </div>
                </div>
            `;
        });
    }

    if (!recipesHtml) {
        recipesHtml = '<p style="color:var(--text-muted); font-size:0.85rem; grid-column: 1/-1;">Brak zdefiniowanych receptur dla tej organizacji.</p>';
    }

    mainView.innerHTML = `
        <div class="org-hero">
            <div class="org-hero-left">
                <img class="org-hero-logo" src="${org.logo || 'https://via.placeholder.com/90'}" alt="${org.name}">
                <div class="org-hero-details">
                    <h1>${org.name || 'Bez nazwy'}</h1>
                    <span class="badge-item">AKTYWNA FRAKCJA</span>
                </div>
            </div>
            ${isAdmin ? `<button class="btn-secondary" onclick="toggleEditMode()">✏️ EDYTUJ</button>` : ''}
        </div>

        ${org.description ? `
            <div class="section-label">OPIS ORGANIZACJI</div>
            <div class="description-box">${org.description}</div>
        ` : ''}

        <div class="section-label">RECEPTURY CRAFTINGU</div>
        <div class="crafting-grid">
            ${recipesHtml}
        </div>
    `;
}

function renderEditView(container, org) {
    container.innerHTML = `
        <div class="admin-box">
            <div class="admin-head">
                <h3>EDYCJA: ${org.name || ''}</h3>
                <div style="display:flex; gap:8px;">
                    <button class="btn-secondary" onclick="toggleEditMode()">ANULUJ</button>
                    <button class="btn-primary" onclick="saveCurrentOrg()">ZAPISZ</button>
                </div>
            </div>
            <div class="field">
                <label>NAZWA FRAKCJI</label>
                <input type="text" id="editName" value="${org.name || ''}">
            </div>
            <div class="field">
                <label>URL LOGO</label>
                <input type="text" id="editLogo" value="${org.logo || ''}">
            </div>
            <div class="field">
                <label>OPIS</label>
                <textarea id="editDesc" rows="4">${org.description || ''}</textarea>
            </div>
            <div style="margin-top: 10px;">
                <button class="btn-danger" onclick="deleteCurrentOrg()">USUŃ CAŁĄ FRAKCJĘ</button>
            </div>
        </div>
    `;
}

function toggleEditMode() {
    if (!isAdmin) return;
    if (orgData[currentOrgKey]) {
        orgData[currentOrgKey].isEditing = !orgData[currentOrgKey].isEditing;
        renderMainView();
    }
}

function saveCurrentOrg() {
    const name = document.getElementById('editName').value;
    const logo = document.getElementById('editLogo').value;
    const description = document.getElementById('editDesc').value;

    orgData[currentOrgKey].name = name;
    orgData[currentOrgKey].logo = logo;
    orgData[currentOrgKey].description = description;
    orgData[currentOrgKey].isEditing = false;

    database.ref('organizacje/' + currentOrgKey).set(orgData[currentOrgKey]);
}

function deleteCurrentOrg() {
    if (confirm("Czy na pewno chcesz usunąć tę organizację z bazy?")) {
        database.ref('organizacje/' + currentOrgKey).remove();
        delete orgData[currentOrgKey];
        currentOrgKey = Object.keys(orgData)[0] || null;
        renderSidebar();
        renderMainView();
    }
}

function addNewOrganization() {
    if (!isAdmin) return;
    const newKey = 'org_' + Date.now();
    const newOrg = {
        name: "Nowa Organizacja",
        logo: "",
        description: "Opis nowej frakcji...",
        recipes: []
    };
    database.ref('organizacje/' + newKey).set(newOrg);
    currentOrgKey = newKey;
}

function toggleAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.toggle('hidden');
}

function loginAdmin() {
    const pass = document.getElementById('adminPasswordInput').value;
    if (pass === "admin123") {
        isAdmin = true;
        const btn = document.getElementById('adminLoginBtn');
        const txt = document.getElementById('adminBtnText');
        const addBtn = document.getElementById('addOrgBtn');

        if (btn) btn.classList.add('active');
        if (txt) txt.innerText = "ADMIN [AKTYWNY]";
        if (addBtn) addBtn.classList.remove('hidden');

        toggleAdminModal();
        renderSidebar();
        renderMainView();
    } else {
        alert("Niepoprawne hasło!");
    }
    document.getElementById('adminPasswordInput').value = '';
}
