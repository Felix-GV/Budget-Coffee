import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  const { productSlug, productName, phone, targetPrice } = await request.json();

  if (!productSlug || !phone || !targetPrice) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let productRes = await db.execute({
    sql: 'SELECT id FROM products WHERE slug = ?',
    args: [productSlug],
  });

  let productId: number;

  if (!productRes.rows.length) {
    const result = await db.execute({
      sql: 'INSERT INTO products (name, slug, retailer) VALUES (?, ?, ?) RETURNING id',
      args: [productName, productSlug, 'unknown'],
    });
    productId = result.rows[0].id as number;
  } else {
    productId = productRes.rows[0].id as number;
  }

  await db.execute({
    sql: 'INSERT INTO alerts (product_id, phone, target_price) VALUES (?, ?, ?)',
    args: [productId, phone, targetPrice],
  });

  return NextResponse.json({
    success: true,
    message: `Alert set! We'll notify ${phone} when the price drops below $${targetPrice}.`,
  });
}
