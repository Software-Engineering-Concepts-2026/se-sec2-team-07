import { createHash } from 'node:crypto';
import { HttpError } from './errors.js';

export function assertRevision(row, revision) {
  if (revision !== undefined && row.revision !== revision) {
    throw new HttpError(
      409,
      'ข้อมูลนี้ถูกแก้ไขจากอุปกรณ์อื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึกหรือลบอีกครั้ง',
    );
  }
}

// The receipt and mutation commit together. A lost HTTP response can be retried
// without creating another record, including after the original was deleted.
export async function saveOnce(client, uid, kind, id, input, operation) {
  const { request_id: suppliedRequestId, ...data } = input;
  const request_id = suppliedRequestId?.toLowerCase();
  if (!request_id) return operation();
  const hash = createHash('sha256').update(JSON.stringify({ id, data })).digest('hex');
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
    `${uid}:${kind}:${request_id}`,
  ]);
  const receipt = (
    await client.query(
      'SELECT input_hash,result_id FROM sync_receipts WHERE user_id=$1 AND kind=$2 AND request_id=$3',
      [uid, kind, request_id],
    )
  ).rows[0];
  if (receipt) {
    if (receipt.input_hash !== hash)
      throw new HttpError(409, 'คำขอบันทึกเดิมมีข้อมูลต่างกัน กรุณาโหลดข้อมูลล่าสุดแล้วลองใหม่');
    return receipt.result_id;
  }
  const result = await operation();
  await client.query(
    'INSERT INTO sync_receipts(user_id,kind,request_id,input_hash,result_id) VALUES($1,$2,$3,$4,$5)',
    [uid, kind, request_id, hash, result],
  );
  return result;
}
