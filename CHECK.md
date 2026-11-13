# CHECK — самопроверка проекта «Кубик VPN»

## Результаты

| Проверка | Результат |
|---|---|
| `fetch`, `XMLHttpRequest`, `axios`, `sendBeacon`, `WebSocket` вне `src/lib/api.ts` | **Не найдено.** Единственный `fetch(` стоит в `src/lib/api.ts` (команда: `grep -rnE "fetch\(\|XMLHttpRequest\|axios" src`). |
| Ключи, токены, пароли в проекте | **Не найдено.** Искал токены бота (`цифры:буквы`), `api_key`, `secret`, `bearer`, `password`, `sk_live` в `src/` и `index.html`. Файлов `.env` нет, есть только `.env.example` без секретов. В `dist` и `out` токенов тоже нет. |
| Серверная часть (`src/app/api/*`, drizzle, база, `auth.ts`, `logic.ts`, `plans.ts`) | **Её нет.** Приложение полностью клиентское: нет своей базы и API-маршрутов. Тарифы лежат в `src/data/tariffs.ts` и только отображаются. |
| `localStorage` / `sessionStorage` | **Не используются.** Всё состояние берётся с сервера или хранится в памяти. |
| TypeScript (`npx tsc --noEmit`) | **Без ошибок.** |
| Сборка (`npm run build`) | **Успешно.** Результат — статический `dist/index.html` (один файл, всё внутри). |
| Папка `out` | **Собрана.** Это копия `dist`: `out/index.html`. |
| Мок-режим | Проверено запуском: `status`, `activate`, `claim_bonus`, `gift/redeem` (`not_found`), `plans/buy` (`not_enough_balance`), `referrals` отвечают данными той же формы, что и сервер. |

## Что исправил или отметил по ходу проверки

1. **Несовпадение стека.** В задании речь про Next.js (`output: 'export'`, `src/app/api`). В проекте стоит **React + Vite** (`package.json` и `vite.config.ts` менять нельзя). Статический результат даёт `vite build`, а `out` — копия `dist`. Серверных файлов в проекте не было и нет, удалять было нечего.
2. **Префикс переменных окружения.** Vite отдаёт в браузер только `VITE_*`, поэтому `NEXT_PUBLIC_API_BASE` и `NEXT_PUBLIC_MOCK` в браузер не попадут. Используются **`VITE_API_BASE`** (по умолчанию `https://panel.kybic.online/api/bot`) и **`VITE_MOCK=1`**. Если нужны именно `NEXT_PUBLIC_*`, в `vite.config.ts` добавляется `envPrefix: ["VITE_", "NEXT_PUBLIC_"]`, а в `api.ts` меняются два имени переменных.
3. **Предпросмотр вне Telegram.** Если `Telegram.WebApp.initData` пуст (открыто просто в браузере), `api.ts` сам включает mock и сверху показывается плашка «ДЕМО-РЕЖИМ». Внутри Telegram идут реальные запросы к серверу. Чтобы всегда работал mock, соберите проект с `VITE_MOCK=1`.
4. **Две «строки» `fetch(` в собранном файле.** В `out/index.html` слово `fetch(` встречается дважды. Одно вхождение — наш `api.ts`, второе — внутри минифицированной библиотеки React. В исходниках вне `api.ts` `fetch` нет.
5. **Поле `method` в `/balance/topup`.** Выбор «СБП / Криптовалюта / Stars» передаётся необязательным полем `method`. По спецификации в запросе только `user_id` и `amount_rub`, поэтому сервер может это поле пока игнорировать. Описано в `API.md`.
6. **Эндпоинты, которых ещё нет на сервере** (`/balance`, `/balance/history`, `/referrals`, `/gift/*`, `/plans/buy`, `/balance/topup`). Приложение не падает: баланс показывается как «—», рефералы берутся из `/status` (по умолчанию 0), остальные ошибки показываются русским текстом (например, `http_404` — «Эта функция скоро появится»).

## Как запустить

```bash
npm install
npm run dev                         # разработка
VITE_MOCK=1 npm run build           # сборка с тестовыми данными
npm run build                       # боевая сборка (dist/index.html)
rm -rf out && mkdir out && cp -r dist/. out/   # статическая папка out
```
