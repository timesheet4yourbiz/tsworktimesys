import { supabase } from './supabase.js';

export async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const currentPath = window.location.pathname;

    // Keep the existing function name/API so every existing page can continue
    // calling loadSidebar() without any other JavaScript changes.
    const isActive = (page) => currentPath.includes(page) ? 'active' : '';

    const icon = (paths, viewBox = '0 0 24 24') => `
        <svg class="topnav-icon" width="18" height="18" viewBox="${viewBox}" fill="none"
             stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            ${paths}
        </svg>`;

    const navHTML = `
        <section class="top-navigation-shell" aria-label="Main navigation">
            <div class="top-navigation-brand">
                <div class="topnav-brand-mark">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M12 7v5l3 2"></path>
                    </svg>
                </div>
                <div>
                    <strong>CRANETRACK</strong>
                    <span>TIME • PROJECT • TEAM</span>
                </div>
            </div>

            <nav class="topnav-menu" aria-label="Application modules">
                <a href="dashboard.html" class="topnav-item ${isActive('dashboard.html')}" title="Dashboard">
                    ${icon('<rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>')}
                    <span>Dashboard</span>
                </a>

                <a href="tracker.html" class="topnav-item ${isActive('tracker.html')}" title="Time Tracking">
                    ${icon('<circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15.5 14"></polyline>')}
                    <span>Time</span>
                </a>

                <a href="timesheet.html" class="topnav-item ${isActive('timesheet.html')}" title="Timesheet">
                    ${icon('<rect x="3" y="4" width="18" height="17" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>')}
                    <span>Timesheet</span>
                </a>

                <a href="reports.html" class="topnav-item ${isActive('reports.html')}" title="Reports">
                    ${icon('<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                    <span>Reports</span>
                </a>

                <span class="topnav-divider"></span>

                <a href="projects.html" class="topnav-item ${isActive('projects.html')}" title="Projects">
                    ${icon('<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"></path>')}
                    <span>Projects</span>
                </a>

                <a href="tags.html" class="topnav-item ${isActive('tags.html')}" title="Tags">
                    ${icon('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"></path><circle cx="7.5" cy="7.5" r=".8"></circle>')}
                    <span>Tags</span>
                </a>

                <a href="clients.html" class="topnav-item ${isActive('clients.html')}" title="Clients">
                    ${icon('<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>')}
                    <span>Clients</span>
                </a>

                <span id="adminEmployeesMenuItem"></span>

                <span class="topnav-divider"></span>

                <a href="attendance.html" class="topnav-item ${isActive('attendance.html')}" title="Attendance">
                    ${icon('<circle cx="12" cy="12" r="9"></circle><polyline points="12 7 12 12 15 14"></polyline>')}
                    <span>Attendance</span>
                </a>

                <a href="approvals.html" class="topnav-item ${isActive('approvals.html')}" title="Approvals">
                    ${icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="9 15 11 17 15 13"></polyline>')}
                    <span>Approvals</span>
                </a>

                <span class="topnav-divider"></span>

                <a href="profile.html" class="topnav-item ${isActive('profile.html')}" title="My Profile">
                    ${icon('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>')}
                    <span>Profile</span>
                </a>

                <a href="settings.html" class="topnav-item ${isActive('settings.html')}" title="Settings">
                    ${icon('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.8v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5.8v-2.8h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L7 7.2l2-2 .1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V4h2.8v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V13h-.1a1.7 1.7 0 0 0-1.5 1z"></path>')}
                    <span>Settings</span>
                </a>
            </nav>

            <div class="topnav-account-actions">
                <button id="logoutBtn" class="topnav-logout" title="Logout" aria-label="Logout">
                    ${icon('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>')}
                </button>
            </div>
        </section>
    `;

    container.innerHTML = navHTML;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = '../pages/login.html';
        });
    }

    // Keep the existing admin-only Employees behaviour.
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const email = session.user.email;
            const { data: emp } = await supabase
                .from('employees')
                .select('name, system_role')
                .eq('email', email)
                .maybeSingle();

            const roleText = (emp && emp.system_role) ? emp.system_role.toLowerCase() : 'employee';
            const isAdmin = roleText === 'admin';

            if (isAdmin) {
                const empMenuItem = document.getElementById('adminEmployeesMenuItem');
                if (empMenuItem) {
                    empMenuItem.innerHTML = `
                        <a href="employees.html" class="topnav-item ${isActive('employees.html')}" title="Team / Employees">
                            ${icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>')}
                            <span>Team</span>
                        </a>`;
                }
            }
            window.currentUserIsAdmin = isAdmin;
        }
    } catch (err) {
        console.error('Top Navigation Auth Check Error:', err);
    }
}
