export function reorderedIds<T extends { id: number }>(items: T[], activeId: string | number, overId: string | number) {
  const oldIndex = items.findIndex((item) => String(item.id) === String(activeId));
  const newIndex = items.findIndex((item) => String(item.id) === String(overId));

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return null;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(oldIndex, 1);
  nextItems.splice(newIndex, 0, movedItem);
  return nextItems.map((item) => item.id);
}
