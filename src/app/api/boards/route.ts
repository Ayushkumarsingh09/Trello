import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getBoardsByOwner, createBoard, getOrganizationByOwner, createOrganization } from '../../../lib/database';

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

// GET /api/boards - Get all boards for the authenticated user
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const boards = await getBoardsByOwner(userId);
    return NextResponse.json({ boards });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, organizationId } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    // For now, we'll create a default organization for the user if none exists
    let orgId = organizationId;
    if (!orgId) {
      const existingOrg = await getOrganizationByOwner(userId);
      
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const newOrg = await createOrganization(`${userId}'s Organization`, userId);
        orgId = newOrg.id;
      }
    }

    const board = await createBoard(name, orgId, userId);
    return NextResponse.json({ board });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
