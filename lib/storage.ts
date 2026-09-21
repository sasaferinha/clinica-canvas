import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
import { validateBoard, type Board } from '@/lib/board';

const pathname = 'canvases/main.json';

export class BoardConflictError extends Error {
  constructor() {
    super('O mapa mudou em outra sessão');
  }
}

export async function readBoard(): Promise<{
  board: Board | null;
  revision: number;
  etag: string | null;
}> {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result) return { board: null, revision: 0, etag: null };
  if (!result.stream) throw new Error('Não foi possível ler o mapa');

  const stored = JSON.parse(await new Response(result.stream).text()) as {
    board: unknown;
    revision: unknown;
  };
  if (!Number.isInteger(stored.revision) || (stored.revision as number) < 1) {
    throw new Error('Versão do mapa inválida');
  }

  return {
    board: validateBoard(stored.board),
    revision: stored.revision as number,
    etag: result.blob.etag,
  };
}

export async function saveBoard(board: Board, expectedRevision: number): Promise<number> {
  const current = await readBoard();
  if (current.revision !== expectedRevision) throw new BoardConflictError();

  const revision = expectedRevision + 1;
  try {
    await put(pathname, JSON.stringify({ board, revision }), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: current.etag !== null,
      ...(current.etag ? { ifMatch: current.etag } : {}),
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new BoardConflictError();
    if (!current.etag && (await readBoard()).etag) throw new BoardConflictError();
    throw error;
  }

  return revision;
}
