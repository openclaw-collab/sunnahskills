import { getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";
import {
  buildSequencePayloadFromGrappleMapText,
  type FlatSpecItem,
} from "../../../shared/grapplemapFlatSequence";
import grapplemapText from "../../lib/GrappleMap.txt";

interface Env {
  DB?: D1Database;
  GRAPPLEMAP_TEXT?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

type Body = { sequence?: FlatSpecItem[] };

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "sequences", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const grapplemapSource =
    typeof grapplemapText === "string" && grapplemapText.length >= 1000 ? grapplemapText : env.GRAPPLEMAP_TEXT;

  if (!grapplemapSource || typeof grapplemapSource !== "string" || grapplemapSource.length < 1000) {
    return json(
      {
        error:
          "GrappleMap.txt not bundled. Run `node scripts/copy-grapplemap-txt.mjs` before build so functions/lib/GrappleMap.txt exists.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const sequence = body?.sequence;
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return json({ error: "sequence array is required ( { type, id } steps )" }, { status: 400 });
  }

  for (const step of sequence) {
    if (!step || typeof step !== "object") {
      return json({ error: "Each step must be { type: 'position' | 'transition', id: number }" }, { status: 400 });
    }
    if (step.type !== "position" && step.type !== "transition") {
      return json({ error: "Each step must be { type: 'position' | 'transition', id: number }" }, { status: 400 });
    }
    if (!Number.isFinite(step.id) || step.id < 0) {
      return json({ error: "Each step needs a non-negative numeric id" }, { status: 400 });
    }
  }

  const payload = buildSequencePayloadFromGrappleMapText("admin-extract", grapplemapSource, sequence as FlatSpecItem[]);
  return json(payload);
}
