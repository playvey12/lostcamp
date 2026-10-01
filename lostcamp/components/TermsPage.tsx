import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onClose?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onClose }) => {
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
            ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ (ПУБЛИЧНАЯ ОФЕРТА)
          </h1>
          <p className="text-xs text-neutral-500">
            г. Смоленск | Редакция от 21.07.2026<br />
            Настоящий документ является публичной офертой в соответствии со ст. 435 и ч. 2 ст. 437 Гражданского кодекса РФ.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-neutral-800 leading-relaxed font-normal">
          
          {/* SECTION 1 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              1. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ
            </h2>
            <p>1.1. <strong>Продавец</strong> — ООО «Импалл», ИНН 6700016960, ОГРН 1246700006310.</p>
            <p>1.2. <strong>Покупатель</strong> — любое физическое или юридическое лицо, оформившее заказ на сайте.</p>
            <p>1.3. <strong>Товар</strong> — тактическое снаряжение, одежда, оптика и иные изделия, представленные в каталоге.</p>
            <p>1.4. <strong>Дистанционный способ продажи</strong> — продажа товаров через интернет-сайт, исключающая возможность непосредственного ознакомления Покупателя с Товаром в момент заключения договора.</p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              2. ПРЕДМЕТ СОГЛАШЕНИЯ
            </h2>
            <p>2.1. Продавец обязуется передать Товар Покупателю, а Покупатель обязуется принять и оплатить его.</p>
            <p>2.2. Настоящее Соглашение распространяется на все виды Товаров и услуг, представленных на Сайте, пока такие предложения присутствуют в каталоге.</p>
            <p>2.3. Продавец гарантирует, что Товары, представленные на Сайте, находятся в свободном гражданском обороте на территории РФ и не являются огнестрельным оружием или боеприпасами.</p>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              3. ПРАВОВОЙ СТАТУС ТОВАРОВ И ОГРАНИЧЕНИЯ
            </h2>
            <p>3.1. Покупатель подтверждает, что ему исполнилось 18 лет.</p>
            <p>3.2. Некоторые категории товаров (например, конструктивно сходные с оружием изделия, макеты, определенные виды оптики) требуют ответственного обращения. Покупатель обязуется использовать их исключительно в законных целях (спорт, реконструкция, коллекционирование).</p>
            <p>3.3. Запрет на СТС: Продавец заявляет, что не осуществляет продажу специальных технических средств (СТС), предназначенных для негласного получения информации (скрытые камеры, жучки и т.д.), оборот которых ограничен ст. 138.1 УК РФ.</p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              4. ПОРЯДОК ОФОРМЛЕНИЯ ЗАКАЗА И ОПЛАТЫ
            </h2>
            <p>4.1. Договор розничной купли-продажи считается заключенным с момента выдачи Продавцом Покупателю кассового или товарного чека либо иного документа, подтверждающего оплату (согласно Постановлению Правительства РФ № 2463).</p>
            <p>4.2. Цена Товара указывается в рублях РФ. Продавец вправе изменить цену на Товар до момента подтверждения Заказа.</p>
            <p>4.3. Оплата осуществляется способами, предусмотренными интерфейсом Сайта.</p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              5. ДОСТАВКА ТОВАРА
            </h2>
            <p>5.1. Продавец приложит все усилия для соблюдения сроков доставки, однако задержки возможны ввиду непредвиденных обстоятельств или по вине транспортных компаний.</p>
            <p>5.2. При получении Товара Покупатель обязан осмотреть его и проверить на соответствие заявленному количеству, ассортименту и комплектности.</p>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              6. ВОЗВРАТ ТОВАРА И ДЕНЕЖНЫХ СРЕДСТВ
            </h2>
            <p>6.1. Дистанционный возврат: Покупатель вправе отказаться от Товара надлежащего качества в любое время до его передачи, а после передачи — в течение 7 дней (ст. 26.1 Закона РФ «О защите прав потребителей»).</p>
            <p>6.2. Возврат товара надлежащего качества возможен, если сохранены его товарный вид, потребительские свойства, а также документ, подтверждающий факт и условия покупки.</p>
            <p>6.3. При отказе Покупателя от Товара Продавец возвращает ему стоимость товара, за исключением расходов Продавца на доставку возвращенного товара, не позднее чем через 10 дней с даты предъявления требования.</p>
          </section>

          {/* SECTION 7 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              7. ОТВЕТСТВЕННОСТЬ СТОРОН
            </h2>
            <p>7.1. Продавец не несет ответственности за ущерб, причиненный Покупателю вследствие ненадлежащего использования Товаров, приобретенных на Сайте.</p>
            <p>7.2. Продавец не несет ответственности за точность и правильность информации, предоставляемой Покупателем при регистрации.</p>
            <p>7.3. Покупатель несет полную личную ответственность за соблюдение правил ношения и эксплуатации тактического оборудования в соответствии с КоАП РФ и УК РФ.</p>
          </section>

          {/* SECTION 8 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              8. ПЕРСОНАЛЬНЫЕ ДАННЫЕ
            </h2>
            <p>8.1. Обработка персональных данных осуществляется в соответствии с ФЗ № 152-ФЗ «О персональных данных».</p>
            <p>8.2. Оформляя заказ, Покупатель дает согласие на обработку своих данных для целей исполнения договора. Подробные условия изложены в Политике конфиденциальности, являющейся неотъемлемой частью настоящего Соглашения.</p>
          </section>

          {/* SECTION 9 */}
          <section className="space-y-2">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              9. РАЗРЕШЕНИЕ СПОРОВ
            </h2>
            <p>9.1. Все споры подлежат разрешению в досудебном (претензионном) порядке. Срок ответа на претензию — 10 рабочих дней.</p>
            <p>9.2. При невозможности достижения согласия спор передается на рассмотрение в суд в соответствии с действующим законодательством РФ.</p>
          </section>

          {/* SECTION 10 */}
          <section className="space-y-2 pt-4 border-t border-neutral-200">
            <h2 className="font-bold text-sm sm:text-base text-black uppercase">
              10. РЕКВИЗИТЫ ПРОДАВЦА
            </h2>
            <div className="space-y-1 text-xs text-neutral-700">
              <p><strong>Наименование:</strong> Общество с ограниченной ответственностью «Импалл»</p>
              <p><strong>ИНН / КПП:</strong> 6700016960 / 670001001</p>
              <p><strong>ОГРН:</strong> 1246700006310</p>
              <p><strong>Адрес:</strong> 214006; ул. Фрунзе, 44А, ком. 63; г. Смоленск; Смоленская область</p>
              <p><strong>Банковские реквизиты:</strong> Смоленское отделение №8609 ПАО «СБЕРБАНК»</p>
              <p><strong>БИК:</strong> 046614632</p>
              <p><strong>Расчетный счет:</strong> 40702810859000410165</p>
            </div>
          </section>

          {/* Bottom Close Button */}
          <div className="pt-8 flex justify-center">
            <button
              onClick={() => onClose?.()}
              className="px-8 py-3 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
            >
              Закрыть соглашение
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
