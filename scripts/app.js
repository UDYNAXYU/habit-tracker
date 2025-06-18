'use strict';

let habbits = [];
const HABBIT_KEY = 'HABBIT_KEY';
const ACHIEVEMENTS_KEY = 'ACHIEVEMENTS_KEY';
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


// Система достижений
function showAchievement(achievement) {
  const notification = document.getElementById('achievement-notification');

  if (!notification) {
    console.error('Элемент уведомления не найден в DOM');
    return;
  }

  const emoji = notification.querySelector('#achievement-emoji');
  const title = notification.querySelector('#achievement-title');
  const desc = notification.querySelector('#achievement-desc');

  if (!emoji || !title || !desc) {
    console.error('Не найдены элементы уведомления');
    return;
  }

  emoji.textContent = achievement.icon;
  title.textContent = achievement.title;
  desc.textContent = achievement.desc;

  notification.classList.add('active');

  setTimeout(() => {
    notification.classList.remove('active');
  }, 4000);

  playAchievementSound();
}


// Проверка при каждом изменении данных
function checkAchievements() {
  try {
    const unlocked = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}');
    let newAchievements = false;

    Object.entries(ACHIEVEMENTS).forEach(([key, achievement]) => {
      if (!unlocked[key] && achievement.check(habbits)) {
        unlocked[key] = true;
        showAchievement(achievement);
        newAchievements = true;
      }
    });

    if (newAchievements) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    }
  } catch (error) {
    console.error('Ошибка при проверке достижений:', error);
  }
}
function showAchievementsPage() {
  const { page: achievementsPage, grid } = page.achievements;
  const unlocked = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '{}');

  grid.innerHTML = '';

  Object.entries(ACHIEVEMENTS).forEach(([key, achievement]) => {
    const isUnlocked = unlocked[key];
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="achievement-card-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
      <h3 class="achievement-card-title">${isUnlocked ? achievement.title : 'Заблокировано'}</h3>
      <p class="achievement-card-desc">${isUnlocked ? achievement.desc : 'Вы еще не получили это достижение'}</p>
    `;
    grid.appendChild(card);
  });

  achievementsPage.style.display = 'block';
}

function closeAchievements() {
  page.achievements.page.style.display = 'none';
}
// storage
function loadData() {
  try {
    const habbitsString = localStorage.getItem(HABBIT_KEY);
    const habbitsCollection = JSON.parse(habbitsString);
    if (habbitsCollection) {
      habbits = habbitsCollection;
    }
  } catch (error) {
    console.error('Не валидные данные', error);
  }
}

function saveData() {
  const habbitsString = JSON.stringify(habbits);
  localStorage.setItem(HABBIT_KEY, habbitsString);
}

// utiles

function clearPopupForm() {
  const form = page.popup.form;
  form.reset();
  form.elements.habbit.forEach((item) => {
    item.nextElementSibling.classList.remove('error');
  });
  form.habbitName.classList.remove('error');
  form.habbitGoal.classList.remove('error');
}

function getDataForm(form, fields) {
  const dataForm = new FormData(form);
  const res = {};
  let formIsValid = true;
  fields.forEach((field) => {
    let data = dataForm.get(field.name);
    if (field.type === 'number') {
      data = Number(data);
    }
    const isNodeList = NodeList.prototype.isPrototypeOf(form[field.name]);
    if (isNodeList) {
      form[field.name].forEach((item) =>
        item.nextElementSibling.classList.remove('error')
      );
    } else {
      form[field.name].classList.remove('error');
    }
    if (!data) {
      if (isNodeList) {
        form[field.name].forEach((item) =>
          item.nextElementSibling.classList.add('error')
        );
      } else {
        form[field.name].classList.add('error');
      }
      formIsValid = false;
    }
    res[field.name] = data;
  });
  if (!formIsValid) {
    return;
  }
  return res;
}

// renders
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

    menuItem.querySelector('.menu-link').addEventListener('click', () => {
      render(habbit);
    });

    page.menu.appendChild(menuItem);
  });
}
function renderHabbitHeader(habbit) {
  const progresPercent =
    habbit.days.length <= habbit.target
      ? (habbit.days.length * 100) / habbit.target
      : 100;
  page.habbitHeader.habbitTitle.textContent = habbit.name;
  page.habbitHeader.progresPercent.textContent = progresPercent.toFixed() + '%';
  page.habbitHeader.progresBar.style.setProperty(
    '--progress',
    `${progresPercent}%`
  );
}

function renderHabbitComments(habbit) {
  page.content.habitList.innerHTML = '';
  habbit.days.forEach((day, i) => {
    const elem = document.createElement('li');
    elem.classList.add('comment');
    elem.innerHTML = `<h3 class="comment-day">День ${i + 1}</h3>
            <div class="comment-description">
              <span class="comment-text"
                >${day.comment}</span
              >
              <button class="delete" onclick="deleteDay(${i})">
                <svg class="delete-button-icon">
                  <use xlink:href="img/sprite.svg#delete"></use>
                </svg>
              </button>
            </div>`;
    page.content.habitList.appendChild(elem);
  });
  page.content.newCommentDay.textContent = `День ${habbit.days.length + 1}`;
  page.content.form.setAttribute('active-habbit-id', habbit.id);
}

function renderGreeting() {
  const elem = document.createElement('div');
  elem.classList.add('greeting');
  elem.innerHTML = `
    <h2 class="greeting-title">Пока пусто!
      <span class="greeting-subtitle">Создай свою первую привычку.</span>
    </h2>
    <button class="button" onclick="toglePopup()">Создать</button>
  `;

  // Очищаем меню
  page.menu.innerHTML = '';
  page.habbitContent.style.display = 'none';

  // Удаляем предыдущее приветствие, если было
  const oldGreeting = page.habit.querySelector('.greeting');
  if (oldGreeting) oldGreeting.remove();

  page.habit.appendChild(elem);
}

function renderHabbitContent() {
  const greeting = page.habit.querySelector('.greeting');
  if (greeting) {
    greeting.remove();
    page.habbitContent.style.display = 'block';
  }
}

function render(activeHabbit) {
  if (!activeHabbit) {
    return;
  }
  document.location.replace(`${document.location.pathname}#${activeHabbit.id}`);
  document.title = `dailyDo - трекер привычек | ${activeHabbit.name}`;
  renderHabbitContent();
  renderMenu(activeHabbit);
  renderHabbitHeader(activeHabbit);
  renderHabbitComments(activeHabbit);
}

// work with days
function addDays(e) {
  e.preventDefault();
  const form = e.target;
  const formData = getDataForm(form, [
    { name: 'newDayComment', type: 'text' }
  ]);

  // Добавляем проверку на существование данных
  if (!formData || !formData.newDayComment) {
    console.error('Не удалось получить данные формы');
    return;
  }

  form.newDayComment.value = '';
  const habbitId = Number(form.getAttribute('active-habbit-id'));
  const habbit = habbits.find((habbit) => habbit.id === habbitId);

  if (!habbit) {
    console.error('Привычка не найдена');
    return;
  }

  habbit.days.push({ comment: formData.newDayComment });
  saveData();
  render(habbit);
  checkAchievements();
}

function deleteDay(index) {
  const habbitId = Number(page.content.form.getAttribute('active-habbit-id'));
  const habbit = habbits.find((habbit) => habbit.id === habbitId);
  habbit.days.splice(index, 1);
  saveData();
  render(habbit);
}

// work with popup
function toglePopup() {
  page.body.classList.toggle('shadow');
  page.popup.window.classList.toggle('popup-open');
  clearPopupForm();
}
function deleteHabbit(id, event) {
  event.stopPropagation();
  if (confirm('Вы уверены, что хотите удалить эту привычку?')) {
    habbits = habbits.filter(habbit => habbit.id !== id);
    saveData();

    const currentHabbit = habbits.length > 0 ? habbits[0] : null;
    render(currentHabbit);

    if (habbits.length === 0) {
      renderGreeting();
    }
  }
}

//work with new habbit
function addHabbit(e) {
  e.preventDefault();
  const form = e.target;
  const data = getDataForm(form, [
    {
      name: 'habbit',
      type: 'text',
    },
    {
      name: 'habbitName',
      type: 'text',
    },
    {
      name: 'habbitGoal',
      type: 'number',
    },
  ]);
  if (data) {
    habbits.push({
      id: habbits.length + 1,
      icon: data.habbit,
      name: data.habbitName,
      target: data.habbitGoal,
      days: [],
    });
    toglePopup();
    saveData();
    render(habbits[habbits.length - 1]);
  }
  checkAchievements();
}
// Проверяем, не перекрывает ли кнопка другие элементы
function checkButtonPosition() {
  const btn = document.getElementById('show-achievements-btn');
  if (!btn) return;

  // Если экран широкий, делаем кнопку компактной
  if (window.innerWidth > 800) {
    btn.innerHTML = `
      <svg width="20" height="20"><!-- ... --></svg>
    `;
    btn.style.padding = '12px';
    btn.querySelector('span').style.display = 'none';
  } else {
    btn.innerHTML = `
      <svg width="20" height="20"><!-- ... --></svg>
      <span>Достижения</span>
    `;
    btn.style.padding = '12px 24px';
  }
}
// Проверяем тип устройства
function isWidescreen() {
  return window.matchMedia("(min-aspect-ratio: 16/9)").matches;
}

// Адаптируем интерфейс
function adaptLayout() {
  if (isWidescreen()) {
    document.body.classList.add('widescreen');
    // Дополнительные JS-настройки для широких экранов
  } else {
    document.body.classList.remove('widescreen');
  }
}

// Запускаем при загрузке и изменении размера
window.addEventListener('load', adaptLayout);
window.addEventListener('resize', adaptLayout);
// Запускаем при загрузке и при изменении размера окна
window.addEventListener('load', checkButtonPosition);
window.addEventListener('resize', checkButtonPosition);
(() => {
  // Проверяем основные элементы перед запуском
  if (!page.achievements.notification) {
    console.error('Не найден элемент уведомления о достижениях');
  }
  if (!page.achievements.page) {
    console.error('Не найдена страница достижений');
  }

  loadData();
  if (!habbits.length) {
    renderGreeting();
  }
  const id = document.location.hash.replace('#', '');
  const habbit = habbits.find((habbit) => habbit.id === Number(id));
  if (habbit) {
    render(habbit);
  } else if (habbits.length) {
    render(habbits[0]);
  }

  // Инициализация кнопки достижений только если она существует
  if (page.achievements.showBtn) {
    page.achievements.showBtn.addEventListener('click', showAchievementsPage);
  } else {
    console.error('Не найдена кнопка показа достижений');
  }

  setTimeout(checkAchievements, 1000);
})();
