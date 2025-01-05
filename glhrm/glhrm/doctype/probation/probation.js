// Copyright (c) 2024, GLCAE and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Probation", {
// 	refresh(frm) {

// 	},
// });

// glhrm/glhrm/doctype/probation/prob.js

// frappe.ui.form.on('Probation', {
//     refresh: function(frm) {
//         // Add a custom button to set the full name
//         frm.add_custom_button(__('Set Full Name'), function() {
//             const firstName = frm.doc.first_name || '';
//             const middleName = frm.doc.middle_name || '';
//             const lastName = frm.doc.last_name || '';

//             frappe.call({
//                 method: 'glhrm.glhrm.doctype.probation.prob.setfullname',
//                 args: {
//                     first_name: firstName,
//                     middle_name: middleName,
//                     last_name: lastName
//                 },
//                 callback: function(response) {
//                     if (response.message) {
//                         frm.set_value('full_name', response.message);
//                     }
//                 }
//             });
//         });
//     }
// });

// glhrm/glhrm/doctype/probation/prob.js

// glhrm/glhrm/doctype/probation/prob.js

frappe.ui.form.on('Probation', {
    first_name: function(frm) {
        updateFullName(frm);
    },
    middle_name: function(frm) {
        updateFullName(frm);
    },
    last_name: function(frm) {
        updateFullName(frm);
    },


    onload: function(frm) {
        // Fetch the next Employee ID only for new records
        if (frm.is_new()) {
            frappe.call({
                method: "glhrm.glhrm.doctype.probation.prob.get_next_custom_employee_id",
                callback: function(r) {
                    if (!r.exc) {
                        let n;
                    

                        if (r.message >= 1 && r.message<10) {
                            n='RR/000'+r.message;
                        } else if (r.message >= 10 && r.message<100) {
                            n='RR/00'+r.message;
                        } else if (r.message >= 100 && r.message<1000) {
                            n='RR/0'+r.message;
                        } else {
                            n='RR/'+r.message;
                        }
                        
                      
                        frm.set_value("employee_id", n);
                        frappe.msgprint(`New Employee ID assigned: ${n}`);
                    }
                }
            });
        }
    }

});

function updateFullName(frm) {
    const firstName = frm.doc.first_name || '';
    const middleName = frm.doc.middle_name || '';
    const lastName = frm.doc.last_name || '';

    frappe.call({
        method: 'glhrm.glhrm.doctype.probation.prob.setfullname',
        args: {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName
        },
        callback: function(response) {
            if (response.message) {
                frm.set_value('full_name', response.message);
            }
        }
    });
}