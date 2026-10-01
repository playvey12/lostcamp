import React, { useState } from 'react';
import { Lock, ShieldAlert, X, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Укажите пароль администратора');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await authService.login(password);
    setLoading(false);

    if (result.success) {
      setPassword('');
      onSuccess();
    } else {
      setError(result.error || 'Неверный пароль доступа! Попробуйте снова.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 shadow-2xl p-6 sm:p-8 text-white z-10 space-y-6 rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#2e4733]/40 border border-[#2e4733] flex items-center justify-center text-emerald-400 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold tracking-tight uppercase font-mono text-white">
            Админ-панель LOST CAMP
          </h3>
          <p className="text-xs text-neutral-400">
            Для доступа к системе управления укажите секретный пароль администратора
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase text-neutral-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Пароль администратора:</span>
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg focus:outline-none focus:border-emerald-500 font-mono text-sm tracking-widest"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800/60 text-red-300 text-xs rounded-lg animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2e4733] hover:bg-[#233827] text-white font-mono text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Проверка...' : 'Войти в систему'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
