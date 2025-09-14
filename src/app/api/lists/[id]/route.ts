import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyBoardOwnership, updateList, deleteList } from '../../../../lib/database';

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

// PUT /api/lists/[id] - Update a list
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    const { id } = await params;
    
    if (!name) {
      return NextResponse.json({ error: 'List name is required' }, { status: 400 });
    }

    // Verify the user has access to the list through the board
    const hasAccess = await verifyBoardOwnership(id, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    const list = await updateList(id, name);
    return NextResponse.json({ list });
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json({ error: 'Failed to update list' }, { status: 500 });
  }
}

// DELETE /api/lists/[id] - Delete a list
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    // Verify the user has access to the list through the board
    const hasAccess = await verifyBoardOwnership(id, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    await deleteList(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 });
  }
}
