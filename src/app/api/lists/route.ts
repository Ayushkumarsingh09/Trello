import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Get user ID from token
function getUserIdFromToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId;
  } catch {
    return null;
  }
}

// POST /api/lists - Create a new list
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, boardId } = await req.json();
    
    if (!name || !boardId) {
      return NextResponse.json({ error: 'List name and board ID are required' }, { status: 400 });
    }

    // Verify the user owns the board
    const board = await prisma.board.findFirst({
      where: { id: boardId, ownerId: userId }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    // Get the highest position in the board
    const lastList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' }
    });

    const position = lastList ? lastList.position + 1 : 0;

    const list = await prisma.list.create({
      data: {
        name,
        boardId,
        position
      },
      include: {
        cards: true
      }
    });

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
