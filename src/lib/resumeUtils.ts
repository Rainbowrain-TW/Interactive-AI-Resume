export const isHidden = (entry?: { hidden?: boolean }) => entry?.hidden === true;

export const filterVisibleItems = <T extends { hidden?: boolean }>(items?: T[]) =>
  (items ?? []).filter((item) => !isHidden(item));

export const hasVisibleItems = (items?: { hidden?: boolean }[]) =>
  filterVisibleItems(items).length > 0;
