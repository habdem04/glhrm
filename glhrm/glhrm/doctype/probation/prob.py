# glhrm/glhrm/doctype/probation/prob.py

import frappe
from datetime import datetime, timedelta  # Ensure datetime and timedelta are imported
import requests


@frappe.whitelist()
def setfullname(first_name, middle_name, last_name):
    full_name = f"{first_name} {middle_name} {last_name}".strip()
    return full_name


@frappe.whitelist()
def get_next_custom_employee_id():
    try:
        # Extract numeric part and find the max ID
        result = frappe.db.sql(
            """
            SELECT custom_employee_id 
            FROM `tabEmployee` 
            ORDER BY LENGTH(custom_employee_id) DESC, custom_employee_id DESC 
            LIMIT 1
            """
        )

        last_employee_id = result[0][0] if result else None

        if last_employee_id:
            # Increment the numeric part
            numeric_part = ''.join(filter(str.isdigit, last_employee_id))
            next_id = int(numeric_part) + 1
            return  next_id # Example: EMP001

        return 1  # Default ID for the first employee

    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title="Error in get_next_custom_employee_id")
        frappe.throw("Failed to fetch the last Employee ID. Please check the logs.")



@frappe.whitelist()
def calculate_probation_end_date(start_date, probation_days):
    try:
        # Parse the start_date using YYYY-MM-DD format
        start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        frappe.logger().info(f"Parsed Start Date: {start_date}")

        # Get holidays
        holidays = get_holidays()
        frappe.logger().info(f"Holidays: {holidays}")

        # Calculate the end date excluding Sundays and holidays
        working_days = 0
        current_date = start_date

        while working_days < int(probation_days):
            current_date += timedelta(days=1)
            if current_date.weekday() != 6 and current_date not in holidays:  # Exclude Sundays and holidays
                working_days += 1
            else:
                frappe.logger().info(f"Skipping Date: {current_date}, Sunday or Holiday")

        return current_date.strftime("%Y-%m-%d")  # Return in YYYY-MM-DD format

    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title="Error in calculate_probation_end_date")
        frappe.throw(f"Error calculating probation end date: {e}")

def get_holidays():
    # Fetch holidays from all active Holiday Lists (adjust filter if needed)
    holiday_lists = frappe.get_all("Holiday List", fields=["name"])
    
    holidays = []
    for holiday_list in holiday_lists:
        holiday_dates = frappe.get_all("Holiday", filters={"parent": holiday_list["name"]}, fields=["holiday_date"])
        holidays.extend([frappe.utils.getdate(date["holiday_date"]) for date in holiday_dates])
    
    return holidays



# @frappe.whitelist()
# def apply_workflow(doc, method):
#     if doc.workflow_state == 'Approved' and doc.employment_type == 'Probation':
#         # Handle missing fields
#         middle_name = doc.middle_name if doc.middle_name else 'N/A'
#         last_name = doc.last_name if doc.last_name else 'N/A'

#         # Create a new Probation record
#         probation_doc = frappe.get_doc({
#             'doctype': 'Probation',
#             'employee_id': doc.custom_employee_id,
#             'first_name': doc.first_name,
#             'middle_name': middle_name,
#             'last_name': last_name,
#             'designation': doc.designation,
#             'department': doc.department,
#             'gender': doc.gender,
#             'date_of_birth': doc.date_of_birth,
#             'date_of_joining': doc.date_of_joining,
#             'basic_salary': doc.ctc
#         })
#         probation_doc.insert(ignore_permissions=True)
#         frappe.msgprint('Probation record created successfully.')




# # Set the script to run on the on_update event of the Employee doctype
# doc_events = {
#     "Employee": {
#         "on_update": "glhrm.glhrm.doctype.probation.prob.apply_workflow"
#     }
# }



@frappe.whitelist()
def fetch_employee_data2():
    # API endpoint and JWT token
    api_url = "http://192.168.8.3:8085/api/odata/Employee"
    jwt_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImVlOTI0MzNlLTMyYzQtNGViNC05OWMyLWRmNDZiNDlmOTcxZSIsIlhhZlNlY3VyaXR5QXV0aFBhc3NlZCI6IlhhZlNlY3VyaXR5QXV0aFBhc3NlZCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJBZG1pbiIsIlhhZlNlY3VyaXR5IjoiWGFmU2VjdXJpdHkiLCJYYWZMb2dvblBhcmFtcyI6InExWUtMVTR0OGt2TVRWV3lVbkpNeWMzTVU5SlJDa2dzTGk3UEwwcFJzbEpTcWdVQSIsImV4cCI6MTczNzM2Njc3MH0.nU3YNa1A3ANY4_1HUJwkDnEEFji62JdAIKWkqMtO8Mw"
    # Set up headers
    headers = {
        "Authorization": f"Bearer {jwt_token}"
    }

    # Make the request
    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()  # Raises an exception for HTTP errors

        # Check response status
        if response.status_code == 200:
            employees = response.json()["value"]
            employee_details = []
            for employee in employees:
                employee_details.append(f"EmployeeID: {employee['EmployeeID']}, FullName: {employee['FullName']}")
            return "\n".join(employee_details)
        else:
            return f"Failed to fetch data: {response.status_code} - {response.text}"
    except requests.exceptions.HTTPError as http_err:
        return f"HTTP error occurred: {http_err}"
    except requests.exceptions.RequestException as req_err:
        return f"An error occurred: {req_err}"
