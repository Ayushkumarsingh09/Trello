import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyBoardOwnership, getListPosition, createList } from '../../../lib/database';

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
    const hasAccess = await verifyBoardOwnership(boardId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
    }

    // Get the highest position in the board
    const lastPosition = await getListPosition(boardId);
    const position = lastPosition + 1;

    const list = await createList(name, boardId, position);
    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
