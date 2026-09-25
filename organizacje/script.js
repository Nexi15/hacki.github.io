const ADMIN_PASSWORD = "1312";
const dbRef = database.ref('lostmc_orgs_v4');

let orgs = [];
let currentTab = null;
let isAdmin = false;
let saveTimeout = null;

const fallbackImage = 'https://via.placeholder.com/160x160/111827/94a3b8?text=ORG';

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
}

function normalizeOrganizations(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data.filter(Boolean);
    return Object.values(data).filter(Boolean);
}

function getOrganization(id) {
    return orgs.find(org => String(org.id) === String(id));
}

function recipesFor(org) {
    return Array.isArray(org?.recipes) ? org.recipes : [];
}

function ingredientsFor(org) {
    return recipesFor(org).reduce((total, recipe) => {
        return total + (Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0);
    }, 0);
}

function saveDataSilent() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => dbRef.set(orgs), 800);
}

function saveDataFull() {
    clearTimeout(saveTimeout);
    return dbRef.set(orgs).then(() => {
        renderTabs();
        renderContent();
    }).catch(error => {
        console.error('Firebase save error:', error);
        alert('Nie udało się zapisać zmian w bazie Firebase.');
    });
}

function renderTabs() {
    const list = document.getElementById('tabsList');
    if (!list) return;

    list.innerHTML = '';

    if (!orgs.length) {
        list.innerHTML = '<div class="empty-tab">Brak organizacji</div>';
        return;
    }

    orgs.forEach(org => {
        const button = document.createElement('button');
        button.className = `tab-item ${String(org.id) === String(currentTab) ? 'active' : ''}`;
        button.id = `tab-btn-${org.id}`;
        button.innerHTML = `<span class="tab-name">${escapeHTML(org.name || 'BEZ NAZWY')}</span><span class="tab-count">${recipesFor(org).length}</span>`;
        button.addEventListener('click', () => {
            currentTab = org.id;
            renderTabs();
            renderContent();
        });
        list.appendChild(button);
    });
}

function renderContent() {
    const area = document.getElementById('mainDisplay');
    if (!area) return;

    const org = getOrganization(currentTab);
    if (!org) {
        area.innerHTML = '<div class="empty-panel">Wybierz organizację z listy.</div>';
        return;
    }

    if (isAdmin) {
        renderAdminContent(area, org);
    } else {
        renderPublicContent(area, org);
    }
}

function renderPublicContent(area, org) {
    const recipes = recipesFor(org);

    area.innerHTML = `
        <div class="org-profile-header">
            <img src="${escapeHTML(org.logo || fallbackImage)}" class="org-logo-preview" onerror="this.src='${fallbackImage}'" alt="Logo organizacji">
            <div class="org-title-area">
                <h1>${escapeHTML(org.name || 'BEZ NAZWY')}</h1>
                ${org.specialItem ? `<span class="badge-special">✦ ${escapeHTML(org.specialItem)}</span>` : ''}
            </div>
        </div>

        <div class="profile-summary">
            <div class="summary-pill"><span>Status</span><strong>Aktywna</strong></div>
            <div class="summary-pill"><span>Receptury</span><strong>${recipes.length}</strong></div>
            <div class="summary-pill"><span>Składniki</span><strong>${ingredientsFor(org)}</strong></div>
        </div>

        <div class="section-label">O ORGANIZACJI</div>
        <div class="org-description">${escapeHTML(org.desc || 'Brak opisu organizacji.')}</div>

        <div class="section-label">RECEPTURY CRAFTINGU</div>
        <div class="crafts-container">
            ${recipes.length ? recipes.map((recipe, index) => `
                <article class="recipe-card">
                    <div class="result-box">
                        <img src="${escapeHTML(recipe.resultImg || fallbackImage)}" class="result-img" onerror="this.src='${fallbackImage}'" alt="Wynik receptury">
                        <div>
                            <small class="recipe-label">RECEPTURA ${String(index + 1).padStart(2, '0')}</small>
                            <div class="result-title">${escapeHTML(recipe.resultName || 'Przedmiot końcowy')}</div>
                        </div>
                    </div>
                    <div class="ingredients-list">
                        ${(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map(ingredient => `
                            <div class="ingredient-item">
                                <img src="${escapeHTML(ingredient.img || fallbackImage)}" class="ing-img" onerror="this.src='${fallbackImage}'" alt="Składnik">
                                <div class="ing-details">
                                    <span class="ing-name">${escapeHTML(ingredient.name || 'Składnik')}</span>
                                    <span class="ing-count">${escapeHTML(ingredient.count || '1x')}</span>
                                </div>
                            </div>
                        `).join('') || '<span class="muted">Brak składników</span>'}
                    </div>
                </article>
            `).join('') : '<div class="empty-panel">Ta organizacja nie ma jeszcze receptur.</div>'}
        </div>
    `;
}

function renderAdminContent(area, org) {
    area.innerHTML = `
        <div class="admin-topbar">
            <h2>EDYCJA: ${escapeHTML(org.name || 'BEZ NAZWY')}</h2>
            <button class="btn-danger" onclick="deleteOrg(${Number(org.id)})">USUŃ ORGANIZACJĘ</button>
        </div>

        <div class="form-group"><label>NAZWA ORGANIZACJI</label><input type="text" value="${escapeHTML(org.name)}" oninput="updateField(${Number(org.id)}, 'name', this.value)"></div>
        <div class="form-group"><label>URL LOGO ORGANIZACJI</label><input type="text" value="${escapeHTML(org.logo)}" oninput="updateField(${Number(org.id)}, 'logo', this.value)"></div>
        <div class="form-group"><label>UNIKALNY PRZEDMIOT</label><input type="text" value="${escapeHTML(org.specialItem)}" oninput="updateField(${Number(org.id)}, 'specialItem', this.value)"></div>
        <div class="form-group"><label>OPIS FRAKCJI</label><textarea rows="4" oninput="updateField(${Number(org.id)}, 'desc', this.value)">${escapeHTML(org.desc)}</textarea></div>

        <div class="recipe-toolbar">
            <label>RECEPTURY CRAFTINGU</label>
            <button class="btn-primary" onclick="addRecipe(${Number(org.id)})">+ DODAJ RECEPTURĘ</button>
        </div>
        ${recipesFor(org).map((recipe, recipeIndex) => renderAdminRecipe(org, recipe, recipeIndex)).join('')}
    `;
}

function renderAdminRecipe(org, recipe, recipeIndex) {
    return `
        <div class="admin-recipe-box">
            <div class="recipe-box-header"><strong>RECEPTURA #${recipeIndex + 1}</strong><button class="btn-danger" onclick="removeRecipe(${Number(org.id)}, ${recipeIndex})">USUŃ</button></div>
            <div class="admin-recipe-fields">
                <input type="text" placeholder="Nazwa wyniku" value="${escapeHTML(recipe.resultName)}" oninput="updateRecipe(${Number(org.id)}, ${recipeIndex}, 'resultName', this.value)">
                <input type="text" placeholder="URL zdjęcia wyniku" value="${escapeHTML(recipe.resultImg)}" oninput="updateRecipe(${Number(org.id)}, ${recipeIndex}, 'resultImg', this.value)">
            </div>
            <label>SKŁADNIKI</label>
            ${(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map((ingredient, ingredientIndex) => `
                <div class="admin-ing-row">
                    <input type="text" placeholder="Nazwa" value="${escapeHTML(ingredient.name)}" oninput="updateIngredient(${Number(org.id)}, ${recipeIndex}, ${ingredientIndex}, 'name', this.value)">
                    <input type="text" placeholder="Ilość" value="${escapeHTML(ingredient.count)}" oninput="updateIngredient(${Number(org.id)}, ${recipeIndex}, ${ingredientIndex}, 'count', this.value)">
                    <input type="text" placeholder="URL zdjęcia" value="${escapeHTML(ingredient.img)}" oninput="updateIngredient(${Number(org.id)}, ${recipeIndex}, ${ingredientIndex}, 'img', this.value)">
                    <button class="btn-danger" onclick="removeIngredient(${Number(org.id)}, ${recipeIndex}, ${ingredientIndex})">✕</button>
                </div>
            `).join('')}
            <button class="btn-sec" onclick="addIngredient(${Number(org.id)}, ${recipeIndex})">+ DODAJ SKŁADNIK</button>
        </div>
    `;
}

function toggleAdminModal() {
    if (isAdmin) {
        isAdmin = false;
        document.getElementById('adminLoginBtn').innerText = '🔐 PANEL ADMINA';
        document.getElementById('adminLoginBtn').classList.remove('active');
        document.getElementById('addOrgBtn').classList.add('hidden');
        renderContent();
        return;
    }
    document.getElementById('adminModal').classList.remove('hidden');
    document.getElementById('adminPasswordInput').focus();
}

function loginAdmin() {
    const password = document.getElementById('adminPasswordInput').value;
    if (password !== ADMIN_PASSWORD) {
        alert('Błędne hasło!');
        return;
    }
    isAdmin = true;
    document.getElementById('adminModal').classList.add('hidden');
    document.getElementById('adminLoginBtn').innerText = '🔓 WYLOGUJ ADMINA';
    document.getElementById('adminLoginBtn').classList.add('active');
    document.getElementById('addOrgBtn').classList.remove('hidden');
    document.getElementById('adminPasswordInput').value = '';
    renderContent();
}

function updateField(id, field, value) {
    const org = getOrganization(id);
    if (!org) return;
    org[field] = value;
    if (field === 'name') {
        const button = document.getElementById(`tab-btn-${id}`);
        if (button) button.querySelector('.tab-name').textContent = value || 'BEZ NAZWY';
    }
    saveDataSilent();
}

function addOrganization() {
    const newOrg = { id: Date.now(), name: 'NOWA ORGANIZACJA', logo: '', specialItem: '', desc: '', recipes: [] };
    orgs.push(newOrg);
    currentTab = newOrg.id;
    saveDataFull();
}

function deleteOrg(id) {
    if (!confirm('Usunąć organizację?')) return;
    orgs = orgs.filter(org => String(org.id) !== String(id));
    currentTab = orgs[0]?.id || null;
    saveDataFull();
}

function addRecipe(orgId) {
    const org = getOrganization(orgId);
    if (!org) return;
    if (!Array.isArray(org.recipes)) org.recipes = [];
    org.recipes.push({ resultName: '', resultImg: '', ingredients: [] });
    saveDataFull();
}

function removeRecipe(orgId, recipeIndex) {
    const org = getOrganization(orgId);
    if (!org || !Array.isArray(org.recipes)) return;
    org.recipes.splice(recipeIndex, 1);
    saveDataFull();
}

function updateRecipe(orgId, recipeIndex, field, value) {
    const org = getOrganization(orgId);
    if (!org || !org.recipes?.[recipeIndex]) return;
    org.recipes[recipeIndex][field] = value;
    saveDataSilent();
}

function addIngredient(orgId, recipeIndex) {
    const org = getOrganization(orgId);
    if (!org || !org.recipes?.[recipeIndex]) return;
    if (!Array.isArray(org.recipes[recipeIndex].ingredients)) org.recipes[recipeIndex].ingredients = [];
    org.recipes[recipeIndex].ingredients.push({ name: '', count: '', img: '' });
    saveDataFull();
}

function removeIngredient(orgId, recipeIndex, ingredientIndex) {
    const org = getOrganization(orgId);
    if (!org?.recipes?.[recipeIndex]?.ingredients) return;
    org.recipes[recipeIndex].ingredients.splice(ingredientIndex, 1);
    saveDataFull();
}

function updateIngredient(orgId, recipeIndex, ingredientIndex, field, value) {
    const org = getOrganization(orgId);
    const ingredient = org?.recipes?.[recipeIndex]?.ingredients?.[ingredientIndex];
    if (!ingredient) return;
    ingredient[field] = value;
    saveDataSilent();
}

dbRef.on('value', snapshot => {
    orgs = normalizeOrganizations(snapshot.val());
    if (!orgs.length) {
        orgs = [{ id: Date.now(), name: 'NOWA ORGANIZACJA', logo: '', specialItem: '', desc: '', recipes: [] }];
        dbRef.set(orgs);
    }
    if (!currentTab || !getOrganization(currentTab)) currentTab = orgs[0].id;
    renderTabs();
    renderContent();
}, error => {
    console.error('Firebase read error:', error);
    const area = document.getElementById('mainDisplay');
    if (area) area.innerHTML = '<div class="empty-panel">Nie udało się połączyć z bazą Firebase.</div>';
});

document.getElementById('adminPasswordInput')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') loginAdmin();
});

document.getElementById('adminModal')?.addEventListener('click', event => {
    if (event.target.id === 'adminModal') toggleAdminModal();
});
