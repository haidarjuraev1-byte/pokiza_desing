import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, Bell, Plus, LayoutDashboard,
  MessageSquare, Calendar, X, ChevronRight,
  Filter, Check, Link,
  Users, LogOut, Shield, User, PenTool, Trash2, UserPlus, RefreshCw
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// --- FIREBASE INIT ---
const firebaseConfig = {
  apiKey: 'AIzaSyC8Nk_4J1j6wuoZysdDxjxgJXNlS41MCqQ',
  authDomain: 'pokiza-design-efb20.firebaseapp.com',
  projectId: 'pokiza-design-efb20',
  storageBucket: 'pokiza-design-efb20.firebasestorage.app',
  messagingSenderId: '965648604086',
  appId: '1:965648604086:web:6f69fc134d0f261cb4bf17',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'pokiza-design';

const STATUSES = {
  NEW: { label: 'Новая', color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' },
  IN_PROGRESS: { label: 'В работе', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  REVIEW: { label: 'На проверке', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  REVISION: { label: 'Нужны правки', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  DONE: { label: 'Выполнено', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  OVERDUE: { label: 'Просрочено', color: 'bg-red-100 text-red-700', border: 'border-red-200' }
};

const STATUS_ORDER = { NEW: 1, IN_PROGRESS: 2, REVISION: 3, REVIEW: 4, DONE: 5, OVERDUE: 6 };

const PRIORITIES = {
  LOW: { label: 'Низкий', color: 'text-gray-500', bg: 'bg-gray-100' },
  NORMAL: { label: 'Средний', color: 'text-blue-500', bg: 'bg-blue-100' },
  HIGH: { label: 'Высокий', color: 'text-orange-500', bg: 'bg-orange-100' },
  URGENT: { label: 'Срочно', color: 'text-red-600', bg: 'bg-red-100' }
};

const ROLES = {
  admin: { label: 'Администратор', icon: Shield, color: 'text-purple-600 bg-purple-100' },
  marketer: { label: 'Маркетолог', icon: User, color: 'text-blue-600 bg-blue-100' },
  designer: { label: 'Дизайнер', icon: PenTool, color: 'text-orange-600 bg-orange-100' }
};

const generateAvatar = (name, gender, seedModifier = '') => {
  const originalSeeds = {
    'Алексей Админ': 'Alex',
    'Мария Маркетолог': 'Maria',
    'Денис Дизайнер': 'Denis',
    'Анна Дизайнер': 'Anna'
  };

  const isOriginal = originalSeeds[name] && !seedModifier;
  const seed = isOriginal ? originalSeeds[name] : encodeURIComponent(name + seedModifier);
  const isFemale = gender === 'female';

  if (isOriginal) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  }

  const tops = isFemale
    ? 'bob,bun,curly,curvy,straight01,straight02'
    : 'dreads01,frizzle,shaggy,shortCurly,shortFlat,shortRound,shortWaved,sides,theCaesar';

  const faceParams = '&mouth=smile,twinkle,default&eyes=default,happy,wink';

  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&top=${tops}${isFemale ? '&facialHairProbability=0' : ''}${faceParams}`;
};

const INITIAL_USERS = [
  { id: 'u1', name: 'Алексей Админ', role: 'admin', gender: 'male', email: 'admin@pokiza.tj', password: '@Pokiza4565@', avatar: generateAvatar('Алексей Админ', 'male') },
  { id: 'u2', name: 'Мария Маркетолог', role: 'marketer', gender: 'female', email: 'maria@pokiza.tj', password: 'password123', avatar: generateAvatar('Мария Маркетолог', 'female') },
  { id: 'u3', name: 'Денис Дизайнер', role: 'designer', gender: 'male', email: 'denis@pokiza.tj', password: 'password123', avatar: generateAvatar('Денис Дизайнер', 'male') },
  { id: 'u4', name: 'Анна Дизайнер', role: 'designer', gender: 'female', email: 'anna@pokiza.tj', password: 'password123', avatar: generateAvatar('Анна Дизайнер', 'female') },
];

const INITIAL_TASKS = [
  {
    id: 'TSK-101',
    title: 'Дизайн баннеров для летней распродажи',
    description: 'Нужно подготовить 3 формата баннеров для VK и Яндекс.Директ (1080x1080, 1080x1920, 1200x628). Использовать яркие летние цвета, акцент на скидку 50%.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    deadline: '2026-05-20',
    estimatedDeadline: '2026-05-18',
    assigneeId: 'u3',
    creatorId: 'u2',
    type: 'Social Media',
    createdAt: '2026-05-10T10:00:00Z',
    links: [{ id: 'l1', name: 'Референсы (Telegram)', url: 'https://t.me/design_chat/1234' }],
    comments: [{ id: 1, authorId: 'u2', text: 'Денис, постарайся успеть к 18-му.', timestamp: '2026-05-10T10:05:00Z' }]
  },
  {
    id: 'TSK-102',
    title: 'Редизайн главной страницы Landing Page',
    description: 'Текущая конверсия упала. Нужно пересобрать первый экран, добавить блок с видео-отзывами и сделать более заметной кнопку CTA. Макет в Figma прикрепила.',
    status: 'NEW',
    priority: 'URGENT',
    deadline: '2026-05-16',
    estimatedDeadline: '',
    assigneeId: '',
    creatorId: 'u2',
    type: 'Web Design',
    createdAt: '2026-05-12T09:30:00Z',
    links: [{ id: 'l2', name: 'Макет Figma', url: 'https://www.figma.com/file/example_link' }],
    comments: []
  }
];

const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-16 h-16', xl: 'w-24 h-24' };
  return <img src={src} alt={alt || 'Avatar'} className={`${sizes[size]} rounded-full bg-gray-100 object-cover border border-gray-200 shrink-0 ${className}`} />;
};

const Badge = ({ statusKey, priorityKey, custom, children }) => {
  if (statusKey && STATUSES[statusKey]) {
    const s = STATUSES[statusKey];
    return <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${s.color} ${s.border}`}>{s.label}</span>;
  }
  if (priorityKey && PRIORITIES[priorityKey]) {
    const p = PRIORITIES[priorityKey];
    return <span className={`px-2 py-0.5 text-xs font-medium rounded ${p.bg} ${p.color}`}>{p.label}</span>;
  }
  if (custom) return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${custom}`}>{children}</span>;
  return null;
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-[#E53935] hover:bg-[#B71C1C] text-white focus:ring-[#E53935]',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-200',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500 border border-red-200'
  };
  return (
    <button className={`${base} ${variants[variant]} px-4 py-2 text-sm ${className}`} {...props}>
      {children}
    </button>
  );
};

const ReferenceLinksArea = ({ links = [], setLinks, disabled }) => {
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (!newUrl.trim() || disabled) return;
    let finalUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    const newLink = {
      id: Math.random().toString(36).substr(2, 9),
      name: newLabel.trim() || finalUrl,
      url: finalUrl
    };
    setLinks([...links, newLink]);
    setNewUrl('');
    setNewLabel('');
  };

  return (
    <div className="w-full space-y-3">
      {!disabled && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Название (опционально)" className="w-full sm:w-1/3 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" />
          <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Ссылка (https://... или t.me/...)" className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())} />
          <Button type="button" onClick={handleAdd} disabled={!newUrl.trim()} className="whitespace-nowrap py-2.5">Добавить</Button>
        </div>
      )}
      {links.length > 0 && (
        <div className="space-y-2 mt-3">
          {links.map(link => (
            <div key={link.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <Link size={18} className="text-blue-500 shrink-0" />
                <div className="truncate flex flex-col">
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate">{link.name}</a>
                </div>
              </div>
              {!disabled && (
                <button type="button" onClick={() => setLinks(links.filter(l => l.id !== link.id))} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors shrink-0">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LoginScreen = ({ users, onLogin, isDbLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-2xl shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-[#E53935] flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-6">D</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Вход в Pokiza Design</h1>
        <p className="text-gray-500 mb-8 text-center text-sm">Введите ваши учетные данные для доступа</p>

        {isDbLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <RefreshCw className="animate-spin text-[#E53935]" size={32} />
            <p className="text-sm text-gray-500">Синхронизация с базой данных...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" placeholder="name@domain.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full mt-2 py-2.5 text-base">Войти</Button>
          </form>
        )}
      </div>
    </div>
  );
};

const AdminPanel = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: 'designer', email: '', password: '', gender: 'male' });
  const [avatarUrl, setAvatarUrl] = useState('');

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ name: '', role: 'designer', email: '', password: '', gender: 'male' });
    setAvatarUrl(generateAvatar('Новый Пользователь', 'male', Math.random().toString(36).substring(7)));
    setIsModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, role: user.role, email: user.email, password: user.password, gender: user.gender || 'male' });
    setAvatarUrl(user.avatar);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      onUpdateUser({ ...editingUser, name: formData.name, role: formData.role, email: formData.email, password: formData.password, gender: formData.gender, avatar: avatarUrl });
    } else {
      onAddUser({ name: formData.name, role: formData.role, email: formData.email, password: formData.password || '123456', gender: formData.gender, avatar: avatarUrl });
    }
    setIsModalOpen(false);
  };

  const randomizeAvatar = () => setAvatarUrl(generateAvatar(formData.name || 'User', formData.gender, Math.random().toString(36).substring(7)));

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-gray-500 mt-1 text-sm">Назначайте роли, добавляйте и редактируйте сотрудников.</p>
        </div>
        <Button onClick={openCreate}><UserPlus size={18} className="mr-2" /> Добавить</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-medium">Пользователь</th>
              <th className="px-6 py-4 font-medium">Роль</th>
              <th className="px-6 py-4 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => {
              const RoleIcon = ROLES[user.role]?.icon || User;
              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} />
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${ROLES[user.role]?.color}`}>
                      <RoleIcon size={14} /> {ROLES[user.role]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Button variant="secondary" onClick={() => openEdit(user)} className="px-3 py-1.5 mr-2">
                      <PenTool size={16} className="mr-1.5" /> Изменить
                    </Button>
                    <Button variant="danger" onClick={() => onDeleteUser(user.id)} disabled={user.id === currentUser.id} className="px-3 py-1.5">
                      <Trash2 size={16} className={user.id === currentUser.id ? 'mr-0' : 'mr-1.5'} />
                      {user.id !== currentUser.id && 'Удалить'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingUser ? 'Редактировать профиль' : 'Новый сотрудник'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4 gap-2">
                <div onClick={randomizeAvatar} className="cursor-pointer hover:opacity-80 transition-opacity relative group" title="Кликните, чтобы сменить лицо">
                  <Avatar src={avatarUrl} size="lg" className="border-2 border-gray-300" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <RefreshCw size={24} className="text-white" />
                  </div>
                </div>
                <span className="text-[10px] text-gray-400">Кликните по фото для смены</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя и Фамилия</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Например: Иван Иванов" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input required type="email" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Пароль" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Пол</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none" value={formData.gender} onChange={e => {
                    setFormData({ ...formData, gender: e.target.value });
                    setAvatarUrl(generateAvatar(formData.name || 'User', e.target.value, Math.random().toString(36).substring(7)));
                  }}>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Права доступа (Роль)</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    {Object.entries(ROLES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Администратор: Полный доступ. Маркетолог: Управление задачами. Дизайнер: Исполнение задач.</p>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Отмена</Button>
                <Button type="submit">Сохранить</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ tasks, users, onViewTask, onUpdateTask, currentUser }) => {
  const [filters, setFilters] = useState({ month: 'all', assignee: 'all' });
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => ({
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    overdue: tasks.filter(t => t.status === 'OVERDUE').length,
  }), [tasks]);

  const processedTasks = useMemo(() => {
    let result = [...tasks];
    if (filters.month !== 'all') {
      result = result.filter(t => new Date(t.deadline).getMonth().toString() === filters.month);
    }
    if (filters.assignee !== 'all') {
      result = result.filter(t => t.assigneeId === filters.assignee);
    }
    result.sort((a, b) => (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99));
    return result;
  }, [tasks, filters]);

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i.toString(), label: new Date(2026, i, 1).toLocaleString('ru-RU', { month: 'long' }) }));

  const handleInlineStatusChange = (e, task) => {
    e.stopPropagation();
    onUpdateTask({ ...task, status: e.target.value });
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Обзор задач</h1>
          <p className="text-gray-500 mt-1 text-sm">Сводка по всем проектам (синхронизация включена).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Всего задач', value: stats.total, color: 'bg-white' },
          { label: 'В работе', value: stats.inProgress, color: 'bg-blue-50' },
          { label: 'На проверке', value: stats.review, color: 'bg-purple-50' },
          { label: 'Просрочено', value: stats.overdue, color: 'bg-[#FFEBEE] border border-[#ffcdd2]' },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-xl shadow-sm flex flex-col ${stat.color} border border-gray-100`}>
            <span className="text-sm font-medium text-gray-500">{stat.label}</span>
            <span className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Все задачи</h2>
          <div className="relative">
            <Button variant={showFilters ? 'primary' : 'ghost'} className={`text-sm py-1.5 px-3 flex items-center ${showFilters ? '' : 'text-gray-600'}`} onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} className="mr-2" /> Фильтр
            </Button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Месяц дедлайна</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none bg-white" value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
                    <option value="all">Все месяцы</option>
                    {months.map(m => <option key={m.value} value={m.value} className="capitalize">{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Исполнитель</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none bg-white" value={filters.assignee} onChange={e => setFilters({ ...filters, assignee: e.target.value })}>
                    <option value="all">Все исполнители</option>
                    <option value="">Не назначены</option>
                    {users.filter(u => u.role === 'designer' || u.role === 'admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">ID / Название</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium">Приоритет</th>
                <th className="px-6 py-3 font-medium">Ссылки</th>
                <th className="px-6 py-3 font-medium">Исполнитель</th>
                <th className="px-6 py-3 font-medium">Дедлайн</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedTasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                const hasLinks = task.links && task.links.length > 0;
                const s = STATUSES[task.status];
                const canChangeStatus = currentUser.role === 'admin' || currentUser.role === 'marketer' || (currentUser.role === 'designer' && task.assigneeId === currentUser.id);

                return (
                  <tr key={task.id} onClick={() => onViewTask(task)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 w-full md:w-1/3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-mono mb-0.5">{task.id}</span>
                        <span className="font-medium text-gray-900 group-hover:text-[#E53935] transition-colors line-clamp-1">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <select className={`text-xs font-medium rounded-full px-2 py-1 outline-none border ${canChangeStatus ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} appearance-none ${s.color} ${s.border}`} value={task.status} onChange={(e) => handleInlineStatusChange(e, task)} disabled={!canChangeStatus}>
                        {Object.entries(STATUSES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell"><Badge priorityKey={task.priority} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {hasLinks ? <div className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs w-max"><Link size={12} /> {task.links.length}</div> : <span className="text-gray-300 text-xs">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {assignee ? <><Avatar src={assignee.avatar} alt={assignee.name} size="sm" /><span className="text-gray-700">{assignee.name.split(' ')[0]}</span></> : <span className="text-gray-400 italic">Не назначен</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" />{new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div>
                    </td>
                  </tr>
                );
              })}
              {processedTasks.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">По вашим фильтрам задач не найдено</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TaskDetail = ({ task, users, onBack, onUpdateTask, currentUser }) => {
  const assignee = users.find(u => u.id === task.assigneeId);
  const creator = users.find(u => u.id === task.creatorId);
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);

  const canEditCore = currentUser.role === 'admin' || currentUser.role === 'marketer';
  const isAssignee = task.assigneeId === currentUser.id;
  const canChangeStatusAndLinks = canEditCore || isAssignee;

  const handleUpdate = (updates) => onUpdateTask({ ...task, ...updates });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = { id: Date.now(), authorId: currentUser.id, text: newComment, timestamp: new Date().toISOString() };
    handleUpdate({ comments: [...(task.comments || []), comment] });
    setNewComment('');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?taskId=${task.id}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[calc(100vh-8rem)] flex flex-col md:flex-row pb-20">
      <div className="flex-1 border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50/50">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors self-start sm:self-auto"><ChevronRight size={20} className="rotate-180" /></button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <button onClick={copyLink} className="text-xs font-mono text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">{task.id} {copied ? <Check size={12} className="text-green-600" /> : <Link size={12} />}</button>
              <Badge priorityKey={task.priority} />
              <Badge custom="bg-blue-50 text-blue-700">{task.type}</Badge>
            </div>
            {canEditCore ? <input className="w-full text-2xl font-bold text-gray-900 leading-tight outline-none bg-transparent border-b border-transparent focus:border-gray-300 transition-colors" value={task.title} onChange={e => handleUpdate({ title: e.target.value })} /> : <h1 className="text-2xl font-bold text-gray-900 leading-tight">{task.title}</h1>}
          </div>
        </div>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
          <div className="prose prose-sm sm:prose-base max-w-none text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Описание (ТЗ)</h3>
            {canEditCore ? <textarea className="w-full min-h-[120px] p-3 text-gray-700 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#E53935]/20 focus:border-[#E53935]" value={task.description} onChange={e => handleUpdate({ description: e.target.value })} /> : <p className="whitespace-pre-wrap">{task.description}</p>}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Link size={18} /> Референсы и ссылки</h3></div>
            <ReferenceLinksArea links={task.links || []} setLinks={(newLinks) => handleUpdate({ links: newLinks })} disabled={!canChangeStatusAndLinks} />
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MessageSquare size={18} /> Обсуждение</h3>
            <div className="space-y-4 mb-6">
              {task.comments?.length > 0 ? task.comments.map(comment => {
                const author = users.find(u => u.id === comment.authorId);
                return (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar src={author?.avatar} size="sm" />
                    <div className="flex-1 bg-gray-50 rounded-xl rounded-tl-none p-3 border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm text-gray-900">{author ? author.name : 'Удаленный пользователь'}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">Нет комментариев. Напишите первым!</p>}
            </div>

            <div className="flex gap-3">
              <Avatar src={currentUser.avatar} size="md" />
              <div className="flex-1 relative">
                <textarea className="w-full border border-gray-300 rounded-xl p-3 pb-12 text-sm outline-none resize-none focus:border-[#E53935]" placeholder="Написать комментарий..." rows="2" value={newComment} onChange={e => setNewComment(e.target.value)} />
                <div className="absolute bottom-2 right-2 flex gap-2"><Button onClick={handleAddComment} className="py-1.5 px-4" disabled={!newComment.trim()}>Отправить</Button></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 bg-gray-50 p-6 flex flex-col gap-6">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Текущий Статус</label>
          <select className={`w-full border rounded-lg p-2.5 text-sm font-medium bg-white outline-none ${canChangeStatusAndLinks ? 'border-gray-300 focus:border-[#E53935]' : 'border-gray-200 text-gray-500 cursor-not-allowed'}`} value={task.status} onChange={e => handleUpdate({ status: e.target.value })} disabled={!canChangeStatusAndLinks}>
            {Object.entries(STATUSES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Исполнитель</label>
          {canEditCore ? (
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white outline-none mb-2" value={task.assigneeId} onChange={e => handleUpdate({ assigneeId: e.target.value })}>
              <option value="">Не назначен</option>
              {users.filter(u => u.role === 'designer' || u.role === 'admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          ) : (
            <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
              {assignee ? <><Avatar src={assignee.avatar} /><div><div className="text-sm font-medium text-gray-900">{assignee.name}</div><div className="text-xs text-gray-500">{ROLES[assignee.role]?.label}</div></div></> : <span className="text-sm text-gray-500 italic p-1">Не назначен</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Постановщик</label>
          <div className="flex items-center gap-2"><Avatar src={creator?.avatar} size="sm" /><span className="text-sm text-gray-700">{creator ? creator.name : 'Неизвестно'}</span></div>
        </div>

        <div className="h-px w-full bg-gray-200"></div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={14} /> Жесткий дедлайн</label>
            {canEditCore ? <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none" value={task.deadline} onChange={e => handleUpdate({ deadline: e.target.value })} /> : <div className="text-sm font-medium text-gray-900">{new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Clock size={14} /> Оценка дизайнера</label>
            <input type="date" disabled={!canChangeStatusAndLinks} className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2 shadow-sm disabled:bg-gray-50 disabled:text-gray-500 outline-none" value={task.estimatedDeadline || ''} onChange={e => handleUpdate({ estimatedDeadline: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateTaskModal = ({ isOpen, onClose, onSave, currentUser, users, allTasks }) => {
  const [formData, setFormData] = useState({ title: '', description: '', type: 'Web Design', priority: 'NORMAL', deadline: '', assigneeId: '' });
  const [links, setLinks] = useState([]);

  const searchHistory = useMemo(() => {
    const titles = [...new Set(allTasks.map(t => t.title))].filter(Boolean);
    const types = [...new Set(allTasks.map(t => t.type))].filter(Boolean);
    if (types.length === 0) types.push('Web Design', 'Social Media', 'Branding', 'Print / Promo', 'UI/UX', 'Presentation');
    return { titles, types };
  }, [allTasks]);

  if (!isOpen) return null;

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const newState = { ...prev, title: val };
      const existing = allTasks.find(t => t.title === val);
      if (existing && val !== prev.title) {
        newState.description = existing.description || '';
        newState.type = existing.type || 'Web Design';
      }
      return newState;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: `TSK-${Math.floor(Math.random() * 900) + 100}`, status: 'NEW', creatorId: currentUser.id, createdAt: new Date().toISOString(), comments: [], links });
    onClose();
    setFormData({ title: '', description: '', type: searchHistory.types[0], priority: 'NORMAL', deadline: '', assigneeId: '' });
    setLinks([]);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Новое техническое задание</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название задачи *</label>
              <input required list="history-titles" type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" value={formData.title} onChange={handleTitleChange} placeholder="Начните вводить для подсказок..." />
              <datalist id="history-titles">{searchHistory.titles.map((t, i) => <option key={i} value={t} />)}</datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подробное описание (ТЗ) *</label>
              <textarea required rows="4" className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none resize-none focus:border-[#E53935]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Тексты, размеры, пожелания по стилю..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип дизайна</label>
                <input required list="history-types" type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} placeholder="Выберите или введите..." />
                <datalist id="history-types">{searchHistory.types.map((t, i) => <option key={i} value={t} />)}</datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дедлайн *</label>
                <input required type="date" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Назначить на</label>
                <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none" value={formData.assigneeId} onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}>
                  <option value="">Не выбрано (в бэклог)</option>
                  {users.filter(u => u.role === 'designer' || u.role === 'admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Референсы и ссылки</label>
              <ReferenceLinksArea links={links} setLinks={setLinks} />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button form="create-task-form" type="submit">Поставить задачу</Button>
        </div>
      </div>
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose, currentUser, onUpdateProfile }) => {
  const [formData, setFormData] = useState({ name: '', gender: 'male' });
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({ name: currentUser.name, gender: currentUser.gender || 'male' });
      setAvatarUrl(currentUser.avatar);
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const randomizeAvatar = () => setAvatarUrl(generateAvatar(formData.name || 'User', formData.gender, Math.random().toString(36).substring(7)));

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({ ...currentUser, name: formData.name, gender: formData.gender, avatar: avatarUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Настройки профиля</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col items-center mb-4 gap-2">
            <div onClick={randomizeAvatar} className="cursor-pointer hover:opacity-80 transition-opacity relative group" title="Кликните, чтобы сменить лицо">
              <Avatar src={avatarUrl} size="xl" className="border-2 border-gray-300" />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><RefreshCw size={32} className="text-white" /></div>
            </div>
            <span className="text-[10px] text-gray-400">Кликните по фото для смены</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя и Фамилия</label>
            <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#E53935]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пол (для генерации аватара)</label>
            <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none" value={formData.gender} onChange={e => {
              setFormData({ ...formData, gender: e.target.value });
              setAvatarUrl(generateAvatar(formData.name || 'User', e.target.value, Math.random().toString(36).substring(7)));
            }}>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>Отмена</Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState(null);

  const [fbUser, setFbUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isDbReady, setIsDbReady] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notify = (message, taskId = null) => {
    const newNotif = { id: Date.now(), text: message, taskId, read: false, time: new Date().toISOString() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error('Auth init err', e);
        setUsers(INITIAL_USERS);
        setTasks(INITIAL_TASKS);
        setIsDbReady(true);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setFbUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!fbUser) return;

    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');

    let firstLoadT = true;
    let firstLoadU = true;

    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const data = snap.docs.map(d => d.data());
      if (firstLoadT && data.length === 0) {
        INITIAL_TASKS.forEach(t => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', t.id), t));
      } else {
        setTasks(data);
      }
      firstLoadT = false;
    }, (error) => {
      console.error('Tasks snapshot error', error);
      setTasks(INITIAL_TASKS);
    });

    const unsubUsers = onSnapshot(usersRef, (snap) => {
      const data = snap.docs.map(d => d.data());
      if (firstLoadU && data.length === 0) {
        INITIAL_USERS.forEach(u => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.id), u));
      } else {
        setUsers(data);
        setIsDbReady(true);
      }
      firstLoadU = false;
    }, (error) => {
      console.error('Users snapshot error', error);
      setUsers(INITIAL_USERS);
      setIsDbReady(true);
    });

    return () => {
      unsubTasks();
      unsubUsers();
    };
  }, [fbUser]);

  const handleUpdateTask = async (updatedTask) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', updatedTask.id), updatedTask);

    const oldTask = tasks.find(t => t.id === updatedTask.id);
    if (oldTask && oldTask.status !== updatedTask.status) {
      notify(`Статус задачи "${updatedTask.title}" изменен на "${STATUSES[updatedTask.status].label}"`, updatedTask.id);
    } else if (oldTask && oldTask.comments?.length !== updatedTask.comments?.length) {
      notify(`Новый комментарий в задаче "${updatedTask.title}"`, updatedTask.id);
    }
    setSelectedTask(updatedTask);
  };

  const handleCreateTask = async (newTask) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', newTask.id), newTask);
    notify(`Создана новая задача: "${newTask.title}"`, newTask.id);
  };

  const handleAddUser = async (newUserParams) => {
    const newUser = { id: `u${Date.now()}`, ...newUserParams };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', newUser.id), newUser);
    notify(`Пользователь ${newUser.name} успешно добавлен.`);
  };

  const handleUpdateUserAdmin = async (updatedUser) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', updatedUser.id), updatedUser);
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
    notify(`Данные пользователя ${updatedUser.name} обновлены.`);
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', userId));
    notify('Пользователь был удален.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedTask(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={setCurrentUser} isDbLoading={!isDbReady} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-gray-900 font-sans overflow-hidden">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10 hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E53935] flex items-center justify-center text-white font-bold text-xl shadow-sm">D</div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">Pokiza <span className="text-[#E53935]">Design</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button onClick={() => { setActiveTab('dashboard'); setSelectedTask(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-[#FFEBEE] text-[#E53935]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <LayoutDashboard size={18} /> Дашборд
          </button>

          {currentUser.role === 'admin' && (
            <button onClick={() => { setActiveTab('admin'); setSelectedTask(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'admin' ? 'bg-[#FFEBEE] text-[#E53935]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Users size={18} /> Сотрудники
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"><LogOut size={16} />Выйти</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="md:hidden flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#E53935] flex items-center justify-center text-white font-bold text-xl">D</div></div>
          </div>

          <div className="flex items-center gap-4 relative">
            {(currentUser.role === 'admin' || currentUser.role === 'marketer') && <Button onClick={() => setIsCreateModalOpen(true)} className="hidden sm:flex"><Plus size={18} className="mr-1.5" /> Создать ТЗ</Button>}

            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E53935] rounded-full border-2 border-white"></span>}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-16 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <span className="font-semibold text-sm">Уведомления</span>
                  <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} className="text-xs text-[#E53935] hover:underline">Прочитать все</button>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length > 0 ? notifications.map(n => <div key={n.id} className={`p-3 text-sm rounded-lg mb-1 ${n.read ? 'bg-white text-gray-600' : 'bg-blue-50/50 text-gray-900 font-medium'}`}>{n.text}<div className="text-xs text-gray-400 mt-1">{new Date(n.time).toLocaleTimeString()}</div></div>) : <div className="p-4 text-center text-sm text-gray-500">Нет новых уведомлений</div>}
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => setIsProfileModalOpen(true)} title="Настройки профиля">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize">{ROLES[currentUser.role]?.label}</p>
              </div>
              <Avatar src={currentUser.avatar} />
            </div>

            <button onClick={handleLogout} className="md:hidden p-2 text-gray-400 hover:text-red-600 transition-colors"><LogOut size={20} /></button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {activeTab === 'admin' && currentUser.role === 'admin' ? (
            <AdminPanel users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUserAdmin} onDeleteUser={handleDeleteUser} currentUser={currentUser} />
          ) : selectedTask ? (
            <TaskDetail task={selectedTask} users={users} onBack={() => setSelectedTask(null)} onUpdateTask={handleUpdateTask} currentUser={currentUser} />
          ) : (
            <Dashboard tasks={tasks} users={users} onViewTask={(t) => { setSelectedTask(t); setNotifications(prev => prev.map(n => n.taskId === t.id ? { ...n, read: true } : n)); }} onUpdateTask={handleUpdateTask} currentUser={currentUser} />
          )}
        </main>
      </div>

      <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateTask} currentUser={currentUser} users={users} allTasks={tasks} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} onUpdateProfile={handleUpdateUserAdmin} />
    </div>
  );
}
