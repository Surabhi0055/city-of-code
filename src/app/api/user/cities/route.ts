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

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, url, isSaved } = await req.json();
    if ((!id && !url) || typeof isSaved !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Ensure the city belongs to the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let updatedCity;

    if (id) {
      // Update by ID, verifying userId
      await prisma.savedCity.updateMany({
        where: { id, userId: user.id },
        data: { isSaved },
      });
      
      // Fetch the updated city to return its ID
      updatedCity = await prisma.savedCity.findFirst({
        where: { id, userId: user.id },
      });
    } else {
      // Upsert by userId and url
      updatedCity = await prisma.savedCity.upsert({
        where: { userId_url: { userId: user.id, url } },
        update: { isSaved },
        create: { userId: user.id, url, isSaved },
      });
    }

    return NextResponse.json({ success: true, city: updatedCity });
  } catch (error) {
    console.error("Failed to update saved city:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
