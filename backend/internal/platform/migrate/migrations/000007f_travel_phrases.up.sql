with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note,
    slug, cloze, cloze_answer
) as (
    values
    ('Where is the check-in desk?', 'Где стойка регистрации?', '', 'phrase', 'Travel', 'Where is the check-in desk for this airline?', 'lexigo-themed-phrases-v2', 'check-in desk — стойка регистрации.', 'phrase-where-is-the-check-in-desk', 'Where is the check-in _____?', 'desk'),
    ('I''d like an aisle seat.', 'Я хотел бы место у прохода.', '', 'phrase', 'Travel', 'I''d like an aisle seat if one is available.', 'lexigo-themed-phrases-v2', 'I''d like — вежливая форма запроса.', 'phrase-id-like-an-aisle-seat', 'I''d like an _____ seat.', 'aisle'),
    ('How many bags can I check in?', 'Сколько сумок я могу сдать в багаж?', '', 'phrase', 'Travel', 'How many bags can I check in without an extra fee?', 'lexigo-themed-phrases-v2', 'check in a bag — сдать багаж.', 'phrase-how-many-bags-can-i-check-in', 'How many bags can I check _____?', 'in'),
    ('My luggage has not arrived.', 'Мой багаж не прибыл.', '', 'phrase', 'Travel', 'My luggage has not arrived on the carousel.', 'lexigo-themed-phrases-v2', 'Фраза для обращения в службу розыска багажа.', 'phrase-my-luggage-has-not-arrived', 'My luggage has not _____.', 'arrived'),
    ('Is this the line for passport control?', 'Это очередь на паспортный контроль?', '', 'phrase', 'Travel', 'Is this the line for passport control or for security?', 'lexigo-themed-phrases-v2', 'line — очередь в американском английском.', 'phrase-is-this-the-line-for-passport-control', 'Is this the line for passport _____?', 'control'),
    ('How long is the delay?', 'Насколько долгая задержка?', '', 'phrase', 'Travel', 'How long is the delay and what is the new departure time?', 'lexigo-themed-phrases-v2', 'Вопрос при задержке транспорта.', 'phrase-how-long-is-the-delay', 'How long is the _____?', 'delay'),
    ('Which platform does the train leave from?', 'С какой платформы отправляется поезд?', '', 'phrase', 'Travel', 'Which platform does the train leave from today?', 'lexigo-themed-phrases-v2', 'leave from — отправляться с.', 'phrase-which-platform-does-the-train-leave-from', 'Which platform does the train leave _____?', 'from'),
    ('Does this bus go to the city center?', 'Этот автобус идёт в центр города?', '', 'phrase', 'Travel', 'Does this bus go to the city center or the airport?', 'lexigo-themed-phrases-v2', 'Частотный вопрос о маршруте.', 'phrase-does-this-bus-go-to-the-city-center', 'Does this bus go to the city _____?', 'center'),
    ('I''d like to book a room for two nights.', 'Я хотел бы забронировать номер на две ночи.', '', 'phrase', 'Travel', 'I''d like to book a room for two nights from Friday.', 'lexigo-themed-phrases-v2', 'book a room — забронировать номер.', 'phrase-id-like-to-book-a-room-for-two-nights', 'I''d like to book a room for two _____.', 'nights'),
    ('I have a reservation under my name.', 'У меня бронирование на моё имя.', '', 'phrase', 'Travel', 'I have a reservation under my name for three nights.', 'lexigo-themed-phrases-v2', 'under my name — на моё имя.', 'phrase-i-have-a-reservation-under-my-name', 'I have a reservation under my _____.', 'name'),
    ('Could I check in early?', 'Можно заселиться раньше?', '', 'phrase', 'Travel', 'Could I check in early if the room is ready?', 'lexigo-themed-phrases-v2', 'early check-in — раннее заселение.', 'phrase-could-i-check-in-early', 'Could I check in _____?', 'early'),
    ('What time is check-out?', 'Во сколько выезд из отеля?', '', 'phrase', 'Travel', 'What time is check-out on Sunday?', 'lexigo-themed-phrases-v2', 'check-out — оформление выезда.', 'phrase-what-time-is-check-out', 'What time is check-_____?', 'out'),
    ('Is breakfast included?', 'Завтрак включён?', '', 'phrase', 'Travel', 'Is breakfast included in the room rate?', 'lexigo-themed-phrases-v2', 'included — включён в стоимость.', 'phrase-is-breakfast-included', 'Is _____ included?', 'breakfast'),
    ('Could you recommend a local restaurant?', 'Не могли бы вы порекомендовать местный ресторан?', '', 'phrase', 'Travel', 'Could you recommend a local restaurant that is not too expensive?', 'lexigo-themed-phrases-v2', 'recommend — рекомендовать.', 'phrase-could-you-recommend-a-local-restaurant', 'Could you recommend a local _____?', 'restaurant'),
    ('How do I get to the old town?', 'Как добраться до старого города?', '', 'phrase', 'Travel', 'How do I get to the old town by public transport?', 'lexigo-themed-phrases-v2', 'How do I get to — как добраться до.', 'phrase-how-do-i-get-to-the-old-town', 'How do I get to the old _____?', 'town'),
    ('Could you show me on the map?', 'Не могли бы вы показать мне на карте?', '', 'phrase', 'Travel', 'Could you show me the station on the map?', 'lexigo-themed-phrases-v2', 'Полезно при уточнении маршрута.', 'phrase-could-you-show-me-on-the-map', 'Could you show me on the _____?', 'map'),
    ('Is it within walking distance?', 'До этого можно дойти пешком?', '', 'phrase', 'Travel', 'Is the hotel within walking distance of the center?', 'lexigo-themed-phrases-v2', 'within walking distance — в пешей доступности.', 'phrase-is-it-within-walking-distance', 'Is it within walking _____?', 'distance'),
    ('I''d like a round-trip ticket.', 'Я хотел бы билет туда и обратно.', '', 'phrase', 'Travel', 'I''d like a round-trip ticket for tomorrow.', 'lexigo-themed-phrases-v2', 'round-trip ticket — билет туда и обратно.', 'phrase-id-like-a-round-trip-ticket', 'I''d like a round-trip _____.', 'ticket'),
    ('Can I change my booking?', 'Могу я изменить бронирование?', '', 'phrase', 'Travel', 'Can I change my booking to a later flight?', 'lexigo-themed-phrases-v2', 'change a booking — изменить бронирование.', 'phrase-can-i-change-my-booking', 'Can I change my _____?', 'booking'),
    ('What is the cancellation fee?', 'Какова комиссия за отмену?', '', 'phrase', 'Travel', 'What is the cancellation fee for this ticket?', 'lexigo-themed-phrases-v2', 'fee — сбор или комиссия.', 'phrase-what-is-the-cancellation-fee', 'What is the cancellation _____?', 'fee'),
    ('Where can I exchange money?', 'Где я могу обменять деньги?', '', 'phrase', 'Travel', 'Where can I exchange money at a reasonable rate?', 'lexigo-themed-phrases-v2', 'exchange money — обменять валюту.', 'phrase-where-can-i-exchange-money', 'Where can I exchange _____?', 'money'),
    ('Do I need to validate the ticket?', 'Мне нужно прокомпостировать билет?', '', 'phrase', 'Travel', 'Do I need to validate the ticket before boarding?', 'lexigo-themed-phrases-v2', 'validate a ticket — активировать или прокомпостировать билет.', 'phrase-do-i-need-to-validate-the-ticket', 'Do I need to _____ the ticket?', 'validate'),
    ('Could you take a photo of me?', 'Не могли бы вы меня сфотографировать?', '', 'phrase', 'Travel', 'Could you take a photo of me with the building behind me?', 'lexigo-themed-phrases-v2', 'take a photo — сфотографировать.', 'phrase-could-you-take-a-photo-of-me', 'Could you take a _____ of me?', 'photo'),
    ('Is this area safe at night?', 'Этот район безопасен ночью?', '', 'phrase', 'Travel', 'Is this area safe at night for someone walking alone?', 'lexigo-themed-phrases-v2', 'Практичный вопрос о безопасности.', 'phrase-is-this-area-safe-at-night', 'Is this area safe at _____?', 'night'),
    ('I need help contacting my embassy.', 'Мне нужна помощь, чтобы связаться с посольством.', '', 'phrase', 'Travel', 'I need help contacting my embassy because my passport was stolen.', 'lexigo-themed-phrases-v2', 'Фраза для экстренной ситуации за границей.', 'phrase-i-need-help-contacting-my-embassy', 'I need help contacting my _____.', 'embassy')
)
insert into words (
    lemma, translation, phonetic, part_of_speech, topic, examples, source, note,
    kind, slug, cloze, cloze_answer
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
    'phrase',
    slug,
    cloze,
    cloze_answer
from entries
on conflict do nothing;
