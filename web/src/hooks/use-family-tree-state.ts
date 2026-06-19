"use client";

import { useCallback, useMemo, useState } from "react";

import {
  getDisplayPathLabelsForSelection,
  getPersonById,
  getViewerPerson,
} from "@/lib/family-tree/selectors";
import type { FamilyTreeSnapshot } from "@/lib/family-tree/types";

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;

const DEFAULT_VIEWPORT = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export function useFamilyTreeState(initialTree: FamilyTreeSnapshot) {
  const [selectedPersonId, setSelectedPersonId] = useState(
    initialTree.selectedPersonId
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);

  const selectedPerson = useMemo(
    () => getPersonById(initialTree, selectedPersonId),
    [initialTree, selectedPersonId]
  );

  const viewerPerson = useMemo(
    () => getViewerPerson(initialTree),
    [initialTree]
  );

  const filteredPeople = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    if (!normalized) {
      return initialTree.people;
    }

    return initialTree.people.filter((person) => {
      return (
        person.primaryName.toLowerCase().includes(normalized) ||
        person.chineseTitle.toLowerCase().includes(normalized) ||
        person.englishTitle.toLowerCase().includes(normalized) ||
        person.branch.toLowerCase().includes(normalized)
      );
    });
  }, [initialTree.people, searchQuery]);

  const pathLabels = useMemo(() => {
    return getDisplayPathLabelsForSelection(initialTree, selectedPersonId);
  }, [initialTree, selectedPersonId]);

  const selectPerson = useCallback((personId: string) => {
    setSelectedPersonId(personId);
  }, []);

  const selectFirstSearchResult = useCallback(() => {
    if (filteredPeople.length === 0) {
      return;
    }

    setSelectedPersonId(filteredPeople[0].id);
  }, [filteredPeople]);

  const zoomIn = useCallback(() => {
    setViewport((current) => ({
      ...current,
      zoom: Math.min(MAX_ZOOM, roundZoom(current.zoom + ZOOM_STEP)),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((current) => ({
      ...current,
      zoom: Math.max(MIN_ZOOM, roundZoom(current.zoom - ZOOM_STEP)),
    }));
  }, []);

  const fitTree = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT);
  }, []);

  const panBy = useCallback((deltaX: number, deltaY: number) => {
    setViewport((current) => ({
      ...current,
      offsetX: current.offsetX + deltaX,
      offsetY: current.offsetY + deltaY,
    }));
  }, []);

  const centerOnSelected = useCallback(() => {
    if (!selectedPerson) {
      return;
    }

    setViewport((current) => ({
      ...current,
      offsetX: 340 - selectedPerson.x,
      offsetY: 220 - selectedPerson.y,
    }));
  }, [selectedPerson]);

  return {
    tree: initialTree,
    selectedPerson,
    selectedPersonId,
    viewerPerson,
    pathLabels,
    filteredPeople,
    searchQuery,
    setSearchQuery,
    selectPerson,
    selectFirstSearchResult,
    viewport,
    zoomIn,
    zoomOut,
    fitTree,
    panBy,
    centerOnSelected,
  };
}

function roundZoom(value: number) {
  return Number(value.toFixed(2));
}
