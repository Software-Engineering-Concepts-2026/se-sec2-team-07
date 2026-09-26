import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export function useRetryableSave(resource) {
  const pending = useRef(null);
  const [uncertain, setUncertain] = useState(false);
  useEffect(() => { pending.current = null; setUncertain(false); }, [resource]);
  async function save(path, method, body) {
    if (!pending.current) pending.current = { path, method, body: structuredClone({ ...body, request_id: crypto.randomUUID() }) };
    const request = pending.current;
    try {
      const result = await api(request.path, request.method, request.body);
      pending.current = null; setUncertain(false);
      return result;
    } catch (e) {
      if (e.status && e.status < 500) { pending.current = null; setUncertain(false); }
      else {
        setUncertain(true);
        e.message += ' — ยังไม่ทราบผลการบันทึก กดบันทึกอีกครั้งเพื่อตรวจผลเดิมโดยไม่สร้างซ้ำ กรุณาอยู่หน้านี้';
      }
      throw e;
    }
  }
  return { save, uncertain };
}
