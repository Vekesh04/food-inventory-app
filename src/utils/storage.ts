export interface StorageData {
  users: any[];
  orders: any[];
  payments: any[];
  lastUpdated: string;
}

const STORAGE_KEY = 'ciolake_restaurant_data';

const getDefaultData = (): StorageData => ({
  users: [],
  orders: [],
  payments: [],
  lastUpdated: new Date().toISOString()
});

export const saveToStorage = (data: Partial<StorageData>) => {
  try {
    const existingData = getFromStorage();
    const updatedData = {
      ...existingData,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
};

export const getFromStorage = (): StorageData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        users: parsed.users?.map((user: any) => ({
          ...user,
          joinedDate: new Date(user.joinedDate)
        })) || [],
        orders: parsed.orders?.map((order: any) => ({
          ...order,
          orderDate: new Date(order.orderDate)
        })) || [],
        payments: parsed.payments?.map((payment: any) => ({
          ...payment,
          paymentDate: new Date(payment.paymentDate)
        })) || [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error loading from storage:', error);
  }
  
  return getDefaultData();
};