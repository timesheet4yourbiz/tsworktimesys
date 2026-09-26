import { supabase } from './supabase.js';

export async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    const currentPath = window.location.pathname;

    const icon = (name) => {
        const icons = {
            home:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
            clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
            sheet:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
            calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
            folder:'<path d="M3 6a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
            tasks:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 9 1.5 1.5L12 8M8 15h8"/>',
            tag:'<path d="M20 13.5 13.5 20a2 2 0 0 1-2.8 0L4 13.3V4h9.3l6.7 6.7a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="8" r="1"/>',
            brief:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
            users:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0-1-5M16 14a5 5 0 0 1 5 6"/>',
            chart:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
            gear:'<circle cx="12" cy="12" r="3"/><path d="M19 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2.1 2.1-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21h-3v-.9a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1-2.1-2.1.1-.1A1.7 1.7 0 0 0 5 15a1.7 1.7 0 0 0-1.5-1H2v-3h1.5A1.7 1.7 0 0 0 5 10a1.7 1.7 0 0 0-.3-1.8l-.1-.1 2.1-2.1.1.1A1.7 1.7 0 0 0 8.6 6a1.7 1.7 0 0 0 1-1.5V3h3v1.5a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.1 2.1-.1.1A1.7 1.7 0 0 0 17 10a1.7 1.7 0 0 0 1.5 1H20v3h-.9a1.7 1.7 0 0 0-1.1 1z"/>',
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.home}</svg>`;
    };

    const items = [
        ['dashboard.html','Dashboard','home'],['tracker.html','Time Tracking','clock'],['timesheet.html','Timesheet','sheet'],['calendar.html','Calendar','calendar'],['projects.html','Projects','folder'],['tasks.html','Tasks','tasks'],['clients.html','Clients','brief'],['reports.html','Reports','chart']
    ];

    container.innerHTML = `
      <nav class="ct-main-nav">
        <a class="ct-brand" href="dashboard.html"><span class="ct-brand-mark"><i></i><i></i><i></i></span><span><b>CRANETRACK</b><small>TIME | PROJECT | TEAM</small></span></a>
        <div class="ct-nav-links">
          ${items.map(([href,label,ico]) => `<a href="${href}" class="ct-nav-link ${currentPath.includes(href) ? 'active' : ''}">${icon(ico)}<span>${label}</span></a>`).join('')}
          <div id="adminEmployeesMenuItem"></div>
        </div>
        <div class="ct-nav-more">
          <a href="settings.html" class="ct-nav-link ${currentPath.includes('settings.html') ? 'active' : ''}">${icon('gear')}<span>Settings</span></a>
        </div>
      </nav>`;

    // Add Team / Employees only for Admin, preserving the original role logic.
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const email = session.user.email;
        const { data: emp } = await supabase.from('employees').select('name, system_role').eq('email', email).maybeSingle();
        const roleText = (emp && emp.system_role) ? emp.system_role.toLowerCase() : 'employee';
        const isAdmin = roleText === 'admin';
        window.currentUserIsAdmin = isAdmin;
        if (emp?.name) {
            const name = emp.name.trim();
            const first = name.split(/\s+/)[0];
            document.getElementById('headerUserName')?.replaceChildren(document.createTextNode(name.toUpperCase()));
            document.getElementById('welcomeUserName')?.replaceChildren(document.createTextNode(first));
            document.getElementById('headerAvatar')?.replaceChildren(document.createTextNode(first.charAt(0).toUpperCase()));
        }
        const roleEl = document.getElementById('headerUserRole');
        if (roleEl) roleEl.textContent = roleText === 'admin' ? 'Administrator' : 'Team Member';
        if (isAdmin) {
            const holder = document.getElementById('adminEmployeesMenuItem');
            if (holder) holder.innerHTML = `<a href="employees.html" class="ct-nav-link ${currentPath.includes('employees.html') ? 'active' : ''}">${icon('users')}<span>Team</span></a>`;
        }
    } catch (err) { console.error('Top navigation auth check:', err); }

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.href = '../pages/login.html'; });

    const profileBtn = document.getElementById('profileMenuBtn');
    const profileDrop = document.getElementById('profileDropdown');
    profileBtn?.addEventListener('click', (e) => { e.stopPropagation(); const open = profileDrop.style.display !== 'none'; profileDrop.style.display = open ? 'none' : 'block'; profileBtn.setAttribute('aria-expanded', String(!open)); });
    document.addEventListener('click', () => { if (profileDrop) profileDrop.style.display = 'none'; });
};
