import { signOut } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await signOut({ redirect: false });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to sign out" },
      { status: 500 }
    );
  }
}
