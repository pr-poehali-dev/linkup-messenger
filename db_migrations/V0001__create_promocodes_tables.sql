
CREATE TABLE IF NOT EXISTS t_p25924869_linkup_messenger.promocodes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL DEFAULT 'fixed',
    reward_links INTEGER NOT NULL DEFAULT 0,
    reward_badge VARCHAR(100),
    reward_status VARCHAR(50),
    reward_description TEXT NOT NULL,
    max_activations INTEGER DEFAULT 1,
    activations_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP,
    min_level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p25924869_linkup_messenger.promo_activations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    promocode_id INTEGER NOT NULL REFERENCES t_p25924869_linkup_messenger.promocodes(id),
    activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reward_description TEXT NOT NULL,
    UNIQUE(user_id, promocode_id)
);

INSERT INTO t_p25924869_linkup_messenger.promocodes
    (code, type, reward_links, reward_badge, reward_description, max_activations, expires_at, min_level)
VALUES
    ('WELCOME2024', 'welcome',   50,  'Новичок',            '50 ₾ + тема «Новичок»',                        NULL, '2026-12-31', 1),
    ('WINTER2024',  'seasonal', 100,  'Снежинка',           'Зимняя тема + 100 ₾',                          NULL, '2026-03-31', 1),
    ('HAKATON_WIN', 'event',    200,  'Победитель хакатона','Значок «Победитель хакатона» + 200 ₾',         NULL, NULL,         5),
    ('DEV_TEST_777','technical',  0,  'Тестировщик',        'Доступ к тестовому каналу на 7 дней',          50,   NULL,         10),
    ('SUMMER2024',  'seasonal',  75,  'Солнышко',           'Летняя тема + 75 ₾',                           NULL, '2026-09-30', 1),
    ('FREE_LINKS',  'fixed',     30,   NULL,                '30 ₾ на счёт',                                  NULL, NULL,         1),
    ('BETA_TESTER', 'technical',  0,  'Бета-тестер',        'Статус «Бета-тестер» + ранний доступ',         100,  NULL,         1),
    ('PARTNER_X',   'partner',   0,   'Партнёр',            'Статус «Партнёр» + эксклюзивные функции',      NULL, NULL,         1),
    ('EVENT2026',   'event',    150,  'Участник фестиваля', 'Статус «Участник зимнего фестиваля» + 150 ₾',  NULL, '2026-12-31', 1),
    ('SHADOW_RISE', 'special',   500, 'Избранный',          '500 ₾ + значок «Избранный Тенью»',             3,    '2026-06-30', 20);
