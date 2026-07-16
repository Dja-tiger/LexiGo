with entries (
    lemma, translation, phonetic, part_of_speech, topic, example, source, note
) as (
    values
    ('tenant', 'арендатор', '', 'noun', 'Daily Life', 'The tenant reported a leak in the bathroom.', 'lexigo-daily-life-v2', 'Человек, который арендует жильё.'),
    ('lease', 'договор аренды', '', 'noun', 'Daily Life', 'Please read the lease before signing it.', 'lexigo-daily-life-v2', 'Договор, определяющий условия аренды.'),
    ('security deposit', 'страховой депозит', '', 'noun phrase', 'Daily Life', 'The landlord returned the security deposit after the inspection.', 'lexigo-daily-life-v2', 'Сумма, оставляемая как гарантия при аренде.'),
    ('utility bill', 'счёт за коммунальные услуги', '', 'noun phrase', 'Daily Life', 'The utility bill includes water and electricity.', 'lexigo-daily-life-v2', 'Счёт за воду, электричество, отопление и другие услуги.'),
    ('maintenance', 'техническое обслуживание', '', 'noun', 'Daily Life', 'The building maintenance team will check the elevator.', 'lexigo-daily-life-v2', 'Работы по поддержанию имущества в исправном состоянии.'),
    ('faucet', 'водопроводный кран', '', 'noun', 'Daily Life', 'The kitchen faucet is dripping.', 'lexigo-daily-life-v2', 'Американский вариант; в британском английском часто tap.'),
    ('leak', 'протечка', '', 'noun', 'Daily Life', 'There is a small leak under the sink.', 'lexigo-daily-life-v2', 'Нежелательное вытекание воды или газа.'),
    ('plumber', 'сантехник', '', 'noun', 'Daily Life', 'We need a plumber to fix the pipe.', 'lexigo-daily-life-v2', 'Специалист по водопроводу и сантехнике.'),
    ('electrician', 'электрик', '', 'noun', 'Daily Life', 'An electrician will replace the damaged socket.', 'lexigo-daily-life-v2', 'Специалист по электропроводке и оборудованию.'),
    ('appliance', 'бытовой прибор', '', 'noun', 'Daily Life', 'This appliance uses very little electricity.', 'lexigo-daily-life-v2', 'Устройство для бытовых задач.'),
    ('cupboard', 'шкафчик', '', 'noun', 'Daily Life', 'The plates are in the kitchen cupboard.', 'lexigo-daily-life-v2', 'Шкаф для посуды, продуктов или вещей.'),
    ('freezer', 'морозильная камера', '', 'noun', 'Daily Life', 'Put the frozen food in the freezer.', 'lexigo-daily-life-v2', 'Отделение или устройство для замораживания.'),
    ('kettle', 'чайник', '', 'noun', 'Daily Life', 'Could you fill the kettle with water?', 'lexigo-daily-life-v2', 'Прибор или ёмкость для кипячения воды.'),
    ('vacuum cleaner', 'пылесос', '', 'noun phrase', 'Daily Life', 'The vacuum cleaner is in the hallway closet.', 'lexigo-daily-life-v2', 'Устройство для уборки пыли.'),
    ('blanket', 'одеяло', '', 'noun', 'Daily Life', 'The room is cold, so I need another blanket.', 'lexigo-daily-life-v2', 'Тёплое покрывало для сна.'),
    ('pillow', 'подушка', '', 'noun', 'Daily Life', 'This pillow is too firm for me.', 'lexigo-daily-life-v2', 'Предмет для поддержки головы во время сна.'),
    ('towel', 'полотенце', '', 'noun', 'Daily Life', 'Could I have a clean towel, please?', 'lexigo-daily-life-v2', 'Ткань для вытирания воды.'),
    ('toothpaste', 'зубная паста', '', 'noun', 'Daily Life', 'We need to buy toothpaste.', 'lexigo-daily-life-v2', 'Средство для чистки зубов.'),
    ('prescription', 'рецепт врача', '', 'noun', 'Daily Life', 'You need a prescription for this medicine.', 'lexigo-daily-life-v2', 'Документ врача для получения лекарства.'),
    ('refund', 'возврат денег', '', 'noun', 'Daily Life', 'The store issued a full refund.', 'lexigo-daily-life-v2', 'Деньги, возвращённые после отмены покупки.'),
    ('replace', 'заменить', '', 'verb', 'Daily Life', 'Could you replace the damaged item?', 'lexigo-daily-life-v2', 'Поставить другую вещь вместо старой или неисправной.'),
    ('complain', 'жаловаться', '', 'verb', 'Daily Life', 'I do not want to complain, but the order is late.', 'lexigo-daily-life-v2', 'Сообщать о проблеме или неудовлетворительном сервисе.'),
    ('rinse', 'ополаскивать', '', 'verb', 'Daily Life', 'Rinse the vegetables before cooking them.', 'lexigo-daily-life-v2', 'Быстро промыть чистой водой.'),
    ('plug in', 'подключить к розетке', '', 'phrasal verb', 'Daily Life', 'Plug in the charger before turning the device on.', 'lexigo-daily-life-v2', 'Соединить устройство с электропитанием.'),
    ('unplug', 'отключить от розетки', '', 'verb', 'Daily Life', 'Unplug the appliance before cleaning it.', 'lexigo-daily-life-v2', 'Отсоединить устройство от электропитания.')
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
