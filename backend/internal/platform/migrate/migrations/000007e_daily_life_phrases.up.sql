with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note,
    slug, cloze, cloze_answer
) as (
    values
    ('Could you help me with this?', 'Не могли бы вы помочь мне с этим?', '', 'phrase', 'Daily Life', 'Could you help me with this form?', 'lexigo-themed-phrases-v2', 'Вежливая универсальная просьба о помощи.', 'phrase-could-you-help-me-with-this', 'Could you _____ me with this?', 'help'),
    ('Where can I find the nearest supermarket?', 'Где я могу найти ближайший супермаркет?', '', 'phrase', 'Daily Life', 'Where can I find the nearest supermarket that is open now?', 'lexigo-themed-phrases-v2', 'nearest — ближайший.', 'phrase-where-can-i-find-the-nearest-supermarket', 'Where can I find the nearest _____?', 'supermarket'),
    ('I''m looking for the household section.', 'Я ищу отдел товаров для дома.', '', 'phrase', 'Daily Life', 'I''m looking for the household section and cleaning supplies.', 'lexigo-themed-phrases-v2', 'I''m looking for — нейтральный способ сказать, что вы ищете.', 'phrase-im-looking-for-the-household-section', 'I''m _____ for the household section.', 'looking'),
    ('Could I get a refund for this item?', 'Могу я получить возврат денег за этот товар?', '', 'phrase', 'Daily Life', 'Could I get a refund for this item if I have the receipt?', 'lexigo-themed-phrases-v2', 'get a refund — получить возврат денег.', 'phrase-could-i-get-a-refund-for-this-item', 'Could I get a _____ for this item?', 'refund'),
    ('The heating is not working.', 'Отопление не работает.', '', 'phrase', 'Daily Life', 'The heating is not working in the bedroom.', 'lexigo-themed-phrases-v2', 'Подходит для сообщения о бытовой неисправности.', 'phrase-the-heating-is-not-working', 'The _____ is not working.', 'heating'),
    ('I need to make a doctor''s appointment.', 'Мне нужно записаться к врачу.', '', 'phrase', 'Daily Life', 'I need to make a doctor''s appointment for tomorrow morning.', 'lexigo-themed-phrases-v2', 'make an appointment — записаться на конкретное время.', 'phrase-i-need-to-make-a-doctor-s-appointment', 'I need to make a doctor''s _____.', 'appointment'),
    ('Is there a pharmacy nearby?', 'Поблизости есть аптека?', '', 'phrase', 'Daily Life', 'Is there a pharmacy nearby that is open at night?', 'lexigo-themed-phrases-v2', 'nearby — поблизости.', 'phrase-is-there-a-pharmacy-nearby', 'Is there a _____ nearby?', 'pharmacy'),
    ('Can I pay by card?', 'Можно оплатить картой?', '', 'phrase', 'Daily Life', 'Can I pay by card or do you only accept cash?', 'lexigo-themed-phrases-v2', 'Короткая частотная фраза при оплате.', 'phrase-can-i-pay-by-card', 'Can I pay by _____?', 'card'),
    ('Could you repeat that more slowly?', 'Не могли бы вы повторить это медленнее?', '', 'phrase', 'Daily Life', 'Could you repeat that more slowly, please?', 'lexigo-themed-phrases-v2', 'Полезно, когда английскую речь трудно разобрать.', 'phrase-could-you-repeat-that-more-slowly', 'Could you repeat that more _____?', 'slowly'),
    ('I''m running late.', 'Я опаздываю.', '', 'phrase', 'Daily Life', 'I''m running late, but I''ll be there soon.', 'lexigo-themed-phrases-v2', 'running late — опаздывать относительно плана.', 'phrase-im-running-late', 'I''m running _____.', 'late'),
    ('I''ll be there in ten minutes.', 'Я буду там через десять минут.', '', 'phrase', 'Daily Life', 'I''ll be there in ten minutes, so please wait for me.', 'lexigo-themed-phrases-v2', 'in ten minutes — через десять минут.', 'phrase-i-ll-be-there-in-ten-minutes', 'I''ll be there in ten _____.', 'minutes'),
    ('Could you write it down?', 'Не могли бы вы это записать?', '', 'phrase', 'Daily Life', 'Could you write the address down for me?', 'lexigo-themed-phrases-v2', 'write down — записать информацию.', 'phrase-could-you-write-it-down', 'Could you write it _____?', 'down'),
    ('I don''t feel well.', 'Я плохо себя чувствую.', '', 'phrase', 'Daily Life', 'I don''t feel well and I have a temperature.', 'lexigo-themed-phrases-v2', 'Базовая фраза для описания плохого самочувствия.', 'phrase-i-dont-feel-well', 'I don''t feel _____.', 'well'),
    ('Where is the nearest restroom?', 'Где ближайший туалет?', '', 'phrase', 'Daily Life', 'Excuse me, where is the nearest restroom?', 'lexigo-themed-phrases-v2', 'restroom — частый американский вариант.', 'phrase-where-is-the-nearest-restroom', 'Where is the nearest _____?', 'restroom'),
    ('The tap is leaking.', 'Кран протекает.', '', 'phrase', 'Daily Life', 'The tap is leaking and the water will not stop.', 'lexigo-themed-phrases-v2', 'leaking — протекающий.', 'phrase-the-tap-is-leaking', 'The tap is _____.', 'leaking'),
    ('The power is out.', 'Электричество отключено.', '', 'phrase', 'Daily Life', 'The power is out in the whole building.', 'lexigo-themed-phrases-v2', 'the power is out — нет электричества.', 'phrase-the-power-is-out', 'The power is _____.', 'out'),
    ('Please leave the package at the door.', 'Пожалуйста, оставьте посылку у двери.', '', 'phrase', 'Daily Life', 'Please leave the package at the door if no one answers.', 'lexigo-themed-phrases-v2', 'Инструкция для курьера.', 'phrase-please-leave-the-package-at-the-door', 'Please leave the package at the _____.', 'door'),
    ('Could you send me the address?', 'Можешь прислать мне адрес?', '', 'phrase', 'Daily Life', 'Could you send me the address and the entrance code?', 'lexigo-themed-phrases-v2', 'send me — прислать мне.', 'phrase-could-you-send-me-the-address', 'Could you send me the _____?', 'address'),
    ('I need to pick up my order.', 'Мне нужно забрать мой заказ.', '', 'phrase', 'Daily Life', 'I need to pick up my order before the store closes.', 'lexigo-themed-phrases-v2', 'pick up — забрать готовый заказ.', 'phrase-i-need-to-pick-up-my-order', 'I need to pick _____ my order.', 'up'),
    ('Do you have this in another size?', 'У вас есть это в другом размере?', '', 'phrase', 'Daily Life', 'Do you have this jacket in another size?', 'lexigo-themed-phrases-v2', 'Частотная фраза в магазине одежды.', 'phrase-do-you-have-this-in-another-size', 'Do you have this in another _____?', 'size'),
    ('I''m just looking, thank you.', 'Я просто смотрю, спасибо.', '', 'phrase', 'Daily Life', 'I''m just looking, thank you. I''ll ask if I need help.', 'lexigo-themed-phrases-v2', 'Вежливый ответ консультанту.', 'phrase-im-just-looking-thank-you', 'I''m just _____, thank you.', 'looking'),
    ('Could you call a taxi for me?', 'Не могли бы вы вызвать мне такси?', '', 'phrase', 'Daily Life', 'Could you call a taxi for me and tell the driver the address?', 'lexigo-themed-phrases-v2', 'call a taxi — вызвать такси.', 'phrase-could-you-call-a-taxi-for-me', 'Could you call a _____ for me?', 'taxi'),
    ('How much does it cost?', 'Сколько это стоит?', '', 'phrase', 'Daily Life', 'How much does it cost with delivery?', 'lexigo-themed-phrases-v2', 'Универсальный вопрос о цене.', 'phrase-how-much-does-it-cost', 'How much does it _____?', 'cost'),
    ('Is service included?', 'Обслуживание включено?', '', 'phrase', 'Daily Life', 'Is service included in the total price?', 'lexigo-themed-phrases-v2', 'Вопрос о сервисном сборе или чаевых.', 'phrase-is-service-included', 'Is _____ included?', 'service'),
    ('Could we split the bill?', 'Мы можем разделить счёт?', '', 'phrase', 'Daily Life', 'Could we split the bill between three people?', 'lexigo-themed-phrases-v2', 'split the bill — разделить счёт.', 'phrase-could-we-split-the-bill', 'Could we split the _____?', 'bill')
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
