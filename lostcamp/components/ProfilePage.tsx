import React, { useState, useEffect } from 'react';
import { UserOrder } from '../types';
import { tacticalOperator } from '../assets/images';
import { orderService } from '../services/orderService';
import { useAuthStore } from '../store/useAuthStore';
import { Check, AlertCircle } from 'lucide-react';
import { isAtLeastMinAge, MIN_AGE_ERROR_MESSAGE } from '../utils/ageCheck';

import { AuthLoginChoice } from './profile/AuthLoginChoice';
import { AuthForgotPassword } from './profile/AuthForgotPassword';
import { AuthRegisterForm } from './profile/AuthRegisterForm';
import { ProfileInfo } from './profile/ProfileInfo';
import { ProfileOrders } from './profile/ProfileOrders';

interface ProfilePageProps {
  orders?: UserOrder[];
  onNavigateToCatalog: () => void;
  onAddOrder?: (order: UserOrder) => void;
  onNavigateToTerms?: () => void;
  onNavigateToPrivacy?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  orders = [],
  onNavigateToCatalog,
  onAddOrder,
  onNavigateToTerms,
  onNavigateToPrivacy,
}) => {
  const {
    user,
    isAuthenticated,
    login,
    register,
    verifyRegistrationCode,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    verifyCode,
    resetPassword,
    isLoading,
    error: storeError,
    clearError,
  } = useAuthStore();

  // Navigation & Auth local state
  const [authView, setAuthView] = useState<'login_choice' | 'register_form' | 'forgot_password' | 'register_verify'>('login_choice');
  const [profileTab, setProfileTab] = useState<'orders' | 'profile'>('orders');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot Password State
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'new_password'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Registration Form State
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [acceptAll, setAcceptAll] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [regError, setRegError] = useState('');

  // Registration Verification State
  const [regVerifyCode, setRegVerifyCode] = useState('');
  const [regVerifyMessage, setRegVerifyMessage] = useState('');
  const [regVerifyError, setRegVerifyError] = useState('');

  // Editing Profile Field States
  const [editingField, setEditingField] = useState<'password' | 'birthDate' | 'address' | 'name' | 'email' | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [tempFirstName, setTempFirstName] = useState('');
  const [tempLastName, setTempLastName] = useState('');
  const [tempBirthDate, setTempBirthDate] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // User Orders State (fetched via fetchMyOrders)
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      orderService
        .fetchMyOrders()
        .then((data) => setUserOrders(data))
        .catch((err) => console.error('Failed to fetch my orders:', err));
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (user) {
      setTempFirstName(user.firstName || '');
      setTempLastName(user.lastName || '');
      setTempBirthDate(user.birthDate || '');
      setTempAddress(user.address || '');
    }
  }, [user]);

  // Resend code countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timerId = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [resendTimer]);

  // Handle Login submission -> calls real login API via useAuthStore
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    clearError();

    if (!loginEmail || !loginPassword) {
      setLoginError('Пожалуйста, введите адрес электронной почты и пароль.');
      return;
    }

    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Неверный email или пароль.');
    }
  };

  // Handle "Принять все" checkbox toggle
  const handleToggleAcceptAll = () => {
    const nextVal = !acceptAll;
    setAcceptAll(nextVal);
    setAcceptPrivacy(nextVal);
    setAcceptTerms(nextVal);
  };

  // Handle Register Form submit -> calls real register API via useAuthStore
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    clearError();

    if (!regEmail || !regPassword || !regFirstName || !regBirthDate) {
      setRegError('Пожалуйста, заполните все обязательные поля (*)');
      return;
    }
    if (!isAtLeastMinAge(regBirthDate)) {
      setRegError(MIN_AGE_ERROR_MESSAGE);
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Пароль должен состоять не менее чем из 8 символов');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Пароли не совпадают!');
      return;
    }
    if (!acceptPrivacy || !acceptTerms) {
      setRegError('Необходимо согласиться с политикой конфиденциальности и пользовательским соглашением.');
      return;
    }

    const res = await register({
      email: regEmail,
      password: regPassword,
      firstName: regFirstName,
      lastName: regLastName,
      birthDate: regBirthDate,
      address: regAddress,
    });

    if (!res.success) {
      setRegError(res.error || 'Ошибка при регистрации. Возможно, пользователь с таким email уже существует.');
    } else if (res.requiresVerification) {
      setRegVerifyCode('');
      setRegVerifyError('');
      const extraInfo = (res as any).emailDeliveryFailed ? ' (⚠️ Внимание: SMTP сервер не настроен, код выведен в консоль сервера/логах)' : '';
      setRegVerifyMessage((res.message || 'Код подтверждения отправлен на вашу почту.') + extraInfo);
      setAuthView('register_verify');
    }
  };

  // Handle Registration Verification Code submit
  const handleRegisterCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegVerifyError('');
    clearError();

    if (!regVerifyCode || regVerifyCode.trim().length < 6) {
      setRegVerifyError('Введите 6-значный код подтверждения из письма.');
      return;
    }

    const res = await verifyRegistrationCode(regEmail, regVerifyCode);
    if (!res.success) {
      setRegVerifyError(res.error || 'Неверный или просроченный код подтверждения.');
    }
  };

  // Forgot Password Flow Handlers
  const handleForgotPasswordSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    clearError();

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Укажите корректный адрес электронной почты');
      return;
    }

    const res = await forgotPassword(forgotEmail);
    if (res.success) {
      setForgotStep('code');
      const extraInfo = (res as any).emailDeliveryFailed ? ' (⚠️ Внимание: SMTP сервер не настроен, код выведен в консоль сервера/логах)' : '';
      setForgotMessage((res.message || 'Инструкция отправлена.') + extraInfo);
      setResendTimer(60);
    } else {
      setForgotError(res.error || 'Ошибка при отправке запроса.');
    }
  };

  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    clearError();

    if (!forgotCode || forgotCode.trim().length < 6) {
      setForgotError('Введите 6-значный код подтверждения из письма.');
      return;
    }

    const res = await verifyCode(forgotEmail, forgotCode);
    if (res.success) {
      setForgotStep('new_password');
      setForgotMessage('Код подтвержден! Придумайте новый пароль.');
      setForgotError('');
    } else {
      setForgotError(res.error || 'Неверный или просроченный код подтверждения.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    clearError();

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError('Новый пароль должен содержать минимум 6 символов');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Пароли не совпадают');
      return;
    }

    const res = await resetPassword(forgotEmail, forgotCode, forgotNewPassword);
    if (res.success) {
      setForgotMessage('Пароль успешно изменен! Вы можете войти с новым паролем.');
      setForgotError('');
      setTimeout(() => {
        setAuthView('login_choice');
        setForgotStep('email');
        setLoginEmail(forgotEmail);
        setForgotMessage('');
      }, 2000);
    } else {
      setForgotError(res.error || 'Ошибка при сохранении нового пароля.');
    }
  };

  // Save specific edited field in Profile
  const handleSaveField = async (field: 'password' | 'birthDate' | 'address' | 'name') => {
    setProfileMsg('');
    setProfileErr('');

    if (field === 'password') {
      if (!oldPassword || !newPassword) {
        setProfileErr('Укажите старый и новый пароль');
        return;
      }
      if (newPassword.length < 6) {
        setProfileErr('Новый пароль должен состоять не менее чем из 6 символов');
        return;
      }
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setProfileMsg('Пароль успешно изменен!');
        setOldPassword('');
        setNewPassword('');
        setEditingField(null);
      } else {
        setProfileErr(res.error || 'Не удалось сменить пароль');
      }
      return;
    }

    const updateData: any = {};
    if (field === 'birthDate') {
      if (!isAtLeastMinAge(tempBirthDate)) {
        setProfileErr(MIN_AGE_ERROR_MESSAGE);
        return;
      }
      updateData.birthDate = tempBirthDate;
    }
    if (field === 'address') updateData.address = tempAddress;
    if (field === 'name') {
      updateData.firstName = tempFirstName;
      updateData.lastName = tempLastName;
    }

    const res = await updateProfile(updateData);
    if (res.success) {
      setProfileMsg('Профиль успешно обновлен!');
      setEditingField(null);
    } else {
      setProfileErr(res.error || 'Ошибка при обновлении профиля');
    }
  };

  // Function to create a sample demo order for easy testing
  const handleCreateDemoOrder = () => {
    const demoOrder: UserOrder = {
      id: `LC-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'В обработке',
      total: 12800,
      address: user?.address || 'г. Москва, ул. Арбат, дом 10',
      items: [
        {
          id: 101,
          title: 'плитник LOST CAMP FRAME',
          price: 12800,
          quantity: 1,
          image: tacticalOperator,
          selectedColor: 'мультикам',
        },
      ],
    };
    setUserOrders((prev) => [demoOrder, ...prev]);
    if (onAddOrder) {
      onAddOrder(demoOrder);
    }
  };

  // RENDER IF USER IS NOT LOGGED IN
  if (!isAuthenticated) {
    return (
      <div className="bg-white min-h-screen text-neutral-900 font-sans pb-24 pt-8 sm:pt-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {authView === 'login_choice' && (
            <AuthLoginChoice
              loginEmail={loginEmail}
              setLoginEmail={setLoginEmail}
              loginPassword={loginPassword}
              setLoginPassword={setLoginPassword}
              showLoginPassword={showLoginPassword}
              setShowLoginPassword={setShowLoginPassword}
              loginError={loginError}
              isLoading={isLoading}
              handleLoginSubmit={handleLoginSubmit}
              onForgotPasswordClick={() => {
                setForgotEmail(loginEmail);
                setForgotStep('email');
                setForgotError('');
                setForgotMessage('');
                setAuthView('forgot_password');
              }}
              onRegisterClick={() => setAuthView('register_form')}
            />
          )}

          {authView === 'forgot_password' && (
            <AuthForgotPassword
              forgotStep={forgotStep}
              setForgotStep={setForgotStep}
              forgotEmail={forgotEmail}
              setForgotEmail={setForgotEmail}
              forgotCode={forgotCode}
              setForgotCode={setForgotCode}
              forgotNewPassword={forgotNewPassword}
              setForgotNewPassword={setForgotNewPassword}
              forgotConfirmPassword={forgotConfirmPassword}
              setForgotConfirmPassword={setForgotConfirmPassword}
              forgotMessage={forgotMessage}
              forgotError={forgotError}
              resendTimer={resendTimer}
              isLoading={isLoading}
              handleForgotPasswordSend={handleForgotPasswordSend}
              handleVerifyCodeSubmit={handleVerifyCodeSubmit}
              handleResetPasswordSubmit={handleResetPasswordSubmit}
              onBackToLogin={() => setAuthView('login_choice')}
            />
          )}

          {authView === 'register_form' && (
            <AuthRegisterForm
              regEmail={regEmail}
              setRegEmail={setRegEmail}
              regPassword={regPassword}
              setRegPassword={setRegPassword}
              regConfirmPassword={regConfirmPassword}
              setRegConfirmPassword={setRegConfirmPassword}
              regFirstName={regFirstName}
              setRegFirstName={setRegFirstName}
              regLastName={regLastName}
              setRegLastName={setRegLastName}
              regBirthDate={regBirthDate}
              setRegBirthDate={setRegBirthDate}
              regAddress={regAddress}
              setRegAddress={setRegAddress}
              acceptAll={acceptAll}
              handleToggleAcceptAll={handleToggleAcceptAll}
              acceptPrivacy={acceptPrivacy}
              setAcceptPrivacy={setAcceptPrivacy}
              acceptTerms={acceptTerms}
              setAcceptTerms={setAcceptTerms}
              regError={regError}
              isLoading={isLoading}
              handleRegisterSubmit={handleRegisterSubmit}
              onBackToLogin={() => setAuthView('login_choice')}
              onNavigateToTerms={onNavigateToTerms}
              onNavigateToPrivacy={onNavigateToPrivacy}
            />
          )}

          {authView === 'register_verify' && (
            <div className="space-y-8 max-w-xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight text-center lowercase">
                подтверждение регистрации
              </h1>

              <div className="bg-[#f4f5f4] rounded-2xl p-6 sm:p-10 space-y-6 border border-neutral-200">
                {regVerifyError && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{regVerifyError}</span>
                  </div>
                )}

                {regVerifyMessage && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-xs text-emerald-900 leading-relaxed flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-700" />
                    <span>{regVerifyMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterCodeSubmit} className="space-y-4">
                  <div className="p-3 bg-white border border-neutral-200 rounded-lg space-y-1">
                    <p className="text-xs text-neutral-600">
                      Код отправлен на адрес <strong className="text-black font-mono">{regEmail}</strong>
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
                      value={regVerifyCode}
                      onChange={(e) => setRegVerifyCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-white border border-neutral-300 px-4 py-3 text-lg font-bold tracking-[6px] text-center text-[#2f4a35] focus:outline-none focus:border-black rounded-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthView('register_form')}
                      className="text-xs text-neutral-500 hover:text-black underline cursor-pointer"
                    >
                      ← назад к регистрации
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || regVerifyCode.length < 6}
                      className="bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs font-semibold uppercase tracking-wider py-3.5 px-8 transition-colors cursor-pointer rounded-xs disabled:opacity-50"
                    >
                      {isLoading ? 'проверка...' : 'подтвердить'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER LOGGED IN PERSONAL ACCOUNT
  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans pb-24 pt-8 sm:pt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <div className="lg:col-span-3 space-y-3">
            <button
              onClick={() => setProfileTab('orders')}
              className={`block w-full text-left text-sm transition-colors cursor-pointer ${
                profileTab === 'orders'
                  ? 'font-bold text-black'
                  : 'font-normal text-neutral-500 hover:text-black'
              }`}
            >
              заказы {userOrders.length > 0 && `(${userOrders.length})`}
            </button>

            <button
              onClick={() => setProfileTab('profile')}
              className={`block w-full text-left text-sm transition-colors cursor-pointer ${
                profileTab === 'profile'
                  ? 'font-bold text-black'
                  : 'font-normal text-neutral-500 hover:text-black'
              }`}
            >
              профиль
            </button>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-9">
            {profileTab === 'profile' && (
              <ProfileInfo
                user={user}
                isLoading={isLoading}
                profileMsg={profileMsg}
                profileErr={profileErr}
                editingField={editingField}
                setEditingField={setEditingField}
                tempFirstName={tempFirstName}
                setTempFirstName={setTempFirstName}
                tempLastName={tempLastName}
                setTempLastName={setTempLastName}
                tempBirthDate={tempBirthDate}
                setTempBirthDate={setTempBirthDate}
                tempAddress={tempAddress}
                setTempAddress={setTempAddress}
                oldPassword={oldPassword}
                setOldPassword={setOldPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                handleSaveField={handleSaveField}
                logout={logout}
              />
            )}

            {profileTab === 'orders' && (
              <ProfileOrders
                userOrders={userOrders}
                user={user}
                onNavigateToCatalog={onNavigateToCatalog}
                handleCreateDemoOrder={handleCreateDemoOrder}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
