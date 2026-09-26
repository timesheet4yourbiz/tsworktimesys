import { initNotificationBell } from './notifications.js';
import { supabase } from './supabase.js';
import { loadSidebar } from './sidebar.js';

let filterState = { startDate: '', endDate: '', projectId: 'all', teamId: 'all' };
let chartBar = null; let chartDonut = null;
let teamDataList = []; let currentPage = 1; let recordsPerPage = 20; 
let currentSort = { column: 'member', isAsc: true };

const colorPalette = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#6366f1'];
function getProjectColor(name) {
    let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colorPalette[Math.abs(hash) % colorPalette.length];
}
function getInitials(nameOrEmail) {
    if(!nameOrEmail) return '?'; const parts = nameOrEmail.split(/[\s.@]+/);
    let init = parts[0].charAt(0).toUpperCase();
    if(parts.length > 1 && parts[1].length > 0) init += parts[1].charAt(0).toUpperCase();
    return init;
}
function formatHMS(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const hrs = Math.floor(seconds / 3600); const mins = Math.floor((seconds % 3600) / 60);
    return `\({hrs}:\){String(mins).padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        loadSidebar();
        initNotificationBell();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return window.location.href = '../pages/login.html';
        
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) userEmailEl.textContent = session.user.email;

        let currentDashDate = new Date();
        const getDashWeekRange = (dateObj) => {
            const curr = new Date(dateObj); const day = curr.getDay();
            const diff = curr.getDate() - day + (day === 0 ? -6 : 1); 
            const start = new Date(curr.setDate(diff)); start.setHours(0,0,0,0);
            const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
            return { start, end };
        };
        const updateDashDateDisplay = () => {
            const { start, end } = getDashWeekRange(currentDashDate);
            filterState.startDate = start.toLocaleDateString('en-CA');
            filterState.endDate = end.toLocaleDateString('en-CA');
            const dateTextEl = document.getElementById('dashDateRangeText');
            if (dateTextEl) {
                const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                dateTextEl.textContent = `\({startStr} -\){endStr}`;
            }
        };
        const prevDashBtn = document.getElementById('prevDashBtn');
        if (prevDashBtn) prevDashBtn.addEventListener('click', async () => { currentDashDate.setDate(currentDashDate.getDate() - 7); updateDashDateDisplay(); await refreshDashboardData(); });
        const nextDashBtn = document.getElementById('nextDashBtn');
        if (nextDashBtn) nextDashBtn.addEventListener('click', async () => { currentDashDate.setDate(currentDashDate.getDate() + 7); updateDashDateDisplay(); await refreshDashboardData(); });

        updateDashDateDisplay(); bindFilters(); bindPaginationControls(); bindSortingControls();
        await loadProjectDropdown(); await refreshDashboardData();
    } catch (error) { console.error("Dashboard Init Error:", error); }
});

function bindFilters() {
    const filterProject = document.getElementById('filterProject'); const filterTeam = document.getElementById('filterTeam');
    if (filterProject) filterProject.addEventListener('change', (e) => { filterState.projectId = e.target.value; refreshDashboardData(); });
    if (filterTeam) filterTeam.addEventListener('change', (e) => { filterState.teamId = e.target.value; refreshDashboardData(); });
}
async function loadProjectDropdown() {
    const { data: projs } = await supabase.from('projects').select('id, project_name').order('project_name');
    const select = document.getElementById('filterProject');
    if (projs && select) { projs.forEach(p => select.innerHTML += `${p.project_name}`); }
}
function getDatesArray(startStr, endStr) {
    const dates = []; let curr = new Date(startStr); const end = new Date(endStr);
    while (curr <= end) { dates.push(curr.toLocaleDateString('en-CA')); curr.setDate(curr.getDate() + 1); }
    return dates;
}

async function refreshDashboardData() {
    if (!filterState.startDate || !filterState.endDate) return;
    const startIso = new Date(`${filterState.startDate}T00:00:00`).toISOString();
    const endIso = new Date(`${filterState.endDate}T23:59:59.999`).toISOString();
    let query = supabase.from('time_entries').select(`duration_seconds, start_time, work_date, status, description, employee_id, project_id, project:projects!fk_time_entries_project(project_name)`).gte('start_time', startIso).lte('start_time', endIso).order('start_time', { ascending: false });
    if (filterState.projectId !== 'all') query = query.eq('project_id', filterState.projectId);
    const { data: entries, error } = await query;
    if (error) { console.error("Query Error:", error); return; }
    const { data: employeesData } = await supabase.from('employees').select('id, email, name');
    const employees = employeesData || [];
    processKPI(entries); processBarChart(entries); processDonutAndRanking(entries);
    teamDataList = processTeamActivitiesData(entries, employees);
    currentPage = 1; applySortingAndRender();
}
function processKPI(entries) {
    let totalSec = 0; const projMap = {};
    (entries || []).forEach(e => {
        if(e.status !== 'STOPPED') return;
        const sec = e.duration_seconds || 0; totalSec += sec;
        const pName = e.project ? e.project.project_name : 'No Project';
        projMap[pName] = (projMap[pName] || 0) + sec;
    });
    let topP = '--', maxP = 0;
    for (const [k, v] of Object.entries(projMap)) { if (v > maxP) { maxP = v; topP = k; } }
    document.getElementById('kpiTotalTime').textContent = formatHMS(totalSec);
    document.getElementById('kpiTopProject').textContent = topP;
    const donutTotal = document.getElementById('donutTotal');
    if (donutTotal) donutTotal.textContent = formatHMS(totalSec);
}

function processBarChart(entries) {
    const dateArr = getDatesArray(filterState.startDate, filterState.endDate);
    const labels = dateArr.map(d => new Date(d).toLocaleDateString('en-US', {month:'short', day:'numeric'}));
    const projDateMap = {};
    (entries || []).forEach(e => {
        if(e.status !== 'STOPPED') return;
        const dStr = e.work_date || e.start_time.split('T')[0];
        const pName = e.project ? e.project.project_name : 'No Project';
        if (!projDateMap[pName]) { projDateMap[pName] = {}; dateArr.forEach(d => projDateMap[pName][d] = 0); }
        if (projDateMap[pName][dStr] !== undefined) { projDateMap[pName][dStr] += (e.duration_seconds || 0); }
    });
    const datasets = Object.keys(projDateMap).map(pName => {
        const dataArr = dateArr.map(d => (projDateMap[pName][d] / 3600).toFixed(2));
        return { label: pName, data: dataArr, backgroundColor: getProjectColor(pName), borderRadius: 6, borderSkipped: false, barThickness: 24 };
    });
    const ctx = document.getElementById('stackedBarChart');
    if (!ctx) return;
    if (chartBar) chartBar.destroy();
    chartBar = new Chart(ctx, {
        type: 'bar', data: { labels, datasets },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 1000, easing: 'easeOutQuart' },
            plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a', titleFont: { family: 'Inter', size: 13, weight: 'bold' }, bodyFont: { family: 'Inter', size: 12 }, padding: 12, cornerRadius: 8, displayColors: true } },
            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } } }
        }
    });
}

function processDonutAndRanking(entries) {
    const projMap = {}; let grandTotal = 0;
    (entries || []).forEach(e => {
        if(e.status !== 'STOPPED') return;
        const sec = e.duration_seconds || 0; const pName = e.project ? e.project.project_name : 'No Project';
        projMap[pName] = (projMap[pName] || 0) + sec; grandTotal += sec;
    });
    const sortedProjs = Object.entries(projMap).sort((a,b) => b[1] - a[1]);
    const rankCont = document.getElementById('projectRankingList');
    if (rankCont) {
        rankCont.innerHTML = '';
        if (sortedProjs.length === 0) { rankCont.innerHTML = '

                                       function bindSortingControls() {
    document.querySelectorAll('.sortable-header').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            if (currentSort.column === column) { currentSort.isAsc = !currentSort.isAsc; } else { currentSort.column = column; currentSort.isAsc = true; }
            document.querySelectorAll('.sortable-header').forEach(h => h.classList.remove('asc', 'desc'));
            header.classList.add(currentSort.isAsc ? 'asc' : 'desc'); applySortingAndRender();
        });
    });
}
function applySortingAndRender() {
    teamDataList.sort((a, b) => {
        let valA, valB;
        if (currentSort.column === 'member') { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); } 
        else if (currentSort.column === 'tracked') { valA = a.totalSec; valB = b.totalSec; } 
        else if (currentSort.column === 'activity') { valA = a.latest ? new Date(a.latest.start_time).getTime() : 0; valB = b.latest ? new Date(b.latest.start_time).getTime() : 0; }
        if (valA < valB) return currentSort.isAsc ? -1 : 1; if (valA > valB) return currentSort.isAsc ? 1 : -1; return 0;
    });
    renderTeamActivities();
}
function bindPaginationControls() {
    const recordSelect = document.getElementById('recordsPerPage');
    if (recordSelect) { recordSelect.addEventListener('change', (e) => { recordsPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value); currentPage = 1; renderTeamActivities(); }); }
    document.getElementById('btnFirst')?.addEventListener('click', () => { currentPage = 1; renderTeamActivities(); });
    document.getElementById('btnPrev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTeamActivities(); } });
    document.getElementById('btnNext')?.addEventListener('click', () => { const maxPage = recordsPerPage === 'all' ? 1 : Math.ceil(teamDataList.length / recordsPerPage); if (currentPage < maxPage) { currentPage++; renderTeamActivities(); } });
    document.getElementById('btnLast')?.addEventListener('click', () => { if(recordsPerPage !== 'all') { currentPage = Math.ceil(teamDataList.length / recordsPerPage); renderTeamActivities(); } });
}

function getStatusAndBadge(member) {
    if (member.isTracking) return 'In progress';
    if (!member.latest) return 'No activity';
    const now = new Date(); const past = new Date(member.latest.start_time);
    const today = new Date(); today.setHours(0,0,0,0); const pastDay = new Date(past); pastDay.setHours(0,0,0,0);
    const diffDays = Math.floor((today - pastDay) / (1000 * 60 * 60 * 24)); const diffHrs = Math.floor((now - past) / 3600000);
    if (diffDays === 0) return 'In a day';
    if (diffDays > 0 && diffDays < 30) { let txt = diffHrs < 24 ? `\({diffHrs} hours ago` : `\){diffDays} days ago`; return `${txt}`; }
    return 'No activity';
}

function renderTeamActivities() {
    const tbody = document.getElementById('teamActivitiesBody');
    if (!tbody) return; tbody.innerHTML = '';
    const totalRecs = teamDataList.length;
    if (totalRecs === 0) { tbody.innerHTML = '

                          // ==========================================
// EVENT LISTENER UNTUK DROPDOWN & CHASE BUTTON
// ==========================================
document.addEventListener('click', async (e) => {
    // 1. Kawalan Buka/Tutup Menu 3 Titik
    const dotsBtn = e.target.closest('.action-dots-btn');
    if (dotsBtn) {
        e.stopPropagation(); 
        const popup = dotsBtn.nextElementSibling;
        
        // Tutup semua menu lain dulu
        document.querySelectorAll('.action-menu-popup').forEach(p => { 
            if (p !== popup) p.style.display = 'none'; 
        });
        
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block'; 
        return;
    }

    // Tutup popup jika klik di luar
    if (!e.target.closest('.action-dropdown')) { 
        document.querySelectorAll('.action-menu-popup').forEach(p => p.style.display = 'none'); 
    }

    // 2. Kawalan Butang Hantar Peringatan (.chase-btn)
    const chaseBtn = e.target.closest('.chase-btn');
    if (chaseBtn) {
        const empId = chaseBtn.getAttribute('data-empid'); 
        const empName = chaseBtn.getAttribute('data-empname') || 'staf';
        
        if (chaseBtn.disabled) return; 
        chaseBtn.disabled = true; 
        const originalText = chaseBtn.innerHTML; 
        chaseBtn.innerHTML = '⏳ Sending...';

        try {
            await supabase.from('notifications').insert([{ 
                employee_id: empId, 
                title: 'Timesheet Reminder', 
                message: 'Please complete your timesheet record for today.', 
                is_read: false 
            }]);
            alert(`🔔 Reminder sent successfully to ${empName}!`);
        } catch (err) { 
            console.error("Error sending reminder:", err); 
            alert(`Reminder flagged for ${empName}.`); 
        } finally { 
            chaseBtn.disabled = false; 
            chaseBtn.innerHTML = originalText; 
            const popup = chaseBtn.closest('.action-menu-popup'); 
            if (popup) popup.style.display = 'none'; 
        }
    }
});



