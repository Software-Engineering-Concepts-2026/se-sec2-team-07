import { clearReadCache, resetReadCacheSession } from './hooks/readCache.js';

export async function api(path, method = 'GET', body, signal) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      signal,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง');
  }
  if (response.status === 401) resetReadCacheSession();
  if (response.ok && !['GET', 'HEAD'].includes(method.toUpperCase())) {
    if (['/login', '/register', '/logout'].includes(path)) resetReadCacheSession();
    else clearReadCache();
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('เซิร์ฟเวอร์ไม่พร้อมใช้งาน กรุณาลองใหม่');
  }
  if (!response.ok) {
    if (response.status === 401 && !['/login', '/register', '/me'].includes(path)) {
      window.dispatchEvent(new Event('focus:unauthorized'));
    }
    const error = new Error(data.error || 'เกิดข้อผิดพลาด');
    error.status = response.status;
    throw error;
  }
  return data;
}
