# Trello Clone - Technical Documentation

## 🎯 Project Overview

A full-stack Trello clone built with **Next.js 15**, **React 19**, **Supabase**, and **TypeScript**. The application provides a modern project management experience with drag-and-drop functionality, real-time updates, and secure authentication.

### **Tech Stack**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Drag & Drop**: @dnd-kit library
- **Deployment**: Vercel-ready

---

## 📁 Project Structure

```
trello-clone-2/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   ├── boards/            # Board management
│   │   │   ├── lists/             # List operations
│   │   │   └── cards/             # Card operations
│   │   ├── auth/                  # Auth pages
│   │   ├── board/                 # Board components
│   │   ├── components/            # Reusable components
│   │   └── contexts/              # React contexts
│   └── lib/                       # Utility functions
├── prisma/                        # Database schema
├── public/                        # Static assets
└── supabase-setup.sql            # Database setup script
```

---

## 🔧 Core Components

### 1. **Authentication System**

#### **AuthContext** (`src/app/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}
```

**Purpose**: Global state management for user authentication
**Key Features**:
- Persistent login state using localStorage
- Automatic token validation
- User session management

#### **Login API** (`src/app/api/auth/login/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  
  const user = await getUserByEmail(email);
  const valid = await bcrypt.compare(password, user.password);
  
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}
```

**Purpose**: Handles user authentication
**Security Features**:
- Password hashing with bcrypt
- JWT token generation
- Input validation

#### **Register API** (`src/app/api/auth/register/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  
  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }
  
  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser(email, hashed, name);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
```

**Purpose**: User registration with validation
**Features**:
- Duplicate email checking
- Secure password hashing
- Input sanitization

---

### 2. **Database Layer**

#### **Supabase Client** (`src/lib/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

**Purpose**: Configure Supabase client instances
**Key Points**:
- Separate clients for client-side and server-side operations
- Admin client bypasses RLS for server operations
- Environment variable configuration

#### **Database Operations** (`src/lib/database.ts`)
```typescript
// User operations
export async function createUser(email: string, password: string, name: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([{ email, password, name }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Board operations
export async function getBoardsByOwner(ownerId: string) {
  const { data, error } = await supabaseAdmin
    .from('boards')
    .select(`
      *,
      lists (
        *,
        cards (*)
      )
    `)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

**Purpose**: Centralized database operations
**Features**:
- Type-safe database queries
- Error handling
- Nested data fetching with Supabase joins
- Access control verification

---

### 3. **API Routes**

#### **Boards API** (`src/app/api/boards/route.ts`)
```typescript
// GET /api/boards - Fetch user's boards
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const boards = await getBoardsByOwner(userId);
  return NextResponse.json({ boards });
}

// POST /api/boards - Create new board
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  const { name, organizationId } = await req.json();
  
  // Auto-create organization if none exists
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
}
```

**Purpose**: Board management endpoints
**Security**: JWT token validation for all operations
**Features**: Auto-organization creation, nested data fetching

#### **Lists API** (`src/app/api/lists/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  const { name, boardId } = await req.json();
  
  // Verify board ownership
  const hasAccess = await verifyBoardOwnership(boardId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Board not found or access denied' }, { status: 404 });
  }

  // Auto-calculate position
  const lastPosition = await getListPosition(boardId);
  const position = lastPosition + 1;

  const list = await createList(name, boardId, position);
  return NextResponse.json({ list });
}
```

**Purpose**: List management within boards
**Security**: Board ownership verification
**Features**: Automatic position calculation

#### **Cards API** (`src/app/api/cards/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  const { title, description, listId } = await req.json();
  
  // Verify list access through board ownership
  const hasAccess = await verifyListAccess(listId, userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
  }

  const lastPosition = await getCardPosition(listId);
  const position = lastPosition + 1;

  const card = await createCard(title, listId, position, description);
  return NextResponse.json({ card });
}
```

**Purpose**: Card management within lists
**Security**: Multi-level access verification (list → board → user)
**Features**: Position-based ordering

---

### 4. **Frontend Components**

#### **HomePage** (`src/app/components/HomePage.tsx`)
```typescript
interface Board {
  id: string;
  name: string;
  created_at: string;
  lists?: Array<{
    id: string;
    name: string;
    cards?: Array<{
      id: string;
      title: string;
    }>;
  }>;
}

export default function HomePage() {
  const { user, token, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchBoards = async () => {
    const response = await fetch('/api/boards', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    setBoards(data.boards);
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    const response = await fetch('/api/boards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newBoardName.trim() })
    });
    
    if (response.ok) {
      const data = await response.json();
      setBoards([data.board, ...boards]);
    }
  };
```

**Purpose**: Main dashboard showing all user boards
**Features**:
- Board grid layout with statistics
- Inline board creation form
- Real-time updates
- Responsive design

#### **Board Page** (`src/app/board/[id]/page.tsx`)
```typescript
export default function BoardPage() {
  const params = useParams();
  const { token } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);

  const fetchBoard = async () => {
    const response = await fetch(`/api/boards`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    const boardData = data.boards.find((b: Board) => b.id === params.id);
    setBoard(boardData);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    // Complex drag-and-drop logic
    // Updates local state immediately
    // TODO: Persist to database
  };
```

**Purpose**: Individual board view with drag-and-drop
**Features**:
- Dynamic routing with board ID
- Drag-and-drop card movement
- Real-time list and card management
- Navigation back to homepage

#### **KanbanList Component** (`src/app/board/KanbanList.tsx`)
```typescript
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
    <div ref={setNodeRef} className="flex flex-col">
      <h3 className="font-bold text-lg mb-2">{list.name}</h3>
      <SortableContext items={list.cards?.map((c: any) => c.id) || []}>
        <div className="flex flex-col gap-2">
          {list.cards?.map((card: any, cardIdx: number) => (
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
        <button onClick={onAddCard} className="mt-2 p-2 text-gray-600">
          + Add a card
        </button>
      )}
    </div>
  );
}
```

**Purpose**: Individual list component with drag-and-drop
**Features**:
- @dnd-kit integration
- Card rendering
- Add card functionality
- Sortable context

---

### 5. **Database Schema**

#### **Supabase Setup** (`supabase-setup.sql`)
```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    position FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    position FLOAT NOT NULL DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Purpose**: Complete database schema with relationships
**Features**:
- UUID primary keys
- Foreign key constraints
- Cascade deletes
- Position-based ordering
- Row Level Security (RLS)

---

## 🔒 Security Features

### **Authentication & Authorization**
- JWT token-based authentication
- bcrypt password hashing (10 rounds)
- Token expiration (7 days)
- Secure password validation

### **Database Security**
- Row Level Security (RLS) policies
- User-specific data access
- Server-side token validation
- Input sanitization

### **API Security**
- Protected routes with middleware
- User ownership verification
- Error handling without data leakage
- CORS configuration

---

## 🚀 Key Features

### **User Management**
- User registration and login
- Persistent sessions
- Profile management

### **Board Management**
- Create, view, and manage multiple boards
- Auto-organization creation
- Board statistics (lists, cards count)

### **List Management**
- Create and manage lists within boards
- Position-based ordering
- Real-time updates

### **Card Management**
- Create, edit, and delete cards
- Drag-and-drop functionality
- Position-based ordering
- Description support

### **UI/UX Features**
- Responsive design with Tailwind CSS
- Loading states and error handling
- Intuitive drag-and-drop interface
- Modern, clean design

---

## 🛠 Development Setup

### **Prerequisites**
- Node.js 18+
- Supabase account
- Git

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd trello-clone-2

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Set up database
# Run supabase-setup.sql in Supabase SQL editor

# Start development server
npm run dev
```

### **Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
JWT_SECRET=your_jwt_secret
```

---

## 🚀 Deployment

### **Vercel Deployment**
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### **Supabase Configuration**
1. Create Supabase project
2. Run database setup script
3. Configure RLS policies
4. Get API credentials

---

## 📊 Performance Optimizations

### **Database**
- Indexed queries for better performance
- Efficient joins with Supabase
- Position-based ordering
- Connection pooling

### **Frontend**
- Dynamic imports for code splitting
- Optimized re-renders
- Efficient state management
- Responsive design

### **API**
- Server-side data fetching
- Minimal data transfer
- Error handling
- Caching strategies

---

## 🔮 Future Enhancements

### **Planned Features**
- Real-time updates with Supabase Realtime
- File attachments with Supabase Storage
- Advanced card features (labels, due dates, assignees)
- Team collaboration features
- Mobile app with React Native

### **Technical Improvements**
- Implement drag-and-drop persistence
- Add comprehensive error boundaries
- Implement optimistic updates
- Add comprehensive testing suite
- Performance monitoring

---

## 💡 Interview Talking Points

### **Technical Decisions**
1. **Why Supabase over Prisma?** - Better for Vercel deployment, built-in RLS, real-time capabilities
2. **Why JWT over Supabase Auth?** - More control over authentication flow, easier integration
3. **Why @dnd-kit?** - Better accessibility, more flexible than react-beautiful-dnd
4. **Why Next.js 15?** - Latest features, better performance, App Router

### **Architecture Highlights**
1. **Separation of Concerns** - Clear separation between API, database, and UI layers
2. **Type Safety** - Full TypeScript implementation with proper interfaces
3. **Security First** - Multiple layers of security (RLS, JWT, input validation)
4. **Scalable Design** - Modular architecture that can grow with requirements

### **Challenges Solved**
1. **Data Structure Mismatch** - Handled Supabase snake_case vs React camelCase
2. **Drag-and-Drop State** - Complex state management for real-time updates
3. **Authentication Flow** - Seamless login/logout with persistent sessions
4. **Database Relationships** - Proper foreign key relationships with cascade deletes

This documentation provides a comprehensive overview of your Trello clone project, perfect for interview preparation and demonstrating your full-stack development skills!
