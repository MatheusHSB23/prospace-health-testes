/* ProSpace Health | Portal administrativo. Usa apenas a chave pública do Supabase. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const cfg = window.PROSPACE_CONFIG || {};
  const state = {
    db: null, user: null, profile: null, units: [], unitId: 'all', page: 'dashboard',
    rows: [], patients: [], recordType: 'exams', selectedUnit: null, authSubscription: null
  };

  const PAGE_LABELS = {
    dashboard: 'Visão geral', patients: 'Pacientes', appointments: 'Atendimentos',
    requests: 'Solicitações', campaigns: 'Campanhas', schedule: 'Agenda e horários',
    records: 'Registros de saúde', notifications: 'Comunicados', reports: 'Relatórios',
    units: 'Unidades', services: 'Serviços', team: 'Equipe e acessos', audit: 'Auditoria'
  };
  const STATUS = {
    scheduled: ['Agendado', 'blue'], confirmed: ['Confirmado', 'green'], completed: ['Concluído', 'green'],
    cancelled: ['Cancelado', 'red'], missed: ['Não compareceu', 'red'], received: ['Recebida', 'blue'],
    in_review: ['Em análise', 'yellow'], waiting_for_information: ['Aguardando informação', 'yellow'],
    rejected: ['Indeferida', 'red'], requested: ['Solicitado', 'blue'], processing: ['Em processamento', 'yellow'],
    available: ['Disponível', 'green'], approved: ['Aprovado', 'green'], available_for_pickup: ['Disponível para retirada', 'blue'],
    dispensed: ['Entregue', 'green'], active: ['Ativo', 'green'], inactive: ['Inativo', 'gray']
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  const ICON_PATHS = {
    dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.6"/><rect x="13.5" y="10.5" width="7" height="10" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/>' ,
    patients: '<circle cx="9" cy="8" r="3.3"/><path d="M2.8 20c.4-3.4 2.7-5.5 6.2-5.5s5.8 2.1 6.2 5.5"/><path d="M16 5.2a3.1 3.1 0 0 1 0 5.8M17.2 14.8c2.2.8 3.5 2.5 3.8 5.2"/>',
    appointments: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 15l2.2 2.2L16.5 11"/>',
    requests: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4M8 10h8M8 14h8M8 18h5"/>',
    campaigns: '<path d="M3 10.5v3a2 2 0 0 0 2 2h3l9 4V4l-9 4.5H5a2 2 0 0 0-2 2Z"/><path d="m8 15.5 2 4.2a2 2 0 0 0 1.8 1.1h1.1l-1.8-5.3M17 8.5a3.5 3.5 0 0 1 0 7"/>',
    schedule: '<rect x="3" y="4" width="15" height="17" rx="2"/><path d="M7 2.5v4M14 2.5v4M3 9h15"/><circle cx="17.5" cy="17.5" r="4"/><path d="M17.5 15.5v2l1.3 1"/>',
    records: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4M7 13h3l2-3 2.2 6 1.7-3H19"/>',
    notifications: '<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
    reports: '<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3.5" height="9.5" rx="1"/><rect x="10.3" y="4" width="3.5" height="16.5" rx="1"/><rect x="15.6" y="8" width="3.5" height="12.5" rx="1"/>',
    units: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2M11 9v4M9 11h4"/>',
    services: '<path d="M8 4.5A2.5 2.5 0 0 1 10.5 2h3A2.5 2.5 0 0 1 16 4.5V6h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2Z"/><path d="M8 6h8M12 10v7M8.5 13.5h7"/>',
    team: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c.4-3.4 2.7-5.5 6.2-5.5s5.8 2.1 6.2 5.5M16 5.2a3.1 3.1 0 0 1 0 5.8M17.2 14.8c2.2.8 3.5 2.5 3.8 5.2"/>',
    audit: '<path d="M12 2.8 20 6v5.2c0 5.1-3.1 8.4-8 10-4.9-1.6-8-4.9-8-10V6l8-3.2Z"/><path d="m8.5 12.2 2.3 2.3 4.8-5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    alert: '<path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    x: '<path d="m18 6-12 12M6 6l12 12"/>',
    flask: '<path d="M9 3h6M10 3v6.5L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7.5 16h9"/>',
    syringe: '<path d="m18 2 4 4M17 7l-8.5 8.5M14 4l6 6M4 20l4-1 11-11-3-3L5 16l-1 4ZM2 22l3-3M8 12l4 4"/>',
    pill: '<path d="M10.5 20.5 20.5 10.5a6.4 6.4 0 0 0-9-9l-10 10a6.4 6.4 0 0 0 9 9Z"/><path d="m8 8 8 8"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.4 2.4 0 1 1 4.3 1.5c-.8.9-2 1.1-2 2.7M12 17.2h.01"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/>',
    userPlus: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c.4-3.4 2.7-5.5 6.2-5.5 2.2 0 4 .8 5.1 2.2M19 8v6M16 11h6"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    toggleOn: '<rect x="2.5" y="6" width="19" height="12" rx="6"/><circle cx="15.5" cy="12" r="3.2"/>',
    toggleOff: '<rect x="2.5" y="6" width="19" height="12" rx="6"/><circle cx="8.5" cy="12" r="3.2"/>',
    clipboardCheck: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4M8 12l2.2 2.2L16 8.8"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    unlock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.8-1"/><path d="M12 14v3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    userMinus: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c.4-3.4 2.7-5.5 6.2-5.5 2.1 0 3.8.7 4.9 2M16 11h6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 3.1-.2-.1a1.7 1.7 0 0 0-1.9.3l-.1.1h-3.6l-.1-.2a1.7 1.7 0 0 0-1.5-1l-.2.1-3.1-1.8.1-.2a1.7 1.7 0 0 0-.3-1.9l-.1-.1v-3.6l.2-.1a1.7 1.7 0 0 0 1-1.5l-.1-.2 1.8-3.1.2.1a1.7 1.7 0 0 0 1.9-.3l.1-.1h3.6l.1.2a1.7 1.7 0 0 0 1.5 1l.2-.1 3.1 1.8-.1.2a1.7 1.7 0 0 0 .3 1.9l.1.1Z"/>',
    save: '<path d="M5 3h12l4 4v14H3V3h2Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>'
  };
  function iconSvg(name, className = 'ui-svg') {
    const paths = ICON_PATHS[name] || ICON_PATHS.info;
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
  }
  function mountStaticIcons() {
    $$('[data-icon]').forEach(node => {
      const name = node.dataset.icon;
      const className = node.dataset.iconClass || (
        node.classList.contains('nav-icon') || node.classList.contains('support-icon') ||
        node.classList.contains('logout-button') || node.classList.contains('mobile-menu')
          ? 'nav-svg' : 'ui-svg'
      );
      node.innerHTML = iconSvg(name, className);
    });
  }
  function dateToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dateBR(value) {
    if (!value) return '—';
    const s = String(value).slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : esc(value);
  }
  function timeBR(value) { return value ? String(value).slice(0, 5) : '—'; }
  function dateTimeBR(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? esc(value) : `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
  }
  function badge(status) {
    const [label, color] = STATUS[status] || [status || '—', 'gray'];
    return `<span class="status status-${color}">${esc(label)}</span>`;
  }
  function roleLabel(role) { return role === 'admin' ? 'Administrador geral' : role === 'health_worker' ? 'Atendente de unidade' : 'Cidadão'; }
  function initial(name) {
    const parts = String(name || 'PH').trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || 'PH').slice(0, 2)).toUpperCase();
  }
  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
    node.textContent = message;
    $('#toast-root').appendChild(node);
    setTimeout(() => node.remove(), 4800);
  }
  function showLoginMessage(message, isError = true) {
    const el = $('#login-message');
    el.textContent = message || '';
    el.style.color = isError ? 'var(--danger)' : 'var(--success)';
  }
  function failMessage(error, fallback = 'Não foi possível concluir a operação.') {
    const msg = error?.message || error?.details || String(error || fallback);
    toast(msg, 'error');
    console.error('[ProSpace Gestão]', error);
  }
  function todayLabel() {
    $('#today-label').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }
  function scoped(query, column = 'unit_id') {
    if (state.unitId && state.unitId !== 'all') return query.eq(column, state.unitId);
    return query;
  }
  function scopedCampaigns(query) {
    if (state.unitId && state.unitId !== 'all') {
      return canAdmin()
        ? query.or(`unit_id.eq.${state.unitId},unit_id.is.null`)
        : query.eq('unit_id', state.unitId);
    }
    return query;
  }
  function defaultUnit() {
    if (state.unitId !== 'all') return state.unitId;
    return state.units[0]?.id || '';
  }
  function unitOptions(selected = '', includeBlank = false) {
    let options = includeBlank ? '<option value="">Selecione uma unidade</option>' : '';
    options += state.units.map(unit => `<option value="${esc(unit.id)}" ${String(selected) === String(unit.id) ? 'selected' : ''}>${esc(unit.name)}</option>`).join('');
    return options;
  }
  function selectUnitFilter() {
    const sel = $('#unit-filter');
    if (!sel) return;
    const selected = state.profile?.role === 'admin' ? state.unitId : (state.units[0]?.id || '');
    sel.innerHTML = state.profile?.role === 'admin'
      ? `<option value="all">Todas as unidades</option>${unitOptions(state.unitId === 'all' ? '' : state.unitId)}`
      : unitOptions(selected);
    sel.value = selected || 'all';
    sel.disabled = state.units.length < 2;
  }
  function canAdmin() { return state.profile?.role === 'admin'; }
  function pageHeader(title, subtitle, action = '') {
    return `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="page-actions">${action}</div></div>`;
  }
  function emptyState(text, icon = 'info') {
    return `<div class="empty-state"><div class="empty-symbol">${iconSvg(icon)}</div>${esc(text)}</div>`;
  }
  function table(headers, rows, emptyText = 'Nenhum registro encontrado.') {
    if (!rows.length) return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody><tr><td class="table-empty" colspan="${headers.length}">${esc(emptyText)}</td></tr></tbody></table></div>`;
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }
  function searchBox(placeholder) {
    return `<div class="search-box"><span class="search-box-icon">${iconSvg('search')}</span><input id="table-search" type="search" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"></div>`;
  }
  function loading() { $('#page-view').innerHTML = `<div class="loading-panel"><div class="spinner"></div><p>Carregando informações...</p></div>`; }
  async function queryRows(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  async function countRows(tableName, column = 'id', scopeColumn = 'unit_id') {
    let query = state.db.from(tableName).select(column, { count: 'exact', head: true });
    query = scoped(query, scopeColumn);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  async function init() {
    mountStaticIcons();
    todayLabel();
    if (!window.supabase?.createClient) {
      showLoginMessage('Não foi possível carregar a biblioteca Supabase. Verifique sua conexão com a internet.');
      return;
    }
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || cfg.supabaseAnonKey.toLowerCase().includes('sua_chave')) {
      showLoginMessage('Configure a Project URL e a chave pública em supabase-config.js.');
      return;
    }
    try {
      state.db = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { storageKey: 'prospace-gestao-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      bindStaticEvents();
      const { data: { session }, error } = await state.db.auth.getSession();
      if (error) throw error;
      state.db.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession?.user && (!state.user || state.user.id !== nextSession.user.id)) {
          loadAuthorized(nextSession.user).catch(error => { showLogin(); showLoginMessage(error.message || 'Não foi possível carregar suas permissões.'); });
        }
        if (!nextSession?.user && state.user) showLogin();
      });
      if (session?.user) await loadAuthorized(session.user);
    } catch (error) {
      state.user = null; state.profile = null;
      showLoginMessage(error.message || 'Não foi possível iniciar a conexão com o Supabase.');
    }
  }

  function bindStaticEvents() {
    $('#login-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const button = $('button[type="submit"]', event.currentTarget);
      button.disabled = true;
      showLoginMessage('Validando acesso...', false);
      try {
        const { error } = await state.db.auth.signInWithPassword({ email: form.get('email').trim(), password: form.get('password') });
        if (error) throw error;
        showLoginMessage('Acesso validado. Carregando painel...', false);
      } catch (error) {
        showLoginMessage(error.message || 'E-mail ou senha inválidos.');
      } finally { button.disabled = false; }
    });
    $('#forgot-password')?.addEventListener('click', async () => {
      const email = $('#login-form [name="email"]').value.trim();
      if (!email) return showLoginMessage('Informe seu e-mail no campo acima para recuperar a senha.');
      try {
        const { error } = await state.db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
        if (error) throw error;
        showLoginMessage('Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.', false);
      } catch (error) { showLoginMessage(error.message); }
    });
    $('#logout-button')?.addEventListener('click', logout);
    $('#unit-filter')?.addEventListener('change', async event => {
      state.unitId = event.target.value;
      await loadPage(state.page);
    });
    $('#main-nav')?.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (button) navigate(button.dataset.page);
    });
    $('#mobile-menu')?.addEventListener('click', () => {
      if ($('#sidebar')?.classList.contains('open')) closeSidebar();
      else openSidebar();
    });
    $('#sidebar-overlay')?.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && $('#sidebar')?.classList.contains('open')) {
        closeSidebar();
        $('#mobile-menu')?.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) closeSidebar();
    });
    $('#page-view')?.addEventListener('click', onPageClick);
    $('#page-view')?.addEventListener('submit', onPageSubmit);
    $('#page-view')?.addEventListener('input', onPageInput);
    $('#page-view')?.addEventListener('change', onPageChange);
    $('#modal-root')?.addEventListener('click', event => {
      if (event.target.matches('.modal-backdrop') || event.target.closest('[data-close-modal]')) closeModal();
    });
    $('#modal-root')?.addEventListener('submit', onModalSubmit);
  }

  async function loadAuthorized(user) {
    state.user = user;
    const { data: profile, error } = await state.db.from('profiles').select('id,full_name,role').eq('id', user.id).maybeSingle();
    if (error) throw error;
    if (!profile || !['admin', 'health_worker'].includes(profile.role)) {
      await state.db.auth.signOut();
      state.user = null;
      showLogin();
      showLoginMessage('Esta conta ainda não possui permissão de atendente ou administrador. Solicite liberação à administração.');
      return;
    }
    state.profile = profile;
    if (profile.role === 'admin') {
      state.units = await queryRows(state.db.from('health_units').select('id,name,address,city,state,phone,unit_type,opening_hours,active').order('name'));
      state.unitId = 'all';
    } else {
      const assignments = await queryRows(state.db.from('staff_unit_access').select('unit_id,active,health_units(id,name,address,city,state,phone,unit_type,opening_hours,active)').eq('user_id', user.id).eq('active', true));
      state.units = assignments.map(item => item.health_units).filter(Boolean);
      if (!state.units.length) {
        await state.db.auth.signOut();
        state.user = null;
        showLogin();
        showLoginMessage('Sua conta está cadastrada como atendente, mas ainda não foi vinculada a uma unidade. Peça ao administrador para atribuir uma unidade.');
        return;
      }
      state.unitId = state.units[0].id;
    }
    $('#login-screen').classList.add('hidden');
    $('#app-shell').classList.remove('hidden');
    $('#sidebar-name').textContent = profile.full_name || user.email;
    $('#top-name').textContent = profile.full_name || user.email;
    $('#sidebar-role').textContent = roleLabel(profile.role);
    $('#top-role').textContent = roleLabel(profile.role);
    $('#sidebar-avatar').textContent = initial(profile.full_name || user.email);
    $('#top-avatar').textContent = initial(profile.full_name || user.email);
    $('#admin-nav').classList.toggle('hidden', !canAdmin());
    selectUnitFilter();
    await loadPage('dashboard');
  }

  function openSidebar() {
    if (window.innerWidth > 760) return;
    $('#sidebar')?.classList.add('open');
    $('#sidebar-overlay')?.classList.add('visible');
    document.body.classList.add('sidebar-open');
    $('#mobile-menu')?.setAttribute('aria-expanded', 'true');
  }
  function closeSidebar() {
    $('#sidebar')?.classList.remove('open');
    $('#sidebar-overlay')?.classList.remove('visible');
    document.body.classList.remove('sidebar-open');
    $('#mobile-menu')?.setAttribute('aria-expanded', 'false');
  }

  function showLogin() {
    closeSidebar();
    state.user = null; state.profile = null; state.units = [];
    $('#app-shell').classList.add('hidden');
    $('#login-screen').classList.remove('hidden');
    showLoginMessage('');
  }
  async function logout() {
    try { const { error } = await state.db.auth.signOut(); if (error) throw error; showLogin(); }
    catch (error) { failMessage(error); }
  }
  function navigate(page) {
    if (!PAGE_LABELS[page]) return;
    if (!canAdmin() && ['units', 'services', 'team', 'audit'].includes(page)) return;
    state.page = page;
    $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === page));
    $('#breadcrumb-page').textContent = PAGE_LABELS[page];
    closeSidebar();
    loadPage(page);
  }
  async function loadPage(page) {
    state.page = page;
    $('#breadcrumb-page').textContent = PAGE_LABELS[page] || 'Visão geral';
    loading();
    try {
      const actions = {
        dashboard: renderDashboard, patients: renderPatients, appointments: renderAppointments,
        requests: renderRequests, campaigns: renderCampaigns, schedule: renderSchedule,
        records: renderRecords, notifications: renderNotifications, reports: renderReports,
        units: renderUnits, services: renderServices, team: renderTeam, audit: renderAudit
      };
      await (actions[page] || renderDashboard)();
      $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === page));
    } catch (error) {
      $('#page-view').innerHTML = `<div class="access-denied"><div class="symbol">${iconSvg('alert')}</div><h2>Não foi possível carregar esta área</h2><p>${esc(error.message || 'Verifique a configuração do banco e as permissões da sua conta.')}</p><button class="btn btn-secondary" data-action="reload-page">${iconSvg('refresh','button-icon')} Tentar novamente</button></div>`;
      console.error(error);
    }
  }

  async function fetchPatients(limit = 1000) {
    let q = state.db.from('patient_registry').select('id,auth_user_id,full_name,cpf,birth_date,mother_name,gender,cns,phone,email,postal_code,street,address_number,address_complement,neighborhood,city,state,unit_id,source,active,created_at,health_units(name)').order('created_at', { ascending: false }).limit(limit);
    q = scoped(q);
    return queryRows(q);
  }
  async function patientNameMap(userIds) {
    const ids = [...new Set((userIds || []).filter(Boolean))];
    if (!ids.length) return {};
    const rows = await queryRows(state.db.from('patient_registry').select('auth_user_id,full_name,cpf,phone').in('auth_user_id', ids));
    return Object.fromEntries(rows.map(row => [row.auth_user_id, row]));
  }
  function unitName(id) { return state.units.find(unit => unit.id === id)?.name || '—'; }

  async function renderDashboard() {
    const today = dateToday();
    const [patientCount, appointmentCount, pendingCount, campaignCount, todayAppointments, pendingRequests] = await Promise.all([
      countRows('patient_registry'),
      (async () => { let q = state.db.from('appointments').select('id', {count:'exact', head:true}).eq('appointment_date', today).neq('status', 'cancelled'); q = scoped(q); const r = await q; if (r.error) throw r.error; return r.count || 0; })(),
      (async () => { let q = state.db.from('service_requests').select('id', {count:'exact', head:true}).in('status', ['received','in_review','waiting_for_information']); q = scoped(q); const r = await q; if (r.error) throw r.error; return r.count || 0; })(),
      (async () => { let q = state.db.from('campaigns').select('id', {count:'exact', head:true}).eq('active', true); q = scopedCampaigns(q); const r = await q; if (r.error) throw r.error; return r.count || 0; })(),
      (async () => { let q = state.db.from('appointments').select('id,protocol,user_id,appointment_date,appointment_time,status,unit_id,health_services(name)').eq('appointment_date', today).neq('status','cancelled').order('appointment_time').limit(10); q = scoped(q); return queryRows(q); })(),
      (async () => { let q = state.db.from('service_requests').select('id,protocol,request_type,status,created_at,unit_id').in('status',['received','in_review','waiting_for_information']).order('created_at',{ascending:false}).limit(5); q = scoped(q); return queryRows(q); })()
    ]);
    const names = await patientNameMap(todayAppointments.map(a => a.user_id));
    const apRows = todayAppointments.map(a => `<tr><td class="primary-cell">${esc(a.appointment_time?.slice(0,5) || '—')}<span class="sub-cell">${esc(a.protocol)}</span></td><td class="primary-cell">${esc(names[a.user_id]?.full_name || 'Paciente sem vínculo')}<span class="sub-cell">${esc(names[a.user_id]?.cpf || '')}</span></td><td>${esc(a.health_services?.name || 'Atendimento')}</td><td>${badge(a.status)}</td></tr>`);
    const reqRows = pendingRequests.map(r => `<div class="mini-row"><div class="mini-icon">${iconSvg('requests')}</div><div class="mini-row-main"><strong>${esc(r.request_type)}</strong><small>${esc(r.protocol)} · ${dateTimeBR(r.created_at)}</small></div><div class="mini-row-tail">${badge(r.status)}</div></div>`).join('');
    $('#request-nav-count').textContent = pendingCount ? String(Math.min(pendingCount, 99)) : '';
    $('#page-view').innerHTML = `${pageHeader('Visão geral', `Resumo operacional ${state.unitId === 'all' ? 'da rede' : 'da unidade selecionada'} para ${dateBR(today)}.`, `<button class="btn btn-outline" data-action="refresh">${iconSvg('refresh','button-icon')} Atualizar dados</button>`)}
      <div class="grid stats-grid">
        ${statCard('Pacientes cadastrados', patientCount, 'patients', 'Cadastros visíveis no seu acesso')}
        ${statCard('Atendimentos hoje', appointmentCount, 'appointments', 'Agendamentos não cancelados')}
        ${statCard('Solicitações pendentes', pendingCount, 'requests', 'Aguardando análise ou retorno')}
        ${statCard('Campanhas ativas', campaignCount, 'campaigns', 'Campanhas atualmente publicadas')}
      </div>
      <div class="content-grid" style="margin-top:16px">
        <section class="panel"><div class="panel-header"><div><h3>Agenda de hoje</h3><p>Próximos atendimentos da unidade</p></div><button class="link-button" data-action="goto" data-page="appointments">Ver agenda completa ${iconSvg('arrowRight','button-icon')}</button></div>
          ${todayAppointments.length ? table(['Horário / protocolo','Paciente','Serviço','Situação'], apRows) : emptyState('Não há atendimentos agendados para hoje.','schedule')}
        </section>
        <section class="panel"><div class="panel-header"><div><h3>Solicitações que precisam de atenção</h3><p>Pedidos recentes ainda não finalizados</p></div><button class="link-button" data-action="goto" data-page="requests">Ver todas ${iconSvg('arrowRight','button-icon')}</button></div>
          <div class="list-stack">${reqRows || emptyState('Nenhuma solicitação pendente.','check')}</div>
          <div class="notice-box"><strong>Organização da unidade</strong>Atualize os status após cada atendimento para manter o cidadão informado e os relatórios consistentes.</div>
        </section>
      </div>
      <div class="section-title"><h3>Ações rápidas</h3><span>Atalhos para tarefas frequentes</span></div>
      <div class="grid quick-actions">
        <button class="quick-action" data-action="new-patient"><span class="quick-action-icon">${iconSvg('patients')}</span><strong>Novo paciente</strong><small>Registrar dados cadastrais</small></button>
        <button class="quick-action" data-action="goto" data-page="schedule"><span class="quick-action-icon">${iconSvg('schedule')}</span><strong>Disponibilizar horários</strong><small>Organizar a agenda da unidade</small></button>
        <button class="quick-action" data-action="goto" data-page="campaigns"><span class="quick-action-icon">${iconSvg('campaigns')}</span><strong>Nova campanha</strong><small>Divulgar ação de saúde</small></button>
        <button class="quick-action" data-action="goto" data-page="notifications"><span class="quick-action-icon">${iconSvg('notifications')}</span><strong>Enviar comunicado</strong><small>Informar pacientes vinculados</small></button>
      </div>`;
  }
  function statCard(label, value, icon, foot) {
    return `<div class="stat-card"><div class="stat-head"><span>${esc(label)}</span><span class="stat-icon">${iconSvg(icon)}</span></div><div class="stat-value">${Number(value || 0).toLocaleString('pt-BR')}</div><div class="stat-foot">${esc(foot)}</div></div>`;
  }

  async function renderPatients() {
    state.patients = await fetchPatients();
    state.rows = state.patients;
    const rows = state.patients.map(p => `<tr data-search="${esc((p.full_name+' '+(p.cpf||'')+' '+(p.phone||'')).toLowerCase())}">
      <td class="primary-cell">${esc(p.full_name)}<span class="sub-cell">${esc(p.email || 'E-mail não informado')}</span></td>
      <td>${esc(p.cpf || '—')}</td><td>${dateBR(p.birth_date)}</td><td>${esc(p.phone || '—')}</td>
      <td>${esc(p.unit_id ? (p.health_units?.name || unitName(p.unit_id)) : 'Sem unidade')}</td><td>${badge(p.active ? 'active' : 'inactive')}</td>
      <td><div class="table-actions"><button data-action="edit-patient" data-id="${esc(p.id)}">${iconSvg('edit','button-icon')} Editar</button><button data-action="toggle-patient" data-id="${esc(p.id)}" data-active="${p.active}">${iconSvg(p.active ? 'toggleOff' : 'toggleOn','button-icon')} ${p.active ? 'Inativar' : 'Ativar'}</button></div></td></tr>`);
    const unassignedCount=state.patients.filter(p=>!p.unit_id).length;
    $('#page-view').innerHTML = `${pageHeader('Pacientes', 'Cadastro administrativo, atualização de dados e vínculo com a unidade.', `<button class="btn btn-outline" data-action="export-patients">${iconSvg('download','button-icon')} Exportar CSV</button><button class="btn btn-primary" data-action="new-patient">${iconSvg('plus','button-icon')} Novo paciente</button>`)}
      ${canAdmin() && unassignedCount ? `<div class="warning-banner"><span class="warning-icon">${iconSvg('alert')}</span><div><strong>${unassignedCount} cadastro(s) sem unidade vinculada</strong>Edite esses registros e selecione a unidade responsável para que os atendentes possam acessá-los.</div></div>` : ''}
      <div class="panel"><div class="toolbar"><div class="toolbar-left">${searchBox('Buscar por nome, CPF ou telefone...')}<select class="filter-select" id="patient-status-filter"><option value="all">Todos os cadastros</option><option value="true">Ativos</option><option value="false">Inativos</option></select></div><div class="toolbar-right"><span class="metric-chip">${state.patients.length} registro(s)</span></div></div>
      <div id="patients-table">${table(['Paciente','CPF','Nascimento','Telefone','Unidade','Situação','Ações'], rows, 'Nenhum paciente cadastrado nesta unidade.')}</div>
      <div class="pagination-info">Os cadastros criados pela equipe ficam no registro administrativo. Quando o cidadão criar uma conta no aplicativo com o mesmo CPF, o vínculo poderá ser associado automaticamente.</div></div>`;
  }

  async function renderAppointments() {
    let q = state.db.from('appointments').select('id,user_id,protocol,appointment_date,appointment_time,status,reason,symptoms,unit_id,service_id,health_units(name),health_services(name)').order('appointment_date',{ascending:false}).order('appointment_time',{ascending:false}).limit(500);
    q = scoped(q);
    const rows = await queryRows(q);
    const names = await patientNameMap(rows.map(r => r.user_id));
    state.rows = rows.map(row => ({...row, patient: names[row.user_id]}));
    const tableRows = state.rows.map(a => `<tr data-search="${esc(((a.protocol||'')+' '+(a.patient?.full_name||'')+' '+(a.patient?.cpf||'')).toLowerCase())}">
      <td class="primary-cell">${esc(a.protocol)}<span class="sub-cell">${esc(a.patient?.full_name || 'Paciente sem vínculo')}</span></td>
      <td>${dateBR(a.appointment_date)}<span class="sub-cell">${timeBR(a.appointment_time)}</span></td>
      <td>${esc(a.health_units?.name || unitName(a.unit_id))}</td><td>${esc(a.health_services?.name || '—')}</td><td>${badge(a.status)}</td>
      <td><div class="table-actions"><button data-action="appointment-status" data-id="${esc(a.id)}">${iconSvg('clipboardCheck','button-icon')} Atualizar status</button></div></td></tr>`);
    $('#page-view').innerHTML = `${pageHeader('Atendimentos', 'Acompanhe a agenda, confirme presença e registre o resultado do atendimento.', `<button class="btn btn-outline" data-action="export-appointments">${iconSvg('download','button-icon')} Exportar CSV</button>`)}
      <div class="panel"><div class="toolbar"><div class="toolbar-left">${searchBox('Buscar protocolo, paciente ou CPF...')}<select id="appointment-status-filter" class="filter-select"><option value="all">Todos os status</option><option value="scheduled">Agendado</option><option value="confirmed">Confirmado</option><option value="completed">Concluído</option><option value="missed">Não compareceu</option><option value="cancelled">Cancelado</option></select></div><div class="toolbar-right"><span class="metric-chip">${rows.length} atendimento(s)</span></div></div>
      <div id="appointments-table">${table(['Protocolo / paciente','Data e horário','Unidade','Serviço','Status','Ações'], tableRows, 'Nenhum atendimento encontrado.')}</div></div>`;
  }

  async function renderRequests() {
    let q = state.db.from('service_requests').select('id,user_id,protocol,request_type,description,status,unit_id,created_at,updated_at,health_units(name)').order('created_at',{ascending:false}).limit(500);
    q = scoped(q);
    const rows = await queryRows(q);
    const names = await patientNameMap(rows.map(r => r.user_id));
    state.rows = rows.map(r => ({...r, patient:names[r.user_id]}));
    const tableRows = state.rows.map(r => `<tr data-search="${esc(((r.protocol||'')+' '+(r.request_type||'')+' '+(r.patient?.full_name||'')).toLowerCase())}">
      <td class="primary-cell">${esc(r.protocol)}<span class="sub-cell">${dateTimeBR(r.created_at)}</span></td>
      <td class="primary-cell">${esc(r.patient?.full_name || 'Paciente sem vínculo')}<span class="sub-cell">${esc(r.patient?.cpf || '')}</span></td>
      <td>${esc(r.request_type)}</td><td>${esc(r.unit_id ? (r.health_units?.name || unitName(r.unit_id)) : 'Fila geral')}</td><td>${badge(r.status)}</td>
      <td><div class="table-actions"><button data-action="request-edit" data-id="${esc(r.id)}">${iconSvg('search','button-icon')} Analisar</button></div></td></tr>`);
    const unassigned = rows.filter(r => !r.unit_id).length;
    $('#page-view').innerHTML = `${pageHeader('Solicitações', 'Triagem e acompanhamento de pedidos enviados pelos cidadãos.', `<button class="btn btn-outline" data-action="export-requests">${iconSvg('download','button-icon')} Exportar CSV</button>`)}
      ${canAdmin() && unassigned ? `<div class="warning-banner"><span class="warning-icon">${iconSvg('alert')}</span><div><strong>${unassigned} solicitação(ões) na fila geral</strong>Atribua uma unidade para encaminhar os pedidos aos atendentes locais.</div></div>` : ''}
      <div class="panel"><div class="toolbar"><div class="toolbar-left">${searchBox('Buscar protocolo, paciente ou tipo...')}<select id="request-status-filter" class="filter-select"><option value="all">Todos os status</option><option value="received">Recebida</option><option value="in_review">Em análise</option><option value="waiting_for_information">Aguardando informação</option><option value="completed">Concluída</option><option value="rejected">Indeferida</option></select></div><div class="toolbar-right"><span class="metric-chip">${rows.length} solicitação(ões)</span></div></div>
      <div id="requests-table">${table(['Protocolo / abertura','Paciente','Tipo','Unidade','Status','Ação'], tableRows, 'Nenhuma solicitação encontrada.')}</div></div>`;
    $('#request-nav-count').textContent = rows.filter(r => ['received','in_review','waiting_for_information'].includes(r.status)).length || '';
  }

  async function renderCampaigns() {
    let q = state.db.from('campaigns').select('id,title,description,start_date,end_date,unit_id,active,category,audience,location,contact_phone,health_units(name)').order('start_date',{ascending:false}).limit(300);
    q = scopedCampaigns(q);
    const rows = await queryRows(q); state.rows = rows;
    const tableRows = rows.map(c => `<tr data-search="${esc((c.title+' '+(c.category||'')+' '+(c.audience||'')).toLowerCase())}">
      <td class="primary-cell">${esc(c.title)}<span class="sub-cell">${esc(c.category || 'Saúde pública')}</span></td><td>${dateBR(c.start_date)} – ${dateBR(c.end_date)}</td>
      <td>${esc(c.unit_id ? (c.health_units?.name || unitName(c.unit_id)) : 'Rede inteira')}</td><td>${esc(c.audience || 'Público geral')}</td><td>${badge(c.active ? 'active' : 'inactive')}</td>
      <td><div class="table-actions"><button data-action="edit-campaign" data-id="${esc(c.id)}">${iconSvg('edit','button-icon')} Editar</button><button data-action="toggle-campaign" data-id="${esc(c.id)}" data-active="${c.active}">${iconSvg(c.active ? 'toggleOff' : 'toggleOn','button-icon')} ${c.active ? 'Desativar' : 'Publicar'}</button></div></td></tr>`);
    $('#page-view').innerHTML = `${pageHeader('Campanhas e ações de saúde', 'Crie campanhas, informe público-alvo, período e local de atendimento.', `<button class="btn btn-primary" data-action="new-campaign">${iconSvg('plus','button-icon')} Nova campanha</button>`)}
      <div class="panel"><div class="toolbar"><div class="toolbar-left">${searchBox('Buscar campanha ou categoria...')}<select id="campaign-active-filter" class="filter-select"><option value="all">Todas</option><option value="true">Ativas</option><option value="false">Inativas</option></select></div><div class="toolbar-right"><span class="metric-chip">${rows.length} campanha(s)</span></div></div>
      ${table(['Campanha / categoria','Período','Unidade','Público-alvo','Situação','Ações'],tableRows,'Nenhuma campanha cadastrada.')}</div>`;
  }

  async function renderSchedule() {
    let q = state.db.from('appointment_slots').select('id,unit_id,service_id,slot_date,slot_time,capacity,booked_count,is_open,health_units(name),health_services(name)').order('slot_date',{ascending:true}).order('slot_time',{ascending:true}).gte('slot_date',dateToday()).limit(500);
    q = scoped(q);
    const rows = await queryRows(q); state.rows = rows;
    const tableRows = rows.map(slot => `<tr><td class="primary-cell">${dateBR(slot.slot_date)}<span class="sub-cell">${timeBR(slot.slot_time)}</span></td><td>${esc(slot.health_units?.name || unitName(slot.unit_id))}</td><td>${esc(slot.health_services?.name || '—')}</td><td>${slot.booked_count}/${slot.capacity}</td><td>${badge(slot.is_open ? 'active' : 'inactive')}</td><td><div class="table-actions"><button data-action="toggle-slot" data-id="${esc(slot.id)}" data-open="${slot.is_open}">${iconSvg(slot.is_open ? 'lock' : 'unlock','button-icon')} ${slot.is_open ? 'Fechar' : 'Abrir'}</button>${slot.booked_count === 0 ? `<button class="danger-action" data-action="delete-slot" data-id="${esc(slot.id)}">${iconSvg('trash','button-icon')} Excluir</button>` : ''}</div></td></tr>`);
    const services = await queryRows(state.db.from('health_services').select('id,name').eq('active',true).order('name'));
    $('#page-view').innerHTML = `${pageHeader('Agenda e horários', 'Abra vagas por serviço, data e capacidade para os cidadãos agendarem pelo aplicativo.', `<button class="btn btn-primary" data-action="new-slot">${iconSvg('plus','button-icon')} Criar horários</button>`)}
      <div class="panel"><div class="toolbar"><div class="toolbar-left"><span class="metric-chip">${rows.length} horário(s) futuro(s)</span><span class="metric-chip">${services.length} serviço(s) ativo(s)</span></div><div class="toolbar-right"><button class="btn btn-outline btn-small" data-action="goto" data-page="services">${iconSvg('settings','button-icon')} Gerenciar serviços</button></div></div>
      ${table(['Data / horário','Unidade','Serviço','Vagas ocupadas','Situação','Ações'],tableRows,'Nenhum horário futuro cadastrado.')}
      <div class="pagination-info">Os horários com reservas não podem ser excluídos. Feche horários para impedir novos agendamentos sem remover os registros existentes.</div></div>`;
  }

  async function renderRecords() {
    const [patients, exams, vaccines, meds] = await Promise.all([
      fetchPatients(),
      (async()=>{let q=state.db.from('exam_records').select('id,user_id,unit_id,title,requested_at,collected_at,status,result_summary,created_at').order('created_at',{ascending:false}).limit(250); q=scoped(q); return queryRows(q);})(),
      (async()=>{let q=state.db.from('vaccinations').select('id,user_id,unit_id,vaccine_name,dose,application_date,next_dose_date,notes,created_at,health_units(name)').order('application_date',{ascending:false}).limit(250); q=scoped(q); return queryRows(q);})(),
      (async()=>{let q=state.db.from('medication_orders').select('id,user_id,pickup_unit_id,medication_name,dosage,quantity,status,instructions,created_at,health_units(name)').order('created_at',{ascending:false}).limit(250); q=scoped(q,'pickup_unit_id'); return queryRows(q);})()
    ]);
    state.patients = patients; state.recordData = {exams,vaccines,meds};
    const names = await patientNameMap([...exams,...vaccines,...meds].map(r=>r.user_id));
    state.recordDataNames = names;
    const type=state.recordType;
    const data=type==='exams'?exams:type==='vaccines'?vaccines:meds;
    const rows=data.map(r=>{
      const patient=names[r.user_id]?.full_name || 'Paciente sem vínculo';
      if(type==='exams') return `<tr><td class="primary-cell">${esc(r.title)}<span class="sub-cell">${esc(patient)}</span></td><td>${dateBR(r.requested_at)}</td><td>${dateBR(r.collected_at)}</td><td>${badge(r.status)}</td><td><button class="btn btn-outline btn-small" data-action="record-status" data-type="exams" data-id="${esc(r.id)}" data-status="${esc(r.status)}">${iconSvg('refresh','button-icon')} Atualizar</button></td></tr>`;
      if(type==='vaccines') return `<tr><td class="primary-cell">${esc(r.vaccine_name)}<span class="sub-cell">${esc(patient)}</span></td><td>${esc(r.dose||'—')}</td><td>${dateBR(r.application_date)}</td><td>${dateBR(r.next_dose_date)}</td><td><button class="btn btn-outline btn-small" data-action="record-status" data-type="vaccines" data-id="${esc(r.id)}" data-status="">${iconSvg('edit','button-icon')} Editar</button></td></tr>`;
      return `<tr><td class="primary-cell">${esc(r.medication_name)}<span class="sub-cell">${esc(patient)}</span></td><td>${esc(r.dosage||'—')}</td><td>${esc(r.quantity||'—')}</td><td>${badge(r.status)}</td><td><button class="btn btn-outline btn-small" data-action="record-status" data-type="meds" data-id="${esc(r.id)}" data-status="${esc(r.status)}">${iconSvg('refresh','button-icon')} Atualizar</button></td></tr>`;
    });
    const tab = (id,label,count,icon)=>`<button class="tab ${type===id?'active':''}" data-action="record-tab" data-type="${id}">${iconSvg(icon,'tab-icon')}<span>${label} (${count})</span></button>`;
    let headers=type==='exams'?['Exame / paciente','Solicitado','Coletado','Status','Ações']:type==='vaccines'?['Vacina / paciente','Dose','Aplicação','Próxima dose','Ações']:['Medicamento / paciente','Dosagem','Quantidade','Status','Ações'];
    $('#page-view').innerHTML = `${pageHeader('Registros de saúde', 'Acompanhamento administrativo de exames, vacinação e dispensação de medicamentos.', `<button class="btn btn-primary" data-action="new-record" data-type="${type}">${iconSvg('plus','button-icon')} Novo registro</button>`)}
      <div class="warning-banner"><span class="warning-icon">${iconSvg('alert')}</span><div><strong>Dados pessoais e de saúde são informações sensíveis</strong>Consulte apenas o necessário para a sua função. Não insira diagnósticos ou detalhes clínicos em campos administrativos livres.</div></div>
      <div class="panel"><div class="tabs">${tab('exams','Exames',exams.length,'flask')}${tab('vaccines','Vacinação',vaccines.length,'syringe')}${tab('meds','Medicamentos',meds.length,'pill')}</div>
      ${table(headers,rows,'Nenhum registro encontrado nesta categoria.')}</div>`;
  }

  async function renderNotifications() {
    let q = state.db.from('notifications').select('id,unit_id,title,body,read_at,created_at').order('created_at',{ascending:false}).limit(300);
    q = scoped(q);
    const raw = await queryRows(q);
    // Agrupa as notificações individuais de um mesmo comunicado, evitando uma lista enorme duplicada.
    const groups = new Map();
    raw.forEach(row=>{const key=[row.title,row.body,row.unit_id,String(row.created_at||'').slice(0,16)].join('|');if(!groups.has(key))groups.set(key,{...row,total:0,read:0});const g=groups.get(key);g.total++;if(row.read_at)g.read++;});
    const rows=[...groups.values()].slice(0,100);
    const tableRows=rows.map(r=>`<tr><td class="primary-cell">${esc(r.title)}<span class="sub-cell">${esc(r.body)}</span></td><td>${esc(unitName(r.unit_id))}</td><td>${dateTimeBR(r.created_at)}</td><td>${r.total-r.read}/${r.total} não lida(s)</td></tr>`);
    $('#page-view').innerHTML = `${pageHeader('Comunicados aos pacientes', 'Envie orientações e avisos para pacientes com conta vinculada à unidade selecionada.', `<button class="btn btn-primary" data-action="new-notification">${iconSvg('plus','button-icon')} Novo comunicado</button>`)}
      <div class="notice-box" style="margin:0 0 15px"><strong>Como funciona o envio</strong>O sistema cria uma notificação para cada paciente ativo da unidade que tenha conta vinculada ao aplicativo. Cadastros administrativos sem login não recebem notificação no app.</div>
      <div class="panel"><div class="panel-header"><div><h3>Histórico de comunicados enviados</h3><p>Mensagens agrupadas por título e horário aproximado</p></div><span class="metric-chip">${raw.length} entrega(s)</span></div>
      ${table(['Comunicado','Unidade','Enviado em','Leitura'],tableRows,'Nenhum comunicado enviado ainda.')}</div>`;
  }

  async function renderUnits() {
    if (!canAdmin()) throw new Error('Somente o administrador geral pode gerenciar unidades.');
    const rows=await queryRows(state.db.from('health_units').select('id,name,address,city,state,phone,unit_type,opening_hours,active,created_at').order('name'));
    state.rows=rows;
    state.units=rows;
    selectUnitFilter();
    const tableRows=rows.map(u=>`<tr><td class="primary-cell">${esc(u.name)}<span class="sub-cell">${esc(u.unit_type)}</span></td><td>${esc(u.address)}, ${esc(u.city)}/${esc(u.state)}</td><td>${esc(u.phone||'—')}</td><td>${esc(u.opening_hours||'—')}</td><td>${badge(u.active?'active':'inactive')}</td><td><div class="table-actions"><button data-action="edit-unit" data-id="${esc(u.id)}">${iconSvg('edit','button-icon')} Editar</button><button data-action="toggle-unit" data-id="${esc(u.id)}" data-active="${u.active}">${iconSvg(u.active ? 'toggleOff' : 'toggleOn','button-icon')} ${u.active?'Desativar':'Ativar'}</button></div></td></tr>`);
    $('#page-view').innerHTML=`${pageHeader('Unidades de saúde','Cadastre e mantenha os dados das unidades da rede. A inativação impede novos agendamentos.',`<button class="btn btn-primary" data-action="new-unit">${iconSvg('plus','button-icon')} Nova unidade</button>`)}<div class="panel">${table(['Unidade / tipo','Endereço','Telefone','Horário de funcionamento','Situação','Ações'],tableRows,'Nenhuma unidade cadastrada.')}</div>`;
  }

  async function renderServices() {
    if (!canAdmin()) throw new Error('Somente o administrador geral pode gerenciar serviços.');
    const rows=await queryRows(state.db.from('health_services').select('id,name,description,active,created_at').order('name'));
    state.rows=rows;
    const tableRows=rows.map(s=>`<tr><td class="primary-cell">${esc(s.name)}</td><td>${esc(s.description||'—')}</td><td>${badge(s.active?'active':'inactive')}</td><td><div class="table-actions"><button data-action="edit-service" data-id="${esc(s.id)}">${iconSvg('edit','button-icon')} Editar</button><button data-action="toggle-service" data-id="${esc(s.id)}" data-active="${s.active}">${iconSvg(s.active ? 'toggleOff' : 'toggleOn','button-icon')} ${s.active?'Desativar':'Ativar'}</button></div></td></tr>`);
    $('#page-view').innerHTML=`${pageHeader('Catálogo de serviços','Gerencie os tipos de atendimento que aparecem na agenda do aplicativo.',`<button class="btn btn-primary" data-action="new-service">${iconSvg('plus','button-icon')} Novo serviço</button>`)}<div class="panel">${table(['Serviço','Descrição','Situação','Ações'],tableRows,'Nenhum serviço cadastrado.')}</div>`;
  }

  async function renderTeam() {
    if (!canAdmin()) throw new Error('Somente o administrador geral pode gerenciar a equipe.');
    const rows=await queryRows(state.db.rpc('admin_list_staff'));
    state.rows=rows;
    const tableRows=rows.map(person=>`<tr><td class="primary-cell">${esc(person.full_name||'Sem nome')}<span class="sub-cell">${esc(person.email)}</span></td><td>${esc(roleLabel(person.role))}</td><td>${esc(person.unit_name || (person.role==='admin'?'Acesso à rede':'Sem unidade vinculada'))}</td><td>${badge(person.active===false?'inactive':'active')}</td><td>${person.role==='health_worker'&&person.unit_id?`<button class="btn btn-danger btn-small" data-action="remove-staff-unit" data-id="${esc(person.user_id)}" data-unit-id="${esc(person.unit_id)}">${iconSvg('userMinus','button-icon')} Remover desta unidade</button>`:(person.role==='health_worker'?'Sem unidade vinculada':'—')}</td></tr>`);
    $('#page-view').innerHTML=`${pageHeader('Equipe e permissões','Vincule contas existentes aos locais de trabalho. O atendente verá apenas as unidades atribuídas.',`<button class="btn btn-primary" data-action="new-staff">${iconSvg('userPlus','button-icon')} Vincular atendente</button>`)}
      <div class="warning-banner"><span class="warning-icon">${iconSvg('alert')}</span><div><strong>Como adicionar alguém à equipe</strong>A pessoa deve criar uma conta no ProSpace Health primeiro. Depois, informe aqui o mesmo e-mail e selecione a unidade. O sistema altera o perfil para atendente e registra a permissão da unidade.</div></div>
      <div class="panel">${table(['Colaborador / conta','Perfil','Unidade vinculada','Situação','Ações'],tableRows,'Nenhum atendente vinculado.')}</div>`;
  }

  async function renderAudit() {
    if (!canAdmin()) throw new Error('Somente o administrador geral pode consultar a auditoria da rede.');
    const rows=await queryRows(state.db.from('management_audit_log').select('id,actor_id,action,entity,entity_id,unit_id,summary,created_at').order('created_at',{ascending:false}).limit(300));
    state.rows=rows;
    const tableRows=rows.map(r=>`<tr><td>${dateTimeBR(r.created_at)}</td><td class="primary-cell">${esc(r.summary)}</td><td>${esc(r.entity)}</td><td>${esc(r.action)}</td><td>${esc(unitName(r.unit_id))}</td><td>${esc(r.entity_id||'—')}</td></tr>`);
    $('#page-view').innerHTML=`${pageHeader('Auditoria administrativa','Histórico de operações em cadastros, agenda, campanhas e registros de atendimento.',`<span class="metric-chip">${rows.length} evento(s) recentes</span>`)}
      <div class="warning-banner"><span class="warning-icon">${iconSvg('info')}</span><div><strong>O que é registrado</strong>O log registra operação, tabela, identificador, unidade e horário. Não grava conteúdo clínico nem detalhes de prontuário.</div></div>
      <div class="panel">${table(['Data e hora','Evento','Módulo','Operação','Unidade','Identificador'],tableRows,'Nenhum evento de auditoria encontrado.')}</div>`;
  }

  async function renderReports() {
    const [patients,appointments,requests,campaigns] = await Promise.all([
      fetchPatients(),
      (async()=>{let q=state.db.from('appointments').select('id,status,appointment_date,unit_id');q=scoped(q);return queryRows(q.limit(2000));})(),
      (async()=>{let q=state.db.from('service_requests').select('id,status,unit_id,created_at');q=scoped(q);return queryRows(q.limit(2000));})(),
      (async()=>{let q=state.db.from('campaigns').select('id,active,unit_id');q=scopedCampaigns(q);return queryRows(q.limit(500));})()
    ]);
    state.reportData={patients,appointments,requests,campaigns};
    const statuses=['scheduled','confirmed','completed','missed','cancelled'];
    const max=Math.max(1,...statuses.map(s=>appointments.filter(a=>a.status===s).length));
    const bars=statuses.map(s=>{const n=appointments.filter(a=>a.status===s).length;return `<div class="bar-item"><span>${esc(STATUS[s][0])}</span><div class="bar-track"><span style="width:${Math.round(n/max*100)}%"></span></div><span class="bar-value">${n}</span></div>`;}).join('');
    $('#page-view').innerHTML=`${pageHeader('Relatórios e exportações','Consulte indicadores operacionais e exporte planilhas para análise administrativa.',`<span class="metric-chip">Dados disponíveis: ${patients.length+appointments.length+requests.length} registros</span>`)}
      <div class="grid stats-grid">${statCard('Pacientes',patients.length,'patients','Cadastros visíveis no acesso')}${statCard('Atendimentos',appointments.length,'appointments','Registros carregados')}${statCard('Solicitações',requests.length,'requests','Pedidos registrados')}${statCard('Campanhas ativas',campaigns.filter(c=>c.active).length,'campaigns','Publicações ativas')}</div>
      <div class="content-grid" style="margin-top:16px"><section class="panel"><div class="panel-header"><div><h3>Atendimentos por situação</h3><p>Distribuição dos registros acessíveis</p></div></div><div class="bar-list">${bars}</div></section>
      <section class="panel"><div class="panel-header"><div><h3>Exportações</h3><p>Arquivos CSV compatíveis com Excel</p></div></div><div class="list-stack">
        <div class="mini-row"><div class="mini-icon">${iconSvg('patients')}</div><div class="mini-row-main"><strong>Cadastro de pacientes</strong><small>${patients.length} linha(s)</small></div><button class="btn btn-outline btn-small" data-action="export-patients">${iconSvg('download','button-icon')} Baixar</button></div>
        <div class="mini-row"><div class="mini-icon">${iconSvg('appointments')}</div><div class="mini-row-main"><strong>Atendimentos</strong><small>${appointments.length} linha(s)</small></div><button class="btn btn-outline btn-small" data-action="export-appointments">${iconSvg('download','button-icon')} Baixar</button></div>
        <div class="mini-row"><div class="mini-icon">${iconSvg('requests')}</div><div class="mini-row-main"><strong>Solicitações</strong><small>${requests.length} linha(s)</small></div><button class="btn btn-outline btn-small" data-action="export-requests">${iconSvg('download','button-icon')} Baixar</button></div>
        <div class="mini-row"><div class="mini-icon">${iconSvg('campaigns')}</div><div class="mini-row-main"><strong>Campanhas</strong><small>${campaigns.length} linha(s)</small></div><button class="btn btn-outline btn-small" data-action="export-campaigns">${iconSvg('download','button-icon')} Baixar</button></div>
      </div></section></div>
      <div class="notice-box"><strong>Proteção de dados</strong>Exporte apenas as informações necessárias para uma finalidade de trabalho autorizada. Proteja arquivos baixados e evite compartilhamento por canais pessoais.</div>`;
  }

  function openModal(title, subtitle, body, formName, submitText='Salvar', wide=false) {
    $('#modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal ${wide?'modal-wide':''}" role="dialog" aria-modal="true"><div class="modal-header"><div><h3>${esc(title)}</h3><p>${esc(subtitle||'Preencha as informações abaixo.')}</p></div><button class="modal-close" type="button" data-close-modal aria-label="Fechar">${iconSvg('x','modal-close-icon')}</button></div><form data-form="${esc(formName)}"><div class="modal-body">${body}</div><div class="modal-footer"><button class="btn btn-outline" type="button" data-close-modal>${iconSvg('x','button-icon')} Cancelar</button><button class="btn btn-primary" type="submit">${iconSvg('save','button-icon')} ${esc(submitText)}</button></div></form></div></div>`;
  }
  function closeModal() { $('#modal-root').innerHTML=''; }
  function field(name,label,value='',type='text',extra='') {
    return `<div class="field"><label>${esc(label)}<input name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" ${extra}></label></div>`;
  }
  function selectField(name,label,options,selected='') {
    return `<div class="field"><label>${esc(label)}<select name="${esc(name)}" required>${options.replaceAll(`value="${esc(selected)}"`,`value="${esc(selected)}" selected`)}</select></label></div>`;
  }
  function textareaField(name,label,value='',placeholder='') {
    return `<div class="field full"><label>${esc(label)}<textarea name="${esc(name)}" placeholder="${esc(placeholder)}">${esc(value)}</textarea></label></div>`;
  }
  function patientForm(patient={}) {
    const units=unitOptions(patient.unit_id || (state.unitId==='all'?'':state.unitId),true);
    return `<div class="form-grid">
      <div class="form-section-title">Identificação</div>
      ${field('full_name','Nome completo',patient.full_name||'','text','required autocomplete="name"')}
      ${field('cpf','CPF',patient.cpf||'','text','inputmode="numeric" placeholder="000.000.000-00"')}
      ${field('birth_date','Data de nascimento',patient.birth_date||'','date')}
      ${field('mother_name','Nome da mãe',patient.mother_name||'')}
      <div class="field"><label>Sexo / gênero (opcional)<select name="gender"><option value="">Não informado</option>${['Feminino','Masculino','Outro','Prefere não informar'].map(v=>`<option ${patient.gender===v?'selected':''}>${v}</option>`).join('')}</select></label></div>
      ${field('cns','Cartão Nacional de Saúde (CNS)',patient.cns||'')}
      <div class="form-section-title">Contato e endereço</div>
      ${field('phone','Telefone',patient.phone||'','tel')}${field('email','E-mail',patient.email||'','email')}
      ${field('postal_code','CEP',patient.postal_code||'')}${field('street','Logradouro',patient.street||'')}
      ${field('address_number','Número',patient.address_number||'')}${field('address_complement','Complemento',patient.address_complement||'')}
      ${field('neighborhood','Bairro',patient.neighborhood||'')}${field('city','Município',patient.city||'')}
      ${field('state','UF',patient.state||'','text','maxlength="2"')}
      <div class="form-section-title">Vínculo com a unidade</div>
      ${selectField('unit_id','Unidade responsável',units,patient.unit_id || (state.unitId==='all'?'':state.unitId))}
      <div class="field full"><small>Dados cadastrais devem ser conferidos com o cidadão. Não registre informações clínicas neste formulário.</small></div>
    </div>`;
  }
  function campaignForm(c={}) {
    const selectedUnit = Object.prototype.hasOwnProperty.call(c,'unit_id')
      ? (c.unit_id || '')
      : (canAdmin() ? (state.unitId === 'all' ? '' : state.unitId) : state.unitId);
    const unitOpts=`${canAdmin()?`<option value="" ${selectedUnit===''?'selected':''}>Toda a rede (administração geral)</option>`:''}${unitOptions(selectedUnit)}`;
    return `<div class="form-grid">${field('title','Título da campanha',c.title||'','text','required')}${field('category','Categoria',c.category||'Saúde pública','text','required')}
      ${field('start_date','Data de início',c.start_date||'','date')}${field('end_date','Data de término',c.end_date||'','date')}
      <div class="field"><label>Unidade de referência<select name="unit_id">${unitOpts}</select></label></div>
      ${field('audience','Público-alvo',c.audience||'')}${field('location','Local de realização',c.location||'')}${field('contact_phone','Telefone de contato',c.contact_phone||'','tel')}
      ${textareaField('description','Descrição e orientações',c.description||'','Descreva objetivo, público e como participar.')}
      <div class="field full"><label class="checkbox-line"><input type="checkbox" name="active" ${c.active===false?'':'checked'}> Publicar / manter campanha ativa</label></div></div>`;
  }
  function unitForm(u={}) {
    return `<div class="form-grid">${field('name','Nome da unidade',u.name||'','text','required')}${field('unit_type','Tipo de unidade',u.unit_type||'UBS','text','required')}
      ${field('address','Endereço',u.address||'','text','required')}${field('phone','Telefone',u.phone||'','tel')}
      ${field('city','Município',u.city||'','text','required')}${field('state','UF',u.state||'PR','text','required maxlength="2"')}
      ${field('opening_hours','Horário de funcionamento',u.opening_hours||'')}
      <div class="field full"><label class="checkbox-line"><input type="checkbox" name="active" ${u.active===false?'':'checked'}> Unidade ativa</label></div></div>`;
  }
  function serviceForm(s={}) {
    return `<div class="form-grid">${field('name','Nome do serviço',s.name||'','text','required')}${textareaField('description','Descrição',s.description||'')}
      <div class="field full"><label class="checkbox-line"><input type="checkbox" name="active" ${s.active===false?'':'checked'}> Serviço ativo no catálogo</label></div></div>`;
  }
  function slotForm() {
    const unit=state.unitId==='all'?'':state.unitId;
    const services=state.servicesList||[];
    return `<div class="form-grid"><div class="field"><label>Unidade<select name="unit_id" required>${unitOptions(unit,true)}</select></label></div>
      <div class="field"><label>Serviço<select name="service_id" required><option value="">Selecione o serviço</option>${services.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></label></div>
      ${field('slot_date','Data','', 'date','required min="'+dateToday()+'"')}${field('slot_time','Horário','', 'time','required')}
      ${field('capacity','Quantidade de vagas','1','number','required min="1" max="100"')}
      <div class="field full"><small>Cada horário será criado para uma unidade e um serviço. Para criar vários horários, repita o cadastro alterando a hora.</small></div></div>`;
  }
  function requestForm(r={}) {
    const opts=`<option value="">Fila geral (somente administrador)</option>${unitOptions(r.unit_id||'')}`;
    const statuses=['received','in_review','waiting_for_information','completed','rejected'];
    return `<div class="form-grid"><div class="field full"><label>Protocolo<input value="${esc(r.protocol)}" disabled></label></div>
      <div class="field"><label>Tipo<input value="${esc(r.request_type)}" disabled></label></div>
      <div class="field"><label>Status<select name="status" required>${statuses.map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${STATUS[s][0]}</option>`).join('')}</select></label></div>
      <div class="field full"><label>Unidade responsável<select name="unit_id" ${canAdmin()?'':'disabled'}>${opts}</select></label></div>
      <div class="field full"><label>Descrição enviada pelo cidadão<textarea readonly>${esc(r.description||'')}</textarea></label></div>
      </div>`;
  }
  function staffForm() {
    return `<div class="form-grid"><div class="field full"><label>E-mail da conta existente<input name="email" type="email" required placeholder="atendente@exemplo.com"></label></div>
      <div class="field full"><label>Unidade de trabalho<select name="unit_id" required>${unitOptions('',true)}</select></label></div>
      <div class="field full"><small>A conta precisa existir no Supabase. Peça ao colaborador para fazer o primeiro cadastro pelo ProSpace Health e depois vincule o e-mail aqui.</small></div></div>`;
  }
  function notificationForm() {
    const defaultId=state.unitId==='all'?'':state.unitId;
    return `<div class="form-grid"><div class="field full"><label>Unidade destinatária<select name="unit_id" required>${unitOptions(defaultId,true)}</select></label></div>
      ${field('title','Título do comunicado','','text','required maxlength="120"')}
      ${textareaField('body','Mensagem','', 'Escreva um aviso claro, com data, local e instruções necessárias.')}
      <div class="field full"><small>O aviso será enviado a pacientes ativos com conta vinculada à unidade selecionada. A ação não envia e-mail ou SMS.</small></div></div>`;
  }
  async function openPatientModal(id=null) {
    let patient={};
    if(id) patient=state.patients.find(p=>p.id===id)||state.rows.find(p=>p.id===id)||{};
    openModal(id?'Editar cadastro de paciente':'Novo cadastro de paciente','Cadastro administrativo de identificação e contato.',patientForm(patient),'patient',id?'Salvar alterações':'Cadastrar paciente',true);
    $('#modal-root form').dataset.id=id||'';
  }
  async function openCampaignModal(id=null) {
    let c={}; if(id) c=state.rows.find(x=>x.id===id)||{};
    openModal(id?'Editar campanha':'Nova campanha','Dados de publicação e organização da ação de saúde.',campaignForm(c),'campaign',id?'Salvar alterações':'Criar campanha',true);
    $('#modal-root form').dataset.id=id||'';
  }
  async function openRequestModal(id) {
    const r=state.rows.find(x=>x.id===id); if(!r) return;
    openModal('Analisar solicitação',`Protocolo ${r.protocol} · ${r.patient?.full_name||'Paciente'}`,requestForm(r),'request','Atualizar solicitação',true);
    $('#modal-root form').dataset.id=id;
  }
  async function openRecordModal(type) {
    const linked=state.patients.filter(p=>p.auth_user_id && p.active);
    if(!linked.length) return toast('Não há pacientes com conta do aplicativo vinculada a esta unidade. Cadastre ou vincule a conta primeiro.', 'error');
    const patientSelect=`<div class="field full"><label>Paciente<select name="user_id" required><option value="">Selecione</option>${linked.map(p=>`<option value="${esc(p.auth_user_id)}">${esc(p.full_name)} · ${esc(p.cpf||'CPF não informado')}</option>`).join('')}</select></label></div>`;
    let body=''; let title='Novo registro';
    if(type==='exams') { title='Registrar exame'; body=`<div class="form-grid">${patientSelect}${field('title','Nome do exame','','text','required')}${field('requested_at','Data da solicitação',dateToday(),'date')}${field('collected_at','Data da coleta','','date')}<div class="field"><label>Status<select name="status"><option value="requested">Solicitado</option><option value="scheduled">Agendado</option><option value="processing">Em processamento</option><option value="available">Disponível</option><option value="cancelled">Cancelado</option></select></label></div>${textareaField('result_summary','Resumo / orientação de entrega','','Evite registrar diagnóstico detalhado neste campo.')}</div>`; }
    if(type==='vaccines') { title='Registrar vacinação'; body=`<div class="form-grid">${patientSelect}${field('vaccine_name','Vacina','','text','required')}${field('dose','Dose / reforço','')}${field('application_date','Data de aplicação',dateToday(),'date')}${field('next_dose_date','Próxima dose','','date')}${textareaField('notes','Observações operacionais','')}</div>`; }
    if(type==='meds') { title='Registrar dispensação de medicamento'; body=`<div class="form-grid">${patientSelect}${field('medication_name','Medicamento','','text','required')}${field('dosage','Dosagem','')}${field('quantity','Quantidade','')}
      <div class="field"><label>Status<select name="status"><option value="requested">Solicitado</option><option value="approved">Aprovado</option><option value="available_for_pickup">Disponível para retirada</option><option value="dispensed">Entregue</option><option value="cancelled">Cancelado</option></select></label></div>
      <div class="field"><label>Unidade de retirada<select name="pickup_unit_id" required>${unitOptions(defaultUnit(),true)}</select></label></div>${textareaField('instructions','Instruções de retirada','')}</div>`; }
    openModal(title,'O paciente precisa ter conta vinculada para receber o registro no aplicativo.',body,`record-${type}`,'Salvar registro',true);
  }

  async function onPageClick(event) {
    const button=event.target.closest('[data-action]'); if(!button) return;
    const action=button.dataset.action, id=button.dataset.id;
    try {
      switch(action) {
        case 'goto': navigate(button.dataset.page); break;
        case 'refresh': case 'reload-page': await loadPage(state.page); toast('Dados atualizados.'); break;
        case 'new-patient': await openPatientModal(); break;
        case 'edit-patient': await openPatientModal(id); break;
        case 'toggle-patient': await togglePatient(id,button.dataset.active==='true'); break;
        case 'export-patients': await exportPatients(); break;
        case 'export-appointments': await exportAppointments(); break;
        case 'export-requests': await exportRequests(); break;
        case 'export-campaigns': await exportCampaigns(); break;
        case 'appointment-status': openAppointmentStatus(id); break;
        case 'request-edit': await openRequestModal(id); break;
        case 'new-campaign': await openCampaignModal(); break;
        case 'edit-campaign': await openCampaignModal(id); break;
        case 'toggle-campaign': await toggleCampaign(id,button.dataset.active==='true'); break;
        case 'new-slot': await openSlotModal(); break;
        case 'toggle-slot': await updateRow('appointment_slots',id,{is_open:button.dataset.open!=='true'},'Horário atualizado.'); break;
        case 'delete-slot': if(confirm('Excluir este horário sem reservas?')) await deleteSlot(id); break;
        case 'record-tab': state.recordType=button.dataset.type; await renderRecords(); break;
        case 'new-record': await openRecordModal(button.dataset.type); break;
        case 'record-status': openRecordStatus(button.dataset.type,id,button.dataset.status); break;
        case 'new-unit': openModal('Nova unidade','Cadastro da unidade de saúde.',unitForm(),'unit','Cadastrar unidade',true); break;
        case 'edit-unit': openUnitModal(id); break;
        case 'toggle-unit': await updateRow('health_units',id,{active:button.dataset.active!=='true'},'Situação da unidade atualizada.'); break;
        case 'new-service': openModal('Novo serviço','Adicione uma opção ao catálogo de atendimentos.',serviceForm(),'service','Cadastrar serviço'); break;
        case 'edit-service': openServiceModal(id); break;
        case 'toggle-service': await updateRow('health_services',id,{active:button.dataset.active!=='true'},'Situação do serviço atualizada.'); break;
        case 'new-staff': openModal('Vincular atendente','Atribua uma conta existente a uma unidade de saúde.',staffForm(),'staff','Vincular atendente'); break;
        case 'remove-staff-unit': if(confirm('Remover o acesso deste atendente à unidade selecionada?')) await unassignStaffUnit(id,button.dataset.unitId); break;
        case 'new-notification': openModal('Novo comunicado','Envie uma mensagem aos pacientes vinculados à unidade.',notificationForm(),'notification','Enviar comunicado',true); break;
      }
    } catch(error) { failMessage(error); }
  }
  async function onPageSubmit(event) { /* Formulários principais são tratados em modal. */ }
  function onPageInput(event) {
    if(event.target.id==='table-search') filterCurrentTable(event.target.value);
  }
  function onPageChange(event) {
    if(event.target.id==='patient-status-filter'||event.target.id==='appointment-status-filter'||event.target.id==='request-status-filter'||event.target.id==='campaign-active-filter') filterCurrentTable($('#table-search')?.value||'');
  }
  function filterCurrentTable(search) {
    const term=String(search||'').toLowerCase();
    const statusControl=$('#patient-status-filter')||$('#appointment-status-filter')||$('#request-status-filter')||$('#campaign-active-filter');
    const status=statusControl?.value||'all';
    const visibleRows=$$('#page-view tbody tr');
    visibleRows.forEach((row,index)=>{
      const text=(row.dataset.search||row.textContent||'').toLowerCase();
      let show=!term||text.includes(term);
      if(show && status!=='all') {
        const data=state.rows[index];
        if(state.page==='patients') show=String(!!data?.active)===status;
        if(state.page==='appointments') show=data?.status===status;
        if(state.page==='requests') show=data?.status===status;
        if(state.page==='campaigns') show=String(!!data?.active)===status;
      }
      row.style.display=show?'':'none';
    });
  }

  async function onModalSubmit(event) {
    const form=event.target.closest('form[data-form]'); if(!form) return;
    event.preventDefault();
    const formData=new FormData(form); const values=Object.fromEntries(formData.entries());
    const submit=$('button[type="submit"]',form); submit.disabled=true;
    try {
      const type=form.dataset.form; const id=form.dataset.id;
      if(type==='patient') await savePatient(values,id);
      else if(type==='campaign') await saveCampaign(values,id);
      else if(type==='request') await saveRequest(values,id);
      else if(type==='unit') await saveUnit(values,id);
      else if(type==='service') await saveService(values,id);
      else if(type==='staff') await assignStaff(values);
      else if(type==='notification') await sendNotification(values);
      else if(type==='slot') await saveSlot(values);
      else if(type==='record-status') await saveRecordStatus(values,id,form.dataset.recordType);
      else if(type==='appointment-status') await saveAppointmentStatus(values,id);
      else if(type.startsWith('record-')) await saveRecord(type.replace('record-',''),values);
      closeModal();
      await loadPage(state.page);
    } catch(error) { failMessage(error); }
    finally { submit.disabled=false; }
  }
  function clean(value) { const s=String(value??'').trim(); return s===''?null:s; }
  function digits(value) { const s=String(value||'').replace(/\D/g,''); return s||null; }
  function checked(formData,name) { return formData.has(name); }
  async function savePatient(v,id) {
    if(!v.unit_id) throw new Error('Selecione a unidade responsável pelo cadastro.');
    const payload={full_name:v.full_name.trim(),cpf:digits(v.cpf),birth_date:clean(v.birth_date),mother_name:clean(v.mother_name),gender:clean(v.gender),cns:digits(v.cns),phone:clean(v.phone),email:clean(v.email),postal_code:digits(v.postal_code),street:clean(v.street),address_number:clean(v.address_number),address_complement:clean(v.address_complement),neighborhood:clean(v.neighborhood),city:clean(v.city),state:clean(v.state)?.toUpperCase()||null,unit_id:v.unit_id};
    let q=id?state.db.from('patient_registry').update(payload).eq('id',id):state.db.from('patient_registry').insert({...payload,active:true,source:'staff',created_by:state.user.id});
    const {error}=await q;if(error)throw error;toast(id?'Cadastro atualizado.':'Paciente cadastrado.');
  }
  async function togglePatient(id,active) { if(active && !confirm('Inativar este cadastro de paciente?')) return; const {error}=await state.db.from('patient_registry').update({active:!active}).eq('id',id);if(error)throw error;await loadPage('patients');toast(active?'Paciente inativado.':'Paciente ativado.'); }
  async function saveCampaign(v,id) {
    if(v.start_date&&v.end_date&&v.end_date<v.start_date)throw new Error('A data de término não pode ser anterior ao início.');
    if(!canAdmin()&&!v.unit_id)throw new Error('O atendente deve selecionar uma unidade para a campanha.');
    const payload={title:v.title.trim(),description:clean(v.description)||'Informações da campanha.',start_date:clean(v.start_date),end_date:clean(v.end_date),unit_id:clean(v.unit_id),category:v.category.trim(),audience:clean(v.audience),location:clean(v.location),contact_phone:clean(v.contact_phone),active:checked(new FormData(document.querySelector('#modal-root form')),'active')};
    const {error}=await (id?state.db.from('campaigns').update(payload).eq('id',id):state.db.from('campaigns').insert(payload));if(error)throw error;toast(id?'Campanha atualizada.':'Campanha criada.');
  }
  async function toggleCampaign(id,active) {const {error}=await state.db.from('campaigns').update({active:!active}).eq('id',id);if(error)throw error;await loadPage('campaigns');toast(active?'Campanha desativada.':'Campanha publicada.');}
  async function saveRequest(v,id) {
    const payload={status:v.status};
    if(canAdmin())payload.unit_id=clean(v.unit_id);
    const {error}=await state.db.from('service_requests').update(payload).eq('id',id);if(error)throw error;toast('Solicitação atualizada.');
  }
  async function saveUnit(v,id) {
    const form=$('#modal-root form'); const payload={name:v.name.trim(),address:v.address.trim(),city:v.city.trim(),state:v.state.trim().toUpperCase(),phone:clean(v.phone),unit_type:v.unit_type.trim(),opening_hours:clean(v.opening_hours),active:checked(new FormData(form),'active')};
    const {error}=await (id?state.db.from('health_units').update(payload).eq('id',id):state.db.from('health_units').insert(payload));if(error)throw error;toast(id?'Unidade atualizada.':'Unidade cadastrada.');
  }
  async function saveService(v,id) {
    const form=$('#modal-root form');const payload={name:v.name.trim(),description:clean(v.description),active:checked(new FormData(form),'active')};
    const {error}=await (id?state.db.from('health_services').update(payload).eq('id',id):state.db.from('health_services').insert(payload));if(error)throw error;toast(id?'Serviço atualizado.':'Serviço cadastrado.');
  }
  async function saveSlot(v) {
    const {error}=await state.db.from('appointment_slots').insert({unit_id:v.unit_id,service_id:v.service_id,slot_date:v.slot_date,slot_time:v.slot_time,capacity:Number(v.capacity),booked_count:0,is_open:true});if(error)throw error;toast('Horário disponibilizado.');
  }
  async function openSlotModal() {
    state.servicesList=await queryRows(state.db.from('health_services').select('id,name').eq('active',true).order('name'));
    if(!state.servicesList.length)throw new Error('Cadastre ou ative ao menos um serviço antes de criar horários.');
    openModal('Criar horário de atendimento','Disponibilize uma vaga para agendamento no aplicativo.',slotForm(),'slot','Criar horário');
  }
  async function deleteSlot(id) {const {error}=await state.db.from('appointment_slots').delete().eq('id',id);if(error)throw error;await loadPage('schedule');toast('Horário excluído.');}
  async function openUnitModal(id) {const u=state.rows.find(x=>x.id===id)||{};openModal('Editar unidade','Atualize as informações da unidade.',unitForm(u),'unit','Salvar alterações',true);$('#modal-root form').dataset.id=id;}
  async function openServiceModal(id) {const s=state.rows.find(x=>x.id===id)||{};openModal('Editar serviço','Atualize o catálogo de serviços.',serviceForm(s),'service','Salvar alterações');$('#modal-root form').dataset.id=id;}
  async function assignStaff(v) {const {error}=await state.db.rpc('admin_assign_staff',{p_email:v.email.trim(),p_unit_id:v.unit_id});if(error)throw error;toast('Atendente vinculado à unidade.');}
  async function removeStaff(id) {const {error}=await state.db.rpc('admin_remove_staff',{p_user_id:id});if(error)throw error;await loadPage('team');toast('Acesso de atendente removido.');}
  async function unassignStaffUnit(userId,unitId) {if(!unitId)throw new Error('Não há unidade vinculada nesta linha.');const {error}=await state.db.rpc('admin_unassign_staff_unit',{p_user_id:userId,p_unit_id:unitId});if(error)throw error;await loadPage('team');toast('Acesso removido desta unidade.');}
  async function sendNotification(v) {const {data,error}=await state.db.rpc('notify_unit_patients',{p_unit_id:v.unit_id,p_title:v.title.trim(),p_body:v.body.trim()});if(error)throw error;toast(`Comunicado enviado para ${data||0} paciente(s) com conta vinculada.`);}
  async function saveRecord(type,v) {
    let payload={user_id:v.user_id}; let tableName='';
    const linkedPatient=state.patients.find(p=>p.auth_user_id===v.user_id);
    const patientUnit=linkedPatient?.unit_id || (state.unitId!=='all'?state.unitId:'');
    if(type==='exams'){tableName='exam_records';if(!patientUnit)throw new Error('O paciente precisa estar vinculado a uma unidade antes de registrar o exame.');payload={...payload,unit_id:patientUnit,title:v.title.trim(),requested_at:clean(v.requested_at),collected_at:clean(v.collected_at),status:v.status||'requested',result_summary:clean(v.result_summary)};}
    if(type==='vaccines'){tableName='vaccinations';if(!patientUnit)throw new Error('O paciente precisa estar vinculado a uma unidade antes de registrar a vacinação.');payload={...payload,unit_id:patientUnit,vaccine_name:v.vaccine_name.trim(),dose:clean(v.dose),application_date:clean(v.application_date),next_dose_date:clean(v.next_dose_date),notes:clean(v.notes)};}
    if(type==='meds'){tableName='medication_orders';payload={...payload,medication_name:v.medication_name.trim(),dosage:clean(v.dosage),quantity:clean(v.quantity),status:v.status||'requested',pickup_unit_id:v.pickup_unit_id,instructions:clean(v.instructions)};}
    const {error}=await state.db.from(tableName).insert(payload);if(error)throw error;toast('Registro salvo com sucesso.');
  }
  function openAppointmentStatus(id) {
    const appt=state.rows.find(r=>r.id===id); if(!appt)return;
    const statuses=['scheduled','confirmed','completed','missed','cancelled'];
    const body=`<div class="form-grid"><div class="field full"><label>Protocolo<input value="${esc(appt.protocol)}" disabled></label></div><div class="field full"><label>Situação<select name="status">${statuses.map(s=>`<option value="${s}" ${appt.status===s?'selected':''}>${STATUS[s][0]}</option>`).join('')}</select></label></div></div>`;
    openModal('Atualizar atendimento','Registre a situação atual do agendamento.',body,'appointment-status','Salvar status');$('#modal-root form').dataset.id=id;
  }
  async function saveAppointmentStatus(v,id) {const {error}=await state.db.from('appointments').update({status:v.status}).eq('id',id);if(error)throw error;toast('Atendimento atualizado.');}
  function openRecordStatus(type,id,status) {
    const tableName=type==='exams'?'exam_records':type==='vaccines'?'vaccinations':'medication_orders';
    const currentRecord=(state.recordData?.[type]||[]).find(r=>r.id===id)||{};
    const choices=type==='exams'?['requested','scheduled','processing','available','cancelled']:type==='meds'?['requested','approved','available_for_pickup','dispensed','cancelled']:[];
    const body=type==='vaccines'?`<div class="form-grid">${field('dose','Dose / reforço',currentRecord.dose||'')}${field('application_date','Data de aplicação',currentRecord.application_date||'','date')}${field('next_dose_date','Próxima dose',currentRecord.next_dose_date||'','date')}${textareaField('notes','Observações',currentRecord.notes||'')}</div>`:`<div class="form-grid"><div class="field full"><label>Status<select name="status">${choices.map(s=>`<option value="${s}" ${status===s?'selected':''}>${STATUS[s][0]}</option>`).join('')}</select></label></div></div>`;
    openModal('Atualizar registro','Edite as informações operacionais do registro.',body,'record-status','Salvar alterações');$('#modal-root form').dataset.id=id;$('#modal-root form').dataset.recordType=type;
  }
  async function saveRecordStatus(v,id,type) {
    const tableName=type==='exams'?'exam_records':type==='vaccines'?'vaccinations':'medication_orders';
    const payload=type==='vaccines'?{dose:clean(v.dose),application_date:clean(v.application_date),next_dose_date:clean(v.next_dose_date),notes:clean(v.notes)}:{status:v.status};
    const {error}=await state.db.from(tableName).update(payload).eq('id',id);if(error)throw error;toast('Registro atualizado.');
  }
  async function updateRow(tableName,id,payload,message) {const {error}=await state.db.from(tableName).update(payload).eq('id',id);if(error)throw error;await loadPage(state.page);toast(message);}

  function downloadCsv(rows, columns, fileName) {
    if(!rows?.length)return toast('Não há dados para exportar.','error');
    const csv=[columns.map(c=>csvCell(c.label)).join(';'),...rows.map(row=>columns.map(c=>csvCell(c.value(row))).join(';'))].join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Arquivo CSV gerado.');
  }
  function csvCell(value) {let s=String(value??'').replace(/\r?\n/g,' ');if(/^[=+@\-\t]/.test(s))s="'"+s;return `"${s.replace(/"/g,'""')}"`;}
  async function exportPatients() {
    let rows=state.page==='patients'?state.patients:state.reportData?.patients||[];
    if(!rows.length) rows=await fetchPatients();
    downloadCsv(rows,[{label:'Nome',value:r=>r.full_name},{label:'CPF',value:r=>r.cpf},{label:'Nascimento',value:r=>r.birth_date},{label:'Telefone',value:r=>r.phone},{label:'Email',value:r=>r.email},{label:'Unidade',value:r=>r.unit_id?(r.health_units?.name||unitName(r.unit_id)):'Sem unidade'},{label:'Ativo',value:r=>r.active?'Sim':'Não'}],'prospace-pacientes.csv');
  }
  async function exportAppointments() {
    let rows=state.page==='appointments'?state.rows:null;
    if(!rows){let q=state.db.from('appointments').select('protocol,user_id,appointment_date,appointment_time,status,unit_id,health_services(name)').order('appointment_date',{ascending:false});q=scoped(q);rows=await queryRows(q.limit(3000));}
    const names=await patientNameMap(rows.map(r=>r.user_id));
    downloadCsv(rows,[{label:'Protocolo',value:r=>r.protocol},{label:'Paciente',value:r=>names[r.user_id]?.full_name},{label:'CPF',value:r=>names[r.user_id]?.cpf},{label:'Data',value:r=>r.appointment_date},{label:'Horário',value:r=>r.appointment_time},{label:'Serviço',value:r=>r.health_services?.name},{label:'Unidade',value:r=>unitName(r.unit_id)},{label:'Status',value:r=>STATUS[r.status]?.[0]||r.status}],'prospace-atendimentos.csv');
  }
  async function exportRequests() {
    let rows=state.page==='requests'?state.rows:[];
    if(!rows.length){let q=state.db.from('service_requests').select('protocol,user_id,request_type,description,status,unit_id,created_at').order('created_at',{ascending:false});q=scoped(q);rows=await queryRows(q.limit(3000));}
    const names=await patientNameMap(rows.map(r=>r.user_id));
    downloadCsv(rows,[{label:'Protocolo',value:r=>r.protocol},{label:'Paciente',value:r=>names[r.user_id]?.full_name},{label:'Tipo',value:r=>r.request_type},{label:'Descrição',value:r=>r.description},{label:'Unidade',value:r=>unitName(r.unit_id)},{label:'Status',value:r=>STATUS[r.status]?.[0]||r.status},{label:'Criada em',value:r=>r.created_at}],'prospace-solicitacoes.csv');
  }
  async function exportCampaigns() {
    let rows=state.page==='campaigns'?state.rows:[];
    if(!rows.length){let q=state.db.from('campaigns').select('title,category,description,start_date,end_date,audience,location,contact_phone,unit_id,active');q=scopedCampaigns(q);rows=await queryRows(q.limit(1000));}
    downloadCsv(rows,[{label:'Título',value:r=>r.title},{label:'Categoria',value:r=>r.category},{label:'Descrição',value:r=>r.description},{label:'Início',value:r=>r.start_date},{label:'Término',value:r=>r.end_date},{label:'Público',value:r=>r.audience},{label:'Local',value:r=>r.location},{label:'Telefone',value:r=>r.contact_phone},{label:'Unidade',value:r=>r.unit_id?unitName(r.unit_id):'Toda a rede'},{label:'Ativa',value:r=>r.active?'Sim':'Não'}],'prospace-campanhas.csv');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
