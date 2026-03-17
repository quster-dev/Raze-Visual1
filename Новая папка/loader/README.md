# Maven Loader (Electron)

Компактный вертикальный loader в стиле основного Maven frontend.

## Stack

- Electron (кастомное окно)
- Vite + React + TypeScript
- Monochrome glass UI + Manrope

## Запуск в dev

```bash
cd loader
npm install
npm run electron:dev
```

## Сборка UI

```bash
cd loader
npm run build
```

## Desktop запуск (после build)

```bash
cd loader
npm run electron:start
```

## Сборка portable приложения

```bash
cd loader
npm run electron:build
```

## Файлы Electron

- `loader/electron/main.cjs`
- `loader/electron/preload.cjs`

IPC bridge (`window.loaderAPI`):
- `minimize()`
- `close()`
- `togglePin()`
- `openExternal(url)`
