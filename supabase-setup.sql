-- Supabase Database Setup Script for Trello Clone
-- Run this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Boards table
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Lists table
CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    position FLOAT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Cards table
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    position FLOAT NOT NULL DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Labels table
CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#000000'
);

-- Create Card Labels junction table
CREATE TABLE IF NOT EXISTS card_labels (
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, label_id)
);

-- Create Card Assignees junction table
CREATE TABLE IF NOT EXISTS card_assignees (
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, user_id)
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Organization Members junction table
CREATE TABLE IF NOT EXISTS organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (organization_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_organization_id ON boards(organization_id);
CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
CREATE INDEX IF NOT EXISTS idx_lists_position ON lists(position);
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(position);
CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id);
CREATE INDEX IF NOT EXISTS idx_activities_card_id ON activities(card_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Organizations policies
CREATE POLICY "Users can view organizations they own or are members of" ON organizations FOR SELECT 
USING (
    owner_id::text = auth.uid()::text OR 
    id IN (SELECT organization_id FROM organization_members WHERE user_id::text = auth.uid()::text)
);

-- Boards policies
CREATE POLICY "Users can view boards they own" ON boards FOR SELECT USING (owner_id::text = auth.uid()::text);
CREATE POLICY "Users can create boards" ON boards FOR INSERT WITH CHECK (owner_id::text = auth.uid()::text);
CREATE POLICY "Users can update own boards" ON boards FOR UPDATE USING (owner_id::text = auth.uid()::text);
CREATE POLICY "Users can delete own boards" ON boards FOR DELETE USING (owner_id::text = auth.uid()::text);

-- Lists policies
CREATE POLICY "Users can view lists in their boards" ON lists FOR SELECT 
USING (board_id IN (SELECT id FROM boards WHERE owner_id::text = auth.uid()::text));

CREATE POLICY "Users can create lists in their boards" ON lists FOR INSERT 
WITH CHECK (board_id IN (SELECT id FROM boards WHERE owner_id::text = auth.uid()::text));

CREATE POLICY "Users can update lists in their boards" ON lists FOR UPDATE 
USING (board_id IN (SELECT id FROM boards WHERE owner_id::text = auth.uid()::text));

CREATE POLICY "Users can delete lists in their boards" ON lists FOR DELETE 
USING (board_id IN (SELECT id FROM boards WHERE owner_id::text = auth.uid()::text));

-- Cards policies
CREATE POLICY "Users can view cards in their boards" ON cards FOR SELECT 
USING (list_id IN (
    SELECT l.id FROM lists l 
    JOIN boards b ON l.board_id = b.id 
    WHERE b.owner_id::text = auth.uid()::text
));

CREATE POLICY "Users can create cards in their boards" ON cards FOR INSERT 
WITH CHECK (list_id IN (
    SELECT l.id FROM lists l 
    JOIN boards b ON l.board_id = b.id 
    WHERE b.owner_id::text = auth.uid()::text
));

CREATE POLICY "Users can update cards in their boards" ON cards FOR UPDATE 
USING (list_id IN (
    SELECT l.id FROM lists l 
    JOIN boards b ON l.board_id = b.id 
    WHERE b.owner_id::text = auth.uid()::text
));

CREATE POLICY "Users can delete cards in their boards" ON cards FOR DELETE 
USING (list_id IN (
    SELECT l.id FROM lists l 
    JOIN boards b ON l.board_id = b.id 
    WHERE b.owner_id::text = auth.uid()::text
));

-- Comments policies
CREATE POLICY "Users can view comments in their boards" ON comments FOR SELECT 
USING (card_id IN (
    SELECT c.id FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id::text = auth.uid()::text
));

CREATE POLICY "Users can create comments in their boards" ON comments FOR INSERT 
WITH CHECK (card_id IN (
    SELECT c.id FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id::text = auth.uid()::text
));

-- Activities policies
CREATE POLICY "Users can view activities in their boards" ON activities FOR SELECT 
USING (card_id IN (
    SELECT c.id FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id::text = auth.uid()::text
));

CREATE POLICY "Users can create activities in their boards" ON activities FOR INSERT 
WITH CHECK (card_id IN (
    SELECT c.id FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE b.owner_id::text = auth.uid()::text
));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
