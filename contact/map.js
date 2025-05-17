    document.addEventListener('DOMContentLoaded', function() {
        ymaps.ready(init);
        
        function init() {
            var myMap = new ymaps.Map("map", {
                center: [53.925810, 30.355942], 
                zoom: 16 
            });
            var myPlacemark = new ymaps.Placemark([53.925810, 30.355942], {
                hintContent: 'Farmzi',
                balloonContent: 'Беларусь, Могилев, улица Ивана Мазалова, 1'
            }, {
                iconLayout: 'default#image',
                iconImageHref: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png', 
                iconImageSize: [40, 40],
                iconImageOffset: [-20, -40]
            });
            myMap.geoObjects.add(myPlacemark);
            myMap.controls
                .add('zoomControl')
                .add('typeSelector')
                .add('fullscreenControl');
        }
    });