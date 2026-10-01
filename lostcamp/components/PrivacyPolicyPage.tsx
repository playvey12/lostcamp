import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onClose?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onClose }) => {
  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto space-y-8 relative">
        
        {/* Navigation & Close Controls Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
          <button
            onClick={() => onClose?.()}
            className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black">
            ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ И ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ
          </h1>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
          
          {/* SECTION 1 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              1. ОБЩИЕ ПОЛОЖЕНИЯ
            </h2>
            <p>
              1.1. Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с Федеральным законом РФ от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных Пользователей сайта LOST CAMP (далее — «Сайт») и меры по обеспечению их безопасности, предпринимаемые ООО «Импалл», ИНН 6700016960 (далее — «Оператор»).
            </p>
            <p>
              1.2. Использование Сайта, а равно предоставление Пользователем своих данных через формы на Сайте, означает безоговорочное согласие с настоящей Политикой.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              2. КАКИЕ ДАННЫЕ МЫ ОБРАБАТЫВАЕМ
            </h2>
            <p>Оператор может обрабатывать следующие персональные данные Пользователя:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Фамилия, Имя, Отчество;</li>
              <li>Адрес электронной почты (e-mail);</li>
              <li>Номер телефона;</li>
              <li>Адрес доставки Товара (индекс, город, улица, дом, квартира);</li>
              <li>Обезличенные данные о посетителях (в т.ч. файлы «cookie», IP-адрес, данные геолокации) с помощью сервисов интернет-статистики (Яндекс.Метрика и др.).</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              3. ЦЕЛИ ОБРАБОТКИ ПЕРСОНАЛЬНЫХ ДАННЫХ
            </h2>
            <p>Мы обрабатываем ваши данные исключительно для:</p>
            <p>3.1. Идентификации Пользователя для оформления заказа и заключения Договора купли-продажи дистанционным способом.</p>
            <p>3.2. Доставки Товара, обработки платежей и предоставления сервисной поддержки.</p>
            <p>3.3. Направления уведомлений о статусе заказа, ответов на запросы Пользователя.</p>
            <p>3.4. Предоставления Покупателю (с его согласия) обновлений продукции, специальных предложений и информации о новостях Сайта.</p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              4. ПРАВИЛА ОБРАБОТКИ И ПЕРЕДАЧИ ДАННЫХ ТРЕТЬИМ ЛИЦАМ
            </h2>
            <p>4.1. Обработка персональных данных осуществляется без ограничения срока любым законным способом (в том числе в информационных системах персональных данных с использованием средств автоматизации или без них).</p>
            <p>4.2. Персональные данные Пользователя могут быть переданы третьим лицам исключительно в целях исполнения заказа Пользователя:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Службам доставки и курьерским организациям (СДЭК, Почта России, Boxberry и др.) для транспортировки Товара.</li>
              <li>Банкам и платежным шлюзам для проведения оплаты заказа.</li>
            </ul>
            <p>4.3. В случае утраты или разглашения персональных данных Оператор информирует Пользователя совместно с Роскомнадзором в течение 24 часов с момента обнаружения инцидента.</p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              5. ПРАВА ПОЛЬЗОВАТЕЛЕЙ
            </h2>
            <p>Пользователь имеет право:</p>
            <p>5.1. Требовать от Оператора уточнения его персональных данных, их блокирования или уничтожения в случае, если данные являются неполными, устаревшими или неточными.</p>
            <p>5.2. Отозвать свое согласие на обработку персональных данных, направив письменное уведомление на электронную почту Оператора: info@lostcamp.ru с пометкой «Отзыв согласия на обработку персональных данных».</p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              6. БЕЗОПАСНОСТЬ ДАННЫХ
            </h2>
            <p>Оператор принимает необходимые организационные и технические меры для защиты персональной информации Пользователя от неправомерного или случайного доступа, уничтожения, изменения, блокирования, копирования, распространения третьими лицами.</p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              7. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ
            </h2>
            <p>7.1. Политика действует бессрочно до замены ее новой версией.</p>
            <p>7.2. Актуальная версия Политики в свободном доступе расположена в сети Интернет на Сайте.</p>
          </section>

          {/* Bottom Close Button */}
          <div className="pt-8 flex justify-center border-t border-neutral-200">
            <button
              onClick={() => onClose?.()}
              className="px-8 py-3 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
            >
              Закрыть политику
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
