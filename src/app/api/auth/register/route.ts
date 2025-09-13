import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getUserByEmail, createUser } from '../../../../lib/database';

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  
  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(email, hashed, name);
    return NextResponse.json({ 
      user: { id: user.id, email: user.email, name: user.name } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
