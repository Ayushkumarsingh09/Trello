import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyListAccess, getCardPosition, createCard } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Get user ID from token
function getUserIdFromToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// POST /api/cards - Create a new card
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, listId } = await req.json();
    
    if (!title || !listId) {
      return NextResponse.json({ error: 'Card title and list ID are required' }, { status: 400 });
    }

    // Verify the user has access to the list through the board
    const hasAccess = await verifyListAccess(listId, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    // Get the highest position in the list
    const lastPosition = await getCardPosition(listId);
    const position = lastPosition + 1;

    const card = await createCard(title, listId, position, description);
    return NextResponse.json({ card });
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}
