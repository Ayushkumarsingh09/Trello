import { supabaseAdmin } from './supabase'

export interface User {
  id: string
  email: string
  name: string
  password: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  owner_id: string
  created_at: string
}

export interface Board {
  id: string
  name: string
  organization_id: string
  owner_id: string
  created_at: string
}

export interface List {
  id: string
  name: string
  board_id: string
  position: number
  created_at: string
}

export interface Card {
  id: string
  title: string
  description?: string
  list_id: string
  position: number
  due_date?: string
  created_at: string
}

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

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Organization operations
export async function createOrganization(name: string, ownerId: string) {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .insert([{ name, owner_id: ownerId }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getOrganizationByOwner(ownerId: string) {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('owner_id', ownerId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Board operations
export async function createBoard(name: string, organizationId: string, ownerId: string) {
  const { data, error } = await supabaseAdmin
    .from('boards')
    .insert([{ name, organization_id: organizationId, owner_id: ownerId }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

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

export async function getBoardById(id: string, ownerId: string) {
  const { data, error } = await supabaseAdmin
    .from('boards')
    .select(`
      *,
      lists (
        *,
        cards (*)
      )
    `)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single()
  
  if (error) throw error
  return data
}

// List operations
export async function createList(name: string, boardId: string, position: number) {
  const { data, error } = await supabaseAdmin
    .from('lists')
    .insert([{ name, board_id: boardId, position }])
    .select(`
      *,
      cards (*)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function updateList(id: string, name: string) {
  const { data, error } = await supabaseAdmin
    .from('lists')
    .update({ name })
    .eq('id', id)
    .select(`
      *,
      cards (*)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function deleteList(id: string) {
  // First delete all cards in the list
  await supabaseAdmin
    .from('cards')
    .delete()
    .eq('list_id', id)
  
  // Then delete the list
  const { error } = await supabaseAdmin
    .from('lists')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

export async function getListPosition(boardId: string) {
  const { data, error } = await supabaseAdmin
    .from('lists')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)
  
  if (error) throw error
  return data?.[0]?.position ?? -1
}

// Card operations
export async function createCard(title: string, listId: string, position: number, description?: string) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .insert([{ title, list_id: listId, position, description }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateCard(id: string, title: string, description?: string) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .update({ title, description })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteCard(id: string) {
  const { error } = await supabaseAdmin
    .from('cards')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

export async function getCardPosition(listId: string) {
  const { data, error } = await supabaseAdmin
    .from('cards')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1)
  
  if (error) throw error
  return data?.[0]?.position ?? -1
}

// Verification functions
export async function verifyBoardOwnership(boardId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('boards')
    .select('id')
    .eq('id', boardId)
    .eq('owner_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

export async function verifyListAccess(listId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('lists')
    .select(`
      id,
      boards!inner (
        owner_id
      )
    `)
    .eq('id', listId)
    .eq('boards.owner_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return !!data
}
