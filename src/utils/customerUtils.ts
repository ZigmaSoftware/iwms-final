export type CustomerRecord = {
  id?: number | string;
  is_active?: boolean;
} & Record<string, any>;

export type ActiveRecord = {
  id?: number | string;
  is_active?: boolean;
} & Record<string, any>;

function normalizeList(data: any): ActiveRecord[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.data)) {
    return data.data;
  }
  if (data && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
}

export function normalizeCustomerArray(data: any): CustomerRecord[] {
  return normalizeList(data) as CustomerRecord[];
}

export function filterActiveRecords<T extends ActiveRecord>(
  records: T[],
  includeIds: Array<number | string> = []
): T[] {
  const includeSet = new Set(
    includeIds
      .map((value) => Number(value))
      .filter((value) => !Number.isNaN(value))
  );

  return records.filter((record) => {
    if (record?.id === undefined || record?.id === null) return false;
    const id = Number(record.id);
    if (Number.isNaN(id)) return false;

    return (record.is_active ?? true) || includeSet.has(id);
  });
}

export function filterActiveCustomers(
  customers: CustomerRecord[],
  includeIds: number[] = []
): CustomerRecord[] {
  return filterActiveRecords<CustomerRecord>(customers, includeIds);
}
