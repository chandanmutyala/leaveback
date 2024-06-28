const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { Employees, Leaves } = this.entities;

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

            // Decrement leave balance
            await UPDATE(Employees).set({ totalLeaves: { '-=': leaveDays } }).where({ EmployeeId: employeeId });
            console.log(`Updated leave balance for employeeId: ${employeeId}`);

            // Insert leave record
            await INSERT.into(Leaves).entries({ employeeId, startDate, endDate, description });
            console.log(`Inserted leave record for employeeId: ${employeeId}`);

            return { message: "Leave applied successfully" };
        } catch (error) {
            console.error("Error applying leave:", error);
            return req.error(500, `Internal Server Error: ${error.message}`);
        }
    });

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
});
