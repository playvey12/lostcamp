import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface AuthForgotPasswordProps {
  forgotStep: 'email' | 'code' | 'new_password';
  setForgotStep: (step: 'email' | 'code' | 'new_password') => void;
  forgotEmail: string;
  setForgotEmail: (val: string) => void;
  forgotCode: string;
  setForgotCode: (val: string) => void;
  forgotNewPassword: string;
  setForgotNewPassword: (val: string) => void;
  forgotConfirmPassword: string;
  setForgotConfirmPassword: (val: string) => void;
  forgotMessage: string;
  forgotError: string;
  resendTimer: number;
  isLoading: boolean;
  handleForgotPasswordSend: (e?: React.FormEvent) => void;
  handleVerifyCodeSubmit: (e: React.FormEvent) => void;
  handleResetPasswordSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
}

export const AuthForgotPassword: React.FC<AuthForgotPasswordProps> = ({
  forgotStep,
  setForgotStep,
  forgotEmail,
  setForgotEmail,
  forgotCode,
  setForgotCode,
  forgotNewPassword,
  setForgotNewPassword,
  forgotConfirmPassword,
  setForgotConfirmPassword,
  forgotMessage,
  forgotError,
  resendTimer,
  isLoading,
  handleForgotPasswordSend,
  handleVerifyCodeSubmit,
  handleResetPasswordSubmit,
  onBackToLogin,
}) => {
  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight text-center lowercase">
        восстановление пароля
      </h1>

      <div className="bg-[#f4f5f4] rounded-2xl p-6 sm:p-10 space-y-6 border border-neutral-200">
        {forgotError && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{forgotError}</span>
          </div>
        )}

        {forgotMessage && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-xs text-emerald-900 leading-relaxed flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{forgotMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter email */}
        {forgotStep === 'email' && (
          <form onSubmit={handleForgotPasswordSend} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-600 font-normal">
                укажите ваш e-mail
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="user@lostcamp.ru"
                className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-xs text-neutral-500 hover:text-black underline cursor-pointer"
              >
                ← назад ко входу
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold uppercase tracking-wider py-3.5 px-8 transition-colors cursor-pointer rounded-xs disabled:opacity-50"
              >
                {isLoading ? 'отправка...' : 'отправить код'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter verification code */}
        {forgotStep === 'code' && (
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
            <div className="p-3 bg-white border border-neutral-200 rounded-lg space-y-1">
              <p className="text-xs text-neutral-600">
                Код отправлен на адрес <strong className="text-black font-mono">{forgotEmail}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-600 font-normal">
                код подтверждения из письма
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={forgotCode}
                onChange={(e) => setForgotCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-white border border-neutral-300 px-4 py-3 text-lg font-bold tracking-[6px] text-center text-[#2f4a35] focus:outline-none focus:border-black rounded-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={resendTimer > 0 || isLoading}
                onClick={() => handleForgotPasswordSend()}
                className="text-xs text-neutral-600 hover:text-black underline cursor-pointer disabled:opacity-50"
              >
                {resendTimer > 0 ? `переотправить (${resendTimer}с)` : 'переотправить код'}
              </button>

              <button
                type="submit"
                disabled={isLoading || forgotCode.length < 6}
                className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold uppercase tracking-wider py-3.5 px-8 transition-colors cursor-pointer rounded-xs disabled:opacity-50"
              >
                {isLoading ? 'проверка...' : 'подтвердить'}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setForgotStep('email')}
                className="text-xs text-neutral-500 hover:text-black underline cursor-pointer"
              >
                изменить e-mail
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter new password */}
        {forgotStep === 'new_password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-600 font-normal">
                новый пароль (мин. 6 символов)
              </label>
              <input
                type="password"
                required
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-600 font-normal">
                подтвердите новый пароль
              </label>
              <input
                type="password"
                required
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold uppercase tracking-wider py-3.5 px-8 transition-colors cursor-pointer rounded-xs disabled:opacity-50"
              >
                {isLoading ? 'сохранение...' : 'сохранить пароль'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
