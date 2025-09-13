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

// GET /api/boards - Get all boards for the authenticated user
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const boards = await prisma.board.findMany({
      where: { ownerId: userId },
      include: {
        lists: {
          include: {
            cards: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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
      const existingOrg = await prisma.organization.findFirst({
        where: { ownerId: userId }
      });
      
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const newOrg = await prisma.organization.create({
          data: {
            name: `${userId}'s Organization`,
            ownerId: userId
          }
        });
        orgId = newOrg.id;
      }
    }

    const board = await prisma.board.create({
      data: {
        name,
        organizationId: orgId,
        ownerId: userId
      },
      include: {
        lists: true
      }
    });

    return NextResponse.json({ board });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}
