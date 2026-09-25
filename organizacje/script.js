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

// Połączenie z bazą
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
var database = firebase.database();

var dataStore = {};
var selectedKey = null;
var isAdmin = false;

// Pobieranie danych z bazy
database.ref('organizacje').on('value', function(snapshot) {
    dataStore = snapshot.val() || {};
    var keys = Object.keys(dataStore);

    if (keys.length > 0 && !selectedKey) {
        selectedKey = keys[0];
    }

    renderSidebar();
    renderView();
});

function renderSidebar() {
    var list = document.getElementById('orgList');
    if (!list) return;
    list.innerHTML = '';

    var keys = Object.keys(dataStore);
    if (keys.length === 0) {
        list.innerHTML = '<div style="padding:10px; color:#aaa;">Brak danych w bazie</div>';
        return;
    }

    keys.forEach(function(key) {
        var org = dataStore[key];
        var active = (key === selectedKey);

        var card = document.createElement('div');
        card.className = 'org-card' + (active ? ' active' : '');
        card.onclick = function() {
            selectedKey = key;
            renderSidebar();
            renderView();
        };

        var img = org.logo || 'https://via.placeholder.com/40';
        var name = org.name || 'Bez nazwy';

        card.innerHTML = 
            '<img src="' + img + '">' +
            '<div class="org-card-info">' +
                '<h3>' + name + '</h3>' +
            '</div>';

        list.appendChild(card);
    });
}

function renderView() {
    var main = document.getElementById('mainContent');
    if (!main) return;

    if (!selectedKey || !dataStore[selectedKey]) {
        main.innerHTML = '<div>Wybierz frakcję z listy obok.</div>';
        return;
    }

    var org = dataStore[selectedKey];

    if (isAdmin && org.isEditing) {
        renderEditMode(main, org);
        return;
    }

    var html = 
        '<div class="hero-banner">' +
            '<div class="hero-left">' +
                '<img src="' + (org.logo || 'https://via.placeholder.com/70') + '" class="hero-logo">' +
                '<div class="hero-title">' +
                    '<h2>' + (org.name || 'Bez nazwy') + '</h2>' +
                '</div>' +
            '</div>' +
            (isAdmin ? '<button class="btn" onclick="toggleEdit()">Edytuj</button>' : '') +
        '</div>';

    if (org.description) {
        html += '<div class="description-box">' + org.description + '</div>';
    }

    main.innerHTML = html;
}

function renderEditMode(container, org) {
    container.innerHTML = 
        '<h3>Edycja: ' + (org.name || '') + '</h3>' +
        '<div class="edit-form">' +
            '<label>Nazwa:</label>' +
            '<input type="text" id="editName" value="' + (org.name || '') + '">' +
            '<label>Logo URL:</label>' +
            '<input type="text" id="editLogo" value="' + (org.logo || '') + '">' +
            '<label>Opis:</label>' +
            '<textarea id="editDesc">' + (org.description || '') + '</textarea>' +
            '<br><br>' +
            '<button class="btn btn-primary" onclick="saveOrg()">Zapisz</button> ' +
            '<button class="btn" onclick="toggleEdit()">Anuluj</button> ' +
            '<button class="btn" style="color:red;" onclick="deleteOrg()">Usuń</button>' +
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
    if (confirm("Usunąć organizację?")) {
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
        description: "Opis..."
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
        alert("Złe hasło!");
    }
}
