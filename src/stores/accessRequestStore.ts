import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  role: string;
  unit: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
}

interface AccessRequestState {
  requests: AccessRequest[];
  loading: boolean;
  fetchRequests: () => Promise<void>;
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string, notes?: string) => Promise<void>;
}

export const useAccessRequestStore = create<AccessRequestState>((set, get) => ({
  requests: [],
  loading: false,

  fetchRequests: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    set({ requests: (data as AccessRequest[]) ?? [], loading: false });
  },

  approveRequest: async (id) => {
    await supabase.from('access_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);
    await get().fetchRequests();
  },

  rejectRequest: async (id, notes = '') => {
    await supabase.from('access_requests')
      .update({ status: 'rejected', notes, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    await get().fetchRequests();
  },
}));