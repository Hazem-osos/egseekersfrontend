import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    // Temporary: bypass auth and return mock data when flag is set
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      return NextResponse.json({
        success: true,
        data: {
          users: [
            { role: 'ADMIN', _count: { role: 1 } },
            { role: 'FREELANCER', _count: { role: 42 } },
            { role: 'CLIENT', _count: { role: 28 } },
          ],
          jobs: [
            { status: 'OPEN', _count: { status: 15 } },
            { status: 'IN_PROGRESS', _count: { status: 6 } },
            { status: 'COMPLETED', _count: { status: 20 } },
          ],
          orders: [
            { status: 'PENDING', _count: { status: 5 } },
            { status: 'COMPLETED', _count: { status: 18 } },
          ],
          gigs: [
            { categoryId: 'cat-1', _count: { categoryId: 10 } },
            { categoryId: 'cat-2', _count: { categoryId: 7 } },
          ],
        },
      });
    }
    // Dynamically import auth only when not bypassing to avoid @prisma/client initialization at build
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call backend API to get analytics data
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/admin/analytics`, {
      headers: {
        'Authorization': `Bearer ${session.user.id}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 