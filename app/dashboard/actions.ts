'use server';

import { RequestService } from '@/services/request.service';

export async function fetchUrgentRequests() {
  try {
    const { requests } = await RequestService.getRequests();

    const filtered = (requests || []).filter((req: any) => 
      (req.urgency === 'High' || req.urgency === 'Critical') &&
      (req.status === 'Open' || req.status === 'In Progress') &&
      (req.type === 'money' || req.type === 'goods')
    );

    return { success: true, data: filtered };
  } catch (error) {
    console.error('Error fetching urgent requests:', error);
    return { success: false, data: [], error: 'Failed to fetch urgent requests' };
  }
}
