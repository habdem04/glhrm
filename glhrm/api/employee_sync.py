import frappe
import requests

@frappe.whitelist()
def sync_employees():
    """
    Enqueue the employee sync process in the background.
    Returns quickly while the heavy task is processed asynchronously.
    """
    frappe.enqueue("glhrm.api.employee_sync.do_sync_employees")
    return "Employee sync job has been enqueued."

def do_sync_employees():
    """
    Background job that performs these steps:
      1. Authenticates with the remote DevExpress API.
      2. Retrieves active Employee data using the OData endpoint with a filter.
      3. Iterates over the records and maps:
           - EmployeeID       --> custom_employee_id
           - FullName         --> first_name
           - DateOfBirth      --> date_of_birth
           - DateOfemployment --> date_of_joining
      4. Upserts (updates or creates) Employee documents in ERPNext.
      
    Remote endpoints used:
      - Authentication: http://10.1.20.2:8282/mighrmwa/api/Authentication/Authenticate
      - Employee Data:  http://10.1.20.2:8282/mighrmwa/api/odata/Employee?$filter=Active eq true
    """
    try:
        # Step 1: Authenticate and obtain token
        auth_url = "http://10.1.20.2:8282/mighrmwa/api/Authentication/Authenticate"
        auth_headers = {
            "Accept": "*/*",
            "Content-Type": "application/json;odata.metadata=minimal;odata.streaming=true"
        }
        credentials = {"UserName": "Admin", "Password": "Glory@TT"}
        
        # Increase timeout to allow for slower responses – adjust if needed
        auth_resp = requests.post(auth_url, headers=auth_headers, json=credentials, timeout=60)
        auth_resp.raise_for_status()
        token = auth_resp.json().get("Token")
        if not token:
            frappe.throw("Authentication failed: no token received.")

        # Step 2: Retrieve active Employee data using OData filter
        employees_url = "http://10.1.20.2:8282/mighrmwa/api/odata/Employee?$filter=Active eq true"
        headers_auth = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json;odata.metadata=minimal;odata.streaming=true"
        }
        emp_resp = requests.get(employees_url, headers=headers_auth, timeout=60)
        emp_resp.raise_for_status()
        data = emp_resp.json()

        # OData endpoints often wrap records in a "value" property.
        employees = data.get("value", data)

        # Step 3: Process each employee record and upsert into ERPNext
        for emp in employees:
            remote_emp_id = emp.get("EmployeeID")
            if not remote_emp_id:
                continue  # Skip records missing an EmployeeID

            # Optional check: ensure the record is marked as Active
            if not emp.get("Active", False):
                continue

            # Check for an existing Employee using the custom field
            existing_employee = frappe.db.get_value("Employee", {"custom_employee_id": remote_emp_id}, "name")
            if existing_employee:
                doc = frappe.get_doc("Employee", existing_employee)
            else:
                doc = frappe.new_doc("Employee")
            
            # Map fields from the remote API to ERPNext Employee doctype fields
            doc.custom_employee_id = remote_emp_id
            doc.first_name = emp.get("FullName")
            doc.date_of_birth = emp.get("DateOfBirth")
            doc.date_of_joining = emp.get("DateOfemployment")
            doc.flags.ignore_permissions = True
            doc.save()

        frappe.db.commit()
        frappe.logger().info("Employee sync completed successfully.")
    except Exception as e:
        frappe.log_error(title="Employee Sync Error", message=frappe.get_traceback())
        frappe.throw("Error during synchronization: {0}".format(e))
