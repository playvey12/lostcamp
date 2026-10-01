import React from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthLoginChoiceProps {
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  showLoginPassword: boolean;
  setShowLoginPassword: (val: boolean) => void;
  loginError: string;
  isLoading: boolean;
  handleLoginSubmit: (e: React.FormEvent) => void;
  onForgotPasswordClick: () => void;
  onRegisterClick: () => void;
}

export const AuthLoginChoice: React.FC<AuthLoginChoiceProps> = ({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showLoginPassword,
  setShowLoginPassword,
  loginError,
  isLoading,
  handleLoginSubmit,
  onForgotPasswordClick,
  onRegisterClick,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* LEFT CARD: ВОЙТИ */}
      <div className="bg-[#f4f5f4] rounded-2xl p-8 sm:p-10 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight lowercase">
            войти
          </h1>

          {loginError && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-600 font-normal">
                электронная почта
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="user@lostcamp.ru"
                className="w-full bg-white border border-neutral-300/80 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-600 font-normal">
                пароль
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-neutral-300/80 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div>
              <button
                type="button"
                onClick={onForgotPasswordClick}
                className="text-xs text-neutral-500 hover:text-black underline cursor-pointer"
              >
                забыли пароль?
              </button>
            </div>

            {/* Submit Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold uppercase tracking-wider py-3.5 px-10 transition-colors cursor-pointer rounded-xs disabled:opacity-50"
              >
                {isLoading ? 'вход...' : 'войти'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT CARD: СОЗДАТЬ АККАУНТ */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-8 sm:p-10 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-black tracking-tight lowercase">
            создать аккаунт
          </h2>

          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-neutral-600 font-normal">
              создав аккаунт вы сможете:
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-neutral-700 font-normal pl-1">
              <li className="flex items-center gap-2">
                <span className="text-neutral-400">•</span>
                <span>просматривать историю заказов</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neutral-400">•</span>
                <span>получать уникальные предложения</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neutral-400">•</span>
                <span>быстро отследить заказ</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neutral-400">•</span>
                <span>сохранить адрес доставки</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={onRegisterClick}
            className="bg-[#dcdcdc] hover:bg-[#cfcfcf] text-black text-xs font-semibold uppercase tracking-wider py-3.5 px-8 transition-colors cursor-pointer rounded-xs"
          >
            зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  );
};
