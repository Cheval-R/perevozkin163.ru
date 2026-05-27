import AirDatepicker from 'air-datepicker';
// import localeEn from 'air-datepicker/locale/en';

const formStartedAt = Math.floor(Date.now() / 1000);

function setFormToken(formSelector, token) {
  $(`${formSelector} input[name="csrf_token"]`).val(token || '');
}

function refreshFormToken(form, formSelector) {
  return $.ajax({
    url: `./../php/form-token.php?form=${form}`,
    type: 'GET',
    dataType: 'json',
    cache: false,
    success: function (response) {
      setFormToken(formSelector, response.token);
    },
    error: function () {
      setFormToken(formSelector, '');
    }
  });
}

function focusFirstInvalidField(fields) {
  const invalidField = Object.values(fields || {}).find(field => !field.isValid);
  if (invalidField && invalidField.elem) {
    invalidField.elem.focus();
  }
}

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
  $selector.val('');
  $('input[name="form_started_at"]').val(formStartedAt);
  refreshFormToken('booking', '#modal-form');
  refreshFormToken('feedback', '#feedback-form');
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
        $('.feedback__title').text(response.responseText || 'Ошибка при отправке. Попробуйте снова.');
      }
    });
  })
  .onFail(fields => {
    focusFirstInvalidField(fields);
  });

$('.accordion').accordion({
  icons: false,
  heightStyle: "content",
  collapsible: true
})

const modal = $('#modal');
const modalForm = $('#modal-form');
const modalStatus = $('#modal-status');
const modalSubmit = $('#modal-button');
const modalRoute = $('#modal-route');
const modalTime = $('#modal-time');

modal.on('change', function (event) {
  if (event.target === $('#modal-time')[0] || event.target === $('#modal-route')[0])
    selectChanger(event.target);
});

function selectChanger(select) {
  if ($(select).val() !== '') {
    $(select).css('color', '#424551');
    $(select).addClass('has-value');
    $(select).siblings('.modal__hint').addClass('modal__hint--top');
    $(select).siblings('.modal__hint').addClass('modal__hint--completed');
  } else {
    $(select).css('color', '#757575');
    $(select).removeClass('has-value');
    $(select).siblings('.modal__hint').removeClass('modal__hint--top');
    $(select).siblings('.modal__hint').removeClass('modal__hint--completed');
  }
}

function setModalStatus(type, text) {
  modalStatus
    .removeClass('modal__status--success modal__status--error')
    .text('');

  if (type && text) {
    modalStatus
      .addClass(`modal__status--${type}`)
      .text(text);
  }
}

function setModalSending(isSending) {
  modalSubmit.prop('disabled', isSending);
  modalSubmit.text(isSending ? 'Отправляем...' : 'Отправить заявку');
}

function resetModalFormState() {
  modalForm[0].reset();
  modalForm.find('input[name="form_started_at"]').val(Math.floor(Date.now() / 1000));
  refreshFormToken('booking', '#modal-form');
  modalRoute.val('').removeClass('has-value').css('color', '#757575');
  modalTime.empty().append('<option value="" disabled selected>Сначала выберите маршрут</option>');
  modalTime.prop('disabled', true).removeClass('has-value').css('color', '#757575');
  $('.modal__hint').removeClass('modal__hint--top modal__hint--completed');
  setModalStatus('', '');
  setModalSending(false);
}

$(document).on('click', (event) => {
  if ($(event.target).is($('.button--modal'))) {
    modalOpen(modal);
  }
})

function modalClose(modal) {
  modal.fadeOut(600);
  $('html').css('overflow', 'auto');
  setModalSending(false);
}

function modalOpen(modal) {
  setModalStatus('', '');
  refreshFormToken('booking', '#modal-form');
  modal.fadeIn(300);
  $('html').css('overflow', 'hidden');
  setTimeout(function () {
    $('#modal-name').trigger('focus');
  }, 250);

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
  modalTime.prop('disabled', true);

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
  modalTime.empty().append('<option value="" disabled selected>Выберите время</option>');
  modalTime.prop('disabled', !event.target.value);
  modalTime.removeClass('has-value').css('color', '#757575');
  modalTime.siblings('.modal__hint').removeClass('modal__hint--top modal__hint--completed');

  if (event.target.value === 'Самара—Казань') {
    modalTime.append(`
      <option value="7:00(Самара-Казань)">7:00 (Самара - Казань)</option>
      `);
    // <option value="14:00(Самара-Казань)">14:00 (Самара - Казань)</option>
  } else if (event.target.value === 'Казань—Самара') {
    modalTime.append(`
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
    setModalStatus('', '');
    setModalSending(true);
    $.ajax({
      url: './../php/modal-send.php',
      type: 'POST',
      data: modalForm.serialize(),
      success: function () {
        setModalStatus('success', 'Спасибо! Заявка успешно отправлена.');

        setTimeout(function () {
          modalClose($('.modal'));
          resetModalFormState();
        }, 1400);
      },
      error: function (response) {
        setModalStatus('error', response.responseText || 'Ошибка при отправке. Попробуйте снова.');
        setModalSending(false);
      }
    });
  })
  .onFail(fields => {
    focusFirstInvalidField(fields);
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


function loadScript(src) {
  return new Promise(function (resolve, reject) {
    if ($(`script[src="${src}"]`).length) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initMap() {

  if (!document.getElementById('map-kazan') || !document.getElementById('map-samara')) {
    return;
  }

  await loadScript('./js/ya-map.js');
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

const scheduleSection = document.getElementById('schedule');
let isMapInitialized = false;
function initMapOnce() {
  if (isMapInitialized) {
    return;
  }

  isMapInitialized = true;
  initMap().catch(function () {
    isMapInitialized = false;
  });
}

if (scheduleSection && 'IntersectionObserver' in window) {
  const mapObserver = new IntersectionObserver(function (entries, observer) {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      initMapOnce();
    }
  }, {
    rootMargin: '300px 0px',
  });

  mapObserver.observe(scheduleSection);
} else {
  initMapOnce();
}
