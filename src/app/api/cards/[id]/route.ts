import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyListAccess, updateCard, deleteCard } from '../../../../lib/database';

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

// PUT /api/cards/[id] - Update a card
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();
    const { id } = await params;
    
    if (!title) {
      return NextResponse.json({ error: 'Card title is required' }, { status: 400 });
    }

    // Verify the user has access to the card through the list and board
    const hasAccess = await verifyListAccess(id, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Card not found or access denied' }, { status: 404 });
    }

    const card = await updateCard(id, title, description);
    return NextResponse.json({ card });
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

// DELETE /api/cards/[id] - Delete a card
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    // Verify the user has access to the card through the list and board
    const hasAccess = await verifyListAccess(id, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Card not found or access denied' }, { status: 404 });
    }

    await deleteCard(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 });
  }
}
