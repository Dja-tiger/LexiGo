import { describe, expect, it } from "vitest";

import { navigationURL } from "./navigation";
import { phraseCatalogFilters, phraseCatalogTarget } from "./phrase-navigation";

describe("phrase catalog navigation", () => {
  it("normalizes an empty route to default filters", () => {
    expect(phraseCatalogFilters({ view: "phrases" })).toEqual({
      topic: "all",
      query: "",
      sort: "default",
      page: 1,
    });
  });

  it("keeps filters and pagination in a phrase detail URL", () => {
    const target = phraseCatalogTarget({
      topic: "Frontend Architecture",
      query: "stable route",
      sort: "az",
      page: 2,
    }, "backend-route-contract");

    expect(target).toEqual({
      view: "phrases",
      topic: "Frontend Architecture",
      query: "stable route",
      sort: "az",
      page: 2,
      detail: "backend-route-contract",
    });
    expect(navigationURL(target)).toBe(
      "/phrases/backend-route-contract?topic=Frontend+Architecture&query=stable+route&sort=az&page=2",
    );
  });

  it("removes only detail when returning to the catalog", () => {
    const detail = phraseCatalogTarget({ topic: "Release", query: "deploy", sort: "za", page: 3 }, "phrase-deployed-staging");
    const filters = phraseCatalogFilters(detail);

    expect(phraseCatalogTarget(filters)).toEqual({
      view: "phrases",
      topic: "Release",
      query: "deploy",
      sort: "za",
      page: 3,
    });
  });
});
