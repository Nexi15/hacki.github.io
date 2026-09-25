// Podmień lub dopisz tę funkcję w swoim pliku script.js:

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
            <img class="tab-icon" src="${org.logo || 'https://via.placeholder.com/40'}" alt="${org.name}">
            <div class="tab-info">
                <div class="org-title">${org.name || 'Bez nazwy'}</div>
                <div class="org-sub">${craftCount} receptur(y)</div>
            </div>
        `;

        container.appendChild(tab);
    });
}

// Funkcja filtrowania organizacji
function filterOrganizations() {
    const query = document.getElementById('searchOrgInput').value.toLowerCase();
    const tabs = document.querySelectorAll('.tab-item');
    
    tabs.forEach(tab => {
        const title = tab.querySelector('.org-title').innerText.toLowerCase();
        if (title.includes(query)) {
            tab.style.display = 'flex';
        } else {
            tab.style.display = 'none';
        }
    });
}
