using my.leaveapp as my from '../db/leaverequest';

service leavesrv {
    entity Leaves as projection on my.Leaves;
    entity Employees as projection on my.Employees;
    entity Holidays as projection on my.Holidays;
    
    action applyLeave(employeeId: Integer, startDate: Date, endDate: Date, description: String) returns String;
    action approveLeave(leaveId: UUID, approve: Boolean) returns String;
    action getLeaveBalance(employeeId: Integer) returns String;
    action getNotifications() returns String;
    action markNotificationAsRead(notificationId: String) returns String;
}
