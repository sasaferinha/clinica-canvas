import { validateBoard } from '@/lib/board';
import { BoardConflictError, readBoard, saveBoard } from '@/lib/storage';

export async function GET() {
  try {
    const { board, revision } = await readBoard();
    return Response.json({ board, revision }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Board read failed', error);
    return Response.json({ error: 'Mapa indisponível' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Origem inválida' }, { status: 403 });
  }

  let board;
  let revision;
  try {
    const text = await request.text();
    if (text.length > 1_500_000) {
      return Response.json({ error: 'Mapa muito grande' }, { status: 413 });
    }
    const data = JSON.parse(text);
    board = validateBoard(data.board);
    revision = data.revision;
    if (!Number.isInteger(revision) || revision < 0) throw new Error('Versão inválida');
  } catch {
    return Response.json({ error: 'Mapa inválido' }, { status: 400 });
  }

  try {
    return Response.json({ revision: await saveBoard(board, revision) });
  } catch (error) {
    if (error instanceof BoardConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    console.error('Board save failed', error);
    return Response.json({ error: 'Não foi possível salvar' }, { status: 503 });
  }
}
