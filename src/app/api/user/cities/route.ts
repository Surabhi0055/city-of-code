import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        savedCities: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    return NextResponse.json({ cities: user?.savedCities || [] });
  } catch (error) {
    console.error("Failed to fetch saved cities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
