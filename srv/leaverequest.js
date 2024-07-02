const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { Employees, Leaves } = this.entities;

    // In-memory notification storage (for simplicity)
    let notifications = [];

    // Function to notify manager
    async function notifyManager(employeeId, leaveDetails) {
        // Store notification in memory
        notifications.push({
            employeeId,
            leaveDetails,
            timestamp: new Date(),
            read: false
        });
        console.log(`Notified manager for employeeId: ${employeeId} with details: ${JSON.stringify(leaveDetails)}`);
    }

    // Endpoint to apply for leave
    this.on('applyLeave', async (req) => {
        try {
            const { employeeId, startDate, endDate, description } = req.data;
            console.log(`applyLeave called with employeeId: ${employeeId}, startDate: ${startDate}, endDate: ${endDate}, description: ${description}`);
            
            // Calculate number of days of leave
            const leaveDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
            console.log(`Calculated leaveDays: ${leaveDays}`);

            // Get employee record
            const employee = await SELECT.one.from(Employees).where({ EmployeeId: employeeId });
            console.log(`Employee record: ${JSON.stringify(employee)}`);

            if (!employee) {
                console.error(`Employee with ID ${employeeId} not found`);
                return req.error(404, `Employee with ID ${employeeId} not found`);
            }

            // Check if employee has enough leaves
            if (employee.totalLeaves < leaveDays) {
                console.error(`Not enough leave balance. Employee has ${employee.totalLeaves} leaves, requested ${leaveDays} leaves.`);
                return req.error(400, `Not enough leave balance`);
            }

            // Insert leave record with status "Pending"
            const leaveRecord = await INSERT.into(Leaves).entries({ employeeId, startDate, endDate, description, status: 'Pending' });
            console.log(`Inserted leave record for employeeId: ${employeeId} with status 'Pending'`);

            // Notify manager
            await notifyManager(employeeId, { startDate, endDate, description, leaveId: leaveRecord.ID });

            return { message: "Leave request submitted successfully and is pending approval" };
        } catch (error) {
            console.error("Error applying leave:", error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

    // Endpoint to approve or reject leave
    this.on('approveLeave', async (req) => {
        try {
            const { leaveId, approve } = req.data;
            console.log(`approveLeave called with leaveId: ${leaveId}, approve: ${approve}`);

            // Get leave record
            const leave = await SELECT.one.from(Leaves).where({ ID: leaveId });
            console.log(`Leave record: ${JSON.stringify(leave)}`);

            if (!leave) {
                console.error(`Leave with ID ${leaveId} not found`);
                return req.error(404, `Leave with ID ${leaveId} not found`);
            }

            // Update leave status
            const newStatus = approve ? 'Approved' : 'Rejected';
            await UPDATE(Leaves).set({ status: newStatus }).where({ ID: leaveId });
            console.log(`Updated leave status for leaveId: ${leaveId} to ${newStatus}`);

            // If approved, decrement leave balance
            if (approve) {
                const leaveDays = (new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24) + 1;
                await UPDATE(Employees).set({ totalLeaves: { '-=': leaveDays } }).where({ EmployeeId: leave.employeeId });
                console.log(`Updated leave balance for employeeId: ${leave.employeeId}`);
            }

            return { message: `Leave ${newStatus.toLowerCase()} successfully` };
        } catch (error) {
            console.error("Error approving leave:", error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

    // Endpoint to get leave balance
    this.on('getLeaveBalance', async (req) => {
        try {
            const { employeeId } = req.data;
            console.log(`getLeaveBalance called with employeeId: ${employeeId}`);

            // Get employee record
            const employee = await SELECT.one.from(Employees).where({ EmployeeId: employeeId });
            console.log(`Employee record: ${JSON.stringify(employee)}`);

            if (!employee) {
                console.error(`Employee with ID ${employeeId} not found`);
                return req.error(404, `Employee with ID ${employeeId} not found`);
            }

            return { message: `Remaining Leaves: ${employee.totalLeaves}`, totalLeaves: employee.totalLeaves };
        } catch (error) {
            console.error("Error getting leave balance:", error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

    // Endpoint to get notifications (for manager)
    this.on('getNotifications', async (req) => {
        try {
            return notifications.filter(notification => !notification.read);
        } catch (error) {
            console.error("Error getting notifications:", error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

    // Endpoint to mark notification as read
    this.on('markNotificationAsRead', async (req) => {
        try {
            const { notificationId } = req.data;
            const notification = notifications.find(n => n.timestamp.toISOString() === notificationId);
            if (notification) {
                notification.read = true;
                return { message: "Notification marked as read" };
            } else {
                return req.error(404, `Notification not found`);
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });
});
