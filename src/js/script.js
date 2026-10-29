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

$('.accordion').accordion({
    icons: false,
    heightStyle: "content",
    collapsible: true
})

const modal = $('#modal');

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
    setTimeout(function () {
        $('#modal-phone-link').trigger('focus');
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

    const {YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer} = ymaps3;

    const {YMapDefaultMarker} = await ymaps3.import('@yandex/ymaps3-markers@0.0.1');

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
