# glhrm/glhrm/doctype/probation/prob.py

import frappe

@frappe.whitelist()
def setfullname(first_name, middle_name, last_name):
    full_name = f"{first_name} {middle_name} {last_name}".strip()
    return full_name