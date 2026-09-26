import { supabase } from './supabase.js';

const DEFAULTS = {
    system_name: 'CRANETRACK',
    system_tagline: 'TIME | PROJECT | TEAM',
    welcome_title: 'Good Afternoon,',
    welcome_message: 'Track time. Deliver projects. Build a better tomorrow.',
    primary_color: '#1d4ed8',
    accent_color: '#0ea5e9',
    logo_url: '',
    favicon_url: '',
    dashboard_banner_url: 'https://gevftxdqyrejnjovurjt.supabase.co/storage/v1/object/public/cranetrack-assets/dashboard/crane-banner.jpg',
    login_background_url: ''
};

export async function getBranding() {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();
        if (error) throw error;
        return { ...DEFAULTS, ...(data || {}) };
    } catch (e) {
        console.warn('Branding settings unavailable; using defaults.', e);
        return { ...DEFAULTS };
    }
}

export function applyBranding(settings = DEFAULTS) {
    const s = { ...DEFAULTS, ...settings };
    document.documentElement.style.setProperty('--brand-primary', s.primary_color);
    document.documentElement.style.setProperty('--brand-accent', s.accent_color);

    if (s.system_name) {
        document.querySelectorAll('[data-brand-name]').forEach(el => el.textContent = s.system_name);
        const title = document.querySelector('title');
        if (title && /CRANETRACK|Dashboard|Settings/i.test(title.textContent)) {
            title.textContent = `${s.system_name} — ${title.textContent.split('—').pop().trim()}`;
        }
    }
    if (s.system_tagline) document.querySelectorAll('[data-brand-tagline]').forEach(el => el.textContent = s.system_tagline);
    if (s.logo_url) document.querySelectorAll('[data-brand-logo]').forEach(el => el.src = s.logo_url);
    if (s.favicon_url) setFavicon(s.favicon_url);
    if (s.dashboard_banner_url) {
        const banner = document.querySelector('.ct-welcome');
        if (banner) {
            banner.style.setProperty('--ct-banner-image', `url("${s.dashboard_banner_url}")`);
            banner.style.backgroundImage = `linear-gradient(90deg, rgba(231,243,255,.80) 0%, rgba(205,229,251,.40) 38%, rgba(36,83,145,.12) 68%, rgba(5,31,71,.48) 100%), url("${s.dashboard_banner_url}")`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'center center';
        }
    }
}

export function setFavicon(url) {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = url;
}

export async function uploadBrandAsset(file, folder, filename) {
    if (!file) throw new Error('No file selected.');
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const safeName = filename || `${crypto.randomUUID()}.${ext}`;
    const path = `${folder}/${safeName}`;
    const { error } = await supabase.storage.from('cranetrack-assets').upload(path, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type || undefined
    });
    if (error) throw error;
    const { data } = supabase.storage.from('cranetrack-assets').getPublicUrl(path);
    return data.publicUrl;
}

export async function saveBranding(values) {
    const payload = { id: 1, ...values, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('system_settings').upsert(payload).select().single();
    if (error) throw error;
    return data;
}
