# API Кубик VPN

Все запросы находятся в одном файле — `src/lib/api.ts`. Больше нигде в проекте `fetch` не используется.

- **База:** `VITE_API_BASE`, по умолчанию `https://panel.kybic.online/api/bot`
- **Заголовок каждого запроса:** `X-Telegram-Init-Data: window.Telegram.WebApp.initData`
- **user_id:** `Telegram.WebApp.initDataUnsafe.user.id`
- **Ответ с ошибкой:** `{ "success": false, "error": "код" }` (русский текст для каждого кода лежит в `src/lib/errors.ts`)
- **Mock:** если `VITE_MOCK=1` (или приложение открыто вне Telegram, то есть `initData` пустой), `api.ts` возвращает тестовые данные той же формы, что и сервер.
- Фронтенд сам не считает деньги, скидки, рефералов и сроки. Он только показывает ответ сервера.

> Про префикс переменных: проект собирается на Vite, а Vite отдаёт в браузер только переменные `VITE_*`. Поэтому вместо `NEXT_PUBLIC_API_BASE` и `NEXT_PUBLIC_MOCK` используются `VITE_API_BASE` и `VITE_MOCK`. Подробности в `CHECK.md`.

## Уже есть на сервере

| Функция в api.ts | Метод | Путь | Параметры | Поля ответа | Коды ошибок |
|---|---|---|---|---|---|
| `getStatus()` | GET | `/status` | query: `user_id` | `active`, `ref_count`, `spins`, `ref_link`, `bonus_available`, `bonus_next_at`. Если `active=true`, ещё: `sub_url`, `used_traffic` (байты), `data_limit` (байты), `expire` (unix-секунды), `device_limit`, `devices[]`. Необязательно: `plans{standard,pro}` с ценами | `unauthorized`, `user_not_found` |
| `activateTrial()` | POST | `/activate` | body: `user_id`, `first_name` | `success` + поля подписки | `not_subscribed` (нужно подписаться на канал), `already_active`, `trial_used` |
| `resetDevices()` | POST | `/reset_devices` | body: `user_id` | `success` | `no_subscription`, `apply_failed` |
| `claimBonus()` | POST | `/claim_bonus` | body: `user_id` | `success`, `bonus_label` + поля подписки | `not_available`, `no_subscription`, `apply_failed` |
| `checkPromo(code)` | POST | `/check_promo` | body: `user_id`, `code` | `success`, `discount_type` (`percent` или `fixed`), `discount_value` | `invalid_promo`, `promo_not_found`, `promo_expired`, `promo_used` |
| `createPayment(plan, promo?)` | POST | `/create_payment` | body: `user_id`, `plan` (`standard` или `pro`), `promo_code?` | `success`, `pay_url`, `final_amount`. `pay_url` открывается через `Telegram.WebApp.openLink` | `invalid_plan`, `invalid_promo`, `payment_failed` |
| `getTickets()` | GET | `/get_tickets` | query: `user_id` | `tickets[]` (`id`, `title`, `status`, `created_at`), `is_admin` | — |
| `getMessages(ticketId)` | GET | `/get_messages` | query: `ticket_id` | `messages[]` (`sender_name`, `message`, `is_admin?`, `created_at`) | `ticket_not_found` |
| `createTicket(title, message)` | POST | `/create_ticket` | body: `user_id`, `first_name`, `title`, `message` | `success` | `invalid_request` |
| `replyTicket(ticketId, message)` | POST | `/reply_ticket` | body: `ticket_id`, `user_id`, `sender_name`, `message` | `success` | `ticket_closed`, `ticket_not_found` |

## Будут добавлены на сервере позже (в mock-режиме работают на тестовых данных)

| Функция в api.ts | Метод | Путь | Параметры | Поля ответа | Коды ошибок |
|---|---|---|---|---|---|
| `getBalance()` | GET | `/balance` | query: `user_id` | `balance_rub` | — |
| `getBalanceHistory(page)` | GET | `/balance/history` | query: `user_id`, `page` (с 1) | `items[]` (`id`, `type`: `deposit`, `purchase`, `referral_reward` или `gift`; `amount_rub`, `description`, `created_at`), `pages` | — |
| `topupBalance(amount, method?)` | POST | `/balance/topup` | body: `user_id`, `amount_rub`, необязательное `method` (`sbp`, `crypto` или `stars`). Поле `method` сервер может пока игнорировать | `success`, `pay_url` | `invalid_amount` |
| `buyPlan(plan, payWith, promo?)` | POST | `/plans/buy` | body: `user_id`, `plan`, `pay_with` (`balance` или `card`), `promo_code?` | при `balance`: `success` + поля подписки. При `card`: `success`, `pay_url` | `not_enough_balance`, `invalid_plan`, `invalid_promo` |
| `getReferrals()` | GET | `/referrals` | query: `user_id` | `ref_count`, `ref_link`, `reward_text`, `items[]` (`name`, `joined_at`) | — |
| `createGift(plan)` | POST | `/gift/create` | body: `user_id`, `plan` | `success`, `code` | `not_enough_balance`, `invalid_plan` |
| `redeemGift(code)` | POST | `/gift/redeem` | body: `user_id`, `code` | `success` + поля подписки | `not_found`, `already_used` |

«Поля подписки» = `sub_url`, `used_traffic`, `data_limit`, `expire`, `device_limit`, `devices[]`.

## Где что используется в интерфейсе

| Экран | Запросы |
|---|---|
| Главная | `getStatus`, `getBalance`, `activateTrial` (кнопка «Тестовая подписка», пока `active=false`) |
| Подписка | `getStatus`, `activateTrial`, `resetDevices` |
| Оформить подписку | `checkPromo`, `createPayment` (карта/СБП), `buyPlan` (с баланса), `activateTrial` |
| Баланс | `getBalance`, `getBalanceHistory`, `checkPromo` |
| Пополнение | `topupBalance` |
| Рефералы | `getReferrals` (если эндпоинта ещё нет, берутся `ref_count` и `ref_link` из `/status`) |
| Колесо удачи | `claimBonus` |
| Подарить | `createGift`, `redeemGift` |
| Поддержка | `getTickets`, `getMessages`, `createTicket`, `replyTicket` |

## Коды ошибок и тексты

Таблица всех кодов с русскими текстами находится в `src/lib/errors.ts` (`ERROR_TEXTS`). Для неизвестного кода показывается: «Что-то пошло не так (код). Попробуйте ещё раз.»
