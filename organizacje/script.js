// Konfiguracja Twojej bazy Firebase
var firebaseConfig = {
    apiKey: "AIzaSyARd3zgC_7SnLZG4c1rmx1E7TOK4sqy2zQ",
    authDomain: "lostmc-db.firebaseapp.com",
    databaseURL: "https://lostmc-db-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "lostmc-db",
    storageBucket: "lostmc-db.firebasestorage.app",
    messagingSenderId: "400562944733",
    appId: "1:400562944733:web:f33720ac90878966557934",
    measurementId: "G-MLMBYZXXFF"
};

// Inicjalizacja Firebase bezpośrednio w JS
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
var database = firebase.database();

var dataStore = {};
var selectedKey = null;
var isAdmin = false;

// Pobieranie danych z bazy po załadowaniu strony
document.addEventListener("DOMContentLoaded", function() {
    var orgsRef = database.ref('organizacje');

    orgsRef.on('value', function(snapshot) {
        dataStore = snapshot.val() || {};
        var keys = Object.keys(dataStore);

        if (keys.length > 0 && (!selectedKey || !dataStore[selectedKey])) {
            selectedKey = keys[0];
        }

        renderSidebar();
        renderView();
    }, function(error) {
        console.error("Błąd połączenia:", error);
        document.getElementById('mainContent').innerHTML = 
            '<div class="loading-state"><p style="color:var(--accent-red)">Błąd połączenia z bazą danych!</p></div>';
    });
});

function renderSidebar() {
    var list = document.getElementById('orgList');
    if (!list) return;
    list.innerHTML = '';

    var keys = Object.keys(dataStore);
    if (keys.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:12px; color:var(--text-muted); font-size:0.85rem;">Brak frakcji w bazie.</div>';
        return;
    }

    keys.forEach(function(key) {
        var org = dataStore[key];
        var active = key === selectedKey;
        var count = org.recipes ? org.recipes.length : 0;

        var card = document.createElement('div');
        card.className = 'org-card ' + (active ? 'active' : '');
        card.onclick = function() {
            selectedKey = key;
            renderSidebar();
            renderView();
        };

        card.innerHTML = 
            '<img src="' + (org.logo || 'https://via.placeholder.com/42') + '" alt="logo">' +
            '<div class="org-card-info">' +
                '<h3>' + (org.name || 'Bez nazwy') + '</h3>' +
                '<p>' + count + ' Receptur</p>' +
            '</div>';
            
        list.appendChild(card);
    });
}

function renderView() {
    var main = document.getElementById('mainContent');
    if (!main) return;

    if (!selectedKey || !dataStore[selectedKey]) {
        main.innerHTML = '<div class="loading-state"><p>Brak wybranej frakcji.</p></div>';
        return;
    }

    var org = dataStore[selectedKey];

    if (isAdmin && org.isEditing) {
        renderEditMode(main, org);
        return;
    }

    var recipesList = '';
    if (org.recipes && org.recipes.length > 0) {
        recipesList = org.recipes.map(function(r) {
            var ings = (r.ingredients || []).map(function(i) {
                return '<div class="ing-item">' +
                            '<span>' + (i.name || 'Składnik') + '</span>' +
                            '<span class="ing-qty">x' + (i.amount || 1) + '</span>' +
                       '</div>';
            }).join('');

            return '<div class="recipe-card">' +
                        '<div class="recipe-header">' +
                            '<img src="' + (r.resultIcon || 'https://via.placeholder.com/44') + '" alt="item">' +
                            '<h4>' + (r.resultName || 'Przedmiot') + '</h4>' +
                        '</div>' +
                        '<div class="section-title">SKŁADNIKI:</div>' +
                        ings +
                   '</div>';
        }).join('');
    } else {
        recipesList = '<p style="color:var(--text-muted); font-size:0.85rem;">Ta frakcja nie posiada jeszcze dodanych receptur.</p>';
    }

    var html = '<div class="hero-banner">' +
                    '<div class="hero-left">' +
                        '<img src="' + (org.logo || 'https://via.placeholder.com/72') + '" class="hero-logo">' +
                        '<div class="hero-title">' +
                            '<h2>' + (org.name || 'Bez nazwy') + '</h2>' +
                            '<span class="badge">FRAKCJA AKTYWNA</span>' +
                        '</div>' +
                    '</div>' +
                    (isAdmin ? '<button class="btn" onclick="toggleEdit()">✏️ EDYTUJ</button>' : '') +
               '</div>';

    if (org.description) {
        html += '<div class="section-title">INFORMACJE O FRAKCJI</div>' +
                '<div class="description-box">' + org.description + '</div>';
    }

    html += '<div class="section-title">RECEPTURY CRAFTINGU</div>' +
            '<div class="crafting-grid">' + recipesList + '</div>';

    main.innerHTML = html;
}

function renderEditMode(container, org) {
    container.innerHTML = 
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">' +
            '<h3>Edytujesz: ' + org.name + '</h3>' +
            '<div style="display:flex; gap:8px;">' +
                '<button class="btn" onclick="toggleEdit()">ANULUJ</button>' +
                '<button class="btn btn-primary" onclick="saveOrg()">ZAPISZ</button>' +
            '</div>' +
        '</div>' +
        '<div class="edit-form">' +
            '<div>' +
                '<label>Nazwa organizacji:</label>' +
                '<input type="text" id="editName" value="' + (org.name || '') + '" style="width:100%;">' +
            '</div>' +
            '<div>' +
                '<label>URL Logo:</label>' +
                '<input type="text" id="editLogo" value="' + (org.logo || '') + '" style="width:100%;">' +
            '</div>' +
            '<div>' +
                '<label>Opis:</label>' +
                '<textarea id="editDesc" rows="5" style="width:100%;">' + (org.description || '') + '</textarea>' +
            '</div>' +
            '<button class="btn" style="color:var(--accent-red); border-color:var(--accent-red); margin-top:10px;" onclick="deleteOrg()">USUŃ ORGANIZACJĘ</button>' +
        '</div>';
}

function toggleEdit() {
    if (!isAdmin) return;
    dataStore[selectedKey].isEditing = !dataStore[selectedKey].isEditing;
    renderView();
}

function saveOrg() {
    dataStore[selectedKey].name = document.getElementById('editName').value;
    dataStore[selectedKey].logo = document.getElementById('editLogo').value;
    dataStore[selectedKey].description = document.getElementById('editDesc').value;
    dataStore[selectedKey].isEditing = false;

    database.ref('organizacje/' + selectedKey).set(dataStore[selectedKey]);
}

function deleteOrg() {
    if (confirm("Czy na pewno chcesz usunąć tę organizację?")) {
        database.ref('organizacje/' + selectedKey).remove();
        delete dataStore[selectedKey];
        selectedKey = Object.keys(dataStore)[0] || null;
        renderSidebar();
        renderView();
    }
}

function createNewOrg() {
    if (!isAdmin) return;
    var newKey = 'org_' + Date.now();
    var newObj = {
        name: "Nowa Frakcja",
        logo: "",
        description: "Opis frakcji...",
        recipes: []
    };
    database.ref('organizacje/' + newKey).set(newObj);
    selectedKey = newKey;
}

function filterOrgs() {
    var q = document.getElementById('searchInput').value.toLowerCase();
    var cards = document.querySelectorAll('.org-card');
    cards.forEach(function(c) {
        var text = c.innerText.toLowerCase();
        c.style.display = text.indexOf(q) !== -1 ? 'flex' : 'none';
    });
}

function openModal() { document.getElementById('loginModal').classList.remove('hidden'); }
function closeModal() { document.getElementById('loginModal').classList.add('hidden'); }

function loginAdmin() {
    var pass = document.getElementById('passInput').value;
    if (pass === "admin123") {
        isAdmin = true;
        document.getElementById('adminBtn').classList.add('active');
        document.getElementById('adminText').innerText = "ADMIN [AKTYWNY]";
        document.getElementById('addOrgBtn').classList.remove('hidden');
        closeModal();
        renderSidebar();
        renderView();
    } else {
        alert("Niepoprawne hasło!");
    }
    document.getElementById('passInput').value = '';
}
