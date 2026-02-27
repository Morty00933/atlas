# Деплой СеменаПро на Firebase Hosting

## Шаг 1: Авторизация в Firebase

Откройте терминал (командную строку) в папке проекта и выполните:

```bash
cd "C:\Users\vesna\Desktop\сайт\semena-pro"
firebase login
```

Откроется браузер — войдите в свой Google аккаунт, который связан с проектом Firebase.

## Шаг 2: Деплой на хостинг

После успешной авторизации выполните:

```bash
firebase deploy
```

## Готово!

После деплоя вы получите ссылку на сайт:
- **https://semena-pro.web.app**
- или **https://semena-pro.firebaseapp.com**

---

## Полезные команды

### Пересборка и деплой:
```bash
npm run build && firebase deploy
```

### Только хостинг (без правил storage):
```bash
firebase deploy --only hosting
```

### Просмотр логов:
```bash
firebase hosting:channel:list
```

---

## Настройка Storage (для загрузки изображений)

В консоли Firebase (https://console.firebase.google.com):

1. Откройте проект **semena-pro**
2. Перейдите в **Storage** → **Rules**
3. Замените правила на:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

4. Нажмите **Publish**

---

## Структура проекта

```
semena-pro/
├── dist/                 # Собранный проект (для хостинга)
├── src/
│   ├── config/
│   │   └── firebase.js   # Конфигурация Firebase
│   ├── data/
│   │   └── initialData.js # Начальные данные
│   ├── App.jsx           # Главный компонент
│   ├── App.css           # Стили
│   └── main.jsx          # Точка входа
├── firebase.json         # Настройки хостинга
├── .firebaserc           # ID проекта
└── storage.rules         # Правила Storage
```
