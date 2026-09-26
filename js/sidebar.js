import { supabase } from './supabase.js';

const icon = (name) => {
    const icons = {
        dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
        tracker: '<circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 16 14"></polyline>',
        timesheet: '<rect x="4" y="3" width="16" height="18" rx="2"></rect><line x1="8" y1="8" x2="16" y2="8"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="8" y1="16" x2="13" y2="16"></line>',
        reports: '<line x1="5" y1="20" x2="5" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="19" y1="20" x2="19" y2="7"></line>',
        projects: '<path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2"></path>',
        tasks: '<rect x="4" y="3" width="16" height="18" rx="2"></rect><polyline points="8 9 10 11 14 7"></polyline><line x1="8" y1="15" x2="16" y2="15"></line>',
        tags: '<path d="M20 13l-7 7-10-10V3h7z"></path><circle cx="7.5" cy="7.5" r="1.2"></circle>',
        clients: '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>',
        team: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
        attendance: '<circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 16 14"></polyline>',
        approvals: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="9 15 11 17 15 13"></polyline>',
        profile: '<circle cx="12" cy="7" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>',
        settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-3v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.1-2.1.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-3h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.1-2.1.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h3v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.1 2.1-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v3h-.1a1.7 1.7 0 0 0-1.6 1z"></path>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
};

const menu = [
    ['TIME TRACKING', [
        ['dashboard.html','Dashboard','Overview & Insights','dashboard'],
        ['tracker.html','Time Tracker','Start / Stop Timer','tracker'],
        ['timesheet.html','Timesheet','View & Edit Logs','timesheet'],
        ['reports.html','Reports','Analytics & Export','reports']
    ]],
    ['WORK MANAGEMENT', [
        ['projects.html','Projects','Manage Projects','projects'],
        ['tasks.html','Tasks','Task List & Progress','tasks'],
        ['tags.html','Tags','Organize Work','tags'],
        ['clients.html','Clients','Client Management','clients']
    ]],
    ['WORKFORCE', [
        ['attendance.html','Attendance','Team Attendance','attendance'],
        ['approvals.html','Approvals','Request Approvals','approvals']
    ]],
    ['ACCOUNT', [
        ['profile.html','My Profile','Profile & Preferences','profile'],
        ['settings.html','Settings','System Settings','settings']
    ]]
];

export async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    const currentPath = window.location.pathname;

    const groupHtml = menu.map(([label, items]) => `
        <div class="topnav-group">
            <span class="topnav-group-label">${label}</span>
            <div class="topnav-items">
                ${items.map(([href,title,subtitle,ico]) => `
                    <a href="${href}" class="topnav-item ${currentPath.includes(href) ? 'active' : ''}" title="${title}">
                        <span class="topnav-icon">${icon(ico)}</span>
                        <span class="topnav-copy"><strong>${title}</strong><small>${subtitle}</small></span>
                    </a>`).join('')}
            </div>
        </div>`).join('');

    container.innerHTML = `
        <nav class="top-navigation" aria-label="Primary navigation">
            <div class="topnav-brand">
                <span class="topnav-brand-mark">⌁</span>
                <span><strong>WORKTIME</strong><small>TIME MANAGEMENT</small></span>
            </div>
            <div class="topnav-groups">${groupHtml}
                <div id="adminEmployeesMenuItem" class="topnav-admin-slot"></div>
            </div>
            <button id="logoutBtn" class="topnav-logout" type="button" title="Logout">
                <span class="logout-icon">↪</span><span>Logout</span>
            </button>
        </nav>`;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '../pages/login.html';
        });
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data: emp } = await supabase.from('employees').select('name, system_role').eq('email', session.user.email).maybeSingle();
        const roleText = (emp && emp.system_role) ? emp.system_role.toLowerCase() : 'employee';
        if (roleText === 'admin') {
            const slot = document.getElementById('adminEmployeesMenuItem');
            if (slot) {
                slot.innerHTML = `
                    <div class="topnav-group topnav-admin-group">
                        <span class="topnav-group-label">ADMIN</span>
                        <div class="topnav-items">
                            <a href="employees.html" class="topnav-item ${currentPath.includes('employees.html') ? 'active' : ''}" title="Team / Employees">
                                <span class="topnav-icon">${icon('team')}</span>
                                <span class="topnav-copy"><strong>Team</strong><small>Employees & Roles</small></span>
                            </a>
                        </div>
                    </div>`;
            }
        }
    } catch (error) {
        console.warn('Top navigation role check failed:', error);
    }
}
