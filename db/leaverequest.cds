namespace my.leaveapp;
entity Leaves {
    key ID : UUID;
    employeeId : Integer;
    startDate : Date;
    endDate : Date;
    description : String;
    status : String; // e.g., "Pending", "Approved", "Rejected"
}

entity Employees {
    key EmployeeId : Integer;
    firstName : String;
    lastName : String;
    employeeRole : String;
    emailId : String;
    phoneNumber : Integer;
    totalLeaves : Integer; // leaves for every employee, it has 30
}



entity Holidays {
  key ID          : Integer;
  name            : String(100);
  date            : Date;
}