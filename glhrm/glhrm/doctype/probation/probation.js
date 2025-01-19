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


const JD_OFFSET = 1723856;

function isEthiopianLeapYear(year) {
    return (year % 4 === 3);
}

function julianDayToDate(julianDay) {
    const millisPerDay = 86400000;
    const unixEpoch = 719163;
    const unixTime = (julianDay - unixEpoch) * millisPerDay;
    return new Date(unixTime);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function ethiopianToGregorian(ethiopianYear, ethiopianMonth, ethiopianDay) {
    const ETHIOPIAN_EPOCH = 2796;
    const ETHIOPIAN_MONTH_DAYS = [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 35];

    let julianDay = ETHIOPIAN_EPOCH;
    for (let i = 1; i < ethiopianYear; i++) {
        julianDay += 365;
        if (isEthiopianLeapYear(i)) {
            julianDay++;
        }
    }
    for (let i = 1; i < ethiopianMonth; i++) {
        julianDay += ETHIOPIAN_MONTH_DAYS[i - 1];
    }
    julianDay += ethiopianDay - 1; // subtract 1 to get the correct day

    if (ethiopianMonth === 13) {
        julianDay -= 5; // subtract 5 days only for the 13th month
    }

    const gregorianDate = julianDayToDate(julianDay);
    return formatDate(gregorianDate);
}

function toJDN(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function toEthiopianDate(jdn) {
    const r = (jdn - JD_OFFSET) % 1461;
    const n = (r % 365) + 365 * Math.floor(r / 1460);
    const year = 4 * Math.floor((jdn - JD_OFFSET) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
    const month = Math.floor(n / 30) + 1;
    const day = (n % 30) + 1;
    return { year: year, month: month, day: day };
}

function gregorianToEthiopian(year, month, day) {
    const jdn = toJDN(year, month, day);
    return formatEthiopianDate(toEthiopianDate(jdn));
}

function formatEthiopianDate(date) {
    return `${date.day}/${String(date.month).padStart(2, '0')}/${String(date.year).padStart(2, '0')}`;
}





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
    date_of_joining: function (frm) {
        // Convert Ethiopian date to Gregorian when form loads
        if (frm.doc.date_of_joining) {
            const [gcDay,gcMonth,gcYear] = frm.doc.date_of_joining.split('-').map(Number);
            // const gregorianDate = new Date(gcYear,gcMonth,gcDay);
            // Example usage
           const gregorianDate = ethiopianToGregorian(gcDay,gcMonth,gcYear);
        
            const ethiopianDate = gregorianToEthiopian(gcDay,gcMonth,gcYear);
            frm.set_value("date_of_joining_ec", ethiopianDate);
        }
    },


    date_of_joining_ec: function (frm) {
        // Convert Gregorian date to Ethiopian when form refreshes
        let str = frm.doc.date_of_joining_ec; // Replace with your string

        if (str.length === 10) {
            const [ethiopianDay,ethiopianMonth,ethiopianYear] = frm.doc.date_of_joining_ec.split('/').map(Number);

            const ethiopian_year1 = ethiopianYear;
            const ethiopian_month1 = ethiopianMonth;
            const ethiopian_day1 = ethiopianDay;
            //console.log(ethiopian_year1, ethiopian_month1, ethiopian_day1);
            const gregorian_date = ethiopianToGregorian(ethiopian_year1, ethiopian_month1, ethiopian_day1);
            frm.set_value("date_of_joining", gregorian_date);
        } 
       
        
           
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
        
        
    },
   
        refresh: function(frm) {
            // Add a button to the form to fetch employee data
            frm.add_custom_button(__('Fetch Employee Data'), function() {
                // Call the server-side method
                frappe.call({
                    method: 'glhrm.glhrm.doctype.probation.prob.fetch_employee_data2',
                    callback: function(r) {
                        if (r.message) {
                            // Print the fetched employee data
                            console.log(r.message);
                            frappe.msgprint(r.message);
                        }
                    }
                });
            });
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



