import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  const { productSlug, productName, phone, targetPrice } = await request.json();

  if (!productSlug || !phone || !targetPrice) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Upsert product
  let product = db.prepare('SELECT id FROM products WHERE slug = ?').get(productSlug) as { id: number } | undefined;

  if (!product) {
    const result = db.prepare('INSERT INTO products (name, slug) VALUES (?, ?)').run(productName, productSlug);
    product = { id: result.lastInsertRowid as number };
  }

  db.prepare('INSERT INTO alerts (product_id, phone, target_price) VALUES (?, ?, ?)').run(
    product.id,
    phone,
    targetPrice
  );

  return NextResponse.json({ success: true, message: `Alert set! We'll SMS ${phone} when the price drops below $${targetPrice}.` });
}
