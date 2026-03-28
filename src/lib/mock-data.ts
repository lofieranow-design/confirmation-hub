// Mock data for development before Lovable Cloud is connected

export interface Agent {
  id: string;
  name: string;
  email: string;
  suffix_code: string;
}

export interface CustomerSubmission {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  created_at: string;
  agent_id: string;
}

export const mockAgent: Agent = {
  id: "agent-001",
  name: "Fatima Zahra",
  email: "fatima@confirma.ma",
  suffix_code: "FZ",
};

export const mockSubmissions: CustomerSubmission[] = [
  {
    id: "sub-001",
    customer_name: "Ahmed Benali - /FZ",
    phone: "+212 6 12 34 56 78",
    address: "123 Rue Mohammed V",
    city: "Casablanca",
    created_at: new Date().toISOString(),
    agent_id: "agent-001",
  },
  {
    id: "sub-002",
    customer_name: "Sara Idrissi - /FZ",
    phone: "+212 6 98 76 54 32",
    address: "45 Avenue Hassan II",
    city: "Rabat",
    created_at: new Date().toISOString(),
    agent_id: "agent-001",
  },
  {
    id: "sub-003",
    customer_name: "Youssef El Amrani - /FZ",
    phone: "+212 6 55 44 33 22",
    address: "78 Boulevard Zerktouni",
    city: "Marrakech",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    agent_id: "agent-001",
  },
  {
    id: "sub-004",
    customer_name: "Khadija Ouazzani - /FZ",
    phone: "+212 6 11 22 33 44",
    address: "12 Rue Fès",
    city: "Tanger",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    agent_id: "agent-001",
  },
  {
    id: "sub-005",
    customer_name: "Omar Tazi - /FZ",
    phone: "+212 6 77 88 99 00",
    address: "56 Avenue des FAR",
    city: "Fès",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    agent_id: "agent-001",
  },
];

export function getStatsFromSubmissions(submissions: CustomerSubmission[]) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    today: submissions.filter(s => new Date(s.created_at) >= startOfDay).length,
    week: submissions.filter(s => new Date(s.created_at) >= startOfWeek).length,
    month: submissions.filter(s => new Date(s.created_at) >= startOfMonth).length,
  };
}
