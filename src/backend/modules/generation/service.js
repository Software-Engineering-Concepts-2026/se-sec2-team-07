import { generateLocal } from './local.js';
import { generationInstructions } from './prompt.js';
export { generateLocal } from './local.js';
import { HttpError } from '../../shared/errors.js';
import { cardSchema, generationLevelSchema } from '../../shared/validation.js';

export async function generate(input, config, request = fetch) {
  const level = generationLevelSchema.parse(input.level);
  // Local extraction remains deterministic and does not adapt difficulty.
  if (input.mode === 'local') return generateLocal(input.text, input.count);
  if (!config.aiKey || !config.aiModel)
    throw new HttpError(503, 'ยังไม่ได้ตั้งค่า AI กรุณาใช้โหมดแยกข้อความ');
  const schema = {
    type: 'object',
    properties: {
      cards: {
        type: 'array',
        items: {
          type: 'object',
          properties: { front: { type: 'string' }, back: { type: 'string' } },
          required: ['front', 'back'],
          additionalProperties: false,
        },
      },
    },
    required: ['cards'],
    additionalProperties: false,
  };
  try {
    const instructions = generationInstructions(input, level);
    const chat = config.aiApi === 'chat';
    const body = chat
      ? {
          model: config.aiModel,
          stream: false,
          messages: [
            {
              role: 'system',
              content:
                instructions +
                ' Return only valid JSON in this exact shape: {"cards":[{"front":"question","back":"answer"}]}. No markdown or commentary.',
            },
            { role: 'user', content: input.text },
          ],
        }
      : {
          model: config.aiModel,
          store: false,
          instructions,
          input: input.text,
          text: { format: { type: 'json_schema', name: 'flashcards', strict: true, schema } },
        };
    const response = await request(
      `${config.aiBaseUrl || 'https://api.openai.com/v1'}/${chat ? 'chat/completions' : 'responses'}`,
      {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(90000),
        headers: { Authorization: `Bearer ${config.aiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      // Never expose the provider body: it can contain request data or credential details.
      const messages = {
        401: 'เชื่อมต่อ AI ไม่สำเร็จ: API key ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจการตั้งค่าเซิร์ฟเวอร์',
        403: 'บัญชี AI ไม่มีสิทธิ์ใช้งานที่ร้องขอ กรุณาตรวจสิทธิ์ของโครงการและโมเดล',
        404: 'ไม่พบโมเดล AI ที่ตั้งค่าไว้ หรือบัญชีไม่มีสิทธิ์ใช้โมเดลนี้',
        429: 'AI ถึงขีดจำกัดการใช้งานหรือโควตา กรุณาตรวจยอดการใช้งานแล้วลองใหม่ภายหลัง',
      };
      throw new HttpError(
        502,
        messages[response.status] ||
          'บริการ AI ไม่พร้อมใช้งาน หรือไม่รองรับการตั้งค่านี้ กรุณาลองใหม่หรือตรวจโมเดลบนเซิร์ฟเวอร์',
      );
    }
    const result = await response.json();
    let text;
    if (chat) {
      const choice = result.choices?.[0];
      if (
        choice?.finish_reason !== 'stop' ||
        choice.message?.refusal ||
        typeof choice.message?.content !== 'string'
      )
        throw new Error('Incomplete chat response');
      text = choice.message.content.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1');
    } else {
      if (result.status !== 'completed') throw new Error('Incomplete response');
      text = (result.output || [])
        .flatMap((item) => item.content || [])
        .filter((c) => c.type === 'output_text')
        .map((c) => c.text)
        .join('');
    }
    const cards = JSON.parse(text).cards;
    if (!Array.isArray(cards)) throw new Error('Invalid output');
    if (!cards.length)
      throw new HttpError(
        502,
        'AI ไม่ส่งการ์ดที่เหมาะกับเนื้อหาและระดับนี้ กรุณาเพิ่มเนื้อหา หรือเลือกระดับอื่นแล้วลองใหม่',
      );
    return cards.slice(0, input.count).map((card) => {
      const validated = cardSchema.omit({ id: true }).parse(card);
      // Remove only this complete definition-question wrapper, not arbitrary questions.
      const term = validated.front
        .trim()
        .match(/^คำว่า\s+([^\n?？]+?)\s+หมายถึงอะไร\s*[?？]?$/u)?.[1]
        ?.trim();
      return term ? { ...validated, front: term } : validated;
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error.name === 'TimeoutError' || error.name === 'AbortError')
      throw new HttpError(502, 'AI ใช้เวลานานเกินไป กรุณาลดเนื้อหาหรือจำนวนการ์ดแล้วลองใหม่');
    throw new HttpError(
      502,
      'สร้างการ์ดด้วย AI ไม่สำเร็จ โปรดตรวจคีย์ โมเดล และโควตา หรือลองโหมดแยกข้อความ',
    );
  }
}
