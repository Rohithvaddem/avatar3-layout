// State management
let plotData = [];
let activeFilters = {
    facing: null,
    status: null
};

// Leaflet GIS Map state
let leafletMap = null;
let isSatelliteActive = false;
let leafletMarkers = {};
let activeSearchPlot = null;
const siteBounds = {
    west: 78.53563,
    south: 16.92999,
    east: 78.54038,
    north: 16.93272
};

// Map Pan/Zoom state
let zoomScale = 1.0;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// Coordinate Mapper State
let isMapperMode = false;
let activeMapperPlot = 1;
let mouseDownPos = { x: 0, y: 0 };

// DOM Cache
const mapViewport = document.getElementById('mapViewport');
const mapContainer = document.getElementById('mapContainer');
const mapImage = document.getElementById('mapImage');
const plotsOverlay = document.getElementById('plotsOverlay');
const searchInput = document.getElementById('searchInput');
const searchClearBtn = document.getElementById('searchClearBtn');
const searchSuggestions = document.getElementById('searchSuggestions');
const facingFilterGrid = document.getElementById('facingFilterGrid');
const statusLegendList = document.getElementById('statusLegendList');
const plotModal = document.getElementById('plotModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalBody = document.getElementById('modalBody');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const mapTip = document.getElementById('mapTip');

// Sidebar toggle for mobile
const sidebar = document.getElementById('sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

// Stats DOM
const statTotalPlots = document.getElementById('statTotalPlots');
const statAvailablePlots = document.getElementById('statAvailablePlots');
const statBookedPlots = document.getElementById('statBookedPlots');

// Mapper DOM
const mapperSection = document.getElementById('mapperSection');
const toggleMapperBtn = document.getElementById('toggleMapperBtn');
const mapperPanel = document.getElementById('mapperPanel');
const mapperActivePlot = document.getElementById('mapperActivePlot');
const mapperPlotList = document.getElementById('mapperPlotList');
const mapperExportBtn = document.getElementById('mapperExportBtn');

// Initial Load Setup
window.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupMapControls();
    setupSearch();
    setupFilters();
    setupMobileSidebar();
    setupMapper();
    setupAdmin();
    setupSatelliteToggle();
});

// Main App Initialization
function initApp() {
    // Check local storage first for admin edits
    const localData = localStorage.getItem('aspire_avatar3_data');
    if (localData) {
        try {
            plotData = JSON.parse(localData).filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
            renderPlotDots();
            updateStatistics();
            setTimeout(fitMapToViewport, 100);
            setupAdminState();
            return;
        } catch (e) {
            console.error('Error parsing local storage data', e);
        }
    }

    // 1. Fetch plot data database
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Data fetch failed');
            return response.json();
        })
        .then(data => {
            plotData = data.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
            
            // 2. Render plot markers
            renderPlotDots();
            
            // 3. Calculate statistics
            updateStatistics();
            
            // 4. Set initial view scale (fit to screen)
            setTimeout(fitMapToViewport, 100);
            setupAdminState();
        })
        .catch(err => {
            console.warn('CORS or network error. Falling back to offline dataset (data.js):', err);
            if (typeof plotDataRaw !== 'undefined') {
                plotData = plotDataRaw.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
            } else {
                console.error('Offline dataset not found.');
            }
            
            // Render dots, stats and fit using fallback data
            renderPlotDots();
            updateStatistics();
            setTimeout(fitMapToViewport, 100);
            setupAdminState();
        });
}

// ----------------------------------------------------
// Rendering Plots & Data Setup
// ----------------------------------------------------

function getStatusColor(status) {
    const s = String(status).toUpperCase().trim();
    if (s === 'AVAILABLE') return 'var(--status-available)';
    if (s === 'SOLD' || s === 'BOOKED') return 'var(--status-sold)';
    if (s === 'HOLD') return 'var(--status-hold)';
    if (s === 'MORTGAGE' || s === 'MORTAGAGE') return 'var(--status-mortgage)';
    if (s === 'REGISTERED') return 'var(--status-registered)';
    if (s === 'RESALE') return 'var(--status-resale)';
    if (s === 'INVESTOR') return 'var(--status-investor)';
    return 'var(--status-unknown)';
}

function renderPlotDots() {
    plotsOverlay.innerHTML = '';
    
    // Scale factors: original coords are mapped to 2500x1406 background
    const scaleX = 1024 / 2500;
    const scaleY = 576 / 1406;
    
    // plotCoordinates is a global defined in plot_coords.js
    Object.keys(plotCoordinates).forEach(plotNo => {
        const coords = plotCoordinates[plotNo];
        const detail = plotData.find(p => String(p.plot_no) === String(plotNo));
        const status = detail ? detail.plot_status : 'AVAILABLE';
        
        const dot = document.createElement('button');
        dot.className = 'plot-dot';
        dot.id = `plot-dot-${plotNo}`;
        dot.dataset.plotNo = plotNo;
        dot.dataset.facing = detail && detail.facing ? detail.facing : 'Unknown';
        dot.dataset.status = status;
        
        // CSS custom property to style the background color dynamically
        dot.style.setProperty('--plot-color', getStatusColor(status));
        
        // Center the dot by offseting by half size (15px wide -> 7.5px offset)
        // Scaled coordinates mapping
        dot.style.left = `${(coords.left * scaleX) - 7.5}px`;
        dot.style.top = `${(coords.top * scaleY) - 7.5}px`;
        
        dot.textContent = plotNo;
        
        // Modal Trigger
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMapperMode) return; // Don't trigger details in mapper mode
            openPlotModal(plotNo);
        });
        
        plotsOverlay.appendChild(dot);
    });

    // Synchronize updates with Leaflet markers if Leaflet is initialized
    if (leafletMap) {
        refreshLeafletMarkers();
    }
}

// ----------------------------------------------------
// Map Pan & Zoom Implementation
// ----------------------------------------------------

function setupMapControls() {
    // Mouse dragging to pan
    mapViewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Left click only
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        
        mouseDownPos.x = e.clientX;
        mouseDownPos.y = e.clientY;
        
        mapViewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        applyTransform(true); // run transform without transitioning
        fadeMapTip();
    });

    window.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            mapViewport.style.cursor = 'grab';
            
            // Check if it was a simple click and not a drag
            const dist = Math.sqrt(Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2));
            if (dist < 4) {
                handleMapClick(e);
            }
        }
    });

    // Touch support for mobile panning
    mapViewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - panX;
            startY = e.touches[0].clientY - panY;
            mouseDownPos.x = e.touches[0].clientX;
            mouseDownPos.y = e.touches[0].clientY;
        }
    });

    mapViewport.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        panX = e.touches[0].clientX - startX;
        panY = e.touches[0].clientY - startY;
        applyTransform(true);
        fadeMapTip();
    });

    mapViewport.addEventListener('touchend', (e) => {
        if (isDragging) {
            isDragging = false;
            if (e.changedTouches.length === 1) {
                const dist = Math.sqrt(Math.pow(e.changedTouches[0].clientX - mouseDownPos.x, 2) + Math.pow(e.changedTouches[0].clientY - mouseDownPos.y, 2));
                if (dist < 4) {
                    handleMapClick(e.changedTouches[0]);
                }
            }
        }
    });

    // Scroll wheel to zoom
    mapViewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomIntensity = 0.12;
        const mouseX = e.clientX - mapViewport.getBoundingClientRect().left;
        const mouseY = e.clientY - mapViewport.getBoundingClientRect().top;
        
        // Calculate map coordinates under mouse before zoom
        const mapX = (mouseX - panX) / zoomScale;
        const mapY = (mouseY - panY) / zoomScale;
        
        // Zoom factor update
        const zoomFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
        zoomScale = Math.min(Math.max(zoomScale * zoomFactor, 0.12), 2.5);
        
        // Recalculate pan offset to keep map coordinates centered under cursor
        panX = mouseX - mapX * zoomScale;
        panY = mouseY - mapY * zoomScale;
        
        applyTransform();
        fadeMapTip();
    }, { passive: false });

    // Buttons actions
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        if (isSatelliteActive) return;
        adjustZoom(1.25);
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        if (isSatelliteActive) return;
        adjustZoom(0.8);
    });

    document.getElementById('zoomResetBtn').addEventListener('click', () => {
        if (isSatelliteActive) return;
        fitMapToViewport();
    });
}

function adjustZoom(factor) {
    const rect = mapViewport.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const mapX = (centerX - panX) / zoomScale;
    const mapY = (centerY - panY) / zoomScale;
    
    zoomScale = Math.min(Math.max(zoomScale * factor, 0.12), 2.5);
    
    panX = centerX - mapX * zoomScale;
    panY = centerY - mapY * zoomScale;
    
    applyTransform();
    fadeMapTip();
}

function fitMapToViewport() {
    const vWidth = mapViewport.clientWidth;
    const vHeight = mapViewport.clientHeight;
    
    // Background original dims: width: 1024, height: 576
    const fitScale = Math.min(vWidth / 1024, vHeight / 576) * 0.95; // 5% margins
    zoomScale = Math.max(fitScale, 0.1);
    
    // Centering calculations
    panX = (vWidth - 1024 * zoomScale) / 2;
    panY = (vHeight - 576 * zoomScale) / 2;
    
    applyTransform();
}

function applyTransform(noTransition = false) {
    if (noTransition) {
        mapContainer.style.transition = 'none';
    } else {
        mapContainer.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    mapContainer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
}

function fadeMapTip() {
    if (mapTip) {
        mapTip.classList.add('fade-out');
        setTimeout(() => mapTip.remove(), 600);
    }
}

// ----------------------------------------------------
// Search Bar Logic
// ----------------------------------------------------

function setupSearch() {
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim().toLowerCase();
        
        if (val.length > 0) {
            searchClearBtn.style.display = 'block';
            renderSearchSuggestions(val);
        } else {
            searchClearBtn.style.display = 'none';
            searchSuggestions.style.display = 'none';
            
            // Remove active highlighters
            document.querySelectorAll('.plot-dot.highlighted').forEach(dot => {
                dot.classList.remove('highlighted');
            });
            
            activeSearchPlot = null;
            applyFilters();
        }
    });

    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchSuggestions.style.display = 'none';
        
        // Remove active highlighters
        document.querySelectorAll('.plot-dot.highlighted').forEach(dot => {
            dot.classList.remove('highlighted');
        });
        
        activeSearchPlot = null;
        applyFilters();
    });

    // Close suggestions dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box') && !e.target.closest('#searchSuggestions')) {
            searchSuggestions.style.display = 'none';
        }
    });
}

function renderSearchSuggestions(query) {
    const matches = Object.keys(plotCoordinates)
        .filter(no => no.toLowerCase().startsWith(query))
        .slice(0, 5); // Max 5 suggestions
        
    if (matches.length > 0) {
        searchSuggestions.innerHTML = '';
        matches.forEach(plotNo => {
            const detail = plotData.find(p => String(p.plot_no) === String(plotNo));
            const status = detail ? detail.plot_status : 'AVAILABLE';
            
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <span>Plot <strong>${plotNo}</strong></span>
                <span style="color: ${getStatusColor(status)}; font-size: 11px; font-weight: 700;">${status}</span>
            `;
            
            div.addEventListener('click', () => {
                focusOnPlot(plotNo);
                searchInput.value = plotNo;
                searchSuggestions.style.display = 'none';
            });
            searchSuggestions.appendChild(div);
        });
        searchSuggestions.style.display = 'block';
    } else {
        searchSuggestions.style.display = 'none';
    }
}

function focusOnPlot(plotNo) {
    const coords = plotCoordinates[plotNo];
    if (!coords) return;
    
    // Set active search plot and filter out all other plot dots
    activeSearchPlot = plotNo;
    applyFilters();
    
    // Highlight Target Dot (2D)
    document.querySelectorAll('.plot-dot.highlighted').forEach(dot => {
        dot.classList.remove('highlighted');
    });
    
    const dot = document.getElementById(`plot-dot-${plotNo}`);
    if (dot) dot.classList.add('highlighted');

    // Leaflet Satellite Focus & Highlight
    if (leafletMap) {
        document.querySelectorAll('.leaflet-plot-marker.highlighted').forEach(m => {
            m.classList.remove('highlighted');
        });
        const markerEl = document.getElementById(`leaflet-plot-marker-${plotNo}`);
        if (markerEl) markerEl.classList.add('highlighted');
        
        // Calculate Lat/Lng
        const width2D = 2500;
        const height2D = 1406;
        const lng = siteBounds.west + (coords.left / width2D) * (siteBounds.east - siteBounds.west);
        const lat = siteBounds.north - (coords.top / height2D) * (siteBounds.north - siteBounds.south);
        
        leafletMap.setView([lat, lng], 19);
    }
    
    // Scale factors: original coords are mapped to 2500x1406 background
    const scaleX = 1024 / 2500;
    const scaleY = 576 / 1406;
    
    // Zoom close and Center on coordinates
    zoomScale = 1.0; // close up zoom
    const vWidth = mapViewport.clientWidth;
    const vHeight = mapViewport.clientHeight;
    
    panX = vWidth / 2 - (coords.left * scaleX) * zoomScale;
    panY = vHeight / 2 - (coords.top * scaleY) * zoomScale;
    
    applyTransform();
    
    // Open plot details modal
    openPlotModal(plotNo);
}

// ----------------------------------------------------
// Filtering & Legend Systems
// ----------------------------------------------------

function setupFilters() {
    // Facing pills filters
    facingFilterGrid.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        
        const isAlreadyActive = pill.classList.contains('active');
        
        // Remove active state from other pills
        document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        
        if (isAlreadyActive) {
            activeFilters.facing = null;
        } else {
            pill.classList.add('active');
            activeFilters.facing = pill.dataset.facing;
        }
        
        applyFilters();
    });

    document.getElementById('facingResetBtn').addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        activeFilters.facing = null;
        applyFilters();
    });
}

function applyFilters() {
    const dots = document.querySelectorAll('.plot-dot');
    
    dots.forEach(dot => {
        const plotNo = dot.dataset.plotNo;
        const facing = dot.dataset.facing;
        const status = dot.dataset.status;
        
        let matchesFacing = true;
        let matchesStatus = true;
        let matchesSearch = true;
        
        // 1. Check Search Filter
        if (activeSearchPlot) {
            matchesSearch = String(plotNo) === String(activeSearchPlot);
        }
        
        // 2. Check Facing Filter
        if (activeFilters.facing) {
            matchesFacing = String(facing).toLowerCase().trim() === activeFilters.facing.toLowerCase().trim();
        }
        
        // 3. Check Status Filter
        if (activeFilters.status) {
            matchesStatus = String(status).toLowerCase().trim() === activeFilters.status.toLowerCase().trim();
        }
        
        // Apply filtered visibility
        if (matchesFacing && matchesStatus && matchesSearch) {
            dot.classList.remove('filtered-out');
            dot.classList.remove('search-filtered');
        } else {
            if (activeSearchPlot && !matchesSearch) {
                dot.classList.add('search-filtered');
            } else {
                dot.classList.remove('search-filtered');
                dot.classList.add('filtered-out');
            }
        }
    });

    // Synchronize filters on Leaflet markers
    if (leafletMap) {
        Object.keys(leafletMarkers).forEach(plotNo => {
            const marker = leafletMarkers[plotNo];
            const el = marker.getElement();
            if (el) {
                applyLeafletMarkerFilters(marker, el);
            }
        });
    }
}

// ----------------------------------------------------
// Details Modal Functions
// ----------------------------------------------------

function openPlotModal(plotNo) {
    const item = plotData.find(p => String(p.plot_no) === String(plotNo)) || {
        plot_no: plotNo,
        plot_size: 'N/A',
        facing: 'N/A',
        plot_status: 'AVAILABLE',
        dim_north: 'N/A',
        dim_south: 'N/A',
        dim_east: 'N/A',
        dim_west: 'N/A',
        customer_name: 'N/A',
        reference_name: 'N/A'
    };
    
    const color = getStatusColor(item.plot_status);
    
    let editButtonHtml = '';
    if (isAdminLoggedIn) {
        editButtonHtml = `
            <button class="admin-login-btn" id="editPlotBtn" style="background: var(--accent); color: #fff; border: none; font-weight: 700; width: 100%; margin-top: 15px; cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 14px;">
                <i class="fa-solid fa-pen-to-square"></i> Edit Plot Details
            </button>
        `;
    }
    
    modalBody.innerHTML = `
        <div class="detail-card">
            <div class="detail-row">
                <span class="detail-label">Plot Number</span>
                <span class="detail-val" style="font-size: 18px; font-weight: 700; color: var(--accent)"># ${item.plot_no}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="status-badge" style="--badge-color: ${color}; --badge-glow: ${color}">${item.plot_status}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Plot Area</span>
                <span class="detail-val">${item.plot_size ? item.plot_size + ' Sq. Yards' : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Facing Direction</span>
                <span class="detail-val">${item.facing || 'N/A'}</span>
            </div>
            <div class="detail-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
                <span class="detail-label">Boundary Dimensions</span>
                <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; font-weight: 600; padding: 4px 6px; background: rgba(255,255,255,0.02); border-radius: 6px;">
                    <div>North: ${item.dim_north || 'N/A'}</div>
                    <div>South: ${item.dim_south || 'N/A'}</div>
                    <div>East: ${item.dim_east || 'N/A'}</div>
                    <div>West: ${item.dim_west || 'N/A'}</div>
                </div>
            </div>
            <div class="detail-row">
                <span class="detail-label">Customer Name</span>
                <span class="detail-val">${item.customer_name ? (isAdminLoggedIn ? item.customer_name : maskName(item.customer_name)) : 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Reference / Share</span>
                <span class="detail-val">${item.reference_name || 'N/A'}</span>
            </div>
        </div>
        ${editButtonHtml}
    `;
    
    if (isAdminLoggedIn) {
        const editBtn = document.getElementById('editPlotBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                openPlotEditForm(plotNo);
            });
        }
    }
    
    modalBackdrop.classList.add('show');
}

function maskName(name) {
    if (!name || name === 'N/A' || name === '') return 'N/A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        const p = parts[0];
        if (p.length <= 3) return p;
        return p.slice(0, 2) + '*'.repeat(p.length - 3) + p.slice(-1);
    }
    return parts.map((p, idx) => {
        if (idx === 0) return p;
        return p[0] + '*';
    }).join(' ');
}

// Modal Close logic
modalCloseBtn.addEventListener('click', closePlotModal);
modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closePlotModal();
});
mapViewport.addEventListener('click', (e) => {
    if (e.target === mapViewport || e.target === mapContainer || e.target === mapImage) {
        closePlotModal();
    }
});
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePlotModal();
});

function closePlotModal() {
    modalBackdrop.classList.remove('show');
    
    // Reset active search query & filters when modal is closed
    if (activeSearchPlot) {
        searchInput.value = '';
        searchClearBtn.style.display = 'none';
        searchSuggestions.style.display = 'none';
        document.querySelectorAll('.plot-dot.highlighted').forEach(dot => {
            dot.classList.remove('highlighted');
        });
        activeSearchPlot = null;
        applyFilters();
    }
}

// ----------------------------------------------------
// Statistics & Sidebar Legends
// ----------------------------------------------------

function updateStatistics() {
    // Total count of plots is the count of coordinates mapped
    const totalCount = plotData.length;
    statTotalPlots.textContent = totalCount;
    
    const statusCounts = {
        'AVAILABLE': 0,
        'SOLD': 0,
        'HOLD': 0,
        'MORTGAGE': 0,
        'REGISTERED': 0,
        'RESALE': 0,
        'INVESTOR': 0
    };
    
    // Initialize count with actual database values
    plotData.forEach(item => {
        let status = item.plot_status;
        if (status === 'MORTAGAGE') status = 'MORTGAGE';
        if (status === 'BOOKED') status = 'SOLD';
        
        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        } else {
            statusCounts['AVAILABLE']++; 
        }
    });

    // Update Header Counts (Available vs Booked/Sold)
    // Placed dots counts
    const totalPlaced = Object.keys(plotCoordinates).length;
    
    statAvailablePlots.textContent = statusCounts['AVAILABLE'] + statusCounts['RESALE'];
    statBookedPlots.textContent = statusCounts['SOLD'] + statusCounts['REGISTERED'] + statusCounts['HOLD'] + statusCounts['MORTGAGE'] + statusCounts['INVESTOR'];
    
    // Render Legend & Stats in Sidebar
    statusLegendList.innerHTML = '';
    const displayStatuses = [
        { label: 'AVAILABLE', status: 'AVAILABLE' },
        { label: 'SOLD / BOOKED', status: 'SOLD' },
        { label: 'MORTGAGE', status: 'MORTGAGE' },
        { label: 'HOLD', status: 'HOLD' },
        { label: 'RESALE', status: 'RESALE' }
    ];

    displayStatuses.forEach(item => {
        const count = statusCounts[item.status] || 0;
        const color = getStatusColor(item.status);
        
        const row = document.createElement('div');
        row.className = 'legend-item';
        row.dataset.status = item.status;
        row.style.setProperty('--status-color', color);
        
        row.innerHTML = `
            <div class="legend-color-label">
                <span class="legend-color-dot"></span>
                <span>${item.label}</span>
            </div>
            <span class="legend-count">${count}</span>
        `;
        
        row.addEventListener('click', () => {
            const isAlreadyActive = row.classList.contains('active');
            document.querySelectorAll('.legend-item').forEach(item => item.classList.remove('active'));
            
            if (isAlreadyActive) {
                activeFilters.status = null;
            } else {
                row.classList.add('active');
                activeFilters.status = item.status;
            }
            applyFilters();
        });
        
        statusLegendList.appendChild(row);
    });
}

// ----------------------------------------------------
// Coordinate Mapper Tool Implementation
// ----------------------------------------------------

function setupMapper() {
    toggleMapperBtn.addEventListener('click', () => {
        isMapperMode = !isMapperMode;
        if (isMapperMode) {
            toggleMapperBtn.textContent = 'Stop';
            toggleMapperBtn.style.backgroundColor = 'var(--status-registered)';
            mapperPanel.style.display = 'block';
            renderMapperPlotList();
            highlightActiveMapperButton();
        } else {
            toggleMapperBtn.textContent = 'Start';
            toggleMapperBtn.style.backgroundColor = '';
            mapperPanel.style.display = 'none';
        }
    });

    mapperActivePlot.addEventListener('input', (e) => {
        activeMapperPlot = parseInt(e.target.value) || 1;
        highlightActiveMapperButton();
    });

    mapperExportBtn.addEventListener('click', () => {
        const configCode = `const plotCoordinates = ${JSON.stringify(plotCoordinates, null, 4)};`;
        
        modalBody.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px; text-align: left;">
                <p style="font-size: 13px; color: var(--text-secondary);">Copy the code below and paste it into the file <strong>plot_coords.js</strong> in your project directory:</p>
                <textarea id="exportTextarea" readonly style="width: 100%; height: 250px; background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px; outline: none; resize: none;" onclick="this.select()">${configCode}</textarea>
                <button id="copyExportBtn" class="admin-login-btn" style="background-color: var(--status-available); color: #fff; border: none; font-weight: 700; width: 100%;">
                    <i class="fa-solid fa-copy"></i> Copy to Clipboard
                </button>
            </div>
        `;
        
        document.getElementById('copyExportBtn').addEventListener('click', () => {
            const textarea = document.getElementById('exportTextarea');
            textarea.select();
            navigator.clipboard.writeText(textarea.value);
            document.getElementById('copyExportBtn').innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        });
        
        // Show modal
        modalBackdrop.classList.add('show');
    });
}

function renderMapperPlotList() {
    mapperPlotList.innerHTML = '';
    // Plots numbers 1 to 206
    for (let i = 1; i <= 206; i++) {
        const btn = document.createElement('button');
        btn.id = `mapper-btn-${i}`;
        btn.style.padding = '4px';
        btn.style.fontSize = '10px';
        btn.style.fontFamily = 'monospace';
        btn.style.border = '1px solid var(--border-color)';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        
        // Style based on placement state
        const isPlaced = plotCoordinates[i] !== undefined;
        btn.style.backgroundColor = isPlaced ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-tertiary)';
        btn.style.color = isPlaced ? 'var(--status-available)' : 'var(--text-secondary)';
        btn.style.borderColor = isPlaced ? 'var(--status-available)' : 'var(--border-color)';
        
        btn.textContent = i;
        btn.addEventListener('click', () => {
            activeMapperPlot = i;
            mapperActivePlot.value = i;
            highlightActiveMapperButton();
        });
        mapperPlotList.appendChild(btn);
    }
}

function highlightActiveMapperButton() {
    document.querySelectorAll('#mapperPlotList button').forEach(btn => {
        btn.style.outline = 'none';
        btn.style.boxShadow = 'none';
    });
    const activeBtn = document.getElementById(`mapper-btn-${activeMapperPlot}`);
    if (activeBtn) {
        activeBtn.style.outline = '2px solid var(--accent)';
        activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function handleMapClick(e) {
    if (!isMapperMode) return;
    
    // Get click coords relative to the mapImage
    const rect = mapImage.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoomScale;
    const clickY = (e.clientY - rect.top) / zoomScale;
    
    // Scale factors: original coords map to 2500x1406 dimensions
    const scaleX = 1024 / 2500;
    const scaleY = 576 / 1406;
    
    // Convert current click coordinate back to original reference size
    const origLeft = Math.round(clickX / scaleX);
    const origTop = Math.round(clickY / scaleY);
    
    // Save coordinate point
    plotCoordinates[activeMapperPlot] = {
        left: origLeft,
        top: origTop
    };
    
    // Update marker renderings
    renderPlotDots();
    
    // Mark plot button in list as placed
    const activeBtn = document.getElementById(`mapper-btn-${activeMapperPlot}`);
    if (activeBtn) {
        activeBtn.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
        activeBtn.style.color = 'var(--status-available)';
        activeBtn.style.borderColor = 'var(--status-available)';
    }
    
    // Advance mapper active selection to the next plot number
    if (activeMapperPlot < 206) {
        activeMapperPlot++;
        mapperActivePlot.value = activeMapperPlot;
        highlightActiveMapperButton();
    }
}

// ----------------------------------------------------
// Mobile Sidebar Responsive Logic
// ----------------------------------------------------

function setupMobileSidebar() {
    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
    });

    sidebarCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('show');
    });
    
    // Close sidebar on suggestions select or filter select in mobile
    sidebar.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            if (e.target.closest('.suggestion-item') || e.target.closest('.filter-pill') || e.target.closest('.legend-item')) {
                sidebar.classList.remove('show');
            }
        }
    });
}

// ----------------------------------------------------
// Staff Admin CMS Implementation
// ----------------------------------------------------

let isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';

// Admin DOM elements
const loginModalBackdrop = document.getElementById('loginModalBackdrop');
const loginModalCloseBtn = document.getElementById('loginModalCloseBtn');
const loginForm = document.getElementById('loginForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const sidebarFooter = document.getElementById('sidebarFooter');

function setupAdmin() {
    const staffBtn = document.getElementById('staffLoginBtn');
    if (staffBtn) {
        staffBtn.addEventListener('click', () => {
            if (isAdminLoggedIn) return;
            loginModalBackdrop.classList.add('show');
            loginError.style.display = 'none';
            loginForm.reset();
        });
    }

    if (loginModalCloseBtn) {
        loginModalCloseBtn.addEventListener('click', () => {
            loginModalBackdrop.classList.remove('show');
        });
    }

    if (loginModalBackdrop) {
        loginModalBackdrop.addEventListener('click', (e) => {
            if (e.target === loginModalBackdrop) {
                loginModalBackdrop.classList.remove('show');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = loginUsername.value.trim();
            const password = loginPassword.value;

            // Simple login credentials
            if (username === 'admin' && password === 'admin') {
                isAdminLoggedIn = true;
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                loginModalBackdrop.classList.remove('show');
                setupAdminState();
                renderPlotDots(); // Refresh mapping to show admin triggers
                alert('Welcome, Staff! Admin mode has been enabled. You can now edit any plot directly by clicking "Edit Plot Details" inside their modal.');
            } else {
                loginError.style.display = 'block';
            }
        });
    }
}

function setupAdminState() {
    if (!sidebarFooter) return;

    if (isAdminLoggedIn) {
        if (mapperSection) mapperSection.style.display = 'block';
        
        sidebarFooter.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; padding: 0 4px;">
                <button class="admin-login-btn" id="exportDbBtn" style="background-color: var(--accent); color: #fff; border: none; font-weight: 700; cursor: pointer; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; font-size: 13px;">
                    <i class="fa-solid fa-download"></i> Export data.json
                </button>
                <button class="admin-login-btn" id="resetDbBtn" style="background-color: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--border-color); font-weight: 600; cursor: pointer; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; font-size: 11px;">
                    <i class="fa-solid fa-rotate-left"></i> Reset to Default
                </button>
                <button class="admin-login-btn" id="logoutBtn" style="background-color: var(--status-registered); color: #fff; border: none; font-weight: 700; cursor: pointer; padding: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; font-size: 13px;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Admin Logout
                </button>
            </div>
        `;

        // DB Export handler
        document.getElementById('exportDbBtn').addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plotData, null, 4));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "data.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });

        // DB Reset handler
        document.getElementById('resetDbBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to discard all local admin edits and reset back to the default spreadsheet data?')) {
                localStorage.removeItem('aspire_avatar3_data');
                window.location.reload();
            }
        });

        // Logout handler
        document.getElementById('logoutBtn').addEventListener('click', () => {
            isAdminLoggedIn = false;
            sessionStorage.removeItem('isAdminLoggedIn');
            alert('Admin mode disabled.');
            window.location.reload();
        });

        // Setup top indicator banner
        let banner = document.getElementById('adminBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'adminBanner';
            banner.style.cssText = 'background: linear-gradient(90deg, #b45309, #d97706); color: #fff; text-align: center; padding: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; z-index: 1000; position: relative;';
            banner.innerHTML = `<i class="fa-solid fa-user-shield"></i> ADMINISTRATOR MODE ACTIVE &bull; Edit any plot details by opening their card and clicking "Edit Plot Details"`;
            document.body.insertBefore(banner, document.body.firstChild);
        }
    } else {
        if (mapperSection) mapperSection.style.display = 'none';

        sidebarFooter.innerHTML = `
            <button class="admin-login-btn" id="staffLoginBtn" style="border: none; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fa-solid fa-lock"></i> Staff Login
            </button>
        `;

        const banner = document.getElementById('adminBanner');
        if (banner) banner.remove();

        const staffBtn = document.getElementById('staffLoginBtn');
        if (staffBtn) {
            staffBtn.addEventListener('click', () => {
                loginModalBackdrop.classList.add('show');
                loginError.style.display = 'none';
                loginForm.reset();
            });
        }
    }
}

function openPlotEditForm(plotNo) {
    const item = plotData.find(p => String(p.plot_no) === String(plotNo)) || {
        plot_no: plotNo,
        plot_size: '',
        facing: 'East',
        plot_status: 'AVAILABLE',
        dim_north: '-',
        dim_south: '-',
        dim_east: '-',
        dim_west: '-',
        customer_name: '',
        reference_name: ''
    };

    modalBody.innerHTML = `
        <div class="edit-plot-form" style="display: flex; flex-direction: column; gap: 12px; text-align: left; max-height: 70vh; overflow-y: auto; padding-right: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px;">
                <span style="font-weight: 700; color: var(--accent); font-size: 16px;"><i class="fa-solid fa-edit"></i> Edit Plot #${item.plot_no}</span>
                <button id="cancelEditBtn" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                    <i class="fa-solid fa-xmark"></i> Cancel
                </button>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Plot Status</label>
                <select id="editStatus" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none; width: 100%;">
                    <option value="AVAILABLE" ${item.plot_status === 'AVAILABLE' ? 'selected' : ''}>AVAILABLE</option>
                    <option value="SOLD" ${item.plot_status === 'SOLD' ? 'selected' : ''}>SOLD</option>
                    <option value="MORTGAGE" ${item.plot_status === 'MORTGAGE' ? 'selected' : ''}>MORTGAGE</option>
                    <option value="HOLD" ${item.plot_status === 'HOLD' ? 'selected' : ''}>HOLD</option>
                    <option value="RESALE" ${item.plot_status === 'RESALE' ? 'selected' : ''}>RESALE</option>
                </select>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Plot Size (Sq. Yards)</label>
                <input type="text" id="editSize" value="${item.plot_size || ''}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none;">
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Facing Direction</label>
                <select id="editFacing" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none; width: 100%;">
                    <option value="East" ${item.facing === 'East' ? 'selected' : ''}>East</option>
                    <option value="West" ${item.facing === 'West' ? 'selected' : ''}>West</option>
                    <option value="North" ${item.facing === 'North' ? 'selected' : ''}>North</option>
                    <option value="South" ${item.facing === 'South' ? 'selected' : ''}>South</option>
                    <option value="North-East" ${item.facing === 'North-East' ? 'selected' : ''}>North-East</option>
                    <option value="North-West" ${item.facing === 'North-West' ? 'selected' : ''}>North-West</option>
                    <option value="South-East" ${item.facing === 'South-East' ? 'selected' : ''}>South-East</option>
                    <option value="South-West" ${item.facing === 'South-West' ? 'selected' : ''}>South-West</option>
                    <option value="East (Cross)" ${item.facing === 'East (Cross)' ? 'selected' : ''}>East (Cross)</option>
                    <option value="West (Cross)" ${item.facing === 'West (Cross)' ? 'selected' : ''}>West (Cross)</option>
                    <option value="North (Cross)" ${item.facing === 'North (Cross)' ? 'selected' : ''}>North (Cross)</option>
                </select>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">North Boundary</label>
                    <input type="text" id="editNorth" value="${item.dim_north || '-'}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">South Boundary</label>
                    <input type="text" id="editSouth" value="${item.dim_south || '-'}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">East Boundary</label>
                    <input type="text" id="editEast" value="${item.dim_east || '-'}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none;">
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 11px; color: var(--text-secondary);">West Boundary</label>
                    <input type="text" id="editWest" value="${item.dim_west || '-'}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; outline: none;">
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Customer Name</label>
                <input type="text" id="editCustomer" value="${item.customer_name || ''}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none;" placeholder="Full name">
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Reference / Share</label>
                <input type="text" id="editReference" value="${item.reference_name || ''}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none;" placeholder="Developer / Land Owner">
            </div>
            
            <button id="savePlotEditBtn" class="admin-login-btn" style="background: var(--status-available); color: #fff; border: none; font-weight: 700; width: 100%; margin-top: 10px; padding: 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fa-solid fa-save"></i> Save Changes
            </button>
        </div>
    `;

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        openPlotModal(plotNo);
    });

    document.getElementById('savePlotEditBtn').addEventListener('click', () => {
        savePlotEdits(plotNo);
    });
}

function savePlotEdits(plotNo) {
    const editStatus = document.getElementById('editStatus').value;
    const editSize = document.getElementById('editSize').value.trim();
    const editFacing = document.getElementById('editFacing').value;
    const editNorth = document.getElementById('editNorth').value.trim();
    const editSouth = document.getElementById('editSouth').value.trim();
    const editEast = document.getElementById('editEast').value.trim();
    const editWest = document.getElementById('editWest').value.trim();
    const editCustomer = document.getElementById('editCustomer').value.trim();
    const editReference = document.getElementById('editReference').value.trim();

    let idx = plotData.findIndex(p => String(p.plot_no) === String(plotNo));

    const updatedPlot = {
        plot_no: String(plotNo),
        plot_size: editSize,
        facing: editFacing,
        plot_status: editStatus,
        dim_north: editNorth,
        dim_south: editSouth,
        dim_east: editEast,
        dim_west: editWest,
        customer_name: editCustomer,
        reference_name: editReference
    };

    if (idx !== -1) {
        plotData[idx] = updatedPlot;
    } else {
        plotData.push(updatedPlot);
    }

    localStorage.setItem('aspire_avatar3_data', JSON.stringify(plotData));

    renderPlotDots();
    updateStatistics();
    openPlotModal(plotNo);
}

// ----------------------------------------------------
// Real-world Satellite GIS Map Overlay Functions (Leaflet.js)
// ----------------------------------------------------

function setupSatelliteToggle() {
    const toggleBtn = document.getElementById('toggleSatelliteBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isSatelliteActive = !isSatelliteActive;
            toggleSatelliteView();
        });
    }
}

let layoutsGroup = null;
let regionalRoadsGroup = null;
let localRoadsGroup = null;
let projectMarkersGroup = null;

function toggleSatelliteView() {
    const toggleBtn = document.getElementById('toggleSatelliteBtn');
    const leafletContainer = document.getElementById('leafletMapContainer');
    const layerControl = document.getElementById('gisLayerControl');
    const mapControls = document.querySelector('.map-controls');
    
    if (isSatelliteActive) {
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = '<i class="fa-solid fa-map"></i> <span>Schematic View</span>';
        toggleBtn.title = "Switch to 2D Schematic View";
        
        // Hide 2D map & show Leaflet container
        mapContainer.style.display = 'none';
        leafletContainer.style.display = 'block';
        if (layerControl) layerControl.style.display = 'block';
        
        if (mapTip) {
            mapTip.style.display = 'none';
        }
        
        // Initialize Leaflet Map if not done already
        if (!leafletMap) {
            initLeafletMap();
        } else {
            leafletMap.invalidateSize();
            // Recenter map on active project center
            const centerLat = (siteBounds.south + siteBounds.north) / 2;
            const centerLng = (siteBounds.west + siteBounds.east) / 2;
            leafletMap.setView([centerLat, centerLng], 17);
        }
    } else {
        toggleBtn.classList.remove('active');
        toggleBtn.innerHTML = '<i class="fa-solid fa-earth-americas"></i> <span>Satellite View</span>';
        toggleBtn.title = "Switch to Satellite Map View";
        
        // Show 2D map & hide Leaflet container
        mapContainer.style.display = 'block';
        leafletContainer.style.display = 'none';
        if (layerControl) layerControl.style.display = 'none';
        
        if (mapTip) {
            mapTip.style.display = 'flex';
            mapTip.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> Drag to Pan &bull; Scroll or Pinch to Zoom';
        }
        
        // Highlight active filters or highlights in 2D View
        applyFilters();
        fitMapToViewport();
    }
}

function initLeafletMap() {
    const centerLat = (siteBounds.south + siteBounds.north) / 2;
    const centerLng = (siteBounds.west + siteBounds.east) / 2;
    
    leafletMap = L.map('leafletMapContainer', {
        zoomControl: false, // Hiding default zoom to use our custom floating controls
        center: [centerLat, centerLng],
        zoom: 17,
        maxZoom: 21,
        minZoom: 13
    });
    
    // Initialize LayerGroups and add them to map
    layoutsGroup = L.layerGroup().addTo(leafletMap);
    regionalRoadsGroup = L.layerGroup().addTo(leafletMap);
    localRoadsGroup = L.layerGroup().addTo(leafletMap);
    projectMarkersGroup = L.layerGroup().addTo(leafletMap);
    
    // Bind our custom map controls to Leaflet
    document.getElementById('zoomInBtn').addEventListener('click', (e) => {
        if (isSatelliteActive && leafletMap) {
            e.stopPropagation();
            leafletMap.zoomIn();
        }
    });
    
    document.getElementById('zoomOutBtn').addEventListener('click', (e) => {
        if (isSatelliteActive && leafletMap) {
            e.stopPropagation();
            leafletMap.zoomOut();
        }
    });
    
    document.getElementById('zoomResetBtn').addEventListener('click', (e) => {
        if (isSatelliteActive && leafletMap) {
            e.stopPropagation();
            leafletMap.setView([centerLat, centerLng], 17);
        }
    });
    
    // Satellite Layer (Esri World Imagery)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxZoom: 21
    }).addTo(leafletMap);

    // Setup L.ImageOverlay.Rotated extension
    if (!L.ImageOverlay.Rotated) {
        L.ImageOverlay.Rotated = L.ImageOverlay.extend({
            options: {
                rotation: 0
            },
            _reset: function() {
                L.ImageOverlay.prototype._reset.call(this);
                if (this.options.rotation && this._image) {
                    this._image.style.transformOrigin = 'center center';
                    this._image.style.transform += ` rotate(${-this.options.rotation}deg)`;
                }
            },
            _animateZoom: function(e) {
                L.ImageOverlay.prototype._animateZoom.call(this, e);
                if (this.options.rotation && this._image) {
                    this._image.style.transformOrigin = 'center center';
                    this._image.style.transform += ` rotate(${-this.options.rotation}deg)`;
                }
            }
        });

        L.imageOverlay.rotated = function(url, bounds, options) {
            return new L.ImageOverlay.Rotated(url, bounds, options);
        };
    }
    
    // Parse doc.kml file
    fetch('doc.kml')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load KML file');
            return response.text();
        })
        .then(kmlText => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
            
            // Helper to parse aabbggrr color string to Leaflet color and opacity
            function parseKmlColor(kmlColorStr) {
                if (!kmlColorStr || kmlColorStr.length !== 8) return { color: '#3b82f6', opacity: 0.85 };
                const aHex = kmlColorStr.substring(0, 2);
                const bHex = kmlColorStr.substring(2, 4);
                const gHex = kmlColorStr.substring(4, 6);
                const rHex = kmlColorStr.substring(6, 8);
                
                const r = parseInt(rHex, 16);
                const g = parseInt(gHex, 16);
                const b = parseInt(bHex, 16);
                const a = parseInt(aHex, 16) / 255;
                
                const hexColor = "#" + 
                    r.toString(16).padStart(2, '0') + 
                    g.toString(16).padStart(2, '0') + 
                    b.toString(16).padStart(2, '0');
                
                return { color: hexColor, opacity: a };
            }

            // Parse KML Styles
            const styles = {};
            const styleMaps = {};
            
            // Extract Style elements
            const styleNodes = xmlDoc.getElementsByTagName('Style');
            for (let i = 0; i < styleNodes.length; i++) {
                const styleNode = styleNodes[i];
                const id = styleNode.getAttribute('id') || styleNode.getAttribute('kml:id');
                if (!id) continue;
                
                const lineStyle = styleNode.getElementsByTagName('LineStyle')[0];
                let colorInfo = null;
                let width = null;
                if (lineStyle) {
                    const colorNode = lineStyle.getElementsByTagName('color')[0];
                    if (colorNode) colorInfo = parseKmlColor(colorNode.textContent);
                    
                    const widthNode = lineStyle.getElementsByTagName('width')[0];
                    if (widthNode) width = parseFloat(widthNode.textContent);
                }
                styles[id] = {
                    color: colorInfo?.color || '#3b82f6',
                    opacity: colorInfo !== null ? colorInfo.opacity : 0.85,
                    width: width !== null ? width : 3
                };
            }
            
            // Extract gx:CascadingStyle elements
            const cascadingStyleNodes = xmlDoc.getElementsByTagName('gx:CascadingStyle');
            for (let i = 0; i < cascadingStyleNodes.length; i++) {
                const csNode = cascadingStyleNodes[i];
                const id = csNode.getAttribute('kml:id') || csNode.getAttribute('id');
                if (!id) continue;
                
                const styleNode = csNode.getElementsByTagName('Style')[0];
                if (styleNode) {
                    const lineStyle = styleNode.getElementsByTagName('LineStyle')[0];
                    let colorInfo = null;
                    let width = null;
                    if (lineStyle) {
                        const colorNode = lineStyle.getElementsByTagName('color')[0];
                        if (colorNode) colorInfo = parseKmlColor(colorNode.textContent);
                        
                        const widthNode = lineStyle.getElementsByTagName('width')[0];
                        if (widthNode) width = parseFloat(widthNode.textContent);
                    }
                    styles[id] = {
                        color: colorInfo?.color || '#3b82f6',
                        opacity: colorInfo !== null ? colorInfo.opacity : 0.85,
                        width: width !== null ? width : 3
                    };
                }
            }
            
            // Extract StyleMap elements
            const styleMapNodes = xmlDoc.getElementsByTagName('StyleMap');
            for (let i = 0; i < styleMapNodes.length; i++) {
                const styleMapNode = styleMapNodes[i];
                const id = styleMapNode.getAttribute('id') || styleMapNode.getAttribute('kml:id');
                if (!id) continue;
                
                const pairs = styleMapNode.getElementsByTagName('Pair');
                for (let j = 0; j < pairs.length; j++) {
                    const key = pairs[j].getElementsByTagName('key')[0]?.textContent;
                    if (key === 'normal') {
                        let styleUrl = pairs[j].getElementsByTagName('styleUrl')[0]?.textContent || '';
                        if (styleUrl.startsWith('#')) styleUrl = styleUrl.substring(1);
                        styleMaps[id] = styleUrl;
                    }
                }
            }

            function getPlacemarkStyle(pmNode) {
                let styleUrl = pmNode.getElementsByTagName('styleUrl')[0]?.textContent || '';
                if (styleUrl.startsWith('#')) styleUrl = styleUrl.substring(1);
                
                // Resolve StyleMap to Style ID
                if (styleMaps[styleUrl]) {
                    styleUrl = styleMaps[styleUrl];
                }
                
                const resolved = styles[styleUrl];
                return {
                    color: resolved?.color || '#3b82f6',
                    opacity: resolved !== undefined ? resolved.opacity : 0.85,
                    width: resolved?.width || 3
                };
            }
            
            // Parse GroundOverlays
            const groundOverlays = xmlDoc.getElementsByTagName('GroundOverlay');
            for (let i = 0; i < groundOverlays.length; i++) {
                const overlayNode = groundOverlays[i];
                const name = overlayNode.getElementsByTagName('name')[0]?.textContent || 'Layout Overlay';
                const href = overlayNode.getElementsByTagName('href')[0]?.textContent || '';
                const latLonBox = overlayNode.getElementsByTagName('LatLonBox')[0];
                const visibilityNode = overlayNode.getElementsByTagName('visibility')[0];
                const isVisible = visibilityNode ? visibilityNode.textContent !== '0' : true;
                
                // Only add GroundOverlays that are visible by default
                if (latLonBox && href && isVisible) {
                    const north = parseFloat(latLonBox.getElementsByTagName('north')[0]?.textContent || '0');
                    const south = parseFloat(latLonBox.getElementsByTagName('south')[0]?.textContent || '0');
                    const east = parseFloat(latLonBox.getElementsByTagName('east')[0]?.textContent || '0');
                    const west = parseFloat(latLonBox.getElementsByTagName('west')[0]?.textContent || '0');
                    const rotationNode = latLonBox.getElementsByTagName('rotation')[0];
                    const rotation = rotationNode ? parseFloat(rotationNode.textContent) : 0;
                    
                    const bounds = [[south, west], [north, east]];
                    
                    // Parse custom overlay color/opacity tint
                    const colorNode = overlayNode.getElementsByTagName('color')[0];
                    let overlayOpacity = 0.85;
                    if (colorNode) {
                        const parsedColor = parseKmlColor(colorNode.textContent);
                        overlayOpacity = parsedColor.opacity;
                    }

                    const leafletOverlay = L.imageOverlay.rotated(href, bounds, {
                        rotation: rotation,
                        opacity: overlayOpacity
                    });
                    layoutsGroup.addLayer(leafletOverlay);
                }
            }
            
            // Helper to determine parent folder
            function getParentFolderName(node) {
                let parent = node.parentNode;
                while (parent && parent.nodeName !== 'Folder' && parent.nodeName !== 'Document' && parent.nodeName !== 'kml') {
                    parent = parent.parentNode;
                }
                return parent && parent.nodeName === 'Folder' ? parent.getElementsByTagName('name')[0]?.textContent : '';
            }
            
            // Parse coordinates string
            function parseCoordinates(coordsText) {
                const points = [];
                const coordsArray = coordsText.trim().split(/\s+/);
                for (const coordStr of coordsArray) {
                    if (!coordStr) continue;
                    const parts = coordStr.split(',');
                    if (parts.length >= 2) {
                        const lng = parseFloat(parts[0]);
                        const lat = parseFloat(parts[1]);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            points.push([lat, lng]);
                        }
                    }
                }
                return points;
            }
            
            // Customize marker icons
            function createProjectMarkerIcon(name) {
                return L.divIcon({
                    className: 'custom-gis-marker',
                    html: `
                        <div class="gis-marker-pulse"></div>
                        <div class="gis-marker-dot"></div>
                        <div class="gis-marker-label">${name}</div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
            }
            
            // Parse Placemarks
            const placemarks = xmlDoc.getElementsByTagName('Placemark');
            for (let i = 0; i < placemarks.length; i++) {
                const pmNode = placemarks[i];
                const name = pmNode.getElementsByTagName('name')[0]?.textContent || 'Feature';
                const folderName = getParentFolderName(pmNode) || '';
                
                // LineString (Roads)
                const lineString = pmNode.getElementsByTagName('LineString')[0];
                if (lineString) {
                    const coordsText = lineString.getElementsByTagName('coordinates')[0]?.textContent || '';
                    const coords = parseCoordinates(coordsText);
                    if (coords.length > 0) {
                        const isRegional = folderName.includes('RRR') || folderName.includes('ORR') || name.toLowerCase().includes('orr') || name.toLowerCase().includes('rrr') || name.toLowerCase().includes('highway');
                        const styleInfo = getPlacemarkStyle(pmNode);
                        
                        const polyline = L.polyline(coords, {
                            color: styleInfo.color,
                            weight: styleInfo.width,
                            opacity: styleInfo.opacity
                        });
                        
                        if (isRegional) {
                            polyline.bindTooltip(name, {
                                permanent: true,
                                direction: 'center',
                                className: 'road-label'
                            });
                            regionalRoadsGroup.addLayer(polyline);
                        } else {
                            polyline.bindTooltip(name, {
                                sticky: true,
                                className: 'road-label-local'
                            });
                            localRoadsGroup.addLayer(polyline);
                        }
                    }
                }
                
                // Point (Markers)
                const point = pmNode.getElementsByTagName('Point')[0];
                if (point) {
                    const coordsText = point.getElementsByTagName('coordinates')[0]?.textContent || '';
                    const coords = parseCoordinates(coordsText);
                    if (coords.length > 0) {
                        const marker = L.marker(coords[0], {
                            icon: createProjectMarkerIcon(name)
                        }).bindPopup(`<b>${name}</b>`);
                        
                        projectMarkersGroup.addLayer(marker);
                    }
                }
            }
        })
        .catch(err => {
            console.error('Error loading or parsing KML:', err);
        });
        
    // Setup Layer Checkbox Handlers
    setupLayerToggles();
}

function setupLayerToggles() {
    const toggles = [
        { id: 'toggleLayouts', group: layoutsGroup },
        { id: 'toggleRegionalRoads', group: regionalRoadsGroup },
        { id: 'toggleLocalRoads', group: localRoadsGroup },
        { id: 'toggleProjectMarkers', group: projectMarkersGroup }
    ];
    
    toggles.forEach(t => {
        const checkbox = document.getElementById(t.id);
        if (checkbox) {
            // Synchronize initial state
            if (checkbox.checked) {
                t.group.addTo(leafletMap);
            } else {
                leafletMap.removeLayer(t.group);
            }
            
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    t.group.addTo(leafletMap);
                } else {
                    leafletMap.removeLayer(t.group);
                }
            });
        }
    });
}

function refreshLeafletMarkers() {
    // Disabled plot markers rendering in Satellite GIS View as per user request.
    // The user will coordinate map them themselves.
    return;
}

function applyLeafletMarkerFilters(marker, el) {
    // No-op since markers rendering is disabled in Satellite View.
    return;
}

