import { LOCALE, type Locale } from './locale';

export interface PromoCopy {
  panelEyebrow: string;
  shots: Record<'popup' | 'overlay' | 'providers' | 'badge' | 'privacy', ShotCopy>;
  marquee: { sub: [string, string] };
  tile: { sub: string };
  highlights: {
    title: string;
    items: Array<{ title: string; body: string }>;
  };
}

interface ShotCopy {
  eyebrow: string;
  sub: [string, string];
}

export const BRAND = 'AI Usage Tracker';

export const HEADLINE: [string, string] = ['AI Usage', 'Tracker'];

export const PROVIDER_HOSTS: Record<string, string> = {
  claude: 'claude.ai',
  codex: 'chatgpt.com',
  minimax: 'platform.minimax.io',
  kimi: 'kimi.com',
  cursor: 'cursor.com',
  mimo: 'platform.xiaomimimo.com',
};

const TRANSLATIONS: Record<Locale, PromoCopy> = {
  en: {
    panelEyebrow: 'AI Capacity',
    shots: {
      popup: {
        eyebrow: 'One popup',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'and Xiaomi MiMo, all on one screen.'],
      },
      overlay: {
        eyebrow: 'On-page overlay',
        sub: ['Session and weekly limits right next', 'to the chat input on Claude and ChatGPT.'],
      },
      providers: {
        eyebrow: 'Your setup',
        sub: ['Choose providers, layout, and exactly', 'which details each card shows.'],
      },
      badge: {
        eyebrow: 'Badge & overlays',
        sub: ['The toolbar icon follows your highest', 'usage in 10% steps — no popup needed.'],
      },
      privacy: {
        eyebrow: 'No setup',
        sub: ['No API keys, no logins, no servers.', 'Everything stays in your browser.'],
      },
    },
    marquee: {
      sub: [
        'Six providers, one popup: session & weekly limits,',
        'toolbar badge, on-page overlays, and full control.',
      ],
    },
    tile: { sub: 'Six providers. One popup.' },
    highlights: {
      title: 'Six providers, zero setup',
      items: [
        {
          title: 'No API keys, no extra logins',
          body: 'Reads the sessions your browser is already signed in to.',
        },
        {
          title: 'Nothing leaves your browser',
          body: 'No servers, no accounts, no telemetry — all data stays local.',
        },
        {
          title: 'Refreshes itself every 5 minutes',
          body: 'Background sync keeps the popup, badge, and overlays current.',
        },
      ],
    },
  },

  de: {
    panelEyebrow: 'KI-Kapazität',
    shots: {
      popup: {
        eyebrow: 'Ein Popup',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'und Xiaomi MiMo auf einem Bildschirm.'],
      },
      overlay: {
        eyebrow: 'Overlay auf der Seite',
        sub: ['Sitzungs- und Wochenlimits direkt neben', 'dem Eingabefeld in Claude und ChatGPT.'],
      },
      providers: {
        eyebrow: 'Eigene Einstellungen',
        sub: ['Anbieter, Layout und genau die Details', 'wählen, die jede Karte anzeigt.'],
      },
      badge: {
        eyebrow: 'Symbol & Overlays',
        sub: ['Das Symbol folgt dem höchsten Verbrauch', 'in 10-%-Schritten — ganz ohne Popup.'],
      },
      privacy: {
        eyebrow: 'Keine Einrichtung',
        sub: ['Keine API-Schlüssel, Logins oder Server.', 'Alles bleibt im Browser.'],
      },
    },
    marquee: {
      sub: [
        'Sechs Anbieter, ein Popup: Sitzungs- und Wochenlimits,',
        'Symbolbereich, Overlays und volle Kontrolle.',
      ],
    },
    tile: { sub: 'Sechs Anbieter. Ein Popup.' },
    highlights: {
      title: 'Sechs Anbieter, null Einrichtung',
      items: [
        {
          title: 'Keine API-Schlüssel, keine Logins',
          body: 'Liest die Sitzungen, in denen der Browser bereits angemeldet ist.',
        },
        {
          title: 'Nichts verlässt den Browser',
          body: 'Keine Server, keine Konten, keine Telemetrie — alles bleibt lokal.',
        },
        {
          title: 'Aktualisiert sich alle 5 Minuten',
          body: 'Die Hintergrundsynchronisierung hält Popup, Symbol und Overlays aktuell.',
        },
      ],
    },
  },

  es: {
    panelEyebrow: 'Capacidad de IA',
    shots: {
      popup: {
        eyebrow: 'Un solo popup',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'y Xiaomi MiMo en una sola pantalla.'],
      },
      overlay: {
        eyebrow: 'Superposición en la página',
        sub: ['Límites de sesión y semanales junto', 'al campo de mensaje en Claude y ChatGPT.'],
      },
      providers: {
        eyebrow: 'Tu configuración',
        sub: ['Elige proveedores, diseño y qué', 'detalles muestra cada tarjeta.'],
      },
      badge: {
        eyebrow: 'Icono y superposiciones',
        sub: ['El icono sigue tu mayor consumo', 'en pasos del 10 %, sin abrir el popup.'],
      },
      privacy: {
        eyebrow: 'Sin configurar nada',
        sub: ['Sin claves de API, sin sesiones nuevas.', 'Todo se queda en tu navegador.'],
      },
    },
    marquee: {
      sub: [
        'Seis proveedores, un popup: límites de sesión y semana,',
        'icono en la barra, superposiciones y control total.',
      ],
    },
    tile: { sub: 'Seis proveedores. Un popup.' },
    highlights: {
      title: 'Seis proveedores, cero configuración',
      items: [
        {
          title: 'Sin claves de API ni inicios de sesión',
          body: 'Lee las sesiones en las que tu navegador ya está autenticado.',
        },
        {
          title: 'Nada sale de tu navegador',
          body: 'Sin servidores, sin cuentas, sin telemetría: todo es local.',
        },
        {
          title: 'Se actualiza cada 5 minutos',
          body: 'La sincronización en segundo plano mantiene todo al día.',
        },
      ],
    },
  },

  fr: {
    panelEyebrow: 'Capacité IA',
    shots: {
      popup: {
        eyebrow: 'Un seul popup',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'et Xiaomi MiMo sur un seul écran.'],
      },
      overlay: {
        eyebrow: 'Surcouche sur la page',
        sub: ['Limites de session et hebdomadaires', 'à côté du champ de message.'],
      },
      providers: {
        eyebrow: 'Votre configuration',
        sub: ['Choisissez les fournisseurs, la disposition', 'et les détails affichés par carte.'],
      },
      badge: {
        eyebrow: 'Icône et surcouches',
        sub: ['L’icône suit votre consommation la plus', 'élevée par paliers de 10 %.'],
      },
      privacy: {
        eyebrow: 'Aucune installation',
        sub: ['Ni clé d’API, ni connexion, ni serveur.', 'Tout reste dans votre navigateur.'],
      },
    },
    marquee: {
      sub: [
        'Six fournisseurs, un popup : limites de session et de semaine,',
        'icône, surcouches sur la page et contrôle total.',
      ],
    },
    tile: { sub: 'Six fournisseurs. Un popup.' },
    highlights: {
      title: 'Six fournisseurs, zéro configuration',
      items: [
        {
          title: 'Ni clé d’API, ni connexion supplémentaire',
          body: 'Lit les sessions auxquelles votre navigateur est déjà connecté.',
        },
        {
          title: 'Rien ne quitte votre navigateur',
          body: 'Aucun serveur, aucun compte, aucune télémétrie : tout reste local.',
        },
        {
          title: 'Se rafraîchit toutes les 5 minutes',
          body: 'La synchronisation en arrière-plan garde tout à jour.',
        },
      ],
    },
  },

  hi: {
    panelEyebrow: 'AI क्षमता',
    shots: {
      popup: {
        eyebrow: 'एक ही पॉपअप',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'और Xiaomi MiMo — सब एक स्क्रीन पर।'],
      },
      overlay: {
        eyebrow: 'पेज पर ओवरले',
        sub: ['सत्र और साप्ताहिक लिमिट सीधे', 'Claude और ChatGPT के मैसेज बॉक्स के पास।'],
      },
      providers: {
        eyebrow: 'आपकी सेटिंग',
        sub: ['प्रोवाइडर, लेआउट और हर कार्ड के', 'विवरण खुद चुनें।'],
      },
      badge: {
        eyebrow: 'आइकन और ओवरले',
        sub: ['टूलबार आइकन सबसे ज़्यादा उपयोग को', '10% के चरणों में दिखाता है।'],
      },
      privacy: {
        eyebrow: 'कोई सेटअप नहीं',
        sub: ['न API की, न लॉगिन, न सर्वर।', 'सब कुछ आपके ब्राउज़र में रहता है।'],
      },
    },
    marquee: {
      sub: [
        'छह प्रोवाइडर, एक पॉपअप: सत्र और साप्ताहिक लिमिट,',
        'टूलबार आइकन, पेज ओवरले और पूरा नियंत्रण।',
      ],
    },
    tile: { sub: 'छह प्रोवाइडर। एक पॉपअप।' },
    highlights: {
      title: 'छह प्रोवाइडर, ज़ीरो सेटअप',
      items: [
        {
          title: 'न API की, न अलग लॉगिन',
          body: 'ब्राउज़र जिन सत्रों में पहले से साइन इन है, उन्हीं को पढ़ता है।',
        },
        {
          title: 'कुछ भी ब्राउज़र से बाहर नहीं जाता',
          body: 'न सर्वर, न अकाउंट, न टेलीमेट्री — सारा डेटा लोकल रहता है।',
        },
        {
          title: 'हर 5 मिनट में खुद अपडेट',
          body: 'बैकग्राउंड सिंक पॉपअप, आइकन और ओवरले को ताज़ा रखता है।',
        },
      ],
    },
  },

  it: {
    panelEyebrow: 'Capacità IA',
    shots: {
      popup: {
        eyebrow: 'Un solo popup',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'e Xiaomi MiMo in un’unica schermata.'],
      },
      overlay: {
        eyebrow: 'Overlay nella pagina',
        sub: ['Limiti di sessione e settimanali accanto', 'al campo del messaggio.'],
      },
      providers: {
        eyebrow: 'La tua configurazione',
        sub: ['Scegli provider, layout e quali', 'dettagli mostra ogni scheda.'],
      },
      badge: {
        eyebrow: 'Icona e overlay',
        sub: ['L’icona segue il consumo più alto', 'a passi del 10%, senza aprire il popup.'],
      },
      privacy: {
        eyebrow: 'Nessuna configurazione',
        sub: ['Nessuna chiave API, nessun login, nessun server.', 'Tutto resta nel browser.'],
      },
    },
    marquee: {
      sub: [
        'Sei provider, un popup: limiti di sessione e settimana,',
        'icona nella barra, overlay nella pagina e pieno controllo.',
      ],
    },
    tile: { sub: 'Sei provider. Un popup.' },
    highlights: {
      title: 'Sei provider, zero configurazione',
      items: [
        {
          title: 'Nessuna chiave API, nessun login',
          body: 'Legge le sessioni a cui il browser ha già effettuato l’accesso.',
        },
        {
          title: 'Niente esce dal browser',
          body: 'Nessun server, nessun account, nessuna telemetria: tutto resta locale.',
        },
        {
          title: 'Si aggiorna ogni 5 minuti',
          body: 'La sincronizzazione in background tiene tutto aggiornato.',
        },
      ],
    },
  },

  ja: {
    panelEyebrow: 'AI 使用容量',
    shots: {
      popup: {
        eyebrow: 'ひとつのポップアップ',
        sub: ['Claude、Codex、MiniMax、Kimi、Cursor、', 'Xiaomi MiMo を 1 画面でまとめて確認。'],
      },
      overlay: {
        eyebrow: 'ページ内オーバーレイ',
        sub: ['Claude と ChatGPT の入力欄のすぐ横に', 'セッションと週間の残量を表示。'],
      },
      providers: {
        eyebrow: '自分好みの設定',
        sub: ['プロバイダー、レイアウト、カードに', '表示する項目を自由に選択。'],
      },
      badge: {
        eyebrow: 'アイコンとオーバーレイ',
        sub: ['ツールバーのアイコンが最大使用率を', '10% 刻みで表示。ポップアップ不要。'],
      },
      privacy: {
        eyebrow: 'セットアップ不要',
        sub: ['API キーもログインもサーバーも不要。', 'データはブラウザの中だけ。'],
      },
    },
    marquee: {
      sub: [
        '6 つのプロバイダーをひとつのポップアップに。セッションと',
        '週間の残量、アイコン表示、ページ内オーバーレイ。',
      ],
    },
    tile: { sub: '6 プロバイダー、1 ポップアップ。' },
    highlights: {
      title: '6 プロバイダー、セットアップ不要',
      items: [
        {
          title: 'API キーも追加ログインも不要',
          body: 'ブラウザでログイン済みのセッションをそのまま読み取ります。',
        },
        {
          title: 'データはブラウザの外に出ません',
          body: 'サーバーもアカウントもテレメトリもなし。すべてローカルで完結。',
        },
        {
          title: '5 分ごとに自動更新',
          body: 'バックグラウンド同期がポップアップ・アイコン・オーバーレイを最新に保ちます。',
        },
      ],
    },
  },

  pt_BR: {
    panelEyebrow: 'Capacidade de IA',
    shots: {
      popup: {
        eyebrow: 'Um único popup',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'e Xiaomi MiMo em uma só tela.'],
      },
      overlay: {
        eyebrow: 'Sobreposição na página',
        sub: ['Limites de sessão e semanais ao lado', 'do campo de mensagem.'],
      },
      providers: {
        eyebrow: 'Do seu jeito',
        sub: ['Escolha provedores, layout e quais', 'detalhes cada cartão mostra.'],
      },
      badge: {
        eyebrow: 'Ícone e sobreposições',
        sub: ['O ícone acompanha o maior consumo', 'em faixas de 10%, sem abrir o popup.'],
      },
      privacy: {
        eyebrow: 'Sem configuração',
        sub: ['Sem chaves de API, logins ou servidores.', 'Tudo fica no seu navegador.'],
      },
    },
    marquee: {
      sub: [
        'Seis provedores, um popup: limites de sessão e semana,',
        'ícone na barra, sobreposições e controle total.',
      ],
    },
    tile: { sub: 'Seis provedores. Um popup.' },
    highlights: {
      title: 'Seis provedores, zero configuração',
      items: [
        {
          title: 'Sem chaves de API, sem logins extras',
          body: 'Lê as sessões em que o seu navegador já está conectado.',
        },
        {
          title: 'Nada sai do seu navegador',
          body: 'Sem servidores, sem contas, sem telemetria — tudo fica local.',
        },
        {
          title: 'Atualiza sozinho a cada 5 minutos',
          body: 'A sincronização em segundo plano mantém tudo em dia.',
        },
      ],
    },
  },

  ru: {
    panelEyebrow: 'Лимиты ИИ',
    shots: {
      popup: {
        eyebrow: 'Один попап',
        sub: ['Claude, Codex, MiniMax, Kimi, Cursor', 'и Xiaomi MiMo — всё на одном экране.'],
      },
      overlay: {
        eyebrow: 'Оверлей на странице',
        sub: ['Лимиты сессии и недели прямо рядом', 'с полем ввода в Claude и ChatGPT.'],
      },
      providers: {
        eyebrow: 'Ваши настройки',
        sub: ['Выберите провайдеров, раскладку и то,', 'какие детали показывает карточка.'],
      },
      badge: {
        eyebrow: 'Значок и оверлеи',
        sub: ['Значок на панели показывает максимум', 'расхода с шагом 10% — без попапа.'],
      },
      privacy: {
        eyebrow: 'Без настройки',
        sub: ['Ни API-ключей, ни входов, ни серверов.', 'Все данные остаются в браузере.'],
      },
    },
    marquee: {
      sub: [
        'Шесть провайдеров в одном попапе: лимиты сессии и недели,',
        'значок на панели, оверлеи на страницах и полный контроль.',
      ],
    },
    tile: { sub: 'Шесть провайдеров. Один попап.' },
    highlights: {
      title: 'Шесть провайдеров, ноль настройки',
      items: [
        {
          title: 'Без API-ключей и лишних входов',
          body: 'Читает те сессии, в которые браузер уже вошёл.',
        },
        {
          title: 'Ничего не покидает браузер',
          body: 'Ни серверов, ни аккаунтов, ни телеметрии — все данные локальны.',
        },
        {
          title: 'Обновляется каждые 5 минут',
          body: 'Фоновая синхронизация держит попап, значок и оверлеи в актуальном виде.',
        },
      ],
    },
  },

  zh_CN: {
    panelEyebrow: 'AI 用量',
    shots: {
      popup: {
        eyebrow: '一个弹窗',
        sub: ['Claude、Codex、MiniMax、Kimi、Cursor', '和 Xiaomi MiMo，全在一屏之内。'],
      },
      overlay: {
        eyebrow: '页面内浮层',
        sub: ['在 Claude 和 ChatGPT 的输入框旁边', '直接查看会话与每周用量。'],
      },
      providers: {
        eyebrow: '按需设置',
        sub: ['自由选择服务商、布局，以及', '每张卡片显示哪些细节。'],
      },
      badge: {
        eyebrow: '图标与浮层',
        sub: ['工具栏图标按 10% 区间跟随最高用量，', '不用打开弹窗也能看见。'],
      },
      privacy: {
        eyebrow: '无需配置',
        sub: ['无需 API 密钥、无需登录、无需服务器。', '所有数据都留在浏览器里。'],
      },
    },
    marquee: {
      sub: ['六家服务商，一个弹窗：会话与每周用量、', '工具栏图标、页面浮层，一切由你掌控。'],
    },
    tile: { sub: '六家服务商，一个弹窗。' },
    highlights: {
      title: '六家服务商，零配置',
      items: [
        {
          title: '无需 API 密钥和额外登录',
          body: '直接读取浏览器中已登录的会话。',
        },
        {
          title: '数据不离开浏览器',
          body: '没有服务器、没有账号、没有遥测，全部本地处理。',
        },
        {
          title: '每 5 分钟自动刷新',
          body: '后台同步让弹窗、图标和浮层始终保持最新。',
        },
      ],
    },
  },
};

export const COPY: PromoCopy = TRANSLATIONS[LOCALE];
