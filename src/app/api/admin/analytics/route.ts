import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user distribution
    const users = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    // Fetch job status distribution
    const jobs = await prisma.job.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Fetch payment status distribution
    const payments = await prisma.payment.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Fetch dispute status distribution
    const disputes = await prisma.dispute.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        users,
        jobs,
        payments,
        disputes,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 