// Aktualizacja renderowania sidebar
function renderSidebar() {
    const container = document.getElementById('tabsContainer');
    if (!container) return;
    
    container.innerHTML = '';

    Object.keys(orgData).forEach(key => {
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

// Filtrowanie organizacji w szukajce
function filterOrganizations() {
    const query = document.getElementById('searchOrgInput').value.toLowerCase();
    const tabs = document.querySelectorAll('.tab-item');
    
    tabs.forEach(tab => {
        const title = tab.querySelector('.org-title').innerText.toLowerCase();
        tab.style.display = title.includes(query) ? 'flex' : 'none';
    });
}
