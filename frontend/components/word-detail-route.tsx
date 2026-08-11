"use client";

import { useCallback, useEffect, useState } from "react";

import {
  failedResourceStatus,
  idleResourceStatus,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import type { LearningItem } from "../lib/learning";
import { isWordDetailItem, type WordDetailItem } from "../lib/word-detail";
import { WordDetailPresentation } from "./word-detail-presentation";

type WordDetailRouteProps = {
  authenticated: boolean;
  detailKey: string;
  loadDetail: (wordID: number, signal: AbortSignal) => Promise<LearningItem>;
  loadRelatedPhrases: (item: WordDetailItem, signal: AbortSignal) => Promise<LearningItem[]>;
  onStartPractice: (item: WordDetailItem) => Promise<void>;
  onBack: () => void;
  onOpenPhrase: (phrase: LearningItem) => void;
  onRequireAuthentication: () => void;
};

type KeyedDetail = {
  key: string;
  item: LearningItem;
};

type KeyedStatus = {
  key: string;
  status: ResourceStatus;
};

type RelatedState = {
  key: string;
  items: LearningItem[];
  status: ResourceStatus;
};

export function WordDetailRoute({
  authenticated,
  detailKey,
  loadDetail,
  loadRelatedPhrases,
  onStartPractice,
  onBack,
  onOpenPhrase,
  onRequireAuthentication,
}: WordDetailRouteProps) {
  const [detail, setDetail] = useState<KeyedDetail | null>(null);
  const [detailStatus, setDetailStatus] = useState<KeyedStatus>({
    key: "",
    status: idleResourceStatus(),
  });
  const [related, setRelated] = useState<RelatedState>({
    key: "",
    items: [],
    status: idleResourceStatus(),
  });
  const [practiceStatus, setPracticeStatus] = useState<ResourceStatus>(idleResourceStatus);
  const [detailRetry, setDetailRetry] = useState(0);
  const [relatedRetry, setRelatedRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      const wordID = Number(detailKey);
      if (!Number.isSafeInteger(wordID) || wordID <= 0) {
        setDetailStatus({
          key: detailKey,
          status: failedResourceStatus(new Error("Некорректная ссылка на слово"), "карточку слова"),
        });
        return;
      }

      setDetailStatus({ key: detailKey, status: loadingResourceStatus() });
      setPracticeStatus(idleResourceStatus());
      try {
        const item = await loadDetail(wordID, controller.signal);
        if (controller.signal.aborted) return;
        setDetail({ key: detailKey, item });
        setDetailStatus({ key: detailKey, status: readyResourceStatus() });
      } catch (error) {
        if (controller.signal.aborted) return;
        setDetailStatus({ key: detailKey, status: failedResourceStatus(error, "карточку слова") });
      }
    }

    void run();
    return () => controller.abort();
  }, [detailKey, detailRetry, loadDetail]);

  const activeItem = detail?.key === detailKey ? detail.item : null;
  const activeDetailStatus = detailStatus.key === detailKey
    ? detailStatus.status
    : idleResourceStatus();

  useEffect(() => {
    if (!authenticated || !activeItem || !isWordDetailItem(activeItem)) {
      if (activeItem) {
        setRelated({
          key: `${detailKey}:${activeItem.prompt}`,
          items: [],
          status: readyResourceStatus(),
        });
      }
      return;
    }
    const relatedItem = activeItem;
    const controller = new AbortController();
    const relatedKey = `${detailKey}:${relatedItem.prompt}`;

    async function run() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      setRelated({ key: relatedKey, items: [], status: loadingResourceStatus() });
      try {
        const items = await loadRelatedPhrases(relatedItem, controller.signal);
        if (controller.signal.aborted) return;
        setRelated({ key: relatedKey, items, status: readyResourceStatus() });
      } catch (error) {
        if (controller.signal.aborted) return;
        setRelated({
          key: relatedKey,
          items: [],
          status: failedResourceStatus(error, "связанные фразы"),
        });
      }
    }

    void run();
    return () => controller.abort();
  }, [activeItem, authenticated, detailKey, loadRelatedPhrases, relatedRetry]);

  const activeRelatedKey = activeItem ? `${detailKey}:${activeItem.prompt}` : "";
  const activeRelated = related.key === activeRelatedKey
    ? related
    : { key: activeRelatedKey, items: [], status: idleResourceStatus() };

  const startPractice = useCallback(async (item: LearningItem) => {
    if (!authenticated) {
      onRequireAuthentication();
      return;
    }
    if (!isWordDetailItem(item)) {
      setPracticeStatus(failedResourceStatus(
        new Error("Карточка слова не содержит персональные данные для практики"),
        "практику слова",
      ));
      return;
    }
    setPracticeStatus(loadingResourceStatus());
    try {
      await onStartPractice(item);
      setPracticeStatus(readyResourceStatus());
    } catch (error) {
      setPracticeStatus(failedResourceStatus(error, "практику слова"));
    }
  }, [authenticated, onRequireAuthentication, onStartPractice]);

  return (
    <WordDetailPresentation
      authenticated={authenticated}
      item={activeItem}
      status={activeDetailStatus}
      relatedPhrases={activeRelated.items}
      relatedStatus={activeRelated.status}
      practiceStatus={practiceStatus}
      onBack={onBack}
      onRetry={() => setDetailRetry((value) => value + 1)}
      onRetryRelated={() => setRelatedRetry((value) => value + 1)}
      onPractice={(item) => void startPractice(item)}
      onOpenPhrase={onOpenPhrase}
    />
  );
}