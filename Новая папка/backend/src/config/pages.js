export const pages = {
  legal: {
    en: {
      title: 'Legal',
      subtitle: 'Terms, privacy and refunds.',
      sections: [
        { heading: 'User Agreement', body: 'Using Maven means you agree to follow platform rules and not redistribute private binaries or credentials.' },
        { heading: 'Privacy Policy', body: 'We store only required account data, support messages, and security-related logs for service stability.' },
        { heading: 'Refund Policy', body: 'Refund requests are reviewed by support within 48 hours and processed according to usage history.' }
      ]
    },
    ru: {
      title: 'Правовая информация',
      subtitle: 'Условия использования, приватность и возвраты.',
      sections: [
        { heading: 'Пользовательское соглашение', body: 'Используя Maven, вы соглашаетесь соблюдать правила платформы и не распространять приватные сборки или учетные данные.' },
        { heading: 'Политика конфиденциальности', body: 'Мы храним только необходимые данные аккаунта, обращения в поддержку и системные журналы для стабильной работы сервиса.' },
        { heading: 'Политика возвратов', body: 'Запросы на возврат рассматриваются поддержкой в течение 48 часов согласно истории использования.' }
      ]
    }
  },
  purchase: {
    usdRate: 90,
    en: {
      title: 'Purchase',
      subtitle: 'Choose your Maven plan.',
      plans: [
        { id: 'days-30', name: '30 Days', rubPrice: 200, features: ['30-day access period'] },
        { id: 'days-90', name: '90 Days', rubPrice: 400, features: ['90-day access period'] },
        { id: 'lifetime', name: 'LifeTime', rubPrice: 600, features: ['Unlimited duration access'] },
        { id: 'hwid-reset', name: 'HWID Reset', rubPrice: 150, features: ['Single hardware reset operation'] },
        { id: 'beta-access', name: 'Beta Access', rubPrice: 500, features: ['Access to beta updates and previews'] }
      ]
    },
    ru: {
      title: 'Покупка',
      subtitle: 'Выберите подходящий продукт Maven.',
      plans: [
        { id: 'days-30', name: '30 Days', rubPrice: 200, features: ['Доступ на 30 дней'] },
        { id: 'days-90', name: '90 Days', rubPrice: 400, features: ['Доступ на 90 дней'] },
        { id: 'lifetime', name: 'LifeTime', rubPrice: 600, features: ['Доступ без ограничения срока'] },
        { id: 'hwid-reset', name: 'HWID Reset', rubPrice: 150, features: ['Единоразовый сброс HWID'] },
        { id: 'beta-access', name: 'Beta Access', rubPrice: 500, features: ['Доступ к бета-версиям и предпросмотрам'] }
      ]
    }
  },
  support: {
    en: {
      title: 'Support',
      subtitle: 'Need help? Send a request to the team.',
      channels: [
        { name: 'Discord', details: 'Fast answers from moderators and power users.' },
        { name: 'Email', details: 'Structured ticket answers within 24-48 hours.' },
        { name: 'Knowledge Base', details: 'Setup, troubleshooting, and update guides.' }
      ]
    },
    ru: {
      title: 'Поддержка',
      subtitle: 'Нужна помощь? Отправьте запрос в команду.',
      channels: [
        { name: 'Discord', details: 'Быстрые ответы от модераторов и опытных пользователей.' },
        { name: 'Email', details: 'Структурированные ответы по тикетам в течение 24-48 часов.' },
        { name: 'База знаний', details: 'Гайды по установке, диагностике и обновлениям.' }
      ]
    }
  }
};
