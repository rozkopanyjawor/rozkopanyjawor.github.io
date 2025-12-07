// Inicjalizacja mapy
let map;
let markers = [];
let darkModeEnabled = false;
let lightTileLayer;
let darkTileLayer;

// Definicja etapów remontu
const etapyRemontu = [
    { id: 1, nazwa: 'Przygotowanie inwestycji', opis: 'Projektowanie, dokumentacja, pozwolenia' },
    { id: 2, nazwa: 'Organizacja ruchu', opis: 'Tymczasowa organizacja ruchu, zabezpieczenie terenu' },
    { id: 3, nazwa: 'Roboty rozbiórkowe', opis: 'Frezowanie nawierzchni, demontaż krawężników' },
    { id: 4, nazwa: 'Roboty ziemne', opis: 'Wykopy, nasypy, stabilizacja gruntu' },
    { id: 5, nazwa: 'Odtwarzanie konstrukcji', opis: 'Podbudowa i warstwy asfaltu' },
    { id: 6, nazwa: 'Prace towarzyszące', opis: 'Chodniki, odwodnienie, sieci podziemne' },
    { id: 7, nazwa: 'Oznakowanie drogi', opis: 'Znaki poziome i pionowe, bariery' },
    { id: 8, nazwa: 'Odbiory i przywrócenie ruchu', opis: 'Kontrole jakości, odbiór końcowy' }
];

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initMap();
    loadRemontyData();
});

// Inicjalizacja trybu ciemnego
function initDarkMode() {
    // Sprawdź preferencje użytkownika z localStorage
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Ustaw tryb ciemny, jeśli zapisany lub preferowany przez system
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        enableDarkMode();
    }
    
    // Dodaj event listener do przycisku
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', toggleDarkMode);
}

// Przełączenie trybu ciemnego
function toggleDarkMode() {
    if (darkModeEnabled) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

// Włączenie trybu ciemnego
function enableDarkMode() {
    darkModeEnabled = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    
    // Zmień ikonę przycisku
    const toggleBtn = document.getElementById('darkModeToggle');
    toggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
    
    // Przełącz warstwę mapy, jeśli mapa jest zainicjalizowana
    if (map && darkTileLayer && lightTileLayer) {
        map.removeLayer(lightTileLayer);
        darkTileLayer.addTo(map);
    }
}

// Wyłączenie trybu ciemnego
function disableDarkMode() {
    darkModeEnabled = false;
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    
    // Zmień ikonę przycisku
    const toggleBtn = document.getElementById('darkModeToggle');
    toggleBtn.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
    
    // Przełącz warstwę mapy, jeśli mapa jest zainicjalizowana
    if (map && darkTileLayer && lightTileLayer) {
        map.removeLayer(darkTileLayer);
        lightTileLayer.addTo(map);
    }
}


// Inicjalizacja mapy Leaflet
function initMap() {
    // Współrzędne centrum Jawora
    const jaworCenter = [51.0527, 16.1927];
    
    map = L.map('map').setView(jaworCenter, 13);
    
    // Dodanie warstwy mapy jasnej z OpenStreetMap
    lightTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    });
    
    // Dodanie warstwy mapy ciemnej
    darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 18
    });
    
    // Dodaj odpowiednią warstwę w zależności od trybu
    if (darkModeEnabled) {
        darkTileLayer.addTo(map);
    } else {
        lightTileLayer.addTo(map);
    }
}

// Ładowanie danych z JSON
async function loadRemontyData() {
    try {
        const response = await fetch('data/remonty.json');
        const remonty = await response.json();
        
        displayStats(remonty);
        displayRemonty(remonty);
        addMarkersToMap(remonty);
    } catch (error) {
        console.error('Błąd podczas ładowania danych:', error);
        showError();
    }
}

// Wyświetlanie statystyk
function displayStats(remonty) {
    const total = remonty.length;
    const avgStage = Math.round(remonty.reduce((sum, r) => sum + r.etapBiezacy, 0) / total);
    const nearCompletion = remonty.filter(r => r.etapBiezacy >= 7).length;
    const recentUpdates = remonty.filter(r => {
        if (r.aktualizacje && r.aktualizacje.length > 0) {
            const lastUpdate = new Date(r.aktualizacje[0].data);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return lastUpdate >= weekAgo;
        }
        return false;
    }).length;
    
    const statsHTML = `
        <div class="col-md-4 col-sm-6 mb-3">
            <div class="card stat-card stat-primary shadow-sm">
                <div class="card-body">
                    <div class="stat-number text-primary">${total}</div>
                    <div class="stat-label">Aktywne remonty</div>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-3">
            <div class="card stat-card stat-success shadow-sm">
                <div class="card-body">
                    <div class="stat-number text-success">${nearCompletion}</div>
                    <div class="stat-label">Bliskie zakończenia</div>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-3">
            <div class="card stat-card stat-warning shadow-sm">
                <div class="card-body">
                    <div class="stat-number text-warning">${recentUpdates}</div>
                    <div class="stat-label">Aktualizacji w tym tygodniu</div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('stats-container').innerHTML = statsHTML;
}

// Wyświetlanie listy remontów
function displayRemonty(remonty) {
    const container = document.getElementById('remonty-container');
    
    const remontyHTML = remonty.map(remont => {
        const progressColor = getStageColor(remont.etapBiezacy);
        const statusText = getStatusText(remont.etapBiezacy);
        const fundingClass = getFundingClass(remont.zrodloFinansowania);
        const aktualizacjeHTML = generateAktualizacjeHTML(remont.aktualizacje);
        const etapyHTML = generateEtapyHTML(remont.etapyZakonczone, remont.etapBiezacy);
        
        return `
            <div class="card remont-card shadow-sm mb-4">
                <div class="card-header bg-light">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="mb-0">
                                <i class="bi bi-tools"></i> ${remont.nazwa}
                            </h5>
                            <small class="text-muted">
                                <i class="bi bi-geo-alt"></i> ${remont.lokalizacja.ulica}
                            </small>
                        </div>
                        <div class="col-md-4 text-md-end mt-2 mt-md-0">
                            <span class="status-badge badge bg-${progressColor}">${statusText}</span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8 mb-3">
                            <h6>Postęp prac - Etapy remontu</h6>
                            ${etapyHTML}
                        </div>
                        <div class="col-md-4 mb-3">
                            <h6>Własność</h6>
                            <span class="funding-badge ${fundingClass}">
                                <i class="bi bi-bank"></i> ${remont.zrodloFinansowania}
                            </span>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <small class="text-muted d-block">
                                <i class="bi bi-calendar-check"></i> <strong>Rozpoczęcie:</strong> 
                                ${formatDate(remont.dataRozpoczecia)}
                            </small>
                        </div>
                        <div class="col-md-6">
                            <small class="text-muted d-block">
                                <i class="bi bi-calendar-x"></i> <strong>Planowane zakończenie:</strong> 
                                ${formatDate(remont.dataZakonczeniaPlanowana)}
                            </small>
                        </div>
                    </div>
                    
                    ${generateDokumentyHTML(remont.dokumenty)}
                    
                    ${aktualizacjeHTML ? `
                        <div class="mt-3">
                            <h6>Ostatnie aktualizacje</h6>
                            <div class="timeline">
                                ${aktualizacjeHTML}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = remontyHTML;
}

// Generowanie HTML dla dokumentów i linków
function generateDokumentyHTML(dokumenty) {
    if (!dokumenty || dokumenty.length === 0) return '';
    
    return `
        <div class="mt-3">
            <h6>Dokumenty i linki</h6>
            <div class="documents-list">
                ${dokumenty.map(dok => {
                    const { icon, colorClass } = getDocumentIconAndColor(dok.typ);
                    return `
                        <a href="${dok.url}" 
                           target="_blank" 
                           class="document-link ${colorClass}">
                            <i class="bi bi-${icon}"></i>
                            <span class="document-title">${dok.nazwa}</span>
                        </a>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// Funkcja określająca ikonę i kolor dla typu dokumentu
function getDocumentIconAndColor(typ) {
    const typLower = typ.toLowerCase();
    
    if (typLower.includes('przetarg')) {
        return { icon: 'file-earmark-text', colorClass: 'doc-przetarg' };
    }
    if (typLower.includes('umowa')) {
        return { icon: 'file-earmark-check', colorClass: 'doc-umowa' };
    }
    if (typLower.includes('harmonogram')) {
        return { icon: 'calendar-range', colorClass: 'doc-harmonogram' };
    }
    if (typLower.includes('projekt')) {
        return { icon: 'file-earmark-ruled', colorClass: 'doc-projekt' };
    }
    if (typLower.includes('pozwolenie') || typLower.includes('decyzja')) {
        return { icon: 'file-earmark-check', colorClass: 'doc-decyzja' };
    }
    if (typLower.includes('strona') || typLower.includes('www')) {
        return { icon: 'globe', colorClass: 'doc-strona' };
    }
    
    // Domyślny dokument
    return { icon: 'file-earmark', colorClass: 'doc-other' };
}

// Generowanie HTML dla aktualizacji
function generateAktualizacjeHTML(aktualizacje) {
    if (!aktualizacje || aktualizacje.length === 0) return '';
    
    return aktualizacje.map(aktualizacja => {
        let linkHTML = '';
        if (aktualizacja.linkSocialMedia) {
            const { icon, label } = getSocialMediaIconAndLabel(aktualizacja.linkSocialMedia);
            linkHTML = `
                <a href="${aktualizacja.linkSocialMedia}" 
                   target="_blank" 
                   class="social-link">
                    <i class="bi bi-${icon}"></i> ${label}
                </a>
            `;
        }
        
        return `
            <div class="timeline-item">
                <div class="update-date">${formatDate(aktualizacja.data)}</div>
                <div class="update-text">${aktualizacja.tresc}</div>
                ${linkHTML}
            </div>
        `;
    }).join('');
}

// Funkcja określająca ikonę i etykietę na podstawie URL
function getSocialMediaIconAndLabel(url) {
    if (!url) return { icon: 'link-45deg', label: 'Zobacz więcej' };
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
        return { icon: 'facebook', label: 'Zobacz post na Facebook' };
    }
    if (urlLower.includes('instagram.com')) {
        return { icon: 'instagram', label: 'Zobacz na Instagram' };
    }
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        return { icon: 'twitter-x', label: 'Zobacz na X (Twitter)' };
    }
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        return { icon: 'youtube', label: 'Zobacz wideo' };
    }
    if (urlLower.includes('linkedin.com')) {
        return { icon: 'linkedin', label: 'Zobacz na LinkedIn' };
    }
    
    // Dla stron www
    return { icon: 'globe', label: 'Zobacz na stronie' };
}

// Generowanie HTML dla etapów remontu
function generateEtapyHTML(etapyZakonczone, etapBiezacy) {
    // Jeśli remont zakończony, pokaż wszystkie etapy jako zakończone
    if (etapBiezacy === 'zakończony') {
        const randomId = Math.random().toString(36).substr(2, 9);
        return `
            <div class="stages-section mb-2">
                <div class="alert alert-success mb-0" role="alert">
                    <i class="bi bi-check-circle-fill"></i> <strong>Remont zakończony</strong> - wszystkie etapy zrealizowane
                </div>
                <button class="btn btn-sm btn-outline-success stages-toggle collapsed mt-2" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#completed-${randomId}">
                    <i class="bi bi-chevron-down"></i> Wszystkie etapy (8)
                </button>
                <div class="collapse" id="completed-${randomId}">
                    ${etapyRemontu.map(etap => `
                        <div class="stage-item stage-completed">
                            <div class="stage-icon"><i class="bi bi-check-circle-fill text-success"></i></div>
                            <div class="stage-content">
                                <div class="stage-name">${etap.id}. ${etap.nazwa}</div>
                                <div class="stage-description">${etap.opis}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    const zakonczone = [];
    const biezacy = [];
    const oczekujace = [];
    
    etapyRemontu.forEach(etap => {
        let statusClass = '';
        let statusIcon = '';
        
        if (etapyZakonczone.includes(etap.id)) {
            statusClass = 'stage-completed';
            statusIcon = '<i class="bi bi-check-circle-fill text-success"></i>';
            zakonczone.push({ etap, statusClass, statusIcon });
        } else if (etap.id === etapBiezacy) {
            statusClass = 'stage-current';
            statusIcon = '<i class="bi bi-arrow-right-circle-fill text-primary"></i>';
            biezacy.push({ etap, statusClass, statusIcon });
        } else {
            statusClass = 'stage-pending';
            statusIcon = '<i class="bi bi-circle text-muted"></i>';
            oczekujace.push({ etap, statusClass, statusIcon });
        }
    });
    
    const randomId = Math.random().toString(36).substr(2, 9);
    
    let html = '';
    
    // Etapy zakończone (collapsed)
    if (zakonczone.length > 0) {
        html += `
            <div class="stages-section mb-2">
                <button class="btn btn-sm btn-outline-success stages-toggle collapsed" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#completed-${randomId}">
                    <i class="bi bi-chevron-down"></i> Etapy zakończone (${zakonczone.length})
                </button>
                <div class="collapse" id="completed-${randomId}">
                    ${zakonczone.map(item => `
                        <div class="stage-item ${item.statusClass}">
                            <div class="stage-icon">${item.statusIcon}</div>
                            <div class="stage-content">
                                <div class="stage-name">${item.etap.id}. ${item.etap.nazwa}</div>
                                <div class="stage-description">${item.etap.opis}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Etap bieżący (zawsze widoczny)
    if (biezacy.length > 0) {
        html += `
            <div class="stages-section mb-2">
                <div class="stages-header">Etap bieżący</div>
                ${biezacy.map(item => `
                    <div class="stage-item ${item.statusClass}">
                        <div class="stage-icon">${item.statusIcon}</div>
                        <div class="stage-content">
                            <div class="stage-name">${item.etap.id}. ${item.etap.nazwa}</div>
                            <div class="stage-description">${item.etap.opis}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Etapy oczekujące (collapsed)
    if (oczekujace.length > 0) {
        html += `
            <div class="stages-section">
                <button class="btn btn-sm btn-outline-secondary stages-toggle collapsed" type="button" 
                        data-bs-toggle="collapse" data-bs-target="#pending-${randomId}">
                    <i class="bi bi-chevron-down"></i> Etapy do zrobienia (${oczekujace.length})
                </button>
                <div class="collapse" id="pending-${randomId}">
                    ${oczekujace.map(item => `
                        <div class="stage-item ${item.statusClass}">
                            <div class="stage-icon">${item.statusIcon}</div>
                            <div class="stage-content">
                                <div class="stage-name">${item.etap.id}. ${item.etap.nazwa}</div>
                                <div class="stage-description">${item.etap.opis}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

// Dodawanie markerów i ścieżek na mapę
function addMarkersToMap(remonty) {
    // Usunięcie starych markerów
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Dodanie nowych markerów i ścieżek
    remonty.forEach(remont => {
        const polylineColor = getPolylineColor(remont.etapBiezacy);
        
        // Dodanie ścieżki (polyline) jeśli istnieje
        if (remont.lokalizacja.sciezka && remont.lokalizacja.sciezka.length > 0) {
            const polyline = L.polyline(remont.lokalizacja.sciezka, {
                color: polylineColor,
                weight: 6,
                opacity: 0.7,
                smoothFactor: 1
            }).addTo(map);
            
            // Popup dla ścieżki
            const etapInfo = remont.etapBiezacy === 'zakończony' 
                ? 'Zakończony' 
                : `Etap: ${remont.etapBiezacy}/8 - ${etapyRemontu.find(e => e.id === remont.etapBiezacy)?.nazwa || 'Nieznany etap'}`;
            const popupContent = `
                <div class="popup-title">${remont.nazwa}</div>
                <div class="popup-progress">${etapInfo}</div>
                <small>${remont.lokalizacja.ulica}</small>
            `;
            polyline.bindPopup(popupContent);
            
            markers.push(polyline);
        }
        
        // Tworzenie kolorowej ikony dla markera
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${polylineColor}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><div style="transform: rotate(45deg); margin-top: 5px; margin-left: 4px;  font-size: 14px; color: white;">⚠</div></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        // Dodanie markera w centrum lokalizacji
        const marker = L.marker([remont.lokalizacja.lat, remont.lokalizacja.lng], {
            icon: markerIcon
        }).addTo(map);
        
        const statusText2 = getStatusText(remont.etapBiezacy);
        const etapInfo2 = remont.etapBiezacy === 'zakończony' 
            ? 'Zakończony' 
            : `Etap: ${remont.etapBiezacy}/8 - ${etapyRemontu.find(e => e.id === remont.etapBiezacy)?.nazwa || 'Nieznany etap'}`;
        const popupContent = `
            <div class="popup-title">${remont.nazwa}</div>
            <div class="popup-progress">${etapInfo2}</div>
            <small>${remont.lokalizacja.ulica}</small>
        `;
        
        marker.bindPopup(popupContent);
        markers.push(marker);
    });
    
    // Dopasowanie widoku mapy do wszystkich markerów
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Funkcja określająca kolor polyline na podstawie etapu
function getPolylineColor(etap) {
    if (etap === 'zakończony') return '#198754'; // success - zielony
    if (typeof etap === 'number') {
        // Używamy tych samych progrów co getStageColor
        if (etap >= 7) return '#198754'; // success - zielony
        if (etap >= 5) return '#0dcaf0'; // info - niebieski
        if (etap >= 3) return '#ffc107'; // warning - żółty
        return '#dc3545'; // danger - czerwony
    }
    return '#6c757d'; // secondary - szary
}

// Funkcja określająca kolor markera na podstawie etapu
function getMarkerColor(etap) {
    if (etap === 'zakończony') return 'green';
    if (typeof etap === 'number') {
        if (etap >= 7) return 'green';
        if (etap >= 5) return 'blue';
        if (etap >= 3) return 'orange';
        return 'red';
    }
    return 'gray';
}

// Pomocnicze funkcje

function getStageColor(etap) {
    if (etap === 'zakończony') return 'success';
    if (typeof etap === 'number') {
        if (etap >= 7) return 'success';
        if (etap >= 5) return 'info';
        if (etap >= 3) return 'warning';
        return 'danger';
    }
    return 'secondary';
}

function getStatusText(etap) {
    if (etap === 'zakończony') return 'Zakończony';
    if (typeof etap === 'number') {
        if (etap >= 7) return 'Prawie zakończony';
        if (etap >= 5) return 'W zaawansowanej fazie';
        if (etap >= 3) return 'W trakcie';
        return 'Początek prac';
    }
    return 'Nieznany';
}

function getFundingClass(zrodlo) {
    if (zrodlo.toLowerCase().includes('województwo')) return 'funding-wojewodztwo';
    if (zrodlo.toLowerCase().includes('powiat')) return 'funding-powiat';
    if (zrodlo.toLowerCase().includes('miasto')) return 'funding-miasto';
    return 'funding-miasto';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showError() {
    const container = document.getElementById('remonty-container');
    container.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle"></i>
            Wystąpił błąd podczas ładowania danych. Spróbuj odświeżyć stronę.
        </div>
    `;
}
