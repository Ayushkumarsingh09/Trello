"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";

export default function KanbanList({
  list,
  listIdx,
  onAddCard,
}: {
  list: any;
  listIdx: number;
  onAddCard?: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: list.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 300,
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px #0001",
        padding: 16,
        marginRight: 16,
      }}
      className="flex flex-col"
    >
      <h3 className="font-bold text-lg mb-2">{list.name}</h3>
      <SortableContext items={list.cards.map((c: any) => c.id)}>
        <div className="flex flex-col gap-2">
          {list.cards.map((card: any, cardIdx: number) => (
            <KanbanCard
              key={card.id}
              card={card}
              listId={list.id}
              cardIdx={cardIdx}
            />
          ))}
        </div>
      </SortableContext>
      {onAddCard && (
        <button
          onClick={onAddCard}
          className="mt-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-left"
        >
          + Add a card
        </button>
      )}
    </div>
  );
}

function KanbanCard({
  card,
  listId,
  cardIdx,
}: {
  card: any;
  listId: string;
  cardIdx: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { listId, cardIdx } });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="bg-gray-100 rounded p-2 shadow hover:bg-blue-50 transition cursor-move"
    >
      {card.title}
    </div>
  );
}
