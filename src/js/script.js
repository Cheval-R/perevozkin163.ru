import AirDatepicker from 'air-datepicker';
// import localeEn from 'air-datepicker/locale/en';

$(window).on('load', function () {
  var $preloader = $('.load');
  $preloader.delay(350).fadeOut('slow');
});


$('.transport__slider').slick({
  prevArrow: $('#transport__button--prev'),
  nextArrow: $('#transport__button--next'),
  autoplay: true,
  responsive: [
    {
      breakpoint: 751,
      settings: {
        slidesToShow: 2,
      }
    },
    {
      breakpoint: 550,
      settings: {
        slidesToShow: 1,
      }
    }]
});

$('.reviews__wrapper').slick({
  prevArrow: $('#reviews__button--prev'),
  nextArrow: $('#reviews__button--next'),
  slidesToScroll: 1,
  slidesToShow: 3,
  infinite: false,

  responsive: [
    {
      breakpoint: 851,
      settings: {
        slidesToShow: 2,
      }
    },
    {
      breakpoint: 451,
      settings: {
        slidesToShow: 1,
      }
    }]
})

$(document).ready(function () {
  let $selector = $('select');
  $selector.prop('selectedIndex', -1);
});

const feedbackValidator = new JustValidate('#feedback-form');
feedbackValidator
  .addField('#feedback-name', [
    {
      rule: 'required',
      errorMessage: 'Введите ваше имя'
    },
    {
      rule: 'minLength',
      value: 2,
      errorMessage: 'Минимум 2 символа'
    },
    {
      rule: 'maxLength',
      value: 20,
      errorMessage: 'Максимум 20 символов'
    },
    {
      rule: 'customRegexp',
      value: /^[А-Яа-яA-Za-z]+(\s[А-Яа-яA-Za-z]+)*$/,
      errorMessage: 'Некорректный ввод'
    },
  ])
  .addField('#feedback-text', [
    {
      rule: 'required',
      errorMessage: 'Введите отзыв',
    },
    {
      rule: 'minLength',
      value: 2,
      errorMessage: 'Минимум 2 символа'
    },
  ])
  .onSuccess(event => {
    event.preventDefault();

    $.ajax({
      url: './../php/feedback-send.php',

      type: 'POST',

      data: $('#feedback-form').serialize(),
      success: function (response) {
        $('.feedback__title').text('Спасибо за ваш отзыв!')
      },
      error: function (response) {
        console.log('err');
      }
    });
  });

$('.accordion').accordion({
  icons: false,
  heightStyle: "content",
  collapsible: true
})

const modal = $('#modal');
modal.on('change', function (event) {
  if (event.target === $('#modal-time')[0] || event.target === $('#modal-route')[0])
    selectChanger(event.target);
});

function selectChanger(select) {
  if ($(select).val() !== '') {
    $(select).css('color', '#424551');
    $(select).siblings('.modal__hint').addClass('modal__hint--top');
    $(select).siblings('.modal__hint').addClass('modal__hint--completed');
  } else {
    $(select).css('color', '#757575');
    $(select).siblings('.modal__hint').removeClass('modal__hint--top');
    $(select).siblings('.modal__hint').removeClass('modal__hint--completed');
  }
}

$('.modal__label').on('mouseenter', function () {
  $(this).find('.modal__hint').addClass('modal__hint--top');
});

$('.modal__label').on('mouseleave', function () {
  const hint = $(this).find('.modal__hint');
  if (!hint.hasClass('modal__hint--completed'))
    hint.removeClass('modal__hint--top');
});

const modalButton = $('#modal-button');

$(document).on('click', (event) => {
  if ($(event.target).is($('.button--modal'))) {
    modalOpen(modal);
  }
})

function modalClose(modal) {
  modal.fadeOut(600);
  $('html').css('overflow', 'auto');
}

function modalOpen(modal) {
  modal.fadeIn(300);
  $('html').css('overflow', 'hidden');

  $('.modal__close').off('click').one('click', function () {
    modalClose(modal);
  });

  $(document).off('keydown').one('keydown', function (e) {
    if (e.keyCode === 27) {
      e.stopPropagation();
      modalClose(modal);
    }
  });

  $('.modal').off('click').one('click', function (e) {
    if ($(e.target).is('.modal')) {
      modalClose(modal);
    }
  });
}

$(document).ready(function () {
  new AirDatepicker('#modal-date', {
    minDate: new Date(),
    maxDate: new Date().setMonth((new Date()).getMonth() + 1),
    timePicker: false,
    dateFormat: 'dd.MM.yyyy',
    autoClose: true,
    isMobile: true,
  });
});


$('#modal-route').on('change', function (event) {
  console.log(event.target.value);

  // Очищаем #modal-time и добавляем пустую опцию
  $('#modal-time').empty().append('<option value="" disabled selected></option>');

  if (event.target.value === 'Самара—Казань') {
    $('#modal-time').append(`
      <option value="7:00(Самара-Казань)">7:00 (Самара - Казань)</option>
      `);
    // <option value="14:00(Самара-Казань)">14:00 (Самара - Казань)</option>
  } else if (event.target.value === 'Казань—Самара') {
    $('#modal-time').append(`
      <option value="13:00(Казань-Самара)">13:00 (Казань - Самара)</option>
      `);
    // <option value="6:00(Казань-Самара)">6:00 (Казань - Самара)</option>
  }
});


const modalPhone = document.getElementById('modal-phone');

const phoneMask = new Inputmask({
  mask: "+7 (999) 999-99-99",
  showMaskOnHover: false,
});
phoneMask.mask(modalPhone);

// Функция для отправки данных в Telegram
function SendDataToTelegram(formData) {
  const botToken = '7507618319:AAEEsRkIw8ZpASZ_XU3pllqV1AUKJ5YeGDE'; // Токен вашего бота
  const chatId = '-1002882369249'; // ID получателя (пользователя)
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`; // URL для отправки сообщения

  // Формируем сообщение в формате HTML
  const message = `
  📩 <b><u>НОВОЕ БРОНИРОВАНИЕ</u></b>:
  <b>Имя:</b> ${formData.firstName}
  <b>Номер телефона:</b> ${formData.phoneNumber}
  <b>Дата поездки:</b> ${formData.date}
  <b>Маршрут:</b> ${formData.route}
  <b>Время:</b> ${formData.time}
    `;

  // Параметры, которые будем отправлять
  const params = {
    chat_id: chatId, // ID чата
    text: message, // Текст сообщения
    parse_mode: 'HTML' // Режим парсинга HTML
  };

  // Отправляем данные с помощью fetch API
  return fetch(apiUrl, {
    method: 'POST', // Метод отправки
    headers: {
      'Content-Type': 'application/json', // Указываем тип содержимого
    },
    body: JSON.stringify(params) // Преобразуем параметры в JSON
  }).then(response => response.json()); // Возвращаем ответ в формате JSON
}


const modalValidator = new JustValidate('#modal-form');
modalValidator
  .addField('#modal-name', [
    {
      rule: 'required',
      errorMessage: 'Введите ваше имя'
    },
    {
      rule: 'minLength',
      value: 2,
      errorMessage: 'Минимум 2 символа'
    },
    {
      rule: 'maxLength',
      value: 20,
      errorMessage: 'Максимум 20 символов'
    },
    {
      rule: 'customRegexp',
      value: /^[А-Яа-яA-Za-z]+(\s[А-Яа-яA-Za-z]+)*$/,
      errorMessage: 'Некорректный ввод'
    },
  ])
  .addField('#modal-phone', [
    {
      rule: 'required',
      errorMessage: 'Введите номер телефона',
    },
    {
      validator(value) {
        const phone = modalPhone.inputmask.unmaskedvalue();
        return !!(Number(phone) && phone.length === 10);
      },
      errorMessage: 'Неверный номер телефона',
    },
  ])
  .addField('#modal-date', [
    {
      rule: 'required',
      errorMessage: 'Выберите дату отправления',
    }
  ])
  .addField('#modal-route', [
    {
      rule: 'required',
      errorMessage: 'Выберите отправление',
    }
  ])
  .addField('#modal-time', [
    {
      rule: 'required',
      errorMessage: 'Выберите время отправления',
    }
  ])
  .onSuccess(event => {
    event.preventDefault();
    const formData = { // Собираем данные из формы
      firstName: document.getElementById('modal-name').value,
      phoneNumber: document.getElementById('modal-phone').value,
      date: document.getElementById('modal-date').value,
      route: document.getElementById('modal-route').value,
      time: document.getElementById('modal-time').value,

    };
    SendDataToTelegram(formData)
      .then(result => {
        if (result.ok) {
          // Если данные успешно отправлены
          $('.modal__title').innerHTML = 'Ваша анкета успешно отправлена';
        } else {
          // Если произошла ошибка при отправке
          $('.modal__title').innerHTML = 'Ошибка при отправке анкеты. Пожалуйста, попробуйте еще раз.';
        }
      })
      .catch(error => {
        console.error('Error:', error);
        // Обработка ошибки
        $('.modal__title').innerHTML = 'Произошла ошибка. Пожалуйста, попробуйте позже.';
      })
      .finally(() => {
        // Закрываем модальное окно и сбрасываем форму через 3 секунды
        setTimeout(() => {
          modalClose($('.modal'));
          $('#modal-form')[0].reset();
          $('.modal__title').text('Заполнение анкеты');
        }, 3000);
      });
    // $.ajax({
    //   // url: 'https://jsonplaceholder.typicode.com/posts',
    //   url: './../php/modal-send.php',

    //   type: 'POST',

    //   data: $('#modal-form').serialize(),
    //   success: function (response) {
    //     $('.modal__title').text('Спасибо! Заявка успешно отправлена!');

    //     setTimeout(function () {
    //       modalClose($('.modal'));
    //       $('#modal-form')[0].reset();
    //       $('.modal__title').text('Заполнение анкеты');
    //     }, 1000);
    //   },
    //   error: function (response) {
    //     console.log('err');
    //   }
    // });
  });

const burger = $('#burger');
const burgerMenu = $('#burger-menu');
const burgerButton = $('#burger-button');

burgerButton.on('click', (e) => {

  e.stopPropagation();
  burgerOpen();
});

function burgerOpen() {

  $('.burger-button__line--first').css('transform', 'rotate(-45deg)');
  $('.burger-button__line--second').css('transform', 'scaleY(0)');
  $('.burger-button__line--third').css('transform', 'rotate(45deg)');

  burger.slideDown(300);

  burgerButton.off('click');
  $(document).off('keydown');
  burgerMenu.off('click');
  $(document).off('click');

  burgerButton.on('click', (e) => {

    e.stopPropagation();
    burgerClose();
  });

  $(document).on('keydown', function (e) {
    if (e.keyCode === 27) {
      e.stopPropagation();
      burgerClose();
    }
  });

  burgerMenu.on('click', (e) => {
    if ($(e.target).is($('.nav__link'))) {
      console.log('sad');
      burgerClose();
    }
  });

  $(document).on('click', (e) => {
    if (!$(e.target).closest(burger).length) {
      burgerClose();
    }
  });
}

function burgerClose() {

  $('.burger-button__line--first').css('transform', 'rotate(0)');
  $('.burger-button__line--second').css('transform', 'scaleY(1)');
  $('.burger-button__line--third').css('transform', 'rotate(0)');

  burger.slideUp(300);

  $(document).off('keydown');
  burgerMenu.off('click');
  $(document).off('click');
  burgerButton.off('click');
  burgerButton.on('click', (e) => {

    e.stopPropagation();
    burgerOpen();
  });
  $(document).on('click', (event) => {
    if ($(event.target).is($('.button--modal'))) {
      modalOpen(modal);
    }
  })
}


async function initMap() {

  await ymaps3.ready;

  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = ymaps3;

  const { YMapDefaultMarker } = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');

  const mapKazan = new YMap(

    document.getElementById('map-kazan'),

    {
      location: {

        center: [49.098968, 55.792261],

        zoom: 16
      }
    },
    [

      new YMapDefaultSchemeLayer({}),

      new YMapDefaultFeaturesLayer({})
    ]
  );
  const markerKazan = new YMapDefaultMarker({
    coordinates: [49.098968, 55.792261],
    title: 'Вкусно и Точка',
    color: '#df860a',
  });
  mapKazan.addChild(markerKazan);

  const mapSamara = new YMap(

    document.getElementById('map-samara'),

    {
      location: {

        center: [50.188029, 53.217112],

        zoom: 16
      }
    },
    [

      new YMapDefaultSchemeLayer({}),

      new YMapDefaultFeaturesLayer({})
    ]
  );
  const markerSamara = new YMapDefaultMarker({
    coordinates: [50.188029, 53.217112],
    title: 'Rostic`s',
    color: '#df860a',
  });
  mapSamara.addChild(markerSamara);

  mapKazan.addChild(new YMapDefaultSchemeLayer());
  mapSamara.addChild(new YMapDefaultSchemeLayer());
}

initMap();