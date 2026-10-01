import React, { useState } from 'react';
import { X, User, CheckCircle2, ShieldCheck, Mail, KeyRound, RefreshCw, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { useAuthStore } from '../store/useAuthStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
  onLoginSuccess?: (user: UserProfile) => void;
  showToast?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
  onLoginSuccess,
  showToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'code'>('login');
  
  // Verification code state
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingUser, setPendingUser] = useState<{
    email: string;
    firstName?: string;
    lastName?: string;
    authProvider: 'google' | 'email';
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const { login: storeLogin } = useAuthStore();

  const resetForm = () => {
    setStep('form');
    setVerificationCode('');
    setPendingUser(null);
    setErrorMessage('');
    setInfoMessage('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Direct Login with Email + Password
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Укажите email и пароль');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const res = await storeLogin(email, password);
    setLoading(false);

    if (res.success) {
      const currentUser = useAuthStore.getState().user;
      showToast?.(`Добро пожаловать, ${currentUser?.firstName || 'пользователь'}!`);
      onLoginSuccess?.({
        isLoggedIn: true,
        email: currentUser?.email || email,
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
      });
      handleClose();
    } else {
      setErrorMessage(res.error || 'Ошибка входа. Проверьте логин и пароль.');
    }
  };

  // Step 1: Request confirmation code via Nodemailer
  const handleSendCode = async (targetEmail: string, authType: 'google' | 'email', nameStr?: string) => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Укажите корректный адрес электронной почты');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    const [firstName, ...rest] = (nameStr || targetEmail.split('@')[0]).split(' ');
    const lastName = rest.join(' ');

    setPendingUser({
      email: targetEmail,
      firstName: firstName || 'Пользователь',
      lastName: lastName || '',
      authProvider: authType,
    });

    try {
      const res = await fetch('/api/users/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('verify');
        setInfoMessage(`Код подтверждения отправлен на ${targetEmail}`);
        showToast?.(`Код подтверждения отправлен на ${targetEmail}`);
      } else {
        setErrorMessage(data.error || 'Ошибка при отправке кода подтверждения');
      }
    } catch (err) {
      console.error('Error requesting code:', err);
      setErrorMessage('Сетевая ошибка при запросе кода. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and finish login
  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser || !verificationCode) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const verifyRes = await fetch('/api/users/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: pendingUser.email, code: verificationCode }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        setErrorMessage(verifyData.error || 'Неверный код подтверждения');
        setLoading(false);
        return;
      }

      if (verifyData.user) {
        useAuthStore.getState().setUser({
          id: verifyData.user.id,
          email: verifyData.user.email,
          firstName: verifyData.user.firstName,
          lastName: verifyData.user.lastName,
          role: verifyData.user.role || 'user',
        });

        showToast?.('Почта подтверждена! Вход успешно выполнен.');
        handleClose();
      } else {
        setErrorMessage('Не удалось получить данные пользователя');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setErrorMessage('Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 shadow-2xl z-10 p-7 space-y-6 rounded-2xl overflow-hidden text-white font-mono"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#2e4733] flex items-center justify-center text-emerald-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono uppercase tracking-wide text-white">
                    {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация по коду'}
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    ● JWT + bcrypt + SQLite
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ERROR or INFO Messages */}
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-600/50 rounded-xl text-red-300 text-xs">
                ⚠️ {errorMessage}
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-emerald-300 text-xs leading-relaxed flex items-start gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* TAB SELECTOR */}
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setStep('form');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === 'login' ? 'bg-[#2e4733] text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Вход по паролю
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('code');
                  setStep('form');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  mode === 'code' ? 'bg-[#2e4733] text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Вход по email-коду
              </button>
            </div>

            {/* MODE 1: LOGIN WITH EMAIL + PASSWORD */}
            {mode === 'login' && (
              <form onSubmit={handleDirectLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@lostcamp.ru"
                    className="w-full bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1">Пароль *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2e4733] hover:bg-[#233827] text-white text-xs font-bold transition-colors cursor-pointer rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>{loading ? 'Вход...' : 'Войти в личный кабинет'}</span>
                </button>
              </form>
            )}

            {/* MODE 2: CODE VERIFICATION */}
            {mode === 'code' && step === 'form' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-neutral-300 mb-1">Ваш Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@mail.ru"
                    className="w-full bg-neutral-950 border border-neutral-700 px-3 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSendCode(email, 'email')}
                  className="w-full py-3 bg-[#2e4733] hover:bg-[#233827] border border-emerald-600/50 text-white text-xs font-bold transition-colors cursor-pointer rounded-xl flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>{loading ? 'Отправка...' : 'Получить одноразовый код'}</span>
                </button>
              </div>
            )}

            {mode === 'code' && step === 'verify' && pendingUser && (
              <form onSubmit={handleVerifyAndLogin} className="space-y-4 text-xs animate-fadeIn">
                <div className="p-3 bg-neutral-950 border border-emerald-600/40 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <KeyRound className="w-4 h-4" />
                    <span>Введите 6-значный код подтверждения</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    На адрес <strong className="text-white">{pendingUser.email}</strong> выслан код подтверждения.
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 text-[11px]">
                    Код подтверждения из письма *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Код из письма"
                    className="w-full bg-neutral-950 border border-emerald-500/80 text-center tracking-[8px] text-lg font-bold text-emerald-400 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSendCode(pendingUser.email, pendingUser.authProvider, pendingUser.firstName)}
                    disabled={loading}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Переотправить</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length < 6}
                    className="flex-1 py-2 bg-[#2e4733] hover:bg-[#233827] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{loading ? 'Проверка...' : 'Подтвердить код'}</span>
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    ← Изменить адрес почты
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenRegister?.();
                }}
                className="text-xs text-neutral-400 hover:text-emerald-400 hover:underline cursor-pointer"
              >
                Перейти в личный кабинет
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
