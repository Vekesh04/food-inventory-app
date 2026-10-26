import { cloudStorage } from './cloudStorage';

// Native CSV export functionality without external dependencies
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export all restaurant data as CSV files
export const exportAllDataAsCSV = () => {
  const data = cloudStorage.getFromCloud();
  const timestamp = new Date().toISOString().split('T')[0];
  
  // Prepare Users data
  const usersData = data.users.map(user => ({
    'User_ID': user.id,
    'Name': user.name,
    'Mobile': user.mobile,
    'Email': user.email || 'Not provided',
    'Joined_Date': user.joinedDate.toLocaleDateString(),
    'Last_Login': user.lastLoginDate ? user.lastLoginDate.toLocaleDateString() : 'Never',
    'Total_Orders': user.totalOrders,
    'Total_Spent': user.totalSpent,
    'Status': user.isActive ? 'Active' : 'Inactive'
  }));
  
  // Prepare Orders data
  const ordersData = data.orders.map(order => ({
    'Order_ID': order.id,
    'User_Name': order.userName,
    'User_Mobile': order.userMobile,
    'Items_Count': order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    'Total_Amount': order.total,
    'Payment_Method': order.paymentMethod,
    'Status': order.status,
    'Order_Date': order.orderDate.toLocaleDateString(),
    'Order_Time': order.orderDate.toLocaleTimeString(),
    'Session_ID': order.sessionId || 'N/A'
  }));
  
  // Prepare Payments data
  const paymentsData = data.payments.map(payment => ({
    'Payment_ID': payment.id,
    'Order_ID': payment.orderId,
    'User_Name': payment.userName,
    'User_Mobile': payment.userMobile,
    'Amount': payment.amount,
    'Method': payment.method,
    'Status': payment.status,
    'Transaction_ID': payment.transactionId || 'N/A',
    'Payment_Date': payment.paymentDate.toLocaleDateString(),
    'Payment_Time': payment.paymentDate.toLocaleTimeString()
  }));
  
  // Prepare Sessions data
  const sessionsData = data.sessions.map(session => {
    const duration = session.logoutTime 
      ? Math.round((session.logoutTime.getTime() - session.loginTime.getTime()) / (1000 * 60))
      : Math.round((new Date().getTime() - session.loginTime.getTime()) / (1000 * 60));
    
    return {
      'Session_ID': session.id,
      'User_Name': session.userName,
      'User_Mobile': session.userMobile,
      'Device_Type': session.deviceInfo?.deviceType || 'Unknown',
      'Browser': session.deviceInfo?.browser || 'Unknown',
      'Operating_System': session.deviceInfo?.os || 'Unknown',
      'Location': session.location?.city || 'Unknown',
      'IP_Address': session.ipAddress,
      'Login_Date': session.loginTime.toLocaleDateString(),
      'Login_Time': session.loginTime.toLocaleTimeString(),
      'Duration_Minutes': duration,
      'Status': session.isActive ? 'Active' : 'Ended'
    };
  });

  // Export each dataset as separate CSV files
  if (usersData.length > 0) {
    exportToCSV(usersData, `Users-Data-${timestamp}.csv`);
  }
  
  if (ordersData.length > 0) {
    exportToCSV(ordersData, `Orders-Data-${timestamp}.csv`);
  }
  
  if (paymentsData.length > 0) {
    exportToCSV(paymentsData, `Payments-Data-${timestamp}.csv`);
  }
  
  if (sessionsData.length > 0) {
    exportToCSV(sessionsData, `Sessions-Data-${timestamp}.csv`);
  }

  // Show success message
  const exportedFiles = [
    usersData.length > 0 ? 'Users Data' : null,
    ordersData.length > 0 ? 'Orders Data' : null,
    paymentsData.length > 0 ? 'Payments Data' : null,
    sessionsData.length > 0 ? 'Sessions Data' : null
  ].filter(Boolean);

  if (exportedFiles.length > 0) {
    alert(`Successfully exported:\n• ${exportedFiles.join('\n• ')}\n\nFiles downloaded as CSV format.`);
  } else {
    alert('No data available to export.');
  }
};

// Export specific data type as CSV
export const exportSpecificDataAsCSV = (dataType: 'users' | 'orders' | 'payments' | 'sessions') => {
  const data = cloudStorage.getFromCloud();
  const timestamp = new Date().toISOString().split('T')[0];
  
  let csvData: any[] = [];
  let filename = '';
  
  switch (dataType) {
    case 'users':
      csvData = data.users.map(user => ({
        'User_ID': user.id,
        'Name': user.name,
        'Mobile': user.mobile,
        'Email': user.email || 'Not provided',
        'Joined_Date': user.joinedDate.toLocaleDateString(),
        'Last_Login': user.lastLoginDate ? user.lastLoginDate.toLocaleDateString() : 'Never',
        'Total_Orders': user.totalOrders,
        'Total_Spent': user.totalSpent,
        'Status': user.isActive ? 'Active' : 'Inactive'
      }));
      filename = `Users-Data-${timestamp}.csv`;
      break;
      
    case 'orders':
      csvData = data.orders.map(order => ({
        'Order_ID': order.id,
        'User_Name': order.userName,
        'User_Mobile': order.userMobile,
        'Items_Count': order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        'Total_Amount': order.total,
        'Payment_Method': order.paymentMethod,
        'Status': order.status,
        'Order_Date': order.orderDate.toLocaleDateString(),
        'Order_Time': order.orderDate.toLocaleTimeString()
      }));
      filename = `Orders-Data-${timestamp}.csv`;
      break;
      
    case 'payments':
      csvData = data.payments.map(payment => ({
        'Payment_ID': payment.id,
        'Order_ID': payment.orderId,
        'User_Name': payment.userName,
        'Amount': payment.amount,
        'Method': payment.method,
        'Status': payment.status,
        'Payment_Date': payment.paymentDate.toLocaleDateString(),
        'Transaction_ID': payment.transactionId || 'N/A'
      }));
      filename = `Payments-Data-${timestamp}.csv`;
      break;
      
    case 'sessions':
      csvData = data.sessions.map(session => ({
        'Session_ID': session.id,
        'User_Name': session.userName,
        'Device_Type': session.deviceInfo?.deviceType || 'Unknown',
        'Location': session.location?.city || 'Unknown',
        'Login_Date': session.loginTime.toLocaleDateString(),
        'Status': session.isActive ? 'Active' : 'Ended'
      }));
      filename = `Sessions-Data-${timestamp}.csv`;
      break;
  }
  
  if (csvData.length > 0) {
    exportToCSV(csvData, filename);
    alert(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data exported successfully as ${filename}`);
  } else {
    alert(`No ${dataType} data available to export.`);
  }
};

// Export summary statistics as CSV
export const exportSummaryAsCSV = () => {
  const data = cloudStorage.getFromCloud();
  const timestamp = new Date().toISOString().split('T')[0];
  
  const summaryData = [
    { 'Metric': 'Total Users', 'Value': data.users.length },
    { 'Metric': 'Active Users', 'Value': data.users.filter(u => u.isActive).length },
    { 'Metric': 'Total Orders', 'Value': data.orders.length },
    { 'Metric': 'Total Revenue', 'Value': data.payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) },
    { 'Metric': 'Total Sessions', 'Value': data.sessions.length },
    { 'Metric': 'Active Sessions', 'Value': data.sessions.filter(s => s.isActive).length },
    { 'Metric': 'Unique Devices', 'Value': new Set(data.sessions.map(s => s.deviceInfo?.deviceId).filter(Boolean)).size },
    { 'Metric': 'Mobile Users', 'Value': data.sessions.filter(s => s.deviceInfo?.deviceType === 'Mobile').length },
    { 'Metric': 'Desktop Users', 'Value': data.sessions.filter(s => s.deviceInfo?.deviceType === 'Desktop').length },
    { 'Metric': 'Unique Locations', 'Value': new Set(data.sessions.map(s => s.location?.city).filter(Boolean)).size },
    { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
    { 'Metric': 'Export By', 'Value': 'Admin Dashboard' }
  ];
  
  exportToCSV(summaryData, `Restaurant-Summary-${timestamp}.csv`);
  alert(`Summary statistics exported as Restaurant-Summary-${timestamp}.csv`);
};