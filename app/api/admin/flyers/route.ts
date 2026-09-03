import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const pageKeys = ["home", "in_house", "camps_clinics"] as const;
type FlyerPage = typeof pageKeys[number];

function isFlyerPage(value: unknown): value is FlyerPage {
  return typeof value === "string" && pageKeys.includes(value as FlyerPage);
}

export async function GET(req: NextRequest) {
  try {
    const pageKey = req.nextUrl.searchParams.get("page_key");
    if (pageKey && !isFlyerPage(pageKey)) {
      return NextResponse.json({ message: "Invalid page key" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT id, page_key, image_url, position
       FROM flyers
       WHERE ($1::text IS NULL OR page_key = $1)
       ORDER BY page_key, position, id`,
      [pageKey],
    );
    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    console.error("GET /api/admin/flyers error:", error);
    return NextResponse.json({ message: "Unable to load flyers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { page_key, image_url } = await req.json();
    if (!isFlyerPage(page_key) || typeof image_url !== "string" || !image_url.trim()) {
      return NextResponse.json({ message: "A valid page and image URL are required" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO flyers (page_key, image_url, position)
       VALUES ($1::varchar(32), $2, COALESCE((SELECT MAX(position) + 1 FROM flyers WHERE page_key = $1::varchar(32)), 1))
       RETURNING id, page_key, image_url, position`,
      [page_key, image_url.trim()],
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/flyers error:", error);
    return NextResponse.json({ message: "Unable to create flyer" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();

    if (Array.isArray(body.flyers)) {
      const flyers = body.flyers as Array<{ id: number; position: number }>;
      if (!flyers.length || flyers.some((flyer) => !Number.isInteger(flyer.id) || !Number.isInteger(flyer.position) || flyer.position < 1)) {
        return NextResponse.json({ message: "Invalid flyer order" }, { status: 400 });
      }

      await client.query("BEGIN");
      for (const flyer of flyers) {
        await client.query("UPDATE flyers SET position = position + 1000000 WHERE id = $1", [flyer.id]);
      }
      for (const flyer of flyers) {
        await client.query("UPDATE flyers SET position = $1, updated_at = NOW() WHERE id = $2", [flyer.position, flyer.id]);
      }
      await client.query("COMMIT");
      return NextResponse.json({ message: "Flyer order updated" });
    }

    const { id, image_url } = body;
    if (!Number.isInteger(id) || typeof image_url !== "string" || !image_url.trim()) {
      return NextResponse.json({ message: "A valid flyer ID and image URL are required" }, { status: 400 });
    }

    const result = await client.query(
      `UPDATE flyers SET image_url = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, page_key, image_url, position`,
      [image_url.trim(), id],
    );
    if (!result.rowCount) return NextResponse.json({ message: "Flyer not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    console.error("PUT /api/admin/flyers error:", error);
    return NextResponse.json({ message: "Unable to update flyer" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id)) return NextResponse.json({ message: "A valid flyer ID is required" }, { status: 400 });

    const result = await pool.query("DELETE FROM flyers WHERE id = $1 RETURNING id", [id]);
    if (!result.rowCount) return NextResponse.json({ message: "Flyer not found" }, { status: 404 });
    return NextResponse.json({ message: "Flyer deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/flyers error:", error);
    return NextResponse.json({ message: "Unable to delete flyer" }, { status: 500 });
  }
}

export const revalidate = 0;
