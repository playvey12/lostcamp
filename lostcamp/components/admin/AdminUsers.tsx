import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, User } from 'lucide-react';

interface DbUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  googleId?: string;
  createdAt?: string;
}

interface AdminUsersProps {
  showToast?: (msg: string) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ showToast }) => {
  const [usersList, setUsersList] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsersList = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsersList(Array.isArray(data) ? data : data.data || []);
        if (showToast) showToast('Список пользователей обновлен из SQLite');
      } else {
        if (showToast) showToast('Не удалось загрузить список пользователей');
      }
    } catch (e) {
      console.error('Failed to fetch users list:', e);
      if (showToast) showToast('Не удалось загрузить список пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#2e4733] flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              <span>Пользователи системы (SQLite БД /data/lostcamp.sqlite)</span>
              <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-600/40 text-emerald-400 text-[10px] rounded-full uppercase">
                ● SQLite Database
              </span>
            </h2>
            <p className="text-xs text-neutral-300 font-mono mt-1 max-w-2xl leading-relaxed">
              Все пользователи, зарегистрировавшиеся через Google почту или формы сайта, хранятся в постоянной локальной базе данных SQLite в папке /data.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchUsersList}
          disabled={isLoading}
          className="px-4 py-2.5 bg-[#2e4733] hover:bg-[#233827] text-white border border-emerald-600/50 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Обновить из SQLite</span>
        </button>
      </div>

      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-neutral-200">
            <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Email пользователя</th>
                <th className="p-4">Имя / Фамилия</th>
                <th className="p-4">Дата рождения</th>
                <th className="p-4">Способ входа</th>
                <th className="p-4">Дата регистрации</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700/60">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-700/40 transition-colors">
                  <td className="p-4 font-bold text-neutral-400">#{u.id}</td>
                  <td className="p-4 font-bold text-emerald-400 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{u.email}</span>
                  </td>
                  <td className="p-4 text-white">
                    {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}` : '—'}
                  </td>
                  <td className="p-4 text-neutral-300">{u.birthDate || '—'}</td>
                  <td className="p-4">
                    {u.googleId ? (
                      <span className="px-2.5 py-1 bg-white text-neutral-900 font-bold rounded-md text-[10px] inline-flex items-center gap-1.5 shadow-sm">
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Google OAuth
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 text-neutral-300 rounded-md text-[10px]">
                        Email / Сайт
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-neutral-400 text-[11px]">{u.createdAt || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usersList.length === 0 && (
          <div className="p-12 text-center text-neutral-400 font-mono text-xs">
            Пользователи в БД SQLite пока отсутствуют. Пройдите регистрацию в Личном кабинете через Google почту.
          </div>
        )}
      </div>
    </div>
  );
};
