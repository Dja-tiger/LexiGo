with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note
) as (
    values
    ('itinerary', 'маршрут и план поездки', '', 'noun', 'Travel', 'Our itinerary includes three cities.', 'lexigo-travel-v2', 'План поездки с датами, местами и перемещениями.'),
    ('visa', 'виза', '', 'noun', 'Travel', 'Check whether you need a visa before booking the flight.', 'lexigo-travel-v2', 'Разрешение на въезд или пребывание в стране.'),
    ('embassy', 'посольство', '', 'noun', 'Travel', 'The embassy can issue an emergency travel document.', 'lexigo-travel-v2', 'Дипломатическое представительство страны.'),
    ('consulate', 'консульство', '', 'noun', 'Travel', 'Contact the consulate if your passport is lost.', 'lexigo-travel-v2', 'Учреждение, оказывающее консульские услуги гражданам.'),
    ('aisle', 'проход между рядами', '', 'noun', 'Travel', 'Please keep the aisle clear.', 'lexigo-travel-v2', 'Проход в самолёте, поезде или магазине.'),
    ('window seat', 'место у окна', '', 'noun phrase', 'Travel', 'I requested a window seat for the flight.', 'lexigo-travel-v2', 'Место рядом с окном.'),
    ('carry-on luggage', 'ручная кладь', '', 'noun phrase', 'Travel', 'Your carry-on luggage must fit under the seat.', 'lexigo-travel-v2', 'Багаж, который берут в салон.'),
    ('baggage claim', 'зона выдачи багажа', '', 'noun phrase', 'Travel', 'Meet me near baggage claim number four.', 'lexigo-travel-v2', 'Место получения зарегистрированного багажа.'),
    ('security checkpoint', 'пункт досмотра', '', 'noun phrase', 'Travel', 'Remove liquids before the security checkpoint.', 'lexigo-travel-v2', 'Зона проверки пассажиров и ручной клади.'),
    ('layover', 'пересадка между рейсами', '', 'noun', 'Travel', 'We have a three-hour layover in Doha.', 'lexigo-travel-v2', 'Время ожидания между двумя рейсами.'),
    ('terminal', 'терминал', '', 'noun', 'Travel', 'The flight departs from terminal two.', 'lexigo-travel-v2', 'Здание или зона аэропорта.'),
    ('shuttle bus', 'автобус-шаттл', '', 'noun phrase', 'Travel', 'A free shuttle bus connects the terminals.', 'lexigo-travel-v2', 'Автобус, регулярно курсирующий по короткому маршруту.'),
    ('rental car', 'арендованный автомобиль', '', 'noun phrase', 'Travel', 'We picked up the rental car at the airport.', 'lexigo-travel-v2', 'Автомобиль, взятый во временное пользование.'),
    ('round trip', 'поездка туда и обратно', '', 'noun phrase', 'Travel', 'A round trip is cheaper than two separate tickets.', 'lexigo-travel-v2', 'Маршрут с возвращением в исходную точку.'),
    ('one-way ticket', 'билет в одну сторону', '', 'noun phrase', 'Travel', 'I need a one-way ticket to Warsaw.', 'lexigo-travel-v2', 'Билет без обратного участка.'),
    ('timetable', 'расписание движения', '', 'noun', 'Travel', 'The updated timetable is available online.', 'lexigo-travel-v2', 'Список времени отправления и прибытия.'),
    ('fare', 'стоимость проезда', '', 'noun', 'Travel', 'The bus fare can be paid by card.', 'lexigo-travel-v2', 'Цена поездки на общественном транспорте.'),
    ('toll', 'плата за проезд', '', 'noun', 'Travel', 'There is a toll on this motorway.', 'lexigo-travel-v2', 'Плата за использование дороги, моста или тоннеля.'),
    ('landmark', 'достопримечательность, ориентир', '', 'noun', 'Travel', 'The tower is the city''s best-known landmark.', 'lexigo-travel-v2', 'Заметное место или объект.'),
    ('souvenir', 'сувенир', '', 'noun', 'Travel', 'I bought a small souvenir for my family.', 'lexigo-travel-v2', 'Предмет на память о поездке.'),
    ('board', 'садиться на транспорт', '', 'verb', 'Travel', 'Passengers may now board the aircraft.', 'lexigo-travel-v2', 'Войти в самолёт, поезд или судно перед отправлением.'),
    ('declare', 'декларировать', '', 'verb', 'Travel', 'You must declare goods above the duty-free limit.', 'lexigo-travel-v2', 'Официально сообщить о товарах на границе.'),
    ('navigate', 'ориентироваться, прокладывать маршрут', '', 'verb', 'Travel', 'The offline map helps us navigate the city.', 'lexigo-travel-v2', 'Определять путь и направление движения.'),
    ('explore', 'исследовать, осматривать', '', 'verb', 'Travel', 'We spent the morning exploring the old town.', 'lexigo-travel-v2', 'Знакомиться с новым местом.'),
    ('unpack', 'распаковывать вещи', '', 'verb', 'Travel', 'I unpacked my suitcase after checking in.', 'lexigo-travel-v2', 'Доставать вещи из багажа.')
)
insert into words (
    lemma, translation, phonetic, part_of_speech, topic, examples, source, note, kind
)
select
    lemma,
    translation,
    phonetic,
    part_of_speech,
    topic,
    jsonb_build_array(example),
    source,
    note,
    'word'
from entries
on conflict do nothing;
