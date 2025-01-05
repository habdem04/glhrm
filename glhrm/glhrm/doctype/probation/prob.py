# glhrm/glhrm/doctype/probation/prob.py

import frappe
from datetime import datetime, timedelta  # Ensure datetime and timedelta are imported

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
