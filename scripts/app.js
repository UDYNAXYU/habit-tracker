'use strict';

// ======================
// КОНФИГУРАЦИЯ И ПЕРЕМЕННЫЕ
// ======================

// Массив для хранения привычек
let habbits = [];

// Ключи для localStorage
const HABBIT_KEY = 'HABBIT_KEY';
const ACHIEVEMENTS_KEY = 'ACHIEVEMENTS_KEY';

// Объект для доступа к DOM-элементам
const page = {
  body: document.querySelector('body'),
  menu: document.querySelector('.menu'),
  addButton: document.querySelector('.add-button'),
  habit: document.querySelector('.habit'),
  habbitContent: document.querySelector('.habbit-content'),
  habbitHeader: {
    habbitTitle: document.querySelector('.habit-title'),
    progresPercent: document.querySelector('.progres-percent'),
    progresBar: document.querySelector('.progres-bar'),
  },
  content: {
    habitList: document.querySelector('.habit-list'),
    newCommentDay: document.querySelector('.new-comment .comment-day'),
    form: document.querySelector('form.comment-description'),
  },
  popup: {
    window: document.querySelector('.popup'),
    form: document.querySelector('.popup-form'),
  },
  achievements: {
    notification: document.getElementById('achievement-notification'),
    page: document.getElementById('achievements-page'),
    grid: document.getElementById('achievements-grid'),
    showBtn: document.getElementById('show-achievements-btn')
  }
};

// Конфигурация достижений
const ACHIEVEMENTS = {
  first_habit: {
    title: "Первый шаг!",
    desc: "Создана первая привычка",
    icon: "🚀",
    check: (h) => h.length >= 1
  },
  three_days: {
    title: "Задел на будущее",
    desc: "Отмечали привычку 3 дня подряд",
    icon: "📈",
    check: (h) => h.some(x => x.days.length >= 3)
  },
  week: {
    title: "Неделя дисциплины",
    desc: "7 дней подряд с привычкой",
    icon: "🏆",
    check: (h) => h.some(x => x.days.length >= 7)
  }
};

// ======================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
// ======================

// Загрузка данных из localStorage
function loadData() {
  try {
    const habbitsString = localStorage.getItem(HABBIT_KEY);
    if (habbitsString) {
      habbits = JSON.parse(habbitsString);
    }
  } catch (error) {
    console.error('Ошибка загрузки данных', error);
  }
}

// Сохранение данных в localStorage
function saveData() {
  localStorage.setItem(HABBIT_KEY, JSON.stringify(habbits));
}

// ======================
// ФУНКЦИИ РЕНДЕРИНГА
// ======================

// Рендер меню привычек
function renderMenu(activeHabbit) {
  page.menu.innerHTML = '';

  habbits.forEach((habbit) => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';

    menuItem.innerHTML = `
      <div class="habbit-container">
        <div class="menu-link ${habbit.id === activeHabbit?.id ? 'menu-link-active' : ''}">
          <svg class="menu-icon">
            <use xlink:href="img/sprite.svg#${habbit.icon}"></use>
          </svg>
          <span class="habbit-name">${habbit.name}</span>
        </div>
        <button class="delete-btn" onclick="deleteHabbit(${habbit.id}, event)">
          Удалить привычку
        </button>
      </div>
    `;

    // Обработчик клика по привычке
    menuItem.querySelector('.menu-link').addEventListener('click', () => {
      render(habbit);
    });

    page.menu.appendChild(menuItem);
  });
}

// Рендер заголовка привычки
function renderHabbitHeader(habbit) {
  // Расчет процента выполнения
  const progresPercent = habbit.days.length <= habbit.target
    ? (habbit.days.length * 100) / habbit.target
    : 100;

  page.habbitHeader.habbitTitle.textContent = habbit.name;
  page.habbitHeader.progresPercent.textContent = `${progresPercent.toFixed()}%`;
  page.habbitHeader.progresBar.style.setProperty('--progress', `${progresPercent}%`);
}

// Рендер списка дней
function renderHabbitComments(habbit) {
  page.content.habitList.innerHTML = '';

  habbit.days.forEach((day, i) => {
    const elem = document.createElement('li');
    elem.className = 'comment';
    elem.innerHTML = `
      <h3 class="comment-day">День ${i + 1}</h3>
      <div class="comment-description">
        <span class="comment-text">${day.comment}</span>
        <button class="delete" onclick="deleteDay(${i})">
          <svg class="delete-button-icon">
            <use xlink:href="img/sprite.svg#delete"></use>
          </svg>
        </button>
      </div>
    `;
    page.content.habitList.appendChild(elem);
  });

  // Установка номера следующего дня
  page.content.newCommentDay.textContent = `День ${habbit.days.length + 1}`;
  page.content.form.setAttribute('active-habbit-id', habbit.id);
}

// Основная функция рендеринга
function render(activeHabbit) {
  if (!activeHabbit && habbits.length > 0) {
    activeHabbit = habbits[0];
  }

  if (!activeHabbit) {
    renderGreeting();
    return;
  }

  // Обновление URL и заголовка
  document.location.hash = activeHabbit.id;
  document.title = `dailyDo - ${activeHabbit.name}`;

  renderHabbitContent();
  renderMenu(activeHabbit);
  renderHabbitHeader(activeHabbit);
  renderHabbitComments(activeHabbit);
}

// ======================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ======================

// Добавление нового дня
function addDays(e) {
  e.preventDefault();
  const form = e.target;
  const comment = form.newDayComment.value.trim();

  if (!comment) return;

  const habbitId = Number(form.getAttribute('active-habbit-id'));
  const habbit = habbits.find(h => h.id === habbitId);

  if (habbit) {
    habbit.days.push({ comment });
    saveData();
    render(habbit);
    checkAchievements();
    form.reset();
  }
}

// Удаление дня
function deleteDay(index) {
  const habbitId = Number(page.content.form.getAttribute('active-habbit-id'));
  const habbit = habbits.find(h => h.id === habbitId);

  if (habbit) {
    habbit.days.splice(index, 1);
    saveData();
    render(habbit);
  }
}

// Добавление новой привычки
function addHabbit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const newHabbit = {
    id: habbits.length + 1,
    icon: formData.get('habbit'),
    name: formData.get('habbitName'),
    target: Number(formData.get('habbitGoal')),
    days: []
  };

  habbits.push(newHabbit);
  saveData();
  toglePopup();
  render(newHabbit);
  checkAchievements();
}

// ======================
// СИСТЕМА ДОСТИЖЕНИЙ
// ======================

// Показ уведомления о достижении
function showAchievement(achievement) {
  const { notification } = page.achievements;
  const emoji = notification.querySelector('#achievement-emoji');
  const title = notification.querySelector('#achievement-title');
  const desc = notification.querySelector('#achievement-desc');

  emoji.textContent = achievement.icon;
  title.textContent = achievement.title;
  desc.textContent = achievement.desc;

  notification.classList.add('active');

  setTimeout(() => {
    notification.classList.remove('active');
  }, 4000);
}

// Проверка достижений
function checkAchievements() {
  const unlocked = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}');
  let hasNew = false;

  Object.entries(ACHIEVEMENTS).forEach(([key, achievement]) => {
    if (!unlocked[key] && achievement.check(habbits)) {
      unlocked[key] = true;
      showAchievement(achievement);
      hasNew = true;
    }
  });

  if (hasNew) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  }
}

// ======================
// ИНИЦИАЛИЗАЦИЯ
// ======================

// Запуск приложения
(function init() {
  loadData();

  // Проверка hash в URL
  const hashId = Number(document.location.hash.replace('#', ''));
  const initialHabbit = hashId
    ? habbits.find(h => h.id === hashId)
    : habbits[0];

  render(initialHabbit || null);

  // Инициализация кнопки достижений
  if (page.achievements.showBtn) {
    page.achievements.showBtn.addEventListener('click', () => {
      page.achievements.page.style.display = 'block';
    });
  }

  // Первая проверка достижений
  setTimeout(checkAchievements, 1000);
})();