create table scenarios (
    slug text primary key,
    scenario_type text not null,
    title text not null,
    summary text not null,
    user_role text not null,
    workplace_goal text not null,
    completion_criterion text not null,
    constraints text[] not null default '{}',
    requires_fact_hypothesis boolean not null default false,
    estimated_minutes integer not null,
    version integer not null default 1,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint scenarios_slug_chk check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    constraint scenarios_type_chk check (scenario_type in (
        'incident',
        'troubleshooting',
        'architecture-review',
        'data-pipeline',
        'release',
        'status-update'
    )),
    constraint scenarios_estimated_minutes_chk check (estimated_minutes between 5 and 90),
    constraint scenarios_version_chk check (version > 0)
);

create table scenario_steps (
    scenario_slug text not null references scenarios(slug) on delete cascade,
    position integer not null,
    step_kind text not null,
    title text not null,
    prompt text not null,
    production_outcome text not null,
    vocabulary text[] not null default '{}',
    requires_fact_hypothesis boolean not null default false,
    min_response_characters integer not null default 40,
    primary key (scenario_slug, position),
    constraint scenario_steps_position_chk check (position >= 0),
    constraint scenario_steps_kind_chk check (step_kind in (
        'production',
        'fact-hypothesis',
        'revision',
        'final-message'
    )),
    constraint scenario_steps_min_response_chk check (min_response_characters between 20 and 2000)
);

create table scenario_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    scenario_slug text not null references scenarios(slug),
    scenario_version integer not null,
    current_position integer not null default 0,
    status text not null default 'active',
    version bigint not null default 1,
    started_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz,
    constraint scenario_attempts_position_chk check (current_position >= 0),
    constraint scenario_attempts_status_chk check (status in ('active', 'paused', 'completed', 'discarded')),
    constraint scenario_attempts_version_chk check (version > 0)
);

create unique index scenario_attempts_one_open_per_user_scenario_idx
    on scenario_attempts (user_id, scenario_slug)
    where status in ('active', 'paused');

create index scenario_attempts_user_updated_idx
    on scenario_attempts (user_id, updated_at desc);

create table scenario_attempt_steps (
    attempt_id uuid not null references scenario_attempts(id) on delete cascade,
    position integer not null,
    submission_id uuid not null,
    response text not null,
    facts text[] not null default '{}',
    hypotheses text[] not null default '{}',
    status text not null default 'processing',
    review_event_id bigint references review_events(id) on delete set null,
    created_at timestamptz not null default now(),
    accepted_at timestamptz,
    primary key (attempt_id, position),
    unique (attempt_id, submission_id),
    constraint scenario_attempt_steps_position_chk check (position >= 0),
    constraint scenario_attempt_steps_response_chk check (length(btrim(response)) between 20 and 5000),
    constraint scenario_attempt_steps_status_chk check (status in ('processing', 'accepted')),
    constraint scenario_attempt_steps_review_chk check (
        (status = 'processing' and review_event_id is null and accepted_at is null)
        or (status = 'accepted' and review_event_id is not null and accepted_at is not null)
    )
);

insert into scenarios (
    slug,
    scenario_type,
    title,
    summary,
    user_role,
    workplace_goal,
    completion_criterion,
    constraints,
    requires_fact_hypothesis,
    estimated_minutes
) values
    (
        'incident-update',
        'incident',
        'Обновление по инциденту',
        'Сформулируйте проверяемое обновление по production-инциденту без смешивания фактов и гипотез.',
        'on-call data engineer',
        'Дать команде точный статус, влияние, текущие действия и следующий checkpoint.',
        'Итоговое сообщение содержит подтверждённые факты, отдельно помеченные гипотезы, влияние, mitigation и время следующего обновления.',
        array['Не объявлять root cause без доказательств', 'Не скрывать customer impact', 'Указать следующий checkpoint'],
        true,
        18
    ),
    (
        'troubleshoot-latency',
        'troubleshooting',
        'Диагностика задержки',
        'Постройте последовательное troubleshooting-сообщение для роста latency в data service.',
        'backend engineer',
        'Сузить область поиска и предложить безопасную следующую проверку.',
        'Итог фиксирует наблюдение, проверенную гипотезу, исключённые причины и следующий диагностический шаг.',
        array['Одна проверка за шаг', 'Не путать correlation и causation', 'Сохранять rollback path'],
        false,
        16
    ),
    (
        'architecture-review-cache',
        'architecture-review',
        'Архитектурное ревью кэша',
        'Защитите решение по кэшированию с явными trade-offs, failure modes и критериями отмены.',
        'staff engineer',
        'Сформулировать решение, которое можно принять или отклонить по объективным критериям.',
        'Итог содержит контекст, выбранный вариант, отклонённую альтернативу, риски, observability и rollback criteria.',
        array['Не использовать абсолютные обещания', 'Назвать минимум один failure mode', 'Определить измеримый success criterion'],
        false,
        20
    ),
    (
        'data-pipeline-late-arrival',
        'data-pipeline',
        'Опоздавшие данные в пайплайне',
        'Опишите обработку late-arriving data и влияние на downstream витрины.',
        'data engineer',
        'Согласовать корректный replay/backfill план без duplicate processing.',
        'Итог определяет affected window, idempotency boundary, backfill order, validation и downstream communication.',
        array['Сохранить idempotency', 'Указать временное окно', 'Отделить replay от regular schedule'],
        false,
        18
    ),
    (
        'release-go-no-go',
        'release',
        'Go/No-Go по релизу',
        'Подготовьте release recommendation на основании подтверждённых сигналов и отдельно обозначенных рисков.',
        'release owner',
        'Принять проверяемое go/no-go решение с rollback trigger.',
        'Итог разделяет факты и предположения, перечисляет blocking/non-blocking risks, решение и rollback trigger.',
        array['Не считать отсутствие алертов доказательством', 'Назвать rollback trigger', 'Указать владельца следующего действия'],
        true,
        17
    ),
    (
        'weekly-status-update',
        'status-update',
        'Недельный технический статус',
        'Соберите короткий status update с результатом, рисками, зависимостями и следующим шагом.',
        'technical lead',
        'Сделать прогресс понятным без списка несвязанных действий.',
        'Итог связывает выполненную работу с outcome, называет один главный риск и конкретный следующий milestone.',
        array['Outcome важнее activity', 'Не скрывать dependency', 'Ограничить сообщение пятью предложениями'],
        false,
        12
    );

insert into scenario_steps (
    scenario_slug,
    position,
    step_kind,
    title,
    prompt,
    production_outcome,
    vocabulary,
    requires_fact_hypothesis,
    min_response_characters
) values
    ('incident-update', 0, 'fact-hypothesis', 'Разделите сигналы', 'Write the confirmed facts and the current hypotheses. Do not present a hypothesis as the root cause.', 'Факты и гипотезы перечислены раздельно.', array['incident', 'impact', 'hypothesis'], true, 60),
    ('incident-update', 1, 'production', 'Опишите mitigation', 'Write a concise mitigation update with the owner and the expected validation signal.', 'Mitigation связан с проверяемым сигналом.', array['mitigation', 'owner', 'validation'], false, 60),
    ('incident-update', 2, 'final-message', 'Соберите incident update', 'Produce the final incident update: status, impact, confirmed facts, hypotheses, mitigation and next checkpoint.', 'Готово рабочее сообщение для incident channel.', array['status', 'impact', 'mitigation'], true, 120),

    ('troubleshoot-latency', 0, 'production', 'Опишите наблюдение', 'State the latency symptom, affected scope and the first timestamp without explaining the cause.', 'Наблюдение отделено от объяснения.', array['latency', 'scope', 'timestamp'], false, 50),
    ('troubleshoot-latency', 1, 'revision', 'Сузьте гипотезу', 'Rewrite the hypothesis so that one diagnostic check can falsify it.', 'Гипотеза стала проверяемой.', array['hypothesis', 'diagnostic', 'falsify'], false, 60),
    ('troubleshoot-latency', 2, 'final-message', 'Предложите следующий шаг', 'Produce a troubleshooting update with evidence, excluded causes, the next check and a rollback-safe action.', 'Готово последовательное troubleshooting-сообщение.', array['evidence', 'rollback', 'next step'], false, 110),

    ('architecture-review-cache', 0, 'production', 'Зафиксируйте decision context', 'Describe the load pattern, consistency requirement and latency target that constrain the decision.', 'Контекст решения измерим.', array['consistency', 'latency', 'throughput'], false, 70),
    ('architecture-review-cache', 1, 'revision', 'Сравните trade-offs', 'Compare the selected cache strategy with one rejected alternative and name a failure mode.', 'Альтернативы сравниваются по критериям.', array['trade-off', 'failure mode', 'cache'], false, 90),
    ('architecture-review-cache', 2, 'final-message', 'Сформулируйте recommendation', 'Produce the architecture recommendation with observability, success criteria and rollback criteria.', 'Готово решение для architecture review.', array['observability', 'rollback', 'criteria'], false, 120),

    ('data-pipeline-late-arrival', 0, 'production', 'Определите affected window', 'State the event-time window, impacted datasets and downstream consumers.', 'Определены границы воздействия.', array['event time', 'downstream', 'window'], false, 60),
    ('data-pipeline-late-arrival', 1, 'revision', 'Защитите idempotency', 'Explain the replay key and how duplicate writes will be prevented.', 'Replay имеет idempotency boundary.', array['idempotency', 'replay', 'duplicate'], false, 80),
    ('data-pipeline-late-arrival', 2, 'final-message', 'Соберите backfill plan', 'Produce the ordered backfill plan with validation checks and downstream communication.', 'Готов production-safe backfill plan.', array['backfill', 'validation', 'downstream'], false, 120),

    ('release-go-no-go', 0, 'fact-hypothesis', 'Разделите release evidence', 'List confirmed release signals separately from assumptions and unresolved risks.', 'Факты, предположения и риски разделены.', array['release', 'signal', 'risk'], true, 60),
    ('release-go-no-go', 1, 'production', 'Определите rollback trigger', 'Write the measurable rollback trigger, owner and decision deadline.', 'Rollback trigger операционализирован.', array['rollback', 'trigger', 'owner'], false, 70),
    ('release-go-no-go', 2, 'final-message', 'Дайте go/no-go recommendation', 'Produce the final recommendation with evidence, blocking risks, decision and rollback plan.', 'Готово проверяемое release decision.', array['go/no-go', 'evidence', 'rollback'], true, 120),

    ('weekly-status-update', 0, 'production', 'Сформулируйте outcome', 'Describe the most important completed outcome, not the list of activities.', 'Работа связана с результатом.', array['outcome', 'completed', 'impact'], false, 50),
    ('weekly-status-update', 1, 'revision', 'Назовите риск и dependency', 'Write one current risk, its impact and the external dependency or decision needed.', 'Риск и dependency имеют владельца.', array['risk', 'dependency', 'owner'], false, 70),
    ('weekly-status-update', 2, 'final-message', 'Соберите status update', 'Produce a five-sentence status update with outcome, evidence, risk, dependency and next milestone.', 'Готов короткий недельный статус.', array['status update', 'milestone', 'evidence'], false, 100);
