import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusTier =
  | "shadow" | "throne" | "balance" | "god" | "architect" | "dev"
  | "legendary" | "ultraRare" | "rare" | "common";

type Section = "chats" | "contacts" | "archive" | "notifications" | "profile" | "settings";

interface User {
  id: string;
  name: string;
  nick: string;
  avatar: string;
  status: StatusTier;
  online: boolean;
  links: number;
  level: number;
  achievements: number;
}

interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
  encrypted: boolean;
  own: boolean;
}

interface Chat {
  id: string;
  name: string;
  type: "private" | "group";
  lastMsg: string;
  time: string;
  unread: number;
  archived?: boolean;
  messages: Message[];
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: string;
  level: number;
  reward: number;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "achievement" | "status" | "links" | "system";
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATUS_META: Record<StatusTier, { label: string; slots: string; badgeClass: string; icon: string; code: string }> = {
  shadow:    { label: "Тень",               slots: "3 слота",  badgeClass: "badge-shadow",    icon: "Ghost",        code: "/shadow_activate SH4D0W_RUL3R_777" },
  throne:    { label: "Хранитель Престола", slots: "1 слот",   badgeClass: "badge-throne",    icon: "Crown",        code: "/throne_keeper_activate PRESTOL_777" },
  balance:   { label: "Страж Баланса",      slots: "1 слот",   badgeClass: "badge-balance",   icon: "Scale",        code: "/balance_warden_activate EQUILIBRIUM_777" },
  god:       { label: "Бог",                slots: "1 слот",   badgeClass: "badge-god",       icon: "Zap",          code: "/god_activate 777777777777" },
  architect: { label: "Архитектор",         slots: "1 слот",   badgeClass: "badge-architect", icon: "Cpu",          code: "/system_architect_activate ARCHITECT_777" },
  dev:       { label: "Разраб",             slots: "до 50",    badgeClass: "badge-dev",       icon: "Code",         code: "/dev_activate [код от администрации]" },
  legendary: { label: "Легендарный",        slots: "200 чел.", badgeClass: "badge-god",       icon: "Star",         code: "" },
  ultraRare: { label: "Сверхредкий",        slots: "∞",        badgeClass: "badge-shadow",    icon: "Sparkles",     code: "" },
  rare:      { label: "Редкий",             slots: "∞",        badgeClass: "badge-throne",    icon: "Award",        code: "" },
  common:    { label: "Обычный",            slots: "∞",        badgeClass: "badge-user",      icon: "User",         code: "" },
};

const ME: User = {
  id: "me", name: "Александр Ким", nick: "alex_kim", avatar: "АК",
  status: "dev", online: true, links: 1240, level: 34, achievements: 17,
};

const CONTACTS: User[] = [
  { id: "u1", name: "Игорь Тень",      nick: "igor_sh",   avatar: "ИТ", status: "shadow",    online: true,  links: 8800, level: 78, achievements: 94 },
  { id: "u2", name: "Мария Богова",    nick: "maria_god", avatar: "МБ", status: "god",       online: false, links: 5500, level: 66, achievements: 72 },
  { id: "u3", name: "Дмитрий Кратос", nick: "d_kratos",  avatar: "ДК", status: "throne",    online: true,  links: 3200, level: 55, achievements: 51 },
  { id: "u4", name: "Анна Баланс",    nick: "anna_b",    avatar: "АБ", status: "balance",   online: true,  links: 2900, level: 48, achievements: 43 },
  { id: "u5", name: "Сергей Арх",     nick: "s_arch",    avatar: "СА", status: "architect", online: false, links: 4100, level: 61, achievements: 68 },
  { id: "u6", name: "Лена Редкая",    nick: "lena_r",    avatar: "ЛР", status: "rare",      online: true,  links: 890,  level: 28, achievements: 22 },
  { id: "u7", name: "Паша Девелопер", nick: "pasha_dev", avatar: "ПД", status: "dev",       online: true,  links: 1100, level: 36, achievements: 19 },
  { id: "u8", name: "Оля Новая",      nick: "olya_n",    avatar: "ОН", status: "common",    online: false, links: 120,  level: 5,  achievements: 3  },
];

const INITIAL_CHATS: Chat[] = [
  {
    id: "c1", name: "Игорь Тень", type: "private",
    lastMsg: "Проект готов. Ждём релиза.", time: "14:32", unread: 2, archived: false,
    messages: [
      { id: "m1", from: "Игорь Тень", text: "Привет! Как дела с задачей?",             time: "14:10", encrypted: true, own: false },
      { id: "m2", from: "me",         text: "Всё идёт по плану, закончу к вечеру.",    time: "14:15", encrypted: true, own: true  },
      { id: "m3", from: "Игорь Тень", text: "Отлично. Проект готов. Ждём релиза.",     time: "14:32", encrypted: true, own: false },
    ],
  },
  {
    id: "c2", name: "Команда Архитекторов", type: "group",
    lastMsg: "Новая версия API задеплоена", time: "13:55", unread: 5, archived: false,
    messages: [
      { id: "m4", from: "Сергей Арх",     text: "Подготовил документацию по новому модулю.", time: "13:40", encrypted: true, own: false },
      { id: "m5", from: "Паша Девелопер", text: "Тесты прошли успешно.",                     time: "13:50", encrypted: true, own: false },
      { id: "m6", from: "me",             text: "Прекрасно, деплоим?",                        time: "13:52", encrypted: true, own: true  },
      { id: "m7", from: "Сергей Арх",     text: "Новая версия API задеплоена.",               time: "13:55", encrypted: true, own: false },
    ],
  },
  {
    id: "c3", name: "Мария Богова", type: "private",
    lastMsg: "Статус «Бог» подтверждён", time: "11:20", unread: 0, archived: false,
    messages: [
      { id: "m8",  from: "Мария Богова", text: "Привет, есть вопрос по системе ачивок.", time: "11:10", encrypted: true, own: false },
      { id: "m9",  from: "me",           text: "Конечно, слушаю.",                        time: "11:14", encrypted: true, own: true  },
      { id: "m10", from: "Мария Богова", text: "Статус «Бог» подтверждён, спасибо!",     time: "11:20", encrypted: true, own: false },
    ],
  },
  {
    id: "c4", name: "Тронный Зал", type: "group",
    lastMsg: "Заседание в 18:00", time: "вчера", unread: 0, archived: false,
    messages: [
      { id: "m11", from: "Дмитрий Кратос", text: "Заседание перенесено на 18:00.", time: "вчера", encrypted: true, own: false },
    ],
  },
  {
    id: "c5", name: "Старый проект", type: "group",
    lastMsg: "Архив закрыт", time: "2 нед.", unread: 0, archived: true,
    messages: [
      { id: "m12", from: "Система", text: "Архив закрыт.", time: "2 нед.", encrypted: false, own: false },
    ],
  },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", title: "Теневой Страж",       desc: "1000 часов в сети",         icon: "Ghost",         category: "Теневой Престол",          level: 3, reward: 150 },
  { id: "a2", title: "Первый Разраб",        desc: "Создал первого бота",       icon: "Code",          category: "Технический Гений",         level: 1, reward: 50  },
  { id: "a3", title: "Строитель сообщества", desc: "Пригласил 10 пользователей",icon: "Users",         category: "Сообщество и Развитие",     level: 2, reward: 80  },
  { id: "a4", title: "Голос Системы",        desc: "Участвовал в 5 голосованиях",icon: "Vote",         category: "Божественное Вмешательство",level: 2, reward: 70  },
  { id: "a5", title: "Легенда Чата",         desc: "10 000 сообщений",          icon: "MessageSquare", category: "Сообщество и Развитие",     level: 4, reward: 200 },
];

const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Новое достижение!",      body: "Вы получили «Легенда Чата» — уровень 4",   time: "10 мин",  read: false, type: "achievement" },
  { id: "n2", title: "Получено 50 ₾",          body: "Бонус за приглашение olya_n",              time: "1 час",   read: false, type: "links"       },
  { id: "n3", title: "Статус обновлён",         body: "Уровень 34 → «Редкий» (60 дней)",         time: "3 часа",  read: true,  type: "status"      },
  { id: "n4", title: "Резервная копия создана", body: "Данные сохранены в 06:00",                time: "сегодня", read: true,  type: "system"      },
];

const COMMANDS = [
  { cmd: "/my_status",                desc: "Статус и прогресс"          },
  { cmd: "/my_achievements",          desc: "Мои ачивки"                 },
  { cmd: "/leaderboard_achievements", desc: "Таблица лидеров"            },
  { cmd: "/my_stats",                 desc: "Статистика активности"      },
  { cmd: "/event_calendar",           desc: "Календарь событий"          },
  { cmd: "/my_links",                 desc: "Баланс Линков (₾)"          },
  { cmd: "/report",                   desc: "Жалоба на пользователя"     },
  { cmd: "/privacy_settings",         desc: "Настройки видимости"        },
  { cmd: "/shadow_queue",             desc: "Очередь на «Тень»"          },
  { cmd: "/generate_dev_code",        desc: "Код для Разработчика"       },
];

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

function StatusBadge({ status, small }: { status: StatusTier; small?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono font-medium ${meta.badgeClass}`}
      style={{ fontSize: small ? "10px" : "11px" }}>
      <Icon name={meta.icon} size={small ? 9 : 11} />
      {meta.label}
    </span>
  );
}

function AvatarEl({ initials, online, size = "md" }: { initials: string; online?: boolean; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-full bg-navy-light border border-border flex items-center justify-center font-semibold text-gold`}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${online ? "bg-green-500" : "bg-gray-600"}`} />
      )}
    </div>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

const NAV: { id: Section; icon: string; label: string }[] = [
  { id: "chats",         icon: "MessageSquare", label: "Чаты"        },
  { id: "contacts",      icon: "Users",         label: "Контакты"    },
  { id: "archive",       icon: "Archive",       label: "Архив"       },
  { id: "notifications", icon: "Bell",          label: "Уведомления" },
  { id: "profile",       icon: "UserCircle",    label: "Профиль"     },
  { id: "settings",      icon: "Settings",      label: "Настройки"   },
];

function NavBar({ section, onSection, unread }: { section: Section; onSection: (s: Section) => void; unread: number }) {
  return (
    <div className="w-16 flex flex-col items-center py-4 gap-1 bg-navy border-r border-border flex-shrink-0">
      <div className="mb-4">
        <div className="w-9 h-9 rounded-lg bg-navy-light border border-border flex items-center justify-center glow-gold">
          <span className="text-gold font-bold text-sm font-mono">LU</span>
        </div>
      </div>
      {NAV.map(item => (
        <button key={item.id} onClick={() => onSection(item.id)} title={item.label}
          className={`relative w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-150
            ${section === item.id ? "bg-navy-light text-gold border border-border" : "text-muted-foreground hover:text-foreground hover:bg-navy-mid"}`}>
          <Icon name={item.icon} size={20} />
          {item.id === "notifications" && unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center font-bold">
              {unread}
            </span>
          )}
        </button>
      ))}
      <div className="mt-auto w-9 h-9 rounded-full bg-navy-light border border-border flex items-center justify-center text-gold text-xs font-semibold">
        {ME.avatar}
      </div>
    </div>
  );
}

// ─── Chat List ────────────────────────────────────────────────────────────────

function ChatList({ chats, activeId, onSelect, archived }: { chats: Chat[]; activeId: string | null; onSelect: (id: string) => void; archived: boolean }) {
  const list = chats.filter(c => !!c.archived === archived);
  return (
    <div className="flex-1 overflow-y-auto">
      {list.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground text-sm">Нет чатов</p>
        </div>
      )}
      {list.map(c => (
        <button key={c.id} onClick={() => onSelect(c.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border transition-all duration-150
            ${activeId === c.id ? "bg-navy-light border-l-2 border-l-gold" : "hover:bg-navy-mid"}`}>
          <div className="w-10 h-10 rounded-full bg-navy-light border border-border flex items-center justify-center text-sm font-semibold text-gold flex-shrink-0">
            {c.type === "group" ? <Icon name="Users" size={17} /> : c.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{c.time}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Icon name="Lock" size={9} className="opacity-40 flex-shrink-0" />{c.lastMsg}
              </span>
              {c.unread > 0 && (
                <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {c.unread}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────

function ChatWindow({ chat, onSend }: { chat: Chat; onSend: (text: string) => void }) {
  const [input, setInput] = useState("");
  const [showCmds, setShowCmds] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    onSend(t);
    setInput("");
    setShowCmds(false);
  };

  const filteredCmds = COMMANDS.filter(c => c.cmd.startsWith(input.toLowerCase()));
  const contact = CONTACTS.find(c => c.name === chat.name);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-navy flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy-light border border-border flex items-center justify-center text-gold text-sm font-semibold flex-shrink-0">
            {chat.type === "group" ? <Icon name="Users" size={16} /> : chat.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{chat.name}</span>
              {contact && <StatusBadge status={contact.status} small />}
              {chat.type === "group" && <span className="text-xs text-muted-foreground">группа</span>}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="Lock" size={10} /><span>Сквозное шифрование</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {["Phone", "Search", "MoreVertical"].map(ic => (
            <button key={ic} className="w-8 h-8 rounded-lg hover:bg-navy-light flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Icon name={ic} size={16} />
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-background">
        {chat.messages.map((msg, i) => (
          <div key={msg.id} className={`flex ${msg.own ? "justify-end" : "justify-start"} animate-fade-in`}
            style={{ animationDelay: `${i * 0.04}s` }}>
            {!msg.own && (
              <div className="w-7 h-7 rounded-full bg-navy-light border border-border flex items-center justify-center text-gold text-xs font-semibold mr-2 flex-shrink-0">
                {msg.from === "Система" ? "⚙" : msg.from.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
            )}
            <div className={`max-w-sm lg:max-w-md rounded-xl px-3.5 py-2.5 ${msg.own ? "message-bubble-own" : "message-bubble-other"}`}>
              {!msg.own && msg.from !== "me" && (
                <p className="text-xs font-medium mb-1 text-gold">{msg.from}</p>
              )}
              <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                {msg.encrypted && <Icon name="Lock" size={9} className="text-muted-foreground opacity-40" />}
                <span className="text-xs text-muted-foreground">{msg.time}</span>
                {msg.own && <Icon name="CheckCheck" size={12} className="text-gold opacity-70" />}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Commands dropdown */}
      {showCmds && filteredCmds.length > 0 && (
        <div className="bg-navy border-t border-border max-h-44 overflow-y-auto">
          {filteredCmds.map(c => (
            <button key={c.cmd} onClick={() => { setInput(c.cmd); setShowCmds(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-navy-mid text-left">
              <span className="text-gold font-mono text-sm">{c.cmd}</span>
              <span className="text-muted-foreground text-xs">{c.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-navy flex-shrink-0">
        <div className="flex items-center gap-2 bg-navy-mid border border-border rounded-xl px-3 py-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="Paperclip" size={18} /></button>
          <input value={input}
            onChange={e => { setInput(e.target.value); setShowCmds(e.target.value.startsWith("/")); }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Сообщение или /команда..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <button className="text-muted-foreground hover:text-foreground transition-colors"><Icon name="Smile" size={18} /></button>
          <button onClick={send} disabled={!input.trim()}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground transition-all disabled:opacity-30 hover:opacity-90">
            <Icon name="Send" size={15} />
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1.5 flex items-center justify-center gap-1">
          <Icon name="Lock" size={9} /> Сквозное шифрование активно
        </p>
      </div>
    </div>
  );
}

// ─── Contacts Panel ───────────────────────────────────────────────────────────

function ContactsPanel({ onStartChat }: { onStartChat: (u: User) => void }) {
  const [search, setSearch] = useState("");
  const list = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nick.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 bg-navy-mid border border-border rounded-lg px-3 py-2">
          <Icon name="Search" size={15} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск контактов..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {list.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-navy-mid transition-colors group">
            <AvatarEl initials={u.avatar} online={u.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground">{u.name}</span>
                <StatusBadge status={u.status} small />
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">@{u.nick}</span>
                <span className="text-xs text-gold font-mono">{u.links.toLocaleString()} ₾</span>
                <span className="text-xs text-muted-foreground">ур.{u.level}</span>
              </div>
            </div>
            <button onClick={() => onStartChat(u)}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-navy-light border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
              <Icon name="MessageSquare" size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Panel ────────────────────────────────────────────────────────────

function ProfilePanel() {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      <div className="bg-navy-mid border border-border rounded-xl p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-navy-light border-2 border-gold flex items-center justify-center text-gold text-2xl font-bold mx-auto mb-3 glow-gold">
          {ME.avatar}
        </div>
        <h2 className="text-lg font-semibold text-foreground">{ME.name}</h2>
        <p className="text-muted-foreground text-sm mb-3">@{ME.nick}</p>
        <StatusBadge status={ME.status} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Линки", value: `${ME.links.toLocaleString()} ₾`, icon: "Coins" },
          { label: "Уровень", value: ME.level, icon: "TrendingUp" },
          { label: "Ачивки", value: ME.achievements, icon: "Award" },
        ].map(s => (
          <div key={s.label} className="bg-navy-mid border border-border rounded-xl p-3 text-center">
            <Icon name={s.icon} size={20} className="text-gold mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-navy-mid border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icon name="Award" size={15} className="text-gold" /> Достижения
        </h3>
        <div className="space-y-2">
          {ACHIEVEMENTS.map(a => (
            <div key={a.id} className="flex items-center gap-3 bg-navy border border-border rounded-lg p-2.5">
              <div className="w-8 h-8 rounded-lg bg-navy-light flex items-center justify-center flex-shrink-0">
                <Icon name={a.icon} size={16} className="text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gold font-mono">+{a.reward} ₾</p>
                <p className="text-xs text-muted-foreground">ур.{a.level}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy-mid border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Icon name="Coins" size={15} className="text-gold" /> Экономика Линков
        </h3>
        <div className="space-y-1.5 text-xs">
          <p className="text-muted-foreground font-medium mb-2">Источники дохода:</p>
          {[["Ежедневный вход", "1–5 ₾"], ["За ачивки", "10–100 ₾"], ["Победа в событии", "до 500 ₾"], ["Приглашение", "20 ₾"]].map(([k, v]) => (
            <div key={k} className="flex justify-between bg-navy border border-border rounded-lg px-3 py-2">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-gold font-mono font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Panel ─────────────────────────────────────────────────────

function NotifPanel({ notifs, onRead }: { notifs: Notification[]; onRead: (id: string) => void }) {
  const iconMap: Record<string, string> = { achievement: "Award", status: "Star", links: "Coins", system: "Info" };
  return (
    <div className="flex-1 overflow-y-auto">
      {notifs.map(n => (
        <div key={n.id} onClick={() => onRead(n.id)}
          className={`flex items-start gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors hover:bg-navy-mid ${!n.read ? "bg-navy-mid" : ""}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? "bg-primary/20 border border-primary/30" : "bg-navy-light border border-border"}`}>
            <Icon name={iconMap[n.type]} size={16} className={!n.read ? "text-gold" : "text-muted-foreground"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{n.time}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
          </div>
          {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ─── Promo Panel ─────────────────────────────────────────────────────────────

const PROMO_URL = "https://functions.poehali.dev/77142137-beee-4a14-970f-34910212ffd3";

const PROMO_TYPES: Record<string, { label: string; color: string }> = {
  welcome:   { label: "Приветственный", color: "text-green-400"  },
  seasonal:  { label: "Сезонный",       color: "text-blue-400"   },
  event:     { label: "Событийный",     color: "text-yellow-400" },
  technical: { label: "Технический",    color: "text-purple-400" },
  referral:  { label: "Реферальный",    color: "text-pink-400"   },
  partner:   { label: "Партнёрский",    color: "text-orange-400" },
  fixed:     { label: "Стандартный",    color: "text-gray-400"   },
  special:   { label: "Особый",         color: "text-gold"       },
};

interface PromoReward {
  description: string;
  links: number;
  badge: string | null;
  status: string | null;
}

interface PromoActivation {
  reward: string;
  activated_at: string;
  type: string;
}

function PromoPanel() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reward, setReward] = useState<PromoReward | null>(null);
  const [history, setHistory] = useState<PromoActivation[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [tab, setTab] = useState<"activate" | "history" | "referral">("activate");

  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

  const handleActivate = async () => {
    if (isBlocked) return;
    const trimmed = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
    if (!trimmed) { setStatus("error"); setMessage("Введите промокод"); return; }
    setLoading(true);
    setStatus("idle");
    setReward(null);
    try {
      const res = await fetch(PROMO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": "alex_kim" },
        body: JSON.stringify({ action: "activate", code: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage("Промокод активирован!");
        setReward(data.reward);
        setCode("");
        setFailCount(0);
      } else {
        const newFails = failCount + 1;
        setFailCount(newFails);
        if (newFails >= 3) {
          setBlockedUntil(Date.now() + 5 * 60 * 1000);
          setMessage("3 неудачных попытки. Блокировка на 5 минут.");
        } else {
          setMessage(data.error || "Код недействителен");
        }
        setStatus("error");
      }
    } catch {
      setStatus("error");
      setMessage("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistLoading(true);
    try {
      const res = await fetch(PROMO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": "alex_kim" },
        body: JSON.stringify({ action: "my" }),
      });
      const data = await res.json();
      setHistory(data.activations || []);
    } catch { setHistory([]); }
    finally { setHistLoading(false); }
  };

  const generateReferral = async () => {
    try {
      const res = await fetch(PROMO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": "alex_kim" },
        body: JSON.stringify({ action: "referral" }),
      });
      const data = await res.json();
      setRefCode(data.code);
    } catch { setRefCode(null); }
  };

  useEffect(() => {
    if (tab === "history") loadHistory();
  }, [tab]);

  const EXAMPLE_CODES = ["WELCOME2024", "WINTER2024", "HAKATON_WIN", "DEV_TEST_777", "SHADOW_RISE"];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-navy border border-border rounded-xl p-1">
        {[
          { id: "activate" as const, label: "Активация", icon: "Tag" },
          { id: "history"  as const, label: "История",   icon: "Clock" },
          { id: "referral" as const, label: "Реферал",   icon: "UserPlus" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all
              ${tab === t.id ? "bg-navy-light text-gold border border-border" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon name={t.icon} size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* ── Activate tab ── */}
      {tab === "activate" && (
        <>
          <div className="bg-navy-mid border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Lock" size={14} className="text-gold" />
              <h3 className="text-sm font-semibold text-foreground">Защищённое поле ввода</h3>
            </div>
            <p className="text-xs text-muted-foreground">Код знает только владелец аккаунта — не передавайте его третьим лицам.</p>

            {isBlocked ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-3 text-sm text-destructive text-center">
                <Icon name="Ban" size={16} className="mx-auto mb-1" />
                Блокировка на 5 минут после 3 ошибок
              </div>
            ) : (
              <div className="relative">
                <input
                  type="password"
                  value={code}
                  onChange={e => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 20));
                    setStatus("idle");
                  }}
                  onKeyDown={e => e.key === "Enter" && handleActivate()}
                  placeholder="ВВЕДИТЕ КОД..."
                  maxLength={20}
                  autoComplete="off"
                  className={`w-full bg-navy border rounded-xl px-4 py-3 pr-10 text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground outline-none transition-all
                    ${status === "success" ? "border-green-500/50" : status === "error" ? "border-destructive/50" : "border-border focus:border-gold/50"}`}
                />
                <Icon name="Lock" size={14} className="absolute right-3 top-3.5 text-muted-foreground" />
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="Info" size={11} />
              <span>Латинские буквы, цифры, нижнее подчёркивание. Макс. 20 символов.</span>
            </div>

            {status !== "idle" && (
              <div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm animate-fade-in
                ${status === "success" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-destructive/10 border border-destructive/20 text-destructive"}`}>
                <Icon name={status === "success" ? "CheckCircle" : "XCircle"} size={16} className="mt-0.5 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {reward && (
              <div className="bg-navy border border-gold/30 rounded-xl p-4 space-y-2 animate-fade-in">
                <p className="text-xs font-semibold text-gold flex items-center gap-1.5"><Icon name="Gift" size={13} />Награда получена:</p>
                <p className="text-sm text-foreground">{reward.description}</p>
                {reward.links > 0 && (
                  <p className="text-gold font-mono font-bold text-lg">+{reward.links} ₾</p>
                )}
                {reward.badge && (
                  <span className="inline-flex items-center gap-1 bg-navy-light border border-border rounded px-2 py-1 text-xs text-foreground">
                    <Icon name="Award" size={11} className="text-gold" />{reward.badge}
                  </span>
                )}
              </div>
            )}

            <button onClick={handleActivate} disabled={loading || isBlocked || !code.trim()}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all disabled:opacity-30 hover:opacity-90 flex items-center justify-center gap-2">
              {loading ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Zap" size={15} />}
              {loading ? "Проверяю..." : "Активировать"}
            </button>
          </div>

          {/* Examples */}
          <div className="bg-navy-mid border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="Sparkles" size={13} className="text-gold" />Примеры кодов (нажмите для вставки)
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_CODES.map(c => (
                <button key={c} onClick={() => { setCode(c); setStatus("idle"); }}
                  className="font-mono text-xs text-gold bg-navy border border-border rounded-lg px-2.5 py-1.5 hover:border-gold/40 transition-colors">
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Types info */}
          <div className="bg-navy-mid border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground mb-3">Типы промокодов</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(PROMO_TYPES).map(([, v]) => (
                <div key={v.label} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${v.color}`} />
                  <span className="text-muted-foreground">{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── History tab ── */}
      {tab === "history" && (
        <div className="bg-navy-mid border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Активированные коды</span>
            <button onClick={loadHistory} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="RefreshCw" size={14} />
            </button>
          </div>
          {histLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader" size={20} className="text-muted-foreground animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <Icon name="Tag" size={28} className="opacity-20" />
              <p className="text-xs">Промокоды не активированы</p>
            </div>
          ) : (
            history.map((h, i) => {
              const typeInfo = PROMO_TYPES[h.type] || PROMO_TYPES.fixed;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-navy-light border border-border flex items-center justify-center flex-shrink-0">
                    <Icon name="CheckCircle" size={16} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{h.reward}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${typeInfo.color}`}>{typeInfo.label}</span>
                      <span className="text-xs text-muted-foreground">{new Date(h.activated_at).toLocaleDateString("ru")}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Referral tab ── */}
      {tab === "referral" && (
        <div className="space-y-4">
          <div className="bg-navy-mid border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Icon name="UserPlus" size={14} className="text-gold" />Реферальная программа
            </h3>
            <p className="text-xs text-muted-foreground">Приглашайте друзей и получайте <span className="text-gold font-mono">20 ₾</span> за каждого активного пользователя.</p>
            {refCode ? (
              <div className="bg-navy border border-gold/30 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Ваш реферальный код:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-gold font-mono text-sm bg-navy-light border border-border rounded-lg px-3 py-2">{refCode}</code>
                  <button onClick={() => navigator.clipboard.writeText(refCode)}
                    className="w-8 h-8 rounded-lg bg-navy-light border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="Copy" size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={generateReferral}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Icon name="Link" size={15} />Сгенерировать мой реферальный код
              </button>
            )}
          </div>

          <div className="bg-navy-mid border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground mb-3">Где получить промокоды</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                ["Божественный Вестник", "Ghost"],
                ["Рассылки ИИ «Оракул»", "Bot"],
                ["События платформы", "Calendar"],
                ["Партнёры (GitHub, Discord)", "Link"],
                ["Реферальная программа", "UserPlus"],
                ["Сезонные фестивали", "Sparkles"],
              ].map(([label, icon]) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon name={icon} size={12} className="text-gold flex-shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel() {
  const [twofa, set2fa] = useState(true);
  const [encrypt, setEncrypt] = useState(true);
  const [autodel, setAutodel] = useState(false);

  const Toggle = ({ val, set }: { val: boolean; set: (v: boolean) => void }) => (
    <button onClick={() => set(!val)}
      className={`relative flex-shrink-0 transition-colors duration-200 rounded-full ${val ? "bg-primary" : "bg-navy-light border border-border"}`}
      style={{ width: 40, height: 22 }}>
      <span className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-200"
        style={{ transform: val ? "translateX(18px)" : "translateX(0)" }} />
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      <div className="bg-navy-mid border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Icon name="Shield" size={14} className="text-gold" />Безопасность</h3>
        </div>
        {[
          { label: "2FA аутентификация", sub: "Обязательна для высших статусов", val: twofa, set: set2fa },
          { label: "Сквозное шифрование", sub: "Все приватные и групповые чаты", val: encrypt, set: setEncrypt },
          { label: "Автоудаление через 1 год", sub: "Неактивные аккаунты", val: autodel, set: setAutodel },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
            <div>
              <p className="text-sm text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
            <Toggle val={item.val} set={item.set} />
          </div>
        ))}
      </div>

      <div className="bg-navy-mid border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Icon name="Terminal" size={14} className="text-gold" />Команды</h3>
        </div>
        <div className="p-3 space-y-1.5">
          {COMMANDS.map(c => (
            <div key={c.cmd} className="flex items-center gap-3">
              <code className="text-xs font-mono text-gold bg-navy px-2 py-1 rounded border border-border whitespace-nowrap">{c.cmd}</code>
              <span className="text-xs text-muted-foreground">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy-mid border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Icon name="Server" size={14} className="text-gold" />Инфраструктура</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[["Доступность","99.9%"],["API ответ","<200ms"],["Бэкапы","каждые 6ч"],["Журналы","90 дней"],["Дата-центры","EU/AS/US"],["Шифрование","E2E"]].map(([k,v]) => (
            <div key={k} className="flex justify-between bg-navy border border-border rounded-lg px-2.5 py-2">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-foreground font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy-mid border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground mb-2">Контакты LinkUp</p>
        <p>🌐 linkup.io</p>
        <p>✈ @LinkUpOfficial</p>
        <p>💬 discord.linkup.io</p>
        <p>✉ support@linkup.io</p>
      </div>
    </div>
  );
}

// ─── Status Hierarchy (right panel for profile) ───────────────────────────────

function HierarchyPanel() {
  const tiers = ["shadow","throne","balance","god","architect","dev"] as StatusTier[];
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <Icon name="Layers" size={15} className="text-gold" /> Иерархия статусов
      </h3>
      {tiers.map((t, idx) => {
        const m = STATUS_META[t];
        const isTop = idx === 0;
        return (
          <div key={t} className={`rounded-xl p-4 space-y-2 border ${isTop ? "bg-gradient-to-br from-purple-950/60 to-navy-mid border-purple-700/40" : "bg-navy-mid border-border"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={t} />
                {isTop && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-purple-900/50 border border-purple-700/50 text-purple-300">
                    ★ ВЫСШИЙ
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{m.slots}</span>
            </div>
            <code className={`block text-xs font-mono bg-navy px-2.5 py-2 rounded border border-border ${isTop ? "text-purple-300" : "text-gold"}`}>{m.code}</code>
          </div>
        );
      })}

      <div className="bg-navy-mid border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3">Автоматические статусы (ИИ «Оракул»)</h4>
        <div className="space-y-2 text-xs">
          {[
            { range: "Ур. 1–20",  tier: "Обычные",     dur: "14 дней",         cls: "badge-user"      },
            { range: "Ур. 21–40", tier: "Редкие",      dur: "60 дней",         cls: "badge-throne"    },
            { range: "Ур. 41–60", tier: "Сверхредкие", dur: "180 дней / ∞",    cls: "badge-shadow"    },
            { range: "Ур. 61–80", tier: "Легендарные", dur: "∞ (200 чел.)",    cls: "badge-god"       },
          ].map(r => (
            <div key={r.range} className="flex items-center gap-3 bg-navy border border-border rounded-lg px-3 py-2">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono font-medium ${r.cls}`} style={{ fontSize: "10px" }}>{r.tier}</span>
              <span className="text-muted-foreground">{r.range}</span>
              <span className="ml-auto text-foreground">{r.dur}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function Index() {
  const [section, setSection] = useState<Section>("chats");
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeId, setActiveId] = useState<string | null>("c1");
  const [notifs, setNotifs] = useState<Notification[]>(NOTIFICATIONS);

  const activeChat = chats.find(c => c.id === activeId) ?? null;
  const unreadNotif = notifs.filter(n => !n.read).length;

  const handleSend = (text: string) => {
    if (!activeId) return;
    const msg: Message = {
      id: `m_${Date.now()}`, from: "me", text,
      time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
      encrypted: true, own: true,
    };
    setChats(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...c.messages, msg], lastMsg: text, time: msg.time, unread: 0 } : c
    ));
  };

  const handleStartChat = (u: User) => {
    const ex = chats.find(c => c.name === u.name && c.type === "private");
    if (ex) { setActiveId(ex.id); setSection("chats"); return; }
    const nc: Chat = {
      id: `c_${Date.now()}`, name: u.name, type: "private",
      lastMsg: "Начните общение", time: "", unread: 0, archived: false, messages: [],
    };
    setChats(prev => [nc, ...prev]);
    setActiveId(nc.id);
    setSection("chats");
  };

  const isChat = section === "chats" || section === "archive";

  const PANEL_TITLE: Record<Section, string> = {
    chats: "Чаты", contacts: "Контакты", archive: "Архив",
    notifications: "Уведомления", profile: "Профиль", settings: "Настройки",
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <NavBar section={section} onSection={setSection} unread={unreadNotif} />

      {/* Left panel */}
      <div className="w-72 flex flex-col border-r border-border bg-navy flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-foreground">{PANEL_TITLE[section]}</h2>
          {section === "chats" && (
            <button className="w-7 h-7 rounded-lg bg-navy-light border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Plus" size={15} />
            </button>
          )}
          {section === "notifications" && unreadNotif > 0 && (
            <span className="text-xs text-gold font-medium">{unreadNotif} новых</span>
          )}
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {isChat && (
            <ChatList chats={chats} activeId={activeId} onSelect={id => setActiveId(id)} archived={section === "archive"} />
          )}
          {section === "contacts" && <ContactsPanel onStartChat={handleStartChat} />}
          {section === "notifications" && <NotifPanel notifs={notifs} onRead={id => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n))} />}
          {section === "profile" && <ProfilePanel />}
          {section === "settings" && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground px-1 py-2">Разделы настроек</p>
                {[
                  { icon: "Tag",     label: "Промокоды",        sub: "Активация и история"   },
                  { icon: "Shield",  label: "Безопасность",     sub: "2FA, шифрование"       },
                  { icon: "Terminal",label: "Команды",           sub: "Список всех команд"    },
                  { icon: "Server",  label: "Инфраструктура",   sub: "Данные о платформе"    },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-mid cursor-pointer transition-colors border border-transparent hover:border-border mb-1">
                    <div className="w-8 h-8 rounded-lg bg-navy-light border border-border flex items-center justify-center flex-shrink-0">
                      <Icon name={item.icon} size={15} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {isChat ? (
          activeChat ? (
            <ChatWindow chat={activeChat} onSend={handleSend} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Icon name="MessageSquare" size={48} className="opacity-15" />
              <p className="text-sm">Выберите чат</p>
            </div>
          )
        ) : section === "profile" ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-navy flex-shrink-0">
              <h2 className="font-semibold text-foreground">Иерархия статусов</h2>
              <p className="text-xs text-muted-foreground">Система привилегий и активационные коды</p>
            </div>
            <HierarchyPanel />
          </div>
        ) : section === "settings" ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-navy flex-shrink-0">
              <h2 className="font-semibold text-foreground">Промокоды</h2>
              <p className="text-xs text-muted-foreground">Активируйте коды для получения бонусов, значков и привилегий</p>
            </div>
            <PromoPanel />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Icon name="Users" size={48} className="opacity-15" />
            <p className="text-sm">Выберите контакт для начала переписки</p>
          </div>
        )}
      </div>
    </div>
  );
}