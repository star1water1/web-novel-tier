/**
 * Context 모듈 진입점
 * @module contexts
 * @version 6.0
 *
 * @description
 * 5개 Context의 Provider와 Hook을 re-export.
 * AllProviders로 올바른 중첩 순서를 보장.
 *
 * 중첩 순서 (바깥→안쪽):
 *   AppProvider → DataProvider → TagProvider → FilterProvider → ModalProvider
 */

export { AppProvider, useApp } from "./AppContext";
export { DataProvider, useData } from "./DataContext";
export { TagProvider, useTag } from "./TagContext";
export { FilterProvider, useFilter } from "./FilterContext";
export { ModalProvider, useModal } from "./ModalContext";

// ── 복합 Provider ──
import React from "react";
import { AppProvider } from "./AppContext";
import { DataProvider } from "./DataContext";
import { TagProvider } from "./TagContext";
import { FilterProvider } from "./FilterContext";
import { ModalProvider } from "./ModalContext";

export function AllProviders({ children }) {
  return (
    <AppProvider>
      <DataProvider>
        <TagProvider>
          <FilterProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </FilterProvider>
        </TagProvider>
      </DataProvider>
    </AppProvider>
  );
}
