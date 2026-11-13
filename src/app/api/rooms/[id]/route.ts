import { NextRequest, NextResponse } from 'next/server';
import { RoomState, UserParticipant, TranslationMessage } from '@/types';

// In-memory room store (per serverless instance / local dev)
// Per deployment Vercel multi-istanza, i client sincronizzano tramite PeerJS WebRTC
// con questo store come fallback affidabile
const rooms: Map<string, RoomState> = new Map();

// Pulizia periodica stanze inattive (> 4 ore)
function cleanOldRooms() {
  const now = Date.now();
  rooms.forEach((room, id) => {
    if (now - room.lastUpdated > 4 * 60 * 60 * 1000) {
      rooms.delete(id);
    }
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  cleanOldRooms();
  const roomId = params.id.toLowerCase();
  const room = rooms.get(roomId);

  if (!room) {
    return NextResponse.json({ error: 'Stanza non trovata' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const since = parseInt(searchParams.get('since') || '0', 10);

  const newMessages = since > 0
    ? room.messages.filter((m) => m.timestamp > since)
    : room.messages;

  return NextResponse.json({
    room: {
      id: room.id,
      participants: room.participants,
      createdAt: room.createdAt,
      lastUpdated: room.lastUpdated,
    },
    messages: newMessages,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  cleanOldRooms();
  const roomId = params.id.toLowerCase();
  const body = await req.json();
  const { action, participant, message } = body;

  let room = rooms.get(roomId);
  const now = Date.now();

  if (!room) {
    room = {
      id: roomId,
      participants: {},
      messages: [],
      createdAt: now,
      lastUpdated: now,
    };
    rooms.set(roomId, room);
  }

  room.lastUpdated = now;

  if (action === 'join' && participant) {
    room.participants[participant.id] = {
      ...participant,
      lastSeen: now,
    };
    return NextResponse.json({ success: true, room });
  }

  if (action === 'heartbeat' && participant) {
    if (room.participants[participant.id]) {
      room.participants[participant.id] = {
        ...room.participants[participant.id],
        ...participant,
        lastSeen: now,
      };
    }
    return NextResponse.json({ success: true });
  }

  if (action === 'leave' && participant) {
    delete room.participants[participant.id];
    return NextResponse.json({ success: true, room });
  }

  if (action === 'message' && message) {
    const newMessage: TranslationMessage = {
      ...message,
      timestamp: message.timestamp || now,
    };
    room.messages.push(newMessage);
    // Limita la cronologia delle ultime 100 frasi per risparmiare memoria
    if (room.messages.length > 100) {
      room.messages.shift();
    }
    return NextResponse.json({ success: true, message: newMessage });
  }

  return NextResponse.json({ error: 'Azione non riconosciuta' }, { status: 400 });
}
