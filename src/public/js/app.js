// OKX 现货 AI 分析系统 - 全局 JavaScript
// 功能：JWT认证管理、API调用封装、全局导航

const API_BASE = '';

// ===== 认证管理 =====
const auth = {
  getToken() { return localStorage.getItem('jwt_token'); },
  setToken(t) { localStorage.setItem('jwt_token', t); },
  clear() { localStorage.removeItem('jwt_token'); },
  isLoggedIn() { return !!this.getToken(); },
};

// ===== API 调用封装 =====
async function apiFetch(path, options = {}) {
  const token = auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 401) { auth.clear(); window.location.href = '/login.html'; return; }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

// ===== 导航高亮 =====
function initNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(el => {
    const href = el.getAttribute('href') || '';
    if (href === '/' && (path === 'index.html' || path === '')) {
      el.classList.add('active');
    } else if (href !== '/' && path === href.replace(/^\//, '')) {
      el.classList.add('active');
    }
  });
}

// ===== 认证检查 =====
function requireAuth() {
  if (!auth.isLoggedIn() && window.location.pathname !== '/login.html') {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ===== 格式化工具 =====
const fmt = {
  price: (v) => v ? Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--',
  pct: (v) => v != null ? `${(v * 100).toFixed(1)}%` : '--',
  time: (t) => t ? new Date(t).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '--',
  number: (v) => v != null ? Number(v).toLocaleString() : '--',
};

// ===== 动作文字映射 =====
const actionLabel = { buy: '买入', sell: '卖出', hold: '持有' };
const actionBadge = { buy: 'badge-green', sell: 'badge-red', hold: 'badge-gray' };

// ===== 状态徽章 =====
function statusBadge(status) {
  const map = {
    active: ['badge-green', '正常'],
    inactive: ['badge-gray', '停用'],
    filled: ['badge-green', '已成交'],
    pending: ['badge-yellow', '待执行'],
    cancelled: ['badge-gray', '已取消'],
    failed: ['badge-red', '失败'],
    buy: ['badge-green', '买入'],
    sell: ['badge-red', '卖出'],
    hold: ['badge-gray', '持有'],
  };
  const [cls, label] = map[status] || ['badge-gray', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ===== 登出 =====
function logout() {
  auth.clear();
  window.location.href = '/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  // 在需要认证的页面检查登录状态
  const publicPages = ['login.html'];
  const page = window.location.pathname.split('/').pop();
  if (!publicPages.includes(page)) requireAuth();
});
