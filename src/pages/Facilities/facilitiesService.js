import { supabase } from "../../services/supabaseClient";

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("users").select("*").eq("auth_id", user.id).single();
  if (error || !data) return null;
  return data;
}

export async function getRooms() {
  const { data, error } = await supabase
    .from("rooms").select("*").order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addRoom(roomData) {
  const { data, error } = await supabase
    .from("rooms").insert([roomData]).select().single();
  if (error) throw error;
  return data;
}

export async function updateRoom(id, updates) {
  const { data, error } = await supabase
    .from("rooms").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRoom(id) {
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) throw error;
}

export async function getBookings() {
  const { data, error } = await supabase
    .from("room_bookings")
    .select("*, rooms(name, type), users(name, email)")
    .order("date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getBookingsByRoom(roomId) {
  const { data, error } = await supabase
    .from("room_bookings")
    .select("*, users(name)")
    .eq("room_id", roomId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addBooking(bookingData) {
  const { data, error } = await supabase
    .from("room_bookings").insert([bookingData]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBooking(id) {
  const { error } = await supabase.from("room_bookings").delete().eq("id", id);
  if (error) throw error;
}

export async function getIssues() {
  const { data, error } = await supabase
    .from("facility_issues")
    .select("*, rooms(name), users(name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addIssue(issueData) {
  const { data, error } = await supabase
    .from("facility_issues").insert([issueData]).select().single();
  if (error) throw error;
  return data;
}

export async function updateIssueStatus(id, status) {
  const { error } = await supabase
    .from("facility_issues").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function getEquipment() {
  const { data, error } = await supabase
    .from("equipment")
    .select("*, rooms(name)")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addEquipment(equipData) {
  const { data, error } = await supabase
    .from("equipment").insert([equipData]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEquipment(id) {
  const { error } = await supabase.from("equipment").delete().eq("id", id);
  if (error) throw error;
}

export function typeLabel(type) {
  const map = { classroom: "Classroom", lab: "Lab", lecture_hall: "Lecture Hall" };
  return map[type] || type;
}