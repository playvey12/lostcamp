import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { formatBirthDateInput } from '../../utils/ageCheck';

interface AuthRegisterFormProps {
  regEmail: string;
  setRegEmail: (val: string) => void;
  regPassword: string;
  setRegPassword: (val: string) => void;
  regConfirmPassword: string;
  setRegConfirmPassword: (val: string) => void;
  regFirstName: string;
  setRegFirstName: (val: string) => void;
  regLastName: string;
  setRegLastName: (val: string) => void;
  regBirthDate: string;
  setRegBirthDate: (val: string) => void;
  regAddress: string;
  setRegAddress: (val: string) => void;
  acceptAll: boolean;
  handleToggleAcceptAll: () => void;
  acceptPrivacy: boolean;
  setAcceptPrivacy: (val: boolean) => void;
  acceptTerms: boolean;
  setAcceptTerms: (val: boolean) => void;
  regError: string;
  isLoading: boolean;
  handleRegisterSubmit: (e: React.FormEvent) => void;
  onBackToLogin: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  regConfirmPassword,
  setRegConfirmPassword,
  regFirstName,
  setRegFirstName,
  regLastName,
  setRegLastName,
  regBirthDate,
  setRegBirthDate,
  regAddress,
  setRegAddress,
  acceptAll,
  handleToggleAcceptAll,
  acceptPrivacy,
  setAcceptPrivacy,
  acceptTerms,
  setAcceptTerms,
  regError,
  isLoading,
  handleRegisterSubmit,
  onBackToLogin,
  onNavigateToTerms,
  onNavigateToPrivacy,
}) => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight text-center lowercase">
        создать аккаунт
      </h1>

      <div className="bg-[#f4f5f4] rounded-2xl p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
        {regError && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{regError}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          {/* email */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-normal">
              электронная почта<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="user@lostcamp.ru"
              className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
            />
          </div>

          {/* password */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-normal">
              пароль<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
            />
            <p className="text-[11px] text-neutral-400 font-normal pt-1 leading-tight">
              пароль должен состоять не менее чем из 8 символов и содержать буквенные и цифровые символы
            </p>
          </div>

          {/* confirm password */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-normal">
              подтвердите пароль<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
            />
          </div>

          {/* first name */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-normal">
              имя<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              placeholder="Александр"
              className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
            />
          </div>

          {/* last name */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-normal">
              фамилия
            </label>
            <input
              type="text"
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              placeholder="Иванов"
              className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
            />
          </div>

          {/* birth date */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-normal">
              дата рождения<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="ДД.ММ.ГГГГ"
              maxLength={10}
              value={regBirthDate}
              onChange={(e) => setRegBirthDate(formatBirthDateInput(e.target.value))}
              className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
            />
          </div>

          {/* address */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-600 font-normal">
              адрес доставки
            </label>
            <input
              type="text"
              placeholder="г. Москва, ул. Арбат, дом 10"
              value={regAddress}
              onChange={(e) => setRegAddress(e.target.value)}
              className="w-full bg-white border border-neutral-300 px-4 py-3 text-sm text-black focus:outline-none focus:border-black rounded-xs"
            />
          </div>

          {/* Checkboxes section */}
          <div className="space-y-3 pt-3">
            {/* принять все */}
            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <div
                onClick={handleToggleAcceptAll}
                className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                  acceptAll
                    ? 'bg-[#2f4a35] border-[#2f4a35] text-white'
                    : 'bg-white border-neutral-300'
                }`}
              >
                {acceptAll && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs text-neutral-700 font-normal">
                принять все
              </span>
            </label>

            {/* я соглашаюсь с политикой конфиденциальности */}
            <div className="flex items-center space-x-3 select-none">
              <div
                onClick={() => setAcceptPrivacy(!acceptPrivacy)}
                className={`w-4 h-4 border flex items-center justify-center transition-colors cursor-pointer ${
                  acceptPrivacy
                    ? 'bg-[#2f4a35] border-[#2f4a35] text-white'
                    : 'bg-white border-neutral-300'
                }`}
              >
                {acceptPrivacy && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs text-neutral-700 font-normal">
                я соглашаюсь с{' '}
                <button
                  type="button"
                  onClick={() => onNavigateToPrivacy?.()}
                  className="underline hover:text-black transition-colors cursor-pointer"
                >
                  политикой конфиденциальности
                </button>
                <span className="text-red-500">*</span>
              </span>
            </div>

            {/* я соглашаюсь с пользовательским соглашением сайта */}
            <div className="flex items-center space-x-3 select-none">
              <div
                onClick={() => setAcceptTerms(!acceptTerms)}
                className={`w-4 h-4 border flex items-center justify-center transition-colors cursor-pointer ${
                  acceptTerms
                    ? 'bg-[#2f4a35] border-[#2f4a35] text-white'
                    : 'bg-white border-neutral-300'
                }`}
              >
                {acceptTerms && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-xs text-neutral-700 font-normal">
                я соглашаюсь с{' '}
                <button
                  type="button"
                  onClick={() => onNavigateToTerms?.()}
                  className="underline hover:text-black transition-colors cursor-pointer"
                >
                  пользовательским соглашением сайта
                </button>
                <span className="text-red-500">*</span>
              </span>
            </div>
          </div>

          {/* Buttons row */}
          <div className="pt-4 flex items-center justify-between flex-wrap gap-4">
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
              className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold uppercase tracking-wider py-3.5 px-10 transition-colors cursor-pointer rounded-xs disabled:opacity-50"
            >
              {isLoading ? 'создание...' : 'зарегистрироваться'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
