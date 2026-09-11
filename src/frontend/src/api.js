export async function api(path, method = 'GET', body, signal) {
  const response = await fetch(`/api${path}`, {
    method, credentials: 'same-origin', signal,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error('เซิร์ฟเวอร์ไม่พร้อมใช้งาน กรุณาลองใหม่'); }
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
