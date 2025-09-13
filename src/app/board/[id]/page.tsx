"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import dynamic from "next/dynamic";

const KanbanList = dynamic(() => import("../KanbanList"), { ssr: false });

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
}

interface List {
  id: string;
  name: string;
  position: number;
  cards?: Card[];
}

interface Board {
  id: string;
  name: string;
  lists?: List[];
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (token && params.id) {
      fetchBoard();
    }
  }, [token, params.id]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const boardData = data.boards.find((b: Board) => b.id === params.id);
        if (boardData) {
          setBoard(boardData);
        } else {
          setError("Board not found");
        }
      } else {
        setError("Failed to fetch board");
      }
    } catch (error) {
      console.error('Error fetching board:', error);
      setError("Failed to fetch board");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !board) return;

    let sourceListIdx = -1,
      destListIdx = -1,
      cardIdx = -1,
      destCardIdx = -1;

    board.lists?.forEach((list, i) => {
      const idx = list.cards?.findIndex((c: Card) => c.id === active.id) ?? -1;
      if (idx !== -1) {
        sourceListIdx = i;
        cardIdx = idx;
      }
      const destIdx = list.cards?.findIndex((c: Card) => c.id === over.id) ?? -1;
      if (destIdx !== -1) {
        destListIdx = i;
        destCardIdx = destIdx;
      }
    });

    if (sourceListIdx === -1 || cardIdx === -1) return;
    if (destListIdx === -1 || destCardIdx === -1) return;
    if (sourceListIdx === destListIdx && cardIdx === destCardIdx) return;

    const card = board.lists?.[sourceListIdx]?.cards?.[cardIdx];
    if (!card) return;
    
    const newLists = board.lists?.map((l, i) =>
      i === sourceListIdx
        ? { ...l, cards: l.cards?.filter((c: Card) => c.id !== active.id) || [] }
        : l
    ) || [];
    
    if (newLists[destListIdx]?.cards) {
      newLists[destListIdx].cards!.splice(destCardIdx, 0, card);
    }

    setBoard({ ...board, lists: newLists });

    // TODO: Update card position in database
  };

  const addList = async () => {
    const name = prompt("Enter list name:");
    if (!name || !board) return;

    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, boardId: board.id })
      });

      if (response.ok) {
        const data = await response.json();
        setBoard({
          ...board,
          lists: [...(board.lists || []), data.list]
        });
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const addCard = async (listId: string) => {
    const title = prompt("Enter card title:");
    if (!title || !board) return;

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, listId })
      });

      if (response.ok) {
        const data = await response.json();
        setBoard({
          ...board,
          lists: board.lists?.map(list =>
            list.id === listId
              ? { ...list, cards: [...(list.cards || []), data.card] }
              : list
          ) || []
        });
      }
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="flex gap-4 p-8 overflow-x-auto min-h-screen">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {board.lists?.map((list, idx) => (
            <KanbanList
              key={list.id}
              list={list}
              listIdx={idx}
              onAddCard={() => addCard(list.id)}
            />
          ))}
          <div className="min-w-[300px]">
            <button
              onClick={addList}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add another list
            </button>
          </div>
        </DndContext>
      </div>
    </div>
  );
}
