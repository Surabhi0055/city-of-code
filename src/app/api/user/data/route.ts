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
      select: { lastCityUrl: true },
    });

    return NextResponse.json({ lastCityUrl: user?.lastCityUrl || "" });
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { lastCityUrl: url },
    });

    if (user) {
      await prisma.savedCity.upsert({
        where: { userId_url: { userId: user.id, url } },
        update: {},
        create: { userId: user.id, url },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save user data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
