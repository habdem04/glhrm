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