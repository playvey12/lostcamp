import React, { useState } from 'react';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useShop } from '../../context/ShopContext';
import { formatBirthDateInput } from '../../utils/ageCheck';

interface ProfileInfoProps {
  user: any;
  isLoading: boolean;
  profileMsg: string;
  profileErr: string;
  editingField: 'password' | 'birthDate' | 'address' | 'name' | 'email' | null;
  setEditingField: (field: 'password' | 'birthDate' | 'address' | 'name' | 'email' | null) => void;
  tempFirstName: string;
  setTempFirstName: (val: string) => void;
  tempLastName: string;
  setTempLastName: (val: string) => void;
  tempBirthDate: string;
  setTempBirthDate: (val: string) => void;
  tempAddress: string;
  setTempAddress: (val: string) => void;
  oldPassword: string;
  setOldPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handleSaveField: (field: 'password' | 'birthDate' | 'address' | 'name') => void;
  logout: () => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
  user,
  isLoading,
  profileMsg,
  profileErr,
  editingField,
  setEditingField,
  tempFirstName,
  setTempFirstName,
  tempLastName,
  setTempLastName,
  tempBirthDate,
  setTempBirthDate,
  tempAddress,
  setTempAddress,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  handleSaveField,
  logout,
}) => {
  const [showOldPassInput, setShowOldPassInput] = useState(false);
  const [showNewPassInput, setShowNewPassInput] = useState(false);

  const { requestEmailChange, confirmEmailChange } = useAuthStore();
  const { showToast } = useShop();

  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailCodeInput, setEmailCodeInput] = useState('');
  const [emailStep, setEmailStep] = useState<'input_email' | 'input_code'>('input_email');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailMsg, setEmailMsg] = useState('');

  const handleStartEditEmail = () => {
    setEditingField('email');
    setNewEmailInput('');
    setEmailCodeInput('');
    setEmailStep('input_email');
    setEmailError('');
    setEmailMsg('');
  };

  const handleCancelEditEmail = () => {
    setEditingField(null);
    setNewEmailInput('');
    setEmailCodeInput('');
    setEmailStep('input_email');
    setEmailError('');
    setEmailMsg('');
  };

  const handleRequestEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailMsg('');

    const clean = newEmailInput.trim();
    if (!clean || !clean.includes('@')) {
      setEmailError('Введите корректный новый email');
      return;
    }

    if (clean.toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError('Новый email совпадает с текущим');
      return;
    }

    setEmailLoading(true);
    const res = await requestEmailChange(clean);
    setEmailLoading(false);

    if (res.success) {
      setEmailStep('input_code');
      const extraInfo = (res as any).fallbackCodeSent ? ' (Код сгенерирован в консоли сервера)' : '';
      setEmailMsg((res.message || 'Код подтверждения отправлен на вашу новую почту!') + extraInfo);
    } else {
      setEmailError(res.error || 'Ошибка при отправке кода на новый email');
    }
  };

  const handleConfirmEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailMsg('');

    const codeClean = emailCodeInput.trim();
    if (!codeClean || codeClean.length < 6) {
      setEmailError('Введите 6-значный код из письма');
      return;
    }

    setEmailLoading(true);
    const res = await confirmEmailChange(newEmailInput.trim(), codeClean);
    setEmailLoading(false);

    if (res.success) {
      handleCancelEditEmail();
      showToast('Email успешно изменён!');
    } else {
      setEmailError(res.error || 'Неверный или просроченный код подтверждения');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl font-sans">
      {profileMsg && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>{profileMsg}</span>
        </div>
      )}

      {profileErr && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{profileErr}</span>
        </div>
      )}

      {/* 1. ПОЧТА */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-normal text-black lowercase">почта</span>
          {editingField === 'email' ? (
            <button
              onClick={handleCancelEditEmail}
              disabled={emailLoading}
              className="border border-neutral-300 rounded-full px-5 py-1 text-xs text-neutral-600 hover:text-black hover:border-black transition-colors lowercase cursor-pointer disabled:opacity-50"
            >
              отмена
            </button>
          ) : (
            <button
              onClick={handleStartEditEmail}
              className="border border-neutral-300 rounded-full px-5 py-1 text-xs text-black hover:border-black transition-colors lowercase cursor-pointer"
            >
              изменить почту
            </button>
          )}
        </div>

        <div className="border border-neutral-300 bg-white p-4 min-h-[52px]">
          {editingField === 'email' ? (
            <div className="space-y-3">
              {emailMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-sm">
                  {emailMsg}
                </div>
              )}
              {emailError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-sm">
                  {emailError}
                </div>
              )}

              {emailStep === 'input_email' ? (
                <form onSubmit={handleRequestEmailSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-500 font-normal">
                      Новый адрес электронной почты
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="new-email@example.com"
                      className="w-full border border-neutral-300 px-3 py-2 text-sm text-black focus:outline-none focus:border-black rounded-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={emailLoading || !newEmailInput}
                      className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold py-2 px-5 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {emailLoading ? 'отправка...' : 'отправить код'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmEmailSubmit} className="space-y-3">
                  <p className="text-xs text-neutral-600">
                    Код отправлен на адрес <strong className="text-black font-mono">{newEmailInput}</strong>
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-500 font-normal">
                      Код подтверждения из письма
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={emailCodeInput}
                      onChange={(e) => setEmailCodeInput(e.target.value)}
                      placeholder="123456"
                      className="w-full border border-neutral-300 px-3 py-2 text-sm text-black font-mono tracking-widest text-center focus:outline-none focus:border-black rounded-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailStep('input_email');
                        setEmailCodeInput('');
                        setEmailError('');
                        setEmailMsg('');
                      }}
                      className="text-xs text-neutral-500 hover:text-black underline cursor-pointer"
                    >
                      ← изменить email
                    </button>
                    <button
                      type="submit"
                      disabled={emailLoading || emailCodeInput.length < 6}
                      className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold py-2 px-5 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {emailLoading ? 'проверка...' : 'подтвердить'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-end h-full min-h-[20px]">
              <span className="text-sm text-black font-sans font-medium">
                {user?.email || 'xxxxxxxxxx@gmail.com'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. ПАРОЛЬ */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-normal text-black lowercase">пароль</span>
          {editingField === 'password' ? (
            <button
              onClick={() => handleSaveField('password')}
              disabled={isLoading}
              className="border border-black bg-black text-white rounded-full px-5 py-1 text-xs lowercase transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '...' : 'сохранить'}
            </button>
          ) : (
            <button
              onClick={() => setEditingField('password')}
              className="border border-neutral-300 rounded-full px-5 py-1 text-xs text-black hover:border-black transition-colors lowercase cursor-pointer"
            >
              сменить
            </button>
          )}
        </div>

        <div className="border border-neutral-300 bg-white p-4 min-h-[52px] flex items-center justify-end">
          {editingField === 'password' ? (
            <div className="w-full space-y-2">
              <div className="relative">
                <input
                  type={showOldPassInput ? 'text' : 'password'}
                  placeholder="Старый пароль"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full border border-neutral-300 px-3 py-1.5 pr-10 text-sm text-black focus:outline-none text-right font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassInput(!showOldPassInput)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                >
                  {showOldPassInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassInput ? 'text' : 'password'}
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-neutral-300 px-3 py-1.5 pr-10 text-sm text-black focus:outline-none text-right font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassInput(!showNewPassInput)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
                >
                  {showNewPassInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <span
              className="text-sm text-black select-none tracking-widest font-bold text-lg"
              title="Пароль скрыт из соображений безопасности"
            >
              ••••••••
            </span>
          )}
        </div>
      </div>

      {/* 3. ДАТА РОЖДЕНИЯ */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-normal text-black lowercase">дата рождения</span>
          {editingField === 'birthDate' ? (
            <button
              onClick={() => handleSaveField('birthDate')}
              disabled={isLoading}
              className="border border-black bg-black text-white rounded-full px-5 py-1 text-xs lowercase transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '...' : 'сохранить'}
            </button>
          ) : (
            <button
              onClick={() => setEditingField('birthDate')}
              className="border border-neutral-300 rounded-full px-5 py-1 text-xs text-black hover:border-black transition-colors lowercase cursor-pointer"
            >
              редактировать
            </button>
          )}
        </div>

        <div className="border border-neutral-300 bg-white p-4 min-h-[52px] flex items-center justify-end">
          {editingField === 'birthDate' ? (
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="00.00.0000г"
              value={tempBirthDate}
              onChange={(e) => setTempBirthDate(formatBirthDateInput(e.target.value))}
              className="w-full border border-neutral-300 px-3 py-1 text-sm text-black focus:outline-none text-right font-sans"
            />
          ) : (
            <span className="text-sm text-black font-sans">
              {user?.birthDate || '00.00.0000г'}
            </span>
          )}
        </div>
      </div>

      {/* 4. АДРЕС */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-normal text-black lowercase">адрес</span>
          {editingField === 'address' ? (
            <button
              onClick={() => handleSaveField('address')}
              disabled={isLoading}
              className="border border-black bg-black text-white rounded-full px-5 py-1 text-xs lowercase transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '...' : 'сохранить'}
            </button>
          ) : (
            <button
              onClick={() => setEditingField('address')}
              className="border border-neutral-300 rounded-full px-5 py-1 text-xs text-black hover:border-black transition-colors lowercase cursor-pointer"
            >
              {user?.address ? 'редактировать' : 'добавить'}
            </button>
          )}
        </div>

        <div className="border border-neutral-300 bg-white p-4 min-h-[52px] flex items-center justify-end">
          {editingField === 'address' ? (
            <input
              type="text"
              placeholder="г.Ххххх, ул. Хххххххххх, дом хх"
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              className="w-full border border-neutral-300 px-3 py-1 text-sm text-black focus:outline-none text-right font-sans"
            />
          ) : (
            <span className="text-sm text-black font-sans">
              {user?.address || 'г.Ххххх, ул. Хххххххххх, дом хх'}
            </span>
          )}
        </div>
      </div>

      {/* LOGOUT BUTTON AT BOTTOM */}
      <div className="pt-10 flex justify-end">
        <button
          onClick={logout}
          className="border border-neutral-300 hover:border-black hover:bg-black hover:text-white text-black text-sm font-bold uppercase tracking-wider py-1.5 px-6 transition-all cursor-pointer rounded-2xl"
        >
          ВЫЙТИ
        </button>
      </div>
    </div>
  );
};

