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

    date_of_joining: function (frm) {
        // Convert Ethiopian date to Gregorian when form loads
        if (frm.doc.date_of_joining) {
            const [gcDay,gcMonth,gcYear] = frm.doc.date_of_joining.split('-').map(Number);
            // const gregorianDate = new Date(gcYear,gcMonth,gcDay);
          
            const ethiopianDate = EthiopianDateConverter.gregorianToEthiopian(gcDay,gcMonth,gcYear);
            console.log(ethiopianDate)
            frm.set_value("date_of_joining_ec", ethiopianDate);
        }
    },




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

    









    class EthiopianDateConverter {
        static JD_OFFSET = 1723856;
    
    
        static ethiopianToGregorian(ethiopianYear, ethiopianMonth, ethiopianDay) {
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
          }
    
    
    
    
        // Convert Gregorian date to Ethiopian date
        static gregorianToEthiopian(year, month, day) {
            const jdn = this.toJDN(year, month, day);
            return this.formatEthiopianDate(this.toEthiopianDate(jdn));
        }
    
        // Convert Ethiopian date to Gregorian date
        static ethiopianToGregorian2(ethiopianYear, ethiopianMonth, ethiopianDay) {
            this.validate(ethiopianYear, ethiopianMonth, ethiopianDay);
            const jdn = this.fromEthiopianDateToJDN(ethiopianYear, ethiopianMonth, ethiopianDay);
            const gregorianDate = this.toGregorianDate(jdn);
            return this.formatGregorianDate(gregorianDate);
        }
    
        // Convert Gregorian date to Julian Day Number
        static toJDN(year, month, day) {
            const a = Math.floor((14 - month) / 12);
            const y = year + 4800 - a;
            const m = month + 12 * a - 3;
            return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        }
    
        // Convert Julian Day Number to Ethiopian date
        static toEthiopianDate(jdn) {
            const r = (jdn - this.JD_OFFSET) % 1461;
            const n = (r % 365) + 365 * Math.floor(r / 1460);
            const year = 4 * Math.floor((jdn - this.JD_OFFSET) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
            const month = Math.floor(n / 30) + 1;
            const day = (n % 30) + 1;
            return { year: year, month: month, day: day };
        }
    
        // Convert Julian Day Number to Gregorian date
        static toGregorianDate(jdn) {
            let r = jdn + 68569;
            let n = Math.floor(4 * r / 146097);
            r = r - Math.floor((146097 * n + 3) / 4);
            const year = Math.floor(4000 * (r + 1) / 1461001);
            r = r - Math.floor(1461 * year / 4) + 31;
            const month = Math.floor(80 * r / 2447);
            const day = r - Math.floor(2447 * month / 80);
            r = Math.floor(month / 11);
            const gregMonth = month + 2 - 12 * r;
            const gregYear = 100 * (n - 49) + year + r;
            return new Date(gregYear, gregMonth - 1, day); // month is 0-indexed in JavaScript Date
        }
    
        // Convert Ethiopian date to Julian Day Number
        static fromEthiopianDateToJDN(year, month, day) {
            return this.JD_OFFSET + 365 * (year - 1) + Math.floor((year - 1) / 4) + 30 * month + day - 31;
        }
    
        // Validate Ethiopian date
        static validate(year, month, day) {
            if (month < 1 || month > 13 || (month === 13 && year % 4 === 3 && day > 6) || (month === 13 && year % 4 !== 3 && day > 5) || day < 1 || day > 30) {
                throw new Error("Year, Month, and Day parameters describe an un-representable EthiopianDateTime.");
            }
        }
    
        // Format Ethiopian date as YYYY-MM-DD
        static formatEthiopianDate(date) {
            return `${date.day}/${String(date.month).padStart(2, '0')}/${String(date.year).padStart(2, '0')}`;
        }
    
        // Format Gregorian date as YYYY-MM-DD
        static formatGregorianDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    }


}