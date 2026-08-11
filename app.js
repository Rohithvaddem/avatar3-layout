// Official Sales WhatsApp Lead Notification Number
const COMPANY_SALES_WHATSAPP = '919100091540';

// State management
let plotData = [];
let activeFilters = {
    facing: null,
    status: null
};

// Layout management pools
let currentProject = 'avatar1';
let avatarDataPool = {
    avatar1: [],
    avatar2: [],
    avatar3: []
};
let avatarCoordsPool = {
    avatar1: {},
    avatar2: {},
    avatar3: {}
};

// Leaflet GIS Map state
let leafletMap = null;
let isSatelliteActive = false;
let leafletMarkers = {};
let activeSearchPlot = null;
let miniMap = null;
let miniMapRect = null;
let simulatedLocks = {};

const projectMetadata = {
    avatar1: {
        title: "Aspirealty Avatar - Phase 1",
        location: "Kadthal, Srisailam Highway, Hyderabad",
        area: "24.49 Acres",
        plots: "328 Plots",
        lpNumber: "TLP No. 224/2023/H (DTCP Approved)",
        status: "Completed & Ready for Construction",
        highlights: [
            "Located in FCDA / Future City zone",
            "RERA Registered project: P02400007808",
            "Mega 70-acre proposed gated community layout",
            "Immediate spot registration & development",
            "Underground drainage, water lines & electricity ready"
        ]
    },
    avatar2: {
        title: "Aspirealty Avatar 2",
        location: "Karkalpahad, Srisailam Highway, Hyderabad",
        area: "17 Acres (1st phase)",
        plots: "96 Plots",
        lpNumber: "RERA Reg: P02400009896 (DTCP Approved)",
        status: "Infrastructure Construction Stage",
        highlights: [
            "Strategic position in FCDA / Future City Development zone",
            "550 meters from the Srisailam Highway",
            "Connected to the 300-ft Tata Greenfield Road",
            "Lush green avenue plantations and overhead water storage",
            "Positioned within the Regional Ring Road (RRR) corridor"
        ]
    },
    avatar3: {
        title: "Aspirealty Avatar 3",
        location: "Karkalapahad, Srisailam Highway, Hyderabad",
        area: "13 Acres",
        plots: "-",
        lpNumber: "DTCP Approved",
        status: "Coming Soon",
        highlights: [
            "Aspirealty Avatar 3 - Coming Soon"
        ]
    }
};

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
    setupProjectNavigation();
    setupInterestModal();

    // Check URL parameters to initialize project and view
    const urlParams = new URLSearchParams(window.location.search);
    const initialProject = urlParams.get('project');
    if (initialProject) {
        const btn = document.querySelector(`.project-nav-btn[data-project="${initialProject}"]`);
        if (btn) {
            btn.click();
        }
    }
});

// Main App Initialization
function initApp() {
    // Populate Avatar 3 coordinates from global variable loaded by plot_coords.js
    if (typeof plotCoordinates !== 'undefined') {
        avatarCoordsPool.avatar3 = plotCoordinates;
    }

    // Populate Avatar 2 coordinates from global variable loaded by avatar2_plot_coords.js
    if (typeof plotCoordinatesAvatar2 !== 'undefined') {
        avatarCoordsPool.avatar2 = plotCoordinatesAvatar2;
    }

    // Populate Avatar 1 coordinates from global variable loaded by avatar1_plot_coords.js
    if (typeof plotCoordinatesAvatar1 !== 'undefined') {
        avatarCoordsPool.avatar1 = plotCoordinatesAvatar1;
    }

    // Load Avatar 3 data from local storage if exists
    const localDataAvatar3 = localStorage.getItem('aspire_avatar3_data');
    if (localDataAvatar3) {
        try {
            avatarDataPool.avatar3 = JSON.parse(localDataAvatar3).filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
        } catch (e) {
            console.error('Error parsing local storage Avatar 3 data', e);
        }
    }
    
    // Load Avatar 2 data from local storage if exists
    const localDataAvatar2 = localStorage.getItem('aspire_avatar2_data');
    if (localDataAvatar2) {
        try {
            avatarDataPool.avatar2 = JSON.parse(localDataAvatar2).filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
        } catch (e) {
            console.error('Error parsing local storage Avatar 2 data', e);
        }
    }

    // Load Avatar 1 data from local storage if exists
    const localDataAvatar1 = localStorage.getItem('aspire_avatar1_data');
    if (localDataAvatar1) {
        try {
            avatarDataPool.avatar1 = JSON.parse(localDataAvatar1).filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
        } catch (e) {
            console.error('Error parsing local storage Avatar 1 data', e);
        }
    }

    // Fetch Avatar 3 JSON
    const fetch3 = fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Data fetch failed');
            return response.json();
        })
        .then(data => {
            if (!avatarDataPool.avatar3.length) {
                avatarDataPool.avatar3 = data.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
            }
        })
        .catch(err => {
            console.warn('CORS or network error. Falling back to offline dataset (data.js) for Avatar 3:', err);
            if (typeof plotDataRaw !== 'undefined' && !avatarDataPool.avatar3.length) {
                avatarDataPool.avatar3 = plotDataRaw.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
            }
        });

    // Fetch Avatar 2 JSON
    const fetch2 = fetch('avatar2_digi/data.json')
        .then(response => {
            if (!response.ok) throw new Error('Data fetch failed');
            return response.json();
        })
        .then(data => {
            const freshData = data.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
            if (!avatarDataPool.avatar2.length) {
                avatarDataPool.avatar2 = freshData;
            } else {
                freshData.forEach(item => {
                    let existing = avatarDataPool.avatar2.find(p => String(p.plot_no) === String(item.plot_no));
                    if (existing) {
                        if (item.customer_name) existing.customer_name = item.customer_name;
                        if (item.plot_status) existing.plot_status = item.plot_status;
                    } else {
                        avatarDataPool.avatar2.push(item);
                    }
                });
            }
        })
        .catch(err => {
            console.warn('CORS or network error. Falling back to offline dataset (avatar2_data.js) for Avatar 2:', err);
            if (typeof plotDataRawAvatar2 !== 'undefined') {
                const fallbackData = plotDataRawAvatar2.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
                if (!avatarDataPool.avatar2.length) {
                    avatarDataPool.avatar2 = fallbackData;
                } else {
                    fallbackData.forEach(item => {
                        let existing = avatarDataPool.avatar2.find(p => String(p.plot_no) === String(item.plot_no));
                        if (existing && item.customer_name) existing.customer_name = item.customer_name;
                    });
                }
            }
        });

    // Fetch Avatar 1 JSON
    const fetch1 = fetch('avatar1_data.json')
        .then(response => {
            if (!response.ok) throw new Error('Data fetch failed');
            return response.json();
        })
        .then(data => {
            const freshData = data.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
            if (!avatarDataPool.avatar1.length) {
                avatarDataPool.avatar1 = freshData;
            } else {
                freshData.forEach(item => {
                    let existing = avatarDataPool.avatar1.find(p => String(p.plot_no) === String(item.plot_no));
                    if (existing) {
                        if (item.customer_name) existing.customer_name = item.customer_name;
                        if (item.plot_status) existing.plot_status = item.plot_status;
                    } else {
                        avatarDataPool.avatar1.push(item);
                    }
                });
            }
        })
        .catch(err => {
            console.warn('CORS or network error. Falling back to offline dataset (avatar1_data.js) for Avatar 1:', err);
            if (typeof plotDataRawAvatar1 !== 'undefined') {
                const fallbackData = plotDataRawAvatar1.filter(item => !isNaN(Number(item.plot_no)) && Number(item.plot_no) > 0);
                if (!avatarDataPool.avatar1.length) {
                    avatarDataPool.avatar1 = fallbackData;
                } else {
                    fallbackData.forEach(item => {
                        let existing = avatarDataPool.avatar1.find(p => String(p.plot_no) === String(item.plot_no));
                        if (existing && item.customer_name) existing.customer_name = item.customer_name;
                    });
                }
            }
        });

    // Fallback coordinates fetch in case script load failed but json works
    let fetchCoordsPromise = Promise.resolve();
    if (!avatarCoordsPool.avatar2 || !Object.keys(avatarCoordsPool.avatar2).length) {
        fetchCoordsPromise = fetch('avatar2_plot_coords.json')
            .then(res => res.json())
            .then(coords => {
                avatarCoordsPool.avatar2 = coords;
            })
            .catch(err => console.error('Failed to load Avatar 2 coordinates from JSON fallback:', err));
    }

    let fetchCoordsPromise1 = Promise.resolve();
    if (!avatarCoordsPool.avatar1 || !Object.keys(avatarCoordsPool.avatar1).length) {
        fetchCoordsPromise1 = fetch('avatar1_plot_coords.json')
            .then(res => res.json())
            .then(coords => {
                avatarCoordsPool.avatar1 = coords;
            })
            .catch(err => console.error('Failed to load Avatar 1 coordinates from JSON fallback:', err));
    }

    Promise.all([fetchCoordsPromise, fetchCoordsPromise1, fetch3, fetch2, fetch1]).finally(() => {
        // Set the active project plotData reference
        plotData = avatarDataPool[currentProject] || [];
        
        updateSidebarAndHeaderForProject(currentProject);

        if (currentProject === 'avatar1') {
            mapContainer.style.width = '1024px';
            mapContainer.style.height = '647px';
            mapImage.style.width = '1024px';
            mapImage.style.height = '647px';
            mapImage.src = 'avatar1_map_layout.jpg';
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

let tooltipRAF = null;

function showPlotHoverTooltip(e, plotNo) {
    if (tooltipRAF) cancelAnimationFrame(tooltipRAF);
    tooltipRAF = requestAnimationFrame(() => {
        const tooltip = document.getElementById('plotHoverTooltip');
        if (!tooltip) return;
        
        const dataSource = avatarDataPool[currentProject] || [];
        const detail = dataSource.find(p => String(p.plot_no) === String(plotNo));
        const status = detail ? detail.plot_status : 'AVAILABLE';
        const facing = detail && detail.facing ? detail.facing : 'N/A';
        const area = detail && detail.plot_size ? detail.plot_size + ' Sq. Yds' : 'N/A';
        const color = getStatusColor(status);
        
        const hoverNo = document.getElementById('hoverPlotNo');
        const hoverStatus = document.getElementById('hoverPlotStatus');
        const hoverArea = document.getElementById('hoverPlotArea');
        const hoverFacing = document.getElementById('hoverPlotFacing');
        
        if (hoverNo) hoverNo.textContent = `Plot #${plotNo}`;
        if (hoverStatus) {
            hoverStatus.textContent = status;
            hoverStatus.style.setProperty('--badge-color', color);
            hoverStatus.style.setProperty('--badge-glow', color);
            hoverStatus.style.backgroundColor = color;
        }
        if (hoverArea) hoverArea.textContent = area;
        if (hoverFacing) hoverFacing.textContent = facing;
        
        // Position tooltip near cursor with offset to avoid blocking cursor
        const x = e.clientX + 15;
        const y = e.clientY - 15;
        
        tooltip.style.left = `${Math.min(x, window.innerWidth - 170)}px`;
        tooltip.style.top = `${Math.max(y, 10)}px`;
        tooltip.classList.add('show');
    });
}

function hidePlotHoverTooltip() {
    const tooltip = document.getElementById('plotHoverTooltip');
    if (tooltip) tooltip.classList.remove('show');
}

function renderPlotDots() {
    plotsOverlay.innerHTML = '';
    
    const comingSoonOverlay = document.getElementById('comingSoonOverlay');
    const coordsSource = avatarCoordsPool[currentProject] || {};
    const dataSource = avatarDataPool[currentProject] || [];
    
    if (currentProject === 'avatar3') {
        if (!isAdminLoggedIn) {
            if (comingSoonOverlay) comingSoonOverlay.style.display = isSatelliteActive ? 'none' : 'flex';
            if (mapContainer) mapContainer.classList.add('blurred-layout');
            return; // Restricted from public view
        } else {
            if (comingSoonOverlay) comingSoonOverlay.style.display = 'none';
            if (mapContainer) mapContainer.classList.remove('blurred-layout');
        }
        
        const scaleX = 1024 / 2500;
        const scaleY = 576 / 1579;
        
        Object.keys(coordsSource).forEach(plotNo => {
            const coords = coordsSource[plotNo];
            const detail = dataSource.find(p => String(p.plot_no) === String(plotNo));
            const status = detail ? detail.plot_status : 'AVAILABLE';
            
            const dot = document.createElement('button');
            dot.className = 'plot-dot';
            dot.id = `plot-dot-${plotNo}`;
            dot.dataset.plotNo = plotNo;
            dot.dataset.facing = detail && detail.facing ? detail.facing : 'Unknown';
            dot.dataset.status = status;
            
            dot.style.setProperty('--plot-color', getStatusColor(status));
            if (isAdminLoggedIn && detail && (detail.customer_name || detail.lead_source)) {
                dot.style.boxShadow = '0 0 0 2px #3b82f6, 0 0 8px var(--plot-color)';
            }
            if (isAdminLoggedIn && simulatedLocks[plotNo]) {
                dot.classList.add('agent-locked');
                dot.title = `Locked by ${simulatedLocks[plotNo].agent} (${simulatedLocks[plotNo].timeAgo}m ago)`;
                const lockBadge = document.createElement('span');
                lockBadge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #7f1d1d; border: 1px solid #f87171; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; z-index: 10;';
                lockBadge.innerHTML = '<i class="fa-solid fa-lock" style="font-size: 8px; color: #f87171; margin: 0; padding: 0; line-height: 1;"></i>';
                dot.appendChild(lockBadge);
            }
            dot.style.left = `${(coords.left * scaleX) - 7.5}px`;
            dot.style.top = `${(coords.top * scaleY) - 7.5}px`;
            dot.textContent = plotNo;
            
            // Hover Tooltip Listeners
            dot.addEventListener('mouseenter', (e) => showPlotHoverTooltip(e, plotNo));
            dot.addEventListener('mousemove', (e) => showPlotHoverTooltip(e, plotNo));
            dot.addEventListener('mouseleave', () => hidePlotHoverTooltip());
            
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                hidePlotHoverTooltip();
                if (isMapperMode) {
                    activeMapperPlot = parseInt(plotNo) || plotNo;
                    if (mapperActivePlot) {
                        mapperActivePlot.value = plotNo;
                    }
                    highlightActiveMapperButton();
                    return;
                }
                openPlotModal(plotNo);
            });
            
            plotsOverlay.appendChild(dot);
        });
    } else {
        // Avatar 1 or Avatar 2
        if (comingSoonOverlay) comingSoonOverlay.style.display = 'none';
        if (mapContainer) mapContainer.classList.remove('blurred-layout');
        
        Object.keys(coordsSource).forEach(plotNo => {
            const coords = coordsSource[plotNo];
            const detail = dataSource.find(p => String(p.plot_no) === String(plotNo));
            const status = detail ? detail.plot_status : 'AVAILABLE';
            
            const dot = document.createElement('button');
            dot.className = 'plot-dot';
            
            let offset = 7.5;
            if (currentProject === 'avatar2') {
                dot.classList.add('avatar2-dot');
                offset = 12;
            }
            
            dot.id = `plot-dot-${plotNo}`;
            dot.dataset.plotNo = plotNo;
            dot.dataset.facing = detail && detail.facing ? detail.facing : 'Unknown';
            dot.dataset.status = status;
            
            dot.style.setProperty('--plot-color', getStatusColor(status));
            if (isAdminLoggedIn && detail && (detail.customer_name || detail.lead_source)) {
                dot.style.boxShadow = '0 0 0 2px #3b82f6, 0 0 8px var(--plot-color)';
            }
            if (isAdminLoggedIn && simulatedLocks[plotNo]) {
                dot.classList.add('agent-locked');
                dot.title = `Locked by ${simulatedLocks[plotNo].agent} (${simulatedLocks[plotNo].timeAgo}m ago)`;
                const lockBadge = document.createElement('span');
                lockBadge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #7f1d1d; border: 1px solid #f87171; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; z-index: 10;';
                lockBadge.innerHTML = '<i class="fa-solid fa-lock" style="font-size: 8px; color: #f87171; margin: 0; padding: 0; line-height: 1;"></i>';
                dot.appendChild(lockBadge);
            }
            dot.style.left = `${coords.left - offset}px`;
            dot.style.top = `${coords.top - offset}px`;
            dot.textContent = plotNo;
            
            // Hover Tooltip Listeners
            dot.addEventListener('mouseenter', (e) => showPlotHoverTooltip(e, plotNo));
            dot.addEventListener('mousemove', (e) => showPlotHoverTooltip(e, plotNo));
            dot.addEventListener('mouseleave', () => hidePlotHoverTooltip());
            
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                hidePlotHoverTooltip();
                if (isMapperMode) {
                    activeMapperPlot = parseInt(plotNo) || plotNo;
                    if (mapperActivePlot) {
                        mapperActivePlot.value = plotNo;
                    }
                    highlightActiveMapperButton();
                    return;
                }
                openPlotModal(plotNo);
            });
            
            plotsOverlay.appendChild(dot);
        });
    }

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

    const recenterBtn = document.getElementById('recenterBtn') || document.getElementById('zoomResetBtn');
    if (recenterBtn) {
        recenterBtn.addEventListener('click', (e) => {
            if (isSatelliteActive && leafletMap) {
                e.stopPropagation();
                const activeLoc = getActiveProjectCenter();
                leafletMap.flyTo(activeLoc, 17, { duration: 1.2 });
            } else {
                fitMapToViewport();
            }
        });
    }
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
    
    let height = 576;
    if (currentProject === 'avatar2') {
        height = 646;
    } else if (currentProject === 'avatar1') {
        height = 647;
    }
    
    // Background original dims: width: 1024, height: dynamic
    const fitScale = Math.min(vWidth / 1024, vHeight / height) * 0.95; // 5% margins
    zoomScale = Math.max(fitScale, 0.1);
    
    // Centering calculations
    panX = (vWidth - 1024 * zoomScale) / 2;
    panY = (vHeight - height * zoomScale) / 2;
    
    applyTransform();
}

let transformRAF = null;

function applyTransform(noTransition = false) {
    if (transformRAF) cancelAnimationFrame(transformRAF);
    transformRAF = requestAnimationFrame(() => {
        if (noTransition) {
            mapContainer.style.transition = 'none';
        } else {
            mapContainer.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        }
        mapContainer.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoomScale})`;
    });
}

function fadeMapTip() {
    // Controlled by setupMapTipTimer for full 10-second display
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
    if (currentProject === 'avatar3' && !isAdminLoggedIn) {
        searchSuggestions.style.display = 'none';
        return;
    }
    const coordsSource = avatarCoordsPool[currentProject] || {};
    const matches = Object.keys(coordsSource)
        .filter(no => no.toLowerCase().startsWith(query))
        .slice(0, 5); // Max 5 suggestions
        
    if (matches.length > 0) {
        searchSuggestions.innerHTML = '';
        matches.forEach(plotNo => {
            const dataSource = avatarDataPool[currentProject] || [];
            const detail = dataSource.find(p => String(p.plot_no) === String(plotNo));
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
    if (currentProject === 'avatar3' && !isAdminLoggedIn) {
        return;
    }
    const coordsSource = avatarCoordsPool[currentProject] || {};
    const coords = coordsSource[plotNo];
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
        
        let width2D = 2500;
        let height2D = 1579;
        if (currentProject === 'avatar2') {
            width2D = 1024;
            height2D = 646;
        } else if (currentProject === 'avatar1') {
            width2D = 1024;
            height2D = 647;
        }
        const lng = siteBounds.west + (coords.left / width2D) * (siteBounds.east - siteBounds.west);
        const lat = siteBounds.north - (coords.top / height2D) * (siteBounds.north - siteBounds.south);
        
        leafletMap.setView([lat, lng], 19);
    }
    
    let x2d = coords.left;
    let y2d = coords.top;
    if (currentProject === 'avatar3') {
        const scaleX = 1024 / 2500;
        const scaleY = 576 / 1579;
        x2d = coords.left * scaleX;
        y2d = coords.top * scaleY;
    }
    
    // Zoom close and Center on coordinates
    zoomScale = 2.0; // close up zoom
    const vWidth = mapViewport.clientWidth;
    const vHeight = mapViewport.clientHeight;
    
    panX = vWidth / 2 - x2d * zoomScale;
    panY = vHeight / 2 - y2d * zoomScale;
    
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

function formatNotesList(notes) {
    if (!Array.isArray(notes) || notes.length === 0) return '<div style="color: var(--text-muted); font-style: italic;">No notes recorded.</div>';
    return notes.map(note => `<div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; margin-bottom: 4px; font-size: 11px; word-break: break-word;">${note}</div>`).join('');
}

function exportPriceQuote(plotNo) {
    const item = plotData.find(p => String(p.plot_no) === String(plotNo)) || {
        plot_no: plotNo,
        plot_size: '200',
        facing: 'East',
        plot_status: 'AVAILABLE',
        customer_name: ''
    };

    const plotAreaYds = parseFloat(String(item.plot_size || '').replace(/[^0-9.]/g, '')) || 200;
    const facingStr = item.facing || 'EAST';
    const customerName = item.customer_name || '';

    const projectMeta = projectMetadata[currentProject] || { title: currentProject === 'avatar1' ? "Aspirealty AVATAR 1" : "Aspirealty AVATAR 2" };
    
    // Base Price per sq. yard: Avatar 1 = ₹23,999, Avatar 2 & others = ₹15,499
    const defaultBaseRate = (currentProject === 'avatar1') ? 23999 : 15499;
    const initialTotalAmount = Math.round(plotAreaYds * defaultBaseRate);
    const initialBankTotal = Math.round(plotAreaYds * 3000);
    const initialCashTotal = Math.max(0, initialTotalAmount - initialBankTotal);
    const initialCashRate = Math.max(0, defaultBaseRate - 3000);

    const initialBooking = 100000;
    const initialAmt1 = Math.round(initialTotalAmount * 0.25);
    const initialAmt2 = Math.max(0, initialTotalAmount - initialBooking - initialAmt1);

    const initialReg75 = Math.round(initialBankTotal * 0.075);
    const initialMutation = Math.max(800, Math.round(initialBankTotal * 0.001));
    const initialRegTotal = initialReg75 + 1000 + 100 + 50 + 5000 + initialMutation;

    const fmt = (v) => '₹ ' + Math.round(v).toLocaleString('en-IN');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups to generate the Price Quote.");
        return;
    }

    const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Price Quote - Plot #${item.plot_no} - ${projectMeta.title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: 'Outfit', sans-serif;
                    background: #f1f5f9;
                    color: #0f172a;
                    margin: 0;
                    padding: 20px;
                    font-size: 12.5px;
                }
                .no-print {
                    max-width: 850px;
                    margin: 0 auto 20px auto;
                }
                .btn-print-quote {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: #ffffff;
                    border: none;
                    padding: 14px 32px;
                    font-size: 15px;
                    font-weight: 800;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .btn-print-quote:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.35);
                }

                [contenteditable="true"] {
                    transition: background 0.15s, outline 0.15s;
                    border-radius: 3px;
                }
                [contenteditable="true"]:hover {
                    outline: 1.5px dashed #2563eb !important;
                    background-color: rgba(37, 99, 235, 0.08) !important;
                    cursor: text;
                }
                [contenteditable="true"]:focus {
                    outline: 2px solid #1d4ed8 !important;
                    background-color: #ffffff !important;
                }

                .quote-container {
                    max-width: 850px;
                    margin: 0 auto;
                    background: #ffffff;
                    border: 2px solid #0f172a;
                    padding: 30px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                }
                .quote-banner {
                    background: #e2e8f0;
                    border: 1.5px solid #0f172a;
                    text-align: center;
                    font-size: 24px;
                    font-weight: 800;
                    padding: 8px;
                    margin-bottom: -1px;
                    position: relative;
                }
                .quote-date {
                    position: absolute;
                    right: 15px;
                    top: 12px;
                    font-size: 12px;
                    font-weight: 700;
                }
                .q-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: -1px;
                }
                .q-table th, .q-table td {
                    border: 1.5px solid #0f172a;
                    padding: 6px 12px;
                    font-size: 12.5px;
                    text-align: left;
                }
                .q-table th {
                    background: #f1f5f9;
                    font-weight: 700;
                    color: #0f172a;
                    text-transform: uppercase;
                    font-size: 11px;
                }
                .bg-yellow { background: #fef08a !important; font-weight: 700; }
                .bg-green { background: #dcfce7 !important; font-weight: 800; font-size: 13.5px; }
                .notes-block {
                    font-size: 10.5px;
                    font-weight: 700;
                    line-height: 1.6;
                    border: 1.5px solid #0f172a;
                    border-top: none;
                    padding: 10px;
                }
                .notes-title { color: #0f172a; font-weight: 800; }
                .red-heading { color: #dc2626; font-weight: 800; font-size: 12px; }
                .sig-row {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                    padding-top: 10px;
                    font-weight: 800;
                    font-size: 12px;
                }

                @media print {
                    .no-print { display: none !important; }
                    body { background: #ffffff !important; padding: 0 !important; }
                    .quote-container { border: none !important; padding: 0 !important; max-width: 100% !important; box-shadow: none !important; }
                    [contenteditable="true"] { outline: none !important; background: transparent !important; }
                }
            </style>
        </head>
        <body>
            <div class="quote-container">
                <div class="quote-banner">
                    <span contenteditable="true">Price Quote</span>
                    <span class="quote-date">DATE: <span id="lblDate" contenteditable="true">${todayStr}</span></span>
                </div>

                <!-- Client Info Table -->
                <table class="q-table">
                    <tr>
                        <td style="width: 20%; font-weight: 700; background: #f8fafc;" contenteditable="true">Client Name</td>
                        <td style="width: 80%; font-weight: 700;" id="lblClientName" contenteditable="true">${customerName || '-'}</td>
                    </tr>
                    <tr>
                        <td style="font-weight: 700; background: #f8fafc;" contenteditable="true">Address</td>
                        <td id="lblAddress" contenteditable="true">-</td>
                    </tr>
                </table>

                <!-- Project & Closing Price Table -->
                <table class="q-table">
                    <thead>
                        <tr>
                            <th style="width: 35%;" contenteditable="true">Project Name</th>
                            <th style="width: 20%; text-align: center;" contenteditable="true">Plot No.</th>
                            <th style="width: 20%; text-align: center;" contenteditable="true">Facing</th>
                            <th style="width: 25%; text-align: right;" contenteditable="true">Per sq.yd.</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight: 800;" contenteditable="true">${projectMeta.title}</td>
                            <td style="font-weight: 700; text-align: center;" contenteditable="true">${item.plot_no}</td>
                            <td style="font-weight: 700; text-align: center; text-transform: uppercase;" contenteditable="true">${facingStr}</td>
                            <td class="bg-yellow" style="text-align: right;" id="lblClosingPrice" contenteditable="true">${fmt(defaultBaseRate)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Price Quotation Table -->
                <div style="background: #f1f5f9; border: 1.5px solid #0f172a; padding: 4px 12px; font-weight: 800; border-top: none; border-bottom: none; text-align: center;" contenteditable="true">Price Quotation</div>
                <table class="q-table">
                    <thead>
                        <tr>
                            <th style="width: 30%; text-align: center;" contenteditable="true">Total sq.yds</th>
                            <th style="width: 35%; text-align: right;" contenteditable="true">Closing Price</th>
                            <th style="width: 35%; text-align: right;" contenteditable="true">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="bg-yellow" style="text-align: center;" id="lblPlotArea" contenteditable="true">${plotAreaYds}</td>
                            <td style="text-align: right;" id="lblPerSqYd" contenteditable="true">${fmt(defaultBaseRate)}</td>
                            <td class="bg-green" style="text-align: right;" id="lblTotalAmount" contenteditable="true">${fmt(initialTotalAmount)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Payment Structure Table -->
                <div style="background: #f1f5f9; border: 1.5px solid #0f172a; padding: 4px 12px; font-weight: 800; border-top: none; border-bottom: none; text-align: center;" contenteditable="true">Payment Structure</div>
                <table class="q-table">
                    <thead>
                        <tr>
                            <th style="width: 30%;" contenteditable="true">Payment Mode</th>
                            <th style="width: 25%; text-align: center;" contenteditable="true">Total sq.yd</th>
                            <th style="width: 25%; text-align: right;" contenteditable="true">Per sq.yd.</th>
                            <th style="width: 20%; text-align: right;" contenteditable="true">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong contenteditable="true">By A/C Transfer</strong></td>
                            <td style="text-align: center;" id="lblBankSqYd" contenteditable="true">${plotAreaYds}</td>
                            <td class="bg-yellow" style="text-align: right;" id="lblBankRate" contenteditable="true">₹ 3,000</td>
                            <td style="text-align: right;" id="lblBankTotal" contenteditable="true">${fmt(initialBankTotal)}</td>
                        </tr>
                        <tr>
                            <td><strong contenteditable="true">By Cash</strong></td>
                            <td style="text-align: center;" id="lblCashSqYd" contenteditable="true">${plotAreaYds}</td>
                            <td class="bg-yellow" style="text-align: right;" id="lblCashRate" contenteditable="true">${fmt(initialCashRate)}</td>
                            <td style="text-align: right;" id="lblCashTotal" contenteditable="true">${fmt(initialCashTotal)}</td>
                        </tr>
                        <tr class="bg-green">
                            <td colspan="3" style="text-align: right; font-weight: 800;" contenteditable="true">Total</td>
                            <td style="text-align: right;" id="lblStructTotal" contenteditable="true">${fmt(initialTotalAmount)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Payment Schedule Table -->
                <div style="background: #f1f5f9; border: 1.5px solid #0f172a; padding: 4px 12px; font-weight: 800; border-top: none; border-bottom: none; text-align: center;" contenteditable="true">Payment Schedule</div>
                <table class="q-table">
                    <thead>
                        <tr>
                            <th style="width: 25%;" contenteditable="true">Date</th>
                            <th style="width: 35%;" contenteditable="true">Particulars</th>
                            <th style="width: 20%; text-align: center;" contenteditable="true">Percentage (%)</th>
                            <th style="width: 20%; text-align: right;" contenteditable="true">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td id="lblDateBooking" contenteditable="true">${todayStr}</td>
                            <td><strong contenteditable="true">BOOKING AMOUNT</strong></td>
                            <td style="text-align: center;" contenteditable="true">-</td>
                            <td style="text-align: right;" contenteditable="true">₹ 1,00,000</td>
                        </tr>
                        <tr>
                            <td id="lblDatePart2" contenteditable="true">-</td>
                            <td><strong id="lblScheduleLabel1" contenteditable="true">WITHIN 15 DAYS</strong></td>
                            <td style="text-align: center;" id="lblPct1" contenteditable="true">25%</td>
                            <td style="text-align: right;" id="lblAmt1" contenteditable="true">${fmt(initialAmt1)}</td>
                        </tr>
                        <tr>
                            <td id="lblDatePart3" contenteditable="true">-</td>
                            <td><strong id="lblScheduleLabel2" contenteditable="true">WITHIN 45 DAYS</strong></td>
                            <td style="text-align: center;" contenteditable="true">100%</td>
                            <td style="text-align: right;" id="lblAmt2" contenteditable="true">${fmt(initialAmt2)}</td>
                        </tr>
                        <tr class="bg-green">
                            <td colspan="3" style="text-align: right; font-weight: 800;" contenteditable="true">TOTAL</td>
                            <td style="text-align: right;" id="lblScheduleTotal" contenteditable="true">${fmt(initialTotalAmount)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Standard Notes -->
                <div class="notes-block">
                    <div class="notes-title" contenteditable="true">NOTE 1 : EXTRA CORPUS FUND 200/- Rs Per SQ Yd ( Not Included In Plot Cost )</div>
                    <div class="notes-title" contenteditable="true">NOTE 2 : Documentation Charges 5,000 and Registration Charges - 7.6% on Sale Deed Value, these charges are not included in the Price Quotation</div>
                    <div class="notes-title" contenteditable="true">NOTE 3: IN CASE OF PLOT CANCEL AFTER 15 DAYS FROM THE BOOKING DATE, A CHARGE OF RS.50000/- WILL APPLY.</div>
                </div>

                <!-- Registration Charges Table -->
                <table class="q-table" style="margin-top: 10px;">
                    <tbody>
                        <tr>
                            <td style="width: 65%;" class="red-heading" contenteditable="true">REGISTRATION CHARGES: 7.5% ON TOTAL BANK AMOUNT</td>
                            <td style="width: 35%; text-align: right; font-weight: 700;" id="lblReg75" contenteditable="true">${fmt(initialReg75)}</td>
                        </tr>
                        <tr>
                            <td contenteditable="true">USER CHARGES</td>
                            <td style="text-align: right; font-weight: 700;" contenteditable="true">1000</td>
                        </tr>
                        <tr>
                            <td contenteditable="true">STAMP</td>
                            <td style="text-align: right; font-weight: 700;" contenteditable="true">100</td>
                        </tr>
                        <tr>
                            <td contenteditable="true">HARITHA HARAM</td>
                            <td style="text-align: right; font-weight: 700;" contenteditable="true">50</td>
                        </tr>
                        <tr>
                            <td contenteditable="true">DOCUMENTATION CHARGES</td>
                            <td style="text-align: right; font-weight: 700;" contenteditable="true">5000</td>
                        </tr>
                        <tr>
                            <td contenteditable="true">MUTATION 0.1%</td>
                            <td style="text-align: right; font-weight: 700;" id="lblMutation" contenteditable="true">${initialMutation.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr class="bg-green">
                            <td style="font-weight: 800;" contenteditable="true">TOTAL REGISTRATION CHARGES</td>
                            <td style="text-align: right;" id="lblRegTotal" contenteditable="true">${fmt(initialRegTotal)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="sig-row">
                    <div contenteditable="true">CUSTOMER SIGN :</div>
                    <div contenteditable="true">AUTHORISED SIGN :</div>
                </div>
            </div>

            <!-- Print / Save as PDF Button placed at the DOWN of the page -->
            <div class="no-print" style="text-align: center; margin-top: 30px; margin-bottom: 40px;">
                <button class="btn-print-quote" onclick="window.print()"><i class="fa-solid fa-print"></i> Print / Save Official Price Quote PDF</button>
            </div>

            <script>
                function attachLiveRecalculation() {
                    function parseNum(str) {
                        if (!str) return 0;
                        const cleaned = str.replace(/[^0-9.]/g, '');
                        return parseFloat(cleaned) || 0;
                    }

                    function fmt(val) {
                        return '₹ ' + Math.round(val).toLocaleString('en-IN');
                    }

                    function updateCalculations() {
                        const active = document.activeElement;
                        const areaEl = document.getElementById('lblPlotArea');
                        const closingPriceEl = document.getElementById('lblClosingPrice');
                        const perSqYdEl = document.getElementById('lblPerSqYd');
                        const bankRateEl = document.getElementById('lblBankRate');

                        const plotArea = parseNum(areaEl ? areaEl.innerText : '200');
                        
                        let closingPrice = parseNum(closingPriceEl ? closingPriceEl.innerText : (perSqYdEl ? perSqYdEl.innerText : '15499'));
                        const bankRate = parseNum(bankRateEl ? bankRateEl.innerText : '3000');

                        const totalAmount = Math.round(plotArea * closingPrice);
                        const bankTotal = Math.round(plotArea * bankRate);
                        const cashTotal = Math.max(0, totalAmount - bankTotal);
                        const cashRate = Math.max(0, closingPrice - bankRate);

                        const bookingAmt = 100000;
                        const amt1 = Math.round(totalAmount * 0.25);
                        const amt2 = Math.max(0, totalAmount - bookingAmt - amt1);

                        const reg75 = Math.round(bankTotal * 0.075);
                        const mutation = Math.max(800, Math.round(bankTotal * 0.001));
                        const totalRegCharges = reg75 + 1000 + 100 + 50 + 5000 + mutation;

                        const totalAmtEl = document.getElementById('lblTotalAmount');
                        if (totalAmtEl && totalAmtEl !== active) totalAmtEl.innerText = fmt(totalAmount);

                        const bankTotalEl = document.getElementById('lblBankTotal');
                        if (bankTotalEl && bankTotalEl !== active) bankTotalEl.innerText = fmt(bankTotal);

                        const cashRateEl = document.getElementById('lblCashRate');
                        if (cashRateEl && cashRateEl !== active) cashRateEl.innerText = fmt(cashRate);

                        const cashTotalEl = document.getElementById('lblCashTotal');
                        if (cashTotalEl && cashTotalEl !== active) cashTotalEl.innerText = fmt(cashTotal);

                        const structTotalEl = document.getElementById('lblStructTotal');
                        if (structTotalEl && structTotalEl !== active) structTotalEl.innerText = fmt(totalAmount);

                        const amt1El = document.getElementById('lblAmt1');
                        if (amt1El && amt1El !== active) amt1El.innerText = fmt(amt1);

                        const amt2El = document.getElementById('lblAmt2');
                        if (amt2El && amt2El !== active) amt2El.innerText = fmt(amt2);

                        const scheduleTotalEl = document.getElementById('lblScheduleTotal');
                        if (scheduleTotalEl && scheduleTotalEl !== active) scheduleTotalEl.innerText = fmt(totalAmount);

                        const reg75El = document.getElementById('lblReg75');
                        if (reg75El && reg75El !== active) reg75El.innerText = fmt(reg75);

                        const mutationEl = document.getElementById('lblMutation');
                        if (mutationEl && mutationEl !== active) mutationEl.innerText = mutation.toLocaleString('en-IN');

                        const regTotalEl = document.getElementById('lblRegTotal');
                        if (regTotalEl && regTotalEl !== active) regTotalEl.innerText = fmt(totalRegCharges);
                    }

                    ['lblPlotArea', 'lblClosingPrice', 'lblPerSqYd', 'lblBankRate'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.addEventListener('input', updateCalculations);
                            el.addEventListener('keyup', updateCalculations);
                            el.addEventListener('blur', function() {
                                const val = parseNum(el.innerText);
                                if (val > 0) {
                                    el.innerText = fmt(val);
                                }
                                updateCalculations();
                            });
                        }
                    });
                }
                attachLiveRecalculation();
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function openPlotModal(plotNo) {
    if (currentProject === 'avatar3' && !isAdminLoggedIn) {
        return; // Avatar 3 plot details restricted prior to public launch
    }
    const item = plotData.find(p => String(p.plot_no) === String(plotNo)) || {
        plot_no: plotNo,
        plot_size: 'N/A',
        facing: 'N/A',
        plot_status: 'AVAILABLE',
        dim_north: 'N/A',
        dim_south: 'N/A',
        dim_east: 'N/A',
        dim_west: 'N/A',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        lead_source: '',
        pipeline_stage: '',
        crm_notes: []
    };
    
    const color = getStatusColor(item.plot_status);
    
    let conflictWarningHtml = '';
    let editButtonHtml = '';
    const isLockedByOther = isAdminLoggedIn && simulatedLocks[plotNo];
    
    if (isLockedByOther) {
        conflictWarningHtml = `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 11px; color: #fca5a5; display: flex; align-items: flex-start; gap: 8px; line-height: 1.4;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-top: 2px; font-size: 14px; color: #f87171;"></i>
                <div>
                    <span style="font-weight: 700; color: #f87171;">Agent Lock Active!</span><br>
                    Agent <strong>${simulatedLocks[plotNo].agent}</strong> is currently editing this plot details (session active ${simulatedLocks[plotNo].timeAgo}m ago). Editing is disabled to prevent data overwriting.
                </div>
            </div>
        `;
    }
    
    let adminCrmHtml = '';
    if (isAdminLoggedIn) {
        adminCrmHtml = `
            <div class="crm-details-section" style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px; text-align: left; display: flex; flex-direction: column; gap: 8px;">
                <div style="font-weight: 700; color: var(--accent); font-size: 13px; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <i class="fa-solid fa-address-card"></i> CRM & Lead Details
                </div>
                <div class="detail-row" style="padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <span class="detail-label" style="font-size: 11px;">Client Name</span>
                    <span class="detail-val" style="font-size: 12px; font-weight: 600;">${item.customer_name || 'N/A'}</span>
                </div>
                <div class="detail-row" style="padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <span class="detail-label" style="font-size: 11px;">Phone</span>
                    <span class="detail-val" style="font-size: 12px; font-weight: 600;">${item.customer_phone || 'N/A'}</span>
                </div>
                <div class="detail-row" style="padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <span class="detail-label" style="font-size: 11px;">Email</span>
                    <span class="detail-val" style="font-size: 12px; font-weight: 600;">${item.customer_email || 'N/A'}</span>
                </div>
                <div class="detail-row" style="padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <span class="detail-label" style="font-size: 11px;">Lead Source</span>
                    <span class="detail-val" style="font-size: 12px; font-weight: 600;">${item.lead_source || 'N/A'}</span>
                </div>
                <div style="margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Recent Notes Log:</div>
                    <div style="background: rgba(0,0,0,0.25); padding: 8px; border-radius: 8px; font-size: 11px; max-height: 120px; overflow-y: auto; color: var(--text-secondary); line-height: 1.4; border: 1px solid var(--border-color);">
                        ${formatNotesList(item.crm_notes)}
                    </div>
                </div>
            </div>
        `;
        if (isLockedByOther) {
            editButtonHtml = `
                <button class="admin-login-btn" id="editPlotBtn" disabled style="background: rgba(255,255,255,0.05); color: var(--text-secondary); border: 1px solid var(--border-color); font-weight: 700; width: 100%; margin-top: 15px; cursor: not-allowed; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 14px; opacity: 0.6;">
                    <i class="fa-solid fa-lock"></i> Edit Locked (Agent Active)
                </button>
            `;
        } else {
            editButtonHtml = `
                <button class="admin-login-btn" id="editPlotBtn" style="background: var(--accent); color: #fff; border: none; font-weight: 700; width: 100%; margin-top: 15px; cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 14px;">
                    <i class="fa-solid fa-pen-to-square"></i> Edit Plot Details
                </button>
            `;
        }
    }
    
    const plotAreaYds = parseFloat(String(item.plot_size || '').replace(/[^0-9.]/g, '')) || 200;
    let sqYdRate = 15499; // Default rate per sq. yard (Avatar 2: 15,499)
    if (currentProject === 'avatar1') {
        sqYdRate = 23999; // Avatar 1 rate per sq. yard: 23,999
    } else if (currentProject === 'avatar2') {
        sqYdRate = 15499;
    }
    const estimatedPlotCost = plotAreaYds * sqYdRate;
    const isAvailable = String(item.plot_status || '').toUpperCase() === 'AVAILABLE';

    let emiHtml = '';

    modalBody.innerHTML = `
        <div class="detail-card" style="display: flex; flex-direction: column; gap: 10px;">
            ${conflictWarningHtml}
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
            ${item.customer_name ? `
            <div class="detail-row" style="padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.05);">
                <span class="detail-label"><i class="fa-solid fa-user-check" style="color: #60a5fa; margin-right: 4px;"></i> Customer Name</span>
                <span class="detail-val" style="font-weight: 700; color: #60a5fa;">${item.customer_name}</span>
            </div>
            ` : ''}

            ${emiHtml}
            ${adminCrmHtml}
        </div>
        <button class="admin-login-btn" id="exportPriceQuoteBtn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; font-weight: 700; width: 100%; margin-top: 10px; cursor: pointer; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 14px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
            <i class="fa-solid fa-file-invoice-dollar"></i> Generate Price Quote / PDF
        </button>
        ${editButtonHtml}
    `;

    if (isAvailable && !isAdminLoggedIn) {
        // Initialize EMI Slider calculations for available plots
        function calculateEmi() {
            const totalPlotCost = plotAreaYds * sqYdRate;
            const downPct = parseFloat(document.getElementById('emiDownRange')?.value) || 20;
            const rateAnnual = parseFloat(document.getElementById('emiRateRange')?.value) || 8.5;
            const tenureYears = parseInt(document.getElementById('emiTenureRange')?.value) || 15;

            if (document.getElementById('emiDownVal')) document.getElementById('emiDownVal').textContent = downPct + '%';
            if (document.getElementById('emiRateVal')) document.getElementById('emiRateVal').textContent = rateAnnual + '%';
            if (document.getElementById('emiTenureVal')) document.getElementById('emiTenureVal').textContent = tenureYears + ' Yrs';

            const principal = totalPlotCost * (1 - (downPct / 100));
            const r = (rateAnnual / 12) / 100;
            const n = tenureYears * 12;

            let emi = 0;
            if (r > 0 && n > 0) {
                emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            }

            const emiDisplay = document.getElementById('emiMonthlyVal');
            if (emiDisplay) {
                emiDisplay.textContent = '₹ ' + Math.round(emi).toLocaleString('en-IN') + ' / mo';
            }
        }

        ['emiDownRange', 'emiRateRange', 'emiTenureRange'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateEmi);
        });

        calculateEmi();

        // Toggle EMI accordion
        const toggleBtn = document.getElementById('emiCalcToggle');
        const calcBody = document.getElementById('emiCalcBody');
        const chevron = document.getElementById('emiChevron');
        if (toggleBtn && calcBody) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = calcBody.style.display === 'none';
                calcBody.style.display = isHidden ? 'flex' : 'none';
                if (chevron) chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
            });
        }
    }
    
    const exportQuoteBtn = document.getElementById('exportPriceQuoteBtn') || document.getElementById('exportSpecSheetBtn');
    if (exportQuoteBtn) {
        exportQuoteBtn.addEventListener('click', () => {
            exportPriceQuote(plotNo);
        });
    }

    if (isAdminLoggedIn && !isLockedByOther) {
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
    const coordsSource = avatarCoordsPool[currentProject] || {};
    const totalPlaced = Object.keys(coordsSource).length;
    
    statAvailablePlots.textContent = statusCounts['AVAILABLE'] + statusCounts['RESALE'];
    statBookedPlots.textContent = statusCounts['SOLD'] + statusCounts['REGISTERED'] + statusCounts['HOLD'] + statusCounts['MORTGAGE'] + statusCounts['INVESTOR'];
    
    // Render Legend & Stats in Sidebar
    statusLegendList.innerHTML = '';
    const displayStatuses = [
        { label: 'AVAILABLE', status: 'AVAILABLE' },
        { label: 'SOLD / BOOKED', status: 'SOLD' },
        { label: 'MORTGAGE', status: 'MORTGAGE' },
        { label: 'HOLD', status: 'HOLD' },
        { label: 'REGISTERED', status: 'REGISTERED' },
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
        const coordsSource = avatarCoordsPool[currentProject] || {};
        const configCode = `const plotCoordinates = ${JSON.stringify(coordsSource, null, 4)};`;
        
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
    let maxPlots = 206;
    if (currentProject === 'avatar2') {
        maxPlots = 96;
    } else if (currentProject === 'avatar1') {
        maxPlots = 328;
    }
    const coordsSource = avatarCoordsPool[currentProject] || {};
    for (let i = 1; i <= maxPlots; i++) {
        const btn = document.createElement('button');
        btn.id = `mapper-btn-${i}`;
        btn.style.padding = '4px';
        btn.style.fontSize = '10px';
        btn.style.fontFamily = 'monospace';
        btn.style.border = '1px solid var(--border-color)';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        
        // Style based on placement state
        const isPlaced = coordsSource[i] !== undefined;
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
    
    let origLeft, origTop;
    if (currentProject === 'avatar3') {
        const scaleX = 1024 / 2500;
        const scaleY = 576 / 1579;
        origLeft = Math.round(clickX / scaleX);
        origTop = Math.round(clickY / scaleY);
    } else {
        origLeft = Math.round(clickX);
        origTop = Math.round(clickY);
    }
    
    // Save coordinate point
    const coordsSource = avatarCoordsPool[currentProject] || {};
    coordsSource[activeMapperPlot] = {
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
    let maxPlots = 206;
    if (currentProject === 'avatar2') {
        maxPlots = 96;
    } else if (currentProject === 'avatar1') {
        maxPlots = 328;
    }
    if (activeMapperPlot < maxPlots) {
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

function updateSimulatedLocks() {
    simulatedLocks = {};
    if (!isAdminLoggedIn) return;
    
    const coordsSource = avatarCoordsPool[currentProject] || {};
    const coordsKeys = Object.keys(coordsSource);
    if (coordsKeys.length === 0) return;
    
    const agents = ["Suresh K.", "Anitha M.", "Kiran P.", "Rajesh V."];
    const count = Math.min(2, coordsKeys.length);
    for (let i = 0; i < count; i++) {
        let attempts = 0;
        let randomPlot;
        do {
            randomPlot = coordsKeys[Math.floor(Math.random() * coordsKeys.length)];
            attempts++;
        } while (simulatedLocks[randomPlot] && attempts < 20);
        
        const randomAgent = agents[(i + Math.floor(Math.random() * 4)) % agents.length];
        const randomTime = Math.floor(Math.random() * 8) + 2; // 2 to 10 mins ago
        
        simulatedLocks[randomPlot] = {
            agent: randomAgent,
            timeAgo: randomTime
        };
    }
}

function togglePitchMode() {
    let styleTag = document.getElementById('pitchModeStyle');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'pitchModeStyle';
        styleTag.textContent = `
            .pitch-mode-active #sidebar {
                display: none !important;
            }
            .pitch-mode-active .header-bar {
                display: none !important;
            }
            .pitch-mode-active .dashboard-container {
                grid-template-columns: 1fr !important;
                padding: 0 !important;
                height: 100vh !important;
                width: 100vw !important;
            }
            .pitch-mode-active .main-content {
                padding: 0 !important;
                height: 100vh !important;
                width: 100vw !important;
                overflow: hidden !important;
            }
            .pitch-mode-active .map-viewport-wrapper {
                height: 100vh !important;
                border-radius: 0 !important;
                border: none !important;
            }
            .pitch-mode-active #adminBanner {
                display: none !important;
            }
        `;
        document.head.appendChild(styleTag);
    }
    
    document.body.classList.toggle('pitch-mode-active');
    
    const isPitchActive = document.body.classList.contains('pitch-mode-active');
    if (isPitchActive) {
        let exitBtn = document.getElementById('exitPitchModeBtn');
        if (!exitBtn) {
            exitBtn = document.createElement('button');
            exitBtn.id = 'exitPitchModeBtn';
            exitBtn.style.cssText = 'position: fixed; top: 15px; right: 15px; z-index: 10000; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); color: #fff; padding: 10px 18px; border-radius: 30px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.6); transition: all 0.2s ease; font-family: var(--font-body);';
            exitBtn.innerHTML = '<i class="fa-solid fa-desktop"></i> Exit Pitch Mode';
            exitBtn.addEventListener('click', () => {
                document.body.classList.remove('pitch-mode-active');
                exitBtn.remove();
                window.dispatchEvent(new Event('resize'));
            });
            document.body.appendChild(exitBtn);
        }
    } else {
        const exitBtn = document.getElementById('exitPitchModeBtn');
        if (exitBtn) exitBtn.remove();
    }
    
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

function setupAdminState() {
    if (!sidebarFooter) return;

    if (isAdminLoggedIn) {
        updateSimulatedLocks();
        if (!window.lockIntervalId) {
            window.lockIntervalId = setInterval(() => {
                if (isAdminLoggedIn) {
                    updateSimulatedLocks();
                    renderPlotDots();
                }
            }, 30000);
        }
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
            if (window.lockIntervalId) {
                clearInterval(window.lockIntervalId);
                window.lockIntervalId = null;
            }
            if (document.body.classList.contains('pitch-mode-active')) {
                document.body.classList.remove('pitch-mode-active');
            }
            const exitBtn = document.getElementById('exitPitchModeBtn');
            if (exitBtn) exitBtn.remove();
            
            alert('Admin mode disabled.');
            window.location.reload();
        });

        // Setup top indicator banner
        let banner = document.getElementById('adminBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'adminBanner';
            banner.style.cssText = 'background: linear-gradient(90deg, #b45309, #d97706); color: #fff; text-align: center; padding: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; z-index: 1000; position: relative;';
            banner.innerHTML = `<i class="fa-solid fa-user-shield"></i> ADMINISTRATOR MODE ACTIVE &bull; Edit any plot details by opening their card and clicking "Edit Plot Details" <button id="togglePitchModeBtn" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; margin-left: 15px;"><i class="fa-solid fa-desktop"></i> Pitch Mode</button>`;
            document.body.insertBefore(banner, document.body.firstChild);
            
            const togglePitchBtn = document.getElementById('togglePitchModeBtn');
            if (togglePitchBtn) {
                togglePitchBtn.addEventListener('click', () => {
                    togglePitchMode();
                });
            }
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
        customer_phone: '',
        customer_email: '',
        lead_source: 'Website',
        pipeline_stage: 'Inquiry',
        crm_notes: []
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
                    <option value="REGISTERED" ${item.plot_status === 'REGISTERED' ? 'selected' : ''}>REGISTERED</option>
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
            


            <!-- CRM Editing Fields -->
            <div style="font-weight: 700; color: var(--accent); font-size: 14px; margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 12px; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-address-card"></i> CRM & Lead Editing
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Client Name</label>
                <input type="text" id="editCustomerName" value="${item.customer_name || ''}" placeholder="e.g. Anil Kumar" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Phone Number</label>
                <input type="text" id="editCustomerPhone" value="${item.customer_phone || ''}" placeholder="e.g. +91 98765 43210" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Email Address</label>
                <input type="email" id="editCustomerEmail" value="${item.customer_email || ''}" placeholder="e.g. anil.k@example.com" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Lead Source</label>
                <select id="editLeadSource" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none; width: 100%;">
                    <option value="Channel Partner" ${item.lead_source === 'Channel Partner' ? 'selected' : ''}>Channel Partner</option>
                    <option value="Website" ${item.lead_source === 'Website' ? 'selected' : ''}>Website</option>
                    <option value="Office" ${item.lead_source === 'Office' ? 'selected' : ''}>Office</option>
                    <option value="Reference" ${item.lead_source === 'Reference' ? 'selected' : ''}>Reference</option>
                </select>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Add CRM Note</label>
                <textarea id="editNewNote" placeholder="Type a follow-up note..." rows="2" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: #fff; padding: 8px 10px; border-radius: 6px; font-size: 13px; outline: none; resize: none; font-family: var(--font-body);"></textarea>
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

    let idx = plotData.findIndex(p => String(p.plot_no) === String(plotNo));
    const existingPlot = idx !== -1 ? plotData[idx] : {};

    // CRM fields
    const editCustomerName = document.getElementById('editCustomerName').value.trim();
    const editCustomerPhone = document.getElementById('editCustomerPhone').value.trim();
    const editCustomerEmail = document.getElementById('editCustomerEmail').value.trim();
    const editLeadSource = document.getElementById('editLeadSource').value;
    const editNewNoteText = document.getElementById('editNewNote').value.trim();

    // Fetch existing notes or initialize
    let crmNotes = [];
    if (idx !== -1 && Array.isArray(plotData[idx].crm_notes)) {
        crmNotes = [...plotData[idx].crm_notes];
    }

    if (editNewNoteText !== '') {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
        crmNotes.unshift(`${dateStr} - admin: ${editNewNoteText}`);
    }

    const updatedPlot = {
        plot_no: String(plotNo),
        plot_size: editSize,
        facing: editFacing,
        plot_status: editStatus,
        dim_north: existingPlot.dim_north || '-',
        dim_south: existingPlot.dim_south || '-',
        dim_east: existingPlot.dim_east || '-',
        dim_west: existingPlot.dim_west || '-',
        customer_name: editCustomerName,
        customer_phone: editCustomerPhone,
        customer_email: editCustomerEmail,
        lead_source: editLeadSource,
        crm_notes: crmNotes
    };

    if (idx !== -1) {
        plotData[idx] = updatedPlot;
    } else {
        plotData.push(updatedPlot);
    }

    const storageKey = `aspire_${currentProject}_data`;
    localStorage.setItem(storageKey, JSON.stringify(plotData));

    // Instant Realtime Cloud Database Sync for live customer visibility
    syncRealtimePlotUpdate(currentProject, plotNo, updatedPlot);

    renderPlotDots();
    updateStatistics();
    openPlotModal(plotNo);
}

// ----------------------------------------------------
// Real-world Satellite GIS Map Overlay Functions (Leaflet.js)
// ----------------------------------------------------

function setupSatelliteToggle() {
    const btnSchematic = document.getElementById('btnSchematicView');
    const btnSatellite = document.getElementById('btnSatelliteView');
    
    if (btnSchematic) {
        btnSchematic.addEventListener('click', () => {
            if (isSatelliteActive) {
                isSatelliteActive = false;
                toggleSatelliteView();
            }
        });
    }
    
    if (btnSatellite) {
        btnSatellite.addEventListener('click', () => {
            if (!isSatelliteActive) {
                isSatelliteActive = true;
                toggleSatelliteView();
            }
        });
    }
}

let layoutsGroup = null;
let regionalRoadsGroup = null;
let localRoadsGroup = null;
let projectMarkersGroup = null;

function toggleSatelliteView() {
    closePlotModal();
    const btnSchematic = document.getElementById('btnSchematicView');
    const btnSatellite = document.getElementById('btnSatelliteView');
    const leafletContainer = document.getElementById('leafletMapContainer');
    const layerControl = document.getElementById('gisLayerControl');
    const mapControls = document.querySelector('.map-controls');
    const projectNav = document.getElementById('projectNavSection');
    
    if (projectNav) projectNav.style.display = 'block'; // Always show project nav
    
    if (isSatelliteActive) {
        if (btnSchematic) btnSchematic.classList.remove('active');
        if (btnSatellite) btnSatellite.classList.add('active');
        
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
            if (miniMap) {
                miniMap.invalidateSize();
            }
            // Recenter map on active project center
            const loc = getActiveProjectCenter();
            leafletMap.setView(loc, 17);
        }
        
        // Immediately hide 2D map filters, search & legend sections in sidebar for Satellite view
        updateSidebarAndHeaderForProject(currentProject);
        
        updateAvatar3SatelliteMask();
    } else {
        if (btnSchematic) btnSchematic.classList.add('active');
        if (btnSatellite) btnSatellite.classList.remove('active');
        
        // Show 2D map & hide Leaflet container
        mapContainer.style.display = 'block';
        leafletContainer.style.display = 'none';
        if (layerControl) layerControl.style.display = 'none';
        
        // Hide Project Details Card when leaving Satellite View
        const detailsCard = document.getElementById('projectDetailsCard');
        if (detailsCard) detailsCard.style.display = 'none';
        
        if (mapTip) {
            mapTip.style.display = 'flex';
            mapTip.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> Drag to Pan &bull; Scroll or Pinch to Zoom';
        }
        
        // Check active project selector
        const activeProjectBtn = document.querySelector('.project-nav-btn.active');
        let project = activeProjectBtn ? activeProjectBtn.dataset.project : 'avatar3';
        currentProject = project;
        
        updateSidebarAndHeaderForProject(currentProject);

        if (currentProject === 'avatar2') {
            changeLayoutImage('avatar2_digi/map_layout.jpg', '1024px', '646px', '1024px', '646px', () => {
                plotData = avatarDataPool.avatar2 || [];
                applyFilters();
                updateStatistics();
            });
        } else if (currentProject === 'avatar1') {
            changeLayoutImage('avatar1_map_layout.jpg', '1024px', '647px', '1024px', '647px', () => {
                plotData = avatarDataPool.avatar1 || [];
                applyFilters();
                updateStatistics();
            });
        } else {
            changeLayoutImage('map_layout.png', '1024px', '576px', '1024px', '576px', () => {
                plotData = avatarDataPool.avatar3 || [];
                applyFilters();
                updateStatistics();
            });
        }
    }
}

function getActiveProjectCenter() {
    const projectLocations = {
        avatar1: [16.9498389, 78.4960974],
        avatar2: [16.9233266, 78.5325395],
        avatar3: [16.9307952, 78.5382904]
    };
    const activeProjectBtn = document.querySelector('.project-nav-btn.active');
    const project = activeProjectBtn ? activeProjectBtn.dataset.project : 'avatar3';
    return projectLocations[project] || projectLocations.avatar3;
}

let avatar3SatelliteMaskGroup = null;

function updateAvatar3SatelliteMask() {
    if (!leafletMap) return;
    
    if (!avatar3SatelliteMaskGroup) {
        avatar3SatelliteMaskGroup = L.layerGroup();
        
        // Central Coming Soon Display Card Marker on Satellite Map
        const badgeIcon = L.divIcon({
            className: 'satellite-cs-marker-wrapper',
            html: `
                <div class="sat-cs-badge-card" style="text-align: center; padding: 56px 52px; width: 560px; min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <div class="cs-brand-logo" style="margin-bottom: 22px;">
                        <img src="aspirealty_label.png" alt="Aspirealty Logo" style="max-width: 260px; height: auto;">
                    </div>
                    <h3 class="sat-cs-badge-title" style="font-size: 36px; font-weight: 800; color: #ffffff; margin-bottom: 20px; letter-spacing: -0.5px;">Aspirealty Avatar 3</h3>
                    <div class="sat-cs-badge-pill" style="font-size: 17px; font-weight: 800; color: #f97316; letter-spacing: 3px; padding: 12px 32px; border-radius: 35px; box-shadow: 0 0 20px rgba(249, 115, 22, 0.25);"><i class="fa-solid fa-clock"></i> COMING SOON</div>
                </div>
            `,
            iconSize: [560, 270],
            iconAnchor: [280, 135]
        });
        
        const badgeMarker = L.marker([16.9307952, 78.5382904], { icon: badgeIcon });
        avatar3SatelliteMaskGroup.addLayer(badgeMarker);
    }
    
    if (isSatelliteActive && currentProject === 'avatar3' && !isAdminLoggedIn) {
        if (!leafletMap.hasLayer(avatar3SatelliteMaskGroup)) {
            avatar3SatelliteMaskGroup.addTo(leafletMap);
        }
        setTimeout(() => {
            const btn = document.getElementById('satInterestBtn');
            if (btn) {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const interestModalBackdrop = document.getElementById('interestModalBackdrop');
                    if (interestModalBackdrop) interestModalBackdrop.classList.add('active');
                };
            }
        }, 100);
    } else {
        if (avatar3SatelliteMaskGroup && leafletMap.hasLayer(avatar3SatelliteMaskGroup)) {
            leafletMap.removeLayer(avatar3SatelliteMaskGroup);
        }
    }
}

function initLeafletMap() {
    const loc = getActiveProjectCenter();
    
    leafletMap = L.map('leafletMapContainer', {
        zoomControl: false, // Hiding default zoom to use our custom floating controls
        center: loc,
        zoom: 17,
        maxZoom: 19,
        minZoom: 14,
        zoomSnap: 0.25, // Smooth fine-grain zoom steps
        zoomDelta: 0.5,
        zoomAnimation: true, // Enable butter-smooth 60FPS CSS animation
        fadeAnimation: true, // Smooth tile transitions
        markerZoomAnimation: true,
        inertia: true, // Smooth drag momentum
        inertiaDeceleration: 3000,
        preferCanvas: true, // Hardware GPU Canvas vector rendering
        wheelPxPerZoomLevel: 80 // Liquid-smooth wheel scroll response
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
    
    // Satellite Layer (Esri World Imagery with maxNativeZoom to auto-scale tiles when zooming close)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxNativeZoom: 18,
        maxZoom: 20,
        keepBuffer: 6, // Preload surrounding satellite tiles for zero-lag panning
        updateWhenIdle: false, // Immediate tile updates
        updateWhenZooming: true // Keep background and overlays strictly in sync during zoom
    }).addTo(leafletMap);

    // Initialize custom Mini-map Inset (Disabled)
    // setupMiniMap();

    // Setup L.ImageOverlay.Rotated extension (Rotates cleanly around 50% 50% image center)
    if (!L.ImageOverlay.Rotated) {
        L.ImageOverlay.Rotated = L.ImageOverlay.extend({
            options: {
                rotation: 0
            },
            _reset: function () {
                L.ImageOverlay.prototype._reset.call(this);
                if (this._image && this.options.rotation) {
                    this._image.style.transformOrigin = '50% 50%';
                    var currentTransform = this._image.style.transform || '';
                    if (!currentTransform.includes('rotate(')) {
                        this._image.style.transform = currentTransform + ' rotate(' + (-this.options.rotation) + 'deg)';
                    }
                }
            },
            _animateZoom: function (e) {
                L.ImageOverlay.prototype._animateZoom.call(this, e);
                if (this._image && this.options.rotation) {
                    this._image.style.transformOrigin = '50% 50%';
                    var currentTransform = this._image.style.transform || '';
                    if (!currentTransform.includes('rotate(')) {
                        this._image.style.transform = currentTransform + ' rotate(' + (-this.options.rotation) + 'deg)';
                    }
                }
            }
        });

        L.imageOverlay.rotated = function (url, bounds, options) {
            return new L.ImageOverlay.Rotated(url, bounds, options);
        };
    }
    
    function parseKML(kmlText) {
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
                // Hide Avatar 3 layout image overlay for public view prior to launch
                if (!isAdminLoggedIn && (href.includes('map_layout.png') || name.toLowerCase().includes('avatar 3') || name.toLowerCase().includes('avatar3'))) {
                    continue;
                }

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

                let leafletOverlay;
                if (rotation && Math.abs(rotation) > 0.001) {
                    leafletOverlay = L.imageOverlay.rotated(href, bounds, {
                        rotation: rotation,
                        opacity: overlayOpacity,
                        interactive: false
                    });
                } else {
                    leafletOverlay = L.imageOverlay(href, bounds, {
                        opacity: overlayOpacity,
                        interactive: false
                    });
                }
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
            
            // Point (Markers parsed from KML - skipped to use exact single project markers)
            const point = pmNode.getElementsByTagName('Point')[0];
            if (point) {
                // Completely ignore any Avatar 3 point marker or duplicate KML point markers
                continue;
            }
        }
    }
    
    // Parse doc.kml file with local fallback to support offline/local file loads
    fetch('doc.kml')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load KML file');
            return response.text();
        })
        .then(kmlText => {
            parseKML(kmlText);
        })
        .catch(err => {
            console.warn('CORS or network error. Falling back to local docKmlContent:', err);
            if (typeof docKmlContent !== 'undefined') {
                parseKML(docKmlContent);
            } else {
                console.error('Local docKmlContent fallback not found.');
            }
        });
        
    function renderDefaultProjectMarkers() {
        if (!projectMarkersGroup) return;
        projectMarkersGroup.clearLayers();
        
        const markers = [
            { name: 'Aspirealty Avatar 1', loc: [16.948861, 78.497542], projectKey: 'avatar1' },
            { name: 'Aspirealty Avatar 2', loc: [16.925321, 78.532087], projectKey: 'avatar2' }
            // Avatar 3 marker omitted as per user request (covered by Coming Soon card)
        ];
        
        markers.forEach(item => {
            const markerIcon = L.divIcon({
                className: 'custom-gis-marker',
                html: `
                    <div class="gis-marker-wrapper" onclick="event.stopPropagation(); document.querySelector('.project-nav-btn[data-project=\\'${item.projectKey}\\']')?.click()">
                        <div class="gis-marker-dot"></div>
                        <span class="gis-marker-label">${item.name}</span>
                    </div>
                `,
                iconSize: [180, 36],
                iconAnchor: [90, 18]
            });
            
            const m = L.marker(item.loc, { icon: markerIcon });
            projectMarkersGroup.addLayer(m);
        });
    }

    renderDefaultProjectMarkers();

    // Setup Layer Checkbox Handlers
    setupLayerToggles();

    // Update Avatar 3 Coming Soon mask overlay on satellite map
    updateAvatar3SatelliteMask();
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

function updateSidebarAndHeaderForProject(project) {
    if (isAdminLoggedIn) {
        updateSimulatedLocks();
    }
    const searchSection = document.getElementById('searchSection');
    const filtersSection = document.getElementById('filtersSection');
    const legendSection = document.getElementById('legendSection');
    const sidebarEmiSection = document.getElementById('sidebarEmiSection');
    const sidebarComingSoonSection = document.getElementById('sidebarComingSoonSection');
    const headerStats = document.querySelector('.header-stats');
    const approvedBadge = document.querySelector('.approved-badge');
    const projectNameEl = document.querySelector('.project-name');
    const comingSoonOverlay = document.getElementById('comingSoonOverlay');
    
    if (project === 'avatar3') {
        // Avatar 3 Coming Soon state
        if (searchSection) searchSection.style.display = 'none';
        if (filtersSection) filtersSection.style.display = 'none';
        if (legendSection) legendSection.style.display = 'none';
        if (sidebarEmiSection) sidebarEmiSection.style.display = 'none';
        if (headerStats) headerStats.style.display = 'none';
        if (sidebarComingSoonSection) sidebarComingSoonSection.style.display = isSatelliteActive ? 'none' : 'block';
        if (approvedBadge) {
            approvedBadge.style.display = 'inline-flex';
            approvedBadge.innerHTML = '<i class="fa-solid fa-clock"></i> Coming Soon';
        }
        if (projectNameEl) {
            projectNameEl.textContent = isSatelliteActive ? 'Avatar 3' : 'Layout View (Avatar 3)';
        }
        if (comingSoonOverlay) {
            comingSoonOverlay.style.display = (!isSatelliteActive && !isAdminLoggedIn) ? 'flex' : 'none';
        }
        if (!isSatelliteActive && !isAdminLoggedIn && mapContainer) {
            mapContainer.classList.add('blurred-layout');
        }
    } else if (!isSatelliteActive && (project === 'avatar2' || project === 'avatar1')) {
        if (searchSection) searchSection.style.display = 'block';
        if (filtersSection) filtersSection.style.display = 'block';
        if (legendSection) legendSection.style.display = 'block';
        if (sidebarEmiSection) sidebarEmiSection.style.display = 'block';
        if (headerStats) headerStats.style.display = 'flex';
        if (sidebarComingSoonSection) sidebarComingSoonSection.style.display = 'none';
        if (comingSoonOverlay) comingSoonOverlay.style.display = 'none';
        if (mapContainer) mapContainer.classList.remove('blurred-layout');
        if (approvedBadge) approvedBadge.style.display = 'inline-flex';
        if (projectNameEl) {
            if (project === 'avatar2') projectNameEl.textContent = 'Layout View (Avatar 2)';
            else projectNameEl.textContent = 'Layout View (Avatar 1)';
        }
        if (approvedBadge) {
            if (project === 'avatar2') {
                approvedBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> DTCP Approved 28/2025/h &nbsp;|&nbsp; RERA Approved Po2400009896';
            } else {
                approvedBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> DTCP Approved 224/2023/h &nbsp;|&nbsp; RERA Approved po2400007808';
            }
        }
        const sidebarRateInput = document.getElementById('sidebarEmiRateRange');
        if (sidebarRateInput) {
            sidebarRateInput.value = project === 'avatar1' ? 23999 : 15499;
            if (typeof window.updateSidebarEmi === 'function') window.updateSidebarEmi();
        }
    } else {
        if (searchSection) searchSection.style.display = 'none';
        if (filtersSection) filtersSection.style.display = 'none';
        if (legendSection) legendSection.style.display = 'none';
        if (sidebarEmiSection) sidebarEmiSection.style.display = 'none';
        if (headerStats) headerStats.style.display = 'none';
        if (sidebarComingSoonSection) sidebarComingSoonSection.style.display = 'none';
        if (comingSoonOverlay) comingSoonOverlay.style.display = 'none';
        if (mapContainer) mapContainer.classList.remove('blurred-layout');
        if (approvedBadge) approvedBadge.style.display = 'none';
        if (projectNameEl) {
            if (project === 'avatar1') projectNameEl.textContent = 'Avatar 1';
            else if (project === 'avatar2') projectNameEl.textContent = 'Avatar 2';
            else projectNameEl.textContent = 'Avatar 3 (Coming Soon)';
        }
    }
}

function changeLayoutImage(newSrc, containerWidth, containerHeight, imageWidth, imageHeight, onBeforeLoad) {
    const loader = document.getElementById('layoutLoader');
    
    // Smoothly scale down & fade out current layout
    if (loader) loader.classList.add('active');
    mapImage.classList.add('loading-layout');
    plotsOverlay.classList.add('loading-layout');
    
    // Check if the image source is actually changing.
    const cleanSrc = newSrc.split('?')[0];
    const currentCleanSrc = mapImage.src.substring(mapImage.src.length - cleanSrc.length);
    
    let isTransitioned = false;
    const transitionDone = () => {
        if (isTransitioned) return;
        isTransitioned = true;
        
        // Update dimensions before rendering dots so they place correctly
        mapContainer.style.width = containerWidth;
        mapContainer.style.height = containerHeight;
        mapImage.style.width = imageWidth;
        mapImage.style.height = imageHeight;
        
        if (onBeforeLoad) onBeforeLoad();
        
        // Render dots and auto-fit to viewport
        renderPlotDots();
        fitMapToViewport();
        
        // Smoothly scale in & fade back in
        setTimeout(() => {
            mapImage.classList.remove('loading-layout');
            plotsOverlay.classList.remove('loading-layout');
            if (loader) loader.classList.remove('active');
        }, 100);
    };
    
    if (currentCleanSrc === cleanSrc && mapImage.complete) {
        setTimeout(transitionDone, 150);
        return;
    }
    
    // Hook load event
    const handleLoad = () => {
        mapImage.removeEventListener('load', handleLoad);
        mapImage.removeEventListener('error', handleError);
        transitionDone();
    };
    
    const handleError = () => {
        mapImage.removeEventListener('load', handleLoad);
        mapImage.removeEventListener('error', handleError);
        console.warn('Failed to load image:', newSrc);
        transitionDone(); // Proceed anyway to not block UI forever
    };
    
    mapImage.addEventListener('load', handleLoad);
    mapImage.addEventListener('error', handleError);
    
    // Change source
    mapImage.src = newSrc;
}

function setupProjectNavigation() {
    const projectLocations = {
        avatar1: [16.9498389, 78.4960974],
        avatar2: [16.9233266, 78.5325395],
        avatar3: [16.9307952, 78.5382904]
    };

    const navButtons = document.querySelectorAll('.project-nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closePlotModal();
            const project = btn.dataset.project;

            // Update active states for the nav buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentProject = project;

            // Reset active mapper plot to 1 when project changes
            activeMapperPlot = 1;
            if (typeof mapperActivePlot !== 'undefined' && mapperActivePlot) {
                mapperActivePlot.value = 1;
            }
            if (isMapperMode) {
                renderMapperPlotList();
                highlightActiveMapperButton();
            }

            // Update sidebar & header views based on project
            updateSidebarAndHeaderForProject(project);
            
            // Display Project Details Card on Map view
            showProjectDetailsCard(project);

            // Update Satellite view Coming Soon overlay mask if active
            updateAvatar3SatelliteMask();

            // Simultaneously update dataset, filters, search & statistics
            plotData = avatarDataPool[project] || [];
            activeSearchPlot = null;
            if (searchInput) searchInput.value = '';
            if (searchClearBtn) searchClearBtn.style.display = 'none';
            if (searchSuggestions) searchSuggestions.style.display = 'none';
            applyFilters();
            updateStatistics();

            // Simultaneously fly Satellite GIS map camera if active
            if (isSatelliteActive && leafletMap) {
                leafletMap.flyTo(projectLocations[project], 17, { duration: 1.2 });
            }

            // Simultaneously update Schematic 2D layout image & background dots
            if (project === 'avatar1') {
                changeLayoutImage('avatar1_map_layout.jpg', '1024px', '647px', '1024px', '647px');
            } else if (project === 'avatar2') {
                changeLayoutImage('avatar2_digi/map_layout.jpg', '1024px', '646px', '1024px', '646px');
            } else if (project === 'avatar3') {
                changeLayoutImage('map_layout.png', '1024px', '576px', '1024px', '576px');
            }
        });
    });

    // Close details card button listener
    const closeBtn = document.getElementById('projDetailsCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const card = document.getElementById('projectDetailsCard');
            if (card) card.style.display = 'none';
        });
    }
}

function showProjectDetailsCard(project) {
    const card = document.getElementById('projectDetailsCard');
    const titleEl = document.getElementById('projDetailsTitle');
    const locationEl = document.getElementById('projDetailsLocation');
    const areaEl = document.getElementById('projDetailsArea');
    const plotsEl = document.getElementById('projDetailsPlots');
    const lpEl = document.getElementById('projDetailsLP');
    const statusEl = document.getElementById('projDetailsStatus');
    const highlightsEl = document.getElementById('projDetailsHighlights');
    
    if (!card) return;
    
    // Hide details card when not in Satellite view or if project is Avatar 3
    if (!isSatelliteActive || project === 'avatar3') {
        card.style.display = 'none';
        return;
    }
    
    const info = projectMetadata[project];
    if (!info) {
        card.style.display = 'none';
        return;
    }
    
    titleEl.textContent = info.title;
    locationEl.textContent = info.location;
    areaEl.textContent = info.area;
    plotsEl.textContent = info.plots;
    lpEl.textContent = info.lpNumber;
    statusEl.textContent = info.status;
    
    // Build highlights list
    highlightsEl.innerHTML = '';
    info.highlights.forEach(highlight => {
        const li = document.createElement('li');
        li.textContent = highlight;
        highlightsEl.appendChild(li);
    });
    
    card.style.display = 'block';
}

function setupMiniMap() {
    const MiniMapControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-control-minimap');
            container.id = 'miniMapContainer';
            container.style.width = '140px';
            container.style.height = '100px';
            
            // Prevent map dragging/zooming propagation
            L.DomEvent.disableClickPropagation(container);
            
            return container;
        }
    });

    leafletMap.addControl(new MiniMapControl());

    // Create the Leaflet map inside the container
    miniMap = L.map('miniMapContainer', {
        attributionControl: false,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false
    });

    // Add Esri Satellite tiles to the mini-map
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 21
    }).addTo(miniMap);

    // Bounding viewport rectangle
    miniMapRect = L.rectangle(leafletMap.getBounds(), {
        color: '#ef4444',
        weight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        interactive: false,
        className: 'minimap-viewport-rect'
    }).addTo(miniMap);

    // Sync function
    function syncMiniMap() {
        if (!miniMap || !miniMapRect || !leafletMap) return;
        const center = leafletMap.getCenter();
        const mainZoom = leafletMap.getZoom();
        const miniZoom = Math.max(9, Math.min(14, mainZoom - 5));
        
        miniMap.setView(center, miniZoom);
        miniMapRect.setBounds(leafletMap.getBounds());
    }

    // Bind event listeners
    leafletMap.on('move', syncMiniMap);
    leafletMap.on('zoomend', syncMiniMap);

    // Initial sync
    syncMiniMap();
}

function setupInterestModal() {
    const csInterestBtn = document.getElementById('csInterestBtn');
    const sidebarInterestBtn = document.getElementById('sidebarInterestBtn');
    const interestModalBackdrop = document.getElementById('interestModalBackdrop');
    const interestModalCloseBtn = document.getElementById('interestModalCloseBtn');
    const interestForm = document.getElementById('interestForm');
    const interestSuccess = document.getElementById('interestSuccess');

    function openInterestModal() {
        if (interestModalBackdrop) {
            interestModalBackdrop.classList.add('active');
            if (interestSuccess) interestSuccess.style.display = 'none';
        }
    }

    function closeInterestModal() {
        if (interestModalBackdrop) {
            interestModalBackdrop.classList.remove('active');
        }
    }

    if (csInterestBtn) csInterestBtn.addEventListener('click', openInterestModal);
    if (sidebarInterestBtn) sidebarInterestBtn.addEventListener('click', openInterestModal);
    if (interestModalCloseBtn) interestModalCloseBtn.addEventListener('click', closeInterestModal);
    if (interestModalBackdrop) {
        interestModalBackdrop.addEventListener('click', (e) => {
            if (e.target === interestModalBackdrop) closeInterestModal();
        });
    }

    if (interestForm) {
        interestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('interestName').value;
            const phone = document.getElementById('interestPhone').value;
            const facing = document.getElementById('interestFacing').value;
            
            console.log('Avatar 3 Pre-Launch Interest Submitted:', { name, phone, facing, timestamp: new Date().toISOString() });
            
            if (interestSuccess) {
                interestSuccess.style.display = 'block';
                interestSuccess.innerHTML = `<i class="fa-solid fa-circle-check"></i> Thank you ${name}! Your pre-launch interest for ${facing} facing plots has been received.`;
            }
            
            setTimeout(() => {
                interestForm.reset();
                closeInterestModal();
            }, 2500);
        });
    }
}

function setupSiteVisitBooking() {
    const floatBtn = document.getElementById('floatingSiteVisitBtn');
    const backdrop = document.getElementById('siteVisitModalBackdrop');
    const closeBtn = document.getElementById('siteVisitCloseBtn');
    const form = document.getElementById('siteVisitForm');
    const successMsg = document.getElementById('visitSuccessMsg');

    if (floatBtn && backdrop) {
        floatBtn.addEventListener('click', () => {
            backdrop.classList.add('show');
            const dateInput = document.getElementById('visitDate');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.min = today;
                if (!dateInput.value) dateInput.value = today;
            }
        });
    }

    if (closeBtn && backdrop) {
        closeBtn.addEventListener('click', () => {
            backdrop.classList.remove('show');
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.classList.remove('show');
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const project = document.getElementById('visitProjectSelect')?.value;
            const date = document.getElementById('visitDate')?.value;
            const time = document.getElementById('visitTimeSlot')?.value;
            const name = document.getElementById('visitName')?.value;
            const phone = document.getElementById('visitPhone')?.value;
            const preferences = document.getElementById('visitPreferences')?.value?.trim();
            const cab = document.getElementById('visitCabPickup')?.checked;

            // Construct formatted WhatsApp message for instant sales notification
            const cabText = cab ? 'YES (AC Cab Pick-up Required)' : 'NO (Self-Travel)';
            const preferencesText = preferences ? `\n• *Preferences:* ${preferences}` : '';
            const waMessage = 
`🚗 *NEW SITE VISIT BOOKING REQUEST* 🚗
------------------------------------
• *Project:* ${project}
• *Visit Date:* ${date}
• *Time Slot:* ${time}
• *Customer Name:* ${name}
• *Phone Number:* ${phone}${preferencesText}
• *Cab Pick-up:* ${cabText}
------------------------------------
_Sent via Aspirealty Interactive Viewer_`;

            // Official Sales WhatsApp number (9100091540)
            const salesNumber = (typeof COMPANY_SALES_WHATSAPP !== 'undefined') ? COMPANY_SALES_WHATSAPP : '919100091540';
            const encodedMsg = encodeURIComponent(waMessage);
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${salesNumber}&text=${encodedMsg}`;

            console.log('Site Visit Booked:', { project, date, time, name, phone, preferences, cab, whatsappUrl });

            if (successMsg) {
                successMsg.style.display = 'block';
                successMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Thank you ${name}! Opening WhatsApp to confirm your site visit for ${project}...`;
            }

            // Open WhatsApp to send instant alert to sales team
            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
            }, 600);

            setTimeout(() => {
                if (successMsg) successMsg.style.display = 'none';
                if (backdrop) backdrop.classList.remove('show');
                form.reset();
            }, 3500);
        });
    }
}

function setupSidebarEmiCalculator() {
    function updateSidebarEmi() {
        const area = parseFloat(document.getElementById('sidebarEmiAreaRange')?.value) || 200;
        const rate = parseFloat(document.getElementById('sidebarEmiRateRange')?.value) || 15000;
        const downPct = parseFloat(document.getElementById('sidebarEmiDownRange')?.value) || 20;
        const rateAnnual = parseFloat(document.getElementById('sidebarEmiInterestRange')?.value) || 8.5;
        const tenureYears = parseInt(document.getElementById('sidebarEmiTenureRange')?.value) || 15;

        if (document.getElementById('sidebarEmiAreaVal')) document.getElementById('sidebarEmiAreaVal').textContent = area + ' Sq.Yds';
        if (document.getElementById('sidebarEmiRateVal')) document.getElementById('sidebarEmiRateVal').textContent = '₹ ' + rate.toLocaleString('en-IN');
        if (document.getElementById('sidebarEmiDownVal')) document.getElementById('sidebarEmiDownVal').textContent = downPct + '%';
        if (document.getElementById('sidebarEmiInterestVal')) document.getElementById('sidebarEmiInterestVal').textContent = rateAnnual + '%';
        if (document.getElementById('sidebarEmiTenureVal')) document.getElementById('sidebarEmiTenureVal').textContent = tenureYears + ' Yrs';

        const totalCost = area * rate;
        const principal = totalCost * (1 - (downPct / 100));
        const r = (rateAnnual / 12) / 100;
        const n = tenureYears * 12;

        let emi = 0;
        if (r > 0 && n > 0) {
            emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        }

        const emiDisplay = document.getElementById('sidebarEmiMonthlyVal');
        if (emiDisplay) {
            emiDisplay.textContent = '₹ ' + Math.round(emi).toLocaleString('en-IN') + ' / mo';
        }
    }
    window.updateSidebarEmi = updateSidebarEmi;

    ['sidebarEmiAreaRange', 'sidebarEmiRateRange', 'sidebarEmiDownRange', 'sidebarEmiInterestRange', 'sidebarEmiTenureRange'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateSidebarEmi);
    });

    updateSidebarEmi();
}

let mapTipTimer = null;
function setupMapTipTimer() {
    const tipEl = document.getElementById('mapTip');
    if (!tipEl) return;
    
    tipEl.style.display = 'flex';
    tipEl.style.opacity = '1';
    
    if (mapTipTimer) clearTimeout(mapTipTimer);
    mapTipTimer = setTimeout(() => {
        tipEl.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        tipEl.style.opacity = '0';
        tipEl.style.transform = 'translate(-50%, 10px)';
        setTimeout(() => {
            tipEl.style.display = 'none';
        }, 600);
    }, 10000); // Display tips banner for 10 seconds, then auto-disappear
}

// ----------------------------------------------------
// Smart Plot Finder Quiz Handler
// ----------------------------------------------------
function setupSmartPlotFinder() {
    const backdrop = document.getElementById('smartFinderModalBackdrop');
    const closeBtn = document.getElementById('smartFinderCloseBtn');
    const headerBtn = document.getElementById('openPlotFinderHeaderBtn');
    const sidebarBtn = document.getElementById('openPlotFinderSidebarBtn');
    const runBtn = document.getElementById('runSmartFinderBtn');
    const resultBanner = document.getElementById('finderResultBanner');
    const matchedCountEl = document.getElementById('matchedPlotCount');
    const clearBannerBtn = document.getElementById('clearFinderMatchBtn');

    function openModal() {
        if (backdrop) backdrop.classList.add('show');
    }

    function closeModal() {
        if (backdrop) backdrop.classList.remove('show');
    }

    if (headerBtn) headerBtn.addEventListener('click', openModal);
    if (sidebarBtn) sidebarBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });
    }

    // Toggle chip selections in quiz modal
    ['finderSizeOptions', 'finderFacingOptions', 'finderStatusOptions'].forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            const chips = container.querySelectorAll('.finder-chip');
            chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    chips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                });
            });
        }
    });

    function runFinderQuiz() {
        const sizeVal = document.querySelector('#finderSizeOptions .finder-chip.active')?.dataset.value || 'all';
        const facingVal = document.querySelector('#finderFacingOptions .finder-chip.active')?.dataset.value || 'all';
        const statusVal = document.querySelector('#finderStatusOptions .finder-chip.active')?.dataset.value || 'AVAILABLE';

        const dataSource = avatarDataPool[currentProject] || [];
        const plotDots = document.querySelectorAll('.plot-dot');
        let matchCount = 0;

        plotDots.forEach(dot => {
            const plotNo = dot.dataset.plotNo;
            const detail = dataSource.find(p => String(p.plot_no) === String(plotNo)) || {};
            
            const plotStatus = String(detail.plot_status || dot.dataset.status || 'AVAILABLE').toUpperCase().trim();
            const plotFacing = String(detail.facing || dot.dataset.facing || '').trim();
            const rawSize = parseFloat(String(detail.plot_size || '').replace(/[^0-9.]/g, ''));
            const plotSize = isNaN(rawSize) || rawSize <= 0 ? 200 : rawSize;

            // Check Status Match
            let statusMatch = true;
            if (statusVal === 'AVAILABLE') {
                statusMatch = plotStatus === 'AVAILABLE';
            }

            // Check Size Match
            let sizeMatch = true;
            if (sizeVal === '150-200') {
                sizeMatch = plotSize >= 100 && plotSize <= 200;
            } else if (sizeVal === '201-300') {
                sizeMatch = plotSize >= 201 && plotSize <= 300;
            } else if (sizeVal === '301+') {
                sizeMatch = plotSize >= 301;
            }

            // Check Facing Match
            let facingMatch = true;
            if (facingVal === 'East') {
                facingMatch = plotFacing.toLowerCase().includes('east');
            } else if (facingVal === 'West') {
                facingMatch = plotFacing.toLowerCase().includes('west');
            } else if (facingVal === 'North') {
                facingMatch = plotFacing.toLowerCase().includes('north') || plotFacing.toLowerCase().includes('south');
            } else if (facingVal === 'Corner') {
                facingMatch = plotFacing.toLowerCase().includes('cross') || plotFacing.toLowerCase().includes('corner') || plotFacing.includes('-');
            }

            const isMatched = statusMatch && sizeMatch && facingMatch;

            if (isMatched) {
                dot.classList.add('matched-finder-dot');
                dot.classList.remove('dimmed-finder-dot');
                matchCount++;
            } else {
                dot.classList.remove('matched-finder-dot');
                dot.classList.add('dimmed-finder-dot');
            }
        });

        if (matchedCountEl) matchedCountEl.textContent = matchCount;
        if (resultBanner) resultBanner.style.display = 'flex';
        closeModal();
    }

    function clearFinderMatches() {
        const plotDots = document.querySelectorAll('.plot-dot');
        plotDots.forEach(dot => {
            dot.classList.remove('matched-finder-dot');
            dot.classList.remove('dimmed-finder-dot');
        });
        if (resultBanner) resultBanner.style.display = 'none';
    }

    if (runBtn) runBtn.addEventListener('click', runFinderQuiz);
    if (clearBannerBtn) clearBannerBtn.addEventListener('click', clearFinderMatches);
}

// ----------------------------------------------------
// Realtime Database Cloud Synchronization Engine
// ----------------------------------------------------
const FIREBASE_DB_URL = 'https://aspirealty-avatar-default-rtdb.asia-southeast1.firebasedatabase.app';

function syncRealtimePlotUpdate(project, plotNo, plotObject) {
    if (!FIREBASE_DB_URL) return;
    const endpoint = `${FIREBASE_DB_URL}/plots/${project}/${plotNo}.json`;
    fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plotObject)
    })
    .then(res => res.json())
    .then(data => {
        console.log(`[Realtime Cloud Sync] Plot #${plotNo} synced to cloud for ${project}`);
    })
    .catch(err => console.warn('[Cloud Sync Warning] Saved locally (offline):', err));
}

function startRealtimeCloudSync() {
    if (!FIREBASE_DB_URL) return;
    
    function fetchAndMergeCloudData() {
        fetch(`${FIREBASE_DB_URL}/plots.json`)
            .then(res => {
                if (!res.ok) throw new Error('Cloud fetch error');
                return res.json();
            })
            .then(cloudPlots => {
                if (!cloudPlots) return;
                let hasChanges = false;
                
                ['avatar1', 'avatar2', 'avatar3'].forEach(projKey => {
                    const projectCloudData = cloudPlots[projKey];
                    if (projectCloudData) {
                        const localPool = avatarDataPool[projKey] || [];
                        Object.keys(projectCloudData).forEach(plotNo => {
                            const cloudItem = projectCloudData[plotNo];
                            if (!cloudItem) return;
                            
                            let localItem = localPool.find(p => String(p.plot_no) === String(plotNo));
                            if (localItem) {
                                if (localItem.plot_status !== cloudItem.plot_status || 
                                    localItem.customer_name !== cloudItem.customer_name ||
                                    localItem.plot_size !== cloudItem.plot_size) {
                                    Object.assign(localItem, cloudItem);
                                    hasChanges = true;
                                }
                            } else {
                                localPool.push(cloudItem);
                                hasChanges = true;
                            }
                        });
                    }
                });

                if (hasChanges) {
                    plotData = avatarDataPool[currentProject] || [];
                    renderPlotDots();
                    updateStatistics();
                }
            })
            .catch(() => {});
    }

    fetchAndMergeCloudData();
    setInterval(fetchAndMergeCloudData, 4000);
}

// Global DOM Ready initializer for Interactive Features
document.addEventListener('DOMContentLoaded', () => {
    setupMapTipTimer();
    setupInterestModal();
    setupSiteVisitBooking();
    setupSidebarEmiCalculator();
    setupSmartPlotFinder();
    startRealtimeCloudSync();
});
setupMapTipTimer();
setupInterestModal();
setupSiteVisitBooking();
setupSidebarEmiCalculator();
setupSmartPlotFinder();
startRealtimeCloudSync();


